import axios from 'axios';
import { NotificationService } from './notificationService';

interface WooCommerceStore {
  url: string;
  consumerKey: string;
  consumerSecret: string;
}

let cachedOrders: any[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 60000;

function parseWooCommerceStores(): WooCommerceStore[] {
  const storesStr = process.env.WOOCOMMERCE_STORES || '';
  console.log('[WooCommerce] Raw stores string:', storesStr);
  if (!storesStr.trim()) return [];

  const stores = storesStr.split(',').map(store => {
    const parts = store.trim().split('|');
    console.log('[WooCommerce] Parsed store:', { url: parts[0], hasKey: !!parts[1], hasSecret: !!parts[2] });
    return {
      url: parts[0] || '',
      consumerKey: parts[1] || '',
      consumerSecret: parts[2] || ''
    };
  }).filter(s => s.url && s.consumerKey && s.consumerSecret);
  
  console.log('[WooCommerce] Parsed stores count:', stores.length);
  return stores;
}

export class WooCommerceService {
  private static get stores(): WooCommerceStore[] {
    return parseWooCommerceStores();
  }

  private static get primaryStore(): WooCommerceStore | null {
    return this.stores[0] || null;
  }

  private static getAuthConfig(store: WooCommerceStore) {
    return {
      auth: {
        username: store.consumerKey,
        password: store.consumerSecret
      }
    };
  }

  static isConfigured(): boolean {
    return this.stores.length > 0;
  }

  static async fetchOrders() {
    const store = this.primaryStore;
    console.log('[WooCommerce] fetchOrders - store:', store ? { url: store.url } : null);
    if (!store) {
      throw new Error('No WooCommerce store configured');
    }

    if (cachedOrders.length > 0 && Date.now() - lastFetchTime < CACHE_DURATION) {
      console.log('📦 Using cached WooCommerce orders');
      return cachedOrders;
    }

    try {
      console.log('[WooCommerce] Making request to:', `${store.url}/wp-json/wc/v3/orders?per_page=50`);
      const response = await axios.get(
        `${store.url}/wp-json/wc/v3/orders`,
        {
          ...this.getAuthConfig(store),
          params: {
            per_page: 50,
            status: 'any'
          }
        }
      );

      cachedOrders = response.data.map((order: any) => ({
        id: `WOO-${order.number}`,
        customer: `${order.billing.first_name || ''} ${order.billing.last_name || ''}`.trim() || 'Guest',
        phone: order.billing.phone || 'N/A',
        amount: `${order.currency} ${order.total}`,
        status: this.mapStatus(order.status),
        fraudRisk: 'Low',
        courier: order.shipping_lines?.[0]?.method_title || 'WooCommerce',
        date: new Date(order.date_created).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        })
      }));

      lastFetchTime = Date.now();
      console.log(`📦 Fetched ${cachedOrders.length} orders from WooCommerce`);
      return cachedOrders;
    } catch (error: any) {
      console.error('❌ WooCommerce fetch error:', error.response?.data || error.message);
      throw error;
    }
  }

  static async getProducts() {
    const store = this.primaryStore;
    if (!store) {
      throw new Error('No WooCommerce store configured');
    }

    try {
      const response = await axios.get(
        `${store.url}/wp-json/wc/v3/products`,
        {
          ...this.getAuthConfig(store),
          params: { per_page: 50 }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ WooCommerce products fetch error:', error.response?.data || error.message);
      throw error;
    }
  }

  static async findProductId(productName: string): Promise<number> {
    const products = await this.getProducts();
    const matched = products.find((p: any) => 
      p.name.toLowerCase().includes(productName.toLowerCase())
    );
    if (!matched) {
      throw new Error(`Product not found: ${productName}`);
    }
    console.log('[WooCommerce] Found product:', matched.name, '| ID:', matched.id);
    return matched.id;
  }

  static async createOrder(orderData: any) {
    const store = this.primaryStore;
    if (!store) {
      throw new Error('No WooCommerce store configured');
    }

    console.log('[WooCommerce] createOrder - URL:', `${store.url}/wp-json/wc/v3/orders`);
    console.log('[WooCommerce] createOrder - Auth:', { username: store.consumerKey, hasPassword: !!store.consumerSecret });
    console.log('[WooCommerce] createOrder - Payload:', JSON.stringify(orderData, null, 2));

    try {
      const response = await axios.post(
        `${store.url}/wp-json/wc/v3/orders`,
        orderData,
        this.getAuthConfig(store)
      );

      const order = response.data;
      await NotificationService.addNotification({
        type: 'order',
        title: 'New Order Received',
        message: `${order.billing.first_name || 'A customer'} just placed an order for ${order.currency} ${order.total}.`,
        time: 'Just now'
      });

      return order;
    } catch (error: any) {
      console.error('[WooCommerce] createOrder error:', error.response?.data || error.message);
      throw error;
    }
  }

  static async updateOrder(orderId: string, updateData: any) {
    const store = this.primaryStore;
    if (!store) {
      throw new Error('No WooCommerce store configured');
    }

    const response = await axios.put(
      `${store.url}/wp-json/wc/v3/orders/${orderId}`,
      updateData,
      this.getAuthConfig(store)
    );
    return response.data;
  }

  private static mapStatus(wpStatus: string): string {
    const statusMap: Record<string, string> = {
      'completed': 'Delivered',
      'processing': 'Pending',
      'shipped': 'Shipped',
      'cancelled': 'Returned',
      'refunded': 'Returned',
      'pending': 'Pending',
      'on-hold': 'Pending'
    };
    return statusMap[wpStatus] || 'Pending';
  }
}