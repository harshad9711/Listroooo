/**
 * Governance Routes
 * Handles GDPR export/delete and data retention
 */

import express from 'express';
import { authenticateUser } from '../../middleware/auth.js';
import { createGDPRExport, createGDPRDelete, getGDPRExport, performRetentionCleanup } from '../../lib/dataGovernance.js';
import pino from 'pino';

const logger = pino({ name: 'governance-routes' });

const router = express.Router();

// =========================
// GDPR EXPORT
// =========================

/**
 * POST /api/governance/gdpr/export
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
 * GET /api/governance/gdpr/export/:token
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
// GDPR DELETE
// =========================

/**
 * POST /api/governance/gdpr/delete
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

// =========================
// RETENTION MANAGEMENT
// =========================

/**
 * POST /api/governance/retention/cleanup
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

/**
 * GET /api/governance/retention/stats
 * Get retention statistics
 */
router.get('/retention/stats', authenticateUser, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const ttlDays = parseInt(process.env.JOB_TTL_DAYS || '90');
    const cutoffDate = new Date(Date.now() - ttlDays * 24 * 60 * 60 * 1000);

    // Get retention stats
    const { data: oldJobs, error: oldJobsError } = await supabase
      .from('veo_jobs')
      .select('id, created_at, archived')
      .lt('created_at', cutoffDate.toISOString())
      .eq('archived', false)
      .is('share_token', null);

    const { data: archivedJobs, error: archivedError } = await supabase
      .from('veo_jobs')
      .select('id, archived_at')
      .eq('archived', true)
      .gte('archived_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const { data: totalJobs, error: totalError } = await supabase
      .from('veo_jobs')
      .select('id', { count: 'exact' });

    if (oldJobsError || archivedError || totalError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get retention stats'
      });
    }

    res.json({
      success: true,
      data: {
        totalJobs: totalJobs?.length || 0,
        eligibleForArchive: oldJobs?.length || 0,
        recentlyArchived: archivedJobs?.length || 0,
        ttlDays,
        cutoffDate: cutoffDate.toISOString()
      }
    });

  } catch (error) {
    logger.error({ error: error.message }, 'Retention stats failed');
    res.status(500).json({
      success: false,
      error: 'Retention stats failed'
    });
  }
});

// =========================
// DATA EXPORT STATUS
// =========================

/**
 * GET /api/governance/exports
 * Get user's export requests
 */
router.get('/exports', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: exports, error } = await supabase
      .from('gdpr_exports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get exports'
      });
    }

    res.json({
      success: true,
      data: exports || []
    });

  } catch (error) {
    logger.error({ error: error.message }, 'Exports retrieval failed');
    res.status(500).json({
      success: false,
      error: 'Exports retrieval failed'
    });
  }
});

/**
 * GET /api/governance/deletions
 * Get user's deletion requests
 */
router.get('/deletions', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: deletions, error } = await supabase
      .from('gdpr_deletions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get deletions'
      });
    }

    res.json({
      success: true,
      data: deletions || []
    });

  } catch (error) {
    logger.error({ error: error.message }, 'Deletions retrieval failed');
    res.status(500).json({
      success: false,
      error: 'Deletions retrieval failed'
    });
  }
});

// =========================
// DATA AUDIT
// =========================

/**
 * GET /api/governance/audit
 * Get data audit trail
 */
router.get('/audit', authenticateUser, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { startDate, endDate, limit = 100 } = req.query;

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string));

    if (startDate) {
      query = query.gte('created_at', startDate as string);
    }

    if (endDate) {
      query = query.lte('created_at', endDate as string);
    }

    const { data: auditLogs, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get audit logs'
      });
    }

    res.json({
      success: true,
      data: auditLogs || []
    });

  } catch (error) {
    logger.error({ error: error.message }, 'Audit retrieval failed');
    res.status(500).json({
      success: false,
      error: 'Audit retrieval failed'
    });
  }
});

export default router;

