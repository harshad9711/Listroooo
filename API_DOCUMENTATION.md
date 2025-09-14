# Veo 3 Publishing Features API Documentation

This document provides comprehensive API documentation for all publishing features in the Veo 3 Cinematic Generator.

## 🔗 Base URL

```
https://your-domain.com/api
```

## 🔐 Authentication

All API endpoints require authentication via one of the following methods:

### 1. JWT Token (User Authentication)
```http
Authorization: Bearer <jwt_token>
```

### 2. API Key (Organization Authentication)
```http
Authorization: Bearer <api_key>
```
or
```http
X-API-Key: <api_key>
```

## 📋 OAuth System

### Initiate OAuth Flow
```http
GET /oauth/:provider/connect?orgId={orgId}
```

**Parameters:**
- `provider` (path): OAuth provider (`tiktok`, `meta`, `youtube`)
- `orgId` (query): Organization ID

**Response:**
```json
{
  "authUrl": "https://provider.com/oauth/authorize?..."
}
```

### OAuth Callback
```http
GET /oauth/:provider/callback?code={code}&state={state}
```

**Parameters:**
- `provider` (path): OAuth provider
- `code` (query): Authorization code from provider
- `state` (query): State parameter for security

**Response:** Redirects to success/error page

### Get OAuth Connections
```http
GET /oauth/connections?orgId={orgId}
```

