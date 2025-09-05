-- Simple Database Setup for UGC Management Platform
-- This creates just the essential tables needed for the APIs to work

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create UGC Content table
CREATE TABLE IF NOT EXISTS ugc_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    platform_content_id VARCHAR(255) NOT NULL,
    creator_username VARCHAR(255),
    content_type VARCHAR(50),
    content_url TEXT,
    caption TEXT,
    hashtags TEXT[],
    rights_status VARCHAR(50) DEFAULT 'unknown',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(platform, platform_content_id)
);

-- Create UGC Rights Requests table
CREATE TABLE IF NOT EXISTS ugc_rights_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID REFERENCES ugc_content(id),
    brand_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create UGC Analytics table
CREATE TABLE IF NOT EXISTS ugc_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID REFERENCES ugc_content(id),
    date DATE NOT NULL,
    platform VARCHAR(50),
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Marketing Campaigns table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Inventory Items table
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sample data
INSERT INTO users (email, full_name, role) 
VALUES ('admin@example.com', 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO ugc_content (platform, platform_content_id, creator_username, content_type, content_url, caption, hashtags)
VALUES ('instagram', 'test_1', 'test_creator', 'image', 'https://example.com/test.jpg', 'Test content', ARRAY['test'])
ON CONFLICT (platform, platform_content_id) DO NOTHING;

-- Success message
SELECT 'Database setup completed! Tables created: users, ugc_content, ugc_rights_requests, ugc_analytics, marketing_campaigns, inventory_items' as status; 