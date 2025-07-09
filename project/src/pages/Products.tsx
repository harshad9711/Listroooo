import React, { useState, useEffect } from 'react';
import { Card, Title, Text, Badge, Button, Grid, Col, Metric, Flex, Tab, TabList, TabGroup, TabPanel, TabPanels, Select, SelectItem, TextInput } from '@tremor/react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Sparkles, 
  ArrowUpRight,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  Clock,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  BarChart3,
  Settings,
  Bell,
  Globe,
  Store,
  ShoppingCart,
  CheckCircle,
  Ban,
  Unlock,
  Shield,
  AlertCircle
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  platform: string;
  lastOptimized: string;
  status: string;
  views: number;
  conversion: number;
  revenue: number;
  // Inventory fields
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  reorderQuantity: number;
  supplier: string;
  cost: number;
  lastRestocked: string;
  nextRestockDate: string;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked';
  category: string;
  location: string;
  barcode: string;
  weight: number;
  dimensions: string;
  // Multi-platform inventory
  platformStock: {
    [platform: string]: {
      stock: number;
      reserved: number;
      available: number;
      lastSync: string;
      isOrderBlocked?: boolean;
      orderBlockReason?: string;
      orderBlockDate?: string;
    };
  };
  syncStatus: 'synced' | 'pending' | 'error';
  crossPlatformSync: boolean;
}

// Order blocking interface
interface OrderBlock {
  id: string;
  product_id: string;
  platform: string;
  block_type: 'manual' | 'automatic' | 'scheduled';
  reason: 'out_of_stock' | 'low_stock' | 'maintenance' | 'quality_issue' | 'supplier_delay' | 'custom';
  custom_reason?: string;
  block_date: string;
  unblock_date?: string;
  is_active: boolean;
  notes?: string;
}

// Order management interface
interface OrderManagement {
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
}

// Platform configurations
const PLATFORMS = {
  shopify: {
    name: 'Shopify',
    icon: <Store className="h-4 w-4 text-green-600" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
    textColor: 'text-green-800 dark:text-green-200'
  },
  tiktok: {
    name: 'TikTok Shop',
    icon: <ShoppingCart className="h-4 w-4 text-black dark:text-white" />,
    color: 'text-black dark:text-white',
    bgColor: 'bg-black dark:bg-white',
    textColor: 'text-white dark:text-black'
  },
  etsy: {
    name: 'Etsy',
    icon: <Globe className="h-4 w-4 text-orange-600" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900',
    textColor: 'text-orange-800 dark:text-orange-200'
  },
  amazon: {
    name: 'Amazon',
    icon: <ShoppingBag className="h-4 w-4 text-yellow-600" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    textColor: 'text-yellow-800 dark:text-yellow-200'
  },
  ebay: {
    name: 'eBay',
    icon: <Store className="h-4 w-4 text-blue-600" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    textColor: 'text-blue-800 dark:text-blue-200'
  },
  walmart: {
    name: 'Walmart',
    icon: <Store className="h-4 w-4 text-blue-500" />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    textColor: 'text-blue-800 dark:text-blue-200'
  },
  woocommerce: {
    name: 'WooCommerce',
    icon: <Store className="h-4 w-4 text-purple-600" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
    textColor: 'text-purple-800 dark:text-purple-200'
  }
};

