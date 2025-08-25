// Inventory Management Service
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Supported platforms configuration
export const SUPPORTED_PLATFORMS = {
  shopify: {
    name: 'Shopify',
    category: 'E-commerce',
    features: ['Inventory Sync', 'Order Management', 'Product Catalog'],
    status: 'connected'
  },
  tiktok_shop: {
    name: 'TikTok Shop',
    category: 'Social Commerce',
    features: ['Live Shopping', 'Viral Marketing', 'Creator Partnerships'],
    status: 'connected'
  },
  etsy: {
    name: 'Etsy',
    category: 'Marketplace',
    features: ['Handmade Products', 'Vintage Items', 'Custom Orders'],
    status: 'connected'
  },
  amazon: {
    name: 'Amazon',
    category: 'Marketplace',
    features: ['FBA', 'Prime Shipping', 'Global Reach'],
    status: 'connected'
  },
  ebay: {
    name: 'eBay',
    category: 'Marketplace',
    features: ['Auction', 'Buy It Now', 'International Shipping'],
    status: 'connected'
  },
  walmart: {
    name: 'Walmart',
    category: 'Retail',
    features: ['Omnichannel', 'Pickup & Delivery', 'Price Matching'],
    status: 'connected'
  },
  woocommerce: {
    name: 'WooCommerce',
    category: 'E-commerce',
    features: ['WordPress Integration', 'Customization', 'Extensions'],
    status: 'connected'
  }
};

export interface PlatformIntegration {
  platform: string;
  name: string;
  category: string;
  features: string[];
  status: 'connected' | 'disconnected' | 'error';
  is_connected?: boolean;
  last_sync?: string;
  store_url?: string;
  sync_frequency_minutes?: number;
  settings?: any;
}

