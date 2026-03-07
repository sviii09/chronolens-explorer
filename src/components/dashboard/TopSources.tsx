import { topSources } from '@/data/mockData';

export function TopSources() {
  const maxCount = Math.max(...topSources.map((s) => s.documentCount));

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-base font-semibold text-foreground-strong mb-4">
        Top Sources
      </h3>
      <div className="space-y-4">
        {topSources.slice(0, 6).map((source) => (
          <div key={source.name} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground-strong">{source.name}</span>
              <span className="text-xs text-muted-foreground">
                {source.documentCount}
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{
                  width: `${(source.documentCount / maxCount) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
