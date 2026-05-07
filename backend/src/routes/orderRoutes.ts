import { Router } from 'express';
import { ShopifyService } from '../services/shopifyService';
import { WooCommerceService } from '../services/woocommerceService';
import { NotificationService } from '../services/notificationService';

const router = Router();

function getCMS() {
  return (process.env.CMS || 'shopify').toLowerCase();
}

function isCMSConfigured(): boolean {
  const cms = getCMS();
  if (cms === 'shopify') {
    return !!(process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET &&
      process.env.SHOPIFY_CLIENT_ID !== 'your_client_id');
  }
  if (cms === 'wordpress' || cms === 'woocommerce') {
    return WooCommerceService.isConfigured();
  }
  return false;
}

async function fetchOrders(): Promise<any[]> {
  const cms = getCMS();
  if (cms === 'wordpress' || cms === 'woocommerce') {
    return WooCommerceService.fetchOrders();
  }
  return ShopifyService.fetchOrders();
}

async function fetchProducts(): Promise<any[]> {
  const cms = getCMS();
  if (cms === 'wordpress' || cms === 'woocommerce') {
    return WooCommerceService.getProducts();
  }
  return ShopifyService.getProducts();
}

// GET /api/orders
router.get('/', async (req, res) => {
  try {
    if (isCMSConfigured()) {
      const orders = await fetchOrders();
      return res.json(orders);
    }
    return res.json([]);
  } catch (error: any) {
    console.error('Order fetch error:', error.message);
    return res.json([]);
  }
});

// GET /api/orders/products
router.get('/products', async (req, res) => {
  try {
    if (!isCMSConfigured()) {
      return res.json([]);
    }
    const products = await fetchProducts();
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
