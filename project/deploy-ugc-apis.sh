#!/usr/bin/env bash
set -euo pipefail

# ─── deploy-ugc-apis.sh ─────────────────────────────────────────────────────
# Deploy new UGC APIs and test functionality
#
# Usage:
#   1) Save this as deploy-ugc-apis.sh in your project root
#   2) chmod +x deploy-ugc-apis.sh
#   3) ./deploy-ugc-apis.sh

echo "🚀 Deploying UGC APIs..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Deploy Edge Functions
echo "📦 Deploying Edge Functions..."

# Deploy UGC Discovery API
echo "  - Deploying ugc-discover..."
supabase functions deploy ugc-discover --no-verify-jwt

# Deploy UGC Rights Request API
echo "  - Deploying ugc-rights-request..."
supabase functions deploy ugc-rights-request --no-verify-jwt

# Deploy UGC Auto-Edit API
echo "  - Deploying ugc-auto-edit..."
supabase functions deploy ugc-auto-edit --no-verify-jwt

# Deploy UGC Voiceover API
echo "  - Deploying ugc-voiceover..."
supabase functions deploy ugc-voiceover --no-verify-jwt

# Deploy UGC Analytics API
echo "  - Deploying ugc-analytics..."
supabase functions deploy ugc-analytics --no-verify-jwt

# Deploy AI Assistant API
echo "  - Deploying ai-assistant..."
supabase functions deploy ai-assistant --no-verify-jwt

# Deploy Instagram Integration API
echo "  - Deploying instagram-integration..."
supabase functions deploy instagram-integration --no-verify-jwt

# Deploy TikTok Integration API
echo "  - Deploying tiktok-integration..."
supabase functions deploy tiktok-integration --no-verify-jwt

# Deploy Marketing Campaigns API
echo "  - Deploying marketing-campaigns..."
supabase functions deploy marketing-campaigns --no-verify-jwt

# Deploy Inventory Management API
echo "  - Deploying inventory-management..."
supabase functions deploy inventory-management --no-verify-jwt

# Deploy Advanced Analytics API
echo "  - Deploying advanced-analytics..."
supabase functions deploy advanced-analytics --no-verify-jwt

# Deploy Customer Journey API
echo "  - Deploying customer-journey..."
supabase functions deploy customer-journey --no-verify-jwt

# Deploy Competitor Intelligence API
echo "  - Deploying competitor-intelligence..."
supabase functions deploy competitor-intelligence --no-verify-jwt

# Deploy Real-time Notifications API
echo "  - Deploying real-time-notifications..."
supabase functions deploy real-time-notifications --no-verify-jwt

echo "✅ All APIs deployed successfully!"

# Test the APIs
echo "🧪 Testing APIs..."

# Get Supabase URL and anon key
SUPABASE_URL=$(grep VITE_SUPABASE_URL .env | cut -d '=' -f2)
SUPABASE_ANON_KEY=$(grep VITE_SUPABASE_ANON_KEY .env | cut -d '=' -f2)

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Missing Supabase environment variables"
    exit 1
fi

# Test UGC Discovery API
echo "  - Testing UGC Discovery API..."
curl -X POST "${SUPABASE_URL}/functions/v1/ugc-discover" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"hashtags": ["fashion", "lifestyle"], "keywords": ["amazing"], "platforms": ["instagram"], "limit": 5}' \
  | jq '.success' > /dev/null && echo "    ✅ UGC Discovery API working" || echo "    ❌ UGC Discovery API failed"

# Test UGC Analytics API
echo "  - Testing UGC Analytics API..."
curl -X POST "${SUPABASE_URL}/functions/v1/ugc-analytics" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"dateFrom": "2024-01-01", "dateTo": "2024-12-31"}' \
  | jq '.success' > /dev/null && echo "    ✅ UGC Analytics API working" || echo "    ❌ UGC Analytics API failed"

