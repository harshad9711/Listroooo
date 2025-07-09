import React, { useState, useEffect } from 'react';
import { Card, Title, BarChart, DonutChart, LineChart, Text, Tab, TabList, TabGroup, TabPanel, TabPanels, Badge, Button, Grid, Col, Metric, Flex } from '@tremor/react';
import { 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2, 
  TrendingUp, 
  Users, 
  Calendar,
  Filter,
  Search,
  Download,
  Plus,
  Settings,
  Play,
  Pause,
  Edit3,
  Mic,
  MapPin,
  Star
} from 'lucide-react';
import { ugcApi } from '../../services/ugcApi';
import { isUGCFeatureEnabled } from '../../lib/ugcFeatureFlags';
import type { UGCContent, UGCInboxItem } from '../../services/ugcService';

interface UGCDashboardProps {
  className?: string;
}

const UGCDashboard: React.FC<UGCDashboardProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState<any>(null);
  const [inboxItems, setInboxItems] = useState<UGCInboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    if (isUGCFeatureEnabled('ugc.dashboard')) {
      loadDashboardData();
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsData, inboxData] = await Promise.all([
        ugcApi.getAnalytics(),
        ugcApi.getInbox()
      ]);
      
      setAnalytics(analyticsData);
      setInboxItems(inboxData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInboxItems = selectedStatus === 'all' 
    ? inboxItems 
    : inboxItems.filter(item => item.status === selectedStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'blue';
      case 'reviewed': return 'yellow';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'published': return 'purple';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Plus className="h-4 w-4" />;
      case 'reviewed': return <Eye className="h-4 w-4" />;
      case 'approved': return <Star className="h-4 w-4" />;
      case 'rejected': return <X className="h-4 w-4" />;
      case 'published': return <CheckCircle className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  if (!isUGCFeatureEnabled('ugc.dashboard')) {
    return (
      <div className={`p-6 ${className}`}>
        <Card>
          <Title>UGC Dashboard</Title>
          <Text>This feature is currently disabled. Contact your administrator to enable UGC dashboard functionality.</Text>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <Card>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <Text className="ml-2">Loading UGC Dashboard...</Text>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="mb-6">
        <Title>UGC Dashboard</Title>
        <Text>Monitor and manage your User Generated Content</Text>
      </div>

      <TabGroup>
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Inbox</Tab>
          <Tab>Analytics</Tab>
          <Tab>Settings</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            {/* Overview Tab */}
            <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-6 mb-6">
              <Card>
                <Flex alignItems="start">
                  <div>
                    <Text>Total Content</Text>
                    <Metric>{analytics?.totalContent || 0}</Metric>
                  </div>
                  <Eye className="h-5 w-5 text-blue-500" />
                </Flex>
              </Card>
              <Card>
                <Flex alignItems="start">
                  <div>
                    <Text>Inbox Items</Text>
                    <Metric>{analytics?.totalInboxItems || 0}</Metric>
                  </div>
                  <MessageCircle className="h-5 w-5 text-green-500" />
                </Flex>
              </Card>
              <Card>
                <Flex alignItems="start">
                  <div>
                    <Text>Total Edits</Text>
                    <Metric>{analytics?.totalEdits || 0}</Metric>
                  </div>
                  <Edit3 className="h-5 w-5 text-purple-500" />
                </Flex>
              </Card>
              <Card>
                <Flex alignItems="start">
                  <div>
                    <Text>Voiceovers</Text>
                    <Metric>{analytics?.totalVoiceovers || 0}</Metric>
                  </div>
                  <Mic className="h-5 w-5 text-orange-500" />
                </Flex>
              </Card>
            </Grid>

            <Grid numItems={1} numItemsLg={2} className="gap-6">
              <Card>
                <Title>Content by Platform</Title>
                <DonutChart
                  data={Object.entries(analytics?.contentByPlatform || {}).map(([platform, count]) => ({
                    platform,
                    count: count as number
                  }))}
                  category="count"
                  index="platform"
                  colors={["blue", "cyan", "indigo", "violet"]}
                />
              </Card>
              <Card>
                <Title>Content by Status</Title>
                <DonutChart
                  data={Object.entries(analytics?.contentByStatus || {}).map(([status, count]) => ({
                    status,
                    count: count as number
                  }))}
                  category="count"
                  index="status"
                  colors={["green", "yellow", "red", "blue", "purple"]}
                />
              </Card>
            </Grid>
          </TabPanel>

          <TabPanel>
            {/* Inbox Tab */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <Title>UGC Inbox</Title>
                <div className="flex gap-2">
                  <Button variant="secondary" icon={Filter}>
                    Filter
                  </Button>
                  <Button variant="secondary" icon={Search}>
                    Search
                  </Button>
                  <Button variant="secondary" icon={Download}>
                    Export
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                {['all', 'new', 'reviewed', 'approved', 'rejected', 'published'].map((status) => (
                  <Button
                    key={status}
                    variant={selectedStatus === status ? 'primary' : 'secondary'}
                    size="xs"
                    onClick={() => setSelectedStatus(status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>

              <div className="space-y-4">
                {filteredInboxItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <img
                          src={item.content.content.thumbnail_url || '/placeholder-image.jpg'}
                          alt="Content thumbnail"
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge color={getStatusColor(item.status)}>
                              {getStatusIcon(item.status)}
                              {item.status}
                            </Badge>
                            <Text className="text-sm text-gray-500">
                              {item.content.platform}
                            </Text>
                          </div>
                          <Text className="font-medium">{item.content.author.username}</Text>
                          <Text className="text-sm text-gray-600">
                            {item.content.content.caption?.substring(0, 100)}...
                          </Text>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Heart className="h-4 w-4 mr-1" />
                              {item.content.engagement.likes}
                            </span>
                            <span className="flex items-center">
                              <MessageCircle className="h-4 w-4 mr-1" />
                              {item.content.engagement.comments}
                            </span>
                            <span className="flex items-center">
                              <Share2 className="h-4 w-4 mr-1" />
                              {item.content.engagement.shares}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="xs" variant="secondary" icon={Edit3}>
                          Edit
                        </Button>
                        <Button size="xs" variant="secondary" icon={Mic}>
                          Voiceover
                        </Button>
                        <Button size="xs" variant="secondary" icon={MapPin}>
                          Hotspots
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabPanel>

          <TabPanel>
            {/* Analytics Tab */}
            <Grid numItems={1} numItemsLg={2} className="gap-6">
              <Card>
                <Title>Engagement Trends</Title>
                <LineChart
                  data={[
                    { date: 'Jan', likes: 1200, comments: 300, shares: 150 },
                    { date: 'Feb', likes: 1400, comments: 350, shares: 180 },
                    { date: 'Mar', likes: 1600, comments: 400, shares: 200 },
                    { date: 'Apr', likes: 1800, comments: 450, shares: 220 },
                    { date: 'May', likes: 2000, comments: 500, shares: 250 },
                  ]}
                  index="date"
                  categories={["likes", "comments", "shares"]}
                  colors={["blue", "green", "purple"]}
                />
              </Card>
              <Card>
                <Title>Platform Performance</Title>
                <BarChart
                  data={[
                    { platform: 'Instagram', engagement: 85, reach: 12000 },
                    { platform: 'TikTok', engagement: 92, reach: 15000 },
                    { platform: 'YouTube', engagement: 78, reach: 8000 },
                    { platform: 'Twitter', engagement: 65, reach: 5000 },
                  ]}
                  index="platform"
                  categories={["engagement", "reach"]}
                  colors={["blue", "green"]}
                />
              </Card>
            </Grid>
          </TabPanel>

          <TabPanel>
            {/* Settings Tab */}
            <Card>
              <Title>UGC Settings</Title>
              <div className="space-y-4 mt-4">
                <div>
                  <Text className="font-medium">Social Listening</Text>
                  <Text className="text-sm text-gray-600">
                    Configure hashtags and keywords for content discovery
                  </Text>
                </div>
                <div>
                  <Text className="font-medium">Auto-Editing</Text>
                  <Text className="text-sm text-gray-600">
                    Set brand guidelines for automatic content editing
                  </Text>
                </div>
                <div>
                  <Text className="font-medium">Voiceover Settings</Text>
                  <Text className="text-sm text-gray-600">
                    Configure AI voiceover preferences and voice types
                  </Text>
                </div>
                <div>
                  <Text className="font-medium">Hotspot Generation</Text>
                  <Text className="text-sm text-gray-600">
                    Set up product detection and hotspot placement rules
                  </Text>
                </div>
              </div>
            </Card>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
};

export default UGCDashboard; 