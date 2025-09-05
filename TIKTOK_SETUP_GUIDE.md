# TikTok Integration Setup Guide

## 🎯 Quick Setup with Your Client Key

You have your TikTok client key: **`aw7epfmks57arrfq`**

## 📋 Step-by-Step Setup

### 1. Complete TikTok App Configuration

1. **Go to TikTok for Developers**: https://developers.tiktok.com/
2. **Log into your developer account**
3. **Find your app** with client key: `aw7epfmks57arrfq`
4. **Complete app setup**:
   - Add app description
   - Set redirect URIs
   - Configure permissions

### 2. Get Required Credentials

From your TikTok app dashboard, get:

- ✅ **Client Key**: `aw7epfmks57arrfq` (you have this)
- 🔄 **Client Secret**: Get from app settings
- 🔄 **Access Token**: Generate with required permissions

### 3. Required Permissions

Ensure your app has these permissions:
```
user.info.basic    - Access to user profile information
video.list         - Access to user's video list  
video.query        - Search videos
hashtag.search     - Search hashtags
```

### 4. Environment Variables

Create a `.env` file in your project root with:

```env
# TikTok API Credentials
REACT_APP_TIKTOK_CLIENT_KEY=aw7epfmks57arrfq
REACT_APP_TIKTOK_CLIENT_SECRET=your_client_secret_here
REACT_APP_TIKTOK_ACCESS_TOKEN=your_access_token_here

# Instagram API Credentials (if you have them)
REACT_APP_INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token_here
REACT_APP_INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_account_id_here
REACT_APP_FACEBOOK_PAGE_ID=your_facebook_page_id_here

# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_url_here
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Other API Keys
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
```

### 5. Test the Integration

Once you have all credentials:

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Go to UGC Dashboard**:
   - Navigate to: http://localhost:5173
   - Go to UGC Dashboard
   - Check TikTok connection status

3. **Test TikTok features**:
   - Click "Import from TikTok" button
   - Search for hashtags
   - Import trending videos

## 🔧 Manual Credential Setup

If you prefer to set credentials programmatically:

```typescript
import { tiktokService } from './services/tiktokService';

// Set credentials manually
tiktokService.setCredentials(
  'aw7epfmks57arrfq',           // Your client key
  'your_client_secret_here',    // Your client secret
  'your_access_token_here'      // Your access token
);

// Test connection
const isConnected = await tiktokService.testConnection();
console.log('TikTok connected:', isConnected);
```

## 🚨 Common Issues & Solutions

### "Invalid OAuth access token"
- **Solution**: Generate a new access token
- **Check**: Token expiration and permissions

### "Rate limit exceeded"
- **Solution**: Wait before making more requests
- **Limit**: 100 requests per hour per endpoint

### "Permission denied"
- **Solution**: Check app permissions in TikTok developer console
- **Verify**: Business verification is complete

## 📱 Using the TikTok Integration

### Import Trending Videos
```typescript
// Import trending TikTok videos
const trendingContent = await ugcService.getTikTokTrendingVideos('US', 20);
```

### Search by Hashtag
```typescript
// Search and import by hashtag
const fashionContent = await ugcService.importFromTikTokHashtag('fashion', 25, ['fashion', 'style']);
```

### Discover Content
```typescript
// Discover content using hashtags and keywords
const discoveredContent = await ugcService.discoverTikTokContent(
  ['fashion', 'style', 'outfit'], 
  ['clothing', 'accessories'], 
  50
);
```

## 🔗 Useful Links

- **TikTok for Developers**: https://developers.tiktok.com/
- **API Documentation**: https://developers.tiktok.com/doc/
- **OAuth Guide**: https://developers.tiktok.com/doc/oauth
- **Rate Limits**: https://developers.tiktok.com/doc/rate-limits

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your app permissions
3. Ensure business verification is complete
4. Check rate limits and implement proper error handling

---

**Your Client Key**: `aw7epfmks57arrfq` ✅

**Next Steps**: Get your Client Secret and Access Token to complete the setup! 