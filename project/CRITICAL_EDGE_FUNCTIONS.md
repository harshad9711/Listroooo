# Critical Edge Functions Implementation Guide

## 🚨 **Immediate Priority Functions**

These Edge Functions are critical for basic functionality and business connections.

### 1. **Marketing Metrics Function** (`marketing-metrics/index.ts`)

```typescript
// supabase/functions/marketing-metrics/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { dateRange = '30d' } = await req.json()

    // Mock data for now - replace with real analytics
    const metrics = {
      revenue: Math.random() * 50000,
      orders: Math.floor(Math.random() * 1000),
      customers: Math.floor(Math.random() * 500),
      conversion_rate: Math.random() * 5,
      average_order_value: Math.random() * 100,
      date_range: dateRange
    }

    return new Response(
      JSON.stringify({ success: true, data: metrics }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
```

### 2. **Sync Inventory Function** (`sync-inventory/index.ts`)

```typescript
// supabase/functions/sync-inventory/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

    if (!user) {
      throw new Error('Unauthorized')
    }

    // Mock inventory data - replace with real platform sync
    const inventory = [
      {
        id: '1',
        sku: 'PROD-001',
        name: 'Sample Product',
        quantity: Math.floor(Math.random() * 100),
        platform: 'shopify',
        last_sync: new Date().toISOString()
      }
    ]

    return new Response(
      JSON.stringify({ success: true, inventory }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
```

### 3. **Send Email Function** (`send-email/index.ts`)

```typescript
// supabase/functions/send-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, from = 'noreply@yourdomain.com' } = await req.json()
    
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
    
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    })

    if (error) {
      throw new Error(error.message)
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
```

### 4. **Generate Veo3 Prompt Function** (`generate-veo3-prompt/index.ts`)

```typescript
// supabase/functions/generate-veo3-prompt/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userIdea, tone = 'professional', style = 'modern' } = await req.json()
    
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    })

    const prompt = `Create a Veo3 video prompt based on this idea: "${userIdea}"
    
    Requirements:
    - Tone: ${tone}
    - Style: ${style}
    - Format: Optimized for Veo3 video generation
    - Length: 15-30 seconds
    - Include visual descriptions and camera movements
    
    Generate a detailed, cinematic prompt that will create an engaging video.`

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        prompt: response.content[0].text 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
```

### 5. **OAuth Meta Function** (`oauth-meta/index.ts`)

```typescript
// supabase/functions/oauth-meta/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, state } = await req.json()
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://graph.facebook.com/v19.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: Deno.env.get('FACEBOOK_APP_ID')!,
        client_secret: Deno.env.get('FACEBOOK_APP_SECRET')!,
        redirect_uri: Deno.env.get('FACEBOOK_REDIRECT_URI')!,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      throw new Error(tokenData.error.message)
    }

    // Store token in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

    if (!user) {
      throw new Error('Unauthorized')
    }

    // Store OAuth token
    await supabase
      .from('oauth_tokens')
      .upsert({
        user_id: user.id,
        platform: 'facebook',
        access_token: tokenData.access_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      })

    return new Response(
      JSON.stringify({ success: true, access_token: tokenData.access_token }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
```

## 🔧 **Deployment Instructions**

### 1. **Deploy to Supabase**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
supabase functions deploy marketing-metrics
supabase functions deploy sync-inventory
supabase functions deploy send-email
supabase functions deploy generate-veo3-prompt
supabase functions deploy oauth-meta
```

### 2. **Set Environment Variables**

```bash
# Set secrets in Supabase
supabase secrets set RESEND_API_KEY=your_resend_key
supabase secrets set ANTHROPIC_API_KEY=your_anthropic_key
supabase secrets set FACEBOOK_APP_ID=your_facebook_app_id
supabase secrets set FACEBOOK_APP_SECRET=your_facebook_app_secret
supabase secrets set FACEBOOK_REDIRECT_URI=your_redirect_uri
```

### 3. **Test Functions**

```bash
# Test locally
supabase functions serve

# Test deployed functions
curl -X POST https://your-project.supabase.co/functions/v1/marketing-metrics \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"dateRange": "7d"}'
```

## 📋 **Next Steps After Implementation**

1. **Replace mock data** with real API calls
2. **Add error handling** and retry logic
3. **Implement rate limiting** and caching
4. **Add logging** and monitoring
5. **Set up webhooks** for real-time updates
6. **Implement proper authentication** and authorization
7. **Add data validation** and sanitization

## 🚨 **Critical Missing Pieces**

1. **Database tables** for OAuth tokens, user subscriptions, etc.
2. **Real platform API integrations** (Shopify, TikTok, etc.)
3. **Payment processing** (Stripe integration)
4. **File storage** (AWS S3 for uploads)
5. **Real-time notifications** (WebSocket connections)
6. **Analytics tracking** (user behavior, conversions)
7. **Security measures** (rate limiting, input validation) 