import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  systemMetrics,
  categoryFreshness,
  topSources,
  policyCategories,
  generateIngestionData,
} from '@/data/mockData';
import { cn } from '@/lib/utils';
import { PolicyCategory } from '@/types/policy';
import { healthCheck } from '@/api/client';

const categoryColors: Record<PolicyCategory, string> = {
  womens: 'hsl(271, 75%, 69%)',
  education: 'hsl(213, 94%, 68%)',
  healthcare: 'hsl(0, 91%, 71%)',
  transport: 'hsl(27, 96%, 61%)',
  taxation: 'hsl(160, 64%, 52%)',
};

export default function SystemStatus() {
  const ingestionData = generateIngestionData();
  const sortedCategories = [...policyCategories].sort((a, b) => b.documentCount - a.documentCount);

  const [backendStatus, setBackendStatus] = useState<'unknown' | 'ok' | 'error'>('unknown');
  const [backendMessage, setBackendMessage] = useState<string | null>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getLatencyStatus = (latency: number) => {
    if (latency < 400) return { color: 'bg-accent', label: 'Healthy' };
    if (latency < 600) return { color: 'bg-highlight', label: 'Moderate' };
    return { color: 'bg-destructive', label: 'Slow' };
  };

  const getFreshnessColor = (status: string) => {
    switch (status) {
      case 'fresh': return 'bg-accent';
      case 'aging': return 'bg-highlight';
      case 'stale': return 'bg-muted-foreground';
      default: return 'bg-muted-foreground';
    }
  };

  const latencyStatus = getLatencyStatus(systemMetrics.averageQueryLatency);

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const data = await healthCheck();
        if (!isMounted) return;

        setBackendStatus('ok');
        setBackendMessage(data.service || 'ChronoLens RAG Backend');
      } catch (err) {
        if (!isMounted) return;
        setBackendStatus('error');
        setBackendMessage(
          err instanceof Error
            ? err.message
            : 'Unable to reach backend'
        );
      }
    };

    checkHealth();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground-strong">System Status</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor data health and system performance
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 border',
              backendStatus === 'ok'
                ? 'border-emerald-500 text-emerald-600 bg-emerald-500/10'
                : backendStatus === 'error'
                  ? 'border-destructive text-destructive bg-destructive/10'
                  : 'border-border text-muted-foreground bg-secondary',
            )}
          >
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full mr-1.5',
                backendStatus === 'ok'
                  ? 'bg-emerald-500'
                  : backendStatus === 'error'
                    ? 'bg-destructive'
                    : 'bg-muted-foreground',
              )}
            />
            Backend:{' '}
            <span className="ml-1 font-medium">
              {backendStatus === 'ok'
                ? 'Online'
                : backendStatus === 'error'
                  ? 'Unavailable'
                  : 'Checking…'}
            </span>
          </span>
          {backendMessage && (
            <span className="text-[11px] text-muted-foreground truncate max-w-xs">
              {backendMessage}
            </span>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Data Status */}
        <div className="space-y-6">
          {/* Corpus Overview */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-base font-semibold text-foreground-strong mb-4">
              Corpus Overview
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-3xl font-bold text-foreground-strong">
                  {systemMetrics.totalDocuments.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total documents</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground-strong">
                  {systemMetrics.totalChunks.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total chunks</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground-strong">
                  {systemMetrics.uniqueSources}
                </p>
                <p className="text-sm text-muted-foreground">Unique sources</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Last updated:</span>
                <span className="text-foreground-strong">{formatDate(systemMetrics.lastUpdated)}</span>
              </div>
              <div className="flex justify-between">
                <span>Average document age:</span>
                <span className="text-foreground-strong">{systemMetrics.averageDocumentAge}</span>
              </div>
              <div className="flex justify-between">
                <span>Date range:</span>
                <span className="text-foreground-strong">
                  {formatDate(systemMetrics.dateRange.start)} - {formatDate(systemMetrics.dateRange.end)}
                </span>
              </div>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-base font-semibold text-foreground-strong mb-4">
              Category Distribution
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedCategories}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: 'hsl(220, 9%, 43%)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: 'hsl(220, 9%, 43%)' }}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(0, 0%, 100%)',
                      border: '1px solid hsl(220, 13%, 91%)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="documentCount" radius={[0, 4, 4, 0]}>
                    {sortedCategories.map((entry) => (
                      <Cell key={entry.id} fill={categoryColors[entry.id]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ingestion Activity */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-base font-semibold text-foreground-strong mb-4">
              Ingestion Activity (Last 30 Days)
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ingestionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIngestion" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(168, 76%, 42%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(168, 76%, 42%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    tick={{ fontSize: 10, fill: 'hsl(220, 9%, 43%)' }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(220, 13%, 91%)' }}
                    interval={6}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'hsl(220, 9%, 43%)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(0, 0%, 100%)',
                      border: '1px solid hsl(220, 13%, 91%)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [value, 'Documents added']}
                    labelFormatter={formatShortDate}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(168, 76%, 42%)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorIngestion)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column - System Health */}
        <div className="space-y-6">
          {/* Retrieval Performance */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-base font-semibold text-foreground-strong mb-4">
              Retrieval Performance
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-foreground-strong">
                    {systemMetrics.averageQueryLatency}ms
                  </p>
                  <span className={cn("w-2.5 h-2.5 rounded-full", latencyStatus.color)} />
                </div>
                <p className="text-sm text-muted-foreground">Avg latency</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground-strong">
                  {systemMetrics.queriesToday}
                </p>
                <p className="text-sm text-muted-foreground">Queries today</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground-strong">
                  {systemMetrics.p95Latency}ms
                </p>
                <p className="text-sm text-muted-foreground">P95 latency</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={cn("w-2.5 h-2.5 rounded-full", latencyStatus.color)} />
              <span className="text-muted-foreground">System status:</span>
              <span className="text-foreground-strong">{latencyStatus.label}</span>
            </div>
          </div>

          {/* Data Freshness */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-base font-semibold text-foreground-strong mb-4">
              Data Freshness by Category
            </h3>
            <div className="space-y-3">
              {categoryFreshness.map((item) => (
                <div key={item.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn("w-2.5 h-2.5 rounded-full", getFreshnessColor(item.status))} />
                    <span className="text-sm text-foreground">{item.categoryName}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(item.lastDocumentDate)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent" />
                Fresh (&lt;30d)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-highlight" />
                Aging (30-90d)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                Stale (&gt;90d)
              </div>
            </div>
          </div>

          {/* Source Activity */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-base font-semibold text-foreground-strong mb-4">
              Source Activity
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-2">
                      Source
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider pb-2">
                      Documents
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider pb-2">
                      Last Contribution
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topSources.slice(0, 5).map((source) => (
                    <tr key={source.name} className="border-b border-border last:border-0">
                      <td className="py-2.5 text-sm text-foreground">{source.name}</td>
                      <td className="py-2.5 text-sm text-muted-foreground text-right">
                        {source.documentCount}
                      </td>
                      <td className="py-2.5 text-sm text-muted-foreground text-right">
                        {formatDate(source.lastContributionDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
