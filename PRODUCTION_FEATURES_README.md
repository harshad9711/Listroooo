# Production Features: Delivery, Scale, Quality & Compliance

The Veo 3 Cinematic Generator now includes comprehensive production-grade features for enterprise deployment, covering adaptive streaming, multi-region scaling, quality assurance, and compliance.

## 🚀 Overview

This production upgrade provides:
- **Adaptive Streaming**: HLS delivery with signed access and sprite thumbnails
- **Multi-Region Support**: Edge-friendly API surfaces for global deployment
- **Model Orchestration**: Intelligent model selection with fallbacks and latency awareness
- **Quality Scoring**: Automated creative quality assessment and optimization
- **Queue Hardening**: Backpressure, dead letter queues, and replay capabilities
- **Data Governance**: GDPR compliance, retention policies, and data export
- **Monitoring**: E2E testing, load testing, and synthetic monitoring
- **UX Enhancements**: End cards, overlays, and sprite seeking

## 🏗️ Architecture

### Core Services
- **HLS Streaming**: Adaptive bitrate streaming with VTT sprite thumbnails
- **Model Orchestrator**: Latency/cost-aware model selection with fallbacks
- **Quality Scorer**: Visual/audio analysis with LLM coherence checking
- **Queue Manager**: Hardened queues with DLQ and replay capabilities
- **Data Governance**: GDPR export/delete with retention automation
- **Monitoring**: Health checks, metrics, and external ping integration

### Edge Deployment
- **Lightweight Endpoints**: Minimal dependencies for edge runtimes
- **JWT Verification**: Secure stream access with short-lived tokens
- **CORS Support**: Cross-origin requests for global distribution

## 📦 Installation

### 1. Environment Setup

Add these variables to your `.env` file:

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
```

### 2. Install Dependencies

```bash
npm install jsonwebtoken fluent-ffmpeg sharp
npm install --save-dev playwright k6
```

### 3. Database Migration

```bash
psql -d your_database -f supabase/migrations/20241220_veo3_production_features.sql
```

## 🎬 Adaptive Streaming (HLS)

### Features
- **Multi-bitrate Streaming**: Automatic quality adaptation based on bandwidth
- **Sprite Thumbnails**: VTT-based seeking with thumbnail previews
- **Signed Access**: JWT-protected stream URLs with expiration
- **CDN Integration**: Optimized delivery through CDN

### Usage

#### Generate HLS Stream
```bash
POST /api/production/hls/generate
{
  "jobId": "uuid"
}
```

#### Access Stream
```bash
GET /stream/veo/{jobId}/master.m3u8?token={jwt_token}
```

#### Generate Stream Token
```bash
GET /api/production/stream/token/{jobId}
```

### HLS Structure
```
renders_hls/ORG/{JOB}/
├── master.m3u8
├── v240/
│   ├── index.m3u8
│   └── segment_*.ts
├── v360/
│   ├── index.m3u8
│   └── segment_*.ts
└── sprites/
    ├── thumbnails.jpg
    └── thumbnails.vtt
