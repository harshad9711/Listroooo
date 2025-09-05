import { useState } from "react";
import { Card, Title, Text } from '@tremor/react';
import { 
  Filter, 
  Download, 
  Settings, 
  BarChart2, 
  ArrowUpRight, 
  Sparkles, 
  AlertCircle, 
  RefreshCw, 
  ImageIcon, 
  Video, 
  Play, 
  Pause 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AdCreative {
  id: string;
  type: 'image' | 'video';
  url: string;
  platform: string;
  status: 'active' | 'paused' | 'refreshing';
  performance: {
    impressions: number;
    clicks: number;
    ctr: number;
    spend: number;
    conversions: number;
  };
  lastRefreshed: string;
  refreshCount: number;
}

const mockCreatives: AdCreative[] = [
  {
    id: '1',
    type: 'image',
    url: 'https://images.pexels.com/photos/7915357/pexels-photo-7915357.jpeg',
    platform: 'Meta',
    status: 'active',
    performance: {
      impressions: 15000,
      clicks: 450,
      ctr: 3.0,
      spend: 500,
      conversions: 25
    },
    lastRefreshed: '2025-05-01T10:00:00Z',
    refreshCount: 2
  },
  {
    id: '2',
    type: 'video',
    url: 'https://example.com/video1.mp4',
    platform: 'TikTok',
    status: 'active',
    performance: {
      impressions: 25000,
      clicks: 875,
      ctr: 3.5,
      spend: 750,
      conversions: 40
    },
    lastRefreshed: '2025-05-02T15:30:00Z',
    refreshCount: 1
  }
];

export default function AdCreativeRefresher() {
  const [selectedPlatform, setPlatform] = useState('all');
  const [selectedType, setType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const filteredCreatives = mockCreatives.filter(creative => {
    const platformMatch = selectedPlatform === 'all' || creative.platform.toLowerCase() === selectedPlatform.toLowerCase();
    const typeMatch = selectedType === 'all' || creative.type === selectedType;
    return platformMatch && typeMatch;
  });

  const metrics = {
    totalImpressions: filteredCreatives.reduce((sum, c) => sum + c.performance.impressions, 0),
    averageCTR: filteredCreatives.reduce((sum, c) => sum + c.performance.ctr, 0) / filteredCreatives.length,
    totalSpend: filteredCreatives.reduce((sum, c) => sum + c.performance.spend, 0),
    totalConversions: filteredCreatives.reduce((sum, c) => sum + c.performance.conversions, 0)
  };

  const refreshCreative = async (creativeId: string) => {
    setRefreshing(creativeId);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Creative refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh creative:', error);
      toast.error('Failed to refresh creative');
    } finally {
      setRefreshing(null);
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Title>Ad Creative Refresher</Title>
            <Text className="text-gray-500 dark:text-gray-400">
              Automatically refresh and optimize your ad creatives
            </Text>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
            <button className="btn-secondary">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button className="btn-secondary">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart2 className="h-5 w-5 text-indigo-500 mr-2" />
                <Text>Total Impressions</Text>
              </div>
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-semibold mt-2">
              {metrics.totalImpressions.toLocaleString()}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Sparkles className="h-5 w-5 text-green-500 mr-2" />
                <Text>Average CTR</Text>
              </div>
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-semibold mt-2">
              {metrics.averageCTR.toFixed(2)}%
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
                <Text>Total Spend</Text>
              </div>
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-semibold mt-2">
              ${metrics.totalSpend.toLocaleString()}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <RefreshCw className="h-5 w-5 text-purple-500 mr-2" />
                <Text>Total Conversions</Text>
              </div>
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-semibold mt-2">
              {metrics.totalConversions}
            </p>
          </div>
        </div>

        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Platform
                </label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="form-select"
                >
                  <option value="all">All Platforms</option>
                  <option value="meta">Meta</option>
                  <option value="tiktok">TikTok</option>
                  <option value="google">Google</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setType(e.target.value as 'all' | 'image' | 'video')}
                  className="form-select"
                >
                  <option value="all">All Types</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select className="form-select">
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Paused</option>
                  <option>Refreshing</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {filteredCreatives.map((creative) => (
            <div
              key={creative.id}
              className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {creative.type === 'image' ? (
                    <ImageIcon className="h-5 w-5 text-blue-500" />
                  ) : (
                    <Video className="h-5 w-5 text-purple-500" />
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Creative #{creative.id}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {creative.platform}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {creative.status === 'active' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <Play className="h-3 w-3 mr-1" />
                      Active
                    </span>
                  ) : creative.status === 'paused' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      <Pause className="h-3 w-3 mr-1" />
                      Paused
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Refreshing
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Impressions</p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                    {creative.performance.impressions.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Clicks</p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                    {creative.performance.clicks.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">CTR</p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                    {creative.performance.ctr.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Spend</p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                    ${creative.performance.spend.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Conversions</p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                    {creative.performance.conversions}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Last refreshed: {new Date(creative.lastRefreshed).toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Refresh count: {creative.refreshCount}
                    </span>
                  </div>
                  <button
                    onClick={() => refreshCreative(creative.id)}
                    disabled={refreshing === creative.id || creative.status === 'refreshing'}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {refreshing === creative.id ? (
                      <>
                        <RefreshCw className="animate-spin h-4 w-4 mr-1.5" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1.5" />
                        Refresh Creative
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredCreatives.length === 0 && (
            <div className="text-center py-12">
              <Sparkles className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No creatives found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                No ad creatives found matching your filters
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}