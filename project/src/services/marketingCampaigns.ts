// Marketing Campaigns Service
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Helper function for Supabase Edge Functions
const supabaseCall = async (functionName: string, options: RequestInit = {}) => {
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
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

export interface Campaign {
  id: string;
  name: string;
  description: string;
  platform: string;
  type: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: number;
  start_date: string;
  end_date: string;
  target_audience: any;
  content_ids: string[];
  goals: any;
  created_at: string;
  updated_at: string;
}

export interface CampaignPerformance {
  campaign_id: string;
  period: {
    start: string;
    end: string;
  };
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    revenue: number;
    ctr: string;
    cpc: string;
    roas: string;
  };
  platform_breakdown: any;
  content_performance: any[];
}

export interface OptimizationRecommendation {
  type: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  estimated_improvement: string;
}

export class MarketingCampaignsService {
  // Create Campaign
  async createCampaign(campaignData: Partial<Campaign>): Promise<{ success: boolean; campaign?: Campaign; message?: string; error?: string }> {
    try {
      return await supabaseCall('marketing-campaigns', {
        method: 'POST',
        body: JSON.stringify({ action: 'create_campaign', campaignData })
      });
    } catch (error) {
      console.error('Failed to create campaign:', error);
      return { success: false, error: 'Failed to create campaign' };
    }
  }

  // Get All Campaigns
  async getCampaigns(): Promise<{ success: boolean; campaigns?: Campaign[]; total?: number; error?: string }> {
    try {
      return await supabaseCall('marketing-campaigns', {
        method: 'POST',
        body: JSON.stringify({ action: 'get_campaigns' })
      });
    } catch (error) {
      console.error('Failed to get campaigns:', error);
      return { success: false, error: 'Failed to get campaigns' };
    }
  }

  // Get Single Campaign
  async getCampaign(campaignId: string): Promise<{ success: boolean; campaign?: Campaign; error?: string }> {
    try {
      return await supabaseCall('marketing-campaigns', {
        method: 'POST',
        body: JSON.stringify({ action: 'get_campaign', campaignId })
      });
    } catch (error) {
      console.error('Failed to get campaign:', error);
      return { success: false, error: 'Failed to get campaign' };
    }
  }

  // Update Campaign
  async updateCampaign(campaignId: string, campaignData: Partial<Campaign>): Promise<{ success: boolean; campaign?: Campaign; message?: string; error?: string }> {
    try {
      return await supabaseCall('marketing-campaigns', {
        method: 'POST',
        body: JSON.stringify({ action: 'update_campaign', campaignId, campaignData })
      });
    } catch (error) {
      console.error('Failed to update campaign:', error);
      return { success: false, error: 'Failed to update campaign' };
    }
  }

  // Get Campaign Performance
  async getCampaignPerformance(campaignId: string, dateFrom?: string, dateTo?: string): Promise<{ success: boolean; performance?: CampaignPerformance; error?: string }> {
    try {
      return await supabaseCall('marketing-campaigns', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'get_performance', 
          campaignId, 
          dateFrom: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: dateTo || new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to get campaign performance:', error);
      return { success: false, error: 'Failed to get campaign performance' };
    }
  }

  // Optimize Campaign
  async optimizeCampaign(campaignId: string): Promise<{ 
    success: boolean; 
    optimization?: {
      recommendations: OptimizationRecommendation[];
      automated_actions: any[];
    }; 
    message?: string; 
    error?: string 
  }> {
    try {
      return await supabaseCall('marketing-campaigns', {
        method: 'POST',
        body: JSON.stringify({ action: 'optimize_campaign', campaignId })
      });
    } catch (error) {
      console.error('Failed to optimize campaign:', error);
      return { success: false, error: 'Failed to optimize campaign' };
    }
  }

  // Get Campaign Analytics Summary
  async getCampaignAnalytics(): Promise<{ 
    success: boolean; 
    analytics?: {
      total_campaigns: number;
      active_campaigns: number;
      total_spend: number;
      total_revenue: number;
      average_roas: number;
      top_performing_campaign: string;
    }; 
    error?: string 
  }> {
    try {
      const campaigns = await this.getCampaigns();
      
      if (!campaigns.success || !campaigns.campaigns) {
        return { success: false, error: 'Failed to fetch campaigns' };
      }

      const activeCampaigns = campaigns.campaigns.filter(c => c.status === 'active');
      const totalSpend = campaigns.campaigns.reduce((sum, c) => sum + c.budget, 0);
      
      // Mock analytics - replace with real calculations
      const analytics = {
        total_campaigns: campaigns.campaigns.length,
        active_campaigns: activeCampaigns.length,
        total_spend: totalSpend,
        total_revenue: totalSpend * 2.5, // Mock 2.5x ROAS
        average_roas: 2.5,
        top_performing_campaign: campaigns.campaigns[0]?.name || 'No campaigns'
      };

      return { success: true, analytics };
    } catch (error) {
      console.error('Failed to get campaign analytics:', error);
      return { success: false, error: 'Failed to get campaign analytics' };
    }
  }
}

export const marketingCampaignsService = new MarketingCampaignsService(); 