# Test AI Assistant API
echo "  - Testing AI Assistant API..."
curl -X POST "${SUPABASE_URL}/functions/v1/ai-assistant" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"action": "conversation", "message": "Hello, how can you help me with UGC?", "userId": "test-user"}' \
  | jq '.success' > /dev/null && echo "    ✅ AI Assistant API working" || echo "    ❌ AI Assistant API failed"

# Test Instagram Integration API
echo "  - Testing Instagram Integration API..."
curl -X POST "${SUPABASE_URL}/functions/v1/instagram-integration" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"action": "hashtag_search", "hashtag": "fashion", "limit": 5}' \
  | jq '.success' > /dev/null && echo "    ✅ Instagram Integration API working" || echo "    ❌ Instagram Integration API failed"

# Test TikTok Integration API
echo "  - Testing TikTok Integration API..."
curl -X POST "${SUPABASE_URL}/functions/v1/tiktok-integration" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"action": "hashtag_search", "hashtag": "fashion", "region": "US", "limit": 5}' \
  | jq '.success' > /dev/null && echo "    ✅ TikTok Integration API working" || echo "    ❌ TikTok Integration API failed"

# Test Marketing Campaigns API
echo "  - Testing Marketing Campaigns API..."
curl -X POST "${SUPABASE_URL}/functions/v1/marketing-campaigns" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"action": "get_campaigns"}' \
  | jq '.success' > /dev/null && echo "    ✅ Marketing Campaigns API working" || echo "    ❌ Marketing Campaigns API failed"

# Test Inventory Management API
echo "  - Testing Inventory Management API..."
curl -X POST "${SUPABASE_URL}/functions/v1/inventory-management" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"action": "get_inventory", "platform": "shopify"}' \
  | jq '.success' > /dev/null && echo "    ✅ Inventory Management API working" || echo "    ❌ Inventory Management API failed"

# Test Advanced Analytics API
echo "  - Testing Advanced Analytics API..."
curl -X POST "${SUPABASE_URL}/functions/v1/advanced-analytics" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"action": "performance_dashboard"}' \
  | jq '.success' > /dev/null && echo "    ✅ Advanced Analytics API working" || echo "    ❌ Advanced Analytics API failed"

# Test Customer Journey API
echo "  - Testing Customer Journey API..."
curl -X POST "${SUPABASE_URL}/functions/v1/customer-journey" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"action": "analyze_journey_patterns"}' \
  | jq '.success' > /dev/null && echo "    ✅ Customer Journey API working" || echo "    ❌ Customer Journey API failed"

# Test Competitor Intelligence API
echo "  - Testing Competitor Intelligence API..."
curl -X POST "${SUPABASE_URL}/functions/v1/competitor-intelligence" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"action": "monitor_competitors", "platforms": ["instagram", "tiktok"]}' \
  | jq '.success' > /dev/null && echo "    ✅ Competitor Intelligence API working" || echo "    ❌ Competitor Intelligence API failed"

# Test Real-time Notifications API
echo "  - Testing Real-time Notifications API..."
curl -X POST "${SUPABASE_URL}/functions/v1/real-time-notifications" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"action": "get_notifications", "userId": "test-user"}' \
  | jq '.success' > /dev/null && echo "    ✅ Real-time Notifications API working" || echo "    ❌ Real-time Notifications API failed"

echo "🎉 API deployment and testing completed!"
echo ""
echo "📋 Next steps:"
echo "  1. Test the UGC Dashboard at /ugc"
echo "  2. Try content discovery with hashtags"
echo "  3. Test auto-editing functionality"
echo "  4. Generate voiceovers for content"
echo "  5. Check analytics dashboard"
echo ""
echo "🔧 Available APIs:"
echo "  - POST /functions/v1/ugc-discover - Content discovery"
echo "  - POST /functions/v1/ugc-rights-request - Rights management"
echo "  - POST /functions/v1/ugc-auto-edit - Auto-editing"
echo "  - POST /functions/v1/ugc-voiceover - Voiceover generation"
echo "  - POST /functions/v1/ugc-analytics - Analytics"
echo "  - POST /functions/v1/ai-assistant - AI assistant" 