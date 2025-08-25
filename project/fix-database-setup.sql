-- Fixed Database Setup for UGC Management Platform
-- This script handles existing objects gracefully
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. DROP EXISTING TRIGGERS (if they exist)
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_ugc_content_updated_at ON ugc_content;
DROP TRIGGER IF EXISTS update_ugc_rights_requests_updated_at ON ugc_rights_requests;
DROP TRIGGER IF EXISTS update_marketing_campaigns_updated_at ON marketing_campaigns;
DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON inventory_items;
DROP TRIGGER IF EXISTS update_inventory_available_quantity ON inventory_items;

-- ============================================================================
-- 2. DROP EXISTING FUNCTIONS (if they exist)
-- ============================================================================

DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS calculate_available_quantity();

-- ============================================================================
-- 3. CREATE FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to calculate available quantity
CREATE OR REPLACE FUNCTION calculate_available_quantity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.available_quantity = NEW.quantity - NEW.reserved_quantity;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- 4. CREATE TRIGGERS
-- ============================================================================

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ugc_content_updated_at BEFORE UPDATE ON ugc_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ugc_rights_requests_updated_at BEFORE UPDATE ON ugc_rights_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketing_campaigns_updated_at BEFORE UPDATE ON marketing_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for available quantity
CREATE TRIGGER update_inventory_available_quantity BEFORE INSERT OR UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION calculate_available_quantity();

-- ============================================================================
-- 5. CREATE MISSING INDEXES (if they don't exist)
-- ============================================================================

-- Create indexes for better performance (IF NOT EXISTS)
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
-- 6. ENABLE ROW LEVEL SECURITY (if not already enabled)
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
-- 7. INSERT SAMPLE DATA (if not exists)
-- ============================================================================

-- Insert sample user
INSERT INTO users (email, full_name, role) 
VALUES ('admin@example.com', 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

-- This will show a completion message
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'All triggers and functions created/updated';
    RAISE NOTICE 'Indexes created for optimal performance';
    RAISE NOTICE 'Row Level Security enabled on all tables';
END $$; 