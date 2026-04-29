export interface Notification {
  id: string;
  type: 'fraud' | 'order' | 'abandoned' | 'courier';
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

export class NotificationService {
  private static notifications: Notification[] = [
    { id: '1', type: 'fraud', title: 'High Risk Order Detected', message: 'Order #SHP-1001 has a fraud score of 85. Review required.', time: '2 mins ago', unread: true },
    { id: '2', type: 'order', title: 'New Order Received', message: 'Tasin Bin Tarek just placed an order for ৳ 2,298.85.', time: '15 mins ago', unread: true },
    { id: '3', type: 'abandoned', title: 'High Value Abandoned Cart', message: 'A cart worth ৳ 12,000.00 was just abandoned.', time: '1 hour ago', unread: false },
    { id: '4', type: 'courier', title: 'Delivery Exception', message: 'Order #SHP-0998 is delayed due to weather conditions.', time: '3 hours ago', unread: false },
  ];

  static async getNotifications() {
    // In a real app, fetch from DB
    return this.notifications;
  }

  static async markAsRead(id: string) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.unread = false;
    }
    return notification;
  }

  static async markAllAsRead() {
    this.notifications.forEach(n => n.unread = false);
    return this.notifications;
  }

  static async addNotification(notification: Omit<Notification, 'id' | 'unread'>) {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      unread: true
    };
    this.notifications.unshift(newNotification);
    // Keep only last 20 notifications
    if (this.notifications.length > 20) {
      this.notifications.pop();
    }
    return newNotification;
  }
}
