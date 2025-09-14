import { Worker } from 'bullmq';
import { 
  publishToTikTok, 
  publishToMeta, 
  publishToYouTube,
  processScheduledPublishes
} from '../lib/publishing.js';
import pino from 'pino';

const logger = pino({ name: 'publish-worker' });

// =========================
// WORKER CONFIGURATION
// =========================

const concurrency = parseInt(process.env.PUBLISH_CONCURRENCY || '2');

const worker = new Worker('veo:publish', async (job) => {
  const { publishJobId, provider } = job.data;
  
  logger.info({ publishJobId, provider }, 'Processing publish job');

  try {
    // Route to appropriate publisher based on provider
    switch (provider) {
      case 'tiktok':
        await publishToTikTok(publishJobId);
        break;
      case 'meta':
        await publishToMeta(publishJobId);
        break;
      case 'youtube':
        await publishToYouTube(publishJobId);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    logger.info({ publishJobId, provider }, 'Publish job completed successfully');
    return { success: true, provider };

  } catch (error) {
    logger.error({ publishJobId, provider, error: error.message }, 'Publish job failed');
    throw error;
  }
}, {
  connection: { url: process.env.REDIS_URL! },
  concurrency,
  removeOnComplete: 100,
  removeOnFail: 50,
});

// =========================
// SCHEDULER WORKER
// =========================

const schedulerWorker = new Worker('veo:scheduler', async (job) => {
  logger.info('Processing scheduled publishes');
  
  try {
    await processScheduledPublishes();
    logger.info('Scheduled publishes processed successfully');
    return { success: true };
  } catch (error) {
    logger.error({ error: error.message }, 'Scheduled publishes processing failed');
    throw error;
  }
}, {
  connection: { url: process.env.REDIS_URL! },
  concurrency: 1,
  removeOnComplete: 100,
  removeOnFail: 50,
});

// =========================
// WORKER EVENT HANDLERS
// =========================

worker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Publish job completed');
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job.id, error: err.message }, 'Publish job failed');
});

worker.on('stalled', (job) => {
  logger.warn({ jobId: job.id }, 'Publish job stalled');
});

schedulerWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Scheduler job completed');
});

schedulerWorker.on('failed', (job, err) => {
  logger.error({ jobId: job.id, error: err.message }, 'Scheduler job failed');
});

// =========================
// GRACEFUL SHUTDOWN
// =========================

process.on('SIGINT', async () => {
  logger.info('Shutting down publish workers...');
  await Promise.all([worker.close(), schedulerWorker.close()]);
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down publish workers...');
  await Promise.all([worker.close(), schedulerWorker.close()]);
  process.exit(0);
});

logger.info({ concurrency }, 'Publish workers started');

export { worker, schedulerWorker };

