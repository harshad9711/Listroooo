#!/usr/bin/env node

/**
 * Test script for UGC Instagram and Facebook API integration
 * Run with: node test-ugc.js
 */

import axios from 'axios';

// Instagram API configuration
const INSTAGRAM_ACCESS_TOKEN = 'EAAZA2d3IsPvUBOZBWCEKl6AWdRvIxu2GHtZB3kAJGUJka9MUN1eWA6l4xzBIIAY2IEdGVZB7Cr2bS8ZBognpI4rxAanZCaCAgFjMOZCYqmgvsgM9u6FZBW2HqZBQoZCEFesCrv0pBi6Wu2hzIdUrcoRAyZAbLc6c9pjaDkAUqTfPxkCPuQ6XiemDt0cpFDVhzbLNgVBP1FkYCZCODsZA7Qf9u26bRqzi6zAFci8N7AkVIcGFntQZDZD';
const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID || '';
const INSTAGRAM_BUSINESS_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '17841475614351735';

// Facebook Marketing API configuration
const FACEBOOK_ACCESS_TOKEN = 'EAAZA2d3IsPvUBO9A7IA248LYUvPIlJ3VuJZBAAEPZBsZA15Wfdb58jQj9qvNH6vs6qPtqvJNhu8JYyVP6ZCEv6w5xtpfCY2BFLdAJZCMZCo9pnZC3XnBTDlTHCivH585jbdKpVw9ihvZCi2ycfRa5OKR4PLPVJS6yMtEZCqomd42eFHTnfKtvIMuXb6ZBuA4WobdXTLNwwL';
const FACEBOOK_AD_ACCOUNT_ID = process.env.FACEBOOK_AD_ACCOUNT_ID || '';

console.log('🚀 Starting UGC Instagram & Facebook API Tests...\n');

let passedTests = 0;
let totalTests = 0;

// Test Instagram Access Token
async function testInstagramToken() {
  console.log('--- Instagram Access Token ---');
  totalTests++;
  
  try {
    console.log('🧪 Testing Instagram Access Token...');
    const response = await axios.get('https://graph.facebook.com/v19.0/me', {
      params: {
        access_token: INSTAGRAM_ACCESS_TOKEN,
        fields: 'id,name'
      }
    });
    
    console.log('✅ Instagram Access Token Valid:', response.data);
    passedTests++;
  } catch (error) {
    console.log('❌ Instagram Access Token Error:', error.response?.data || error.message);
  }
  console.log('--- End Instagram Access Token ---\n');
}

// Test Facebook Access Token
async function testFacebookToken() {
  console.log('--- Facebook Access Token ---');
  totalTests++;
  
  try {
    console.log('🧪 Testing Facebook Access Token...');
    const response = await axios.get('https://graph.facebook.com/v19.0/me', {
      params: {
        access_token: FACEBOOK_ACCESS_TOKEN,
        fields: 'id,name'
      }
    });
    
    console.log('✅ Facebook Access Token Valid:', response.data);
    passedTests++;
  } catch (error) {
    console.log('❌ Facebook Access Token Error:', error.response?.data || error.message);
  }
  console.log('--- End Facebook Access Token ---\n');
}

// Test Facebook Pages
async function testFacebookPages() {
  console.log('--- Facebook Pages ---');
  totalTests++;
  
  try {
    console.log('🧪 Testing Facebook Pages Access...');
    const response = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
      params: {
        access_token: FACEBOOK_ACCESS_TOKEN,
        fields: 'id,name,access_token'
      }
    });
    
    const pages = response.data.data || [];
    console.log(`✅ Found ${pages.length} Facebook pages:`, pages.map(p => p.name));
    passedTests++;
  } catch (error) {
    console.log('❌ Facebook Pages Error:', error.response?.data || error.message);
  }
  console.log('--- End Facebook Pages ---\n');
}

// Test Facebook Ad Account
async function testFacebookAdAccount() {
  console.log('--- Facebook Ad Account ---');
  totalTests++;
  
  try {
    console.log('🧪 Testing Facebook Ad Account Access...');
    const response = await axios.get('https://graph.facebook.com/v19.0/me/adaccounts', {
      params: {
        access_token: FACEBOOK_ACCESS_TOKEN,
        fields: 'id,name,account_status'
      }
    });
    
    const adAccounts = response.data.data || [];
    console.log(`✅ Found ${adAccounts.length} Facebook ad accounts:`, adAccounts.map(a => a.name));
    passedTests++;
  } catch (error) {
    console.log('❌ Facebook Ad Account Error:', error.response?.data || error.message);
  }
  console.log('--- End Facebook Ad Account ---\n');
}

// Test Instagram Hashtag Search
async function testInstagramHashtagSearch(hashtag) {
  console.log(`--- Hashtag Search ---`);
  totalTests++;
  
  try {
    console.log(`🧪 Testing Hashtag Search for #${hashtag}...`);
    const response = await axios.get('https://graph.facebook.com/v19.0/ig_hashtag_search', {
      params: {
        user_id: INSTAGRAM_USER_ID || INSTAGRAM_BUSINESS_ACCOUNT_ID,
        q: hashtag,
        access_token: INSTAGRAM_ACCESS_TOKEN
      }
    });
    
    const hashtags = response.data.data || [];
    console.log(`✅ Found ${hashtags.length} hashtags for #${hashtag}:`, hashtags);
    passedTests++;
  } catch (error) {
    console.log(`❌ Hashtag Search Error for #${hashtag}:`, error.response?.data || error.message);
  }
  console.log('--- End Hashtag Search ---\n');
}

