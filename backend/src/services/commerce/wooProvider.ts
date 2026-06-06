import { WooCommerceService } from '../woocommerceService.js';
import { historyFromOrders, dummyEmailFromPhone, DUMMY_CITY } from './helpers.js';
import type {
  CommerceProvider,
  NormalizedProduct,
  PlaceOrderInput,
  PlaceOrderResult,
  CancelOrderResult,
  CustomerOrderHistory,
} from './types.js';

function normalize(p: any): NormalizedProduct {
  return {
    id: String(p.id),
    name: p.name,
    price: String(p.price ?? ''),
    inStock: p.stock_status === 'instock',
    description: (p.short_description || p.description || '').replace(/<[^>]*>/g, '').trim(),
    url: p.permalink || undefined,
  };
}

export const wooProvider: CommerceProvider = {
  name: 'woocommerce',

  async listProducts(limit = 50): Promise<NormalizedProduct[]> {
    const products = await WooCommerceService.getProducts();
    return products.slice(0, limit).map(normalize);
  },

  async searchProducts(query: string): Promise<NormalizedProduct[]> {
    const products = await WooCommerceService.getProducts();
    const q = query.toLowerCase();
    return products
      .filter(
        (p: any) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map(normalize);
  },

  async createOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
    const productId = await WooCommerceService.findProductId(input.productName);
    const email = input.email || dummyEmailFromPhone(input.phone);
    const city = input.city || DUMMY_CITY;

    const order = await WooCommerceService.createOrder({
      billing: {
        first_name: input.customerName.split(' ')[0],
        last_name: input.customerName.split(' ').slice(1).join(' ') || '',
        email,
        phone: input.phone,
        address_1: input.address,
        city,
        country: 'BD',
      },
      line_items: [{ product_id: productId, quantity: input.quantity }],
      status: 'processing',
    });

    return { orderId: String(order.id), orderNumber: String(order.number) };
  },

  async cancelOrder(orderId: string): Promise<CancelOrderResult> {
    try {
      await WooCommerceService.cancelOrder(orderId);
      return { success: true, message: `Order #${orderId} cancelled successfully.` };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  async getCustomerOrderHistory(phone: string): Promise<CustomerOrderHistory> {
    const orders = await WooCommerceService.fetchOrders();
    return historyFromOrders(orders, phone);
  },
};
