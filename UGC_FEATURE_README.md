# UGC (User Generated Content) Feature Implementation

## Overview

This document outlines the comprehensive UGC feature implementation that enables efficient management, curation, and utilization of user-generated content across multiple social media platforms.

## Features

### 🎯 Core Functionality
- **Multi-Platform Integration**: Instagram, Facebook, TikTok, Twitter, YouTube
- **Content Curation**: Review, approve, reject, and feature UGC content
- **Campaign Management**: Create and track UGC campaigns
- **Analytics Dashboard**: Comprehensive insights and metrics
- **Automated Workflows**: AI-powered content processing and editing

### 📱 Instagram Integration
- **Graph API Integration**: Direct connection to Instagram Business accounts
- **Hashtag Discovery**: Search and monitor relevant hashtags
- **Content Import**: Bulk import of recent media and hashtag-based content
- **Engagement Metrics**: Real-time likes, comments, and engagement data

### 🎨 Content Enhancement
- **Auto-Editing Pipeline**: AI-powered content editing and optimization
- **Voiceover Generation**: Automated voiceover creation for videos
- **Hotspot Generation**: Interactive product hotspots on content
- **Brand Guidelines**: Automated compliance with brand standards

### 📊 Analytics & Insights
- **Performance Metrics**: Engagement rates, reach, and conversion tracking
- **Platform Analysis**: Cross-platform performance comparison
- **Trend Analysis**: Hashtag and content trend identification
- **ROI Tracking**: Revenue attribution from UGC campaigns

## Architecture

### Database Schema

#### Core Tables
- `ugc_content`: Main content storage with platform metadata
- `ugc_campaigns`: Campaign management and tracking
- `ugc_influencers`: Influencer database and metrics
- `ugc_inbox`: Content review and approval workflow
- `ai_user_memory`: AI assistant context and preferences

#### Enhancement Tables
- `ugc_edits`: Content editing history and versions
- `ugc_voiceovers`: Voiceover generation and management
- `ugc_hotspots`: Interactive hotspot data

### Service Layer

#### Core Services
- `ugcService`: Main UGC management service
- `instagramService`: Instagram API integration
- `aiAssistantService`: AI-powered recommendations

#### Enhancement Services
- `autoEditingPipeline`: Automated content editing
- `voiceoverService`: AI voiceover generation
- `hotspotGenerator`: Interactive hotspot creation

### React Components

#### Dashboard Components
- `UGCDashboard`: Main UGC management interface
- `UGCInbox`: Content review and approval workflow
- `UGCAnalytics`: Performance metrics and insights

#### Feature Components
- `ContentGrid`: Visual content display and management
- `CampaignManager`: Campaign creation and tracking
- `SettingsPanel`: Platform integration configuration

## Setup Instructions

### 1. Environment Configuration

Add the following environment variables to your `.env` file:

```env
# Instagram Integration
REACT_APP_INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
REACT_APP_INSTAGRAM_BUSINESS_ACCOUNT_ID=your_business_account_id
REACT_APP_FACEBOOK_PAGE_ID=your_facebook_page_id

# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Services (Optional)
REACT_APP_OPENAI_API_KEY=your_openai_api_key
REACT_APP_ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

### 2. Database Migration

Run the UGC database migration:

```bash
# Apply the migration
supabase db push

# Or manually run the SQL
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/20250101000005_ugc_tables.sql
```

### 3. Instagram API Setup

#### Step 1: Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use existing app
3. Add Instagram Basic Display product
4. Configure OAuth redirect URIs

#### Step 2: Generate Access Token
1. Use the Instagram Graph API Explorer
2. Select your app and page
3. Generate a long-lived access token
4. Ensure you have `instagram_basic` permission

#### Step 3: Get Business Account ID
1. Use the Graph API to get your Instagram Business Account ID
2. Verify the account is connected to your Facebook Page
3. Test the connection with basic endpoints

### 4. Feature Flag Configuration

Enable UGC features in your feature flags:

```typescript
// src/lib/featureFlags.ts
export const UGC_FEATURES = {
  ENABLED: true,
  INSTAGRAM_INTEGRATION: true,
  AUTO_EDITING: true,
  VOICEOVER_GENERATION: true,
  HOTSPOT_GENERATION: true,
  ANALYTICS: true
};
```

## Usage Guide

### 1. Instagram Content Import

#### Manual Import
```typescript
import { ugcService } from '../services/ugcService';

// Import recent media
const importedContent = await ugcService.importFromInstagram(25, [], 'pending');

// Import by hashtag
const hashtagContent = await ugcService.importFromInstagramHashtag('hashtag_id', 25, []);
```

#### Automated Import
Set up scheduled imports using Supabase Edge Functions:

```typescript
// supabase/functions/ugc-import/index.ts
export async function handler(event: any) {
  const { data, error } = await supabase
    .from('ugc_content')
    .select('*')
    .eq('status', 'pending');
  
  // Process and import content
  await ugcService.importFromInstagram(50, [], 'pending');
}
```

### 2. Content Management

#### Review and Approve Content
```typescript
// Approve content
await ugcService.approveUGCContent('content_id');

// Reject content with reason
await ugcService.rejectUGCContent('content_id', 'Inappropriate content');

