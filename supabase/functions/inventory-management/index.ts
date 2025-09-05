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

    const { action, ...data } = await req.json()

    switch (action) {
      case 'get_inventory':
        return await getInventory(supabaseClient)
      case 'add_item':
        return await addInventoryItem(supabaseClient, data)
      case 'update_item':
        return await updateInventoryItem(supabaseClient, data)
      case 'delete_item':
        return await deleteInventoryItem(supabaseClient, data)
      case 'get_low_stock':
        return await getLowStockItems(supabaseClient)
      case 'get_metrics':
        return await getInventoryMetrics(supabaseClient)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function getInventory(supabaseClient: any) {
  const { data: items, error } = await supabaseClient
    .from('inventory_items')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Database error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch inventory' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      items: items || [],
      total: items?.length || 0
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function addInventoryItem(supabaseClient: any, data: any) {
  const { platform, title, quantity, status = 'active' } = data

  if (!platform || !title || quantity === undefined) {
    return new Response(
      JSON.stringify({ error: 'Platform, title, and quantity are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data: item, error } = await supabaseClient
    .from('inventory_items')
    .insert({
      platform,
      title,
      quantity: parseInt(quantity),
      status
    })
    .select()
    .single()

  if (error) {
    console.error('Database error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to add inventory item' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      item,
      message: 'Inventory item added successfully' 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateInventoryItem(supabaseClient: any, data: any) {
  const { id, platform, title, quantity, status } = data

  if (!id) {
    return new Response(
      JSON.stringify({ error: 'Item ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const updateData: any = {}
  if (platform) updateData.platform = platform
  if (title) updateData.title = title
  if (quantity !== undefined) updateData.quantity = parseInt(quantity)
  if (status) updateData.status = status

  const { data: item, error } = await supabaseClient
    .from('inventory_items')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Database error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to update inventory item' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      item,
      message: 'Inventory item updated successfully' 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function deleteInventoryItem(supabaseClient: any, data: any) {
  const { id } = data

  if (!id) {
    return new Response(
      JSON.stringify({ error: 'Item ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { error } = await supabaseClient
    .from('inventory_items')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Database error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to delete inventory item' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Inventory item deleted successfully' 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getLowStockItems(supabaseClient: any) {
  const { data: items, error } = await supabaseClient
    .from('inventory_items')
    .select('*')
    .lt('quantity', 10)
    .eq('status', 'active')
    .order('quantity', { ascending: true })

  if (error) {
    console.error('Database error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch low stock items' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      items: items || [],
      count: items?.length || 0
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getInventoryMetrics(supabaseClient: any) {
  // Get total items
  const { count: totalItems, error: totalError } = await supabaseClient
    .from('inventory_items')
    .select('*', { count: 'exact' })

  if (totalError) {
    console.error('Total items error:', totalError)
  }

  // Get items by platform
  const { data: platformData, error: platformError } = await supabaseClient
    .from('inventory_items')
    .select('platform, quantity')

  if (platformError) {
    console.error('Platform data error:', platformError)
  }

  // Get low stock items
  const { count: lowStockCount, error: lowStockError } = await supabaseClient
    .from('inventory_items')
    .select('*', { count: 'exact' })
    .lt('quantity', 10)
    .eq('status', 'active')

  if (lowStockError) {
    console.error('Low stock error:', lowStockError)
  }

  // Calculate metrics
  const platformBreakdown = (platformData || []).reduce((acc: any, item: any) => {
    acc[item.platform] = (acc[item.platform] || 0) + item.quantity
    return acc
  }, {})

  const totalQuantity = (platformData || []).reduce((sum: number, item: any) => sum + item.quantity, 0)

  return new Response(
    JSON.stringify({ 
      success: true, 
      metrics: {
        totalItems: totalItems || 0,
        totalQuantity,
        lowStockItems: lowStockCount || 0,
        platformBreakdown,
        averageQuantity: totalItems > 0 ? Math.round(totalQuantity / totalItems) : 0
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
} 