**Response:**
```json
[
  {
    "id": "conn-123",
    "provider": "tiktok",
    "account_name": "My TikTok Account",
    "expires_at": "2024-12-31T23:59:59Z",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Delete OAuth Connection
```http
DELETE /oauth/connections/:connectionId?orgId={orgId}
```

**Response:**
```json
{
  "success": true
}
```

## 📤 Publishing Pipeline

### Create Publish Job
```http
POST /publishing/jobs
```

**Request Body:**
```json
{
  "veoJobId": "job-123",
  "orgId": "org-123",
  "provider": "tiktok",
  "scheduledAt": "2024-12-25T10:00:00Z",
  "caption": "Check out this amazing video!",
  "hashtags": ["#ai", "#video", "#generated"],
  "metadata": {
    "privacy": "public",
    "allowDuet": true,
    "allowComment": true
  }
}
```

**Response:**
```json
{
  "publishJobId": "pub-123",
  "status": "queued",
  "message": "Publish job created successfully"
}
```

### Get Publish Jobs
```http
GET /publishing/jobs?orgId={orgId}&status={status}
```

**Parameters:**
- `orgId` (query): Organization ID
- `status` (query, optional): Filter by status (`queued`, `uploading`, `processing`, `published`, `error`)

**Response:**
```json
[
  {
    "id": "pub-123",
    "veo_job_id": "job-123",
    "org_id": "org-123",
    "provider": "tiktok",
    "status": "published",
    "scheduled_at": "2024-12-25T10:00:00Z",
    "external_post_id": "tiktok-post-123",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Cancel Publish Job
```http
DELETE /publishing/jobs/:publishJobId
```

**Response:**
```json
{
  "success": true
}
```

### Schedule Publish Job
```http
POST /publishing/jobs/:publishJobId/schedule
```

**Request Body:**
```json
{
  "scheduledAt": "2024-12-25T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "scheduledAt": "2024-12-25T10:00:00Z"
}
```

### Get Publishing Analytics
```http
GET /publishing/analytics?orgId={orgId}&startDate={startDate}&endDate={endDate}&provider={provider}
```

**Response:**
```json
{
  "total": 100,
  "byStatus": {
    "published": 80,
    "error": 5,
    "pending": 15
  },
  "byProvider": {
    "tiktok": 50,
    "meta": 30,
    "youtube": 20
  },
  "published": 80,
  "failed": 5,
  "pending": 15
}
```

## 🛡️ Content Moderation

### Moderate Content
```http
POST /moderation/moderate
```

**Request Body:**
```json
{
  "veoJobId": "job-123",
  "orgId": "org-123",
  "contentType": "prompt",
  "content": "This is a test prompt",
  "metadata": {
    "platform": "tiktok",
    "audience": "general"
  }
}
```

**Response:**
```json
{
  "result": {
    "id": "mod-123",
    "veo_job_id": "job-123",
    "org_id": "org-123",
    "content_type": "prompt",
    "status": "approved",
    "confidence_score": 0.95,
    "categories": {},
    "details": {},
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "Content moderation completed"
}
```

### Get Moderation Results
```http
GET /moderation/results?orgId={orgId}&status={status}
```

**Response:**
```json
[
  {
    "id": "mod-123",
    "veo_job_id": "job-123",
    "org_id": "org-123",
    "content_type": "prompt",
    "status": "approved",
    "confidence_score": 0.95,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Update Moderation Result
```http
PUT /moderation/results/:resultId
```

**Request Body:**
```json
{
  "status": "approved",
  "reviewedBy": "admin-123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Moderation result updated"
}
```

### Get Moderation Dashboard
```http
GET /moderation/dashboard?orgId={orgId}&startDate={startDate}&endDate={endDate}
```

**Response:**
```json
{
  "total": 1000,
  "byStatus": {
    "approved": 800,
    "rejected": 50,
    "flagged": 100,
    "pending": 50
  },
  "byContentType": {
    "video": 600,
    "thumbnail": 200,
    "caption": 150,
    "prompt": 50
  },
  "pending": 50,
  "approved": 800,
  "rejected": 50,
  "flagged": 100
}
```

## 🌍 Localization

### Localize Content
```http
POST /localization/localize
```

**Request Body:**
```json
{
  "veoJobId": "job-123",
  "orgId": "org-123",
  "locale": "es",
  "content": "This is a test caption",
  "type": "caption",
  "metadata": {
    "voice": "es-ES-Standard-A",
    "speed": 1.0
  }
}
```

**Response:**
```json
{
  "result": {
    "id": "loc-123",
    "veo_job_id": "job-123",
    "org_id": "org-123",
    "locale": "es",
    "caption_file_url": "https://cdn.example.com/captions/es/job-123.vtt",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "Content localization completed"
}
```

### Bulk Localization
```http
POST /localization/localize/bulk
```

**Request Body:**
```json
{
  "veoJobId": "job-123",
  "orgId": "org-123",
  "locales": ["es", "fr", "de"],
  "content": "This is a test caption",
  "types": ["caption", "subtitle", "tts"]
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "loc-123",
      "locale": "es",
      "type": "caption"
    }
  ],
  "total": 9,
  "successful": 9,
  "failed": 0,
  "message": "Bulk localization completed"
}
```

### Get Available Voices
```http
GET /localization/voices?locale={locale}
```

**Response:**
```json
{
  "voices": [
    "en-US-Standard-A",
    "en-US-Standard-B",
    "en-US-Standard-C"
  ]
}
```

### Translate Text
```http
POST /localization/translate
```

**Request Body:**
```json
{
  "text": "Hello world",
  "targetLocale": "es",
  "sourceLocale": "en"
}
```

**Response:**
```json
{
  "original": "Hello world",
  "translated": "Hola mundo",
  "sourceLocale": "en",
  "targetLocale": "es"
}
```

### Generate TTS
```http
POST /localization/tts/generate
```

**Request Body:**
```json
{
  "text": "Hello world",
  "locale": "en",
  "voice": "en-US-Standard-A"
}
```

**Response:**
```json
{
  "audio": "base64_encoded_audio_data",
  "locale": "en",
  "voice": "en-US-Standard-A",
  "format": "mp3"
}
```

## 📝 Prompt Versioning

### Create Prompt Snapshot
```http
POST /prompt-versioning/snapshots
```

**Request Body:**
```json
{
  "veoJobId": "job-123",
  "orgId": "org-123",
  "userId": "user-123",
  "jsonPrompt": {
    "text": "A beautiful sunset over the ocean",
    "style": "cinematic",
    "mood": "peaceful"
  },
  "promptString": "A beautiful sunset over the ocean",
  "config": {
    "duration": 8,
    "quality": "high",
    "aspect_ratio": "16:9"
  },
  "assets": {
    "background": "base64_encoded_image"
  },
  "seed": 12345
}
```

**Response:**
```json
{
  "snapshot": {
    "id": "snap-123",
    "veo_job_id": "job-123",
    "org_id": "org-123",
    "user_id": "user-123",
    "json_prompt": {...},
    "prompt_string": "A beautiful sunset over the ocean",
    "config": {...},
    "asset_hashes": {...},
    "seed": 12345,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "Prompt snapshot created successfully"
}
```

### Get Prompt Snapshots
```http
GET /prompt-versioning/snapshots?orgId={orgId}&limit={limit}
```

**Response:**
```json
[
  {
    "id": "snap-123",
    "veo_job_id": "job-123",
    "org_id": "org-123",
    "user_id": "user-123",
    "prompt_string": "A beautiful sunset over the ocean",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Reproduce Prompt
```http
POST /prompt-versioning/reproduce
```

**Request Body:**
```json
{
  "snapshotId": "snap-123",
  "orgId": "org-123",
  "userId": "user-123",
  "variations": {
    "duration": 10,
    "style": "dramatic"
  }
}
```

**Response:**
```json
{
  "newJobId": "job-456",
  "message": "Prompt reproduced successfully"
}
```

### Compare Prompt Versions
```http
GET /prompt-versioning/compare/:snapshotId1/:snapshotId2
```

**Response:**
```json
{
  "differences": {
    "config": {
      "duration": {
        "original": 8,
        "modified": 10
      }
    }
  },
  "similarity": 0.85
}
```

### Get Prompt Analytics
```http
GET /prompt-versioning/analytics?orgId={orgId}&timeRange={timeRange}
```

**Response:**
```json
{
  "totalSnapshots": 100,
  "uniquePrompts": 50,
  "mostUsedPrompts": [
    {
      "prompt": "A beautiful sunset over the ocean",
      "count": 10
    }
  ],
  "averageVariations": 2.0,
  "reproductionRate": 0.3
}
```

## 🧪 A/B Experimentation

### Create Campaign
```http
POST /experimentation/campaigns
```

**Request Body:**
```json
{
  "orgId": "org-123",
  "name": "Q4 Marketing Campaign",
  "description": "Q4 marketing campaign for holiday season",
  "budgetCents": 100000,
  "targetPlatforms": ["tiktok", "meta", "youtube"]
}
```

**Response:**
```json
{
  "campaign": {
    "id": "camp-123",
    "org_id": "org-123",
    "name": "Q4 Marketing Campaign",
    "description": "Q4 marketing campaign for holiday season",
    "status": "draft",
    "budget_cents": 100000,
    "target_platforms": ["tiktok", "meta", "youtube"],
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "Campaign created successfully"
}
```

### Create Experiment
```http
POST /experimentation/experiments
```

**Request Body:**
```json
{
  "campaignId": "camp-123",
  "orgId": "org-123",
  "name": "Caption A/B Test",
  "description": "Test different caption styles",
  "trafficSplit": 0.5,
  "controlPromptSnapshotId": "snap-123",
  "variantPromptSnapshotId": "snap-456"
}
```

**Response:**
```json
{
  "experiment": {
    "id": "exp-123",
    "campaign_id": "camp-123",
    "org_id": "org-123",
    "name": "Caption A/B Test",
    "status": "draft",
    "traffic_split": 0.5,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "Experiment created successfully"
}
```

### Start Experiment
```http
POST /experimentation/experiments/:experimentId/start
```

**Response:**
```json
{
  "message": "Experiment started successfully"
}
```

### Assign User to Experiment
```http
POST /experimentation/experiments/:experimentId/assign
```

**Request Body:**
```json
{
  "userId": "user-123"
}
```

**Response:**
```json
{
  "variant": "control"
}
```

### Track Performance
```http
POST /experimentation/performance/track
```

**Request Body:**
```json
{
  "veoJobId": "job-123",
  "orgId": "org-123",
  "platform": "tiktok",
  "externalPostId": "tiktok-post-123",
  "metrics": {
    "views": 1000,
    "likes": 50,
    "shares": 10,
    "comments": 5,
    "engagement_rate": 0.065,
    "completion_rate": 0.8,
    "click_through_rate": 0.05,
    "conversion_rate": 0.02
  }
}
```

**Response:**
```json
{
  "message": "Performance metrics tracked successfully"
}
```

### Get Experiment Analytics
```http
GET /experimentation/experiments/:experimentId/analytics
```

**Response:**
```json
{
  "totalResults": 100,
  "controlResults": 50,
  "variantResults": 50,
  "controlMetrics": {
    "views": 5000,
    "likes": 250,
    "shares": 50,
    "comments": 25,
    "engagement_rate": 0.065
  },
  "variantMetrics": {
    "views": 6000,
    "likes": 300,
    "shares": 60,
    "comments": 30,
    "engagement_rate": 0.075
  },
  "statisticalSignificance": 0.95,
  "confidenceLevel": 95
}
```

## 👨‍💼 Admin Tools

### Get Audit Logs
```http
GET /admin/audit/logs?orgId={orgId}&userId={userId}&action={action}&resourceType={resourceType}&startDate={startDate}&endDate={endDate}&limit={limit}
```

**Response:**
```json
[
  {
    "id": "audit-123",
    "org_id": "org-123",
    "user_id": "user-123",
    "action": "create_job",
    "resource_type": "veo_job",
    "resource_id": "job-123",
    "details": {
      "prompt": "A beautiful sunset",
      "duration": 8
    },
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Log Audit Event
```http
POST /admin/audit/log
```

**Request Body:**
```json
{
  "action": "create_job",
  "resourceType": "veo_job",
  "resourceId": "job-123",
  "details": {
    "prompt": "A beautiful sunset",
    "duration": 8
  },
  "orgId": "org-123",
  "userId": "user-123",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

**Response:**
```json
{
  "message": "Audit event logged successfully"
}
```

### Get System Health
```http
GET /admin/health
```

**Response:**
```json
{
  "database": true,
  "redis": true,
  "queues": {
    "start": {
      "waiting": 5,
      "active": 2,
      "completed": 100,
      "failed": 3
    },
    "poll": {
      "waiting": 3,
      "active": 1,
      "completed": 50,
      "failed": 1
    },
    "post": {
      "waiting": 2,
      "active": 1,
      "completed": 75,
      "failed": 2
    }
  },
  "storage": true,
  "external_apis": {
    "gemini": true,
    "stripe": true,
    "tiktok": true,
    "meta": true,
    "youtube": true
  }
}
```

### Get System Metrics
```http
GET /admin/metrics
```

**Response:**
```json
{
  "totalJobs": 1000,
  "activeJobs": 10,
  "completedJobs": 950,
  "failedJobs": 40,
  "totalUsers": 100,
  "totalOrganizations": 50,
  "totalRevenue": 25000,
  "averageJobDuration": 120000
}
```

### Get Admin Dashboard
```http
GET /admin/dashboard?startDate={startDate}&endDate={endDate}
```

**Response:**
```json
{
  "metrics": {
    "totalJobs": 1000,
    "activeJobs": 10,
    "completedJobs": 950,
    "failedJobs": 40
  },
  "recentLogs": [
    {
      "id": "audit-123",
      "action": "create_job",
      "resource_type": "veo_job",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pendingApprovals": [
    {
      "id": "approval-123",
      "resource_type": "veo_job",
      "action": "publish",
      "requested_at": "2024-01-01T00:00:00Z"
    }
  ],
  "adminUsers": 5,
  "systemHealth": {
    "database": true,
    "redis": true,
    "queues": {...}
  }
}
```

## ❌ Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## 📊 Rate Limits

| Endpoint Category | Rate Limit | Window |
|------------------|------------|---------|
| OAuth | 10 requests | 1 minute |
| Publishing | 100 requests | 1 hour |
| Moderation | 50 requests | 1 minute |
| Localization | 200 requests | 1 hour |
| Prompt Versioning | 100 requests | 1 hour |
| Experimentation | 50 requests | 1 hour |
| Admin | 20 requests | 1 minute |

## 🔄 Webhooks

The system supports webhooks for real-time notifications:

### Webhook Events
- `veo.job.created`
- `veo.job.updated`
- `veo.job.completed`
- `veo.job.failed`
- `publish.job.created`
- `publish.job.completed`
- `publish.job.failed`
- `moderation.result.created`
- `moderation.result.updated`
- `experiment.started`
- `experiment.completed`

### Webhook Payload
```json
{
  "event_type": "veo.job.completed",
  "data": {
    "job_id": "job-123",
    "organization_id": "org-123",
    "user_id": "user-123",
    "status": "completed",
    "result": {
      "video_url": "https://cdn.example.com/videos/job-123.mp4",
      "thumbnail_url": "https://cdn.example.com/thumbnails/job-123.jpg"
    },
    "completed_at": "2024-01-01T00:00:00Z"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Webhook Signature
```http
X-Veo-Signature: t=1704067200, s=abc123def456...
```

## 📚 SDKs and Libraries

### JavaScript/Node.js
```bash
npm install @veo3/sdk
```

```javascript
import { Veo3Client } from '@veo3/sdk';

const client = new Veo3Client({
  apiKey: 'your-api-key',
  baseUrl: 'https://your-domain.com/api'
});

// Create publish job
const job = await client.publishing.createJob({
  veoJobId: 'job-123',
  orgId: 'org-123',
  provider: 'tiktok',
  caption: 'Check out this video!'
});
```

### Python
```bash
pip install veo3-sdk
```

```python
from veo3 import Veo3Client

client = Veo3Client(
    api_key='your-api-key',
    base_url='https://your-domain.com/api'
)

# Create publish job
job = client.publishing.create_job(
    veo_job_id='job-123',
    org_id='org-123',
    provider='tiktok',
    caption='Check out this video!'
)
```

## 🆘 Support

For API support and questions:
- **Documentation**: [https://docs.veo3.com](https://docs.veo3.com)
- **Support Email**: support@veo3.com
- **Status Page**: [https://status.veo3.com](https://status.veo3.com)
- **GitHub Issues**: [https://github.com/veo3/api/issues](https://github.com/veo3/api/issues)

