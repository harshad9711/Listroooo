import { Router } from 'express';
import { 
  createPublishJob,
  getPublishJobs,
  getPublishJob,
  cancelPublishJob,
  PublishRequest
} from '../lib/publishing.js';
import pino from 'pino';

const logger = pino({ name: 'publishing-routes' });
const router = Router();

// =========================
// PUBLISH JOB MANAGEMENT
// =========================

router.post('/jobs', async (req, res) => {
  try {
    const { veoJobId, orgId, provider, scheduledAt, caption, hashtags, metadata } = req.body;

    // Validate required fields
    if (!veoJobId || !orgId || !provider) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate provider
    if (!['tiktok', 'meta', 'youtube'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    const publishRequest: PublishRequest = {
      veoJobId,
      orgId,
      provider,
      scheduledAt,
      caption,
      hashtags,
      metadata
    };

    const publishJobId = await createPublishJob(publishRequest);
    
    res.json({ 
      publishJobId,
      status: 'queued',
      message: 'Publish job created successfully'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create publish job');
    res.status(500).json({ error: error.message });
  }
});

router.get('/jobs', async (req, res) => {
  try {
    const { orgId, status } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const jobs = await getPublishJobs(orgId as string, status as string);
    res.json(jobs);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get publish jobs');
    res.status(500).json({ error: error.message });
  }
});

router.get('/jobs/:publishJobId', async (req, res) => {
  try {
    const { publishJobId } = req.params;

    const job = await getPublishJob(publishJobId);
    res.json(job);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get publish job');
    res.status(500).json({ error: error.message });
  }
});

router.delete('/jobs/:publishJobId', async (req, res) => {
  try {
    const { publishJobId } = req.params;

    await cancelPublishJob(publishJobId);
    res.json({ success: true });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to cancel publish job');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// BULK OPERATIONS
// =========================

router.post('/jobs/bulk', async (req, res) => {
  try {
    const { jobs } = req.body;

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return res.status(400).json({ error: 'Jobs array required' });
    }

    const results = [];
    const errors = [];

    for (const job of jobs) {
      try {
        const publishJobId = await createPublishJob(job);
        results.push({ publishJobId, status: 'queued' });
      } catch (error) {
        errors.push({ job, error: error.message });
      }
    }

    res.json({
      results,
      errors,
      total: jobs.length,
      successful: results.length,
      failed: errors.length
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create bulk publish jobs');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// SCHEDULING
// =========================

router.post('/jobs/:publishJobId/schedule', async (req, res) => {
  try {
    const { publishJobId } = req.params;
    const { scheduledAt } = req.body;

    if (!scheduledAt) {
      return res.status(400).json({ error: 'Scheduled time required' });
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }

    // Update the publish job with scheduled time
    const { error } = await supabase
      .from('publish_jobs')
      .update({
        scheduled_at: scheduledDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', publishJobId);

    if (error) {
      throw new Error(`Failed to schedule publish job: ${error.message}`);
    }

    res.json({ 
      success: true,
      scheduledAt: scheduledDate.toISOString()
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to schedule publish job');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// ANALYTICS
// =========================

router.get('/analytics', async (req, res) => {
  try {
    const { orgId, startDate, endDate, provider } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    let query = supabase
      .from('publish_jobs')
      .select('*')
      .eq('org_id', orgId);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    if (provider) {
      query = query.eq('provider', provider);
    }

    const { data: jobs, error } = await query;

    if (error) {
      throw new Error(`Failed to get analytics: ${error.message}`);
    }

    // Calculate analytics
    const analytics = {
      total: jobs.length,
      byStatus: jobs.reduce((acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      }, {}),
      byProvider: jobs.reduce((acc, job) => {
        acc[job.provider] = (acc[job.provider] || 0) + 1;
        return acc;
      }, {}),
      published: jobs.filter(job => job.status === 'published').length,
      failed: jobs.filter(job => job.status === 'error').length,
      pending: jobs.filter(job => ['queued', 'uploading', 'processing'].includes(job.status)).length
    };

    res.json(analytics);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get analytics');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// TEMPLATES
// =========================

router.get('/templates', async (req, res) => {
  try {
    const { orgId, provider } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    // Get publish templates for the organization
    const { data: templates, error } = await supabase
      .from('veo_templates')
      .select('*')
      .eq('org_id', orgId)
      .eq('type', 'publish')
      .eq('provider', provider || null);

    if (error) {
      throw new Error(`Failed to get templates: ${error.message}`);
    }

    res.json(templates || []);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get templates');
    res.status(500).json({ error: error.message });
  }
});

router.post('/templates', async (req, res) => {
  try {
    const { orgId, name, provider, caption, hashtags, metadata } = req.body;

    if (!orgId || !name || !provider) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: template, error } = await supabase
      .from('veo_templates')
      .insert({
        org_id: orgId,
        name,
        type: 'publish',
        provider,
        data: {
          caption,
          hashtags,
          metadata
        }
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }

    res.json(template);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create template');
    res.status(500).json({ error: error.message });
  }
});

export default router;

