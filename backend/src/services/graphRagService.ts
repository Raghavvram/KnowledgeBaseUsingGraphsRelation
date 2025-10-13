// GraphRAGService.ts - AI Research Assistant with Graph RAG
import neo4jService from './neo4jService';
import { groqService } from './groqService';

interface RAGContext {
  relevantPapers: any[];
  searchQuery: string;
  searchType: string;
  totalPapersFound: number;
  confidence: number;
}

interface RAGResponse {
  answer: string;
  sources: any[];
  context: RAGContext;
  suggestedQuestions: string[];
  reasoning: string;
}

export class GraphRAGService {
  
  // ✅ MAIN RAG PIPELINE - Answers questions using your research database
  async askQuestion(question: string, topic?: string, conversationHistory?: any[]): Promise<RAGResponse> {
    try {
      console.log(`🤔 Research question: "${question}"`);
      
      // Step 1: Analyze the question type
      const questionAnalysis = await this.analyzeQuestion(question);
      console.log(`📊 Question type: ${questionAnalysis.type}, entities: ${questionAnalysis.entities.join(', ')}`);
      
      // Step 2: Retrieve relevant papers using hybrid search
      const searchResults = await neo4jService.hybridSearch(question, 10, topic);
      console.log(`📚 Found ${searchResults.combinedResults.length} relevant papers`);
      
      // Step 3: Get full content for top papers
      const papersWithContent = await this.getPapersFullContent(searchResults.combinedResults.slice(0, 5));
      console.log(`📖 Retrieved content for ${papersWithContent.length} papers`);
      
      // Step 4: Extract relevant passages
      const relevantPassages = await this.extractRelevantPassages(papersWithContent, question);
      console.log(`✂️ Extracted ${relevantPassages.length} relevant passages`);
      
      // Step 5: Generate answer with context
      const answer = await this.generateAnswer(question, relevantPassages, questionAnalysis, conversationHistory);
      console.log(`💡 Generated answer (${answer.answer.length} chars)`);
      
      // Step 6: Generate follow-up questions
      const suggestedQuestions = await this.generateFollowUpQuestions(question, answer.answer, papersWithContent);
      
      return {
        answer: answer.answer,
        sources: papersWithContent.map(p => ({
          id: p.id,
          title: p.title,
          authors: p.authors,
          year: p.year,
          citationCount: p.citationCount,
          relevance: p.similarity || p.relevance || p.combinedScore,
          url: p.url
        })),
        context: {
          relevantPapers: papersWithContent,
          searchQuery: question,
          searchType: 'hybrid',
          totalPapersFound: searchResults.combinedResults.length,
          confidence: this.calculateConfidence(papersWithContent, relevantPassages)
        },
        suggestedQuestions,
        reasoning: answer.reasoning
      };
      
    } catch (error) {
      console.error('❌ Error in RAG pipeline:', error);
      
      // Fallback response
      return {
        answer: "I apologize, but I encountered an error while searching through the research papers. Please try rephrasing your question or check if the research database is available.",
        sources: [],
        context: {
          relevantPapers: [],
          searchQuery: question,
          searchType: 'error',
          totalPapersFound: 0,
          confidence: 0
        },
        suggestedQuestions: [
          "Can you help me find papers on machine learning?",
          "What research topics are available in the database?",
          "Show me highly cited papers in the system"
        ],
        reasoning: "Error in processing - using fallback response"
      };
    }
  }

  // ✅ ANALYZE QUESTION TYPE for better search strategy
  private async analyzeQuestion(question: string): Promise<{
    type: string;
    entities: string[];
    searchTerms: string[];
    intent: string;
  }> {
    try {
      const analysisPrompt = `
Analyze this research question and extract key information:

Question: "${question}"

Provide JSON response with:
{
  "type": "factual|comparative|trend|methodology|citation|author",
  "entities": ["key terms and concepts"],
  "searchTerms": ["optimized search terms"], 
  "intent": "what the user wants to accomplish"
}

Focus on technical terms, research areas, author names, and methodologies.
`;

      const response = await groqService.generateCompletion(analysisPrompt, {
        maxTokens: 300,
        temperature: 0.1
      });

      try {
        const analysis = JSON.parse(response);
        return {
          type: analysis.type || 'factual',
          entities: analysis.entities || [],
          searchTerms: analysis.searchTerms || [question],
          intent: analysis.intent || 'general research query'
        };
      } catch (parseError) {
        console.warn('⚠️ Failed to parse question analysis, using fallback');
        return {
          type: 'factual',
          entities: this.extractSimpleEntities(question),
          searchTerms: [question],
          intent: 'research query'
        };
      }
      
    } catch (error) {
      console.warn('⚠️ Question analysis failed, using simple extraction:', error);
      return {
        type: 'factual', 
        entities: this.extractSimpleEntities(question),
        searchTerms: [question],
        intent: 'research query'
      };
    }
  }

