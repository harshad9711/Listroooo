import { veo3Config } from '../config/veo3.config';

export interface Veo3APIRequest {
  prompt: string;
  style: string;
  tone: string;
  aspectRatio: string;
  targetPlatform: string;
  duration: number;
  resolution: string;
  format: string;
  userId: string;
  videoId: string;
}

export interface Veo3APIResponse {
  success: boolean;
  videoId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  fileSize?: number;
  mimeType?: string;
  error?: string;
  estimatedCompletionTime?: string;
  progress?: number;
}

export interface Veo3APIError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
}

export class Veo3RealAPIService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
    this.baseUrl = veo3Config.api.baseUrl;
  }

  /**
   * Generate a video using the real Google Veo 3 API
   */
  async generateVideo(request: Veo3APIRequest): Promise<Veo3APIResponse> {
    try {
      // Validate request
      this.validateRequest(request);

      // Prepare API payload
      const payload = this.prepareAPIPayload(request);

      // Make API call
      const response = await this.makeAPICall('/generate', payload);

      return this.parseAPIResponse(response);
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  /**
   * Check video generation status
   */
  async checkVideoStatus(videoId: string): Promise<Veo3APIResponse> {
    try {
      const response = await this.makeAPICall(`/status/${videoId}`, {}, 'GET');
      return this.parseAPIResponse(response);
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  /**
   * Cancel video generation
   */
  async cancelVideoGeneration(videoId: string): Promise<boolean> {
    try {
      const response = await this.makeAPICall(`/cancel/${videoId}`, {}, 'POST');
      return response.success === true;
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  /**
   * Get video generation history for a user
   */
  async getUserVideoHistory(userId: string, limit: number = 50): Promise<Veo3APIResponse[]> {
    try {
      const response = await this.makeAPICall(`/user/${userId}/videos`, { limit }, 'GET');
      return response.videos || [];
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  /**
   * Validate API request
   */
  private validateRequest(request: Veo3APIRequest): void {
    if (!request.prompt || request.prompt.trim().length === 0) {
      throw new Error('Prompt is required');
    }

    if (request.prompt.length > veo3Config.limits.maxPromptLength) {
      throw new Error(`Prompt too long. Maximum ${veo3Config.limits.maxPromptLength} characters allowed.`);
    }

    if (request.duration < veo3Config.limits.minDuration || request.duration > veo3Config.limits.maxDuration) {
      throw new Error(`Duration must be between ${veo3Config.limits.minDuration} and ${veo3Config.limits.maxDuration} seconds.`);
    }

    if (!veo3Config.limits.supportedResolutions.includes(request.resolution as any)) {
      throw new Error(`Unsupported resolution: ${request.resolution}`);
    }

    if (!veo3Config.limits.supportedFormats.includes(request.format as any)) {
      throw new Error(`Unsupported format: ${request.format}`);
    }

    if (!veo3Config.limits.supportedAspectRatios.includes(request.aspectRatio as any)) {
      throw new Error(`Unsupported aspect ratio: ${request.aspectRatio}`);
    }
  }

  /**
   * Prepare API payload
   */
  private prepareAPIPayload(request: Veo3APIRequest): any {
    return {
      prompt: request.prompt.trim(),
      style: request.style,
      tone: request.tone,
      aspectRatio: request.aspectRatio,
      targetPlatform: request.targetPlatform,
      duration: request.duration,
      resolution: request.resolution,
      format: request.format,
      userId: request.userId,
      videoId: request.videoId,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * Make API call with retry logic
   */
  private async makeAPICall(endpoint: string, payload: any, method: string = 'POST'): Promise<any> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= veo3Config.api.retryAttempts; attempt++) {
      try {
        const url = `${this.baseUrl}${endpoint}`;
        const options: RequestInit = {
          method,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Listro-Veo3-Client/1.0.0'
          },
          signal: AbortSignal.timeout(veo3Config.api.timeout)
        };

        if (method === 'POST' && payload) {
          options.body = JSON.stringify(payload);
        }

        const response = await fetch(url, options);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error;
        
        if (attempt < veo3Config.api.retryAttempts) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, veo3Config.api.retryDelay * attempt));
        }
      }
    }

    throw lastError;
  }

  /**
   * Parse API response
   */
  private parseAPIResponse(response: any): Veo3APIResponse {
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid API response format');
    }

    return {
      success: response.success || false,
      videoId: response.videoId || response.id,
      status: response.status || 'pending',
      videoUrl: response.videoUrl || response.video_url,
      thumbnailUrl: response.thumbnailUrl || response.thumbnail_url,
      duration: response.duration,
      fileSize: response.fileSize || response.file_size,
      mimeType: response.mimeType || response.mime_type,
      error: response.error,
      estimatedCompletionTime: response.estimatedCompletionTime || response.estimated_completion_time,
      progress: response.progress
    };
  }

  /**
   * Handle API errors
   */
  private handleAPIError(error: any): Veo3APIError {
    if (error.name === 'AbortError') {
      return {
        code: 'TIMEOUT',
        message: 'Request timed out. Please try again.',
        retryable: true
      };
    }

    if (error.message?.includes('HTTP 429')) {
      return {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please wait a moment and try again.',
        retryable: true
      };
    }

    if (error.message?.includes('HTTP 401')) {
      return {
        code: 'UNAUTHORIZED',
        message: 'Invalid API key. Please check your configuration.',
        retryable: false
      };
    }

    if (error.message?.includes('HTTP 403')) {
      return {
        code: 'FORBIDDEN',
        message: 'Access denied. Please check your API permissions.',
        retryable: false
      };
    }

    if (error.message?.includes('HTTP 500')) {
      return {
        code: 'SERVER_ERROR',
        message: 'Server error. Please try again later.',
        retryable: true
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred.',
      retryable: true,
      details: error
    };
  }

  /**
   * Check if API is available
   */
  async checkAPIAvailability(): Promise<boolean> {
    try {
      const response = await this.makeAPICall('/health', {}, 'GET');
      return response.status === 'healthy';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get API rate limit information
   */
  async getRateLimitInfo(): Promise<any> {
    try {
      const response = await this.makeAPICall('/rate-limits', {}, 'GET');
      return response;
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }
}

// Export singleton instance
export const veo3RealAPI = new Veo3RealAPIService();
