import React from "react";


import {
  Store, 
  ShoppingCart, 
  Globe, 
  ShoppingBag, 
  Settings, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  Zap,
  Shield,
  TrendingUp,
  Users,
  Package,
  Truck,
  CreditCard,
  BarChart3,
  Filter,
  Search
} from 'lucide-react';

interface PlatformCardProps {
  platform: {
    key: string;
    name: string;
    category: string;
    features: string[];
    api_docs: string;
    icon: string;
  };
  integration?: PlatformIntegration;
  onConnect: (platform: string) => void;
  onDisconnect: (platform: string) => void;
  onEdit: (platform: string) => void;
}

const PlatformCard: React.FC<PlatformCardProps> = ({ 
  platform, 
  integration, 
  onConnect, 
  onDisconnect, 
  onEdit 
}) => {
  const getPlatformIcon = (iconName: string) => {
    switch (iconName) {
      case 'shopify':
        return <Store className="h-6 w-6 text-green-600" />;
      case 'tiktok':
        return <ShoppingCart className="h-6 w-6 text-black dark:text-white" />;
      case 'etsy':
        return <Globe className="h-6 w-6 text-orange-600" />;
      case 'amazon':
        return <ShoppingBag className="h-6 w-6 text-yellow-600" />;
      case 'ebay':
        return <Store className="h-6 w-6 text-blue-600" />;
      case 'walmart':
        return <Store className="h-6 w-6 text-blue-500" />;
      case 'woocommerce':
        return <Store className="h-6 w-6 text-purple-600" />;
      case 'bigcommerce':
        return <Store className="h-6 w-6 text-blue-700" />;
      case 'magento':
        return <Store className="h-6 w-6 text-orange-700" />;
      case 'prestashop':
        return <Store className="h-6 w-6 text-blue-800" />;
      case 'opencart':
        return <Store className="h-6 w-6 text-blue-900" />;
      case 'squarespace':
        return <Store className="h-6 w-6 text-gray-800 dark:text-gray-200" />;
      case 'wix':
        return <Store className="h-6 w-6 text-blue-600" />;
      default:
        return <Store className="h-6 w-6 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'E-commerce':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'Marketplace':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'Social Commerce':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200';
      case 'Website Builder':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
      case 'Enterprise E-commerce':
        return 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200';
      case 'Fulfillment':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'inventory_sync':
        return <RefreshCw className="h-4 w-4" />;
      case 'order_management':
        return <Package className="h-4 w-4" />;
      case 'product_management':
        return <Edit className="h-4 w-4" />;
      case 'live_streaming':
        return <Zap className="h-4 w-4" />;
      case 'viral_marketing':
        return <TrendingUp className="h-4 w-4" />;
      case 'handmade_focus':
        return <Users className="h-4 w-4" />;
      case 'community':
        return <Users className="h-4 w-4" />;
      case 'fba':
        return <Truck className="h-4 w-4" />;
      case 'fbm':
        return <Package className="h-4 w-4" />;
      case 'global_reach':
        return <Globe className="h-4 w-4" />;
      case 'auction':
        return <BarChart3 className="h-4 w-4" />;
      case 'fixed_price':
        return <CreditCard className="h-4 w-4" />;
      case 'retail_partnership':
        return <Shield className="h-4 w-4" />;
      case 'omnichannel':
        return <Store className="h-4 w-4" />;
      case 'wordpress_integration':
        return <Globe className="h-4 w-4" />;
      case 'customizable':
        return <Settings className="h-4 w-4" />;
      case 'enterprise_features':
        return <Shield className="h-4 w-4" />;
      case 'multi_store':
        return <Store className="h-4 w-4" />;
      case 'enterprise_grade':
        return <Shield className="h-4 w-4" />;
      case 'open_source':
        return <Globe className="h-4 w-4" />;
      case 'multilingual':
        return <Globe className="h-4 w-4" />;
      case 'extensions':
        return <Plus className="h-4 w-4" />;
      case 'design_focused':
        return <Eye className="h-4 w-4" />;
      case 'all_in_one':
        return <Package className="h-4 w-4" />;
      case 'drag_drop':
        return <Edit className="h-4 w-4" />;
      case 'apps_marketplace':
        return <Store className="h-4 w-4" />;
      case 'high_volume':
        return <TrendingUp className="h-4 w-4" />;
      case 'advanced_analytics':
        return <BarChart3 className="h-4 w-4" />;
      case 'priority_support':
        return <Shield className="h-4 w-4" />;
      case 'fulfillment':
        return <Truck className="h-4 w-4" />;
      case 'prime_eligibility':
        return <CheckCircle className="h-4 w-4" />;
      case 'self_fulfillment':
        return <Package className="h-4 w-4" />;
      case 'control':
        return <Settings className="h-4 w-4" />;
      case 'managed_service':
        return <Shield className="h-4 w-4" />;
      case 'support':
        return <Users className="h-4 w-4" />;
      case 'premium_features':
        return <Zap className="h-4 w-4" />;
      case 'analytics':
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getFeatureLabel = (feature: string) => {
    return feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getPlatformIcon(platform.icon)}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {platform.name}
            </h3>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(platform.category)}`}>
              {platform.category}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {integration?.is_connected ? (
            <div className="flex items-center space-x-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Connected</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-gray-500">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">Not Connected</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Features:</h4>
        <div className="flex flex-wrap gap-2">
          {platform.features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
              {getFeatureIcon(feature)}
              <span>{getFeatureLabel(feature)}</span>
            </div>
          ))}
        </div>
      </div>

      {integration?.is_connected && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-green-800 dark:text-green-200 font-medium">Store: {integration.store_url || 'N/A'}</p>
              <p className="text-green-600 dark:text-green-300">
                Last sync: {integration.last_sync ? new Date(integration.last_sync).toLocaleString() : 'Never'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-green-600 dark:text-green-300">
                Sync every {integration.sync_frequency_minutes} min
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {integration?.is_connected ? (
            <>
              <button
                onClick={() => onEdit(platform.key)}
                className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Edit className="mr-1 h-3 w-3" />
                Edit
              </button>
              <button
                onClick={() => onDisconnect(platform.key)}
                className="inline-flex items-center px-3 py-1 border border-red-300 dark:border-red-600 rounded text-sm text-red-700 dark:text-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <XCircle className="mr-1 h-3 w-3" />
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={() => onConnect(platform.key)}
              className="inline-flex items-center px-3 py-1 border border-transparent rounded text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="mr-1 h-3 w-3" />
              Connect
            </button>
          )}
        </div>
        
        <a
          href={platform.api_docs}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
        >
          API Docs
          <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      </div>
    </div>
  );
};

const PlatformIntegrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<PlatformIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showConnectedOnly, setShowConnectedOnly] = useState(false);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getPlatformIntegrations();
      setIntegrations(data);
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    try {
      // In a real app, this would open OAuth flow or API key setup
      console.log(`Connecting to ${platform}...`);
      // For demo purposes, we'll just update the integration status
      await inventoryService.updatePlatformIntegration(platform, {
        is_connected: true,
        store_url: `https://${platform}.com/store`,
        last_sync: new Date().toISOString()
      });
      await loadIntegrations();
    } catch (error) {
      console.error('Error connecting platform:', error);
    }
  };

  const handleDisconnect = async (platform: string) => {
    try {
      await inventoryService.updatePlatformIntegration(platform, {
        is_connected: false,
        store_url: null,
        last_sync: null
      });
      await loadIntegrations();
    } catch (error) {
      console.error('Error disconnecting platform:', error);
    }
  };

  const handleEdit = (platform: string) => {
    // In a real app, this would open a modal to edit integration settings
    console.log(`Editing ${platform} integration...`);
  };

  const handleBulkSync = async () => {
    try {
      const result = await inventoryService.bulkSyncInventory();
      console.log(`Bulk sync completed: ${result.success} successful, ${result.failed} failed`);
      await loadIntegrations();
    } catch (error) {
      console.error('Error during bulk sync:', error);
    }
  };

  // Filter platforms based on search and filters
  const filteredPlatforms = Object.entries(SUPPORTED_PLATFORMS)
    .filter(([key, platform]) => {
      const matchesSearch = platform.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           platform.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           platform.features.some(f => f.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || platform.category === selectedCategory;
      
      const integration = integrations.find(i => i.platform === key);
      const matchesStatus = selectedStatus === 'all' || 
                           (selectedStatus === 'connected' && integration?.is_connected) ||
                           (selectedStatus === 'disconnected' && !integration?.is_connected);
      
      const matchesConnected = !showConnectedOnly || integration?.is_connected;
      
      return matchesSearch && matchesCategory && matchesStatus && matchesConnected;
    })
    .map(([key, platform]) => ({
      key,
      ...platform,
      integration: integrations.find(i => i.platform === key)
    }));

  const categories = [...new Set(Object.values(SUPPORTED_PLATFORMS).map(p => p.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Platform Integrations</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Connect and manage inventory across all major e-commerce platforms
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button
            onClick={handleBulkSync}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync All
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Custom Platform
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Platforms</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{Object.keys(SUPPORTED_PLATFORMS).length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-600 dark:text-gray-400">Connected</div>
          <div className="text-2xl font-bold text-green-600">{integrations.filter(i => i.is_connected).length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-600 dark:text-gray-400">Categories</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{categories.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-600 dark:text-gray-400">Last Sync</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {integrations.filter(i => i.is_connected && i.last_sync).length > 0 ? 'Active' : 'None'}
          </div>
        </div>
      </div>

      {/* Filters */}
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
            placeholder="Search platforms, features, categories..."
          />
        </div>
        
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
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 sm:text-sm"
        >
          <option value="all">All Status</option>
          <option value="connected">Connected</option>
          <option value="disconnected">Not Connected</option>
        </select>
        
        <button
          onClick={() => setShowConnectedOnly(!showConnectedOnly)}
          className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${
            showConnectedOnly 
              ? 'border-indigo-300 text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300'
              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Connected Only
        </button>
      </div>

      {/* Platforms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlatforms.map((platform) => (
          <PlatformCard
            key={platform.key}
            platform={platform}
            integration={platform.integration}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onEdit={handleEdit}
          />
        ))}
      </div>

      {filteredPlatforms.length === 0 && (
        <div className="text-center py-12">
          <Globe className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No platforms found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default PlatformIntegrations; 