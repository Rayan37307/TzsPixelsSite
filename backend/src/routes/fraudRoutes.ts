import { Router } from 'express';
import {
  scanNewOrders,
  getFraudChecks,
  getFraudCheckByOrderId,
  updateFraudCheckStatus
} from '../services/fraudDetectionService.js';
import prisma from '../config/db.js';

const router = Router();

router.get('/results', async (req, res) => {
  try {
    const { status, limit } = req.query;
    const limitNum = limit ? parseInt(limit as string, 10) : 50;
    const checks = await getFraudChecks(status as string | undefined, limitNum);
    return res.json({ success: true, data: checks });
  } catch (error: any) {
    console.error('[Fraud Routes] Error fetching fraud checks:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/results/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const check = await getFraudCheckByOrderId(orderId);

    if (!check) {
      return res.status(404).json({ success: false, error: 'Fraud check not found' });
    }

    return res.json({ success: true, data: check });
  } catch (error: any) {
    console.error('[Fraud Routes] Error fetching fraud check:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/scan', async (req, res) => {
  try {
    const results = await scanNewOrders();
    return res.json({
      success: true,
      data: results,
      scanned: results.length
    });
  } catch (error: any) {
    console.error('[Fraud Routes] Error scanning orders:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/results/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'reviewed', 'approved', 'rejected', 'blocked', 'held'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updated = await updateFraudCheckStatus(orderId, status as any);

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Fraud check not found' });
    }

    return res.json({ success: true, message: 'Status updated' });
  } catch (error: any) {
    console.error('[Fraud Routes] Error updating fraud check:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/results/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await prisma.fraudCheck.delete({
      where: { orderId },
    });

    return res.json({ success: true, message: 'Check deleted' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Fraud check not found' });
    }
    console.error('[Fraud Routes] Error deleting fraud check:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export const fraudRoutes = router;
