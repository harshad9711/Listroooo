import { Worker } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pino from 'pino';

const logger = pino({ name: 'veo-start-worker' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// =========================
// WORKER CONFIGURATION
// =========================

const concurrency = parseInt(process.env.RENDERS_CONCURRENCY || '2');

const worker = new Worker('veo:start', async (job) => {
  const { jobId, organizationId, userId, prompt, config, priority = 0 } = job.data;
  
  logger.info({ jobId, organizationId, userId }, 'Processing start job');

  try {
    // Check if job still exists and is in pending state (exactly-once semantics)
    const { data: existingJob, error: jobError } = await supabase
      .from('veo_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('status', 'pending')
      .single();

    if (jobError || !existingJob) {
      logger.warn({ jobId }, 'Job not found or not in pending state, skipping');
      return { skipped: true, reason: 'Job not found or not pending' };
    }

    // Update job status to processing
    await supabase
      .from('veo_jobs')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString(),
        progress: 10
      })
      .eq('id', jobId);

    // Generate video using Gemini Veo
    const model = genAI.getGenerativeModel({ model: process.env.VEO_MODEL_ID || 'veo-3.0-generate-001' });
    
    const generationConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    };

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: JSON.stringify(prompt) }] }],
      generationConfig,
    });

    const response = await result.response;
    const videoData = response.text();

    // Parse the response to get video URL or job ID
    let videoUrl: string;
    let externalJobId: string;

    try {
      const parsed = JSON.parse(videoData);
      videoUrl = parsed.video_url;
      externalJobId = parsed.job_id || parsed.id;
    } catch (parseError) {
      // If not JSON, assume it's a direct video URL
      videoUrl = videoData;
      externalJobId = `ext_${Date.now()}`;
    }

    // Update job with initial result
    await supabase
      .from('veo_jobs')
      .update({
        progress: 50,
        result: {
          external_job_id: externalJobId,
          video_url: videoUrl,
          status: 'generating'
        },
        metadata: {
          ...existingJob.metadata,
          external_job_id: externalJobId,
          generation_started_at: new Date().toISOString()
        }
      })
      .eq('id', jobId);

    // Queue polling job
    const { veoPollQ } = await import('../queues/veo');
    await veoPollQ.add('poll', {
      jobId,
      organizationId,
      userId,
      externalJobId,
      videoUrl,
      pollCount: 0,
      maxPolls: 60 // Poll for up to 5 minutes (60 * 5 seconds)
    }, {
      delay: 5000 // 5 second delay
    });

    logger.info({ jobId, externalJobId }, 'Start job completed, polling queued');

    return {
      success: true,
      externalJobId,
      videoUrl,
      nextStep: 'polling'
    };

  } catch (error) {
    logger.error({ jobId, error: error.message }, 'Start job failed');

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
// WORKER EVENT HANDLERS
// =========================

worker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Start job completed');
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job.id, error: err.message }, 'Start job failed');
});

worker.on('stalled', (job) => {
  logger.warn({ jobId: job.id }, 'Start job stalled');
});

worker.on('progress', (job, progress) => {
  logger.debug({ jobId: job.id, progress }, 'Start job progress updated');
});

// =========================
// GRACEFUL SHUTDOWN
// =========================

process.on('SIGINT', async () => {
  logger.info('Shutting down start worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down start worker...');
  await worker.close();
  process.exit(0);
});

logger.info({ concurrency }, 'Veo start worker started');

export default worker;
