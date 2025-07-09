// TikTok Integration Test Script
// Run this with: node test-tiktok-setup.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎵 TikTok Integration Test Setup');
console.log('================================\n');

// Your TikTok Client Key
const CLIENT_KEY = 'aw7epfmks57arrfq';

console.log('✅ Your TikTok Client Key:', CLIENT_KEY);
console.log('\n📋 Next Steps Required:\n');

console.log('1. 🔑 Get Client Secret:');
console.log('   - Go to: https://developers.tiktok.com/');
console.log('   - Find your app with client key:', CLIENT_KEY);
console.log('   - Copy the Client Secret from app settings\n');

console.log('2. 🎫 Generate Access Token:');
console.log('   - In your TikTok app dashboard');
console.log('   - Generate an access token with these permissions:');
console.log('     • user.info.basic');
console.log('     • video.list');
console.log('     • video.query');
console.log('     • hashtag.search\n');

console.log('3. 📝 Create .env file:');
console.log('   Create a .env file in your project root with:');
console.log('   ----------------------------------------');
console.log(`   REACT_APP_TIKTOK_CLIENT_KEY=${CLIENT_KEY}`);
console.log('   REACT_APP_TIKTOK_CLIENT_SECRET=your_client_secret_here');
console.log('   REACT_APP_TIKTOK_ACCESS_TOKEN=your_access_token_here');
console.log('   ----------------------------------------\n');

console.log('4. 🚀 Test Integration:');
console.log('   - Restart your dev server: npm run dev');
console.log('   - Go to: http://localhost:5173');
console.log('   - Navigate to UGC Dashboard');
console.log('   - Check TikTok connection status\n');

console.log('🔗 Useful Links:');
console.log('   - TikTok for Developers: https://developers.tiktok.com/');
console.log('   - API Documentation: https://developers.tiktok.com/doc/');
console.log('   - OAuth Guide: https://developers.tiktok.com/doc/oauth\n');

console.log('📞 Need Help?');
console.log('   - Check the TIKTOK_SETUP_GUIDE.md file');
console.log('   - Review TIKTOK_INTEGRATION_README.md for detailed docs\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env file found');
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes(CLIENT_KEY)) {
    console.log('✅ TikTok client key found in .env');
  } else {
    console.log('⚠️  TikTok client key not found in .env');
  }
} else {
  console.log('⚠️  .env file not found - create one with your credentials');
}

console.log('\n🎯 Ready to integrate TikTok with your UGC feature!'); 