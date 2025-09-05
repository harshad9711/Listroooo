#!/bin/bash

echo "🚀 Setting up Veo 3 Backend with LLM + DB + S3..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local from template..."
    cp env.local.template .env.local
    echo "⚠️  Please edit .env.local with your real API keys and database URL"
    echo "   - DATABASE_URL (PostgreSQL connection string)"
    echo "   - OPENAI_API_KEY (your OpenAI API key)"
    echo "   - AWS credentials and S3 bucket details"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup Prisma
echo "🗄️  Setting up Prisma..."
npx prisma generate

# Check if database is accessible
echo "🔍 Checking database connection..."
if npx prisma db push --accept-data-loss; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    echo "   Please check your DATABASE_URL in .env.local"
    echo "   Make sure your PostgreSQL server is running"
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo "1. Edit .env.local with your real credentials"
echo "2. Start your Express server: npm run dev"
echo "3. Visit /veo3-prompt-builder to test the feature"
echo ""
echo "📚 Available API endpoints:"
echo "   POST /api/veo/idea-to-json - Convert idea to JSON via LLM"
echo "   POST /api/veo/prompts - Save prompt to database"
echo "   GET  /api/veo/prompts - Get all prompts"
echo "   POST /api/veo/export - Export to S3"

