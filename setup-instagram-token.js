#!/usr/bin/env node

/**
 * Instagram API Token Setup Helper
 * Run with: node setup-instagram-token.js
 */

import axios from 'axios';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Instagram API Token Setup Helper\n');

// Helper function to prompt for input
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Test Instagram API token
async function testInstagramToken(token) {
  console.log('\n🧪 Testing Instagram API Token...');
  
  try {
    const response = await axios.get(
      'https://graph.facebook.com/v19.0/me',
      {
        params: {
          access_token: token,
          fields: 'id,name'
        }
      }
    );
    
    console.log('✅ Token is valid!');
    console.log('User Info:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Token validation failed');
    console.log('Error:', error.response?.data || error.message);
    return false;
  }
}

// Get Instagram Business Account ID
async function getBusinessAccountId(token) {
  console.log('\n🔍 Getting Instagram Business Account ID...');
  
  try {
    const pagesResponse = await axios.get(
      'https://graph.facebook.com/v19.0/me/accounts',
      {
        params: {
          access_token: token,
          fields: 'id,name,instagram_business_account'
        }
      }
    );
    
    const pages = pagesResponse.data.data || [];
    console.log(`Found ${pages.length} Facebook pages`);
    
    for (const page of pages) {
      if (page.instagram_business_account) {
        console.log(`✅ Instagram Business Account ID: ${page.instagram_business_account.id}`);
        return page.instagram_business_account.id;
      }
    }
    
    console.log('⚠️ No Instagram Business Account found');
    return null;
  } catch (error) {
    console.log('❌ Error getting business account:', error.response?.data || error.message);
    return null;
  }
}

// Test Instagram API endpoints
async function testInstagramEndpoints(token, businessAccountId) {
  console.log('\n🧪 Testing Instagram API Endpoints...');
  
  const tests = [
    {
      name: 'Business Account Info',
      url: `https://graph.facebook.com/v19.0/${businessAccountId}`,
      params: {
        fields: 'id,username,account_type,media_count,followers_count',
        access_token: token
      }
    },
    {
      name: 'Recent Media',
      url: `https://graph.facebook.com/v19.0/${businessAccountId}/media`,
      params: {
        fields: 'id,caption,media_url,permalink,timestamp,media_type',
        access_token: token,
        limit: 5
      }
    },
    {
      name: 'Hashtag Search',
      url: 'https://graph.facebook.com/v19.0/ig_hashtag_search',
      params: {
        user_id: businessAccountId,
        q: 'fashion',
        access_token: token
      }
    }
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    try {
      console.log(`\nTesting: ${test.name}`);
      const response = await axios.get(test.url, { params: test.params });
      console.log(`✅ ${test.name}: Success`);
      console.log(`   Data:`, response.data);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${test.name}: Failed`);
      console.log(`   Error:`, error.response?.data || error.message);
    }
  }
  
  console.log(`\n📊 Endpoint Tests: ${passedTests}/${tests.length} passed`);
  return passedTests === tests.length;
}

// Generate environment variables
function generateEnvVars(token, businessAccountId) {
  console.log('\n📝 Environment Variables to Add:');
  console.log('Add these to your .env file:\n');
  console.log(`INSTAGRAM_ACCESS_TOKEN=${token}`);
  if (businessAccountId) {
    console.log(`INSTAGRAM_BUSINESS_ACCOUNT_ID=${businessAccountId}`);
  }
  console.log('INSTAGRAM_USER_ID=${businessAccountId}');
  console.log('CLIENT_IP=127.0.0.1');
}

// Main setup function
async function setupInstagramToken() {
  console.log('📋 Instagram API Token Setup Instructions:\n');
  console.log('1. Go to https://developers.facebook.com/');
  console.log('2. Create or select your app');
  console.log('3. Add "Instagram Basic Display" product');
  console.log('4. Go to Tools > Graph API Explorer');
  console.log('5. Add these permissions:');
  console.log('   - instagram_basic');
  console.log('   - instagram_content_publish');
  console.log('   - pages_read_engagement');
  console.log('   - pages_show_list');
  console.log('   - user_profile');
  console.log('6. Click "Generate Access Token"');
  console.log('7. Copy the token and paste it below\n');
  
  const token = await askQuestion('Paste your Instagram API token: ');
  
  if (!token) {
    console.log('❌ No token provided');
    rl.close();
    return;
  }
  
  const isValid = await testInstagramToken(token);
  
  if (!isValid) {
    console.log('\n❌ Token is invalid. Please check:');
    console.log('1. Token is copied correctly (no extra spaces)');
    console.log('2. Token has the required permissions');
    console.log('3. Token hasn\'t expired');
    console.log('4. You\'re using the correct token type');
    rl.close();
    return;
  }
  
  const businessAccountId = await getBusinessAccountId(token);
  
  // Test endpoints
  if (businessAccountId) {
    await testInstagramEndpoints(token, businessAccountId);
  }
  
  generateEnvVars(token, businessAccountId);
  
  console.log('\n🎉 Setup complete! Your Instagram API token is ready to use.');
  console.log('\n💡 Next steps:');
  console.log('1. Add the environment variables to your .env file');
  console.log('2. Restart your development server');
  console.log('3. Test the UGC integration with: node test-ugc.js');
  
  rl.close();
}

setupInstagramToken().catch(console.error); 