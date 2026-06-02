# BDCourier Fraud Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the BDCourier `courier-check` API into fraud detection as a manual-only signal (per-order + global buttons) that derives red flags and bumps an order's risk score.

**Architecture:** New `bdCourierService` (API call + phone normalization) and `courierScoring` (thresholds → red flags) feed two new `fraudDetectionService` functions (`runCourierCheck`, `runCourierCheckBatch`) exposed via two new routes. A migration adds `courier_data` + `courier_checked_at` to `fraud_checks`. Frontend gets per-card and global "Courier check" buttons. No automatic invocation anywhere.

**Tech Stack:** TypeScript (NodeNext ESM), Express, Prisma/Postgres, axios, vitest (backend tests). Frontend: React + Vite + react-query.

---

## File Structure

- `backend/src/migrations/runMigrations.ts` — MODIFY: add two `ALTER TABLE fraud_checks ADD COLUMN IF NOT EXISTS`.
- `backend/prisma/schema.prisma` — MODIFY: add `courierData`, `courierCheckedAt` to `FraudCheck`.
- `backend/src/services/bdCourierService.ts` — NEW: `checkCourier`, `normalizeBdPhone`, `isConfigured`, types.
- `backend/src/services/fraudScoringEngine.ts` — MODIFY: extract `riskLevelFromScore(score)` helper, reuse it in `calculateRiskScore`.
- `backend/src/services/courierScoring.ts` — NEW: `deriveCourierRedFlags`, `COURIER_FLAG_NAMES`.
- `backend/src/services/fraudDetectionService.ts` — MODIFY: `runCourierCheck`, `runCourierCheckBatch`, extend `FraudCheckRecord` + `mapRowToFraudCheck`.
- `backend/src/routes/fraudRoutes.ts` — MODIFY: two new routes.
- `backend/.env` — MODIFY: add `BDCOURIER_API_KEY`.
- `frontend/src/services/api.ts` — MODIFY: `fraudApi.courierCheck`, `fraudApi.courierCheckAll`.
- `frontend/src/pages/FraudDetection.tsx` — MODIFY: buttons + courier display.

Backend test files under `backend/src/services/__tests__/`:
- `bdCourierService.test.ts`, `courierScoring.test.ts`, `fraudDetectionService.courier.test.ts`, `riskLevel.test.ts`.

---

## Task 1: DB migration + Prisma model

**Files:**
- Modify: `backend/src/migrations/runMigrations.ts`
- Modify: `backend/prisma/schema.prisma`

No unit test (schema change; verified by `prisma generate` + tsc in later tasks).

- [ ] **Step 1: Add ALTER statements to runMigrations.ts**

In `backend/src/migrations/runMigrations.ts`, immediately after the `fraud_checks` `CREATE TABLE` block (after the `$executeRawUnsafe` that ends at line ~87) and before `console.log('📦 Creating indexes...')`, insert:
```ts
    console.log('📦 Adding courier columns to fraud_checks...');
    await prisma.$executeRawUnsafe(
      `ALTER TABLE fraud_checks ADD COLUMN IF NOT EXISTS courier_data JSONB`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE fraud_checks ADD COLUMN IF NOT EXISTS courier_checked_at TIMESTAMP`
    );
```

- [ ] **Step 2: Add fields to the Prisma model**

In `backend/prisma/schema.prisma`, in `model FraudCheck`, add these two lines after the `reviewedBy` field:
```prisma
  courierData      Json?     @map("courier_data")
  courierCheckedAt DateTime? @map("courier_checked_at")
```

- [ ] **Step 3: Run the migration**

Run: `cd backend && npx tsx src/migrations/runMigrations.ts`
Expected: ends with `✅ All migrations completed successfully!` and exits 0. (Requires `DATABASE_URL` reachable.)

- [ ] **Step 4: Regenerate Prisma client**

Run: `cd backend && npx prisma generate`
Expected: "Generated Prisma Client" success. (Output goes to `src/generated/prisma`.)

- [ ] **Step 5: Typecheck**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add backend/src/migrations/runMigrations.ts backend/prisma/schema.prisma backend/src/generated/prisma
git commit -m "feat: add courier_data columns to fraud_checks"
```

