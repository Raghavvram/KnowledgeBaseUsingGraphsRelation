import { Driver } from 'neo4j-driver';
declare class Neo4jService {
    protected driver: Driver | null;
    protected connected: boolean;
    constructor();
    /**
     * Safely converts Neo4j Integer values to regular JavaScript numbers
     * Handles both Neo4j Integer objects and regular numbers
     */
    private safeToNumber;
    private connect;
    /**
     * Generates high-quality embeddings using TF-IDF and semantic features
     * This works entirely locally without requiring external APIs
     */
    generateEmbeddings(text: string): Promise<number[]>;
    /**
     * Enhanced local embedding generator using TF-IDF and semantic features
     * This creates much better embeddings than the simple hash approach
     */
    private generateEnhancedEmbedding;
    /**
     * Generate n-grams from word array
     */
    private generateNGrams;
    /**
     * Extract semantic features from text
     */
    private extractSemanticFeatures;
    /**
     * Enhanced hash function with better distribution
     */
    private enhancedHash;
    /**
     * Simple fallback embedding (keep existing for compatibility)
     */
    private generateSimpleEmbedding;
    /**
     * Simple hash function (keep existing)
     */
    private simpleHash;
    /**
     * Stores a single paper with its full content (if provided) and generated embeddings.
     */
    storePaperWithEmbeddings(paper: any, topic: string, fileContent?: Buffer | string): Promise<void>;
    /**
     * Stores a research graph (papers and relationships), including full content and embeddings for papers.
     * This method was part of the original code and then updated by the instructions.
     * The instruction version calls `this.storePaperWithContent`.
     * The original code had `storeResearchGraphWithContent` which called `storePaperWithEmbeddings`.
     * I will use the structure from the instructions.
     */
    storeResearchGraph(papers: any[], relationships: any[], topic: string, paperFiles?: Map<string, Buffer | string>): Promise<void>;
    /**
     * Backward compatibility: The previous file had a `storeResearchGraph` that called `storeResearchGraphWithContent`.
     * The new instructions *redefine* `storeResearchGraph`. The old `storeResearchGraphWithContent` is not in the new instructions.
     * I will keep `storeResearchGraph` as defined by the new instructions.
     * The original `storeResearchGraphWithContent` (from the file provided by user) is effectively replaced by the logic inside the new `storeResearchGraph`
     * combined with the new `storePaperWithContent` helper, although it no longer directly handles embeddings itself within this flow.
     */
    private storePaperWithContent;
    /**
     * Updates an existing paper with new file content.
     * This method focuses on content, not embeddings.
     */
    updatePaperWithContent(paperId: string, fileContent: Buffer | string, contentType: string): Promise<void>;
    /**
     * Updates paper node with local file path information.
     */
    updatePaperLocalFile(paperId: string, localFilePath: string, fileSize: number): Promise<void>;
    /**
     * Bulk stores downloaded file contents into existing paper nodes in Neo4j.
     */
    bulkStoreFileContents(downloadResults: Array<{
        paperId: string;
        status: string;
        filePath?: string;
    }>): Promise<void>;
    /**
     * Adds embeddings to existing papers in batches that don't have them.
     */
    addEmbeddingsToExistingPapers(batchSize?: number): Promise<void>;
    /**
     * Gets full paper content (decoded) directly from the database.
     */
    getPaperFullContentFromDatabase(paperId: string): Promise<{
        paperId: string;
        title: string | null;
        content: Buffer | string | null;
        contentType: string | null;
        hasFullContent: boolean;
        originalSize: number;
    }>;
    getPaperFullContent(paperId: string): Promise<{
        paperId: string;
        title: string;
        content: Buffer | string | null;
        contentType: string | null;
        hasFullContent: boolean;
        originalSize: number;
    }>;
    /**
     * Gets papers that have full content stored, optionally filtered by topic.
     */
    getPapersWithFullContent(topic?: string): Promise<any[]>;
    getLocalFilePath(paperId: string): Promise<string | null>;
    getPapersByTopic(topic: string, limit?: number): Promise<any[]>;
    /**
     * Gets papers that have an associated local file, optionally filtered by topic.
     */
    getPapersWithLocalFiles(topic?: string): Promise<any[]>;
    /**
     * Performs keyword search on papers (title, abstract, keywords, authors).
     */
    keywordSearch(queryText: string, limit?: number, topic?: string): Promise<any[]>;
    /**
     * Performs semantic search using vector similarity on paper embeddings.
     * Note: This method was listed for replacement in the instructions,
     * but the replacement code was not provided in the 'second artifact' (code 2).
     * Therefore, this method remains unchanged from the original 'code 1'.
     * The new embedding logic in `generateEmbeddings` will produce different embeddings,
     * which this search method will then use.
     */
    semanticSearch(queryText: string, limit?: number, topic?: string): Promise<any[]>;
    /**
     * Performs graph-based search to find papers related through connections.
     */
    graphSearch(queryText: string, limit?: number, topic?: string): Promise<any[]>;
    /**
     * Combines results from semantic, keyword, and graph searches.
     */
    private combineSearchResults;
    /**
     * Performs a hybrid search combining semantic, keyword, and graph-based approaches.
     */
    hybridSearch(queryText: string, limit?: number, topic?: string): Promise<{
        semanticResults: any[];
        keywordResults: any[];
        graphResults: any[];
        combinedResults: any[];
    }>;
    /**
     * Gets statistics about downloaded files (papers with localFilePath).
     */
    getDownloadStats(): Promise<any>;
    /**
     * Gets general database statistics (node counts).
     */
    getDatabaseStorageStats(): Promise<any>;
    /**
     * Gets statistics about paper embeddings.
     */
    getEmbeddingStats(): Promise<any>;
    /**
    * Gets general database statistics (node counts).
    */
    getDatabaseStats(): Promise<any>;
    /**
     * Closes the Neo4j driver connection.
     */
    close(): Promise<void>;
}
declare const _default: Neo4jService;
export default _default;
//# sourceMappingURL=neo4jService.d.ts.map