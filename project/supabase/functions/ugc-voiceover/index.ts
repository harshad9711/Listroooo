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

    const { contentId, script, voiceType, language } = await req.json()

    // Validate input
    if (!contentId) {
      return new Response(
        JSON.stringify({ error: 'Content ID is required' }),
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

    // Generate script if not provided
    const finalScript = script || await generateScript(content)

    // Create voiceover record
    const voiceoverRecord = {
      content_id: contentId,
      voice_type: voiceType || 'energetic',
      language: language || 'en',
      script: finalScript,
      status: 'processing',
      created_at: new Date().toISOString()
    }

    const { data: voiceover, error: voiceoverError } = await supabaseClient
      .from('ugc_voiceovers')
      .insert(voiceoverRecord)
      .select()
      .single()

    if (voiceoverError) {
      console.error('Database error:', voiceoverError)
      return new Response(
        JSON.stringify({ error: 'Failed to create voiceover record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate voiceover (mock AI processing)
    const generatedVoiceover = await generateVoiceover(finalScript, voiceType, language)

    // Update voiceover record with results
    const { data: updatedVoiceover, error: updateError } = await supabaseClient
      .from('ugc_voiceovers')
      .update({
        status: 'completed',
        audio_url: generatedVoiceover.audioUrl,
        duration: generatedVoiceover.duration,
        completed_at: new Date().toISOString()
      })
      .eq('id', voiceover.id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        voiceover: updatedVoiceover || voiceover,
        generatedAudio: generatedVoiceover,
        message: 'Voiceover generated successfully' 
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

async function generateScript(content: any): Promise<string> {
  // Mock AI script generation - replace with real AI service
  console.log(`📝 Generating script for content ${content.id}`)
  
  const caption = content.content.caption || ''
  const hashtags = content.content.hashtags || []
  
  // Simple script generation based on content
  const baseScript = `Check out this amazing content! ${caption.replace(/[#@]\w+/g, '').trim()}`
  
  const scripts = [
    `${baseScript} This is absolutely incredible!`,
    `You won't believe what we found! ${baseScript}`,
    `Amazing discovery alert! ${baseScript}`,
    `This is the content you've been waiting for! ${baseScript}`,
    `Incredible find! ${baseScript} You need to see this!`
  ]
  
  return scripts[Math.floor(Math.random() * scripts.length)]
}

async function generateVoiceover(script: string, voiceType: string, language: string) {
  // Mock voiceover generation - replace with real TTS service
  console.log(`🎤 Generating voiceover: "${script}" with voice ${voiceType}`)
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  const duration = script.length * 0.06 + Math.random() * 2 // Rough estimate
  const audioUrl = `https://api.elevenlabs.io/v1/text-to-speech/mock-voice-id?voice_type=${voiceType}&language=${language}&timestamp=${Date.now()}`
  
  return {
    audioUrl: audioUrl,
    duration: duration.toFixed(2),
    voiceType: voiceType,
    language: language,
    wordCount: script.split(' ').length,
    processingTime: 3.2,
    quality: 'high'
  }
} 