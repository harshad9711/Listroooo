import { Router } from 'express';
import { 
  createPromptSnapshot,
  getPromptSnapshot,
  getPromptSnapshots,
  searchPromptSnapshots,
  reproducePrompt,
  comparePromptVersions,
  createPromptTemplate,
  getPromptTemplates,
  getPromptAnalytics,
  PromptVersionRequest,
  ReproduceRequest
} from '../lib/promptVersioning.js';
import pino from 'pino';

const logger = pino({ name: 'prompt-versioning-routes' });
const router = Router();

// =========================
// PROMPT SNAPSHOTS
// =========================

router.post('/snapshots', async (req, res) => {
  try {
    const { veoJobId, orgId, userId, jsonPrompt, promptString, config, assets, seed } = req.body;

    // Validate required fields
    if (!orgId || !userId || !jsonPrompt || !promptString || !config) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const request: PromptVersionRequest = {
      veoJobId,
      orgId,
      userId,
      jsonPrompt,
      promptString,
      config,
      assets,
      seed
    };

    const snapshot = await createPromptSnapshot(request);
    
    res.json({
      snapshot,
      message: 'Prompt snapshot created successfully'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create prompt snapshot');
    res.status(500).json({ error: error.message });
  }
});

router.get('/snapshots', async (req, res) => {
  try {
    const { orgId, limit = 50 } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const snapshots = await getPromptSnapshots(orgId as string, parseInt(limit as string));
    res.json(snapshots);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get prompt snapshots');
    res.status(500).json({ error: error.message });
  }
});

router.get('/snapshots/:snapshotId', async (req, res) => {
  try {
    const { snapshotId } = req.params;

    const snapshot = await getPromptSnapshot(snapshotId);
    res.json(snapshot);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get prompt snapshot');
    res.status(500).json({ error: error.message });
  }
});

router.get('/snapshots/search', async (req, res) => {
  try {
    const { orgId, query, filters } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const snapshots = await searchPromptSnapshots(
      orgId as string,
      query as string,
      filters ? JSON.parse(filters as string) : undefined
    );
    
    res.json(snapshots);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to search prompt snapshots');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// PROMPT REPRODUCTION
// =========================

router.post('/reproduce', async (req, res) => {
  try {
    const { snapshotId, orgId, userId, variations } = req.body;

    // Validate required fields
    if (!snapshotId || !orgId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const request: ReproduceRequest = {
      snapshotId,
      orgId,
      userId,
      variations
    };

    const newJobId = await reproducePrompt(request);
    
    res.json({
      newJobId,
      message: 'Prompt reproduced successfully'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to reproduce prompt');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// VERSION COMPARISON
// =========================

router.get('/compare/:snapshotId1/:snapshotId2', async (req, res) => {
  try {
    const { snapshotId1, snapshotId2 } = req.params;

    const comparison = await comparePromptVersions(snapshotId1, snapshotId2);
    res.json(comparison);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to compare prompt versions');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// PROMPT TEMPLATES
// =========================

router.post('/templates', async (req, res) => {
  try {
    const { orgId, userId, name, description, snapshotId, tags } = req.body;

    // Validate required fields
    if (!orgId || !userId || !name || !snapshotId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const templateId = await createPromptTemplate(
      orgId,
      userId,
      name,
      description,
      snapshotId,
      tags
    );
    
    res.json({
      templateId,
      message: 'Prompt template created successfully'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create prompt template');
    res.status(500).json({ error: error.message });
  }
});

router.get('/templates', async (req, res) => {
  try {
    const { orgId } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const templates = await getPromptTemplates(orgId as string);
    res.json(templates);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get prompt templates');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// PROMPT ANALYTICS
// =========================

router.get('/analytics', async (req, res) => {
  try {
    const { orgId, timeRange = 30 } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const analytics = await getPromptAnalytics(
      orgId as string,
      parseInt(timeRange as string)
    );
    
    res.json(analytics);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get prompt analytics');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// PROMPT DIFF
// =========================

router.post('/diff', async (req, res) => {
  try {
    const { prompt1, prompt2, type = 'json' } = req.body;

    if (!prompt1 || !prompt2) {
      return res.status(400).json({ error: 'Both prompts required' });
    }

    let diff;
    if (type === 'json') {
      diff = compareObjects(prompt1, prompt2);
    } else {
      diff = compareStrings(prompt1, prompt2);
    }

    res.json({ diff });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to generate prompt diff');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// PROMPT VALIDATION
// =========================

router.post('/validate', async (req, res) => {
  try {
    const { jsonPrompt, config } = req.body;

    if (!jsonPrompt || !config) {
      return res.status(400).json({ error: 'JSON prompt and config required' });
    }

    // Validate against VeoPromptZ schema
    const { VeoPromptZ } = await import('../lib/veo3Schema.js');
    
    try {
      const validatedPrompt = VeoPromptZ.parse(jsonPrompt);
      const validatedConfig = config; // Add config validation if needed
      
      res.json({
        valid: true,
        validatedPrompt,
        validatedConfig
      });
    } catch (validationError) {
      res.json({
        valid: false,
        errors: validationError.errors || [validationError.message]
      });
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to validate prompt');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// PROMPT EXPORT/IMPORT
// =========================

router.post('/export', async (req, res) => {
  try {
    const { snapshotIds, format = 'json' } = req.body;

    if (!snapshotIds || !Array.isArray(snapshotIds)) {
      return res.status(400).json({ error: 'Snapshot IDs array required' });
    }

    const snapshots = await Promise.all(
      snapshotIds.map(id => getPromptSnapshot(id))
    );

    if (format === 'json') {
      res.json({ snapshots });
    } else if (format === 'csv') {
      const csv = convertSnapshotsToCSV(snapshots);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="prompt-snapshots.csv"');
      res.send(csv);
    } else {
      res.status(400).json({ error: 'Unsupported format' });
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to export snapshots');
    res.status(500).json({ error: error.message });
  }
});

router.post('/import', async (req, res) => {
  try {
    const { snapshots, orgId, userId } = req.body;

    if (!snapshots || !Array.isArray(snapshots) || !orgId || !userId) {
      return res.status(400).json({ error: 'Snapshots array, orgId, and userId required' });
    }

    const results = [];
    const errors = [];

    for (const snapshot of snapshots) {
      try {
        const result = await createPromptSnapshot({
          orgId,
          userId,
          jsonPrompt: snapshot.json_prompt,
          promptString: snapshot.prompt_string,
          config: snapshot.config,
          seed: snapshot.seed
        });
        results.push(result);
      } catch (error) {
        errors.push({ snapshot, error: error.message });
      }
    }

    res.json({
      results,
      errors,
      total: snapshots.length,
      successful: results.length,
      failed: errors.length
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to import snapshots');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// HELPER FUNCTIONS
// =========================

function compareObjects(obj1: Record<string, any>, obj2: Record<string, any>): Record<string, any> {
  const differences: Record<string, any> = {};

  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

  for (const key of allKeys) {
    if (!(key in obj1)) {
      differences[key] = { added: obj2[key] };
    } else if (!(key in obj2)) {
      differences[key] = { removed: obj1[key] };
    } else if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
      const nestedDiff = compareObjects(obj1[key], obj2[key]);
      if (Object.keys(nestedDiff).length > 0) {
        differences[key] = nestedDiff;
      }
    } else if (obj1[key] !== obj2[key]) {
      differences[key] = {
        original: obj1[key],
        modified: obj2[key]
      };
    }
  }

  return differences;
}

function compareStrings(str1: string, str2: string): Record<string, any> {
  // Simple string comparison - in production, you might want to use a proper diff library
  return {
    original: str1,
    modified: str2,
    lengthDiff: str2.length - str1.length,
    identical: str1 === str2
  };
}

function convertSnapshotsToCSV(snapshots: any[]): string {
  if (snapshots.length === 0) return '';

  const headers = ['id', 'created_at', 'prompt_string', 'config', 'seed'];
  const csvRows = [headers.join(',')];

  for (const snapshot of snapshots) {
    const values = [
      snapshot.id,
      snapshot.created_at,
      `"${snapshot.prompt_string.replace(/"/g, '""')}"`,
      `"${JSON.stringify(snapshot.config).replace(/"/g, '""')}"`,
      snapshot.seed || ''
    ];
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

export default router;

