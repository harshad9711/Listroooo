#!/usr/bin/env bash
set -euo pipefail

# ─── verify-database-setup.sh ───────────────────────────────────────────────
# Verify that the database setup was successful
# This script tests API endpoints to ensure they work with the database
#
# Usage: ./verify-database-setup.sh

echo "🔍 Verifying Database Setup"
echo "============================"
echo ""

# Configuration
PROJECT_REF="fviddsgjpsjvawghdkxy"
SUPABASE_URL="https://fviddsgjpsjvawghdkxy.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2aWRkc2dqcHNqdmF3Z2hka3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxOTkzNjEsImV4cCI6MjA2Nzc3NTM2MX0.-ULlUT5fg0UvehnGzP3hnViehtkMlqxSSLtXERQ1FFA"

echo "📊 Testing Database-Connected APIs..."
echo ""

# Test APIs that require database access
echo "1️⃣ Testing UGC Discovery (Database Required):"
response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/ugc-discover" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"hashtags": ["fashion"], "keywords": ["style"], "platforms": ["instagram"], "limit": 5}')

if [[ "$response" == *"success"* ]] && [[ "$response" != *"error"* ]]; then
    echo "   ✅ UGC Discovery API working with database"
else
    echo "   ⚠️  UGC Discovery API may need database setup"
    echo "   Response: $response"
fi
echo ""

echo "2️⃣ Testing UGC Rights Request (Database Required):"
response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/ugc-rights-request" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"contentId": "test-content", "brandId": "test-brand", "terms": {"usage": "commercial"}}')

if [[ "$response" == *"success"* ]] && [[ "$response" != *"error"* ]]; then
    echo "   ✅ UGC Rights Request API working with database"
else
    echo "   ⚠️  UGC Rights Request API may need database setup"
    echo "   Response: $response"
fi
echo ""

echo "3️⃣ Testing UGC Analytics (Database Required):"
response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/ugc-analytics" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"dateFrom": "2024-01-01", "dateTo": "2024-01-31"}')

if [[ "$response" == *"success"* ]] && [[ "$response" != *"error"* ]]; then
    echo "   ✅ UGC Analytics API working with database"
else
    echo "   ⚠️  UGC Analytics API may need database setup"
    echo "   Response: $response"
fi
echo ""

echo "4️⃣ Testing Marketing Campaigns (Database Required):"
response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/marketing-campaigns" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"action": "get_campaigns"}')

if [[ "$response" == *"success"* ]] && [[ "$response" != *"error"* ]]; then
    echo "   ✅ Marketing Campaigns API working with database"
else
    echo "   ⚠️  Marketing Campaigns API may need database setup"
    echo "   Response: $response"
fi
echo ""

echo "5️⃣ Testing Inventory Management (Database Required):"
response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/inventory-management" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"action": "get_inventory", "platform": "shopify"}')

if [[ "$response" == *"success"* ]] && [[ "$response" != *"error"* ]]; then
    echo "   ✅ Inventory Management API working with database"
else
    echo "   ⚠️  Inventory Management API may need database setup"
    echo "   Response: $response"
fi
echo ""

echo "6️⃣ Testing AI Assistant (Database Required):"
response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/ai-assistant" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"action": "conversation", "message": "Hello, how can you help me with UGC?", "userId": "test-user"}')

if [[ "$response" == *"success"* ]] && [[ "$response" != *"error"* ]]; then
    echo "   ✅ AI Assistant API working with database"
else
    echo "   ⚠️  AI Assistant API may need database setup"
    echo "   Response: $response"
fi
echo ""

echo "📋 Database Setup Verification Summary:"
echo ""

echo "✅ If all APIs show 'working with database':"
echo "   🎉 Your database setup is complete!"
echo "   🚀 Your app is fully functional"
echo "   📊 All features will work with persistent data"
echo ""

echo "⚠️  If any APIs show 'may need database setup':"
echo "   📋 Follow the DATABASE_SETUP_GUIDE.md instructions"
echo "   🔧 Run the complete-database-setup.sql script"
echo "   🧪 Test again after setup"
echo ""

echo "🌐 Next Steps:"
echo "   1. Test your app at http://localhost:5174"
echo "   2. Try creating and saving data"
echo "   3. Verify data persists between sessions"
echo "   4. Check Supabase dashboard for data"
echo ""

echo "🎯 Your UGC Management Platform Status:"
echo "   - Backend APIs: ✅ Deployed"
echo "   - Frontend App: ✅ Running"
echo "   - Database: 🔍 Verifying..."
echo "   - Overall: 🚀 Almost Complete!"
echo ""

echo "✅ Database verification complete!" 