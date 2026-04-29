import React from 'react';
import { Search, Bell, Sun, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../store';

export const Navbar: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <header className="h-20 border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground font-medium">Wednesday, 18 Sep</span>
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-semibold text-white">27°C</span>
          </div>
        </div>

        <div className="relative w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="w-full bg-[#111111] border border-white/5 rounded-full py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
             <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-muted-foreground border border-white/10 font-sans">⌘</kbd>
             <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-muted-foreground border border-white/10 font-sans">K</kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative w-10 h-10 rounded-full border border-white/5 flex items-center justify-center hover:bg-white/5 transition-all">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background" />
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-white/5">
          <div className="text-right">
            <p className="text-sm font-semibold text-white">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
          <div className="relative group cursor-pointer">
            <img 
              src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Noah"} 
              alt="Profile" 
              className="w-10 h-10 rounded-full border border-white/10 bg-muted"
            />
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-background" />
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
};
