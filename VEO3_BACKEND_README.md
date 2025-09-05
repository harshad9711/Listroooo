# 🚀 Veo 3 Backend - LLM + Database + S3 Export

This adds a **production-ready backend** to your Veo 3 feature with:
- **Server LLM integration** (OpenAI GPT-4)
- **Database storage** (PostgreSQL + Prisma)
- **S3 export functionality**
- **Express API routes**

## 🏗️ Architecture

```
Frontend (React) → Express API → OpenAI API
                ↓
            Prisma ORM → PostgreSQL
                ↓
            AWS S3 Export
```

## 📋 Prerequisites

- **PostgreSQL database** (local or cloud)
- **OpenAI API key** (or other LLM provider)
- **AWS S3 bucket** and credentials
- **Node.js 18+** and npm

## 🚀 Quick Setup

### 1. Run Setup Script
```bash
./setup-veo3-backend.sh
```

### 2. Configure Environment
Edit `.env.local` with your credentials:
```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/listro?schema=public"

# LLM Provider
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini

# S3 Storage
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET_NAME=listro-prompts
PUBLIC_S3_BASE=https://listro-prompts.s3.amazonaws.com
```

### 3. Start Development
```bash
npm run dev
```

## 🔌 API Endpoints

### **POST** `/api/veo/idea-to-json`
Convert plain text idea to structured JSON via LLM.

**Request:**
```json
{
  "idea": "Make a 20s dramatic launch video for our new cold brew can"
}
```

**Response:**
```json
{
  "prompt": { /* structured Veo prompt */ },
  "ideaHash": "sha256-hash-of-idea"
}
```

### **POST** `/api/veo/prompts`
Save prompt to database (upserts by idea hash).

**Request:**
```json
{
  "prompt": { /* Veo prompt object */ },
  "idea": "original idea text"
}
```

**Response:**
```json
{
  "id": "prompt-id",
  "ideaHash": "hash",
  "title": "Product Name",
  "meta": { /* ... */ },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### **GET** `/api/veo/prompts`
Retrieve all prompts (latest 50).

### **GET** `/api/veo/prompts/:id`
Get specific prompt by ID.

### **POST** `/api/veo/export`
Export JSON and instructions to S3.

**Request:**
```json
{
  "id": "unique-identifier",
  "json": { /* prompt object */ },
  "instructionsText": "formatted instructions"
}
```

**Response:**
```json
{
  "jsonUrl": "https://bucket.s3.amazonaws.com/veo-prompts/id/prompt.json",
  "instructionsUrl": "https://bucket.s3.amazonaws.com/veo-prompts/id/instructions.txt"
}
```

## 🗄️ Database Schema

```sql
CREATE TABLE "VeoPrompt" (
  "id" TEXT NOT NULL,
  "title" TEXT,
  "ideaHash" TEXT NOT NULL,
  "provider" TEXT,
  "providerJobId" TEXT,
  "meta" JSONB NOT NULL,
  "story" JSONB NOT NULL,
  "visuals" JSONB NOT NULL,
  "audio" JSONB NOT NULL,
  "branding" JSONB NOT NULL,
  "deliverables" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT,

  CONSTRAINT "VeoPrompt_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VeoPrompt_ideaHash_key" UNIQUE ("ideaHash")
);
```

## 🔧 Configuration Options

### LLM Providers
Currently supports:
- **OpenAI** (GPT-4, GPT-3.5)
- **Extensible** for other providers

### Database
- **PostgreSQL** (recommended)
- **SQLite** (development only)

### S3 Storage
- **Public objects** (default)
- **Signed URLs** (remove `ACL: "public-read"`)

## 🧪 Testing

### 1. Test LLM Integration
```bash
curl -X POST http://localhost:3001/api/veo/idea-to-json \
  -H "Content-Type: application/json" \
  -d '{"idea": "Create a 15s TikTok ad for a fitness app"}'
```

### 2. Test Database Save
```bash
curl -X POST http://localhost:3001/api/veo/prompts \
  -H "Content-Type: application/json" \
  -d '{"prompt": {...}, "idea": "test idea"}'
```

### 3. Test S3 Export
```bash
curl -X POST http://localhost:3001/api/veo/export \
  -H "Content-Type: application/json" \
  -d '{"id": "test", "json": {...}}'
```

## 🚨 Troubleshooting

### Database Connection Issues
```bash
# Check connection
npx prisma db push --accept-data-loss

# Reset database
npx prisma migrate reset
```

### LLM API Errors
- Verify API key in `.env.local`
- Check rate limits
- Ensure model name is correct

### S3 Export Failures
- Verify AWS credentials
- Check bucket permissions
- Ensure bucket exists

## 🔒 Security Considerations

- **API Keys**: Never commit to version control
- **Database**: Use connection pooling in production
- **S3**: Consider signed URLs for private content
- **Rate Limiting**: Implement for LLM endpoints

## 📈 Production Deployment

### 1. Environment Variables
```bash
# Production .env
NODE_ENV=production
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
AWS_ACCESS_KEY_ID="..."
```

### 2. Database Migration
```bash
npx prisma migrate deploy
npx prisma generate
```

### 3. S3 Bucket Setup
- Create bucket with appropriate permissions
- Configure CORS if needed
- Set up lifecycle policies

## 🔄 Development Workflow

1. **Edit prompts** in the UI
2. **Generate** with server LLM or local heuristic
3. **Save** to database for persistence
4. **Export** to S3 for sharing/backup
5. **Integrate** with your Veo 3 pipeline

## 📚 Next Steps

- [ ] Add authentication to API routes
- [ ] Implement rate limiting
- [ ] Add prompt versioning
- [ ] Create prompt templates
- [ ] Add analytics tracking
- [ ] Implement webhook notifications

---

**Need help?** Check the troubleshooting section or create an issue in your repository.

