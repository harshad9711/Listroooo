import express from 'express';
import { prisma } from './lib/prisma.js';
import { ideaToJson, hashIdea } from './lib/veo-llm.js';
import { PromptSchema } from './lib/veo-schema.js';
import { putPrivateText, signedGetUrl } from './lib/veo-storage.js';

// Auth helper for Supabase Auth
async function getUserId(req) {
  try {
    // Get from Authorization header with Supabase JWT
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Verify Supabase JWT token
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY,
        { auth: { persistSession: false } }
      );
      
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        return user.id;
      }
    }
    
    // Fallback: Get user ID from request headers (for backward compatibility)
    const userId = req.headers['x-user-id'];
    if (userId) return userId;
    
  } catch (error) {
    console.error('Auth error:', error);
  }
  
  // Fallback to demo user for development
  return "demo-user";
}

const router = express.Router();

// API: idea → JSON (server LLM)
router.post('/idea-to-json', async (req, res) => {
  const userId = await getUserId(req);
  // Allow demo-user for development
  // if (userId === "demo-user") {
  //   return res.status(401).json({ error: "Unauthorized" });
  // }

  // ✅ env guards give JSON errors instead of crashing
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
  }

  try {
    const { idea } = req.body;
    if (!idea || typeof idea !== "string") {
      return res.status(400).json({ error: "Missing 'idea' (string)" });
    }

    const prompt = await ideaToJson(idea);
    // Final validation (defense in depth)
    const safe = PromptSchema.parse(prompt);
    return res.json({ prompt: safe, ideaHash: hashIdea(idea) });
  } catch (err) {
    // ✅ always return JSON, even when OpenAI fails
    const msg = err?.message || "LLM failure";
    return res.status(500).json({ error: msg });
  }
});

// API: save prompt to DB (with versioning)
router.post('/prompts', async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { prompt, idea, promptId } = req.body;
    const parsed = PromptSchema.parse(prompt);
    const ideaHash = idea ? hashIdea(idea) : (req.body.ideaHash || "no-idea");

    if (promptId) {
      // append new version on existing prompt
      const existing = await prisma.veoPrompt.findUnique({ where: { id: promptId } });
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ error: "Not found or not yours" });
      }
      const last = await prisma.veoPromptVersion.findFirst({ 
        where: { promptId }, 
        orderBy: { version: "desc" } 
      });
      const nextVersion = (last?.version ?? 0) + 1;
      const v = await prisma.veoPromptVersion.create({ 
        data: { 
          promptId, 
          version: nextVersion, 
        meta: parsed.meta,
        story: parsed.story,
        visuals: parsed.visuals,
        audio: parsed.audio,
        branding: parsed.branding,
          deliverables: parsed.deliverables 
        } 
      });
      const updated = await prisma.veoPrompt.update({ 
        where: { id: promptId }, 
        data: { 
          title: parsed.meta.product.slice(0,180), 
          activeVersionId: v.id 
        } 
      });
      return res.json({ prompt: updated, version: v });
    }

    // create new prompt root + v1
    const created = await prisma.veoPrompt.create({ 
      data: { 
        userId, 
        ideaHash, 
        title: parsed.meta.product.slice(0,180), 
        provider: process.env.LLM_PROVIDER || null 
      } 
    });
    const v1 = await prisma.veoPromptVersion.create({ 
      data: { 
        promptId: created.id, 
        version: 1, 
        meta: parsed.meta,
        story: parsed.story,
        visuals: parsed.visuals,
        audio: parsed.audio,
        branding: parsed.branding,
        deliverables: parsed.deliverables 
      } 
    });
    const updated = await prisma.veoPrompt.update({ 
      where: { id: created.id }, 
      data: { activeVersionId: v1.id },
      include: { activeVersion: true }
    });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || "Save failed" });
  }
});

// API: get all prompts (user-scoped)
router.get('/prompts', async (req, res) => {
  try {
    const userId = await getUserId(req);
    const rows = await prisma.veoPrompt.findMany({ 
      where: { userId }, 
      include: { activeVersion: true }, 
      orderBy: { updatedAt: "desc" }, 
      take: 50 
    });
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || "Fetch failed" });
  }
});

