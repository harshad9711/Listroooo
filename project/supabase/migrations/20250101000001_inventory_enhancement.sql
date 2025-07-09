-- Enhanced inventory tracking for all e-commerce platforms
-- This migration adds comprehensive inventory management across Shopify, TikTok Shop, Etsy, Amazon, eBay, Walmart, WooCommerce, and more

-- Add inventory-related columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS current_stock INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 10;
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_stock_level INTEGER DEFAULT 100;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 20;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_quantity INTEGER DEFAULT 50;
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_restocked TIMESTAMP WITH TIME ZONE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS next_restock_date DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_status VARCHAR(20) DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock', 'overstocked'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight DECIMAL(8,3);
ALTER TABLE products ADD COLUMN IF NOT EXISTS dimensions VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS cross_platform_sync BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error'));

-- Create platform inventory table for multi-platform stock tracking
CREATE TABLE IF NOT EXISTS platform_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('shopify', 'tiktok', 'etsy', 'amazon', 'ebay', 'walmart', 'woocommerce', 'bigcommerce', 'magento', 'prestashop', 'opencart', 'squarespace', 'wix', 'shopify_plus', 'tiktok_shop_plus', 'amazon_fba', 'amazon_fbm', 'ebay_managed', 'etsy_plus')),
    stock_quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    available_quantity INTEGER DEFAULT 0,
    last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error')),
    platform_product_id VARCHAR(255), -- External platform product ID
    platform_variant_id VARCHAR(255), -- External platform variant ID
    platform_listing_url TEXT,
    platform_price DECIMAL(10,2),
    platform_currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, platform)
);

-- Create inventory transactions table for tracking stock movements
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    platform VARCHAR(50),
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('restock', 'sale', 'return', 'adjustment', 'damage', 'transfer', 'reservation', 'release')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER,
    new_stock INTEGER,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    reference_number VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    website TEXT,
    address TEXT,
    payment_terms VARCHAR(100),
    lead_time_days INTEGER DEFAULT 7,
    minimum_order_quantity INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    po_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'shipped', 'received', 'cancelled')),
    order_date DATE DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase order items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory alerts table
CREATE TABLE IF NOT EXISTS inventory_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'overstocked', 'reorder_point', 'expiring_soon', 'sync_error')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create platform integrations table
CREATE TABLE IF NOT EXISTS platform_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform VARCHAR(50) NOT NULL UNIQUE,
    is_connected BOOLEAN DEFAULT false,
    api_key VARCHAR(500),
    api_secret VARCHAR(500),
    access_token VARCHAR(1000),
    refresh_token VARCHAR(500),
    store_url TEXT,
    store_id VARCHAR(255),
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_frequency_minutes INTEGER DEFAULT 15,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory settings table
CREATE TABLE IF NOT EXISTS inventory_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string' CHECK (setting_type IN ('string', 'integer', 'boolean', 'json')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default inventory settings
INSERT INTO inventory_settings (setting_key, setting_value, setting_type, description) VALUES
('default_min_stock_level', '10', 'integer', 'Default minimum stock level for new products'),
('default_max_stock_level', '100', 'integer', 'Default maximum stock level for new products'),
('default_reorder_point', '20', 'integer', 'Default reorder point for new products'),
('default_reorder_quantity', '50', 'integer', 'Default reorder quantity for new products'),
('low_stock_threshold', '15', 'integer', 'Percentage threshold for low stock alerts'),
('overstock_threshold', '80', 'integer', 'Percentage threshold for overstock alerts'),
('auto_sync_enabled', 'true', 'boolean', 'Enable automatic inventory sync across platforms'),
('sync_frequency_minutes', '15', 'integer', 'Frequency of inventory sync in minutes'),
('alert_email_enabled', 'true', 'boolean', 'Enable email alerts for inventory issues'),
('alert_sms_enabled', 'false', 'boolean', 'Enable SMS alerts for inventory issues'),
('cross_platform_sync_enabled', 'true', 'boolean', 'Enable cross-platform inventory synchronization');

-- Insert default platform integrations
INSERT INTO platform_integrations (platform, is_connected, sync_frequency_minutes) VALUES
('shopify', false, 15),
('tiktok', false, 15),
('etsy', false, 15),
('amazon', false, 15),
('ebay', false, 15),
('walmart', false, 15),
('woocommerce', false, 15),
('bigcommerce', false, 15),
('magento', false, 15),
('prestashop', false, 15),
('opencart', false, 15),
('squarespace', false, 15),
('wix', false, 15);

