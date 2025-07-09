import { supabase } from '../lib/supabase';
import { instagramService, type InstagramMedia } from './instagramService';
import { tiktokService, type TikTokVideo } from './tiktokService';

// UGC Content Types
export interface UGCContent {
  id: string;
  platform: 'instagram' | 'facebook' | 'tiktok' | 'twitter' | 'youtube' | 'manual';
  platform_content_id?: string;
  content_type: 'image' | 'video' | 'carousel' | 'story' | 'reel' | 'post';
  content_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  caption?: string;
  username?: string;
  hashtags: string[];
  mentions: string[];
  engagement_metrics: {
    likes: number;
    comments: number;
    shares?: number;
    views?: number;
    saves?: number;
  };
  location?: {
    id: string;
    name: string;
    latitude?: number;
    longitude?: number;
  };
  posted_at?: string;
  tags: string[];
  status: 'pending' | 'approved' | 'rejected' | 'featured';
  source: 'api' | 'manual' | 'instagram_api' | 'facebook_api' | 'tiktok_api';
  brand_mentions: string[];
  sentiment_score?: number;
  quality_score?: number;
  created_at: string;
  updated_at: string;
}

export interface UGCCampaign {
  id: string;
  name: string;
  description: string;
  hashtags: string[];
  platforms: string[];
  start_date: string;
  end_date?: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  target_metrics: {
    total_posts: number;
    total_engagement: number;
    total_reach: number;
  };
  actual_metrics: {
    total_posts: number;
    total_engagement: number;
    total_reach: number;
  };
  created_at: string;
  updated_at: string;
}

export interface UGCInfluencer {
  id: string;
  username: string;
  platform: string;
  followers_count: number;
  engagement_rate: number;
  content_count: number;
  tags: string[];
  contact_info?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface UGCAnalytics {
  total_content: number;
  approved_content: number;
  pending_content: number;
  rejected_content: number;
  total_engagement: number;
  average_engagement_rate: number;
  top_platforms: { platform: string; count: number }[];
  top_hashtags: { hashtag: string; count: number }[];
  engagement_trend: { date: string; engagement: number }[];
  content_by_status: { status: string; count: number }[];
}

export interface UGCEdit {
  id: string;
  content_id: string;
  edit_type: 'auto' | 'manual';
  changes: {
    crop?: { x: number; y: number; width: number; height: number };
    filter?: string;
    brightness?: number;
    contrast?: number;
    saturation?: number;
    text_overlay?: {
      text: string;
      position: { x: number; y: number };
      font: string;
      color: string;
      size: number;
    };
    logo_placement?: {
      logo_url: string;
      position: { x: number; y: number };
      size: number;
      opacity: number;
    };
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  output_url?: string;
  created_at: string;
  completed_at?: string;
}

export interface UGCVoiceover {
  id: string;
  content_id: string;
  voice_type: 'male' | 'female' | 'neutral' | 'energetic' | 'calm';
  language: string;
  script: string;
  audio_url?: string;
  duration?: number;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

export interface UGCHotspot {
  id: string;
  content_id: string;
  hotspot_type: 'product' | 'link' | 'info' | 'cta';
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: {
    product_id?: string;
    product_name?: string;
    product_price?: number;
    product_url?: string;
    link_url?: string;
    title?: string;
    description?: string;
    cta_text?: string;
  };
  created_at: string;
}

export interface UGCInboxItem {
  id: string;
  content: UGCContent;
  edits: UGCEdit[];
  voiceovers: UGCVoiceover[];
  hotspots: UGCHotspot[];
  status: 'new' | 'reviewed' | 'approved' | 'rejected' | 'published';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Social Listening Crawler
class SocialListeningCrawler {
  private platforms = {
    instagram: {
      apiEndpoint: 'https://graph.instagram.com/v12.0',
      searchEndpoint: '/ig_hashtag_search',
      mediaEndpoint: '/ig_hashtag_media'
    },
    tiktok: {
      apiEndpoint: 'https://open.tiktokapis.com/v2',
      searchEndpoint: '/video/query/',
      hashtagEndpoint: '/hashtag/search/'
    },
    youtube: {
      apiEndpoint: 'https://www.googleapis.com/youtube/v3',
      searchEndpoint: '/search',
      videoEndpoint: '/videos'
    },
    twitter: {
      apiEndpoint: 'https://api.twitter.com/2',
      searchEndpoint: '/tweets/search/recent',
      userEndpoint: '/users'
    }
  };

