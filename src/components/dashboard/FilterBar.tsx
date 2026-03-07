import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { policyCategories } from '@/data/mockData';
import { cn } from '@/lib/utils';

const quickDateFilters = [
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 6 months', value: '6m' },
  { label: 'Last year', value: '1y' },
  { label: 'All time', value: 'all' },
];

interface FilterBarProps {
  onApplyFilters?: (filters: any) => void;
}

export function FilterBar({ onApplyFilters }: FilterBarProps) {
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleClear = () => {
    setActiveQuickFilter('all');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* Date Range */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-36 h-9"
            placeholder="Start date"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-36 h-9"
            placeholder="End date"
          />
        </div>

        {/* Quick Date Filters */}
        <div className="flex items-center gap-1">
          {quickDateFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveQuickFilter(filter.value)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors",
                activeQuickFilter === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Source Type */}
        <Select>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="Source type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="government">Government</SelectItem>
            <SelectItem value="research">Research Institute</SelectItem>
            <SelectItem value="ngo">NGO</SelectItem>
            <SelectItem value="international">International Org</SelectItem>
          </SelectContent>
        </Select>

        {/* Policy Category */}
        <Select>
          <SelectTrigger className="w-44 h-9">
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

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
          <Button size="sm" onClick={() => onApplyFilters?.({})}>
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
