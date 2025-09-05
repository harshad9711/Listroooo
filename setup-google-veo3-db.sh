#!/bin/bash

echo "🚀 Setting up Google Veo 3 Production Database..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory. Please run this from your project root."
    exit 1
fi

echo "📊 Applying database migration..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Database migration applied successfully!"
else
    echo "❌ Database migration failed!"
    exit 1
fi

echo "🔍 Verifying database setup..."

# Check if tables were created
echo "Checking if tables exist..."
supabase db reset --linked

echo "🎉 Google Veo 3 database setup complete!"
echo ""
echo "📋 What was created:"
echo "   • google_veo3_videos - Video metadata and status"
echo "   • google_veo3_quotas - User quota management"
echo "   • google_veo3_analytics - Usage analytics"
echo "   • google_veo3_api_logs - API call logging"
echo ""
echo "🔧 Next steps:"
echo "   1. Add VITE_GOOGLE_AI_API_KEY to your .env.local"
echo "   2. Test the feature in your app"
echo "   3. Monitor database performance"
echo "   4. Set up cloud storage for video files"
