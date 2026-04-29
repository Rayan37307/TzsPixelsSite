import { Router } from 'express';
import { ShopifyService } from '../services/shopifyService';

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

export const orderRoutes = router;
