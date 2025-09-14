import { Router } from 'express';
import { 
  localizeContent,
  getLocalizations,
  getLocalization,
  localizeBulkContent,
  TTSEngine,
  LocalizationRequest
} from '../lib/localization.js';
import pino from 'pino';

const logger = pino({ name: 'localization-routes' });
const router = Router();

// =========================
// CONTENT LOCALIZATION
// =========================

router.post('/localize', async (req, res) => {
  try {
    const { veoJobId, orgId, locale, content, type, metadata } = req.body;

    // Validate required fields
    if (!veoJobId || !orgId || !locale || !content || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate locale
    const supportedLocales = (process.env.LOCA_SUPPORTED || 'en,es,fr,de,it,pt').split(',');
    if (!supportedLocales.includes(locale)) {
      return res.status(400).json({ error: 'Unsupported locale' });
    }

    // Validate type
    if (!['caption', 'subtitle', 'tts'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }

    const localizationRequest: LocalizationRequest = {
      veoJobId,
      orgId,
      locale,
      content,
      type,
      metadata
    };

    const result = await localizeContent(localizationRequest);
    
    res.json({
      result,
      message: 'Content localization completed'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Content localization failed');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// BULK LOCALIZATION
// =========================

router.post('/localize/bulk', async (req, res) => {
  try {
    const { veoJobId, orgId, locales, content, types } = req.body;

    // Validate required fields
    if (!veoJobId || !orgId || !locales || !content || !types) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate locales
    const supportedLocales = (process.env.LOCA_SUPPORTED || 'en,es,fr,de,it,pt').split(',');
    const invalidLocales = locales.filter((locale: string) => !supportedLocales.includes(locale));
    if (invalidLocales.length > 0) {
      return res.status(400).json({ error: `Unsupported locales: ${invalidLocales.join(', ')}` });
    }

    // Validate types
    const validTypes = ['caption', 'subtitle', 'tts'];
    const invalidTypes = types.filter((type: string) => !validTypes.includes(type));
    if (invalidTypes.length > 0) {
      return res.status(400).json({ error: `Invalid types: ${invalidTypes.join(', ')}` });
    }

    const results = await localizeBulkContent(veoJobId, orgId, locales, content, types);
    
    res.json({
      results,
      total: results.length,
      message: 'Bulk localization completed'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Bulk localization failed');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// LOCALIZATION MANAGEMENT
// =========================

router.get('/localizations', async (req, res) => {
  try {
    const { orgId, locale } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const localizations = await getLocalizations(orgId as string, locale as string);
    res.json(localizations);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get localizations');
    res.status(500).json({ error: error.message });
  }
});

router.get('/localizations/:localizationId', async (req, res) => {
  try {
    const { localizationId } = req.params;

    const localization = await getLocalization(localizationId);
    res.json(localization);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get localization');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// TTS VOICES
// =========================

router.get('/voices', async (req, res) => {
  try {
    const { locale } = req.query;

    if (!locale) {
      return res.status(400).json({ error: 'Locale required' });
    }

    const voices = TTSEngine.getAvailableVoices(locale as string);
    res.json({ voices });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get voices');
    res.status(500).json({ error: error.message });
  }
});

router.get('/voices/all', async (req, res) => {
  try {
    const supportedLocales = (process.env.LOCA_SUPPORTED || 'en,es,fr,de,it,pt').split(',');
    const allVoices: Record<string, string[]> = {};

    for (const locale of supportedLocales) {
      allVoices[locale] = TTSEngine.getAvailableVoices(locale);
    }

    res.json({ voices: allVoices });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get all voices');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// LOCALIZATION DASHBOARD
// =========================

router.get('/dashboard', async (req, res) => {
  try {
    const { orgId, startDate, endDate } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    // Get localization statistics
    const { data: stats, error } = await supabase
      .from('veo_localizations')
      .select('locale, created_at')
      .eq('org_id', orgId);

    if (error) {
      throw new Error(`Failed to get localization stats: ${error.message}`);
    }

    // Calculate statistics
    const dashboard = {
      total: stats.length,
      byLocale: stats.reduce((acc, result) => {
        acc[result.locale] = (acc[result.locale] || 0) + 1;
        return acc;
      }, {}),
      supportedLocales: (process.env.LOCA_SUPPORTED || 'en,es,fr,de,it,pt').split(','),
      recent: stats
        .filter(s => new Date(s.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .length
    };

    res.json(dashboard);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get localization dashboard');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// TRANSLATION SERVICES
// =========================

router.post('/translate', async (req, res) => {
  try {
    const { text, targetLocale, sourceLocale } = req.body;

    if (!text || !targetLocale) {
      return res.status(400).json({ error: 'Text and target locale required' });
    }

    // Use translation service
    const { TranslationEngine } = await import('../lib/localization.js');
    const translatedText = await TranslationEngine.translateText(text, targetLocale);
    
    res.json({
      original: text,
      translated: translatedText,
      sourceLocale: sourceLocale || 'auto',
      targetLocale
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Translation failed');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// SUBTITLE GENERATION
// =========================

router.post('/subtitles/generate', async (req, res) => {
  try {
    const { videoUrl, locale } = req.body;

    if (!videoUrl || !locale) {
      return res.status(400).json({ error: 'Video URL and locale required' });
    }

    const { SubtitleGenerator } = await import('../lib/localization.js');
    const subtitles = await SubtitleGenerator.generateSubtitles(videoUrl, locale);
    
    res.json({
      subtitles,
      locale,
      format: 'vtt'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Subtitle generation failed');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// TTS GENERATION
// =========================

router.post('/tts/generate', async (req, res) => {
  try {
    const { text, locale, voice } = req.body;

    if (!text || !locale) {
      return res.status(400).json({ error: 'Text and locale required' });
    }

    const { TTSEngine } = await import('../lib/localization.js');
    const ttsBuffer = await TTSEngine.generateTTS(text, locale, voice);
    
    // Convert buffer to base64 for response
    const base64Audio = ttsBuffer.toString('base64');
    
    res.json({
      audio: base64Audio,
      locale,
      voice: voice || TTSEngine.getAvailableVoices(locale)[0],
      format: 'mp3'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'TTS generation failed');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// LOCALIZATION TEMPLATES
// =========================

router.get('/templates', async (req, res) => {
  try {
    const { orgId, locale } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    // Get localization templates for the organization
    const { data: templates, error } = await supabase
      .from('veo_templates')
      .select('*')
      .eq('org_id', orgId)
      .eq('type', 'localization')
      .eq('locale', locale || null);

    if (error) {
      throw new Error(`Failed to get templates: ${error.message}`);
    }

    res.json(templates || []);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get templates');
    res.status(500).json({ error: error.message });
  }
});

router.post('/templates', async (req, res) => {
  try {
    const { orgId, name, locale, content, type, metadata } = req.body;

    if (!orgId || !name || !locale || !content || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: template, error } = await supabase
      .from('veo_templates')
      .insert({
        org_id: orgId,
        name,
        type: 'localization',
        locale,
        data: {
          content,
          metadata
        }
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }

    res.json(template);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create template');
    res.status(500).json({ error: error.message });
  }
});

export default router;

