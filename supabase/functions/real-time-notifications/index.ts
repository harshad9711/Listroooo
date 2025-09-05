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

    const { action, userId, notificationType, data, priority } = await req.json()

    // Validate input
    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let result: any = { success: false }

    switch (action) {
      case 'send_notification':
        result = await sendNotification(userId, notificationType, data, priority, supabaseClient)
        break
      case 'get_notifications':
        result = await getNotifications(userId, supabaseClient)
        break
      case 'mark_as_read':
        result = await markNotificationAsRead(userId, data.notificationId, supabaseClient)
        break
      case 'create_alert':
        result = await createAlert(userId, data, supabaseClient)
        break
      case 'send_automated_notification':
        result = await sendAutomatedNotification(userId, notificationType, data, supabaseClient)
        break
      case 'get_notification_settings':
        result = await getNotificationSettings(userId, supabaseClient)
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

async function sendNotification(userId: string, notificationType: string, data: any, priority: string = 'normal', supabaseClient: any) {
  try {
    console.log(`📢 Sending ${priority} notification to user: ${userId}`)

    const notification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      type: notificationType,
      title: data.title,
      message: data.message,
      data: data.additionalData || {},
      priority: priority,
      status: 'unread',
      created_at: new Date().toISOString(),
      expires_at: data.expiresAt || null,
      action_url: data.actionUrl || null,
      category: data.category || 'general'
    }

    // Store notification in database
    const { data: storedNotification, error } = await supabaseClient
      .from('notifications')
      .insert(notification)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        error: 'Failed to send notification'
      }
    }

    // Send real-time notification via WebSocket if available
    if (data.sendRealtime) {
      await sendRealtimeNotification(userId, storedNotification)
    }

    return {
      success: true,
      notification: storedNotification,
      message: 'Notification sent successfully'
    }

  } catch (error) {
    console.error('Send notification error:', error)
    return {
      success: false,
      error: 'Failed to send notification'
    }
  }
}

async function getNotifications(userId: string, supabaseClient: any) {
  try {
    console.log(`📋 Getting notifications for user: ${userId}`)

    const { data: notifications, error } = await supabaseClient
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        error: 'Failed to get notifications'
      }
    }

    const unreadCount = notifications?.filter(n => n.status === 'unread').length || 0

    return {
      success: true,
      notifications: notifications || [],
      unread_count: unreadCount,
      total_count: notifications?.length || 0
    }

  } catch (error) {
    console.error('Get notifications error:', error)
    return {
      success: false,
      error: 'Failed to get notifications'
    }
  }
}

async function markNotificationAsRead(userId: string, notificationId: string, supabaseClient: any) {
  try {
    console.log(`✅ Marking notification as read: ${notificationId}`)

    const { data, error } = await supabaseClient
      .from('notifications')
      .update({ 
        status: 'read',
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        error: 'Failed to mark notification as read'
      }
    }

    return {
      success: true,
      notification: data,
      message: 'Notification marked as read'
    }

  } catch (error) {
    console.error('Mark notification as read error:', error)
    return {
      success: false,
      error: 'Failed to mark notification as read'
    }
  }
}

async function createAlert(userId: string, alertData: any, supabaseClient: any) {
  try {
    console.log(`🚨 Creating alert for user: ${userId}`)

    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      type: alertData.type,
      severity: alertData.severity || 'medium',
      title: alertData.title,
      message: alertData.message,
      category: alertData.category || 'system',
      data: alertData.data || {},
      status: 'active',
      created_at: new Date().toISOString(),
      expires_at: alertData.expiresAt || null,
      action_required: alertData.actionRequired || false,
      auto_resolve: alertData.autoResolve || false
    }

    // Store alert in database
    const { data: storedAlert, error } = await supabaseClient
      .from('alerts')
      .insert(alert)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        error: 'Failed to create alert'
      }
    }

    // Send high-priority notification for critical alerts
    if (alertData.severity === 'critical') {
      await sendNotification(userId, 'alert', {
        title: `🚨 Critical Alert: ${alertData.title}`,
        message: alertData.message,
        category: 'alert',
        priority: 'high'
      }, 'high', supabaseClient)
    }

    return {
      success: true,
      alert: storedAlert,
      message: 'Alert created successfully'
    }

  } catch (error) {
    console.error('Create alert error:', error)
    return {
      success: false,
      error: 'Failed to create alert'
    }
  }
}

