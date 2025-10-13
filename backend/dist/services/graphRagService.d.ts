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
export declare class GraphRAGService {
    askQuestion(question: string, topic?: string, conversationHistory?: any[]): Promise<RAGResponse>;
    private analyzeQuestion;
    private extractSimpleEntities;
    protected getPapersFullContent(papers: any[]): Promise<any[]>;
    protected extractRelevantPassages(papers: any[], question: string): Promise<any[]>;
    private chunkText;
    private calculateTextRelevance;
    private generateAnswer;
    private generateFollowUpQuestions;
    private calculateConfidence;
    findPapersByAuthor(authorName: string, limit?: number): Promise<any[]>;
    findCitationNetwork(paperId: string, depth?: number): Promise<any>;
    getResearchTrends(topic: string, startYear?: number, endYear?: number): Promise<any>;
}
declare const _default: GraphRAGService;
export default _default;
//# sourceMappingURL=graphRagService.d.ts.map