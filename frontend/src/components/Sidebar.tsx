import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Store, 
  ShieldAlert, 
  MessageSquareCode, 
  UserX, 
  Truck, 
  Bell, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../utils/cn';
import { useUIStore } from '../store';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: ShoppingBag, label: 'Orders', path: '/orders' },
  { icon: Store, label: 'Stores', path: '/stores' },
  { icon: ShieldAlert, label: 'Fraud Detection', path: '/fraud' },
  { icon: MessageSquareCode, label: 'AI Assistant', path: '/ai' },
  { icon: UserX, label: 'Abandoned', path: '/abandoned' },
  { icon: Truck, label: 'Courier', path: '/courier' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Sidebar: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const location = useLocation();

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-[#111111] border-r border-white/5 transition-all duration-300 z-50 flex flex-col items-center py-6",
        sidebarOpen ? "w-64" : "w-20"
      )}
    >
      <div className="mb-10 px-4 w-full flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-primary-foreground flex items-center justify-center">
             <div className="w-2 h-2 bg-primary-foreground rounded-full" />
          </div>
        </div>
        {sidebarOpen && (
          <span className="ml-3 font-bold text-xl tracking-tight text-white">Scalefy</span>
        )}
      </div>

      <nav className="flex-1 w-full px-3 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-white/10 text-white" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn("w-6 h-6", isActive && "text-primary")} />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
              {!sidebarOpen && (
                <div className="absolute left-16 bg-popover text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-sm whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
              {isActive && !sidebarOpen && (
                <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="w-full px-3 mt-auto space-y-2">
        <button 
          onClick={toggleSidebar}
          className="w-full flex items-center gap-4 px-3 py-3 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white transition-all"
        >
          {sidebarOpen ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
          {sidebarOpen && <span className="font-medium">Collapse</span>}
        </button>
        <button className="w-full flex items-center gap-4 px-3 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all">
          <LogOut className="w-6 h-6" />
          {sidebarOpen && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
};
