# Veo 3 Cinematic Generator - Production Ready

A production-hardened video generation system that transforms structured JSON prompts into polished 8-second video creatives using Google's Veo 3 through the Gemini API.

## 🚀 Production Features

### ✅ **Complete Backend Infrastructure**
- **PostgreSQL Database**: Full job tracking with `veo_jobs` table
- **Idempotency**: Duplicate request protection with idea hashing
- **Rate Limiting**: Daily quotas and concurrency limits per user
- **Real-time Updates**: Server-Sent Events (SSE) for live progress
- **Secure Storage**: Supabase private bucket with signed URLs
- **Comprehensive Validation**: Zod schemas with business rule validation

### ✅ **Production Security**
- **Server-Side Only**: All Gemini/Veo calls happen on the server
- **Authentication**: Supabase JWT token validation
- **Input Sanitization**: URL validation, size limits, content filtering
- **Rate Limiting**: Per-user daily quotas and concurrency controls
- **Error Handling**: Graceful error states with user-friendly messages

### ✅ **Scalable Architecture**
- **Job Queue**: In-process queue with `p-queue` for concurrency control
- **Database Persistence**: Full job lifecycle tracking
- **Background Processing**: Non-blocking job execution
- **Real-time Updates**: SSE with polling fallback
- **CDN Integration**: Supabase storage with signed URLs

## 📊 Database Schema

```sql
create table veo_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  idempotency_key text,
  idea_hash text,
  status text not null default 'queued', -- queued|running|done|error
  platform text not null,
  aspect text not null,
  resolution text not null,
  prompt_string text not null,
  config jsonb not null,
  asset_refs jsonb not null,
  operation_name text,
  output_url text,
  error_message text,
  progress int default 0,
  created_at timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz
);
```

## 🔧 Environment Configuration

```bash
# Veo 3 Configuration
GEMINI_API_KEY=your_gemini_api_key_here
VEO_MODEL_ID=veo-3.0-generate-001
VEO_DEFAULT_RESOLUTION=720p
VEO_DEFAULT_SEED=0

# Production Settings
RENDERS_PER_DAY=10
RENDERS_CONCURRENCY=2

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🛠 API Endpoints

### `POST /api/veo3/generate`
Start video generation with idempotency support.

**Request:**
```json
{
  "prompt": {
    "idea": "Create a product showcase video",
    "goal": "Increase product awareness",
    "platform": "tiktok",
    "aspect": "9:16",
    "resolution": "720p",
    "durationSec": 8,
    "brand": {
      "name": "MyBrand",
      "tone": "premium, modern",
      "colors": ["#FF6B6B", "#4ECDC4"]
    },
    "visualRefs": [
      {
        "id": "uuid",
        "kind": "product",
        "url": "https://example.com/image.jpg"
      }
    ],
    "shotPlan": [
      {
        "tStart": 0,
        "tEnd": 2,
        "action": "Product reveal",
        "camera": "Dolly in",
        "composition": "Wide shot"
      }
    ],
    "audio": {
      "musicStyle": "cinematic",
      "dialogue": "This product is amazing!",
      "captions": true
    }
  },
  "idempotencyKey": "unique-key-123"
}
```

**Response:**
```json
{
  "jobId": "uuid",
  "status": "queued",
  "quota": {
    "used": 3,
    "remaining": 7,
    "limit": 10
  }
}
```

### `GET /api/veo3/jobs/:id`
Get job status and details.

**Response:**
```json
{
  "id": "uuid",
  "status": "running",
  "progress": 50,
  "platform": "tiktok",
  "aspect": "9:16",
  "resolution": "720p",
  "outputUrl": "path/to/video.mp4",
  "createdAt": "2024-01-08T10:00:00Z",
  "startedAt": "2024-01-08T10:00:05Z"
}
```

### `GET /api/veo3/jobs/:id/events` (SSE)
Real-time job progress updates.

**Event Stream:**
```
data: {"type": "status", "status": "running", "progress": 50}

