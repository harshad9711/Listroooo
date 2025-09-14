import { Worker } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import pino from 'pino';

const logger = pino({ name: 'veo-poll-worker' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// WORKER CONFIGURATION
// =========================

const concurrency = parseInt(process.env.RENDERS_CONCURRENCY || '2');

const worker = new Worker('veo:poll', async (job) => {
  const { jobId, organizationId, userId, externalJobId, videoUrl, pollCount, maxPolls } = job.data;
  
  logger.info({ jobId, externalJobId, pollCount }, 'Processing poll job');

  try {
    // Check if job still exists and is in processing state (exactly-once semantics)
    const { data: existingJob, error: jobError } = await supabase
      .from('veo_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('status', 'processing')
      .single();

    if (jobError || !existingJob) {
      logger.warn({ jobId }, 'Job not found or not in processing state, skipping');
      return { skipped: true, reason: 'Job not found or not processing' };
    }

    // Check if we've exceeded max polls
    if (pollCount >= maxPolls) {
      logger.warn({ jobId, pollCount, maxPolls }, 'Max polls exceeded, marking as failed');
      
      await supabase
        .from('veo_jobs')
        .update({
          status: 'failed',
          error_message: 'Generation timeout - exceeded maximum polling attempts',
          failed_at: new Date().toISOString()
        })
        .eq('id', jobId);

      return { success: false, reason: 'timeout' };
    }

    // Simulate checking external service status
    // In a real implementation, you would call the actual Veo API
    const isComplete = await checkVideoGenerationStatus(externalJobId);
    
    if (isComplete) {
      // Video generation is complete
      const finalVideoUrl = await getFinalVideoUrl(externalJobId);
      
      // Update job with completion
      await supabase
        .from('veo_jobs')
        .update({
          status: 'completed',
          progress: 100,
          result: {
            ...existingJob.result,
            video_url: finalVideoUrl,
            status: 'completed',
            completed_at: new Date().toISOString()
          },
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);

      // Queue post-processing job
      const { veoPostQ } = await import('../queues/veo');
      await veoPostQ.add('post', {
        jobId,
        organizationId,
        userId,
        videoUrl: finalVideoUrl,
        priority: existingJob.priority || 0
      }, {
        priority: existingJob.priority || 0
      });

      logger.info({ jobId, externalJobId }, 'Poll job completed, post-processing queued');

      return {
        success: true,
        completed: true,
        videoUrl: finalVideoUrl,
        nextStep: 'post-processing'
      };
    } else {
      // Still processing, update progress and queue next poll
      const progress = Math.min(50 + (pollCount * 2), 95); // Gradually increase progress
      
      await supabase
        .from('veo_jobs')
        .update({
          progress,
          result: {
            ...existingJob.result,
            status: 'generating',
            progress
          }
        })
        .eq('id', jobId);

      // Queue next poll with exponential backoff
      const delay = Math.min(5000 * Math.pow(1.5, pollCount), 30000); // Max 30 seconds
      
      const { veoPollQ } = await import('../queues/veo');
      await veoPollQ.add('poll', {
        jobId,
        organizationId,
        userId,
        externalJobId,
        videoUrl,
        pollCount: pollCount + 1,
        maxPolls
      }, { delay });

      logger.info({ jobId, pollCount, delay }, 'Poll job queued for next check');

      return {
        success: true,
        completed: false,
        pollCount: pollCount + 1,
        nextCheckIn: delay
      };
    }

  } catch (error) {
    logger.error({ jobId, error: error.message }, 'Poll job failed');

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

async function checkVideoGenerationStatus(externalJobId: string): Promise<boolean> {
  // In a real implementation, this would call the actual Veo API
  // For now, we'll simulate with a random completion after a few polls
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate completion after 3-5 polls (for demo purposes)
  const random = Math.random();
  return random > 0.3; // 70% chance of completion
}

async function getFinalVideoUrl(externalJobId: string): Promise<string> {
  // In a real implementation, this would fetch the actual video URL from Veo API
  // For now, we'll return a simulated URL
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return `https://cdn.example.com/videos/${externalJobId}.mp4`;
}

// =========================
// WORKER EVENT HANDLERS
// =========================

worker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Poll job completed');
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job.id, error: err.message }, 'Poll job failed');
});

worker.on('stalled', (job) => {
  logger.warn({ jobId: job.id }, 'Poll job stalled');
});

worker.on('progress', (job, progress) => {
  logger.debug({ jobId: job.id, progress }, 'Poll job progress updated');
});

// =========================
// GRACEFUL SHUTDOWN
// =========================

process.on('SIGINT', async () => {
  logger.info('Shutting down poll worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down poll worker...');
  await worker.close();
  process.exit(0);
});

logger.info({ concurrency }, 'Veo poll worker started');

export default worker;
