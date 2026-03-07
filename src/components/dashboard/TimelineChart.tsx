import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { generateTimelineData } from '@/data/mockData';
import { PolicyCategory } from '@/types/policy';

interface TimelineChartProps {
  category?: PolicyCategory | null;
}

export function TimelineChart({ category }: TimelineChartProps) {
  const data = useMemo(() => generateTimelineData(category || undefined), [category]);

  const formatDate = (date: string) => {
    const d = new Date(date + '-01');
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-base font-semibold text-foreground-strong mb-4">
        Policy Activity Timeline
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(168, 76%, 42%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(168, 76%, 42%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12, fill: 'hsl(220, 9%, 43%)' }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(220, 13%, 91%)' }}
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
              formatter={(value: number) => [value, 'Documents']}
              labelFormatter={(label) => formatDate(label)}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="hsl(168, 76%, 42%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCount)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
