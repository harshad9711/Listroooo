#!/bin/bash

# Test script for UGC API endpoints
# This script tests the backend API with proper JWT authentication

# Generate a test JWT token
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
TEST_TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign({ userId: 'test-user', email: 'test@example.com' }, '$JWT_SECRET', { expiresIn: '1h' });
console.log(token);
")

echo "🔑 Generated test JWT token"
echo "Token: $TEST_TOKEN"
echo ""

# Test analytics endpoint
echo "📊 Testing /api/ugc/analytics..."
curl -X GET http://localhost:3001/api/ugc/analytics \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" | jq .
echo ""

# Test inbox endpoint
echo "📥 Testing /api/ugc/inbox..."
curl -X GET http://localhost:3001/api/ugc/inbox \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" | jq .
echo ""

# Test discover endpoint
echo "🔍 Testing /api/ugc/discover..."
curl -X POST http://localhost:3001/api/ugc/discover \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hashtags": ["brand", "product"],
    "brandKeywords": ["brand", "product"],
    "platforms": ["instagram", "tiktok"]
  }' | jq .
echo ""

echo "✅ API tests completed!" 