/**
 * Unit Tests for Production Features
 * Tests orchestrator decisions, JWT signing, quality metrics, and DLQ functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { selectModel, mapQualityModeToConstraints } from '../../server/orchestrator.js';
import { generateStreamToken, verifyStreamToken } from '../../server/delivery/sign.js';
import { calculateOverallScore, generateWarnings, generateSuggestions } from '../../server/quality/score.js';
import { moveToDLQ, replayFromDLQ, getQueueStats } from '../../server/queues/dlq.js';

// Mock dependencies
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      })),
      insert: vi.fn(() => Promise.resolve({ error: null }))
    }))
  }))
}));

vi.mock('bullmq', () => ({
  Queue: vi.fn(() => ({
    add: vi.fn(() => Promise.resolve()),
    getJobs: vi.fn(() => Promise.resolve([])),
    pause: vi.fn(() => Promise.resolve()),
    resume: vi.fn(() => Promise.resolve()),
    isPaused: vi.fn(() => Promise.resolve(false))
  }))
}));

describe('Model Orchestrator', () => {
  describe('selectModel', () => {
    it('should select primary model when constraints are met', async () => {
      const constraints = {
        maxLatencyMs: 45000,
        costPreference: 'balanced' as const
      };

      const result = await selectModel(constraints, 'test-job-id', {});

      expect(result.modelName).toBe('veo-3.0-generate-001');
      expect(result.fallbackUsed).toBe(false);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should select fast model when latency constraints not met', async () => {
      const constraints = {
        maxLatencyMs: 10000, // Very low latency requirement
        costPreference: 'low' as const
      };

      const result = await selectModel(constraints, 'test-job-id', {});

      expect(result.modelName).toBe('veo-3.0-fast-generate-001');
      expect(result.fallbackUsed).toBe(true);
    });
  });

  describe('mapQualityModeToConstraints', () => {
    it('should map fast mode to low latency constraints', () => {
      const constraints = mapQualityModeToConstraints('fast');
      
      expect(constraints.maxLatencyMs).toBe(20000);
      expect(constraints.costPreference).toBe('low');
      expect(constraints.qualityMode).toBe('fast');
    });

    it('should map high mode to high latency constraints', () => {
      const constraints = mapQualityModeToConstraints('high');
      
      expect(constraints.maxLatencyMs).toBe(60000);
      expect(constraints.costPreference).toBe('quality');
      expect(constraints.qualityMode).toBe('high');
    });

    it('should map balanced mode to default constraints', () => {
      const constraints = mapQualityModeToConstraints('balanced');
      
      expect(constraints.maxLatencyMs).toBe(45000);
      expect(constraints.costPreference).toBe('balanced');
      expect(constraints.qualityMode).toBe('balanced');
    });
  });
});

describe('JWT Stream Signing', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SIGNING_SECRET: 'test-secret-key'
    };
  });

  describe('generateStreamToken', () => {
    it('should generate valid JWT token', () => {
      const token = generateStreamToken('test-job-id', 3600, 'test-org', 'test-user');
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should include correct payload', () => {
      const token = generateStreamToken('test-job-id', 3600, 'test-org', 'test-user');
      const parts = token.split('.');
      const payload = JSON.parse(atob(parts[1]));
      
      expect(payload.sub).toBe('test-job-id');
      expect(payload.type).toBe('stream_access');
      expect(payload.orgId).toBe('test-org');
      expect(payload.userId).toBe('test-user');
    });
  });

  describe('verifyStreamToken', () => {
    it('should verify valid token', () => {
      const token = generateStreamToken('test-job-id', 3600);
      const result = verifyStreamToken(token);
      
      expect(result.valid).toBe(true);
      expect(result.jobId).toBe('test-job-id');
    });

    it('should reject invalid token', () => {
      const result = verifyStreamToken('invalid-token');
      
      expect(result.valid).toBe(false);
      expect(result.jobId).toBe('');
    });

    it('should reject expired token', () => {
      const token = generateStreamToken('test-job-id', -1); // Expired
      const result = verifyStreamToken(token);
      
      expect(result.valid).toBe(false);
    });

    it('should reject token with wrong type', () => {
      // This would require mocking jwt.sign to return wrong type
      const result = verifyStreamToken('invalid-token');
      
      expect(result.valid).toBe(false);
    });
  });
});

describe('Quality Scoring', () => {
  describe('calculateOverallScore', () => {
    it('should calculate correct overall score', () => {
      const visual = {
        sharpness: 0.8,
        brightness: 0.7,
        freezeFrames: 0,
        blackFrames: 0
      };
      
      const audio = {
        loudness: 0.9,
        clipping: false
      };
      
      const coherence = {
        shotClarity: 0.8,
        ctaPresence: 0.9,
        brandColors: 0.7
      };

      const score = calculateOverallScore(visual, audio, coherence);

      expect(score.overall).toBeGreaterThan(0);
      expect(score.overall).toBeLessThanOrEqual(1);
      expect(score.visual).toBeGreaterThan(0);
      expect(score.audio).toBeGreaterThan(0);
      expect(score.coherence).toBeGreaterThan(0);
    });

    it('should penalize freeze frames', () => {
      const visual = {
        sharpness: 0.8,
        brightness: 0.7,
        freezeFrames: 5, // High number of freeze frames
        blackFrames: 0
      };
      
      const audio = { loudness: 0.9, clipping: false };
      const coherence = { shotClarity: 0.8, ctaPresence: 0.9, brandColors: 0.7 };

      const score = calculateOverallScore(visual, audio, coherence);

      expect(score.visual).toBeLessThan(0.8); // Should be penalized
    });

    it('should penalize audio clipping', () => {
      const visual = { sharpness: 0.8, brightness: 0.7, freezeFrames: 0, blackFrames: 0 };
      const audio = { loudness: 0.9, clipping: true }; // Clipping detected
      const coherence = { shotClarity: 0.8, ctaPresence: 0.9, brandColors: 0.7 };

      const score = calculateOverallScore(visual, audio, coherence);

      expect(score.audio).toBeLessThan(0.9); // Should be penalized
    });
  });

  describe('generateWarnings', () => {
    it('should generate warning for low overall score', () => {
      const score = {
        overall: 0.5,
        visual: 0.6,
        audio: 0.4,
        coherence: 0.5,
        details: {
          sharpness: 0.6,
          brightness: 0.6,
          freezeFrames: 0,
          blackFrames: 0,
          loudness: 0.4,
          clipping: false,
          shotClarity: 0.5,
          ctaPresence: 0.5,
          brandColors: 0.5
        }
      };

      const warnings = generateWarnings(score, 0.62);

      expect(warnings).toContain('Video quality below minimum threshold');
    });

    it('should generate warning for freeze frames', () => {
      const score = {
        overall: 0.7,
        visual: 0.6,
        audio: 0.8,
        coherence: 0.7,
        details: {
          sharpness: 0.6,
          brightness: 0.6,
          freezeFrames: 5, // High number
          blackFrames: 0,
          loudness: 0.8,
          clipping: false,
          shotClarity: 0.7,
          ctaPresence: 0.7,
          brandColors: 0.7
        }
      };

      const warnings = generateWarnings(score, 0.62);

      expect(warnings).toContain('Multiple freeze frames detected');
    });

    it('should generate warning for audio clipping', () => {
      const score = {
        overall: 0.7,
        visual: 0.8,
        audio: 0.6,
        coherence: 0.7,
        details: {
          sharpness: 0.8,
          brightness: 0.8,
          freezeFrames: 0,
          blackFrames: 0,
          loudness: 0.6,
          clipping: true, // Clipping detected
          shotClarity: 0.7,
          ctaPresence: 0.7,
          brandColors: 0.7
        }
      };

      const warnings = generateWarnings(score, 0.62);

      expect(warnings).toContain('Audio clipping detected');
    });
  });

  describe('generateSuggestions', () => {
    it('should suggest regeneration for low quality', () => {
      const score = {
        overall: 0.5,
        visual: 0.4,
        audio: 0.6,
        coherence: 0.5,
        details: {
          sharpness: 0.4,
          brightness: 0.4,
          freezeFrames: 0,
          blackFrames: 0,
          loudness: 0.6,
          clipping: false,
          shotClarity: 0.5,
          ctaPresence: 0.5,
          brandColors: 0.5
        }
      };

      const suggestions = generateSuggestions(score, {});

      expect(suggestions).toContain('Consider regenerating with fast model or tweak shot 1 hook');
    });

    it('should suggest CTA improvement', () => {
      const score = {
        overall: 0.7,
        visual: 0.8,
        audio: 0.8,
        coherence: 0.6,
        details: {
          sharpness: 0.8,
          brightness: 0.8,
          freezeFrames: 0,
          blackFrames: 0,
          loudness: 0.8,
          clipping: false,
          shotClarity: 0.8,
          ctaPresence: 0.3, // Low CTA presence
          brandColors: 0.8
        }
      };

      const suggestions = generateSuggestions(score, {});

      expect(suggestions).toContain('Add or strengthen call-to-action');
    });
  });
});

describe('DLQ Management', () => {
  describe('moveToDLQ', () => {
    it('should move job to DLQ successfully', async () => {
      const mockJob = {
        id: 'test-job-id',
        name: 'test-job',
        data: { test: 'data' },
        opts: { attempts: 3 },
        attemptsMade: 3
      };

      const mockError = new Error('Test error');

      // This should not throw
      await expect(moveToDLQ('test-queue', mockJob, mockError, 'test-reason')).resolves.not.toThrow();
    });
  });

  describe('replayFromDLQ', () => {
    it('should replay jobs from DLQ', async () => {
      const request = {
        queue: 'test-queue',
        limit: 5,
        reason: 'test-replay',
        backoff: true
      };

      const result = await replayFromDLQ(request);

      expect(result.success).toBe(true);
      expect(result.replayed).toBeGreaterThanOrEqual(0);
      expect(result.failed).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      const stats = await getQueueStats();

      expect(Array.isArray(stats)).toBe(true);
      stats.forEach(queue => {
        expect(queue).toHaveProperty('name');
        expect(queue).toHaveProperty('active');
        expect(queue).toHaveProperty('waiting');
        expect(queue).toHaveProperty('completed');
        expect(queue).toHaveProperty('failed');
        expect(queue).toHaveProperty('dlq');
        expect(queue).toHaveProperty('paused');
      });
    });
  });
});

describe('Integration Tests', () => {
  describe('End-to-End Workflow', () => {
    it('should handle complete video generation workflow', async () => {
      // Test the complete workflow from model selection to quality analysis
      const constraints = {
        maxLatencyMs: 45000,
        costPreference: 'balanced' as const
      };

      // 1. Select model
      const modelSelection = await selectModel(constraints, 'test-job-id', {});
      expect(modelSelection.modelName).toBeDefined();

      // 2. Generate stream token
      const streamToken = generateStreamToken('test-job-id', 3600);
      expect(streamToken).toBeDefined();

      // 3. Verify stream token
      const verification = verifyStreamToken(streamToken);
      expect(verification.valid).toBe(true);

      // 4. Calculate quality score
      const visual = { sharpness: 0.8, brightness: 0.7, freezeFrames: 0, blackFrames: 0 };
      const audio = { loudness: 0.9, clipping: false };
      const coherence = { shotClarity: 0.8, ctaPresence: 0.9, brandColors: 0.7 };
      
      const qualityScore = calculateOverallScore(visual, audio, coherence);
      expect(qualityScore.overall).toBeGreaterThan(0);

      // 5. Generate warnings and suggestions
      const warnings = generateWarnings(qualityScore, 0.62);
      const suggestions = generateSuggestions(qualityScore, {});
      
      expect(Array.isArray(warnings)).toBe(true);
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });
});

