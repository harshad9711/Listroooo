import { supabase } from '../lib/supabase';

export interface TikTokVideo {
  id: string;
  title?: string;
  description?: string;
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  width?: number;
  height?: number;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  created_time?: string;
  hashtags?: string[];
  mentions?: string[];
  music?: {
    id: string;
    title: string;
    author: string;
  };
  author?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    follower_count?: number;
    following_count?: number;
    verified?: boolean;
  };
  location?: {
    id: string;
    name: string;
    address?: string;
  };
}

export interface TikTokHashtag {
  id: string;
  name: string;
  video_count: number;
  view_count?: number;
}

export interface TikTokUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  follower_count: number;
  following_count: number;
  video_count: number;
  verified: boolean;
  private: boolean;
}

export interface TikTokTrendingVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  duration: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  hashtags: string[];
  author: TikTokUser;
  created_time: string;
}

export class TikTokService {
  private accessToken: string;
  private apiBaseUrl = 'https://open.tiktokapis.com/v2';

  constructor() {
    this.accessToken = process.env.REACT_APP_TIKTOK_ACCESS_TOKEN || '';
  }

  setCredentials(accessToken: string) {
    this.accessToken = accessToken;
  }

  // Search videos by hashtag
  async searchVideosByHashtag(hashtag: string, limit: number = 20): Promise<TikTokVideo[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/video/query/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          query: `#${hashtag}`,
          max_count: limit,
          fields: [
            'id',
            'title',
            'description',
            'video_url',
            'thumbnail_url',
            'duration',
            'width',
            'height',
            'view_count',
            'like_count',
            'comment_count',
            'share_count',
            'created_time',
            'hashtags',
            'mentions',
            'music',
            'author',
            'location'
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`TikTok API error: ${data.error.message}`);
      }