-- Insert sample suppliers
INSERT INTO suppliers (name, contact_person, email, phone, website, payment_terms, lead_time_days) VALUES
('TechSupplies Inc.', 'John Smith', 'john@techsupplies.com', '+1-555-0123', 'https://techsupplies.com', 'Net 30', 7),
('SecurityPro', 'Sarah Johnson', 'sarah@securitypro.com', '+1-555-0124', 'https://securitypro.com', 'Net 15', 5),
('SmartTech Solutions', 'Mike Chen', 'mike@smarttech.com', '+1-555-0125', 'https://smarttech.com', 'Net 30', 10),
('AudioMax', 'Lisa Wang', 'lisa@audiomax.com', '+1-555-0126', 'https://audiomax.com', 'Net 30', 7),
('PowerTech', 'David Brown', 'david@powertech.com', '+1-555-0127', 'https://powertech.com', 'Net 15', 5);

-- Insert sample products with enhanced inventory data
INSERT INTO products (
    id, name, sku, platform, last_optimized, status, views, conversion, revenue,
    current_stock, min_stock_level, max_stock_level, reorder_point, reorder_quantity,
    supplier, cost, last_restocked, next_restock_date, stock_status, category,
    location, barcode, weight, dimensions, cross_platform_sync, sync_status
) VALUES
(
    gen_random_uuid(), 'Wireless Earbuds Pro', 'EARB-001', 'shopify', '2023-05-15', 'Optimized', 1245, 3.2, 4851,
    45, 20, 100, 25, 50, 'TechSupplies Inc.', 25.50, '2023-05-10', '2023-05-25', 'in_stock', 'Electronics',
    'Warehouse A - Shelf 3', '1234567890123', 0.15, '2.5" x 1.8" x 0.8"', true, 'synced'
),
(
    gen_random_uuid(), 'HD Security Camera', 'CAM-101', 'shopify', '2023-05-10', 'Testing', 876, 2.8, 3210,
    8, 15, 50, 20, 30, 'SecurityPro', 45.00, '2023-05-05', '2023-05-20', 'low_stock', 'Security',
    'Warehouse B - Shelf 1', '1234567890124', 0.8, '4.2" x 3.1" x 2.5"', true, 'synced'
),
(
    gen_random_uuid(), 'Smart Watch X3', 'SWTCH-222', 'tiktok', 'Never', 'Not optimized', 654, 1.9, 2150,
    0, 10, 75, 15, 40, 'SmartTech Solutions', 85.00, '2023-04-28', '2023-05-30', 'out_of_stock', 'Wearables',
    'Warehouse A - Shelf 5', '1234567890125', 0.25, '1.8" x 1.8" x 0.4"', true, 'synced'
),
(
    gen_random_uuid(), 'Bluetooth Speaker', 'SPKR-333', 'tiktok', '2023-05-01', 'Optimized', 987, 2.5, 2980,
    120, 25, 80, 30, 35, 'AudioMax', 35.00, '2023-05-12', '2023-06-15', 'overstocked', 'Audio',
    'Warehouse C - Shelf 2', '1234567890126', 1.2, '6.5" x 3.2" x 3.2"', true, 'synced'
),
(
    gen_random_uuid(), 'Portable Power Bank', 'PWR-444', 'shopify', 'Never', 'Not optimized', 432, 1.4, 1250,
    12, 20, 60, 25, 30, 'PowerTech', 18.50, '2023-05-08', '2023-05-22', 'low_stock', 'Accessories',
    'Warehouse A - Shelf 4', '1234567890127', 0.3, '3.1" x 2.2" x 0.8"', true, 'synced'
);

-- Insert sample platform inventory data
INSERT INTO platform_inventory (product_id, platform, stock_quantity, reserved_quantity, available_quantity, platform_price, sync_status)
SELECT 
    p.id,
    'shopify',
    CASE 
        WHEN p.sku = 'EARB-001' THEN 25
        WHEN p.sku = 'CAM-101' THEN 5
        WHEN p.sku = 'SWTCH-222' THEN 0
        WHEN p.sku = 'SPKR-333' THEN 40
        WHEN p.sku = 'PWR-444' THEN 8
        ELSE 0
    END,
    CASE 
        WHEN p.sku = 'EARB-001' THEN 3
        WHEN p.sku = 'CAM-101' THEN 1
        WHEN p.sku = 'SWTCH-222' THEN 0
        WHEN p.sku = 'SPKR-333' THEN 3
        WHEN p.sku = 'PWR-444' THEN 1
        ELSE 0
    END,
    CASE 
        WHEN p.sku = 'EARB-001' THEN 22
        WHEN p.sku = 'CAM-101' THEN 4
        WHEN p.sku = 'SWTCH-222' THEN 0
        WHEN p.sku = 'SPKR-333' THEN 37
        WHEN p.sku = 'PWR-444' THEN 7
        ELSE 0
    END,
    CASE 
        WHEN p.sku = 'EARB-001' THEN 49.99
        WHEN p.sku = 'CAM-101' THEN 89.99
        WHEN p.sku = 'SWTCH-222' THEN 199.99
        WHEN p.sku = 'SPKR-333' THEN 79.99
        WHEN p.sku = 'PWR-444' THEN 29.99
        ELSE 0
    END,
    'synced'
