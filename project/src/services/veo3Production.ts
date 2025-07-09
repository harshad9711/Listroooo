// import Anthropic from '@anthropic-ai/sdk';
import { anthropic } from './anthropicClient';
import { CohereClient } from 'cohere-ai';
import { supabase } from '../lib/supabase';

// Initialize AI clients
// const claude = new Anthropic({
//   apiKey: import.meta.env.VITE_CLAUDE_API_KEY,
// });
const claude = anthropic;

const cohere = new CohereClient({
  token: import.meta.env.VITE_COHERE_API_KEY,
});

// Types for production Veo 3
export interface Veo3GenerationJob {
  id: string;
  user_id: string;
  type: 'video' | 'image' | 'ad' | 'batch';
  prompts: string[];
  options: {
    style?: string;
    tone?: string;
    aspectRatio?: string;
    targetPlatform?: string;
    duration?: number;
    resolution?: '720p' | '1080p' | '4k';
    format?: 'landscape' | 'portrait' | 'square';
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: Veo3Result[];
  error?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface Veo3Result {
  id: string;
  job_id: string;
  prompt: string;
  generated_content: string;
  type: 'video' | 'image' | 'ad';
  url?: string;
  thumbnail?: string;
  metadata?: {
    duration?: number;
    size?: string;
    format?: string;
  };
  feedback?: {
    rating?: number;
    comment?: string;
    submitted_at?: string;
  };
  created_at: string;
}

export interface Veo3Feedback {
  id: string;
  result_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

// Production Veo 3 Service
export class Veo3ProductionService {
  private maxConcurrentJobs = 5;
  private processingJobs = new Set<string>();

  // Create a new generation job
  async createJob(
    userId: string,
    type: Veo3GenerationJob['type'],
    prompts: string[],
    options: Veo3GenerationJob['options'] = {}
  ): Promise<Veo3GenerationJob> {
    try {
      // Check user quota
      const quotaCheck = await this.checkUserQuota(userId);
      if (!quotaCheck.allowed) {
        throw new Error(`Quota exceeded. ${quotaCheck.message}`);
      }

      // Create job in database
      const job: Omit<Veo3GenerationJob, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        type,
        prompts,
        options,
        status: 'pending',
      };

      const { data, error } = await supabase
        .from('veo3_jobs')
        .insert({
          ...job,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Start processing if under limit
      if (this.processingJobs.size < this.maxConcurrentJobs) {
        this.processJob(data.id);
      }

      return data;
    } catch (error) {
      console.error('Error creating Veo 3 job:', error);
      throw error;
    }
  }

  // Process a job asynchronously
  private async processJob(jobId: string) {
    if (this.processingJobs.has(jobId)) return;
    
    this.processingJobs.add(jobId);
    
    try {
      // Update status to processing
      await this.updateJobStatus(jobId, 'processing');

      // Get job details
      const { data: job } = await supabase
        .from('veo3_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (!job) throw new Error('Job not found');

      const results: Veo3Result[] = [];

      // Process each prompt
      for (const prompt of job.prompts) {
        try {
          const result = await this.generateContent(prompt, job.type, job.options);
          results.push(result);
        } catch (error) {
          console.error(`Error processing prompt: ${prompt}`, error);
          // Continue with other prompts
        }
      }

      // Save results
      if (results.length > 0) {
        await this.saveResults(jobId, results);
      }

      // Update job status
      const finalStatus = results.length > 0 ? 'completed' : 'failed';
      await this.updateJobStatus(jobId, finalStatus, results);

    } catch (error) {
      console.error('Error processing job:', error);
      await this.updateJobStatus(jobId, 'failed', undefined, error.message);
    } finally {
      this.processingJobs.delete(jobId);
      
      // Process next job in queue
      this.processNextJob();
    }
  }

  // Generate content using Claude and Cohere
  private async generateContent(
    prompt: string,
    type: Veo3GenerationJob['type'],
    options: Veo3GenerationJob['options']
  ): Promise<Veo3Result> {
    try {
      // Generate primary content with Claude
      const primaryContent = await this.generatePrimaryContent(prompt, type, options);
      
      // Generate variants with Cohere
      const variants = await this.generateVariants(primaryContent, type, options);
      
      // Combine primary and variants
      const finalContent = this.combineContent(primaryContent, variants);
      
      return {
        id: crypto.randomUUID(),
        job_id: '', // Will be set when saving
        prompt,
        generated_content: finalContent,
        type,
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    }
  }

  // Generate primary content with Claude
  private async generatePrimaryContent(
    prompt: string,
    type: Veo3GenerationJob['type'],
    options: Veo3GenerationJob['options']
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(type, options);
    
    const response = await claude.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return response.content[0].text;
  }

  // Generate variants with Cohere
  private async generateVariants(
    primaryContent: string,
    type: Veo3GenerationJob['type'],
    options: Veo3GenerationJob['options']
  ): Promise<string[]> {
    const variantPrompt = this.buildVariantPrompt(primaryContent, type, options);
    
    const response = await cohere.generate({
      model: 'command-r-plus',
      prompt: variantPrompt,
      maxTokens: 200,
      temperature: 0.8,
      numGenerations: 3,
    });

    return response.generations.map(g => g.text.trim());
  }

  // Build system prompt for Claude
  private buildSystemPrompt(type: Veo3GenerationJob['type'], options: Veo3GenerationJob['options']): string {
    const basePrompt = `You are an expert AI content creator specializing in ${type} generation. 
    
Your task is to create high-quality, engaging content that converts viewers into customers.

Guidelines:
- Create content that is visually appealing and emotionally engaging
- Focus on storytelling and brand messaging
- Ensure content is optimized for the target platform
- Use persuasive language that drives action
- Include specific visual and audio direction

Content Type: ${type}
Style: ${options.style || 'modern'}
Tone: ${options.tone || 'professional'}
Target Platform: ${options.targetPlatform || 'social media'}
Aspect Ratio: ${options.aspectRatio || '16:9'}

For videos: Include detailed scene descriptions, camera movements, transitions, and timing
For images: Describe composition, lighting, colors, and visual elements
For ads: Focus on compelling headlines, copy, and call-to-action

Return your response in a structured format that can be used for content generation.`;

    return basePrompt;
  }

  // Build variant prompt for Cohere
  private buildVariantPrompt(primaryContent: string, type: Veo3GenerationJob['type'], options: Veo3GenerationJob['options']): string {
    return `Based on this ${type} content, generate 3 alternative versions that maintain the same quality but offer different approaches:

Original: ${primaryContent}

Generate 3 variants that:
1. Use different visual styles or approaches
2. Target different audience segments
3. Emphasize different product benefits

Format each variant clearly and ensure they are production-ready.`;
  }

  // Combine primary content with variants
  private combineContent(primary: string, variants: string[]): string {
    return `PRIMARY VERSION:
${primary}

ALTERNATIVE VERSIONS:
${variants.map((variant, index) => `Variant ${index + 1}:
${variant}`).join('\n\n')}`;
  }

  // Get job status
  async getJobStatus(jobId: string): Promise<Veo3GenerationJob | null> {
    try {
      const { data, error } = await supabase
        .from('veo3_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting job status:', error);
      return null;
    }
  }

  // Get user's job history
  async getUserJobs(userId: string, limit = 20): Promise<Veo3GenerationJob[]> {
    try {
      const { data, error } = await supabase
        .from('veo3_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user jobs:', error);
      return [];
    }
  }

  // Submit feedback for a result
  async submitFeedback(
    userId: string,
    resultId: string,
    rating: number,
    comment?: string
  ): Promise<Veo3Feedback> {
    try {
      const feedback: Omit<Veo3Feedback, 'id' | 'created_at'> = {
        result_id: resultId,
        user_id: userId,
        rating,
        comment,
      };

      const { data, error } = await supabase
        .from('veo3_feedback')
        .insert({
          ...feedback,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update result with feedback
      await supabase
        .from('veo3_results')
        .update({
          feedback: {
            rating,
            comment,
            submitted_at: new Date().toISOString(),
          },
        })
        .eq('id', resultId);

      return data;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  // Check user quota
  private async checkUserQuota(userId: string): Promise<{ allowed: boolean; message?: string }> {
    try {
      // Get user's current usage
      const { data: jobs } = await supabase
        .from('veo3_jobs')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      const dailyUsage = jobs?.length || 0;
      const maxDailyJobs = 50; // Adjust based on your pricing tier

      if (dailyUsage >= maxDailyJobs) {
        return {
          allowed: false,
          message: `Daily limit of ${maxDailyJobs} jobs reached. Please upgrade your plan or try again tomorrow.`,
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking quota:', error);
      return { allowed: true }; // Allow if quota check fails
    }
  }

  // Update job status
  private async updateJobStatus(
    jobId: string,
    status: Veo3GenerationJob['status'],
    results?: Veo3Result[],
    error?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      if (error) {
        updateData.error = error;
      }

      const { error: updateError } = await supabase
        .from('veo3_jobs')
        .update(updateData)
        .eq('id', jobId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  }

  // Save results to database
  private async saveResults(jobId: string, results: Veo3Result[]): Promise<void> {
    try {
      const resultsWithJobId = results.map(result => ({
        ...result,
        job_id: jobId,
      }));

      const { error } = await supabase
        .from('veo3_results')
        .insert(resultsWithJobId);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving results:', error);
      throw error;
    }
  }

  // Process next job in queue
  private async processNextJob(): Promise<void> {
    try {
      const { data: pendingJob } = await supabase
        .from('veo3_jobs')
        .select('id')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (pendingJob && this.processingJobs.size < this.maxConcurrentJobs) {
        this.processJob(pendingJob.id);
      }
    } catch (error) {
      console.error('Error processing next job:', error);
    }
  }

  // Get analytics for monitoring
  async getAnalytics(): Promise<{
    totalJobs: number;
    successRate: number;
    averageProcessingTime: number;
    topFeedback: { rating: number; count: number }[];
  }> {
    try {
      // Get total jobs
      const { count: totalJobs } = await supabase
        .from('veo3_jobs')
        .select('*', { count: 'exact', head: true });

      // Get success rate
      const { count: completedJobs } = await supabase
        .from('veo3_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      const successRate = totalJobs ? (completedJobs / totalJobs) * 100 : 0;

      // Get average processing time
      const { data: completedJobTimes } = await supabase
        .from('veo3_jobs')
        .select('created_at, completed_at')
        .eq('status', 'completed')
        .not('completed_at', 'is', null);

      const averageProcessingTime = completedJobTimes?.length
        ? completedJobTimes.reduce((acc, job) => {
            const processingTime = new Date(job.completed_at!).getTime() - new Date(job.created_at).getTime();
            return acc + processingTime;
          }, 0) / completedJobTimes.length
        : 0;

      // Get top feedback
      const { data: feedback } = await supabase
        .from('veo3_feedback')
        .select('rating')
        .order('rating', { ascending: false })
        .limit(10);

      const topFeedback = feedback?.reduce((acc, item) => {
        const existing = acc.find(f => f.rating === item.rating);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ rating: item.rating, count: 1 });
        }
        return acc;
      }, [] as { rating: number; count: number }[]) || [];

      return {
        totalJobs: totalJobs || 0,
        successRate,
        averageProcessingTime,
        topFeedback,
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return {
        totalJobs: 0,
        successRate: 0,
        averageProcessingTime: 0,
        topFeedback: [],
      };
    }
  }
}

// Export singleton instance
export const veo3Production = new Veo3ProductionService(); 