async function sendAutomatedNotification(userId: string, notificationType: string, data: any, supabaseClient: any) {
  try {
    console.log(`🤖 Sending automated notification: ${notificationType}`)

    let notificationData: any = {}

    switch (notificationType) {
      case 'low_stock_alert':
        notificationData = {
          title: '⚠️ Low Stock Alert',
          message: `Product "${data.productName}" is running low on stock (${data.currentStock} remaining). Consider reordering soon.`,
          category: 'inventory',
          priority: 'medium',
          actionUrl: `/inventory/product/${data.productId}`,
          additionalData: {
            productId: data.productId,
            currentStock: data.currentStock,
            reorderPoint: data.reorderPoint
          }
        }
        break

      case 'campaign_performance':
        notificationData = {
          title: '📊 Campaign Performance Update',
          message: `Your campaign "${data.campaignName}" is performing ${data.performance} than expected. ${data.message}`,
          category: 'marketing',
          priority: data.performance === 'better' ? 'low' : 'medium',
          actionUrl: `/campaigns/${data.campaignId}`,
          additionalData: {
            campaignId: data.campaignId,
            performance: data.performance,
            metrics: data.metrics
          }
        }
        break

      case 'new_ugc_content':
        notificationData = {
          title: '🎬 New UGC Content Available',
          message: `New user-generated content has been discovered for your brand. Review and approve content for your campaigns.`,
          category: 'ugc',
          priority: 'normal',
          actionUrl: '/ugc/inbox',
          additionalData: {
            contentCount: data.contentCount,
            platforms: data.platforms
          }
        }
        break

      case 'competitor_activity':
        notificationData = {
          title: '👀 Competitor Activity Detected',
          message: `${data.competitorName} has ${data.activity}. Stay ahead of the competition!`,
          category: 'competitive_intelligence',
          priority: 'medium',
          actionUrl: '/competitor-scanner',
          additionalData: {
            competitorId: data.competitorId,
            activity: data.activity,
            impact: data.impact
          }
        }
        break

      case 'system_maintenance':
        notificationData = {
          title: '🔧 System Maintenance Scheduled',
          message: `Scheduled maintenance will occur on ${data.maintenanceDate} from ${data.startTime} to ${data.endTime}.`,
          category: 'system',
          priority: 'low',
          additionalData: {
            maintenanceDate: data.maintenanceDate,
            startTime: data.startTime,
            endTime: data.endTime,
            affectedServices: data.affectedServices
          }
        }
        break

      case 'achievement_unlocked':
        notificationData = {
          title: '🏆 Achievement Unlocked!',
          message: `Congratulations! You've unlocked the "${data.achievementName}" achievement. ${data.description}`,
          category: 'achievement',
          priority: 'low',
          additionalData: {
            achievementId: data.achievementId,
            achievementName: data.achievementName,
            points: data.points
          }
        }
        break

      default:
        notificationData = {
          title: data.title || 'Notification',
          message: data.message || 'You have a new notification.',
          category: 'general',
          priority: 'normal'
        }
    }

    return await sendNotification(userId, notificationType, notificationData, notificationData.priority, supabaseClient)

  } catch (error) {
    console.error('Send automated notification error:', error)
    return {
      success: false,
      error: 'Failed to send automated notification'
    }
  }
}

async function getNotificationSettings(userId: string, supabaseClient: any) {
  try {
    console.log(`⚙️ Getting notification settings for user: ${userId}`)

    // Mock notification settings - replace with real database query
    const settings = {
      user_id: userId,
      email_notifications: {
        enabled: true,
        frequency: 'immediate',
        categories: ['critical', 'marketing', 'inventory', 'system']
      },
      push_notifications: {
        enabled: true,
        frequency: 'immediate',
        categories: ['critical', 'marketing', 'ugc', 'competitive_intelligence']
      },
      sms_notifications: {
        enabled: false,
        frequency: 'daily',
        categories: ['critical']
      },
      in_app_notifications: {
        enabled: true,
        frequency: 'immediate',
        categories: ['all']
      },
      quiet_hours: {
        enabled: true,
        start_time: '22:00',
        end_time: '08:00',
        timezone: 'UTC'
      },
      categories: {
        critical: { email: true, push: true, sms: true, in_app: true },
        marketing: { email: true, push: true, sms: false, in_app: true },
        inventory: { email: true, push: false, sms: false, in_app: true },
        ugc: { email: false, push: true, sms: false, in_app: true },
        competitive_intelligence: { email: true, push: true, sms: false, in_app: true },
        system: { email: true, push: false, sms: false, in_app: true },
        achievement: { email: false, push: false, sms: false, in_app: true }
      }
    }

    return {
      success: true,
      settings: settings
    }

  } catch (error) {
    console.error('Get notification settings error:', error)
    return {
      success: false,
      error: 'Failed to get notification settings'
    }
  }
}

async function sendRealtimeNotification(userId: string, notification: any) {
  try {
    // This would integrate with your real-time system (WebSocket, Server-Sent Events, etc.)
    console.log(`📡 Sending real-time notification to user: ${userId}`)
    
    // Mock real-time notification - replace with actual implementation
    const realtimeData = {
      type: 'notification',
      userId: userId,
      notification: notification,
      timestamp: new Date().toISOString()
    }

    // Example: Send to WebSocket, Server-Sent Events, or push notification service
    // await websocketService.sendToUser(userId, realtimeData)
    
    return true
  } catch (error) {
    console.error('Send real-time notification error:', error)
    return false
  }
} 