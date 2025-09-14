import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import pino from 'pino';
import crypto from 'crypto';
import { ResilientServiceCalls } from './resilientCall.js';

const logger = pino({ name: 'rag' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

// =========================
// TYPES
// =========================

export interface KnowledgeDoc {
  id: string;
  org_id: string;
  title: string;
  source: 'upload' | 'url' | 'note';
  mime_type?: string;
  content: string;
  created_at: string;
}

export interface KnowledgeChunk {
  id: string;
  doc_id: string;
  org_id: string;
  chunk_index: number;
  text: string;
  embedding: number[];
  created_at: string;
}

export interface RAGResult {
  chunks: KnowledgeChunk[];
  query: string;
  totalChunks: number;
}

// =========================
// CONFIGURATION
// =========================

const RAG_MAX_CHUNKS = parseInt(process.env.RAG_MAX_CHUNKS || '6');
const RAG_CHUNK_SIZE = parseInt(process.env.RAG_CHUNK_SIZE || '1200');
const RAG_CHUNK_OVERLAP = 200;

// =========================
// DOCUMENT MANAGEMENT
// =========================

export async function createKnowledgeDoc(
  orgId: string,
  title: string,
  content: string,
  source: 'upload' | 'url' | 'note' = 'note',
  mimeType?: string
): Promise<KnowledgeDoc> {
  try {
    const { data, error } = await supabase
      .from('kb_docs')
      .insert({
        org_id: orgId,
        title,
        content,
        source,
        mime_type: mimeType
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create knowledge doc: ${error.message}`);
    }

    logger.info({ docId: data.id, orgId, title }, 'Knowledge doc created');
    return data;
  } catch (error) {
    logger.error({ orgId, title, error: error.message }, 'Failed to create knowledge doc');
    throw error;
  }
}

export async function getKnowledgeDocs(orgId: string): Promise<KnowledgeDoc[]> {
  try {
    const { data, error } = await supabase
      .from('kb_docs')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get knowledge docs: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    logger.error({ orgId, error: error.message }, 'Failed to get knowledge docs');
    throw error;
  }
}

export async function deleteKnowledgeDoc(docId: string, orgId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('kb_docs')
      .delete()
      .eq('id', docId)
      .eq('org_id', orgId);

    if (error) {
      throw new Error(`Failed to delete knowledge doc: ${error.message}`);
    }

    logger.info({ docId, orgId }, 'Knowledge doc deleted');
  } catch (error) {
    logger.error({ docId, orgId, error: error.message }, 'Failed to delete knowledge doc');
    throw error;
  }
}

// =========================
// TEXT CHUNKING
// =========================

export function chunkText(text: string, chunkSize: number = RAG_CHUNK_SIZE, overlap: number = RAG_CHUNK_OVERLAP): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    let chunk = text.slice(start, end);

    // Try to break at sentence boundaries
    if (end < text.length) {
      const lastSentenceEnd = chunk.lastIndexOf('.');
      const lastQuestionEnd = chunk.lastIndexOf('?');
      const lastExclamationEnd = chunk.lastIndexOf('!');
      const lastNewline = chunk.lastIndexOf('\n');

      const breakPoint = Math.max(lastSentenceEnd, lastQuestionEnd, lastExclamationEnd, lastNewline);
      
      if (breakPoint > chunkSize * 0.5) { // Only break if we're not losing too much content
        chunk = chunk.slice(0, breakPoint + 1);
      }
    }

    chunks.push(chunk.trim());
    start = start + chunk.length - overlap;
  }

  return chunks.filter(chunk => chunk.length > 0);
}

// =========================
// EMBEDDINGS
// =========================

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await ResilientServiceCalls.callOpenAI(() => 
      openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text
      })
    );

    return response.data[0].embedding;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to generate embedding');
    throw error;
  }
}

export async function embedDocument(docId: string, orgId: string): Promise<void> {
  try {
    // Get the document
    const { data: doc, error: docError } = await supabase
      .from('kb_docs')
      .select('*')
      .eq('id', docId)
      .eq('org_id', orgId)
      .single();

    if (docError) {
      throw new Error(`Document not found: ${docError.message}`);
    }

    // Delete existing chunks
    await supabase
      .from('kb_chunks')
      .delete()
      .eq('doc_id', docId);

    // Chunk the text
    const chunks = chunkText(doc.content);
    
    // Generate embeddings for each chunk
    const chunkPromises = chunks.map(async (chunk, index) => {
      const embedding = await generateEmbedding(chunk);
      
      return supabase
        .from('kb_chunks')
        .insert({
          doc_id: docId,
          org_id: orgId,
          chunk_index: index,
          text: chunk,
          embedding
        });
    });

    await Promise.all(chunkPromises);

    logger.info({ docId, orgId, chunkCount: chunks.length }, 'Document embedded successfully');
  } catch (error) {
    logger.error({ docId, orgId, error: error.message }, 'Failed to embed document');
    throw error;
  }
}

// =========================
// VECTOR SEARCH
// =========================

export async function retrieveRelevant(
  orgId: string, 
  query: string, 
  limit: number = Number(process.env.RAG_MAX_CHUNKS || 6)
): Promise<KnowledgeChunk[]> {
  try {
    const embedding = await generateEmbedding(query);
    
    const { data: chunks, error } = await supabase
      .from('kb_chunks')
      .select('id, text, chunk_index, doc_id, created_at')
      .eq('org_id', orgId)
      .order('embedding <#> embedding($1)', { ascending: true })
      .limit(limit);

    if (error) {
      logger.error({ error: error.message }, 'Failed to retrieve relevant chunks');
      throw error;
    }

    logger.info({ orgId, query, chunkCount: chunks?.length || 0 }, 'Retrieved relevant chunks');
    return chunks || [];
  } catch (error) {
    logger.error({ orgId, query, error: error.message }, 'Failed to retrieve relevant chunks');
    throw error;
  }
}

/**
 * Generate cache key for composer with RAG chunks
 */
export function cacheKey(orgId: string, payload: any, chunkIds: string[]): string {
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify({ orgId, payload, chunkIds }))
    .digest('hex');
  return `composer:${orgId}:${hash}`;
}

// =========================
// RAG-ENHANCED COMPOSER
// =========================

export async function enhanceComposerWithRAG(
  orgId: string,
  idea: string,
  goal?: string,
  platform?: string,
  brandKit?: any
): Promise<{
  context: string;
  chunks: KnowledgeChunk[];
  complianceRules: string[];
}> {
  try {
    // Build query from idea, goal, platform, and brand kit
    const queryParts = [idea];
    
    if (goal) queryParts.push(goal);
    if (platform) queryParts.push(`platform: ${platform}`);
    if (brandKit?.tone) queryParts.push(`tone: ${brandKit.tone}`);
    if (brandKit?.colors) queryParts.push(`colors: ${brandKit.colors.join(', ')}`);

    const query = queryParts.join(' ');

    // Retrieve relevant chunks
    const ragResult = await retrieveRelevant(orgId, query);

    // Build context from chunks
    const context = ragResult.chunks
      .map((chunk, index) => `[Context ${index + 1}] ${chunk.text}`)
      .join('\n\n');

    // Extract compliance rules from brand kit and chunks
    const complianceRules = extractComplianceRules(brandKit, ragResult.chunks);

    logger.info({ 
      orgId, 
      query, 
      chunkCount: ragResult.chunks.length,
      contextLength: context.length 
    }, 'Enhanced composer with RAG');

    return {
      context,
      chunks: ragResult.chunks,
      complianceRules
    };
  } catch (error) {
    logger.error({ orgId, idea, error: error.message }, 'Failed to enhance composer with RAG');
    throw error;
  }
}

// =========================
// COMPLIANCE RULES
// =========================

function extractComplianceRules(brandKit: any, chunks: KnowledgeChunk[]): string[] {
  const rules: string[] = [];

  // Extract from brand kit
  if (brandKit?.compliance) {
    rules.push(...brandKit.compliance);
  }

  // Extract from knowledge base chunks
  for (const chunk of chunks) {
    // Look for compliance-related keywords
    const complianceKeywords = [
      'compliance', 'guidelines', 'requirements', 'restrictions',
      'banned', 'prohibited', 'must not', 'should not', 'avoid',
      'disclaimer', 'warning', 'legal', 'terms'
    ];

    const hasComplianceContent = complianceKeywords.some(keyword => 
      chunk.text.toLowerCase().includes(keyword)
    );

    if (hasComplianceContent) {
      // Extract sentences that might contain compliance rules
      const sentences = chunk.text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const complianceSentences = sentences.filter(sentence => 
        complianceKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
      );
      
      rules.push(...complianceSentences.map(s => s.trim()));
    }
  }

  return [...new Set(rules)]; // Remove duplicates
}

// =========================
// BULK OPERATIONS
// =========================

export async function embedAllDocuments(orgId: string): Promise<{
  processed: number;
  failed: number;
  errors: string[];
}> {
  try {
    const docs = await getKnowledgeDocs(orgId);
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const doc of docs) {
      try {
        await embedDocument(doc.id, orgId);
        processed++;
      } catch (error) {
        failed++;
        errors.push(`Document ${doc.id}: ${error.message}`);
      }
    }

    logger.info({ orgId, processed, failed }, 'Bulk embedding completed');

    return { processed, failed, errors };
  } catch (error) {
    logger.error({ orgId, error: error.message }, 'Failed to embed all documents');
    throw error;
  }
}

export async function deleteAllChunks(orgId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('kb_chunks')
      .delete()
      .eq('org_id', orgId);

    if (error) {
      throw new Error(`Failed to delete chunks: ${error.message}`);
    }

    logger.info({ orgId }, 'All chunks deleted');
  } catch (error) {
    logger.error({ orgId, error: error.message }, 'Failed to delete all chunks');
    throw error;
  }
}

// =========================
// ANALYTICS
// =========================

export async function getRAGAnalytics(orgId: string): Promise<{
  totalDocs: number;
  totalChunks: number;
  avgChunksPerDoc: number;
  totalEmbeddings: number;
  lastUpdated: string;
}> {
  try {
    // Get document count
    const { count: totalDocs } = await supabase
      .from('kb_docs')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    // Get chunk count
    const { count: totalChunks } = await supabase
      .from('kb_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    // Get last updated timestamp
    const { data: lastChunk } = await supabase
      .from('kb_chunks')
      .select('created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const avgChunksPerDoc = totalDocs > 0 ? (totalChunks || 0) / totalDocs : 0;

    return {
      totalDocs: totalDocs || 0,
      totalChunks: totalChunks || 0,
      avgChunksPerDoc,
      totalEmbeddings: totalChunks || 0,
      lastUpdated: lastChunk?.created_at || 'Never'
    };
  } catch (error) {
    logger.error({ orgId, error: error.message }, 'Failed to get RAG analytics');
    throw error;
  }
}

// =========================
// EXPORTS
// =========================

export { KnowledgeDoc, KnowledgeChunk, RAGResult };
