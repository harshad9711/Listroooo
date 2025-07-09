# UGC (User Generated Content) Implementation

This document outlines the complete UGC implementation with social listening, rights management, auto-editing, AI voiceover, and hotspot generation features.

## 🎯 Overview

The UGC system provides a comprehensive solution for discovering, managing, and enhancing user-generated content from social media platforms. All features are protected behind feature flags for controlled rollout.

## 🏗️ Architecture

### Core Components

1. **UGC Service Layer** (`src/services/ugcService.ts`)
   - Social listening crawler
   - Rights management API
   - Auto-editing pipeline
   - AI voiceover service
   - Hotspot generator
   - Inbox management
   - Analytics

2. **UGC API Layer** (`src/services/ugcApi.ts`)
   - REST API endpoints
   - Fallback to service layer for development
   - Error handling and retry logic

3. **UI Components** (`src/components/ugc/`)
   - UGC Dashboard with feature flags
   - Inbox management interface
   - Auto-edit controls
   - Voiceover generation UI
   - Hotspot management

4. **Feature Flags** (`src/lib/ugcFeatureFlags.ts`)
   - Centralized feature control
   - Auto-generated from bolt CLI
   - Runtime feature checking

## 🚀 Features

### 1. Social Listening & Discovery
- **Platforms**: Instagram, TikTok, YouTube, Twitter, Facebook
- **Discovery**: Hashtag and keyword-based content discovery
- **Filtering**: Brand keyword matching and sentiment analysis
- **Storage**: Automatic content storage in database

### 2. Rights Management
- **Request Rights**: Automated rights request to content creators
- **Status Tracking**: Monitor rights approval status
- **Approval Workflow**: Streamlined approval process
- **Terms Management**: Customizable usage terms

### 3. Auto-Editing Pipeline
- **AI-Powered**: Automatic content enhancement
- **Brand Guidelines**: Apply brand filters and styling
- **Logo Placement**: Automatic brand logo insertion
- **Quality Enhancement**: Brightness, contrast, saturation adjustments

### 4. AI Voiceover Generation
- **Multiple Voices**: Male, female, neutral, energetic, calm
- **Languages**: Multi-language support
- **Script Generation**: AI-powered script creation
- **Custom Scripts**: Manual script input option

### 5. Interactive Hotspot Generation
- **Product Detection**: AI-powered product identification
- **Interactive Elements**: Clickable product links
- **CTA Buttons**: Call-to-action hotspot placement
- **Custom Hotspots**: Manual hotspot creation

### 6. Inbox Management
- **Content Review**: Streamlined content approval workflow
- **Status Tracking**: New, reviewed, approved, rejected, published
- **Filtering**: Platform, status, and search filtering
- **Bulk Operations**: Batch processing capabilities

### 7. Analytics & Reporting
- **Engagement Metrics**: Likes, comments, shares, views
- **Platform Performance**: Cross-platform comparison
- **Content Quality**: Sentiment and quality scoring
- **Trend Analysis**: Historical performance tracking

## 🔧 API Endpoints

### Content Discovery
```
POST /api/ugc/discover
GET  /api/ugc/content/:id
PUT  /api/ugc/content/:id
DELETE /api/ugc/content/:id
```

### Rights Management
```
POST /api/ugc/rights/request
GET  /api/ugc/rights/status/:contentId
POST /api/ugc/rights/approve
```

### Auto-Editing
```
POST /api/ugc/edit
GET  /api/ugc/edit/:contentId
```

### Voiceover Generation
```
POST /api/ugc/voiceover
GET  /api/ugc/voiceover/:contentId
```

### Hotspot Generation
```
POST /api/ugc/hotspots
GET  /api/ugc/hotspots/:contentId
```

### Inbox Management
```
GET  /api/ugc/inbox
PUT  /api/ugc/inbox/:id
POST /api/ugc/inbox
```

### Analytics
```
GET  /api/ugc/analytics
```

### Batch Operations
```
POST /api/ugc/batch
POST /api/ugc/search
POST /api/ugc/export
```

## 🎛️ Feature Flags

All UGC features are protected behind feature flags:

```typescript
// Check if a feature is enabled
if (isUGCFeatureEnabled('ugc.dashboard')) {
  // Render dashboard
}

// Available flags
'ugc.social-listening'      // Social listening and discovery
'ugc.auto-editing'         // Auto-editing capabilities
'ugc.voiceover-generation' // AI voiceover generation
'ugc.hotspot-generation'   // Interactive hotspot generation
'ugc.database-integration' // Database storage and management
'ugc.inbox-management'     // Inbox management interface
'ugc.auto-edit-button'     // Auto-edit button in UI
'ugc.voiceover-tab'        // Voiceover tab in editor
'ugc.hotspot-generator'    // Hotspot generator tool
'ugc.dashboard'            // UGC dashboard and analytics
```

## 🛠️ Setup & Installation

### 1. Install Dependencies
```bash
# Frontend dependencies
npm install

# API server dependencies
cd api
npm install
```

### 2. Start Development Servers
```bash
# Start frontend (Vite)
npm run dev

# Start API server (in another terminal)
cd api
npm run dev
```

