/**
 * Attribution & Tracking Routes
 * Handles short links, click tracking, and conversion attribution
 */

import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { createTrackedLink, handleLinkRedirect, trackConversion, getAttributionMetrics } from '../lib/attribution.js';
import pino from 'pino';

const logger = pino({ name: 'attribution-routes' });

const router = express.Router();

// =========================
// LINK CREATION
// =========================

/**
 * POST /api/attrib/link
 * Create a tracked link for a creative
 */
router.post('/link', authenticateUser, async (req, res) => {
  try {
    const { veoJobId, productId, variantId, campaign, cta, seed } = req.body;
    const orgId = req.user.org_id;

    if (!veoJobId || !productId) {
      return res.status(400).json({
        success: false,
        error: 'veoJobId and productId are required'
      });
    }

    const result = await createTrackedLink({
      veoJobId,
      productId,
      variantId,
      campaign,
      cta,
      seed
    }, orgId);

    if (result.success) {
      res.json({
        success: true,
        data: {
          shortId: result.shortId,
          shortUrl: result.shortUrl,
          targetUrl: result.targetUrl
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Link creation failed');
    res.status(500).json({
      success: false,
      error: 'Failed to create tracked link'
    });
  }
});

// =========================
// LINK REDIRECT (PUBLIC)
// =========================

/**
 * GET /l/:shortId
 * Public redirect endpoint for short links
 */
router.get('/l/:shortId', async (req, res) => {
  try {
    const { shortId } = req.params;
    const ip = req.ip || req.connection.remoteAddress;
    const ua = req.get('User-Agent');
    const referrer = req.get('Referer');

    const result = await handleLinkRedirect(shortId, {
      shortId,
      ip,
      ua,
      referrer
    });

    if (result.success && result.targetUrl) {
      // Set a signed cookie for conversion tracking
      const cookieValue = Buffer.from(JSON.stringify({
        shortId,
        timestamp: Date.now()
      })).toString('base64');
      
      res.cookie('veo_track', cookieValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.redirect(302, result.targetUrl);
    } else {
      res.status(404).json({
        success: false,
        error: 'Link not found'
      });
    }
  } catch (error) {
    logger.error({ error: error.message, shortId: req.params.shortId }, 'Link redirect failed');
    res.status(500).json({
      success: false,
      error: 'Failed to process link'
    });
  }
});

// =========================
// CONVERSION TRACKING (PUBLIC)
// =========================

/**
 * POST /api/attrib/convert
 * Public conversion tracking pixel
 */
router.post('/convert', async (req, res) => {
  try {
    const { shortId, orderId, revenueCents, currency, verify } = req.body;

    if (!shortId || !orderId || !revenueCents || !verify) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    const result = await trackConversion({
      shortId,
      orderId,
      revenueCents: parseInt(revenueCents),
      currency: currency || 'USD',
      verify
    });

    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Conversion tracking failed');
    res.status(500).json({
      success: false,
      error: 'Failed to track conversion'
    });
  }
});

// =========================
// ANALYTICS & REPORTING
// =========================

/**
 * GET /api/attrib/metrics
 * Get attribution metrics for organization
 */
router.get('/metrics', authenticateUser, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { veoJobId, productId, startDate, endDate } = req.query;

    const result = await getAttributionMetrics(orgId, {
      veoJobId: veoJobId as string,
      productId: productId as string,
      startDate: startDate as string,
      endDate: endDate as string
    });

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
    logger.error({ error: error.message }, 'Metrics fetch failed');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics'
    });
  }
});

/**
 * GET /api/attrib/metrics/:veoJobId
 * Get metrics for a specific creative
 */
router.get('/metrics/:veoJobId', authenticateUser, async (req, res) => {
  try {
    const { veoJobId } = req.params;
    const orgId = req.user.org_id;

    const result = await getAttributionMetrics(orgId, { veoJobId });

    if (result.success) {
      res.json({
        success: true,
        data: result.data?.[0] || null
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error({ error: error.message, veoJobId: req.params.veoJobId }, 'Creative metrics fetch failed');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch creative metrics'
    });
  }
});

export default router;

