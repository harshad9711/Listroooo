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

    const { action, customerId, journeyId, dateFrom, dateTo, touchpoints } = await req.json()

    // Validate input
    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let result: any = { success: false }

    switch (action) {
      case 'track_interaction':
        result = await trackCustomerInteraction(customerId, touchpoints, supabaseClient)
        break
      case 'get_journey_map':
        result = await getCustomerJourneyMap(customerId, dateFrom, dateTo, supabaseClient)
        break
      case 'analyze_journey_patterns':
        result = await analyzeJourneyPatterns(dateFrom, dateTo, supabaseClient)
        break
      case 'identify_friction_points':
        result = await identifyFrictionPoints(dateFrom, dateTo, supabaseClient)
        break
      case 'optimize_journey':
        result = await optimizeCustomerJourney(customerId, supabaseClient)
        break
      case 'get_conversion_funnel':
        result = await getConversionFunnel(dateFrom, dateTo, supabaseClient)
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

async function trackCustomerInteraction(customerId: string, touchpoints: any[], supabaseClient: any) {
  try {
    console.log(`📊 Tracking interactions for customer: ${customerId}`)

    const interaction = {
      id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customer_id: customerId,
      touchpoints: touchpoints,
      timestamp: new Date().toISOString(),
      session_id: `session_${Date.now()}`,
      platform: touchpoints[0]?.platform || 'unknown',
      device_type: touchpoints[0]?.device_type || 'unknown',
      location: touchpoints[0]?.location || null
    }

    // Store interaction in database
    const { data, error } = await supabaseClient
      .from('customer_interactions')
      .insert(interaction)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        error: 'Failed to track interaction'
      }
    }

    return {
      success: true,
      interaction: data,
      message: 'Interaction tracked successfully'
    }

  } catch (error) {
    console.error('Track interaction error:', error)
    return {
      success: false,
      error: 'Failed to track interaction'
    }
  }
}

async function getCustomerJourneyMap(customerId: string, dateFrom: string, dateTo: string, supabaseClient: any) {
  try {
    console.log(`🗺️ Mapping journey for customer: ${customerId}`)

    // Mock customer journey data
    const journeyMap = {
      customer_id: customerId,
      period: {
        start: dateFrom,
        end: dateTo
      },
      touchpoints: [
        {
          id: 'tp_1',
          type: 'social_media_discovery',
          platform: 'instagram',
          timestamp: '2024-01-15T10:30:00Z',
          content: 'Brand post about new collection',
          engagement: 'like',
          duration: 45,
          device: 'mobile'
        },
        {
          id: 'tp_2',
          type: 'website_visit',
          platform: 'web',
          timestamp: '2024-01-15T11:15:00Z',
          content: 'Product page visit',
          engagement: 'page_view',
          duration: 180,
          device: 'mobile',
          url: '/products/summer-dress'
        },
        {
          id: 'tp_3',
          type: 'email_interaction',
          platform: 'email',
          timestamp: '2024-01-16T09:00:00Z',
          content: 'Welcome email opened',
          engagement: 'email_open',
          duration: 30,
          device: 'desktop'
        },
        {
          id: 'tp_4',
          type: 'website_visit',
          platform: 'web',
          timestamp: '2024-01-17T14:20:00Z',
          content: 'Return visit to product page',
          engagement: 'page_view',
          duration: 240,
          device: 'mobile',
          url: '/products/summer-dress'
        },
        {
          id: 'tp_5',
          type: 'purchase',
          platform: 'web',
          timestamp: '2024-01-17T14:45:00Z',
          content: 'Product purchased',
          engagement: 'conversion',
          duration: 300,
          device: 'mobile',
          value: 89.99
        },
        {
          id: 'tp_6',
          type: 'post_purchase',
          platform: 'email',
          timestamp: '2024-01-18T10:00:00Z',
          content: 'Order confirmation email',
          engagement: 'email_open',
          duration: 60,
          device: 'mobile'
        },
        {
          id: 'tp_7',
          type: 'social_media_engagement',
          platform: 'instagram',
          timestamp: '2024-01-20T16:30:00Z',
          content: 'User-generated content',
          engagement: 'comment',
          duration: 120,
          device: 'mobile'
        }
      ],
      journey_metrics: {
        total_touchpoints: 7,
        journey_duration: '5 days',
        conversion_time: '2 days 4 hours',
        touchpoints_to_conversion: 5,
        total_engagement_time: 975,
        platforms_used: ['instagram', 'web', 'email'],
        devices_used: ['mobile', 'desktop']
      },
      sentiment_analysis: {
        overall_sentiment: 'positive',
        sentiment_score: 0.75,
        key_moments: [
          { touchpoint: 'tp_1', sentiment: 'positive', reason: 'Engaged with brand content' },
          { touchpoint: 'tp_5', sentiment: 'very_positive', reason: 'Successful purchase' },
          { touchpoint: 'tp_7', sentiment: 'positive', reason: 'Active post-purchase engagement' }
        ]
      },
      conversion_path: {
        primary_path: 'social_discovery → website_visit → email → return_visit → purchase',
        alternative_paths: [
          'social_discovery → website_visit → purchase',
          'email → website_visit → purchase'
        ],
        conversion_rate: 100,
        average_touchpoints: 5
      }
    }

    return {
      success: true,
      journey_map: journeyMap
    }

  } catch (error) {
    console.error('Get journey map error:', error)
    return {
      success: false,
      error: 'Failed to get customer journey map'
    }
  }
}

