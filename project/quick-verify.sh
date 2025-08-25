#!/usr/bin/env bash

echo "🔍 Quick Database Verification"
echo "=============================="
echo ""

echo "Testing if database tables are working..."
echo ""

# Test a simple API call that requires database
response=$(curl -s -X POST "https://fviddsgjpsjvawghdkxy.supabase.co/functions/v1/ugc-discover" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2aWRkc2dqcHNqdmF3Z2hka3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxOTkzNjEsImV4cCI6MjA2Nzc3NTM2MX0.-ULlUT5fg0UvehnGzP3hnViehtkMlqxSSLtXERQ1FFA" \
  -H "Content-Type: application/json" \
  -d '{"hashtags": ["test"], "platforms": ["instagram"], "limit": 1}')

if [[ "$response" == *"success"* ]] && [[ "$response" != *"Failed to store"* ]]; then
    echo "✅ Database setup successful!"
    echo "🎉 Your UGC management platform is now fully functional!"
    echo ""
    echo "🌐 Test your app at: http://localhost:5174"
    echo "📊 Check Supabase dashboard for tables"
else
    echo "⚠️  Database setup may not be complete"
    echo "📋 Please ensure you've run the SQL script in Supabase"
    echo "🔗 Go to: https://supabase.com/dashboard/project/fviddsgjpsjvawghdkxy/sql"
fi

echo ""
echo "✅ Verification complete!" 