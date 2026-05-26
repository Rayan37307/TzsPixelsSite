import React, { useEffect, useState } from 'react';
import { Search, Bell, Settings, ChevronDown, Plus } from 'lucide-react';
import { useAuthStore } from '../store';
import { notificationApi } from '../services/api';
import { Link } from 'react-router-dom';
import { Button } from './ui/Base';

export const Navbar: React.FC = () => {
  const { user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const notifications = await notificationApi.getNotifications();
        const unread = notifications.filter((n: any) => n.unread).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-20 bg-transparent px-8 flex items-center justify-between sticky top-0 z-40 border-b border-border">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 pr-6 border-r border-border">
          <div className="relative group cursor-pointer">
            <img
              src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Noah"}
              alt="Profile"
              className="w-10 h-10 rounded-lg border border-border object-cover"
            />
          </div>
          <div className="flex flex-col">
             <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">@ryan997</span>
                <span className="text-[10px] bg-[var(--color-paper-3)] border border-border px-1.5 py-0.5 rounded font-bold text-foreground uppercase">Pro</span>
             </div>
             <div className="flex items-center gap-2 mt-0.5">
                <span className="font-bold text-sm text-foreground tracking-tight">Ryan Crawford</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
             </div>
          </div>
        </div>

        <Button variant="primary" size="sm" className="gap-2 border border-[var(--color-accent)]/30">
          Deposit <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Link to="/notifications" className="relative w-10 h-10 rounded-lg flex items-center justify-center hover:bg-[var(--color-paper-3)] transition-all text-muted-foreground">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center rounded-sm text-[10px]">{unreadCount}</span>
          )}
        </Link>

        <div className="relative group w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-card border-2 border-border rounded-lg py-2 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-[var(--color-accent)] transition-all placeholder:text-muted-foreground"
          />
          <Settings className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-pointer" />
        </div>

        <Button variant="outline" size="sm" className="gap-2">
          Settings <Settings className="w-3.5 h-3.5" />
        </Button>
      </div>
    </header>
  );
};