// API: get prompt by ID (user-scoped)
router.get('/prompts/:id', async (req, res) => {
  try {
    const userId = await getUserId(req);
    const row = await prisma.veoPrompt.findUnique({ 
      where: { id: req.params.id },
      include: { activeVersion: true }
    });
    if (!row || row.userId !== userId) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || "Fetch failed" });
  }
});

// API: get versions for a prompt
router.get('/prompts/:id/versions', async (req, res) => {
  try {
    const userId = await getUserId(req);
    const root = await prisma.veoPrompt.findUnique({ where: { id: req.params.id } });
    if (!root || root.userId !== userId) {
      return res.status(404).json({ error: "Not found" });
    }
    const versions = await prisma.veoPromptVersion.findMany({ 
      where: { promptId: req.params.id }, 
      orderBy: { version: "desc" } 
    });
    res.json(versions);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || "Fetch failed" });
  }
});

// API: rollback to a specific version
router.post('/prompts/:id/rollback', async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { version } = req.body;
    const root = await prisma.veoPrompt.findUnique({ where: { id: req.params.id } });
    if (!root || root.userId !== userId) {
      return res.status(404).json({ error: "Not found" });
    }
    const v = await prisma.veoPromptVersion.findUnique({ 
      where: { promptId_version: { promptId: req.params.id, version } } 
    });
    if (!v) {
      return res.status(404).json({ error: "Version not found" });
    }
    const updated = await prisma.veoPrompt.update({ 
      where: { id: req.params.id }, 
      data: { activeVersionId: v.id } 
    });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || "Rollback failed" });
  }
});

// API: Export JSON + instructions to S3 (private, signed URLs)
router.post('/export', async (req, res) => {
  try {
    const { id, json, instructionsText } = req.body;
    if (!json) {
      return res.status(400).json({ error: "Missing json" });
    }

    const base = `veo-prompts/${id || Date.now()}`;
    const jsonKey = `${base}/prompt.json`;
    const txtKey = instructionsText ? `${base}/instructions.txt` : undefined;

    await putPrivateText(jsonKey, JSON.stringify(json, null, 2), "application/json");
    if (txtKey) await putPrivateText(txtKey, instructionsText, "text/plain");

    const jsonUrl = await signedGetUrl(jsonKey, 600);
    const txtUrl = txtKey ? await signedGetUrl(txtKey, 600) : null;

    res.json({ jsonUrl, instructionsUrl: txtUrl });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || "Export failed" });
  }
});

