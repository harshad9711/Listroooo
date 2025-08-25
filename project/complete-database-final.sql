-- Complete Database Setup - Final Version
-- This script ensures all tables exist and are properly configured
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. CREATE ALL TABLES (if they don't exist)
-- ============================================================================

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'user',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create UGC Content table
CREATE TABLE IF NOT EXISTS ugc_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    platform_content_id VARCHAR(255) NOT NULL,
    creator_username VARCHAR(255),
    creator_id VARCHAR(255),
    content_type VARCHAR(50),
    content_url TEXT,
    thumbnail_url TEXT,
    caption TEXT,
    hashtags TEXT[],
    location VARCHAR(255),
    engagement_metrics JSONB,
    brand_mentions TEXT[],
    sentiment_score DECIMAL(3,2),
    quality_score DECIMAL(3,2),
    rights_status VARCHAR(50) DEFAULT 'unknown',
    rights_request_id UUID,
    is_approved BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(platform, platform_content_id)
);

-- Create UGC Rights Requests table
CREATE TABLE IF NOT EXISTS ugc_rights_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID REFERENCES ugc_content(id),
    brand_id UUID REFERENCES users(id),
    creator_contact VARCHAR(255),
    request_type VARCHAR(50),
    terms JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    response_message TEXT,
    response_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create UGC Analytics table
CREATE TABLE IF NOT EXISTS ugc_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID REFERENCES ugc_content(id),
    date DATE NOT NULL,
    platform VARCHAR(50),
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,4),
    conversion_rate DECIMAL(5,4),
    revenue DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(content_id, date, platform)
);

-- Create Marketing Campaigns table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(50),
    platform VARCHAR(50),
    status VARCHAR(50) DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(10,2),
    spent DECIMAL(10,2) DEFAULT 0,
    target_audience JSONB,
    content_ids UUID[],
    metrics JSONB,
    settings JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Inventory Items table
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    platform_product_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100),
    price DECIMAL(10,2),
    compare_at_price DECIMAL(10,2),
    cost DECIMAL(10,2),
    quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    available_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    status VARCHAR(50) DEFAULT 'active',
    category VARCHAR(100),
    tags TEXT[],
    images TEXT[],
    variants JSONB,
    metadata JSONB,
    last_synced TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(platform, platform_product_id)
);

-- Create Customer Interactions table
CREATE TABLE IF NOT EXISTS customer_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id VARCHAR(255),
    session_id VARCHAR(255),
    touchpoint_type VARCHAR(50),
    platform VARCHAR(50),
    content_id UUID REFERENCES ugc_content(id),
    action VARCHAR(50),
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    device_type VARCHAR(50),
    location VARCHAR(255)
);

-- Create Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    data JSONB,
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'unread',
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    type VARCHAR(50),
    severity VARCHAR(20),
    title VARCHAR(255),
    message TEXT,
    category VARCHAR(50),
    data JSONB,
    status VARCHAR(20) DEFAULT 'active',
    action_required BOOLEAN DEFAULT FALSE,
    auto_resolve BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Competitor Data table
CREATE TABLE IF NOT EXISTS competitor_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    competitor_name VARCHAR(255),
    platform VARCHAR(50),
    content_id VARCHAR(255),
    content_type VARCHAR(50),
    engagement_metrics JSONB,
    pricing_data JSONB,
    campaign_info JSONB,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Create AI Assistant Memory table
CREATE TABLE IF NOT EXISTS ai_assistant_memory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255),
    message_type VARCHAR(20),
    content TEXT,
    context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI Assistant Actions table
CREATE TABLE IF NOT EXISTS ai_assistant_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action_type VARCHAR(50),
    action_data JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 2. DROP AND RECREATE FUNCTIONS
-- ============================================================================

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS calculate_available_quantity();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to calculate available quantity
CREATE OR REPLACE FUNCTION calculate_available_quantity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.available_quantity = NEW.quantity - NEW.reserved_quantity;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- 3. DROP AND RECREATE TRIGGERS
-- ============================================================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_ugc_content_updated_at ON ugc_content;
DROP TRIGGER IF EXISTS update_ugc_rights_requests_updated_at ON ugc_rights_requests;
DROP TRIGGER IF EXISTS update_marketing_campaigns_updated_at ON marketing_campaigns;
DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON inventory_items;
DROP TRIGGER IF EXISTS update_inventory_available_quantity ON inventory_items;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ugc_content_updated_at BEFORE UPDATE ON ugc_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ugc_rights_requests_updated_at BEFORE UPDATE ON ugc_rights_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketing_campaigns_updated_at BEFORE UPDATE ON marketing_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for available quantity
CREATE TRIGGER update_inventory_available_quantity BEFORE INSERT OR UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION calculate_available_quantity();

-- ============================================================================
-- 4. CREATE INDEXES
-- ============================================================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ugc_content_platform ON ugc_content(platform);
CREATE INDEX IF NOT EXISTS idx_ugc_content_hashtags ON ugc_content USING GIN(hashtags);
CREATE INDEX IF NOT EXISTS idx_ugc_content_created_at ON ugc_content(created_at);
CREATE INDEX IF NOT EXISTS idx_ugc_analytics_content_date ON ugc_analytics(content_id, date);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_inventory_items_platform ON inventory_items(platform);
CREATE INDEX IF NOT EXISTS idx_inventory_items_quantity ON inventory_items(quantity);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_customer ON customer_interactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_user_status ON alerts(user_id, status);

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ugc_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE ugc_rights_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ugc_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_assistant_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_assistant_actions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. INSERT SAMPLE DATA
-- ============================================================================

-- Insert sample user
INSERT INTO users (email, full_name, role) 
VALUES ('admin@example.com', 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample UGC content
INSERT INTO ugc_content (platform, platform_content_id, creator_username, content_type, content_url, caption, hashtags, rights_status)
VALUES 
('instagram', 'sample_1', 'test_creator', 'image', 'https://example.com/image1.jpg', 'Sample UGC content', ARRAY['fashion', 'style'], 'available')
ON CONFLICT (platform, platform_content_id) DO NOTHING;

-- ============================================================================
-- 7. COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 Database setup completed successfully!';
    RAISE NOTICE '✅ All 12 tables created and configured';
    RAISE NOTICE '✅ Functions and triggers set up';
    RAISE NOTICE '✅ Indexes created for performance';
    RAISE NOTICE '✅ Row Level Security enabled';
    RAISE NOTICE '✅ Sample data inserted';
    RAISE NOTICE '🚀 Your UGC management platform is now fully functional!';
END $$; 