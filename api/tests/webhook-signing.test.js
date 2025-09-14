import { describe, it, expect } from 'vitest';
import { sign, verifyWebhookSignature } from '../lib/webhooks.js';

describe('Webhook Signing', () => {
  it('should generate valid signature', () => {
    const payload = { event_type: 'veo.job.completed', job_id: 'test-123' };
    const secret = 'test-secret-key';
    const payloadString = JSON.stringify(payload);
    
    const { header } = sign(payloadString, secret);
    
    expect(header).toMatch(/^t=\d+, s=[a-f0-9]{64}$/);
  });

  it('should verify valid signature', () => {
    const payload = { event_type: 'veo.job.completed', job_id: 'test-123' };
    const secret = 'test-secret-key';
    const payloadString = JSON.stringify(payload);
    
    const { header } = sign(payloadString, secret);
    const isValid = verifyWebhookSignature(payload, header, secret);
    
    expect(isValid).toBe(true);
  });

  it('should reject invalid signature', () => {
    const payload = { event_type: 'veo.job.completed', job_id: 'test-123' };
    const secret = 'test-secret-key';
    const wrongSecret = 'wrong-secret';
    const payloadString = JSON.stringify(payload);
    
    const { header } = sign(payloadString, wrongSecret);
    const isValid = verifyWebhookSignature(payload, header, secret);
    
    expect(isValid).toBe(false);
  });

  it('should reject expired signature', () => {
    const payload = { event_type: 'veo.job.completed', job_id: 'test-123' };
    const secret = 'test-secret-key';
    const payloadString = JSON.stringify(payload);
    
    // Create a signature with old timestamp (6 minutes ago)
    const oldTimestamp = Math.floor(Date.now() / 1000) - 360; // 6 minutes ago
    const oldSignature = `t=${oldTimestamp}, s=invalid`;
    
    const isValid = verifyWebhookSignature(payload, oldSignature, secret);
    
    expect(isValid).toBe(false);
  });

  it('should reject malformed signature', () => {
    const payload = { event_type: 'veo.job.completed', job_id: 'test-123' };
    const secret = 'test-secret-key';
    
    const malformedSignatures = [
      'invalid-format',
      't=123456',
      's=abc123',
      't=abc, s=def',
      't=123456, s=',
      't=, s=abc123'
    ];
    
    malformedSignatures.forEach(signature => {
      const isValid = verifyWebhookSignature(payload, signature, secret);
      expect(isValid).toBe(false);
    });
  });

  it('should handle different payload types', () => {
    const secret = 'test-secret-key';
    
    const testPayloads = [
      { event_type: 'veo.job.created', job_id: 'test-123' },
      { event_type: 'veo.job.completed', job_id: 'test-456', result: { video_url: 'https://example.com/video.mp4' } },
      { event_type: 'veo.batch.completed', batch_id: 'batch-789', job_count: 5 },
      { event_type: 'veo.job.failed', job_id: 'test-999', error: 'Processing failed' }
    ];
    
    testPayloads.forEach(payload => {
      const payloadString = JSON.stringify(payload);
      const { header } = sign(payloadString, secret);
      const isValid = verifyWebhookSignature(payload, header, secret);
      
      expect(isValid).toBe(true);
    });
  });
});

