// Missing APIs for Veo 3 Pro Pack
// Add these to api/veo-routes.js for a complete implementation

import express from 'express';
import { prisma } from '../src/lib/prisma.js';

const router = express.Router();

// Auth helper (same as existing)
async function getUserId(req) {
  try {
    const userId = req.headers['x-user-id'];
    if (userId) return userId;
  } catch (error) {
    console.error('Auth error:', error);
  }
  return "demo-user";
}

// ========================================
// MISSING API 1: Delete Prompt
// ========================================
router.delete('/prompts/:id', async (req, res) => {
  try {
    const userId = await getUserId(req);
    const prompt = await prisma.veoPrompt.findUnique({ where: { id: req.params.id } });
    
    if (!prompt || prompt.userId !== userId) {
      return res.status(404).json({ error: "Not found or not yours" });
    }
    
    // Delete all versions first (cascade)
    await prisma.veoPromptVersion.deleteMany({ where: { promptId: req.params.id } });
    // Then delete the prompt
    await prisma.veoPrompt.delete({ where: { id: req.params.id } });
    
    res.json({ success: true, message: "Prompt deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || "Delete failed" });
  }
});

// ========================================
// MISSING API 2: Delete Specific Version
// ========================================
router.delete('/prompts/:id/versions/:version', async (req, res) => {
  try {
    const userId = await getUserId(req);
    const version = parseInt(req.params.version);
    
    const prompt = await prisma.veoPrompt.findUnique({ where: { id: req.params.id } });
    if (!prompt || prompt.userId !== userId) {
      return res.status(404).json({ error: "Not found or not yours" });
    }
    
    const versionToDelete = await prisma.veoPromptVersion.findUnique({
      where: { promptId_version: { promptId: req.params.id, version } }
    });
    
    if (!versionToDelete) {
      return res.status(404).json({ error: "Version not found" });
    }
    
    // Don't delete if it's the only version
    const versionCount = await prisma.veoPromptVersion.count({
      where: { promptId: req.params.id }
    });
    
    if (versionCount <= 1) {
      return res.status(400).json({ error: "Cannot delete the only version" });
    }
    
    // If deleting the active version, set a new active version
    if (prompt.activeVersionId === versionToDelete.id) {
      const newActiveVersion = await prisma.veoPromptVersion.findFirst({
        where: { 
          promptId: req.params.id,
          id: { not: versionToDelete.id }
        },
        orderBy: { version: "desc" }
      });
      
      if (newActiveVersion) {
        await prisma.veoPrompt.update({
          where: { id: req.params.id },
          data: { activeVersionId: newActiveVersion.id }
        });
      }
    }
    
    await prisma.veoPromptVersion.delete({
      where: { promptId_version: { promptId: req.params.id, version } }
    });
    
    res.json({ success: true, message: `Version ${version} deleted` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || "Delete failed" });
  }
});

// ========================================
// MISSING API 3: Update Prompt Title/Info
// ========================================
router.put('/prompts/:id', async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { title, ideaHash } = req.body;
    
    const prompt = await prisma.veoPrompt.findUnique({ where: { id: req.params.id } });
    if (!prompt || prompt.userId !== userId) {
      return res.status(404).json({ error: "Not found or not yours" });
    }
    
    const updated = await prisma.veoPrompt.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title: title.slice(0, 180) }),
        ...(ideaHash && { ideaHash })
      },
      include: { activeVersion: true }
    });
    
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || "Update failed" });
  }
});

// ========================================
// MISSING API 4: Get Prompt Statistics
// ========================================
router.get('/prompts/:id/stats', async (req, res) => {
  try {
    const userId = await getUserId(req);
    const prompt = await prisma.veoPrompt.findUnique({ 
      where: { id: req.params.id },
      include: { 
        versions: true,
        activeVersion: true
      }
    });
    
    if (!prompt || prompt.userId !== userId) {
      return res.status(404).json({ error: "Not found" });
    }
    
    const stats = {
      totalVersions: prompt.versions.length,
      latestVersion: Math.max(...prompt.versions.map(v => v.version)),
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
      hasActiveVersion: !!prompt.activeVersion,
      versionsWithJobIds: prompt.versions.filter(v => v.providerJobId).length
    };
    
    res.json(stats);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || "Stats fetch failed" });
  }
});

