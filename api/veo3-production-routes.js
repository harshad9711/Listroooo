import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { 
  VeoPromptZ, 
  validateVeoPrompt, 
  buildPromptString, 
  generateIdeaHash 
} from './lib/veo3Schema.js';
import { 
  createRateLimitMiddleware, 
  createConcurrencyMiddleware,
  getUserQuotaInfo 
} from './lib/rateLimiter.js';
import { 
  startVeoJob, 
  pollVeo, 
  downloadAndConvertImage, 
  uploadVideoToStorage 
} from './lib/veo3Client.js';
import { composeIdeaToJson } from './lib/veo3Composer.js';
import { 
  createTemplate, 
  getUserTemplates, 
  getTemplate, 
  updateTemplate, 
  deleteTemplate,
  generateVariationFromTemplate 
} from './lib/veo3Templates.js';
import { 
  createBrandKit, 
  getUserBrandKits, 
  getBrandKit, 
  updateBrandKit, 
  deleteBrandKit,
  uploadBrandAsset,
  getBrandKitAssets,
  getBrandAssetsByKind,
  updateBrandAsset,
  deleteBrandAsset
} from './lib/veo3BrandKits.js';
import { 
  createVariationBatch,
  startVariationBatchRendering,
  getVariationBatchStatus,
  getUserVariationBatches 
} from './lib/veo3VariationEngine.js';
import { 
  generateThumbnail,
  generateCaptions,
  burnCaptionsIntoVideo,
  generateThumbnailGrid 
} from './lib/veo3FFmpeg.js';
import { 
  createShareableLink,
  getShareableLink,
  getUserShareableLinks,
  updateShareableLink,
  deleteShareableLink,
  getShareableVideoUrl,
  getShareableLinkAnalytics 
} from './lib/veo3ShareableLinks.js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'dummy-key'
);

// Auth middleware
async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

// Apply auth to all routes
router.use(authenticateUser);

// POST /api/veo3/generate - Start video generation
router.post('/generate', 
  createRateLimitMiddleware(),
  createConcurrencyMiddleware(),
  async (req, res) => {
    try {
      const key = req.get("Idempotency-Key") || "";
      const input = VeoPromptZ.parse(req.body);
      const userId = req.user.id;

      // Generate idea hash for idempotency
      const ideaHash = crypto
        .createHash('sha256')
        .update(input.idea + input.goal + input.platform + JSON.stringify(input.visualRefs))
        .digest('hex');
      
      // Check for existing job with same idempotency key and idea hash
      const { data: existingJob } = await supabase
        .from('veo_jobs')
        .select('id, status')
        .eq('user_id', userId)
        .eq('idempotency_key', key)
        .eq('idea_hash', ideaHash)
        .single();

      if (existingJob) {
        return res.json({ 
          jobId: existingJob.id, 
          status: existingJob.status 
        });
      }

      // Build prompt string
      const promptString = buildPromptString(input);
      
      // Create job record
      const jobId = uuidv4();
      const { data: job, error: jobError } = await supabase
        .from('veo_jobs')
        .insert({
          id: jobId,
          user_id: userId,
          idempotency_key: key,
          idea_hash: ideaHash,
          status: 'queued',
          platform: input.platform,
          aspect: input.aspect,
          resolution: input.resolution || (input.aspect === '16:9' ? '1080p' : '720p'),
          prompt_string: promptString,
          config: {
            aspectRatio: input.aspect,
            resolution: input.resolution || (input.aspect === '16:9' ? '1080p' : '720p'),
            negativePrompt: input.negativePrompt || 'low quality, washed out, jittery motion, frame drops',
            seed: input.seed || 0
          },
          asset_refs: input.visualRefs
        })
        .select()
        .single();

      if (jobError) {
        console.error('Error creating job:', jobError);
        return res.status(500).json({ error: 'Failed to create job' });
      }

      // Enqueue job processing
      processJobInBackground(jobId, input, promptString);

      res.json({
        jobId: job.id,
        status: 'queued',
        quota: req.quota
      });

    } catch (error) {
      console.error('Generation error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Invalid input', 
          details: error.errors 
        });
      }
      res.status(500).json({ 
        error: 'Generation failed', 
        message: error.message 
      });
    }
  }
);

