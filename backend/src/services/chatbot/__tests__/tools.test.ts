import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../bdCourierService.js', () => ({
  isConfigured: vi.fn(() => false),
  checkCourier: vi.fn(),
  normalizeBdPhone: vi.fn((p: string) => (p ? '01711111111' : null)),
}));

vi.mock('../../courierScoring.js', () => ({
  deriveCourierRedFlags: vi.fn(() => []),
  riskLevelFromScore: vi.fn(() => 'safe'),
}));

vi.mock('../../notificationService.js', () => ({
  NotificationService: { addNotification: vi.fn() },
}));

import { isConfigured, checkCourier } from '../../bdCourierService.js';
import { deriveCourierRedFlags, riskLevelFromScore } from '../../courierScoring.js';
import { NotificationService } from '../../notificationService.js';
import { buildTools } from '../tools.js';
import type { CommerceProvider } from '../../commerce/index.js';

function fakeProvider(): CommerceProvider {
  return {
    name: 'woocommerce',
    listProducts: vi.fn().mockResolvedValue([{ id: '1', name: 'X', price: '10', inStock: true }]),
    searchProducts: vi.fn().mockResolvedValue([{ id: '1', name: 'X', price: '10', inStock: true }]),
    createOrder: vi.fn().mockResolvedValue({ orderId: '9', orderNumber: '100' }),
    getCustomerOrderHistory: vi.fn().mockResolvedValue({ total: 1, delivered: 1, successRate: 100 }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  (isConfigured as any).mockReturnValue(false);
  (riskLevelFromScore as any).mockReturnValue('safe');
  (deriveCourierRedFlags as any).mockReturnValue([]);
});

describe('buildTools', () => {
  it('returns no tools when provider is null', () => {
    const { declarations, handlers } = buildTools(null);
    expect(declarations).toEqual([]);
    expect(Object.keys(handlers)).toEqual([]);
  });

  it('exposes 4 tools when provider present', () => {
    const { declarations } = buildTools(fakeProvider());
    expect(declarations.map((d) => d.name).sort()).toEqual(
      ['check_order_history', 'get_available_products', 'get_product_details', 'place_order'].sort()
    );
  });

  it('get_available_products dispatches to provider', async () => {
    const provider = fakeProvider();
    const { handlers } = buildTools(provider);
    const out = await handlers.get_available_products({ limit: 5 });
    expect(provider.listProducts).toHaveBeenCalledWith(5);
    expect(out.success).toBe(true);
  });

  it('place_order creates order; no notification when courier risk not high', async () => {
    (isConfigured as any).mockReturnValue(true);
    (checkCourier as any).mockResolvedValue({ summary: {}, reports: [], couriers: {} });
    (riskLevelFromScore as any).mockReturnValue('safe');

    const provider = fakeProvider();
    const { handlers } = buildTools(provider);
    const out = await handlers.place_order({
      customerName: 'A B', phone: '01711111111', address: 'r', city: 'Dhaka',
      email: 'a@b.com', productName: 'X', quantity: 1,
    });

    expect(provider.createOrder).toHaveBeenCalled();
    expect(NotificationService.addNotification).not.toHaveBeenCalled();
    expect(out).toEqual({ success: true, orderId: '9', orderNumber: '100' });
  });

  it('place_order notifies admin on high courier risk but still places order', async () => {
    (isConfigured as any).mockReturnValue(true);
    (checkCourier as any).mockResolvedValue({ summary: {}, reports: [], couriers: {} });
    (riskLevelFromScore as any).mockReturnValue('high');

    const provider = fakeProvider();
    const { handlers } = buildTools(provider);
    const out = await handlers.place_order({
      customerName: 'A B', phone: '01711111111', address: 'r', city: 'Dhaka',
      email: 'a@b.com', productName: 'X', quantity: 1,
    });

    expect(NotificationService.addNotification).toHaveBeenCalledTimes(1);
    expect(provider.createOrder).toHaveBeenCalled();
    expect(out.success).toBe(true);
  });

  it('place_order proceeds when BDCourier check throws', async () => {
    (isConfigured as any).mockReturnValue(true);
    (checkCourier as any).mockRejectedValue(new Error('api down'));

    const provider = fakeProvider();
    const { handlers } = buildTools(provider);
    const out = await handlers.place_order({
      customerName: 'A B', phone: '01711111111', address: 'r', city: 'Dhaka',
      email: 'a@b.com', productName: 'X', quantity: 1,
    });

    expect(provider.createOrder).toHaveBeenCalled();
    expect(out.success).toBe(true);
  });
});
