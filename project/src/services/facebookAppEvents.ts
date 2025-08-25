/**
 * Facebook App Events API Integration
 * Based on: https://developers.facebook.com/docs/marketing-api/app-event-api
 * 
 * Note: Facebook recommends using Conversions API instead of App Events API for new integrations,
 * but this provides the commands needed for existing implementations.
 */

import axios from 'axios';
import crypto from 'crypto';

// Environment variables
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '';
const FACEBOOK_APP_ACCESS_TOKEN = process.env.FACEBOOK_APP_ACCESS_TOKEN || '';
const FACEBOOK_ADVERTISER_ID = process.env.FACEBOOK_ADVERTISER_ID || '';

// Base URL for Facebook Graph API
const FACEBOOK_API_BASE = 'https://graph.facebook.com';

/**
 * Hash user data for advanced matching (required by Facebook)
 */
function hashUserData(data: string): string {
  return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

/**
 * 1. App Install Event
 * Send app install event to Facebook
 */
export async function logAppInstall(advertiserId: string) {
  const params = new URLSearchParams({
    event: 'MOBILE_APP_INSTALL',
    application_tracking_enabled: '0',
    advertiser_tracking_enabled: '0',
    advertiser_id: advertiserId,
    access_token: FACEBOOK_APP_ACCESS_TOKEN
  });

  const response = await axios.post(
    `${FACEBOOK_API_BASE}/${FACEBOOK_APP_ID}/activities`,
    params.toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Forwarded-For': process.env.CLIENT_IP || '127.0.0.1'
      }
    }
  );

  return response.data;
}

/**
 * 2. Custom App Events
 * Send custom conversion events to Facebook
 */
export async function logCustomEvent(
  advertiserId: string,
  eventName: string,
  eventId: string,
  valueToSum?: number,
  currency?: string
) {
  const customEvent = {
    _eventName: eventName,
    event_id: eventId,
    _valueToSum: valueToSum,
    fb_currency: currency
  };

  const params = new URLSearchParams({
    event: 'CUSTOM_APP_EVENTS',
    advertiser_id: advertiserId,
    advertiser_tracking_enabled: '1',
    application_tracking_enabled: '1',
    custom_events: JSON.stringify([customEvent]),
    access_token: FACEBOOK_APP_ACCESS_TOKEN
  });

  const response = await axios.post(
    `${FACEBOOK_API_BASE}/${FACEBOOK_APP_ID}/activities`,
    params.toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Forwarded-For': process.env.CLIENT_IP || '127.0.0.1'
      }
    }
  );

  return response.data;
}

/**
 * 3. Advanced Matching with User Data
 * Send customer data for better attribution
 */
export async function logEventWithAdvancedMatching(
  advertiserId: string,
  eventName: string,
  eventId: string,
  userData: { email?: string; phone?: string; firstName?: string; lastName?: string; city?: string; state?: string; zip?: string; country?: string },
  valueToSum?: number,
  currency?: string,
  applicationTrackingEnabled: boolean = true,
  advertiserTrackingEnabled: boolean = true
) {
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_ACCESS_TOKEN) {
    throw new Error('Missing Facebook App credentials');
  }

  const customEvent = {
    _eventName: eventName,
    event_id: eventId,
    _valueToSum: valueToSum,
    fb_currency: currency
  };

  const params = new URLSearchParams({
    event: 'CUSTOM_APP_EVENTS',
    advertiser_id: advertiserId,
    advertiser_tracking_enabled: advertiserTrackingEnabled ? '1' : '0',
    application_tracking_enabled: applicationTrackingEnabled ? '1' : '0',
    custom_events: JSON.stringify([customEvent]),
    access_token: FACEBOOK_APP_ACCESS_TOKEN
  });

  // Add hashed user data for advanced matching
  if (userData.email) {
    params.append('ud[em]', hashUserData(userData.email));
  }
  if (userData.phone) {
    params.append('ud[ph]', hashUserData(userData.phone));
  }
  if (userData.firstName) {
    params.append('ud[fn]', hashUserData(userData.firstName));
  }
  if (userData.lastName) {
    params.append('ud[ln]', hashUserData(userData.lastName));
  }
  if (userData.city) {
    params.append('ud[ct]', hashUserData(userData.city));
  }
  if (userData.state) {
    params.append('ud[st]', hashUserData(userData.state));
  }
  if (userData.zip) {
    params.append('ud[zp]', hashUserData(userData.zip));
  }
  if (userData.country) {
    params.append('ud[country]', hashUserData(userData.country));
  }

  try {
    const response = await axios.post(
      `${FACEBOOK_API_BASE}/${FACEBOOK_APP_ID}/activities`,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Forwarded-For': process.env.CLIENT_IP || '127.0.0.1'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Facebook Advanced Matching Event Error:', (error as any).response?.data || (error as Error).message);
    throw error;
  }
}

