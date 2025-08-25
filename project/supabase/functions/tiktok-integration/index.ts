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

    const { action, hashtag, keyword, region, limit = 20 } = await req.json()

    // Validate input
    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let result: any = { success: false }

    switch (action) {
      case 'hashtag_search':
        result = await searchTikTokHashtag(hashtag, region, limit)
        break
      case 'keyword_search':
        result = await searchTikTokKeyword(keyword, region, limit)
        break
      case 'trending_videos':
        result = await getTrendingVideos(region, limit)
        break
      case 'user_videos':
        result = await getUserVideos(keyword, limit) // keyword is username in this case
        break
      default:
        result = { success: false, error: 'Unknown action' }
    }

    // Store discovered content in database
    if (result.success && result.data && result.data.length > 0) {
      await storeTikTokContent(result.data, supabaseClient)
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

async function searchTikTokHashtag(hashtag: string, region: string = 'US', limit: number) {
  const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY')
  const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')
  const accessToken = Deno.env.get('TIKTOK_ACCESS_TOKEN')

  if (!clientKey || !clientSecret || !accessToken) {
    return {
      success: false,
      error: 'TikTok credentials not configured',
      data: []
    }
  }

  try {
    // TikTok Hashtag Search API
    const searchUrl = 'https://open.tiktokapis.com/v2/hashtag/search/'
    const searchData = {
      query: hashtag,
      fields: ['id', 'title', 'subtitle', 'avatar_url']
    }

    const searchRes = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchData)
    })

    const searchResult = await searchRes.json()

    if (!searchResult.data || !searchResult.data.hashtags) {
      return {
        success: true,
        data: [],
        message: `No hashtag found for: ${hashtag}`
      }
    }

    const hashtagId = searchResult.data.hashtags[0]?.id

    if (!hashtagId) {
      return {
        success: true,
        data: [],
        message: 'No hashtag ID found'
      }
    }

    // Get videos for hashtag
    const videosUrl = 'https://open.tiktokapis.com/v2/hashtag/videos/'
    const videosData = {
      hashtag_id: hashtagId,
      fields: ['id', 'title', 'cover_image_url', 'video_url', 'duration', 'height', 'width', 'share_url', 'comment_count', 'digg_count', 'play_count', 'share_count', 'download_count', 'create_time', 'author', 'music', 'video', 'images', 'statistics']
    }

    const videosRes = await fetch(videosUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(videosData)
    })

    const videosResult = await videosRes.json()

    if (!videosResult.data || !videosResult.data.videos) {
      return {
        success: true,
        data: [],
        message: 'No videos found for hashtag'
      }
    }

    const formattedData = videosResult.data.videos.slice(0, limit).map((video: any) => ({
      id: video.id,
      platform: 'tiktok',
      content_type: 'video',
      author: {
        username: video.author?.unique_id || 'unknown',
        verified: video.author?.verified || false,
        followers: video.author?.follower_count || 0
      },
      content: {
        caption: video.title || '',
        media_url: video.video?.play_addr?.url_list?.[0] || video.cover_image_url,
        media_type: 'VIDEO',
        permalink: video.share_url,
        hashtags: extractHashtags(video.title || ''),
        duration: video.duration,
        thumbnail_url: video.cover_image_url
      },
      engagement: {
        likes: video.statistics?.digg_count || 0,
        comments: video.statistics?.comment_count || 0,
        shares: video.statistics?.share_count || 0,
        views: video.statistics?.play_count || 0,
        downloads: video.statistics?.download_count || 0
      },
      rights_status: 'pending',
      brand_tags: extractHashtags(video.title || ''),
      sentiment_score: '0.0',
      quality_score: '7.5',
      discovered_at: new Date().toISOString()
    }))

    return {
      success: true,
      data: formattedData,
      hashtag: hashtag,
      total: formattedData.length
    }

  } catch (error) {
    console.error('TikTok API error:', error)
    return {
      success: false,
      error: 'Failed to fetch TikTok data',
      data: []
    }
  }
}