// Enhanced mock data with multi-platform inventory and order blocking
const products: Product[] = [
  {
    id: '1',
    name: 'Wireless Earbuds Pro',
    sku: 'EARB-001',
    platform: 'shopify',
    lastOptimized: '2023-05-15',
    status: 'Optimized',
    views: 1245,
    conversion: 3.2,
    revenue: 4851,
    currentStock: 45,
    minStockLevel: 20,
    maxStockLevel: 100,
    reorderPoint: 25,
    reorderQuantity: 50,
    supplier: 'TechSupplies Inc.',
    cost: 25.50,
    lastRestocked: '2023-05-10',
    nextRestockDate: '2023-05-25',
    stockStatus: 'in_stock',
    category: 'Electronics',
    location: 'Warehouse A - Shelf 3',
    barcode: '1234567890123',
    weight: 0.15,
    dimensions: '2.5" x 1.8" x 0.8"',
    platformStock: {
      shopify: { 
        stock: 25, 
        reserved: 3, 
        available: 22, 
        lastSync: '2023-05-15 14:30',
        isOrderBlocked: false
      },
      tiktok: { 
        stock: 15, 
        reserved: 2, 
        available: 13, 
        lastSync: '2023-05-15 14:25',
        isOrderBlocked: false
      },
      etsy: { 
        stock: 5, 
        reserved: 1, 
        available: 4, 
        lastSync: '2023-05-15 14:20',
        isOrderBlocked: false
      }
    },
    syncStatus: 'synced',
    crossPlatformSync: true
  },
  {
    id: '2',
    name: 'HD Security Camera',
    sku: 'CAM-101',
    platform: 'shopify',
    lastOptimized: '2023-05-10',
    status: 'Testing',
    views: 876,
    conversion: 2.8,
    revenue: 3210,
    currentStock: 8,
    minStockLevel: 15,
    maxStockLevel: 50,
    reorderPoint: 20,
    reorderQuantity: 30,
    supplier: 'SecurityPro',
    cost: 45.00,
    lastRestocked: '2023-05-05',
    nextRestockDate: '2023-05-20',
    stockStatus: 'low_stock',
    category: 'Security',
    location: 'Warehouse B - Shelf 1',
    barcode: '1234567890124',
    weight: 0.8,
    dimensions: '4.2" x 3.1" x 2.5"',
    platformStock: {
      shopify: { 
        stock: 5, 
        reserved: 1, 
        available: 4, 
        lastSync: '2023-05-15 14:30',
        isOrderBlocked: true,
        orderBlockReason: 'maintenance',
        orderBlockDate: '2023-05-15 10:00'
      },
      amazon: { 
        stock: 3, 
        reserved: 0, 
        available: 3, 
        lastSync: '2023-05-15 14:25',
        isOrderBlocked: false
      }
    },
    syncStatus: 'synced',
    crossPlatformSync: true
  },
  {
    id: '3',
    name: 'Smart Watch X3',
    sku: 'SWTCH-222',
    platform: 'tiktok',
    lastOptimized: 'Never',
    status: 'Not optimized',
    views: 654,
    conversion: 1.9,
    revenue: 2150,
    currentStock: 0,
    minStockLevel: 10,
    maxStockLevel: 75,
    reorderPoint: 15,
    reorderQuantity: 25,
    supplier: 'WearableTech',
    cost: 89.99,
    lastRestocked: '2023-04-28',
    nextRestockDate: '2023-05-30',
    stockStatus: 'out_of_stock',
    category: 'Wearables',
    location: 'Warehouse C - Shelf 2',
    barcode: '1234567890125',
    weight: 0.25,
    dimensions: '1.8" x 1.8" x 0.4"',
    platformStock: {
      tiktok: { 
        stock: 0, 
        reserved: 0, 
        available: 0, 
        lastSync: '2023-05-15 14:30',
        isOrderBlocked: true,
        orderBlockReason: 'out_of_stock',
        orderBlockDate: '2023-05-15 09:00'
      },
      etsy: { 
        stock: 0, 
        reserved: 0, 
        available: 0, 
        lastSync: '2023-05-15 14:25',
        isOrderBlocked: true,
        orderBlockReason: 'out_of_stock',
        orderBlockDate: '2023-05-15 09:00'
      }
    },
    syncStatus: 'synced',
    crossPlatformSync: true
  },
  {
    id: '4',
    name: 'Bluetooth Speaker',
    sku: 'SPKR-333',
    platform: 'amazon',
    lastOptimized: '2023-05-12',
    status: 'Optimized',
    views: 1890,
    conversion: 4.1,
    revenue: 7560,
    currentStock: 120,
    minStockLevel: 30,
    maxStockLevel: 150,
    reorderPoint: 40,
    reorderQuantity: 60,
    supplier: 'AudioMax',
    cost: 35.00,
    lastRestocked: '2023-05-08',
    nextRestockDate: '2023-06-15',
    stockStatus: 'overstocked',
    category: 'Audio',
    location: 'Warehouse A - Shelf 5',
    barcode: '1234567890126',
    weight: 1.2,
    dimensions: '8.5" x 3.2" x 3.2"',
    platformStock: {
      amazon: { 
        stock: 80, 
        reserved: 5, 
        available: 75, 
        lastSync: '2023-05-15 14:30',
        isOrderBlocked: false
      },
      ebay: { 
        stock: 40, 
        reserved: 2, 
        available: 38, 
        lastSync: '2023-05-15 14:25',
        isOrderBlocked: false
      }
    },
    syncStatus: 'synced',
    crossPlatformSync: true
  }
];