FROM products p
WHERE p.sku IN ('EARB-001', 'CAM-101', 'SWTCH-222', 'SPKR-333', 'PWR-444');

INSERT INTO platform_inventory (product_id, platform, stock_quantity, reserved_quantity, available_quantity, platform_price, sync_status)
SELECT 
    p.id,
    'tiktok',
    CASE 
        WHEN p.sku = 'EARB-001' THEN 15
        WHEN p.sku = 'SWTCH-222' THEN 0
        WHEN p.sku = 'SPKR-333' THEN 60
        ELSE 0
    END,
    CASE 
        WHEN p.sku = 'EARB-001' THEN 2
        WHEN p.sku = 'SWTCH-222' THEN 0
        WHEN p.sku = 'SPKR-333' THEN 5
        ELSE 0
    END,
    CASE 
        WHEN p.sku = 'EARB-001' THEN 13
        WHEN p.sku = 'SWTCH-222' THEN 0
        WHEN p.sku = 'SPKR-333' THEN 55
        ELSE 0
    END,
    CASE 
        WHEN p.sku = 'EARB-001' THEN 49.99
        WHEN p.sku = 'SWTCH-222' THEN 199.99
        WHEN p.sku = 'SPKR-333' THEN 79.99
        ELSE 0
    END,
    'synced'
FROM products p
WHERE p.sku IN ('EARB-001', 'SWTCH-222', 'SPKR-333');

INSERT INTO platform_inventory (product_id, platform, stock_quantity, reserved_quantity, available_quantity, platform_price, sync_status)
SELECT 
    p.id,
    'etsy',
    CASE 
        WHEN p.sku = 'EARB-001' THEN 5
        WHEN p.sku = 'SPKR-333' THEN 20
        ELSE 0
    END,
    CASE 
        WHEN p.sku = 'EARB-001' THEN 1
        WHEN p.sku = 'SPKR-333' THEN 2
        ELSE 0
    END,
    CASE 
        WHEN p.sku = 'EARB-001' THEN 4
        WHEN p.sku = 'SPKR-333' THEN 18
        ELSE 0
    END,
    CASE 
        WHEN p.sku = 'EARB-001' THEN 54.99
        WHEN p.sku = 'SPKR-333' THEN 84.99
        ELSE 0
    END,
    'synced'
FROM products p
WHERE p.sku IN ('EARB-001', 'SPKR-333');

INSERT INTO platform_inventory (product_id, platform, stock_quantity, reserved_quantity, available_quantity, platform_price, sync_status)
SELECT 
    p.id,
    'amazon',
    CASE 
        WHEN p.sku = 'CAM-101' THEN 3
        WHEN p.sku = 'PWR-444' THEN 4
        ELSE 0
    END,
    CASE 
        WHEN p.sku = 'CAM-101' THEN 0
        WHEN p.sku = 'PWR-444' THEN 0
        ELSE 0
    END,
    CASE 
        WHEN p.sku = 'CAM-101' THEN 3
        WHEN p.sku = 'PWR-444' THEN 4
        ELSE 0
    END,
    CASE 
        WHEN p.sku = 'CAM-101' THEN 94.99
        WHEN p.sku = 'PWR-444' THEN 34.99
        ELSE 0
    END,
    'synced'
FROM products p
WHERE p.sku IN ('CAM-101', 'PWR-444');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products(stock_status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier);
CREATE INDEX IF NOT EXISTS idx_platform_inventory_product_platform ON platform_inventory(product_id, platform);
CREATE INDEX IF NOT EXISTS idx_platform_inventory_sync_status ON platform_inventory(sync_status);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product_id ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_product_id ON inventory_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_type ON inventory_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_unread ON inventory_alerts(is_read, is_resolved);