---

## Task 2: bdCourierService

**Files:**
- Create: `backend/src/services/bdCourierService.ts`
- Test: `backend/src/services/__tests__/bdCourierService.test.ts`

- [ ] **Step 1: Write the failing test**

Create `backend/src/services/__tests__/bdCourierService.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run src/services/__tests__/bdCourierService.test.ts`
Expected: FAIL — cannot find module `../bdCourierService.js`.

- [ ] **Step 3: Create the service**

Create `backend/src/services/bdCourierService.ts`:
```ts
import axios from 'axios';

const BASE_URL = 'https://api.bdcourier.com/courier-check';

export interface CourierSummary {
  total_parcel: number;
  success_parcel: number;
  cancelled_parcel: number;
  success_ratio: number;
}

export interface CourierReport {
  id: string;
  name: string;
  details: string;
  created_at: string;
  courierLogo: string;
  courierName: string;
}

export interface CourierData {
  summary: CourierSummary;
  reports: CourierReport[];
  couriers: Record<string, any>;
}

export function isConfigured(): boolean {
  return !!process.env.BDCOURIER_API_KEY;
}

// Normalize a phone number to Bangladeshi local format 01XXXXXXXXX (11 digits).
// Returns null if a valid local number can't be derived.
export function normalizeBdPhone(phone: string): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('880')) digits = digits.slice(3);
  if (digits.length === 10 && digits.startsWith('1')) digits = '0' + digits;
  if (digits.length === 11 && digits.startsWith('01')) return digits;
  return null;
}

export async function checkCourier(phone: string): Promise<CourierData> {
  const apiKey = process.env.BDCOURIER_API_KEY;
  if (!apiKey) {
    throw new Error('BDCourier not configured');
  }

  let response;
  try {
    response = await axios.post(
      BASE_URL,
      { phone },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );
  } catch (error: any) {
    console.error('[BDCourier] Request error:', error.response?.data || error.message);
    throw new Error(`BDCourier request failed: ${error.response?.data?.message || error.message}`);
  }

  const payload = response.data;
  if (!payload || payload.status !== 'success' || !payload.data) {
    throw new Error(`BDCourier returned non-success: ${payload?.message || 'unknown'}`);
  }

  const { summary, ...couriers } = payload.data;
  return {
    summary: {
      total_parcel: Number(summary?.total_parcel) || 0,
      success_parcel: Number(summary?.success_parcel) || 0,
      cancelled_parcel: Number(summary?.cancelled_parcel) || 0,
      success_ratio: Number(summary?.success_ratio) || 0,
    },
    reports: Array.isArray(payload.reports) ? payload.reports : [],
    couriers,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run src/services/__tests__/bdCourierService.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/bdCourierService.ts backend/src/services/__tests__/bdCourierService.test.ts
git commit -m "feat: add bdCourierService (courier-check API client)"
```

---

## Task 3: riskLevelFromScore helper + courierScoring

**Files:**
- Modify: `backend/src/services/fraudScoringEngine.ts`
- Create: `backend/src/services/courierScoring.ts`
- Test: `backend/src/services/__tests__/riskLevel.test.ts`
- Test: `backend/src/services/__tests__/courierScoring.test.ts`

- [ ] **Step 1: Write the failing test for riskLevelFromScore**

Create `backend/src/services/__tests__/riskLevel.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { riskLevelFromScore } from '../fraudScoringEngine.js';

describe('riskLevelFromScore', () => {
  it('safe at <= 30', () => {
    expect(riskLevelFromScore(0)).toBe('safe');
    expect(riskLevelFromScore(30)).toBe('safe');
  });
  it('medium at 31..50', () => {
    expect(riskLevelFromScore(31)).toBe('medium');
    expect(riskLevelFromScore(50)).toBe('medium');
  });
  it('high at > 50', () => {
    expect(riskLevelFromScore(51)).toBe('high');
    expect(riskLevelFromScore(120)).toBe('high');
  });
});
```

