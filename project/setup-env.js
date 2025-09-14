import fs from 'fs';

const envContent = `# Database
DATABASE_URL="postgresql://username:password@localhost:5432/veo3_db"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# OpenAI
OPENAI_API_KEY="sk-your-openai-key-here"
OPENAI_MODEL="gpt-4o-mini"

# AWS S3
AWS_REGION="us-east-1"
S3_BUCKET_NAME="your-bucket-name"

# Veo API (example)
VEO_API_URL="https://api.veo.example.com"
VEO_API_KEY="veo_xxx"

# Server
PORT=3001
`;

fs.writeFileSync('.env', envContent);
console.log('✅ Created .env file');
