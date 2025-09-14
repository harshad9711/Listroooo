# Veo 3 Cinematic Generator - Production Features

A comprehensive production-ready video generation system that transforms ideas into polished 8-second video creatives using Google's Veo 3 through the Gemini API, with advanced features for templates, brand kits, batch processing, and analytics.

## 🚀 Production Features

### ✅ **AI Idea→JSON Composer**
- **Server-side AI composition** using Gemini text model
- **Smart prompt generation** from plain language ideas
- **Brand kit integration** for consistent styling
- **Platform-specific optimization** (TikTok, Instagram, YouTube, etc.)
- **Input sanitization** and prompt injection protection
- **Zod schema validation** for generated JSON

### ✅ **Template Library with Tokens**
- **Reusable templates** with token substitution system
- **Dynamic content generation** using `{product_name}`, `{benefit}`, etc.
- **Template versioning** and management
- **CRUD operations** for template management
- **Batch variation generation** from templates

### ✅ **Brand Kits Management**
- **Asset management** for logos, products, and brand visuals
- **Color palette** and font management
- **Brand tone** and style guidelines
- **Asset categorization** by type (logo, product, photo, brand_visual)
- **Supabase storage integration** for secure asset storage

### ✅ **Variation Engine**
- **Batch rendering** for multiple video variations
- **Token substitution** for dynamic content
- **Concurrent processing** with rate limiting
- **Progress tracking** and status monitoring
- **Template + Brand Kit** combinations

### ✅ **FFmpeg Integration**
- **Thumbnail generation** at custom timestamps
- **SRT caption files** with timing
- **Burned-in captions** with custom styling
- **Multiple thumbnail grids** for previews
- **Video post-processing** capabilities

### ✅ **Shareable Links**
- **Signed URLs** with expiration times
- **Password protection** for sensitive content
- **Access analytics** and tracking
- **Public sharing** without authentication
- **Download and embed controls**

### ✅ **Analytics & Tracking**
- **Event tracking** for all user actions
- **Usage analytics** and performance metrics
- **Shareable link analytics** with access counts
- **Template and brand kit usage** statistics
- **User behavior insights**

## 🏗️ Architecture

### Database Schema
```sql
-- Core tables
veo_jobs (existing + new columns)
veo_templates (templates with tokens)
veo_brand_kits (brand colors, fonts, tone, compliance)
veo_brand_assets (brand assets with kind, url, role)
veo_variations (batch processing)
veo_analytics (event tracking)
veo_shareable_links (public sharing)
```

### API Endpoints

#### AI Composition
- `POST /api/veo3/compose` - Transform idea to JSON
- `GET /api/veo3/compose/status` - Check composition status

#### Template Library
- `POST /api/veo3/templates` - Create template
- `GET /api/veo3/templates` - List user templates
- `GET /api/veo3/templates/:id` - Get specific template
- `PUT /api/veo3/templates/:id` - Update template
- `DELETE /api/veo3/templates/:id` - Delete template
- `POST /api/veo3/templates/:id/generate` - Generate variation

#### Brand Kits
- `POST /api/veo3/brand-kits` - Create brand kit
- `GET /api/veo3/brand-kits` - List user brand kits
- `GET /api/veo3/brand-kits/:id` - Get specific brand kit
- `PUT /api/veo3/brand-kits/:id` - Update brand kit
- `DELETE /api/veo3/brand-kits/:id` - Delete brand kit

#### Brand Assets
- `POST /api/veo3/brand-kits/:id/assets` - Upload asset to brand kit
- `GET /api/veo3/brand-kits/:id/assets` - Get brand kit assets
- `GET /api/veo3/brand-kits/:id/assets/:kind` - Get assets by kind
- `PUT /api/veo3/brand-kits/:id/assets/:assetId` - Update brand asset
- `DELETE /api/veo3/brand-kits/:id/assets/:assetId` - Delete brand asset

#### Variation Engine
- `POST /api/veo3/variations/batch` - Create variation batch
- `POST /api/veo3/variations/batch/:id/start` - Start rendering
- `GET /api/veo3/variations/batch/:id/status` - Get batch status
- `GET /api/veo3/variations/batches` - List user batches

#### FFmpeg Processing
- `POST /api/veo3/jobs/:id/thumbnail` - Generate thumbnail
- `POST /api/veo3/jobs/:id/captions` - Generate captions
- `POST /api/veo3/jobs/:id/burn-captions` - Burn captions into video

#### Shareable Links
- `POST /api/veo3/jobs/:id/share` - Create shareable link
- `GET /api/veo3/share/:token` - Get shareable link (public)
- `GET /api/veo3/share/:token/download` - Get download URL (public)
- `GET /api/veo3/shares` - List user's shareable links
- `PUT /api/veo3/shares/:id` - Update shareable link
- `DELETE /api/veo3/shares/:id` - Delete shareable link

## 🛠️ Setup Instructions

### 1. Database Migration
```bash
# Run the production features migration
psql -d your_database -f supabase/migrations/20241220_veo3_production_features.sql
```

### 2. Environment Configuration
```bash
# Add to your .env file
GEMINI_API_KEY=your_gemini_api_key_here
VEO_MODEL_ID=veo-3.0-generate-001
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# FFmpeg (for captions and thumbnails)
# Install FFmpeg on your system
# Ubuntu/Debian: sudo apt install ffmpeg
# macOS: brew install ffmpeg
# Windows: Download from https://ffmpeg.org/
```

### 3. Install Dependencies
```bash
# Backend dependencies
cd api
npm install @google/generative-ai @supabase/supabase-js

# Frontend dependencies (already included)
npm install
```