async function analyzeJourneyPatterns(dateFrom: string, dateTo: string, supabaseClient: any) {
  try {
    console.log('📈 Analyzing journey patterns...')

    const journeyPatterns = {
      period: {
        start: dateFrom,
        end: dateTo
      },
      common_paths: [
        {
          path: 'social_discovery → website_visit → purchase',
          frequency: 45,
          conversion_rate: 12.5,
          average_duration: '2.3 days',
          touchpoints: 3
        },
        {
          path: 'social_discovery → website_visit → email → return_visit → purchase',
          frequency: 32,
          conversion_rate: 18.7,
          average_duration: '4.1 days',
          touchpoints: 5
        },
        {
          path: 'email → website_visit → purchase',
          frequency: 28,
          conversion_rate: 8.9,
          average_duration: '1.8 days',
          touchpoints: 3
        },
        {
          path: 'search → website_visit → purchase',
          frequency: 15,
          conversion_rate: 6.2,
          average_duration: '1.2 days',
          touchpoints: 2
        }
      ],
      platform_performance: {
        instagram: {
          discovery_rate: 65,
          conversion_rate: 12.5,
          average_journey_duration: '3.2 days',
          touchpoints_per_journey: 4.2
        },
        facebook: {
          discovery_rate: 25,
          conversion_rate: 8.9,
          average_journey_duration: '2.8 days',
          touchpoints_per_journey: 3.8
        },
        tiktok: {
          discovery_rate: 10,
          conversion_rate: 15.2,
          average_journey_duration: '2.1 days',
          touchpoints_per_journey: 3.5
        }
      },
      customer_segments: {
        'high_value': {
          average_journey_duration: '5.2 days',
          touchpoints_per_journey: 6.8,
          conversion_rate: 22.5,
          preferred_platforms: ['instagram', 'email']
        },
        'medium_value': {
          average_journey_duration: '3.1 days',
          touchpoints_per_journey: 4.2,
          conversion_rate: 12.8,
          preferred_platforms: ['instagram', 'web']
        },
        'low_value': {
          average_journey_duration: '1.8 days',
          touchpoints_per_journey: 2.5,
          conversion_rate: 6.2,
          preferred_platforms: ['search', 'web']
        }
      },
      seasonal_patterns: {
        'holiday_season': {
          average_journey_duration: '2.1 days',
          conversion_rate: 18.5,
          touchpoints_per_journey: 3.8
        },
        'regular_season': {
          average_journey_duration: '3.5 days',
          conversion_rate: 11.2,
          touchpoints_per_journey: 4.5
        },
        'off_season': {
          average_journey_duration: '4.8 days',
          conversion_rate: 8.9,
          touchpoints_per_journey: 5.2
        }
      }
    }

    return {
      success: true,
      patterns: journeyPatterns
    }

  } catch (error) {
    console.error('Analyze journey patterns error:', error)
    return {
      success: false,
      error: 'Failed to analyze journey patterns'
    }
  }
}