data: {"type": "status", "status": "done", "progress": 100, "outputUrl": "path/to/video.mp4"}
```

### `GET /api/veo3/jobs/:id/download`
Download generated video (302 redirect to signed URL).

### `GET /api/veo3/quota`
Get user quota information.

**Response:**
```json
{
  "quota": {
    "used": 3,
    "remaining": 7,
    "limit": 10
  },
  "concurrency": {
    "running": 1,
    "limit": 2
  }
}
```

## 🎯 Frontend Features

### **Real-time Progress Updates**
- **SSE Support**: Live progress updates via Server-Sent Events
- **Polling Fallback**: Automatic fallback to polling if SSE fails
- **Progress Bar**: Visual progress indication with percentage
- **Status Indicators**: Clear status icons and messages

### **Production UI**
- **Quota Display**: Shows daily usage and remaining renders
- **Validation**: Real-time form validation with error messages
- **Download Management**: Secure download links with expiration
- **Error Handling**: User-friendly error messages and recovery

### **User Experience**
- **Idempotency**: Prevents duplicate submissions
- **Rate Limiting**: Clear feedback when limits are reached
- **Concurrency Control**: Shows running jobs and limits
- **Template System**: Pre-built templates for common use cases

## 🔒 Security Features

### **Input Validation**
- **Zod Schemas**: Comprehensive server-side validation
- **URL Validation**: Only http(s) URLs allowed for assets
- **Size Limits**: 10MB maximum for image assets
- **Content Filtering**: Sanitized text inputs with length limits

### **Authentication & Authorization**
- **JWT Validation**: Supabase token verification
- **User Isolation**: Users can only access their own jobs
- **Rate Limiting**: Per-user daily quotas and concurrency limits
- **Secure Storage**: Private Supabase bucket with signed URLs

### **Error Handling**
- **Graceful Degradation**: Fallback mechanisms for all features
- **Error Logging**: Comprehensive error tracking and logging
- **User Feedback**: Clear error messages without exposing internals

## 📈 Monitoring & Observability

### **Database Tracking**
- **Job Lifecycle**: Complete audit trail of all jobs
- **Performance Metrics**: Processing times and success rates
- **User Analytics**: Usage patterns and quota consumption

### **Error Tracking**
- **Comprehensive Logging**: All errors logged with context
- **Sentry Integration**: Optional error tracking with Sentry
- **Health Checks**: Endpoint monitoring and status reporting

## 🧪 Testing

### **Unit Tests**
```bash
cd api
npm test
```

### **Test Coverage**
- **Schema Validation**: Zod schema validation tests
- **Prompt Building**: Prompt string generation tests
- **Hash Generation**: Idempotency hash consistency tests
- **Error Handling**: Edge case and error scenario tests

## 🚀 Deployment

### **Database Migration**
```bash
# Run the migration
psql -d your_database -f supabase/migrations/20250108_veo_jobs.sql
```

### **Environment Setup**
1. Copy `env.local.template` to `.env`
2. Set your Gemini API key
3. Configure Supabase credentials
4. Set production limits (RENDERS_PER_DAY, RENDERS_CONCURRENCY)

### **Server Start**
```bash
# Backend
cd api
npm install
npm start

# Frontend
npm run dev
```

## 📋 Production Checklist

- ✅ **Database Schema**: Created and migrated
- ✅ **Rate Limiting**: Daily quotas and concurrency limits
- ✅ **Idempotency**: Duplicate request protection
- ✅ **Real-time Updates**: SSE with polling fallback
- ✅ **Secure Storage**: Supabase private bucket
- ✅ **Input Validation**: Comprehensive Zod schemas
- ✅ **Error Handling**: Graceful error states
- ✅ **Authentication**: Supabase JWT validation
- ✅ **Testing**: Unit tests for core functions
- ✅ **Documentation**: Complete API documentation

## 🎬 Usage Flow

1. **User Input**: Fill out the comprehensive form
2. **Validation**: Client and server-side validation
3. **Job Creation**: Create job with idempotency check
4. **Background Processing**: Queue job for processing
5. **Real-time Updates**: SSE connection for live progress
6. **Video Generation**: Call Gemini/Veo API
7. **Storage**: Upload to Supabase private bucket
8. **Download**: Generate signed URL for download

## 🔧 Configuration Options

### **Rate Limiting**
- `RENDERS_PER_DAY`: Daily quota per user (default: 10)
- `RENDERS_CONCURRENCY`: Max concurrent jobs per user (default: 2)

### **Video Settings**
- `VEO_MODEL_ID`: Gemini model ID (default: veo-3.0-generate-001)
- `VEO_DEFAULT_RESOLUTION`: Default resolution (default: 720p)
- `VEO_DEFAULT_SEED`: Default seed for reproducibility (default: 0)

### **Security**
- Image size limit: 10MB maximum
- Prompt length limit: 8000 characters
- Visual references limit: 6 maximum
- Shot plan limit: 8 shots maximum

## 🎯 Performance

- **Concurrent Processing**: Configurable per-user limits
- **Background Jobs**: Non-blocking job execution
- **Real-time Updates**: SSE for instant progress updates
- **Efficient Storage**: Optimized video storage and retrieval
- **Caching**: Signed URL caching for downloads

The Veo 3 Cinematic Generator is now production-ready with enterprise-grade features, security, and scalability! 🚀