/**
 * Quality Scoring Service
 * Automated creative quality scoring using visual and audio metrics
 */

import ffmpeg from 'fluent-ffmpeg';
import { createClient } from '@supabase/supabase-js';
import { ResilientServiceCalls } from './resilientCall.js';
import pino from 'pino';

const logger = pino({ name: 'quality-scoring' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// TYPES
// =========================

export interface QualityScore {
  overall: number;
  visual: number;
  audio: number;
  coherence: number;
  details: {
    sharpness: number;
    brightness: number;
    freezeFrames: number;
    blackFrames: number;
    loudness: number;
    clipping: boolean;
    shotClarity: number;
    ctaPresence: number;
    brandColors: number;
  };
}

export interface QualityAnalysis {
  score: QualityScore;
  passed: boolean;
  warnings: string[];
  suggestions: string[];
}

// =========================
// MAIN QUALITY ANALYSIS
// =========================

export async function analyzeVideoQuality(
  jobId: string,
  videoPath: string,
  prompt: any
): Promise<QualityAnalysis> {
  try {
    logger.info({ jobId }, 'Starting quality analysis');

    // Run visual analysis
    const visualMetrics = await analyzeVisualQuality(videoPath);
    
    // Run audio analysis
    const audioMetrics = await analyzeAudioQuality(videoPath);
    
    // Run coherence analysis
    const coherenceMetrics = await analyzeCoherence(prompt, visualMetrics);

    // Calculate overall score
    const score = calculateOverallScore(visualMetrics, audioMetrics, coherenceMetrics);
    
    // Determine if quality passes threshold
    const minScore = parseFloat(process.env.QUALITY_MIN_SCORE || '0.62');
    const passed = score.overall >= minScore;

    // Generate warnings and suggestions
    const warnings = generateWarnings(score, minScore);
    const suggestions = generateSuggestions(score, prompt);

    const analysis: QualityAnalysis = {
      score,
      passed,
      warnings,
      suggestions
    };

    // Save quality data to database
    await saveQualityData(jobId, analysis);

    logger.info({ jobId, overallScore: score.overall, passed }, 'Quality analysis completed');

    return analysis;

  } catch (error) {
    logger.error({ error: error.message, jobId }, 'Quality analysis failed');
    
    // Return default analysis on failure
    return {
      score: {
        overall: 0.5,
        visual: 0.5,
        audio: 0.5,
        coherence: 0.5,
        details: {
          sharpness: 0.5,
          brightness: 0.5,
          freezeFrames: 0,
          blackFrames: 0,
          loudness: 0.5,
          clipping: false,
          shotClarity: 0.5,
          ctaPresence: 0.5,
          brandColors: 0.5
        }
      },
      passed: false,
      warnings: ['Quality analysis failed'],
      suggestions: ['Regenerate video or check source quality']
    };
  }
}

// =========================
// VISUAL ANALYSIS
// =========================

async function analyzeVisualQuality(videoPath: string): Promise<{
  sharpness: number;
  brightness: number;
  freezeFrames: number;
  blackFrames: number;
}> {
  return new Promise((resolve, reject) => {
    const metrics = {
      sharpness: 0,
      brightness: 0,
      freezeFrames: 0,
      blackFrames: 0
    };

    ffmpeg(videoPath)
      .ffprobe((err, data) => {
        if (err) {
          reject(err);
          return;
        }

        // Analyze video stream
        const videoStream = data.streams.find(s => s.codec_type === 'video');
        if (!videoStream) {
          resolve(metrics);
          return;
        }

        // Calculate sharpness (using resolution and bitrate as proxy)
        const width = videoStream.width || 0;
        const height = videoStream.height || 0;
        const bitrate = videoStream.bit_rate ? parseInt(videoStream.bit_rate) : 0;
        
        // Sharpness score based on resolution and bitrate
        const pixelCount = width * height;
        const bitratePerPixel = bitrate / pixelCount;
        metrics.sharpness = Math.min(bitratePerPixel / 1000, 1); // Normalize to 0-1

        // Brightness analysis (using average luminance as proxy)
        metrics.brightness = 0.7; // Placeholder - would need frame analysis

        // Freeze frame detection (placeholder)
        metrics.freezeFrames = 0;

        // Black frame detection (placeholder)
        metrics.blackFrames = 0;

        resolve(metrics);
      });
  });
}

// =========================
// AUDIO ANALYSIS
// =========================

async function analyzeAudioQuality(videoPath: string): Promise<{
  loudness: number;
  clipping: boolean;
}> {
  return new Promise((resolve, reject) => {
    const metrics = {
      loudness: 0,
      clipping: false
    };

    ffmpeg(videoPath)
      .ffprobe((err, data) => {
        if (err) {
          reject(err);
          return;
        }

        // Analyze audio stream
        const audioStream = data.streams.find(s => s.codec_type === 'audio');
        if (!audioStream) {
          resolve(metrics);
          return;
        }

        // Calculate loudness (using bitrate as proxy)
        const bitrate = audioStream.bit_rate ? parseInt(audioStream.bit_rate) : 0;
        metrics.loudness = Math.min(bitrate / 128000, 1); // Normalize to 0-1

        // Clipping detection (placeholder)
        metrics.clipping = false;

        resolve(metrics);
      });
  });
}

// =========================
// COHERENCE ANALYSIS
// =========================

async function analyzeCoherence(prompt: any, visualMetrics: any): Promise<{
  shotClarity: number;
  ctaPresence: number;
  brandColors: number;
}> {
  try {
    // Use LLM to analyze prompt coherence
    const coherencePrompt = `
Analyze this video prompt for coherence and quality:

Title: ${prompt.idea}
Goal: ${prompt.goal}
Platform: ${prompt.platform}
Shots: ${JSON.stringify(prompt.shotPlan || [])}
CTA: ${prompt.cta || 'None'}

Rate the following on a scale of 0-1:
1. Shot clarity and logical progression
2. CTA presence and effectiveness
3. Brand consistency (if brand colors mentioned)

Respond with JSON: {"shotClarity": 0.8, "ctaPresence": 0.9, "brandColors": 0.7}
`;

    const result = await ResilientServiceCalls.callGemini(() => 
      // This would call the actual LLM
      Promise.resolve({
        response: {
          text: () => '{"shotClarity": 0.8, "ctaPresence": 0.9, "brandColors": 0.7}'
        }
      })
    );

    const coherenceText = result.response.text();
    const coherenceMatch = coherenceText.match(/\{[\s\S]*\}/);
    
    if (coherenceMatch) {
      const coherence = JSON.parse(coherenceMatch[0]);
      return {
        shotClarity: coherence.shotClarity || 0.5,
        ctaPresence: coherence.ctaPresence || 0.5,
        brandColors: coherence.brandColors || 0.5
      };
    }

    // Fallback to default values
    return {
      shotClarity: 0.5,
      ctaPresence: prompt.cta ? 0.8 : 0.2,
      brandColors: 0.5
    };

  } catch (error) {
    logger.warn({ error: error.message }, 'Coherence analysis failed');
    return {
      shotClarity: 0.5,
      ctaPresence: 0.5,
      brandColors: 0.5
    };
  }
}

// =========================
// SCORE CALCULATION
// =========================

function calculateOverallScore(
  visual: any,
  audio: any,
  coherence: any
): QualityScore {
  // Visual score (40% weight)
  const visualScore = (
    visual.sharpness * 0.4 +
    visual.brightness * 0.3 +
    (1 - Math.min(visual.freezeFrames / 10, 1)) * 0.2 +
    (1 - Math.min(visual.blackFrames / 5, 1)) * 0.1
  );

  // Audio score (20% weight)
  const audioScore = (
    audio.loudness * 0.7 +
    (audio.clipping ? 0 : 1) * 0.3
  );

  // Coherence score (40% weight)
  const coherenceScore = (
    coherence.shotClarity * 0.4 +
    coherence.ctaPresence * 0.4 +
    coherence.brandColors * 0.2
  );

  // Overall score
  const overall = (
    visualScore * 0.4 +
    audioScore * 0.2 +
    coherenceScore * 0.4
  );

  return {
    overall,
    visual: visualScore,
    audio: audioScore,
    coherence: coherenceScore,
    details: {
      sharpness: visual.sharpness,
      brightness: visual.brightness,
      freezeFrames: visual.freezeFrames,
      blackFrames: visual.blackFrames,
      loudness: audio.loudness,
      clipping: audio.clipping,
      shotClarity: coherence.shotClarity,
      ctaPresence: coherence.ctaPresence,
      brandColors: coherence.brandColors
    }
  };
}

// =========================
// WARNINGS & SUGGESTIONS
// =========================

function generateWarnings(score: QualityScore, minScore: number): string[] {
  const warnings: string[] = [];

  if (score.overall < minScore) {
    warnings.push('Video quality below minimum threshold');
  }

  if (score.visual < 0.5) {
    warnings.push('Visual quality is poor - check resolution and bitrate');
  }

  if (score.audio < 0.3) {
    warnings.push('Audio quality is poor - check audio bitrate');
  }

  if (score.details.freezeFrames > 2) {
    warnings.push('Multiple freeze frames detected');
  }

  if (score.details.blackFrames > 1) {
    warnings.push('Black frames detected');
  }

  if (score.details.clipping) {
    warnings.push('Audio clipping detected');
  }

  if (score.coherence < 0.4) {
    warnings.push('Content coherence is low');
  }

  return warnings;
}

function generateSuggestions(score: QualityScore, prompt: any): string[] {
  const suggestions: string[] = [];

  if (score.overall < 0.6) {
    suggestions.push('Consider regenerating with fast model or tweak shot 1 hook');
  }

  if (score.details.shotClarity < 0.5) {
    suggestions.push('Improve shot plan clarity and logical progression');
  }

  if (score.details.ctaPresence < 0.5) {
    suggestions.push('Add or strengthen call-to-action');
  }

  if (score.details.brandColors < 0.5 && prompt.brandColors) {
    suggestions.push('Better incorporate brand colors in visual design');
  }

  if (score.visual < 0.6) {
    suggestions.push('Increase video resolution or bitrate');
  }

  if (score.audio < 0.5) {
    suggestions.push('Improve audio quality or add voiceover');
  }

  return suggestions;
}

// =========================
// DATABASE OPERATIONS
// =========================

async function saveQualityData(jobId: string, analysis: QualityAnalysis): Promise<void> {
  try {
    await supabase
      .from('veo_jobs')
      .update({
        quality_score: analysis.score.overall,
        quality_detail: analysis.score.details,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

  } catch (error) {
    logger.error({ error: error.message, jobId }, 'Failed to save quality data');
  }
}

// =========================
// ANALYTICS
// =========================

export async function getQualityAnalytics(
  orgId: string,
  startDate?: string,
  endDate?: string
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    let query = supabase
      .from('veo_jobs')
      .select('quality_score, quality_detail, created_at')
      .eq('org_id', orgId)
      .not('quality_score', 'is', null);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      logger.error({ error: error.message }, 'Failed to get quality analytics');
      return {
        success: false,
        error: 'Failed to get quality analytics'
      };
    }

    // Calculate analytics
    const scores = data?.map(job => job.quality_score) || [];
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const passedCount = scores.filter(score => score >= parseFloat(process.env.QUALITY_MIN_SCORE || '0.62')).length;
    const passRate = scores.length > 0 ? (passedCount / scores.length) * 100 : 0;

    return {
      success: true,
      data: {
        totalJobs: scores.length,
        averageScore: avgScore,
        minScore,
        maxScore,
        passRate,
        passedJobs: passedCount,
        failedJobs: scores.length - passedCount
      }
    };

  } catch (error) {
    logger.error({ error: error.message, orgId }, 'Failed to get quality analytics');
    return {
      success: false,
      error: 'Failed to get quality analytics'
    };
  }
}