- [ ] **Step 2: Run it (fails — not exported)**

Run: `cd backend && npx vitest run src/services/__tests__/riskLevel.test.ts`
Expected: FAIL — `riskLevelFromScore` is not exported.

- [ ] **Step 3: Extract the helper in fraudScoringEngine.ts**

In `backend/src/services/fraudScoringEngine.ts`, add this exported function just above `export async function calculateRiskScore`:
```ts
export function riskLevelFromScore(score: number): 'safe' | 'medium' | 'high' {
  if (score <= 30) return 'safe';
  if (score <= 50) return 'medium';
  return 'high';
}
```
Then replace the inline level block inside `calculateRiskScore` (the `let riskLevel ...` through the `else { riskLevel = 'high'; }`) with:
```ts
  const riskLevel = riskLevelFromScore(totalPoints);
```

- [ ] **Step 4: Run it (passes)**

Run: `cd backend && npx vitest run src/services/__tests__/riskLevel.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing test for courierScoring**

Create `backend/src/services/__tests__/courierScoring.test.ts`:
```ts
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
```

- [ ] **Step 6: Run it (fails — module missing)**

Run: `cd backend && npx vitest run src/services/__tests__/courierScoring.test.ts`
Expected: FAIL — cannot find module `../courierScoring.js`.

- [ ] **Step 7: Create courierScoring.ts**

Create `backend/src/services/courierScoring.ts`:
```ts
import type { RedFlag } from './fraudScoringEngine.js';
import type { CourierData } from './bdCourierService.js';

export const COURIER_FLAG_NAMES = [
  'Poor Courier Delivery History',
  'Below-Average Courier History',
  'No Courier History',
  'Fraud Reported at Courier',
];

export function deriveCourierRedFlags(data: CourierData): RedFlag[] {
  const flags: RedFlag[] = [];
  const { total_parcel, success_ratio } = data.summary;

  if (total_parcel === 0) {
    flags.push({
      name: 'No Courier History',
      points: 10,
      description: 'No prior courier deliveries found',
    });
  } else if (success_ratio < 50) {
    flags.push({
      name: 'Poor Courier Delivery History',
      points: 30,
      description: `Courier success ratio ${success_ratio}% (< 50%)`,
    });
  } else if (success_ratio < 70) {
    flags.push({
      name: 'Below-Average Courier History',
      points: 15,
      description: `Courier success ratio ${success_ratio}% (50-70%)`,
    });
  }

  if (data.reports.length > 0) {
    flags.push({
      name: 'Fraud Reported at Courier',
      points: 25,
      description: `${data.reports.length} fraud report(s) at courier(s)`,
    });
  }

  return flags;
}
```

- [ ] **Step 8: Run both test files (pass)**

Run: `cd backend && npx vitest run src/services/__tests__/courierScoring.test.ts src/services/__tests__/riskLevel.test.ts`
Expected: PASS (3 + 7 tests).

- [ ] **Step 9: Typecheck**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add backend/src/services/fraudScoringEngine.ts backend/src/services/courierScoring.ts backend/src/services/__tests__/riskLevel.test.ts backend/src/services/__tests__/courierScoring.test.ts
git commit -m "feat: add courier scoring + extract riskLevelFromScore helper"
```

---

## Task 4: fraudDetectionService.runCourierCheck (+ batch)

**Files:**
- Modify: `backend/src/services/fraudDetectionService.ts`
- Test: `backend/src/services/__tests__/fraudDetectionService.courier.test.ts`

- [ ] **Step 1: Extend FraudCheckRecord + mapRowToFraudCheck**

