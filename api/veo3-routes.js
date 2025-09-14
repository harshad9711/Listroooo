import express from 'express';
import { 
  startVeoJob, 
  pollVeo, 
  downloadAndConvertImage
} from './lib/veo3Client.js';

const router = express.Router();

// In-memory job storage (in production, use a database)
const jobs = new Map();

// Auth helper (reuse from existing veo-routes.js)
async function getUserId(req) {
  try {
    // Get from Authorization header with Supabase JWT
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Verify Supabase JWT token
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY,
        { auth: { persistSession: false } }
      );
      
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        return user.id;
      }
    }
    
    // Fallback: Get user ID from request headers
    const userId = req.headers['x-user-id'];
    if (userId) return userId;
    
  } catch (error) {
    console.error('Auth error:', error);
  }
  
  // Fallback to demo user for development
  return "demo-user";
}

// POST /api/veo3/generate - Start video generation
router.post('/generate', async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { prompt, config = {} } = req.body;

    // Validate request
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Basic validation
    if (!prompt.idea || prompt.idea.length < 5) {
      return res.status(400).json({ 
        error: 'Invalid prompt', 
        details: ['Idea must be at least 5 characters long'] 
      });
    }

    // Check if we have an image for image-to-video
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
          console.warn('Failed to convert image for image-to-video:', error);
          // Continue without image
        }
      }
    }

    // Start the Veo job
    const jobResult = await startVeoJob({
      prompt: prompt.idea,
      imageBytes,
      config: {
        aspectRatio: prompt.aspect,
        resolution: prompt.resolution || (prompt.aspect === '16:9' ? '1080p' : '720p'),
        negativePrompt: prompt.negativePrompt,
        seed: prompt.seed || 0
      }
    });

    // Store job in memory
    const job = {
      id: jobResult.jobId,
      userId,
      status: 'processing',
      prompt,
      config: jobResult.config,
      result: null,
      error: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      operation: jobResult.operation
    };

    jobs.set(job.id, job);

    // Start polling in background (don't await)
    pollJobInBackground(job.id);

    res.json({
      jobId: job.id,
      status: 'processing',
      estimatedTime: jobResult.estimatedTime
    });

  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ 
      error: 'Generation failed', 
      message: error.message 
    });
  }
});

// GET /api/veo3/status/:jobId - Get job status
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = await getUserId(req);

    const job = jobs.get(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user owns this job
    if (job.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      jobId: job.id,
      status: job.status,
      progress: job.status === 'processing' ? 50 : (job.status === 'completed' ? 100 : 0),
      result: job.result,
      error: job.error,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      error: 'Status check failed', 
      message: error.message 
    });
  }
});

// GET /api/veo3/jobs - Get user's jobs
router.get('/jobs', async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { limit = 20, offset = 0 } = req.query;

    // Get user's jobs from memory
    const userJobs = Array.from(jobs.values())
      .filter(job => job.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      jobs: userJobs,
      total: userJobs.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Jobs fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch jobs', 
      message: error.message 
    });
  }
});

// DELETE /api/veo3/jobs/:jobId - Delete a job
router.delete('/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = await getUserId(req);

    const job = jobs.get(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    jobs.delete(jobId);

    res.json({ 
      success: true, 
      message: 'Job deleted successfully' 
    });

  } catch (error) {
    console.error('Job deletion error:', error);
    res.status(500).json({ 
      error: 'Failed to delete job', 
      message: error.message 
    });
  }
});

// Background job polling function
async function pollJobInBackground(jobId) {
  try {
    const job = jobs.get(jobId);
    if (!job) return;

    // Poll the operation
    const result = await pollVeo(job.operation);
    
    // Update job with result
    job.status = result.status;
    job.result = result.status === 'completed' ? {
      videoUrl: result.videoUrl,
      thumbnailUrl: result.thumbnailUrl,
      duration: result.duration
    } : null;
    job.error = result.status === 'failed' ? result.error : null;
    job.updatedAt = new Date().toISOString();

    jobs.set(jobId, job);

  } catch (error) {
    console.error('Background polling error:', error);
    
    // Mark job as failed
    const job = jobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = error.message;
      job.updatedAt = new Date().toISOString();
      jobs.set(jobId, job);
    }
  }
}

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    activeJobs: jobs.size
  });
});

export default router;
