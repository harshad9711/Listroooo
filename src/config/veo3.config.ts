export const veo3Config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_VEO3_API_BASE_URL || 'https://api.google.ai/veo3',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },

  // Video Generation Limits
  limits: {
    maxDuration: 60, // seconds
    minDuration: 5, // seconds
    maxPromptLength: 1000, // characters
    supportedResolutions: ['720p', '1080p', '4k'] as const,
    supportedFormats: ['landscape', 'portrait', 'square'] as const,
    supportedAspectRatios: ['16:9', '9:16', '1:1', '4:5', '21:9'] as const,
  },

  // User Quotas
  quotas: {
    default: {
      daily: 10,
      monthly: 100,
    },
    premium: {
      daily: 50,
      monthly: 500,
    },
    enterprise: {
      daily: 200,
      monthly: 2000,
    },
  },

  // Processing Settings
  processing: {
    maxConcurrentJobs: 5,
    statusUpdateInterval: 3000, // 3 seconds
    maxProcessingTime: 300000, // 5 minutes
  },

  // Storage Configuration
  storage: {
    videoBucket: import.meta.env.VITE_VEO3_VIDEO_BUCKET || 'veo3-videos',
    thumbnailBucket: import.meta.env.VITE_VEO3_THUMBNAIL_BUCKET || 'veo3-thumbnails',
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: ['video/mp4', 'video/mov', 'video/avi'],
  },

  // Analytics Configuration
  analytics: {
    enabled: true,
    trackEvents: [
      'generation_started',
      'generation_completed',
      'generation_failed',
      'video_viewed',
      'video_downloaded',
      'video_shared',
    ],
    retentionDays: 365,
  },

  // Error Handling
  errors: {
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    userFriendlyMessages: {
      quota_exceeded: 'You have reached your daily limit. Try again tomorrow or upgrade your plan.',
      api_error: 'Video generation failed. Please try again in a few minutes.',
      invalid_prompt: 'Please provide a more detailed description of your video.',
      processing_timeout: 'Video generation is taking longer than expected. Please check back later.',
    },
  },

  // Feature Flags
  features: {
    realTimeUpdates: true,
    batchGeneration: false, // Coming soon
    videoEditing: false, // Coming soon
    collaboration: false, // Coming soon
    advancedAnalytics: true,
  },

  // Development/Testing
  development: {
    simulateAPI: import.meta.env.NODE_ENV === 'development',
    mockResponseTime: {
      min: 5000, // 5 seconds
      max: 15000, // 15 seconds
    },
    enableDebugLogging: import.meta.env.NODE_ENV === 'development',
  },
};

export type Veo3Resolution = typeof veo3Config.limits.supportedResolutions[number];
export type Veo3Format = typeof veo3Config.limits.supportedFormats[number];
export type Veo3AspectRatio = typeof veo3Config.limits.supportedAspectRatios[number];
