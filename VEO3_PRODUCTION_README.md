# Veo3 Production System

A production-ready AI-powered content generation system for Listro.co, featuring Claude and Cohere integration for creating high-quality videos, images, and ads.

## 🚀 Features

### Core Capabilities
- **Batch Generation**: Create multiple assets simultaneously
- **Multi-Format Support**: Videos, images, and ads
- **AI-Powered Prompts**: Claude for primary content, Cohere for variants
- **Real-time Monitoring**: Track job status and progress
- **User Feedback System**: Collect ratings and comments
- **Analytics Dashboard**: Monitor performance and usage
- **Quota Management**: Prevent abuse with daily/monthly limits

### Production Features
- **Async Job Processing**: Background processing with status updates
- **Error Handling**: Comprehensive error management and retry logic
- **User Authentication**: Secure access with Supabase Auth
- **Row Level Security**: Data isolation per user
- **Performance Optimization**: Database indexing and caching
- **Monitoring & Logging**: Track usage, errors, and performance

## 🛠 Setup Instructions

### 1. Install Dependencies

```bash
npm install @anthropic-ai/sdk cohere-ai
```

### 2. Environment Configuration

Create a `.env` file with the following variables:

```env
# AI APIs
VITE_CLAUDE_API_KEY=your_claude_api_key_here
VITE_COHERE_API_KEY=your_cohere_api_key_here

# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Feature Flags
VITE_ENABLE_VEO3_PRODUCTION=true
```

### 3. Database Setup

Run the migration to create the required tables:

```bash
# Apply the Veo3 production migration
supabase db push
```

This creates:
- `veo3_jobs` - Job management and status tracking
- `veo3_results` - Generated content storage
- `veo3_feedback` - User feedback collection
- `veo3_analytics` - Usage monitoring and insights

### 4. API Key Setup

#### Anthropic Claude
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an account and generate an API key
3. Add to your `.env` file

