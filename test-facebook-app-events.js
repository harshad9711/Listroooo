#!/usr/bin/env node

/**
 * Test script for Facebook App Events API integration
 * Run with: node test-facebook-app-events.js
 */

import axios from 'axios';

// Test configuration
const TEST_CONFIG = {
  appId: process.env.FACEBOOK_APP_ID || 'test_app_id',
  accessToken: process.env.FACEBOOK_APP_ACCESS_TOKEN || 'test_access_token',
  advertiserId: process.env.FACEBOOK_ADVERTISER_ID || 'test_advertiser_id',
  baseUrl: 'https://graph.facebook.com'
};

// Test functions
async function testAppInstallEvent() {
  console.log('🧪 Testing App Install Event...');
  
  const params = new URLSearchParams({
    event: 'MOBILE_APP_INSTALL',
    application_tracking_enabled: '0',
    advertiser_tracking_enabled: '0',
    advertiser_id: TEST_CONFIG.advertiserId,
    access_token: TEST_CONFIG.accessToken
  });

  try {
    const response = await axios.post(
      `${TEST_CONFIG.baseUrl}/${TEST_CONFIG.appId}/activities`,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Forwarded-For': '127.0.0.1'
        }
      }
    );
    
    console.log('✅ App Install Event:', response.data);
    return true;
  } catch (error) {
    console.log('❌ App Install Event Error:', error.response?.data || error.message);
    return false;
  }
}

async function testCustomEvent() {
  console.log('🧪 Testing Custom Event...');
  
  const customEvent = {
    _eventName: 'fb_mobile_purchase',
    event_id: `test-${Date.now()}`,
    _valueToSum: 29.99,
    fb_currency: 'USD'
  };

  const params = new URLSearchParams({
    event: 'CUSTOM_APP_EVENTS',
    advertiser_id: TEST_CONFIG.advertiserId,
    advertiser_tracking_enabled: '1',
    application_tracking_enabled: '1',
    custom_events: JSON.stringify([customEvent]),
    access_token: TEST_CONFIG.accessToken
  });

  try {
    const response = await axios.post(
      `${TEST_CONFIG.baseUrl}/${TEST_CONFIG.appId}/activities`,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Forwarded-For': '127.0.0.1'
        }
      }
    );
    
    console.log('✅ Custom Event:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Custom Event Error:', error.response?.data || error.message);
    return false;
  }
}

async function testStandardEvents() {
  console.log('🧪 Testing Standard Events...');
  
  const events = [
    {
      name: 'fb_mobile_purchase',
      params: { _valueToSum: 29.99, fb_currency: 'USD' }
    },
    {
      name: 'fb_mobile_add_to_cart',
      params: { _valueToSum: 19.99, fb_currency: 'USD' }
    },
    {
      name: 'fb_mobile_content_view',
      params: { _valueToSum: 0, fb_currency: 'USD' }
    }
  ];

  let successCount = 0;
  
  for (const event of events) {
    const customEvent = {
      _eventName: event.name,
      event_id: `test-${event.name}-${Date.now()}`,
      ...event.params
    };

    const params = new URLSearchParams({
      event: 'CUSTOM_APP_EVENTS',
      advertiser_id: TEST_CONFIG.advertiserId,
      advertiser_tracking_enabled: '1',
      application_tracking_enabled: '1',
      custom_events: JSON.stringify([customEvent]),
      access_token: TEST_CONFIG.accessToken
    });

    try {
      const response = await axios.post(
        `${TEST_CONFIG.baseUrl}/${TEST_CONFIG.appId}/activities`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Forwarded-For': '127.0.0.1'
          }
        }
      );
      
      console.log(`✅ ${event.name}:`, response.data);
      successCount++;
    } catch (error) {
      console.log(`❌ ${event.name} Error:`, error.response?.data || error.message);
    }
  }
  
  return successCount === events.length;
}

async function testAttributionData() {
  console.log('🧪 Testing Attribution Data...');
  
  const startTime = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60); // 7 days ago
  const endTime = Math.floor(Date.now() / 1000);
  
  const params = new URLSearchParams({
    start_time: startTime.toString(),
    end_time: endTime.toString(),
    access_token: TEST_CONFIG.accessToken
  });

  try {
    const response = await axios.get(
      `${TEST_CONFIG.baseUrl}/${TEST_CONFIG.appId}/attribution?${params.toString()}`
    );
    
    console.log('✅ Attribution Data:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Attribution Data Error:', error.response?.data || error.message);
    return false;
  }
}

async function testWithTestEventCode() {
  console.log('🧪 Testing with Test Event Code...');
  
  const customEvent = {
    _eventName: 'fb_mobile_purchase',
    event_id: `test-${Date.now()}`,
    _test_event_code: 'TEST12345'
  };

  const params = new URLSearchParams({
    event: 'CUSTOM_APP_EVENTS',
    advertiser_id: TEST_CONFIG.advertiserId,
    advertiser_tracking_enabled: '1',
    application_tracking_enabled: '1',
    custom_events: JSON.stringify([customEvent]),
    access_token: TEST_CONFIG.accessToken
  });

  try {
    const response = await axios.post(
      `${TEST_CONFIG.baseUrl}/${TEST_CONFIG.appId}/activities`,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Forwarded-For': '127.0.0.1'
        }
      }
    );
    
    console.log('✅ Test Event Code:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Test Event Code Error:', error.response?.data || error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Facebook App Events API Tests...\n');
  
  const tests = [
    { name: 'App Install Event', fn: testAppInstallEvent },
    { name: 'Custom Event', fn: testCustomEvent },
    { name: 'Standard Events', fn: testStandardEvents },
    { name: 'Attribution Data', fn: testAttributionData },
    { name: 'Test Event Code', fn: testWithTestEventCode }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    const result = await test.fn();
    if (result) passedTests++;
    console.log(`--- End ${test.name} ---\n`);
  }
  
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Facebook App Events API integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check your configuration and try again.');
  }
  
  // Environment check
  console.log('\n🔧 Environment Check:');
  console.log(`Facebook App ID: ${TEST_CONFIG.appId ? '✅ Set' : '❌ Missing'}`);
  console.log(`Facebook Access Token: ${TEST_CONFIG.accessToken ? '✅ Set' : '❌ Missing'}`);
  console.log(`Facebook Advertiser ID: ${TEST_CONFIG.advertiserId ? '✅ Set' : '❌ Missing'}`);
  
  if (!TEST_CONFIG.appId || !TEST_CONFIG.accessToken || !TEST_CONFIG.advertiserId) {
    console.log('\n💡 To run with real credentials, set these environment variables:');
    console.log('export FACEBOOK_APP_ID=your_app_id');
    console.log('export FACEBOOK_APP_ACCESS_TOKEN=your_access_token');
    console.log('export FACEBOOK_ADVERTISER_ID=your_advertiser_id');
  }
}

// Run tests if this file is executed directly
runTests().catch(console.error); 