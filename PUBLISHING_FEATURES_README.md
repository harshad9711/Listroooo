# Veo 3 Publishing Features

This document describes the comprehensive publishing features added to the Veo 3 Cinematic Generator, including cross-platform publishing, content moderation, localization, A/B testing, and admin tools.

## 🚀 Features Overview

### 1. Cross-Platform Publishing
- **OAuth Integration**: TikTok, Meta (Facebook/Instagram), YouTube
- **Post Scheduler**: Schedule content for optimal posting times
- **Publish Pipeline**: Queue-based publishing with retry logic
- **Multi-Platform Support**: Publish to multiple platforms simultaneously

### 2. Content Moderation & Compliance
- **Text Moderation**: Profanity, spam, and inappropriate content detection
- **Image Moderation**: Google Cloud Vision API integration
- **Video Moderation**: Thumbnail analysis and content review
- **Approval Workflow**: Human review for flagged content

### 3. Localization & TTS
- **Multi-Language Support**: English, Spanish, French, German, Italian, Portuguese
- **Caption Translation**: Automatic subtitle generation and translation
- **TTS Voiceover**: Text-to-speech with multiple voice options
- **Subtitle Generation**: VTT format with timing

### 4. Prompt Versioning & Reproducibility
- **Snapshot System**: Save and version prompts for reproducibility
- **Template Library**: Reusable prompt templates
- **Diff Comparison**: Compare different prompt versions
- **Reproduction**: Recreate videos with variations

### 5. A/B Experimentation
- **Campaign Management**: Organize experiments into campaigns
- **Traffic Splitting**: Control experiment traffic distribution
- **Performance Tracking**: Monitor engagement metrics across platforms
- **Statistical Analysis**: Calculate significance and confidence levels

### 6. Admin Tools & Audit
- **Audit Logging**: Track all system actions and changes
- **Approval System**: Human review for sensitive operations
- **System Monitoring**: Health checks and performance metrics
- **User Management**: Admin user roles and permissions

## 📋 API Endpoints

### OAuth System
```
GET  /api/oauth/:provider/connect     # Initiate OAuth flow
GET  /api/oauth/:provider/callback    # OAuth callback
GET  /api/oauth/connections           # Get OAuth connections
DELETE /api/oauth/connections/:id     # Delete OAuth connection
```

### Publishing Pipeline
```
POST /api/publishing/jobs             # Create publish job
GET  /api/publishing/jobs             # Get publish jobs
GET  /api/publishing/jobs/:id         # Get specific publish job
DELETE /api/publishing/jobs/:id       # Cancel publish job
POST /api/publishing/jobs/:id/schedule # Schedule publish job
GET  /api/publishing/analytics        # Get publishing analytics
```

### Content Moderation
```
POST /api/moderation/moderate         # Moderate content
GET  /api/moderation/results          # Get moderation results
PUT  /api/moderation/results/:id      # Update moderation result
GET  /api/moderation/dashboard        # Get moderation dashboard
GET  /api/moderation/queue            # Get moderation queue
```

### Localization
```
POST /api/localization/localize       # Localize content
POST /api/localization/localize/bulk  # Bulk localization
GET  /api/localization/voices         # Get available voices
POST /api/localization/translate      # Translate text
POST /api/localization/tts/generate   # Generate TTS audio
```

### Prompt Versioning
```
POST /api/prompt-versioning/snapshots # Create prompt snapshot
GET  /api/prompt-versioning/snapshots # Get prompt snapshots
POST /api/prompt-versioning/reproduce # Reproduce prompt
GET  /api/prompt-versioning/compare/:id1/:id2 # Compare versions
GET  /api/prompt-versioning/analytics # Get prompt analytics
```

### A/B Experimentation
```
POST /api/experimentation/campaigns   # Create campaign
GET  /api/experimentation/campaigns   # Get campaigns
POST /api/experimentation/experiments # Create experiment
POST /api/experimentation/experiments/:id/start # Start experiment
POST /api/experimentation/performance/track # Track performance
```

### Admin Tools
```
GET  /api/admin/audit/logs            # Get audit logs
POST /api/admin/audit/log             # Log audit event
GET  /api/admin/health                # Get system health
GET  /api/admin/metrics               # Get system metrics
GET  /api/admin/dashboard             # Get admin dashboard
```