### 3. Configure Feature Flags
```bash
# Enable all UGC features
./gate-ugc-flags.sh enable-all

# Enable specific features
./gate-ugc-flags.sh enable ugc.dashboard ugc.auto-editing

# Check feature status
./gate-ugc-flags.sh status
```

### 4. Run Tests
```bash
# Test UGC functionality
node test-ugc.js
```

## 📊 Database Schema

### UGC Content Table
```sql
CREATE TABLE ugc_content (
  id UUID PRIMARY KEY,
  platform VARCHAR(50) NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  author JSONB NOT NULL,
  content JSONB NOT NULL,
  engagement JSONB NOT NULL,
  rights_status VARCHAR(50) DEFAULT 'pending',
  brand_tags TEXT[],
  sentiment_score DECIMAL,
  quality_score DECIMAL,
  created_at TIMESTAMP DEFAULT NOW(),
  discovered_at TIMESTAMP DEFAULT NOW()
);
```

### UGC Inbox Table
```sql
CREATE TABLE ugc_inbox (
  id UUID PRIMARY KEY,
  content_id UUID REFERENCES ugc_content(id),
  status VARCHAR(50) DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### UGC Edits Table
```sql
CREATE TABLE ugc_edits (
  id UUID PRIMARY KEY,
  content_id UUID REFERENCES ugc_content(id),
  edit_type VARCHAR(50) NOT NULL,
  changes JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  output_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

### UGC Voiceovers Table
```sql
CREATE TABLE ugc_voiceovers (
  id UUID PRIMARY KEY,
  content_id UUID REFERENCES ugc_content(id),
  voice_type VARCHAR(50) NOT NULL,
  language VARCHAR(10) NOT NULL,
  script TEXT NOT NULL,
  audio_url TEXT,
  duration DECIMAL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

### UGC Hotspots Table
```sql
CREATE TABLE ugc_hotspots (
  id UUID PRIMARY KEY,
  content_id UUID REFERENCES ugc_content(id),
  hotspot_type VARCHAR(50) NOT NULL,
  position JSONB NOT NULL,
  size JSONB NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔒 Security Considerations

1. **API Authentication**: All endpoints require proper authentication
2. **Rate Limiting**: Implement rate limiting for API endpoints
3. **Content Validation**: Validate all user inputs and content
4. **Rights Verification**: Ensure proper rights before content usage
5. **Data Privacy**: Comply with GDPR and privacy regulations

## 🧪 Testing

### Unit Tests
```bash
# Test UGC service layer
npm test src/services/ugcService.test.ts

# Test API endpoints
npm test api/ugc-server.test.js
```

### Integration Tests
```bash
# Test complete UGC workflow
node test-ugc.js
```

### Feature Flag Tests
```bash
# Test feature flag functionality
npm test src/lib/ugcFeatureFlags.test.ts
```

## 📈 Performance Optimization

1. **Caching**: Implement Redis caching for frequently accessed data
2. **CDN**: Use CDN for content delivery
3. **Database Indexing**: Optimize database queries with proper indexing
4. **Image Optimization**: Compress and optimize images
5. **Lazy Loading**: Implement lazy loading for content

## 🔄 Deployment

### Production Setup
1. Configure environment variables
2. Set up database connections
3. Configure feature flags for production
4. Set up monitoring and logging
5. Configure CDN and caching

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost/ugc_db

# API Keys
INSTAGRAM_API_KEY=your_instagram_api_key
TIKTOK_API_KEY=your_tiktok_api_key
YOUTUBE_API_KEY=your_youtube_api_key

# Feature Flags
BOLT_API_KEY=your_bolt_api_key
BOLT_ENVIRONMENT=production

# Storage
AWS_S3_BUCKET=your_s3_bucket
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

## 📝 Usage Examples

### Discover Content
```typescript
const content = await ugcApi.discoverContent(
  ['brand', 'lifestyle'],
  ['product', 'amazing'],
  ['instagram', 'tiktok']
);
```

### Auto-Edit Content
```typescript
const edit = await ugcApi.autoEdit('content_id', {
  filter: 'vintage',
  logo_placement: {
    logo_url: '/brand-logo.png',
    position: { x: 20, y: 20 },
    size: 60,
    opacity: 0.8
  }
});
```

### Generate Voiceover
```typescript
const voiceover = await ugcApi.generateVoiceover(
  'content_id',
  'Check out this amazing product!',
  'energetic'
);
```

### Create Hotspots
```typescript
const hotspots = await ugcApi.generateHotspots('content_id');
```

## 🐛 Troubleshooting

### Common Issues

1. **Feature Flag Not Working**
   - Check if bolt CLI is installed
   - Verify feature flag configuration
   - Check environment variables

2. **API Endpoints Not Responding**
   - Verify API server is running
   - Check CORS configuration
   - Verify endpoint URLs

3. **Database Connection Issues**
   - Check database credentials
   - Verify database schema
   - Check connection pool settings

4. **Content Discovery Failing**
   - Verify API keys for social platforms
   - Check rate limits
   - Verify hashtag/keyword configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting section

---

**Note**: This implementation provides a complete UGC management system with feature flags for controlled rollout. All features are production-ready and include proper error handling, testing, and documentation. 