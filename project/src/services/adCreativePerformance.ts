import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export interface AdCreative {
  id: number;
  creative_name: string;
  platform: 'tiktok' | 'meta' | 'google';
  spend: number;
  conversions: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  cost_per_conversion: number;
  status: 'active' | 'paused' | 'completed';
  created_at: string;
  alerted_low_performance: boolean;
  campaign_id?: number;
  campaign_name?: string;
  image_url?: string;
  video_url?: string;
  target_audience?: string;
  ad_copy?: string;
}

export interface PlatformSummary {
  platform: string;
  total_spend: number;
  total_conversions: number;
  avg_cost_per_conversion: number;
  total_impressions: number;
  avg_ctr: number;
  top_performers: number;
  wasted_spend: number;
  total_clicks: number;
  avg_cpc: number;
  avg_cpm: number;
}

export interface PerformanceMetrics {
  total_creatives: number;
  active_creatives: number;
  total_spend: number;
  total_conversions: number;
  avg_cost_per_conversion: number;
  total_impressions: number;
  total_clicks: number;
  avg_ctr: number;
  avg_cpc: number;
  avg_cpm: number;
}

class AdCreativePerformanceService {
  /**
   * Fetch all ad creatives with performance data
   */
  async getAdCreatives(): Promise<AdCreative[]> {
    try {
      const { data, error } = await supabase
        .from('ad_creatives')
        .select(`
          *,
          campaigns:campaign_id (
            name,
            platform
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(creative => ({
        ...creative,
        campaign_name: creative.campaigns?.name,
        platform: creative.campaigns?.platform || creative.platform
      })) || [];
    } catch (error) {
      console.error('Error fetching ad creatives:', error);
      return [];
    }
  }

  /**
   * Fetch ad creatives by platform
   */
  async getAdCreativesByPlatform(platform: string): Promise<AdCreative[]> {
    try {
      const { data, error } = await supabase
        .from('ad_creatives')
        .select(`
          *,
          campaigns:campaign_id (
            name,
            platform
          )
        `)
        .eq('platform', platform)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error(`Error fetching ${platform} ad creatives:`, error);
      return [];
    }
  }

  /**
   * Get platform performance summaries
   */
  async getPlatformSummaries(): Promise<PlatformSummary[]> {
    try {
      const creatives = await this.getAdCreatives();
      const platforms = ['tiktok', 'meta', 'google'];
      
      return platforms.map(platform => {
        const platformCreatives = creatives.filter(c => c.platform === platform);
        const totalSpend = platformCreatives.reduce((sum, c) => sum + c.spend, 0);
        const totalConversions = platformCreatives.reduce((sum, c) => sum + c.conversions, 0);
        const totalImpressions = platformCreatives.reduce((sum, c) => sum + c.impressions, 0);
        const totalClicks = platformCreatives.reduce((sum, c) => sum + c.clicks, 0);
        
        const avgCtr = platformCreatives.length > 0 
          ? platformCreatives.reduce((sum, c) => sum + c.ctr, 0) / platformCreatives.length 
          : 0;
        
        const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
        const avgCpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
        
        const topPerformers = platformCreatives.filter(c => c.conversions > 0).length;
        const wastedSpend = platformCreatives.filter(c => c.conversions === 0).length;
        
        return {
          platform,
          total_spend: totalSpend,
          total_conversions: totalConversions,
          avg_cost_per_conversion: totalConversions > 0 ? totalSpend / totalConversions : 0,
          total_impressions: totalImpressions,
          avg_ctr: avgCtr,
          top_performers: topPerformers,
          wasted_spend: wastedSpend,
          total_clicks: totalClicks,
          avg_cpc: avgCpc,
          avg_cpm: avgCpm
        };
      });
    } catch (error) {
      console.error('Error calculating platform summaries:', error);
      return [];
    }
  }

  /**
   * Get overall performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const creatives = await this.getAdCreatives();
      
      const totalCreatives = creatives.length;
      const activeCreatives = creatives.filter(c => c.status === 'active').length;
      const totalSpend = creatives.reduce((sum, c) => sum + c.spend, 0);
      const totalConversions = creatives.reduce((sum, c) => sum + c.conversions, 0);
      const totalImpressions = creatives.reduce((sum, c) => sum + c.impressions, 0);
      const totalClicks = creatives.reduce((sum, c) => sum + c.clicks, 0);
      
      const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
      const avgCpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
      
      return {
        total_creatives: totalCreatives,
        active_creatives: activeCreatives,
        total_spend: totalSpend,
        total_conversions: totalConversions,
        avg_cost_per_conversion: totalConversions > 0 ? totalSpend / totalConversions : 0,
        total_impressions: totalImpressions,
        total_clicks: totalClicks,
        avg_ctr: avgCtr,
        avg_cpc: avgCpc,
        avg_cpm: avgCpm
      };
    } catch (error) {
      console.error('Error calculating performance metrics:', error);
      return {
        total_creatives: 0,
        active_creatives: 0,
        total_spend: 0,
        total_conversions: 0,
        avg_cost_per_conversion: 0,
        total_impressions: 0,
        total_clicks: 0,
        avg_ctr: 0,
        avg_cpc: 0,
        avg_cpm: 0
      };
    }
  }

  /**
   * Get top performing creatives
   */
  async getTopPerformers(limit: number = 5): Promise<AdCreative[]> {
    try {
      const creatives = await this.getAdCreatives();
      return creatives
        .filter(c => c.conversions > 0)
        .sort((a, b) => a.cost_per_conversion - b.cost_per_conversion)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching top performers:', error);
      return [];
    }
  }

  /**
   * Get creatives with wasted spend (no conversions)
   */
  async getWastedSpendCreatives(spendThreshold: number = 50): Promise<AdCreative[]> {
    try {
      const creatives = await this.getAdCreatives();
      return creatives
        .filter(c => c.conversions === 0 && c.spend >= spendThreshold)
        .sort((a, b) => b.spend - a.spend);
    } catch (error) {
      console.error('Error fetching wasted spend creatives:', error);
      return [];
    }
  }

  /**
   * Update creative performance alert status
   */
  async updateAlertStatus(creativeId: number, alerted: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ad_creatives')
        .update({ alerted_low_performance: alerted })
        .eq('id', creativeId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating alert status:', error);
      return false;
    }
  }

  /**
   * Create a new ad creative
   */
  async createAdCreative(creative: Omit<AdCreative, 'id' | 'created_at'>): Promise<AdCreative | null> {
    try {
      const { data, error } = await supabase
        .from('ad_creatives')
        .insert([creative])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating ad creative:', error);
      return null;
    }
  }

  /**
   * Update an existing ad creative
   */
  async updateAdCreative(id: number, updates: Partial<AdCreative>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ad_creatives')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating ad creative:', error);
      return false;
    }
  }
}

export const adCreativePerformanceService = new AdCreativePerformanceService(); 