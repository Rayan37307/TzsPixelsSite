import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ShieldAlert, 
  MessageSquareCode, 
  UserX, 
  Bell, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MessageCircle,
  Zap,
  ChevronDown
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../utils/cn';
import { useUIStore } from '../store';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: ShoppingBag, label: 'Orders', path: '/orders' },
  { icon: ShieldAlert, label: 'Fraud Detection', path: '/fraud' },
  { icon: MessageSquareCode, label: 'Bot Studio', path: '/bots' },
  { icon: MessageCircle, label: 'Messenger', path: '/messenger' },
  { icon: UserX, label: 'Abandoned', path: '/abandoned' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Sidebar: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const location = useLocation();

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-[#0d0d0d] border-r border-white/[0.05] transition-all duration-500 z-50 flex flex-col py-6",
        sidebarOpen ? "w-[280px]" : "w-24"
      )}
    >
      <div className="mb-10 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-xl shadow-white/5">
             <Zap className="w-6 h-6 text-black fill-black" />
          </div>
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">Scalefy</span>
              <sup className="text-[10px] font-bold text-primary uppercase mt-1">Enterprise</sup>
              <ChevronDown className="w-3 h-3 text-muted-foreground ml-1" />
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 w-full px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '/');
          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
                isActive 
                  ? "bg-[#1a1a1a] text-white shadow-inner" 
                  : "text-muted-foreground hover:text-white hover:bg-white/[0.02]"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-muted-foreground group-hover:text-white")} />
              {sidebarOpen && (
                <div className="flex items-center justify-between flex-1">
                  <span className="font-bold text-sm tracking-tight">{item.label}</span>
                  {isActive && <div className="w-1 h-4 bg-white rounded-full absolute left-0" />}
                </div>
              )}
              
              {!sidebarOpen && (
                <div className="absolute left-20 bg-[#1a1b23] text-white px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none text-xs font-bold whitespace-nowrap z-50 shadow-xl border border-white/5 translate-x-2 group-hover:translate-x-0">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="w-full px-4 mt-auto pt-6 border-t border-white/[0.03] space-y-1">
        <button 
          onClick={toggleSidebar}
          className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-muted-foreground hover:bg-white/[0.03] hover:text-white transition-all group"
        >
          {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          {sidebarOpen && <span className="font-bold text-sm tracking-tight">Collapse</span>}
        </button>
        <button className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-500/5 transition-all group">
          <LogOut className="w-5 h-5" />
          {sidebarOpen && <span className="font-bold text-sm tracking-tight">Logout</span>}
        </button>
      </div>
    </aside>
  );
};
