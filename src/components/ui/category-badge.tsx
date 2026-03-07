import { cn } from '@/lib/utils';
import { PolicyCategory } from '@/types/policy';

const categoryStyles: Record<PolicyCategory, string> = {
  womens: 'bg-category-womens',
  education: 'bg-category-education',
  healthcare: 'bg-category-healthcare',
  transport: 'bg-category-transport',
  taxation: 'bg-category-taxation',
};

const categoryNames: Record<PolicyCategory, string> = {
  womens: "Women's",
  education: 'Education',
  healthcare: 'Healthcare',
  transport: 'Transport',
  taxation: 'Taxation',
};

interface CategoryBadgeProps {
  category: PolicyCategory;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded text-[11px] font-medium uppercase tracking-wide text-white",
        categoryStyles[category],
        className
      )}
    >
      {categoryNames[category]}
    </span>
  );
}
