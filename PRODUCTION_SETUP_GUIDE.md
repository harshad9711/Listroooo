# Production Setup Guide

Complete guide for deploying the Veo 3 Cinematic Generator with production-grade features.

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp env.sample .env

# Edit environment variables
nano .env
```

### 2. Install Dependencies

```bash
# Install server dependencies
cd api
npm install

# Install frontend dependencies
cd ../src
npm install
```

### 3. Database Setup

```bash
# Run migrations
psql -d your_database -f supabase/migrations/20241220_veo3_production_features.sql

# Verify tables
psql -d your_database -c "\dt"
```

### 4. Start Services

```bash
# Start API server
cd api
npm run dev

# Start frontend
cd ../src
npm run dev

# Start workers (separate terminal)
cd api
npm run worker
```

## 🏗️ Architecture Overview

### Core Services
- **API Server**: Express.js with production routes
- **Workers**: BullMQ background job processing
- **Database**: PostgreSQL with Supabase
- **Storage**: Supabase Storage with CDN
- **Queue**: Redis for job management
- **Streaming**: HLS with signed access

### Production Features
- **HLS Streaming**: Adaptive bitrate video delivery
- **Quality Analysis**: Automated video quality scoring
- **Model Orchestration**: Intelligent model selection
- **Queue Management**: DLQ, replay, and monitoring
- **GDPR Compliance**: Data export and deletion
- **Edge Deployment**: Lightweight edge functions

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- FFmpeg 4.4+
- Docker (optional)

### Server Dependencies

```bash
# Core production packages
npm install jsonwebtoken fluent-ffmpeg sharp

# Queue and monitoring
npm install bullmq pino pino-http

# Testing
npm install --save-dev playwright k6 vitest supertest
```

### Frontend Dependencies

```bash
# HLS player
npm install hls.js

# UI components
npm install @tremor/react lucide-react
```

## 🔧 Configuration

### Environment Variables

```bash
# Production Delivery & Scale
CDN_BASE_URL=https://cdn.yourdomain.com
HLS_VARIANTS=426x240,640x360,854x480
HLS_SEGMENT_SEC=2
SIGNING_SECRET=your_jwt_signing_secret_here
MODEL_PRIMARY=veo-3.0-generate-001
MODEL_FAST=veo-3.0-fast-generate-001
MODEL_MAX_LATENCY_MS=45000
QUALITY_MIN_SCORE=0.62
JOB_TTL_DAYS=90
GDPR_EXPORT_TTL_MIN=30
MONITOR_PING_URL=https://api.uptimerobot.com/v2/getMonitors

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis
REDIS_URL=redis://localhost:6379

# AI Services
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
```

### FFmpeg Configuration

```bash
# Install FFmpeg
# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# Verify installation
ffmpeg -version
```

### Redis Configuration

```bash
# Install Redis
# Ubuntu/Debian
sudo apt install redis-server

# macOS
brew install redis

# Start Redis
redis-server

# Verify connection
redis-cli ping
```

## 🎬 HLS Streaming Setup

### 1. Configure HLS Variants

```bash
# Set HLS variants in .env
HLS_VARIANTS=426x240,640x360,854x480,1280x720
HLS_SEGMENT_SEC=2
```

### 2. CDN Configuration

```bash
# Set CDN base URL
CDN_BASE_URL=https://cdn.yourdomain.com
```

### 3. Test HLS Generation

```bash
# Generate HLS for a completed job
curl -X POST http://localhost:3001/api/delivery/hls/generate \
  -H "Content-Type: application/json" \
  -d '{"jobId": "your-job-id", "orgId": "your-org-id"}'
```

## 🤖 Model Orchestration

### 1. Configure Models

```bash
# Set model configuration
MODEL_PRIMARY=veo-3.0-generate-001
MODEL_FAST=veo-3.0-fast-generate-001
MODEL_MAX_LATENCY_MS=45000
```

### 2. Test Model Selection

```bash
# Test with different quality modes
curl -X POST http://localhost:3001/api/veo3/generate \
  -H "Content-Type: application/json" \
  -d '{
    "idea": "Test video",
    "qualityMode": "fast"
  }'
```

## 📊 Quality Analysis

### 1. Configure Quality Thresholds

```bash
# Set quality minimum score
QUALITY_MIN_SCORE=0.62
```

### 2. Test Quality Analysis

```bash
# Analyze video quality
curl -X POST http://localhost:3001/api/production/quality/analyze \
  -H "Content-Type: application/json" \
  -d '{"jobId": "your-job-id"}'
```

## 🔧 Queue Management

### 1. Start Workers

```bash
# Start all workers
npm run worker

# Start specific worker
npm run worker:start
npm run worker:poll
npm run worker:post
```

### 2. Monitor Queues

```bash
# Get queue statistics
curl http://localhost:3001/api/queues/stats

# Get system health
curl http://localhost:3001/api/queues/health
```

### 3. DLQ Management

```bash
# View DLQ jobs
curl http://localhost:3001/api/queues/dlq/veo:start/jobs

# Replay from DLQ
curl -X POST http://localhost:3001/api/queues/dlq/replay \
  -H "Content-Type: application/json" \
  -d '{"queue": "veo:start", "limit": 10}'
