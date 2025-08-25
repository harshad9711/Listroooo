// Advanced Analytics Service
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

export interface PerformanceDashboard {
  period: {
    start: string;
    end: string;
  };
  overview: {
    total_revenue: number;
    total_spend: number;
    total_orders: number;
    total_customers: number;
    average_order_value: number;
    customer_acquisition_cost: number;
    lifetime_value: number;
    conversion_rate: number;
    return_on_ad_spend: number;
  };
  trends: {
    revenue_trend: Array<{ date: string; value: number }>;
    orders_trend: Array<{ date: string; value: number }>;
    customers_trend: Array<{ date: string; value: number }>;
    spend_trend: Array<{ date: string; value: number }>;
  };
  platform_performance: {
    instagram: any;
    tiktok: any;
    facebook: any;
    google: any;
  };
  top_performing_content: any[];
  alerts: any[];
}

export interface ContentAnalytics {
  period: {
    start: string;
    end: string;
  };
  platform: string;
  summary: {
    total_content: number;
    total_engagement: number;
    total_reach: number;
    total_conversions: number;
    average_engagement_rate: number;
    average_reach: number;
    average_conversion_rate: number;
  };
  content_types: any;
  performance_by_time: any;
  hashtag_performance: any[];
  content_quality_score: any;
}

export interface AudienceInsights {
  period: {
    start: string;
    end: string;
  };
  demographics: any;
  interests: any[];
  behavior: any;
  segments: any[];
}

export interface TrendAnalysis {
  period: {
    start: string;
    end: string;
  };
  metrics: string[];
  trends: any;
  seasonality: any;
  anomalies: any[];
}

export interface PredictiveAnalytics {
  period: {
    start: string;
    end: string;
  };
  revenue_forecast: any;
  customer_forecast: any;
  content_performance_prediction: any;
  market_opportunities: any[];
  risk_assessment: any[];
}

export interface ROIAnalysis {
  period: {
    start: string;
    end: string;
  };
  overall_roi: any;
  channel_roi: any;
  campaign_roi: any[];
  customer_roi: any;
  optimization_recommendations: any[];
}

export interface CompetitiveBenchmark {
  period: {
    start: string;
    end: string;
  };
  industry_benchmarks: any;
  your_performance: any;
  competitive_analysis: any;
  market_position: any;
  opportunities: any[];
}

