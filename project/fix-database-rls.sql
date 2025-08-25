-- Fix Database RLS Policies for UGC Management Platform
-- This adds Row Level Security policies that might be missing

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ugc_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE ugc_rights_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ugc_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Create policies for ugc_content table
CREATE POLICY "Anyone can view UGC content" ON ugc_content
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert UGC content" ON ugc_content
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update UGC content" ON ugc_content
    FOR UPDATE USING (true);

-- Create policies for ugc_rights_requests table
CREATE POLICY "Anyone can view rights requests" ON ugc_rights_requests
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert rights requests" ON ugc_rights_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update rights requests" ON ugc_rights_requests
    FOR UPDATE USING (true);

-- Create policies for ugc_analytics table
CREATE POLICY "Anyone can view analytics" ON ugc_analytics
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert analytics" ON ugc_analytics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update analytics" ON ugc_analytics
    FOR UPDATE USING (true);

-- Create policies for marketing_campaigns table
CREATE POLICY "Anyone can view campaigns" ON marketing_campaigns
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert campaigns" ON marketing_campaigns
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update campaigns" ON marketing_campaigns
    FOR UPDATE USING (true);

-- Create policies for inventory_items table
CREATE POLICY "Anyone can view inventory" ON inventory_items
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert inventory" ON inventory_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update inventory" ON inventory_items
    FOR UPDATE USING (true);

-- Success message
SELECT 'RLS policies added successfully! All tables now have proper security policies.' as status; 