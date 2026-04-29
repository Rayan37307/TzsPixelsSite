import { Router } from 'express';
import { NotificationService } from '../services/notificationService';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const notifications = await NotificationService.getNotifications();
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.post('/:id/read', async (req, res) => {
  try {
    const notification = await NotificationService.markAsRead(req.params.id);
    res.json(notification);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

router.post('/read-all', async (req, res) => {
  try {
    const notifications = await NotificationService.markAllAsRead();
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

export const notificationRoutes = router;
