import { supabase } from '../lib/supabase';

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  permalink?: string;
  thumbnail_url?: string;
  timestamp?: string;
  username?: string;
  like_count?: number;
  comments_count?: number;
  hashtags?: string[];
  mentions?: string[];
  location?: {
    id: string;
    name: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface InstagramBusinessAccount {
  id: string;
  username: string;
  name: string;
  profile_picture_url?: string;
  website?: string;
  bio?: string;
  followers_count?: number;
  media_count?: number;
}

export interface InstagramHashtag {
  id: string;
  name: string;
  media_count: number;
}

export class InstagramService {
  private accessToken: string;
  private businessAccountId: string;
  private pageId: string;

  constructor() {
    this.accessToken = process.env.REACT_APP_INSTAGRAM_ACCESS_TOKEN || '';
    this.businessAccountId = process.env.REACT_APP_INSTAGRAM_BUSINESS_ACCOUNT_ID || '';
    this.pageId = process.env.REACT_APP_FACEBOOK_PAGE_ID || '';
  }

  setCredentials(accessToken: string, businessAccountId: string, pageId: string) {
    this.accessToken = accessToken;
    this.businessAccountId = businessAccountId;
    this.pageId = pageId;
  }

  async getBusinessAccountInfo(): Promise<InstagramBusinessAccount> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${this.businessAccountId}?fields=id,username,name,profile_picture_url,website,biography,followers_count,media_count&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        username: data.username,
        name: data.name,
        profile_picture_url: data.profile_picture_url,
        website: data.website,
        bio: data.biography,
        followers_count: data.followers_count,
        media_count: data.media_count
      };
    } catch (error) {
      console.error('Error fetching Instagram business account info:', error);
      throw error;
    }
  }

  async getRecentMedia(limit: number = 25, fields: string[] = ['id', 'caption', 'media_type', 'media_url', 'permalink', 'thumbnail_url', 'timestamp']): Promise<InstagramMedia[]> {
    try {
      const fieldsParam = fields.join(',');
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${this.businessAccountId}/recent_media?user_id=${this.businessAccountId}&fields=${fieldsParam}&limit=${limit}&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Instagram API error: ${data.error.message}`);
      }

      return data.data.map((item: any) => ({
        id: item.id,
        caption: item.caption,
        media_type: item.media_type,
        media_url: item.media_url,
        permalink: item.permalink,
        thumbnail_url: item.thumbnail_url,
        timestamp: item.timestamp,
        username: item.username,
        like_count: item.like_count,
        comments_count: item.comments_count,
        hashtags: this.extractHashtags(item.caption),
        mentions: this.extractMentions(item.caption),
        location: item.location
      }));
    } catch (error) {
      console.error('Error fetching recent media:', error);
      throw error;
    }
  }

  async searchHashtags(query: string): Promise<InstagramHashtag[]> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/ig_hashtag_search?user_id=${this.businessAccountId}&q=${encodeURIComponent(query)}&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Instagram API error: ${data.error.message}`);
      }

      return data.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        media_count: item.media_count
      }));
    } catch (error) {
      console.error('Error searching hashtags:', error);
      throw error;
    }
  }

  async getMediaByHashtag(hashtagId: string, limit: number = 25): Promise<InstagramMedia[]> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${hashtagId}/recent_media?user_id=${this.businessAccountId}&fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count&limit=${limit}&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Instagram API error: ${data.error.message}`);
      }

      return data.data.map((item: any) => ({
        id: item.id,
        caption: item.caption,
        media_type: item.media_type,
        media_url: item.media_url,
        permalink: item.permalink,
        thumbnail_url: item.thumbnail_url,
        timestamp: item.timestamp,
        like_count: item.like_count,
        comments_count: item.comments_count,
        hashtags: this.extractHashtags(item.caption),
        mentions: this.extractMentions(item.caption)
      }));
    } catch (error) {
      console.error('Error fetching media by hashtag:', error);
      throw error;
    }
  }

  async getMediaInsights(mediaId: string): Promise<any> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${mediaId}/insights?metric=engagement,impressions,reach,saved&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Instagram API error: ${data.error.message}`);
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching media insights:', error);
      throw error;
    }
  }

  async saveMediaToUGC(media: InstagramMedia, tags: string[] = [], status: 'pending' | 'approved' | 'rejected' = 'pending'): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('ugc_content')
        .insert({
          platform: 'instagram',
          platform_content_id: media.id,
          content_type: media.media_type || 'unknown',
          content_url: media.media_url,
          thumbnail_url: media.thumbnail_url,
          permalink: media.permalink,
          caption: media.caption,
          username: media.username,
          hashtags: media.hashtags || [],
          mentions: media.mentions || [],
          engagement_metrics: {
            likes: media.like_count || 0,
            comments: media.comments_count || 0
          },
          location: media.location,
          posted_at: media.timestamp,
          tags: tags,
          status: status,
          source: 'instagram_api'
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving media to UGC:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error saving media to UGC:', error);
      throw error;
    }
  }

  async bulkImportMedia(mediaList: InstagramMedia[], tags: string[] = [], status: 'pending' | 'approved' | 'rejected' = 'pending'): Promise<any[]> {
    try {
      const ugcData = mediaList.map(media => ({
        platform: 'instagram',
        platform_content_id: media.id,
        content_type: media.media_type || 'unknown',
        content_url: media.media_url,
        thumbnail_url: media.thumbnail_url,
        permalink: media.permalink,
        caption: media.caption,
        username: media.username,
        hashtags: media.hashtags || [],
        mentions: media.mentions || [],
        engagement_metrics: {
          likes: media.like_count || 0,
          comments: media.comments_count || 0
        },
        location: media.location,
        posted_at: media.timestamp,
        tags: tags,
        status: status,
        source: 'instagram_api'
      }));

      const { data, error } = await supabase
        .from('ugc_content')
        .insert(ugcData)
        .select();

      if (error) {
        console.error('Error bulk importing media:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error bulk importing media:', error);
      throw error;
    }
  }

  private extractHashtags(caption: string): string[] {
    if (!caption) return [];
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    return caption.match(hashtagRegex) || [];
  }

  private extractMentions(caption: string): string[] {
    if (!caption) return [];
    const mentionRegex = /@[\w.]+/g;
    return caption.match(mentionRegex) || [];
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getBusinessAccountInfo();
      return true;
    } catch (error) {
      console.error('Instagram connection test failed:', error);
      return false;
    }
  }
}

export const instagramService = new InstagramService();
