/**
 * Edge-Friendly API Routes
 * Lightweight endpoints for edge deployment
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { verifyStreamToken } from '../lib/hlsStreaming.js';
import { handleLinkRedirect } from '../lib/attribution.js';
import pino from 'pino';

const logger = pino({ name: 'edge-routes' });

const router = express.Router();

// Initialize Supabase (minimal for edge)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// STREAM ACCESS (EDGE)
// =========================

/**
 * GET /stream/veo/:jobId/master.m3u8
 * Edge-friendly HLS stream access with JWT verification
 */
router.get('/stream/veo/:jobId/master.m3u8', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(401).json({
        success: false,
        error: 'Token required'
      });
    }

    // Verify JWT token
    const verification = verifyStreamToken(token);
    if (!verification.valid || verification.jobId !== jobId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Get job info
    const { data: job, error: jobError } = await supabase
      .from('veo_jobs')
      .select('hls_master_url, org_id, status')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (job.status !== 'done') {
      return res.status(404).json({
        success: false,
        error: 'Job not completed'
      });
    }

    if (!job.hls_master_url) {
      return res.status(404).json({
        success: false,
        error: 'HLS not available'
      });
    }

    // Generate signed URL for master playlist
    const { data: signedData, error: signedError } = await supabase.storage
      .from('renders')
      .createSignedUrl(job.hls_master_url, 3600); // 1 hour

    if (signedError || !signedData) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate signed URL'
      });
    }

    // Redirect to signed URL
    res.redirect(302, signedData.signedUrl);

  } catch (error) {
    logger.error({ error: error.message, jobId: req.params.jobId }, 'Stream access failed');
    res.status(500).json({
      success: false,
      error: 'Stream access failed'
    });
  }
});

// =========================
// LINK REDIRECT (EDGE)
// =========================

/**
 * GET /l/:shortId
 * Edge-friendly link redirect with click tracking
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
      // Set tracking cookie
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
      error: 'Link redirect failed'
    });
  }
});

// =========================
// HEALTH CHECK (EDGE)
// =========================

/**
 * GET /internal/ping
 * Lightweight health check for edge deployment
 */
router.get('/internal/ping', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Basic database check
    const { error: dbError } = await supabase
      .from('veo_jobs')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - startTime;
    const dbHealthy = !dbError;

    const health = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime,
      services: {
        database: dbHealthy ? 'up' : 'down'
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    res.status(dbHealthy ? 200 : 503).json(health);

  } catch (error) {
    logger.error({ error: error.message }, 'Health check failed');
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// =========================
// CORS HEADERS FOR EDGE
// =========================

router.use((req, res, next) => {
  // Set CORS headers for edge deployment
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

export default router;

