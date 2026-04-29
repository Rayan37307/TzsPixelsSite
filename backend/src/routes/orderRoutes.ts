import { Router } from 'express';
import { ShopifyService } from '../services/shopifyService';
import { NotificationService } from '../services/notificationService';

const router = Router();

// GET /api/orders
router.get('/', async (req, res) => {
  try {
    const orders = await ShopifyService.fetchOrders();
    return res.json(orders);
  } catch (error: any) {
    console.error('Order fetch error:', error.message);
    // Fallback to mock data if Shopify fails, to keep the UI alive during setup
    return res.json([
      { id: 'ORD-1245', customer: 'Sarah Johnson', phone: '+1 234 567 8901', amount: '$458.00', status: 'Delivered', fraudRisk: 'Low', courier: 'FedEx', date: 'Oct 12, 2023' },
      { id: 'ORD-1246', customer: 'Michael Chen', phone: '+1 234 567 8902', amount: '$125.50', status: 'Pending', fraudRisk: 'Medium', courier: 'DHL', date: 'Oct 13, 2023' },
    ]);
  }
});

// GET /api/orders/products
router.get('/products', async (req, res) => {
  try {
    const products = await ShopifyService.getProducts();
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/orders/simulate
router.post('/simulate', async (req, res) => {
  try {
    const { customer, amount } = req.body;
    const orderId = `SHP-${Math.floor(1000 + Math.random() * 9000)}`;
    
    await NotificationService.addNotification({
      type: 'order',
      title: 'New Order Received',
      message: `${customer || 'A customer'} just placed an order for ${amount || '৳ 0'}.`,
      time: 'Just now'
    });

    res.json({ success: true, orderId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const orderRoutes = router;