// Test UGC Fetch
async function testUGCFetch(hashtag) {
  console.log(`--- UGC Fetch ---`);
  totalTests++;
  
  try {
    console.log(`🧪 Testing UGC Fetch for #${hashtag}...`);
    
    // First get hashtag ID
    const tagResponse = await axios.get('https://graph.facebook.com/v19.0/ig_hashtag_search', {
      params: {
        user_id: INSTAGRAM_USER_ID || INSTAGRAM_BUSINESS_ACCOUNT_ID,
        q: hashtag,
        access_token: INSTAGRAM_ACCESS_TOKEN
      }
    });
    
    const hashtagId = tagResponse.data.data?.[0]?.id;
    if (!hashtagId) {
      throw new Error(`Cannot fetch UGC without hashtag ID for #${hashtag}`);
    }
    
    // Get recent media with correct field names
    const mediaResponse = await axios.get(`https://graph.facebook.com/v19.0/${hashtagId}/recent_media`, {
      params: {
        user_id: INSTAGRAM_USER_ID || INSTAGRAM_BUSINESS_ACCOUNT_ID,
        fields: 'id,caption,media_url,permalink,timestamp,username,media_type,thumbnail_url',
        access_token: INSTAGRAM_ACCESS_TOKEN,
        limit: 10
      }
    });
    
    const posts = mediaResponse.data.data || [];
    console.log(`✅ Found ${posts.length} UGC posts for #${hashtag}`);
    passedTests++;
  } catch (error) {
    console.log(`❌ UGC Fetch Error for #${hashtag}:`, error.response?.data || error.message);
  }
  console.log('--- End UGC Fetch ---\n');
}

// Test Facebook Page Posts
async function testFacebookPagePosts() {
  console.log('--- Facebook Page Posts ---');
  totalTests++;
  
  try {
    console.log('🧪 Testing Facebook Page Posts...');
    
    // Get pages first
    const pagesResponse = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
      params: {
        access_token: FACEBOOK_ACCESS_TOKEN,
        fields: 'id,name,access_token'
      }
    });
    
    const pages = pagesResponse.data.data || [];
    if (pages.length === 0) {
      throw new Error('No Facebook pages found');
    }
    
    const page = pages[0];
    console.log(`📘 Using page: ${page.name} (${page.id})`);
    
    // Get page posts
    const postsResponse = await axios.get(`https://graph.facebook.com/v19.0/${page.id}/posts`, {
      params: {
        access_token: page.access_token,
        fields: 'id,message,created_time,permalink_url,reactions.summary(true),comments.summary(true)',
        limit: 5
      }
    });
    
    const posts = postsResponse.data.data || [];
    console.log(`✅ Found ${posts.length} Facebook page posts`);
    passedTests++;
  } catch (error) {
    console.log('❌ Facebook Page Posts Error:', error.response?.data || error.message);
  }
  console.log('--- End Facebook Page Posts ---\n');
}

// Run all tests
async function runAllTests() {
  await testInstagramToken();
  await testFacebookToken();
  await testFacebookPages();
  await testFacebookAdAccount();
  await testInstagramHashtagSearch('fashion');
  await testUGCFetch('fashion');
  await testFacebookPagePosts();
  
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests < totalTests) {
    console.log('\n⚠️  Some tests failed. Check your configuration and try again.');
  } else {
    console.log('\n🎉 All tests passed!');
  }
  
  console.log('\n🔧 Configuration Check:');
  console.log(`Instagram Access Token: ${INSTAGRAM_ACCESS_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`Instagram User ID: ${INSTAGRAM_USER_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`Instagram Business Account ID: ${INSTAGRAM_BUSINESS_ACCOUNT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`Facebook Access Token: ${FACEBOOK_ACCESS_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`Facebook Ad Account ID: ${FACEBOOK_AD_ACCOUNT_ID ? '✅ Set' : '❌ Missing'}`);
  
  console.log('\n💡 To enable all features, set these environment variables:');
  console.log('export INSTAGRAM_USER_ID=your_user_id');
  console.log('export INSTAGRAM_BUSINESS_ACCOUNT_ID=your_business_account_id');
  console.log('export FACEBOOK_AD_ACCOUNT_ID=your_ad_account_id');
  
  console.log('\n🔑 API Key Analysis:');
  console.log(`Instagram Token length: ${INSTAGRAM_ACCESS_TOKEN.length} characters`);
  console.log(`Facebook Token length: ${FACEBOOK_ACCESS_TOKEN.length} characters`);
  console.log(`Instagram Token format: ${INSTAGRAM_ACCESS_TOKEN.startsWith('IGA') ? '✅ Valid Instagram format' : '❌ Invalid format'}`);
  console.log(`Facebook Token format: ${FACEBOOK_ACCESS_TOKEN.startsWith('EAA') ? '✅ Valid Facebook format' : '❌ Invalid format'}`);
}

runAllTests().catch(console.error); 