/**
 * Policy Retriever API Client
 * 
 * TypeScript client for interacting with the government schemes backend API.
 * Provides type-safe methods for searching, filtering, and retrieving schemes.
 */

export interface Scheme {
  id: number;
  scheme_name: string;
  slug: string;
  details: string;
  benefits: string;
  eligibility: string;
  application: string;
  documents: string;
  level: string;
  schemeCategory: string;
  tags: string;
}

export interface SearchParams {
  query: string;
  limit?: number;
}

export interface FilterParams {
  category?: string;
  level?: string;
  tags?: string;
  limit?: number;
}

export interface AdvancedSearchParams extends FilterParams {
  query?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface SearchResponse {
  query: string;
  results: Scheme[];
  count: number;
  timestamp: string;
}

export interface FilterResponse {
  filters: FilterParams;
  results: Scheme[];
  count: number;
  timestamp: string;
}

export interface PaginatedResponse {
  data: Scheme[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    pages: number;
  };
  timestamp: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  schemes_loaded: number;
  timestamp: string;
}

export interface MetadataResponse {
  metadata: {
    total: number;
    categories: string[];
    levels: string[];
    timestamp: string;
  };
}

export interface StatisticsResponse {
  total_schemes: number;
  by_category: Array<[string, number]>;
  by_level: Array<[string, number]>;
  timestamp: string;
}

/**
 * API Client for Government Schemes Policy Retriever
 * 
 * Usage:
 *   const client = new PolicyRetrieverClient('http://localhost:5000');
 *   const results = await client.search('education scholarship');
 */
export class PolicyRetrieverClient {
  private baseURL: string;
  private defaultLimit: number = 50;

  constructor(baseURL: string = 'http://localhost:5000') {
    this.baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Check if API server is healthy
   */
  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('GET', '/api/health');
  }

  /**
   * Get all schemes (paginated)
   */
  async getSchemes(params?: PaginationParams): Promise<PaginatedResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());

    const queryStr = query.toString();
    const url = `/api/schemes${queryStr ? '?' + queryStr : ''}`;
    return this.request<PaginatedResponse>('GET', url);
  }

  /**
   * Search for schemes by query
   * Searches across scheme names, details, benefits, and tags
   * 
   * @param query Search term
   * @param limit Maximum results to return
   * @returns Search results with relevance scores
   */
  async search(query: string, limit?: number): Promise<SearchResponse> {
    return this.request<SearchResponse>('POST', '/api/schemes/search', {
      query,
      limit: limit || this.defaultLimit,
    });
  }

  /**
   * Filter schemes by category, level, and/or tags
   * All filters use AND logic (must match all specified filters)
   * 
   * @param params Filter criteria
   * @returns Filtered results
   */
  async filter(params: FilterParams): Promise<FilterResponse> {
    return this.request<FilterResponse>('POST', '/api/schemes/filter', {
      category: params.category,
      level: params.level,
      tags: params.tags,
      limit: params.limit || this.defaultLimit,
    });
  }

  /**
   * Get a single scheme by slug
   * 
   * @param slug Scheme slug
   * @returns Scheme details
   */
  async getSchemeBySlug(slug: string): Promise<Scheme> {
    return this.request<Scheme>('GET', `/api/schemes/${slug}`);
  }

  /**
   * Get all schemes for a specific category
   * 
   * @param category Category name (URL encoded)
   * @returns Paginated schemes in category
   */
  async getByCategory(category: string): Promise<PaginatedResponse> {
    return this.request<PaginatedResponse>(
      'GET',
      `/api/schemes/category/${encodeURIComponent(category)}`
    );
  }

  /**
   * Get all schemes for a specific government level
   * 
   * @param level Government level (Central, State, Union Territory)
   * @returns Paginated schemes at level
   */
  async getByLevel(level: string): Promise<PaginatedResponse> {
    return this.request<PaginatedResponse>(
      'GET',
      `/api/schemes/level/${encodeURIComponent(level)}`
    );
  }

  /**
   * Get available categories and levels
   */
  async getMetadata(): Promise<MetadataResponse> {
    return this.request<MetadataResponse>('GET', '/api/metadata');
  }

  /**
   * Get statistics about scheme distribution
   */
  async getStatistics(): Promise<StatisticsResponse> {
    return this.request<StatisticsResponse>('GET', '/api/schemes/statistics');
  }

  /**
   * Advanced search with multiple filters
   * Combines search query with category, level, and tag filters
   * 
   * @param params Search and filter criteria
   * @returns Filtered search results
   */
  async advancedSearch(params: AdvancedSearchParams): Promise<FilterResponse> {
    return this.request<FilterResponse>('POST', '/api/schemes/advanced-search', {
      query: params.query,
      category: params.category,
      level: params.level,
      tags: params.tags,
      limit: params.limit || this.defaultLimit,
    });
  }

  /**
   * Make HTTP request to API
   * @private
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: Record<string, any>
  ): Promise<T> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(
          `API Error: ${response.status} ${response.statusText} at ${endpoint}`
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Policy Retriever API Error: ${error.message}`);
      }
      throw error;
    }
  }
}

/**
 * Singleton instance for convenience
 */
export const policyRetrieverAPI = new PolicyRetrieverClient();

/**
 * Hook for React usage
 * @example
 *   const { data, loading, error } = usePolicyRetrieverAPI();
 */
export function usePolicyRetrieverAPI() {
  const [data, setData] = React.useState<Scheme[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const search = React.useCallback(async (query: string, limit?: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await policyRetrieverAPI.search(query, limit);
      setData(result.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const filter = React.useCallback(async (params: FilterParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await policyRetrieverAPI.filter(params);
      setData(result.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, search, filter };
}
