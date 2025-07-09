import React, { useState, useEffect } from 'react';
import {
  BarChart2, TrendingUp, Users, Mail, Send, Brain, Calendar, Download, Filter, ArrowUpRight, 
  Sparkles, MessageCircle, Clock, Target, Zap, BarChart as ChartBar, Shield, LineChart, 
  Layers, Type, Video, Wand2, History, Clapperboard, Film, Camera, Plus,
  Database, Search, Activity, UserCheck
} from 'lucide-react';
import VideoGenerator from '../components/scanner/VideoGenerator';
import Veo3PromptForm from '../components/scanner/Veo3PromptForm';
import Veo3Integration from '../components/scanner/Veo3Integration';
import UGCSplitTester from '../components/scanner/UGCSplitTester';

const MarketingDashboard = () => {
  const [dateRange, setDateRange] = useState('7d');
  const [platform, setPlatform] = useState('all');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMarketingData();
  }, [dateRange]);

  const loadMarketingData = async () => {
    setLoading(true);
    try {
      const data = await fetchMarketingMetrics(dateRange);
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load marketing data:', error);
    }
    setLoading(false);
  };

  const marketingIntelFeatures = [
    {
      id: 'metrics',
      title: 'Marketing Metrics',
      icon: <Database className="h-6 w-6 text-indigo-500" />,
      description: 'Unified multichannel analytics',
      metrics: {
        value: metrics?.impressions?.toLocaleString() || '0',
        label: 'Total Impressions'
      }
    },
    {
      id: 'competitors',
      title: 'Competitor Analysis',
      icon: <Search className="h-6 w-6 text-emerald-500" />,
      description: 'Track competitor performance',
      metrics: {
        value: metrics?.roas?.toFixed(2) + 'x' || '0x',
        label: 'Avg ROAS'
      }
    },
    {
      id: 'segments',
      title: 'Customer Segments',
      icon: <UserCheck className="h-6 w-6 text-purple-500" />,
      description: 'AI-powered customer clustering',
      metrics: {
        value: metrics?.conversions?.toLocaleString() || '0',
        label: 'Conversions'
      }
    },
    {
      id: 'realtime',
      title: 'Real-time Analytics',
      icon: <Activity className="h-6 w-6 text-blue-500" />,
      description: 'Live performance tracking',
      metrics: {
        value: '$' + (metrics?.revenue?.toLocaleString() || '0'),
        label: 'Revenue'
      }
    }
  ];

  const ugcFeatures = [
    {
      id: 'templates',
      title: 'UGC Templates',
      icon: <Film className="h-6 w-6 text-indigo-500" />,
      description: 'AI-powered UGC templates and scripts',
      metrics: {
        value: '24',
        label: 'Active Templates'
      }
    },
    {
      id: 'voiceover',
      title: 'AI Voiceovers',
      icon: <MessageCircle className="h-6 w-6 text-emerald-500" />,
      description: 'Generate realistic male & female voices',
      metrics: {
        value: '450+',
        label: 'Voiceovers Created'
      }
    },
    {
      id: 'editor',
      title: 'UGC Editor',
      icon: <Camera className="h-6 w-6 text-purple-500" />,
      description: 'Edit and enhance UGC content',
      metrics: {
        value: '89%',
        label: 'Engagement Rate'
      }
    },
    {
      id: 'analytics',
      title: 'UGC Analytics',
      icon: <BarChart2 className="h-6 w-6 text-blue-500" />,
      description: 'Track performance and insights',
      metrics: {
        value: '3.2x',
        label: 'ROAS'
      }
    }
  ];

  const veo3Features = [
    {
      id: 'video-generator',
      title: 'Video Generator',
      icon: <Video className="h-6 w-6 text-indigo-500" />,
      description: 'Create AI-powered videos',
      path: '/marketing/veo3/generator'
    },
    {
      id: 'prompt-generator',
      title: 'Prompt Generator',
      icon: <Wand2 className="h-6 w-6 text-emerald-500" />,
      description: 'Generate optimized video prompts',
      path: '/marketing/veo3/prompts'
    },
    {
      id: 'video-history',
      title: 'Video History',
      icon: <History className="h-6 w-6 text-purple-500" />,
      description: 'View and manage generated videos',
      path: '/marketing/veo3/history'
    },
    {
      id: 'templates',
      title: 'Templates',
      icon: <Clapperboard className="h-6 w-6 text-amber-500" />,
      description: 'Access video templates',
      path: '/marketing/veo3/templates'
    }
  ];

  const aiFeatures = [
    {
      id: 'personalization',
      title: 'Hyper-Personalization',
      icon: <Target className="h-6 w-6 text-indigo-500" />,
      description: 'AI-driven dynamic content & product recommendations',
      metrics: {
        value: '+42%',
        label: 'Engagement Lift'
      }
    },
    {
      id: 'subject-lines',
      title: 'Subject Line Optimization',
      icon: <Type className="h-6 w-6 text-green-500" />,
      description: 'Auto-generated A/B variants with predictive scoring',
      metrics: {
        value: '+28%',
        label: 'Open Rate Lift'
      }
    },
    {
      id: 'send-time',
      title: 'Smart Send-Time',
      icon: <Clock className="h-6 w-6 text-blue-500" />,
      description: 'AI-optimized delivery timing per recipient',
      metrics: {
        value: '+35%',
        label: 'Click Rate Lift'
      }
    },
    {
      id: 'conversation',
      title: 'Two-Way SMS',
      icon: <MessageCircle className="h-6 w-6 text-purple-500" />,
      description: 'AI chatbot with smart response handling',
      metrics: {
        value: '92%',
        label: 'Response Rate'
      }
    },
    {
      id: 'offers',
      title: 'Dynamic Offers',
      icon: <Zap className="h-6 w-6 text-amber-500" />,
      description: 'Personalized discounts & urgency messaging',
      metrics: {
        value: '+45%',
        label: 'Conversion Lift'
      }
    },
    {
      id: 'predictive',
      title: 'Predictive Analytics',
      icon: <ChartBar className="h-6 w-6 text-rose-500" />,
      description: 'Churn prediction & revenue forecasting',
      metrics: {
        value: '94%',
        label: 'Accuracy'
      }
    },
    {
      id: 'deliverability',
      title: 'Smart Deliverability',
      icon: <Shield className="h-6 w-6 text-teal-500" />,
      description: 'Spam detection & compliance monitoring',
      metrics: {
        value: '99.8%',
        label: 'Inbox Rate'
      }
    },
    {
      id: 'benchmarks',
      title: 'Industry Benchmarks',
      icon: <LineChart className="h-6 w-6 text-cyan-500" />,
      description: 'Real-time performance comparisons',
      metrics: {
        value: 'Top 5%',
        label: 'Industry Rank'
      }
    },
    {
      id: 'multichannel',
      title: 'Multi-Channel AI',
      icon: <Layers className="h-6 w-6 text-orange-500" />,
      description: 'Cross-channel campaign orchestration',
      metrics: {
        value: '+52%',
        label: 'Engagement'
      }
    }
  ];

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Marketing Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            AI-powered marketing automation & optimization
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="form-select pl-9"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="12m">Last 12 months</option>
            </select>
            <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <div className="relative">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="form-select pl-9"
            >
              <option value="all">All Channels</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
            <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <button className="btn-secondary">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Marketing Intelligence Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <Brain className="h-5 w-5 mr-2 text-indigo-500" />
            Marketing Intelligence
          </h2>
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Create Report
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {marketingIntelFeatures.map((feature) => (
            <Card key={feature.id} className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  {feature.icon}
                  <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
                <div className="mt-4 pt-4 border-t dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {feature.metrics.label}
                    </span>
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {feature.metrics.value}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* UGC Features Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <Film className="h-5 w-5 mr-2 text-indigo-500" />
            UGC Ads
          </h2>
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Create UGC Ad
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ugcFeatures.map((feature) => (
            <Card key={feature.id} className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  {feature.icon}
                  <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
                <div className="mt-4 pt-4 border-t dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {feature.metrics.label}
                    </span>
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {feature.metrics.value}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* UGC Split Tester */}
      <div className="mb-8">
        <UGCSplitTester />
      </div>

      {/* Veo3 Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <Video className="h-5 w-5 mr-2 text-indigo-500" />
            Veo3 AI Video
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {veo3Features.map((feature) => (
            <Card key={feature.id} className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  {feature.icon}
                  <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
                <div className="mt-4 pt-4 border-t dark:border-gray-700">
                  <a href={feature.path} className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center">
                    Access Feature
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Messages Sent</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{metrics?.totalSent || '0'}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Send className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowUpRight className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-500">{metrics?.growth || '0%'}</span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">vs last period</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Rate</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{metrics?.openRate || '0%'}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowUpRight className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-500">+2.4%</span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">vs last period</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenue</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{metrics?.revenue || '$0'}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowUpRight className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-500">+18.2%</span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">vs last period</span>
          </div>
        </div>
      </div>

      {/* AI Marketing Features */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <Brain className="h-5 w-5 mr-2 text-indigo-500" />
            AI Marketing Suite
          </h2>
          <button className="btn-primary">
            <Sparkles className="h-4 w-4 mr-2" />
            New Campaign
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aiFeatures.map((feature) => (
            <div 
              key={feature.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center mb-4">
                {feature.icon}
                <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {feature.description}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {feature.metrics.label}
                </span>
                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                  {feature.metrics.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Campaign Performance</h2>
            <div className="h-80">
              {/* Add chart component here */}
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                Chart placeholder
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Audience Growth</h2>
            <div className="h-80">
              {/* Add chart component here */}
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                Chart placeholder
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingDashboard;