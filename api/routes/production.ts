/**
 * Production Routes
 * Handles HLS streaming, quality scoring, GDPR, and monitoring
 */

import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { generateHLS, generateStreamToken } from '../lib/hlsStreaming.js';
import { analyzeVideoQuality, getQualityAnalytics } from '../lib/qualityScoring.js';
import { createGDPRExport, createGDPRDelete, getGDPRExport, performRetentionCleanup } from '../lib/dataGovernance.js';
import { getQueueStats, replayFromDLQ, getQueueHealth } from '../lib/queueHardening.js';
import { performHealthCheck, getMonitoringAnalytics, sendExternalPing } from '../lib/monitoring.js';
import { getModelAnalytics } from '../lib/modelOrchestrator.js';
import pino from 'pino';

const logger = pino({ name: 'production-routes' });

const router = express.Router();

// =========================
// HLS STREAMING ROUTES
// =========================

/**
 * POST /api/production/hls/generate
 * Generate HLS streams for a completed job
 */
router.post('/hls/generate', authenticateUser, async (req, res) => {
  try {
    const { jobId } = req.body;
    const userId = req.user.id;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }

    // Verify job ownership
    const { data: job, error: jobError } = await supabase
      .from('veo_jobs')
      .select('id, org_id, status, output_url')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (job.status !== 'done') {
      return res.status(400).json({
        success: false,
        error: 'Job not completed'
      });
    }

    if (!job.output_url) {
      return res.status(400).json({
        success: false,
        error: 'No video output available'
      });
    }

    // Generate HLS
    const hlsResult = await generateHLS(jobId, job.org_id, job.output_url);

    // Update job with HLS URLs
    await supabase
      .from('veo_jobs')
      .update({
        hls_master_url: hlsResult.masterUrl,
        sprites_image_url: hlsResult.sprites.imageUrl,
        sprites_vtt_url: hlsResult.sprites.vttUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    // Generate stream token
    const streamToken = generateStreamToken(jobId);

    res.json({
      success: true,
      data: {
        masterUrl: `/stream/veo/${jobId}/master.m3u8?token=${streamToken}`,
        variants: hlsResult.variants,
        sprites: hlsResult.sprites,
        expiresAt: hlsResult.expiresAt
      }
    });

  } catch (error) {
    logger.error({ error: error.message }, 'HLS generation failed');
    res.status(500).json({
      success: false,
      error: 'HLS generation failed'
    });
  }
});

/**
 * GET /api/production/stream/token/:jobId
 * Generate stream access token
 */
router.get('/stream/token/:jobId', authenticateUser, async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    // Verify job ownership
    const { data: job, error: jobError } = await supabase
      .from('veo_jobs')
      .select('id, status, hls_master_url')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (!job.hls_master_url) {
      return res.status(400).json({
        success: false,
        error: 'HLS not available for this job'
      });
    }

    const streamToken = generateStreamToken(jobId);

    res.json({
      success: true,
      data: {
        token: streamToken,
        masterUrl: `/stream/veo/${jobId}/master.m3u8?token=${streamToken}`,
        expiresIn: 3600
      }
    });

  } catch (error) {
    logger.error({ error: error.message }, 'Stream token generation failed');
    res.status(500).json({
      success: false,
      error: 'Stream token generation failed'
    });
  }
});

// =========================
// QUALITY SCORING ROUTES
// =========================

/**
 * POST /api/production/quality/analyze
 * Analyze video quality
 */
router.post('/quality/analyze', authenticateUser, async (req, res) => {
  try {
    const { jobId } = req.body;
    const userId = req.user.id;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }

    // Verify job ownership
    const { data: job, error: jobError } = await supabase
      .from('veo_jobs')
      .select('id, status, output_url, json_prompt')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (job.status !== 'done' || !job.output_url) {
      return res.status(400).json({
        success: false,
        error: 'Job not completed or no video available'
      });
    }

    // Analyze quality
    const analysis = await analyzeVideoQuality(jobId, job.output_url, job.json_prompt);

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    logger.error({ error: error.message }, 'Quality analysis failed');
    res.status(500).json({
      success: false,
      error: 'Quality analysis failed'
    });
  }
});

/**
 * GET /api/production/quality/analytics
 * Get quality analytics
 */
router.get('/quality/analytics', authenticateUser, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { startDate, endDate } = req.query;

    const result = await getQualityAnalytics(
      orgId,
      startDate as string,
      endDate as string
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error({ error: error.message }, 'Quality analytics failed');
    res.status(500).json({
      success: false,
      error: 'Quality analytics failed'
    });
  }
});

// =========================
// GDPR ROUTES
// =========================

/**
 * POST /api/production/gdpr/export
 * Create GDPR data export
 */
