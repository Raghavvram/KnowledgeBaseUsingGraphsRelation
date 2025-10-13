import express from 'express';
import { RealPaper } from '../services/paperSearchService';
import { searchRealPapers } from '../services/paperSearchService';
import { RelationshipService } from '../services/relationshipService';
import { PaperDownloadService } from '../services/paperDownloadService';
import neo4jService from '../services/neo4jService';
import path from 'path';
import fs from 'fs';
import { GraphRAGService } from '../services/graphRagService';
import { AdvancedRAGService } from '../services/AdvancedRAGService';
import { groqService } from '../services/groqService';

// ✅ TYPE DEFINITIONS
interface RAGResponse {
  answer: string;
  sources: any[];
  context: {
    relevantPapers: any[];
    searchQuery: string;
    searchType: string;
    totalPapersFound: number;
    confidence: number;
    topic?: string;
  };
  suggestedQuestions: string[];
  reasoning: string;
}

interface MultiStepResult {
  originalQuestion: string;
  steps: any[];
  synthesis: string;
  conclusions: string[];
  limitationsAndGaps: string[];
  suggestedResearch: string[];
  sources: any[];
  totalConfidence: number;
  // Compatibility properties for union type handling
  answer?: string;
  suggestedQuestions?: string[];
  confidence?: number;
  investigation?: {
    question: string;
    steps: any[];
    synthesis: string;
    gaps: string[];
    futureWork: string[];
  };
}

interface BulkOperationResult {
  success: boolean;
  message: string;
  filesProcessedAttempted?: number;
  successfullyStoredInDB?: number;
  papersAttempted?: number;
  filesWritten?: number;
  details?: any;
}

// In-memory conversation store (simple session store for chat)
interface ConversationSession {
  id: string;
  messages: { role: string; content: string; timestamp: number }[];
  context: { totalQuestions?: number };
}

const conversationStore = new Map<string, ConversationSession>();

const router = express.Router();
const downloadService = new PaperDownloadService();
const graphRAG = new GraphRAGService();
const advancedRAG = new AdvancedRAGService();

// Helper function to check if response is RAGResponse
function isRAGResponse(response: any): boolean {
  return response && typeof response === 'object' && 'answer' in response && 'suggestedQuestions' in response;
}

// Helper function to check if response is MultiStepResult
function isMultiStepResult(response: any): boolean {
  return response && typeof response === 'object' && ('investigation' in response || 'synthesis' in response);
}

// ✅ INSTANT CACHING SYSTEM
interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
}

class InstantCache {
  private cache = new Map<string, CacheItem>();
  private maxSize = 10000;

  set(key: string, data: any, ttlMinutes: number = 60): void {
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
    if (this.cache.size > this.maxSize) {
        const entriesToDelete = Array.from(this.cache.entries()).sort((a,b) => a[1].timestamp - b[1].timestamp);
        for(let i=0; i < (this.cache.size - this.maxSize); i++){
            this.cache.delete(entriesToDelete[i][0]);
        }
    }
  }

