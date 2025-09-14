import { Router } from 'express';
import { 
  createKnowledgeDoc,
  getKnowledgeDocs,
  deleteKnowledgeDoc,
  embedDocument,
  retrieveRelevant,
  enhanceComposerWithRAG,
  embedAllDocuments,
  deleteAllChunks,
  getRAGAnalytics,
  KnowledgeDoc,
  RAGResult
} from '../lib/rag.js';
import pino from 'pino';

const logger = pino({ name: 'rag-routes' });
const router = Router();

// =========================
// KNOWLEDGE BASE DOCUMENTS
// =========================

router.post('/docs', async (req, res) => {
  try {
    const { orgId, title, content, source, mimeType } = req.body;

    // Validate required fields
    if (!orgId || !title || !content) {
      return res.status(400).json({ error: 'Organization ID, title, and content required' });
    }

    // Validate source
    if (source && !['upload', 'url', 'note'].includes(source)) {
      return res.status(400).json({ error: 'Invalid source type' });
    }

    const doc = await createKnowledgeDoc(
      orgId,
      title,
      content,
      source || 'note',
      mimeType
    );

    res.json({
      doc,
      message: 'Knowledge document created successfully'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create knowledge document');
    res.status(500).json({ error: error.message });
  }
});

router.get('/docs', async (req, res) => {
  try {
    const { orgId } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const docs = await getKnowledgeDocs(orgId as string);
    res.json(docs);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get knowledge documents');
    res.status(500).json({ error: error.message });
  }
});

router.delete('/docs/:docId', async (req, res) => {
  try {
    const { docId } = req.params;
    const { orgId } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    await deleteKnowledgeDoc(docId, orgId as string);
    res.json({ 
      success: true,
      message: 'Knowledge document deleted successfully'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to delete knowledge document');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// DOCUMENT EMBEDDING
// =========================

router.post('/docs/:docId/embed', async (req, res) => {
  try {
    const { docId } = req.params;
    const { orgId } = req.body;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    await embedDocument(docId, orgId);
    res.json({ 
      success: true,
      message: 'Document embedded successfully'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to embed document');
    res.status(500).json({ error: error.message });
  }
});

router.post('/embed/all', async (req, res) => {
  try {
    const { orgId } = req.body;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const result = await embedAllDocuments(orgId);
    res.json({
      ...result,
      message: 'Bulk embedding completed'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to embed all documents');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// VECTOR SEARCH
// =========================

router.post('/search', async (req, res) => {
  try {
    const { orgId, query } = req.body;

    if (!orgId || !query) {
      return res.status(400).json({ error: 'Organization ID and query required' });
    }

    const result = await retrieveRelevant(orgId, query);
    res.json(result);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to search knowledge base');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// RAG-ENHANCED COMPOSER
// =========================

router.post('/composer/enhance', async (req, res) => {
  try {
    const { orgId, idea, goal, platform, brandKit } = req.body;

    if (!orgId || !idea) {
      return res.status(400).json({ error: 'Organization ID and idea required' });
    }

    const result = await enhanceComposerWithRAG(
      orgId,
      idea,
      goal,
      platform,
      brandKit
    );

    res.json({
      ...result,
      message: 'Composer enhanced with RAG successfully'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to enhance composer with RAG');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// BULK OPERATIONS
// =========================

router.delete('/chunks', async (req, res) => {
  try {
    const { orgId } = req.body;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    await deleteAllChunks(orgId);
    res.json({ 
      success: true,
      message: 'All chunks deleted successfully'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to delete all chunks');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// ANALYTICS
// =========================

router.get('/analytics', async (req, res) => {
  try {
    const { orgId } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const analytics = await getRAGAnalytics(orgId as string);
    res.json(analytics);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get RAG analytics');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// HEALTH CHECK
// =========================

router.get('/health', async (req, res) => {
  try {
    const { orgId } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    // Test embedding generation
    const testEmbedding = await generateEmbedding('test query');
    
    // Test vector search
    const searchResult = await retrieveRelevant(orgId as string, 'test query');

    res.json({
      status: 'healthy',
      embeddingModel: 'text-embedding-3-small',
      embeddingDimension: testEmbedding.length,
      searchWorking: searchResult.chunks.length >= 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error.message }, 'RAG health check failed');
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// =========================
// HELPER FUNCTIONS
// =========================

async function generateEmbedding(text: string): Promise<number[]> {
  const { generateEmbedding } = await import('../lib/rag.js');
  return generateEmbedding(text);
}

export default router;

