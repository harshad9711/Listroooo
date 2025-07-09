import { supabase } from '../lib/supabase';

export interface PlatformInventory {
  id: string;
  product_id: string;
  platform: string;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  last_sync: string;
  sync_status: 'synced' | 'pending' | 'error';
  platform_product_id?: string;
  platform_variant_id?: string;
  platform_listing_url?: string;
  platform_price?: number;
  platform_currency: string;
  // Order blocking fields
  is_order_blocked: boolean;
  order_block_reason?: string;
  order_block_date?: string;
  auto_unblock_date?: string;
}

export interface InventoryTransaction {
  id: string;
  product_id: string;
  platform?: string;
  transaction_type: 'restock' | 'sale' | 'return' | 'adjustment' | 'damage' | 'transfer' | 'reservation' | 'release';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  unit_cost?: number;
  total_cost?: number;
  reference_number?: string;
  notes?: string;
  created_at: string;
}

export interface InventoryAlert {
  id: string;
  product_id: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'overstocked' | 'reorder_point' | 'expiring_soon' | 'sync_error' | 'order_blocked' | 'order_unblocked';
  message: string;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
  resolved_at?: string;
}

export interface OrderBlock {
  id: string;
  product_id: string;
  platform: string;
  block_type: 'manual' | 'automatic' | 'scheduled';
  reason: 'out_of_stock' | 'low_stock' | 'maintenance' | 'quality_issue' | 'supplier_delay' | 'custom';
  custom_reason?: string;
  block_date: string;
  unblock_date?: string;
  is_active: boolean;
  created_by?: string;
  notes?: string;
}

