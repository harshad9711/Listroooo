import { Queue, Worker, QueueEvents } from 'bullmq';
import { createClient } from 'redis';
import { nanoid } from 'nanoid';
import pino from 'pino';

const logger = pino({ name: 'queue' });

// Redis connection
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0')
});

await redis.connect();

// Queue configurations
const queueConfig = {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

// =========================
// QUEUE DEFINITIONS
// =========================

// Video generation queue
export const videoGenerationQueue = new Queue('video-generation', queueConfig);

// Webhook delivery queue
export const webhookQueue = new Queue('webhook-delivery', queueConfig);

// Billing queue
export const billingQueue = new Queue('billing', queueConfig);

// CDN cleanup queue
export const cdnCleanupQueue = new Queue('cdn-cleanup', queueConfig);

// Email notifications queue
export const emailQueue = new Queue('email-notifications', queueConfig);

// Analytics processing queue
export const analyticsQueue = new Queue('analytics-processing', queueConfig);

// =========================
// JOB TYPES
// =========================

export const JOB_TYPES = {
  // Video generation
  GENERATE_VIDEO: 'generate-video',
  PROCESS_VARIATION_BATCH: 'process-variation-batch',
  GENERATE_THUMBNAIL: 'generate-thumbnail',
  BURN_CAPTIONS: 'burn-captions',
  
  // Webhooks
  DELIVER_WEBHOOK: 'deliver-webhook',
  RETRY_WEBHOOK: 'retry-webhook',
  
  // Billing
  PROCESS_USAGE: 'process-usage',
  CREATE_INVOICE: 'create-invoice',
  SYNC_STRIPE: 'sync-stripe',
  
  // CDN
  UPLOAD_TO_CDN: 'upload-to-cdn',
  CLEANUP_EXPIRED_ASSETS: 'cleanup-expired-assets',
  GENERATE_SIGNED_URL: 'generate-signed-url',
  
  // Notifications
  SEND_EMAIL: 'send-email',
  SEND_SLACK_NOTIFICATION: 'send-slack-notification',
  
  // Analytics
  PROCESS_ANALYTICS: 'process-analytics',
  GENERATE_REPORTS: 'generate-reports',
};

// =========================
// QUEUE EVENTS
// =========================

const queueEvents = {
  'video-generation': new QueueEvents('video-generation', { connection: redis }),
  'webhook-delivery': new QueueEvents('webhook-delivery', { connection: redis }),
  'billing': new QueueEvents('billing', { connection: redis }),
  'cdn-cleanup': new QueueEvents('cdn-cleanup', { connection: redis }),
  'email-notifications': new QueueEvents('email-notifications', { connection: redis }),
  'analytics-processing': new QueueEvents('analytics-processing', { connection: redis }),
};

// =========================
// JOB HELPERS
// =========================

export class QueueManager {
  constructor() {
    this.queues = {
      videoGeneration: videoGenerationQueue,
      webhook: webhookQueue,
      billing: billingQueue,
      cdnCleanup: cdnCleanupQueue,
      email: emailQueue,
      analytics: analyticsQueue,
    };
  }

  // Add job to queue
  async addJob(queueName, jobType, data, options = {}) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const jobId = nanoid();
    const job = await queue.add(jobType, {
      id: jobId,
      ...data,
    }, {
      jobId,
      ...options,
    });

    logger.info({ queueName, jobType, jobId }, 'Job added to queue');
    return job;
  }

  // Add delayed job
  async addDelayedJob(queueName, jobType, data, delayMs, options = {}) {
    return this.addJob(queueName, jobType, data, {
      delay: delayMs,
      ...options,
    });
  }

  // Add recurring job
  async addRecurringJob(queueName, jobType, data, cronPattern, options = {}) {
    return this.addJob(queueName, jobType, data, {
      repeat: { pattern: cronPattern },
      ...options,
    });
  }

  // Get job status
  async getJobStatus(queueName, jobId) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      type: job.name,
      data: job.data,
      progress: job.progress,
      state: await job.getState(),
      createdAt: new Date(job.timestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : null,
      completedAt: job.finishedOn ? new Date(job.finishedOn) : null,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      attemptsLimit: job.opts.attempts,
    };
  }

  // Cancel job
  async cancelJob(queueName, jobId) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (job) {
      await job.remove();
      logger.info({ queueName, jobId }, 'Job cancelled');
      return true;
    }
    return false;
  }

  // Get queue stats
  async getQueueStats(queueName) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  // Clean queue
  async cleanQueue(queueName, grace = 5000) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.clean(grace, 100, 'completed');
    await queue.clean(grace, 100, 'failed');
    logger.info({ queueName }, 'Queue cleaned');
  }

  // Pause queue
  async pauseQueue(queueName) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.pause();
    logger.info({ queueName }, 'Queue paused');
  }

  // Resume queue
  async resumeQueue(queueName) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();
    logger.info({ queueName }, 'Queue resumed');
  }

  // Close all queues
  async close() {
    await Promise.all(Object.values(this.queues).map(queue => queue.close()));
    await redis.quit();
    logger.info('All queues closed');
  }
}

// =========================
// EVENT LISTENERS
// =========================

// Set up event listeners for monitoring
Object.entries(queueEvents).forEach(([queueName, events]) => {
  events.on('completed', ({ jobId, returnvalue }) => {
    logger.info({ queueName, jobId }, 'Job completed');
  });

  events.on('failed', ({ jobId, failedReason }) => {
    logger.error({ queueName, jobId, failedReason }, 'Job failed');
  });

  events.on('stalled', ({ jobId }) => {
    logger.warn({ queueName, jobId }, 'Job stalled');
  });

  events.on('progress', ({ jobId, data }) => {
    logger.debug({ queueName, jobId, progress: data }, 'Job progress updated');
  });
});

// =========================
// EXPORTS
// =========================

export const queueManager = new QueueManager();

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down queues...');
  await queueManager.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down queues...');
  await queueManager.close();
  process.exit(0);
});

