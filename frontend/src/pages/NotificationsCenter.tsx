import React, { useEffect, useState } from 'react';
import { notificationApi } from '../services/api';
import { Card, Button } from '../components/ui/Base';
import { ShieldAlert, ShoppingBag, Truck, UserX } from 'lucide-react';

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }


  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tight">Notifications</h1>
        <Button variant="outline" size="sm" onClick={markAllRead}>Mark all as read</Button>
      </div>

      <div className="space-y-4">
        {notifications.map((n) => (
          <Card key={n.id} className={n.unread ? 'border-primary/20 bg-primary/5' : ''}>
            <div className="flex gap-4">
              <div className="shrink-0 mt-1">
                {n.type === 'fraud' && <ShieldAlert className="w-5 h-5 text-red-400" />}
                {n.type === 'order' && <ShoppingBag className="w-5 h-5 text-emerald-400" />}
                {n.type === 'abandoned' && <UserX className="w-5 h-5 text-amber-400" />}
                {n.type === 'courier' && <Truck className="w-5 h-5 text-blue-400" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                   <h4 className="text-sm font-bold text-white">{n.title}</h4>
                   <span className="text-[10px] text-muted-foreground">{n.time}</span>
                </div>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                {n.unread && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" className="h-7 text-[10px] px-3">View Details</Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-[10px] px-3"
                      onClick={() => markRead(n.id)}
                    >
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