-- Create function to update stock status based on current stock levels
CREATE OR REPLACE FUNCTION update_stock_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update stock status based on current stock levels
    IF NEW.current_stock <= 0 THEN
        NEW.stock_status := 'out_of_stock';
    ELSIF NEW.current_stock <= NEW.min_stock_level THEN
        NEW.stock_status := 'low_stock';
    ELSIF NEW.current_stock >= NEW.max_stock_level * 0.8 THEN
        NEW.stock_status := 'overstocked';
    ELSE
        NEW.stock_status := 'in_stock';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update stock status
CREATE TRIGGER trigger_update_stock_status
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_status();

-- Create function to create inventory alerts
CREATE OR REPLACE FUNCTION create_inventory_alert()
RETURNS TRIGGER AS $$
BEGIN
    -- Create low stock alert
    IF NEW.current_stock <= NEW.min_stock_level AND OLD.current_stock > NEW.min_stock_level THEN
        INSERT INTO inventory_alerts (product_id, alert_type, message)
        VALUES (NEW.id, 'low_stock', 
                format('Product %s is running low on stock. Current: %s, Minimum: %s', 
                       NEW.name, NEW.current_stock, NEW.min_stock_level));
    END IF;
    
    -- Create out of stock alert
    IF NEW.current_stock = 0 AND OLD.current_stock > 0 THEN
        INSERT INTO inventory_alerts (product_id, alert_type, message)
        VALUES (NEW.id, 'out_of_stock', 
                format('Product %s is out of stock', NEW.name));
    END IF;
    
    -- Create overstocked alert
    IF NEW.current_stock >= NEW.max_stock_level * 0.8 AND OLD.current_stock < NEW.max_stock_level * 0.8 THEN
        INSERT INTO inventory_alerts (product_id, alert_type, message)
        VALUES (NEW.id, 'overstocked', 
                format('Product %s is overstocked. Current: %s, Maximum: %s', 
                       NEW.name, NEW.current_stock, NEW.max_stock_level));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to create inventory alerts
CREATE TRIGGER trigger_create_inventory_alert
    AFTER UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION create_inventory_alert();

-- Create function to sync inventory across platforms
CREATE OR REPLACE FUNCTION sync_platform_inventory()
RETURNS void AS $$
DECLARE
    product_record RECORD;
    platform_record RECORD;
    total_stock INTEGER;
BEGIN
    -- Update total stock for each product based on platform inventory
    FOR product_record IN SELECT id FROM products WHERE cross_platform_sync = true LOOP
        total_stock := 0;
        
        FOR platform_record IN 
            SELECT stock_quantity 
            FROM platform_inventory 
            WHERE product_id = product_record.id
        LOOP
            total_stock := total_stock + platform_record.stock_quantity;
        END LOOP;
        
        UPDATE products 
        SET current_stock = total_stock,
            updated_at = NOW()
        WHERE id = product_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON platform_inventory TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON inventory_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON suppliers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON inventory_alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON platform_integrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON inventory_settings TO authenticated;

-- Enable Row Level Security
ALTER TABLE platform_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies - adjust based on your auth requirements)
CREATE POLICY "Users can view platform inventory" ON platform_inventory FOR SELECT USING (true);
CREATE POLICY "Users can manage platform inventory" ON platform_inventory FOR ALL USING (true);

CREATE POLICY "Users can view inventory transactions" ON inventory_transactions FOR SELECT USING (true);
CREATE POLICY "Users can manage inventory transactions" ON inventory_transactions FOR ALL USING (true);

CREATE POLICY "Users can view suppliers" ON suppliers FOR SELECT USING (true);
CREATE POLICY "Users can manage suppliers" ON suppliers FOR ALL USING (true);

CREATE POLICY "Users can view purchase orders" ON purchase_orders FOR SELECT USING (true);
CREATE POLICY "Users can manage purchase orders" ON purchase_orders FOR ALL USING (true);

CREATE POLICY "Users can view purchase order items" ON purchase_order_items FOR SELECT USING (true);
CREATE POLICY "Users can manage purchase order items" ON purchase_order_items FOR ALL USING (true);

CREATE POLICY "Users can view inventory alerts" ON inventory_alerts FOR SELECT USING (true);
CREATE POLICY "Users can manage inventory alerts" ON inventory_alerts FOR ALL USING (true);

CREATE POLICY "Users can view platform integrations" ON platform_integrations FOR SELECT USING (true);
CREATE POLICY "Users can manage platform integrations" ON platform_integrations FOR ALL USING (true);

CREATE POLICY "Users can view inventory settings" ON inventory_settings FOR SELECT USING (true);
CREATE POLICY "Users can manage inventory settings" ON inventory_settings FOR ALL USING (true); 