import type { ListroVeoPrompt } from "./veo-schema";

export function renderVeoPrompt(p: ListroVeoPrompt){
  const L: string[] = [];
  L.push(`Title: Cinematic Short-Form Ad for ${p.meta.product} (${p.meta.aspect_ratio}, ${p.meta.duration_seconds}s)`);
  L.push("");
  L.push(`Objective: ${p.meta.objective} on ${p.meta.platform}; tone ${p.meta.tone}, language ${p.meta.language}.`);
  L.push("");
  L.push("Cinematography:");
  L.push(`- Camera: ${p.visuals.camera}`);
  L.push(`- Lighting: ${p.visuals.lighting}`);
  L.push(`- Color Grade: ${p.visuals.color_grade}`);
  L.push(`- Motion: ${p.visuals.motion_style}`);
  if (p.visuals.negative_prompts) L.push(`- Avoid: ${p.visuals.negative_prompts}`);
  L.push("");
  L.push("Audio:");
  L.push(`- Music: ${p.audio.music_style}${p.audio.music_bpm_target ? ` at ~${p.audio.music_bpm_target} BPM` : ""}`);
  L.push(`- Voiceover: ${p.audio.voiceover_flag ? (p.audio.voice_profile || "Yes") : "No VO"}`);
  if (p.audio.sfx_notes) L.push(`- SFX: ${p.audio.sfx_notes}`);
  if (p.audio.caption_style) L.push(`- Captions: ${p.audio.caption_style}`);
  L.push("");
  L.push("Branding:");
  L.push(`- Brand: ${p.branding.brand_name}`);
  if (p.branding.palette?.length) L.push(`- Palette: ${p.branding.palette.join(", ")}`);
  if (p.branding.font) L.push(`- Font: ${p.branding.font}`);
  if (p.branding.logo_url) L.push(`- Logo: ${p.branding.logo_url}`);
  if (p.branding.product_urls?.length) L.push(`- Product URLs: ${p.branding.product_urls.join(", ")}`);
  L.push("");
  L.push("Story Beats (timecoded):");
  p.story.beats.forEach(b => {
    L.push(`- t=${b.t}s (${b.duration}s): ${b.action} | Shot: ${b.shot}`);
    if (b.on_screen_text) L.push(`  Text: "${b.on_screen_text}"`);
    if (b.voiceover) L.push(`  VO: "${b.voiceover}"`);
    if (b.product_callout) L.push(`  Callout: ${b.product_callout}`);
  });
  if (p.story.hook){ L.push(""); L.push(`Hook (cold open if present): ${p.story.hook}`); }
  if (p.story.cta){ L.push(`CTA: ${p.story.cta}`); }
  L.push("");
  L.push("Deliverables:");
  L.push(`- Exports: ${p.deliverables.exports.join(", ")}; Captions burned in: ${p.deliverables.captions_burned_in}; Sidecar: ${p.deliverables.captions_sidecar} (${p.deliverables.sidecar_format})`);
  if (p.deliverables.thumbnail_prompts?.length) L.push(`- Thumbnail ideas: ${p.deliverables.thumbnail_prompts.join(" | ")}`);
  return L.join("\n");
}