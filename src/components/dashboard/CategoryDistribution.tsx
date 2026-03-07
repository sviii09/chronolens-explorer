import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { policyCategories } from '@/data/mockData';
import { PolicyCategory } from '@/types/policy';

const categoryColors: Record<PolicyCategory, string> = {
  womens: 'hsl(271, 75%, 69%)',
  education: 'hsl(213, 94%, 68%)',
  healthcare: 'hsl(0, 91%, 71%)',
  transport: 'hsl(27, 96%, 61%)',
  taxation: 'hsl(160, 64%, 52%)',
};

interface CategoryDistributionProps {
  activeCategory?: PolicyCategory | null;
  onCategoryClick?: (category: PolicyCategory) => void;
}

export function CategoryDistribution({ activeCategory, onCategoryClick }: CategoryDistributionProps) {
  const totalDocs = policyCategories.reduce((sum, cat) => sum + cat.documentCount, 0);
  
  const data = policyCategories
    .map((cat) => ({
      ...cat,
      percentage: Math.round((cat.documentCount / totalDocs) * 100),
    }))
    .sort((a, b) => b.documentCount - a.documentCount);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-base font-semibold text-foreground-strong mb-4">
        Policy Category Distribution
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
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
              width={120}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 100%)',
                border: '1px solid hsl(220, 13%, 91%)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number, name: string, props: any) => [
                `${value} documents (${props.payload.percentage}%)`,
                '',
              ]}
            />
            <Bar
              dataKey="documentCount"
              radius={[0, 4, 4, 0]}
              cursor="pointer"
              onClick={(data) => onCategoryClick?.(data.id)}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.id}
                  fill={
                    activeCategory && activeCategory !== entry.id
                      ? 'hsl(220, 13%, 85%)'
                      : categoryColors[entry.id]
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
