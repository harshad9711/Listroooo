-- Order Blocking System Migration
-- This migration adds comprehensive order blocking functionality to prevent backorders

-- Create order_blocks table
CREATE TABLE IF NOT EXISTS order_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  block_type VARCHAR(20) NOT NULL CHECK (block_type IN ('manual', 'automatic', 'scheduled')),
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('out_of_stock', 'low_stock', 'maintenance', 'quality_issue', 'supplier_delay', 'custom')),
  custom_reason TEXT,
  block_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  unblock_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create order_management table
CREATE TABLE IF NOT EXISTS order_management (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  order_id VARCHAR(100) NOT NULL,
  customer_id VARCHAR(100) NOT NULL,
  quantity_requested INTEGER NOT NULL CHECK (quantity_requested > 0),
  quantity_available INTEGER NOT NULL CHECK (quantity_available >= 0),
  quantity_fulfilled INTEGER NOT NULL DEFAULT 0 CHECK (quantity_fulfilled >= 0),
  order_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'partially_fulfilled', 'cancelled', 'blocked')),
  block_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(platform, order_id)
);

-- Add order blocking fields to platform_inventory table
ALTER TABLE platform_inventory 
ADD COLUMN IF NOT EXISTS is_order_blocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS order_block_reason TEXT,
ADD COLUMN IF NOT EXISTS order_block_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_unblock_date TIMESTAMP WITH TIME ZONE;

-- Add order blocking settings to platform_integrations table
ALTER TABLE platform_integrations 
ADD COLUMN IF NOT EXISTS auto_block_low_stock BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS auto_block_out_of_stock BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_backorders BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS backorder_max_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS notify_on_order_block BOOLEAN DEFAULT true;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_blocks_product_platform ON order_blocks(product_id, platform);
CREATE INDEX IF NOT EXISTS idx_order_blocks_active ON order_blocks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_order_blocks_date ON order_blocks(block_date DESC);