async function identifyFrictionPoints(dateFrom: string, dateTo: string, supabaseClient: any) {
  try {
    console.log('⚠️ Identifying friction points...')

    const frictionPoints = {
      period: {
        start: dateFrom,
        end: dateTo
      },
      high_friction_points: [
        {
          touchpoint: 'checkout_process',
          issue: 'Complex checkout form',
          impact: 'high',
          dropoff_rate: 35,
          affected_customers: 1250,
          potential_revenue_loss: 45000,
          solution: 'Simplify checkout form and add guest checkout option'
        },
        {
          touchpoint: 'mobile_experience',
          issue: 'Slow loading times on mobile',
          impact: 'high',
          dropoff_rate: 28,
          affected_customers: 980,
          potential_revenue_loss: 32000,
          solution: 'Optimize mobile site performance and implement AMP'
        },
        {
          touchpoint: 'product_pages',
          issue: 'Insufficient product information',
          impact: 'medium',
          dropoff_rate: 22,
          affected_customers: 750,
          potential_revenue_loss: 18000,
          solution: 'Add detailed product descriptions, reviews, and size guides'
        }
      ],
      medium_friction_points: [
        {
          touchpoint: 'email_subscription',
          issue: 'Too many email signup prompts',
          impact: 'medium',
          dropoff_rate: 18,
          affected_customers: 450,
          potential_revenue_loss: 12000,
          solution: 'Reduce email prompts and offer value-based incentives'
        },
        {
          touchpoint: 'search_functionality',
          issue: 'Poor search results relevance',
          impact: 'medium',
          dropoff_rate: 15,
          affected_customers: 320,
          potential_revenue_loss: 8500,
          solution: 'Implement AI-powered search with autocomplete and filters'
        }
      ],
      low_friction_points: [
        {
          touchpoint: 'social_login',
          issue: 'Limited social login options',
          impact: 'low',
          dropoff_rate: 8,
          affected_customers: 120,
          potential_revenue_loss: 3000,
          solution: 'Add more social login providers (Google, Apple, etc.)'
        },
        {
          touchpoint: 'return_policy',
          issue: 'Unclear return policy',
          impact: 'low',
          dropoff_rate: 5,
          affected_customers: 80,
          potential_revenue_loss: 2000,
          solution: 'Make return policy more prominent and user-friendly'
        }
      ],
      optimization_priorities: [
        {
          priority: 1,
          touchpoint: 'checkout_process',
          expected_improvement: '+25% conversion rate',
          implementation_time: '2 weeks',
          cost: 'medium'
        },
        {
          priority: 2,
          touchpoint: 'mobile_experience',
          expected_improvement: '+20% mobile conversion rate',
          implementation_time: '3 weeks',
          cost: 'medium'
        },
        {
          priority: 3,
          touchpoint: 'product_pages',
          expected_improvement: '+15% product page conversion rate',
          implementation_time: '1 week',
          cost: 'low'
        }
      ]
    }

    return {
      success: true,
      friction_points: frictionPoints
    }

  } catch (error) {
    console.error('Identify friction points error:', error)
    return {
      success: false,
      error: 'Failed to identify friction points'
    }
  }
}

async function optimizeCustomerJourney(customerId: string, supabaseClient: any) {
  try {
    console.log(`🚀 Optimizing journey for customer: ${customerId}`)

    const journeyOptimization = {
      customer_id: customerId,
      current_journey_score: 7.2,
      optimization_recommendations: [
        {
          touchpoint: 'social_media_discovery',
          recommendation: 'Personalize content based on customer interests',
          expected_improvement: '+15% engagement',
          implementation: 'Use AI to analyze customer preferences and serve relevant content',
          priority: 'high'
        },
        {
          touchpoint: 'website_visit',
          recommendation: 'Implement personalized product recommendations',
          expected_improvement: '+20% conversion rate',
          implementation: 'Show products based on browsing history and similar customer behavior',
          priority: 'high'
        },
        {
          touchpoint: 'email_communication',
          recommendation: 'Send targeted email sequences',
          expected_improvement: '+25% email engagement',
          implementation: 'Create automated email flows based on customer behavior and preferences',
          priority: 'medium'
        },
        {
          touchpoint: 'post_purchase',
          recommendation: 'Implement loyalty program and referral system',
          expected_improvement: '+30% repeat purchases',
          implementation: 'Offer rewards for repeat purchases and successful referrals',
          priority: 'medium'
        }
      ],
      personalized_experience: {
        content_preferences: ['fashion', 'lifestyle', 'beauty'],
        preferred_platforms: ['instagram', 'email'],
        optimal_timing: {
          emails: '10:00 AM',
          social_posts: '7:00 PM',
          promotions: 'Friday afternoons'
        },
        product_recommendations: [
          'Summer Collection Dresses',
          'Accessories and Jewelry',
          'Beauty and Skincare Products'
        ]
      },
      automation_opportunities: [
        {
          trigger: 'First website visit',
          action: 'Send welcome email with personalized recommendations',
          timing: 'Within 1 hour',
          expected_impact: '+18% conversion rate'
        },
        {
          trigger: 'Cart abandonment',
          action: 'Send reminder email with discount offer',
          timing: 'Within 24 hours',
          expected_impact: '+22% recovery rate'
        },
        {
          trigger: 'Purchase completion',
          action: 'Send thank you email and request review',
          timing: 'Within 48 hours',
          expected_impact: '+15% review rate'
        }
      ],
      predicted_outcomes: {
        improved_conversion_rate: '+25%',
        reduced_journey_duration: '-30%',
        increased_customer_lifetime_value: '+40%',
        improved_customer_satisfaction: '+35%'
      }
    }

    return {
      success: true,
      optimization: journeyOptimization
    }

  } catch (error) {
    console.error('Optimize customer journey error:', error)
    return {
      success: false,
      error: 'Failed to optimize customer journey'
    }
  }
}

