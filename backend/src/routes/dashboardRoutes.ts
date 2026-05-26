import { Router } from 'express';
import { DashboardService } from '../services/dashboardService.js';

const router = Router();

router.get('/stats', async (req, res) => {
  try {
    const stats = await DashboardService.getDashboardStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Dashboard stats fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export const dashboardRoutes = router;