CREATE INDEX IF NOT EXISTS idx_order_management_product_platform ON order_management(product_id, platform);
CREATE INDEX IF NOT EXISTS idx_order_management_status ON order_management(order_status);
CREATE INDEX IF NOT EXISTS idx_order_management_date ON order_management(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_management_platform_order ON order_management(platform, order_id);

CREATE INDEX IF NOT EXISTS idx_platform_inventory_blocked ON platform_inventory(is_order_blocked) WHERE is_order_blocked = true;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_order_blocks_updated_at 
  BEFORE UPDATE ON order_blocks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_management_updated_at 
  BEFORE UPDATE ON order_management 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically block orders when stock is low
CREATE OR REPLACE FUNCTION auto_block_low_stock()
RETURNS TRIGGER AS $$
DECLARE
  integration RECORD;
BEGIN
  -- Get platform integration settings
  SELECT * INTO integration 
  FROM platform_integrations 
  WHERE platform = NEW.platform AND is_active = true;
  
  -- Check if auto-blocking is enabled
  IF integration.auto_block_low_stock AND NEW.available_quantity <= integration.low_stock_threshold AND NOT NEW.is_order_blocked THEN
    -- Block orders
    UPDATE platform_inventory 
    SET 
      is_order_blocked = true,
      order_block_reason = 'low_stock',
      order_block_date = NOW()
    WHERE id = NEW.id;
    
    -- Create order block record
    INSERT INTO order_blocks (
      product_id, platform, block_type, reason, 
      block_date, is_active, notes
    ) VALUES (
      NEW.product_id, NEW.platform, 'automatic', 'low_stock',
      NOW(), true, 
      format('Auto-blocked due to low stock (%s available, threshold: %s)', 
             NEW.available_quantity, integration.low_stock_threshold)
    );
    
    -- Create alert
    INSERT INTO inventory_alerts (
      product_id, alert_type, message, is_read, is_resolved
    ) VALUES (
      NEW.product_id, 'order_blocked',
      format('Orders automatically blocked for %s due to low stock (%s available)', 
             NEW.platform, NEW.available_quantity),
      false, false
    );
  END IF;
  
  -- Check if out of stock and should auto-block
  IF integration.auto_block_out_of_stock AND NEW.available_quantity = 0 AND NOT NEW.is_order_blocked THEN
    -- Block orders
    UPDATE platform_inventory 
    SET 
      is_order_blocked = true,
      order_block_reason = 'out_of_stock',
      order_block_date = NOW()
    WHERE id = NEW.id;
    
    -- Create order block record
    INSERT INTO order_blocks (
      product_id, platform, block_type, reason, 
      block_date, is_active, notes
    ) VALUES (
      NEW.product_id, NEW.platform, 'automatic', 'out_of_stock',
      NOW(), true, 'Auto-blocked due to out of stock'
    );
    
    -- Create alert
    INSERT INTO inventory_alerts (
      product_id, alert_type, message, is_read, is_resolved
    ) VALUES (
      NEW.product_id, 'order_blocked',
      format('Orders automatically blocked for %s due to out of stock', NEW.platform),
      false, false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-blocking
CREATE TRIGGER trigger_auto_block_low_stock
  AFTER UPDATE OF available_quantity ON platform_inventory
  FOR EACH ROW EXECUTE FUNCTION auto_block_low_stock();

-- Create function to unblock orders when stock is restored
CREATE OR REPLACE FUNCTION auto_unblock_restored_stock()
RETURNS TRIGGER AS $$
DECLARE
  integration RECORD;
BEGIN
  -- Get platform integration settings
  SELECT * INTO integration 
  FROM platform_integrations 
  WHERE platform = NEW.platform AND is_active = true;
  
  -- Check if stock is restored and should unblock
  IF NEW.is_order_blocked AND NEW.available_quantity > integration.low_stock_threshold THEN
    -- Unblock orders
    UPDATE platform_inventory 
    SET 
      is_order_blocked = false,
      order_block_reason = NULL,
      order_block_date = NULL,
      auto_unblock_date = NULL
    WHERE id = NEW.id;
    
    -- Update order block record
    UPDATE order_blocks 
    SET 
      is_active = false,
      unblock_date = NOW()
    WHERE product_id = NEW.product_id 
      AND platform = NEW.platform 
      AND is_active = true;
    
    -- Create alert
    INSERT INTO inventory_alerts (
      product_id, alert_type, message, is_read, is_resolved
    ) VALUES (
      NEW.product_id, 'order_unblocked',
      format('Orders automatically unblocked for %s - stock restored (%s available)', 
             NEW.platform, NEW.available_quantity),
      false, false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-unblocking
CREATE TRIGGER trigger_auto_unblock_restored_stock
  AFTER UPDATE OF available_quantity ON platform_inventory
  FOR EACH ROW EXECUTE FUNCTION auto_unblock_restored_stock();

-- Insert sample order blocking data
INSERT INTO order_blocks (
  product_id, platform, block_type, reason, 
  block_date, is_active, notes
) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'shopify', 'manual', 'maintenance', 
   NOW() - INTERVAL '2 hours', true, 'Product maintenance - quality check required'),
  ('550e8400-e29b-41d4-a716-446655440002', 'tiktok', 'automatic', 'low_stock', 
   NOW() - INTERVAL '1 hour', true, 'Auto-blocked due to low stock (3 available, threshold: 5)'),
  ('550e8400-e29b-41d4-a716-446655440003', 'etsy', 'scheduled', 'supplier_delay', 
   NOW() - INTERVAL '30 minutes', true, 'Supplier delivery delayed - expected restock in 3 days')
ON CONFLICT DO NOTHING;

-- Insert sample order management data
INSERT INTO order_management (
  product_id, platform, order_id, customer_id,
  quantity_requested, quantity_available, quantity_fulfilled, order_status, block_reason
) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'shopify', 'ORD-001', 'CUST-001',
   2, 0, 0, 'blocked', 'Product maintenance - quality check required'),
  ('550e8400-e29b-41d4-a716-446655440002', 'tiktok', 'ORD-002', 'CUST-002',
   5, 3, 0, 'blocked', 'Insufficient stock'),
  ('550e8400-e29b-41d4-a716-446655440003', 'etsy', 'ORD-003', 'CUST-003',
   1, 1, 1, 'confirmed', NULL),
  ('550e8400-e29b-41d4-a716-446655440004', 'amazon', 'ORD-004', 'CUST-004',
   3, 10, 3, 'confirmed', NULL)
ON CONFLICT DO NOTHING;

-- Update platform integrations with order blocking settings
UPDATE platform_integrations 
SET 
  auto_block_low_stock = true,
  low_stock_threshold = 5,
  auto_block_out_of_stock = true,
  allow_backorders = false,
  backorder_max_quantity = 0,
  notify_on_order_block = true
WHERE platform IN ('shopify', 'tiktok', 'etsy', 'amazon', 'ebay', 'walmart');

-- Update platform inventory with order blocking status
UPDATE platform_inventory 
SET 
  is_order_blocked = true,
  order_block_reason = 'low_stock',
  order_block_date = NOW() - INTERVAL '1 hour'
WHERE product_id = '550e8400-e29b-41d4-a716-446655440002' AND platform = 'tiktok';

UPDATE platform_inventory 
SET 
  is_order_blocked = true,
  order_block_reason = 'maintenance',
  order_block_date = NOW() - INTERVAL '2 hours'
WHERE product_id = '550e8400-e29b-41d4-a716-446655440001' AND platform = 'shopify';

-- Create RLS policies for order_blocks
ALTER TABLE order_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order blocks" ON order_blocks
  FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM products WHERE id = product_id
  ));