async function getConversionFunnel(dateFrom: string, dateTo: string, supabaseClient: any) {
  try {
    console.log('🔄 Analyzing conversion funnel...')

    const conversionFunnel = {
      period: {
        start: dateFrom,
        end: dateTo
      },
      funnel_stages: [
        {
          stage: 'Awareness',
          visitors: 50000,
          conversion_rate: 100,
          dropoff: 0,
          dropoff_rate: 0
        },
        {
          stage: 'Interest',
          visitors: 35000,
          conversion_rate: 70,
          dropoff: 15000,
          dropoff_rate: 30
        },
        {
          stage: 'Consideration',
          visitors: 21000,
          conversion_rate: 42,
          dropoff: 14000,
          dropoff_rate: 28
        },
        {
          stage: 'Intent',
          visitors: 12500,
          conversion_rate: 25,
          dropoff: 8500,
          dropoff_rate: 17
        },
        {
          stage: 'Purchase',
          visitors: 6250,
          conversion_rate: 12.5,
          dropoff: 6250,
          dropoff_rate: 12.5
        }
      ],
      stage_analysis: {
        'awareness_to_interest': {
          dropoff_rate: 30,
          primary_reasons: ['Irrelevant content', 'Poor first impression', 'Slow loading times'],
          optimization_opportunities: [
            'Improve content relevance and quality',
            'Optimize page loading speed',
            'Enhance visual appeal and user experience'
          ]
        },
        'interest_to_consideration': {
          dropoff_rate: 28,
          primary_reasons: ['Lack of product information', 'Poor navigation', 'No clear value proposition'],
          optimization_opportunities: [
            'Add detailed product descriptions and images',
            'Improve website navigation and search',
            'Highlight unique value propositions'
          ]
        },
        'consideration_to_intent': {
          dropoff_rate: 17,
          primary_reasons: ['High prices', 'Limited payment options', 'Poor reviews'],
          optimization_opportunities: [
            'Offer competitive pricing and discounts',
            'Add more payment methods',
            'Showcase positive customer reviews'
          ]
        },
        'intent_to_purchase': {
          dropoff_rate: 12.5,
          primary_reasons: ['Complex checkout process', 'Unexpected costs', 'Technical issues'],
          optimization_opportunities: [
            'Simplify checkout process',
            'Show all costs upfront',
            'Fix technical issues and improve reliability'
          ]
        }
      },
      optimization_recommendations: [
        {
          stage: 'Awareness to Interest',
          recommendation: 'Improve content quality and relevance',
          expected_improvement: '+15% conversion rate',
          implementation_cost: 'low',
          timeline: '2 weeks'
        },
        {
          stage: 'Interest to Consideration',
          recommendation: 'Enhance product pages with detailed information',
          expected_improvement: '+20% conversion rate',
          implementation_cost: 'medium',
          timeline: '3 weeks'
        },
        {
          stage: 'Consideration to Intent',
          recommendation: 'Implement competitive pricing and trust signals',
          expected_improvement: '+18% conversion rate',
          implementation_cost: 'medium',
          timeline: '4 weeks'
        },
        {
          stage: 'Intent to Purchase',
          recommendation: 'Streamline checkout process and reduce friction',
          expected_improvement: '+25% conversion rate',
          implementation_cost: 'high',
          timeline: '6 weeks'
        }
      ]
    }

    return {
      success: true,
      funnel: conversionFunnel
    }

  } catch (error) {
    console.error('Get conversion funnel error:', error)
    return {
      success: false,
      error: 'Failed to get conversion funnel'
    }
  }
} 