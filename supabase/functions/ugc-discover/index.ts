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

    const { hashtags, keywords, platforms, limit = 20 } = await req.json()

    // Validate input
    if (!hashtags && !keywords) {
      return new Response(
        JSON.stringify({ error: 'Hashtags or keywords are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mock content discovery (replace with real API calls)
    const discoveredContent = await discoverContent(hashtags, keywords, platforms, limit)

    // Store discovered content in database
    const { data: storedContent, error } = await supabaseClient
      .from('ugc_content')
      .insert(discoveredContent)
      .select()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to store content' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        content: storedContent,
        total: storedContent.length 
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
})

async function discoverContent(hashtags: string[], keywords: string[], platforms: string[], limit: number) {
  const content = []
  const searchTerms = [...hashtags, ...keywords]
  
  for (const term of searchTerms.slice(0, limit)) {
    // Mock Instagram content
    if (platforms.includes('instagram') || platforms.length === 0) {
      content.push({
        platform: 'instagram',
        platform_content_id: `instagram_${Date.now()}_${Math.random()}`,
        creator_username: `user_${Math.random().toString(36).substr(2, 8)}`,
        content_type: 'image',
        content_url: `https://picsum.photos/400/400?random=${Math.random()}`,
        caption: `Amazing content about ${term}! #${term} #lifestyle #amazing`,
        hashtags: [term, 'lifestyle', 'amazing'],
        rights_status: 'unknown'
      })
    }

    // Mock TikTok content
    if (platforms.includes('tiktok')) {
      content.push({
        platform: 'tiktok',
        platform_content_id: `tiktok_${Date.now()}_${Math.random()}`,
        creator_username: `tiktok_user_${Math.random().toString(36).substr(2, 8)}`,
        content_type: 'video',
        content_url: `https://picsum.photos/400/600?random=${Math.random()}`,
        caption: `Check out this ${term} video! #${term} #viral #trending`,
        hashtags: [term, 'viral', 'trending'],
        rights_status: 'unknown'
      })
    }
  }

  return content
} 