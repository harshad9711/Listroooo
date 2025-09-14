# Veo 3 Cinematic Generator

A comprehensive feature that transforms plain ideas into structured JSON prompts and generates polished 8-second video creatives using Google's Veo 3 through the Gemini API.

## Features

- **Structured JSON Prompt System**: Convert user ideas into validated JSON prompts
- **Platform-Specific Presets**: TikTok, Instagram Reels, YouTube Shorts, YouTube Standard, Meta Ads
- **Image-to-Video Support**: Use brand assets as starting frames
- **Professional UX**: Form → JSON preview → prompt preview → render → status polling → downloadable MP4
- **Server-Side API Calls**: All Gemini/Veo 3 calls happen on the server for security
- **Real-time Status Polling**: Track generation progress with live updates

## Architecture

### Frontend (React/Vite)
- **Location**: `/src/features/veo3/`
- **Main Page**: `/studio/veo3`
- **Components**:
  - `VeoStudioPage.tsx` - Main orchestrator component
  - `AssetPicker.tsx` - Upload and manage brand assets
  - `PromptForm.tsx` - Comprehensive form for prompt creation
  - `PromptPreview.tsx` - Live JSON and prompt preview

### Backend (Node/Express)
- **Location**: `/api/`
- **Routes**: `/api/veo3/*`
- **Client**: `lib/veo3Client.js` - Gemini API wrapper
- **Routes**: `veo3-routes.js` - API endpoints

## Setup Instructions

### 1. Environment Configuration

Add these variables to your `.env` file:

```bash
# Veo 3 Configuration
GEMINI_API_KEY=your_gemini_api_key_here
VEO_MODEL_ID=veo-3.0-generate-001
VEO_DEFAULT_RESOLUTION=720p
VEO_DEFAULT_SEED=0
```

### 2. Install Dependencies

```bash
# Backend dependencies
cd api
npm install @google/generative-ai

# Frontend dependencies (already included)
npm install
```

### 3. Start the Servers

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd api
npm start
```

### 4. Access the Feature

Navigate to: `http://localhost:5173/studio/veo3`

## API Endpoints

### POST `/api/veo3/generate`
Start video generation
- **Body**: `{ prompt: VeoPromptJSON, config?: VeoConfig }`
- **Response**: `{ jobId: string, status: string, estimatedTime: number }`

### GET `/api/veo3/status/:jobId`
Get job status
- **Response**: `{ jobId: string, status: string, progress: number, result?: object }`

### GET `/api/veo3/jobs`
Get user's jobs
- **Query**: `?limit=20&offset=0`
- **Response**: `{ jobs: VeoGenerationJob[], total: number }`

### DELETE `/api/veo3/jobs/:jobId`
Delete a job

## Data Types

### VeoPromptJSON
```typescript
interface VeoPromptJSON {
  idea: string;               // user's plain idea
  goal: string;               // e.g., "product awareness"
  platform: Platform;         // tiktok, instagram_reel, etc.
  aspect: Aspect;             // "9:16" | "16:9"
  resolution?: "720p" | "1080p";
  durationSec: 8;
  negativePrompt?: string;
  seed?: number;
  brand: BrandSpec;
  cta?: string;
  visualRefs: BrandVisual[];
  shotPlan: Shot[];
  audio: AudioPlan;
}
```

### Platform Presets
- **TikTok/Instagram Reels/YouTube Shorts/Meta Ads**: 9:16, 720p
- **YouTube Standard**: 16:9, 1080p

## Usage Flow

1. **Asset Upload**: Upload logos, product photos, brand visuals
2. **Prompt Creation**: Fill out the comprehensive form with:
   - Basic info (idea, goal, platform, duration)
   - Brand specification (name, tone, colors, fonts)
   - Shot plan (timed sequence of actions)
   - Audio plan (dialogue, music, SFX, ambience)
   - Advanced settings (negative prompt, seed)
3. **Preview**: Review JSON structure and generated Veo prompt
4. **Generate**: Submit for video generation
5. **Monitor**: Watch real-time status updates
6. **Download**: Get the final MP4 when ready

## Template Presets

- **UGC Testimonial**: User-generated content style
- **Product Cinematic**: High-end product showcase
- **Logo Stinger**: Quick brand logo animation
- **Lifestyle + Packshot**: Lifestyle scene to product focus

## Technical Notes

- **Server-Side Security**: All API keys are kept on the server
- **Image-to-Video**: First product/photo asset becomes the starting frame
- **Validation**: Comprehensive client and server-side validation
- **Error Handling**: Graceful error states with user-friendly messages
- **Rate Limiting**: Built-in protection against abuse
- **Polling**: 5-second intervals for status updates

## Integration

The feature integrates seamlessly with the existing:
- **Authentication**: Uses existing Supabase auth
- **Routing**: Added to protected routes under `/studio/veo3`
- **UI Components**: Uses existing Tremor React components
- **Error Boundaries**: Wrapped in existing error handling

## Development

### File Structure
```
src/features/veo3/
├── types.ts              # TypeScript interfaces
├── presets.ts            # Platform and template presets
├── promptBuilder.ts      # Prompt transformation logic
├── VeoStudioPage.tsx     # Main page component
└── components/
    ├── AssetPicker.tsx   # Asset upload component
    ├── PromptForm.tsx    # Form component
    └── PromptPreview.tsx # Preview component

api/
├── lib/veo3Client.js     # Gemini API client
└── veo3-routes.js        # API routes
```

### Key Decisions

1. **Single Router**: Integrated with existing React Router, no additional routing
2. **Server-Side API**: All Gemini calls happen on the server for security
3. **In-Memory Storage**: Jobs stored in memory (can be upgraded to database)
4. **Comprehensive Validation**: Both client and server-side validation
5. **Real-time Updates**: Polling-based status updates
6. **Platform Optimization**: Automatic aspect ratio and resolution selection

## Production Considerations

- **Database Storage**: Replace in-memory job storage with database
- **File Storage**: Implement proper video file storage (S3, etc.)
- **Rate Limiting**: Add proper rate limiting middleware
- **Monitoring**: Add comprehensive logging and monitoring
- **Caching**: Implement caching for frequently used prompts
- **Scaling**: Consider queue-based job processing for high volume
