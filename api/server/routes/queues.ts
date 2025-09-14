/**
 * Queue Management Routes
 * Handles queue statistics, DLQ operations, and admin functions
 */

import express from 'express';
import { authenticateUser } from '../../middleware/auth.js';
import { 
  getQueueStats, 
  replayFromDLQ, 
  getDLQStats, 
  getDLQJobs,
  pauseQueue,
  resumeQueue,
  clearQueue,
  clearDLQ,
  replayAllDLQs,
  getSystemHealth
} from '../queues/dlq.js';
import pino from 'pino';

const logger = pino({ name: 'queue-routes' });

const router = express.Router();

// =========================
// QUEUE STATISTICS
// =========================

/**
 * GET /api/queues/stats
 * Get queue statistics
 */
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const stats = await getQueueStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error({ error: error.message }, 'Queue stats failed');
    res.status(500).json({
      success: false,
      error: 'Queue stats failed'
    });
  }
});

/**
 * GET /api/queues/health
 * Get queue health
 */
router.get('/health', async (req, res) => {
  try {
    const health = await getSystemHealth();

    res.status(health.healthy ? 200 : 503).json({
      success: true,
      data: health
    });

  } catch (error) {
    logger.error({ error: error.message }, 'Queue health check failed');
    res.status(503).json({
      success: false,
      error: 'Queue health check failed'
    });
  }
});

// =========================
// DLQ MANAGEMENT
// =========================

/**
 * GET /api/queues/dlq/:queueName/stats
 * Get DLQ statistics for a specific queue
 */
router.get('/dlq/:queueName/stats', authenticateUser, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { queueName } = req.params;

    const stats = await getDLQStats(queueName);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error({ error: error.message, queueName: req.params.queueName }, 'DLQ stats failed');
    res.status(500).json({
      success: false,
      error: 'DLQ stats failed'
    });
  }
});

/**
 * GET /api/queues/dlq/:queueName/jobs
 * Get DLQ jobs for a specific queue
 */
router.get('/dlq/:queueName/jobs', authenticateUser, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { queueName } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const jobs = await getDLQJobs(
      queueName,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({
      success: true,
      data: jobs
    });

  } catch (error) {
    logger.error({ error: error.message, queueName: req.params.queueName }, 'DLQ jobs retrieval failed');
    res.status(500).json({
      success: false,
      error: 'DLQ jobs retrieval failed'
    });
  }
});

/**
 * POST /api/queues/dlq/replay
 * Replay jobs from dead letter queue
 */
router.post('/dlq/replay', authenticateUser, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { queue, limit = 10, reason, backoff = true } = req.body;

    if (!queue) {
      return res.status(400).json({
        success: false,
        error: 'Queue name is required'
      });
    }

    const result = await replayFromDLQ({
      queue,
      limit,
      reason,
      backoff
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          replayed: result.replayed,
          failed: result.failed,
          errors: result.errors
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Replay failed',
        details: result.errors
      });
    }

  } catch (error) {
    logger.error({ error: error.message }, 'DLQ replay failed');
    res.status(500).json({
      success: false,
      error: 'DLQ replay failed'
    });
  }
});

/**
 * POST /api/queues/dlq/replay-all
 * Replay all DLQs
 */
router.post('/dlq/replay-all', authenticateUser, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const result = await replayAllDLQs();

    res.json({
      success: result.success,
      data: {
        results: result.results,
        totalReplayed: result.totalReplayed,
        totalFailed: result.totalFailed
      }
    });

  } catch (error) {
    logger.error({ error: error.message }, 'DLQ replay all failed');
    res.status(500).json({
      success: false,
      error: 'DLQ replay all failed'
    });
  }
});

// =========================
// QUEUE CONTROL
// =========================

/**
 * POST /api/queues/:queueName/pause
 * Pause a queue
 */
router.post('/:queueName/pause', authenticateUser, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { queueName } = req.params;

    const success = await pauseQueue(queueName);

    if (success) {
      res.json({
        success: true,
        message: `Queue ${queueName} paused`
      });
    } else {
      res.status(500).json({
        success: false,
        error: `Failed to pause queue ${queueName}`
      });
    }

  } catch (error) {
    logger.error({ error: error.message, queueName: req.params.queueName }, 'Queue pause failed');
    res.status(500).json({
      success: false,
      error: 'Queue pause failed'
    });
  }
});

/**
 * POST /api/queues/:queueName/resume
 * Resume a queue
 */
router.post('/:queueName/resume', authenticateUser, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { queueName } = req.params;

    const success = await resumeQueue(queueName);

    if (success) {
      res.json({
        success: true,
        message: `Queue ${queueName} resumed`
      });
    } else {
      res.status(500).json({
        success: false,
        error: `Failed to resume queue ${queueName}`
      });
    }

  } catch (error) {
    logger.error({ error: error.message, queueName: req.params.queueName }, 'Queue resume failed');
    res.status(500).json({
      success: false,
      error: 'Queue resume failed'
    });
  }
});

/**
 * POST /api/queues/:queueName/clear
 * Clear a queue
 */
router.post('/:queueName/clear', authenticateUser, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { queueName } = req.params;
    const { state = 'waiting' } = req.body;

    const count = await clearQueue(queueName, state);

    res.json({
      success: true,
      data: {
        cleared: count,
        queue: queueName,
        state
      }
    });

  } catch (error) {
    logger.error({ error: error.message, queueName: req.params.queueName }, 'Queue clear failed');
    res.status(500).json({
      success: false,
      error: 'Queue clear failed'
    });
  }
});

/**
 * POST /api/queues/:queueName/dlq/clear
 * Clear a DLQ
 */
router.post('/:queueName/dlq/clear', authenticateUser, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { queueName } = req.params;

    const count = await clearDLQ(queueName);

    res.json({
      success: true,
      data: {
        cleared: count,
        queue: queueName
      }
    });

  } catch (error) {
    logger.error({ error: error.message, queueName: req.params.queueName }, 'DLQ clear failed');
    res.status(500).json({
      success: false,
      error: 'DLQ clear failed'
    });
  }
});

// =========================
// QUEUE MONITORING
// =========================

/**
 * GET /api/queues/metrics
 * Get detailed queue metrics
 */
router.get('/metrics', authenticateUser, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { startDate, endDate } = req.query;

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase
      .from('queue_stats')
      .select('*')
      .order('updated_at', { ascending: false });

    if (startDate) {
      query = query.gte('updated_at', startDate as string);
    }

    if (endDate) {
      query = query.lte('updated_at', endDate as string);
    }

    const { data: metrics, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get queue metrics'
      });
    }

    res.json({
      success: true,
      data: metrics || []
    });

  } catch (error) {
    logger.error({ error: error.message }, 'Queue metrics failed');
    res.status(500).json({
      success: false,
      error: 'Queue metrics failed'
    });
  }
});

export default router;

