/**
 * Dead Letter Queue Management
 * Handles DLQ operations, replay functionality, and queue analytics
 */

import { Queue } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import pino from 'pino';

const logger = pino({ name: 'dlq-management' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// TYPES
// =========================

export interface DLQJob {
  id: string;
  originalQueue: string;
  originalJob: {
    id: string;
    name: string;
    data: any;
    opts: any;
  };
  error: {
    message: string;
    stack: string;
  };
  failedAt: string;
  attemptsMade: number;
  reason?: string;
}

export interface ReplayRequest {
  queue: string;
  limit: number;
  reason?: string;
  backoff?: boolean;
}

export interface ReplayResult {
  success: boolean;
  replayed: number;
  failed: number;
  errors: string[];
}

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

// =========================
// DLQ OPERATIONS
// =========================

export async function moveToDLQ(
  queueName: string,
  job: any,
  error: any,
  reason?: string
): Promise<void> {
  try {
    const dlqName = `${queueName}:dlq`;
    const dlq = new Queue(dlqName, {
      connection: { url: process.env.REDIS_URL! }
    });

    const dlqJob = {
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
      attemptsMade: job.attemptsMade,
      reason
    };

    await dlq.add('dlq-job', dlqJob, {
      removeOnComplete: 100,
      removeOnFail: 50
    });

    logger.info({ 
      jobId: job.id, 
      queue: queueName, 
      dlq: dlqName,
      reason 
    }, 'Job moved to DLQ');

  } catch (error) {
    logger.error({ 
      error: error.message, 
      queue: queueName, 
      jobId: job?.id 
    }, 'Failed to move job to DLQ');
  }
}

export async function replayFromDLQ(request: ReplayRequest): Promise<ReplayResult> {
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
    let failed = 0;
    const errors: string[] = [];

    for (const job of jobs) {
      try {
        const originalJob = job.data.originalJob;
        
        // Calculate backoff delay if enabled
        let delay = 0;
        if (request.backoff) {
          delay = Math.pow(2, replayed) * 1000; // Exponential backoff
        }

        // Add back to main queue
        await mainQueue.add(originalJob.name, originalJob.data, {
          ...originalJob.opts,
          delay,
          attempts: 1, // Reset attempts
          removeOnComplete: 100,
          removeOnFail: 50
        });

        // Remove from DLQ
        await job.remove();
        replayed++;

        logger.info({ 
          jobId: job.id, 
          queue: request.queue,
          reason: request.reason,
          delay
        }, 'Job replayed from DLQ');

      } catch (error) {
        failed++;
        const errorMsg = `Failed to replay job ${job.id}: ${error.message}`;
        errors.push(errorMsg);
        logger.error({ error: error.message, jobId: job.id }, 'Failed to replay job from DLQ');
      }
    }

    return {
      success: errors.length === 0,
      replayed,
      failed,
      errors
    };

  } catch (error) {
    logger.error({ error: error.message, request }, 'Failed to replay from DLQ');
    return {
      success: false,
      replayed: 0,
      failed: 0,
      errors: [error.message]
    };
  }
}

// =========================
// DLQ ANALYTICS
// =========================

export async function getDLQStats(queueName: string): Promise<{
  total: number;
  byReason: Record<string, number>;
  byError: Record<string, number>;
  oldestJob?: DLQJob;
  newestJob?: DLQJob;
}> {
  try {
    const dlqName = `${queueName}:dlq`;
    const dlq = new Queue(dlqName, {
      connection: { url: process.env.REDIS_URL! }
    });

    const jobs = await dlq.getJobs(['waiting', 'active', 'completed', 'failed']);
    
    const stats = {
      total: jobs.length,
      byReason: {} as Record<string, number>,
      byError: {} as Record<string, number>,
      oldestJob: undefined as DLQJob | undefined,
      newestJob: undefined as DLQJob | undefined
    };

    let oldestTime = Infinity;
    let newestTime = 0;

    for (const job of jobs) {
      const jobData = job.data as DLQJob;
      
      // Count by reason
      const reason = jobData.reason || 'unknown';
      stats.byReason[reason] = (stats.byReason[reason] || 0) + 1;
      
      // Count by error type
      const errorType = jobData.error.message.split(':')[0] || 'unknown';
      stats.byError[errorType] = (stats.byError[errorType] || 0) + 1;
      
      // Track oldest/newest
      const jobTime = new Date(jobData.failedAt).getTime();
      if (jobTime < oldestTime) {
        oldestTime = jobTime;
        stats.oldestJob = jobData;
      }
      if (jobTime > newestTime) {
        newestTime = jobTime;
        stats.newestJob = jobData;
      }
    }

    return stats;

  } catch (error) {
    logger.error({ error: error.message, queueName }, 'Failed to get DLQ stats');
    return {
      total: 0,
      byReason: {},
      byError: {},
      oldestJob: undefined,
      newestJob: undefined
    };
  }
}

export async function getDLQJobs(
  queueName: string,
  limit: number = 50,
  offset: number = 0
): Promise<DLQJob[]> {
  try {
    const dlqName = `${queueName}:dlq`;
    const dlq = new Queue(dlqName, {
      connection: { url: process.env.REDIS_URL! }
    });

    const jobs = await dlq.getJobs(['waiting'], offset, offset + limit - 1);
    
    return jobs.map(job => job.data as DLQJob);

  } catch (error) {
    logger.error({ error: error.message, queueName }, 'Failed to get DLQ jobs');
    return [];
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
      const dlqStats = await getDLQStats(queueName);

      stats.push({
        name: queueName,
        active: active.length,
        waiting: waiting.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        paused: isPaused,
        dlq: dlqStats.total
      });
    }

    return stats;

  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get queue stats');
    return [];
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

export async function clearDLQ(queueName: string): Promise<number> {
  try {
    const dlqName = `${queueName}:dlq`;
    const dlq = new Queue(dlqName, {
      connection: { url: process.env.REDIS_URL! }
    });

    const jobs = await dlq.getJobs(['waiting', 'active', 'completed', 'failed']);
    const count = jobs.length;

    for (const job of jobs) {
      await job.remove();
    }

    logger.info({ queue: queueName, dlq: dlqName, count }, 'DLQ cleared');
    return count;

  } catch (error) {
    logger.error({ error: error.message, queue: queueName }, 'Failed to clear DLQ');
    return 0;
  }
}

// =========================
// BATCH OPERATIONS
// =========================

export async function replayAllDLQs(): Promise<{
  success: boolean;
  results: Record<string, ReplayResult>;
  totalReplayed: number;
  totalFailed: number;
}> {
  try {
    const queueNames = ['veo:start', 'veo:poll', 'veo:post'];
    const results: Record<string, ReplayResult> = {};
    let totalReplayed = 0;
    let totalFailed = 0;

    for (const queueName of queueNames) {
      const result = await replayFromDLQ({
        queue: queueName,
        limit: 100,
        reason: 'Batch replay',
        backoff: true
      });

      results[queueName] = result;
      totalReplayed += result.replayed;
      totalFailed += result.failed;
    }

    return {
      success: Object.values(results).every(r => r.success),
      results,
      totalReplayed,
      totalFailed
    };

  } catch (error) {
    logger.error({ error: error.message }, 'Failed to replay all DLQs');
    return {
      success: false,
      results: {},
      totalReplayed: 0,
      totalFailed: 0
    };
  }
}

export async function getSystemHealth(): Promise<{
  healthy: boolean;
  queues: QueueStats[];
  totalJobs: number;
  totalDLQ: number;
  issues: string[];
}> {
  try {
    const queues = await getQueueStats();
    const totalJobs = queues.reduce((sum, q) => sum + q.active + q.waiting, 0);
    const totalDLQ = queues.reduce((sum, q) => sum + q.dlq, 0);
    
    const issues: string[] = [];
    
    // Check for overloaded queues
    queues.forEach(queue => {
      if (queue.waiting > 50) {
        issues.push(`Queue ${queue.name} has ${queue.waiting} waiting jobs`);
      }
      if (queue.dlq > 20) {
        issues.push(`Queue ${queue.name} has ${queue.dlq} jobs in DLQ`);
      }
    });

    const healthy = issues.length === 0 && totalDLQ < 50;

    return {
      healthy,
      queues,
      totalJobs,
      totalDLQ,
      issues
    };

  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get system health');
    return {
      healthy: false,
      queues: [],
      totalJobs: 0,
      totalDLQ: 0,
      issues: ['Failed to get system health']
    };
  }
}

