/**
 * Delivery Routes
 * Handles HLS streaming and signed access endpoints
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { verifyStreamToken } from '../delivery/sign.js';
import { generateHLS } from '../delivery/hls.js';
import pino from 'pino';

const logger = pino({ name: 'delivery-routes' });

const router = express.Router();

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// HLS STREAM ACCESS
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
      .select('id, org_id, status, hls_master_url')
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
// HLS GENERATION
// =========================

/**
 * POST /api/delivery/hls/generate
 * Generate HLS streams for a completed job
 */
router.post('/hls/generate', async (req, res) => {
  try {
    const { jobId, orgId } = req.body;

    if (!jobId || !orgId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID and Org ID are required'
      });
    }

    // Get job info
    const { data: job, error: jobError } = await supabase
      .from('veo_jobs')
      .select('id, org_id, status, output_url')
      .eq('id', jobId)
      .eq('org_id', orgId)
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
    const hlsResult = await generateHLS(jobId, orgId, job.output_url);

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

    res.json({
      success: true,
      data: {
        masterUrl: hlsResult.masterUrl,
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

// =========================
// STREAM TOKEN GENERATION
// =========================

/**
 * GET /api/delivery/stream/token/:jobId
 * Generate stream access token
 */
router.get('/stream/token/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { orgId, userId } = req.query;

    // Get job info
    const { data: job, error: jobError } = await supabase
      .from('veo_jobs')
      .select('id, status, hls_master_url')
      .eq('id', jobId)
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

    // Generate stream token
    const { generateStreamToken } = await import('../delivery/sign.js');
    const streamToken = generateStreamToken(
      jobId,
      3600, // 1 hour
      orgId as string,
      userId as string
    );

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
// HLS ASSETS INFO
// =========================

/**
 * GET /api/delivery/hls/:jobId/info
 * Get HLS assets information
 */
router.get('/hls/:jobId/info', async (req, res) => {
  try {
    const { jobId } = req.params;

    // Get job info
    const { data: job, error: jobError } = await supabase
      .from('veo_jobs')
      .select('id, status, hls_master_url, sprites_image_url, sprites_vtt_url')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (!job.hls_master_url) {
      return res.status(404).json({
        success: false,
        error: 'HLS not available for this job'
      });
    }

    // Generate signed URLs
    const [masterUrl, spriteImageUrl, spriteVttUrl] = await Promise.all([
      supabase.storage.from('renders').createSignedUrl(job.hls_master_url, 3600),
      job.sprites_image_url ? supabase.storage.from('renders').createSignedUrl(job.sprites_image_url, 3600) : null,
      job.sprites_vtt_url ? supabase.storage.from('renders').createSignedUrl(job.sprites_vtt_url, 3600) : null
    ]);

    res.json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        hls: {
          masterUrl: masterUrl.data?.signedUrl,
          expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
        },
        sprites: {
          imageUrl: spriteImageUrl?.data?.signedUrl,
          vttUrl: spriteVttUrl?.data?.signedUrl
        }
      }
    });

  } catch (error) {
    logger.error({ error: error.message, jobId: req.params.jobId }, 'HLS info retrieval failed');
    res.status(500).json({
      success: false,
      error: 'HLS info retrieval failed'
    });
  }
});

// =========================
// BATCH HLS GENERATION
// =========================

/**
 * POST /api/delivery/hls/batch
 * Generate HLS for multiple jobs
 */
router.post('/hls/batch', async (req, res) => {
  try {
    const { jobIds, orgId } = req.body;

    if (!jobIds || !Array.isArray(jobIds) || !orgId) {
      return res.status(400).json({
        success: false,
        error: 'Job IDs array and Org ID are required'
      });
    }

    const results = [];

    for (const jobId of jobIds) {
      try {
        // Get job info
        const { data: job, error: jobError } = await supabase
          .from('veo_jobs')
          .select('id, org_id, status, output_url')
          .eq('id', jobId)
          .eq('org_id', orgId)
          .single();

        if (jobError || !job || job.status !== 'done' || !job.output_url) {
          results.push({
            jobId,
            success: false,
            error: 'Job not found or not completed'
          });
          continue;
        }

        // Generate HLS
        const hlsResult = await generateHLS(jobId, orgId, job.output_url);

        // Update job
        await supabase
          .from('veo_jobs')
          .update({
            hls_master_url: hlsResult.masterUrl,
            sprites_image_url: hlsResult.sprites.imageUrl,
            sprites_vtt_url: hlsResult.sprites.vttUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);

        results.push({
          jobId,
          success: true,
          data: hlsResult
        });

      } catch (error) {
        logger.error({ error: error.message, jobId }, 'HLS generation failed for job');
        results.push({
          jobId,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: true,
      data: {
        results,
        total: jobIds.length,
        successful: successCount,
        failed: jobIds.length - successCount
      }
    });

  } catch (error) {
    logger.error({ error: error.message }, 'Batch HLS generation failed');
    res.status(500).json({
      success: false,
      error: 'Batch HLS generation failed'
    });
  }
});

export default router;