In `backend/src/services/fraudDetectionService.ts`, add to the `FraudCheckRecord` interface (after `updatedAt: Date | null;`):
```ts
  courierData: any | null;
  courierCheckedAt: Date | null;
```
And in `mapRowToFraudCheck`, add to the returned object (after `updatedAt: row.reviewedAt`):
```ts
    courierData: row.courierData ?? null,
    courierCheckedAt: row.courierCheckedAt ?? null,
```
(There is a second object literal built in `scanNewOrders` typed as `FraudCheckRecord` — add `courierData: null,` and `courierCheckedAt: null,` to that `fraudRecord` object too so it still satisfies the interface.)

- [ ] **Step 2: Write the failing test**

Create `backend/src/services/__tests__/fraudDetectionService.courier.test.ts`:
```ts
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
    // 10 (New Customer) + 30 (Poor) + 25 (Reported) = 65 -> high
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
    (checkCourier as any).mockResolvedValue(courierGood); // now good -> no courier flag
    (prisma.fraudCheck.update as any).mockImplementation(({ data }: any) => ({
      id: 1, orderId: 'SHP-1', orderNumber: '1', customerName: null, customerPhone: '01712345678',
      customerEmail: null, billingCountry: null, shippingCountry: null, shippingAddress: null,
      amount: 0, status: 'pending', reviewedBy: null, scannedAt: new Date(), reviewedAt: null,
      ...data,
    }));

    await runCourierCheck('SHP-1');
    const updateArg = (prisma.fraudCheck.update as any).mock.calls[0][0];
    const names = updateArg.data.redFlags.map((f: any) => f.name);
    // old courier flag removed, none re-added; only base flag remains
    expect(names).toEqual(['New Customer']);
    expect(updateArg.data.riskScore).toBe(10);
    expect(updateArg.data.riskLevel).toBe('safe');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend && npx vitest run src/services/__tests__/fraudDetectionService.courier.test.ts`
Expected: FAIL — `runCourierCheck` not exported.

- [ ] **Step 4: Implement the functions**

In `backend/src/services/fraudDetectionService.ts`, replace the existing import line:
```ts
import { calculateRiskScore, OrderData, ScoringResult } from './fraudScoringEngine.js';
```
with:
```ts
import { calculateRiskScore, OrderData, ScoringResult, RedFlag, riskLevelFromScore } from './fraudScoringEngine.js';
```
and add these two new imports after it:
```ts
import { checkCourier, normalizeBdPhone } from './bdCourierService.js';
import { deriveCourierRedFlags, COURIER_FLAG_NAMES } from './courierScoring.js';
```

