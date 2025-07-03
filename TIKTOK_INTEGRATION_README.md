# TikTok API Integration for UGC Feature

## Overview

This document provides a comprehensive guide for integrating TikTok's API with the UGC (User Generated Content) feature. The integration allows you to discover, import, and manage TikTok content for your UGC campaigns.

## 🚀 Quick Start

### 1. TikTok Developer Account Setup

1. **Register as a TikTok Developer**
   - Visit: https://developers.tiktok.com/
   - Create a developer account
   - Complete business verification

2. **Create a TikTok App**
   - Go to the TikTok for Developers console
   - Click "Create App"
   - Fill in your app details
   - Select the necessary permissions

3. **Get Your Credentials**
   - Client Key (App ID)
   - Client Secret
   - Access Token

### 2. Environment Variables

Add these to your `.env` file:

```env
REACT_APP_TIKTOK_CLIENT_KEY=your_client_key_here
REACT_APP_TIKTOK_CLIENT_SECRET=your_client_secret_here
REACT_APP_TIKTOK_ACCESS_TOKEN=your_access_token_here
```

### 3. Test the Integration

```typescript
import { tiktokService } from './services/tiktokService';

// Test connection
const isConnected = await tiktokService.testConnection();
console.log('TikTok connected:', isConnected);

// Search hashtags
const hashtags = await tiktokService.searchHashtags('fashion');
console.log('Hashtags:', hashtags);

// Get trending videos
const trendingVideos = await tiktokService.getTrendingVideos('US', 10);
console.log('Trending videos:', trendingVideos);
```

## 📋 API Endpoints

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/video/query/` | POST | Search videos by hashtag or keyword |
| `/hashtag/search/` | POST | Search hashtags |
| `/video/trending/` | POST | Get trending videos |
| `/user/videos/` | POST | Get user's videos |
| `/video/detail/` | POST | Get video details |
| `/hashtag/trending/` | POST | Get trending hashtags |

### Request Format

All requests use the following format:

```typescript
{
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    // Request parameters
  })
}
```

## 🔧 Service Methods

### TikTokService Class

```typescript
class TikTokService {
  // Search videos by hashtag
  async searchVideosByHashtag(hashtag: string, limit: number = 20): Promise<TikTokVideo[]>
  
  // Search hashtags
  async searchHashtags(query: string, limit: number = 20): Promise<TikTokHashtag[]>
  
  // Get trending videos
  async getTrendingVideos(region: string = 'US', limit: number = 20): Promise<TikTokTrendingVideo[]>
  
  // Get user videos
  async getUserVideos(userId: string, limit: number = 20): Promise<TikTokVideo[]>
  
  // Get video details
  async getVideoDetails(videoId: string): Promise<TikTokVideo>
  
  // Save video to UGC database
  async saveVideoToUGC(video: TikTokVideo, tags: string[], status: string): Promise<any>
  
  // Bulk import videos
  async bulkImportVideos(videos: TikTokVideo[], tags: string[], status: string): Promise<any[]>
  
  // Discover content
  async discoverContent(hashtags: string[], keywords: string[], limit: number = 50): Promise<TikTokVideo[]>
  
  // Test connection
  async testConnection(): Promise<boolean>
  
  // Get trending hashtags
  async getTrendingHashtags(region: string = 'US', limit: number = 20): Promise<TikTokHashtag[]>
}
```

### UGCService Integration

```typescript
class UGCService {
  // Import from TikTok
  async importFromTikTok(limit: number = 25, tags: string[], status: string): Promise<UGCContent[]>
  
  // Search TikTok hashtags
  async searchTikTokHashtags(query: string): Promise<any[]>
  
  // Import from TikTok hashtag
  async importFromTikTokHashtag(hashtag: string, limit: number = 25, tags: string[]): Promise<UGCContent[]>
  
  // Get TikTok trending videos
  async getTikTokTrendingVideos(region: string = 'US', limit: number = 20): Promise<UGCContent[]>
  
  // Discover TikTok content
  async discoverTikTokContent(hashtags: string[], keywords: string[], limit: number = 50): Promise<UGCContent[]>
  
  // Test TikTok connection
  async testTikTokConnection(): Promise<boolean>
  
  // Set TikTok credentials
  async setTikTokCredentials(clientKey: string, clientSecret: string, accessToken: string): Promise<void>
}
```

## 📊 Data Models

### TikTokVideo Interface

```typescript
interface TikTokVideo {
  id: string;
  title?: string;
  description?: string;
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  width?: number;
  height?: number;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  created_time?: string;
  hashtags?: string[];
  mentions?: string[];
  music?: {
    id: string;
    title: string;
    author: string;
  };
  author?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    follower_count?: number;
    following_count?: number;
    verified?: boolean;
  };
  location?: {
    id: string;
    name: string;
    address?: string;
  };
}
```

### TikTokHashtag Interface

```typescript
interface TikTokHashtag {
  id: string;
  name: string;
  video_count: number;
  view_count?: number;
}
```

## 🎯 Usage Examples

### 1. Import Trending Videos

```typescript
// Import trending TikTok videos
const trendingContent = await ugcService.getTikTokTrendingVideos('US', 20);
console.log('Imported trending videos:', trendingContent.length);
```

### 2. Search and Import by Hashtag

```typescript
// Search for a hashtag
const hashtags = await ugcService.searchTikTokHashtags('fashion');

