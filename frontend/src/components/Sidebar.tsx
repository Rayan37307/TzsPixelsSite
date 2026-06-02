import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  MessageSquareCode,
  Bell,
  ShieldAlert,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MessageCircle,
  Zap,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../utils/cn';
import { useUIStore } from '../store';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: ShoppingBag, label: 'Orders', path: '/orders' },
  { icon: MessageSquareCode, label: 'Bot Studio', path: '/bots' },
  { icon: MessageCircle, label: 'Messenger', path: '/messenger' },
  { icon: ShieldAlert, label: 'Fraud shield', path: '/fraud' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Sidebar: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 z-50 flex flex-col py-6",
        sidebarOpen ? "w-[280px]" : "w-24"
      )}
    >
      <div className="mb-10 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
             <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-foreground">Scalefy</span>
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
                "flex items-center gap-3.5 px-4 py-3 rounded-lg transition-all duration-150 group relative",
                isActive
                  ? "bg-[var(--color-paper-3)] text-foreground border-l-2 border-[var(--color-accent)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-[var(--color-paper-3)]"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")} />
              {sidebarOpen && (
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              )}

              {!sidebarOpen && (
                <div className="absolute left-20 bg-popover text-foreground px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none text-xs font-bold whitespace-nowrap z-50 border border-border translate-x-2 group-hover:translate-x-0">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="w-full px-4 mt-auto pt-6 border-t border-border space-y-1">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-muted-foreground hover:bg-[var(--color-paper-3)] hover:text-foreground transition-all group"
        >
          {sidebarOpen ? <ChevronLeft className="w-5 h-5 shrink-0" /> : <ChevronRight className="w-5 h-5 shrink-0" />}
          {sidebarOpen && <span className="font-bold text-sm tracking-tight">Collapse</span>}
        </button>
        <button className="w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-all group">
          <LogOut className="w-5 h-5 shrink-0" />
          {sidebarOpen && <span className="font-bold text-sm tracking-tight">Logout</span>}
        </button>
      </div>
    </aside>
  );
};
