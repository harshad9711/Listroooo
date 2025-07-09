import React from "react";


import {
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  RefreshCw,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

const COLORS = {
  tiktok: '#ff0050',
  meta: '#1877f2',
  google: '#4285f4',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444'
};

const AdCreativePerformance: React.FC = () => {
  const [creatives, setCreatives] = useState<AdCreative[]>([]);
  const [platformSummary, setPlatformSummary] = useState<PlatformSummary[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [showWastedOnly, setShowWastedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>('cost_per_conversion');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [creativesData, summariesData, metricsData] = await Promise.all([
        adCreativePerformanceService.getAdCreatives(),
        adCreativePerformanceService.getPlatformSummaries(),
        adCreativePerformanceService.getPerformanceMetrics()
      ]);
      
      setCreatives(creativesData);
      setPlatformSummary(summariesData);
      setPerformanceMetrics(metricsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredCreatives = creatives.filter(creative => {
    if (selectedPlatform !== 'all' && creative.platform !== selectedPlatform) return false;
    if (showWastedOnly && creative.conversions > 0) return false;
    return true;
  });

  const sortedCreatives = [...filteredCreatives].sort((a, b) => {
    let aValue = a[sortBy as keyof AdCreative];
    let bValue = b[sortBy as keyof AdCreative];
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const getPerformanceColor = (creative: AdCreative) => {
    if (creative.conversions === 0) return COLORS.danger;
    if (creative.cost_per_conversion < 25) return COLORS.success;
    if (creative.cost_per_conversion < 50) return COLORS.warning;
    return COLORS.danger;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'paused': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ad Creative Performance</h1>
          <p className="text-gray-600">Monitor and optimize your ad creatives across all platforms</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </button>
        </div>
      </div>

      {/* Overall Performance Metrics */}
      {performanceMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-sm text-gray-600">Total Creatives</div>
            <div className="text-2xl font-bold text-gray-900">{performanceMetrics.total_creatives}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold text-green-600">{performanceMetrics.active_creatives}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-sm text-gray-600">Total Spend</div>
            <div className="text-2xl font-bold text-gray-900">${performanceMetrics.total_spend.toFixed(2)}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-sm text-gray-600">Conversions</div>
            <div className="text-2xl font-bold text-blue-600">{performanceMetrics.total_conversions}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-sm text-gray-600">Avg Cost/Conv</div>
            <div className="text-2xl font-bold text-gray-900">${performanceMetrics.avg_cost_per_conversion.toFixed(2)}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-sm text-gray-600">Avg CTR</div>
            <div className="text-2xl font-bold text-gray-900">{performanceMetrics.avg_ctr.toFixed(2)}%</div>
          </div>
        </div>
      )}

      {/* Platform Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {platformSummary.map((summary) => (
          <div key={summary.platform} className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold capitalize">{summary.platform}</h3>
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[summary.platform as keyof typeof COLORS] }}
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Spend</span>
                <span className="font-semibold">${summary.total_spend.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Conversions</span>
                <span className="font-semibold">{summary.total_conversions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Cost/Conv</span>
                <span className="font-semibold">${summary.avg_cost_per_conversion.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Impressions</span>
                <span className="font-semibold">{formatNumber(summary.total_impressions)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Top Performers</span>
                <span className="font-semibold text-green-600">{summary.top_performers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Wasted Spend</span>
                <span className="font-semibold text-red-600">{summary.wasted_spend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost per Conversion by Platform */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Cost per Conversion by Platform</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={platformSummary}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="platform" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, 'Cost per Conversion']} />
              <Bar dataKey="avg_cost_per_conversion" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Creative Distribution by Platform</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={platformSummary}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ platform, total_spend }) => `${platform}: $${total_spend.toFixed(0)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="total_spend"
              >
                {platformSummary.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.platform as keyof typeof COLORS]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`$${value}`, 'Total Spend']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="all">All Platforms</option>
              <option value="tiktok">TikTok</option>
              <option value="meta">Meta</option>
              <option value="google">Google</option>
            </select>
          </div>
          
          <button
            onClick={() => setShowWastedOnly(!showWastedOnly)}
            className={`flex items-center px-3 py-2 rounded-lg ${
              showWastedOnly 
                ? 'bg-red-100 text-red-700' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {showWastedOnly ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showWastedOnly ? 'Show All' : 'Wasted Only'}
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="cost_per_conversion">Cost per Conversion</option>
              <option value="spend">Spend</option>
              <option value="conversions">Conversions</option>
              <option value="creative_name">Name</option>
              <option value="created_at">Date Created</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border rounded-lg hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Creatives Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Ad Creatives Performance ({sortedCreatives.length} creatives)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creative
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spend
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost/Conv
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CTR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCreatives.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No creatives found matching your filters
                  </td>
                </tr>
              ) : (
                sortedCreatives.map((creative) => (
                  <tr key={creative.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{creative.creative_name}</div>
                        <div className="text-sm text-gray-500">ID: {creative.id}</div>
                        {creative.campaign_name && (
                          <div className="text-xs text-gray-400">Campaign: {creative.campaign_name}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                        style={{ 
                          backgroundColor: `${COLORS[creative.platform]}20`,
                          color: COLORS[creative.platform]
                        }}
                      >
                        {creative.platform}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${creative.spend.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {creative.conversions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className="text-sm font-medium"
                        style={{ color: getPerformanceColor(creative) }}
                      >
                        ${creative.cost_per_conversion.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {creative.ctr.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(creative.status)}
                        <span className="ml-2 text-sm text-gray-900 capitalize">{creative.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {creative.conversions === 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          No Conversions
                        </span>
                      ) : creative.cost_per_conversion < 25 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Excellent
                        </span>
                      ) : creative.cost_per_conversion < 50 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Good
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Poor
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdCreativePerformance; 