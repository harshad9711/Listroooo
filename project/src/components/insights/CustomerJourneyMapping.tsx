import { useState } from 'react';
import { Card, Title } from '@tremor/react';
import { 
  MapPin, 
  ArrowRight, 
  Star, 
  Filter,
  Download,
  Search,
  Eye,
  MousePointer,
  CreditCard,
  RefreshCw
} from 'lucide-react';

interface JourneyStage {
  id: string;
  name: string;
  description: string;
  touchpoints: string[];
  conversionRate: number;
  avgTimeSpent: string;
  dropoffRate: number;
}

interface CustomerSegment {
  id: string;
  name: string;
  size: number;
  conversionRate: number;
  avgOrderValue: number;
  ltv: number;
  characteristics: string[];
}

interface JourneyPath {
  id: string;
  customer: string;
  segment: string;
  stages: {
    stage: string;
    timestamp: string;
    touchpoint: string;
    action: string;
  }[];
  outcome: 'converted' | 'abandoned' | 'ongoing';
  value?: number;
}

const mockJourneyStages: JourneyStage[] = [
  {
    id: 'awareness',
    name: 'Awareness',
    description: 'Customer becomes aware of our brand',
    touchpoints: ['Social Media', 'Search Ads', 'Influencer Content', 'Word of Mouth'],
    conversionRate: 15.2,
    avgTimeSpent: '2.3 days',
    dropoffRate: 84.8
  },
  {
    id: 'consideration',
    name: 'Consideration',
    description: 'Customer evaluates our products',
    touchpoints: ['Website', 'Product Pages', 'Reviews', 'Comparison Sites'],
    conversionRate: 32.1,
    avgTimeSpent: '4.7 days',
    dropoffRate: 67.9
  },
  {
    id: 'intent',
    name: 'Purchase Intent',
    description: 'Customer shows buying signals',
    touchpoints: ['Cart Addition', 'Wishlist', 'Email Signup', 'Price Alerts'],
    conversionRate: 68.4,
    avgTimeSpent: '1.2 days',
    dropoffRate: 31.6
  },
  {
    id: 'purchase',
    name: 'Purchase',
    description: 'Customer completes transaction',
    touchpoints: ['Checkout', 'Payment', 'Order Confirmation'],
    conversionRate: 89.3,
    avgTimeSpent: '15 minutes',
    dropoffRate: 10.7
  },
  {
    id: 'retention',
    name: 'Retention',
    description: 'Customer becomes repeat buyer',
    touchpoints: ['Email Marketing', 'Loyalty Program', 'Customer Support'],
    conversionRate: 42.6,
    avgTimeSpent: '30 days',
    dropoffRate: 57.4
  }
];

const mockCustomerSegments: CustomerSegment[] = [
  {
    id: '1',
    name: 'Tech Enthusiasts',
    size: 2847,
    conversionRate: 8.4,
    avgOrderValue: 156.78,
    ltv: 892.45,
    characteristics: ['Early adopters', 'High engagement', 'Price insensitive', 'Social sharers']
  },
  {
    id: '2',
    name: 'Budget Conscious',
    size: 4521,
    conversionRate: 12.1,
    avgOrderValue: 67.23,
    ltv: 234.67,
    characteristics: ['Price sensitive', 'Deal seekers', 'Comparison shoppers', 'Loyal when satisfied']
  },
  {
    id: '3',
    name: 'Premium Buyers',
    size: 1893,
    conversionRate: 15.7,
    avgOrderValue: 289.45,
    ltv: 1456.78,
    characteristics: ['Quality focused', 'Brand loyal', 'High LTV', 'Referral generators']
  },
  {
    id: '4',
    name: 'Casual Shoppers',
    size: 6234,
    conversionRate: 5.2,
    avgOrderValue: 89.12,
    ltv: 178.34,
    characteristics: ['Occasional buyers', 'Impulse purchases', 'Social influenced', 'Mobile first']
  }
];

