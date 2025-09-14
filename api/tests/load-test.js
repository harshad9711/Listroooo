/**
 * k6 Load Test Script
 * Tests API performance under load
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    error_rate: ['rate<0.1'],          // Error rate under 10%
    response_time: ['p(95)<2000'],     // 95% response time under 2s
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';

// Test data
const testPrompts = [
  {
    idea: 'A beautiful sunset over mountains',
    goal: 'brand awareness',
    platform: 'tiktok'
  },
  {
    idea: 'Product showcase for new smartphone',
    goal: 'product launch',
    platform: 'instagram'
  },
  {
    idea: 'Behind the scenes of our office',
    goal: 'company culture',
    platform: 'youtube'
  },
  {
    idea: 'Tutorial on how to use our app',
    goal: 'education',
    platform: 'tiktok'
  },
  {
    idea: 'Customer testimonial video',
    goal: 'social proof',
    platform: 'instagram'
  }
];

export default function() {
  // Test 1: Health check
  testHealthCheck();
  
  // Test 2: Video generation
  testVideoGeneration();
  
  // Test 3: Job status check
  testJobStatus();
  
  // Test 4: HLS generation
  testHLSGeneration();
  
  // Test 5: Quality analysis
  testQualityAnalysis();
  
  // Test 6: Attribution tracking
  testAttributionTracking();
  
  sleep(1);
}

function testHealthCheck() {
  const response = http.get(`${BASE_URL}/internal/ping`);
  
  const success = check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 500ms': (r) => r.timings.duration < 500,
    'health check returns JSON': (r) => r.json('status') !== undefined,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

function testVideoGeneration() {
  const prompt = testPrompts[Math.floor(Math.random() * testPrompts.length)];
  
  const payload = JSON.stringify({
    idea: prompt.idea,
    goal: prompt.goal,
    platform: prompt.platform,
    durationSec: 8,
    visualRefs: [],
    shotPlan: [
      {
        startTime: 0,
        endTime: 2,
        description: 'Opening shot',
        camera: 'wide',
        action: 'establish'
      }
    ],
    audio: {
      voiceover: {
        script: 'Test voiceover',
        tone: 'energetic',
        pace: 'medium'
      }
    },
    cta: 'Learn more'
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Idempotency-Key': `load-test-${Date.now()}-${Math.random()}`
    },
  };
  
  const response = http.post(`${BASE_URL}/api/veo3/generate`, payload, params);
  
  const success = check(response, {
    'video generation status is 200': (r) => r.status === 200,
    'video generation response time < 5s': (r) => r.timings.duration < 5000,
    'video generation returns job ID': (r) => r.json('jobId') !== undefined,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  
  // Store job ID for later tests
  if (success) {
    __ENV.JOB_ID = response.json('jobId');
  }
}

function testJobStatus() {
  const jobId = __ENV.JOB_ID;
  if (!jobId) return;
  
  const response = http.get(`${BASE_URL}/api/veo3/jobs/${jobId}`, {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
  });
  
  const success = check(response, {
    'job status check is 200': (r) => r.status === 200,
    'job status response time < 1s': (r) => r.timings.duration < 1000,
    'job status returns valid data': (r) => r.json('status') !== undefined,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

function testHLSGeneration() {
  const jobId = __ENV.JOB_ID;
  if (!jobId) return;
  
  const payload = JSON.stringify({ jobId });
  
  const response = http.post(`${BASE_URL}/api/production/hls/generate`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
  });
  
  const success = check(response, {
    'HLS generation status is 200': (r) => r.status === 200,
    'HLS generation response time < 10s': (r) => r.timings.duration < 10000,
    'HLS generation returns master URL': (r) => r.json('data.masterUrl') !== undefined,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

function testQualityAnalysis() {
  const jobId = __ENV.JOB_ID;
  if (!jobId) return;
  
  const payload = JSON.stringify({ jobId });
  
  const response = http.post(`${BASE_URL}/api/production/quality/analyze`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
  });
  
  const success = check(response, {
    'quality analysis status is 200': (r) => r.status === 200,
    'quality analysis response time < 15s': (r) => r.timings.duration < 15000,
    'quality analysis returns score': (r) => r.json('data.score') !== undefined,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

function testAttributionTracking() {
  const jobId = __ENV.JOB_ID;
  if (!jobId) return;
  
  const payload = JSON.stringify({
    veoJobId: jobId,
    productId: 'test-product-id',
    campaign: 'load-test-campaign'
  });
  
  const response = http.post(`${BASE_URL}/api/attrib/link`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
  });
  
  const success = check(response, {
    'attribution tracking status is 200': (r) => r.status === 200,
    'attribution tracking response time < 2s': (r) => r.timings.duration < 2000,
    'attribution tracking returns short URL': (r) => r.json('data.shortUrl') !== undefined,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  
  // Test link redirect
  if (success) {
    const shortUrl = response.json('data.shortUrl');
    const redirectResponse = http.get(shortUrl);
    
    check(redirectResponse, {
      'link redirect works': (r) => r.status === 302 || r.status === 200,
      'link redirect response time < 1s': (r) => r.timings.duration < 1000,
    });
  }
}

// Test queue health
export function testQueueHealth() {
  const response = http.get(`${BASE_URL}/api/production/queues/health`);
  
  check(response, {
    'queue health status is 200': (r) => r.status === 200,
    'queue health response time < 1s': (r) => r.timings.duration < 1000,
    'queue health returns data': (r) => r.json('data') !== undefined,
  });
}

// Test monitoring
export function testMonitoring() {
  const response = http.get(`${BASE_URL}/api/production/health`);
  
  check(response, {
    'monitoring status is 200': (r) => r.status === 200,
    'monitoring response time < 2s': (r) => r.timings.duration < 2000,
    'monitoring returns health data': (r) => r.json('data.status') !== undefined,
  });
}

// Test error scenarios
export function testErrorScenarios() {
  // Test with invalid token
  const invalidResponse = http.get(`${BASE_URL}/api/veo3/jobs/invalid-id`, {
    headers: {
      'Authorization': 'Bearer invalid-token',
    },
  });
  
  check(invalidResponse, {
    'invalid token returns 401': (r) => r.status === 401,
  });
  
  // Test with malformed request
  const malformedResponse = http.post(`${BASE_URL}/api/veo3/generate`, 'invalid json', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
  });
  
  check(malformedResponse, {
    'malformed request returns 400': (r) => r.status === 400,
  });
  
  // Test rate limiting
  const rateLimitPromises = [];
  for (let i = 0; i < 20; i++) {
    rateLimitPromises.push(
      http.get(`${BASE_URL}/api/veo3/quota`, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
        },
      })
    );
  }
  
  const rateLimitResponses = Promise.all(rateLimitPromises);
  // Check that some requests are rate limited
  // (This would need to be implemented in the actual test)
}

