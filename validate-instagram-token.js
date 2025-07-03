#!/usr/bin/env node

/**
 * Instagram API Token Validation Script
 * Run with: node validate-instagram-token.js
 */

import axios from 'axios';

// The provided token
const PROVIDED_TOKEN = 'IGAAPMLjbezFRBZAFBFZAnQ4SFVXb1JiV1JrYjNKRHlzajdiTk9uT1IyZAGEwLW1PSzZAZAZA245cHFHRFltNW1LNDlSUk9BNVdDTlEyUnJsd2N0aE1ldTNxMzA5Y29sV3Jfc1JzbFdmTXMtMWxfWmE5VWdRaHhNbVdqT29TNjdZAcUw0RQZDZD';

console.log('🔍 Instagram API Token Validation\n');

// 1. Basic token analysis
console.log('📋 Token Analysis:');
console.log(`Length: ${PROVIDED_TOKEN.length} characters`);
console.log(`Starts with 'IGA': ${PROVIDED_TOKEN.startsWith('IGA')}`);
console.log(`Contains special chars: ${/[^A-Za-z0-9]/.test(PROVIDED_TOKEN)}`);
console.log(`All uppercase: ${PROVIDED_TOKEN === PROVIDED_TOKEN.toUpperCase()}`);

// 2. Check for common issues
console.log('\n🔍 Common Issues Check:');
const issues = [];

if (PROVIDED_TOKEN.length !== 183) {
  issues.push(`Expected 183 characters, got ${PROVIDED_TOKEN.length}`);
}

if (!PROVIDED_TOKEN.startsWith('IGA')) {
  issues.push('Token should start with "IGA"');
}

if (PROVIDED_TOKEN.includes(' ')) {
  issues.push('Token contains spaces');
}

if (PROVIDED_TOKEN.includes('\n') || PROVIDED_TOKEN.includes('\r')) {
  issues.push('Token contains line breaks');
}

if (issues.length === 0) {
  console.log('✅ Token format appears correct');
} else {
  console.log('❌ Token format issues found:');
  issues.forEach(issue => console.log(`  - ${issue}`));
}

// 3. Test with Facebook Graph API
console.log('\n🧪 Testing with Facebook Graph API...');

async function testToken() {
  try {
    const response = await axios.get(
      'https://graph.facebook.com/v19.0/me',
      {
        params: {
          access_token: PROVIDED_TOKEN,
          fields: 'id,name'
        }
      }
    );
    
    console.log('✅ Token is valid!');
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Token validation failed');
    console.log('Error:', error.response?.data || error.message);
    
    // Provide specific troubleshooting based on error
    if (error.response?.data?.error?.code === 190) {
      console.log('\n🔧 Troubleshooting for Error 190 (Invalid OAuth access token):');
      console.log('1. Check if the token is copied correctly (no extra spaces)');
      console.log('2. Verify the token hasn\'t expired');
      console.log('3. Ensure you\'re using the correct token type (User Access Token)');
      console.log('4. Check if the token has the required permissions');
      console.log('5. Try generating a new token from Facebook Developer Console');
    }
    
    return false;
  }
}

// 4. Alternative token formats to test
console.log('\n🔄 Testing alternative token formats...');

const alternativeTokens = [
  PROVIDED_TOKEN.trim(),
  PROVIDED_TOKEN.replace(/\s/g, ''),
  PROVIDED_TOKEN.replace(/[^A-Za-z0-9]/g, ''),
  PROVIDED_TOKEN.substring(0, 180), // Try shorter version
  PROVIDED_TOKEN + '==', // Try with padding
];

for (let i = 0; i < alternativeTokens.length; i++) {
  const token = alternativeTokens[i];
  if (token !== PROVIDED_TOKEN) {
    console.log(`\nTesting format ${i + 1}: ${token.substring(0, 20)}...`);
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
      console.log(`✅ Format ${i + 1} works!`);
      console.log('Response:', response.data);
      break;
    } catch (error) {
      console.log(`❌ Format ${i + 1} failed`);
    }
  }
}

// 5. Instructions for getting a new token
console.log('\n📝 How to Get a Valid Instagram API Token:');
console.log('1. Go to https://developers.facebook.com/');
console.log('2. Create or select your app');
console.log('3. Go to Tools > Graph API Explorer');
console.log('4. Select your app from the dropdown');
console.log('5. Add these permissions:');
console.log('   - instagram_basic');
console.log('   - instagram_content_publish');
console.log('   - pages_read_engagement');
console.log('   - pages_show_list');
console.log('6. Click "Generate Access Token"');
console.log('7. Copy the generated token');

// 6. Test the token
testToken().then(() => {
  console.log('\n🏁 Validation complete!');
}); 