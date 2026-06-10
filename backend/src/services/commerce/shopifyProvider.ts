import { ShopifyService } from '../shopifyService.js';
import { normalizeBdPhone } from '../bdCourierService.js';
import { historyFromOrders, dummyEmailFromPhone, DUMMY_CITY } from './helpers.js';

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
  const storefrontBase = (process.env.SHOPIFY_STOREFRONT_URL || `https://${process.env.SHOPIFY_SHOP || ''}`).replace(/\/$/, '');
  return {
    id: String(p.id),
    name: p.title,
    price: String(variant.price ?? ''),
    inStock,
    description: (p.body_html || '').replace(/<[^>]*>/g, '').trim(),
    url: p.handle ? `${storefrontBase}/products/${p.handle}` : undefined,
  };
}

const STOP_WORDS = new Set([
  'wishcare',
  'bd',
  'the',
  'and',
  'with',
  'for',
  'product',
  'search',
  'query',
  'concentrate',
]);

function tokens(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/<[^>]*>/g, ' ')
    .split(/[^a-z0-9%]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
}

function productSearchScore(product: any, queryTokens: string[]): number {
  const title = String(product.title ?? '').toLowerCase();
  const body = String(product.body_html ?? '').replace(/<[^>]*>/g, ' ').toLowerCase();
  const haystack = `${title} ${body}`;
  let score = 0;

  for (const token of queryTokens) {
    if (title.includes(token)) score += 3;
    else if (haystack.includes(token)) score += 1;
  }

  return score;
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
    const queryTokens = tokens(query);
    if (queryTokens.length > 0) {
      return products
        .map((product: any) => ({ product, score: productSearchScore(product, queryTokens) }))
        .filter(({ score }: any) => score >= 3)
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 5)
        .map(({ product }: any) => normalize(product));
    }

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
    const email = input.email || dummyEmailFromPhone(input.phone);
    const city = input.city || DUMMY_CITY;

    const order = await ShopifyService.createOrder({
      email,
      phone,
      line_items: [{ variant_id: variantId, quantity: input.quantity }],
      customer: {
        first_name: input.customerName.split(' ')[0],
        last_name: input.customerName.split(' ').slice(1).join(' ') || '',
        email,
        phone,
      },
      shipping_address: {
        first_name: input.customerName.split(' ')[0],
        last_name: input.customerName.split(' ').slice(1).join(' ') || '',
        address1: input.address,
        city,
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