  async crawlPlatform(platform: string, hashtags: string[], brandKeywords: string[]): Promise<UGCContent[]> {
    try {
      console.log(`Crawling ${platform} for hashtags: ${hashtags.join(', ')}`);
      
      const discoveredContent: UGCContent[] = [];
      
      for (const hashtag of hashtags) {
        const content = await this.searchByHashtag(platform, hashtag, brandKeywords);
        discoveredContent.push(...content);
      }
      
      // Remove duplicates based on content URL
      const uniqueContent = discoveredContent.filter((content, index, self) => 
        index === self.findIndex(c => c.content_url === content.content_url)
      );
      
      console.log(`Discovered ${uniqueContent.length} unique pieces of content from ${platform}`);
      return uniqueContent;
    } catch (error) {
      console.error(`Error crawling ${platform}:`, error);
      return [];
    }
  }

  private async searchByHashtag(platform: string, hashtag: string, brandKeywords: string[]): Promise<UGCContent[]> {
    // Simulated API calls - replace with actual platform APIs
    const mockContent: UGCContent[] = [
      {
        id: `mock_${platform}_${hashtag}_1`,
        platform: platform as any,
        content_type: 'video',
        author: {
          username: `user_${Math.floor(Math.random() * 1000)}`,
          followers: Math.floor(Math.random() * 100000),
          verified: Math.random() > 0.8
        },
        content: {
          url: `https://${platform}.com/mock_content_1`,
          thumbnail_url: `https://picsum.photos/300/400?random=${Math.random()}`,
          duration: Math.floor(Math.random() * 60) + 15,
          caption: `Amazing product! #${hashtag} ${brandKeywords.join(' ')}`,
          hashtags: [hashtag, ...brandKeywords],
          mentions: [],
          location: 'New York, NY'
        },
        engagement: {
          likes: Math.floor(Math.random() * 10000),
          comments: Math.floor(Math.random() * 500),
          shares: Math.floor(Math.random() * 1000),
          views: Math.floor(Math.random() * 100000),
          reach: Math.floor(Math.random() * 500000)
        },
        rights_status: 'pending',
        brand_tags: brandKeywords,
        sentiment_score: Math.random() * 2 - 1, // -1 to 1
        quality_score: Math.random() * 10, // 0 to 10
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        discovered_at: new Date().toISOString()
      }
    ];

    return mockContent;
  }
}

// Rights Management API
class RightsManagementAPI {
  async requestRights(contentId: string, brandId: string, terms: any): Promise<{ success: boolean; message: string }> {
    try {
      // Simulate rights request process
      console.log(`Requesting rights for content ${contentId} from brand ${brandId}`);
      
      // Store rights request in database
      const { error } = await supabase
        .from('ugc_rights_requests')
        .insert({
          content_id: contentId,
          brand_id: brandId,
          terms: terms,
          status: 'pending',
          requested_at: new Date().toISOString()
        });

      if (error) throw error;

      return {
        success: true,
        message: 'Rights request submitted successfully. You will be notified when the creator responds.'
      };
    } catch (error) {
      console.error('Error requesting rights:', error);
      return {
        success: false,
        message: 'Failed to submit rights request. Please try again.'
      };
    }
  }

  async checkRightsStatus(contentId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('ugc_rights_requests')
        .select('status')
        .eq('content_id', contentId)
        .single();

      if (error) throw error;
      return data?.status || 'pending';
    } catch (error) {
      console.error('Error checking rights status:', error);
      return 'pending';
    }
  }

