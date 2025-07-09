import React from "react";


import {
  Instagram, 
  Facebook, 
  Twitter, 
  Youtube, 
  Music, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Star,
  RefreshCw,
  Plus,
  Eye,
  BarChart3,
  TrendingUp,
  Settings,
  Target,
  Heart,
  MessageCircle,
  Globe
} from 'lucide-react';

interface UGCDashboardProps {
  className?: string;
}

const UGCDashboard: React.FC<UGCDashboardProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'campaigns' | 'analytics' | 'settings'>('overview');
  const [content, setContent] = useState<UGCContent[]>([]);
  const [campaigns, setCampaigns] = useState<UGCCampaign[]>([]);
  const [analytics, setAnalytics] = useState<UGCAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [tiktokConnected, setTiktokConnected] = useState(false);

  useEffect(() => {
    loadData();
    checkInstagramConnection();
    checkTikTokConnection();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [contentData, campaignsData, analyticsData] = await Promise.all([
        ugcService.getUGCContent(),
        ugcService.getUGCCampaigns(),
        ugcService.getUGCAnalytics()
      ]);
      
      setContent(contentData);
      setCampaigns(campaignsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading UGC data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkInstagramConnection = async () => {
    try {
      const connected = await ugcService.testInstagramConnection();
      setInstagramConnected(connected);
    } catch (error) {
      console.error('Error checking Instagram connection:', error);
      setInstagramConnected(false);
    }
  };

  const checkTikTokConnection = async () => {
    try {
      const connected = await ugcService.testTikTokConnection();
      setTiktokConnected(connected);
    } catch (error) {
      console.error('Error checking TikTok connection:', error);
      setTiktokConnected(false);
    }
  };

  const handleImportFromInstagram = async () => {
    setLoading(true);
    try {
      const importedContent = await ugcService.importFromInstagram(25, [], 'pending');
      setContent(prev => [...importedContent, ...prev]);
    } catch (error) {
      console.error('Error importing from Instagram:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportFromTikTok = async () => {
    setLoading(true);
    try {
      const importedContent = await ugcService.importFromTikTok(25, [], 'pending');
      setContent(prev => [...importedContent, ...prev]);
    } catch (error) {
      console.error('Error importing from TikTok:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'youtube': return <Youtube className="h-4 w-4" />;
      case 'tiktok': return <Music className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'featured': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">UGC Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage and curate user-generated content</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleImportFromInstagram}
              disabled={!instagramConnected || loading}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
            >
              <Instagram className="h-4 w-4 mr-2" />
              Import from Instagram
            </button>
            <button
              onClick={handleImportFromTikTok}
              disabled={!tiktokConnected || loading}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600 disabled:opacity-50"
            >
              <Music className="h-4 w-4 mr-2" />
              Import from TikTok
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'content', label: 'Content', icon: Eye },
            { id: 'campaigns', label: 'Campaigns', icon: Target },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Content</p>
                    <p className="text-3xl font-bold">{analytics?.total_content || 0}</p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Approved</p>
                    <p className="text-3xl font-bold">{analytics?.approved_content || 0}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Total Engagement</p>
                    <p className="text-3xl font-bold">{analytics?.total_engagement?.toLocaleString() || 0}</p>
                  </div>
                  <Heart className="h-8 w-8 text-purple-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Avg Engagement</p>
                    <p className="text-3xl font-bold">{analytics?.average_engagement_rate?.toFixed(1) || 0}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-200" />
                </div>
              </div>
            </div>

            {/* Instagram Connection Status */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Instagram className={`h-6 w-6 ${instagramConnected ? 'text-green-500' : 'text-gray-400'}`} />
                  <div>
                    <h3 className="font-medium text-gray-900">Instagram Integration</h3>
                    <p className="text-sm text-gray-600">
                      {instagramConnected ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                {!instagramConnected && (
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>

            {/* TikTok Connection Status */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Music className={`h-6 w-6 ${tiktokConnected ? 'text-green-500' : 'text-gray-400'}`} />
                  <div>
                    <h3 className="font-medium text-gray-900">TikTok Integration</h3>
                    <p className="text-sm text-gray-600">
                      {tiktokConnected ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                {!tiktokConnected && (
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>

            {/* Recent Content */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Content</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {content.slice(0, 6).map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getPlatformIcon(item.platform)}
                        <span className="text-sm font-medium text-gray-900">{item.username}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    
                    {item.thumbnail_url && (
                      <img 
                        src={item.thumbnail_url} 
                        alt="Content thumbnail"
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}
                    
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {item.caption || 'No caption'}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          <Heart className="h-3 w-3 mr-1" />
                          {item.engagement_metrics.likes}
                        </span>
                        <span className="flex items-center">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {item.engagement_metrics.comments}
                        </span>
                      </div>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">All Content</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  {item.thumbnail_url && (
                    <div className="relative">
                      <img 
                        src={item.thumbnail_url} 
                        alt="Content thumbnail"
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        {getPlatformIcon(item.platform)}
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">{item.username}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                      {item.caption || 'No caption'}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          <Heart className="h-3 w-3 mr-1" />
                          {item.engagement_metrics.likes}
                        </span>
                        <span className="flex items-center">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {item.engagement_metrics.comments}
                        </span>
                      </div>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">UGC Campaigns</h3>
              <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      campaign.status === 'active' ? 'text-green-600 bg-green-100' :
                      campaign.status === 'paused' ? 'text-yellow-600 bg-yellow-100' :
                      'text-gray-600 bg-gray-100'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">{campaign.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Posts</span>
                      <span className="font-medium">{campaign.actual_metrics.total_posts} / {campaign.target_metrics.total_posts}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Engagement</span>
                      <span className="font-medium">{campaign.actual_metrics.total_engagement.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {campaign.hashtags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">UGC Analytics</h3>
            
            {/* Platform Distribution */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">Content by Platform</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {analytics.top_platforms.map((platform) => (
                  <div key={platform.platform} className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{platform.count}</div>
                    <div className="text-sm text-gray-600 capitalize">{platform.platform}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Top Hashtags */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">Top Hashtags</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {analytics.top_hashtags.map((hashtag) => (
                  <div key={hashtag.hashtag} className="text-center">
                    <div className="text-lg font-bold text-gray-900">{hashtag.count}</div>
                    <div className="text-sm text-gray-600">{hashtag.hashtag}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Status Distribution */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">Content by Status</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {analytics.content_by_status.map((status) => (
                  <div key={status.status} className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{status.count}</div>
                    <div className="text-sm text-gray-600 capitalize">{status.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">UGC Settings</h3>
            
            {/* Instagram Integration */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">Instagram Integration</h4>
              <p className="text-sm text-gray-600 mb-4">
                Connect your Instagram Business account to automatically import UGC content.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Access Token
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter Instagram access token"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Account ID
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter Instagram business account ID"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facebook Page ID
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter Facebook page ID"
                  />
                </div>
                
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  Connect Instagram
                </button>
              </div>
            </div>

            {/* TikTok Integration */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">TikTok Integration</h4>
              <p className="text-sm text-gray-600 mb-4">
                Connect your TikTok Business account to automatically import UGC content.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Key
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter TikTok client key"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Secret
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter TikTok client secret"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Access Token
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter TikTok access token"
                  />
                </div>
                
                <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600">
                  Connect TikTok
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UGCDashboard;