// GET /api/veo3/jobs/:id - Get job status
router.get('/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: job, error } = await supabase
      .from('veo_jobs')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      id: job.id,
      status: job.status,
      progress: job.progress,
      platform: job.platform,
      aspect: job.aspect,
      resolution: job.resolution,
      outputUrl: job.output_url,
      errorMessage: job.error_message,
      createdAt: job.created_at,
      startedAt: job.started_at,
      completedAt: job.completed_at
    });

  } catch (error) {
    console.error('Job status error:', error);
    res.status(500).json({ error: 'Failed to get job status' });
  }
});

// GET /api/veo3/jobs/:id/events - SSE for job progress
router.get('/jobs/:id/events', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  let pollInterval = null;

  try {
    // Verify job exists and belongs to user
    const { data: job, error } = await supabase
      .from('veo_jobs')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !job) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Job not found' }));
      return;
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Accel-Buffering': 'no' // Disable nginx buffering
    });

    // Send initial status
    const sendEvent = (data) => {
      if (!res.destroyed) {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    };

    sendEvent({
      type: 'status',
      status: job.status,
      progress: job.progress,
      outputUrl: job.output_url,
      errorMessage: job.error_message
    });

    // If job is already done, close immediately
    if (job.status === 'done' || job.status === 'error') {
      res.end();
      return;
    }

    // Poll for updates every 2 seconds
    pollInterval = setInterval(async () => {
      try {
        const { data: updatedJob, error: pollError } = await supabase
          .from('veo_jobs')
          .select('status, progress, output_url, error_message, completed_at')
          .eq('id', id)
          .eq('user_id', userId)
          .single();

        if (pollError || !updatedJob) {
          sendEvent({ type: 'gone', message: 'Job not found' });
          clearInterval(pollInterval);
          res.end();
          return;
        }

        sendEvent({
          type: 'status',
          status: updatedJob.status,
          progress: updatedJob.progress,
          outputUrl: updatedJob.output_url,
          errorMessage: updatedJob.error_message,
          completedAt: updatedJob.completed_at
        });

        // Close connection if job is done
        if (updatedJob.status === 'done' || updatedJob.status === 'error') {
          clearInterval(pollInterval);
          res.end();
        }
      } catch (pollError) {
        console.error('SSE polling error:', pollError);
        sendEvent({ type: 'error', message: 'Polling failed' });
        clearInterval(pollInterval);
        res.end();
      }
    }, 2000);

    // Send heartbeat every 30 seconds to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (!res.destroyed) {
        sendEvent({ type: 'heartbeat', timestamp: Date.now() });
      }
    }, 30000);

    // Cleanup on client disconnect
    req.on('close', () => {
      if (pollInterval) clearInterval(pollInterval);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    });

    req.on('error', (err) => {
      console.error('SSE connection error:', err);
      if (pollInterval) clearInterval(pollInterval);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    });

  } catch (error) {
    console.error('SSE error:', error);
    if (!res.destroyed) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'SSE failed', message: error.message }));
    }
  }
});

// GET /api/veo3/jobs/:id/download - Download video
router.get('/jobs/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: job, error } = await supabase
      .from('veo_jobs')
      .select('output_url, status')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'done' || !job.output_url) {
      return res.status(400).json({ error: 'Video not ready for download' });
    }

    // Generate new signed URL
    const { data: signedUrlData } = supabase.storage
      .from('renders')
      .createSignedUrl(job.output_url, 3600); // 1 hour expiry

    if (signedUrlData?.signedUrl) {
      res.redirect(302, signedUrlData.signedUrl);
    } else {
      res.status(500).json({ error: 'Failed to generate download URL' });
    }

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// GET /api/veo3/quota - Get user quota info
router.get('/quota', async (req, res) => {
  try {
    const userId = req.user.id;
    const quotaInfo = await getUserQuotaInfo(userId);
    res.json(quotaInfo);
  } catch (error) {
    console.error('Quota info error:', error);
    res.status(500).json({ error: 'Failed to get quota info' });
  }
});

