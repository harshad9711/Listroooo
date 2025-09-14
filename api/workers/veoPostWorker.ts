import { Worker } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';
import { generateHLS } from '../server/delivery/hls.js';
import { analyzeVideoQuality } from '../server/quality/score.js';
import pino from 'pino';

const logger = pino({ name: 'veo-post-worker' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// WORKER CONFIGURATION
// =========================

const concurrency = parseInt(process.env.RENDERS_CONCURRENCY || '2');

const worker = new Worker('veo:post', async (job) => {
  const { jobId, organizationId, userId, videoUrl, priority = 0 } = job.data;
  
  logger.info({ jobId, organizationId, userId }, 'Processing post job');

  try {
    // Check if job still exists and is in completed state (exactly-once semantics)
    const { data: existingJob, error: jobError } = await supabase
      .from('veo_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('status', 'completed')
      .single();

    if (jobError || !existingJob) {
      logger.warn({ jobId }, 'Job not found or not in completed state, skipping');
      return { skipped: true, reason: 'Job not found or not completed' };
    }

    // Update progress
    await supabase
      .from('veo_jobs')
      .update({ progress: 60 })
      .eq('id', jobId);

    // 1. Generate thumbnail
    const thumbnailUrl = await generateThumbnail(videoUrl, jobId);
    
    // Update progress
    await supabase
      .from('veo_jobs')
      .update({ progress: 70 })
      .eq('id', jobId);

    // 2. Generate captions (if requested)
    let captionsUrl: string | null = null;
    if (existingJob.config?.generateCaptions) {
      captionsUrl = await generateCaptions(videoUrl, jobId);
    }

    // Update progress
    await supabase
      .from('veo_jobs')
      .update({ progress: 80 })
      .eq('id', jobId);

    // 3. Upload to CDN storage
    const cdnVideoUrl = await uploadToCDN(videoUrl, organizationId, jobId, 'video');
    const cdnThumbnailUrl = await uploadToCDN(thumbnailUrl, organizationId, jobId, 'thumbnail');
    const cdnCaptionsUrl = captionsUrl ? await uploadToCDN(captionsUrl, organizationId, jobId, 'captions') : null;

    // Update progress
    await supabase
      .from('veo_jobs')
      .update({ progress: 90 })
      .eq('id', jobId);

    // 4. Generate HLS streams
    let hlsResult = null;
    try {
      logger.info({ jobId }, 'Generating HLS streams');
      hlsResult = await generateHLS(jobId, organizationId, videoUrl);
      
      logger.info({ jobId }, 'HLS generation completed');
    } catch (hlsError) {
      logger.error({ jobId, error: hlsError.message }, 'HLS generation failed');
      // Continue without HLS - not critical
    }

    // 5. Analyze video quality
    let qualityAnalysis = null;
    try {
      logger.info({ jobId }, 'Analyzing video quality');
      const prompt = existingJob.json_prompt;
      qualityAnalysis = await analyzeVideoQuality(jobId, videoUrl, prompt);
      
      logger.info({ jobId, score: qualityAnalysis.score.overall }, 'Quality analysis completed');
    } catch (qualityError) {
      logger.error({ jobId, error: qualityError.message }, 'Quality analysis failed');
      // Continue without quality analysis - not critical
    }

    // 6. Create shareable token
    const shareableToken = generateShareableToken();

    // 5. Finalize job with all results
    const finalResult = {
      ...existingJob.result,
      video_url: cdnVideoUrl,
      thumbnail_url: cdnThumbnailUrl,
      captions_url: cdnCaptionsUrl,
      shareable_token: shareableToken,
      status: 'ready',
      post_processed_at: new Date().toISOString()
    };

    const updateData: any = {
      status: 'completed',
      progress: 100,
      result: finalResult,
      thumbnail_url: cdnThumbnailUrl,
      shareable_token: shareableToken,
      captions_burned_in: !!captionsUrl,
      completed_at: new Date().toISOString()
    };

    // Add HLS data if available
    if (hlsResult) {
      updateData.hls_master_url = hlsResult.masterUrl;
      updateData.sprites_image_url = hlsResult.sprites.imageUrl;
      updateData.sprites_vtt_url = hlsResult.sprites.vttUrl;
    }

    // Add quality data if available
    if (qualityAnalysis) {
      updateData.quality_score = qualityAnalysis.score.overall;
      updateData.quality_detail = qualityAnalysis.score.details;
    }

    await supabase
      .from('veo_jobs')
      .update(updateData)
      .eq('id', jobId);

    // 6. Track usage for billing
    await trackUsage(organizationId, userId, jobId, 'render');

    // 7. Trigger webhook delivery
    const { veoPostQ } = await import('../queues/veo');
    await veoPostQ.add('webhook_delivery', {
      organizationId,
      eventType: 'veo.job.completed',
      data: {
        job_id: jobId,
        organization_id: organizationId,
        user_id: userId,
        video_url: cdnVideoUrl,
        thumbnail_url: cdnThumbnailUrl,
        shareable_token: shareableToken,
        completed_at: new Date().toISOString()
      }
    });

    logger.info({ jobId, shareableToken }, 'Post job completed');

    return {
      success: true,
      videoUrl: cdnVideoUrl,
      thumbnailUrl: cdnThumbnailUrl,
      captionsUrl: cdnCaptionsUrl,
      shareableToken
    };

  } catch (error) {
    logger.error({ jobId, error: error.message }, 'Post job failed');

    // Update job status to failed
    await supabase
      .from('veo_jobs')
      .update({
        status: 'failed',
        error_message: error.message,
        failed_at: new Date().toISOString()
      })
      .eq('id', jobId);

    throw error;
  }
}, {
  connection: { url: process.env.REDIS_URL! },
  concurrency,
  removeOnComplete: 100,
  removeOnFail: 50,
});

// =========================
// HELPER FUNCTIONS
// =========================

async function generateThumbnail(videoUrl: string, jobId: string): Promise<string> {
  // In a real implementation, this would use FFmpeg to extract a thumbnail
  // For now, we'll simulate with a placeholder
  
  logger.info({ jobId }, 'Generating thumbnail');
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return a simulated thumbnail URL
  return `https://cdn.example.com/thumbnails/${jobId}.jpg`;
}

async function generateCaptions(videoUrl: string, jobId: string): Promise<string> {
  // In a real implementation, this would use speech-to-text services
  // For now, we'll simulate with a placeholder
  
  logger.info({ jobId }, 'Generating captions');
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Return a simulated captions URL
  return `https://cdn.example.com/captions/${jobId}.vtt`;
}

async function uploadToCDN(fileUrl: string, organizationId: string, jobId: string, type: string): Promise<string> {
  // In a real implementation, this would upload to S3/CloudFront
  // For now, we'll simulate with a CDN URL
  
  logger.info({ jobId, type }, 'Uploading to CDN');
  
  // Simulate upload time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return a simulated CDN URL
  return `https://cdn.example.com/${organizationId}/${type}/${jobId}.${type === 'video' ? 'mp4' : type === 'thumbnail' ? 'jpg' : 'vtt'}`;
}

function generateShareableToken(): string {
  return `veo_${randomBytes(16).toString('hex')}`;
}

async function trackUsage(organizationId: string, userId: string, jobId: string, resourceType: string) {
  // Track usage for billing
  const { data, error } = await supabase
    .from('veo_usage_records')
    .insert({
      organization_id: organizationId,
      user_id: userId,
      job_id: jobId,
      resource_type: resourceType,
      quantity: 1,
      unit_price_cents: parseInt(process.env.STRIPE_PRICE_RENDER || '25'), // 25 cents per render
      total_cents: parseInt(process.env.STRIPE_PRICE_RENDER || '25'),
      period_start: new Date(),
      period_end: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

  if (error) {
    logger.error({ error: error.message }, 'Failed to track usage');
  }
}


// =========================
// WORKER EVENT HANDLERS
// =========================

worker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Post job completed');
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job.id, error: err.message }, 'Post job failed');
});

worker.on('stalled', (job) => {
  logger.warn({ jobId: job.id }, 'Post job stalled');
});

worker.on('progress', (job, progress) => {
  logger.debug({ jobId: job.id, progress }, 'Post job progress updated');
});

// =========================
// GRACEFUL SHUTDOWN
// =========================

process.on('SIGINT', async () => {
  logger.info('Shutting down post worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down post worker...');
  await worker.close();
  process.exit(0);
});

logger.info({ concurrency }, 'Veo post worker started');

export default worker;
