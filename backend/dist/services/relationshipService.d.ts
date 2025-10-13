export interface PaperRelationship {
    sourceId: string;
    targetId: string;
    relationshipType: 'citation' | 'content' | 'author' | 'temporal' | 'venue';
    strength: number;
    metadata?: {
        sharedKeywords?: string[];
        authorOverlap?: string[];
        citationCount?: number;
        yearDifference?: number;
        venueMatch?: boolean;
    };
}
export interface Paper {
    id: string;
    title: string;
    authors: string[];
    abstract?: string;
    year?: number;
    venue?: string;
    citationCount?: number;
    references?: string[];
    citations?: string[];
}
export declare class RelationshipService {
    static analyzeRelationships(papers: Paper[]): PaperRelationship[];
    private static stratifiedSample;
    private static buildAuthorIndex;
    private static buildVenueIndex;
    private static buildKeywordIndex;
    private static extractKeywords;
    private static findAuthorRelationships;
    private static findVenueRelationships;
    private static findContentRelationships;
    private static findTemporalRelationships;
    private static findCitationRelationships;
    private static deduplicateRelationships;
    private static rankRelationships;
}
//# sourceMappingURL=relationshipService.d.ts.map