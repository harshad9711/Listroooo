import { useState } from 'react';

import {
  TrendingUp, 
  Users, 
  MessageSquare, 
  AlertCircle, 
  BarChart2, 
  Filter, 
  Download, 
  Eye,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Star,
  MapPin,
  Mail,
  Phone,
  Plus
} from 'lucide-react';
import SentimentAnalysis from '../components/insights/SentimentAnalysis';
import CompetitorMonitoring from '../components/insights/CompetitorMonitoring';
import CustomerJourneyMapping from '../components/insights/CustomerJourneyMapping';
import ChurnPrevention from '../components/insights/ChurnPrevention';
// import MarketPulseDashboard from '../components/insights/MarketPulseDashboard'; // This import is commented out as it's not a module

interface InsightMetric {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
}

const insightMetrics: InsightMetric[] = [
  {
    label: 'Brand Sentiment',
    value: '78%',
    change: '+5.2%',
    isPositive: true,
    icon: <Heart className="h-6 w-6 text-pink-500" />
  },
  {
    label: 'Competitor Mentions',
    value: '1,247',
    change: '+12%',
    isPositive: false,
    icon: <Eye className="h-6 w-6 text-blue-500" />
  },
  {
    label: 'Customer Segments',
    value: '8',
    change: '+2',
    isPositive: true,
    icon: <Users className="h-6 w-6 text-purple-500" />
  },
  {
    label: 'Churn Risk',
    value: '12%',
    change: '-3.1%',
    isPositive: true,
    icon: <AlertCircle className="h-6 w-6 text-orange-500" />
  }
];

export default function CustomerInsights() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('7d');

  const tabs = [
    { id: 'overview', name: 'Overview', icon: <BarChart2 className="h-4 w-4" /> },
    { id: 'sentiment', name: 'Sentiment Analysis', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'competitors', name: 'Competitor Monitoring', icon: <Eye className="h-4 w-4" /> },
    { id: 'journey', name: 'Customer Journey', icon: <MapPin className="h-4 w-4" /> },
    { id: 'churn', name: 'Churn Prevention', icon: <AlertCircle className="h-4 w-4" /> },
    { id: 'pulse', name: 'Market Pulse', icon: <TrendingUp className="h-4 w-4" /> }
  ];

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Customer & Market Research</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            AI-enhanced sentiment analysis and competitive intelligence
          </p>
        </div>
        <div className="flex space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="form-select"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button className="btn-secondary">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
          <button className="btn-secondary">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {insightMetrics.map((metric, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.label}</p>
                    <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{metric.value}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    {metric.icon}
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span className={`text-sm font-medium ${
                    metric.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {metric.change}
                  </span>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">vs last period</span>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Sentiment Trends</h3>
                  <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 text-sm font-medium">
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <ThumbsUp className="h-5 w-5 text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Product Quality Praise</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">+23% mentions in last 7 days</p>
                    </div>
                    <span className="text-sm text-green-600 dark:text-green-400">+23%</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <ThumbsDown className="h-5 w-5 text-red-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Shipping Delays</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Trending topic in Europe</p>
                    </div>
                    <span className="text-sm text-red-600 dark:text-red-400">-8%</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Customer Service</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Improved ratings</p>
                    </div>
                    <span className="text-sm text-green-600 dark:text-green-400">+15%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Competitor Activity</h3>
                  <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 text-sm font-medium">
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">A</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Competitor A</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">New product launch detected</p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">2h ago</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">B</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Competitor B</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Price reduction on similar products</p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">5h ago</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-purple-600 dark:text-purple-400">C</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Competitor C</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">New ad campaign started</p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">1d ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* High-Risk Customers */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">High-Risk Customers</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Customers with high churn probability requiring immediate attention
                  </p>
                </div>
                <button className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Churn Risk
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        LTV
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Last Activity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">JD</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">John Doe</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">john@example.com</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                          High (85%)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        $1,250
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        15 days ago
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                            <Mail className="h-4 w-4" />
                          </button>
                          <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                            <Phone className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">JS</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">Jane Smith</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">jane@example.com</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                          Medium (65%)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        $890
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        8 days ago
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                            <Mail className="h-4 w-4" />
                          </button>
                          <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                            <Phone className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sentiment' && <SentimentAnalysis />}
      {activeTab === 'competitors' && <CompetitorMonitoring />}
      {activeTab === 'journey' && <CustomerJourneyMapping />}
      {activeTab === 'churn' && <ChurnPrevention />}
      {activeTab === 'pulse' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Market Pulse Dashboard</h3>
          <p className="text-gray-500 dark:text-gray-400">
            This section is currently under development.
          </p>
        </div>
      )}
    </div>
  );
}