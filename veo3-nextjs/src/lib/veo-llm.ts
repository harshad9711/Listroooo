import { type ListroVeoPrompt, PromptSchema, normalizeBeats } from "@/lib/veo-schema";
import crypto from "node:crypto";
const SYSTEM_INSTR = `You are Listro's Prompt Orchestrator. Convert the user's rough idea into a JSON object that matches the ListroVeoShortFormPrompt schema. Fill sensible defaults. Make sure total beat durations ≈ duration_seconds. Prefer 9:16 for TikTok/Reels. Use cinematic, brand-safe phrasing. Output ONLY JSON.`;
export async function ideaToJsonViaOpenAI(idea: string): Promise<ListroVeoPrompt> {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: SYSTEM_INSTR }, { role: "user", content: idea }],
      temperature: 0.2,
      response_format: { type: "json_object" }
    }),
  });
  const raw = await r.text();
  if (!r.ok) {
    let err = raw; try { const j = JSON.parse(raw); err = j?.error?.message || raw; } catch {}
    throw new Error(`OpenAI ${r.status}: ${err}`);
  }
  const parsed = raw ? JSON.parse(raw) : {};
  const text = parsed?.choices?.[0]?.message?.content ?? "{}";
  const obj = PromptSchema.parse(JSON.parse(text));
  obj.story.beats = normalizeBeats(obj.meta.duration_seconds, obj.story.beats as any);
  return obj;
}
export function hashIdea(s: string){ return crypto.createHash("sha256").update(s.trim()).digest("hex"); }