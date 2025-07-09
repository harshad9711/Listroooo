# Facebook App Events API Integration

Based on the [Facebook App Events API documentation](https://developers.facebook.com/docs/marketing-api/app-event-api), here are the essential commands and setup instructions for integrating Facebook App Events into your project.

## ⚠️ Important Note

Facebook **no longer recommends App Events API for new integrations**. They recommend using the **Conversions API** instead, which supports web, app, and offline events. However, this guide provides the commands needed for existing implementations.

## Prerequisites

Before you start, you need:

1. **Facebook App ID** - Your Facebook application ID
2. **App Access Token** - For server-side authentication
3. **Advertiser ID** - The advertising ID from Android device or IDFA from Apple device
4. **Environment Variables** - Set up in your `.env` file

## Environment Variables Setup

```bash
# Add these to your .env file
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_ACCESS_TOKEN=your_app_access_token_here
FACEBOOK_ADVERTISER_ID=your_advertiser_id_here
CLIENT_IP=127.0.0.1  # For development, use actual client IP in production
```

## Core API Commands

### 1. App Install Event

**Purpose**: Track when your app is installed

```bash
# cURL command from documentation
curl -i -X POST "https://graph.facebook.com/{app-id}/activities
   ?event=MOBILE_APP_INSTALL
   &application_tracking_enabled=0      
   &advertiser_tracking_enabled=0       
   &advertiser_id={advertiser-tracking-id}
   &{app-access-token}"
```

**JavaScript/TypeScript Usage**:
```typescript
import { logAppInstall } from './src/services/facebookAppEvents';

// Log app install
await logAppInstall('your-advertiser-id');
```

### 2. Custom App Events

**Purpose**: Track custom conversion events

```bash
# cURL command from documentation
curl -i -X POST "https://graph.facebook.com/{app-id}/activities
   ?event=CUSTOM_APP_EVENTS" 
   &advertiser_id={advertiser-tracking-id}
   &advertiser_tracking_enabled=1 
   &application_tracking_enabled=1
   &custom_events=[
      {"_eventName":"fb_mobile_purchase",
       "event_id":"123456",
       "fb_content":"[
            {"id": "1234", "quantity": 2,}, 
            {"id": "5678", "quantity": 1,}
        ]",
       "fb_content_type":"product",
       "_valueToSum":21.97,
       "fb_currency":"GBP",
      }
    ]
   &{app-access-token}"
```

**JavaScript/TypeScript Usage**:
```typescript
import { logCustomEvent, StandardEvents } from './src/services/facebookAppEvents';

// Custom event
await logCustomEvent(
  'your-advertiser-id',
  'fb_mobile_purchase',
  'unique-event-id',
  29.99,
  'USD'
);

// Standard events
await StandardEvents.logPurchase('your-advertiser-id', 'event-123', 29.99, 'USD');
await StandardEvents.logAddToCart('your-advertiser-id', 'event-456', 19.99, 'USD');
await StandardEvents.logContentView('your-advertiser-id', 'event-789', 0, 'USD');
```

### 3. Advanced Matching with User Data

**Purpose**: Send customer data for better attribution (all data must be SHA256 hashed)

```bash
# cURL command from documentation
curl -i -X POST "https://graph.facebook.com/{app-id}/activities
   ?event=CUSTOM_APP_EVENTS
   &advertiser_id={advertiser-tracking-id}
   &advertiser_tracking_enabled=1 
   &application_tracking_enabled=1
   &custom_events=[
      {"_eventName":"fb_mobile_purchase",
      "event_id":"123456",
       "fb_content":"[
            {"id": "1234", "quantity": 2,}, 
            {"id": "5678", "quantity": 1,}
        ]",
       "fb_content_type":"product",
       "_valueToSum":21.97,
       "fb_currency":"GBP",
      }
    ]
   &ud[em]={sha256-hashed-email}
   &{app-access-token}"
```

### 4. Attribution Data

**Purpose**: Get attribution data for installs and conversions

```bash
# cURL command from documentation
curl -i -X GET "https://graph.facebook.com/{app-id}/attribution
   ?start_time={start-time}
   &end_time={end-time}
   &access_token={app-access-token}"
```

**JavaScript/TypeScript Usage**:
```typescript
import { getAttributionData } from './src/services/facebookAppEvents';

// Get attribution data
const startTime = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60); // 7 days ago
const endTime = Math.floor(Date.now() / 1000);
const attributionData = await getAttributionData(startTime, endTime);
```

## Standard Event Names

Facebook provides these standard event names:

| Event Name | Description | Required Parameters |
|------------|-------------|-------------------|
| `fb_mobile_purchase` | Purchase completed | `fb_num_items`, `fb_content_type`, `fb_content_id`, `fb_currency` |
| `fb_mobile_add_to_cart` | Item added to cart | `fb_content_type`, `fb_content_id`, `fb_currency` |
| `fb_mobile_content_view` | Content viewed | `fb_content_type`, `fb_content_id`, `fb_currency` |
| `fb_mobile_complete_registration` | Registration completed | `fb_registration_method` |
| `fb_mobile_add_to_wishlist` | Item added to wishlist | `fb_content_type`, `fb_content_id`, `fb_currency` |
| `fb_mobile_initiated_checkout` | Checkout started | `fb_content_type`, `fb_content_id`, `fb_num_items`, `fb_payment_info_available`, `fb_currency` |

## Standard Event Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `_valueToSum` | float | Numeric value to sum in reporting | `29.99` |
| `fb_content_id` | string | Product identifier | `"1234"` |
| `fb_content_type` | string | Product or product_group | `"product"` |
| `fb_currency` | string | ISO 4217 currency code | `"USD"` |
| `fb_num_items` | int | Number of items | `2` |
| `fb_payment_info_available` | boolean | Payment info available | `1` |
| `fb_registration_method` | string | Registration method | `"email"` |

## Testing

### Test Event Code

```bash
# cURL command for testing
curl -i -X POST "https://graph.facebook.com/{app-id}/activities
   ?event=CUSTOM_APP_EVENTS
   &advertiser_id={advertiser-tracking-id}
   &advertiser_tracking_enabled=1 
   &application_tracking_enabled=1
   &custom_events=[
      {"_eventName":"fb_mobile_purchase",
       "event_id":"123456",
       "_test_event_code":"TEST12345"
      }
    ]
   &{app-access-token}"
```

## Required HTTP Headers

For server-to-server calls, include the `X-Forwarded-For` header:

```bash
# IPv4 Example
curl -H "X-Forwarded-For: 192.168.0.99" \
  https://graph.facebook.com/<APP_ID>/activities/

# IPv6 Example  
curl -H "X-Forwarded-For: fd45:f238:3b40:23b1:ffff:ffff:ffff:abcd" \
  https://graph.facebook.com/<APP_ID>/activities/
```

## Error Handling

Common error responses:

```json
{
  "error": {
    "message": "Invalid parameter",
    "type": "OAuthException",
    "code": 100
  }
}
```

## Best Practices

1. **Deduplication**: Use unique `event_id` values to prevent duplicate events
2. **User Data Hashing**: Always hash user data (email, phone, etc.) with SHA256
3. **Tracking Consent**: Respect user's tracking preferences
4. **Event Limits**: Maximum 1,000 different event names per app
5. **Testing**: Use test event codes in development
6. **IP Forwarding**: Include client IP in `X-Forwarded-For` header

## Integration with Your UGC System

To integrate with your UGC (User Generated Content) system:

```typescript
// Example: Track UGC content view
import { StandardEvents } from './src/services/facebookAppEvents';

export async function trackUGCView(ugcId: string, userId: string) {
  try {
    await StandardEvents.logContentView(
      process.env.FACEBOOK_ADVERTISER_ID!,
      `ugc-view-${ugcId}`,
      0, // No monetary value for view
      'USD'
    );
  } catch (error) {
    console.error('Failed to track UGC view:', error);
  }
}

// Example: Track UGC approval
export async function trackUGCApproval(ugcId: string, userId: string) {
  try {
    await StandardEvents.logCustomEvent(
      process.env.FACEBOOK_ADVERTISER_ID!,
      'ugc_approved',
      `ugc-approval-${ugcId}`,
      0,
      'USD'
    );
  } catch (error) {
    console.error('Failed to track UGC approval:', error);
  }
}
```

## Security Considerations

1. **Never store app access tokens on the client**
2. **Hash all user data before sending to Facebook**
3. **Use HTTPS for all API calls**
4. **Validate all input data**
5. **Implement rate limiting**
6. **Monitor for unusual activity**

## Troubleshooting

### Common Issues

1. **"Invalid parameter" error**: Check that all required parameters are provided
2. **"Access token" error**: Verify your app access token is valid
3. **"Event limit" error**: You've exceeded 1,000 event types
4. **"Missing advertiser_id"**: Ensure advertiser ID is provided

### Debug Steps

1. Check environment variables are set correctly
2. Verify app access token permissions
3. Test with Facebook's Event Manager
4. Review Facebook's error logs
5. Use test event codes for development

## Migration to Conversions API

Since Facebook recommends using Conversions API instead of App Events API, consider migrating:

1. **Benefits**: Better performance, more event types, web/app/offline support
2. **Migration Path**: Gradually replace App Events with Conversions API calls
3. **Documentation**: [Conversions API Guide](https://developers.facebook.com/docs/marketing-api/conversions-api)

## Support Resources

- [Facebook App Events API Documentation](https://developers.facebook.com/docs/marketing-api/app-event-api)
- [Facebook Developer Community](https://developers.facebook.com/community/)
- [Facebook Business Help Center](https://www.facebook.com/business/help)
- [Event Manager](https://business.facebook.com/events_manager2) 