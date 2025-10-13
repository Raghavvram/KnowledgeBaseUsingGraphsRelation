// File: frontend/src/types/research.ts - Enhanced with download functionality

export type AnalysisState = 'idle' | 'analyzing' | 'building-graph' | 'generating-insights' | 'downloading' | 'complete';

// Create this file: backend/src/types/research.ts

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
  keywords?: string[];
  localFilePath?: string;
  hasLocalFile?: boolean;
  fileSize?: number;
  downloadedAt?: string;
  storedInDatabase?: boolean; // ✅ Add this property
}

export interface PaperData {
  paperId: string;
  type: string;
  content: string | Buffer | null;
  hasFullContent: boolean;
  contentType: string | null;
  originalSize: number;
  title: string;
  source: string;
  downloadUrl?: string; // ✅ Add this property
  message?: string;     // ✅ Add this property
}

export interface KeyFinding {
  title: string;
  description: string;
  impact: string;
}

export interface Insight {
  category: string;
  content: string;
  sources: number;
}

// Enhanced graph data structures for Connected Papers-style visualization
export interface GraphConnection {
  source: string;
  target: string;
  type: 'citation' | 'author' | 'content' | 'temporal';
  strength: number;
}

export interface GraphPaper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  citationCount: number;
  abstract?: string;
  venue?: string;
  url?: string;
  hasLocalFile?: boolean;  // NEW: Indicates if paper is downloaded
  localFilePath?: string;  // NEW: Path to local file
  fileSize?: number;       // NEW: Size of downloaded file
  downloadedAt?: string;   // NEW: When paper was downloaded
}

export interface GraphData {
  papers: GraphPaper[];
  connections: GraphConnection[];
}

// NEW: Download progress tracking
export interface DownloadProgress {
  paperId: string;
  title: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number;
  error?: string;
  filePath?: string;
  fileSize?: number;
}

// NEW: Bulk download result
export interface BulkDownloadResult {
  sessionId: string;
  totalPapers: number;
  completed: number;
  failed: number;
  totalSize: number;
  downloadPaths: string[];
  progress: DownloadProgress[];
}

// NEW: Storage statistics
export interface StorageStats {
  totalPapers: number;
  downloadedPapers: number;
  totalFileSize: number;
  downloadPercentage: number;
  topicBreakdown: {
    topic: string;
    paperCount: number;
    totalSize: number;
    avgSize: number;
  }[];
}

export interface ResultsData {
  papersFound: number;
  authorsAnalyzed: number;
  connectionsDiscovered: number;
  summary: string;
  keyFindings: KeyFinding[];
  insights: Insight[];
  papers?: GraphPaper[];        // Enhanced with download info
  graphData?: GraphData;
  downloadStats?: StorageStats; // NEW: Download statistics
}

// NEW: Search and filter options for local papers
export interface LocalPaperFilter {
  topic?: string;
  hasLocalFile?: boolean;
  sortBy?: 'downloadedAt' | 'fileSize' | 'citationCount' | 'year';
  order?: 'asc' | 'desc';
  searchQuery?: string;
}