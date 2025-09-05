#!/bin/bash
set -euo pipefail

# ─── Production Deployment Script ─────────────────────────────────────────────
# This script prepares and deploys the full-stack application to production
#
# Usage:
#   1) chmod +x deploy-production.sh
#   2) ./deploy-production.sh

echo "🚀 Starting Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

print_success "Prerequisites check passed"

# Step 1: Build Frontend
print_status "Building frontend for production..."
npm run build
if [ $? -eq 0 ]; then
    print_success "Frontend build completed"
else
    print_error "Frontend build failed"
    exit 1
fi

# Step 2: Prepare Backend
print_status "Preparing backend for production..."

# Check if backend .env exists
if [ ! -f "api/.env" ]; then
    print_error "Backend .env file not found. Please create api/.env with production values"
    exit 1
fi

# Create production backend directory
mkdir -p production/backend
cp -r api/* production/backend/
rm -rf production/backend/node_modules

print_success "Backend prepared for production"

# Step 3: Create production configuration
print_status "Creating production configuration..."

# Create production .env template
cat > production/backend/.env.production << EOF
# Production Database Configuration
PGHOST=\${PGHOST}
PGUSER=\${PGUSER}
PGPASSWORD=\${PGPASSWORD}
PGDATABASE=\${PGDATABASE}
PGPORT=5432

# Production JWT Configuration
JWT_SECRET=\${JWT_SECRET}

# Production Session Configuration
SESSION_SECRET=\${SESSION_SECRET}

# Production Shopify Configuration
SHOPIFY_API_KEY=\${SHOPIFY_API_KEY}
SHOPIFY_API_SECRET=\${SHOPIFY_API_SECRET}
SHOPIFY_SCOPES=read_products,read_orders,read_customers,read_inventory
SHOPIFY_REDIRECT_URI=\${SHOPIFY_REDIRECT_URI}

# Production Server Configuration
PORT=3001
NODE_ENV=production
EOF

# Create Docker configuration
cat > production/Dockerfile.backend << EOF
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY backend/ .

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "ugc-server.js"]
EOF

cat > production/Dockerfile.frontend << EOF
FROM nginx:alpine

# Copy built frontend
COPY dist/ /usr/share/nginx/html/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
EOF

# Create nginx configuration
cat > production/nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Frontend
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Handle React Router
        location / {
            try_files \$uri \$uri/ /index.html;
        }

        # API proxy
        location /api/ {
            proxy_pass http://backend:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }

        # Static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF

# Create docker-compose for production
cat > production/docker-compose.yml << EOF
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    ports:
      - "3001:3001"
    restart: unless-stopped
    depends_on:
      - postgres

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: \${PGDATABASE}
      POSTGRES_USER: \${PGUSER}
      POSTGRES_PASSWORD: \${PGPASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
EOF

# Create deployment instructions
cat > production/DEPLOYMENT_INSTRUCTIONS.md << EOF
# Production Deployment Instructions

## Prerequisites
- Docker and Docker Compose installed
- Production database credentials
- Production environment variables

## Deployment Steps

1. **Set Environment Variables**
   \`\`\`bash
   cd production
   cp .env.production .env
   # Edit .env with your production values
   \`\`\`

2. **Deploy with Docker Compose**
   \`\`\`bash
   docker-compose up -d
   \`\`\`

3. **Verify Deployment**
   - Frontend: http://localhost
   - Backend API: http://localhost/api/ugc/analytics
   - Database: localhost:5432

4. **Monitor Logs**
   \`\`\`bash
   docker-compose logs -f
   \`\`\`

## Environment Variables Required

- \`PGHOST\`: PostgreSQL host
- \`PGUSER\`: PostgreSQL user
- \`PGPASSWORD\`: PostgreSQL password
- \`PGDATABASE\`: PostgreSQL database name
- \`JWT_SECRET\`: JWT signing secret
- \`SESSION_SECRET\`: Session secret
- \`SHOPIFY_API_KEY\`: Shopify API key
- \`SHOPIFY_API_SECRET\`: Shopify API secret
- \`SHOPIFY_REDIRECT_URI\`: Shopify redirect URI

## Backup and Restore

### Backup Database
\`\`\`bash
docker-compose exec postgres pg_dump -U \$PGUSER \$PGDATABASE > backup.sql
\`\`\`

### Restore Database
\`\`\`bash
docker-compose exec -T postgres psql -U \$PGUSER \$PGDATABASE < backup.sql
\`\`\`
EOF

print_success "Production configuration created"

# Step 4: Create deployment package
print_status "Creating deployment package..."

# Copy frontend build to production directory
cp -r dist production/

print_success "Deployment package created in production/ directory"

# Step 5: Create quick deployment script
cat > production/deploy.sh << 'EOF'
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
EOF

chmod +x production/deploy.sh

print_success "Quick deploy script created"

# Step 6: Create health check script
cat > production/health-check.sh << 'EOF'
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
EOF

chmod +x production/health-check.sh

print_success "Health check script created"

# Final summary
echo ""
print_success "🎉 Production deployment preparation completed!"
echo ""
echo "📁 Production files created in: production/"
echo "📋 Next steps:"
echo "   1. cd production"
echo "   2. cp .env.production .env"
echo "   3. Edit .env with your production values"
echo "   4. ./deploy.sh"
echo ""
echo "📚 See DEPLOYMENT_INSTRUCTIONS.md for detailed instructions"
echo "" 