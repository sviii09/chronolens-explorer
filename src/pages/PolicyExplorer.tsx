import { useState, useMemo } from 'react';
import { Search, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryBadge } from '@/components/ui/category-badge';
import { cn } from '@/lib/utils';
import { allDocuments, policyCategories } from '@/data/mockData';
import { PolicyDocument, PolicyCategory, DocumentType } from '@/types/policy';

const documentTypeLabels: Record<DocumentType, string> = {
  regulation: 'Regulation',
  report: 'Report',
  statement: 'Statement',
  legislation: 'Legislation',
  white_paper: 'White Paper',
};

export default function PolicyExplorer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedDoc, setSelectedDoc] = useState<PolicyDocument | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const filteredDocuments = useMemo(() => {
    return allDocuments.filter((doc) => {
      const matchesSearch = !searchQuery || 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.source.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
      const matchesType = typeFilter === 'all' || doc.type === typeFilter;
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [searchQuery, categoryFilter, typeFilter]);

  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredDocuments.slice(start, start + rowsPerPage);
  }, [filteredDocuments, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredDocuments.length / rowsPerPage);

  const handleApplyFilters = () => {
    const filters: string[] = [];
    if (categoryFilter !== 'all') {
      const cat = policyCategories.find((c) => c.id === categoryFilter);
      if (cat) filters.push(cat.name);
    }
    if (typeFilter !== 'all') {
      filters.push(documentTypeLabels[typeFilter as DocumentType]);
    }
    setActiveFilters(filters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setTypeFilter('all');
    setActiveFilters([]);
    setCurrentPage(1);
  };

  const removeFilter = (filter: string) => {
    const cat = policyCategories.find((c) => c.name === filter);
    if (cat) setCategoryFilter('all');
    
    const type = Object.entries(documentTypeLabels).find(([, label]) => label === filter);
    if (type) setTypeFilter('all');
    
    setActiveFilters((prev) => prev.filter((f) => f !== filter));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Mock document content for detail view
  const getMockContent = (doc: PolicyDocument) => ({
    fullText: `${doc.title}\n\nPublished by ${doc.source} on ${formatDate(doc.publishedAt)}\n\n${doc.excerpt}\n\nSection 1: Introduction\n\nThis document outlines the key policy framework and implementation guidelines. The policy aims to address current challenges and provide a comprehensive approach to solving identified issues.\n\nSection 2: Background\n\nThe policy development process involved extensive stakeholder consultation and evidence-based analysis. Previous policies in this area have been reviewed and their outcomes assessed.\n\nSection 3: Key Provisions\n\nThe main provisions of this policy include:\n- Standardized implementation procedures\n- Clear accountability frameworks\n- Monitoring and evaluation mechanisms\n- Resource allocation guidelines\n\nSection 4: Implementation Timeline\n\nThe policy will be implemented in phases over the next 24 months, with regular progress reviews and adjustments as needed.\n\nSection 5: Conclusion\n\nThis policy represents a significant step forward in addressing the identified challenges. Success will depend on coordinated efforts across all stakeholders.`,
    chunks: [
      { id: 'chunk-1', sectionName: 'Introduction', content: 'This document outlines the key policy framework and implementation guidelines. The policy aims to address current challenges and provide a comprehensive approach to solving identified issues.', charCount: 213 },
      { id: 'chunk-2', sectionName: 'Background', content: 'The policy development process involved extensive stakeholder consultation and evidence-based analysis. Previous policies in this area have been reviewed and their outcomes assessed.', charCount: 189 },
      { id: 'chunk-3', sectionName: 'Key Provisions', content: 'The main provisions of this policy include: Standardized implementation procedures, Clear accountability frameworks, Monitoring and evaluation mechanisms, Resource allocation guidelines.', charCount: 201 },
      { id: 'chunk-4', sectionName: 'Implementation', content: 'The policy will be implemented in phases over the next 24 months, with regular progress reviews and adjustments as needed.', charCount: 124 },
    ],
    metadata: {
      documentId: doc.id,
      originalUrl: 'https://policy.gov/documents/' + doc.id,
      ingestedAt: new Date().toISOString(),
      chunkCount: 4,
      rawLength: 2847,
      cleanedLength: 2156,
    },
  });

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground-strong">Policy Explorer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Showing {filteredDocuments.length} documents
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-card border border-border rounded-lg p-4 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or keyword..."
                className="pl-9"
              />
            </div>
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Policy category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {policyCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Document type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(documentTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button size="sm" onClick={handleApplyFilters}>
            Apply
          </Button>
          <button
            onClick={handleClearFilters}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear filters
          </button>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {activeFilters.map((filter) => (
              <span
                key={filter}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md"
              >
                {filter}
                <button onClick={() => removeFilter(filter)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Title
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Category
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Source
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Date
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Type
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedDocuments.map((doc, i) => (
                <tr
                  key={doc.id}
                  className={cn(
                    "border-b border-border hover:bg-primary/5 transition-colors cursor-pointer",
                    i % 2 === 1 && "bg-secondary/30"
                  )}
                  onClick={() => setSelectedDoc(doc)}
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-foreground-strong line-clamp-1">
                      {doc.title}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <CategoryBadge category={doc.category} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-foreground">{doc.source}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(doc.publishedAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground">
                      {documentTypeLabels[doc.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDoc(doc);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * rowsPerPage + 1}-
              {Math.min(currentPage * rowsPerPage, filteredDocuments.length)} of{' '}
              {filteredDocuments.length}
            </span>
            <Select
              value={rowsPerPage.toString()}
              onValueChange={(v) => {
                setRowsPerPage(Number(v));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8"
                >
                  {page}
                </Button>
              );
            })}
            {totalPages > 5 && (
              <>
                <span className="px-2 text-muted-foreground">...</span>
                <Button
                  variant={currentPage === totalPages ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  className="w-8"
                >
                  {totalPages}
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Document Detail Modal */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {selectedDoc && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-foreground-strong pr-8">
                  {selectedDoc.title}
                </DialogTitle>
                <div className="flex items-center gap-3 mt-2">
                  <CategoryBadge category={selectedDoc.category} />
                  <span className="text-sm text-muted-foreground">
                    {selectedDoc.source} · {formatDate(selectedDoc.publishedAt)}
                  </span>
                </div>
              </DialogHeader>

              <Tabs defaultValue="fulltext" className="flex-1 overflow-hidden flex flex-col">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="fulltext">Full Text</TabsTrigger>
                  <TabsTrigger value="chunks">Chunks</TabsTrigger>
                  <TabsTrigger value="metadata">Metadata</TabsTrigger>
                </TabsList>

                <TabsContent value="fulltext" className="flex-1 overflow-y-auto mt-4">
                  <div className="max-w-prose mx-auto">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                      {getMockContent(selectedDoc).fullText}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="chunks" className="flex-1 overflow-y-auto mt-4">
                  <div className="space-y-4">
                    {getMockContent(selectedDoc).chunks.map((chunk) => (
                      <div
                        key={chunk.id}
                        className="p-4 bg-secondary rounded-lg border border-border"
                      >
                        {chunk.sectionName && (
                          <h4 className="text-sm font-medium text-foreground-strong mb-2">
                            {chunk.sectionName}
                          </h4>
                        )}
                        <p className="text-sm text-foreground">{chunk.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {chunk.charCount} characters
                        </p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="metadata" className="flex-1 overflow-y-auto mt-4">
                  <div className="space-y-3">
                    {Object.entries(getMockContent(selectedDoc).metadata).map(
                      ([key, value]) => (
                        <div key={key} className="flex">
                          <span className="w-40 text-sm text-muted-foreground capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="text-sm text-foreground-strong font-mono">
                            {key === 'originalUrl' ? (
                              <a
                                href={value as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {value as string}
                              </a>
                            ) : (
                              String(value)
                            )}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