  getStats(): { size: number; maxSize: number } {
    this.cleanup();
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

// ✅ CACHE INSTANCES
const searchCache = new InstantCache();
const paperContentCache = new InstantCache();
const graphCache = new InstantCache();

// Helper function to optimize papers for frontend
function optimizePapersForFrontend(papers: any[]): any[] {
  return papers.map((paper, index) => ({
    id: paper.id || `paper-${Date.now()}-${index}`,
    title: paper.title || 'Untitled Paper',
    authors: paper.authors ? paper.authors.slice(0, 3) : ['Unknown Author'],
    year: paper.year || null,
    citationCount: paper.citationCount || 0,
    abstract: paper.abstract ? paper.abstract.substring(0, 300) + (paper.abstract.length > 300 ? '...' : '') : 'No abstract available',
    venue: paper.venue || 'Unknown Venue',
    url: paper.url,
    localFilePath: paper.localFilePath,
    hasLocalFile: !!paper.localFilePath,
    fileSize: paper.fileSize,
    similarity: paper.similarity,
    relevance: paper.relevance,
    connectionStrength: paper.connectionStrength,
    embeddingDimension: paper.embeddingDimension,
    hasFullContent: paper.hasFullContent,
    contentType: paper.contentType,
  }));
}

// 🎯 ENHANCED SEARCH WITH PDF PRIORITY
router.post('/search-papers', async (req: any, res: any) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required and must be a non-empty string'
      });
    }

    const cacheKey = `search-papers_${query.toLowerCase().replace(/\s+/g, '_')}`;
    const cachedResults = searchCache.get(cacheKey);

    if (cachedResults) {
      console.log('\u26a1 INSTANT: Returning cached search results for (search-papers):', query);
      return res.json({...cachedResults, data: {...cachedResults.data, cached: true}});
    }

    console.log(`🔍 Original search (/search-papers) for: ${query} (PDF-priority download enabled)`);
    const results = await searchRealPapers(query);

    console.log(`📦 Found ${results.papers.length} papers - Starting PDF-priority download (if any)`);

    if (results.papers.length > 0) {
      const disableAuto = process.env.DISABLE_AUTO_DOWNLOAD === '1' || process.env.DISABLE_AUTO_DOWNLOAD === 'true';
      const maxAuto = parseInt(process.env.MAX_AUTO_DOWNLOAD || '5', 10);

      if (disableAuto) {
        console.log('⏸️ Auto-downloads are disabled via DISABLE_AUTO_DOWNLOAD');
      } else {
        const toDownload = Math.min(results.papers.length, maxAuto);
        console.log(`📥 Starting PDF-priority download for up to ${toDownload} papers via /search-papers (maxAuto=${maxAuto})`);

        const papersSlice = results.papers.slice(0, toDownload);
        downloadService.downloadAllPapers(papersSlice, query, true)
          .then(async (downloadResults) => {
            console.log(`✅ Download completed via /search-papers with PDF priority:`);
            console.log(`📄 Success: ${downloadResults.completed}, Failed: ${downloadResults.failed}`);
          })
          .catch(error => {
            console.error('❌ PDF-priority download initiated by /search-papers failed:', error);
          });
      }
    }

    const optimizedPapers = results.papers.map((paper: any, index: number) => ({
      id: paper.id || `paper-${Date.now()}-${index}`,
      title: paper.title || 'Untitled Paper',
      authors: paper.authors || ['Unknown Author'],
      year: paper.year || null,
      citationCount: paper.citationCount || 0,
      abstract: paper.abstract,
      venue: paper.venue || 'Unknown Venue',
      url: paper.url,
      doi: paper.doi,
      keywords: paper.keywords || [],
      hasLocalFile: paper.localFilePath ? true : false,
      storedInDatabase: paper.storedInDatabase ? true : false,
      localFilePath: paper.localFilePath || null,
      fileSize: paper.fileSize || null,
      contentType: paper.contentType || null,
      downloadStrategy: paper.downloadStrategy || null
    }));

    const responseData = {
      success: true,
      message: `Found ${results.papers.length} papers - PDF-priority auto-download started (if applicable)`,
      data: {
        papers: optimizedPapers,
        count: results.papers.length,
        authorsAnalyzed: results.authorsAnalyzed,
        summary: results.summary,
        totalFound: results.totalFound,
        autoDownloadStarted: results.papers.length > 0,
        downloadStrategy: 'pdf_priority',
        databaseStorageEnabled: true,
        features: {
          pdfPriority: true,
          inlinePDFViewing: true,
          fullContentDisplay: true,
          noExternalLinks: true
        },
        cached: false
      }
    };

    searchCache.set(cacheKey, responseData, 30);
    console.log(`💾 Cached /search-papers results for: ${query}`);

    res.json(responseData);

  } catch (error) {
    console.error('❌ Error in /search-papers endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching papers with PDF priority',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/chat', async (req: any, res: any) => {
  const startTime = Date.now(); // ADD THIS LINE

  try {
    const { question, mode = 'simple', conversationId, topic } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }

    console.log(`💬 Chat request: "${question}" (mode: ${mode}, topic: ${topic})`);

  // ADD THIS: Get conversation history
  let conversationHistory: { role: string; content: string; timestamp: number }[] = [];
    if (conversationId) {
      const session = conversationStore.get(conversationId);
      if (session) {
        conversationHistory = session.messages.slice(-5);
        console.log(`📋 Found conversation with ${conversationHistory.length} messages`);
      } else {
        console.log(`❌ No conversation found for ID: ${conversationId}`);
      }
    }

    let ragResponse: any; // ADD THIS LINE

    if (mode === 'investigation') {
      ragResponse = await advancedRAG.conductResearchInvestigation(question, topic);
    } else if (mode === 'advanced') {
      ragResponse = await graphRAG.askQuestion(question, topic, conversationHistory);
    } else {
      ragResponse = await graphRAG.askQuestion(question, topic, conversationHistory);
    }

    // Handle different response types safely
    if (isRAGResponse(ragResponse)) {
      res.json({
        success: true,
        message: 'Research question answered',
        data: {
          answer: ragResponse.answer,
          sources: optimizePapersForFrontend(ragResponse.sources || []),
          suggestedQuestions: ragResponse.suggestedQuestions,
          confidence: ragResponse.confidence || 0.8,
          searchMethod: 'hybrid',
          responseTime: Date.now() - startTime,
          topic: topic || (ragResponse as any).context?.topic || 'all'
        }
      });
    } else if (isMultiStepResult(ragResponse)) {
      res.json({
        success: true,
        message: 'Multi-step investigation completed',
        data: {
          type: 'investigation',
          investigation: ragResponse.investigation,
          sources: optimizePapersForFrontend(ragResponse.sources || []),
          summary: ragResponse.synthesis || (ragResponse.investigation as any)?.synthesis,
          steps: (ragResponse.investigation as any)?.steps,
          answer: ragResponse.answer || (ragResponse.investigation as any)?.synthesis,
          confidence: ragResponse.confidence || 0.8,
          suggestedQuestions: ragResponse.suggestedQuestions || [],
          responseTime: Date.now() - startTime,
          topic: topic || (ragResponse as any).context?.topic || 'all'
        }
      });
    } else {
      console.warn('⚠️ Unknown response type from RAG service:', ragResponse);
      const bestEffortAnswer = (ragResponse as any)?.answer || (ragResponse as any)?.synthesis || "Could not determine a structured answer.";
      const bestEffortSources = optimizePapersForFrontend((ragResponse as any)?.sources || []);

      res.json({
        success: true,
        message: 'Response processed with undefined structure.',
        data: {
            answer: bestEffortAnswer,
            sources: bestEffortSources,
            suggestedQuestions: (ragResponse as any)?.suggestedQuestions || [],
            confidence: (ragResponse as any)?.confidence || 0.5,
            responseTime: Date.now() - startTime,
            topic: topic || 'all',
            rawResponse: ragResponse
        }
      });
    }

  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing chat request',
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        question: req.body.question,
        fallbackSuggestions: [
          "Try asking about specific research topics in your database",
          "Ask about authors or methodologies you're interested in",
          "Request information about recent developments in a field"
        ]
      }
    });
  }
});

// ✅ SEMANTIC SEARCH ENDPOINT
router.post('/semantic-search', async (req: any, res: any) => {
  try {
    const { query, limit = 10, topic } = req.body;

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    const numericLimit = parseInt(limit as string, 10) || 10;

    console.log(`🔍 Semantic search: "${query}" (Limit: ${numericLimit}, Topic: ${topic || 'all'})`);

    const results = await neo4jService.semanticSearch(query, numericLimit, topic);

    res.json({
      success: true,
      message: `Found ${results.length} semantically similar papers`,
      data: {
        query: query,
        results: optimizePapersForFrontend(results),
        count: results.length,
        searchType: 'semantic',
        topic: topic || 'all'
      }
    });

  } catch (error) {
    console.error('❌ Error in semantic search:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing semantic search',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ... (the rest of the file continues exactly as in the original repository)

export default router;