## 🗄️ Database Schema

### OAuth Connections
```sql
CREATE TABLE oauth_connections (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('tiktok','meta','youtube')),
  account_name TEXT,
  access_token_enc TEXT NOT NULL,
  refresh_token_enc TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Publishing Jobs
```sql
CREATE TABLE publish_jobs (
  id UUID PRIMARY KEY,
  veo_job_id UUID NOT NULL,
  org_id UUID NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  scheduled_at TIMESTAMPTZ,
  external_post_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Prompt Snapshots
```sql
CREATE TABLE veo_prompt_snapshots (
  id UUID PRIMARY KEY,
  veo_job_id UUID,
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  json_prompt JSONB NOT NULL,
  prompt_string TEXT NOT NULL,
  config JSONB NOT NULL,
  asset_hashes JSONB NOT NULL,
  seed INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Moderation Results
```sql
CREATE TABLE veo_moderation_results (
  id UUID PRIMARY KEY,
  veo_job_id UUID NOT NULL,
  org_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  status TEXT NOT NULL,
  confidence_score DECIMAL(3,2),
  categories JSONB DEFAULT '{}',
  details JSONB DEFAULT '{}',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Localizations
```sql
CREATE TABLE veo_localizations (
  id UUID PRIMARY KEY,
  veo_job_id UUID NOT NULL,
  org_id UUID NOT NULL,
  locale TEXT NOT NULL,
  caption_file_url TEXT,
  subtitle_file_url TEXT,
  tts_audio_url TEXT,
  tts_voice TEXT,
  translation_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Campaigns & Experiments
```sql
CREATE TABLE veo_campaigns (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  budget_cents INT DEFAULT 0,
  target_platforms TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE veo_experiments (
  id UUID PRIMARY KEY,
  campaign_id UUID NOT NULL,
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  traffic_split DECIMAL(5,4) DEFAULT 0.5,
  control_prompt_snapshot_id UUID,
  variant_prompt_snapshot_id UUID,
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Audit Logs
```sql
CREATE TABLE veo_audit_logs (
  id UUID PRIMARY KEY,
  org_id UUID,
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔧 Configuration

### Environment Variables
```bash
# OAuth Providers
TIKTOK_CLIENT_ID=your_tiktok_client_id
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
YT_CLIENT_ID=your_youtube_client_id
YT_CLIENT_SECRET=your_youtube_client_secret

# Content Moderation
MODERATION_ENABLED=true
GOOGLE_CLOUD_PROJECT_ID=your_gcp_project
GOOGLE_CLOUD_CREDENTIALS_PATH=path/to/service-account.json

# Localization
LOCA_SUPPORTED=en,es,fr,de,it,pt
DEFAULT_LOCALE=en

# Media Processing
FFMPEG_PATH=/usr/bin/ffmpeg
MAX_UPLOAD_MB=12

# Security
OAUTH_ENCRYPTION_KEY=your_32_byte_oauth_encryption_key
```

### Dependencies
```json
{
  "jose": "^5.2.0",
  "node-fetch": "^3.3.2",
  "crypto-js": "^4.2.0",
  "fluent-ffmpeg": "^2.1.2",
  "bad-words": "^3.0.4",
  "@google-cloud/vision": "^4.0.2",
  "i18next": "^23.7.6",
  "i18next-fs-backend": "^2.3.1"
}
```

## 🚀 Usage Examples

### 1. Cross-Platform Publishing

```javascript
// Create OAuth connection
const authUrl = await fetch('/api/oauth/tiktok/connect?orgId=org-123');
const { authUrl } = await authUrl.json();

// Create publish job
const publishJob = await fetch('/api/publishing/jobs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    veoJobId: 'job-123',
    orgId: 'org-123',
    provider: 'tiktok',
    caption: 'Check out this amazing video!',
    hashtags: ['#ai', '#video', '#generated']
  })
});
```

### 2. Content Moderation

```javascript
// Moderate content
const moderation = await fetch('/api/moderation/moderate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    veoJobId: 'job-123',
    orgId: 'org-123',
    contentType: 'prompt',
    content: 'This is a test prompt'
  })
});

