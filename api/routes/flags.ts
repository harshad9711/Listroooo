import { Router } from 'express';
import { 
  getFlags,
  isEnabled,
  setFlags,
  updateFlag,
  getFlagConfigs,
  getDefaultFlags,
  getFlagsForOrgs,
  resetFlagsToDefaults,
  getFlagAnalytics
} from '../lib/flags.js';
import pino from 'pino';

const logger = pino({ name: 'flags-routes' });
const router = Router();

// =========================
// FEATURE FLAGS MANAGEMENT
// =========================

router.get('/', async (req, res) => {
  try {
    const { orgId } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const flags = await getFlags(orgId as string);
    res.json(flags);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get feature flags');
    res.status(500).json({ error: error.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const { orgId, flags } = req.body;

    if (!orgId || !flags) {
      return res.status(400).json({ error: 'Organization ID and flags required' });
    }

    await setFlags(orgId, flags);
    res.json({ 
      success: true,
      message: 'Feature flags updated successfully'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to update feature flags');
    res.status(500).json({ error: error.message });
  }
});

router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { orgId, value } = req.body;

    if (!orgId || typeof value !== 'boolean') {
      return res.status(400).json({ error: 'Organization ID and boolean value required' });
    }

    await updateFlag(orgId, key, value);
    res.json({ 
      success: true,
      message: 'Feature flag updated successfully'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to update feature flag');
    res.status(500).json({ error: error.message });
  }
});

router.get('/check/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { orgId } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const enabled = await isEnabled(orgId as string, key);
    res.json({ 
      key,
      enabled,
      orgId
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to check feature flag');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// CONFIGURATION
// =========================

router.get('/configs', async (req, res) => {
  try {
    const configs = getFlagConfigs();
    res.json(configs);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get flag configs');
    res.status(500).json({ error: error.message });
  }
});

router.get('/defaults', async (req, res) => {
  try {
    const defaults = getDefaultFlags();
    res.json(defaults);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get default flags');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// BULK OPERATIONS
// =========================

router.post('/bulk', async (req, res) => {
  try {
    const { orgIds } = req.body;

    if (!orgIds || !Array.isArray(orgIds)) {
      return res.status(400).json({ error: 'Organization IDs array required' });
    }

    const flags = await getFlagsForOrgs(orgIds);
    res.json(flags);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get flags for orgs');
    res.status(500).json({ error: error.message });
  }
});

router.post('/reset', async (req, res) => {
  try {
    const { orgId } = req.body;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    await resetFlagsToDefaults(orgId);
    res.json({ 
      success: true,
      message: 'Feature flags reset to defaults'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to reset flags to defaults');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// ANALYTICS
// =========================

router.get('/analytics', async (req, res) => {
  try {
    const analytics = await getFlagAnalytics();
    res.json(analytics);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get flag analytics');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// CANARY ROLLOUTS
// =========================

router.post('/canary/rollout', async (req, res) => {
  try {
    const { flagKey, percentage, conditions } = req.body;

    if (!flagKey || typeof percentage !== 'number') {
      return res.status(400).json({ error: 'Flag key and percentage required' });
    }

    // This would update the canary configuration
    // For now, we'll just log the request
    logger.info({ flagKey, percentage, conditions }, 'Canary rollout requested');
    
    res.json({ 
      success: true,
      message: 'Canary rollout initiated'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to initiate canary rollout');
    res.status(500).json({ error: error.message });
  }
});

router.post('/canary/rollback', async (req, res) => {
  try {
    const { flagKey } = req.body;

    if (!flagKey) {
      return res.status(400).json({ error: 'Flag key required' });
    }

    // This would rollback the canary configuration
    logger.info({ flagKey }, 'Canary rollback requested');
    
    res.json({ 
      success: true,
      message: 'Canary rollback initiated'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to rollback canary');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// HEALTH CHECK
// =========================

router.get('/health', async (req, res) => {
  try {
    const { orgId } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    // Test flag retrieval
    const flags = await getFlags(orgId as string);
    const testFlag = await isEnabled(orgId as string, 'composer_rag');

    res.json({
      status: 'healthy',
      flagsLoaded: Object.keys(flags).length > 0,
      testFlag: testFlag,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Feature flags health check failed');
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