```

## 🌍 Multi-Region & Edge Deployment

### Edge Functions
Deploy these endpoints as Edge Functions (Vercel/Cloudflare):

#### Vercel Edge Function
```javascript
// api/stream/[...path].js
export default async function handler(req) {
  // JWT verification and stream redirect
  return new Response(null, { status: 302, headers: { Location: signedUrl } });
}
```

#### Cloudflare Worker
```javascript
// workers/stream.js
export default {
  async fetch(request) {
    // JWT verification and stream redirect
    return Response.redirect(signedUrl, 302);
  }
}
```

### Edge-Safe Endpoints
- `GET /l/:shortId` - Link redirects
- `GET /stream/veo/:jobId/master.m3u8` - Stream access
- `GET /internal/ping` - Health checks

## 🤖 Model Orchestration

### Features
- **Intelligent Selection**: Primary vs fast model based on constraints
- **Latency Awareness**: Queue-based latency estimation
- **Circuit Breaker Integration**: Automatic fallback on failures
- **Cost Optimization**: Quality vs speed trade-offs

### Usage

#### Generate with Quality Mode
```bash
POST /api/veo3/generate
{
  "idea": "Your video idea",
  "qualityMode": "fast|balanced|high"
}
```

#### Get Model Analytics
```bash
GET /api/production/models/analytics?startDate=2024-01-01&endDate=2024-12-31
```

### Model Selection Logic
1. Check primary model availability and latency
2. Fall back to fast model if constraints not met
3. Use primary model with degraded performance if no alternatives
4. Record selection metrics for optimization

## 📊 Quality Scoring

### Features
- **Visual Analysis**: Sharpness, brightness, freeze/black frame detection
- **Audio Analysis**: Loudness, clipping detection
- **Coherence Analysis**: LLM-based prompt evaluation
- **Automated Warnings**: Quality threshold alerts and suggestions

### Usage

#### Analyze Video Quality
```bash
POST /api/production/quality/analyze
{
  "jobId": "uuid"
}
```

#### Get Quality Analytics
```bash
GET /api/production/quality/analytics?startDate=2024-01-01&endDate=2024-12-31
```

### Quality Metrics
- **Overall Score**: 0-1 normalized quality rating
- **Visual Score**: Resolution, bitrate, frame quality
- **Audio Score**: Loudness, clipping, clarity
- **Coherence Score**: Shot clarity, CTA presence, brand consistency

## 🔧 Queue Hardening

### Features
- **Rate Limiting**: Configurable request throttling
- **Dead Letter Queues**: Failed job isolation and replay
- **Backpressure**: Automatic queue management under load
- **Replay Capabilities**: Manual and automated job recovery

### Usage

#### Get Queue Statistics
```bash
GET /api/production/queues/stats
```

#### Replay from DLQ
```bash
POST /api/production/queues/dlq/replay
{
  "queue": "veo:start",
  "limit": 10,
  "reason": "Manual replay"
}
```

#### Get Queue Health
```bash
GET /api/production/queues/health
```

### Queue Configuration
```javascript
const QUEUE_CONFIG = {
  concurrency: 2,
  limiter: { max: 10, duration: 60000 },
  removeOnComplete: 100,
  removeOnFail: 50,
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 }
};
```

## 🔒 Data Governance (GDPR)

### Features
- **Data Export**: Complete user/org data export with signed URLs
- **Data Deletion**: Secure data removal with confirmation
- **Retention Policies**: Automated cleanup of old data
- **Audit Trail**: Complete deletion and export logging

### Usage

#### Request Data Export
```bash
POST /api/production/gdpr/export
{
  "scope": "user|org",
  "confirm": true
}
```

#### Request Data Deletion
```bash
POST /api/production/gdpr/delete
{
  "scope": "user|org",
  "confirm": true
}
```

#### Get Export
```bash
GET /api/production/gdpr/export/{token}
```

#### Trigger Retention Cleanup
```bash
POST /api/production/retention/cleanup
```

### Data Retention
- **Job TTL**: 90 days (configurable)
- **Export TTL**: 30 minutes
- **Archive Policy**: Old jobs archived, not deleted
- **Asset Cleanup**: Orphaned files automatically removed

## 📈 Monitoring & Health Checks

### Features
- **Health Checks**: Database, Redis, queues, circuit breakers
- **External Pings**: UptimeRobot integration
- **Performance Metrics**: Response times, error rates, throughput
- **Synthetic Monitoring**: Automated E2E testing

### Usage

#### Get System Health
```bash
GET /api/production/health
```

#### Send External Ping
```bash
POST /api/production/monitoring/ping
```

#### Get Monitoring Analytics
```bash
GET /api/production/monitoring/analytics?startDate=2024-01-01&endDate=2024-12-31
```

### Health Check Endpoints
- **Internal**: `/internal/ping` - Lightweight edge health check
- **Production**: `/api/production/health` - Comprehensive system health
- **Queue Health**: `/api/production/queues/health` - Queue status

## 🧪 Testing & Quality Assurance

### E2E Tests (Playwright)
```bash
# Run E2E tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test
npx playwright test e2e.test.js --grep "Complete video generation"
```

### Load Tests (k6)
```bash
# Run load test
k6 run tests/load-test.js

