import React, { useState, useEffect } from 'react';
import { Card, Title, Text, Badge, Button, Grid, Col, Metric, Flex, Select, SelectItem } from '@tremor/react';
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
  MapPin as LocationIcon
} from 'lucide-react';
import { ugcApi } from '../../services/ugcApi';
import { isUGCFeatureEnabled } from '../../lib/ugcFeatureFlags';
import type { UGCInboxItem } from '../../services/ugcService';

interface UGCInboxProps {
  className?: string;
}

const UGCInbox: React.FC<UGCInboxProps> = ({ className = '' }) => {
  const [inboxItems, setInboxItems] = useState<UGCInboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('created_at');

  useEffect(() => {
    if (isUGCFeatureEnabled('ugc.inbox-management')) {
      loadInboxData();
    }
  }, []);

  const loadInboxData = async () => {
    try {
      setLoading(true);
      const data = await ugcApi.getInbox();
      setInboxItems(data);
    } catch (error) {
      console.error('Error loading inbox data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (itemId: string, newStatus: string, notes?: string) => {
    try {
      await ugcApi.updateInboxStatus(itemId, newStatus, notes);
      await loadInboxData(); // Reload data
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleAutoEdit = async (contentId: string) => {
    if (!isUGCFeatureEnabled('ugc.auto-editing')) {
      alert('Auto-editing feature is disabled');
      return;
    }

    try {
      await ugcApi.autoEdit(contentId, {
        filter: 'vintage',
        logo_placement: {
          logo_url: '/brand-logo.png',
          position: { x: 20, y: 20 },
          size: 60,
          opacity: 0.8
        }
      });
      alert('Auto-edit started! Check the edits tab for progress.');
    } catch (error) {
      console.error('Error starting auto-edit:', error);
      alert('Error starting auto-edit');
    }
  };

  const handleVoiceover = async (contentId: string) => {
    if (!isUGCFeatureEnabled('ugc.voiceover-generation')) {
      alert('Voiceover generation feature is disabled');
      return;
    }

    try {
      await ugcApi.generateVoiceover(contentId, undefined, 'energetic');
      alert('Voiceover generation started! Check the voiceover tab for progress.');
    } catch (error) {
      console.error('Error starting voiceover generation:', error);
      alert('Error starting voiceover generation');
    }
  };

  const handleHotspots = async (contentId: string) => {
    if (!isUGCFeatureEnabled('ugc.hotspot-generation')) {
      alert('Hotspot generation feature is disabled');
      return;
    }

    try {
      await ugcApi.generateHotspots(contentId);
      alert('Hotspot generation started! Check the hotspots tab for progress.');
    } catch (error) {
      console.error('Error starting hotspot generation:', error);
      alert('Error starting hotspot generation');
    }
  };

  const filteredItems = inboxItems.filter(item => {
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    const matchesPlatform = selectedPlatform === 'all' || item.content.platform === selectedPlatform;
    const matchesSearch = searchTerm === '' || 
      item.content.author.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.content.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.brand_tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesPlatform && matchesSearch;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'created_at':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'engagement':
        return (b.content.engagement.likes + b.content.engagement.comments + b.content.engagement.shares) -
               (a.content.engagement.likes + a.content.engagement.comments + a.content.engagement.shares);
      case 'quality':
        return b.content.quality_score - a.content.quality_score;
      case 'sentiment':
        return b.content.sentiment_score - a.content.sentiment_score;
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

  if (!isUGCFeatureEnabled('ugc.inbox-management')) {
    return (
      <div className={`p-6 ${className}`}>
        <Card>
          <Title>UGC Inbox</Title>
          <Text>This feature is currently disabled. Contact your administrator to enable UGC inbox functionality.</Text>
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
            <Text className="ml-2">Loading UGC Inbox...</Text>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="mb-6">
        <Title>UGC Inbox</Title>
        <Text>Manage and approve user-generated content from social media platforms</Text>
      </div>

      {/* Stats Cards */}
      <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-6 mb-6">
        <Card>
          <Flex alignItems="start">
            <div>
              <Text>Total Items</Text>
              <Metric>{inboxItems.length}</Metric>
            </div>
            <Inbox className="h-5 w-5 text-blue-500" />
          </Flex>
        </Card>
        <Card>
          <Flex alignItems="start">
            <div>
              <Text>New Items</Text>
              <Metric>{inboxItems.filter(item => item.status === 'new').length}</Metric>
            </div>
            <Plus className="h-5 w-5 text-green-500" />
          </Flex>
        </Card>
        <Card>
          <Flex alignItems="start">
            <div>
              <Text>Approved</Text>
              <Metric>{inboxItems.filter(item => item.status === 'approved').length}</Metric>
            </div>
            <CheckCircle className="h-5 w-5 text-purple-500" />
          </Flex>
        </Card>
        <Card>
          <Flex alignItems="start">
            <div>
              <Text>Published</Text>
              <Metric>{inboxItems.filter(item => item.status === 'published').length}</Metric>
            </div>
            <Star className="h-5 w-5 text-orange-500" />
          </Flex>
        </Card>
      </Grid>

      {/* Filters and Controls */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
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
          
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button variant="secondary" icon={Download}>
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Inbox Items */}
      <div className="space-y-4">
        {sortedItems.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <img
                  src={item.content.content.thumbnail_url || '/placeholder-image.jpg'}
                  alt="Content thumbnail"
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge color={getStatusColor(item.status)}>
                      {getStatusIcon(item.status)}
                      {item.status}
                    </Badge>
                    <Badge variant="secondary">
                      {getPlatformIcon(item.content.platform)}
                      {item.content.platform}
                    </Badge>
                    {item.content.author.verified && (
                      <Badge color="blue" variant="secondary">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-1">
                    <User className="h-4 w-4 text-gray-500" />
                    <Text className="font-medium">{item.content.author.username}</Text>
                    <Text className="text-sm text-gray-500">
                      ({item.content.author.followers.toLocaleString()} followers)
                    </Text>
                  </div>
                  
                  <Text className="text-sm text-gray-600 mb-2">
                    {item.content.content.caption?.substring(0, 150)}
                    {item.content.content.caption && item.content.content.caption.length > 150 && '...'}
                  </Text>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                    <span className="flex items-center">
                      <Heart className="h-4 w-4 mr-1" />
                      {item.content.engagement.likes.toLocaleString()}
                    </span>
                    <span className="flex items-center">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {item.content.engagement.comments.toLocaleString()}
                    </span>
                    <span className="flex items-center">
                      <Share2 className="h-4 w-4 mr-1" />
                      {item.content.engagement.shares.toLocaleString()}
                    </span>
                    <span className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {item.content.engagement.views.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    {item.content.content.location && (
                      <span className="flex items-center">
                        <LocationIcon className="h-4 w-4 mr-1" />
                        {item.content.content.location}
                      </span>
                    )}
                  </div>
                  
                  {item.content.brand_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.content.brand_tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" size="xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <div className="flex space-x-2">
                  {isUGCFeatureEnabled('ugc.auto-edit-button') && (
                    <Button size="xs" variant="secondary" icon={Edit3} onClick={() => handleAutoEdit(item.content.id)}>
                      Auto-Edit
                    </Button>
                  )}
                  {isUGCFeatureEnabled('ugc.voiceover-tab') && (
                    <Button size="xs" variant="secondary" icon={Mic} onClick={() => handleVoiceover(item.content.id)}>
                      Voiceover
                    </Button>
                  )}
                  {isUGCFeatureEnabled('ugc.hotspot-generator') && (
                    <Button size="xs" variant="secondary" icon={MapPin} onClick={() => handleHotspots(item.content.id)}>
                      Hotspots
                    </Button>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    size="xs" 
                    variant="secondary" 
                    onClick={() => handleStatusUpdate(item.id, 'approved')}
                  >
                    Approve
                  </Button>
                  <Button 
                    size="xs" 
                    variant="secondary" 
                    onClick={() => handleStatusUpdate(item.id, 'rejected')}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
        
        {sortedItems.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <Inbox className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <Text className="text-lg font-medium text-gray-900 mb-2">
                No content found
              </Text>
              <Text className="text-gray-500">
                {searchTerm || selectedStatus !== 'all' || selectedPlatform !== 'all' 
                  ? 'Try adjusting your filters or search terms'
                  : 'Your UGC inbox is empty. Content will appear here as it\'s discovered.'}
              </Text>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UGCInbox; 