Then append these exported functions at the end of the file:
```ts
export async function runCourierCheck(orderId: string): Promise<FraudCheckRecord> {
  const record = await prisma.fraudCheck.findUnique({ where: { orderId } });
  if (!record) {
    throw new Error(`Fraud check not found for order ${orderId}`);
  }

  const phone = normalizeBdPhone(record.customerPhone || '');
  if (!phone) {
    throw new Error('No valid BD phone for this order');
  }

  const courierData = await checkCourier(phone);
  const courierFlags = deriveCourierRedFlags(courierData);

  const existingFlags: RedFlag[] = Array.isArray(record.redFlags)
    ? (record.redFlags as unknown as RedFlag[])
    : [];
  const baseFlags = existingFlags.filter((f) => !COURIER_FLAG_NAMES.includes(f.name));
  const mergedFlags = [...baseFlags, ...courierFlags];

  const riskScore = mergedFlags.reduce((sum, f) => sum + f.points, 0);
  const riskLevel = riskLevelFromScore(riskScore);

  const redFlagsJson = JSON.parse(JSON.stringify(mergedFlags));
  const courierJson = JSON.parse(JSON.stringify(courierData));

  const updated = await prisma.fraudCheck.update({
    where: { orderId },
    data: {
      redFlags: redFlagsJson,
      riskScore,
      riskLevel,
      courierData: courierJson,
      courierCheckedAt: new Date(),
    },
  });

  return mapRowToFraudCheck(updated);
}

export async function runCourierCheckBatch(
  orderIds: string[]
): Promise<{ orderId: string; ok: boolean; error?: string }[]> {
  const results: { orderId: string; ok: boolean; error?: string }[] = [];
  for (const orderId of orderIds) {
    try {
      await runCourierCheck(orderId);
      results.push({ orderId, ok: true });
    } catch (error: any) {
      results.push({ orderId, ok: false, error: error.message });
    }
  }
  return results;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && npx vitest run src/services/__tests__/fraudDetectionService.courier.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Typecheck + full suite**

Run: `cd backend && npx tsc --noEmit && npm test`
Expected: typecheck clean; all tests pass.

- [ ] **Step 7: Commit**

```bash
git add backend/src/services/fraudDetectionService.ts backend/src/services/__tests__/fraudDetectionService.courier.test.ts
git commit -m "feat: add runCourierCheck + batch to fraud detection service"
```

---

## Task 5: Routes

**Files:**
- Modify: `backend/src/routes/fraudRoutes.ts`

No new unit test (thin controllers; covered by service tests + manual). Verified by typecheck.

- [ ] **Step 1: Update imports**

In `backend/src/routes/fraudRoutes.ts`, extend the import from `../services/fraudDetectionService.js` to include the two new functions:
```ts
import {
  scanNewOrders,
  getFraudChecks,
  getFraudCheckByOrderId,
  updateFraudCheckStatus,
  runCourierCheck,
  runCourierCheckBatch
} from '../services/fraudDetectionService.js';
```

- [ ] **Step 2: Add the batch route (before the `:orderId` param routes to avoid path collision)**

In `backend/src/routes/fraudRoutes.ts`, add immediately after the `router.post('/scan', ...)` handler:
```ts
router.post('/courier-check', async (req, res) => {
  try {
    const { orderIds } = req.body;
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ success: false, error: 'orderIds must be a non-empty array' });
    }
    const results = await runCourierCheckBatch(orderIds);
    return res.json({ success: true, results });
  } catch (error: any) {
    console.error('[Fraud Routes] Error in batch courier check:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/courier-check/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const updated = await runCourierCheck(orderId);
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    const msg = error.message || 'Courier check failed';
    if (msg.includes('not found')) {
      return res.status(404).json({ success: false, error: msg });
    }
    if (msg.includes('No valid BD phone')) {
      return res.status(400).json({ success: false, error: msg });
    }
    console.error('[Fraud Routes] Error in courier check:', msg);
    return res.status(500).json({ success: false, error: msg });
  }
});
```

- [ ] **Step 3: Typecheck**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/fraudRoutes.ts
git commit -m "feat: add courier-check routes (single + batch)"
```

---

## Task 6: Config — BDCOURIER_API_KEY

**Files:**
- Modify: `backend/.env`

- [ ] **Step 1: Add the env var**

Append to `backend/.env`:
```
# BDCourier courier-check API key (https://bdcourier.com). Server-side only.
BDCOURIER_API_KEY=
```
Leave blank for the deployer to fill with a freshly rotated key. (`.env` is gitignored — no commit. If a committed `.env.example` exists, add the line there instead.)

- [ ] **Step 2: Verify gitignore status**

Run: `git check-ignore backend/.env`
Expected: prints `backend/.env` (gitignored → nothing to commit). If it prints nothing, the file is tracked — then commit it with the blank value.

---

## Task 7: Frontend — API client + buttons + display

**Files:**
- Modify: `frontend/src/services/api.ts`
- Modify: `frontend/src/pages/FraudDetection.tsx`

No unit test (no frontend test runner configured); verified by `tsc -b` + build + manual.

- [ ] **Step 1: Add API methods**

