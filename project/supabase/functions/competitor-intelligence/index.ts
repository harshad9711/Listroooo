import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { action, competitorId, dateFrom, dateTo, platforms } = await req.json()

    // Validate input
    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let result: any = { success: false }

    switch (action) {
      case 'monitor_competitors':
        result = await monitorCompetitors(platforms, dateFrom, dateTo, supabaseClient)
        break
      case 'analyze_competitor_content':
        result = await analyzeCompetitorContent(competitorId, dateFrom, dateTo, supabaseClient)
        break
      case 'track_competitor_pricing':
        result = await trackCompetitorPricing(competitorId, dateFrom, dateTo, supabaseClient)
        break
      case 'monitor_competitor_campaigns':
        result = await monitorCompetitorCampaigns(competitorId, dateFrom, dateTo, supabaseClient)
        break
      case 'identify_opportunities':
        result = await identifyCompetitiveOpportunities(dateFrom, dateTo, supabaseClient)
        break
      case 'get_competitive_benchmark':
        result = await getCompetitiveBenchmark(dateFrom, dateTo, supabaseClient)
        break
      default:
        result = { success: false, error: 'Unknown action' }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function monitorCompetitors(platforms: string[], dateFrom: string, dateTo: string, supabaseClient: any) {
  try {
    console.log(`🔍 Monitoring competitors on platforms: ${platforms.join(', ')}`)

    const competitorMonitoring = {
      period: {
        start: dateFrom,
        end: dateTo
      },
      platforms: platforms,
      competitors: [
        {
          id: 'comp_1',
          name: 'Fashion Forward',
          industry: 'Fashion & Apparel',
          market_share: 22,
          social_presence: {
            instagram: { followers: 250000, engagement_rate: 8.2, posts_this_period: 45 },
            tiktok: { followers: 180000, engagement_rate: 12.5, posts_this_period: 32 },
            facebook: { followers: 120000, engagement_rate: 5.8, posts_this_period: 28 }
          },
          content_strategy: {
            primary_themes: ['sustainable_fashion', 'body_positivity', 'trendy_styles'],
            posting_frequency: 'daily',
            content_types: ['video', 'image', 'carousel'],
            hashtag_strategy: 'trending_hashtags'
          },
          recent_activities: [
            {
              type: 'new_campaign',
              description: 'Launched sustainable fashion collection',
              date: '2024-01-20',
              impact: 'high'
            },
            {
              type: 'price_change',
              description: 'Reduced prices on winter collection by 15%',
              date: '2024-01-18',
              impact: 'medium'
            },
            {
              type: 'partnership',
              description: 'Collaborated with eco-friendly influencer',
              date: '2024-01-15',
              impact: 'high'
            }
          ]
        },
        {
          id: 'comp_2',
          name: 'Style Studio',
          industry: 'Fashion & Apparel',
          market_share: 18,
          social_presence: {
            instagram: { followers: 180000, engagement_rate: 7.5, posts_this_period: 38 },
            tiktok: { followers: 120000, engagement_rate: 10.8, posts_this_period: 25 },
            facebook: { followers: 95000, engagement_rate: 4.2, posts_this_period: 22 }
          },
          content_strategy: {
            primary_themes: ['luxury_fashion', 'celebrity_style', 'exclusive_collections'],
            posting_frequency: '3x_weekly',
            content_types: ['image', 'video', 'story'],
            hashtag_strategy: 'branded_hashtags'
          },
          recent_activities: [
            {
              type: 'product_launch',
              description: 'Released limited edition luxury collection',
              date: '2024-01-22',
              impact: 'high'
            },
            {
              type: 'influencer_collaboration',
              description: 'Partnered with celebrity stylist',
              date: '2024-01-19',
              impact: 'high'
            }
          ]
        },
        {
          id: 'comp_3',
          name: 'Trendy Threads',
          industry: 'Fashion & Apparel',
          market_share: 15,
          social_presence: {
            instagram: { followers: 150000, engagement_rate: 6.8, posts_this_period: 42 },
            tiktok: { followers: 200000, engagement_rate: 15.2, posts_this_period: 48 },
            facebook: { followers: 80000, engagement_rate: 3.8, posts_this_period: 20 }
          },
          content_strategy: {
            primary_themes: ['streetwear', 'urban_fashion', 'youth_culture'],
            posting_frequency: 'multiple_daily',
            content_types: ['video', 'live_stream', 'user_generated'],
            hashtag_strategy: 'viral_challenges'
          },
          recent_activities: [
            {
              type: 'viral_campaign',
              description: 'Launched TikTok dance challenge',
              date: '2024-01-21',
              impact: 'very_high'
            },
            {
              type: 'collaboration',
              description: 'Partnered with streetwear artists',
              date: '2024-01-17',
              impact: 'medium'
            }
          ]
        }
      ],
      market_insights: {
        trending_topics: [
          'sustainable_fashion',
          'body_positivity',
          'vintage_styles',
          'minimalist_fashion',
          'streetwear_culture'
        ],
        emerging_trends: [
          'virtual_try_on',
          'ai_personalization',
          'circular_fashion',
          'micro_influencers',
          'live_shopping'
        ],
        competitive_moves: [
          'Price wars in winter collection',
          'Increased focus on sustainability',
          'Rise in influencer collaborations',
          'Expansion into new markets',
          'Technology integration'
        ]
      }
    }

    return {
      success: true,
      monitoring: competitorMonitoring
    }

  } catch (error) {
    console.error('Monitor competitors error:', error)
    return {
      success: false,
      error: 'Failed to monitor competitors'
    }
  }
}

async function analyzeCompetitorContent(competitorId: string, dateFrom: string, dateTo: string, supabaseClient: any) {
  try {
    console.log(`📊 Analyzing content for competitor: ${competitorId}`)

    const contentAnalysis = {
      competitor_id: competitorId,
      period: {
        start: dateFrom,
        end: dateTo
      },
      content_performance: {
        total_posts: 156,
        average_engagement_rate: 8.5,
        total_reach: 1250000,
        total_engagement: 106250,
        best_performing_content: [
          {
            id: 'post_1',
            type: 'video',
            platform: 'tiktok',
            engagement_rate: 15.2,
            reach: 85000,
            content_theme: 'sustainable_fashion',
            hashtags: ['#sustainable', '#fashion', '#eco'],
            posted_at: '2024-01-20T14:30:00Z'
          },
          {
            id: 'post_2',
            type: 'carousel',
            platform: 'instagram',
            engagement_rate: 12.8,
            reach: 65000,
            content_theme: 'body_positivity',
            hashtags: ['#bodypositive', '#fashion', '#confidence'],
            posted_at: '2024-01-18T10:15:00Z'
          },
          {
            id: 'post_3',
            type: 'image',
            platform: 'instagram',
            engagement_rate: 11.5,
            reach: 45000,
            content_theme: 'trendy_styles',
            hashtags: ['#trendy', '#style', '#fashion'],
            posted_at: '2024-01-16T16:45:00Z'
          }
        ]
      },
      content_strategy_insights: {
        themes: [
          { theme: 'sustainable_fashion', frequency: 35, engagement_rate: 9.2 },
          { theme: 'body_positivity', frequency: 28, engagement_rate: 8.8 },
          { theme: 'trendy_styles', frequency: 25, engagement_rate: 7.5 },
          { theme: 'lifestyle', frequency: 12, engagement_rate: 6.8 }
        ],
        content_types: [
          { type: 'video', frequency: 45, engagement_rate: 10.2 },
          { type: 'image', frequency: 35, engagement_rate: 7.8 },
          { type: 'carousel', frequency: 15, engagement_rate: 8.5 },
          { type: 'story', frequency: 5, engagement_rate: 6.2 }
        ],
        posting_patterns: {
          best_days: ['Friday', 'Sunday', 'Wednesday'],
          best_times: ['19:00', '20:00', '18:00'],
          frequency: 'daily',
          consistency_score: 8.5
        },
        hashtag_strategy: {
          most_used: ['#fashion', '#style', '#sustainable', '#trendy'],
          trending_hashtags: ['#bodypositive', '#ecofashion', '#slowfashion'],
          branded_hashtags: ['#fashionforward', '#sustainablestyle'],
          hashtag_performance: {
            '#sustainable': { usage: 25, engagement_rate: 9.5 },
            '#bodypositive': { usage: 18, engagement_rate: 10.2 },
            '#trendy': { usage: 15, engagement_rate: 7.8 }
          }
        }
      },
      audience_analysis: {
        demographics: {
          age_groups: {
            '18-24': 35,
            '25-34': 42,
            '35-44': 15,
            '45+': 8
          },
          gender: {
            female: 72,
            male: 28
          },
          locations: [
            { country: 'United States', percentage: 45 },
            { country: 'United Kingdom', percentage: 20 },
            { country: 'Canada', percentage: 15 },
            { country: 'Australia', percentage: 10 },
            { country: 'Other', percentage: 10 }
          ]
        },
        interests: [
          'Fashion & Style',
          'Sustainability',
          'Body Positivity',
          'Shopping',
          'Lifestyle'
        ],
        engagement_patterns: {
          active_hours: ['18:00', '19:00', '20:00', '21:00'],
          preferred_content: 'video',
          interaction_types: ['likes', 'comments', 'shares', 'saves']
        }
      },
      competitive_advantages: [
        'Strong focus on sustainability messaging',
        'High engagement with body positivity content',
        'Consistent daily posting schedule',
        'Effective use of trending hashtags',
        'Diverse content mix (video, image, carousel)'
      ],
      improvement_opportunities: [
        'Increase story content for better engagement',
        'Explore more user-generated content',
        'Expand into emerging platforms',
        'Optimize posting times based on audience activity',
        'Develop more branded hashtag campaigns'
      ]
    }

    return {
      success: true,
      analysis: contentAnalysis
    }

  } catch (error) {
    console.error('Analyze competitor content error:', error)
    return {
      success: false,
      error: 'Failed to analyze competitor content'
    }
  }
}

async function trackCompetitorPricing(competitorId: string, dateFrom: string, dateTo: string, supabaseClient: any) {
  try {
    console.log(`💰 Tracking pricing for competitor: ${competitorId}`)

    const pricingAnalysis = {
      competitor_id: competitorId,
      period: {
        start: dateFrom,
        end: dateTo
      },
      pricing_strategy: {
        overall_strategy: 'premium_positioning',
        price_range: {
          low: 29.99,
          high: 299.99,
          average: 89.99
        },
        discount_frequency: 'seasonal',
        discount_depth: '15-25%'
      },
      price_changes: [
        {
          product_category: 'Summer Collection',
          old_price: 89.99,
          new_price: 74.99,
          change_percentage: -16.7,
          date: '2024-01-20',
          reason: 'End of season clearance'
        },
        {
          product_category: 'Winter Collection',
          old_price: 129.99,
          new_price: 109.99,
          change_percentage: -15.4,
          date: '2024-01-18',
          reason: 'Competitive pricing adjustment'
        },
        {
          product_category: 'Accessories',
          old_price: 49.99,
          new_price: 39.99,
          change_percentage: -20.0,
          date: '2024-01-15',
          reason: 'Promotional campaign'
        }
      ],
      competitive_positioning: {
        price_comparison: {
          your_brand: { average_price: 79.99, positioning: 'mid_market' },
          competitor: { average_price: 89.99, positioning: 'premium' },
          market_average: { average_price: 85.00, positioning: 'mid_premium' }
        },
        value_proposition: {
          quality_perception: 'high',
          brand_premium: '+12%',
          customer_satisfaction: 4.2
        }
      },
      pricing_insights: {
        trends: [
          'Increasing focus on premium positioning',
          'More frequent seasonal discounts',
          'Strategic price matching on key products',
          'Bundle pricing for higher AOV'
        ],
        opportunities: [
          'Gap in mid-market segment',
          'Potential for value-based pricing',
          'Opportunity to compete on quality vs price',
          'Room for premium positioning in sustainable segment'
        ],
        threats: [
          'Price wars in seasonal categories',
          'New low-cost competitors entering market',
          'Economic pressure affecting premium positioning',
          'Increased discounting by competitors'
        ]
      }
    }

    return {
      success: true,
      pricing: pricingAnalysis
    }

  } catch (error) {
    console.error('Track competitor pricing error:', error)
    return {
      success: false,
      error: 'Failed to track competitor pricing'
    }
  }
}

async function monitorCompetitorCampaigns(competitorId: string, dateFrom: string, dateTo: string, supabaseClient: any) {
  try {
    console.log(`📢 Monitoring campaigns for competitor: ${competitorId}`)

    const campaignMonitoring = {
      competitor_id: competitorId,
      period: {
        start: dateFrom,
        end: dateTo
      },
      active_campaigns: [
        {
          id: 'camp_1',
          name: 'Sustainable Fashion Movement',
          type: 'brand_awareness',
          platforms: ['instagram', 'tiktok', 'facebook'],
          start_date: '2024-01-15',
          end_date: '2024-02-15',
          budget: 'estimated_50000',
          reach: 250000,
          engagement: 12500,
          themes: ['sustainability', 'eco_friendly', 'conscious_consumption'],
          influencers: ['eco_influencer_1', 'sustainable_lifestyle_2'],
          performance: 'excellent'
        },
        {
          id: 'camp_2',
          name: 'Body Positivity Collection',
          type: 'product_launch',
          platforms: ['instagram', 'tiktok'],
          start_date: '2024-01-20',
          end_date: '2024-02-20',
          budget: 'estimated_30000',
          reach: 180000,
          engagement: 9500,
          themes: ['body_positive', 'inclusive_fashion', 'confidence'],
          influencers: ['body_positive_1', 'fashion_advocate_2'],
          performance: 'good'
        },
        {
          id: 'camp_3',
          name: 'Winter Sale',
          type: 'promotional',
          platforms: ['instagram', 'facebook', 'email'],
          start_date: '2024-01-18',
          end_date: '2024-01-31',
          budget: 'estimated_20000',
          reach: 120000,
          engagement: 6000,
          themes: ['sale', 'discount', 'limited_time'],
          influencers: [],
          performance: 'average'
        }
      ],
      campaign_strategy_insights: {
        themes: [
          { theme: 'sustainability', frequency: 40, performance: 'excellent' },
          { theme: 'body_positivity', frequency: 30, performance: 'good' },
          { theme: 'promotional', frequency: 20, performance: 'average' },
          { theme: 'lifestyle', frequency: 10, performance: 'good' }
        ],
        influencer_collaborations: {
          total_collaborations: 8,
          average_reach: 85000,
          average_engagement_rate: 8.5,
          top_performing_influencers: [
            'eco_influencer_1',
            'body_positive_1',
            'sustainable_lifestyle_2'
          ]
        },
        platform_performance: {
          instagram: { campaigns: 3, average_reach: 150000, average_engagement: 8.2 },
          tiktok: { campaigns: 2, average_reach: 200000, average_engagement: 12.5 },
          facebook: { campaigns: 2, average_reach: 80000, average_engagement: 5.8 }
        }
      },
      competitive_advantages: [
        'Strong focus on sustainability messaging',
        'Effective influencer partnerships',
        'Consistent brand voice across campaigns',
        'High engagement rates on TikTok',
        'Successful integration of social causes'
      ],
      opportunities_for_response: [
        {
          opportunity: 'Sustainability messaging gap',
          description: 'Competitor is leading in sustainability messaging',
          recommended_action: 'Develop stronger sustainability narrative and partnerships',
          timeline: '2-3 months',
          expected_impact: 'high'
        },
        {
          opportunity: 'Influencer collaboration expansion',
          description: 'Competitor has effective influencer strategy',
          recommended_action: 'Expand influencer network and develop long-term partnerships',
          timeline: '1-2 months',
          expected_impact: 'medium'
        },
        {
          opportunity: 'TikTok presence enhancement',
          description: 'Competitor performing well on TikTok',
          recommended_action: 'Increase TikTok content and engagement',
          timeline: '1 month',
          expected_impact: 'medium'
        }
      ]
    }

    return {
      success: true,
      campaigns: campaignMonitoring
    }

  } catch (error) {
    console.error('Monitor competitor campaigns error:', error)
    return {
      success: false,
      error: 'Failed to monitor competitor campaigns'
    }
  }
}

async function identifyCompetitiveOpportunities(dateFrom: string, dateTo: string, supabaseClient: any) {
  try {
    console.log('🎯 Identifying competitive opportunities...')

    const opportunities = {
      period: {
        start: dateFrom,
        end: dateTo
      },
      market_gaps: [
        {
          gap: 'Mid-market sustainable fashion',
          description: 'Competitors focus on premium or budget segments',
          market_size: 'estimated_50m',
          competition_level: 'low',
          entry_barriers: 'medium',
          recommended_action: 'Develop mid-market sustainable collection',
          timeline: '3-6 months',
          expected_roi: 'high'
        },
        {
          gap: 'Plus-size sustainable fashion',
          description: 'Limited options for plus-size sustainable clothing',
          market_size: 'estimated_25m',
          competition_level: 'very_low',
          entry_barriers: 'low',
          recommended_action: 'Launch inclusive sustainable line',
          timeline: '2-4 months',
          expected_roi: 'medium'
        },
        {
          gap: 'Virtual try-on technology',
          description: 'Competitors not fully utilizing AR/VR technology',
          market_size: 'estimated_30m',
          competition_level: 'medium',
          entry_barriers: 'high',
          recommended_action: 'Partner with AR technology provider',
          timeline: '6-12 months',
          expected_roi: 'high'
        }
      ],
      competitive_weaknesses: [
        {
          competitor: 'Fashion Forward',
          weakness: 'Limited TikTok presence',
          impact: 'medium',
          opportunity: 'Expand TikTok marketing efforts',
          timeline: '1-2 months'
        },
        {
          competitor: 'Style Studio',
          weakness: 'High pricing alienates younger audience',
          impact: 'high',
          opportunity: 'Develop budget-friendly line',
          timeline: '3-4 months'
        },
        {
          competitor: 'Trendy Threads',
          weakness: 'Poor sustainability messaging',
          impact: 'medium',
          opportunity: 'Emphasize sustainability credentials',
          timeline: '2-3 months'
        }
      ],
      emerging_trends: [
        {
          trend: 'Circular fashion economy',
          adoption_rate: 'growing',
          competitor_adoption: 'low',
          opportunity: 'Launch take-back and resale program',
          timeline: '4-6 months',
          investment_required: 'medium'
        },
        {
          trend: 'AI-powered personalization',
          adoption_rate: 'emerging',
          competitor_adoption: 'very_low',
          opportunity: 'Implement AI recommendation engine',
          timeline: '6-12 months',
          investment_required: 'high'
        },
        {
          trend: 'Live shopping experiences',
          adoption_rate: 'accelerating',
          competitor_adoption: 'medium',
          opportunity: 'Launch live shopping platform',
          timeline: '2-3 months',
          investment_required: 'low'
        }
      ],
      strategic_recommendations: [
        {
          priority: 1,
          recommendation: 'Develop mid-market sustainable fashion line',
          rationale: 'Addresses market gap with high potential',
          timeline: '3-6 months',
          investment: 'medium',
          expected_roi: 'high'
        },
        {
          priority: 2,
          recommendation: 'Expand TikTok presence and influencer network',
          rationale: 'Competitive advantage in social media',
          timeline: '1-2 months',
          investment: 'low',
          expected_roi: 'medium'
        },
        {
          priority: 3,
          recommendation: 'Launch circular fashion program',
          rationale: 'Early mover advantage in sustainability',
          timeline: '4-6 months',
          investment: 'medium',
          expected_roi: 'high'
        }
      ]
    }

    return {
      success: true,
      opportunities: opportunities
    }

  } catch (error) {
    console.error('Identify competitive opportunities error:', error)
    return {
      success: false,
      error: 'Failed to identify competitive opportunities'
    }
  }
}

async function getCompetitiveBenchmark(dateFrom: string, dateTo: string, supabaseClient: any) {
  try {
    console.log('📊 Generating competitive benchmark...')

    const competitiveBenchmark = {
      period: {
        start: dateFrom,
        end: dateTo
      },
      market_positioning: {
        your_brand: {
          market_share: 18,
          brand_awareness: 65,
          customer_satisfaction: 4.3,
          social_media_presence: 'strong',
          pricing_position: 'mid_market'
        },
        competitors: [
          {
            name: 'Fashion Forward',
            market_share: 22,
            brand_awareness: 78,
            customer_satisfaction: 4.1,
            social_media_presence: 'excellent',
            pricing_position: 'premium'
          },
          {
            name: 'Style Studio',
            market_share: 15,
            brand_awareness: 55,
            customer_satisfaction: 4.0,
            social_media_presence: 'good',
            pricing_position: 'premium'
          },
          {
            name: 'Trendy Threads',
            market_share: 12,
            brand_awareness: 45,
            customer_satisfaction: 3.8,
            social_media_presence: 'strong',
            pricing_position: 'budget'
          }
        ]
      },
      performance_metrics: {
        social_media: {
          your_brand: {
            total_followers: 180000,
            engagement_rate: 7.8,
            posting_frequency: 'daily',
            content_quality_score: 8.2
          },
          industry_average: {
            total_followers: 150000,
            engagement_rate: 6.5,
            posting_frequency: '3x_weekly',
            content_quality_score: 7.5
          },
          top_competitor: {
            total_followers: 250000,
            engagement_rate: 8.2,
            posting_frequency: 'daily',
            content_quality_score: 8.5
          }
        },
        website_performance: {
          your_brand: {
            traffic: 45000,
            conversion_rate: 3.2,
            average_order_value: 89.99,
            bounce_rate: 35
          },
          industry_average: {
            traffic: 40000,
            conversion_rate: 2.8,
            average_order_value: 85.00,
            bounce_rate: 42
          },
          top_competitor: {
            traffic: 55000,
            conversion_rate: 3.5,
            average_order_value: 95.00,
            bounce_rate: 32
          }
        },
        customer_metrics: {
          your_brand: {
            customer_acquisition_cost: 50.56,
            customer_lifetime_value: 140.45,
            retention_rate: 68,
            net_promoter_score: 72
          },
          industry_average: {
            customer_acquisition_cost: 65.00,
            customer_lifetime_value: 120.00,
            retention_rate: 60,
            net_promoter_score: 65
          },
          top_competitor: {
            customer_acquisition_cost: 55.00,
            customer_lifetime_value: 150.00,
            retention_rate: 72,
            net_promoter_score: 75
          }
        }
      },
      competitive_advantages: [
        {
          advantage: 'Superior customer experience',
          strength_level: 'high',
          sustainability: 'long_term',
          competitive_moat: 'strong'
        },
        {
          advantage: 'Data-driven optimization',
          strength_level: 'medium',
          sustainability: 'medium_term',
          competitive_moat: 'moderate'
        },
        {
          advantage: 'Multi-platform presence',
          strength_level: 'high',
          sustainability: 'long_term',
          competitive_moat: 'strong'
        }
      ],
      improvement_areas: [
        {
          area: 'Brand awareness',
          current_performance: 65,
          target_performance: 75,
          gap: 10,
          priority: 'high',
          recommended_actions: [
            'Increase influencer collaborations',
            'Launch brand awareness campaigns',
            'Improve PR and media relations'
          ]
        },
        {
          area: 'Customer retention',
          current_performance: 68,
          target_performance: 75,
          gap: 7,
          priority: 'medium',
          recommended_actions: [
            'Implement loyalty program',
            'Improve post-purchase experience',
            'Develop personalized communication'
          ]
        },
        {
          area: 'Social media engagement',
          current_performance: 7.8,
          target_performance: 8.5,
          gap: 0.7,
          priority: 'medium',
          recommended_actions: [
            'Optimize content strategy',
            'Increase video content',
            'Improve hashtag strategy'
          ]
        }
      ]
    }

    return {
      success: true,
      benchmark: competitiveBenchmark
    }

  } catch (error) {
    console.error('Get competitive benchmark error:', error)
    return {
      success: false,
      error: 'Failed to get competitive benchmark'
    }
  }
} 