const mockJourneyPaths: JourneyPath[] = [
  {
    id: '1',
    customer: 'John Doe',
    segment: 'Tech Enthusiasts',
    stages: [
      { stage: 'awareness', timestamp: '2025-06-01T10:00:00Z', touchpoint: 'Instagram Ad', action: 'Clicked ad' },
      { stage: 'consideration', timestamp: '2025-06-01T10:15:00Z', touchpoint: 'Product Page', action: 'Viewed product' },
      { stage: 'consideration', timestamp: '2025-06-02T14:30:00Z', touchpoint: 'Reviews', action: 'Read reviews' },
      { stage: 'intent', timestamp: '2025-06-03T09:45:00Z', touchpoint: 'Cart', action: 'Added to cart' },
      { stage: 'purchase', timestamp: '2025-06-03T10:00:00Z', touchpoint: 'Checkout', action: 'Completed purchase' }
    ],
    outcome: 'converted',
    value: 149.99
  },
  {
    id: '2',
    customer: 'Jane Smith',
    segment: 'Budget Conscious',
    stages: [
      { stage: 'awareness', timestamp: '2025-06-04T16:20:00Z', touchpoint: 'Google Search', action: 'Searched product' },
      { stage: 'consideration', timestamp: '2025-06-04T16:25:00Z', touchpoint: 'Product Page', action: 'Viewed product' },
      { stage: 'consideration', timestamp: '2025-06-05T11:10:00Z', touchpoint: 'Comparison Site', action: 'Compared prices' },
      { stage: 'intent', timestamp: '2025-06-05T11:30:00Z', touchpoint: 'Wishlist', action: 'Added to wishlist' }
    ],
    outcome: 'ongoing'
  }
];

export default function CustomerJourneyMapping() {
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRefreshData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  const getStageIcon = (stageId: string) => {
    switch (stageId) {
      case 'awareness':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'consideration':
        return <Search className="h-4 w-4 text-purple-500" />;
      case 'intent':
        return <MousePointer className="h-4 w-4 text-orange-500" />;
      case 'purchase':
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case 'retention':
        return <Star className="h-4 w-4 text-yellow-500" />;
      default:
        return <MapPin className="h-4 w-4 text-gray-500" />;
    }
  };

  const getOutcomeBadge = (outcome: string) => {
    const colors = {
      converted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      abandoned: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      ongoing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[outcome as keyof typeof colors]}`}>
        {outcome.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Customer Journey Mapping</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Visualize and analyze customer touchpoints across all channels
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
          <button className="btn-secondary">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {showFilters && (
        <Card className="bg-white dark:bg-gray-800">
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Customer Segment
                </label>
                <select
                  value={selectedSegment}
                  onChange={(e) => setSelectedSegment(e.target.value)}
                  className="form-select"
                >
                  <option value="all">All Segments</option>
                  {mockCustomerSegments.map(segment => (
                    <option key={segment.id} value={segment.id}>
                      {segment.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Journey Stage
                </label>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="form-select"
                >
                  <option value="all">All Stages</option>
                  {mockJourneyStages.map(stage => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
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

      {/* Journey Overview */}
      <Card className="bg-white dark:bg-gray-800">
        <div className="p-6">
          <Title className="mb-6">Customer Journey Stages</Title>
          
          <div className="space-y-6">
            {mockJourneyStages.map((stage, index) => (
              <div key={stage.id} className="relative">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                      {getStageIcon(stage.id)}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {stage.name}
                      </h3>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Conversion: {stage.conversionRate}%
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Avg Time: {stage.avgTimeSpent}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {stage.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {stage.touchpoints.map((touchpoint, touchpointIndex) => (
                        <span
                          key={touchpointIndex}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        >
                          {touchpoint}
                        </span>
                      ))}
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full"
                        style={{ width: `${stage.conversionRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {index < mockJourneyStages.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-6 bg-gray-300 dark:bg-gray-600"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Customer Segments */}
      <Card className="bg-white dark:bg-gray-800">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Title>Customer Segments</Title>
            <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 text-sm font-medium">
              Manage Segments
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockCustomerSegments.map((segment) => (
              <div
                key={segment.id}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {segment.name}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {segment.size.toLocaleString()} customers
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Conversion Rate</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {segment.conversionRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Avg Order Value</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      ${segment.avgOrderValue}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">LTV</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      ${segment.ltv}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Characteristics</p>
                  <div className="flex flex-wrap gap-1">
                    {segment.characteristics.map((characteristic, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                      >
                        {characteristic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Individual Journey Paths */}
      <Card className="bg-white dark:bg-gray-800">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Title>Recent Customer Journeys</Title>
            <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 text-sm font-medium">
              View All
            </button>
          </div>

          <div className="space-y-6">
            {mockJourneyPaths.map((journey) => (
              <div
                key={journey.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {journey.customer.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {journey.customer}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {journey.segment}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getOutcomeBadge(journey.outcome)}
                    {journey.value && (
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        ${journey.value}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                  {journey.stages.map((stage, index) => (
                    <React.Fragment key={index}>
                      <div className="flex-shrink-0 text-center">
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-1">
                          {getStageIcon(stage.stage)}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 max-w-16 truncate">
                          {stage.touchpoint}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(stage.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      {index < journey.stages.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}