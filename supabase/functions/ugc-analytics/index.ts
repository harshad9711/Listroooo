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

    const { dateFrom, dateTo, platform, status } = await req.json()

    // Build date filter
    let dateFilter = ''
    if (dateFrom || dateTo) {
      const filters = []
      if (dateFrom) filters.push(`discovered_at >= '${dateFrom}'`)
      if (dateTo) filters.push(`discovered_at <= '${dateTo}'`)
      dateFilter = filters.join(' AND ')
    }

    // Get total content count
    let contentQuery = supabaseClient
      .from('ugc_content')
      .select('*', { count: 'exact' })

    if (platform) contentQuery = contentQuery.eq('platform', platform)
    if (status) contentQuery = contentQuery.eq('rights_status', status)
    if (dateFilter) contentQuery = contentQuery.or(dateFilter)

    const { count: totalContent, error: contentError } = await contentQuery

    if (contentError) {
      console.error('Content query error:', contentError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch content analytics' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get content by platform
    const { data: platformData, error: platformError } = await supabaseClient
      .from('ugc_content')
      .select('platform, rights_status')
      .or(dateFilter || 'discovered_at >= now() - interval \'30 days\'')

    if (platformError) {
      console.error('Platform query error:', platformError)
    }

    // Get content by status
    const { data: statusData, error: statusError } = await supabaseClient
      .from('ugc_content')
      .select('rights_status')
      .or(dateFilter || 'discovered_at >= now() - interval \'30 days\'')

    if (statusError) {
      console.error('Status query error:', statusError)
    }

    // Get recent activity
    const { data: recentActivity, error: activityError } = await supabaseClient
      .from('ugc_content')
      .select('*')
      .order('discovered_at', { ascending: false })
      .limit(5)

    if (activityError) {
      console.error('Activity query error:', activityError)
    }

    // Calculate analytics
    const analytics = calculateAnalytics(platformData || [], statusData || [], recentActivity || [])

    return new Response(
      JSON.stringify({ 
        success: true, 
        analytics,
        totalContent: totalContent || 0,
        recentActivity: recentActivity || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

function calculateWeeklyGrowth(recentActivity: any[]) {
  if (recentActivity.length === 0) return '0%'
  
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  const thisWeek = recentActivity.filter((item: any) => 
    new Date(item.created_at) >= weekAgo
  ).length
  
  const lastWeek = recentActivity.filter((item: any) => {
    const itemDate = new Date(item.created_at)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    return itemDate >= twoWeeksAgo && itemDate < weekAgo
  }).length
  
  if (lastWeek === 0) return thisWeek > 0 ? '100%' : '0%'
  
  const growth = ((thisWeek - lastWeek) / lastWeek) * 100
  return growth.toFixed(1) + '%'
}

function calculateAnalytics(platformData: any[], statusData: any[], recentActivity: any[]) {
  // Platform breakdown
  const platformBreakdown = platformData.reduce((acc: any, item: any) => {
    acc[item.platform] = (acc[item.platform] || 0) + 1
    return acc
  }, {})

  // Status breakdown
  const statusBreakdown = statusData.reduce((acc: any, item: any) => {
    acc[item.rights_status] = (acc[item.rights_status] || 0) + 1
    return acc
  }, {})

  // Engagement metrics
  const totalEngagement = recentActivity.reduce((sum: number, item: any) => {
    const engagement = item.engagement || {}
    return sum + (engagement.likes || 0) + (engagement.comments || 0) + (engagement.shares || 0)
  }, 0)

  const avgEngagement = recentActivity.length > 0 ? totalEngagement / recentActivity.length : 0

  // Quality metrics
  const qualityScores = recentActivity
    .map((item: any) => parseFloat(item.quality_score || 0))
    .filter(score => score > 0)

  const avgQualityScore = qualityScores.length > 0 
    ? qualityScores.reduce((sum: number, score: number) => sum + score, 0) / qualityScores.length 
    : 0

  // Sentiment analysis
  const sentimentScores = recentActivity
    .map((item: any) => parseFloat(item.sentiment_score || 0))
    .filter(score => score !== 0)

  const avgSentiment = sentimentScores.length > 0
    ? sentimentScores.reduce((sum: number, score: number) => sum + score, 0) / sentimentScores.length
    : 0

  return {
    platformBreakdown,
    statusBreakdown,
    engagement: {
      total: totalEngagement,
      average: Math.round(avgEngagement),
      topPerformer: recentActivity.length > 0 ? Math.max(...recentActivity.map((item: any) => 
        (item.engagement?.likes || 0) + (item.engagement?.comments || 0) + (item.engagement?.shares || 0)
      )) : 0
    },
    quality: {
      averageScore: avgQualityScore.toFixed(1),
      highQuality: qualityScores.filter((score: number) => score >= 8).length,
      totalRated: qualityScores.length
    },
    sentiment: {
      averageScore: avgSentiment.toFixed(2),
      positive: sentimentScores.filter((score: number) => score > 0.3).length,
      negative: sentimentScores.filter((score: number) => score < -0.3).length,
      neutral: sentimentScores.filter((score: number) => score >= -0.3 && score <= 0.3).length
    },
    trends: {
      dailyDiscovery: recentActivity.filter((item: any) => {
        const today = new Date().toDateString()
        const itemDate = new Date(item.created_at).toDateString()
        return itemDate === today
      }).length,
      weeklyGrowth: calculateWeeklyGrowth(recentActivity),
      topPlatform: Object.keys(platformBreakdown).reduce((a: string, b: string) => 
        platformBreakdown[a] > platformBreakdown[b] ? a : b, 'instagram'
      )
    }
  }
} 