  // Simple entity extraction fallback
  private extractSimpleEntities(question: string): string[] {
    const stopWords = new Set(['what', 'how', 'where', 'when', 'why', 'who', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    return question.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 5);
  }

  // ✅ CHANGED: private → protected so AdvancedRAGService can access it
  protected async getPapersFullContent(papers: any[]): Promise<any[]> {
    const papersWithContent = [];
    
    for (const paper of papers) {
      try {
        // Get content from your database
        const content = await neo4jService.getPaperFullContent(paper.id);
        
        papersWithContent.push({
          ...paper,
          fullContent: content.content,
          contentType: content.contentType,
          hasFullContent: content.hasFullContent
        });
        
      } catch (error) {
        console.warn(`⚠️ Could not get content for paper ${paper.id}:`, error);
        // Include paper without full content
        papersWithContent.push({
          ...paper,
          fullContent: paper.abstract || '',
          contentType: 'text/plain',
          hasFullContent: false
        });
      }
    }
    
    return papersWithContent;
  }

  // ✅ CHANGED: private → protected so AdvancedRAGService can access it
  protected async extractRelevantPassages(papers: any[], question: string): Promise<any[]> {
    const passages = [];
    
    for (const paper of papers) {
      if (paper.fullContent && paper.hasFullContent) {
        try {
          // For text content, extract relevant chunks
          if (paper.contentType === 'text/plain' && typeof paper.fullContent === 'string') {
            const chunks = this.chunkText(paper.fullContent, 500); // 500-word chunks
            
            for (const chunk of chunks) {
              const relevance = this.calculateTextRelevance(chunk, question);
              
              if (relevance > 0.3) { // Threshold for relevance
                passages.push({
                  paperId: paper.id,
                  paperTitle: paper.title,
                  content: chunk,
                  relevance: relevance,
                  source: 'full_text'
                });
              }
            }
          } else {
            // For PDFs or when we don't have full text, use abstract
            passages.push({
              paperId: paper.id,
              paperTitle: paper.title,
              content: paper.abstract || 'Abstract not available',
              relevance: 0.8, // High relevance for abstracts
              source: 'abstract'
            });
          }
        } catch (error) {
          console.warn(`⚠️ Error processing content for ${paper.id}:`, error);
        }
      } else {
        // Use abstract as fallback
        passages.push({
          paperId: paper.id,
          paperTitle: paper.title,
          content: paper.abstract || 'Content not available',
          relevance: 0.5,
          source: 'abstract'
        });
      }
    }
    
    // Sort by relevance and return top passages
    return passages
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10); // Top 10 most relevant passages
  }

  // Chunk text into manageable pieces
  private chunkText(text: string, maxWords: number): string[] {
    const words = text.split(/\s+/);
    const chunks = [];
    
    for (let i = 0; i < words.length; i += maxWords) {
      const chunk = words.slice(i, i + maxWords).join(' ');
      if (chunk.trim().length > 50) { // Only include substantial chunks
        chunks.push(chunk);
      }
    }
    
    return chunks;
  }

  // Calculate text relevance (simple keyword matching)
  private calculateTextRelevance(text: string, question: string): number {
    const questionTerms = question.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const textLower = text.toLowerCase();
    
    let matches = 0;
    let totalTerms = questionTerms.length;
    
    questionTerms.forEach(term => {
      if (textLower.includes(term)) {
        matches++;
      }
    });
    
    return totalTerms > 0 ? matches / totalTerms : 0;
  }

