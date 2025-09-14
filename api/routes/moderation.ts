import { Router } from 'express';
import { 
  moderateContent,
  getModerationResults,
  updateModerationResult,
  ModerationRequest
} from '../lib/moderation.js';
import pino from 'pino';

const logger = pino({ name: 'moderation-routes' });
const router = Router();

// =========================
// CONTENT MODERATION
// =========================

router.post('/moderate', async (req, res) => {
  try {
    const { veoJobId, orgId, contentType, content, metadata } = req.body;

    // Validate required fields
    if (!veoJobId || !orgId || !contentType || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate content type
    if (!['video', 'thumbnail', 'caption', 'prompt'].includes(contentType)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    const moderationRequest: ModerationRequest = {
      veoJobId,
      orgId,
      contentType,
      content,
      metadata
    };

    const result = await moderateContent(moderationRequest);
    
    res.json({
      result,
      message: 'Content moderation completed'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Content moderation failed');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// MODERATION RESULTS
// =========================

router.get('/results', async (req, res) => {
  try {
    const { orgId, status } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const results = await getModerationResults(orgId as string, status as string);
    res.json(results);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get moderation results');
    res.status(500).json({ error: error.message });
  }
});

router.put('/results/:resultId', async (req, res) => {
  try {
    const { resultId } = req.params;
    const { status, reviewedBy } = req.body;

    if (!status || !reviewedBy) {
      return res.status(400).json({ error: 'Status and reviewedBy required' });
    }

    if (!['approved', 'rejected', 'flagged'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await updateModerationResult(resultId, status, reviewedBy);
    
    res.json({ 
      success: true,
      message: 'Moderation result updated'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to update moderation result');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// BULK MODERATION
// =========================

router.post('/moderate/bulk', async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array required' });
    }

    const results = [];
    const errors = [];

    for (const item of items) {
      try {
        const result = await moderateContent(item);
        results.push(result);
      } catch (error) {
        errors.push({ item, error: error.message });
      }
    }

    res.json({
      results,
      errors,
      total: items.length,
      successful: results.length,
      failed: errors.length
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Bulk moderation failed');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// MODERATION DASHBOARD
// =========================

router.get('/dashboard', async (req, res) => {
  try {
    const { orgId, startDate, endDate } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    // Get moderation statistics
    const { data: stats, error } = await supabase
      .from('veo_moderation_results')
      .select('status, content_type, created_at')
      .eq('org_id', orgId);

    if (error) {
      throw new Error(`Failed to get moderation stats: ${error.message}`);
    }

    // Calculate statistics
    const dashboard = {
      total: stats.length,
      byStatus: stats.reduce((acc, result) => {
        acc[result.status] = (acc[result.status] || 0) + 1;
        return acc;
      }, {}),
      byContentType: stats.reduce((acc, result) => {
        acc[result.content_type] = (acc[result.content_type] || 0) + 1;
        return acc;
      }, {}),
      pending: stats.filter(r => r.status === 'pending').length,
      approved: stats.filter(r => r.status === 'approved').length,
      rejected: stats.filter(r => r.status === 'rejected').length,
      flagged: stats.filter(r => r.status === 'flagged').length
    };

    res.json(dashboard);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get moderation dashboard');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// MODERATION POLICIES
// =========================

router.get('/policies', async (req, res) => {
  try {
    const { orgId } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    // Get moderation policies for the organization
    const { data: policies, error } = await supabase
      .from('veo_moderation_policies')
      .select('*')
      .eq('org_id', orgId);

    if (error) {
      throw new Error(`Failed to get moderation policies: ${error.message}`);
    }

    res.json(policies || []);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get moderation policies');
    res.status(500).json({ error: error.message });
  }
});

router.post('/policies', async (req, res) => {
  try {
    const { orgId, name, rules, enabled } = req.body;

    if (!orgId || !name || !rules) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: policy, error } = await supabase
      .from('veo_moderation_policies')
      .insert({
        org_id: orgId,
        name,
        rules,
        enabled: enabled !== false
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create moderation policy: ${error.message}`);
    }

    res.json(policy);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create moderation policy');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// MODERATION QUEUE
// =========================

router.get('/queue', async (req, res) => {
  try {
    const { orgId, limit = 50 } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    // Get pending moderation items
    const { data: queue, error } = await supabase
      .from('veo_moderation_results')
      .select(`
        *,
        veo_jobs!inner(
          id,
          prompt,
          result,
          created_at
        )
      `)
      .eq('org_id', orgId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(parseInt(limit as string));

    if (error) {
      throw new Error(`Failed to get moderation queue: ${error.message}`);
    }

    res.json(queue || []);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get moderation queue');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// MODERATION REPORTS
// =========================

router.get('/reports', async (req, res) => {
  try {
    const { orgId, startDate, endDate, format = 'json' } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    // Get moderation report data
    const { data: report, error } = await supabase
      .from('veo_moderation_results')
      .select(`
        *,
        veo_jobs!inner(
          id,
          prompt,
          result,
          created_at
        )
      `)
      .eq('org_id', orgId)
      .gte('created_at', startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .lte('created_at', endDate || new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get moderation report: ${error.message}`);
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(report || []);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="moderation-report.csv"');
      res.send(csv);
    } else {
      res.json(report || []);
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get moderation report');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// HELPER FUNCTIONS
// =========================

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value).replace(/"/g, '""');
    });
    csvRows.push(values.map(v => `"${v}"`).join(','));
  }

  return csvRows.join('\n');
}

export default router;

