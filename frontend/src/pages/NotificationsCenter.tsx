import React, { useEffect, useState } from 'react';
import { notificationApi } from '../services/api';
import { Card, Button, Badge } from '../components/ui/Base';
import { ShieldAlert, ShoppingBag, Truck, UserX, Bell, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { cn } from '../utils/cn';

export const NotificationsCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationApi.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const markRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-6">
        <div className="relative">
           <div className="w-16 h-16 rounded-full border-t-2 border-primary animate-spin" />
           <Bell className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary/50 animate-pulse" />
        </div>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Syncing Intelligence Feed...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                 <Bell className="w-4 h-4 text-primary" />
              </div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Neural Signal Hub</p>
           </div>
           <h1 className="text-4xl font-black text-white tracking-tight italic">Intelligence <span className="text-primary not-italic">Center</span></h1>
        </div>
        <Button variant="secondary" className="h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest border-white/5 gap-2" onClick={markAllRead}>
           <CheckCircle2 className="w-4 h-4" /> Clear All Signals
        </Button>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card className="py-24 text-center bg-white/[0.01] border-dashed border-white/10 rounded-[2.5rem]">
             <div className="w-20 h-20 rounded-[2rem] bg-white/[0.02] flex items-center justify-center mx-auto mb-6">
                <Bell className="w-10 h-10 text-muted-foreground opacity-20" />
             </div>
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">No active transmissions detected</p>
          </Card>
        ) : (
          notifications.map((n) => (
            <Card 
              key={n.id} 
              className={cn(
                "p-0 overflow-hidden transition-all duration-500 hover:scale-[1.01] group",
                n.unread 
                  ? 'bg-primary/[0.03] border-primary/20 shadow-2xl shadow-primary/5' 
                  : 'bg-[#0d0d0d] border-white/[0.05] hover:border-white/10'
              )}
            >
              <div className="relative p-8 flex gap-8">
                {n.unread && (
                  <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-primary shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
                )}
                
                <div className={cn(
                  "shrink-0 w-16 h-16 rounded-[1.25rem] flex items-center justify-center shadow-xl transition-transform group-hover:rotate-12 group-hover:scale-110",
                  n.type === 'fraud' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                  n.type === 'order' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                  n.type === 'abandoned' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                  'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                )}>
                  {n.type === 'fraud' && <ShieldAlert className="w-8 h-8" />}
                  {n.type === 'order' && <ShoppingBag className="w-8 h-8" />}
                  {n.type === 'abandoned' && <UserX className="w-8 h-8" />}
                  {n.type === 'courier' && <Truck className="w-8 h-8" />}
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <h4 className="text-xl font-black text-white italic tracking-tight">{n.title}</h4>
                       {n.unread && <Badge variant="primary" className="h-5 text-[8px] px-2 rounded-md font-black uppercase tracking-widest">Priority Signal</Badge>}
                    </div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 flex items-center gap-2">
                       <MoreHorizontal className="w-3 h-3" /> {n.time}
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium text-white/60 leading-relaxed max-w-2xl">
                    {n.message}
                  </p>

                  <div className="pt-4 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <Button variant="premium" className="h-9 px-6 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl shadow-primary/10">Execute Response</Button>
                    {n.unread && (
                      <Button 
                        variant="ghost" 
                        className="h-9 px-6 rounded-xl font-black text-[9px] uppercase tracking-widest text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5"
                        onClick={() => markRead(n.id)}
                      >
                        Acknowledge Signal
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
