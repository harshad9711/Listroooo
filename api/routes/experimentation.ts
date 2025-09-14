import { Router } from 'express';
import { 
  createCampaign,
  getCampaigns,
  updateCampaign,
  createExperiment,
  getExperiments,
  startExperiment,
  stopExperiment,
  assignToExperiment,
  recordExperimentResult,
  getExperimentResults,
  trackPerformance,
  getPerformanceMetrics,
  getExperimentAnalytics,
  Campaign,
  Experiment,
  PerformanceMetrics
} from '../lib/experimentation.js';
import pino from 'pino';

const logger = pino({ name: 'experimentation-routes' });
const router = Router();

// =========================
// CAMPAIGN MANAGEMENT
// =========================

router.post('/campaigns', async (req, res) => {
  try {
    const { orgId, name, description, budgetCents, targetPlatforms } = req.body;

    // Validate required fields
    if (!orgId || !name) {
      return res.status(400).json({ error: 'Organization ID and name required' });
    }

    const campaign = await createCampaign(
      orgId,
      name,
      description,
      budgetCents,
      targetPlatforms
    );
    
    res.json({
      campaign,
      message: 'Campaign created successfully'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create campaign');
    res.status(500).json({ error: error.message });
  }
});

router.get('/campaigns', async (req, res) => {
  try {
    const { orgId, status } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const campaigns = await getCampaigns(orgId as string, status as string);
    res.json(campaigns);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get campaigns');
    res.status(500).json({ error: error.message });
  }
});

router.put('/campaigns/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const updates = req.body;

    const campaign = await updateCampaign(campaignId, updates);
    res.json({
      campaign,
      message: 'Campaign updated successfully'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to update campaign');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// EXPERIMENT MANAGEMENT
// =========================

router.post('/experiments', async (req, res) => {
  try {
    const { 
      campaignId, 
      orgId, 
      name, 
      description, 
      trafficSplit, 
      controlPromptSnapshotId, 
      variantPromptSnapshotId 
    } = req.body;

    // Validate required fields
    if (!campaignId || !orgId || !name) {
      return res.status(400).json({ error: 'Campaign ID, organization ID, and name required' });
    }

    const experiment = await createExperiment(
      campaignId,
      orgId,
      name,
      description,
      trafficSplit,
      controlPromptSnapshotId,
      variantPromptSnapshotId
    );
    
    res.json({
      experiment,
      message: 'Experiment created successfully'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create experiment');
    res.status(500).json({ error: error.message });
  }
});

router.get('/experiments', async (req, res) => {
  try {
    const { orgId, campaignId } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const experiments = await getExperiments(orgId as string, campaignId as string);
    res.json(experiments);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get experiments');
    res.status(500).json({ error: error.message });
  }
});

router.post('/experiments/:experimentId/start', async (req, res) => {
  try {
    const { experimentId } = req.params;

    await startExperiment(experimentId);
    res.json({ message: 'Experiment started successfully' });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to start experiment');
    res.status(500).json({ error: error.message });
  }
});

router.post('/experiments/:experimentId/stop', async (req, res) => {
  try {
    const { experimentId } = req.params;

    await stopExperiment(experimentId);
    res.json({ message: 'Experiment stopped successfully' });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to stop experiment');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// EXPERIMENT ASSIGNMENT
// =========================

router.post('/experiments/:experimentId/assign', async (req, res) => {
  try {
    const { experimentId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const variant = await assignToExperiment(experimentId, userId);
    res.json({ variant });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to assign to experiment');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// EXPERIMENT RESULTS
// =========================

router.post('/experiments/:experimentId/results', async (req, res) => {
  try {
    const { experimentId } = req.params;
    const { veoJobId, variant, metrics } = req.body;

    // Validate required fields
    if (!veoJobId || !variant || !metrics) {
      return res.status(400).json({ error: 'Video job ID, variant, and metrics required' });
    }

    if (!['control', 'variant'].includes(variant)) {
      return res.status(400).json({ error: 'Variant must be control or variant' });
    }

    const result = await recordExperimentResult(experimentId, veoJobId, variant, metrics);
    res.json({
      result,
      message: 'Experiment result recorded successfully'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to record experiment result');
    res.status(500).json({ error: error.message });
  }
});

router.get('/experiments/:experimentId/results', async (req, res) => {
  try {
    const { experimentId } = req.params;

    const results = await getExperimentResults(experimentId);
    res.json(results);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get experiment results');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// EXPERIMENT ANALYTICS
// =========================

router.get('/experiments/:experimentId/analytics', async (req, res) => {
  try {
    const { experimentId } = req.params;

    const analytics = await getExperimentAnalytics(experimentId);
    res.json(analytics);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get experiment analytics');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// PERFORMANCE TRACKING
// =========================

router.post('/performance/track', async (req, res) => {
  try {
    const { veoJobId, orgId, platform, externalPostId, metrics } = req.body;

    // Validate required fields
    if (!veoJobId || !orgId || !platform || !externalPostId || !metrics) {
      return res.status(400).json({ error: 'All fields required' });
    }

    await trackPerformance(veoJobId, orgId, platform, externalPostId, metrics);
    res.json({ message: 'Performance metrics tracked successfully' });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to track performance');
    res.status(500).json({ error: error.message });
  }
});

router.get('/performance/metrics', async (req, res) => {
  try {
    const { orgId, platform, startDate, endDate } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const metrics = await getPerformanceMetrics(
      orgId as string,
      platform as string,
      startDate as string,
      endDate as string
    );
    
    res.json(metrics);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get performance metrics');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// EXPERIMENT DASHBOARD
// =========================

router.get('/dashboard', async (req, res) => {
  try {
    const { orgId, startDate, endDate } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    // Get campaigns and experiments
    const [campaigns, experiments] = await Promise.all([
      getCampaigns(orgId as string),
      getExperiments(orgId as string)
    ]);

    // Get performance metrics
    const metrics = await getPerformanceMetrics(
      orgId as string,
      undefined,
      startDate as string,
      endDate as string
    );

    // Calculate dashboard statistics
    const dashboard = {
      campaigns: {
        total: campaigns.length,
        active: campaigns.filter(c => c.status === 'active').length,
        completed: campaigns.filter(c => c.status === 'completed').length
      },
      experiments: {
        total: experiments.length,
        running: experiments.filter(e => e.status === 'running').length,
        completed: experiments.filter(e => e.status === 'completed').length
      },
      performance: {
        totalMetrics: metrics.length,
        averageEngagement: metrics.reduce((acc, m) => acc + (m.metrics.engagement_rate || 0), 0) / metrics.length || 0,
        averageViews: metrics.reduce((acc, m) => acc + (m.metrics.views || 0), 0) / metrics.length || 0
      }
    };

    res.json(dashboard);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get experiment dashboard');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// EXPERIMENT REPORTS
// =========================

router.get('/reports/:experimentId', async (req, res) => {
  try {
    const { experimentId } = req.params;
    const { format = 'json' } = req.query;

    // Get experiment details
    const { data: experiment, error: expError } = await supabase
      .from('veo_experiments')
      .select('*')
      .eq('id', experimentId)
      .single();

    if (expError) {
      throw new Error(`Experiment not found: ${expError.message}`);
    }

    // Get analytics
    const analytics = await getExperimentAnalytics(experimentId);
    const results = await getExperimentResults(experimentId);

    const report = {
      experiment,
      analytics,
      results,
      generatedAt: new Date().toISOString()
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertExperimentToCSV(results);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="experiment-${experimentId}-report.csv"`);
      res.send(csv);
    } else {
      res.json(report);
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get experiment report');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// HELPER FUNCTIONS
// =========================

function convertExperimentToCSV(results: any[]): string {
  if (results.length === 0) return '';

  const headers = ['id', 'experiment_id', 'veo_job_id', 'variant', 'views', 'likes', 'shares', 'comments', 'engagement_rate', 'created_at'];
  const csvRows = [headers.join(',')];

  for (const result of results) {
    const metrics = result.metrics || {};
    const values = [
      result.id,
      result.experiment_id,
      result.veo_job_id,
      result.variant,
      metrics.views || 0,
      metrics.likes || 0,
      metrics.shares || 0,
      metrics.comments || 0,
      metrics.engagement_rate || 0,
      result.created_at
    ];
    csvRows.push(values.map(v => `"${v}"`).join(','));
  }

  return csvRows.join('\n');
}

export default router;

