# Veo 3 Builder - Next.js

A complete Next.js implementation of the Veo 3 Builder with LLM integration, prompt management, and Veo API integration.

## Features

- **LLM Integration**: OpenAI GPT-4o-mini for idea-to-JSON conversion
- **Prompt Management**: Save, version, and rollback prompts with Prisma
- **Export System**: Signed S3 URLs for JSON and instructions
- **Veo Integration**: Send prompts to Veo API with job tracking
- **Authentication**: Supabase auth with Bearer token support
- **File Management**: Signed upload/download endpoints for assets

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `env.example` to `.env.local` and fill in your values:

```bash
cp env.example .env.local
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `OPENAI_API_KEY`: Your OpenAI API key
- `AWS_REGION`: AWS region for S3
- `S3_BUCKET_NAME`: S3 bucket name for file storage
- `VEO_API_URL`: Veo API endpoint (optional)
- `VEO_API_KEY`: Veo API key (optional)

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed database
npx prisma db seed
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## API Endpoints

### Core Veo APIs

- `POST /api/veo/idea-to-json` - Convert idea to structured JSON
- `GET /api/veo/prompts` - List user prompts
- `POST /api/veo/prompts` - Create/update prompt
- `GET /api/veo/prompts/[id]/versions` - Get prompt versions
- `POST /api/veo/prompts/[id]/rollback` - Rollback to version
- `POST /api/veo/export` - Export with signed S3 URLs
- `POST /api/veo/send` - Send to Veo API
- `GET /api/veo/jobs/[id]` - Get job status
- `POST /api/veo/webhooks/job` - Webhook receiver

### File Management

- `POST /api/files/sign-upload` - Get signed upload URL
- `GET /api/files/sign-download` - Get signed download URL

### Optional Stubs

- `POST /api/images/generate` - Image generation (501)
- `POST /api/media/tts` - Text-to-speech (501)
- `POST /api/media/captions` - Caption generation (501)

## Testing

### Manual API Tests

```bash
# Test idea-to-json
curl -X POST http://localhost:3000/api/veo/idea-to-json \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"idea": "20s cinematic product video for wireless earbuds"}'

# Test prompt creation
curl -X POST http://localhost:3000/api/veo/prompts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"prompt": {...}, "idea": "test idea"}'

# Test export
curl -X POST http://localhost:3000/api/veo/export \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"id": "test", "json": {...}, "instructionsText": "..."}'
```

## Architecture

### Data Layer
- **Prisma**: Database ORM with PostgreSQL
- **Schema**: `VeoPrompt` and `VeoPromptVersion` models
- **Migrations**: Version-controlled database changes

### Authentication
- **Supabase**: User authentication and session management
- **Bearer Tokens**: API authentication support
- **User Scoping**: All operations are user-scoped

### LLM Integration
- **OpenAI**: GPT-4o-mini for prompt generation
- **Schema Validation**: Zod for JSON validation
- **Error Handling**: Robust error handling and fallbacks

### Storage
- **AWS S3**: Private file storage
- **Signed URLs**: Secure upload/download access
- **Content Types**: Proper MIME type handling

### Veo Integration
- **Job Management**: Create and track Veo jobs
- **Webhook Support**: Receive job status updates
- **Error Diagnostics**: Detailed error reporting

## Development

### Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   └── page.tsx       # Main page
├── lib/
│   ├── auth.ts        # Authentication helpers
│   ├── prisma.ts      # Database client
│   ├── veo-schema.ts  # Zod schemas
│   ├── veo-llm.ts     # LLM integration
│   ├── veo-render.ts  # Prompt rendering
│   ├── veo-storage.ts # S3 storage
│   └── useApi.tsx     # Client API helper
└── prisma/
    └── schema.prisma  # Database schema
```

### Key Features

1. **Type Safety**: Full TypeScript support
2. **Error Handling**: Comprehensive error handling
3. **Security**: User-scoped operations and authentication
4. **Scalability**: Designed for production use
5. **Extensibility**: Easy to add new providers

## Production Deployment

1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Deploy to your preferred platform (Vercel, Railway, etc.)
5. Set up monitoring and logging

## License

MIT
