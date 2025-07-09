-- Email and SMS Marketing System
-- Migration: 20250101000002_email_sms_marketing.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'welcome', 'abandoned_cart', 'reengagement', 'new_drop', 'holiday_sale', 
        'back_in_stock', 'order_confirmation', 'shipping_update', 'review_request', 
        'loyalty_reward', 'flash_sale', 'product_recommendation'
    )),
    subject VARCHAR(255) NOT NULL,
    preview_text TEXT,
    content TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS Templates Table
CREATE TABLE IF NOT EXISTS sms_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'welcome', 'abandoned_cart', 'reengagement', 'new_drop', 'holiday_sale', 
        'back_in_stock', 'order_confirmation', 'shipping_update', 'review_request', 
        'loyalty_reward', 'flash_sale', 'product_recommendation'
    )),
    content TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Segments Table
CREATE TABLE IF NOT EXISTS customer_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL DEFAULT '[]',
    customer_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('email', 'sms', 'both')),
    template_id UUID,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    target_audience TEXT[] DEFAULT '{}',
    scheduled_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled')),
    metrics JSONB DEFAULT '{
        "sent": 0,
        "delivered": 0,
        "opened": 0,
        "clicked": 0,
        "unsubscribed": 0,
        "revenue_generated": 0
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Recipients Table (for tracking who received what)
CREATE TABLE IF NOT EXISTS campaign_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_name VARCHAR(255),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    revenue_generated DECIMAL(10,2) DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

-- Email/SMS Subscribers Table
CREATE TABLE IF NOT EXISTS subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_email_subscribed BOOLEAN DEFAULT true,
    is_sms_subscribed BOOLEAN DEFAULT true,
    preferences JSONB DEFAULT '{
        "email_frequency": "weekly",
        "sms_frequency": "monthly",
        "categories": ["welcome", "new_drop", "holiday_sale"]
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unsubscribe Log Table
CREATE TABLE IF NOT EXISTS unsubscribe_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    unsubscribe_type VARCHAR(10) NOT NULL CHECK (unsubscribe_type IN ('email', 'sms', 'both')),
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email/SMS Delivery Log Table
CREATE TABLE IF NOT EXISTS delivery_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES campaign_recipients(id) ON DELETE CASCADE,
    delivery_type VARCHAR(10) NOT NULL CHECK (delivery_type IN ('email', 'sms')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'delivered', 'failed', 'bounced')),
    error_message TEXT,
    provider_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_sms_templates_category ON sms_templates(category);