In `frontend/src/services/api.ts`, inside the `fraudApi` object, add after `updateFraudStatus`:
```ts
  courierCheck: async (orderId: string) => {
    const response = await axios.post(`${API_BASE_URL}/fraud/courier-check/${orderId}`);
    return response.data;
  },
  courierCheckAll: async (orderIds: string[]) => {
    const response = await axios.post(`${API_BASE_URL}/fraud/courier-check`, { orderIds });
    return response.data;
  },
```
(Ensure the preceding `updateFraudStatus` entry ends with a comma.)

- [ ] **Step 2: Wire mutations + global button in FraudDetection.tsx**

In `frontend/src/pages/FraudDetection.tsx`, add a `Truck` icon to the lucide import list:
```tsx
  ChevronDown,
  Truck,
```
After the `updateStatusMutation` declaration, add:
```tsx
  const courierMutation = useMutation({
    mutationFn: (orderId: string) => fraudApi.courierCheck(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraudChecks'] });
    },
  });

  const courierAllMutation = useMutation({
    mutationFn: (orderIds: string[]) => fraudApi.courierCheckAll(orderIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraudChecks'] });
    },
  });
```

- [ ] **Step 3: Add the global "Courier check all" button**

In the header button group (next to "Run scan", before the "Settings" button), add:
```tsx
          <Button
            variant="secondary"
            size="md"
            onClick={() => courierAllMutation.mutate(fraudList.map((i: any) => i.orderId || i.id))}
            disabled={courierAllMutation.isPending || fraudList.length === 0}
            className="gap-2"
          >
            {courierAllMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Truck className="w-4 h-4" />
            )}
            Courier check all
          </Button>
```

- [ ] **Step 4: Add per-card "Courier check" button + courier display**

In the per-card action button group (the `div` containing Clear/Secure/Block), add as the first button:
```tsx
                   <Button
                     variant="secondary"
                     size="sm"
                     onClick={() => courierMutation.mutate(item.orderId || item.id)}
                     disabled={courierMutation.isPending}
                     className="gap-1.5"
                   >
                     {courierMutation.isPending && courierMutation.variables === (item.orderId || item.id) ? (
                       <Loader2 className="w-3.5 h-3.5 animate-spin" />
                     ) : (
                       <Truck className="w-3.5 h-3.5" />
                     )}
                     Courier
                   </Button>
```
And in the card body, after the existing reasons `<p>` (the one rendering `item.riskReasons`), add a courier summary line:
```tsx
                    {item.courierData?.summary && (
                      <p className="font-mono text-xs text-muted-foreground mt-1">
                        Courier: {item.courierData.summary.success_ratio}% success
                        {item.courierData.reports?.length ? ` · ${item.courierData.reports.length} report(s)` : ''}
                      </p>
                    )}
```

- [ ] **Step 5: Typecheck + build**

Run: `cd frontend && npx tsc -b`
Expected: no errors.
Run: `cd frontend && npm run build`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/services/api.ts frontend/src/pages/FraudDetection.tsx
git commit -m "feat: courier check buttons + display on fraud page"
```

---

## Final Verification

- [ ] **Backend suite:** `cd backend && npm test` → all tests pass.
- [ ] **Backend typecheck:** `cd backend && npx tsc --noEmit` → clean.
- [ ] **Backend build:** `cd backend && npm run build` → compiles.
- [ ] **Frontend typecheck/build:** `cd frontend && npm run build` → succeeds.
- [ ] **No auto-trigger:** confirm courier check is invoked only from the two routes — `grep -rn "runCourierCheck\|checkCourier" backend/src --include=*.ts | grep -v __tests__` shows references only in `bdCourierService.ts`, `fraudDetectionService.ts`, and `fraudRoutes.ts` (NOT in `index.ts` cron or any order/webhook path).
- [ ] **Manual smoke (optional, costs an API call):** with `BDCOURIER_API_KEY` set and a fraud check present, `curl -X POST http://localhost:5000/api/fraud/courier-check/<orderId>` returns `{ success: true, data: {...courierData...} }`.
```