// API: Send to Veo (direct job call)
router.post('/send', async (req, res) => {
  try {
    const { json, instructionsText } = req.body;
    if (!json) {
      return res.status(400).json({ error: "Missing json" });
    }

    const url = `${process.env.VEO_API_URL}/jobs`;
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VEO_API_KEY}`,
      },
      body: JSON.stringify({ prompt: json, instructions_text: instructionsText })
    });
    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data?.error || "Veo API failed" });
    }
    res.json({ jobId: data.jobId || data.id || data.job?.id || "unknown" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || "Veo send failed" });
  }
});

// API: Update existing prompt
router.put('/prompts/:id', async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { prompt, idea } = req.body;
    const parsed = PromptSchema.parse(prompt);
    
    const existing = await prisma.veoPrompt.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: "Not found or not yours" });
    }

    // Create new version
    const last = await prisma.veoPromptVersion.findFirst({ 
      where: { promptId: req.params.id }, 
      orderBy: { version: "desc" } 
    });
    const nextVersion = (last?.version ?? 0) + 1;
    
    const v = await prisma.veoPromptVersion.create({ 
      data: { 
        promptId: req.params.id, 
        version: nextVersion, 
        meta: parsed.meta, 
        story: parsed.story, 
        visuals: parsed.visuals, 
        audio: parsed.audio, 
        branding: parsed.branding, 
        deliverables: parsed.deliverables 
      } 
    });
    
    const updated = await prisma.veoPrompt.update({ 
      where: { id: req.params.id }, 
      data: { 
        title: parsed.meta.product.slice(0,180), 
        activeVersionId: v.id 
      },
      include: { activeVersion: true }
    });
    
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || "Update failed" });
  }
});

// API: Delete prompt
router.delete('/prompts/:id', async (req, res) => {
  try {
    const userId = await getUserId(req);
    const existing = await prisma.veoPrompt.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: "Not found or not yours" });
    }

    // Delete all versions first
    await prisma.veoPromptVersion.deleteMany({ where: { promptId: req.params.id } });
    // Delete the prompt
    await prisma.veoPrompt.delete({ where: { id: req.params.id } });
    
    res.json({ success: true, message: "Prompt deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || "Delete failed" });
  }
});

// API: Search/filter prompts
router.get('/prompts', async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { search, platform, objective, limit = 50, offset = 0 } = req.query;
    
    const where = { userId };
    
    // Add search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { ideaHash: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Add platform filter (requires joining with activeVersion)
    if (platform) {
      where.activeVersion = {
        meta: {
          path: ['platform'],
          equals: platform
        }
      };
    }
    
    // Add objective filter
    if (objective) {
      where.activeVersion = {
        meta: {
          path: ['objective'],
          equals: objective
        }
      };
    }
    
    const rows = await prisma.veoPrompt.findMany({ 
      where, 
      include: { activeVersion: true }, 
      orderBy: { updatedAt: "desc" }, 
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || "Fetch failed" });
  }
});

// API: Get prompt analytics
router.get('/analytics/usage', async (req, res) => {
  try {
    const userId = await getUserId(req);
    
    const totalPrompts = await prisma.veoPrompt.count({ where: { userId } });
    const totalVersions = await prisma.veoPromptVersion.count({ 
      where: { promptId: { in: await prisma.veoPrompt.findMany({ where: { userId }, select: { id: true } }).then(prompts => prompts.map(p => p.id)) } }
    });
    
    // Get platform distribution
    const platformStats = await prisma.veoPromptVersion.groupBy({
      by: ['meta'],
      where: { 
        promptId: { in: await prisma.veoPrompt.findMany({ where: { userId }, select: { id: true } }).then(prompts => prompts.map(p => p.id)) }
      },
      _count: true
    });
    
    res.json({
      totalPrompts,
      totalVersions,
      platformStats: platformStats.map(stat => ({
        platform: stat.meta?.platform || 'unknown',
        count: stat._count
      }))
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || "Analytics failed" });
  }
});

// API: Save as template
router.post('/templates', async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { name, description, prompt } = req.body;
    const parsed = PromptSchema.parse(prompt);
    
    const template = await prisma.veoPrompt.create({
      data: {
        userId,
        title: name,
        ideaHash: `template-${Date.now()}`,
        provider: 'template',
        isTemplate: true
      }
    });
    
    const version = await prisma.veoPromptVersion.create({
      data: {
        promptId: template.id,
        version: 1,
        meta: parsed.meta,
        story: parsed.story,
        visuals: parsed.visuals,
        audio: parsed.audio,
        branding: parsed.branding,
        deliverables: parsed.deliverables
      }
    });
    
    const updated = await prisma.veoPrompt.update({
      where: { id: template.id },
      data: { activeVersionId: version.id },
      include: { activeVersion: true }
    });
    
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || "Template save failed" });
  }
});

// API: Get templates
router.get('/templates', async (req, res) => {
  try {
    const userId = await getUserId(req);
    const templates = await prisma.veoPrompt.findMany({
      where: { userId, isTemplate: true },
      include: { activeVersion: true },
      orderBy: { updatedAt: "desc" }
    });
    
    res.json(templates);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || "Templates fetch failed" });
  }
});

// API: Load template
router.post('/templates/:id/load', async (req, res) => {
  try {
    const userId = await getUserId(req);
    const template = await prisma.veoPrompt.findUnique({
      where: { id: req.params.id },
      include: { activeVersion: true }
    });
    
    if (!template || template.userId !== userId || !template.isTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }
    
    res.json(template.activeVersion);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || "Template load failed" });
  }
});

export default router;