CREATE INDEX IF NOT EXISTS idx_sms_templates_active ON sms_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_date ON campaigns(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_email ON campaign_recipients(customer_email);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_phone ON campaign_recipients(customer_phone);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_phone ON subscribers(phone);
CREATE INDEX IF NOT EXISTS idx_delivery_log_campaign_id ON delivery_log(campaign_id);
CREATE INDEX IF NOT EXISTS idx_delivery_log_status ON delivery_log(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sms_templates_updated_at BEFORE UPDATE ON sms_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscribers_updated_at BEFORE UPDATE ON subscribers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update campaign metrics
CREATE OR REPLACE FUNCTION update_campaign_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update campaign metrics when delivery log is updated
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE campaigns 
        SET metrics = jsonb_build_object(
            'sent', (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id),
            'delivered', (SELECT COUNT(*) FROM delivery_log WHERE campaign_id = NEW.campaign_id AND status = 'delivered'),
            'opened', (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id AND opened_at IS NOT NULL),
            'clicked', (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id AND clicked_at IS NOT NULL),
            'unsubscribed', (SELECT COUNT(*) FROM unsubscribe_log WHERE campaign_id = NEW.campaign_id),
            'revenue_generated', COALESCE((SELECT SUM(revenue_generated) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id), 0)
        )
        WHERE id = NEW.campaign_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for campaign metrics
CREATE TRIGGER update_campaign_metrics_trigger 
    AFTER INSERT OR UPDATE ON delivery_log 
    FOR EACH ROW EXECUTE FUNCTION update_campaign_metrics();

-- Insert sample email templates
INSERT INTO email_templates (name, category, subject, preview_text, content, variables) VALUES
(
    'Welcome Series - Fashion Brand',
    'welcome',
    'Welcome to StyleHub! 🎉 Your exclusive 20% off awaits',
    'Start your journey with us and discover amazing fashion. Plus, get 20% off your first order!',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Welcome to StyleHub! 🎉</h1>
        <p>Hi {{customer_name}},</p>
        <p>We''re thrilled to have you join the StyleHub family! You''re now part of an exclusive community of fashion enthusiasts.</p>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0;">🎁 Welcome Gift: 20% OFF</h2>
            <p style="font-size: 18px; margin: 0;">Use code: <strong>WELCOME20</strong></p>
            <p style="font-size: 14px; margin: 10px 0 0 0;">Valid for 7 days</p>
        </div>
        <h3>What makes StyleHub special?</h3>
        <ul>
            <li>✨ Premium fashion items</li>
            <li>🚚 Fast, free shipping</li>
            <li>💎 Exclusive member benefits</li>
            <li>🎯 Personalized recommendations</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{website_url}}" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Start Shopping Now</a>
        </div>
        <p>Happy shopping!</p>
        <p>The StyleHub Team</p>
    </div>',
    ARRAY['{{customer_name}}', '{{website_url}}', '{{brand_name}}']
),
(
    'Abandoned Cart Recovery - Tech Store',
    'abandoned_cart',
    'Don''t forget your cart! 🛒 Complete your order and save 15%',
    'Your tech items are waiting for you. Complete your purchase now and enjoy 15% off!',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Your Cart is Waiting! 🛒</h1>
        <p>Hi {{customer_name}},</p>
        <p>We noticed you left some amazing tech items in your cart. Don''t let them get away!</p>
        <div style="border: 2px solid #f0f0f0; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3>Your Cart Items:</h3>
            {{cart_items}}
            <p><strong>Total: {{cart_total}}</strong></p>
        </div>
        <div style="background: #ff6b6b; color: white; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0;">🔥 Limited Time Offer!</h2>
            <p style="font-size: 18px; margin: 0;">Get 15% off when you complete your order</p>
            <p style="font-size: 14px; margin: 10px 0 0 0;">Use code: <strong>CART15</strong></p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{cart_url}}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Complete Your Order</a>
        </div>
        <p><em>This offer expires in 24 hours!</em></p>
        <p>Best regards,<br>The TechStore Team</p>
    </div>',
    ARRAY['{{customer_name}}', '{{cart_items}}', '{{cart_total}}', '{{cart_url}}']
),
(
    'New Drop Alert - Sneaker Brand',
    'new_drop',
    '🔥 NEW DROP ALERT: Limited Edition Sneakers Now Live!',
    'Be the first to shop our latest collection. Limited quantities available!',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">🔥 NEW DROP ALERT 🔥</h1>
        <p>Hi {{customer_name}},</p>
        <p>The moment you''ve been waiting for is here! Our latest sneaker collection is now live and it''s absolutely stunning.</p>
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; margin: 20px 0;">
            <h2 style="margin: 0 0 15px 0;">Limited Edition Sneakers</h2>
            <p style="font-size: 18px; margin: 0;">Starting at {{product_price}}</p>
            <p style="font-size: 14px; margin: 10px 0 0 0;">Limited quantities available</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
            <img src="{{product_image}}" alt="New Sneakers" style="max-width: 100%; border-radius: 10px;">
        </div>
        <h3>Why you''ll love this collection:</h3>
        <ul>
            <li>🎨 Unique designs you won''t find anywhere else</li>
            <li>✨ Premium quality materials</li>
            <li>🚀 Limited edition - get yours before they''re gone</li>
            <li>💎 Early access for our VIP customers</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{product_url}}" style="background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Shop the Collection</a>
        </div>
        <p><em>Don''t wait - these pieces are selling fast!</em></p>
        <p>Happy shopping!<br>The SneakerHub Team</p>
    </div>',
    ARRAY['{{customer_name}}', '{{product_name}}', '{{product_price}}', '{{product_image}}', '{{product_url}}']
),
(
    'Holiday Sale - General Store',
    'holiday_sale',
    '🎄 Holiday Sale: Up to 50% OFF + Free Shipping!',
    'Celebrate the holidays with amazing deals. Shop now and save big!',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">🎄 Holiday Sale is Here! 🎄</h1>
        <p>Hi {{customer_name}},</p>
        <p>''Tis the season to be shopping! We''re spreading holiday cheer with incredible deals on your favorite products.</p>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; margin: 20px 0;">
            <h2 style="margin: 0 0 15px 0;">🎁 HOLIDAY SALE</h2>
            <p style="font-size: 24px; margin: 0; font-weight: bold;">UP TO 50% OFF</p>
            <p style="font-size: 18px; margin: 10px 0;">+ FREE SHIPPING</p>
            <p style="font-size: 14px; margin: 10px 0 0 0;">Ends {{sale_end_date}}</p>
        </div>
        <h3>What''s on sale:</h3>
        <ul>
            <li>🎯 All categories included</li>
            <li>🚚 Free shipping on orders over $50</li>
            <li>💎 Extra 10% off with code: HOLIDAY10</li>
            <li>⏰ Limited time only</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{website_url}}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Shop the Sale</a>
        </div>
        <p><em>Don''t miss out on these amazing deals!</em></p>
        <p>Happy holidays!<br>The Store Team</p>
    </div>',
    ARRAY['{{customer_name}}', '{{website_url}}', '{{sale_end_date}}']
),
(
    'Customer Re-engagement - Beauty Brand',
    'reengagement',
    'We miss you! 💝 Special 25% off just for you',
    'It''s been a while! Come back and enjoy 25% off your next order.',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">We Miss You! 💝</h1>
        <p>Hi {{customer_name}},</p>
        <p>It''s been a while since we''ve seen you, and we''ve missed you! We hope you''re doing well.</p>
        <p>To show you how much we care, we''ve prepared something special just for you.</p>
        <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); color: #333; padding: 30px; text-align: center; border-radius: 10px; margin: 20px 0;">
            <h2 style="margin: 0 0 15px 0;">💝 Welcome Back Offer</h2>
            <p style="font-size: 24px; margin: 0; font-weight: bold;">25% OFF</p>
            <p style="font-size: 18px; margin: 10px 0;">Your Next Order</p>
            <p style="font-size: 14px; margin: 10px 0 0 0;">Use code: <strong>MISSYOU25</strong></p>
        </div>
        <h3>What''s new since you''ve been away:</h3>
        <ul>
            <li>🆕 New beauty collections</li>
            <li>🎯 Improved customer experience</li>
            <li>🚚 Faster shipping options</li>
            <li>💎 Exclusive member benefits</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{website_url}}" style="background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Come Back & Save</a>
        </div>
        <p><em>This offer is valid for 7 days only!</em></p>
        <p>We can''t wait to see you again!<br>The BeautyHub Team</p>
    </div>',
    ARRAY['{{customer_name}}', '{{website_url}}']
);

