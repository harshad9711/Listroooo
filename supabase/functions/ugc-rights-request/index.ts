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

    const { contentId, brandId, terms, contactEmail, message } = await req.json()

    // Validate input
    if (!contentId || !brandId) {
      return new Response(
        JSON.stringify({ error: 'Content ID and Brand ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get content details
    const { data: content, error: contentError } = await supabaseClient
      .from('ugc_content')
      .select('*')
      .eq('id', contentId)
      .single()

    if (contentError || !content) {
      return new Response(
        JSON.stringify({ error: 'Content not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create rights request
    const rightsRequest = {
      content_id: contentId,
      brand_id: brandId,
      status: 'pending'
    }

    const { data: request, error } = await supabaseClient
      .from('ugc_rights_requests')
      .insert(rightsRequest)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to create rights request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update content status
    await supabaseClient
      .from('ugc_content')
      .update({ rights_status: 'requested' })
      .eq('id', contentId)

    // Send email notification (placeholder for real email service)
    console.log(`📧 Rights request created for content ${content.id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        request,
        message: 'Rights request sent successfully' 
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

// Email functionality can be added here when ready for production
// Example: SendGrid, AWS SES, or similar email service integration 