import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
const mockSupabase = {
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: { id: 'test-id' }, error: null }),
    update: () => ({ data: { id: 'test-id' }, error: null }),
    delete: () => ({ error: null }),
    eq: () => ({ data: [], error: null }),
    single: () => ({ data: { id: 'test-id' }, error: null })
  })
};

// Mock the Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase
}));

// Mock the queue system
vi.mock('../queues/veo.js', () => ({
  veoStartQ: {
    add: vi.fn().mockResolvedValue({ id: 'test-job-id' }),
    getJobCounts: vi.fn().mockResolvedValue({ waiting: 0, active: 0, completed: 0, failed: 0 })
  },
  veoPollQ: {
    add: vi.fn().mockResolvedValue({ id: 'test-job-id' }),
    getJobCounts: vi.fn().mockResolvedValue({ waiting: 0, active: 0, completed: 0, failed: 0 })
  },
  veoPostQ: {
    add: vi.fn().mockResolvedValue({ id: 'test-job-id' }),
    getJobCounts: vi.fn().mockResolvedValue({ waiting: 0, active: 0, completed: 0, failed: 0 })
  }
}));

// Mock external APIs
vi.mock('node-fetch', () => ({
  default: vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ access_token: 'test-token', expires_in: 3600 })
  })
}));

// Mock FFmpeg
vi.mock('fluent-ffmpeg', () => ({
  default: vi.fn(() => ({
    input: vi.fn().mockReturnThis(),
    output: vi.fn().mockReturnThis(),
    outputOptions: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    run: vi.fn()
  }))
}));