router.post('/gdpr/export', authenticateUser, async (req, res) => {
  try {
    const { scope, confirm } = req.body;
    const orgId = req.user.org_id;
    const userId = req.user.id;

    if (!scope || !['user', 'org'].includes(scope)) {
      return res.status(400).json({
        success: false,
        error: 'Valid scope required (user or org)'
      });
    }

    if (!confirm) {
      return res.status(400).json({
        success: false,
        error: 'Confirmation required'
      });
    }

    const result = await createGDPRExport({
      orgId,
      userId,
      scope
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          exportToken: result.exportToken,
          expiresAt: result.expiresAt
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error({ error: error.message }, 'GDPR export failed');
    res.status(500).json({
      success: false,
      error: 'GDPR export failed'
    });
  }
});

/**
 * POST /api/production/gdpr/delete
 * Create GDPR data deletion
 */
router.post('/gdpr/delete', authenticateUser, async (req, res) => {
  try {
    const { scope, confirm } = req.body;
    const orgId = req.user.org_id;
    const userId = req.user.id;

    if (!scope || !['user', 'org'].includes(scope)) {
      return res.status(400).json({
        success: false,
        error: 'Valid scope required (user or org)'
      });
    }

    if (!confirm) {
      return res.status(400).json({
        success: false,
        error: 'Confirmation required'
      });
    }

    const result = await createGDPRDelete({
      orgId,
      userId,
      scope,
      confirm
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Deletion request created'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error({ error: error.message }, 'GDPR deletion failed');
    res.status(500).json({
      success: false,
      error: 'GDPR deletion failed'
    });
  }
});

/**
 * GET /api/production/gdpr/export/:token
 * Get GDPR export
 */
router.get('/gdpr/export/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const result = await getGDPRExport(token);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error({ error: error.message }, 'GDPR export retrieval failed');
    res.status(500).json({
      success: false,
      error: 'GDPR export retrieval failed'
    });
  }
});

// =========================
// QUEUE MANAGEMENT ROUTES
// =========================

/**
 * GET /api/production/queues/stats
 * Get queue statistics
 */
router.get('/queues/stats', authenticateUser, async (req, res) => {
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
 * POST /api/production/queues/dlq/replay
 * Replay jobs from dead letter queue
 */
router.post('/queues/dlq/replay', authenticateUser, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { queue, limit = 10, reason } = req.body;

    if (!queue) {
      return res.status(400).json({
        success: false,
        error: 'Queue name is required'
      });
    }

    const result = await replayFromDLQ({
      queue,
      limit,
      reason
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          replayed: result.replayed
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
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
 * GET /api/production/queues/health
 * Get queue health
 */
router.get('/queues/health', async (req, res) => {
  try {
    const health = await getQueueHealth();

    res.json({
      success: true,
      data: health
    });

  } catch (error) {
    logger.error({ error: error.message }, 'Queue health check failed');
    res.status(500).json({
      success: false,
      error: 'Queue health check failed'
    });
  }
});

// =========================
// MONITORING ROUTES
// =========================

/**
 * GET /api/production/health
 * Get system health
 */
router.get('/health', async (req, res) => {
  try {
    const health = await performHealthCheck();

    res.status(health.status === 'healthy' ? 200 : 503).json({
      success: true,
      data: health
    });

  } catch (error) {
    logger.error({ error: error.message }, 'Health check failed');
    res.status(503).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

/**
 * POST /api/production/monitoring/ping
 * Send external monitoring ping
 */
router.post('/monitoring/ping', async (req, res) => {
  try {
    await sendExternalPing();

    res.json({
      success: true,
      message: 'Ping sent'
    });

  } catch (error) {
    logger.error({ error: error.message }, 'Monitoring ping failed');
    res.status(500).json({
      success: false,
      error: 'Monitoring ping failed'
    });
  }
});

/**
 * GET /api/production/monitoring/analytics
 * Get monitoring analytics
 */
router.get('/monitoring/analytics', authenticateUser, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { startDate, endDate } = req.query;

    const result = await getMonitoringAnalytics(
      startDate as string,
      endDate as string
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error({ error: error.message }, 'Monitoring analytics failed');
    res.status(500).json({
      success: false,
      error: 'Monitoring analytics failed'
    });
  }
});

// =========================
// MODEL ANALYTICS ROUTES
// =========================

/**
 * GET /api/production/models/analytics
 * Get model orchestration analytics
 */
router.get('/models/analytics', authenticateUser, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { startDate, endDate } = req.query;

    const result = await getModelAnalytics(
      orgId,
      startDate as string,
      endDate as string
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error({ error: error.message }, 'Model analytics failed');
    res.status(500).json({
      success: false,
      error: 'Model analytics failed'
    });
  }
});

// =========================
// RETENTION CLEANUP ROUTES
// =========================

/**
 * POST /api/production/retention/cleanup
 * Trigger retention cleanup
 */
router.post('/retention/cleanup', authenticateUser, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const result = await performRetentionCleanup();

    res.json({
      success: true,
      data: {
        jobsArchived: result.jobsArchived,
        assetsDeleted: result.assetsDeleted,
        errors: result.errors
      }
    });

  } catch (error) {
    logger.error({ error: error.message }, 'Retention cleanup failed');
    res.status(500).json({
      success: false,
      error: 'Retention cleanup failed'
    });
  }
});

export default router;

