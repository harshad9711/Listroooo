#!/bin/bash

echo "🏥 Health Check"

# Check frontend
echo "Checking frontend..."
if curl -f http://localhost > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend is not responding"
fi

# Check backend
echo "Checking backend..."
if curl -f http://localhost/api/ugc/analytics > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is not responding"
fi

# Check database
echo "Checking database..."
if docker-compose exec -T postgres pg_isready -U $PGUSER > /dev/null 2>&1; then
    echo "✅ Database is healthy"
else
    echo "❌ Database is not responding"
fi