// ========================================
// MISSING API 5: Search Prompts
// ========================================
router.get('/prompts/search', async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { q, limit = 20, offset = 0 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: "Search query must be at least 2 characters" });
    }
    
    const prompts = await prisma.veoPrompt.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { ideaHash: { contains: q } }
        ]
      },
      include: { activeVersion: true },
      orderBy: { updatedAt: "desc" },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    
    res.json(prompts);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || "Search failed" });
  }
});

// ========================================
// MISSING API 6: Bulk Operations
// ========================================
router.post('/prompts/bulk', async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { action, promptIds } = req.body;
    
    if (!Array.isArray(promptIds) || promptIds.length === 0) {
      return res.status(400).json({ error: "promptIds must be a non-empty array" });
    }
    
    // Verify all prompts belong to user
    const prompts = await prisma.veoPrompt.findMany({
      where: { id: { in: promptIds }, userId }
    });
    
    if (prompts.length !== promptIds.length) {
      return res.status(400).json({ error: "Some prompts not found or not yours" });
    }
    
    let result;
    switch (action) {
      case 'delete':
        // Delete all versions first
        await prisma.veoPromptVersion.deleteMany({
          where: { promptId: { in: promptIds } }
        });
        // Then delete prompts
        result = await prisma.veoPrompt.deleteMany({
          where: { id: { in: promptIds } }
        });
        break;
        
      case 'export':
        // Get all prompts with their active versions
        const promptsWithVersions = await prisma.veoPrompt.findMany({
          where: { id: { in: promptIds } },
          include: { activeVersion: true }
        });
        result = { prompts: promptsWithVersions };
        break;
        
      default:
        return res.status(400).json({ error: "Invalid action. Use 'delete' or 'export'" });
    }
    
    res.json({ success: true, result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || "Bulk operation failed" });
  }
});

// ========================================
// MISSING API 7: Update Version Job ID
// ========================================
router.put('/prompts/:id/versions/:version/job', async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { providerJobId } = req.body;
    const version = parseInt(req.params.version);
    
    const prompt = await prisma.veoPrompt.findUnique({ where: { id: req.params.id } });
    if (!prompt || prompt.userId !== userId) {
      return res.status(404).json({ error: "Not found or not yours" });
    }
    
    const versionToUpdate = await prisma.veoPromptVersion.findUnique({
      where: { promptId_version: { promptId: req.params.id, version } }
    });
    
    if (!versionToUpdate) {
      return res.status(404).json({ error: "Version not found" });
    }
    
    const updated = await prisma.veoPromptVersion.update({
      where: { promptId_version: { promptId: req.params.id, version } },
      data: { providerJobId }
    });
    
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || "Update failed" });
  }
});

// ========================================
// MISSING API 8: Get User Statistics
// ========================================
router.get('/user/stats', async (req, res) => {
  try {
    const userId = await getUserId(req);
    
    const [promptCount, versionCount, recentActivity] = await Promise.all([
      prisma.veoPrompt.count({ where: { userId } }),
      prisma.veoPromptVersion.count({ 
        where: { prompt: { userId } } 
      }),
      prisma.veoPrompt.findMany({
        where: { userId },
        include: { activeVersion: true },
        orderBy: { updatedAt: "desc" },
        take: 5
      })
    ]);
    
    const stats = {
      totalPrompts: promptCount,
      totalVersions: versionCount,
      averageVersionsPerPrompt: promptCount > 0 ? (versionCount / promptCount).toFixed(2) : 0,
      recentActivity
    };
    
    res.json(stats);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || "Stats fetch failed" });
  }
});

export default router;