### 4. Start the Application
```bash
# Start API server
cd api && npm start

# Start frontend (in another terminal)
npm run dev
```

## 📱 Usage Examples

### AI Idea Composition
```javascript
// Compose idea to JSON
const response = await fetch('/api/veo3/compose', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    idea: 'Create a product showcase video for a new smartphone',
    goal: 'product awareness',
    platform: 'tiktok',
    brandKitId: 'brand-kit-123'
  })
});

const { json, prompt } = await response.json();
```

### Template Creation
```javascript
// Create a template
const template = await fetch('/api/veo3/templates', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Product Showcase Template',
    description: 'A template for product showcase videos',
    tokens: ['{product_name}', '{benefit}', '{hook}'],
    baseJson: {
      idea: 'Showcase {product_name} with {benefit}',
      goal: 'product awareness',
      platform: 'tiktok',
      aspect: '9:16',
      resolution: '720p',
      durationSec: 8,
      brand: { name: 'Test Brand' },
      visualRefs: [],
      shotPlan: [
        {
          tStart: 0,
          tEnd: 2,
          action: '{hook}',
          camera: 'Close-up'
        }
      ],
      audio: { musicStyle: 'upbeat' }
    }
  })
});
```

### Brand Kit Management
```javascript
// Create a brand kit
const brandKit = await fetch('/api/veo3/brand-kits', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My Brand Kit',
    colors: ['#FF6B6B', '#4ECDC4', '#FFFFFF'],
    fonts: ['Inter', 'Arial'],
    tone: 'modern, confident, premium',
    compliance: ['No profanity', 'Family friendly', 'Professional tone']
  })
});

// Upload asset to brand kit
const asset = await fetch('/api/veo3/brand-kits/brand-kit-123/assets', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    kind: 'logo',
    url: 'https://example.com/logo.png',
    mimeType: 'image/png',
    role: 'primary'
  })
});

// Get brand kit assets
const assets = await fetch('/api/veo3/brand-kits/brand-kit-123/assets', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Variation Batch Processing
```javascript
// Create variation batch
const batch = await fetch('/api/veo3/variations/batch', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    templateId: 'template-123',
    brandKitId: 'brand-kit-123',
    variations: [
      {
        name: 'Variation 1',
        product_name: 'Amazing Phone',
        benefit: 'Super Fast Performance'
      },
      {
        name: 'Variation 2',
        product_name: 'Smart Watch',
        benefit: '24/7 Health Monitoring'
      }
    ],
    batchName: 'Product Launch Batch'
  })
});

// Start rendering
await fetch(`/api/veo3/variations/batch/${batch.id}/start`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Shareable Links
```javascript
// Create shareable link
const shareLink = await fetch('/api/veo3/jobs/job-123/share', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    expiresInHours: 24,
    allowDownload: true,
    allowEmbed: false,
    password: 'optional-password'
  })
});

// Public access (no auth required)
const publicResponse = await fetch(`/api/veo3/share/${token}`);
```

## 🔒 Security Features

### Input Validation
- **Zod schema validation** for all inputs
- **Input sanitization** to prevent XSS and injection attacks
- **Length limits** on text inputs (1000 chars for ideas)
- **URL validation** for external assets

### Authentication & Authorization
- **JWT token validation** for all protected endpoints
- **User-scoped data access** with RLS policies
- **Rate limiting** to prevent abuse
- **Idempotency keys** for duplicate request protection

### Data Protection
- **Server-side API keys** (never exposed to client)
- **Signed URLs** for secure asset access
- **Password hashing** for shareable links
- **Input sanitization** for AI prompts

## 📊 Analytics & Monitoring

### Event Tracking
- **Generation events**: started, completed, failed
- **Template usage**: creation, modification, generation
- **Brand kit usage**: creation, asset uploads
- **Shareable link access**: views, downloads, analytics

### Performance Metrics
- **Generation times** and success rates
- **Template effectiveness** and usage patterns
- **Brand kit utilization** and asset usage
- **User engagement** and feature adoption

## 🧪 Testing

### Test Suite
```bash
# Run production feature tests
cd api
npm test -- tests/veo3-production.test.js
```

### Test Coverage
- **Unit tests** for all core functions
- **Integration tests** for API endpoints
- **Security tests** for input validation
- **Error handling** and edge cases
- **Mock implementations** for external services

## 🚀 Deployment

### Production Checklist
- [ ] Database migration applied
- [ ] Environment variables configured
- [ ] FFmpeg installed on server
- [ ] Supabase storage configured
- [ ] Rate limiting configured
- [ ] Analytics tracking enabled
- [ ] Error monitoring set up
- [ ] Backup strategy implemented

### Scaling Considerations
- **Database indexing** for performance
- **CDN integration** for asset delivery
- **Queue system** for batch processing
- **Caching strategy** for templates and brand kits
- **Monitoring and alerting** for system health

## 📈 Future Enhancements

### Planned Features
- **Advanced analytics dashboard** with charts and insights
- **A/B testing framework** for template optimization
- **Collaborative features** for team management
- **API rate limiting** and usage quotas
- **Webhook support** for external integrations
- **Mobile app** for on-the-go video creation

### Integration Opportunities
- **Social media APIs** for direct publishing
- **E-commerce platforms** for product integration
- **Marketing automation** tools
- **CRM systems** for customer data
- **Analytics platforms** for advanced tracking

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests for new functionality
5. Submit a pull request

### Code Standards
- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for formatting
- **Jest/Vitest** for testing
- **Conventional commits** for version control

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- **Documentation**: Check this README and inline code comments
- **Issues**: Create a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Email**: Contact the development team for urgent issues

---

**Built with ❤️ for the future of AI-powered video creation**