// Mock order blocks data
const mockOrderBlocks: OrderBlock[] = [
  {
    id: '1',
    product_id: '2',
    platform: 'shopify',
    block_type: 'manual',
    reason: 'maintenance',
    block_date: '2023-05-15T10:00:00Z',
    is_active: true,
    notes: 'Product maintenance - quality check required'
  },
  {
    id: '2',
    product_id: '3',
    platform: 'tiktok',
    block_type: 'automatic',
    reason: 'out_of_stock',
    block_date: '2023-05-15T09:00:00Z',
    is_active: true,
    notes: 'Auto-blocked due to out of stock'
  },
  {
    id: '3',
    product_id: '3',
    platform: 'etsy',
    block_type: 'automatic',
    reason: 'out_of_stock',
    block_date: '2023-05-15T09:00:00Z',
    is_active: true,
    notes: 'Auto-blocked due to out of stock'
  }
];

// Mock blocked orders data
const mockBlockedOrders: OrderManagement[] = [
  {
    id: '1',
    product_id: '2',
    platform: 'shopify',
    order_id: 'ORD-001',
    customer_id: 'CUST-001',
    quantity_requested: 2,
    quantity_available: 0,
    quantity_fulfilled: 0,
    order_status: 'blocked',
    block_reason: 'Product maintenance - quality check required',
    created_at: '2023-05-15T11:30:00Z'
  },
  {
    id: '2',
    product_id: '3',
    platform: 'tiktok',
    order_id: 'ORD-002',
    customer_id: 'CUST-002',
    quantity_requested: 1,
    quantity_available: 0,
    quantity_fulfilled: 0,
    order_status: 'blocked',
    block_reason: 'Insufficient stock',
    created_at: '2023-05-15T12:15:00Z'
  },
  {
    id: '3',
    product_id: '3',
    platform: 'etsy',
    order_id: 'ORD-003',
    customer_id: 'CUST-003',
    quantity_requested: 1,
    quantity_available: 0,
    quantity_fulfilled: 0,
    order_status: 'blocked',
    block_reason: 'Insufficient stock',
    created_at: '2023-05-15T13:45:00Z'
  }
];

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [inventoryView, setInventoryView] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showCrossPlatformOnly, setShowCrossPlatformOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  // Order blocking state
  const [orderBlocks, setOrderBlocks] = useState<OrderBlock[]>([]);
  const [blockedOrders, setBlockedOrders] = useState<OrderManagement[]>([]);
  const [showOrderBlockModal, setShowOrderBlockModal] = useState(false);
  const [selectedProductForBlock, setSelectedProductForBlock] = useState<Product | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [blockNotes, setBlockNotes] = useState('');
  const [blockType, setBlockType] = useState<'manual' | 'automatic' | 'scheduled'>('manual');
  const [unblockDate, setUnblockDate] = useState('');
  const [showOrderManagement, setShowOrderManagement] = useState(false);

  // Load mock data on component mount
  useEffect(() => {
    setOrderBlocks(mockOrderBlocks);
    setBlockedOrders(mockBlockedOrders);
  }, []);

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.supplier.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesStockStatus = selectedStockStatus === 'all' || product.stockStatus === selectedStockStatus;
      const matchesPlatform = selectedPlatform === 'all' || product.platform === selectedPlatform;
      const matchesLowStock = !showLowStockOnly || product.stockStatus === 'low_stock' || product.stockStatus === 'out_of_stock';
      const matchesCrossPlatform = !showCrossPlatformOnly || product.crossPlatformSync;
      
      return matchesSearch && matchesCategory && matchesStockStatus && matchesPlatform && matchesLowStock && matchesCrossPlatform;
    })
    .sort((a, b) => {
      let aValue = a[sortBy as keyof Product];
      let bValue = b[sortBy as keyof Product];
      
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  // Enhanced inventory metrics with order blocking
  const inventoryMetrics = {
    totalProducts: products.length,
    inStock: products.filter(p => p.stockStatus === 'in_stock').length,
    lowStock: products.filter(p => p.stockStatus === 'low_stock').length,
    outOfStock: products.filter(p => p.stockStatus === 'out_of_stock').length,
    overstocked: products.filter(p => p.stockStatus === 'overstocked').length,
    crossPlatformProducts: products.filter(p => p.crossPlatformSync).length,
    syncedProducts: products.filter(p => p.syncStatus === 'synced').length,
    totalValue: products.reduce((sum, p) => sum + (p.currentStock * p.cost), 0),
    blockedOrders: blockedOrders.length,
    activeOrderBlocks: orderBlocks.filter(ob => ob.is_active).length
  };

  // Calculate platform-specific metrics
  const platformMetrics = Object.keys(PLATFORMS).map(platformKey => {
    const platformProducts = products.filter(p => p.platformStock[platformKey]);
    const totalStock = platformProducts.reduce((sum, p) => sum + (p.platformStock[platformKey]?.stock || 0), 0);
    const totalReserved = platformProducts.reduce((sum, p) => sum + (p.platformStock[platformKey]?.reserved || 0), 0);
    const totalAvailable = platformProducts.reduce((sum, p) => sum + (p.platformStock[platformKey]?.available || 0), 0);
    
    return {
      platform: platformKey,
      name: PLATFORMS[platformKey as keyof typeof PLATFORMS].name,
      totalStock,
      totalReserved,
      totalAvailable,
      productCount: platformProducts.length
    };
  }).filter(pm => pm.productCount > 0);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Optimized':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'Testing':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getStockStatusClass = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'low_stock':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'out_of_stock':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'overstocked':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getStockStatusText = (status: string) => {
    switch (status) {
      case 'in_stock': return 'In Stock';
      case 'low_stock': return 'Low Stock';
      case 'out_of_stock': return 'Out of Stock';
      case 'overstocked': return 'Overstocked';
      default: return status;
    }
  };

  const getStockStatusIcon = (status: string) => {
    switch (status) {
      case 'in_stock': return <Package className="h-4 w-4 text-green-600" />;
      case 'low_stock': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'out_of_stock': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'overstocked': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      default: return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'synced': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const categories = [...new Set(products.map(p => p.category))];

  // Order blocking functions
  const handleBlockOrders = (product: Product, platform: string) => {
    setSelectedProductForBlock(product);
    setBlockReason('');
    setBlockNotes('');
    setBlockType('manual');
    setUnblockDate('');
    setShowOrderBlockModal(true);
  };

  const handleUnblockOrders = async (product: Product, platform: string) => {
    try {
      // This would call the inventory service
      console.log(`Unblocking orders for ${product.name} on ${platform}`);
      // await inventoryService.unblockOrders(product.id, platform);
      
      // Update local state
      setOrderBlocks(prev => prev.map(ob => 
        ob.product_id === product.id && ob.platform === platform 
          ? { ...ob, is_active: false, unblock_date: new Date().toISOString() }
          : ob
      ));
    } catch (error) {
      console.error('Error unblocking orders:', error);
    }
  };

  const handleCreateOrderBlock = async () => {
    if (!selectedProductForBlock || !blockReason) return;

    try {
      // This would call the inventory service
      console.log('Creating order block:', {
        product: selectedProductForBlock.name,
        reason: blockReason,
        notes: blockNotes,
        type: blockType,
        unblockDate
      });
      
      // await inventoryService.blockOrders(
      //   selectedProductForBlock.id,
      //   selectedProductForBlock.platform,
      //   blockReason,
      //   blockType,
      //   unblockDate || undefined,
      //   blockNotes
      // );

      setShowOrderBlockModal(false);
      setSelectedProductForBlock(null);
    } catch (error) {
      console.error('Error creating order block:', error);
    }
  };

  const getOrderBlockStatus = (product: Product, platform: string) => {
    const platformStock = product.platformStock[platform];
    if (!platformStock) return null;
    
    return {
      isBlocked: platformStock.isOrderBlocked || false,
      reason: platformStock.orderBlockReason,
      date: platformStock.orderBlockDate
    };
  };

  const getOrderBlockIcon = (isBlocked: boolean, reason?: string) => {
    if (!isBlocked) return null;
    
    switch (reason) {
      case 'out_of_stock':
        return <Ban className="h-4 w-4 text-red-600" />;
      case 'low_stock':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'maintenance':
        return <Settings className="h-4 w-4 text-blue-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Products & Inventory</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage products, track inventory levels, and optimize performance across all platforms
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button
            onClick={() => setInventoryView(!inventoryView)}
            className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
              inventoryView 
                ? 'border-indigo-300 text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Package className="mr-2 h-4 w-4" />
            {inventoryView ? 'Product View' : 'Inventory View'}
          </button>
          <Link
            to="/optimize"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Optimize
          </Link>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Inventory Metrics */}
      {inventoryView && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-10 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Products</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{inventoryMetrics.totalProducts}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
              <div className="text-sm text-gray-600 dark:text-gray-400">In Stock</div>
              <div className="text-2xl font-bold text-green-600">{inventoryMetrics.inStock}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
              <div className="text-sm text-gray-600 dark:text-gray-400">Low Stock</div>
              <div className="text-2xl font-bold text-yellow-600">{inventoryMetrics.lowStock}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
              <div className="text-sm text-gray-600 dark:text-gray-400">Out of Stock</div>
              <div className="text-2xl font-bold text-red-600">{inventoryMetrics.outOfStock}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
              <div className="text-sm text-gray-600 dark:text-gray-400">Overstocked</div>
              <div className="text-2xl font-bold text-blue-600">{inventoryMetrics.overstocked}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
              <div className="text-sm text-gray-600 dark:text-gray-400">Cross-Platform</div>
              <div className="text-2xl font-bold text-purple-600">{inventoryMetrics.crossPlatformProducts}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
              <div className="text-sm text-gray-600 dark:text-gray-400">Synced</div>
              <div className="text-2xl font-bold text-green-600">{inventoryMetrics.syncedProducts}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Value</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">${inventoryMetrics.totalValue.toFixed(0)}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-red-200 dark:border-red-800">
              <div className="text-sm text-gray-600 dark:text-gray-400">Blocked Orders</div>
              <div className="text-2xl font-bold text-red-600">{inventoryMetrics.blockedOrders}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-orange-200 dark:border-orange-800">
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Blocks</div>
              <div className="text-2xl font-bold text-orange-600">{inventoryMetrics.activeOrderBlocks}</div>
            </div>
          </div>

          {/* Platform Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {platformMetrics.map((platform) => (
              <div key={platform.platform} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    {PLATFORMS[platform.platform as keyof typeof PLATFORMS].icon}
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">{platform.name}</span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{platform.productCount} products</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Stock:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{platform.totalStock}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Reserved:</span>
                    <span className="font-medium text-yellow-600">{platform.totalReserved}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Available:</span>
                    <span className="font-medium text-green-600">{platform.totalAvailable}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Search and filters */}
      <div className="mb-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search products, SKU, supplier..."
          />
        </div>
        
        {inventoryView && (
          <>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 sm:text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 sm:text-sm"
            >
              <option value="all">All Platforms</option>
              {Object.entries(PLATFORMS).map(([key, platform]) => (
                <option key={key} value={key}>{platform.name}</option>
              ))}
            </select>
            
            <select
              value={selectedStockStatus}
              onChange={(e) => setSelectedStockStatus(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 sm:text-sm"
            >
              <option value="all">All Stock Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="overstocked">Overstocked</option>
            </select>
            
            <button
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${
                showLowStockOnly 
                  ? 'border-red-300 text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Low Stock Only
            </button>

            <button
              onClick={() => setShowCrossPlatformOnly(!showCrossPlatformOnly)}
              className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${
                showCrossPlatformOnly 
                  ? 'border-purple-300 text-purple-700 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Globe className="mr-2 h-4 w-4" />
              Cross-Platform Only
            </button>
          </>
        )}
        
        <div className="relative">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Filter className="mr-2 h-4 w-4" />
            More Filters
          </button>
          
          {filterOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-60 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1" role="menu" aria-orientation="vertical">
                <div className="px-4 py-2">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Platform</h3>
                  <div className="mt-2 space-y-2">
                    {Object.entries(PLATFORMS).map(([key, platform]) => (
                      <div key={key} className="flex items-center">
                        <input id={key} type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded" />
                        <label htmlFor={key} className="ml-2 text-sm text-gray-700 dark:text-gray-300">{platform.name}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                      <input id="optimized" type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded" />
                      <label htmlFor="optimized" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Optimized</label>
                    </div>
                    <div className="flex items-center">
                      <input id="testing" type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded" />
                      <label htmlFor="testing" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Testing</label>
                    </div>
                    <div className="flex items-center">
                      <input id="not-optimized" type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded" />
                      <label htmlFor="not-optimized" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Not optimized</label>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                  <button className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">Apply Filters</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Products table */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {inventoryView ? 'Inventory Management' : 'Product Performance'} ({filteredProducts.length} products)
          </h3>
          <div className="flex space-x-2">
            <button className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
              <Download className="mr-1 h-4 w-4" />
              Export
            </button>
            <button className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
              <Upload className="mr-1 h-4 w-4" />
              Import
            </button>
            <button className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
              <RefreshCw className="mr-1 h-4 w-4" />
              Sync All
            </button>
          </div>
        </div>
        
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredProducts.map((product) => (
            <li key={product.id}>
              <div className="block hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          <Link to={`/products/${product.id}`} className="hover:underline">
                            {product.name}
                          </Link>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          SKU: {product.sku} • {product.category}
                        </div>
                        {inventoryView && (
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {product.location} • Supplier: {product.supplier}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {inventoryView ? (
                        <div className="flex flex-col items-end">
                          <div className="flex items-center space-x-2">
                            {getStockStatusIcon(product.stockStatus)}
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStockStatusClass(product.stockStatus)}`}>
                              {getStockStatusText(product.stockStatus)}
                            </span>
                            {product.crossPlatformSync && (
                              <Globe className="h-4 w-4 text-purple-600" title="Cross-platform sync enabled" />
                            )}
                            {getSyncStatusIcon(product.syncStatus)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Stock: {product.currentStock} / {product.maxStockLevel}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            Cost: ${product.cost}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(product.status)}`}>
                            {product.status}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {PLATFORMS[product.platform as keyof typeof PLATFORMS]?.name || product.platform}
                          </span>
                        </div>
                      )}
                      <div className="relative flex items-center">
                        <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      {inventoryView ? (
                        <>
                          <div className="mr-6 flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <span className="mr-1">Reorder Point:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{product.reorderPoint}</span>
                          </div>
                          <div className="mr-6 flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <span className="mr-1">Reorder Qty:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{product.reorderQuantity}</span>
                          </div>
                          <div className="mr-6 flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <span className="mr-1">Next Restock:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{product.nextRestockDate}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <span className="mr-1">Value:</span>
                            <span className="font-medium text-gray-900 dark:text-white">${(product.currentStock * product.cost).toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="mr-6 flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <span className="mr-1">Views:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{product.views.toLocaleString()}</span>
                          </div>
                          <div className="mr-6 flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <span className="mr-1">Conversion:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{product.conversion}%</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <span className="mr-1">Revenue:</span>
                            <span className="font-medium text-gray-900 dark:text-white">${product.revenue.toLocaleString()}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                      {inventoryView ? (
                        <>
                          <button className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                            <Edit className="mr-1 h-4 w-4" />
                            Edit
                          </button>
                          <button className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                            <Truck className="mr-1 h-4 w-4" />
                            Restock
                          </button>
                          <Link 
                            to={`/products/${product.id}`}
                            className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Link>
                        </>
                      ) : (
                        <div className="flex">
                          {product.status !== 'Optimized' ? (
                            <Link 
                              to={`/optimize?product=${product.id}`}
                              className="inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                            >
                              <Sparkles className="mr-1 h-4 w-4" />
                              Optimize
                            </Link>
                          ) : (
                            <Link 
                              to={`/products/${product.id}`}
                              className="inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                            >
                              View Details
                              <ArrowUpRight className="ml-1 h-4 w-4" />
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Platform Stock Breakdown */}
                  {inventoryView && product.crossPlatformSync && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Platform Stock Levels:</div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(product.platformStock).map(([platformKey, stockData]) => {
                          const blockStatus = getOrderBlockStatus(product, platformKey);
                          const isBlocked = blockStatus?.isBlocked;
                          
                          return (
                            <div key={platformKey} className={`flex items-center space-x-2 px-2 py-1 rounded text-xs ${
                              isBlocked 
                                ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800' 
                                : 'bg-gray-50 dark:bg-gray-700'
                            }`}>
                              {PLATFORMS[platformKey as keyof typeof PLATFORMS]?.icon}
                              <span className="text-gray-700 dark:text-gray-300">
                                {PLATFORMS[platformKey as keyof typeof PLATFORMS]?.name}:
                              </span>
                              <span className={`font-medium ${
                                isBlocked ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                              }`}>
                                {stockData.available}
                              </span>
                              <span className="text-gray-500">({stockData.reserved} reserved)</span>
                              
                              {/* Order blocking status and actions */}
                              {isBlocked && (
                                <div className="flex items-center space-x-1">
                                  {getOrderBlockIcon(true, blockStatus?.reason)}
                                  <span className="text-red-600 dark:text-red-400 text-xs">
                                    {blockStatus?.reason?.replace('_', ' ')}
                                  </span>
                                  <button
                                    onClick={() => handleUnblockOrders(product, platformKey)}
                                    className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                                    title="Unblock orders"
                                  >
                                    <Unlock className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                              
                              {!isBlocked && (
                                <button
                                  onClick={() => handleBlockOrders(product, platformKey)}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                                  title="Block orders"
                                >
                                  <Ban className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Order Blocking Modal */}
      {showOrderBlockModal && selectedProductForBlock && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Block Orders
                </h3>
                <button
                  onClick={() => setShowOrderBlockModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Blocking orders for <strong>{selectedProductForBlock.name}</strong> on{' '}
                  <strong>{PLATFORMS[selectedProductForBlock.platform as keyof typeof PLATFORMS]?.name || selectedProductForBlock.platform}</strong>
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Block Type
                  </label>
                  <select
                    value={blockType}
                    onChange={(e) => setBlockType(e.target.value as 'manual' | 'automatic' | 'scheduled')}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="manual">Manual</option>
                    <option value="automatic">Automatic</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reason
                  </label>
                  <select
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select a reason</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="quality_issue">Quality Issue</option>
                    <option value="supplier_delay">Supplier Delay</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {blockType === 'scheduled' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Unblock Date
                    </label>
                    <input
                      type="datetime-local"
                      value={unblockDate}
                      onChange={(e) => setUnblockDate(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={blockNotes}
                    onChange={(e) => setBlockNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Additional notes about this order block..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowOrderBlockModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateOrderBlock}
                  disabled={!blockReason}
                  className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Block Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Management Section */}
      {showOrderManagement && (
        <div className="mt-8 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Order Management ({blockedOrders.length} blocked orders)
            </h3>
            <button
              onClick={() => setShowOrderManagement(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {blockedOrders.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {blockedOrders.map((order) => (
                <li key={order.id} className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Order {order.order_id}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Customer: {order.customer_id} • Platform: {order.platform}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        Requested: {order.quantity_requested} • Available: {order.quantity_available} • Fulfilled: {order.quantity_fulfilled}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Blocked
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {order.block_reason}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No blocked orders</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                All orders are currently being processed normally.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Order Management Toggle Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => setShowOrderManagement(!showOrderManagement)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <Shield className="mr-2 h-4 w-4" />
          {showOrderManagement ? 'Hide' : 'Show'} Order Management
        </button>
      </div>
    </div>
  );
};

export default Products;