import { useOutletContext } from 'react-router-dom';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { TimelineChart } from '@/components/dashboard/TimelineChart';
import { CategoryDistribution } from '@/components/dashboard/CategoryDistribution';
import { RecentDocuments } from '@/components/dashboard/RecentDocuments';
import { TopSources } from '@/components/dashboard/TopSources';
import { PolicyCategory } from '@/types/policy';

interface DashboardContext {
  activeCategory: PolicyCategory | null;
  setActiveCategory: (category: PolicyCategory | null) => void;
}

export default function Dashboard() {
  const { activeCategory, setActiveCategory } = useOutletContext<DashboardContext>();

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground-strong">Dashboard</h1>
        {activeCategory && (
          <p className="text-sm text-muted-foreground mt-1">
            Filtered to: {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} policies
          </p>
        )}
      </div>

      {/* Filter Bar */}
      <FilterBar />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <TimelineChart category={activeCategory} />
          <CategoryDistribution
            activeCategory={activeCategory}
            onCategoryClick={setActiveCategory}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <RecentDocuments activeCategory={activeCategory} />
          <TopSources />
        </div>
      </div>
    </div>
  );
}
