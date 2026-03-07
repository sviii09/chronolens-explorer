import { useState, useRef } from 'react';
import { Send, Loader2, Info, ChevronDown, ChevronUp, AlertCircle, User, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CategoryBadge } from '@/components/ui/category-badge';
import { cn } from '@/lib/utils';
import { policyCategories } from '@/data/mockData';
import { PolicyCategory } from '@/types/policy';
import { queryRag, mapCategory, RagDocument, RagResponse, ApiError } from '@/api/client';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USER_ROLES = [
  { id: 'public', label: 'Public', icon: '👤', description: 'Top 3 results' },
  { id: 'researcher', label: 'Researcher', icon: '🔬', description: 'Top 7 results' },
  { id: 'government_official', label: 'Gov. Official', icon: '🏛️', description: 'Top 10 results' },
] as const;

type UserRole = 'public' | 'researcher' | 'government_official';

const EXAMPLE_QUERIES = [
  'Which schemes are available for women entrepreneurs?',
  'What education scholarships are available for SC/ST students?',
  'List healthcare schemes for rural populations',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function QueryRetrieval() {
  const [query, setQuery] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('public');
  const [isLoading, setIsLoading] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<PolicyCategory[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());

  // API results
  const [retrievedDocs, setRetrievedDocs] = useState<RagDocument[]>([]);
  const [summary, setSummary] = useState('');
  const [streamingComplete, setStreamingComplete] = useState(false);
  const [apiMeta, setApiMeta] = useState<RagResponse['metadata'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const docRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const toggleCategory = (category: PolicyCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const toggleExpand = (docId: string) => {
    setExpandedDocs((prev) => {
      const next = new Set(prev);
      next.has(docId) ? next.delete(docId) : next.add(docId);
      return next;
    });
  };

  const streamText = (fullText: string) => {
    let currentIndex = 0;
    setSummary('');
    setStreamingComplete(false);
    const interval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setSummary(fullText.slice(0, currentIndex + 6));
        currentIndex += 6;
      } else {
        clearInterval(interval);
        setStreamingComplete(true);
      }
    }, 18);
  };

  const handleSubmit = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setHasResults(false);
    setError(null);
    setSummary('');
    setStreamingComplete(false);
    setRetrievedDocs([]);
    setApiMeta(null);

    try {
      const data = await queryRag(query, userRole, null);
      setRetrievedDocs(data.retrieved_documents);
      setApiMeta(data.metadata);
      setHasResults(true);
      streamText(data.generated_answer);
    } catch (err: unknown) {
      let message = 'An unexpected error occurred.';
      if (err instanceof Error) {
        message = err.message;
      } else if (err instanceof ApiError) {
        message = err.message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCitationClick = (citationNum: number) => {
    const doc = retrievedDocs[citationNum - 1];
    if (doc) {
      setSelectedDocId(doc.id);
      setExpandedDocs((prev) => new Set([...prev, doc.id]));
      docRefs.current[doc.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Parse [1] [2] citations in generated_answer into clickable buttons
  const renderSummary = (text: string) => {
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        const num = parseInt(match[1]);
        return (
          <button
            key={i}
            onClick={() => handleCitationClick(num)}
            className="text-primary font-semibold hover:underline"
          >
            [{num}]
          </button>
        );
      }
      return part;
    });
  };

  // Category badge helper — map RAG category string to PolicyCategory if possible
  const toCategory = (cat: string): PolicyCategory => {
    return mapCategory(cat) as PolicyCategory;
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground-strong">Query &amp; Retrieve</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ask analytical questions about Indian government policy schemes — powered by RAG
        </p>
      </div>

      {/* Query Input Section */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        {/* Role selector */}
        <div className="flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground mr-1">Access role:</span>
          <div className="flex gap-2">
            {USER_ROLES.map((role) => (
              <button
                key={role.id}
                id={`role-btn-${role.id}`}
                onClick={() => setUserRole(role.id as UserRole)}
                title={role.description}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-md border transition-all font-medium',
                  userRole === role.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-secondary text-secondary-foreground border-border hover:border-primary/60'
                )}
              >
                {role.icon} {role.label}
              </button>
            ))}
          </div>
        </div>

        <Textarea
          id="query-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
          }}
          placeholder="Ask about a government scheme (e.g. 'Which schemes help rural women start businesses?')"
          className="min-h-[100px] mb-4 resize-none"
        />

        {/* Category filters */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Categories:</span>
            <div className="flex flex-wrap gap-1">
              {policyCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-md transition-colors border',
                    selectedCategories.includes(cat.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary text-secondary-foreground border-border hover:border-primary'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Ctrl + Enter to submit</span>
          <Button id="submit-query-btn" onClick={handleSubmit} disabled={isLoading || !query.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Retrieving…
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Retrieve Documents
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">Backend Error</p>
            <p className="text-xs text-destructive/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {hasResults && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Panel — Retrieved Documents */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground-strong">
                Retrieved Documents
                <span className="ml-2 text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  {retrievedDocs.length} results
                </span>
              </h2>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {retrievedDocs.map((doc, idx) => (
                <div
                  key={doc.id}
                  ref={(el) => (docRefs.current[doc.id] = el)}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={cn(
                    'bg-card border rounded-lg p-4 cursor-pointer transition-all',
                    selectedDocId === doc.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <CategoryBadge category={toCategory(doc.category)} />
                    <span className="text-xs text-muted-foreground ml-auto font-mono">
                      {doc.relevance_score}% match
                    </span>
                  </div>

                  {/* Citation number badge */}
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm font-medium text-foreground-strong mb-1">{doc.title}</h3>
                  </div>

                  <p className="text-xs text-muted-foreground mb-2 pl-7">{doc.source}</p>

                  {doc.tags && (
                    <p className="text-xs text-muted-foreground/70 mb-2 pl-7 truncate">
                      🏷 {doc.tags}
                    </p>
                  )}

                  {/* Expandable chunk */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(doc.id);
                    }}
                    className="flex items-center gap-1 text-xs text-primary hover:underline pl-7"
                  >
                    {expandedDocs.has(doc.id) ? (
                      <>
                        <ChevronUp className="h-3 w-3" />
                        Hide matched text
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" />
                        Show matched text
                      </>
                    )}
                  </button>

                  {expandedDocs.has(doc.id) && (
                    <p className="text-xs text-muted-foreground italic mt-2 p-2 bg-secondary rounded leading-relaxed">
                      {doc.matched_chunk}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel — Generated Answer */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-semibold text-foreground-strong">Analysis Summary</h2>
              <div className="group relative">
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                <div className="absolute left-0 top-6 bg-popover border border-border rounded-lg p-2 text-xs text-popover-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity w-56 z-10">
                  AI-generated answer from the RAG pipeline. Click [N] citations to highlight the
                  source document.
                </div>
              </div>
            </div>

            <div className="bg-synthesis rounded-lg p-6">
              <p className="text-sm text-synthesis-foreground leading-relaxed whitespace-pre-line">
                {renderSummary(summary)}
                {!streamingComplete && (
                  <span className="inline-block w-2 h-4 bg-synthesis-foreground/50 animate-pulse ml-0.5" />
                )}
              </p>
            </div>

            {streamingComplete && apiMeta && (
              <div className="flex items-center gap-2 mt-3">
                <Zap className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Generated in {apiMeta.latency_ms.toLocaleString()}ms · {apiMeta.num_docs} docs ·{' '}
                  Role: <span className="font-medium">{apiMeta.role}</span> ·{' '}
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasResults && !isLoading && !error && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary rounded-full mb-4">
            <Send className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground-strong mb-2">Ask a policy question</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Enter a question above to retrieve relevant Indian government scheme documents and get
            an AI-generated answer.
          </p>
          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            <p>Try asking:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLE_QUERIES.map((example) => (
                <button
                  key={example}
                  onClick={() => setQuery(example)}
                  className="px-3 py-1.5 bg-secondary rounded-md hover:bg-secondary/80 transition-colors text-left"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
