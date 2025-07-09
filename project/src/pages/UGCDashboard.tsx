import React, { useState, useEffect } from 'react';
import { Card, Title, Text, Badge, Button, Grid, Col, Metric, Flex, Tab, TabList, TabGroup, TabPanel, TabPanels, Select, SelectItem, TextInput } from '@tremor/react';
import { 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2, 
  Filter,
  Search,
  Download,
  Plus,
  Edit3,
  Mic,
  MapPin,
  Star,
  X,
  CheckCircle,
  Circle,
  Clock,
  User,
  Hash,
  Play,
  Inbox,
  Video,
  Target,
  Settings,
  BarChart3,
  TrendingUp,
  Users as UsersIcon,
  Calendar
} from 'lucide-react';
import { ugcApi } from '../services/ugcApi';
import type { UGCInboxItem } from '../services/ugcService';

const UGCDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [inboxItems, setInboxItems] = useState<UGCInboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('created_at');

  // Auto-edit state
  const [editProgress, setEditProgress] = useState<Record<string, string>>({});

  // Voiceover state
  const [voiceoverScript, setVoiceoverScript] = useState('');
  const [voiceoverType, setVoiceoverType] = useState('neutral');
  const [voiceoverProgress, setVoiceoverProgress] = useState<Record<string, string>>({});

  // Hotspot state
  const [hotspotProgress, setHotspotProgress] = useState<Record<string, string>>({});

  useEffect(() => {
    loadDashboardData();
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

  const handleAutoEdit = async (contentId: string) => {
    try {
      setEditProgress(prev => ({ ...prev, [contentId]: 'processing' }));
      await ugcApi.autoEdit(contentId, {
        filter: 'vintage',
        logo_placement: {
          logo_url: '/brand-logo.png',
          position: { x: 20, y: 20 },
          size: 60,
          opacity: 0.8
        }
      });
      setEditProgress(prev => ({ ...prev, [contentId]: 'completed' }));
      alert('Auto-edit completed! Check the edits tab for results.');
    } catch (error) {
      console.error('Error starting auto-edit:', error);
      setEditProgress(prev => ({ ...prev, [contentId]: 'failed' }));
      alert('Error starting auto-edit');
    }
  };

  const handleVoiceover = async (contentId: string) => {
    try {
      setVoiceoverProgress(prev => ({ ...prev, [contentId]: 'generating' }));
      await ugcApi.generateVoiceover(contentId, voiceoverScript || undefined, voiceoverType);
      setVoiceoverProgress(prev => ({ ...prev, [contentId]: 'completed' }));
      alert('Voiceover generation completed! Check the voiceover tab for results.');
    } catch (error) {
      console.error('Error starting voiceover generation:', error);
      setVoiceoverProgress(prev => ({ ...prev, [contentId]: 'failed' }));
      alert('Error starting voiceover generation');
    }
  };

  const handleHotspots = async (contentId: string) => {
    try {
      setHotspotProgress(prev => ({ ...prev, [contentId]: 'generating' }));
      await ugcApi.generateHotspots(contentId);
      setHotspotProgress(prev => ({ ...prev, [contentId]: 'completed' }));
      alert('Hotspot generation completed! Check the hotspots tab for results.');
    } catch (error) {
      console.error('Error starting hotspot generation:', error);
      setHotspotProgress(prev => ({ ...prev, [contentId]: 'failed' }));
      alert('Error starting hotspot generation');
    }
  };

  const filteredInboxItems = inboxItems.filter(item => {
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    const matchesPlatform = selectedPlatform === 'all' || item.content.platform === selectedPlatform;
    const matchesSearch = searchTerm === '' || 
      item.content.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.brand_mentions.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesPlatform && matchesSearch;
  });

  const sortedInboxItems = [...filteredInboxItems].sort((a, b) => {
    switch (sortBy) {
      case 'created_at':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'engagement':
        return (b.content.engagement_metrics.likes + b.content.engagement_metrics.comments + (b.content.engagement_metrics.shares || 0)) -
               (a.content.engagement_metrics.likes + a.content.engagement_metrics.comments + (a.content.engagement_metrics.shares || 0));
      case 'quality':
        return (b.content.quality_score || 0) - (a.content.quality_score || 0);
      case 'sentiment':
        return (b.content.sentiment_score || 0) - (a.content.sentiment_score || 0);
      default:
        return 0;
    }
  });

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

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Hash className="h-4 w-4" />;
      case 'tiktok': return <Play className="h-4 w-4" />;
      case 'youtube': return <Play className="h-4 w-4" />;
      case 'twitter': return <MessageCircle className="h-4 w-4" />;
      case 'facebook': return <User className="h-4 w-4" />;
      default: return <Hash className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
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
    <div className="p-6">
      <div className="mb-6">
        <Title>UGC Dashboard</Title>
        <Text>Monitor and manage your User Generated Content</Text>
      </div>

      <TabGroup>
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Inbox</Tab>
          <Tab>Auto-Edit</Tab>
          <Tab>Voiceover</Tab>
          <Tab>Hotspots</Tab>
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
                  <Inbox className="h-5 w-5 text-green-500" />
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
                <div className="mt-4">
                  {Object.entries(analytics?.contentByPlatform || {}).map(([platform, count]) => (
                    <div key={platform} className="flex justify-between items-center py-2">
                      <div className="flex items-center space-x-2">
                        {getPlatformIcon(platform)}
                        <Text className="capitalize">{platform}</Text>
                      </div>
                      <Badge>{count as number}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <Title>Content by Status</Title>
                <div className="mt-4">
                  {Object.entries(analytics?.contentByStatus || {}).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center py-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(status)}
                        <Text className="capitalize">{status}</Text>
                      </div>
                      <Badge color={getStatusColor(status)}>{count as number}</Badge>
                    </div>
                  ))}
                </div>
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

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
                <div className="flex gap-4 items-center">
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </Select>
                  
                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                  </Select>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectItem value="created_at">Date Created</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="quality">Quality Score</SelectItem>
                    <SelectItem value="sentiment">Sentiment</SelectItem>
                  </Select>
                </div>
                
                <TextInput
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Inbox Items */}
              <div className="space-y-4">
                {sortedInboxItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <img
                          src={item.content.thumbnail_url || '/placeholder-image.jpg'}
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
                          <Text className="font-medium">{item.content.username}</Text>
                          <Text className="text-sm text-gray-600">
                            {item.content.caption?.substring(0, 100)}...
                          </Text>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Heart className="h-4 w-4 mr-1" />
                              {item.content.engagement_metrics.likes}
                            </span>
                            <span className="flex items-center">
                              <MessageCircle className="h-4 w-4 mr-1" />
                              {item.content.engagement_metrics.comments}
                            </span>
                            <span className="flex items-center">
                              <Share2 className="h-4 w-4 mr-1" />
                              {item.content.engagement_metrics.shares || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="xs" 
                          variant="secondary" 
                          icon={Edit3}
                          onClick={() => handleAutoEdit(item.content.id)}
                          disabled={editProgress[item.content.id] === 'processing'}
                        >
                          {editProgress[item.content.id] === 'processing' ? 'Processing...' : 'Auto-Edit'}
                        </Button>
                        <Button 
                          size="xs" 
                          variant="secondary" 
                          icon={Mic}
                          onClick={() => handleVoiceover(item.content.id)}
                          disabled={voiceoverProgress[item.content.id] === 'generating'}
                        >
                          {voiceoverProgress[item.content.id] === 'generating' ? 'Generating...' : 'Voiceover'}
                        </Button>
                        <Button 
                          size="xs" 
                          variant="secondary" 
                          icon={MapPin}
                          onClick={() => handleHotspots(item.content.id)}
                          disabled={hotspotProgress[item.content.id] === 'generating'}
                        >
                          {hotspotProgress[item.content.id] === 'generating' ? 'Generating...' : 'Hotspots'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabPanel>

          <TabPanel>
            {/* Auto-Edit Tab */}
            <Card>
              <Title>Auto-Edit Pipeline</Title>
              <Text className="mb-4">AI-powered automatic editing of UGC content</Text>
              
              {!isUGCFeatureEnabled('ugc.auto-editing') ? (
                <div className="text-center py-12">
                  <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <Text>Auto-editing feature is disabled</Text>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Text className="font-medium mb-2">Brand Guidelines</Text>
                      <Select defaultValue="vintage">
                        <SelectItem value="vintage">Vintage Filter</SelectItem>
                        <SelectItem value="modern">Modern Filter</SelectItem>
                        <SelectItem value="minimal">Minimal Filter</SelectItem>
                      </Select>
                    </div>
                    <div>
                      <Text className="font-medium mb-2">Logo Placement</Text>
                      <Select defaultValue="top-left">
                        <SelectItem value="top-left">Top Left</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <Text className="font-medium mb-2">Recent Edits</Text>
                    <div className="space-y-2">
                      {Object.entries(editProgress).map(([contentId, status]) => (
                        <div key={contentId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <Text className="text-sm">Content {contentId.substring(0, 8)}...</Text>
                          <Badge color={status === 'completed' ? 'green' : status === 'failed' ? 'red' : 'yellow'}>
                            {status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </TabPanel>

          <TabPanel>
            {/* Voiceover Tab */}
            <Card>
              <Title>AI Voiceover Generation</Title>
              <Text className="mb-4">Generate professional voiceovers for UGC content</Text>
              
              {!isUGCFeatureEnabled('ugc.voiceover-generation') ? (
                <div className="text-center py-12">
                  <Mic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <Text>Voiceover generation feature is disabled</Text>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Text className="font-medium mb-2">Voice Type</Text>
                      <Select value={voiceoverType} onValueChange={setVoiceoverType}>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="energetic">Energetic</SelectItem>
                        <SelectItem value="calm">Calm</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </Select>
                    </div>
                    <div>
                      <Text className="font-medium mb-2">Language</Text>
                      <Select defaultValue="en">
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Text className="font-medium mb-2">Custom Script (Optional)</Text>
                    <textarea
                      value={voiceoverScript}
                      onChange={(e) => setVoiceoverScript(e.target.value)}
                      placeholder="Enter custom script or leave empty for AI-generated script..."
                      className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="border-t pt-4">
                    <Text className="font-medium mb-2">Recent Voiceovers</Text>
                    <div className="space-y-2">
                      {Object.entries(voiceoverProgress).map(([contentId, status]) => (
                        <div key={contentId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <Text className="text-sm">Content {contentId.substring(0, 8)}...</Text>
                          <Badge color={status === 'completed' ? 'green' : status === 'failed' ? 'red' : 'yellow'}>
                            {status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </TabPanel>

          <TabPanel>
            {/* Hotspots Tab */}
            <Card>
              <Title>Interactive Hotspot Generation</Title>
              <Text className="mb-4">Create interactive hotspots for product discovery</Text>
              
              {!isUGCFeatureEnabled('ugc.hotspot-generation') ? (
                <div className="text-center py-12">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <Text>Hotspot generation feature is disabled</Text>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Text className="font-medium mb-2">Hotspot Type</Text>
                      <Select defaultValue="product">
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="link">Link</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="cta">Call to Action</SelectItem>
                      </Select>
                    </div>
                    <div>
                      <Text className="font-medium mb-2">Detection Mode</Text>
                      <Select defaultValue="auto">
                        <SelectItem value="auto">Auto-Detect</SelectItem>
                        <SelectItem value="manual">Manual Placement</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <Text className="font-medium mb-2">Recent Hotspots</Text>
                    <div className="space-y-2">
                      {Object.entries(hotspotProgress).map(([contentId, status]) => (
                        <div key={contentId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <Text className="text-sm">Content {contentId.substring(0, 8)}...</Text>
                          <Badge color={status === 'completed' ? 'green' : status === 'failed' ? 'red' : 'yellow'}>
                            {status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </TabPanel>

          <TabPanel>
            {/* Analytics Tab */}
            <Grid numItems={1} numItemsLg={2} className="gap-6">
              <Card>
                <Title>Engagement Trends</Title>
                <div className="mt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <Text>Average Likes</Text>
                    <Metric>1,234</Metric>
                  </div>
                  <div className="flex justify-between items-center">
                    <Text>Average Comments</Text>
                    <Metric>89</Metric>
                  </div>
                  <div className="flex justify-between items-center">
                    <Text>Average Shares</Text>
                    <Metric>156</Metric>
                  </div>
                </div>
              </Card>
              <Card>
                <Title>Platform Performance</Title>
                <div className="mt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {getPlatformIcon('instagram')}
                      <Text>Instagram</Text>
                    </div>
                    <Badge color="blue">85%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {getPlatformIcon('tiktok')}
                      <Text>TikTok</Text>
                    </div>
                    <Badge color="green">92%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {getPlatformIcon('youtube')}
                      <Text>YouTube</Text>
                    </div>
                    <Badge color="yellow">78%</Badge>
                  </div>
                </div>
              </Card>
            </Grid>
          </TabPanel>

          <TabPanel>
            {/* Settings Tab */}
            <Card>
              <Title>UGC Settings</Title>
              <div className="space-y-6 mt-4">
                <div>
                  <Text className="font-medium">Social Listening</Text>
                  <Text className="text-sm text-gray-600 mb-2">
                    Configure hashtags and keywords for content discovery
                  </Text>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Text className="text-sm font-medium mb-1">Hashtags</Text>
                      <TextInput placeholder="#brand, #product, #lifestyle" />
                    </div>
                    <div>
                      <Text className="text-sm font-medium mb-1">Keywords</Text>
                      <TextInput placeholder="brand name, product names" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <Text className="font-medium">Auto-Editing</Text>
                  <Text className="text-sm text-gray-600 mb-2">
                    Set brand guidelines for automatic content editing
                  </Text>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Text className="text-sm font-medium mb-1">Default Filter</Text>
                      <Select defaultValue="vintage">
                        <SelectItem value="vintage">Vintage</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                      </Select>
                    </div>
                    <div>
                      <Text className="text-sm font-medium mb-1">Logo URL</Text>
                      <TextInput placeholder="https://example.com/logo.png" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <Text className="font-medium">Voiceover Settings</Text>
                  <Text className="text-sm text-gray-600 mb-2">
                    Configure AI voiceover preferences and voice types
                  </Text>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Text className="text-sm font-medium mb-1">Default Voice</Text>
                      <Select defaultValue="neutral">
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="energetic">Energetic</SelectItem>
                        <SelectItem value="calm">Calm</SelectItem>
                      </Select>
                    </div>
                    <div>
                      <Text className="text-sm font-medium mb-1">Language</Text>
                      <Select defaultValue="en">
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Text className="font-medium">Hotspot Generation</Text>
                  <Text className="text-sm text-gray-600 mb-2">
                    Set up product detection and hotspot placement rules
                  </Text>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Text className="text-sm font-medium mb-1">Detection Mode</Text>
                      <Select defaultValue="auto">
                        <SelectItem value="auto">Auto-Detect</SelectItem>
                        <SelectItem value="manual">Manual Placement</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </Select>
                    </div>
                    <div>
                      <Text className="text-sm font-medium mb-1">Max Hotspots</Text>
                      <TextInput type="number" placeholder="5" />
                    </div>
                  </div>
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

export default UGCDashboard; 