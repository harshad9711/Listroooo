#!/usr/bin/env bash
set -euo pipefail

# ─── setup-database.sh ─────────────────────────────────────────────────────
# Database setup script for Supabase project
#
# This script provides instructions and tools for setting up the database schema
# when direct CLI connection is not available.
#
# Usage:
#   1) Save this as setup-database.sh in your project root
#   2) chmod +x setup-database.sh
#   3) ./setup-database.sh

echo "🗄️ Database Setup for Supabase Project"
echo "======================================"
echo ""

# Configuration
PROJECT_REF="fviddsgjpsjvawghdkxy"
SUPABASE_URL="https://fviddsgjpsjvawghdkxy.supabase.co"
DASHBOARD_URL="https://supabase.com/dashboard/project/fviddsgjpsjvawghdkxy/sql"

echo "📊 Project Information:"
echo "  Project Reference: $PROJECT_REF"
echo "  Supabase URL: $SUPABASE_URL"
echo "  Dashboard: $DASHBOARD_URL"
echo ""

echo "🔧 Database Setup Options:"
echo ""
echo "Option 1: Manual Setup via Supabase Dashboard (Recommended)"
echo "  1. Go to: $DASHBOARD_URL"
echo "  2. Click 'New Query'"
echo "  3. Copy and paste the SQL from each migration file"
echo "  4. Run the queries in order"
echo ""

echo "Option 2: Automated Setup (if connection works)"
echo "  Run: supabase db push"
echo ""

echo "📋 Required Tables to Create:"
echo ""

# List all migration files
echo "Migration Files to Apply:"
cd supabase/migrations
for sql in $(ls *.sql | sort); do
  echo "  ✅ $sql"
done
cd ../..

echo ""
echo "🎯 Key Tables That Will Be Created:"
echo "  - users (authentication)"
echo "  - ugc_content (UGC management)"
echo "  - ugc_rights_requests (rights management)"
echo "  - ugc_analytics (analytics data)"
echo "  - marketing_campaigns (campaign management)"
echo "  - inventory_items (inventory management)"
echo "  - customer_interactions (journey tracking)"
echo "  - notifications (real-time alerts)"
echo "  - competitor_data (intelligence)"
echo ""

echo "🚀 Quick Start Commands:"
echo ""
echo "1. Open Supabase Dashboard:"
echo "   open $DASHBOARD_URL"
echo ""
echo "2. Apply migrations manually:"
echo "   - Copy content from each .sql file in supabase/migrations/"
echo "   - Paste into SQL editor"
echo "   - Run in order (by filename)"
echo ""
echo "3. Verify setup:"
echo "   - Check Tables section in dashboard"
echo "   - Verify all tables are created"
echo "   - Test API endpoints"
echo ""

echo "📚 Migration Files Content Preview:"
echo ""

# Show first few lines of each migration file
cd supabase/migrations
for sql in $(ls *.sql | sort | head -5); do
  echo "📄 $sql:"
  head -3 "$sql" | sed 's/^/  /'
  echo "  ... (truncated)"
  echo ""
done
cd ../..

echo "✅ Setup Instructions Complete!"
echo ""
echo "Next Steps:"
echo "  1. Apply database migrations"
echo "  2. Configure environment variables"
echo "  3. Set up social media API credentials"
echo "  4. Test your application"
echo ""
echo "🌐 Dashboard: $DASHBOARD_URL" 