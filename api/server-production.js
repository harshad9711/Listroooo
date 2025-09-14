import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

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
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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
async function authenticateJWT(req, res, next) {
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
async function authenticateAPIKey(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    const { authenticateApiKey, checkRateLimit } = await import('./lib/apiKeys.js');
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
async function requireOrganization(req, res, next) {
  try {
    const { organizationId } = req.params;
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    // Check if user has access to organization
    const { getOrganizationMember } = await import('./lib/organizations.js');
    const member = await getOrganizationMember(organizationId, req.user.id);
    
    if (!member) {
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

// =========================
// WEB ROUTES (JWT Auth)
// =========================

// Import existing Veo 3 routes
import veo3Routes from './veo3-production-routes.js';

// Apply JWT auth to web routes
app.use('/api/veo3', authenticateJWT, veo3Routes);

// =========================
// ORGANIZATION ROUTES
// =========================

// Organizations
app.post('/api/organizations', authenticateJWT, async (req, res) => {
  try {
    const { createOrganization } = await import('./lib/organizations.js');
    const organization = await createOrganization(req.user.id, req.body);
    res.json(organization);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create organization');
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/organizations', authenticateJWT, async (req, res) => {
  try {
    const { getUserOrganizations } = await import('./lib/organizations.js');
    const organizations = await getUserOrganizations(req.user.id);
    res.json(organizations);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get organizations');
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/organizations/:organizationId', authenticateJWT, requireOrganization, async (req, res) => {
  try {
    const { getOrganization } = await import('./lib/organizations.js');
    const organization = await getOrganization(req.params.organizationId);
    res.json(organization);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get organization');
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/organizations/:organizationId', authenticateJWT, requireOrganization, async (req, res) => {
  try {
    const { updateOrganization } = await import('./lib/organizations.js');
    const organization = await updateOrganization(req.params.organizationId, req.user.id, req.body);
    res.json(organization);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to update organization');
    res.status(500).json({ error: error.message });
  }
});

// Members
app.post('/api/organizations/:organizationId/members', authenticateJWT, requireOrganization, async (req, res) => {
  try {
    const { addMember } = await import('./lib/organizations.js');
    const member = await addMember(req.params.organizationId, req.user.id, req.body);
    res.json(member);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to add member');
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/organizations/:organizationId/members', authenticateJWT, requireOrganization, async (req, res) => {
  try {
    const { getOrganizationMembers } = await import('./lib/organizations.js');
    const members = await getOrganizationMembers(req.params.organizationId, req.user.id);
    res.json(members);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get members');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// API KEY ROUTES
// =========================

app.post('/api/organizations/:organizationId/api-keys', authenticateJWT, requireOrganization, async (req, res) => {
  try {
    const { createApiKey } = await import('./lib/apiKeys.js');
    const apiKey = await createApiKey(req.params.organizationId, req.user.id, req.body);
    res.json(apiKey);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create API key');
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/organizations/:organizationId/api-keys', authenticateJWT, requireOrganization, async (req, res) => {
  try {
    const { getApiKeys } = await import('./lib/apiKeys.js');
    const apiKeys = await getApiKeys(req.params.organizationId, req.user.id);
    res.json(apiKeys);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get API keys');
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/organizations/:organizationId/api-keys/:keyId', authenticateJWT, requireOrganization, async (req, res) => {
  try {
    const { deleteApiKey } = await import('./lib/apiKeys.js');
    await deleteApiKey(req.params.organizationId, req.params.keyId);
    res.json({ success: true });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to delete API key');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// WEBHOOK ROUTES
// =========================

app.post('/api/organizations/:organizationId/webhooks', authenticateJWT, requireOrganization, async (req, res) => {
  try {
    const { createWebhookEndpoint } = await import('./lib/webhooks.js');
    const webhook = await createWebhookEndpoint(req.params.organizationId, req.user.id, req.body);
    res.json(webhook);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create webhook');
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/organizations/:organizationId/webhooks', authenticateJWT, requireOrganization, async (req, res) => {
  try {
    const { getWebhookEndpoints } = await import('./lib/webhooks.js');
    const webhooks = await getWebhookEndpoints(req.params.organizationId, req.user.id);
    res.json(webhooks);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get webhooks');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// BILLING ROUTES
// =========================

app.get('/api/organizations/:organizationId/billing/usage', authenticateJWT, requireOrganization, async (req, res) => {
  try {
    const { getStorageUsage } = await import('./lib/cdn.js');
    const usage = await getStorageUsage(req.params.organizationId);
    res.json(usage);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get usage');
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/organizations/:organizationId/billing/customers', authenticateJWT, requireOrganization, async (req, res) => {
  try {
    const { createStripeCustomer } = await import('./lib/billing.js');
    const customer = await createStripeCustomer(req.params.organizationId, req.body);
    res.json(customer);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create customer');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// PUBLIC API ROUTES (API Key Auth)
// =========================

// Public API for video generation
app.post('/api/v1/videos/generate', authenticateAPIKey, async (req, res) => {
  try {
    const { queueManager, JOB_TYPES } = await import('./lib/queue.js');
    const { trackUsage } = await import('./lib/billing.js');
    
    // Check quota
    const { checkQuota } = await import('./lib/billing.js');
    const quota = await checkQuota(req.organization.id, req.user.id);
    
    if (!quota.canRender) {
      return res.status(429).json({ error: 'Quota exceeded' });
    }

    // Create job
    const job = await queueManager.addJob('videoGeneration', JOB_TYPES.GENERATE_VIDEO, {
      organizationId: req.organization.id,
      userId: req.user.id,
      prompt: req.body.prompt,
      config: req.body.config,
    });

    // Track usage
    await trackUsage(req.organization.id, req.user.id, job.id, 'render');

    res.json({
      job_id: job.id,
      status: 'queued',
      estimated_completion: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create video generation job');
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/videos/:jobId/status', authenticateAPIKey, async (req, res) => {
  try {
    const { queueManager } = await import('./lib/queue.js');
    const status = await queueManager.getJobStatus('videoGeneration', req.params.jobId);
    
    if (!status) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(status);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get job status');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// STRIPE WEBHOOKS
// =========================

app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const { handleStripeWebhook } = await import('./lib/billing.js');
    const { stripe } = await import('./lib/billing.js');
    
    const signature = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    
    await handleStripeWebhook(event);
    
    res.json({ received: true });
  } catch (error) {
    logger.error({ error: error.message }, 'Stripe webhook failed');
    res.status(400).json({ error: error.message });
  }
});

// =========================
// ERROR HANDLING
// =========================

app.use((err, req, res, next) => {
  logger.error({ error: err.message, stack: err.stack }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
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

