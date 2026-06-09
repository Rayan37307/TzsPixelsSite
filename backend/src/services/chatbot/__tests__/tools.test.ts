import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

vi.mock('axios');

vi.mock('@google/generative-ai', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return { ...actual, GoogleGenerativeAI: vi.fn() };
});

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
    cancelOrder: vi.fn().mockResolvedValue({ success: true, message: 'Order #9 cancelled successfully.' }),
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
  it('returns only the vision tool when provider is null', () => {
    const { declarations, handlers } = buildTools(null);
    expect(declarations.map((d) => d.name)).toEqual(['recognize_product_from_image']);
    expect(Object.keys(handlers)).toEqual(['recognize_product_from_image']);
  });

  it('exposes 6 tools when provider present', () => {
    const { declarations } = buildTools(fakeProvider());
    expect(declarations.map((d) => d.name).sort()).toEqual(
      [
        'cancel_order',
        'check_order_history',
        'get_available_products',
        'get_product_details',
        'place_order',
        'recognize_product_from_image',
      ].sort()
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

describe('recognize_product_from_image handler', () => {
  const mockGenerateContent = vi.fn();

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key';
    (axios.get as any).mockResolvedValue({
      data: Buffer.from('fake-bytes'),
      headers: { 'content-type': 'image/jpeg' },
    });
    // Must be a regular function (not arrow) — arrow functions aren't constructible,
    // and `new GoogleGenerativeAI(...)` in production code goes through Reflect.construct.
    (GoogleGenerativeAI as any).mockImplementation(function (this: any) {
      this.getGenerativeModel = () => ({ generateContent: mockGenerateContent });
    });
    mockGenerateContent.mockResolvedValue({
      response: { text: () => 'WishCare Vitamin C Serum, 30ml bottle clearly visible' },
    });
  });

  it('fetches the image and returns a high-confidence description', async () => {
    const { handlers } = buildTools(null);
    const out = await handlers.recognize_product_from_image({ imageUrl: 'https://img/p.jpg' });

    expect(axios.get).toHaveBeenCalledWith(
      'https://img/p.jpg',
      expect.objectContaining({ responseType: 'arraybuffer', timeout: 10000 })
    );
    expect(out).toEqual({
      success: true,
      description: 'WishCare Vitamin C Serum, 30ml bottle clearly visible',
      confidence: 'high',
    });
  });

  it('keeps screenshot/product-page images high confidence when product text is readable', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => 'Screenshot of WishCare Ceramide Body Lotion product page; search query: ceramide body lotion' },
    });

    const { handlers } = buildTools(null);
    const out = await handlers.recognize_product_from_image({ imageUrl: 'https://img/screenshot.jpg' });

    expect(out.success).toBe(true);
    expect(out.confidence).toBe('high');
  });

  it('marks confidence low when the model flags a blurry or unclear photo', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => 'The photo is blurry and hard to read clearly.' },
    });

    const { handlers } = buildTools(null);
    const out = await handlers.recognize_product_from_image({ imageUrl: 'https://img/blurry.jpg' });

    expect(out.success).toBe(true);
    expect(out.confidence).toBe('low');
  });

  it('returns an error when GEMINI_API_KEY is not configured', async () => {
    delete process.env.GEMINI_API_KEY;

    const { handlers } = buildTools(null);
    const out = await handlers.recognize_product_from_image({ imageUrl: 'https://img/p.jpg' });

    expect(out).toEqual({ success: false, error: 'Image recognition not configured' });
  });

  it('returns an error when the image fetch fails', async () => {
    (axios.get as any).mockRejectedValue(new Error('404 not found'));

    const { handlers } = buildTools(null);
    const out = await handlers.recognize_product_from_image({ imageUrl: 'https://img/missing.jpg' });

    expect(out).toEqual({ success: false, error: '404 not found' });
  });

  it('returns an error when a Meta CDN URL is missing signed hash params', async () => {
    const { handlers } = buildTools(null);
    const out = await handlers.recognize_product_from_image({
      imageUrl: 'https://scontent-sea5-1.xx.fbcdn.net/v/t1.15752-9/photo.png?stp=dst-jpg_tt6&_n',
    });

    expect(axios.get).not.toHaveBeenCalled();
    expect(out).toEqual({
      success: false,
      error: 'Facebook image URL is incomplete or missing its signed hash parameters',
    });
  });

  it('returns an error when the image URL returns a non-image response', async () => {
    (axios.get as any).mockResolvedValue({
      data: Buffer.from('<html>bad hash</html>'),
      headers: { 'content-type': 'text/html' },
    });

    const { handlers } = buildTools(null);
    const out = await handlers.recognize_product_from_image({ imageUrl: 'https://img/bad.jpg' });

    expect(out).toEqual({ success: false, error: 'Image URL did not return an image (text/html)' });
  });

  it('returns an error when no imageUrl is provided', async () => {
    const { handlers } = buildTools(null);
    const out = await handlers.recognize_product_from_image({});

    expect(out).toEqual({ success: false, error: 'No image URL provided' });
  });
});