/**
 * 4. Standard Events Helper
 * Common standard events with proper parameters
 */
export const StandardEvents = {
  // Purchase event
  async logPurchase(advertiserId: string, eventId: string, value: number, currency: string = 'USD') {
    return logCustomEvent(advertiserId, 'fb_mobile_purchase', eventId, value, currency);
  },

  // Add to cart event
  async logAddToCart(advertiserId: string, eventId: string, value: number, currency: string = 'USD') {
    return logCustomEvent(advertiserId, 'fb_mobile_add_to_cart', eventId, value, currency);
  },

  // Content view event
  async logContentView(advertiserId: string, eventId: string, value?: number, currency: string = 'USD') {
    return logCustomEvent(advertiserId, 'fb_mobile_content_view', eventId, value, currency);
  },

  // Complete registration event
  async logCompleteRegistration(
    advertiserId: string,
    eventId: string,
    registrationMethod?: string
  ) {
    const customEvent = {
      _eventName: 'fb_mobile_complete_registration',
      event_id: eventId,
      ...(registrationMethod && { fb_registration_method: registrationMethod })
    };

    const params = new URLSearchParams({
      event: 'CUSTOM_APP_EVENTS',
      advertiser_id: advertiserId,
      advertiser_tracking_enabled: '1',
      application_tracking_enabled: '1',
      custom_events: JSON.stringify([customEvent]),
      access_token: FACEBOOK_APP_ACCESS_TOKEN
    });

    try {
      const response = await axios.post(
        `${FACEBOOK_API_BASE}/${FACEBOOK_APP_ID}/activities`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Forwarded-For': process.env.CLIENT_IP || '127.0.0.1'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Facebook Registration Event Error:', (error as any).response?.data || (error as Error).message);
      throw error;
    }
  }
};

/**
 * 5. Attribution Data
 * Get attribution data for installs and conversions
 */
export async function getAttributionData(startTime: number, endTime: number) {
  const params = new URLSearchParams({
    start_time: startTime.toString(),
    end_time: endTime.toString(),
    access_token: FACEBOOK_APP_ACCESS_TOKEN
  });

  const response = await axios.get(
    `${FACEBOOK_API_BASE}/${FACEBOOK_APP_ID}/attribution?${params.toString()}`
  );

  return response.data;
}

/**
 * 6. Testing Helper
 * Test events in development mode
 */
export async function testEvent(
  eventName: string,
  eventId: string,
  testEventCode?: string
) {
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_ACCESS_TOKEN) {
    throw new Error('Missing Facebook App credentials');
  }

  const customEvent = {
    _eventName: eventName,
    event_id: eventId,
    _test_event_code: testEventCode
  };

  const params = new URLSearchParams({
    event: 'CUSTOM_APP_EVENTS',
    advertiser_id: FACEBOOK_ADVERTISER_ID,
    advertiser_tracking_enabled: '1',
    application_tracking_enabled: '1',
    custom_events: JSON.stringify([customEvent]),
    access_token: FACEBOOK_APP_ACCESS_TOKEN
  });

  try {
    const response = await axios.post(
      `${FACEBOOK_API_BASE}/${FACEBOOK_APP_ID}/activities`,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Forwarded-For': process.env.CLIENT_IP || '127.0.0.1'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Facebook Test Event Error:', (error as any).response?.data || (error as Error).message);
    throw error;
  }
}

// Export all functions
export default {
  logAppInstall,
  logCustomEvent,
  logEventWithAdvancedMatching,
  StandardEvents,
  getAttributionData,
  testEvent
}; 