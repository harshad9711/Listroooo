import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = pino({ 
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty'
  } : undefined
});

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// MIDDLEWARE SETUP
// =========================

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Request logging
app.use(pinoHttp({ logger }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.API_RATE_LIMIT_PER_HOUR || '1000'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// =========================
// AUTHENTICATION MIDDLEWARE
// =========================

// JWT authentication for web users
async function authenticateJWT(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error({ error: error.message }, 'JWT authentication failed');
    res.status(401).json({ error: 'Authentication failed' });
  }
}

// API key authentication for public API
async function requireApiKey(req: any, res: any, next: any) {
  try {
    let apiKey = req.headers['x-api-key'];
    
    // Also check Authorization header
    if (!apiKey && req.headers.authorization?.startsWith('Bearer ')) {
      apiKey = req.headers.authorization.substring(7);
    }

    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    const { authenticateApiKey, checkRateLimit } = await import('./lib/apiKeys');
    const auth = await authenticateApiKey(apiKey);
    
    // Check rate limits
    await checkRateLimit(auth.apiKeyId, req.path, req.method);

    req.auth = auth;
    req.user = { id: auth.userId };
    req.organization = { id: auth.organizationId };
    next();
  } catch (error) {
    logger.error({ error: error.message }, 'API key authentication failed');
    res.status(401).json({ error: 'Invalid API key' });
  }
}

// Organization context middleware
async function requireOrganization(req: any, res: any, next: any) {
  try {
    const { organizationId } = req.params;
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    // Check if user has access to organization
    const { data: member, error } = await supabase
      .from('veo_organization_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', req.user.id)
      .single();
    
    if (error || !member) {
      return res.status(403).json({ error: 'Access denied to organization' });
    }

    req.organization = { id: organizationId, member };
    next();
  } catch (error) {
    logger.error({ error: error.message }, 'Organization context failed');
    res.status(500).json({ error: 'Failed to verify organization access' });
  }
}

// =========================
// ROUTES
// =========================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Internal health check
app.get('/internal/healthz', async (req, res) => {
  try {
    // Check database connection
    const { data, error } = await supabase.from('veo_jobs').select('id').limit(1);
    if (error) throw error;

    // Check queue status
    const { veoStartQ, veoPollQ, veoPostQ } = await import('./queues/veo');
    const [startStats, pollStats, postStats] = await Promise.all([
      veoStartQ.getJobCounts(),
      veoPollQ.getJobCounts(),
      veoPostQ.getJobCounts()
    ]);

    res.json({
      status: 'healthy',
      database: 'connected',
      queues: {
        start: startStats,
        poll: pollStats,
        post: postStats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Health check failed');
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// Internal metrics
app.get('/internal/metrics', authenticateJWT, async (req, res) => {
  try {
    // Simple in-memory counters (in production, use Prometheus)
    const metrics = {
      jobs_created: 0,
      jobs_completed: 0,
      jobs_failed: 0,
      api_requests: 0,
      timestamp: new Date().toISOString()
    };

    res.set('Content-Type', 'text/plain');
    res.send(`
# HELP veo_jobs_created Total number of jobs created
# TYPE veo_jobs_created counter
veo_jobs_created ${metrics.jobs_created}

# HELP veo_jobs_completed Total number of jobs completed
# TYPE veo_jobs_completed counter
veo_jobs_completed ${metrics.jobs_completed}

# HELP veo_jobs_failed Total number of jobs failed
# TYPE veo_jobs_failed counter
veo_jobs_failed ${metrics.jobs_failed}

# HELP veo_api_requests Total number of API requests
# TYPE veo_api_requests counter
veo_api_requests ${metrics.api_requests}
    `);
  } catch (error) {
    logger.error({ error: error.message }, 'Metrics failed');
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// =========================
// API KEY ROUTES
// =========================

app.post('/api/keys', authenticateJWT, requireOrganization, async (req, res) => {
  try {
    const { createApiKey } = await import('./lib/apiKeys');
    const apiKey = await createApiKey(req.organization.id, req.user.id, req.body);
    res.json(apiKey);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create API key');
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/keys', authenticateJWT, requireOrganization, async (req, res) => {
  try {
    const { getApiKeys } = await import('./lib/apiKeys');
    const apiKeys = await getApiKeys(req.organization.id, req.user.id);
    res.json(apiKeys);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get API keys');
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/keys/:keyId', authenticateJWT, requireOrganization, async (req, res) => {
  try {
    const { deleteApiKey } = await import('./lib/apiKeys');
    await deleteApiKey(req.organization.id, req.params.keyId);
    res.json({ success: true });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to delete API key');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// PUBLIC API ROUTES
// =========================

// Video generation (API key or user auth)
app.post('/v1/veo/generate', async (req, res, next) => {
  // Try API key auth first, then JWT
  if (req.headers['x-api-key'] || req.headers.authorization?.startsWith('Bearer ')) {
    return requireApiKey(req, res, next);
  } else {
    return authenticateJWT(req, res, next);
  }
}, async (req, res) => {
  try {
    const { queueManager } = await import('./queues/veo');
    const { trackUsage } = await import('./lib/billing');
    
    // Check quota
    const { data: org, error: orgError } = await supabase
      .from('veo_organizations')
      .select('plan')
      .eq('id', req.organization.id)
      .single();

    if (orgError) {
      throw new Error('Organization not found');
    }

    const plan = org.plan;
    const dailyLimit = plan === 'free' ? 5 : plan === 'pro' ? 100 : 1000;

    // Check today's usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { count: usedToday } = await supabase
      .from('veo_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', req.organization.id)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    if (usedToday >= dailyLimit) {
      return res.status(429).json({ error: 'Daily quota exceeded' });
    }

    // Create job
    const jobId = nanoid();
    const { data: job, error: jobError } = await supabase
      .from('veo_jobs')
      .insert({
        id: jobId,
        organization_id: req.organization.id,
        user_id: req.user.id,
        prompt: req.body.prompt,
        config: req.body.config || {},
        status: 'pending',
        priority: req.body.priority || 0,
        api_key_id: req.auth?.apiKeyId || null,
      })
      .select()
      .single();

    if (jobError) {
      throw new Error(`Failed to create job: ${jobError.message}`);
    }

    // Queue start job
    const { veoStartQ } = await import('./queues/veo');
    await veoStartQ.add('start', {
      jobId,
      organizationId: req.organization.id,
      userId: req.user.id,
      prompt: req.body.prompt,
      config: req.body.config || {},
      priority: req.body.priority || 0
    }, {
      priority: req.body.priority || 0
    });

    // Track usage
    await trackUsage(req.organization.id, req.user.id, jobId, 'render');

    res.json({
      jobId,
      status: 'queued',
      estimated_completion: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create video generation job');
    res.status(500).json({ error: error.message });
  }
});

// Job status (API key or user auth)
app.get('/v1/veo/jobs/:id', async (req, res, next) => {
  // Try API key auth first, then JWT
  if (req.headers['x-api-key'] || req.headers.authorization?.startsWith('Bearer ')) {
    return requireApiKey(req, res, next);
  } else {
    return authenticateJWT(req, res, next);
  }
}, async (req, res) => {
  try {
    const { data: job, error } = await supabase
      .from('veo_jobs')
      .select('*')
      .eq('id', req.params.id)
      .eq('organization_id', req.organization.id)
      .single();

    if (error || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Generate signed URL for video if completed
    let signedVideoUrl = null;
    if (job.status === 'completed' && job.result?.video_url) {
      // In production, generate signed URL here
      signedVideoUrl = job.result.video_url;
    }

    res.json({
      id: job.id,
      status: job.status,
      progress: job.progress,
      result: job.status === 'completed' ? {
        ...job.result,
        video_url: signedVideoUrl
      } : job.result,
      created_at: job.created_at,
      completed_at: job.completed_at,
      error_message: job.error_message
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get job status');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// WEBHOOK ROUTES
// =========================

app.post('/api/webhooks', authenticateJWT, requireOrganization, async (req, res) => {
  try {
    const { createWebhookEndpoint } = await import('./lib/webhooks');
    const webhook = await createWebhookEndpoint(req.organization.id, req.user.id, req.body);
    res.json(webhook);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create webhook');
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/webhooks', authenticateJWT, requireOrganization, async (req, res) => {
  try {
    const { getWebhookEndpoints } = await import('./lib/webhooks');
    const webhooks = await getWebhookEndpoints(req.organization.id, req.user.id);
    res.json(webhooks);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get webhooks');
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/webhooks/:id', authenticateJWT, requireOrganization, async (req, res) => {
  try {
    const { updateWebhookEndpoint } = await import('./lib/webhooks');
    const webhook = await updateWebhookEndpoint(req.organization.id, req.params.id, req.body);
    res.json(webhook);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to update webhook');
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/webhooks/:id', authenticateJWT, requireOrganization, async (req, res) => {
  try {
    const { deleteWebhookEndpoint } = await import('./lib/webhooks');
    await deleteWebhookEndpoint(req.organization.id, req.params.id);
    res.json({ success: true });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to delete webhook');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// STRIPE WEBHOOKS
// =========================

app.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const { handleStripeWebhook } = await import('./lib/billing');
    const { stripe } = await import('./lib/billing');
    
    const signature = req.headers['stripe-signature'] as string;
    const event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
    
    await handleStripeWebhook(event);
    
    res.json({ received: true });
  } catch (error) {
    logger.error({ error: error.message }, 'Stripe webhook failed');
    res.status(400).json({ error: error.message });
  }
});

// =========================
// BACKWARDS COMPATIBLE ROUTES
// =========================

// Keep existing routes for backwards compatibility
app.post('/api/veo3/generate', authenticateJWT, async (req, res) => {
  // Redirect to new API
  req.organization = { id: req.user.id }; // Use user ID as org ID for backwards compatibility
  return app._router.handle({ ...req, url: '/v1/veo/generate', method: 'POST' }, res);
});

app.get('/api/veo3/jobs/:id', authenticateJWT, async (req, res) => {
  // Redirect to new API
  req.organization = { id: req.user.id }; // Use user ID as org ID for backwards compatibility
  return app._router.handle({ ...req, url: `/v1/veo/jobs/${req.params.id}`, method: 'GET' }, res);
});

// =========================
// ERROR HANDLING
// =========================

app.use((err: any, req: any, res: any, next: any) => {
  logger.error({ error: err.message, stack: err.stack }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req: any, res: any) => {
  res.status(404).json({ error: 'Not found' });
});

// =========================
// SERVER STARTUP
// =========================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV }, 'Production server started');
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down server...');
  process.exit(0);
});

export default app;
