import React from "react";


import toast from 'react-hot-toast';

interface AdSpyDashboardProps {
  platform?: string;
  category?: string;
}

export default function AdSpyDashboard({ platform = 'all', category = 'all' }: AdSpyDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [ads, setAds] = useState<any[]>([]);
  const [recreatedAds, setRecreatedAds] = useState<any[]>([]);
  const [brandTone, setBrandTone] = useState('professional');
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAds();
  }, [platform, category]);

  const fetchAds = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedAds = await fetchWinningAds(platform, category);
      setAds(fetchedAds);
      
      try {
        const recreated = await generateCreatives(fetchedAds, brandTone);
        if (recreated.length > 0) {
          setRecreatedAds(recreated);
          toast.success('Ads fetched and recreated successfully');
        } else {
          toast.warning('Ads fetched but recreation was partially successful');
        }
      } catch (error: any) {
        console.error('Ad recreation error:', error);
        if (error.message.includes('rate limit')) {
          setError('OpenAI API rate limit reached. Please wait a moment before trying again.');
          toast.error('Rate limit reached. Waiting before retrying...');
        } else {
          setError('Failed to recreate ads. Please try again later.');
          toast.error(error.message || 'Failed to recreate ads');
        }
        // Still show original ads even if recreation fails
        setRecreatedAds([]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch ads');
      setError('Failed to fetch ads. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    try {
      const csv = exportResults(recreatedAds);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `ad-spy-results-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Results exported successfully');
    } catch (error) {
      toast.error('Failed to export results');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <Card className="bg-white dark:bg-gray-800">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Title>Ad Spy Dashboard</Title>
            <Text className="text-gray-500 dark:text-gray-400">
              Monitor and analyze competitor ads
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
            <button
              onClick={handleExport}
              className="btn-secondary"
              disabled={recreatedAds.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              onClick={fetchAds}
              disabled={loading}
              className="btn-secondary"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
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
                  value={platform}
                  className="form-select"
                >
                  <option value="all">All Platforms</option>
                  <option value="meta">Meta Ads</option>
                  <option value="tiktok">TikTok Ads</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Brand Tone
                </label>
                <select
                  value={brandTone}
                  onChange={(e) => setBrandTone(e.target.value)}
                  className="form-select"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual & Friendly</option>
                  <option value="luxury">Luxury & Premium</option>
                  <option value="playful">Fun & Playful</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sort By
                </label>
                <select className="form-select">
                  <option value="performance">Best Performing</option>
                  <option value="recent">Most Recent</option>
                  <option value="spend">Highest Spend</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center text-red-700 dark:text-red-400">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-500 mr-2" />
                <Text>Total Impressions</Text>
              </div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-semibold mt-2">
              {ads.reduce((sum, ad) => sum + ad.performance.impressions, 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart2 className="h-5 w-5 text-green-500 mr-2" />
                <Text>Average CTR</Text>
              </div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-semibold mt-2">
              {(ads.reduce((sum, ad) => sum + ad.performance.ctr, 0) / Math.max(ads.length, 1)).toFixed(1)}%
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-purple-500 mr-2" />
                <Text>Total Spend</Text>
              </div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-semibold mt-2">
              ${ads.reduce((sum, ad) => sum + ad.performance.spend, 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <RefreshCw className="h-5 w-5 text-orange-500 mr-2" />
                <Text>Recreated Ads</Text>
              </div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-semibold mt-2">
              {recreatedAds.length}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {recreatedAds.map((ad, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-700 rounded-lg shadow-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  {ad.originalAd.imageUrl ? (
                    <img
                      src={ad.originalAd.imageUrl}
                      alt={ad.originalAd.title}
                      className="h-24 w-24 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="h-24 w-24 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Original Ad
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {ad.originalAd.platform}
                      </span>
                    </div>
                    <div className="mt-2 space-y-2">
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {ad.originalAd.title}
                          </p>
                          <button
                            onClick={() => copyToClipboard(ad.originalAd.title)}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {ad.originalAd.body}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      AI-Recreated Version
                    </h3>
                    <button
                      onClick={() => copyToClipboard(`${ad.recreatedTitle}\n\n${ad.recreatedBody}`)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {ad.recreatedTitle}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {ad.recreatedBody}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Impressions</p>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                      {ad.originalAd.performance.impressions.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Clicks</p>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                      {ad.originalAd.performance.clicks.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">CTR</p>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                      {ad.originalAd.performance.ctr}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Spend</p>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                      ${ad.originalAd.performance.spend.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {recreatedAds.length === 0 && (
            <div className="text-center py-12">
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No ads found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}