```

## 🔒 GDPR Compliance

### 1. Test Data Export

```bash
# Create export request
curl -X POST http://localhost:3001/api/governance/gdpr/export \
  -H "Content-Type: application/json" \
  -d '{"scope": "user", "confirm": true}'
```

### 2. Test Data Deletion

```bash
# Create deletion request
curl -X POST http://localhost:3001/api/governance/gdpr/delete \
  -H "Content-Type: application/json" \
  -d '{"scope": "user", "confirm": true}'
```

## 🌍 Edge Deployment

### Vercel Edge Functions

```javascript
// api/stream/[...path].js
export default async function handler(req) {
  const { path } = req.query;
  const { token } = req.query;
  
  // Verify JWT token
  const verification = verifyStreamToken(token);
  if (!verification.valid) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Generate signed URL and redirect
  const signedUrl = await generateSignedUrl(`renders_hls/${verification.jobId}/${path.join('/')}`);
  return Response.redirect(signedUrl, 302);
}
```

### Cloudflare Workers

```javascript
// workers/stream.js
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    
    // Verify JWT token
    const verification = verifyStreamToken(token);
    if (!verification.valid) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // Generate signed URL and redirect
    const signedUrl = await generateSignedUrl(`renders_hls/${verification.jobId}/master.m3u8`);
    return Response.redirect(signedUrl, 302);
  }
}
```

## 🧪 Testing

### Unit Tests

```bash
# Run unit tests
npm run test:unit

# Run specific test
npm run test:unit -- production.test.js
```

### Integration Tests

```bash
# Run integration tests
npm run test:integration

# Run specific test
npm run test:integration -- production.test.js
```

### E2E Tests

```bash
# Install Playwright
npx playwright install

# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e -- --ui
```

### Load Tests

```bash
# Install k6
# macOS
brew install k6

# Run load test
k6 run tests/load-test.js

# Run with custom options
k6 run --vus 100 --duration 10m tests/load-test.js
```

## 📈 Monitoring

### Health Checks

```bash
# Internal health check
curl http://localhost:3001/internal/ping

# Production health check
curl http://localhost:3001/api/production/health
```

### Metrics

```bash
# Get queue metrics
curl http://localhost:3001/api/queues/metrics

# Get quality analytics
curl http://localhost:3001/api/production/quality/analytics
```

### External Monitoring

```bash
# Send ping to external monitor
curl -X POST http://localhost:3001/api/production/monitoring/ping
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t veo3-production .

# Run with Docker Compose
docker-compose -f docker-compose.production.yml up -d
```

### Manual Deployment

```bash
# Build application
npm run build

# Start production server
NODE_ENV=production npm start

# Start workers
NODE_ENV=production npm run worker
```

### Environment-Specific Configuration

```bash
# Development
NODE_ENV=development npm run dev

# Staging
NODE_ENV=staging npm start

# Production
NODE_ENV=production npm start
```

## 🔧 Troubleshooting

### Common Issues

1. **HLS Generation Fails**
   - Check FFmpeg installation
   - Verify video file exists
   - Check storage permissions

2. **Quality Analysis Fails**
   - Check OpenAI API key
   - Verify video file format
   - Check FFmpeg installation

3. **Queue Jobs Stuck**
   - Check Redis connection
   - Restart workers
   - Check DLQ for failed jobs

4. **Stream Access Denied**
   - Check JWT signing secret
   - Verify token expiration
   - Check job status

### Debug Commands

```bash
# Check Redis connection
redis-cli ping

# Check queue status
redis-cli llen bull:veo:start:waiting

# Check job details
redis-cli hgetall bull:veo:start:1

# Check logs
tail -f logs/veo3.log
```

### Performance Optimization

1. **HLS Optimization**
   - Adjust segment duration
   - Optimize bitrate settings
   - Use CDN for delivery

2. **Queue Optimization**
   - Adjust concurrency limits
   - Optimize job processing
   - Monitor DLQ size

3. **Database Optimization**
   - Add indexes for queries
   - Optimize connection pool
   - Monitor query performance

## 📚 API Documentation

### HLS Streaming

- `POST /api/delivery/hls/generate` - Generate HLS streams
- `GET /api/delivery/stream/token/:jobId` - Get stream token
- `GET /stream/veo/:jobId/master.m3u8` - Stream access

### Quality Analysis

- `POST /api/production/quality/analyze` - Analyze video quality
- `GET /api/production/quality/analytics` - Get quality metrics

### Queue Management

- `GET /api/queues/stats` - Get queue statistics
- `POST /api/queues/dlq/replay` - Replay from DLQ
- `POST /api/queues/:queueName/pause` - Pause queue

### GDPR Compliance

- `POST /api/governance/gdpr/export` - Create data export
- `POST /api/governance/gdpr/delete` - Create data deletion
- `GET /api/governance/gdpr/export/:token` - Get export

## 🎯 Performance Targets

- **Response Time**: P95 < 2s for API calls
- **Error Rate**: < 1% for production endpoints
- **Throughput**: 100+ concurrent video generations
- **Availability**: 99.9% uptime target
- **Quality Score**: > 0.62 average quality threshold

## 🔐 Security Checklist

- [ ] JWT signing secret configured
- [ ] API keys secured
- [ ] Database access restricted
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Error messages sanitized
- [ ] HTTPS enabled
- [ ] Security headers set

This production setup guide provides everything needed to deploy and operate the Veo 3 Cinematic Generator at scale! 🚀

