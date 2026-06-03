import { ShopifyService } from '../shopifyService.js';
import { normalizeBdPhone } from '../bdCourierService.js';
import { historyFromOrders } from './helpers.js';

function toE164(phone: string): string {
  const local = normalizeBdPhone(phone);
  if (local) return '+880' + local.slice(1); // 01XXXXXXXXX → +8801XXXXXXXXX
  return phone; // pass through if not a BD number
}
import type {
  CommerceProvider,
  NormalizedProduct,
  PlaceOrderInput,
  PlaceOrderResult,
  CancelOrderResult,
  CustomerOrderHistory,
} from './types.js';

function normalize(p: any): NormalizedProduct {
  const variant = p.variants?.[0] ?? {};
  const inStock = (p.variants ?? []).some(
    (v: any) => v.inventory_quantity == null || v.inventory_quantity > 0
  );
  return {
    id: String(p.id),
    name: p.title,
    price: String(variant.price ?? ''),
    inStock,
    description: (p.body_html || '').replace(/<[^>]*>/g, '').trim(),
  };
}

async function findVariantId(productName: string): Promise<number> {
  const products = await ShopifyService.getProducts();
  const q = productName.toLowerCase();
  const matched = products.find((p: any) => p.title?.toLowerCase().includes(q));
  if (!matched || !matched.variants?.[0]) {
    throw new Error(`Product not found: ${productName}`);
  }
  return matched.variants[0].id;
}

export const shopifyProvider: CommerceProvider = {
  name: 'shopify',

  async listProducts(limit = 50): Promise<NormalizedProduct[]> {
    const products = await ShopifyService.getProducts();
    return products.slice(0, limit).map(normalize);
  },

  async searchProducts(query: string): Promise<NormalizedProduct[]> {
    const products = await ShopifyService.getProducts();
    const q = query.toLowerCase();
    return products
      .filter(
        (p: any) =>
          p.title?.toLowerCase().includes(q) ||
          p.body_html?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map(normalize);
  },

  async createOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
    const variantId = await findVariantId(input.productName);
    const phone = toE164(input.phone);

    const order = await ShopifyService.createOrder({
      email: input.email,
      phone,
      line_items: [{ variant_id: variantId, quantity: input.quantity }],
      customer: {
        first_name: input.customerName.split(' ')[0],
        last_name: input.customerName.split(' ').slice(1).join(' ') || '',
        email: input.email,
        phone,
      },
      shipping_address: {
        first_name: input.customerName.split(' ')[0],
        last_name: input.customerName.split(' ').slice(1).join(' ') || '',
        address1: input.address,
        city: input.city,
        phone,
        country: 'BD',
      },
    });

    return { orderId: String(order.id), orderNumber: String(order.order_number) };
  },

  async cancelOrder(orderId: string): Promise<CancelOrderResult> {
    try {
      await ShopifyService.cancelOrder(orderId);
      return { success: true, message: `Order #${orderId} cancelled successfully.` };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  async getCustomerOrderHistory(phone: string): Promise<CustomerOrderHistory> {
    const orders = await ShopifyService.fetchOrders();
    return historyFromOrders(orders, phone);
  },
};
