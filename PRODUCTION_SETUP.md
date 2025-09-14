# Veo 3 Production Setup Guide

This guide covers the complete setup and deployment of the Veo 3 Cinematic Generator production service with enterprise features.

## 🏗️ Architecture Overview

### Core Components
- **API Server**: Express.js with JWT and API key authentication
- **Background Workers**: BullMQ with Redis for job processing
- **Database**: PostgreSQL with Supabase integration
- **Queue System**: Redis with BullMQ for job management
- **CDN Storage**: AWS S3 with CloudFront
- **Billing**: Stripe integration for usage-based billing
- **Monitoring**: Prometheus, Grafana, and Loki for observability

### Enterprise Features
- **Organizations & Teams**: Multi-tenant architecture with role-based permissions
- **API Keys**: Public API with rate limiting and usage tracking
- **Webhooks**: Signed webhooks with retry logic
- **Usage-based Billing**: Stripe integration with per-render pricing
- **CDN Storage**: AWS S3 with lifecycle management
- **Observability**: Comprehensive monitoring and alerting

## 📋 Prerequisites

### Required Services
- **PostgreSQL 15+**: Database
- **Redis 7+**: Queue and caching
- **AWS Account**: S3 and CloudFront
- **Stripe Account**: Billing
- **Supabase Project**: Authentication and database

### Environment Variables
Copy `env.sample` to `.env` and configure:

```bash
# Core Service
NODE_ENV=production
PORT=3000
PUBLIC_BASE_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/veo3_production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# AI Services
GEMINI_API_KEY=your_gemini_api_key
VEO_MODEL_ID=veo-3.0-generate-001

# Stripe Billing
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_RENDER=price_xxx_per_render

# AWS Storage
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=veo3-production-assets
AWS_CLOUDFRONT_DOMAIN=cdn.your-domain.com

# Security
JWT_SECRET=your_jwt_secret_key
API_KEY_SECRET=your_api_key_secret
ENCRYPTION_KEY=your_32_character_encryption_key
```

## 🚀 Quick Start

### 1. Database Setup

```bash
# Run migrations
npm run migrate

# Or manually with Supabase
psql -h your-db-host -U postgres -d veo3_production -f supabase/migrations/20241220_veo3_production_features.sql
psql -h your-db-host -U postgres -d veo3_production -f supabase/migrations/20241220_veo3_production_enterprise.sql
```

### 2. Install Dependencies

```bash
cd api
npm install
```

### 3. Start Services

```bash
# Development
npm run dev

# Production
npm start

# Workers
npm run worker
```

### 4. Docker Deployment

```bash
# Build and start all services
docker-compose -f docker-compose.production.yml up -d

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

## 🔧 Configuration

### Rate Limits
- **Free Plan**: 5 renders/day, 100 API calls/hour
- **Pro Plan**: 100 renders/day, 1,000 API calls/hour
- **Enterprise**: 1,000 renders/day, 10,000 API calls/hour

### Queue Configuration
- **Concurrency**: 2 workers per instance
- **Retry Logic**: 3 attempts with exponential backoff
- **Job Retention**: 100 completed, 50 failed

### CDN Settings
- **Asset Lifecycle**: 90 days by default
- **Storage Classes**: Standard, IA, Glacier
- **Cache TTL**: 24 hours for videos, 1 hour for thumbnails

## 📊 Monitoring Setup

### Prometheus Metrics
- HTTP request metrics
- Queue job metrics
- System resource metrics
- Custom business metrics

### Grafana Dashboards
- API performance dashboard
- Queue status dashboard
- System health dashboard
- Business metrics dashboard

### Alerting Rules
- High error rate (>5%)
- Queue backlog (>100 jobs)
- High memory usage (>80%)
- Failed webhook deliveries

## 🔐 Security Configuration

### Authentication
- **JWT**: For web users with 1-hour expiration
- **API Keys**: For public API with configurable expiration
- **Rate Limiting**: Per-user and per-organization limits

### Data Protection
- **Encryption**: AES-256 for sensitive data
- **HTTPS**: Required for all endpoints
- **CORS**: Configured for specific origins
- **Input Validation**: Zod schemas for all inputs

### Webhook Security
- **Signatures**: HMAC-SHA256 verification
- **Retry Logic**: 3 attempts with exponential backoff
- **Timeout**: 30 seconds per attempt

## 💳 Billing Setup

### Stripe Configuration
1. Create Stripe products and prices
2. Set up webhook endpoints
3. Configure payment methods
4. Test with Stripe test mode

### Usage Tracking
- Per-render pricing
- API call tracking
- Storage usage monitoring
- Bandwidth tracking

### Invoice Generation
- Daily usage aggregation
- Automatic invoice creation
- Payment failure handling
- Dunning management

## 🌐 CDN Configuration

### AWS S3 Setup
1. Create S3 bucket with versioning
2. Configure lifecycle policies
3. Set up CloudFront distribution
4. Configure CORS policies

### Asset Management
- Automatic upload to S3
- CloudFront cache invalidation
- Signed URL generation
- Lifecycle cleanup

## 📈 Scaling Considerations

### Horizontal Scaling
- **API Servers**: Stateless, scale horizontally
- **Workers**: Scale based on queue depth
- **Database**: Read replicas for queries
- **Redis**: Cluster mode for high availability

### Vertical Scaling
- **Memory**: 4GB+ recommended for workers
- **CPU**: 2+ cores for video processing
- **Storage**: SSD for database and Redis
- **Network**: High bandwidth for video uploads

### Load Balancing
- **Nginx**: Reverse proxy with health checks
- **Sticky Sessions**: Not required (stateless)
- **Health Checks**: `/health` endpoint
- **Circuit Breakers**: For external services

## 🚨 Troubleshooting

### Common Issues

#### Queue Jobs Stuck
```bash
# Check queue status
redis-cli LLEN bull:veo:start:waiting

