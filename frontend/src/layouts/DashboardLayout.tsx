import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { useUIStore } from '../store';
import { cn } from '../utils/cn';

export const DashboardLayout: React.FC = () => {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-black text-foreground font-sans selection:bg-primary/30 selection:text-primary">
      <Sidebar />
      <div 
        className={cn(
          "transition-all duration-500 min-h-screen flex flex-col",
          sidebarOpen ? "pl-[280px]" : "pl-24"
        )}
      >
        <main className="flex-1 px-8 py-8 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
