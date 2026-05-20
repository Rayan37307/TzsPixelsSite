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
    <header className="h-24 bg-transparent px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 pr-6 border-r border-white/[0.05]">
          <div className="relative group cursor-pointer">
            <img 
              src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Noah"} 
              alt="Profile" 
              className="w-10 h-10 rounded-full border border-white/10 bg-muted object-cover"
            />
          </div>
          <div className="flex flex-col">
             <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">@ryan997</span>
                <span className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded font-black text-white">PRO</span>
             </div>
             <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-bold text-white tracking-tight">Ryan Crawford</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
             </div>
          </div>
        </div>

        <Button className="bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 h-9 rounded-xl px-5 text-xs font-black shadow-lg shadow-[#10b981]/5">
          Deposit <Plus className="w-3.5 h-3.5 ml-2" />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Link to="/notifications" className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition-all text-muted-foreground">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-[#1a1a1a] text-[9px] font-black text-white flex items-center justify-center rounded-full border-2 border-black">2</span>
        </Link>

        <div className="relative group w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-white transition-colors" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full bg-[#0d0d0d] border border-white/[0.05] rounded-xl py-2 pl-11 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
          />
          <Settings className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground hover:text-white cursor-pointer" />
        </div>

        <Button variant="outline" className="h-10 px-4 rounded-xl text-xs font-black bg-[#0d0d0d] border-white/[0.05]">
          Settings <Settings className="w-3.5 h-3.5 ml-2" />
        </Button>
      </div>
    </header>
  );
};
