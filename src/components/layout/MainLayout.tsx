import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { PolicyCategory } from '@/types/policy';

export function MainLayout() {
  const [activeCategory, setActiveCategory] = useState<PolicyCategory | null>(null);

  return (
    <div className="min-h-screen flex w-full pt-16">
      <AppSidebar 
        activeCategory={activeCategory} 
        onCategorySelect={setActiveCategory} 
      />
      <main className="flex-1 ml-60 p-6">
        <div className="max-w-7xl mx-auto">
          <Outlet context={{ activeCategory, setActiveCategory }} />
        </div>
      </main>
    </div>
  );
}
