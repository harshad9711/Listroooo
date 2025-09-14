import { Queue, QueueEvents } from 'bullmq';
import pino from 'pino';

const logger = pino({ name: 'veo-queues' });

// =========================
// QUEUE DEFINITIONS
// =========================

// Video generation start queue
export const veoStartQ = new Queue("veo:start", { 
  connection: { url: process.env.REDIS_URL! },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Video polling queue
export const veoPollQ = new Queue("veo:poll", { 
  connection: { url: process.env.REDIS_URL! },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Video post-processing queue
export const veoPostQ = new Queue("veo:post", { 
  connection: { url: process.env.REDIS_URL! },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// =========================
// QUEUE EVENTS
// =========================

const startEvents = new QueueEvents('veo:start', { connection: { url: process.env.REDIS_URL! } });
const pollEvents = new QueueEvents('veo:poll', { connection: { url: process.env.REDIS_URL! } });
const postEvents = new QueueEvents('veo:post', { connection: { url: process.env.REDIS_URL! } });

// =========================
// JOB TYPES
// =========================

export const JOB_TYPES = {
  START: 'start',
  POLL: 'poll',
  POST: 'post',
};

// =========================
// QUEUE HELPERS
// =========================

export class VeoQueueManager {
  constructor() {
    this.queues = {
      start: veoStartQ,
      poll: veoPollQ,
      post: veoPostQ,
    };
  }

  // Add job to start queue
  async addStartJob(data, options = {}) {
    const job = await veoStartQ.add(JOB_TYPES.START, data, {
      priority: data.priority || 0,
      ...options,
    });
    
    logger.info({ jobId: job.id, type: 'start' }, 'Job added to start queue');
    return job;
  }

  // Add job to poll queue
  async addPollJob(data, options = {}) {
    const job = await veoPollQ.add(JOB_TYPES.POLL, data, {
      delay: data.delay || 5000, // 5 second delay by default
      ...options,
    });
    
    logger.info({ jobId: job.id, type: 'poll' }, 'Job added to poll queue');
    return job;
  }

  // Add job to post queue
  async addPostJob(data, options = {}) {
    const job = await veoPostQ.add(JOB_TYPES.POST, data, {
      priority: data.priority || 0,
      ...options,
    });
    
    logger.info({ jobId: job.id, type: 'post' }, 'Job added to post queue');
    return job;
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

  // Close all queues
  async close() {
    await Promise.all([
      veoStartQ.close(),
      veoPollQ.close(),
      veoPostQ.close()
    ]);
    logger.info('All queues closed');
  }
}

// =========================
// EVENT LISTENERS
// =========================

// Set up event listeners for monitoring
Object.entries({ start: startEvents, poll: pollEvents, post: postEvents }).forEach(([queueName, events]) => {
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

export const queueManager = new VeoQueueManager();

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