// POST /api/veo3/compose - AI Idea→JSON Composer
router.post('/compose', async (req, res) => {
  try {
    const { idea, goal, platform, brandKitId } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
      return res.status(400).json({ error: 'Idea is required' });
    }

    if (idea.length > 1000) {
      return res.status(400).json({ error: 'Idea must be 1000 characters or less' });
    }

    // Get brand kit if provided
    let brandKit = null;
    if (brandKitId) {
      const { data: brandKitData, error: brandKitError } = await supabase
        .from('veo_brand_kits')
        .select('*')
        .eq('id', brandKitId)
        .eq('user_id', userId)
        .single();

      if (brandKitError || !brandKitData) {
        return res.status(404).json({ error: 'Brand kit not found' });
      }
      brandKit = brandKitData;
    }

    // Compose idea to JSON
    const result = await composeIdeaToJson({
      idea: idea.trim(),
      goal: goal || 'product awareness',
      platform: platform || 'tiktok',
      brandKitId,
      brandKit,
      orgId: user.org_id,
      cache: req.cache
    });

    // Track analytics
    await supabase
      .from('veo_analytics')
      .insert({
        user_id: userId,
        event_type: 'idea_composed',
        metadata: {
          platform: platform || 'tiktok',
          brand_kit_id: brandKitId,
          idea_length: idea.length
        }
      });

    res.json({
      success: true,
      json: result.json,
      prompt: result.prompt
    });

  } catch (error) {
    console.error('Compose error:', error);
    res.status(500).json({ 
      error: 'Failed to compose idea', 
      message: error.message 
    });
  }
});

// =========================
// TEMPLATE LIBRARY ENDPOINTS
// =========================