-- Insert sample SMS templates
INSERT INTO sms_templates (name, category, content, variables) VALUES
(
    'Welcome SMS - Fashion Brand',
    'welcome',
    'Welcome to StyleHub! 🎉 Use code WELCOME20 for 20% off your first order. Shop now: {{website_url}}',
    ARRAY['{{website_url}}']
),
(
    'Cart Recovery - Tech Store',
    'abandoned_cart',
    'Don''t forget your cart! 🛒 Complete your order and save 15% with code CART15. {{cart_url}}',
    ARRAY['{{cart_url}}']
),
(
    'New Drop Alert - Sneaker Brand',
    'new_drop',
    '🔥 NEW DROP: Limited Edition Sneakers is live! Limited quantities. Shop now: {{product_url}}',
    ARRAY['{{product_name}}', '{{product_url}}']
),
(
    'Holiday Sale - General Store',
    'holiday_sale',
    '🎄 Holiday Sale: Up to 50% OFF + Free Shipping! Use code HOLIDAY10 for extra savings. {{website_url}}',
    ARRAY['{{website_url}}']
),
(
    'Re-engagement - Beauty Brand',
    'reengagement',
    'We miss you! 💝 Come back and enjoy 25% off with code MISSYOU25. Valid for 7 days. {{website_url}}',
    ARRAY['{{website_url}}']
),
(
    'Flash Sale - All Categories',
    'flash_sale',
    '⚡ FLASH SALE: 40% OFF everything! Ends in 2 hours. Use code FLASH40. {{website_url}}',
    ARRAY['{{website_url}}']
),
(
    'Back in Stock - Fashion',
    'back_in_stock',
    '✅ Back in Stock: {{product_name}} is available again! Order now: {{product_url}}',
    ARRAY['{{product_name}}', '{{product_url}}']
);

