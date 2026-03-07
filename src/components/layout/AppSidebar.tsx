import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  FolderOpen, 
  Activity,
  Users,
  GraduationCap,
  Heart,
  Truck,
  Calculator
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { policyCategories } from '@/data/mockData';
import { PolicyCategory } from '@/types/policy';

const mainNavItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/query', label: 'Query & Retrieve', icon: Search },
  { to: '/explorer', label: 'Policy Explorer', icon: FolderOpen },
  { to: '/status', label: 'System Status', icon: Activity },
];

const categoryIcons: Record<PolicyCategory, typeof Users> = {
  womens: Users,
  education: GraduationCap,
  healthcare: Heart,
  transport: Truck,
  taxation: Calculator,
};

interface AppSidebarProps {
  activeCategory?: PolicyCategory | null;
  onCategorySelect?: (category: PolicyCategory | null) => void;
}

export function AppSidebar({ activeCategory, onCategorySelect }: AppSidebarProps) {
  const location = useLocation();
  const totalDocuments = policyCategories.reduce((sum, cat) => sum + cat.documentCount, 0);

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-60 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-lg font-semibold text-foreground-strong tracking-tight">
          Menu
        </h1>
      </div>

      {/* Main Navigation */}
      <nav className="p-4 space-y-1">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Policy Categories */}
      <div className="flex-1 overflow-y-auto px-4 py-4 border-t border-sidebar-border">
        <h2 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">
          Policy Categories
        </h2>
        <div className="space-y-1">
          {policyCategories.map((category) => {
            const Icon = categoryIcons[category.id];
            const isActive = activeCategory === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => onCategorySelect?.(isActive ? null : category.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "border-l-2 border-primary bg-sidebar-accent text-primary font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left truncate">{category.name}</span>
                <span className="text-xs text-muted-foreground">{category.documentCount}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Corpus Summary */}
      <div className="p-4 border-t border-sidebar-border">
        <p className="text-sm text-foreground-strong font-medium">
          {totalDocuments.toLocaleString()} documents indexed
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Last updated: Dec 22, 2024
        </p>
      </div>
    </aside>
  );
}
