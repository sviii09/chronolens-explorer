export type PolicyCategory = 
  | 'womens'
  | 'education'
  | 'healthcare'
  | 'transport'
  | 'taxation';

export type DocumentType = 
  | 'regulation'
  | 'report'
  | 'statement'
  | 'legislation'
  | 'white_paper';

export type SourceType = 
  | 'government'
  | 'research_institute'
  | 'ngo'
  | 'international_org';

export interface PolicyDocument {
  id: string;
  title: string;
  category: PolicyCategory;
  source: string;
  sourceType: SourceType;
  publishedAt: string;
  type: DocumentType;
  excerpt?: string;
  content?: string;
  chunks?: DocumentChunk[];
  metadata?: DocumentMetadata;
}

export interface DocumentChunk {
  id: string;
  sectionName?: string;
  content: string;
  charCount: number;
}

export interface DocumentMetadata {
  documentId: string;
  originalUrl?: string;
  ingestedAt: string;
  chunkCount: number;
  rawLength: number;
  cleanedLength: number;
}

export interface PolicyCategoryInfo {
  id: PolicyCategory;
  name: string;
  documentCount: number;
  color: string;
}

export interface SourceInfo {
  name: string;
  type: SourceType;
  documentCount: number;
  lastContributionDate: string;
}

export interface TimelineDataPoint {
  date: string;
  count: number;
  category?: PolicyCategory;
}

export interface QueryResult {
  documents: RetrievedDocument[];
  summary?: string;
  generatedAt?: string;
  queryLatency?: number;
}

export interface RetrievedDocument extends PolicyDocument {
  relevanceScore: number;
  matchedChunk?: string;
}

export interface SystemMetrics {
  totalDocuments: number;
  totalChunks: number;
  uniqueSources: number;
  lastUpdated: string;
  averageDocumentAge: string;
  dateRange: {
    start: string;
    end: string;
  };
  averageQueryLatency: number;
  queriesToday: number;
  p95Latency: number;
}

export interface CategoryFreshness {
  category: PolicyCategory;
  categoryName: string;
  lastDocumentDate: string;
  status: 'fresh' | 'aging' | 'stale';
}

export interface FilterState {
  dateRange: {
    start?: Date;
    end?: Date;
  };
  categories: PolicyCategory[];
  sourceTypes: SourceType[];
  documentTypes: DocumentType[];
  searchQuery: string;
}