  async approveRights(contentId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('ugc_rights_requests')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('content_id', contentId);

      if (error) throw error;

      return {
        success: true,
        message: 'Rights approved successfully'
      };
    } catch (error) {
      console.error('Error approving rights:', error);
      return {
        success: false,
        message: 'Failed to approve rights'
      };
    }
  }
}

// Auto-Editing Pipeline
class AutoEditingPipeline {
  async autoEdit(content: UGCContent, brandGuidelines: any): Promise<UGCEdit> {
    try {
      console.log(`Starting auto-edit for content ${content.id}`);

      // Create edit record
      const edit: Omit<UGCEdit, 'id' | 'created_at'> = {
        content_id: content.id,
        edit_type: 'auto',
        changes: this.generateAutoEdits(content, brandGuidelines),
        status: 'processing'
      };

      // Save to database
      const { data, error } = await supabase
        .from('ugc_edits')
        .insert({
          ...edit,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Simulate processing time
      setTimeout(async () => {
        await this.completeEdit(data.id);
      }, 2000);

      return data;
    } catch (error) {
      console.error('Error in auto-edit:', error);
      throw error;
    }
  }

  private generateAutoEdits(content: UGCContent, brandGuidelines: any): UGCEdit['changes'] {
    const changes: UGCEdit['changes'] = {};

    // Auto-crop to square if needed
    if (content.content_type === 'image' || content.content_type === 'video') {
      changes.crop = { x: 0, y: 0, width: 1080, height: 1080 };
    }

    // Apply brand filter
    if (brandGuidelines?.filter) {
      changes.filter = brandGuidelines.filter;
    }

    // Adjust brightness/contrast
    changes.brightness = 1.1;
    changes.contrast = 1.05;
    changes.saturation = 1.1;

    // Add brand logo if specified
    if (brandGuidelines?.logo) {
      changes.logo_placement = {
        logo_url: brandGuidelines.logo,
        position: { x: 20, y: 20 },
        size: 60,
        opacity: 0.8
      };
    }

    return changes;
  }

  private async completeEdit(editId: string): Promise<void> {
    try {
      const outputUrl = `https://processed-content.com/${editId}.mp4`;
      
      const { error } = await supabase
        .from('ugc_edits')
        .update({
          status: 'completed',
          output_url: outputUrl,
          completed_at: new Date().toISOString()
        })
        .eq('id', editId);

      if (error) throw error;
      console.log(`Auto-edit completed for ${editId}`);
    } catch (error) {
      console.error('Error completing edit:', error);
    }
  }
}

// AI Voiceover Service
class AIVoiceoverService {
  private voiceTypes = {
    male: { voice_id: 'voice_male_1', speed: 1.0, pitch: 0 },
    female: { voice_id: 'voice_female_1', speed: 1.0, pitch: 0 },
    neutral: { voice_id: 'voice_neutral_1', speed: 1.0, pitch: 0 },
    energetic: { voice_id: 'voice_energetic_1', speed: 1.1, pitch: 2 },
    calm: { voice_id: 'voice_calm_1', speed: 0.9, pitch: -1 }
  };

  async generateVoiceover(contentId: string, script: string, voiceType: string = 'neutral', language: string = 'en'): Promise<UGCVoiceover> {
    try {
      console.log(`Generating voiceover for content ${contentId}`);

      // Create voiceover record
      const voiceover: Omit<UGCVoiceover, 'id' | 'created_at'> = {
        content_id: contentId,
        voice_type: voiceType as any,
        language,
        script,
        status: 'generating'
      };

      // Save to database
      const { data, error } = await supabase
        .from('ugc_voiceovers')
        .insert({
          ...voiceover,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Simulate AI voiceover generation
      setTimeout(async () => {
        await this.completeVoiceover(data.id, script);
      }, 3000);

      return data;
    } catch (error) {
      console.error('Error generating voiceover:', error);
      throw error;
    }
  }

  private async completeVoiceover(voiceoverId: string, script: string): Promise<void> {
    try {
      const audioUrl = `https://voiceover-service.com/${voiceoverId}.mp3`;
      const duration = script.length * 0.06; // Rough estimate: 60ms per character

      const { error } = await supabase
        .from('ugc_voiceovers')
        .update({
          status: 'completed',
          audio_url: audioUrl,
          duration,
          completed_at: new Date().toISOString()
        })
        .eq('id', voiceoverId);

      if (error) throw error;
      console.log(`Voiceover completed for ${voiceoverId}`);
    } catch (error) {
      console.error('Error completing voiceover:', error);
    }
  }

  async generateScript(content: UGCContent, brandGuidelines: any): Promise<string> {
    // AI-powered script generation based on content and brand guidelines
    const baseScript = `Check out this amazing content! ${content.content.caption || 'Incredible product showcase.'} Don't miss out on this opportunity!`;
    
    if (brandGuidelines?.tone) {
      // Adjust tone based on brand guidelines
      return this.adjustTone(baseScript, brandGuidelines.tone);
    }
    
    return baseScript;
  }

  private adjustTone(script: string, tone: string): string {
    switch (tone) {
      case 'professional':
        return script.replace('Check out', 'Discover').replace('Don\'t miss out', 'Explore');
      case 'casual':
        return script.replace('Check out', 'Hey, check out').replace('Don\'t miss out', 'You gotta see this');
      case 'luxury':
        return script.replace('Check out', 'Experience').replace('Don\'t miss out', 'Indulge in');
      default:
        return script;
    }
  }
}

// Hotspot Generator
class HotspotGenerator {
  async generateHotspots(contentId: string, products: any[]): Promise<UGCHotspot[]> {
    try {
      console.log(`Generating hotspots for content ${contentId}`);

      const hotspots: Omit<UGCHotspot, 'id' | 'created_at'>[] = [];

      // Generate product hotspots
      for (let i = 0; i < Math.min(products.length, 3); i++) {
        const product = products[i];
        const hotspot: Omit<UGCHotspot, 'id' | 'created_at'> = {
          content_id: contentId,
          hotspot_type: 'product',
          position: {
            x: 200 + (i * 200),
            y: 300 + (i * 100)
          },
          size: { width: 120, height: 80 },
          data: {
            product_id: product.id,
            product_name: product.name,
            product_price: product.price,
            product_url: product.url
          }
        };
        hotspots.push(hotspot);
      }

      // Add CTA hotspot
      hotspots.push({
        content_id: contentId,
        hotspot_type: 'cta',
        position: { x: 400, y: 500 },
        size: { width: 150, height: 50 },
        data: {
          title: 'Shop Now',
          description: 'Click to explore products',
          cta_text: 'Shop Now'
        }
      });

      // Save to database
      const { data, error } = await supabase
        .from('ugc_hotspots')
        .insert(
          hotspots.map(hotspot => ({
            ...hotspot,
            created_at: new Date().toISOString()
          }))
        )
        .select();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error generating hotspots:', error);
      throw error;
    }
  }

  async detectProducts(content: UGCContent): Promise<any[]> {
    // AI-powered product detection
    // This would integrate with computer vision APIs
    const mockProducts = [
      { id: 'prod_1', name: 'Premium T-Shirt', price: 29.99, url: '/product/premium-tshirt' },
      { id: 'prod_2', name: 'Designer Jeans', price: 89.99, url: '/product/designer-jeans' },
      { id: 'prod_3', name: 'Sneakers', price: 129.99, url: '/product/sneakers' }
    ];

    return mockProducts;
  }
}

// Main UGC Service
export class UGCService {
  private crawler = new SocialListeningCrawler();
  private rightsAPI = new RightsManagementAPI();
  private editingPipeline = new AutoEditingPipeline();
  private voiceoverService = new AIVoiceoverService();
  private hotspotGenerator = new HotspotGenerator();

  // Instagram Integration Methods
  async importFromInstagram(limit: number = 25, tags: string[] = [], status: 'pending' | 'approved' | 'rejected' = 'pending'): Promise<UGCContent[]> {
    try {
      const media = await instagramService.getRecentMedia(limit);
      const importedContent = await instagramService.bulkImportMedia(media, tags, status);
      
      // Convert to UGCContent format
      return importedContent.map((item: any) => ({
        id: item.id,
        platform: 'instagram',
        platform_content_id: item.platform_content_id,
        content_type: item.content_type,
        content_url: item.content_url,
        thumbnail_url: item.thumbnail_url,
        permalink: item.permalink,
        caption: item.caption,
        username: item.username,
        hashtags: item.hashtags,
        mentions: item.mentions,
        engagement_metrics: item.engagement_metrics,
        location: item.location,
        posted_at: item.posted_at,
        tags: item.tags,
        status: item.status,
        source: 'instagram_api',
        brand_mentions: this.extractBrandMentions(item.caption || ''),
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
    } catch (error) {
      console.error('Error importing from Instagram:', error);
      throw error;
    }
  }

  async searchInstagramHashtags(query: string): Promise<any[]> {
    try {
      return await instagramService.searchHashtags(query);
    } catch (error) {
      console.error('Error searching Instagram hashtags:', error);
      throw error;
    }
  }

  async importFromInstagramHashtag(hashtagId: string, limit: number = 25, tags: string[] = []): Promise<UGCContent[]> {
    try {
      const media = await instagramService.getMediaByHashtag(hashtagId, limit);
      const importedContent = await instagramService.bulkImportMedia(media, tags, 'pending');
      
      return importedContent.map((item: any) => ({
        id: item.id,
        platform: 'instagram',
        platform_content_id: item.platform_content_id,
        content_type: item.content_type,
        content_url: item.content_url,
        thumbnail_url: item.thumbnail_url,
        permalink: item.permalink,
        caption: item.caption,
        username: item.username,
        hashtags: item.hashtags,
        mentions: item.mentions,
        engagement_metrics: item.engagement_metrics,
        location: item.location,
        posted_at: item.posted_at,
        tags: item.tags,
        status: item.status,
        source: 'instagram_api',
        brand_mentions: this.extractBrandMentions(item.caption || ''),
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
    } catch (error) {
      console.error('Error importing from Instagram hashtag:', error);
      throw error;
    }
  }

  // TikTok Integration Methods
  async importFromTikTok(limit: number = 25, tags: string[] = [], status: 'pending' | 'approved' | 'rejected' = 'pending'): Promise<UGCContent[]> {
    try {
      // Get trending videos as default import
      const videos = await tiktokService.getTrendingVideos('US', limit);
      const importedContent = await tiktokService.bulkImportVideos(videos, tags, status);
      
      // Convert to UGCContent format
      return importedContent.map((item: any) => ({
        id: item.id,
        platform: 'tiktok',
        platform_content_id: item.platform_content_id,
        content_type: 'video',
        content_url: item.content_url,
        thumbnail_url: item.thumbnail_url,
        caption: item.caption,
        username: item.username,
        hashtags: item.hashtags,
        mentions: item.mentions,
        engagement_metrics: item.engagement_metrics,
        location: item.location,
        posted_at: item.posted_at,
        tags: item.tags,
        status: item.status,
        source: 'tiktok_api',
        brand_mentions: this.extractBrandMentions(item.caption || ''),
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
    } catch (error) {
      console.error('Error importing from TikTok:', error);
      throw error;
    }
  }

  async searchTikTokHashtags(query: string): Promise<any[]> {
    try {
      return await tiktokService.searchHashtags(query);
    } catch (error) {
      console.error('Error searching TikTok hashtags:', error);
      throw error;
    }
  }

  async importFromTikTokHashtag(hashtag: string, limit: number = 25, tags: string[] = []): Promise<UGCContent[]> {
    try {
      const videos = await tiktokService.searchVideosByHashtag(hashtag, limit);
      const importedContent = await tiktokService.bulkImportVideos(videos, tags, 'pending');
      
      return importedContent.map((item: any) => ({
        id: item.id,
        platform: 'tiktok',
        platform_content_id: item.platform_content_id,
        content_type: 'video',
        content_url: item.content_url,
        thumbnail_url: item.thumbnail_url,
        caption: item.caption,
        username: item.username,
        hashtags: item.hashtags,
        mentions: item.mentions,
        engagement_metrics: item.engagement_metrics,
        location: item.location,
        posted_at: item.posted_at,
        tags: item.tags,
        status: item.status,
        source: 'tiktok_api',
        brand_mentions: this.extractBrandMentions(item.caption || ''),
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
    } catch (error) {
      console.error('Error importing from TikTok hashtag:', error);
      throw error;
    }
  }

  async getTikTokTrendingVideos(region: string = 'US', limit: number = 20): Promise<UGCContent[]> {
    try {
      const videos = await tiktokService.getTrendingVideos(region, limit);
      const importedContent = await tiktokService.bulkImportVideos(videos, [], 'pending');
      
      return importedContent.map((item: any) => ({
        id: item.id,
        platform: 'tiktok',
        platform_content_id: item.platform_content_id,
        content_type: 'video',
        content_url: item.content_url,
        thumbnail_url: item.thumbnail_url,
        caption: item.caption,
        username: item.username,
        hashtags: item.hashtags,
        mentions: item.mentions,
        engagement_metrics: item.engagement_metrics,
        location: item.location,
        posted_at: item.posted_at,
        tags: item.tags,
        status: item.status,
        source: 'tiktok_api',
        brand_mentions: this.extractBrandMentions(item.caption || ''),
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
    } catch (error) {
      console.error('Error getting TikTok trending videos:', error);
      throw error;
    }
  }

  async discoverTikTokContent(hashtags: string[], keywords: string[], limit: number = 50): Promise<UGCContent[]> {
    try {
      const videos = await tiktokService.discoverContent(hashtags, keywords, limit);
      const importedContent = await tiktokService.bulkImportVideos(videos, [], 'pending');
      
      return importedContent.map((item: any) => ({
        id: item.id,
        platform: 'tiktok',
        platform_content_id: item.platform_content_id,
        content_type: 'video',
        content_url: item.content_url,
        thumbnail_url: item.thumbnail_url,
        caption: item.caption,
        username: item.username,
        hashtags: item.hashtags,
        mentions: item.mentions,
        engagement_metrics: item.engagement_metrics,
        location: item.location,
        posted_at: item.posted_at,
        tags: item.tags,
        status: item.status,
        source: 'tiktok_api',
        brand_mentions: this.extractBrandMentions(item.caption || ''),
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
    } catch (error) {
      console.error('Error discovering TikTok content:', error);
      throw error;
    }
  }

  async testTikTokConnection(): Promise<boolean> {
    try {
      return await tiktokService.testConnection();
    } catch (error) {
      console.error('Error testing TikTok connection:', error);
      return false;
    }
  }

  async setTikTokCredentials(clientKey: string, clientSecret: string, accessToken: string): Promise<void> {
    try {
      tiktokService.setCredentials(clientKey, clientSecret, accessToken);
    } catch (error) {
      console.error('Error setting TikTok credentials:', error);
      throw error;
    }
  }

  // UGC Content Management
  async getUGCContent(filters?: {
    status?: string;
    platform?: string;
    tags?: string[];
    dateFrom?: string;
    dateTo?: string;
  }): Promise<UGCContent[]> {
    try {
      let query = supabase
        .from('ugc_content')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.platform) {
        query = query.eq('platform', filters.platform);
      }
      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching UGC content:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching UGC content:', error);
      throw error;
    }
  }

  async updateUGCContent(id: string, updates: Partial<UGCContent>): Promise<UGCContent> {
    try {
      const { data, error } = await supabase
        .from('ugc_content')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating UGC content:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating UGC content:', error);
      throw error;
    }
  }

  async deleteUGCContent(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ugc_content')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting UGC content:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting UGC content:', error);
      throw error;
    }
  }

  async approveUGCContent(id: string): Promise<UGCContent> {
    return this.updateUGCContent(id, { status: 'approved' });
  }

  async rejectUGCContent(id: string, reason?: string): Promise<UGCContent> {
    return this.updateUGCContent(id, { 
      status: 'rejected',
      tags: reason ? [...(await this.getUGCContent({ id })).tags || [], `rejected: ${reason}`] : []
    });
  }

  async featureUGCContent(id: string): Promise<UGCContent> {
    return this.updateUGCContent(id, { status: 'featured' });
  }

  // UGC Campaign Management
  async createUGCCampaign(campaign: Omit<UGCCampaign, 'id' | 'created_at' | 'updated_at'>): Promise<UGCCampaign> {
    try {
      const { data, error } = await supabase
        .from('ugc_campaigns')
        .insert({
          ...campaign,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating UGC campaign:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating UGC campaign:', error);
      throw error;
    }
  }

  async getUGCCampaigns(): Promise<UGCCampaign[]> {
    try {
      const { data, error } = await supabase
        .from('ugc_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching UGC campaigns:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching UGC campaigns:', error);
      throw error;
    }
  }

  async updateUGCCampaign(id: string, updates: Partial<UGCCampaign>): Promise<UGCCampaign> {
    try {
      const { data, error } = await supabase
        .from('ugc_campaigns')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating UGC campaign:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating UGC campaign:', error);
      throw error;
    }
  }

  // UGC Analytics
  async getUGCAnalytics(dateFrom?: string, dateTo?: string): Promise<UGCAnalytics> {
    try {
      let query = supabase.from('ugc_content').select('*');
      
      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching UGC analytics data:', error);
        throw error;
      }

      const content = data || [];

      // Calculate analytics
      const total_content = content.length;
      const approved_content = content.filter(c => c.status === 'approved').length;
      const pending_content = content.filter(c => c.status === 'pending').length;
      const rejected_content = content.filter(c => c.status === 'rejected').length;

      const total_engagement = content.reduce((sum, c) => 
        sum + (c.engagement_metrics?.likes || 0) + (c.engagement_metrics?.comments || 0), 0
      );

      const average_engagement_rate = total_content > 0 ? total_engagement / total_content : 0;

      // Top platforms
      const platformCounts = content.reduce((acc, c) => {
        acc[c.platform] = (acc[c.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const top_platforms = Object.entries(platformCounts)
        .map(([platform, count]) => ({ platform, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Top hashtags
      const hashtagCounts = content.reduce((acc, c) => {
        c.hashtags?.forEach(hashtag => {
          acc[hashtag] = (acc[hashtag] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);

      const top_hashtags = Object.entries(hashtagCounts)
        .map(([hashtag, count]) => ({ hashtag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Content by status
      const content_by_status = [
        { status: 'approved', count: approved_content },
        { status: 'pending', count: pending_content },
        { status: 'rejected', count: rejected_content },
        { status: 'featured', count: content.filter(c => c.status === 'featured').length }
      ];

      return {
        total_content,
        approved_content,
        pending_content,
        rejected_content,
        total_engagement,
        average_engagement_rate,
        top_platforms,
        top_hashtags,
        engagement_trend: [], // Would need time-series data for this
        content_by_status
      };
    } catch (error) {
      console.error('Error calculating UGC analytics:', error);
      throw error;
    }
  }

  // Manual UGC Content Creation
  async createManualUGCContent(content: Omit<UGCContent, 'id' | 'created_at' | 'updated_at'>): Promise<UGCContent> {
    try {
      const { data, error } = await supabase
        .from('ugc_content')
        .insert({
          ...content,
          source: 'manual',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating manual UGC content:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating manual UGC content:', error);
      throw error;
    }
  }

  // Utility Methods
  private extractBrandMentions(text: string): string[] {
    // Simple brand mention extraction - could be enhanced with AI
    const brandMentions = [];
    const commonBrands = ['nike', 'adidas', 'apple', 'samsung', 'coca-cola', 'mcdonalds'];
    
    commonBrands.forEach(brand => {
      if (text.toLowerCase().includes(brand)) {
        brandMentions.push(brand);
      }
    });

    return brandMentions;
  }

  // Test Instagram Connection
  async testInstagramConnection(): Promise<boolean> {
    try {
      return await instagramService.testConnection();
    } catch (error) {
      console.error('Error testing Instagram connection:', error);
      return false;
    }
  }

  // Set Instagram Credentials
  async setInstagramCredentials(accessToken: string, businessAccountId: string, pageId: string): Promise<void> {
    try {
      instagramService.setCredentials(accessToken, businessAccountId, pageId);
    } catch (error) {
      console.error('Error setting Instagram credentials:', error);
      throw error;
    }
  }

  // Social Listening
  async discoverContent(hashtags: string[], brandKeywords: string[], platforms: string[] = ['instagram', 'tiktok']): Promise<UGCContent[]> {
    try {
      const allContent: UGCContent[] = [];

      for (const platform of platforms) {
        const content = await this.crawler.crawlPlatform(platform, hashtags, brandKeywords);
        allContent.push(...content);
      }

      // Save discovered content to database
      if (allContent.length > 0) {
        const { error } = await supabase
          .from('ugc_content')
          .insert(allContent);

        if (error) {
          console.error('Error saving discovered content:', error);
        }
      }

      return allContent;
    } catch (error) {
      console.error('Error discovering content:', error);
      return [];
    }
  }

  // Rights Management
  async requestRights(contentId: string, brandId: string, terms: any): Promise<{ success: boolean; message: string }> {
    return this.rightsAPI.requestRights(contentId, brandId, terms);
  }

  async checkRightsStatus(contentId: string): Promise<string> {
    return this.rightsAPI.checkRightsStatus(contentId);
  }

  async approveRights(contentId: string): Promise<{ success: boolean; message: string }> {
    return this.rightsAPI.approveRights(contentId);
  }

  // Auto-Editing
  async autoEdit(contentId: string, brandGuidelines: any): Promise<UGCEdit> {
    const { data: content } = await supabase
      .from('ugc_content')
      .select('*')
      .eq('id', contentId)
      .single();

    if (!content) {
      throw new Error('Content not found');
    }

    return this.editingPipeline.autoEdit(content, brandGuidelines);
  }

  async getEdits(contentId: string): Promise<UGCEdit[]> {
    const { data, error } = await supabase
      .from('ugc_edits')
      .select('*')
      .eq('content_id', contentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Voiceover Generation
  async generateVoiceover(contentId: string, script?: string, voiceType: string = 'neutral'): Promise<UGCVoiceover> {
    if (!script) {
      const { data: content } = await supabase
        .from('ugc_content')
        .select('*')
        .eq('id', contentId)
        .single();

      if (!content) {
        throw new Error('Content not found');
      }

      script = this.voiceoverService.generateScript(content, {});
    }

    return this.voiceoverService.generateVoiceover(contentId, script, voiceType);
  }

  async getVoiceovers(contentId: string): Promise<UGCVoiceover[]> {
    const { data, error } = await supabase
      .from('ugc_voiceovers')
      .select('*')
      .eq('content_id', contentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Hotspot Generation
  async generateHotspots(contentId: string): Promise<UGCHotspot[]> {
    const { data: content } = await supabase
      .from('ugc_content')
      .select('*')
      .eq('id', contentId)
      .single();

    if (!content) {
      throw new Error('Content not found');
    }

    const products = await this.hotspotGenerator.detectProducts(content);
    return this.hotspotGenerator.generateHotspots(contentId, products);
  }

  async getHotspots(contentId: string): Promise<UGCHotspot[]> {
    const { data, error } = await supabase
      .from('ugc_hotspots')
      .select('*')
      .eq('content_id', contentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Inbox Management
  async getInbox(status?: string): Promise<UGCInboxItem[]> {
    let query = supabase
      .from('ugc_inbox')
      .select(`
        *,
        content:ugc_content(*),
        edits:ugc_edits(*),
        voiceovers:ugc_voiceovers(*),
        hotspots:ugc_hotspots(*)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async updateInboxStatus(itemId: string, status: string, notes?: string): Promise<void> {
    const { error } = await supabase
      .from('ugc_inbox')
      .update({
        status,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId);

    if (error) throw error;
  }

  async addToInbox(contentId: string): Promise<void> {
    const { error } = await supabase
      .from('ugc_inbox')
      .insert({
        content_id: contentId,
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  // Analytics
  async getAnalytics(): Promise<any> {
    const { data: content } = await supabase
      .from('ugc_content')
      .select('*');

    const { data: inbox } = await supabase
      .from('ugc_inbox')
      .select('*');

    const { data: edits } = await supabase
      .from('ugc_edits')
      .select('*');

    const { data: voiceovers } = await supabase
      .from('ugc_voiceovers')
      .select('*');

    return {
      totalContent: content?.length || 0,
      totalInboxItems: inbox?.length || 0,
      totalEdits: edits?.length || 0,
      totalVoiceovers: voiceovers?.length || 0,
      contentByPlatform: this.groupByPlatform(content || []),
      contentByStatus: this.groupByStatus(inbox || []),
      recentActivity: this.getRecentActivity(content || [], edits || [], voiceovers || [])
    };
  }

  private groupByPlatform(content: UGCContent[]): Record<string, number> {
    return content.reduce((acc, item) => {
      acc[item.platform] = (acc[item.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupByStatus(inbox: UGCInboxItem[]): Record<string, number> {
    return inbox.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getRecentActivity(content: UGCContent[], edits: UGCEdit[], voiceovers: UGCVoiceover[]): any[] {
    const allActivity = [
      ...content.map(c => ({ type: 'discovered', item: c, date: c.created_at })),
      ...edits.map(e => ({ type: 'edit', item: e, date: e.created_at })),
      ...voiceovers.map(v => ({ type: 'voiceover', item: v, date: v.created_at }))
    ];

    return allActivity
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }
}

// Export singleton instance
export const ugcService = new UGCService(); 