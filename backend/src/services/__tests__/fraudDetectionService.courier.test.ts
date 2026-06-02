import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/db.js', () => ({
  default: {
    fraudCheck: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));
vi.mock('../bdCourierService.js', () => ({
  checkCourier: vi.fn(),
  normalizeBdPhone: vi.fn(),
}));

import prisma from '../../config/db.js';
import { checkCourier, normalizeBdPhone } from '../bdCourierService.js';
import { runCourierCheck } from '../fraudDetectionService.js';

const courierGood = {
  summary: { total_parcel: 10, success_parcel: 9, cancelled_parcel: 1, success_ratio: 90 },
  reports: [],
  couriers: {},
};
const courierBad = {
  summary: { total_parcel: 10, success_parcel: 3, cancelled_parcel: 7, success_ratio: 30 },
  reports: [{ id: '1' }],
  couriers: {},
};

beforeEach(() => {
  (normalizeBdPhone as any).mockReturnValue('01712345678');
});

describe('runCourierCheck', () => {
  it('throws if order not found', async () => {
    (prisma.fraudCheck.findUnique as any).mockResolvedValue(null);
    await expect(runCourierCheck('SHP-1')).rejects.toThrow('not found');
  });

  it('throws if phone cannot be normalized', async () => {
    (prisma.fraudCheck.findUnique as any).mockResolvedValue({
      orderId: 'SHP-1', customerPhone: 'junk', redFlags: [],
    });
    (normalizeBdPhone as any).mockReturnValue(null);
    await expect(runCourierCheck('SHP-1')).rejects.toThrow('No valid BD phone');
  });

  it('adds courier flags, recomputes score and level, persists courier_data', async () => {
    (prisma.fraudCheck.findUnique as any).mockResolvedValue({
      orderId: 'SHP-1',
      customerPhone: '01712345678',
      redFlags: [{ name: 'New Customer', points: 10, description: 'x' }],
    });
    (checkCourier as any).mockResolvedValue(courierBad);
    (prisma.fraudCheck.update as any).mockImplementation(({ data }: any) => ({
      id: 1, orderId: 'SHP-1', orderNumber: '1', customerName: null, customerPhone: '01712345678',
      customerEmail: null, billingCountry: null, shippingCountry: null, shippingAddress: null,
      amount: 0, status: 'pending', reviewedBy: null, scannedAt: new Date(), reviewedAt: null,
      ...data,
    }));

    const result = await runCourierCheck('SHP-1');

    const updateArg = (prisma.fraudCheck.update as any).mock.calls[0][0];
    expect(updateArg.data.riskScore).toBe(65);
    expect(updateArg.data.riskLevel).toBe('high');
    expect(updateArg.data.courierData).toEqual(courierBad);
    expect(updateArg.data.courierCheckedAt).toBeInstanceOf(Date);
    const names = updateArg.data.redFlags.map((f: any) => f.name);
    expect(names).toContain('New Customer');
    expect(names).toContain('Poor Courier Delivery History');
    expect(result.riskScore).toBe(65);
  });

  it('does not duplicate courier flags on re-check', async () => {
    (prisma.fraudCheck.findUnique as any).mockResolvedValue({
      orderId: 'SHP-1',
      customerPhone: '01712345678',
      redFlags: [
        { name: 'New Customer', points: 10, description: 'x' },
        { name: 'Poor Courier Delivery History', points: 30, description: 'old' },
      ],
    });
    (checkCourier as any).mockResolvedValue(courierGood);
    (prisma.fraudCheck.update as any).mockImplementation(({ data }: any) => ({
      id: 1, orderId: 'SHP-1', orderNumber: '1', customerName: null, customerPhone: '01712345678',
      customerEmail: null, billingCountry: null, shippingCountry: null, shippingAddress: null,
      amount: 0, status: 'pending', reviewedBy: null, scannedAt: new Date(), reviewedAt: null,
      ...data,
    }));

    await runCourierCheck('SHP-1');
    const updateArg = (prisma.fraudCheck.update as any).mock.calls[0][0];
    const names = updateArg.data.redFlags.map((f: any) => f.name);
    expect(names).toEqual(['New Customer']);
    expect(updateArg.data.riskScore).toBe(10);
    expect(updateArg.data.riskLevel).toBe('safe');
  });
});
