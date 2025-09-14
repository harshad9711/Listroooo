/**
 * Queue Hardening Service
 * Handles backpressure, dead letter queues, and replay functionality
 */

import { Queue, QueueEvents, Worker } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import pino from 'pino';

const logger = pino({ name: 'queue-hardening' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// TYPES
// =========================

export interface QueueStats {
  name: string;
  active: number;
  waiting: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
  dlq: number;
}

export interface ReplayRequest {
  queue: string;
  limit: number;
  reason?: string;
}

export interface QueueHealth {
  timestamp: string;
  queues: QueueStats[];
  overall: {
    totalActive: number;
    totalWaiting: number;
    totalFailed: number;
    totalDlq: number;
  };
}

// =========================
// QUEUE CONFIGURATION
// =========================

const QUEUE_CONFIG = {
  concurrency: parseInt(process.env.RENDERS_CONCURRENCY || '2'),
  limiter: {
    max: 10, // Max 10 jobs per duration
    duration: 60000 // 1 minute
  },
  removeOnComplete: 100,
  removeOnFail: 50,
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000
  }
};

// =========================
// QUEUE SETUP WITH HARDENING
// =========================

export function createHardenedQueue(name: string, processor?: any): Queue {
  const queue = new Queue(name, {
    connection: { url: process.env.REDIS_URL! },
    defaultJobOptions: {
      removeOnComplete: QUEUE_CONFIG.removeOnComplete,
      removeOnFail: QUEUE_CONFIG.removeOnFail,
      attempts: QUEUE_CONFIG.attempts,
      backoff: QUEUE_CONFIG.backoff
    }
  });

  // Add rate limiting
  queue.add = (async (name: string, data: any, options: any = {}) => {
    // Check rate limit
    const isRateLimited = await checkRateLimit(name);
    if (isRateLimited) {
      throw new Error('Rate limit exceeded');
    }

    return queue.add(name, data, {
      ...options,
      delay: options.delay || 0
    });
  }) as any;

  return queue;
}

export function createHardenedWorker(
  name: string,
  processor: any,
  options: any = {}
): Worker {
  const worker = new Worker(name, processor, {
    connection: { url: process.env.REDIS_URL! },
    concurrency: QUEUE_CONFIG.concurrency,
    limiter: QUEUE_CONFIG.limiter,
    ...options
  });

  // Add error handling
  worker.on('failed', async (job, err) => {
    logger.error({ 
      jobId: job?.id, 
      queue: name, 
      error: err.message 
    }, 'Job failed');

    // Move to DLQ after max attempts
    if (job?.attemptsMade >= QUEUE_CONFIG.attempts) {
      await moveToDLQ(name, job, err);
    }
  });

  // Add stalled job handling
  worker.on('stalled', (jobId) => {
    logger.warn({ jobId, queue: name }, 'Job stalled');
  });

  return worker;
}

// =========================
// DEAD LETTER QUEUE MANAGEMENT
// =========================

export async function moveToDLQ(queueName: string, job: any, error: any): Promise<void> {
  try {
    const dlqName = `${queueName}:dlq`;
    const dlq = new Queue(dlqName, {
      connection: { url: process.env.REDIS_URL! }
    });

    await dlq.add('dlq-job', {
      originalQueue: queueName,
      originalJob: {
        id: job.id,
        name: job.name,
        data: job.data,
        opts: job.opts
      },
      error: {
        message: error.message,
        stack: error.stack
      },
      failedAt: new Date().toISOString(),
      attemptsMade: job.attemptsMade
    });

    logger.info({ 
      jobId: job.id, 
      queue: queueName, 
      dlq: dlqName 
    }, 'Job moved to DLQ');

  } catch (error) {
    logger.error({ 
      error: error.message, 
      queue: queueName, 
      jobId: job?.id 
    }, 'Failed to move job to DLQ');
  }
}

export async function replayFromDLQ(request: ReplayRequest): Promise<{
  success: boolean;
  replayed: number;
  error?: string;
}> {
  try {
    const dlqName = `${request.queue}:dlq`;
    const dlq = new Queue(dlqName, {
      connection: { url: process.env.REDIS_URL! }
    });

    const mainQueue = new Queue(request.queue, {
      connection: { url: process.env.REDIS_URL! }
    });

    // Get jobs from DLQ
    const jobs = await dlq.getJobs(['waiting'], 0, request.limit);
    let replayed = 0;

    for (const job of jobs) {
      try {
        const originalJob = job.data.originalJob;
        
        // Add back to main queue with backoff
        await mainQueue.add(originalJob.name, originalJob.data, {
          ...originalJob.opts,
          delay: Math.pow(2, replayed) * 1000, // Exponential backoff
          attempts: 1 // Reset attempts
        });

        // Remove from DLQ
        await job.remove();
        replayed++;

        logger.info({ 
          jobId: job.id, 
          queue: request.queue,
          reason: request.reason 
        }, 'Job replayed from DLQ');

      } catch (error) {
        logger.error({ 
          error: error.message, 
          jobId: job.id 
        }, 'Failed to replay job from DLQ');
      }
    }

    return {
      success: true,
      replayed
    };

  } catch (error) {
    logger.error({ error: error.message, request }, 'Failed to replay from DLQ');
    return {
      success: false,
      replayed: 0,
      error: error.message
    };
  }
}

// =========================
// RATE LIMITING
// =========================

async function checkRateLimit(queueName: string): Promise<boolean> {
  try {
    const key = `rate_limit:${queueName}`;
    const redis = (await import('ioredis')).default;
    const client = new redis(process.env.REDIS_URL!);

    const current = await client.incr(key);
    if (current === 1) {
      await client.expire(key, QUEUE_CONFIG.limiter.duration / 1000);
    }

    const isLimited = current > QUEUE_CONFIG.limiter.max;
    
    if (isLimited) {
      logger.warn({ queue: queueName, current, limit: QUEUE_CONFIG.limiter.max }, 'Rate limit exceeded');
    }

    return isLimited;

  } catch (error) {
    logger.error({ error: error.message, queue: queueName }, 'Rate limit check failed');
    return false; // Allow on error
  }
}

// =========================
// QUEUE STATISTICS
// =========================

export async function getQueueStats(): Promise<QueueStats[]> {
  try {
    const queueNames = ['veo:start', 'veo:poll', 'veo:post'];
    const stats: QueueStats[] = [];

    for (const queueName of queueNames) {
      const queue = new Queue(queueName, {
        connection: { url: process.env.REDIS_URL! }
      });

      const waiting = await queue.getWaiting();
      const active = await queue.getActive();
      const completed = await queue.getCompleted();
      const failed = await queue.getFailed();
      const delayed = await queue.getDelayed();
      const isPaused = await queue.isPaused();

      // Get DLQ stats
      const dlqName = `${queueName}:dlq`;
      const dlq = new Queue(dlqName, {
        connection: { url: process.env.REDIS_URL! }
      });
      const dlqJobs = await dlq.getWaiting();

      stats.push({
        name: queueName,
        active: active.length,
        waiting: waiting.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        paused: isPaused,
        dlq: dlqJobs.length
      });
    }

    return stats;

  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get queue stats');
    return [];
  }
}

export async function getQueueHealth(): Promise<QueueHealth> {
  try {
    const stats = await getQueueStats();
    
    const overall = {
      totalActive: stats.reduce((sum, q) => sum + q.active, 0),
      totalWaiting: stats.reduce((sum, q) => sum + q.waiting, 0),
      totalFailed: stats.reduce((sum, q) => sum + q.failed, 0),
      totalDlq: stats.reduce((sum, q) => sum + q.dlq, 0)
    };

    return {
      timestamp: new Date().toISOString(),
      queues: stats,
      overall
    };

  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get queue health');
    return {
      timestamp: new Date().toISOString(),
      queues: [],
      overall: {
        totalActive: 0,
        totalWaiting: 0,
        totalFailed: 0,
        totalDlq: 0
      }
    };
  }
}

// =========================
// QUEUE MANAGEMENT
// =========================

export async function pauseQueue(queueName: string): Promise<boolean> {
  try {
    const queue = new Queue(queueName, {
      connection: { url: process.env.REDIS_URL! }
    });

    await queue.pause();
    logger.info({ queue: queueName }, 'Queue paused');
    return true;

  } catch (error) {
    logger.error({ error: error.message, queue: queueName }, 'Failed to pause queue');
    return false;
  }
}

export async function resumeQueue(queueName: string): Promise<boolean> {
  try {
    const queue = new Queue(queueName, {
      connection: { url: process.env.REDIS_URL! }
    });

    await queue.resume();
    logger.info({ queue: queueName }, 'Queue resumed');
    return true;

  } catch (error) {
    logger.error({ error: error.message, queue: queueName }, 'Failed to resume queue');
    return false;
  }
}

export async function clearQueue(queueName: string, jobState: string = 'waiting'): Promise<number> {
  try {
    const queue = new Queue(queueName, {
      connection: { url: process.env.REDIS_URL! }
    });

    const jobs = await queue.getJobs([jobState]);
    const count = jobs.length;

    for (const job of jobs) {
      await job.remove();
    }

    logger.info({ queue: queueName, state: jobState, count }, 'Queue cleared');
    return count;

  } catch (error) {
    logger.error({ error: error.message, queue: queueName }, 'Failed to clear queue');
    return 0;
  }
}

// =========================
// MONITORING
// =========================

export async function updateQueueStats(): Promise<void> {
  try {
    const health = await getQueueHealth();
    
    // Update database
    for (const queue of health.queues) {
      await supabase
        .from('queue_stats')
        .upsert({
          queue_name: queue.name,
          active_count: queue.active,
          waiting_count: queue.waiting,
          completed_count: queue.completed,
          failed_count: queue.failed,
          dlq_count: queue.dlq,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'queue_name'
        });
    }

  } catch (error) {
    logger.error({ error: error.message }, 'Failed to update queue stats');
  }
}

