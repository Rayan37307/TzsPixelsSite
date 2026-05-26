import { Router } from 'express';
import { ShopifyService } from '../services/shopifyService.js';
import { WooCommerceService } from '../services/woocommerceService.js';
import { NotificationService } from '../services/notificationService.js';

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

// POST /api/orders/create - Create order in WooCommerce or Shopify
router.post('/create', async (req, res) => {
  try {
    const { customerName, phone, address, city, email, productName, quantity } = req.body;

    if (!customerName || !phone || !address || !city || !productName || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const cms = getCMS();
    let order;

    console.log('[CreateOrder] CMS:', cms);
    console.log('[CreateOrder] Input:', { customerName, phone, address, city, email, productName, quantity });

    if (cms === 'wordpress' || cms === 'woocommerce') {
      const productId = await WooCommerceService.findProductId(productName);
      
      const wooOrderData = {
        billing: {
          first_name: customerName.split(' ')[0],
          last_name: customerName.split(' ').slice(1).join(' ') || '',
          email: email || '',
          phone: phone,
          address_1: address,
          city: city,
          country: 'BD'
        },
        line_items: [
          {
            product_id: productId,
            quantity: parseInt(quantity)
          }
        ],
        status: 'processing'
      };
      
      console.log('[CreateOrder] WooCommerce payload:', JSON.stringify(wooOrderData, null, 2));
      
      order = await WooCommerceService.createOrder(wooOrderData);
    } else {
      order = await ShopifyService.createOrder({
        line_items: [
          {
            title: productName,
            quantity: parseInt(quantity)
          }
        ],
        billing_address: {
          first_name: customerName.split(' ')[0],
          last_name: customerName.split(' ').slice(1).join(' ') || '',
          address1: address,
          city: city,
          country: 'Bangladesh'
        },
        email: email || '',
        phone: phone
      });
    }

    res.json({ success: true, order });
  } catch (error: any) {
    console.error('Create order error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export const orderRoutes = router;