      return data.data.videos.map((video: any) => ({
        id: video.id,
        title: video.title,
        description: video.description,
        video_url: video.video_url,
        thumbnail_url: video.thumbnail_url,
        duration: video.duration,
        width: video.width,
        height: video.height,
        view_count: video.view_count,
        like_count: video.like_count,
        comment_count: video.comment_count,
        share_count: video.share_count,
        created_time: video.created_time,
        hashtags: this.extractHashtags(video.description),
        mentions: this.extractMentions(video.description),
        music: video.music,
        author: video.author,
        location: video.location
      }));
    } catch (error) {
      console.error('Error searching TikTok videos by hashtag:', error);
      throw error;
    }
  }

  // Search hashtags
  async searchHashtags(query: string, limit: number = 20): Promise<TikTokHashtag[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/hashtag/search/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          query,
          max_count: limit,
          fields: ['id', 'name', 'video_count', 'view_count']
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`TikTok API error: ${data.error.message}`);
      }

      return data.data.hashtags.map((hashtag: any) => ({
        id: hashtag.id,
        name: hashtag.name,
        video_count: hashtag.video_count,
        view_count: hashtag.view_count
      }));
    } catch (error) {
      console.error('Error searching TikTok hashtags:', error);
      throw error;
    }
  }

  // Get trending videos
  async getTrendingVideos(region: string = 'US', limit: number = 20): Promise<TikTokTrendingVideo[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/video/trending/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          region,
          max_count: limit,
          fields: [
            'id',
            'title',
            'description',
            'video_url',
            'thumbnail_url',
            'duration',
            'view_count',
            'like_count',
            'comment_count',
            'share_count',
            'hashtags',
            'author',
            'created_time'
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`TikTok API error: ${data.error.message}`);
      }

      return data.data.videos.map((video: any) => ({
        id: video.id,
        title: video.title,
        description: video.description,
        video_url: video.video_url,
        thumbnail_url: video.thumbnail_url,
        duration: video.duration,
        view_count: video.view_count,
        like_count: video.like_count,
        comment_count: video.comment_count,
        share_count: video.share_count,
        hashtags: this.extractHashtags(video.description),
        author: video.author,
        created_time: video.created_time
      }));
    } catch (error) {
      console.error('Error fetching TikTok trending videos:', error);
      throw error;
    }
  }

  // Get user videos
  async getUserVideos(userId: string, limit: number = 20): Promise<TikTokVideo[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/user/videos/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          user_id: userId,
          max_count: limit,
          fields: [
            'id',
            'title',
            'description',
            'video_url',
            'thumbnail_url',
            'duration',
            'width',
            'height',
            'view_count',
            'like_count',
            'comment_count',
            'share_count',
            'created_time',
            'hashtags',
            'mentions',
            'music',
            'location'
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`TikTok API error: ${data.error.message}`);
      }

      return data.data.videos.map((video: any) => ({
        id: video.id,
        title: video.title,
        description: video.description,
        video_url: video.video_url,
        thumbnail_url: video.thumbnail_url,
        duration: video.duration,
        width: video.width,
        height: video.height,
        view_count: video.view_count,
        like_count: video.like_count,
        comment_count: video.comment_count,
        share_count: video.share_count,
        created_time: video.created_time,
        hashtags: this.extractHashtags(video.description),
        mentions: this.extractMentions(video.description),
        music: video.music,
        location: video.location
      }));
    } catch (error) {
      console.error('Error fetching TikTok user videos:', error);
      throw error;
    }
  }

  // Get video details
  async getVideoDetails(videoId: string): Promise<TikTokVideo> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/video/detail/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          video_id: videoId,
          fields: [
            'id',
            'title',
            'description',
            'video_url',
            'thumbnail_url',
            'duration',
            'width',
            'height',
            'view_count',
            'like_count',
            'comment_count',
            'share_count',
            'created_time',
            'hashtags',
            'mentions',
            'music',
            'author',
            'location'
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`TikTok API error: ${data.error.message}`);
      }

      const video = data.data;
      return {
        id: video.id,
        title: video.title,
        description: video.description,
        video_url: video.video_url,
        thumbnail_url: video.thumbnail_url,
        duration: video.duration,
        width: video.width,
        height: video.height,
        view_count: video.view_count,
        like_count: video.like_count,
        comment_count: video.comment_count,
        share_count: video.share_count,
        created_time: video.created_time,
        hashtags: this.extractHashtags(video.description),
        mentions: this.extractMentions(video.description),
        music: video.music,
        author: video.author,
        location: video.location
      };
    } catch (error) {
      console.error('Error fetching TikTok video details:', error);
      throw error;
    }
  }

  // Save video to UGC database
  async saveVideoToUGC(video: TikTokVideo, tags: string[] = [], status: 'pending' | 'approved' | 'rejected' = 'pending'): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('ugc_content')
        .insert({
          platform: 'tiktok',
          platform_content_id: video.id,
          content_type: 'video',
          content_url: video.video_url,
          thumbnail_url: video.thumbnail_url,
          caption: video.description,
          username: video.author?.username,
          hashtags: video.hashtags || [],
          mentions: video.mentions || [],
          engagement_metrics: {
            likes: video.like_count || 0,
            comments: video.comment_count || 0,
            shares: video.share_count || 0,
            views: video.view_count || 0
          },
          location: video.location,
          posted_at: video.created_time,
          tags: tags,
          status: status,
          source: 'tiktok_api'
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving TikTok video to UGC:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error saving TikTok video to UGC:', error);
      throw error;
    }
  }

  // Bulk import videos
  async bulkImportVideos(videos: TikTokVideo[], tags: string[] = [], status: 'pending' | 'approved' | 'rejected' = 'pending'): Promise<any[]> {
    try {
      const ugcData = videos.map(video => ({
        platform: 'tiktok',
        platform_content_id: video.id,
        content_type: 'video',
        content_url: video.video_url,
        thumbnail_url: video.thumbnail_url,
        caption: video.description,
        username: video.author?.username,
        hashtags: video.hashtags || [],
        mentions: video.mentions || [],
        engagement_metrics: {
          likes: video.like_count || 0,
          comments: video.comment_count || 0,
          shares: video.share_count || 0,
          views: video.view_count || 0
        },
        location: video.location,
        posted_at: video.created_time,
        tags: tags,
        status: status,
        source: 'tiktok_api'
      }));

      const { data, error } = await supabase
        .from('ugc_content')
        .insert(ugcData)
        .select();

      if (error) {
        console.error('Error bulk importing TikTok videos:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error bulk importing TikTok videos:', error);
      throw error;
    }
  }

  // Discover content by hashtags and keywords
  async discoverContent(hashtags: string[], keywords: string[], limit: number = 50): Promise<TikTokVideo[]> {
    try {
      const allVideos: TikTokVideo[] = [];
      
      // Search by hashtags
      for (const hashtag of hashtags) {
        try {
          const videos = await this.searchVideosByHashtag(hashtag, Math.ceil(limit / hashtags.length));
          allVideos.push(...videos);
        } catch (error) {
          console.error(`Error searching hashtag ${hashtag}:`, error);
        }
      }

      // Search by keywords
      for (const keyword of keywords) {
        try {
          const videos = await this.searchVideosByKeyword(keyword, Math.ceil(limit / keywords.length));
          allVideos.push(...videos);
        } catch (error) {
          console.error(`Error searching keyword ${keyword}:`, error);
        }
      }

      // Remove duplicates and limit results
      const uniqueVideos = allVideos.filter((video, index, self) => 
        index === self.findIndex(v => v.id === video.id)
      );

      return uniqueVideos.slice(0, limit);
    } catch (error) {
      console.error('Error discovering TikTok content:', error);
      throw error;
    }
  }

  // Search videos by keyword
  async searchVideosByKeyword(keyword: string, limit: number = 20): Promise<TikTokVideo[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/video/query/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          query: keyword,
          max_count: limit,
          fields: [
            'id',
            'title',
            'description',
            'video_url',
            'thumbnail_url',
            'duration',
            'width',
            'height',
            'view_count',
            'like_count',
            'comment_count',
            'share_count',
            'created_time',
            'hashtags',
            'mentions',
            'music',
            'author',
            'location'
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`TikTok API error: ${data.error.message}`);
      }

      return data.data.videos.map((video: any) => ({
        id: video.id,
        title: video.title,
        description: video.description,
        video_url: video.video_url,
        thumbnail_url: video.thumbnail_url,
        duration: video.duration,
        width: video.width,
        height: video.height,
        view_count: video.view_count,
        like_count: video.like_count,
        comment_count: video.comment_count,
        share_count: video.share_count,
        created_time: video.created_time,
        hashtags: this.extractHashtags(video.description),
        mentions: this.extractMentions(video.description),
        music: video.music,
        author: video.author,
        location: video.location
      }));
    } catch (error) {
      console.error('Error searching TikTok videos by keyword:', error);
      throw error;
    }
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      // Try to search for a common hashtag to test the connection
      await this.searchHashtags('fyp', 1);
      return true;
    } catch (error) {
      console.error('TikTok connection test failed:', error);
      return false;
    }
  }

  // Get trending hashtags
  async getTrendingHashtags(region: string = 'US', limit: number = 20): Promise<TikTokHashtag[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/hashtag/trending/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          region,
          max_count: limit,
          fields: ['id', 'name', 'video_count', 'view_count']
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`TikTok API error: ${data.error.message}`);
      }

      return data.data.hashtags.map((hashtag: any) => ({
        id: hashtag.id,
        name: hashtag.name,
        video_count: hashtag.video_count,
        view_count: hashtag.view_count
      }));
    } catch (error) {
      console.error('Error fetching TikTok trending hashtags:', error);
      throw error;
    }
  }

  private extractHashtags(text: string): string[] {
    if (!text) return [];
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    return text.match(hashtagRegex) || [];
  }

  private extractMentions(text: string): string[] {
    if (!text) return [];
    const mentionRegex = /@[\w.]+/g;
    return text.match(mentionRegex) || [];
  }
}

export const tiktokService = new TikTokService(); 