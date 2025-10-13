export interface RealPaper {
    id: string;
    title: string;
    authors: string[];
    abstract: string;
    year: number;
    citationCount: number;
    venue: string;
    doi?: string;
    url?: string;
    references?: string[];
    citations?: string[];
    storedInDatabase?: boolean;
    keywords?: string[];
    localFilePath?: string;
    hasLocalFile?: boolean;
    fileSize?: number;
    downloadedAt?: string;
}
export interface SearchResults {
    papers: RealPaper[];
    totalFound: number;
    authorsAnalyzed: number;
    connectionsDiscovered: number;
    summary: string;
}
export declare function searchSemanticScholar(topic: string, limit?: number): Promise<RealPaper[]>;
export declare function searchArxivEnhanced(topic: string, limit?: number): Promise<RealPaper[]>;
export declare function generateFallbackPapers(topic: string, count: number): RealPaper[];
export declare function searchRealPapers(topic: string): Promise<SearchResults>;
//# sourceMappingURL=paperSearchService.d.ts.map