// Helper function for Supabase Edge Functions
const supabaseCall = async (functionName: string, options: RequestInit = {}) => {
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`Supabase function failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Supabase function error:', error);
    throw error;
  }
};

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  platform: string;
  current_stock: number;
  reserved_stock: number;
  available_stock: number;
  reorder_point: number;
  max_stock: number;
  cost: number;
  price: number;
  last_updated: string;
}

export interface DemandForecast {
  product_id: string;
  date: string;
  forecasted_demand: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  factors: {
    seasonal: string;
    trend: string;
    market_conditions: string;
  };
}

export interface ReorderRecommendation {
  product_id: string;
  product_name: string;
  sku: string;
  platform: string;
  current_stock: number;
  reorder_point: number;
  recommended_qty: number;
  urgency: 'high' | 'medium' | 'low';
  estimated_cost: number;
  lead_time_days: number;
  supplier: string;
  reason: string;
}

export interface Order {
  id: string;
  platform: string;
  order_number: string;
  customer_id: string;
  status: string;
  total_amount: number;
  items: Array<{
    product_id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  created_at: string;
  updated_at: string;
}

export class InventoryService {
  // Sync Inventory
  async syncInventory(platform: string): Promise<{ success: boolean; inventory?: InventoryItem[]; synced_at?: string; total_items?: number; error?: string }> {
    try {
      return await supabaseCall('inventory-management', {
        method: 'POST',
        body: JSON.stringify({ action: 'sync_inventory', platform })
      });
    } catch (error) {
      console.error('Failed to sync inventory:', error);
      return { success: false, error: 'Failed to sync inventory' };
    }
  }

  // Get Inventory
  async getInventory(platform: string = 'all'): Promise<{ success: boolean; inventory?: InventoryItem[]; total_items?: number; error?: string }> {
    try {
      return await supabaseCall('inventory-management', {
        method: 'POST',
        body: JSON.stringify({ action: 'get_inventory', platform })
      });
    } catch (error) {
      console.error('Failed to get inventory:', error);
      return { success: false, error: 'Failed to get inventory' };
    }
  }

  // Forecast Demand
  async forecastDemand(productId: string, dateFrom?: string, dateTo?: string): Promise<{ 
    success: boolean; 
    forecasts?: DemandForecast[]; 
    summary?: {
      total_forecasted: number;
      average_daily: number;
      peak_day: DemandForecast;
    }; 
    error?: string 
  }> {
    try {
      return await supabaseCall('inventory-management', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'forecast_demand', 
          productId, 
          dateFrom: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: dateTo || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to forecast demand:', error);
      return { success: false, error: 'Failed to forecast demand' };
    }
  }

  // Get Reorder Recommendations
  async getReorderRecommendations(): Promise<{ 
    success: boolean; 
    recommendations?: ReorderRecommendation[]; 
    total_recommendations?: number;
    high_priority?: number;
    estimated_total_cost?: number;
    error?: string 
  }> {
    try {
      return await supabaseCall('inventory-management', {
        method: 'POST',
        body: JSON.stringify({ action: 'get_recommendations' })
      });
    } catch (error) {
      console.error('Failed to get reorder recommendations:', error);
      return { success: false, error: 'Failed to get reorder recommendations' };
    }
  }

  // Update Stock
  async updateStock(productId: string, platform: string): Promise<{ success: boolean; updated_item?: InventoryItem; message?: string; error?: string }> {
    try {
      return await supabaseCall('inventory-management', {
        method: 'POST',
        body: JSON.stringify({ action: 'update_stock', productId, platform })
      });
    } catch (error) {
      console.error('Failed to update stock:', error);
      return { success: false, error: 'Failed to update stock' };
    }
  }

  // Get Orders
  async getOrders(platform: string = 'all', dateFrom?: string, dateTo?: string): Promise<{ 
    success: boolean; 
    orders?: Order[]; 
    total_orders?: number;
    total_revenue?: number;
    error?: string 
  }> {
    try {
      return await supabaseCall('inventory-management', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'get_orders', 
          platform, 
          dateFrom: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: dateTo || new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to get orders:', error);
      return { success: false, error: 'Failed to get orders' };
    }
  }

  // Get Inventory Analytics
  async getInventoryAnalytics(): Promise<{ 
    success: boolean; 
    analytics?: {
      total_items: number;
      low_stock_items: number;
      out_of_stock_items: number;
      total_value: number;
      average_stock_level: number;
      top_selling_products: string[];
    }; 
    error?: string 
  }> {
    try {
      const inventory = await this.getInventory();
      
      if (!inventory.success || !inventory.inventory) {
        return { success: false, error: 'Failed to fetch inventory' };
      }

      const items = inventory.inventory;
      const lowStockItems = items.filter(item => item.current_stock < item.reorder_point);
      const outOfStockItems = items.filter(item => item.current_stock === 0);
      const totalValue = items.reduce((sum, item) => sum + (item.current_stock * item.cost), 0);
      const averageStockLevel = items.reduce((sum, item) => sum + item.current_stock, 0) / items.length;

      const analytics = {
        total_items: items.length,
        low_stock_items: lowStockItems.length,
        out_of_stock_items: outOfStockItems.length,
        total_value: totalValue,
        average_stock_level: Math.round(averageStockLevel),
        top_selling_products: items.slice(0, 5).map(item => item.name)
      };

      return { success: true, analytics };
    } catch (error) {
      console.error('Failed to get inventory analytics:', error);
      return { success: false, error: 'Failed to get inventory analytics' };
    }
  }

  // Get Stock Alerts
  async getStockAlerts(): Promise<{ 
    success: boolean; 
    alerts?: Array<{
      product_id: string;
      product_name: string;
      current_stock: number;
      reorder_point: number;
      urgency: 'critical' | 'warning' | 'info';
      message: string;
    }>; 
    error?: string 
  }> {
    try {
      const inventory = await this.getInventory();
      
      if (!inventory.success || !inventory.inventory) {
        return { success: false, error: 'Failed to fetch inventory' };
      }

      const alerts = inventory.inventory
        .filter(item => item.current_stock <= item.reorder_point)
        .map(item => {
          let urgency: 'critical' | 'warning' | 'info' = 'info';
          let message = '';

          if (item.current_stock === 0) {
            urgency = 'critical';
            message = `${item.name} is out of stock!`;
          } else if (item.current_stock < item.reorder_point * 0.5) {
            urgency = 'critical';
            message = `${item.name} is critically low on stock (${item.current_stock} remaining)`;
          } else {
            urgency = 'warning';
            message = `${item.name} is below reorder point (${item.current_stock}/${item.reorder_point})`;
          }

          return {
            product_id: item.id,
            product_name: item.name,
            current_stock: item.current_stock,
            reorder_point: item.reorder_point,
            urgency,
            message
          };
        });

      return { success: true, alerts };
    } catch (error) {
      console.error('Failed to get stock alerts:', error);
      return { success: false, error: 'Failed to get stock alerts' };
    }
  }

  // Get platform integrations
  async getPlatformIntegrations(): Promise<{ 
    success: boolean; 
    integrations?: PlatformIntegration[]; 
    error?: string 
  }> {
    try {
      return await supabaseCall('inventory-management', {
        method: 'POST',
        body: JSON.stringify({ action: 'get_platform_integrations' })
      });
    } catch (error) {
      console.error('Failed to get platform integrations:', error);
      return { success: false, error: 'Failed to get platform integrations' };
    }
  }

  // Update platform integration
  async updatePlatformIntegration(platform: string, settings: any): Promise<{ 
    success: boolean; 
    integration?: PlatformIntegration; 
    error?: string 
  }> {
    try {
      return await supabaseCall('inventory-management', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'update_platform_integration', 
          platform, 
          settings 
        })
      });
    } catch (error) {
      console.error('Failed to update platform integration:', error);
      return { success: false, error: 'Failed to update platform integration' };
    }
  }

  // Bulk sync inventory
  async bulkSyncInventory(): Promise<{ 
    success: boolean; 
    results?: Array<{
      platform: string;
      success: boolean;
      items_synced: number;
      error?: string;
    }>; 
    error?: string 
  }> {
    try {
      return await supabaseCall('inventory-management', {
        method: 'POST',
        body: JSON.stringify({ action: 'bulk_sync_inventory' })
      });
    } catch (error) {
      console.error('Failed to bulk sync inventory:', error);
      return { success: false, error: 'Failed to bulk sync inventory' };
    }
  }

  // Get low stock products
  async getLowStockProducts(): Promise<{ 
    success: boolean; 
    products?: InventoryItem[]; 
    error?: string 
  }> {
    try {
      return await supabaseCall('inventory-management', {
        method: 'POST',
        body: JSON.stringify({ action: 'get_low_stock_products' })
      });
    } catch (error) {
      console.error('Failed to get low stock products:', error);
      return { success: false, error: 'Failed to get low stock products' };
    }
  }

  // Get inventory metrics
  async getInventoryMetrics(): Promise<{ 
    success: boolean; 
    metrics?: {
      total_items: number;
      low_stock_items: number;
      out_of_stock_items: number;
      total_value: number;
      average_stock_level: number;
    }; 
    error?: string 
  }> {
    try {
      return await supabaseCall('inventory-management', {
        method: 'POST',
        body: JSON.stringify({ action: 'get_inventory_metrics' })
      });
    } catch (error) {
      console.error('Failed to get inventory metrics:', error);
      return { success: false, error: 'Failed to get inventory metrics' };
    }
  }

  // Get blocked orders
  async getBlockedOrders(): Promise<{ 
    success: boolean; 
    orders?: Order[]; 
    error?: string 
  }> {
    try {
      return await supabaseCall('inventory-management', {
        method: 'POST',
        body: JSON.stringify({ action: 'get_blocked_orders' })
      });
    } catch (error) {
      console.error('Failed to get blocked orders:', error);
      return { success: false, error: 'Failed to get blocked orders' };
    }
  }
}

export const inventoryService = new InventoryService(); 