// Get moderation results
const results = await fetch('/api/moderation/results?orgId=org-123');
```

### 3. Localization

```javascript
// Localize content
const localization = await fetch('/api/localization/localize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    veoJobId: 'job-123',
    orgId: 'org-123',
    locale: 'es',
    content: 'This is a test caption',
    type: 'caption'
  })
});

// Generate TTS
const tts = await fetch('/api/localization/tts/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Hello world',
    locale: 'en',
    voice: 'en-US-Standard-A'
  })
});
```

### 4. Prompt Versioning

```javascript
// Create prompt snapshot
const snapshot = await fetch('/api/prompt-versioning/snapshots', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orgId: 'org-123',
    userId: 'user-123',
    jsonPrompt: { text: 'Test prompt' },
    promptString: 'Test prompt',
    config: { duration: 8 }
  })
});

// Reproduce prompt
const reproduction = await fetch('/api/prompt-versioning/reproduce', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    snapshotId: 'snapshot-123',
    orgId: 'org-123',
    userId: 'user-123',
    variations: { duration: 10 }
  })
});
```

### 5. A/B Experimentation

```javascript
// Create campaign
const campaign = await fetch('/api/experimentation/campaigns', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orgId: 'org-123',
    name: 'Q4 Campaign',
    description: 'Q4 marketing campaign',
    budgetCents: 100000,
    targetPlatforms: ['tiktok', 'meta']
  })
});

// Create experiment
const experiment = await fetch('/api/experimentation/experiments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    campaignId: 'campaign-123',
    orgId: 'org-123',
    name: 'Caption A/B Test',
    trafficSplit: 0.5
  })
});

// Track performance
const performance = await fetch('/api/experimentation/performance/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    veoJobId: 'job-123',
    orgId: 'org-123',
    platform: 'tiktok',
    externalPostId: 'post-123',
    metrics: {
      views: 1000,
      likes: 50,
      shares: 10,
      comments: 5,
      engagement_rate: 0.065
    }
  })
});
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run specific test suite
npm test -- publishing-features.test.js

# Run with coverage
npm run test:coverage
```

### Test Coverage
- OAuth system integration
- Publishing pipeline functionality
- Content moderation accuracy
- Localization quality
- Prompt versioning consistency
- A/B experiment validity
- Admin tool security

## 📊 Monitoring & Analytics

### Key Metrics
- **Publishing Success Rate**: Percentage of successful publishes
- **Moderation Accuracy**: False positive/negative rates
- **Localization Quality**: Translation accuracy scores
- **Experiment Performance**: A/B test statistical significance
- **System Health**: Database, Redis, and external API status

### Dashboards
- **Publishing Dashboard**: Campaign performance and scheduling
- **Moderation Dashboard**: Content review queue and statistics
- **Localization Dashboard**: Language distribution and quality metrics
- **Experiment Dashboard**: A/B test results and insights
- **Admin Dashboard**: System health and user activity

## 🔒 Security & Compliance

### Data Protection
- **Encrypted Storage**: OAuth tokens encrypted at rest
- **Secure Transmission**: HTTPS for all API communications
- **Access Control**: Role-based permissions for admin functions
- **Audit Logging**: Complete audit trail for compliance

### Content Safety
- **Automated Moderation**: AI-powered content screening
- **Human Review**: Manual approval for flagged content
- **Compliance Gates**: Platform-specific content requirements
- **Retention Policies**: Configurable data retention periods

## 🚀 Deployment

### Production Setup
1. **Database Migration**: Run migration scripts
2. **Environment Configuration**: Set all required environment variables
3. **OAuth Setup**: Configure OAuth apps for each platform
4. **Queue Workers**: Start background workers for processing
5. **Monitoring**: Set up health checks and alerting

### Scaling Considerations
- **Queue Workers**: Scale based on publishing volume
- **Database**: Use read replicas for analytics queries
- **CDN**: Cache localized content and thumbnails
- **Rate Limits**: Implement platform-specific rate limiting

## 📚 Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Contributing](./CONTRIBUTING.md)

---

For more information, see the [main Veo 3 documentation](../README.md).

