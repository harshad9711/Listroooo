# Environment Variables Setup Guide

## Required API Keys and Services

Replace the `REPLACE_ME` values in your `.env.local` file with your actual API keys:

### 🔐 **Supabase Configuration**
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
**How to get:** 
1. Go to [supabase.com](https://supabase.com)
2. Create a new project or use existing one
3. Go to Settings → API
4. Copy the Project URL and anon/public key

### 📧 **Email Service (Resend)**
```bash
VITE_RESEND_API_KEY=your_resend_api_key
```
**How to get:**
1. Go to [resend.com](https://resend.com)
2. Sign up and create an API key
3. Copy the API key

### 🔔 **Slack Notifications**
```bash
VITE_SLACK_WEBHOOK_URL=your_slack_webhook_url
```
**How to get:**
1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Create a new app
3. Enable Incoming Webhooks
4. Create a webhook URL

### 📱 **Social Media APIs**

#### Meta (Facebook/Instagram)
```bash
VITE_META_CLIENT_ID=your_meta_client_id
```
**How to get:**
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create a new app
3. Copy the App ID

#### TikTok
```bash
VITE_TIKTOK_APP_ID=your_tiktok_app_id
```
**How to get:**
1. Go to [developers.tiktok.com](https://developers.tiktok.com)
2. Create a new app
3. Copy the App ID

#### Google
```bash
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```
**How to get:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials

### 🤖 **AI Services**

#### Anthropic (Claude)
```bash
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
```
**How to get:**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up and create an API key

#### OpenAI
```bash
OPENAI_API_KEY=your_openai_api_key
```
**How to get:**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up and create an API key

### 🎥 **Video Generation (Veo3)**
```bash
VEO3_API_KEY=your_veo3_api_key
VEO3_API_SECRET=your_veo3_api_secret
VEO3_WEBHOOK_SECRET=your_webhook_secret
```
**How to get:**
1. Contact Veo3 support for API access
2. Get your API key and secret
3. Set up webhook endpoint

### 🤖 **Google AI (Veo 3)**
```bash
VITE_GOOGLE_AI_API_KEY=your_google_ai_api_key
```
**How to get:**
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign up for Google AI Studio
3. Get your API key for Veo 3 access
4. Note: Veo 3 API is currently in limited access

### ☁️ **AWS Configuration**
```bash
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_S3_BUCKET=your_s3_bucket_name
AWS_REGION=your_aws_region
```
**How to get:**
1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Create an IAM user with S3 access
3. Generate access keys
4. Create an S3 bucket

### 📊 **Analytics (Datadog)**
```bash
VITE_DD_CLIENT_TOKEN=your_datadog_client_token
VITE_DD_APP_ID=your_datadog_app_id
```
**How to get:**
1. Go to [app.datadoghq.com](https://app.datadoghq.com)
2. Create a new application
3. Get the client token and app ID

### 🔌 **External APIs**
```bash
VITE_RAPIDAPI_KEY=your_rapidapi_key
```
**How to get:**
1. Go to [rapidapi.com](https://rapidapi.com)
2. Sign up and get your API key

## 🚀 **Quick Setup Steps**

1. **Copy the template:**
   ```bash
   cp .env.local .env.local.backup
   ```

2. **Edit your .env.local file:**
   ```bash
   nano .env.local
   # or
   code .env.local
   ```

3. **Replace each REPLACE_ME with your actual values**

4. **Test the setup:**
   ```bash
   npm run dev
   ```

## ⚠️ **Important Notes**

- **Never commit your .env.local file** - it's already in .gitignore
- **Keep your API keys secure** - don't share them publicly
- **Start with essential services first:**
  - Supabase (required for basic functionality)
  - OpenAI or Anthropic (for AI features)
  - Resend (for email functionality)

## 🔧 **Optional Services**

Some features will work without all API keys, but you'll get the best experience with all services configured.

## 📞 **Need Help?**

If you need help setting up any specific service, check their official documentation or contact their support teams. 