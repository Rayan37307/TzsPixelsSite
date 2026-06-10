import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../woocommerceService.js', () => ({
  WooCommerceService: {
    isConfigured: vi.fn(() => false),
    getProducts: vi.fn(),
    findProductId: vi.fn(),
    createOrder: vi.fn(),
    fetchOrders: vi.fn(),
  },
}));

vi.mock('../../shopifyService.js', () => ({
  ShopifyService: {
    isConfigured: vi.fn(() => false),
    getProducts: vi.fn(),
    createOrder: vi.fn(),
    fetchOrders: vi.fn(),
  },
}));

import { WooCommerceService } from '../../woocommerceService.js';
import { ShopifyService } from '../../shopifyService.js';
import { getActiveProvider } from '../index.js';
import { wooProvider } from '../wooProvider.js';
import { shopifyProvider } from '../shopifyProvider.js';

beforeEach(() => {
  vi.clearAllMocks();
  (WooCommerceService.isConfigured as any).mockReturnValue(false);
  (ShopifyService.isConfigured as any).mockReturnValue(false);
});

describe('getActiveProvider', () => {
  it('returns null when neither configured', () => {
    expect(getActiveProvider()).toBeNull();
  });

  it('returns woo when woo configured', () => {
    (WooCommerceService.isConfigured as any).mockReturnValue(true);
    expect(getActiveProvider()?.name).toBe('woocommerce');
  });

  it('returns shopify when only shopify configured', () => {
    (ShopifyService.isConfigured as any).mockReturnValue(true);
    expect(getActiveProvider()?.name).toBe('shopify');
  });

  it('woo wins when both configured', () => {
    (WooCommerceService.isConfigured as any).mockReturnValue(true);
    (ShopifyService.isConfigured as any).mockReturnValue(true);
    expect(getActiveProvider()?.name).toBe('woocommerce');
  });
});

describe('wooProvider', () => {
  it('normalizes products', async () => {
    (WooCommerceService.getProducts as any).mockResolvedValue([
      { id: 1, name: 'Face Wash', price: '250', stock_status: 'instock', short_description: '<p>Gentle</p>' },
      { id: 2, name: 'Serum', price: '500', stock_status: 'outofstock', description: 'Bright' },
    ]);
    const products = await wooProvider.listProducts();
    expect(products).toEqual([
      { id: '1', name: 'Face Wash', price: '250', inStock: true, description: 'Gentle' },
      { id: '2', name: 'Serum', price: '500', inStock: false, description: 'Bright' },
    ]);
  });

  it('createOrder resolves product_id and returns ids', async () => {
    (WooCommerceService.findProductId as any).mockResolvedValue(42);
    (WooCommerceService.createOrder as any).mockResolvedValue({ id: 99, number: '1001' });
    const res = await wooProvider.createOrder({
      customerName: 'John Doe', phone: '01711111111', address: 'Rd 1', city: 'Dhaka',
      email: 'j@x.com', productName: 'Serum', quantity: 2,
    });
    expect(WooCommerceService.findProductId).toHaveBeenCalledWith('Serum');
    expect((WooCommerceService.createOrder as any).mock.calls[0][0].line_items).toEqual([
      { product_id: 42, quantity: 2 },
    ]);
    expect(res).toEqual({ orderId: '99', orderNumber: '1001' });
  });

  it('createOrder fills in dummy email/city when chatbot omits them', async () => {
    (WooCommerceService.findProductId as any).mockResolvedValue(42);
    (WooCommerceService.createOrder as any).mockResolvedValue({ id: 99, number: '1001' });
    await wooProvider.createOrder({
      customerName: 'John Doe', phone: '01711111111', address: 'Rd 1, Dhanmondi, Dhaka',
      productName: 'Serum', quantity: 2,
    });
    const billing = (WooCommerceService.createOrder as any).mock.calls[0][0].billing;
    expect(billing.email).toBe('customer01711111111@wishcarebd.com');
    expect(billing.city).toBe('Dhaka');
  });

  it('computes order history success rate', async () => {
    (WooCommerceService.fetchOrders as any).mockResolvedValue([
      { phone: '01711111111', status: 'Delivered' },
      { phone: '01711111111', status: 'Returned' },
      { phone: '01999999999', status: 'Delivered' },
    ]);
    const h = await wooProvider.getCustomerOrderHistory('01711111111');
    expect(h).toEqual({ total: 2, delivered: 1, successRate: 50 });
  });
});

describe('shopifyProvider', () => {
  it('normalizes products from variants', async () => {
    (ShopifyService.getProducts as any).mockResolvedValue([
      { id: 10, title: 'Cream', body_html: '<b>Rich</b>', variants: [{ id: 100, price: '300', inventory_quantity: 5 }] },
      { id: 11, title: 'Mask', body_html: '', variants: [{ id: 110, price: '120', inventory_quantity: 0 }] },
    ]);
    const products = await shopifyProvider.listProducts();
    expect(products[0]).toEqual({ id: '10', name: 'Cream', price: '300', inStock: true, description: 'Rich' });
    expect(products[1].inStock).toBe(false);
  });

  it('searchProducts matches long vision/OCR queries by useful tokens', async () => {
    (ShopifyService.getProducts as any).mockResolvedValue([
      { id: 10, title: 'WishCare Hair Growth Serum', body_html: 'Redensyl Anagain Baicapil', variants: [{ id: 100, price: '1200', inventory_quantity: 5 }] },
      { id: 11, title: 'WishCare 2% Salicylic Acid Face Wash', body_html: 'Face cleanser', variants: [{ id: 110, price: '650', inventory_quantity: 5 }] },
    ]);

    const products = await shopifyProvider.searchProducts(
      'WishCare Hair Growth Serum Concentrate Redensyl Anagain Baicapil'
    );

    expect(products.map((p) => p.name)).toEqual(['WishCare Hair Growth Serum']);
  });

  it('createOrder resolves variant_id', async () => {
    (ShopifyService.getProducts as any).mockResolvedValue([
      { id: 10, title: 'Cream', variants: [{ id: 100, price: '300' }] },
    ]);
    (ShopifyService.createOrder as any).mockResolvedValue({ id: 555, order_number: 2002 });
    const res = await shopifyProvider.createOrder({
      customerName: 'Jane Roe', phone: '01722222222', address: 'Rd 2', city: 'Dhaka',
      email: 'jane@x.com', productName: 'Cream', quantity: 1,
    });
    expect((ShopifyService.createOrder as any).mock.calls[0][0].line_items).toEqual([
      { variant_id: 100, quantity: 1 },
    ]);
    expect(res).toEqual({ orderId: '555', orderNumber: '2002' });
  });

  it('createOrder fills in dummy email/city when chatbot omits them', async () => {
    (ShopifyService.getProducts as any).mockResolvedValue([
      { id: 10, title: 'Cream', variants: [{ id: 100, price: '300' }] },
    ]);
    (ShopifyService.createOrder as any).mockResolvedValue({ id: 555, order_number: 2002 });
    await shopifyProvider.createOrder({
      customerName: 'Jane Roe', phone: '01722222222', address: 'Rd 2, Gulshan, Dhaka',
      productName: 'Cream', quantity: 1,
    });
    const payload = (ShopifyService.createOrder as any).mock.calls[0][0];
    expect(payload.email).toBe('customer01722222222@wishcarebd.com');
    expect(payload.customer.email).toBe('customer01722222222@wishcarebd.com');
    expect(payload.shipping_address.city).toBe('Dhaka');
  });
});
