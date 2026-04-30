import { Router } from 'express';
import {
  scanNewOrders,
  getFraudChecks,
  getFraudCheckByOrderId,
  updateFraudCheckStatus
} from '../services/fraudDetectionService';
import { query } from '../db';

const router = Router();

// GET /api/fraud/results - List fraud checks
// Query params: status (optional), limit (default 50)
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

// GET /api/fraud/results/:orderId - Get single order fraud details
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

// POST /api/fraud/scan - Manual scan trigger
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

// PATCH /api/fraud/results/:orderId - Update fraud check status
router.patch('/results/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'reviewed', 'approved', 'rejected'];
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

// DELETE /api/fraud/results/:orderId - Delete fraud check (optional cleanup)
router.delete('/results/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const result = await query(
      'DELETE FROM fraud_checks WHERE order_id = $1 RETURNING id',
      [orderId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Fraud check not found' });
    }
    
    return res.json({ success: true, message: 'Check deleted' });
  } catch (error: any) {
    console.error('[Fraud Routes] Error deleting fraud check:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export const fraudRoutes = router;