export interface OrderManagement {
  id: string;
  product_id: string;
  platform: string;
  order_id: string;
  customer_id: string;
  quantity_requested: number;
  quantity_available: number;
  quantity_fulfilled: number;
  order_status: 'pending' | 'confirmed' | 'partially_fulfilled' | 'cancelled' | 'blocked';
  block_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface PlatformIntegration {
  id: string;
  platform: string;
  is_connected: boolean;
  store_url?: string;
  store_id?: string;
  last_sync?: string;
  sync_frequency_minutes: number;
  is_active: boolean;
  // Order blocking settings
  auto_block_low_stock: boolean;
  low_stock_threshold: number;
  auto_block_out_of_stock: boolean;
  allow_backorders: boolean;
  backorder_max_quantity: number;
  notify_on_order_block: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  payment_terms?: string;
  lead_time_days: number;
  minimum_order_quantity: number;
  is_active: boolean;
}

// Supported platforms configuration
export const SUPPORTED_PLATFORMS = {
  // Major E-commerce Platforms
  shopify: {
    name: 'Shopify',
    category: 'E-commerce',
    features: ['inventory_sync', 'order_management', 'product_management', 'order_blocking'],
    api_docs: 'https://shopify.dev/docs/api',
    icon: 'shopify'
  },
  tiktok: {
    name: 'TikTok Shop',
    category: 'Social Commerce',
    features: ['inventory_sync', 'live_streaming', 'viral_marketing', 'order_blocking'],
    api_docs: 'https://developers.tiktok.com/doc/shop-api-overview',
    icon: 'tiktok'
  },
  etsy: {
    name: 'Etsy',
    category: 'Marketplace',
    features: ['inventory_sync', 'handmade_focus', 'community', 'order_blocking'],
    api_docs: 'https://developer.etsy.com/documentation',
    icon: 'etsy'
  },
  amazon: {
    name: 'Amazon',
    category: 'Marketplace',
    features: ['inventory_sync', 'fba', 'fbm', 'global_reach', 'order_blocking'],
    api_docs: 'https://developer.amazonservices.com',
    icon: 'amazon'
  },
  ebay: {
    name: 'eBay',
    category: 'Marketplace',
    features: ['inventory_sync', 'auction', 'fixed_price', 'order_blocking'],
    api_docs: 'https://developer.ebay.com',
    icon: 'ebay'
  },
  walmart: {
    name: 'Walmart',
    category: 'Marketplace',
    features: ['inventory_sync', 'retail_partnership', 'omnichannel', 'order_blocking'],
    api_docs: 'https://developer.walmart.com',
    icon: 'walmart'
  },
  
  // E-commerce Platforms
  woocommerce: {
    name: 'WooCommerce',
    category: 'E-commerce',
    features: ['inventory_sync', 'wordpress_integration', 'customizable', 'order_blocking'],
    api_docs: 'https://woocommerce.github.io/woocommerce-rest-api-docs',
    icon: 'woocommerce'
  },
  bigcommerce: {
    name: 'BigCommerce',
    category: 'E-commerce',
    features: ['inventory_sync', 'enterprise_features', 'multi_store', 'order_blocking'],
    api_docs: 'https://developer.bigcommerce.com',
    icon: 'bigcommerce'
  },
  magento: {
    name: 'Magento',
    category: 'E-commerce',
    features: ['inventory_sync', 'enterprise_grade', 'customizable', 'order_blocking'],
    api_docs: 'https://developer.adobe.com/commerce/webapi',
    icon: 'magento'
  },
  prestashop: {
    name: 'PrestaShop',
    category: 'E-commerce',
    features: ['inventory_sync', 'open_source', 'multilingual', 'order_blocking'],
    api_docs: 'https://devdocs.prestashop.com',
    icon: 'prestashop'
  },
  opencart: {
    name: 'OpenCart',
    category: 'E-commerce',
    features: ['inventory_sync', 'open_source', 'extensions', 'order_blocking'],
    api_docs: 'https://docs.opencart.com',
    icon: 'opencart'
  },
  
  // Website Builders
  squarespace: {
    name: 'Squarespace',
    category: 'Website Builder',
    features: ['inventory_sync', 'design_focused', 'all_in_one', 'order_blocking'],
    api_docs: 'https://developers.squarespace.com',
    icon: 'squarespace'
  },
  wix: {
    name: 'Wix',
    category: 'Website Builder',
    features: ['inventory_sync', 'drag_drop', 'apps_marketplace', 'order_blocking'],
    api_docs: 'https://developers.wix.com',
    icon: 'wix'
  },
  
  // Platform Variants
  shopify_plus: {
    name: 'Shopify Plus',
    category: 'Enterprise E-commerce',
    features: ['inventory_sync', 'enterprise_features', 'high_volume', 'order_blocking'],
    api_docs: 'https://shopify.dev/docs/api',
    icon: 'shopify'
  },
  tiktok_shop_plus: {
    name: 'TikTok Shop Plus',
    category: 'Enterprise Social Commerce',
    features: ['inventory_sync', 'advanced_analytics', 'priority_support', 'order_blocking'],
    api_docs: 'https://developers.tiktok.com/doc/shop-api-overview',
    icon: 'tiktok'
  },
  amazon_fba: {
    name: 'Amazon FBA',
    category: 'Fulfillment',
    features: ['inventory_sync', 'fulfillment', 'prime_eligibility', 'order_blocking'],
    api_docs: 'https://developer.amazonservices.com',
    icon: 'amazon'
  },
  amazon_fbm: {
    name: 'Amazon FBM',
    category: 'Fulfillment',
    features: ['inventory_sync', 'self_fulfillment', 'control', 'order_blocking'],
    api_docs: 'https://developer.amazonservices.com',
    icon: 'amazon'
  },
  ebay_managed: {
    name: 'eBay Managed',
    category: 'Marketplace',
    features: ['inventory_sync', 'managed_service', 'support'],
    api_docs: 'https://developer.ebay.com',
    icon: 'ebay'
  },
  etsy_plus: {
    name: 'Etsy Plus',
    category: 'Marketplace',
    features: ['inventory_sync', 'premium_features', 'analytics'],
    api_docs: 'https://developer.etsy.com/documentation',
    icon: 'etsy'
  }
};

export class InventoryService {
  // Get all platform inventory for a product
  async getPlatformInventory(productId: string): Promise<PlatformInventory[]> {
    const { data, error } = await supabase
      .from('platform_inventory')
      .select('*')
      .eq('product_id', productId)
      .order('platform');

    if (error) {
      console.error('Error fetching platform inventory:', error);
      throw error;
    }

    return data || [];
  }

  // Get inventory for a specific platform
  async getPlatformInventoryByPlatform(productId: string, platform: string): Promise<PlatformInventory | null> {
    const { data, error } = await supabase
      .from('platform_inventory')
      .select('*')
      .eq('product_id', productId)
      .eq('platform', platform)
      .single();

    if (error) {
      console.error('Error fetching platform inventory:', error);
      throw error;
    }

    return data;
  }

