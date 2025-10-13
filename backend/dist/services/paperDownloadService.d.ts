export interface DownloadProgress {
    paperId: string;
    title: string;
    status: 'pending' | 'downloading' | 'completed' | 'failed';
    progress: number;
    error?: string;
    filePath?: string | null;
    fileSize?: number;
    storedInDatabase?: boolean;
    contentType?: string;
    downloadStrategy?: string;
}
export interface BulkDownloadResult {
    sessionId: string;
    totalPapers: number;
    completed: number;
    failed: number;
    totalSize: number;
    downloadPaths: string[];
    progress: DownloadProgress[];
    databaseStorageComplete?: boolean;
    pdfDownloaded?: number;
    textCreated?: number;
}
export declare class PaperDownloadService {
    private downloadDir;
    private maxConcurrentDownloads;
    private activeDownloads;
    constructor();
    private ensureDirectoryExists;
    private downloadSinglePaperPDF;
    private tryArxivPDF;
    private trySemanticScholarPDF;
    private tryDoiPDF;
    private tryGenericPDF;
    private createEnhancedTextFile;
    private extractArxivId;
    private generateSafeFilename;
    private generateEnhancedPaperContent;
    private downloadFile;
    private getTopicDirectory;
    downloadAllPapers(papers: any[], topic?: string, storeInDatabase?: boolean): Promise<BulkDownloadResult>;
    getDownloadStats(): any;
    getDatabaseStorageStats(): Promise<any>;
    storeExistingFilesInDatabase(): Promise<void>;
    exportDatabaseContent(outputDir: string): Promise<void>;
    private extractPaperIdFromFilename;
    private calculateDirectorySize;
    downloadAllPapersWithPDFPriority(papers: any[], topic?: string): Promise<any>;
}
declare const _default: PaperDownloadService;
export default _default;
//# sourceMappingURL=paperDownloadService.d.ts.map