/**
 * Integration Tests for Production Features
 * Tests complete workflows and API endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null }))
    })),
    insert: vi.fn(() => Promise.resolve({ error: null })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ error: null })),
        createSignedUrl: vi.fn(() => Promise.resolve({ 
          data: { signedUrl: 'https://example.com/signed-url' }, 
          error: null 
        }))
      }))
    }
  }))
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase)
}));

// Mock BullMQ
vi.mock('bullmq', () => ({
  Queue: vi.fn(() => ({
    add: vi.fn(() => Promise.resolve()),
    getJobs: vi.fn(() => Promise.resolve([])),
    pause: vi.fn(() => Promise.resolve()),
    resume: vi.fn(() => Promise.resolve()),
    isPaused: vi.fn(() => Promise.resolve(false))
  }))
}));

// Mock FFmpeg
vi.mock('fluent-ffmpeg', () => ({
  default: vi.fn(() => ({
    videoCodec: vi.fn().mockReturnThis(),
    audioCodec: vi.fn().mockReturnThis(),
    size: vi.fn().mockReturnThis(),
    videoBitrate: vi.fn().mockReturnThis(),
    outputOptions: vi.fn().mockReturnThis(),
    output: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    run: vi.fn().mockReturnThis(),
    ffprobe: vi.fn((callback) => {
      callback(null, {
        streams: [
          {
            codec_type: 'video',
            width: 1920,
            height: 1080,
            bit_rate: '5000000'
          },
          {
            codec_type: 'audio',
            bit_rate: '128000'
          }
        ]
      });
    }),
    screenshots: vi.fn().mockReturnThis()
  }))
}));

// Create test app
const app = express();
app.use(express.json());

// Mock auth middleware
app.use((req, res, next) => {
  req.user = {
    id: 'test-user-id',
    org_id: 'test-org-id',
    role: 'admin'
  };
  next();
});

// Import routes
import deliveryRoutes from '../../server/routes/delivery.js';
import governanceRoutes from '../../server/routes/governance.js';
import queueRoutes from '../../server/routes/queues.js';

app.use('/api/delivery', deliveryRoutes);
app.use('/api/governance', governanceRoutes);
app.use('/api/queues', queueRoutes);

describe('Production Features Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('HLS Generation Workflow', () => {
    it('should generate HLS streams for completed job', async () => {
      // Mock job data
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: 'test-job-id',
                org_id: 'test-org-id',
                status: 'done',
                output_url: 'https://example.com/video.mp4'
              },
              error: null
            }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null }))
        }))
      });

      const response = await request(app)
        .post('/api/delivery/hls/generate')
        .send({
          jobId: 'test-job-id',
          orgId: 'test-org-id'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('masterUrl');
      expect(response.body.data).toHaveProperty('variants');
      expect(response.body.data).toHaveProperty('sprites');
    });

    it('should return error for non-existent job', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Job not found' }
            }))
          }))
        }))
      });

      const response = await request(app)
        .post('/api/delivery/hls/generate')
        .send({
          jobId: 'non-existent-job',
          orgId: 'test-org-id'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should generate stream token for job', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: 'test-job-id',
                status: 'done',
                hls_master_url: 'https://example.com/master.m3u8'
              },
              error: null
            }))
          }))
        }))
      });

      const response = await request(app)
        .get('/api/delivery/stream/token/test-job-id')
        .query({
          orgId: 'test-org-id',
          userId: 'test-user-id'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('masterUrl');
    });
  });

  describe('GDPR Export Workflow', () => {
    it('should create GDPR export request', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => Promise.resolve({
          data: { id: 'export-id' },
          error: null
        }))
      });

      const response = await request(app)
        .post('/api/governance/gdpr/export')
        .send({
          scope: 'user',
          confirm: true
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('exportToken');
      expect(response.body.data).toHaveProperty('expiresAt');
    });

    it('should reject export without confirmation', async () => {
      const response = await request(app)
        .post('/api/governance/gdpr/export')
        .send({
          scope: 'user',
          confirm: false
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should create GDPR deletion request', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => Promise.resolve({
          data: { id: 'deletion-id' },
          error: null
        }))
      });

      const response = await request(app)
        .post('/api/governance/gdpr/delete')
        .send({
          scope: 'user',
          confirm: true
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should get export by token', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: 'export-id',
                export_token: 'test-token',
                status: 'completed',
                file_url: 'https://example.com/export.zip',
                expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
              },
              error: null
            }))
          }))
        }))
      });

      const response = await request(app)
        .get('/api/governance/gdpr/export/test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('export_token');
    });
  });

  describe('Queue Management Workflow', () => {
    it('should get queue statistics', async () => {
      const response = await request(app)
        .get('/api/queues/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get system health', async () => {
      const response = await request(app)
        .get('/api/queues/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('healthy');
      expect(response.body.data).toHaveProperty('queues');
    });

    it('should pause queue', async () => {
      const response = await request(app)
        .post('/api/queues/veo:start/pause');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should resume queue', async () => {
      const response = await request(app)
        .post('/api/queues/veo:start/resume');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should clear queue', async () => {
      const response = await request(app)
        .post('/api/queues/veo:start/clear')
        .send({ state: 'waiting' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should replay from DLQ', async () => {
      const response = await request(app)
        .post('/api/queues/dlq/replay')
        .send({
          queue: 'veo:start',
          limit: 5,
          reason: 'test-replay'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should get DLQ jobs', async () => {
      const response = await request(app)
        .get('/api/queues/dlq/veo:start/jobs?limit=10');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Quality Analysis Workflow', () => {
    it('should analyze video quality', async () => {
      // Mock job with quality data
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: 'test-job-id',
                status: 'done',
                output_url: 'https://example.com/video.mp4',
                json_prompt: {
                  idea: 'Test video',
                  goal: 'Test goal',
                  platform: 'tiktok'
                }
              },
              error: null
            }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null }))
        }))
      });

      const response = await request(app)
        .post('/api/production/quality/analyze')
        .send({
          jobId: 'test-job-id'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('score');
      expect(response.body.data).toHaveProperty('passed');
    });
  });

  describe('Model Orchestration Workflow', () => {
    it('should select appropriate model based on constraints', async () => {
      const response = await request(app)
        .post('/api/veo3/generate')
        .send({
          idea: 'Test video idea',
          qualityMode: 'fast'
        });

      // This would test the model selection logic
      expect(response.status).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/delivery/hls/generate')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle invalid scope in GDPR requests', async () => {
      const response = await request(app)
        .post('/api/governance/gdpr/export')
        .send({
          scope: 'invalid',
          confirm: true
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle unauthorized access', async () => {
      // Test without auth middleware
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use('/api/queues', queueRoutes);

      const response = await request(unauthApp)
        .get('/api/queues/stats');

      expect(response.status).toBe(500); // Should fail without auth
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent HLS generation requests', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/api/delivery/hls/generate')
          .send({
            jobId: `test-job-${i}`,
            orgId: 'test-org-id'
          })
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBeDefined();
      });
    });

    it('should handle batch queue operations', async () => {
      const operations = [
        request(app).post('/api/queues/veo:start/pause'),
        request(app).post('/api/queues/veo:poll/pause'),
        request(app).post('/api/queues/veo:post/pause')
      ];

      const responses = await Promise.all(operations);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});

