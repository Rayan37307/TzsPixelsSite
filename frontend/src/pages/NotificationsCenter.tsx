import React from 'react';
import { Card, Button } from '../components/ui/Base';
import { ShieldAlert, ShoppingBag, Truck, UserX } from 'lucide-react';

export const NotificationsCenter: React.FC = () => {
  const notifications = [
    { id: 1, type: 'fraud', title: 'High Risk Order Detected', message: 'Order #1247 has a fraud score of 85. Review required.', time: '2 mins ago', unread: true },
    { id: 2, type: 'order', title: 'New Order Received', message: 'Michael Chen just placed an order for $125.50.', time: '15 mins ago', unread: true },
    { id: 3, type: 'abandoned', title: 'High Value Abandoned Cart', message: 'A cart worth $1,200.00 was just abandoned.', time: '1 hour ago', unread: false },
    { id: 4, type: 'courier', title: 'Delivery Exception', message: 'Order #1233 is delayed due to weather conditions.', time: '3 hours ago', unread: false },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tight">Notifications</h1>
        <Button variant="outline" size="sm">Mark all as read</Button>
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
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] px-3">Dismiss</Button>
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
