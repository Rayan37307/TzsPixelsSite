import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { checkCourier, normalizeBdPhone, isConfigured } from '../bdCourierService.js';

vi.mock('axios');

describe('normalizeBdPhone', () => {
  it('keeps a valid local number', () => {
    expect(normalizeBdPhone('01712345678')).toBe('01712345678');
  });
  it('strips +880', () => {
    expect(normalizeBdPhone('+8801712345678')).toBe('01712345678');
  });
  it('strips 880', () => {
    expect(normalizeBdPhone('8801712345678')).toBe('01712345678');
  });
  it('prefixes 0 for a 10-digit starting with 1', () => {
    expect(normalizeBdPhone('1712345678')).toBe('01712345678');
  });
  it('handles spaces and dashes', () => {
    expect(normalizeBdPhone('+880 17-1234 5678')).toBe('01712345678');
  });
  it('returns null for junk', () => {
    expect(normalizeBdPhone('hello')).toBeNull();
    expect(normalizeBdPhone('')).toBeNull();
    expect(normalizeBdPhone('12345')).toBeNull();
  });
});

describe('bdCourierService', () => {
  beforeEach(() => {
    process.env.BDCOURIER_API_KEY = 'KEY123';
  });

  it('isConfigured reflects env', () => {
    expect(isConfigured()).toBe(true);
    delete process.env.BDCOURIER_API_KEY;
    expect(isConfigured()).toBe(false);
  });

  it('checkCourier posts with bearer auth and parses data', async () => {
    (axios.post as any).mockResolvedValue({
      data: {
        status: 'success',
        data: {
          summary: { total_parcel: 10, success_parcel: 8, cancelled_parcel: 2, success_ratio: 80 },
          pathao: { name: 'Pathao', success_ratio: 80 },
        },
        reports: [{ id: 'a', name: 'X', details: 'd', created_at: 't', courierLogo: 'l', courierName: 'Pathao' }],
      },
    });
    const result = await checkCourier('01712345678');
    const [url, body, config] = (axios.post as any).mock.calls[0];
    expect(url).toBe('https://api.bdcourier.com/courier-check');
    expect(body).toEqual({ phone: '01712345678' });
    expect(config.headers.Authorization).toBe('Bearer KEY123');
    expect(result.summary.success_ratio).toBe(80);
    expect(result.reports).toHaveLength(1);
    expect(result.couriers.pathao.name).toBe('Pathao');
  });

  it('checkCourier throws when not configured', async () => {
    delete process.env.BDCOURIER_API_KEY;
    await expect(checkCourier('01712345678')).rejects.toThrow('BDCourier not configured');
  });

  it('checkCourier throws on non-success response', async () => {
    (axios.post as any).mockResolvedValue({ data: { status: 'error', message: 'bad' } });
    await expect(checkCourier('01712345678')).rejects.toThrow();
  });
});