async function searchTikTokKeyword(keyword: string, region: string = 'US', limit: number) {
  const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY')
  const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')
  const accessToken = Deno.env.get('TIKTOK_ACCESS_TOKEN')

  if (!clientKey || !clientSecret || !accessToken) {
    return {
      success: false,
      error: 'TikTok credentials not configured',
      data: []
    }
  }

  try {
    // TikTok Video Search API
    const searchUrl = 'https://open.tiktokapis.com/v2/video/search/'
    const searchData = {
      query: keyword,
      fields: ['id', 'title', 'cover_image_url', 'video_url', 'duration', 'height', 'width', 'share_url', 'comment_count', 'digg_count', 'play_count', 'share_count', 'download_count', 'create_time', 'author', 'music', 'video', 'images', 'statistics']
    }

    const searchRes = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchData)
    })

    const searchResult = await searchRes.json()

    if (!searchResult.data || !searchResult.data.videos) {
      return {
        success: true,
        data: [],
        message: 'No videos found for keyword'
      }
    }

    const formattedData = searchResult.data.videos.slice(0, limit).map((video: any) => ({
      id: video.id,
      platform: 'tiktok',
      content_type: 'video',
      author: {
        username: video.author?.unique_id || 'unknown',
        verified: video.author?.verified || false,
        followers: video.author?.follower_count || 0
      },
      content: {
        caption: video.title || '',
        media_url: video.video?.play_addr?.url_list?.[0] || video.cover_image_url,
        media_type: 'VIDEO',
        permalink: video.share_url,
        hashtags: extractHashtags(video.title || ''),
        duration: video.duration,
        thumbnail_url: video.cover_image_url
      },
      engagement: {
        likes: video.statistics?.digg_count || 0,
        comments: video.statistics?.comment_count || 0,
        shares: video.statistics?.share_count || 0,
        views: video.statistics?.play_count || 0,
        downloads: video.statistics?.download_count || 0
      },
      rights_status: 'pending',
      brand_tags: extractHashtags(video.title || ''),
      sentiment_score: '0.0',
      quality_score: '7.5',
      discovered_at: new Date().toISOString()
    }))

    return {
      success: true,
      data: formattedData,
      keyword: keyword,
      total: formattedData.length
    }

  } catch (error) {
    console.error('TikTok Keyword Search API error:', error)
    return {
      success: false,
      error: 'Failed to fetch TikTok keyword data',
      data: []
    }
  }
}

async function getTrendingVideos(region: string = 'US', limit: number) {
  const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY')
  const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')
  const accessToken = Deno.env.get('TIKTOK_ACCESS_TOKEN')

  if (!clientKey || !clientSecret || !accessToken) {
    return {
      success: false,
      error: 'TikTok credentials not configured',
      data: []
    }
  }

  try {
    // TikTok Trending Videos API
    const trendingUrl = 'https://open.tiktokapis.com/v2/video/trending/'
    const trendingData = {
      fields: ['id', 'title', 'cover_image_url', 'video_url', 'duration', 'height', 'width', 'share_url', 'comment_count', 'digg_count', 'play_count', 'share_count', 'download_count', 'create_time', 'author', 'music', 'video', 'images', 'statistics']
    }

    const trendingRes = await fetch(trendingUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(trendingData)
    })

    const trendingResult = await trendingRes.json()

    if (!trendingResult.data || !trendingResult.data.videos) {
      return {
        success: true,
        data: [],
        message: 'No trending videos found'
      }
    }

    const formattedData = trendingResult.data.videos.slice(0, limit).map((video: any) => ({
      id: video.id,
      platform: 'tiktok',
      content_type: 'video',
      author: {
        username: video.author?.unique_id || 'unknown',
        verified: video.author?.verified || false,
        followers: video.author?.follower_count || 0
      },
      content: {
        caption: video.title || '',
        media_url: video.video?.play_addr?.url_list?.[0] || video.cover_image_url,
        media_type: 'VIDEO',
        permalink: video.share_url,
        hashtags: extractHashtags(video.title || ''),
        duration: video.duration,
        thumbnail_url: video.cover_image_url
      },
      engagement: {
        likes: video.statistics?.digg_count || 0,
        comments: video.statistics?.comment_count || 0,
        shares: video.statistics?.share_count || 0,
        views: video.statistics?.play_count || 0,
        downloads: video.statistics?.download_count || 0
      },
      rights_status: 'pending',
      brand_tags: extractHashtags(video.title || ''),
      sentiment_score: '0.0',
      quality_score: '7.5',
      discovered_at: new Date().toISOString()
    }))

    return {
      success: true,
      data: formattedData,
      region: region,
      total: formattedData.length
    }

  } catch (error) {
    console.error('TikTok Trending API error:', error)
    return {
      success: false,
      error: 'Failed to fetch TikTok trending data',
      data: []
    }
  }
}

