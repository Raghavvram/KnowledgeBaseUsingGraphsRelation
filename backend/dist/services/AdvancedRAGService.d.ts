import { GraphRAGService } from './graphRagService';
interface ResearchStep {
    id: string;
    question: string;
    reasoning: string;
    findings: any[];
    confidence: number;
    nextSteps: string[];
}
interface MultiStepResult {
    originalQuestion: string;
    steps: ResearchStep[];
    synthesis: string;
    conclusions: string[];
    limitationsAndGaps: string[];
    suggestedResearch: string[];
    sources: any[];
    totalConfidence: number;
}
export declare class AdvancedRAGService extends GraphRAGService {
    conductResearchInvestigation(question: string, topic?: string): Promise<MultiStepResult>;
    private createResearchPlan;
    private executeResearchStep;
    private analyzeStepFindings;
    private synthesizeFindings;
    private analyzeResearchGaps;
    synthesizeResearchTopics(topics: string[], research_focus?: string): Promise<any>;
    private findTopicIntersections;
    analyzeResearchTrends(topic: string, startYear?: number, endYear?: number): Promise<any>;
    private getPapersByYear;
    private calculateStepConfidence;
    private calculateOverallConfidence;
    private deduplicateSources;
    compareResearchMethodologies(methodologies: string[], researchArea: string): Promise<any>;
    private analyzeMethodology;
    private synthesizeMethodologyComparison;
    private analyzeTopicRelationships;
    private generateSynthesisRecommendations;
    private analyzeTrendPatterns;
    private identifyEmergingElements;
}
declare const _default: AdvancedRAGService;
export default _default;
//# sourceMappingURL=AdvancedRAGService.d.ts.map