// Feature content
await ugcService.featureUGCContent('content_id');
```

#### Content Filtering
```typescript
// Get content with filters
const content = await ugcService.getUGCContent({
  status: 'approved',
  platform: 'instagram',
  tags: ['fashion', 'lifestyle'],
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31'
});
```

### 3. Campaign Management

#### Create Campaign
```typescript
const campaign = await ugcService.createUGCCampaign({
  name: 'Summer Fashion Campaign',
  description: 'User-generated content for summer fashion line',
  hashtags: ['#summerfashion', '#style', '#ootd'],
  platforms: ['instagram', 'tiktok'],
  start_date: '2024-06-01',
  end_date: '2024-08-31',
  status: 'active',
  target_metrics: {
    total_posts: 100,
    total_engagement: 10000,
    total_reach: 50000
  }
});
```

### 4. Analytics and Insights

#### Get Analytics
```typescript
const analytics = await ugcService.getUGCAnalytics('2024-01-01', '2024-12-31');

console.log('Total Content:', analytics.total_content);
console.log('Approved Content:', analytics.approved_content);
console.log('Total Engagement:', analytics.total_engagement);
console.log('Top Platforms:', analytics.top_platforms);
```

## API Reference

### Instagram Service

#### Methods
- `getBusinessAccountInfo()`: Get Instagram Business Account details
- `getRecentMedia(limit, fields)`: Fetch recent media from account
- `searchHashtags(query)`: Search for hashtags
- `getMediaByHashtag(hashtagId, limit)`: Get media by hashtag
- `getMediaInsights(mediaId)`: Get media performance insights
- `saveMediaToUGC(media, tags, status)`: Save media to UGC database
- `bulkImportMedia(mediaList, tags, status)`: Bulk import media
- `testConnection()`: Test Instagram API connection

#### Example Usage
```typescript
import { instagramService } from '../services/instagramService';

// Set credentials
instagramService.setCredentials(
  'access_token',
  'business_account_id',
  'page_id'
);

// Test connection
const connected = await instagramService.testConnection();

// Get recent media
const media = await instagramService.getRecentMedia(25, [
  'id', 'caption', 'media_type', 'media_url', 'permalink'
]);

// Search hashtags
const hashtags = await instagramService.searchHashtags('fashion');
```

### UGC Service

#### Methods
- `importFromInstagram(limit, tags, status)`: Import from Instagram
- `getUGCContent(filters)`: Get UGC content with filters
- `updateUGCContent(id, updates)`: Update content
- `approveUGCContent(id)`: Approve content
- `rejectUGCContent(id, reason)`: Reject content
- `featureUGCContent(id)`: Feature content
- `createUGCCampaign(campaign)`: Create campaign
- `getUGCCampaigns()`: Get all campaigns
- `getUGCAnalytics(dateFrom, dateTo)`: Get analytics
- `getInbox(status)`: Get inbox items
- `updateInboxStatus(itemId, status, notes)`: Update inbox status

## Testing

### Unit Tests
```bash
# Run UGC service tests
npm test -- --testPathPattern=ugcService

# Run Instagram service tests
npm test -- --testPathPattern=instagramService
```

### Integration Tests
```bash
# Test Instagram API integration
npm run test:integration:instagram

# Test UGC workflow
npm run test:integration:ugc
```

### Manual Testing
1. **Instagram Connection**: Test API connectivity and token validity
2. **Content Import**: Verify content is imported correctly
3. **Workflow Testing**: Test approval/rejection workflow
4. **Analytics**: Verify metrics are calculated correctly

## Troubleshooting

### Common Issues

#### Instagram API Errors
- **Invalid OAuth access token**: Regenerate token with correct permissions
- **Unsupported get request**: Check endpoint and field parameters
- **Rate limiting**: Implement exponential backoff

#### Database Issues
- **RLS Policy Errors**: Check row-level security policies
- **Foreign Key Constraints**: Verify referenced records exist
- **Index Performance**: Monitor query performance

#### Feature Flag Issues
- **Features Not Showing**: Check feature flag configuration
- **Conditional Rendering**: Verify flag evaluation logic

### Debug Mode
Enable debug logging:

```typescript
// Enable debug mode
localStorage.setItem('ugc_debug', 'true');

// Check debug logs
console.log('UGC Debug:', localStorage.getItem('ugc_debug'));
```

## Performance Optimization

### Database Optimization
- Use appropriate indexes for frequent queries
- Implement pagination for large datasets
- Optimize JSONB queries with GIN indexes

### API Optimization
- Implement caching for Instagram API responses
- Use batch operations for bulk imports
- Implement rate limiting and retry logic

### Frontend Optimization
- Lazy load content grids
- Implement virtual scrolling for large lists
- Use React.memo for expensive components

## Security Considerations

### API Security
- Store sensitive tokens securely
- Implement proper CORS policies
- Use environment variables for secrets

### Data Privacy
- Implement proper data retention policies
- Ensure GDPR compliance for user data
- Secure personal information handling

### Access Control
- Implement role-based access control
- Audit user actions and permissions
- Secure admin functions

## Future Enhancements

### Planned Features
- **TikTok Integration**: Direct TikTok API integration
- **AI Content Moderation**: Automated content filtering
- **Advanced Analytics**: Predictive analytics and insights
- **Mobile App**: Native mobile application
- **API Marketplace**: Third-party integrations

### Technical Improvements
- **Real-time Updates**: WebSocket integration
- **Offline Support**: Service worker implementation
- **Performance Monitoring**: Advanced metrics and alerts
- **Scalability**: Microservices architecture

## Support and Maintenance

### Monitoring
- Set up error tracking (Sentry, LogRocket)
- Monitor API rate limits and quotas
- Track performance metrics

### Updates
- Regular dependency updates
- Security patch management
- Feature flag rollouts

### Documentation
- Keep API documentation updated
- Maintain user guides and tutorials
- Document configuration changes

## Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Write comprehensive tests
3. Update documentation
4. Use conventional commits
5. Review code before merging

### Code Standards
- ESLint configuration
- Prettier formatting
- TypeScript strict mode
- React hooks best practices

---

For additional support or questions, please refer to the project documentation or contact the development team.