async function getUserVideos(username: string, limit: number) {
  const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY')
  const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')
  const accessToken = Deno.env.get('TIKTOK_ACCESS_TOKEN')

  if (!clientKey || !clientSecret || !accessToken) {
    return {
      success: false,
      error: 'TikTok credentials not configured',
      data: []
    }
  }

  try {
    // TikTok User Videos API
    const userVideosUrl = 'https://open.tiktokapis.com/v2/user/videos/'
    const userVideosData = {
      fields: ['id', 'title', 'cover_image_url', 'video_url', 'duration', 'height', 'width', 'share_url', 'comment_count', 'digg_count', 'play_count', 'share_count', 'download_count', 'create_time', 'author', 'music', 'video', 'images', 'statistics']
    }

    const userVideosRes = await fetch(userVideosUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userVideosData)
    })

    const userVideosResult = await userVideosRes.json()

    if (!userVideosResult.data || !userVideosResult.data.videos) {
      return {
        success: true,
        data: [],
        message: 'No videos found for user'
      }
    }

    const formattedData = userVideosResult.data.videos.slice(0, limit).map((video: any) => ({
      id: video.id,
      platform: 'tiktok',
      content_type: 'video',
      author: {
        username: video.author?.unique_id || username,
        verified: video.author?.verified || false,
        followers: video.author?.follower_count || 0
      },
      content: {
        caption: video.title || '',
        media_url: video.video?.play_addr?.url_list?.[0] || video.cover_image_url,
        media_type: 'VIDEO',
        permalink: video.share_url,
        hashtags: extractHashtags(video.title || ''),
        duration: video.duration,
        thumbnail_url: video.cover_image_url
      },
      engagement: {
        likes: video.statistics?.digg_count || 0,
        comments: video.statistics?.comment_count || 0,
        shares: video.statistics?.share_count || 0,
        views: video.statistics?.play_count || 0,
        downloads: video.statistics?.download_count || 0
      },
      rights_status: 'pending',
      brand_tags: extractHashtags(video.title || ''),
      sentiment_score: '0.0',
      quality_score: '7.5',
      discovered_at: new Date().toISOString()
    }))

    return {
      success: true,
      data: formattedData,
      username: username,
      total: formattedData.length
    }

  } catch (error) {
    console.error('TikTok User Videos API error:', error)
    return {
      success: false,
      error: 'Failed to fetch TikTok user videos data',
      data: []
    }
  }
}

async function storeTikTokContent(content: any[], supabaseClient: any) {
  try {
    const { error } = await supabaseClient
      .from('ugc_content')
      .insert(content)

    if (error) {
      console.error('Failed to store TikTok content:', error)
    } else {
      console.log(`Stored ${content.length} TikTok videos`)
    }
  } catch (error) {
    console.error('Database error:', error)
  }
}

function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g
  return text.match(hashtagRegex) || []
} 