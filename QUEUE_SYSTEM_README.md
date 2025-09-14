# Veo 3 Queue System

This document describes the simplified queue system for the Veo 3 Cinematic Generator production service.

## 🏗️ Architecture

The queue system uses **BullMQ** with **Redis** for reliable job processing. It consists of three specialized queues:

- **`veo:start`** - Video generation start jobs
- **`veo:poll`** - Polling jobs for status updates  
- **`veo:post`** - Post-processing jobs (thumbnails, captions, CDN)

## 📦 Queue Definitions

```typescript
import { Queue } from "bullmq";

export const veoStartQ = new Queue("veo:start", { 
  connection: { url: process.env.REDIS_URL! },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const veoPollQ = new Queue("veo:poll", { 
  connection: { url: process.env.REDIS_URL! },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const veoPostQ = new Queue("veo:post", { 
  connection: { url: process.env.REDIS_URL! },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});
```

## 🔄 Job Flow

### 1. Start Job (`veo:start`)
- **Purpose**: Initiate video generation with Gemini Veo
- **Input**: Job data with prompt, config, organization info
- **Process**: 
  - Call Gemini Veo API
  - Update job status to "processing"
  - Queue polling job
- **Output**: External job ID and initial video URL

### 2. Poll Job (`veo:poll`)
- **Purpose**: Check video generation status
- **Input**: External job ID, poll count, max polls
- **Process**:
  - Check external service status
  - Update progress (50-95%)
  - Queue next poll or completion
- **Output**: Completion status or next poll job

### 3. Post Job (`veo:post`)
- **Purpose**: Finalize video processing
- **Input**: Completed video URL, job metadata
- **Process**:
  - Generate thumbnail
  - Generate captions (if requested)
  - Upload to CDN
  - Create shareable token
  - Track usage for billing
  - Trigger webhooks
- **Output**: Final video URL, thumbnail, captions

## 🚀 Usage Examples

### Adding Jobs

```typescript
import { veoStartQ, veoPollQ, veoPostQ } from './queues/veo.js';

// Start video generation
const startJob = await veoStartQ.add('start', {
  jobId: 'job-123',
  organizationId: 'org-456',
  userId: 'user-789',
  prompt: { text: 'A beautiful sunset' },
  config: { duration: 8, quality: 'high' },
  priority: 1
}, {
  priority: 1
});

// Poll for status updates
const pollJob = await veoPollQ.add('poll', {
  jobId: 'job-123',
  externalJobId: 'ext-456',
  pollCount: 0,
  maxPolls: 60
}, {
  delay: 5000 // 5 second delay
});

// Post-process video
const postJob = await veoPostQ.add('post', {
  jobId: 'job-123',
  videoUrl: 'https://example.com/video.mp4',
  priority: 1
}, {
  priority: 1
});
```

### Monitoring Jobs

```typescript
// Get job status
const job = await veoStartQ.getJob('job-123');
if (job) {
  console.log('Job state:', await job.getState());
  console.log('Progress:', job.progress);
  console.log('Data:', job.data);
}

// Get queue statistics
const stats = await veoStartQ.getJobCounts();
console.log('Queue stats:', stats);
// Output: { waiting: 5, active: 2, completed: 100, failed: 3, delayed: 1 }
```

### Queue Management

```typescript
// Clean completed jobs
await veoStartQ.clean(5000, 100, 'completed');

// Pause queue
await veoStartQ.pause();

// Resume queue
await veoStartQ.resume();

// Close queue
await veoStartQ.close();
```

## ⚙️ Configuration

### Environment Variables

```bash
# Redis connection
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_password
REDIS_DB=0

# Queue settings
RENDERS_CONCURRENCY=2
RENDERS_PER_DAY_FREE=5
RENDERS_PER_DAY_PRO=100
RENDERS_PER_DAY_ENTERPRISE=1000
```

### Default Job Options

- **Remove on Complete**: 100 jobs
- **Remove on Fail**: 50 jobs  
- **Max Attempts**: 3
- **Backoff**: Exponential (2s, 4s, 8s)
- **Priority**: 0 (normal)

## 🔧 Workers

### Start Worker (`veoStartWorker.ts`)
- **Concurrency**: 2 workers per instance
- **Process**: Video generation initiation
- **Dependencies**: Gemini API, Supabase

### Poll Worker (`veoPollWorker.ts`)
- **Concurrency**: 2 workers per instance
- **Process**: Status polling with exponential backoff
- **Dependencies**: External Veo API

### Post Worker (`veoPostWorker.ts`)
- **Concurrency**: 2 workers per instance
- **Process**: Thumbnails, captions, CDN upload
- **Dependencies**: FFmpeg, AWS S3, Stripe

## 📊 Monitoring

### Health Checks
- **Queue Status**: `/internal/healthz`
- **Job Counts**: Real-time queue statistics
- **Worker Status**: Active worker monitoring

### Metrics
- **Job Creation Rate**: Jobs per minute
- **Job Completion Rate**: Success/failure rates
- **Queue Depth**: Waiting jobs count
- **Processing Time**: Average job duration

### Logging
- **Structured Logs**: JSON format with job IDs
- **Request Tracing**: End-to-end job tracking
- **Error Tracking**: Failed job analysis

## 🚨 Error Handling

### Retry Logic
- **Max Attempts**: 3 retries per job
- **Backoff Strategy**: Exponential (2s, 4s, 8s)
- **Dead Letter Queue**: Failed jobs after max attempts

### Error Types
- **Transient Errors**: Network issues, rate limits
- **Permanent Errors**: Invalid data, API errors
- **System Errors**: Database failures, Redis issues

### Recovery
- **Automatic Retry**: Transient errors
- **Manual Intervention**: Permanent errors
- **Queue Recovery**: System restart

## 🔒 Security

### Job Data
- **Sensitive Data**: Never logged in plain text
- **Input Validation**: Zod schemas for all inputs
- **Access Control**: Organization-scoped jobs

### Queue Access
- **Redis Security**: Password protection
- **Network Security**: TLS encryption
- **Access Logs**: All queue operations logged

## 📈 Scaling

### Horizontal Scaling
- **Multiple Workers**: Scale based on load
- **Queue Sharding**: Distribute load across queues
- **Load Balancing**: Even job distribution

### Vertical Scaling
- **Memory**: 4GB+ recommended
- **CPU**: 2+ cores for video processing
- **Storage**: SSD for Redis persistence

### Performance Tuning
- **Concurrency**: Adjust based on resources
- **Batch Size**: Optimize job processing
- **Memory Usage**: Monitor Redis memory

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### Load Testing
```bash
npm run test:load
```

## 📚 Examples

See `api/examples/queue-usage.ts` for complete usage examples.

## 🚀 Deployment

### Development
```bash
npm run dev
npm run worker:dev
```

### Production
```bash
npm start
npm run worker
```

### Docker
```bash
docker-compose up -d
```

---

For more information, see the [Production Setup Guide](./PRODUCTION_SETUP.md).

