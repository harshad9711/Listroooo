# Listro Veo 3 – Pro Pack

**Tailored for:** React/Vite + TypeScript + Prisma (Postgres) + Express.js + AWS S3 + Supabase Auth.

## 🚀 Features Added

* **User‑scoped saves** (works with Supabase Auth or falls back to demo user)
* **Versioning + rollback** (keep history of prompts per project/idea)
* **Signed S3 URLs** (no public ACL)
* **Send to Veo** button that calls your job API endpoint directly
* **Enhanced UI** with save, version, export, and send functionality

## 📁 Files Added/Modified

### New Files Created:
- `src/lib/prisma.ts` - Prisma client configuration
- `src/lib/auth.ts` - Auth helper for user ID management
- `src/lib/veo-schema.ts` - Veo prompt schema with validation
- `src/lib/veo-render.ts` - Veo prompt renderer
- `src/lib/veo-llm.ts` - LLM integration and hashing
- `src/lib/veo-storage.ts` - S3 storage utilities with signed URLs
- `src/pages/VeoBuilder.tsx` - Pro UI page with all features
- `setup-veo3-pro-pack.sh` - Setup script

### Modified Files:
- `prisma/schema.prisma` - Updated with VeoPrompt and VeoPromptVersion models
- `api/veo-routes.js` - Enhanced with versioning, user scoping, and new endpoints
- `env.local.template` - Added Veo API configuration

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
npm i @prisma/client prisma @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 2. Configure Environment Variables
Copy `env.local.template` to `.env` and configure:

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/listro?schema=public"

# LLM
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# AWS S3 (private bucket)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET_NAME=listro-prompts

# Veo job API (replace with your real endpoint)
VEO_API_URL=https://api.veo.example.com
VEO_API_KEY=veo_xxx
```

### 3. Database Setup
```bash
# Start your PostgreSQL database
# Then run:
npx prisma migrate dev -n veo_pro_pack
npx prisma generate
```

### 4. Start the Application
```bash
# Start API server
cd api && npm start

# Start frontend (in another terminal)
npm run dev
```

### 5. Access the Pro Pack
Navigate to `/veo-builder` to use the enhanced Veo 3 Builder.

## 🎯 API Endpoints

### Core Endpoints:
- `POST /api/veo/idea-to-json` - Convert idea to structured JSON
- `GET /api/veo/prompts` - List user's prompts
- `POST /api/veo/prompts` - Save new prompt or create new version
- `GET /api/veo/prompts/:id` - Get specific prompt
- `GET /api/veo/prompts/:id/versions` - List versions for a prompt
- `POST /api/veo/prompts/:id/rollback` - Rollback to specific version
- `POST /api/veo/export` - Export to S3 with signed URLs
- `POST /api/veo/send` - Send directly to Veo API

## 🔧 Customization

### Authentication
The Pro Pack is configured for **Supabase Auth**. The frontend automatically passes the user ID via headers:

```typescript
// Frontend automatically includes user ID in API calls
const apiCall = async (url: string, options: RequestInit = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(user?.id && { 'x-user-id': user.id }), // Supabase user ID
    ...options.headers,
  };
  return fetch(url, { ...options, headers });
};
```

The backend extracts the user ID from headers:
```javascript
// Backend extracts user ID from request headers
async function getUserId(req) {
  const userId = req.headers['x-user-id'];
  return userId || "demo-user"; // fallback for development
}
```

### Veo API Integration
Update the `/api/veo/send` endpoint in `api/veo-routes.js` to match your Veo API contract:
```javascript
// Adjust the request body to match your Veo API
body: JSON.stringify({ 
  prompt: json, 
  instructions_text: instructionsText,
  // Add your specific fields:
  // project_id: "your-project-id",
  // webhook_url: "your-webhook-url"
})
```

## 🗄️ Database Schema

### VeoPrompt Model:
- `id` - Unique identifier
- `title` - Prompt title (max 180 chars)
- `ideaHash` - SHA256 hash of the original idea
- `userId` - User who created the prompt
- `provider` - LLM provider used
- `activeVersionId` - Currently active version
- `createdAt/updatedAt` - Timestamps

### VeoPromptVersion Model:
- `id` - Unique identifier
- `promptId` - Parent prompt ID
- `version` - Version number
- `meta/story/visuals/audio/branding/deliverables` - JSON data
- `providerJobId` - Veo job ID (set when sent to Veo)
- `createdAt` - Version timestamp

## 🔐 Security Features

- **User Scoping**: All prompts are scoped to users
- **Private S3**: Files stored with private ACL, accessed via signed URLs
- **Input Validation**: All inputs validated with Zod schemas
- **Error Handling**: Comprehensive error handling throughout

## 🎨 UI Features

- **Generate**: Convert ideas to structured prompts using server LLM
- **Save**: Create new versions of existing prompts
- **Versions**: View and rollback to previous versions
- **Export**: Download JSON/text or get signed S3 URLs
- **Send to Veo**: Direct integration with Veo API
- **Copy/Download**: Easy copying and downloading of results

## 🚨 Troubleshooting

### Database Connection Issues:
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Run `npx prisma migrate dev` to create tables

### S3 Issues:
- Verify AWS credentials in .env
- Ensure S3 bucket exists and is accessible
- Check AWS_REGION matches your bucket region

### Veo API Issues:
- Verify VEO_API_URL and VEO_API_KEY
- Check API endpoint format matches your Veo service
- Review request body structure in `/api/veo/send`

## 📝 Usage Example

1. **Generate**: Enter an idea like "Make a 20s dramatic launch video for our new cold brew can"
2. **Save**: Click "Save (new version)" to store in database
3. **Iterate**: Make changes and save again to create version 2, 3, etc.
4. **Rollback**: Use "Load versions" and click any version to rollback
5. **Export**: Get signed S3 URLs for sharing or download files locally
6. **Send**: Click "Send to Veo" to submit directly to your Veo API

## 🔄 Migration from Basic Pack

If you had the basic Veo 3 pack, this Pro Pack extends it cleanly:
- Existing prompts will work (they'll be assigned to "demo-user")
- New features are additive
- No breaking changes to existing functionality

---

**Ready to build amazing video prompts with versioning, user management, and direct Veo integration!** 🎬✨
