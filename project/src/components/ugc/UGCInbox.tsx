import React, { useState, useEffect } from "react";
import { ugcService } from '../../services/ugcService';
import type { UGCInboxItem } from '../../services/ugcService';

import {
  Inbox, 
  CheckCircle, 
  XCircle, 
  Star,
  Eye,
  Tag,
  RefreshCw,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Music,
  Globe,
  Search,
  Heart,
  MessageCircle
} from 'lucide-react';

interface UGCInboxProps {
  className?: string;
}

const UGCInbox: React.FC<UGCInboxProps> = ({ className = '' }) => {
  const [inboxItems, setInboxItems] = useState<UGCInboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    platform: 'all',
    search: ''
  });

  useEffect(() => {
    loadInbox();
  }, []);

  const loadInbox = async () => {
    setLoading(true);
    try {
      const items = await ugcService.getInbox();
      setInboxItems(items);
    } catch (error) {
      console.error('Error loading inbox:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (itemId: string, status: string, notes?: string) => {
    try {
      await ugcService.updateInboxStatus(itemId, status, notes);
      await loadInbox();
    } catch (error) {
      console.error('Error updating inbox status:', error);
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
      case 'new': return 'text-blue-600 bg-blue-100';
      case 'reviewed': return 'text-gray-600 bg-gray-100';
      case 'published': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredItems = inboxItems.filter(item => {
    if (filters.status !== 'all' && item.status !== filters.status) return false;
    if (filters.platform !== 'all' && item.content.platform !== filters.platform) return false;
    if (filters.search && !item.content.caption?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">UGC Inbox</h1>
            <p className="text-gray-600 mt-1">Review and manage incoming user-generated content</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadInbox}
              disabled={loading}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Search content..."
            />
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="published">Published</option>
          </select>
          
          <select
            value={filters.platform}
            onChange={(e) => setFilters(prev => ({ ...prev, platform: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="tiktok">TikTok</option>
            <option value="twitter">Twitter</option>
            <option value="youtube">YouTube</option>
          </select>
          
          <div className="text-sm text-gray-500 flex items-center">
            <Inbox className="h-4 w-4 mr-2" />
            {filteredItems.length} items
          </div>
        </div>
      </div>

      {/* Inbox Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Inbox className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
            <p className="text-gray-600">No UGC content matches your current filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  {/* Content Preview */}
                  <div className="flex-shrink-0">
                    {item.content.thumbnail_url ? (
                      <img 
                        src={item.content.thumbnail_url} 
                        alt="Content thumbnail"
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                        {getPlatformIcon(item.content.platform)}
                      </div>
                    )}
                  </div>
                  
                  {/* Content Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getPlatformIcon(item.content.platform)}
                        <span className="text-sm font-medium text-gray-900">{item.content.username}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.content.caption || 'No caption'}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center">
                        <Heart className="h-3 w-3 mr-1" />
                        {item.content.engagement_metrics.likes}
                      </span>
                      <span className="flex items-center">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        {item.content.engagement_metrics.comments}
                      </span>
                      <span className="flex items-center">
                        <Tag className="h-3 w-3 mr-1" />
                        {item.content.hashtags.length} hashtags
                      </span>
                    </div>
                    
                    {/* Hashtags */}
                    {item.content.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.content.hashtags.slice(0, 5).map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                            {tag}
                          </span>
                        ))}
                        {item.content.hashtags.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                            +{item.content.hashtags.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Notes */}
                    {item.notes && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                        <p className="text-sm text-yellow-800">{item.notes}</p>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleStatusUpdate(item.id, 'approved')}
                        className="flex items-center px-3 py-1 text-green-600 hover:bg-green-100 rounded text-sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(item.id, 'rejected')}
                        className="flex items-center px-3 py-1 text-red-600 hover:bg-red-100 rounded text-sm"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(item.id, 'featured')}
                        className="flex items-center px-3 py-1 text-purple-600 hover:bg-purple-100 rounded text-sm"
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Feature
                      </button>
                      <button
                        onClick={() => {}}
                        className="flex items-center px-3 py-1 text-blue-600 hover:bg-blue-100 rounded text-sm"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UGCInbox;