-- Insert sample customer segments
INSERT INTO customer_segments (name, description, criteria, customer_count) VALUES
(
    'New Customers (Last 30 Days)',
    'Customers who made their first purchase in the last 30 days',
    '[{"field": "first_purchase_date", "operator": "greater_than", "value": "2024-12-01"}]',
    1250
),
(
    'High-Value Customers',
    'Customers who have spent over $500 in the last 6 months',
    '[{"field": "total_spent", "operator": "greater_than", "value": 500}, {"field": "last_purchase_date", "operator": "greater_than", "value": "2024-06-01"}]',
    450
),
(
    'Abandoned Cart Users',
    'Users who have items in their cart but haven''t completed purchase',
    '[{"field": "has_abandoned_cart", "operator": "equals", "value": true}]',
    3200
),
(
    'Inactive Customers (90+ Days)',
    'Customers who haven''t made a purchase in 90+ days',
    '[{"field": "last_purchase_date", "operator": "less_than", "value": "2024-09-01"}]',
    1800
),
(
    'Email Subscribers Only',
    'Customers who are subscribed to email but not SMS',
    '[{"field": "is_email_subscribed", "operator": "equals", "value": true}, {"field": "is_sms_subscribed", "operator": "equals", "value": false}]',
    5600
),
(
    'VIP Customers',
    'Customers with VIP status or high loyalty points',
    '[{"field": "loyalty_tier", "operator": "equals", "value": "vip"}]',
    280
);

-- Insert sample campaigns
INSERT INTO campaigns (name, type, template_id, subject, content, target_audience, status, metrics) VALUES
(
    'Welcome Email Campaign - December 2024',
    'email',
    (SELECT id FROM email_templates WHERE category = 'welcome' LIMIT 1),
    'Welcome to StyleHub! 🎉 Your exclusive 20% off awaits',
    'Welcome email content...',
    ARRAY['New Customers (Last 30 Days)'],
    'sent',
    '{"sent": 1250, "delivered": 1180, "opened": 890, "clicked": 445, "unsubscribed": 12, "revenue_generated": 15600}'
),
(
    'Holiday Sale SMS Campaign',
    'sms',
    NULL,
    NULL,
    '🎄 Holiday Sale: Up to 50% OFF + Free Shipping! Use code HOLIDAY10 for extra savings.',
    ARRAY['Email Subscribers Only', 'High-Value Customers'],
    'scheduled',
    '{"sent": 0, "delivered": 0, "opened": 0, "clicked": 0, "unsubscribed": 0, "revenue_generated": 0}'
),
(
    'Cart Recovery Email Campaign',
    'email',
    (SELECT id FROM email_templates WHERE category = 'abandoned_cart' LIMIT 1),
    'Don''t forget your cart! 🛒 Complete your order and save 15%',
    'Cart recovery email content...',
    ARRAY['Abandoned Cart Users'],
    'draft',
    '{"sent": 0, "delivered": 0, "opened": 0, "clicked": 0, "unsubscribed": 0, "revenue_generated": 0}'
),
(
    'Re-engagement Campaign - Inactive Customers',
    'both',
    (SELECT id FROM email_templates WHERE category = 'reengagement' LIMIT 1),
    'We miss you! 💝 Special 25% off just for you',
    'Re-engagement content...',
    ARRAY['Inactive Customers (90+ Days)'],
    'draft',
    '{"sent": 0, "delivered": 0, "opened": 0, "clicked": 0, "unsubscribed": 0, "revenue_generated": 0}'
);