  // Update platform inventory
  async updatePlatformInventory(
    productId: string, 
    platform: string, 
    updates: Partial<PlatformInventory>
  ): Promise<PlatformInventory> {
    const { data, error } = await supabase
      .from('platform_inventory')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('product_id', productId)
      .eq('platform', platform)
      .select()
      .single();

    if (error) {
      console.error('Error updating platform inventory:', error);
      throw error;
    }

    return data;
  }

  // Sync inventory across all platforms for a product
  async syncProductInventory(productId: string): Promise<void> {
    try {
      // Get all platform inventory for the product
      const platformInventory = await this.getPlatformInventory(productId);
      
      // Calculate total stock across all platforms
      const totalStock = platformInventory.reduce((sum, pi) => sum + pi.stock_quantity, 0);
      
      // Update the main product record
      const { error } = await supabase
        .from('products')
        .update({
          current_stock: totalStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) {
        console.error('Error updating product stock:', error);
        throw error;
      }

      // Update sync status for all platforms
      await Promise.all(
        platformInventory.map(pi =>
          this.updatePlatformInventory(productId, pi.platform, {
            sync_status: 'synced',
            last_sync: new Date().toISOString()
          })
        )
      );

    } catch (error) {
      console.error('Error syncing product inventory:', error);
      throw error;
    }
  }

  // Get inventory transactions
  async getInventoryTransactions(
    productId?: string,
    platform?: string,
    transactionType?: string,
    limit = 50
  ): Promise<InventoryTransaction[]> {
    let query = supabase
      .from('inventory_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (productId) {
      query = query.eq('product_id', productId);
    }
    if (platform) {
      query = query.eq('platform', platform);
    }
    if (transactionType) {
      query = query.eq('transaction_type', transactionType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching inventory transactions:', error);
      throw error;
    }

    return data || [];
  }

  // Create inventory transaction
  async createInventoryTransaction(transaction: Omit<InventoryTransaction, 'id' | 'created_at'>): Promise<InventoryTransaction> {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) {
      console.error('Error creating inventory transaction:', error);
      throw error;
    }

    return data;
  }

  // Get inventory alerts
  async getInventoryAlerts(
    productId?: string,
    alertType?: string,
    unreadOnly = false
  ): Promise<InventoryAlert[]> {
    let query = supabase
      .from('inventory_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }
    if (alertType) {
      query = query.eq('alert_type', alertType);
    }
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching inventory alerts:', error);
      throw error;
    }

    return data || [];
  }

  // Mark alert as read
  async markAlertAsRead(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_alerts')
      .update({ is_read: true })
      .eq('id', alertId);

    if (error) {
      console.error('Error marking alert as read:', error);
      throw error;
    }
  }

  // Resolve alert
  async resolveAlert(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_alerts')
      .update({ 
        is_resolved: true, 
        resolved_at: new Date().toISOString() 
      })
      .eq('id', alertId);

    if (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  // Get platform integrations
  async getPlatformIntegrations(): Promise<PlatformIntegration[]> {
    const { data, error } = await supabase
      .from('platform_integrations')
      .select('*')
      .order('platform');

    if (error) {
      console.error('Error fetching platform integrations:', error);
      throw error;
    }

    return data || [];
  }

  // Update platform integration
  async updatePlatformIntegration(
    platform: string,
    updates: Partial<PlatformIntegration>
  ): Promise<PlatformIntegration> {
    const { data, error } = await supabase
      .from('platform_integrations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('platform', platform)
      .select()
      .single();

    if (error) {
      console.error('Error updating platform integration:', error);
      throw error;
    }

    return data;
  }

  // Get suppliers
  async getSuppliers(activeOnly = true): Promise<Supplier[]> {
    let query = supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }

    return data || [];
  }

  // Create supplier
  async createSupplier(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplier)
      .select()
      .single();

    if (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }

    return data;
  }

  // Get inventory metrics
  async getInventoryMetrics() {
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('current_stock, stock_status, cost, cross_platform_sync, sync_status');

    if (productsError) {
      console.error('Error fetching products for metrics:', productsError);
      throw productsError;
    }

    const { data: platformInventory, error: platformError } = await supabase
      .from('platform_inventory')
      .select('platform, stock_quantity, available_quantity');

    if (platformError) {
      console.error('Error fetching platform inventory for metrics:', platformError);
      throw platformError;
    }

    const { data: alerts, error: alertsError } = await supabase
      .from('inventory_alerts')
      .select('alert_type, is_read, is_resolved');

    if (alertsError) {
      console.error('Error fetching alerts for metrics:', alertsError);
      throw alertsError;
    }

    // Calculate metrics
    const totalProducts = products?.length || 0;
    const inStock = products?.filter(p => p.stock_status === 'in_stock').length || 0;
    const lowStock = products?.filter(p => p.stock_status === 'low_stock').length || 0;
    const outOfStock = products?.filter(p => p.stock_status === 'out_of_stock').length || 0;
    const overstocked = products?.filter(p => p.stock_status === 'overstocked').length || 0;
    const totalValue = products?.reduce((sum, p) => sum + (p.current_stock * (p.cost || 0)), 0) || 0;
    const crossPlatformProducts = products?.filter(p => p.cross_platform_sync).length || 0;
    const syncedProducts = products?.filter(p => p.sync_status === 'synced').length || 0;

    // Platform-specific metrics
    const platformMetrics = Object.keys(SUPPORTED_PLATFORMS).map(platformKey => {
      const platformProducts = platformInventory?.filter(pi => pi.platform === platformKey) || [];
      const totalStock = platformProducts.reduce((sum, pi) => sum + pi.stock_quantity, 0);
      const totalAvailable = platformProducts.reduce((sum, pi) => sum + pi.available_quantity, 0);
      
      return {
        platform: platformKey,
        name: SUPPORTED_PLATFORMS[platformKey as keyof typeof SUPPORTED_PLATFORMS].name,
        totalStock,
        totalAvailable,
        productCount: platformProducts.length
      };
    }).filter(pm => pm.productCount > 0);

    // Alert metrics
    const unreadAlerts = alerts?.filter(a => !a.is_read).length || 0;
    const unresolvedAlerts = alerts?.filter(a => !a.is_resolved).length || 0;

    return {
      totalProducts,
      inStock,
      lowStock,
      outOfStock,
      overstocked,
      totalValue,
      crossPlatformProducts,
      syncedProducts,
      platformMetrics,
      unreadAlerts,
      unresolvedAlerts
    };
  }

  // Bulk sync all products across platforms
  async bulkSyncInventory(): Promise<{ success: number; failed: number }> {
    const { data: products, error } = await supabase
      .from('products')
      .select('id')
      .eq('cross_platform_sync', true);

    if (error) {
      console.error('Error fetching products for bulk sync:', error);
      throw error;
    }

    let success = 0;
    let failed = 0;

    for (const product of products || []) {
      try {
        await this.syncProductInventory(product.id);
        success++;
      } catch (error) {
        console.error(`Failed to sync product ${product.id}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  // Get low stock products
  async getLowStockProducts(): Promise<any[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        platform_inventory (*)
      `)
      .in('stock_status', ['low_stock', 'out_of_stock'])
      .order('current_stock', { ascending: true });

    if (error) {
      console.error('Error fetching low stock products:', error);
      throw error;
    }

    return data || [];
  }

  // Get overstocked products
  async getOverstockedProducts(): Promise<any[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        platform_inventory (*)
      `)
      .eq('stock_status', 'overstocked')
      .order('current_stock', { ascending: false });

    if (error) {
      console.error('Error fetching overstocked products:', error);
      throw error;
    }

    return data || [];
  }

  // NEW: Order Blocking Methods
  async checkOrderAvailability(productId: string, platform: string, quantity: number): Promise<{
    can_fulfill: boolean;
    available_quantity: number;
    requested_quantity: number;
    block_reason?: string;
    estimated_restock_date?: string;
  }> {
    try {
      const inventory = await this.getPlatformInventoryByPlatform(productId, platform);
      
      if (!inventory) {
        return {
          can_fulfill: false,
          available_quantity: 0,
          requested_quantity: quantity,
          block_reason: 'Product not found on platform'
        };
      }

      // Check if order is blocked
      if (inventory.is_order_blocked) {
        return {
          can_fulfill: false,
          available_quantity: inventory.available_quantity,
          requested_quantity: quantity,
          block_reason: inventory.order_block_reason || 'Order temporarily blocked'
        };
      }

      // Check stock availability
      const can_fulfill = inventory.available_quantity >= quantity;
      
      return {
        can_fulfill,
        available_quantity: inventory.available_quantity,
        requested_quantity: quantity,
        block_reason: can_fulfill ? undefined : 'Insufficient stock',
        estimated_restock_date: inventory.auto_unblock_date
      };
    } catch (error) {
      console.error('Error checking order availability:', error);
      throw error;
    }
  }

  async blockOrders(productId: string, platform: string, reason: string, blockType: 'manual' | 'automatic' | 'scheduled' = 'manual', unblockDate?: string, notes?: string): Promise<OrderBlock> {
    try {
      // Create order block record
      const { data: orderBlock, error: blockError } = await supabase
        .from('order_blocks')
        .insert({
          product_id: productId,
          platform,
          block_type: blockType,
          reason: reason as any,
          block_date: new Date().toISOString(),
          unblock_date: unblockDate,
          is_active: true,
          notes
        })
        .select()
        .single();

      if (blockError) throw blockError;

      // Update platform inventory to block orders
      await this.updatePlatformInventory(productId, platform, {
        is_order_blocked: true,
        order_block_reason: reason,
        order_block_date: new Date().toISOString(),
        auto_unblock_date: unblockDate
      });

      // Create alert
      await this.createInventoryAlert({
        product_id: productId,
        alert_type: 'order_blocked',
        message: `Orders blocked for ${platform}: ${reason}`,
        is_read: false,
        is_resolved: false
      });

      return orderBlock;
    } catch (error) {
      console.error('Error blocking orders:', error);
      throw error;
    }
  }

  async unblockOrders(productId: string, platform: string, reason?: string): Promise<void> {
    try {
      // Update order block record
      await supabase
        .from('order_blocks')
        .update({
          is_active: false,
          unblock_date: new Date().toISOString()
        })
        .eq('product_id', productId)
        .eq('platform', platform)
        .eq('is_active', true);

      // Update platform inventory to unblock orders
      await this.updatePlatformInventory(productId, platform, {
        is_order_blocked: false,
        order_block_reason: null,
        order_block_date: null,
        auto_unblock_date: null
      });

      // Create alert
      await this.createInventoryAlert({
        product_id: productId,
        alert_type: 'order_unblocked',
        message: `Orders unblocked for ${platform}${reason ? `: ${reason}` : ''}`,
        is_read: false,
        is_resolved: false
      });
    } catch (error) {
      console.error('Error unblocking orders:', error);
      throw error;
    }
  }

  async getOrderBlocks(productId?: string, platform?: string, activeOnly = true): Promise<OrderBlock[]> {
    try {
      let query = supabase
        .from('order_blocks')
        .select('*')
        .order('block_date', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }
      if (platform) {
        query = query.eq('platform', platform);
      }
      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching order blocks:', error);
      throw error;
    }
  }

  async processOrder(orderData: {
    product_id: string;
    platform: string;
    order_id: string;
    customer_id: string;
    quantity: number;
  }): Promise<{
    success: boolean;
    order_status: string;
    quantity_fulfilled: number;
    block_reason?: string;
  }> {
    try {
      // Check availability
      const availability = await this.checkOrderAvailability(
        orderData.product_id,
        orderData.platform,
        orderData.quantity
      );

      if (!availability.can_fulfill) {
        // Create order management record with blocked status
        await supabase
          .from('order_management')
          .insert({
            product_id: orderData.product_id,
            platform: orderData.platform,
            order_id: orderData.order_id,
            customer_id: orderData.customer_id,
            quantity_requested: orderData.quantity,
            quantity_available: availability.available_quantity,
            quantity_fulfilled: 0,
            order_status: 'blocked',
            block_reason: availability.block_reason
          });

        return {
          success: false,
          order_status: 'blocked',
          quantity_fulfilled: 0,
          block_reason: availability.block_reason
        };
      }

      // Process the order
      const inventory = await this.getPlatformInventoryByPlatform(orderData.product_id, orderData.platform);
      if (!inventory) throw new Error('Inventory not found');

      // Update inventory
      const newStock = inventory.stock_quantity - orderData.quantity;
      const newReserved = inventory.reserved_quantity - orderData.quantity;
      const newAvailable = inventory.available_quantity - orderData.quantity;

      await this.updatePlatformInventory(orderData.product_id, orderData.platform, {
        stock_quantity: newStock,
        reserved_quantity: newReserved,
        available_quantity: newAvailable
      });

      // Create inventory transaction
      await this.createInventoryTransaction({
        product_id: orderData.product_id,
        platform: orderData.platform,
        transaction_type: 'sale',
        quantity: orderData.quantity,
        previous_stock: inventory.stock_quantity,
        new_stock: newStock,
        reference_number: orderData.order_id,
        notes: `Order ${orderData.order_id} processed`
      });

      // Create order management record
      await supabase
        .from('order_management')
        .insert({
          product_id: orderData.product_id,
          platform: orderData.platform,
          order_id: orderData.order_id,
          customer_id: orderData.customer_id,
          quantity_requested: orderData.quantity,
          quantity_available: availability.available_quantity,
          quantity_fulfilled: orderData.quantity,
          order_status: 'confirmed'
        });

      // Check if we need to auto-block due to low stock
      await this.checkAndAutoBlockLowStock(orderData.product_id, orderData.platform);

      return {
        success: true,
        order_status: 'confirmed',
        quantity_fulfilled: orderData.quantity
      };
    } catch (error) {
      console.error('Error processing order:', error);
      throw error;
    }
  }

  async checkAndAutoBlockLowStock(productId: string, platform: string): Promise<void> {
    try {
      const integration = await this.getPlatformIntegration(platform);
      if (!integration || !integration.auto_block_low_stock) return;

      const inventory = await this.getPlatformInventoryByPlatform(productId, platform);
      if (!inventory) return;

      // Check if stock is below threshold
      if (inventory.available_quantity <= integration.low_stock_threshold && !inventory.is_order_blocked) {
        await this.blockOrders(
          productId,
          platform,
          'low_stock',
          'automatic',
          undefined,
          `Auto-blocked due to low stock (${inventory.available_quantity} available, threshold: ${integration.low_stock_threshold})`
        );
      }

      // Check if out of stock
      if (inventory.available_quantity === 0 && integration.auto_block_out_of_stock && !inventory.is_order_blocked) {
        await this.blockOrders(
          productId,
          platform,
          'out_of_stock',
          'automatic',
          undefined,
          'Auto-blocked due to out of stock'
        );
      }
    } catch (error) {
      console.error('Error checking auto-block conditions:', error);
    }
  }

  async getOrderManagement(
    productId?: string,
    platform?: string,
    status?: string,
    limit = 50
  ): Promise<OrderManagement[]> {
    try {
      let query = supabase
        .from('order_management')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (productId) {
        query = query.eq('product_id', productId);
      }
      if (platform) {
        query = query.eq('platform', platform);
      }
      if (status) {
        query = query.eq('order_status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching order management:', error);
      throw error;
    }
  }

  async getBlockedOrders(): Promise<OrderManagement[]> {
    return this.getOrderManagement(undefined, undefined, 'blocked');
  }

  async getOrderBlockStats(): Promise<{
    total_blocked: number;
    blocked_by_reason: Record<string, number>;
    blocked_by_platform: Record<string, number>;
  }> {
    try {
      const blockedOrders = await this.getBlockedOrders();
      
      const stats = {
        total_blocked: blockedOrders.length,
        blocked_by_reason: {} as Record<string, number>,
        blocked_by_platform: {} as Record<string, number>
      };

      blockedOrders.forEach(order => {
        // Count by reason
        const reason = order.block_reason || 'unknown';
        stats.blocked_by_reason[reason] = (stats.blocked_by_reason[reason] || 0) + 1;

        // Count by platform
        stats.blocked_by_platform[order.platform] = (stats.blocked_by_platform[order.platform] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting order block stats:', error);
      throw error;
    }
  }

  // Enhanced platform integration methods
  async getPlatformIntegration(platform: string): Promise<PlatformIntegration | null> {
    try {
      const { data, error } = await supabase
        .from('platform_integrations')
        .select('*')
        .eq('platform', platform)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching platform integration:', error);
      return null;
    }
  }

  async updatePlatformIntegrationSettings(
    platform: string,
    settings: {
      auto_block_low_stock?: boolean;
      low_stock_threshold?: number;
      auto_block_out_of_stock?: boolean;
      allow_backorders?: boolean;
      backorder_max_quantity?: number;
      notify_on_order_block?: boolean;
    }
  ): Promise<PlatformIntegration> {
    try {
      const { data, error } = await supabase
        .from('platform_integrations')
        .update(settings)
        .eq('platform', platform)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating platform integration settings:', error);
      throw error;
    }
  }
}

export const inventoryService = new InventoryService();
export default inventoryService; 