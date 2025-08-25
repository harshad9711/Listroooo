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

    const { action, hashtag, locationId, userId, limit = 20 } = await req.json()

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
        result = await searchHashtag(hashtag, limit)
        break
      case 'location_posts':
        result = await getLocationPosts(locationId, limit)
        break
      case 'user_posts':
        result = await getUserPosts(userId, limit)
        break
      case 'user_profile':
        result = await getUserProfile(userId)
        break
      default:
        result = { success: false, error: 'Unknown action' }
    }

    // Store discovered content in database
    if (result.success && result.data && result.data.length > 0) {
      await storeInstagramContent(result.data, supabaseClient)
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

async function searchHashtag(hashtag: string, limit: number) {
  const accessToken = Deno.env.get('INSTAGRAM_ACCESS_TOKEN')
  const userId = Deno.env.get('INSTAGRAM_USER_ID')

  if (!accessToken || !userId) {
    return {
      success: false,
      error: 'Instagram credentials not configured',
      data: []
    }
  }

  try {
    // 1. Search for hashtag ID
    const hashtagSearchUrl = `https://graph.facebook.com/v19.0/ig_hashtag_search?user_id=${userId}&q=${encodeURIComponent(hashtag)}&access_token=${accessToken}`
    const hashtagRes = await fetch(hashtagSearchUrl)
    const hashtagData = await hashtagRes.json()

    if (!hashtagData.data || !hashtagData.data[0]) {
      return {
        success: true,
        data: [],
        message: `No hashtag found for: ${hashtag}`
      }
    }

    const hashtagId = hashtagData.data[0].id

    // 2. Get recent media for hashtag
    const mediaUrl = `https://graph.facebook.com/v19.0/${hashtagId}/recent_media?user_id=${userId}&fields=id,caption,media_type,media_url,permalink,timestamp,username,like_count,comments_count&access_token=${accessToken}&limit=${limit}`
    const mediaRes = await fetch(mediaUrl)
    const mediaData = await mediaRes.json()

    if (!mediaData.data) {
      return {
        success: true,
        data: [],
        message: 'No media found for hashtag'
      }
    }

    const formattedData = mediaData.data.map((post: any) => ({
      id: post.id,
      platform: 'instagram',
      content_type: 'post',
      author: {
        username: post.username,
        verified: false // Would need additional API call to check
      },
      content: {
        caption: post.caption || '',
        media_url: post.media_url,
        media_type: post.media_type,
        permalink: post.permalink,
        hashtags: extractHashtags(post.caption || '')
      },
      engagement: {
        likes: post.like_count || 0,
        comments: post.comments_count || 0,
        shares: 0, // Instagram API doesn't provide shares
        views: 0 // Would need additional API call
      },
      rights_status: 'pending',
      brand_tags: extractHashtags(post.caption || ''),
      sentiment_score: '0.0', // Would need AI analysis
      quality_score: '7.5', // Mock score
      discovered_at: new Date().toISOString()
    }))

    return {
      success: true,
      data: formattedData,
      hashtag: hashtag,
      total: formattedData.length
    }

  } catch (error) {
    console.error('Instagram API error:', error)
    return {
      success: false,
      error: 'Failed to fetch Instagram data',
      data: []
    }
  }
}

async function getLocationPosts(locationId: string, limit: number) {
  const accessToken = Deno.env.get('INSTAGRAM_ACCESS_TOKEN')
  const userId = Deno.env.get('INSTAGRAM_USER_ID')

  if (!accessToken || !userId) {
    return {
      success: false,
      error: 'Instagram credentials not configured',
      data: []
    }
  }

  try {
    // Get recent media for location
    const mediaUrl = `https://graph.facebook.com/v19.0/${locationId}/recent_media?user_id=${userId}&fields=id,caption,media_type,media_url,permalink,timestamp,username,like_count,comments_count&access_token=${accessToken}&limit=${limit}`
    const mediaRes = await fetch(mediaUrl)
    const mediaData = await mediaRes.json()

    if (!mediaData.data) {
      return {
        success: true,
        data: [],
        message: 'No media found for location'
      }
    }

    const formattedData = mediaData.data.map((post: any) => ({
      id: post.id,
      platform: 'instagram',
      content_type: 'post',
      author: {
        username: post.username,
        verified: false
      },
      content: {
        caption: post.caption || '',
        media_url: post.media_url,
        media_type: post.media_type,
        permalink: post.permalink,
        hashtags: extractHashtags(post.caption || ''),
        location_id: locationId
      },
      engagement: {
        likes: post.like_count || 0,
        comments: post.comments_count || 0,
        shares: 0,
        views: 0
      },
      rights_status: 'pending',
      brand_tags: extractHashtags(post.caption || ''),
      sentiment_score: '0.0',
      quality_score: '7.5',
      discovered_at: new Date().toISOString()
    }))

    return {
      success: true,
      data: formattedData,
      locationId: locationId,
      total: formattedData.length
    }

  } catch (error) {
    console.error('Instagram Location API error:', error)
    return {
      success: false,
      error: 'Failed to fetch Instagram location data',
      data: []
    }
  }
}

async function getUserPosts(userId: string, limit: number) {
  const accessToken = Deno.env.get('INSTAGRAM_ACCESS_TOKEN')
  const businessUserId = Deno.env.get('INSTAGRAM_USER_ID')

  if (!accessToken || !businessUserId) {
    return {
      success: false,
      error: 'Instagram credentials not configured',
      data: []
    }
  }

  try {
    // Get user's media
    const mediaUrl = `https://graph.facebook.com/v19.0/${userId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&access_token=${accessToken}&limit=${limit}`
    const mediaRes = await fetch(mediaUrl)
    const mediaData = await mediaRes.json()

    if (!mediaData.data) {
      return {
        success: true,
        data: [],
        message: 'No media found for user'
      }
    }

    const formattedData = mediaData.data.map((post: any) => ({
      id: post.id,
      platform: 'instagram',
      content_type: 'post',
      author: {
        username: userId,
        verified: false
      },
      content: {
        caption: post.caption || '',
        media_url: post.media_url,
        media_type: post.media_type,
        permalink: post.permalink,
        hashtags: extractHashtags(post.caption || '')
      },
      engagement: {
        likes: post.like_count || 0,
        comments: post.comments_count || 0,
        shares: 0,
        views: 0
      },
      rights_status: 'pending',
      brand_tags: extractHashtags(post.caption || ''),
      sentiment_score: '0.0',
      quality_score: '7.5',
      discovered_at: new Date().toISOString()
    }))

    return {
      success: true,
      data: formattedData,
      userId: userId,
      total: formattedData.length
    }

  } catch (error) {
    console.error('Instagram User API error:', error)
    return {
      success: false,
      error: 'Failed to fetch Instagram user data',
      data: []
    }
  }
}

async function getUserProfile(username: string) {
  const accessToken = Deno.env.get('INSTAGRAM_ACCESS_TOKEN')

  if (!accessToken) {
    return {
      success: false,
      error: 'Instagram credentials not configured'
    }
  }

  try {
    // Get user profile information
    const profileUrl = `https://graph.facebook.com/v19.0/${username}?fields=id,username,account_type,media_count,followers_count,follows_count,biography,profile_picture_url&access_token=${accessToken}`
    const profileRes = await fetch(profileUrl)
    const profileData = await profileRes.json()

    if (profileData.error) {
      return {
        success: false,
        error: profileData.error.message
      }
    }

    return {
      success: true,
      data: profileData
    }

  } catch (error) {
    console.error('Instagram Profile API error:', error)
    return {
      success: false,
      error: 'Failed to fetch Instagram profile data'
    }
  }
}

async function storeInstagramContent(content: any[], supabaseClient: any) {
  try {
    const { error } = await supabaseClient
      .from('ugc_content')
      .insert(content)

    if (error) {
      console.error('Failed to store Instagram content:', error)
    } else {
      console.log(`Stored ${content.length} Instagram posts`)
    }
  } catch (error) {
    console.error('Database error:', error)
  }
}

function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g
  return text.match(hashtagRegex) || []
} 