// Import videos from a specific hashtag
const fashionContent = await ugcService.importFromTikTokHashtag('fashion', 25, ['fashion', 'style']);
console.log('Imported fashion content:', fashionContent.length);
```

### 3. Discover Content by Keywords

```typescript
// Discover content using hashtags and keywords
const discoveredContent = await ugcService.discoverTikTokContent(
  ['fashion', 'style', 'outfit'], 
  ['clothing', 'accessories'], 
  50
);
console.log('Discovered content:', discoveredContent.length);
```

### 4. Test Connection

```typescript
// Test TikTok API connection
const isConnected = await ugcService.testTikTokConnection();
if (isConnected) {
  console.log('TikTok API is connected!');
} else {
  console.log('TikTok API connection failed');
}
```

## 🔐 Authentication

### OAuth Flow

1. **Redirect to TikTok OAuth**
   ```
   https://www.tiktok.com/v2/auth/authorize/
   ?client_key=YOUR_CLIENT_KEY
   &scope=user.info.basic,video.list
   &response_type=code
   &redirect_uri=YOUR_REDIRECT_URI
   &state=YOUR_STATE
   ```

2. **Exchange Code for Token**
   ```typescript
   const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/x-www-form-urlencoded',
       'Cache-Control': 'no-cache'
     },
     body: new URLSearchParams({
       client_key: clientKey,
       client_secret: clientSecret,
       code: authorizationCode,
       grant_type: 'authorization_code',
       redirect_uri: redirectUri
     })
   });
   ```

### Required Permissions

- `user.info.basic` - Access to user profile information
- `video.list` - Access to user's video list
- `video.query` - Search videos
- `hashtag.search` - Search hashtags

## 📈 Rate Limits

TikTok API has the following rate limits:

- **Video Search**: 100 requests per hour
- **Hashtag Search**: 100 requests per hour
- **User Videos**: 100 requests per hour
- **Video Details**: 100 requests per hour

### Rate Limit Handling

```typescript
// Implement rate limiting in your service
class RateLimitedTikTokService extends TikTokService {
  private requestCount = 0;
  private lastReset = Date.now();
  
  private async checkRateLimit() {
    const now = Date.now();
    if (now - this.lastReset > 3600000) { // 1 hour
      this.requestCount = 0;
      this.lastReset = now;
    }
    
    if (this.requestCount >= 100) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    this.requestCount++;
  }
  