#### Cohere AI
1. Visit [Cohere Console](https://console.cohere.ai/)
2. Sign up and get your API key
3. Add to your `.env` file

## 📖 Usage

### Basic Generation

```typescript
import { veo3Production } from '../services/veo3Production';

// Create a single job
const job = await veo3Production.createJob(
  userId,
  'video',
  ['Create a cinematic product showcase for wireless earbuds'],
  {
    style: 'cinematic',
    tone: 'energetic',
    aspectRatio: '16:9',
    targetPlatform: 'Instagram Reels'
  }
);

// Check job status
const status = await veo3Production.getJobStatus(job.id);
```

### Batch Generation

```typescript
// Create multiple prompts for batch processing
const prompts = [
  'Create a cinematic product showcase for wireless earbuds',
  'Generate a social media ad for fitness smartwatch',
  'Design a lifestyle image for coffee subscription'
];

const batchJob = await veo3Production.createJob(
  userId,
  'batch',
  prompts,
  {
    style: 'modern',
    tone: 'professional',
    aspectRatio: '16:9',
    targetPlatform: 'Instagram'
  }
);
```

### Feedback Collection

```typescript
// Submit feedback for generated content
await veo3Production.submitFeedback(
  userId,
  resultId,
  5, // Rating 1-5
  'Excellent quality! The visual style matches our brand perfectly.'
);
```

## 🎯 Component Integration

### Veo3ProductionForm

The main generation interface with batch support:

```tsx
import Veo3ProductionForm from '../components/scanner/Veo3ProductionForm';

<Veo3ProductionForm 
  userId={user.id}
  onJobCreated={(job) => {
    console.log('New job created:', job);
  }}
/>
```

### Veo3Feedback

Collect user feedback on generated content:

```tsx
import Veo3Feedback from '../components/scanner/Veo3Feedback';

<Veo3Feedback
  resultId={result.id}
  userId={user.id}
  onFeedbackSubmitted={() => {
    console.log('Feedback submitted');
  }}
/>
```

## 📊 Analytics & Monitoring

### Get Analytics

```typescript
const analytics = await veo3Production.getAnalytics();

console.log('Success Rate:', analytics.successRate);
console.log('Average Processing Time:', analytics.averageProcessingTime);
console.log('Total Jobs:', analytics.totalJobs);
```

### User Quota Check

```typescript
// Check if user can create more jobs
const quota = await veo3Production.checkUserQuota(userId);
if (!quota.allowed) {
  console.log('Quota exceeded:', quota.message);
}
```

## 🔧 Configuration

### Job Processing Limits

Adjust concurrent job processing in `veo3Production.ts`:

```typescript
export class Veo3ProductionService {
  private maxConcurrentJobs = 5; // Adjust based on your infrastructure
  // ...
}
```

### Quota Limits

Modify daily/monthly limits in the database migration:

```sql
-- In the get_user_veo3_quota function
50::INTEGER as daily_limit, -- Adjust based on pricing tier
1000::INTEGER as monthly_limit, -- Adjust based on pricing tier
```

### AI Model Configuration

Customize AI models and parameters:

```typescript
// Claude configuration
const response = await claude.messages.create({
  model: 'claude-3-opus-20240229', // Use latest model
  max_tokens: 4000,
  temperature: 0.7, // Adjust creativity level
  // ...
});

// Cohere configuration
const response = await cohere.generate({
  model: 'command-r-plus', // Use latest model
  max_tokens: 200,
  temperature: 0.8, // Adjust creativity level
  num_generations: 3, // Number of variants
  // ...
});
```

## 🚨 Error Handling

### Common Errors

1. **API Rate Limits**
   ```typescript
   try {
     await veo3Production.createJob(/* ... */);
   } catch (error) {
     if (error.message.includes('rate limit')) {
       // Implement exponential backoff
       await new Promise(resolve => setTimeout(resolve, 1000));
     }
   }
   ```

2. **Quota Exceeded**
   ```typescript
   const quota = await veo3Production.checkUserQuota(userId);
   if (!quota.allowed) {
     // Show upgrade prompt or wait message
   }
   ```

3. **Job Processing Failures**
   ```typescript
   const job = await veo3Production.getJobStatus(jobId);
   if (job.status === 'failed') {
     console.log('Job failed:', job.error);
     // Retry or notify user
   }
   ```

## 🔒 Security

### Row Level Security

All tables have RLS policies ensuring users can only access their own data:

```sql
-- Users can only view their own jobs
CREATE POLICY "Users can view their own jobs" ON veo3_jobs
    FOR SELECT USING (auth.uid() = user_id);
```

### API Key Security

- Never commit API keys to version control
- Use environment variables for all sensitive data
- Rotate API keys regularly
- Monitor API usage for anomalies

## 📈 Performance Optimization

### Database Indexing

The migration includes optimized indexes:

```sql
CREATE INDEX idx_veo3_jobs_user_id ON veo3_jobs(user_id);
CREATE INDEX idx_veo3_jobs_status ON veo3_jobs(status);
CREATE INDEX idx_veo3_jobs_created_at ON veo3_jobs(created_at);
```

### Caching Strategy

Consider implementing Redis caching for:
- Job status queries
- User quota checks
- Analytics data

### Async Processing

Jobs are processed asynchronously to prevent UI blocking:

```typescript
// Jobs are queued and processed in background
if (this.processingJobs.size < this.maxConcurrentJobs) {
  this.processJob(data.id);
}
```

## 🧪 Testing

### Unit Tests

```typescript
// Test job creation
test('should create job successfully', async () => {
  const job = await veo3Production.createJob(
    'test-user-id',
    'video',
    ['test prompt'],
    {}
  );
  
  expect(job.status).toBe('pending');
  expect(job.prompts).toContain('test prompt');
});
```

### Integration Tests

```typescript
// Test full generation flow
test('should process job end-to-end', async () => {
  const job = await veo3Production.createJob(/* ... */);
  
  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const updatedJob = await veo3Production.getJobStatus(job.id);
  expect(updatedJob.status).toBe('completed');
});
```

## 🚀 Deployment

### Production Checklist

- [ ] Set up environment variables
- [ ] Run database migrations
- [ ] Configure API keys
- [ ] Set up monitoring and logging
- [ ] Test quota limits
- [ ] Verify RLS policies
- [ ] Monitor API usage
- [ ] Set up error alerts

### Scaling Considerations

- **Horizontal Scaling**: Use multiple instances for job processing
- **Database Scaling**: Consider read replicas for analytics queries
- **API Limits**: Monitor and adjust based on usage patterns
- **Caching**: Implement Redis for frequently accessed data

## 📞 Support

For issues or questions:

1. Check the error logs in your Supabase dashboard
2. Monitor API usage in Anthropic and Cohere consoles
3. Review the analytics dashboard for performance insights
4. Contact the development team for complex issues

## 🔄 Updates

### Version History

- **v1.0.0**: Initial production release with Claude + Cohere integration
- **v1.1.0**: Added batch processing and feedback system
- **v1.2.0**: Enhanced analytics and monitoring

### Upcoming Features

- [ ] Real-time video generation
- [ ] Advanced prompt templates
- [ ] A/B testing framework
- [ ] Export to multiple platforms
- [ ] Advanced analytics dashboard 