  // ✅ GENERATE ANSWER using retrieved context
  private async generateAnswer(
    question: string, 
    passages: any[], 
    questionAnalysis: any,
    conversationHistory?: any[]
  ): Promise<{ answer: string; reasoning: string }> {
    
    // Build context from passages
    const contextText = passages.map((passage, index) => 
      `[Source ${index + 1}: ${passage.paperTitle}]\n${passage.content}`
    ).join('\n\n');

    // Build conversation context
    const conversationContext = conversationHistory?.slice(-3).map(item => 
      `User: ${item.question}\nAssistant: ${item.answer}`
    ).join('\n\n') || '';

    const prompt = `
You are an AI research assistant with access to a comprehensive database of research papers. Answer the user's question using ONLY the provided research context.

QUESTION: ${question}

QUESTION ANALYSIS:
- Type: ${questionAnalysis.type}
- Key entities: ${questionAnalysis.entities.join(', ')}
- Intent: ${questionAnalysis.intent}

${conversationContext ? `CONVERSATION HISTORY:\n${conversationContext}\n\n` : ''}

RESEARCH CONTEXT FROM PAPERS:
${contextText}

INSTRUCTIONS:
1. Answer directly and accurately based on the research context provided
2. Cite specific papers when making claims (use paper titles)
3. If the context doesn't contain enough information, clearly state limitations
4. Provide specific details, methodologies, and findings when available
5. Be conversational but academically rigorous
6. If comparing methods/approaches, present balanced views
7. Highlight any conflicting findings or debates in the literature

IMPORTANT: Base your answer ONLY on the provided research context. Don't make claims beyond what's supported by the papers.

ANSWER:`;

    try {
      const response = await groqService.generateCompletion(prompt, {
        maxTokens: 800,
        temperature: 0.3
      });

      // Generate reasoning
      const reasoningPrompt = `
Based on the research question and your answer, briefly explain your reasoning process:

Question: ${question}
Answer: ${response}

Provide a short explanation of:
1. What sources you relied on most heavily
2. Any limitations in the available research
3. The confidence level of your answer

Reasoning:`;

      const reasoning = await groqService.generateCompletion(reasoningPrompt, {
        maxTokens: 200,
        temperature: 0.2
      });

      return {
        answer: response.trim(),
        reasoning: reasoning.trim()
      };
      
    } catch (error) {
      console.error('❌ Error generating answer:', error);
      return {
        answer: "I found relevant research papers but encountered an error while generating a comprehensive answer. The papers in your database contain information about your question, but I'm unable to process it fully at the moment.",
        reasoning: "Answer generation failed due to LLM service error"
      };
    }
  }

  // ✅ GENERATE FOLLOW-UP QUESTIONS
  private async generateFollowUpQuestions(question: string, answer: string, papers: any[]): Promise<string[]> {
    try {
      const paperTitles = papers.slice(0, 3).map(p => p.title).join(', ');
      
      const prompt = `
Based on this research question and answer, generate 3 good follow-up questions that would help the user explore the topic deeper:

Original Question: ${question}
Answer: ${answer}
Related Papers: ${paperTitles}

Generate follow-up questions that:
1. Explore related aspects of the topic
2. Ask about methodology or applications
3. Connect to other research areas
4. Investigate specific findings mentioned

Format as simple questions, one per line:`;

      const response = await groqService.generateCompletion(prompt, {
        maxTokens: 200,
        temperature: 0.5
      });

      return response.split('\n')
        .filter((line: string) => line.trim().length > 10)
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .slice(0, 3);
        
    } catch (error) {
      console.warn('⚠️ Error generating follow-up questions:', error);
      return [
        "Can you tell me more about the methodologies used in these studies?",
        "What are the practical applications of these research findings?",
        "Are there any recent developments in this research area?"
      ];
    }
  }

  // Calculate confidence based on search results
  private calculateConfidence(papers: any[], passages: any[]): number {
    if (papers.length === 0) return 0;
    
    const factors = {
      paperCount: Math.min(papers.length / 5, 1) * 0.3, // Up to 5 papers = full score
      averageRelevance: (papers.reduce((sum, p) => sum + (p.similarity || p.relevance || p.combinedScore || 0), 0) / papers.length) * 0.4,
      passageCount: Math.min(passages.length / 5, 1) * 0.2, // Up to 5 passages = full score
      contentAvailability: papers.filter(p => p.hasFullContent).length / papers.length * 0.1
    };
    
    const confidence = Object.values(factors).reduce((sum, val) => sum + val, 0);
    return Math.round(confidence * 100);
  }

  // ✅ SPECIALIZED SEARCH METHODS

  // Find papers by specific authors
  async findPapersByAuthor(authorName: string, limit: number = 10): Promise<any[]> {
    return await neo4jService.keywordSearch(authorName, limit);
  }

  // Find citation relationships
  async findCitationNetwork(paperId: string, depth: number = 2): Promise<any> {
    // This would traverse your citation graph
    // Implementation depends on how you store citation relationships
    return {
      centerPaper: paperId,
      citedBy: [],
      cites: [],
      relatedPapers: []
    };
  }

  // Get research trends over time
  async getResearchTrends(topic: string, startYear?: number, endYear?: number): Promise<any> {
    // Implementation for temporal analysis
    return {
      topic,
      timeRange: `${startYear || 2020}-${endYear || 2024}`,
      paperCounts: [],
      topAuthors: [],
      keyDevelopments: []
    };
  }
}

export default new GraphRAGService();
