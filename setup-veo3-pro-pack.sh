#!/bin/bash

echo "🚀 Setting up Listro Veo 3 Pro Pack..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Please copy env.local.template to .env and configure your variables."
    echo "   Required variables:"
    echo "   - DATABASE_URL (PostgreSQL)"
    echo "   - OPENAI_API_KEY"
    echo "   - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_NAME"
    echo "   - VEO_API_URL, VEO_API_KEY"
    exit 1
fi

echo "✅ Dependencies already installed"

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

echo "🎯 Pro Pack Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Configure your .env file with the required variables"
echo "2. Start your PostgreSQL database"
echo "3. Run: npx prisma migrate dev -n veo_pro_pack"
echo "4. Start your API server: cd api && npm start"
echo "5. Start your frontend: npm run dev"
echo "6. Navigate to /veo-builder to use the Pro Pack"
echo ""
echo "Features added:"
echo "✅ User-scoped saves (works with NextAuth or falls back to demo user)"
echo "✅ Versioning + rollback (keep history of prompts per project/idea)"
echo "✅ Signed S3 URLs (no public ACL)"
echo "✅ Send to Veo button that calls your job API endpoint directly"
echo "✅ Enhanced UI with save, version, export, and send functionality"

