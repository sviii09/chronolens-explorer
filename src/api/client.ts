/**
 * API Client for ChronoLens Backend
 * Provides typed API endpoints for frontend-backend communication
 */

// Vite exposes environment variables via import.meta.env.VITE_*
// (CRA-style "REACT_APP_" prefixes are not available)
// For development, always use localhost:5000
// For production, detect from current origin or use env variable
function getApiUrl(): string {
  const viteUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (viteUrl) return viteUrl;
  
  // Default to localhost:5000 for local development
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5000';
  }
  
  // For production, use current origin's backend
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }
  
  return 'http://localhost:5000';
}

export const API_BASE = getApiUrl();
// ============================================================================
// Types
// ============================================================================

export interface RagDocument {
  id: string;
  title: string;
  category: string;
  source: string;
  excerpt: string;
  relevance_score: number;
  matched_chunk: string;
  tags: string;
  level: string;
  slug: string;
}

export interface RagResponse {
  retrieved_documents: RagDocument[];
  generated_answer: string;
  metadata: {
    role: string;
    num_docs: number;
    latency_ms: number;
  };
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
}

export interface RolesResponse {
  roles: Array<{
    id: string;
    label: string;
    description: string;
  }>;
}

// ============================================================================
// Error Handling
// ============================================================================

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ============================================================================
// API Client Methods
// ============================================================================

/**
 * Health check — lightweight endpoint to verify backend is running
 */
export async function healthCheck(): Promise<HealthResponse> {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new ApiError(response.status, `Health check failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error(
      error instanceof Error
        ? `Cannot reach backend at ${API_BASE}: ${error.message}`
        : 'Unknown error during health check'
    );
  }
}

/**
 * Get available user roles
 */
export async function fetchRoles(): Promise<RolesResponse> {
  try {
    const response = await fetch(`${API_BASE}/roles`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new ApiError(response.status, `Failed to fetch roles: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error(
      error instanceof Error ? error.message : 'Unknown error fetching roles'
    );
  }
}

/**
 * Submit a RAG query and get retrieved documents + generated answer
 */
export async function queryRag(
  query: string,
  userRole: 'public' | 'researcher' | 'government_official' = 'public',
  timeFilter?: string | null
): Promise<RagResponse> {
  if (!query.trim()) {
    throw new Error('Query cannot be empty');
  }

  try {
    const response = await fetch(`${API_BASE}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query.trim(),
        user_role: userRole,
        time_filter: timeFilter || null,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errorMessage = errData.error || `Server returned ${response.status}`;
      throw new ApiError(response.status, errorMessage, errData);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        throw new Error(
          `Cannot reach the Flask backend at ${API_BASE}. Is it running? (python app.py)`
        );
      }
      throw error;
    }
    throw new Error('Unknown error during query');
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format milliseconds to human-readable latency
 */
export function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Map RAG category strings to PolicyCategory
 */
export function mapCategory(rawCategory: string): string {
  const categoryMap: Record<string, string> = {
    women: 'womens',
    education: 'education',
    health: 'healthcare',
    healthcare: 'healthcare',
    transport: 'transport',
    tax: 'taxation',
    taxation: 'taxation',
  };

  const lowerKey = rawCategory.toLowerCase();
  for (const [key, value] of Object.entries(categoryMap)) {
    if (lowerKey.includes(key)) return value;
  }
  return 'education'; // fallback
}
