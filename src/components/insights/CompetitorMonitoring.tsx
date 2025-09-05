import { useState } from 'react';
import { Card, Title } from '@tremor/react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart,
  Star,
  AlertCircle,
  RefreshCw,
  Filter,
  Eye,
  BarChart2,
  Plus,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Competitor {
  id: string;
  name: string;
  website: string;
  logo?: string;
  marketShare: number;
  priceRange: string;
  lastActivity: string;
  status: 'active' | 'monitoring' | 'new';
}

interface CompetitorActivity {
  id: string;
  competitor: string;
  type: 'product_launch' | 'price_change' | 'promotion' | 'ad_campaign';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  timestamp: string;
  url?: string;
}

interface ProductComparison {
  product: string;
  ourPrice: number;
  competitorPrices: { competitor: string; price: number; change?: number }[];
  avgMarketPrice: number;
}

const mockCompetitors: Competitor[] = [
  {
    id: '1',
    name: 'Competitor A',
    website: 'competitor-a.com',
    marketShare: 23.5,
    priceRange: '$25-$150',
    lastActivity: '2025-06-06T14:30:00Z',
    status: 'active'
  },
  {
    id: '2',
    name: 'Competitor B',
    website: 'competitor-b.com',
    marketShare: 18.2,
    priceRange: '$30-$200',
    lastActivity: '2025-06-06T10:15:00Z',
    status: 'monitoring'
  },
  {
    id: '3',
    name: 'Competitor C',
    website: 'competitor-c.com',
    marketShare: 15.8,
    priceRange: '$20-$120',
    lastActivity: '2025-06-05T16:45:00Z',
    status: 'new'
  }
];

const mockActivities: CompetitorActivity[] = [
  {
    id: '1',
    competitor: 'Competitor A',
    type: 'product_launch',
    title: 'New Wireless Earbuds Pro Max',
    description: 'Launched premium wireless earbuds with advanced noise cancellation',
    impact: 'high',
    timestamp: '2025-06-06T14:30:00Z',
    url: 'https://competitor-a.com/products/earbuds-pro-max'
  },
  {
    id: '2',
    competitor: 'Competitor B',
    type: 'price_change',
    title: 'Price Reduction on Similar Products',
    description: 'Reduced prices by 15% on wireless audio products',
    impact: 'medium',
    timestamp: '2025-06-06T10:15:00Z'
  },
  {
    id: '3',
    competitor: 'Competitor C',
    type: 'ad_campaign',
    title: 'Summer Sale Campaign',
    description: 'Launched aggressive summer sale campaign with 30% discounts',
    impact: 'medium',
    timestamp: '2025-06-05T16:45:00Z'
  },
  {
    id: '4',
    competitor: 'Competitor A',
    type: 'promotion',
    title: 'Buy One Get One Free',
    description: 'Limited time BOGO offer on select products',
    impact: 'high',
    timestamp: '2025-06-05T09:20:00Z'
  }
];

const mockPriceComparisons: ProductComparison[] = [
  {
    product: 'Wireless Earbuds Pro',
    ourPrice: 149.99,
    competitorPrices: [
      { competitor: 'Competitor A', price: 159.99, change: -5 },
      { competitor: 'Competitor B', price: 139.99, change: 0 },
      { competitor: 'Competitor C', price: 144.99, change: 3 }
    ],
    avgMarketPrice: 148.74
  },
  {
    product: 'HD Security Camera',
    ourPrice: 199.99,
    competitorPrices: [
      { competitor: 'Competitor A', price: 219.99, change: 0 },
      { competitor: 'Competitor B', price: 189.99, change: -10 },
      { competitor: 'Competitor C', price: 209.99, change: 5 }
    ],
    avgMarketPrice: 206.66
  }
];

export default function CompetitorMonitoring() {
  const [loading, setLoading] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState('all');
  const [selectedActivityType, setSelectedActivityType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const handleRefreshData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Competitor data refreshed');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'product_launch':
        return <ShoppingCart className="h-4 w-4 text-blue-500" />;
      case 'price_change':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'promotion':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'ad_campaign':
        return <BarChart2 className="h-4 w-4 text-purple-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getImpactBadge = (impact: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[impact as keyof typeof colors]}`}>
        {impact.toUpperCase()}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      monitoring: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      new: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Competitor Monitoring</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track competitor activities, pricing, and market positioning
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button
            onClick={handleRefreshData}
            disabled={loading}
            className="btn-secondary"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Competitor
          </button>
        </div>
      </div>

      {showFilters && (
        <Card className="bg-white dark:bg-gray-800">
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Competitor
                </label>
                <select
                  value={selectedCompetitor}
                  onChange={(e) => setSelectedCompetitor(e.target.value)}
                  className="form-select"
                >
                  <option value="all">All Competitors</option>
                  {mockCompetitors.map(competitor => (
                    <option key={competitor.id} value={competitor.id}>
                      {competitor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Activity Type
                </label>
                <select
                  value={selectedActivityType}
                  onChange={(e) => setSelectedActivityType(e.target.value)}
                  className="form-select"
                >
                  <option value="all">All Activities</option>
                  <option value="product_launch">Product Launches</option>
                  <option value="price_change">Price Changes</option>
                  <option value="promotion">Promotions</option>
                  <option value="ad_campaign">Ad Campaigns</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time Range
                </label>
                <select className="form-select">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                </select>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Competitor Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white dark:bg-gray-800">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tracked Competitors</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{mockCompetitors.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-500 ml-1">+1</span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">this month</span>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Activities</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{mockActivities.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <BarChart2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-500 ml-1">+25%</span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">vs last week</span>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Price Alerts</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">3</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-500 ml-1">-2</span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">vs last week</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Competitors List */}
      <Card className="bg-white dark:bg-gray-800">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Title>Tracked Competitors</Title>
            <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 text-sm font-medium">
              Manage List
            </button>
          </div>

          <div className="space-y-4">
            {mockCompetitors.map((competitor) => (
              <div
                key={competitor.id}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {competitor.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {competitor.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {competitor.website}
                        </span>
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(competitor.status)}
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {competitor.marketShare}% market share
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {competitor.priceRange}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Last activity: {new Date(competitor.lastActivity).toLocaleString()}
                  </span>
                  <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 text-sm font-medium">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Recent Activities */}
      <Card className="bg-white dark:bg-gray-800">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Title>Recent Competitor Activities</Title>
            <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 text-sm font-medium">
              View All
            </button>
          </div>

          <div className="space-y-4">
            {mockActivities.map((activity) => (
              <div
                key={activity.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.title}
                        </h3>
                        {getImpactBadge(activity.impact)}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {activity.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>{activity.competitor}</span>
                        <span>•</span>
                        <span>{new Date(activity.timestamp).toLocaleString()}</span>
                        {activity.url && (
                          <>
                            <span>•</span>
                            <a
                              href={activity.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center"
                            >
                              View Source
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Price Comparison */}
      <Card className="bg-white dark:bg-gray-800">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Title>Price Comparison</Title>
            <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 text-sm font-medium">
              View All Products
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Our Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Market Average
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Competitor Prices
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {mockPriceComparisons.map((comparison, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ShoppingCart className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {comparison.product}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        ${comparison.ourPrice}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">
                        ${comparison.avgMarketPrice}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {comparison.competitorPrices.map((price, priceIndex) => (
                          <div key={priceIndex} className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {price.competitor}:
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              ${price.price}
                            </span>
                            {price.change !== undefined && price.change !== 0 && (
                              <span className={`text-xs ${
                                price.change > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                              }`}>
                                ({price.change > 0 ? '+' : ''}{price.change}%)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}