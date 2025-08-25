// Backend API configuration
const API_BASE_URL = 'http://localhost:3001/api';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Helper function to get auth token
const getAuthToken = (): string | null => {
  // In a real app, this would come from your auth context
  return localStorage.getItem('authToken');
};

// Helper function for API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API call error for ${endpoint}:`, error);
    throw error;
  }
};

// Helper function for Supabase Edge Functions
const supabaseCall = async (functionName: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      ...(token && { 'X-User-Token': token }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`Supabase function failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Supabase function error:', error);
    throw error;
  }
};

// UGC API Service
export class UGCApiService {
  // Analytics
  async getAnalytics(dateFrom?: string, dateTo?: string, platform?: string, status?: string) {
    try {
      return await supabaseCall('ugc-analytics', {
        method: 'POST',
        body: JSON.stringify({ dateFrom, dateTo, platform, status })
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      return {
        success: false,
        analytics: {
          platformBreakdown: {},
          statusBreakdown: {},
          engagement: { total: 0, average: 0, topPerformer: 0 },
          quality: { averageScore: '0.0', highQuality: 0, totalRated: 0 },
          sentiment: { averageScore: '0.00', positive: 0, negative: 0, neutral: 0 },
          trends: { dailyDiscovery: 0, weeklyGrowth: '0%', topPlatform: 'instagram' }
        },
        totalContent: 0,
        recentActivity: []
      };
    }
  }

  // Inbox Management
  async getInbox(status?: string) {
    try {
      const endpoint = status ? `/ugc/inbox?status=${status}` : '/ugc/inbox';
      return await apiCall(endpoint);
    } catch (error) {
      console.error('Failed to fetch inbox:', error);
      return [];
    }
  }

  async updateInboxStatus(itemId: string, status: string, notes?: string) {
    try {
      return await apiCall(`/ugc/inbox/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ status, notes })
      });
    } catch (error) {
      console.error('Failed to update inbox status:', error);
      throw error;
    }
  }

  async addToInbox(contentId: string) {
    try {
      return await apiCall('/ugc/inbox', {
        method: 'POST',
        body: JSON.stringify({ content_id: contentId })
      });
    } catch (error) {
      console.error('Failed to add to inbox:', error);
      throw error;
    }
  }

  // Content Discovery
  async discoverContent(hashtags: string[], keywords: string[], platforms: string[] = ['instagram', 'tiktok'], limit: number = 20) {
    try {
      return await supabaseCall('ugc-discover', {
        method: 'POST',
        body: JSON.stringify({ hashtags, keywords, platforms, limit })
      });
    } catch (error) {
      console.error('Failed to discover content:', error);
      return { success: false, content: [], total: 0 };
    }
  }

  // Instagram Integration
  async searchInstagramHashtag(hashtag: string, limit: number = 20) {
    try {
      return await supabaseCall('instagram-integration', {
        method: 'POST',
        body: JSON.stringify({ action: 'hashtag_search', hashtag, limit })
      });
    } catch (error) {
      console.error('Failed to search Instagram hashtag:', error);
      return { success: false, data: [], total: 0 };
    }
  }

  async getInstagramLocationPosts(locationId: string, limit: number = 20) {
    try {
      return await supabaseCall('instagram-integration', {
        method: 'POST',
        body: JSON.stringify({ action: 'location_posts', locationId, limit })
      });
    } catch (error) {
      console.error('Failed to get Instagram location posts:', error);
      return { success: false, data: [], total: 0 };
    }
  }

  async getInstagramUserProfile(username: string) {
    try {
      return await supabaseCall('instagram-integration', {
        method: 'POST',
        body: JSON.stringify({ action: 'user_profile', userId: username })
      });
    } catch (error) {
      console.error('Failed to get Instagram user profile:', error);
      return { success: false, data: null };
    }
  }

  // TikTok Integration
  async searchTikTokHashtag(hashtag: string, region: string = 'US', limit: number = 20) {
    try {
      return await supabaseCall('tiktok-integration', {
        method: 'POST',
        body: JSON.stringify({ action: 'hashtag_search', hashtag, region, limit })
      });
    } catch (error) {
      console.error('Failed to search TikTok hashtag:', error);
      return { success: false, data: [], total: 0 };
    }
  }

  async searchTikTokKeyword(keyword: string, region: string = 'US', limit: number = 20) {
    try {
      return await supabaseCall('tiktok-integration', {
        method: 'POST',
        body: JSON.stringify({ action: 'keyword_search', keyword, region, limit })
      });
    } catch (error) {
      console.error('Failed to search TikTok keyword:', error);
      return { success: false, data: [], total: 0 };
    }
  }

  async getTikTokTrendingVideos(region: string = 'US', limit: number = 20) {
    try {
      return await supabaseCall('tiktok-integration', {
        method: 'POST',
        body: JSON.stringify({ action: 'trending_videos', region, limit })
      });
    } catch (error) {
      console.error('Failed to get TikTok trending videos:', error);
      return { success: false, data: [], total: 0 };
    }
  }

  // Rights Management
  async requestRights(contentId: string, brandId: string, terms: any, contactEmail?: string, message?: string) {
    try {
      return await supabaseCall('ugc-rights-request', {
        method: 'POST',
        body: JSON.stringify({ contentId, brandId, terms, contactEmail, message })
      });
    } catch (error) {
      console.error('Failed to request rights:', error);
      throw error;
    }
  }

  async checkRightsStatus(contentId: string) {
    try {
      return await apiCall(`/ugc/rights/status/${contentId}`);
    } catch (error) {
      console.error('Failed to check rights status:', error);
      throw error;
    }
  }

  async approveRights(contentId: string) {
    try {
      return await apiCall('/ugc/rights/approve', {
        method: 'POST',
        body: JSON.stringify({ contentId })
      });
    } catch (error) {
      console.error('Failed to approve rights:', error);
      throw error;
    }
  }

  // Auto-Editing
  async autoEdit(contentId: string, editOptions: any) {
    try {
      return await supabaseCall('ugc-auto-edit', {
        method: 'POST',
        body: JSON.stringify({ contentId, editOptions })
      });
    } catch (error) {
      console.error('Failed to auto-edit:', error);
      throw error;
    }
  }

  async getEdits(contentId: string) {
    try {
      return await apiCall(`/ugc/edit/${contentId}`);
    } catch (error) {
      console.error('Failed to get edits:', error);
      return [];
    }
  }

  // Voiceover Generation
  async generateVoiceover(contentId: string, script?: string, voiceType: string = 'energetic', language: string = 'en') {
    try {
      return await supabaseCall('ugc-voiceover', {
        method: 'POST',
        body: JSON.stringify({ contentId, script, voiceType, language })
      });
    } catch (error) {
      console.error('Failed to generate voiceover:', error);
      throw error;
    }
  }

  async getVoiceovers(contentId: string) {
    try {
      return await apiCall(`/ugc/voiceover/${contentId}`);
    } catch (error) {
      console.error('Failed to get voiceovers:', error);
      return [];
    }
  }

  // Hotspot Generation
  async generateHotspots(contentId: string) {
    try {
      return await apiCall('/ugc/hotspots', {
        method: 'POST',
        body: JSON.stringify({ contentId })
      });
    } catch (error) {
      console.error('Failed to generate hotspots:', error);
      throw error;
    }
  }

  async getHotspots(contentId: string) {
    try {
      return await apiCall(`/ugc/hotspots/${contentId}`);
    } catch (error) {
      console.error('Failed to get hotspots:', error);
      return [];
    }
  }

  // Feedback
  async submitFeedback(rating: string, comment?: string, userId?: string, contentId?: string, context?: any) {
    try {
      return await apiCall('/ugc/feedback', {
        method: 'POST',
        body: JSON.stringify({ rating, comment, userId, contentId, context })
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const ugcApi = new UGCApiService();
