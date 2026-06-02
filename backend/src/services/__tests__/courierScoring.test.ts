import { describe, it, expect } from 'vitest';
import { deriveCourierRedFlags, COURIER_FLAG_NAMES } from '../courierScoring.js';
import type { CourierData } from '../bdCourierService.js';

function data(partial: Partial<CourierData['summary']>, reports: any[] = []): CourierData {
  return {
    summary: { total_parcel: 10, success_parcel: 8, cancelled_parcel: 2, success_ratio: 80, ...partial },
    reports,
    couriers: {},
  };
}

describe('deriveCourierRedFlags', () => {
  it('no flags for good history, no reports', () => {
    expect(deriveCourierRedFlags(data({ success_ratio: 80 }))).toEqual([]);
  });
  it('poor history below 50', () => {
    const flags = deriveCourierRedFlags(data({ success_ratio: 49 }));
    expect(flags.map(f => f.name)).toEqual(['Poor Courier Delivery History']);
    expect(flags[0].points).toBe(30);
  });
  it('below-average between 50 and 69', () => {
    const flags = deriveCourierRedFlags(data({ success_ratio: 69 }));
    expect(flags.map(f => f.name)).toEqual(['Below-Average Courier History']);
    expect(flags[0].points).toBe(15);
  });
  it('no ratio flag at exactly 70', () => {
    expect(deriveCourierRedFlags(data({ success_ratio: 70 }))).toEqual([]);
  });
  it('no history when total_parcel is 0 (and skips ratio flags)', () => {
    const flags = deriveCourierRedFlags(data({ total_parcel: 0, success_ratio: 0 }));
    expect(flags.map(f => f.name)).toEqual(['No Courier History']);
    expect(flags[0].points).toBe(10);
  });
  it('reports flag is independent and additive', () => {
    const flags = deriveCourierRedFlags(data({ success_ratio: 40 }, [{ id: '1' }, { id: '2' }]));
    const names = flags.map(f => f.name);
    expect(names).toContain('Poor Courier Delivery History');
    expect(names).toContain('Fraud Reported at Courier');
    const reportFlag = flags.find(f => f.name === 'Fraud Reported at Courier')!;
    expect(reportFlag.points).toBe(25);
  });
  it('COURIER_FLAG_NAMES lists all four', () => {
    expect(COURIER_FLAG_NAMES).toEqual([
      'Poor Courier Delivery History',
      'Below-Average Courier History',
      'No Courier History',
      'Fraud Reported at Courier',
    ]);
  });
});
