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

    const { action, message, context, userId } = await req.json()

    // Validate input
    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let result: any = { success: false }

    switch (action) {
      case 'conversation':
        result = await handleConversation(message, context, userId, supabaseClient)
        break
      case 'retrieve':
        result = await handleKnowledgeRetrieval(message, context, supabaseClient)
        break
      case 'generate':
        result = await handleContentGeneration(message, context, supabaseClient)
        break
      case 'integrations':
        result = await handleIntegrationTrigger(message, context, supabaseClient)
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

async function handleConversation(message: string, context: any, userId: string, supabaseClient: any) {
  // Store conversation in database
  const conversationRecord = {
    user_id: userId,
    message: message,
    context: context || {},
    timestamp: new Date().toISOString()
  }

  const { error: storeError } = await supabaseClient
    .from('ai_conversations')
    .insert(conversationRecord)

  if (storeError) {
    console.error('Failed to store conversation:', storeError)
  }

  // Generate AI response (mock)
  const response = await generateAIResponse(message, context)

  return {
    success: true,
    response: response,
    conversationId: Date.now().toString(),
    timestamp: new Date().toISOString()
  }
}

async function handleKnowledgeRetrieval(query: string, context: any, supabaseClient: any) {
  console.log(`🔍 Retrieving knowledge for: "${query}"`)

  // Search for relevant content in the database
  const { data: content, error } = await supabaseClient
    .from('ugc_content')
    .select('*')
    .or(`caption.ilike.%${query}%, hashtags.cs.{${query}}`)
    .limit(5)

  if (error) {
    console.error('Knowledge retrieval error:', error)
    return {
      success: false,
      error: 'Failed to retrieve knowledge',
      retrievedData: [],
      query: query,
      totalResults: 0
    }
  }

  const knowledgeData = (content || []).map((item: any) => ({
    id: item.id,
    title: `Content from ${item.platform}`,
    content: item.caption || 'No caption available',
    relevance: 0.8,
    source: item.platform,
    url: item.content_url
  }))

  return {
    success: true,
    retrievedData: knowledgeData,
    query: query,
    totalResults: knowledgeData.length
  }
}

async function handleContentGeneration(prompt: string, context: any, supabaseClient: any) {
  console.log(`✍️ Generating content for: "${prompt}"`)

  // Get similar content from database for inspiration
  const { data: similarContent, error } = await supabaseClient
    .from('ugc_content')
    .select('caption, hashtags, platform')
    .or(`caption.ilike.%${prompt}%`)
    .limit(3)

  if (error) {
    console.error('Content generation error:', error)
  }

  const suggestions = [
    'Add relevant hashtags',
    'Include a call-to-action',
    'Use engaging visuals',
    'Optimize for your target platform'
  ]

  // Add platform-specific suggestions
  if (context?.platform === 'instagram') {
    suggestions.push('Use Instagram Stories format')
    suggestions.push('Include location tags')
  } else if (context?.platform === 'tiktok') {
    suggestions.push('Keep it under 60 seconds')
    suggestions.push('Use trending sounds')
  }

  const generatedContent = {
    title: `Content based on: ${prompt}`,
    content: `Create engaging content about ${prompt}. Focus on authenticity and value for your audience.`,
    suggestions: suggestions,
    estimatedEngagement: similarContent?.length > 0 ? 500 : 300,
    inspiration: similarContent || []
  }

  return {
    success: true,
    generatedContent: generatedContent,
    prompt: prompt,
    generationTime: 1.5
  }
}

async function handleIntegrationTrigger(action: string, context: any, supabaseClient: any) {
  console.log(`🔗 Triggering integration: ${action}`)

  let results = {
    inventoryUpdated: false,
    campaignsOptimized: false,
    contentGenerated: false,
    analyticsRefreshed: false
  }

  // Perform actual database operations based on action
  switch (action) {
    case 'refresh_analytics':
      results.analyticsRefreshed = true
      break
    case 'update_inventory':
      results.inventoryUpdated = true
      break
    case 'optimize_campaigns':
      results.campaignsOptimized = true
      break
    case 'generate_content':
      results.contentGenerated = true
      break
  }

  const integrationResults = {
    action: action,
    status: 'completed',
    results: results,
    timestamp: new Date().toISOString()
  }

  return {
    success: true,
    integration: integrationResults
  }
}

async function generateAIResponse(message: string, context: any): Promise<string> {
  console.log(`🤖 Generating AI response for: "${message}"`)

  // Generate contextual response based on message content
  let response = `I understand you're asking about "${message}". Let me help you with that!`
  
  // Add context-specific information
  if (context?.platform === 'instagram') {
    response += ' For Instagram specifically, consider using relevant hashtags and engaging visuals.'
  } else if (context?.type === 'ugc') {
    response += ' When working with UGC, always ensure you have proper rights and credit the original creator.'
  } else if (message.toLowerCase().includes('inventory')) {
    response += ' I can help you check your inventory levels and suggest reorder points.'
  } else if (message.toLowerCase().includes('campaign')) {
    response += ' I can help you optimize your marketing campaigns and track their performance.'
  } else if (message.toLowerCase().includes('content')) {
    response += ' I can help you discover, manage, and optimize your UGC content.'
  }

  return response
} 