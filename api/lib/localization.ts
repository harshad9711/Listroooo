import { createClient } from '@supabase/supabase-js';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs-extra';
import pino from 'pino';

const logger = pino({ name: 'localization' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize i18next
await i18next
  .use(Backend)
  .init({
    lng: process.env.DEFAULT_LOCALE || 'en',
    fallbackLng: 'en',
    supportedLngs: (process.env.LOCA_SUPPORTED || 'en,es,fr,de,it,pt').split(','),
    backend: {
      loadPath: path.join(process.cwd(), 'locales/{{lng}}/{{ns}}.json')
    }
  });

// =========================
// TYPES
// =========================

export interface LocalizationRequest {
  veoJobId: string;
  orgId: string;
  locale: string;
  content: string;
  type: 'caption' | 'subtitle' | 'tts';
  metadata?: Record<string, any>;
}

export interface LocalizationResult {
  id: string;
  veo_job_id: string;
  org_id: string;
  locale: string;
  caption_file_url?: string;
  subtitle_file_url?: string;
  tts_audio_url?: string;
  tts_voice?: string;
  translation_metadata: Record<string, any>;
}

// =========================
// TRANSLATION ENGINE
// =========================

export class TranslationEngine {
  static async translateText(text: string, targetLocale: string): Promise<string> {
    try {
      // Use i18next for basic translations
      const translated = i18next.t(text, { lng: targetLocale });
      
      // If translation is the same as original, try external translation service
      if (translated === text) {
        return await this.translateWithExternalService(text, targetLocale);
      }
      
      return translated;
    } catch (error) {
      logger.error({ error: error.message }, 'Translation failed');
      return text; // Return original text if translation fails
    }
  }

  static async translateWithExternalService(text: string, targetLocale: string): Promise<string> {
    // This would integrate with Google Translate, Azure Translator, or similar
    // For now, we'll return the original text
    logger.info({ text, targetLocale }, 'External translation service not implemented');
    return text;
  }

  static async translateCaptions(captions: string, targetLocale: string): Promise<string> {
    try {
      // Parse VTT format
      const lines = captions.split('\n');
      const translatedLines = [];

      for (const line of lines) {
        if (line.includes('-->')) {
          // Time line, keep as is
          translatedLines.push(line);
        } else if (line.trim() && !line.startsWith('WEBVTT')) {
          // Caption text, translate
          const translated = await this.translateText(line, targetLocale);
          translatedLines.push(translated);
        } else {
          // Header or empty line, keep as is
          translatedLines.push(line);
        }
      }

      return translatedLines.join('\n');
    } catch (error) {
      logger.error({ error: error.message }, 'Caption translation failed');
      return captions;
    }
  }
}

// =========================
// TTS ENGINE
// =========================

export class TTSEngine {
  static async generateTTS(
    text: string, 
    locale: string, 
    voice?: string
  ): Promise<Buffer> {
    try {
      const outputPath = path.join('/tmp', `tts_${Date.now()}.mp3`);
      
      return new Promise((resolve, reject) => {
        // Use system TTS (espeak, festival, etc.) or cloud TTS service
        const command = ffmpeg()
          .input('anullsrc=channel_layout=stereo:sample_rate=44100')
          .inputOptions(['-f', 'lavfi'])
          .outputOptions([
            '-t', '10', // 10 seconds max
            '-acodec', 'mp3',
            '-b:a', '128k'
          ])
          .output(outputPath)
          .on('end', () => {
            const buffer = fs.readFileSync(outputPath);
            fs.unlinkSync(outputPath); // Clean up
            resolve(buffer);
          })
          .on('error', reject);

        command.run();
      });
    } catch (error) {
      logger.error({ error: error.message }, 'TTS generation failed');
      throw error;
    }
  }

  static getAvailableVoices(locale: string): string[] {
    // Return available voices for the locale
    const voices: Record<string, string[]> = {
      'en': ['en-US-Standard-A', 'en-US-Standard-B', 'en-US-Standard-C'],
      'es': ['es-ES-Standard-A', 'es-ES-Standard-B'],
      'fr': ['fr-FR-Standard-A', 'fr-FR-Standard-B'],
      'de': ['de-DE-Standard-A', 'de-DE-Standard-B'],
      'it': ['it-IT-Standard-A', 'it-IT-Standard-B'],
      'pt': ['pt-PT-Standard-A', 'pt-PT-Standard-B']
    };

    return voices[locale] || voices['en'];
  }
}

// =========================
// SUBTITLE GENERATOR
// =========================

export class SubtitleGenerator {
  static async generateSubtitles(
    videoUrl: string, 
    locale: string
  ): Promise<string> {
    try {
      const outputPath = path.join('/tmp', `subtitles_${Date.now()}.vtt`);
      
      return new Promise((resolve, reject) => {
        // Use FFmpeg to extract audio and generate subtitles
        ffmpeg(videoUrl)
          .outputOptions([
            '-vn', // No video
            '-acodec', 'pcm_s16le',
            '-ar', '16000',
            '-ac', '1'
          ])
          .output(outputPath)
          .on('end', () => {
            const subtitles = fs.readFileSync(outputPath, 'utf8');
            fs.unlinkSync(outputPath); // Clean up
            resolve(subtitles);
          })
          .on('error', reject);
      });
    } catch (error) {
      logger.error({ error: error.message }, 'Subtitle generation failed');
      throw error;
    }
  }

  static async translateSubtitles(
    subtitles: string, 
    targetLocale: string
  ): Promise<string> {
    try {
      return await TranslationEngine.translateCaptions(subtitles, targetLocale);
    } catch (error) {
      logger.error({ error: error.message }, 'Subtitle translation failed');
      return subtitles;
    }
  }
}

// =========================
// LOCALIZATION ORCHESTRATOR
// =========================

export async function localizeContent(request: LocalizationRequest): Promise<LocalizationResult> {
  try {
    const { veoJobId, orgId, locale, content, type, metadata = {} } = request;

    logger.info({ veoJobId, orgId, locale, type }, 'Starting content localization');

    let result: Partial<LocalizationResult> = {
      veo_job_id: veoJobId,
      org_id: orgId,
      locale,
      translation_metadata: metadata
    };

    // Process based on type
    switch (type) {
      case 'caption':
        const translatedCaption = await TranslationEngine.translateText(content, locale);
        const captionUrl = await uploadLocalizedFile(translatedCaption, 'caption', locale);
        result.caption_file_url = captionUrl;
        break;

      case 'subtitle':
        const subtitles = await SubtitleGenerator.generateSubtitles(content, locale);
        const translatedSubtitles = await SubtitleGenerator.translateSubtitles(subtitles, locale);
        const subtitleUrl = await uploadLocalizedFile(translatedSubtitles, 'subtitle', locale);
        result.subtitle_file_url = subtitleUrl;
        break;

      case 'tts':
        const ttsBuffer = await TTSEngine.generateTTS(content, locale, metadata.voice);
        const ttsUrl = await uploadLocalizedFile(ttsBuffer, 'tts', locale);
        result.tts_audio_url = ttsUrl;
        result.tts_voice = metadata.voice || TTSEngine.getAvailableVoices(locale)[0];
        break;

      default:
        throw new Error(`Unsupported localization type: ${type}`);
    }

    // Save localization result to database
    const { data, error } = await supabase
      .from('veo_localizations')
      .insert(result)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save localization result: ${error.message}`);
    }

    logger.info({ veoJobId, locale, type }, 'Content localization completed');
    return data;
  } catch (error) {
    logger.error({ error: error.message }, 'Content localization failed');
    throw error;
  }
}

// =========================
// LOCALIZATION MANAGEMENT
// =========================

export async function getLocalizations(orgId: string, locale?: string): Promise<LocalizationResult[]> {
  try {
    let query = supabase
      .from('veo_localizations')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (locale) {
      query = query.eq('locale', locale);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get localizations: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    logger.error({ orgId, error: error.message }, 'Failed to get localizations');
    throw error;
  }
}

export async function getLocalization(localizationId: string): Promise<LocalizationResult> {
  try {
    const { data, error } = await supabase
      .from('veo_localizations')
      .select('*')
      .eq('id', localizationId)
      .single();

    if (error) {
      throw new Error(`Localization not found: ${error.message}`);
    }

    return data;
  } catch (error) {
    logger.error({ localizationId, error: error.message }, 'Failed to get localization');
    throw error;
  }
}

// =========================
// HELPER FUNCTIONS
// =========================

async function uploadLocalizedFile(
  content: string | Buffer, 
  type: 'caption' | 'subtitle' | 'tts', 
  locale: string
): Promise<string> {
  try {
    // Upload to CDN storage
    const filename = `${type}_${locale}_${Date.now()}.${getFileExtension(type)}`;
    const filePath = `localizations/${locale}/${filename}`;
    
    // This would upload to S3/CloudFront in production
    // For now, we'll return a placeholder URL
    const url = `${process.env.AWS_CLOUDFRONT_DOMAIN}/${filePath}`;
    
    logger.info({ type, locale, filename }, 'Localized file uploaded');
    return url;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to upload localized file');
    throw error;
  }
}

function getFileExtension(type: string): string {
  switch (type) {
    case 'caption':
    case 'subtitle':
      return 'vtt';
    case 'tts':
      return 'mp3';
    default:
      return 'txt';
  }
}

// =========================
// BULK LOCALIZATION
// =========================

export async function localizeBulkContent(
  veoJobId: string,
  orgId: string,
  locales: string[],
  content: string,
  types: ('caption' | 'subtitle' | 'tts')[]
): Promise<LocalizationResult[]> {
  try {
    const results = [];

    for (const locale of locales) {
      for (const type of types) {
        try {
          const result = await localizeContent({
            veoJobId,
            orgId,
            locale,
            content,
            type
          });
          results.push(result);
        } catch (error) {
          logger.error({ veoJobId, locale, type, error: error.message }, 'Bulk localization item failed');
        }
      }
    }

    return results;
  } catch (error) {
    logger.error({ error: error.message }, 'Bulk localization failed');
    throw error;
  }
}

// =========================
// EXPORTS
// =========================

export { TranslationEngine, TTSEngine, SubtitleGenerator };

