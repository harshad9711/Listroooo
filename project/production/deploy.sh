#!/bin/bash
set -euo pipefail

echo "🚀 Quick Deploy Script"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please copy .env.production to .env and configure it."
    exit 1
fi

# Deploy
echo "📦 Deploying with Docker Compose..."
docker-compose up -d

echo "✅ Deployment completed!"
echo "🌐 Frontend: http://localhost"
echo "🔧 Backend: http://localhost/api/ugc/analytics"
echo "📊 Logs: docker-compose logs -f"