// POST /api/veo3/templates - Create template
router.post('/templates', async (req, res) => {
  try {
    const userId = req.user.id;
    const template = await createTemplate(userId, req.body);
    res.json(template);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/veo3/templates - Get user templates
router.get('/templates', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;
    const templates = await getUserTemplates(userId, parseInt(limit), parseInt(offset));
    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/veo3/templates/:id - Get specific template
router.get('/templates/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const template = await getTemplate(userId, id);
    res.json(template);
  } catch (error) {
    console.error('Get template error:', error);
    res.status(404).json({ error: error.message });
  }
});

// PUT /api/veo3/templates/:id - Update template
router.put('/templates/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const template = await updateTemplate(userId, id, req.body);
    res.json(template);
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/veo3/templates/:id - Delete template
router.delete('/templates/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await deleteTemplate(userId, id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/veo3/templates/:id/generate - Generate variation from template
router.post('/templates/:id/generate', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { tokenValues } = req.body;
    const result = await generateVariationFromTemplate(userId, id, tokenValues);
    res.json(result);
  } catch (error) {
    console.error('Generate variation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
// BRAND KITS ENDPOINTS
// =========================

// POST /api/veo3/brand-kits - Create brand kit
router.post('/brand-kits', async (req, res) => {
  try {
    const userId = req.user.id;
    const brandKit = await createBrandKit(userId, req.body);
    res.json(brandKit);
  } catch (error) {
    console.error('Create brand kit error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/veo3/brand-kits - Get user brand kits
router.get('/brand-kits', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;
    const brandKits = await getUserBrandKits(userId, parseInt(limit), parseInt(offset));
    res.json(brandKits);
  } catch (error) {
    console.error('Get brand kits error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/veo3/brand-kits/:id - Get specific brand kit
router.get('/brand-kits/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const brandKit = await getBrandKit(userId, id);
    res.json(brandKit);
  } catch (error) {
    console.error('Get brand kit error:', error);
    res.status(404).json({ error: error.message });
  }
});

// PUT /api/veo3/brand-kits/:id - Update brand kit
router.put('/brand-kits/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const brandKit = await updateBrandKit(userId, id, req.body);
    res.json(brandKit);
  } catch (error) {
    console.error('Update brand kit error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/veo3/brand-kits/:id - Delete brand kit
router.delete('/brand-kits/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await deleteBrandKit(userId, id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete brand kit error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/veo3/brand-kits/:id/assets - Upload asset to brand kit
router.post('/brand-kits/:id/assets', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await uploadBrandAsset(userId, id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Upload brand asset error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/veo3/brand-kits/:id/assets - Get brand kit assets
router.get('/brand-kits/:id/assets', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const assets = await getBrandKitAssets(userId, id);
    res.json(assets);
  } catch (error) {
    console.error('Get brand kit assets error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/veo3/brand-kits/:id/assets/:kind - Get assets by kind
router.get('/brand-kits/:id/assets/:kind', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, kind } = req.params;
    const assets = await getBrandAssetsByKind(userId, id, kind);
    res.json(assets);
  } catch (error) {
    console.error('Get brand assets by kind error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/veo3/brand-kits/:id/assets/:assetId - Update brand asset
router.put('/brand-kits/:id/assets/:assetId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { assetId } = req.params;
    const asset = await updateBrandAsset(userId, assetId, req.body);
    res.json(asset);
  } catch (error) {
    console.error('Update brand asset error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/veo3/brand-kits/:id/assets/:assetId - Delete brand asset
router.delete('/brand-kits/:id/assets/:assetId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { assetId } = req.params;
    await deleteBrandAsset(userId, assetId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete brand asset error:', error);
    res.status(500).json({ error: error.message });
  }
});


// =========================
// VARIATION ENGINE ENDPOINTS
// =========================

// POST /api/veo3/variations/batch - Create variation batch
router.post('/variations/batch', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await createVariationBatch(userId, req.body);
    res.json(result);
  } catch (error) {
    console.error('Create variation batch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/veo3/variations/batch/:id/start - Start rendering batch
router.post('/variations/batch/:id/start', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await startVariationBatchRendering(userId, id);
    res.json(result);
  } catch (error) {
    console.error('Start variation batch rendering error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/veo3/variations/batch/:id/status - Get batch status
router.get('/variations/batch/:id/status', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await getVariationBatchStatus(userId, id);
    res.json(result);
  } catch (error) {
    console.error('Get variation batch status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/veo3/variations/batches - Get user's variation batches
router.get('/variations/batches', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;
    const batches = await getUserVariationBatches(userId, parseInt(limit), parseInt(offset));
    res.json(batches);
  } catch (error) {
    console.error('Get user variation batches error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
// FFMPEG ENDPOINTS
// =========================

// POST /api/veo3/jobs/:id/thumbnail - Generate thumbnail
router.post('/jobs/:id/thumbnail', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { timestamp, width, height, quality } = req.body;

    // Verify job belongs to user
    const { data: job, error: jobError } = await supabase
      .from('veo_jobs')
      .select('output_url, status')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'done' || !job.output_url) {
      return res.status(400).json({ error: 'Video not ready' });
    }

    // Generate signed URL for video
    const { data: signedUrlData } = supabase.storage
      .from('renders')
      .createSignedUrl(job.output_url, 3600);

    if (!signedUrlData?.signedUrl) {
      return res.status(500).json({ error: 'Failed to generate video URL' });
    }

    // Generate thumbnail
    const thumbnail = await generateThumbnail(signedUrlData.signedUrl, {
      timestamp,
      width,
      height,
      quality
    });

    // Update job with thumbnail URL
    await supabase
      .from('veo_jobs')
      .update({ thumbnail_url: thumbnail.path })
      .eq('id', id);

    res.json(thumbnail);

  } catch (error) {
    console.error('Generate thumbnail error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/veo3/jobs/:id/captions - Generate captions
router.post('/jobs/:id/captions', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const captionsData = req.body;

    // Verify job belongs to user
    const { data: job, error: jobError } = await supabase
      .from('veo_jobs')
      .select('output_url, status')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'done' || !job.output_url) {
      return res.status(400).json({ error: 'Video not ready' });
    }

    // Generate captions
    const captions = await generateCaptions(job.output_url, captionsData);
    res.json(captions);

  } catch (error) {
    console.error('Generate captions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/veo3/jobs/:id/burn-captions - Burn captions into video
router.post('/jobs/:id/burn-captions', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { captionsData, options } = req.body;

    // Verify job belongs to user
    const { data: job, error: jobError } = await supabase
      .from('veo_jobs')
      .select('output_url, status')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'done' || !job.output_url) {
      return res.status(400).json({ error: 'Video not ready' });
    }

    // Generate signed URL for video
    const { data: signedUrlData } = supabase.storage
      .from('renders')
      .createSignedUrl(job.output_url, 3600);

    if (!signedUrlData?.signedUrl) {
      return res.status(500).json({ error: 'Failed to generate video URL' });
    }

    // Burn captions into video
    const burnedVideo = await burnCaptionsIntoVideo(signedUrlData.signedUrl, captionsData, options);

    // Update job with burned video URL
    await supabase
      .from('veo_jobs')
      .update({ 
        output_url: burnedVideo.path,
        captions_burned_in: true
      })
      .eq('id', id);

    res.json(burnedVideo);

  } catch (error) {
    console.error('Burn captions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
// SHAREABLE LINKS ENDPOINTS
// =========================

// POST /api/veo3/jobs/:id/share - Create shareable link
router.post('/jobs/:id/share', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const options = req.body;
    const link = await createShareableLink(userId, id, options);
    res.json(link);
  } catch (error) {
    console.error('Create shareable link error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/veo3/share/:token - Get shareable link (public)
router.get('/share/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const link = await getShareableLink(token);
    res.json(link);
  } catch (error) {
    console.error('Get shareable link error:', error);
    res.status(404).json({ error: error.message });
  }
});

// GET /api/veo3/share/:token/download - Get video download URL (public)
router.get('/share/:token/download', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.query;
    const result = await getShareableVideoUrl(token, password);
    res.json(result);
  } catch (error) {
    console.error('Get shareable video URL error:', error);
    res.status(404).json({ error: error.message });
  }
});

// GET /api/veo3/shares - Get user's shareable links
router.get('/shares', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;
    const links = await getUserShareableLinks(userId, parseInt(limit), parseInt(offset));
    res.json(links);
  } catch (error) {
    console.error('Get user shareable links error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/veo3/shares/:id - Update shareable link
router.put('/shares/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const link = await updateShareableLink(userId, id, req.body);
    res.json(link);
  } catch (error) {
    console.error('Update shareable link error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/veo3/shares/:id - Delete shareable link
router.delete('/shares/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await deleteShareableLink(userId, id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete shareable link error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/veo3/shares/:id/analytics - Get shareable link analytics
router.get('/shares/:id/analytics', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const analytics = await getShareableLinkAnalytics(userId, id);
    res.json(analytics);
  } catch (error) {
    console.error('Get shareable link analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Background job processing
async function processJobInBackground(jobId, prompt, promptString) {
  try {
    // Check if job is cancelled before starting
    const { data: jobCheck } = await supabase
      .from('veo_jobs')
      .select('cancelled')
      .eq('id', jobId)
      .single();

    if (jobCheck?.cancelled) {
      console.log(`Job ${jobId} is cancelled, skipping processing`);
      return;
    }

    // Update job status to running
    await supabase
      .from('veo_jobs')
      .update({ 
        status: 'running',
        started_at: new Date().toISOString(),
        progress: 10
      })
      .eq('id', jobId);

    // Download first image asset if any
    let imageBytes = null;
    if (prompt.visualRefs?.length > 0) {
      const firstImage = prompt.visualRefs.find(v => 
        v.kind === 'product' || v.kind === 'photo'
      );
      
      if (firstImage?.url) {
        try {
          const imageData = await downloadAndConvertImage(firstImage.url);
          imageBytes = imageData.base64;
        } catch (error) {
          console.warn('Failed to download image for job', jobId, error);
          // Continue without image
        }
      }
    }

    // Check for cancellation before continuing
    const { data: cancelCheck1 } = await supabase
      .from('veo_jobs')
      .select('cancelled')
      .eq('id', jobId)
      .single();

    if (cancelCheck1?.cancelled) {
      console.log(`Job ${jobId} cancelled during image processing`);
      return;
    }

    // Update progress
    await supabase
      .from('veo_jobs')
      .update({ progress: 30 })
      .eq('id', jobId);

    // Start Veo job
    const jobResult = await startVeoJob({
      prompt: promptString,
      imageBytes,
      config: {
        aspectRatio: prompt.aspect,
        resolution: prompt.resolution || (prompt.aspect === '16:9' ? '1080p' : '720p'),
        negativePrompt: prompt.negativePrompt || 'low quality, washed out, jittery motion, frame drops',
        seed: prompt.seed || 0
      }
    });

    // Update job with operation name
    await supabase
      .from('veo_jobs')
      .update({ 
        operation_name: jobResult.jobId,
        progress: 50
      })
      .eq('id', jobId);

    // Check for cancellation before polling
    const { data: cancelCheck2 } = await supabase
      .from('veo_jobs')
      .select('cancelled')
      .eq('id', jobId)
      .single();

    if (cancelCheck2?.cancelled) {
      console.log(`Job ${jobId} cancelled before polling`);
      return;
    }

    // Poll for completion
    const result = await pollVeo(jobResult.jobId, jobId);

    if (result.status === 'completed') {
      // Upload video to storage
      const uploadResult = await uploadVideoToStorage(
        prompt.user_id || 'unknown',
        jobId,
        result.videoUrl
      );

      // Update job as completed
      await supabase
        .from('veo_jobs')
        .update({
          status: 'done',
          progress: 100,
          output_url: uploadResult.path,
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);
    } else if (result.status === 'cancelled') {
      // Update job as cancelled
      await supabase
        .from('veo_jobs')
        .update({
          status: 'error',
          error_message: result.error || 'Job was cancelled',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);
    } else {
      throw new Error('Video generation failed');
    }

  } catch (error) {
    console.error('Job processing error:', error);
    
    // Update job as failed
    await supabase
      .from('veo_jobs')
      .update({
        status: 'error',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);
  }
}

export default router;
