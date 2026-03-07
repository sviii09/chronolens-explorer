import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CategoryBadge } from '@/components/ui/category-badge';
import { recentDocuments } from '@/data/mockData';
import { PolicyCategory } from '@/types/policy';

interface RecentDocumentsProps {
  activeCategory?: PolicyCategory | null;
}

export function RecentDocuments({ activeCategory }: RecentDocumentsProps) {
  const filteredDocs = activeCategory
    ? recentDocuments.filter((doc) => doc.category === activeCategory)
    : recentDocuments;

  const displayDocs = filteredDocs.slice(0, 6);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-base font-semibold text-foreground-strong mb-4">
        Recent Policy Documents
      </h3>
      
      {displayDocs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No documents match current filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayDocs.map((doc) => (
            <div
              key={doc.id}
              className="pb-4 border-b border-border last:border-0 last:pb-0"
            >
              <div className="flex items-start gap-3">
                <CategoryBadge category={doc.category} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground-strong truncate">
                    {doc.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{doc.source}</span>
                    <span>·</span>
                    <span>{formatDate(doc.publishedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link
        to="/explorer"
        className="flex items-center gap-1 text-sm text-primary hover:underline mt-4"
      >
        View all
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