  async searchVideosByHashtag(hashtag: string, limit: number = 20) {
    await this.checkRateLimit();
    return super.searchVideosByHashtag(hashtag, limit);
  }
}
```

## 🛠️ Error Handling

### Common Errors

```typescript
try {
  const videos = await tiktokService.searchVideosByHashtag('fashion');
} catch (error) {
  if (error.message.includes('Invalid OAuth access token')) {
    console.error('Invalid access token. Please refresh your token.');
  } else if (error.message.includes('Rate limit exceeded')) {
    console.error('Rate limit exceeded. Please wait before making more requests.');
  } else if (error.message.includes('Permission denied')) {
    console.error('Insufficient permissions. Please check your app permissions.');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

### Error Types

| Error Code | Description | Solution |
|------------|-------------|----------|
| `invalid_access_token` | Token is invalid or expired | Refresh the access token |
| `rate_limit_exceeded` | Too many requests | Implement rate limiting |
| `permission_denied` | Insufficient permissions | Update app permissions |
| `invalid_hashtag` | Hashtag not found | Check hashtag spelling |
| `user_not_found` | User doesn't exist | Verify user ID |

## 🔄 Content Synchronization

### Automatic Sync

```typescript
// Set up automatic content synchronization
class TikTokContentSync {
  private syncInterval: NodeJS.Timeout;
  
  startSync(intervalMinutes: number = 60) {
    this.syncInterval = setInterval(async () => {
      try {
        // Import trending content
        await ugcService.importFromTikTok(25, [], 'pending');
        
        // Import from specific hashtags
        const hashtags = ['fashion', 'style', 'outfit'];
        for (const hashtag of hashtags) {
          await ugcService.importFromTikTokHashtag(hashtag, 10, [hashtag]);
        }
        
        console.log('TikTok content sync completed');
      } catch (error) {
        console.error('TikTok sync error:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }
  
  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}
```

### Manual Sync

```typescript
// Manual content import
const syncTikTokContent = async () => {
  try {
    // Import trending videos
    const trending = await ugcService.getTikTokTrendingVideos('US', 20);
    
    // Import from specific hashtags
    const hashtags = ['fashion', 'style', 'outfit'];
    for (const hashtag of hashtags) {
      await ugcService.importFromTikTokHashtag(hashtag, 15, [hashtag]);
    }
    
    console.log('Manual TikTok sync completed');
  } catch (error) {
    console.error('Manual sync error:', error);
  }
};
```

## 📱 UI Integration

### Dashboard Integration

The TikTok integration is already integrated into the UGC Dashboard with:

- **Connection Status**: Shows if TikTok is connected
- **Import Button**: Import trending videos
- **Settings Panel**: Configure TikTok credentials
- **Content Display**: Shows TikTok videos in the content grid

### React Components

```typescript
// TikTok connection status component
const TikTokConnectionStatus = () => {
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    checkConnection();
  }, []);
  
  const checkConnection = async () => {
    const isConnected = await ugcService.testTikTokConnection();
    setConnected(isConnected);
  };
  
  return (
    <div className="flex items-center space-x-3">
      <Music className={`h-6 w-6 ${connected ? 'text-green-500' : 'text-gray-400'}`} />
      <div>
        <h3 className="font-medium text-gray-900">TikTok Integration</h3>
        <p className="text-sm text-gray-600">
          {connected ? 'Connected' : 'Not connected'}
        </p>
      </div>
    </div>
  );
};
```

## 🧪 Testing

### Unit Tests

```typescript
describe('TikTokService', () => {
  let tiktokService: TikTokService;
  
  beforeEach(() => {
    tiktokService = new TikTokService();
  });
  
  test('should search hashtags', async () => {
    const hashtags = await tiktokService.searchHashtags('fashion');
    expect(hashtags).toBeDefined();
    expect(Array.isArray(hashtags)).toBe(true);
  });
  
  test('should get trending videos', async () => {
    const videos = await tiktokService.getTrendingVideos('US', 5);
    expect(videos).toBeDefined();
    expect(Array.isArray(videos)).toBe(true);
    expect(videos.length).toBeLessThanOrEqual(5);
  });
  
  test('should test connection', async () => {
    const connected = await tiktokService.testConnection();
    expect(typeof connected).toBe('boolean');
  });
});
```

### Integration Tests

```typescript
describe('UGCService TikTok Integration', () => {
  test('should import TikTok content', async () => {
    const content = await ugcService.importFromTikTok(5, ['test'], 'pending');
    expect(content).toBeDefined();
    expect(Array.isArray(content)).toBe(true);
    expect(content.length).toBeLessThanOrEqual(5);
  });
  
  test('should search TikTok hashtags', async () => {
    const hashtags = await ugcService.searchTikTokHashtags('fashion');
    expect(hashtags).toBeDefined();
    expect(Array.isArray(hashtags)).toBe(true);
  });
});
```

## 🚨 Troubleshooting

### Common Issues

1. **"Invalid OAuth access token"**
   - Solution: Refresh your access token
   - Check token expiration
   - Verify token format

2. **"Rate limit exceeded"**
   - Solution: Implement rate limiting
   - Reduce request frequency
   - Use caching for repeated requests

3. **"Permission denied"**
   - Solution: Check app permissions
   - Verify scope settings
   - Ensure business verification is complete

4. **"Hashtag not found"**
   - Solution: Check hashtag spelling
   - Verify hashtag exists
   - Try different hashtag variations

### Debug Mode

```typescript
// Enable debug logging
const DEBUG_MODE = process.env.NODE_ENV === 'development';

class DebugTikTokService extends TikTokService {
  async searchVideosByHashtag(hashtag: string, limit: number = 20) {
    if (DEBUG_MODE) {
      console.log(`Searching TikTok videos for hashtag: ${hashtag}`);
    }
    
    try {
      const result = await super.searchVideosByHashtag(hashtag, limit);
      
      if (DEBUG_MODE) {
        console.log(`Found ${result.length} videos for hashtag: ${hashtag}`);
      }
      
      return result;
    } catch (error) {
      if (DEBUG_MODE) {
        console.error(`Error searching hashtag ${hashtag}:`, error);
      }
      throw error;
    }
  }
}
```

## 📚 Additional Resources

- [TikTok for Developers](https://developers.tiktok.com/)
- [API Documentation](https://developers.tiktok.com/doc/)
- [OAuth Guide](https://developers.tiktok.com/doc/oauth)
- [Rate Limits](https://developers.tiktok.com/doc/rate-limits)
- [Error Codes](https://developers.tiktok.com/doc/error-codes)

## 🤝 Support

For issues with the TikTok integration:

1. Check the troubleshooting section above
2. Review TikTok's official documentation
3. Verify your app permissions and credentials
4. Check rate limits and implement proper error handling

## 📝 Changelog

### v1.0.0 (Current)
- Initial TikTok API integration
- Video search and import functionality
- Hashtag search and discovery
- Trending videos import
- UGC dashboard integration
- Connection testing and status display 