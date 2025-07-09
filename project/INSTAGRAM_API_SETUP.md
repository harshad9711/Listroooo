# Instagram API Setup Guide

This guide will help you set up Instagram API integration for the UGC (User Generated Content) feature.

## 🚀 Quick Start

1. **Run the setup script**: `node setup-instagram-token.js`
2. **Follow the interactive prompts**
3. **Add environment variables to your `.env` file**
4. **Test the integration**: `node test-ugc.js`

## 📋 Detailed Setup Instructions

### Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App"
3. Select "Business" as the app type
4. Fill in your app details:
   - **App Name**: Your app name (e.g., "My UGC Platform")
   - **App Contact Email**: Your email
   - **Business Account**: Select your business account

### Step 2: Add Instagram Basic Display

1. In your app dashboard, go to "Add Product"
2. Find "Instagram Basic Display" and click "Set Up"
3. Configure the following:
   - **Client OAuth Settings**:
     - Valid OAuth Redirect URIs: `http://localhost:3000/auth/instagram/callback`
     - Deauthorize Callback URL: `http://localhost:3000/auth/instagram/deauthorize`
     - Data Deletion Request URL: `http://localhost:3000/auth/instagram/data-deletion`

### Step 3: Configure App Permissions

1. Go to "App Review" in the left sidebar
2. Click "Permissions and Features"
3. Add these permissions:
   ```
   instagram_basic
   instagram_content_publish
   pages_read_engagement
   pages_show_list
   user_profile
   ```

### Step 4: Generate Access Token

1. Go to "Tools" > "Graph API Explorer"
2. Select your app from the dropdown
3. Add the permissions listed above
4. Click "Generate Access Token"
5. **Copy the generated token** (it will look like: `IGA...`)

### Step 5: Get Instagram Business Account ID

1. In Graph API Explorer, make this request:
   ```
   GET /me/accounts
   ```
2. Look for the `instagram_business_account` field in the response
3. Copy the `id` value

## 🔧 Environment Variables

Add these to your `.env` file:

```bash
# Instagram API Configuration
INSTAGRAM_ACCESS_TOKEN=your_generated_token_here
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_business_account_id_here
INSTAGRAM_USER_ID=your_business_account_id_here
CLIENT_IP=127.0.0.1

# Optional: For testing
INSTAGRAM_TEST_MODE=true
```

## 🧪 Testing Your Setup

### Run the Setup Script

```bash
node setup-instagram-token.js
```

This interactive script will:
- Guide you through the setup process
- Test your token
- Get your business account ID
- Generate the correct environment variables

### Test the Integration

```bash
node test-ugc.js
```

This will test:
- ✅ Instagram Access Token validation
- ✅ Business Account access
- ✅ Hashtag search functionality
- ✅ UGC content fetching
- ✅ Mentions retrieval

## 🔍 Troubleshooting

### Common Issues

#### 1. "Invalid OAuth access token" Error

**Cause**: Token is malformed, expired, or lacks permissions

**Solution**:
- Regenerate the token in Graph API Explorer
- Ensure all required permissions are added
- Check that the token is copied correctly (no extra spaces)

#### 2. "No Instagram Business Account found"

**Cause**: Your Facebook page isn't connected to Instagram

**Solution**:
- Connect your Facebook page to Instagram
- Ensure you're using a Business/Creator Instagram account
- Check that the Instagram account is public

#### 3. "Permission denied" Error

**Cause**: Missing required permissions

**Solution**:
- Add all required permissions in App Review
- Wait for permission approval (may take 24-48 hours)
- Use a token with the correct permissions

#### 4. "Rate limit exceeded"

**Cause**: Too many API calls

**Solution**:
- Implement rate limiting in your code
- Cache API responses
- Use batch requests when possible

### Debug Steps

1. **Check token format**:
   ```bash
   node validate-instagram-token.js
   ```

2. **Verify permissions**:
   - Go to Graph API Explorer
   - Check that all required permissions are listed
   - Ensure permissions are approved

3. **Test individual endpoints**:
   ```bash
   curl "https://graph.facebook.com/v19.0/me?access_token=YOUR_TOKEN"
   ```

## 📚 API Endpoints Used

### Core Endpoints

| Endpoint | Purpose | Required Permissions |
|----------|---------|---------------------|
| `/me` | Validate token | `user_profile` |
| `/me/accounts` | Get business accounts | `pages_show_list` |
| `/ig_hashtag_search` | Search hashtags | `instagram_basic` |
| `/{hashtag-id}/recent_media` | Get hashtag posts | `instagram_basic` |
| `/{business-account-id}/tags` | Get mentions | `instagram_basic` |

### Response Format

```json
{
  "id": "post_id",
  "caption": "Post caption",
  "media_url": "https://...",
  "permalink": "https://instagram.com/p/...",
  "timestamp": "2024-01-01T00:00:00+0000",
  "username": "username",
  "media_type": "IMAGE|VIDEO|CAROUSEL_ALBUM",
  "like_count": 123,
  "comments_count": 45
}
```

## 🔒 Security Best Practices

1. **Never commit tokens to version control**
2. **Use environment variables for all sensitive data**
3. **Implement token refresh logic**
4. **Add rate limiting to prevent abuse**
5. **Validate all API responses**
6. **Log API errors for debugging**

## 📞 Support

If you encounter issues:

1. Check the [Facebook Developer Documentation](https://developers.facebook.com/docs/instagram-api/)
2. Review the [Instagram API Reference](https://developers.facebook.com/docs/instagram-basic-display-api/reference)
3. Check the troubleshooting section above
4. Run the validation scripts to identify specific issues

## 🎯 Next Steps

Once your Instagram API is working:

1. **Test UGC fetching**: Try different hashtags
2. **Implement rights management**: Set up email automation
3. **Add content classification**: Integrate with OpenAI
4. **Set up monitoring**: Add error tracking and analytics
5. **Scale up**: Implement caching and rate limiting 