export class AdvancedAnalyticsService {
  // Get Performance Dashboard
  async getPerformanceDashboard(dateFrom?: string, dateTo?: string): Promise<{ success: boolean; dashboard?: PerformanceDashboard; error?: string }> {
    try {
      return await supabaseCall('advanced-analytics', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'performance_dashboard',
          dateFrom: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: dateTo || new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to get performance dashboard:', error);
      return { success: false, error: 'Failed to get performance dashboard' };
    }
  }

  // Get Content Analytics
  async getContentAnalytics(dateFrom?: string, dateTo?: string, platform?: string): Promise<{ success: boolean; analytics?: ContentAnalytics; error?: string }> {
    try {
      return await supabaseCall('advanced-analytics', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'content_analytics',
          dateFrom: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: dateTo || new Date().toISOString(),
          platform: platform || 'all'
        })
      });
    } catch (error) {
      console.error('Failed to get content analytics:', error);
      return { success: false, error: 'Failed to get content analytics' };
    }
  }

  // Get Audience Insights
  async getAudienceInsights(dateFrom?: string, dateTo?: string): Promise<{ success: boolean; insights?: AudienceInsights; error?: string }> {
    try {
      return await supabaseCall('advanced-analytics', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'audience_insights',
          dateFrom: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: dateTo || new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to get audience insights:', error);
      return { success: false, error: 'Failed to get audience insights' };
    }
  }

  // Get Trend Analysis
  async getTrendAnalysis(dateFrom?: string, dateTo?: string, metrics?: string[]): Promise<{ success: boolean; analysis?: TrendAnalysis; error?: string }> {
    try {
      return await supabaseCall('advanced-analytics', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'trend_analysis',
          dateFrom: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: dateTo || new Date().toISOString(),
          metrics: metrics || ['revenue', 'orders', 'customers', 'spend']
        })
      });
    } catch (error) {
      console.error('Failed to get trend analysis:', error);
      return { success: false, error: 'Failed to get trend analysis' };
    }
  }

  // Get Predictive Analytics
  async getPredictiveAnalytics(dateFrom?: string, dateTo?: string): Promise<{ success: boolean; predictions?: PredictiveAnalytics; error?: string }> {
    try {
      return await supabaseCall('advanced-analytics', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'predictive_analytics',
          dateFrom: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: dateTo || new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to get predictive analytics:', error);
      return { success: false, error: 'Failed to get predictive analytics' };
    }
  }

  // Get ROI Analysis
  async getROIAnalysis(dateFrom?: string, dateTo?: string): Promise<{ success: boolean; analysis?: ROIAnalysis; error?: string }> {
    try {
      return await supabaseCall('advanced-analytics', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'roi_analysis',
          dateFrom: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: dateTo || new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to get ROI analysis:', error);
      return { success: false, error: 'Failed to get ROI analysis' };
    }
  }

  // Get Competitive Benchmark
  async getCompetitiveBenchmark(dateFrom?: string, dateTo?: string): Promise<{ success: boolean; benchmark?: CompetitiveBenchmark; error?: string }> {
    try {
      return await supabaseCall('advanced-analytics', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'competitive_benchmark',
          dateFrom: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: dateTo || new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to get competitive benchmark:', error);
      return { success: false, error: 'Failed to get competitive benchmark' };
    }
  }

  // Get Comprehensive Analytics Report
  async getComprehensiveReport(dateFrom?: string, dateTo?: string): Promise<{ 
    success: boolean; 
    report?: {
      performance: PerformanceDashboard;
      content: ContentAnalytics;
      audience: AudienceInsights;
      trends: TrendAnalysis;
      predictions: PredictiveAnalytics;
      roi: ROIAnalysis;
      competitive: CompetitiveBenchmark;
    }; 
    error?: string 
  }> {
    try {
      const [
        performance,
        content,
        audience,
        trends,
        predictions,
        roi,
        competitive
      ] = await Promise.all([
        this.getPerformanceDashboard(dateFrom, dateTo),
        this.getContentAnalytics(dateFrom, dateTo),
        this.getAudienceInsights(dateFrom, dateTo),
        this.getTrendAnalysis(dateFrom, dateTo),
        this.getPredictiveAnalytics(dateFrom, dateTo),
        this.getROIAnalysis(dateFrom, dateTo),
        this.getCompetitiveBenchmark(dateFrom, dateTo)
      ]);

      if (!performance.success || !content.success || !audience.success || 
          !trends.success || !predictions.success || !roi.success || !competitive.success) {
        return { success: false, error: 'Failed to generate comprehensive report' };
      }

      return {
        success: true,
        report: {
          performance: performance.dashboard!,
          content: content.analytics!,
          audience: audience.insights!,
          trends: trends.analysis!,
          predictions: predictions.predictions!,
          roi: roi.analysis!,
          competitive: competitive.benchmark!
        }
      };
    } catch (error) {
      console.error('Failed to get comprehensive report:', error);
      return { success: false, error: 'Failed to get comprehensive report' };
    }
  }

  // Get Custom Analytics Query
  async getCustomAnalytics(query: {
    metrics: string[];
    dimensions: string[];
    filters?: any;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      return await supabaseCall('advanced-analytics', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'custom_query',
          ...query,
          dateFrom: query.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: query.dateTo || new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to get custom analytics:', error);
      return { success: false, error: 'Failed to get custom analytics' };
    }
  }

  // Export Analytics Data
  async exportAnalyticsData(format: 'csv' | 'json' | 'excel', dateFrom?: string, dateTo?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const report = await this.getComprehensiveReport(dateFrom, dateTo);
      
      if (!report.success) {
        return { success: false, error: 'Failed to generate report for export' };
      }

      // Mock export functionality - replace with actual implementation
      const exportData = {
        format,
        generated_at: new Date().toISOString(),
        period: {
          start: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: dateTo || new Date().toISOString()
        },
        data: report.report
      };

      return {
        success: true,
        data: exportData
      };
    } catch (error) {
      console.error('Failed to export analytics data:', error);
      return { success: false, error: 'Failed to export analytics data' };
    }
  }
}

export const advancedAnalyticsService = new AdvancedAnalyticsService(); 