describe('Publishing Features', () => {
  let app;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create test app
    app = createTestApp();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('OAuth System', () => {
    it('should generate auth URL for TikTok', async () => {
      const response = await request(app)
        .get('/api/oauth/tiktok/connect')
        .query({ orgId: 'test-org-id' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('authUrl');
      expect(response.body.authUrl).toContain('tiktok.com');
    });

    it('should generate auth URL for Meta', async () => {
      const response = await request(app)
        .get('/api/oauth/meta/connect')
        .query({ orgId: 'test-org-id' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('authUrl');
      expect(response.body.authUrl).toContain('facebook.com');
    });

    it('should generate auth URL for YouTube', async () => {
      const response = await request(app)
        .get('/api/oauth/youtube/connect')
        .query({ orgId: 'test-org-id' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('authUrl');
      expect(response.body.authUrl).toContain('accounts.google.com');
    });

    it('should handle OAuth callback', async () => {
      const response = await request(app)
        .get('/api/oauth/tiktok/callback')
        .query({ code: 'test-code', state: 'test-state' });

      expect(response.status).toBe(302); // Redirect
    });

    it('should get OAuth connections', async () => {
      const response = await request(app)
        .get('/api/oauth/connections')
        .query({ orgId: 'test-org-id' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Publishing Pipeline', () => {
    it('should create publish job', async () => {
      const publishData = {
        veoJobId: 'test-veo-job-id',
        orgId: 'test-org-id',
        provider: 'tiktok',
        caption: 'Test caption',
        hashtags: ['#test', '#video']
      };

      const response = await request(app)
        .post('/api/publishing/jobs')
        .send(publishData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('publishJobId');
      expect(response.body).toHaveProperty('status', 'queued');
    });

    it('should get publish jobs', async () => {
      const response = await request(app)
        .get('/api/publishing/jobs')
        .query({ orgId: 'test-org-id' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should cancel publish job', async () => {
      const response = await request(app)
        .delete('/api/publishing/jobs/test-job-id');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should schedule publish job', async () => {
      const scheduleData = {
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post('/api/publishing/jobs/test-job-id/schedule')
        .send(scheduleData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should get publishing analytics', async () => {
      const response = await request(app)
        .get('/api/publishing/analytics')
        .query({ orgId: 'test-org-id' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('byStatus');
      expect(response.body).toHaveProperty('byProvider');
    });
  });

  describe('Content Moderation', () => {
    it('should moderate text content', async () => {
      const moderationData = {
        veoJobId: 'test-veo-job-id',
        orgId: 'test-org-id',
        contentType: 'prompt',
        content: 'This is a test prompt'
      };

      const response = await request(app)
        .post('/api/moderation/moderate')
        .send(moderationData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toHaveProperty('status');
    });

    it('should get moderation results', async () => {
      const response = await request(app)
        .get('/api/moderation/results')
        .query({ orgId: 'test-org-id' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should update moderation result', async () => {
      const updateData = {
        status: 'approved',
        reviewedBy: 'test-admin-id'
      };

      const response = await request(app)
        .put('/api/moderation/results/test-result-id')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should get moderation dashboard', async () => {
      const response = await request(app)
        .get('/api/moderation/dashboard')
        .query({ orgId: 'test-org-id' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('byStatus');
      expect(response.body).toHaveProperty('byContentType');
    });
  });

  describe('Localization', () => {
    it('should localize content', async () => {
      const localizationData = {
        veoJobId: 'test-veo-job-id',
        orgId: 'test-org-id',
        locale: 'es',
        content: 'This is a test caption',
        type: 'caption'
      };

      const response = await request(app)
        .post('/api/localization/localize')
        .send(localizationData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('result');
    });

    it('should get available voices', async () => {
      const response = await request(app)
        .get('/api/localization/voices')
        .query({ locale: 'en' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('voices');
      expect(Array.isArray(response.body.voices)).toBe(true);
    });

    it('should translate text', async () => {
      const translationData = {
        text: 'Hello world',
        targetLocale: 'es'
      };

      const response = await request(app)
        .post('/api/localization/translate')
        .send(translationData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('translated');
    });

    it('should generate TTS', async () => {
      const ttsData = {
        text: 'Hello world',
        locale: 'en',
        voice: 'en-US-Standard-A'
      };

      const response = await request(app)
        .post('/api/localization/tts/generate')
        .send(ttsData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('audio');
      expect(response.body).toHaveProperty('format', 'mp3');
    });
  });

  describe('Prompt Versioning', () => {
    it('should create prompt snapshot', async () => {
      const snapshotData = {
        orgId: 'test-org-id',
        userId: 'test-user-id',
        jsonPrompt: { text: 'Test prompt' },
        promptString: 'Test prompt',
        config: { duration: 8 }
      };

      const response = await request(app)
        .post('/api/prompt-versioning/snapshots')
        .send(snapshotData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('snapshot');
    });

    it('should get prompt snapshots', async () => {
      const response = await request(app)
        .get('/api/prompt-versioning/snapshots')
        .query({ orgId: 'test-org-id' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reproduce prompt', async () => {
      const reproduceData = {
        snapshotId: 'test-snapshot-id',
        orgId: 'test-org-id',
        userId: 'test-user-id',
        variations: { duration: 10 }
      };

      const response = await request(app)
        .post('/api/prompt-versioning/reproduce')
        .send(reproduceData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('newJobId');
    });

    it('should compare prompt versions', async () => {
      const response = await request(app)
        .get('/api/prompt-versioning/compare/test-snapshot-1/test-snapshot-2');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('differences');
      expect(response.body).toHaveProperty('similarity');
    });
  });

  describe('A/B Experimentation', () => {
    it('should create campaign', async () => {
      const campaignData = {
        orgId: 'test-org-id',
        name: 'Test Campaign',
        description: 'Test campaign description',
        budgetCents: 10000,
        targetPlatforms: ['tiktok', 'meta']
      };

      const response = await request(app)
        .post('/api/experimentation/campaigns')
        .send(campaignData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('campaign');
    });

    it('should create experiment', async () => {
      const experimentData = {
        campaignId: 'test-campaign-id',
        orgId: 'test-org-id',
        name: 'Test Experiment',
        trafficSplit: 0.5
      };

      const response = await request(app)
        .post('/api/experimentation/experiments')
        .send(experimentData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('experiment');
    });

    it('should start experiment', async () => {
      const response = await request(app)
        .post('/api/experimentation/experiments/test-experiment-id/start');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should assign user to experiment', async () => {
      const response = await request(app)
        .post('/api/experimentation/experiments/test-experiment-id/assign')
        .send({ userId: 'test-user-id' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('variant');
      expect(['control', 'variant']).toContain(response.body.variant);
    });

    it('should track performance metrics', async () => {
      const metricsData = {
        veoJobId: 'test-veo-job-id',
        orgId: 'test-org-id',
        platform: 'tiktok',
        externalPostId: 'test-post-id',
        metrics: {
          views: 1000,
          likes: 50,
          shares: 10,
          comments: 5,
          engagement_rate: 0.065
        }
      };

      const response = await request(app)
        .post('/api/experimentation/performance/track')
        .send(metricsData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Admin Tools', () => {
    it('should get audit logs', async () => {
      const response = await request(app)
        .get('/api/admin/audit/logs')
        .query({ orgId: 'test-org-id' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should log audit event', async () => {
      const auditData = {
        action: 'test_action',
        resourceType: 'test_resource',
        resourceId: 'test-resource-id',
        details: { test: 'data' },
        orgId: 'test-org-id',
        userId: 'test-user-id'
      };

      const response = await request(app)
        .post('/api/admin/audit/log')
        .send(auditData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should get system health', async () => {
      const response = await request(app)
        .get('/api/admin/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('redis');
      expect(response.body).toHaveProperty('queues');
    });

    it('should get system metrics', async () => {
      const response = await request(app)
        .get('/api/admin/metrics');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalJobs');
      expect(response.body).toHaveProperty('activeJobs');
      expect(response.body).toHaveProperty('completedJobs');
    });

    it('should get admin dashboard', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('recentLogs');
      expect(response.body).toHaveProperty('pendingApprovals');
    });
  });
});

// Helper function to create test app
function createTestApp() {
  const express = require('express');
  const app = express();
  
  app.use(express.json());
  
  // Add routes
  app.use('/api/oauth', require('../routes/oauth'));
  app.use('/api/publishing', require('../routes/publishing'));
  app.use('/api/moderation', require('../routes/moderation'));
  app.use('/api/localization', require('../routes/localization'));
  app.use('/api/prompt-versioning', require('../routes/promptVersioning'));
  app.use('/api/experimentation', require('../routes/experimentation'));
  app.use('/api/admin', require('../routes/admin'));
  
  return app;
}

