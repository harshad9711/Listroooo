import { PromptSchema, normalizeBeats } from './veo-schema.js';
import crypto from 'node:crypto';

const SYSTEM_INSTR = `You are Listro's Prompt Orchestrator. Convert the user's rough idea into a JSON object with this exact structure:

{
  "meta": {
    "product": "string",
    "objective": "awareness|consideration|conversion|ugc_ad|launch|howto",
    "duration_seconds": number,
    "aspect_ratio": "9:16|1:1|16:9",
    "platform": "tiktok|instagram_reels|youtube_shorts|all",
    "language": "en-US",
    "tone": "cinematic, modern, confident"
  },
  "story": {
    "hook": "string",
    "beats": [
      {
        "t": number,
        "duration": number,
        "action": "string",
        "shot": "string",
        "on_screen_text": "string",
        "voiceover": "string",
        "product_callout": "string"
      }
    ],
    "cta": "string"
  },
  "visuals": {
    "camera": "string",
    "lighting": "string",
    "color_grade": "string",
    "motion_style": "string",
    "negative_prompts": "string"
  },
  "audio": {
    "music_style": "string",
    "music_bpm_target": number,
    "sfx_notes": "string",
    "voiceover_flag": true,
    "voice_profile": "string",
    "caption_style": "string"
  },
  "branding": {
    "brand_name": "string",
    "palette": ["#111111", "#6C5CE7", "#FFFFFF"],
    "font": "Inter",
    "logo_url": "string",
    "product_urls": ["string"]
  },
  "deliverables": {
    "exports": ["mp4"],
    "captions_burned_in": true,
    "captions_sidecar": true,
    "sidecar_format": "srt",
    "thumbnail_prompts": ["string"]
  }
}

Fill sensible defaults. Make sure total beat durations ≈ duration_seconds. Prefer 9:16 for TikTok/Reels. Use cinematic, brand-safe phrasing. Output ONLY JSON.`;

export async function ideaToJsonViaOpenAI(idea) {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_INSTR },
        { role: "user", content: idea },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    }),
  });

  const raw = await r.text();                 // ✅ read as text for better errors
  if (!r.ok) {
    let errMsg = raw;
    try { const j = JSON.parse(raw); errMsg = j?.error?.message || raw; } catch {}
    throw new Error(`OpenAI ${r.status}: ${errMsg}`);
  }

  const parsedJson = raw ? JSON.parse(raw) : {};
  const text = parsedJson?.choices?.[0]?.message?.content ?? "{}";
  const promptObj = PromptSchema.parse(JSON.parse(text));
  promptObj.story.beats = normalizeBeats(promptObj.meta.duration_seconds, promptObj.story.beats);
  return promptObj;
}

export async function ideaToJsonViaGemini(idea) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_AI_API_KEY environment variable");
  }

  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${SYSTEM_INSTR}\n\nUser idea: ${idea}`
        }]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4000,
        responseMimeType: "application/json"
      }
    }),
  });

  const raw = await r.text();
  if (!r.ok) {
    let errMsg = raw;
    try { const j = JSON.parse(raw); errMsg = j?.error?.message || raw; } catch {}
    throw new Error(`Gemini ${r.status}: ${errMsg}`);
  }

  const parsedJson = raw ? JSON.parse(raw) : {};
  const text = parsedJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  const rawPromptObj = JSON.parse(text);
  
  // Clean up null values and ensure all required fields are strings
  if (rawPromptObj.story && rawPromptObj.story.beats) {
    rawPromptObj.story.beats = rawPromptObj.story.beats.map(beat => ({
      ...beat,
      on_screen_text: beat.on_screen_text || "",
      product_callout: beat.product_callout || "",
      action: beat.action || "",
      shot: beat.shot || "",
      voiceover: beat.voiceover || ""
    }));
  }
  
  const promptObj = PromptSchema.parse(rawPromptObj);
  promptObj.story.beats = normalizeBeats(promptObj.meta.duration_seconds, promptObj.story.beats);
  return promptObj;
}

export async function ideaToJson(idea) {
  // Try Gemini first, fallback to OpenAI
  try {
    if (process.env.GOOGLE_AI_API_KEY) {
      return await ideaToJsonViaGemini(idea);
    }
  } catch (error) {
    console.warn("Gemini failed, falling back to OpenAI:", error.message);
  }
  
  // Fallback to OpenAI
  if (process.env.OPENAI_API_KEY) {
    return await ideaToJsonViaOpenAI(idea);
  }
  
  throw new Error("No LLM API keys configured (neither GOOGLE_AI_API_KEY nor OPENAI_API_KEY)");
}

export function hashIdea(s) {
  return crypto.createHash("sha256").update(s.trim()).digest("hex");
}