# Clear stuck jobs
redis-cli DEL bull:veo:start:waiting
```

#### Database Connection Issues
```bash
# Check connection
psql -h your-db-host -U postgres -d veo3_production -c "SELECT 1"

# Check migrations
psql -h your-db-host -U postgres -d veo3_production -c "\dt"
```

#### CDN Upload Failures
```bash
# Check AWS credentials
aws s3 ls s3://your-bucket

# Check CloudFront status
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID
```

### Log Analysis
```bash
# API logs
docker-compose logs -f api

# Worker logs
docker-compose logs -f workers

# All services
docker-compose logs -f
```

### Performance Tuning
- **Database**: Add indexes for frequent queries
- **Redis**: Configure memory policies
- **Queue**: Adjust concurrency based on load
- **CDN**: Optimize cache headers

## 🔄 Backup & Recovery

### Database Backups
```bash
# Create backup
pg_dump -h your-db-host -U postgres veo3_production > backup.sql

# Restore backup
psql -h your-db-host -U postgres veo3_production < backup.sql
```

### Redis Backups
```bash
# Create backup
redis-cli BGSAVE

# Copy backup file
cp /var/lib/redis/dump.rdb /backup/redis-$(date +%Y%m%d).rdb
```

### CDN Assets
- S3 versioning enabled
- Cross-region replication
- Lifecycle policies for cost optimization

## 📚 API Documentation

### Authentication
- **Web Users**: JWT token in Authorization header
- **API Users**: API key in X-API-Key header

### Rate Limits
- **Headers**: X-RateLimit-Limit, X-RateLimit-Remaining
- **Response**: 429 status code when exceeded

### Webhooks
- **Signature**: X-Veo-Signature header
- **Events**: video.created, video.completed, etc.
- **Retry**: Automatic with exponential backoff

## 🎯 Production Checklist

### Pre-deployment
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backup strategy implemented

### Post-deployment
- [ ] Health checks passing
- [ ] Metrics collection working
- [ ] Alerts configured
- [ ] Load testing completed
- [ ] Documentation updated

### Ongoing Maintenance
- [ ] Regular security updates
- [ ] Performance monitoring
- [ ] Capacity planning
- [ ] Backup verification
- [ ] Log rotation

## 📞 Support

### Monitoring
- **Grafana**: http://localhost:3001
- **Prometheus**: http://localhost:9090
- **Health Check**: http://localhost:3000/health

### Logs
- **API Logs**: Structured JSON logs
- **Worker Logs**: Separate worker logs
- **System Logs**: Docker container logs

### Alerts
- **Email**: Configured via environment
- **Slack**: Webhook integration
- **PagerDuty**: For critical alerts

---

For additional support, please refer to the [API Documentation](./VEO3_PRODUCTION_FEATURES_README.md) or contact the development team.