# Run with custom options
k6 run --vus 100 --duration 10m tests/load-test.js

# Run with environment variables
k6 run -e API_BASE_URL=https://api.example.com tests/load-test.js
```

### Test Coverage
- **User Workflows**: Complete video generation, product composition
- **Error Handling**: Invalid inputs, network failures, rate limiting
- **Performance**: Response times, throughput, resource usage
- **Accessibility**: Keyboard navigation, screen reader support

## 🎨 UX Enhancements

### End Cards & Overlays
- **Text Overlays**: Brand fonts and colors
- **Logo Placement**: Configurable logo positioning
- **CTA Buttons**: Customizable call-to-action text
- **FFmpeg Integration**: Server-side overlay generation

### Sprite Thumbnails
- **VTT Seeking**: Thumbnail preview on hover/seek
- **Grid Layout**: 10x10 thumbnail grid
- **Cue Points**: Precise time-based navigation
- **Accessibility**: Keyboard controls and ARIA labels

### Accessibility Features
- **Screen Reader Support**: ARIA labels and descriptions
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast**: Accessible color schemes
- **Captions**: Default on for dialogue content

## 🚀 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] CDN configured for HLS delivery
- [ ] Edge functions deployed
- [ ] Monitoring endpoints configured
- [ ] Load balancer health checks set up
- [ ] SSL certificates installed
- [ ] Rate limiting configured

### Edge Deployment
1. **Vercel**: Deploy edge functions to `/api/stream/[...path]`
2. **Cloudflare**: Deploy workers for stream access
3. **AWS Lambda@Edge**: Deploy for global distribution
4. **Azure Front Door**: Configure for edge optimization

### Monitoring Setup
1. **UptimeRobot**: Configure ping URL
2. **DataDog/New Relic**: Application performance monitoring
3. **Grafana**: Metrics visualization
4. **PagerDuty**: Alert management

## 📊 Performance Metrics

### Key Performance Indicators
- **Response Time**: P95 < 2s for API calls
- **Error Rate**: < 1% for production endpoints
- **Throughput**: 100+ concurrent video generations
- **Availability**: 99.9% uptime target
- **Quality Score**: > 0.62 average quality threshold

### Monitoring Dashboards
- **System Health**: Overall system status and metrics
- **Queue Performance**: Job processing rates and backlogs
- **Quality Metrics**: Video quality distribution and trends
- **User Analytics**: Usage patterns and performance

## 🔧 Configuration

### Environment Variables
```bash
# Streaming
CDN_BASE_URL=https://cdn.example.com
HLS_VARIANTS=426x240,640x360,854x480
HLS_SEGMENT_SEC=2
SIGNING_SECRET=your_jwt_secret

# Models
MODEL_PRIMARY=veo-3.0-generate-001
MODEL_FAST=veo-3.0-fast-generate-001
MODEL_MAX_LATENCY_MS=45000

# Quality
QUALITY_MIN_SCORE=0.62

# Retention
JOB_TTL_DAYS=90
GDPR_EXPORT_TTL_MIN=30

# Monitoring
MONITOR_PING_URL=https://api.uptimerobot.com/v2/getMonitors
```

### Queue Configuration
```javascript
const QUEUE_CONFIG = {
  concurrency: parseInt(process.env.RENDERS_CONCURRENCY || '2'),
  limiter: { max: 10, duration: 60000 },
  removeOnComplete: 100,
  removeOnFail: 50,
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 }
};
```

This production upgrade transforms the Veo 3 Cinematic Generator into an enterprise-ready platform with comprehensive delivery, scaling, quality assurance, and compliance capabilities!