-- Insert sample subscribers
INSERT INTO subscribers (email, phone, first_name, last_name, preferences) VALUES
('john.doe@example.com', '+1234567890', 'John', 'Doe', '{"email_frequency": "weekly", "sms_frequency": "monthly", "categories": ["welcome", "new_drop", "holiday_sale"]}'),
('jane.smith@example.com', '+1234567891', 'Jane', 'Smith', '{"email_frequency": "daily", "sms_frequency": "weekly", "categories": ["flash_sale", "back_in_stock"]}'),
('mike.wilson@example.com', '+1234567892', 'Mike', 'Wilson', '{"email_frequency": "weekly", "sms_frequency": "never", "categories": ["welcome", "holiday_sale"]}'),
('sarah.jones@example.com', '+1234567893', 'Sarah', 'Jones', '{"email_frequency": "monthly", "sms_frequency": "weekly", "categories": ["new_drop", "loyalty_reward"]}'),
('david.brown@example.com', '+1234567894', 'David', 'Brown', '{"email_frequency": "weekly", "sms_frequency": "monthly", "categories": ["abandoned_cart", "reengagement"]}');

-- Create RLS policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE unsubscribe_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_log ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (you can customize these based on your auth requirements)
CREATE POLICY "Enable read access for all users" ON email_templates FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON email_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON email_templates FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON sms_templates FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON sms_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON sms_templates FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON customer_segments FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON customer_segments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON customer_segments FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON campaigns FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON campaigns FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON campaign_recipients FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON campaign_recipients FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON subscribers FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON subscribers FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON unsubscribe_log FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON unsubscribe_log FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON delivery_log FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON delivery_log FOR INSERT WITH CHECK (true);

-- Create views for easier querying
CREATE VIEW campaign_performance AS
SELECT 
    c.id,
    c.name,
    c.type,
    c.status,
    c.created_at,
    c.metrics->>'sent' as sent_count,
    c.metrics->>'delivered' as delivered_count,
    c.metrics->>'opened' as opened_count,
    c.metrics->>'clicked' as clicked_count,
    c.metrics->>'unsubscribed' as unsubscribed_count,
    c.metrics->>'revenue_generated' as revenue_generated,
    ROUND(
        (CAST(c.metrics->>'opened' AS DECIMAL) / NULLIF(CAST(c.metrics->>'delivered' AS DECIMAL), 0)) * 100, 2
    ) as open_rate,
    ROUND(
        (CAST(c.metrics->>'clicked' AS DECIMAL) / NULLIF(CAST(c.metrics->>'opened' AS DECIMAL), 0)) * 100, 2
    ) as click_rate
FROM campaigns c;

CREATE VIEW subscriber_insights AS
SELECT 
    s.id,
    s.email,
    s.phone,
    s.first_name,
    s.last_name,
    s.is_email_subscribed,
    s.is_sms_subscribed,
    s.created_at,
    COUNT(cr.id) as campaigns_received,
    COUNT(cr.opened_at) as emails_opened,
    COUNT(cr.clicked_at) as emails_clicked,
    SUM(cr.revenue_generated) as total_revenue_generated,
    MAX(cr.sent_at) as last_campaign_date
FROM subscribers s
LEFT JOIN campaign_recipients cr ON s.email = cr.customer_email OR s.phone = cr.customer_phone
GROUP BY s.id, s.email, s.phone, s.first_name, s.last_name, s.is_email_subscribed, s.is_sms_subscribed, s.created_at;

-- Add comments for documentation
COMMENT ON TABLE email_templates IS 'Stores email marketing templates with different categories and variables';
COMMENT ON TABLE sms_templates IS 'Stores SMS marketing templates with different categories and variables';
COMMENT ON TABLE customer_segments IS 'Stores customer segments for targeted marketing campaigns';
COMMENT ON TABLE campaigns IS 'Stores marketing campaigns with metrics and targeting information';
COMMENT ON TABLE campaign_recipients IS 'Tracks individual recipients and their engagement with campaigns';
COMMENT ON TABLE subscribers IS 'Stores subscriber information and preferences';
COMMENT ON TABLE unsubscribe_log IS 'Tracks unsubscribe events for compliance and analytics';
COMMENT ON TABLE delivery_log IS 'Tracks delivery status and provider responses for campaigns'; 