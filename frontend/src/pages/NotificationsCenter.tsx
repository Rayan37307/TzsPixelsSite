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
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-border border-t-[var(--color-accent)] animate-spin" />
        <p className="font-mono text-sm text-muted-foreground">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <p className="font-mono text-xs text-muted-foreground">Notifications</p>
           </div>
           <h1 className="text-4xl font-black text-foreground tracking-tight">Activity center</h1>
        </div>
        <Button variant="secondary" size="md" onClick={markAllRead} className="gap-2">
           <CheckCircle2 className="w-4 h-4" /> Mark all read
        </Button>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card className="py-24 text-center border-2 border-dashed border-border">
             <div className="w-16 h-16 rounded-xl bg-[var(--color-paper-3)] border-2 border-border flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-muted-foreground opacity-30" />
             </div>
             <p className="font-mono text-sm text-muted-foreground">No notifications</p>
          </Card>
        ) : (
          notifications.map((n) => (
            <Card
              key={n.id}
              className={cn(
                "p-0 overflow-hidden transition-colors group",
                n.unread
                  ? 'border-2 border-[var(--color-accent)]/30'
                  : 'hover:border-[var(--color-border-hover)]'
              )}
            >
              <div className="relative p-6 flex gap-5">
                {n.unread && (
                  <div className="absolute top-0 left-0 bottom-0 w-0.5 bg-[var(--color-accent)]" />
                )}

                <div className={cn(
                  "shrink-0 w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-colors",
                  n.type === 'fraud' ? 'border-[var(--color-danger)]/30 text-[var(--color-danger)] bg-[var(--color-danger)]/10' :
                  n.type === 'order' ? 'border-[var(--color-success)]/30 text-[var(--color-success)] bg-[var(--color-success)]/10' :
                  n.type === 'abandoned' ? 'border-[var(--color-warning)]/30 text-[var(--color-warning)] bg-[var(--color-warning)]/10' :
                  'border-border text-muted-foreground bg-[var(--color-paper-3)]'
                )}>
                  {n.type === 'fraud' && <ShieldAlert className="w-6 h-6" />}
                  {n.type === 'order' && <ShoppingBag className="w-6 h-6" />}
                  {n.type === 'abandoned' && <UserX className="w-6 h-6" />}
                  {n.type === 'courier' && <Truck className="w-6 h-6" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                       <h4 className="font-black text-base text-foreground tracking-tight">{n.title}</h4>
                       {n.unread && <Badge variant="primary" className="text-[10px]">New</Badge>}
                    </div>
                    <span className="font-mono text-xs text-muted-foreground shrink-0">{n.time}</span>
                  </div>

                  <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                    {n.message}
                  </p>

                  <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="primary" size="sm">Take action</Button>
                    {n.unread && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markRead(n.id)}
                      >
                        Dismiss
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