CREATE POLICY "Users can insert their own order blocks" ON order_blocks
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT user_id FROM products WHERE id = product_id
  ));

CREATE POLICY "Users can update their own order blocks" ON order_blocks
  FOR UPDATE USING (auth.uid() IN (
    SELECT user_id FROM products WHERE id = product_id
  ));

-- Create RLS policies for order_management
ALTER TABLE order_management ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order management" ON order_management
  FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM products WHERE id = product_id
  ));

CREATE POLICY "Users can insert their own order management" ON order_management
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT user_id FROM products WHERE id = product_id
  ));

CREATE POLICY "Users can update their own order management" ON order_management
  FOR UPDATE USING (auth.uid() IN (
    SELECT user_id FROM products WHERE id = product_id
  ));

-- Create views for easy querying
CREATE OR REPLACE VIEW blocked_orders_summary AS
SELECT 
  p.name as product_name,
  p.sku,
  om.platform,
  COUNT(*) as blocked_orders_count,
  SUM(om.quantity_requested) as total_quantity_requested,
  AVG(om.quantity_available) as avg_available_quantity,
  MIN(om.created_at) as first_blocked_order,
  MAX(om.created_at) as last_blocked_order
FROM order_management om
JOIN products p ON om.product_id = p.id
WHERE om.order_status = 'blocked'
GROUP BY p.id, p.name, p.sku, om.platform
ORDER BY blocked_orders_count DESC;

CREATE OR REPLACE VIEW active_order_blocks AS
SELECT 
  p.name as product_name,
  p.sku,
  ob.platform,
  ob.block_type,
  ob.reason,
  ob.block_date,
  ob.unblock_date,
  ob.notes,
  pi.available_quantity,
  pi.low_stock_threshold
FROM order_blocks ob
JOIN products p ON ob.product_id = p.id
JOIN platform_inventory pi ON ob.product_id = pi.product_id AND ob.platform = pi.platform
WHERE ob.is_active = true
ORDER BY ob.block_date DESC;

-- Create function to get order blocking statistics
CREATE OR REPLACE FUNCTION get_order_block_stats(user_id UUID)
RETURNS TABLE (
  total_blocked_orders BIGINT,
  blocked_by_reason JSONB,
  blocked_by_platform JSONB,
  total_active_blocks BIGINT,
  avg_block_duration_hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE om.order_status = 'blocked') as total_blocked,
      COUNT(*) FILTER (WHERE ob.is_active = true) as total_active_blocks,
      AVG(EXTRACT(EPOCH FROM (COALESCE(ob.unblock_date, NOW()) - ob.block_date))/3600) as avg_duration
    FROM order_management om
    LEFT JOIN order_blocks ob ON om.product_id = ob.product_id AND om.platform = ob.platform
    JOIN products p ON om.product_id = p.id
    WHERE p.user_id = get_order_block_stats.user_id
  ),
  reason_stats AS (
    SELECT 
      COALESCE(om.block_reason, 'unknown') as reason,
      COUNT(*) as count
    FROM order_management om
    JOIN products p ON om.product_id = p.id
    WHERE p.user_id = get_order_block_stats.user_id AND om.order_status = 'blocked'
    GROUP BY om.block_reason
  ),
  platform_stats AS (
    SELECT 
      om.platform,
      COUNT(*) as count
    FROM order_management om
    JOIN products p ON om.product_id = p.id
    WHERE p.user_id = get_order_block_stats.user_id AND om.order_status = 'blocked'
    GROUP BY om.platform
  )
  SELECT 
    s.total_blocked,
    (SELECT jsonb_object_agg(reason, count) FROM reason_stats) as blocked_by_reason,
    (SELECT jsonb_object_agg(platform, count) FROM platform_stats) as blocked_by_platform,
    s.total_active_blocks,
    s.avg_duration
  FROM stats s;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 