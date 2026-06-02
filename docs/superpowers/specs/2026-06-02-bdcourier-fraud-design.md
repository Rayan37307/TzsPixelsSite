# BDCourier Fraud Integration — Design

**Date:** 2026-06-02
**Status:** Approved
**Scope:** Integrate the BDCourier `courier-check` API into the existing fraud detection system as a **manual-only** signal (per-order + global buttons). No automatic trigger on order placement or in the cron scan.

## Goal

Add courier delivery history (per-courier success ratios + fraud reports, by phone number) as a fraud-risk signal. Because BDCourier is a **paid per-call API**, it is invoked only on explicit human action from the dashboard — never automatically.

- Two triggers: a **per-order** "Courier check" button on each fraud card, and a **global** "Courier check all" button that checks every order in the current filtered list.
- Courier results derive red flags, bump the order's `riskScore`, and re-derive its risk level.
- Raw courier summary is persisted and shown on the card.

Out of scope: changing the existing cron scan or phone/email/amount scoring; automatic courier checks of any kind.

## Background / Current State

- Fraud scoring lives in `backend/src/services/fraudScoringEngine.ts` (`calculateRiskScore(order) -> { riskScore, riskLevel, redFlags }`, levels: ≤30 safe, ≤50 medium, else high).
- `backend/src/services/fraudDetectionService.ts` `scanNewOrders()` fetches Shopify orders, scores each, upserts into the `fraud_checks` table. Also exposes `getFraudChecks`, `getFraudCheckByOrderId`, `updateFraudCheckStatus`.
- `scanNewOrders` runs on a **cron every 30 min** (`backend/src/index.ts:50`) and via manual `POST /api/fraud/scan`. **No order-placement trigger exists.**
- Routes in `backend/src/routes/fraudRoutes.ts` mounted at `/api/fraud`.
- `FraudCheck` Prisma model + `fraud_checks` table store the records (`redFlags` is `Json`).
- Frontend page `frontend/src/pages/FraudDetection.tsx`: "Run scan" button (→ `fraudApi.triggerFraudScan`), per-card Clear/Secure/Block. API client in `frontend/src/services/api.ts` (`fraudApi`).

## BDCourier API

- `POST https://api.bdcourier.com/courier-check`
- Headers: `Content-Type: application/json`, `Authorization: Bearer ${BDCOURIER_API_KEY}`
- Body: `{ "phone": "017xxxxxxxx" }`
- Success response shape:
  - `data.summary` → `{ total_parcel, success_parcel, cancelled_parcel, success_ratio }`
  - `data.<courier>` → per-courier objects (pathao, steadfast, …), each `{ name, logo, total_parcel, success_parcel, cancelled_parcel, success_ratio }`
  - `reports` → array of `{ id, name, details, created_at, courierLogo, courierName }`
- Phone must be BD local format `01XXXXXXXXX` (11 digits).

## Architecture

```
services/bdCourierService.ts   // NEW: call API, normalize phone, parse/validate response
services/courierScoring.ts     // NEW: deriveCourierRedFlags(courierData) -> RedFlag[]
services/fraudDetectionService.ts  // MODIFY: + runCourierCheck(orderId), runCourierCheckBatch(orderIds)
routes/fraudRoutes.ts          // MODIFY: + POST /courier-check/:orderId, POST /courier-check
```

### bdCourierService.ts

```ts
export interface CourierSummary {
  total_parcel: number;
  success_parcel: number;
  cancelled_parcel: number;
  success_ratio: number;
}
export interface CourierReport {
  id: string; name: string; details: string;
  created_at: string; courierLogo: string; courierName: string;
}
export interface CourierData {
  summary: CourierSummary;
  reports: CourierReport[];
  couriers: Record<string, any>; // per-courier breakdown, stored raw for display
}

export function normalizeBdPhone(phone: string): string | null; // -> '01XXXXXXXXX' or null if not derivable
export async function checkCourier(phone: string): Promise<CourierData>; // throws on API error / not configured
export function isConfigured(): boolean; // BDCOURIER_API_KEY present
```

- `normalizeBdPhone`: strip non-digits; map `+8801…`/`8801…`/`1…` → `01…`; require final length 11 starting `01`; else `null`.
- `checkCourier`: throws `Error('BDCourier not configured')` if no key; throws on non-success HTTP / `status !== 'success'`. Returns `{ summary, reports, couriers }` where `couriers` is the set of per-courier keys from `data` excluding `summary`.

### courierScoring.ts

```ts
import type { RedFlag } from './fraudScoringEngine.js';
export const COURIER_FLAG_NAMES: string[]; // the four names below, for dedupe
export function deriveCourierRedFlags(data: CourierData): RedFlag[];
```

Thresholds (on `data.summary`):
| Condition | name | points | description |
|---|---|---|---|
| `success_ratio < 50` | `Poor Courier Delivery History` | 30 | `Courier success ratio X% (< 50%)` |
| `50 <= success_ratio < 70` | `Below-Average Courier History` | 15 | `Courier success ratio X% (50–70%)` |
| `total_parcel === 0` | `No Courier History` | 10 | `No prior courier deliveries found` |
| `reports.length > 0` | `Fraud Reported at Courier` | 25 | `N fraud report(s) at courier(s)` |

`success_ratio` flags are mutually exclusive (use else-if). `No Courier History` only when `total_parcel === 0` (and in that case the ratio flags are skipped). The reports flag is independent.

### fraudDetectionService.ts additions

```ts
export async function runCourierCheck(orderId: string): Promise<FraudCheckRecord>;
export async function runCourierCheckBatch(orderIds: string[]):
  Promise<{ orderId: string; ok: boolean; error?: string }[]>;
```

`runCourierCheck(orderId)`:
1. Load `FraudCheck` by `orderId`; 404-style error if missing.
2. `normalizeBdPhone(record.customerPhone)`; if `null`, throw `Error('No valid BD phone for this order')`.
3. `courierData = await checkCourier(phone)`.
4. `courierFlags = deriveCourierRedFlags(courierData)`.
5. Merge: take existing `redFlags`, drop any whose `name` is in `COURIER_FLAG_NAMES` (so re-checks don't duplicate), append `courierFlags`.
6. `riskScore = sum(points of merged flags)`; `riskLevel` via existing thresholds (≤30 safe, ≤50 medium, else high). Extract the level logic into a shared `riskLevelFromScore(score)` helper in `fraudScoringEngine.ts` and use it both there and here (avoid duplicated thresholds).
7. Persist: update `redFlags`, `riskScore`, `riskLevel`, `courierData` (→ `courier_data`), `courierCheckedAt` (→ now).
8. Return mapped `FraudCheckRecord` (now including `courierData`/`courierCheckedAt`).

`runCourierCheckBatch(orderIds)`: iterate sequentially, call `runCourierCheck` per id inside try/catch, collect `{ orderId, ok, error? }`. One failure never aborts the rest.

## Data model (migration required)

Add to `fraud_checks` and the Prisma `FraudCheck` model:
- `courier_data JSONB NULL` → Prisma `courierData Json? @map("courier_data")`
- `courier_checked_at TIMESTAMP NULL` → Prisma `courierCheckedAt DateTime? @map("courier_checked_at")`

Migration runs via the project's existing pattern (raw SQL in `backend/src/migrations/` + `runMigrations.ts`, mirroring `001_fraud_checks.sql`). Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.

`FraudCheckRecord` interface + `mapRowToFraudCheck` extended with `courierData` and `courierCheckedAt`.

## Routes (fraudRoutes.ts)

- `POST /api/fraud/courier-check/:orderId` → `runCourierCheck`. Returns `{ success, data: record }`. 404 if order/record missing; 400 if no valid phone; 500 on BDCourier API error.
- `POST /api/fraud/courier-check` body `{ orderIds: string[] }` → validate non-empty array → `runCourierCheckBatch`. Returns `{ success, results }`.

## Frontend (FraudDetection.tsx + services/api.ts)

- `fraudApi.courierCheck(orderId)` → POST per-order; `fraudApi.courierCheckAll(orderIds)` → POST batch.
- Per-card "Courier check" button (own pending state per order via mutation variables; spinner while pending; `invalidateQueries(['fraudChecks'])` on success).
- Header "Courier check all" button next to "Run scan": passes the currently displayed `fraudList` order ids to `courierCheckAll`.
- Card displays courier signal when `item.courierData` present: success ratio % and report count (e.g. `Courier: 82% · 1 report`).
- Errors surfaced inline (button error state / existing UI conventions). No new toast system unless one already exists.

## Config / security

- `BDCOURIER_API_KEY` in `backend/.env` (gitignored). FB/IG vars untouched.
- The API key shared in chat is considered exposed — **rotate it on the BDCourier dashboard** and put the new value in `.env`.
- Key only ever read server-side; never sent to the frontend.

## Error handling / edge cases

- BDCourier not configured → service throws; route returns 500 with clear message; record unchanged.
- API error / timeout / `status !== 'success'` → throw; per-order route errors, batch isolates.
- Invalid/missing phone → 400 (single) or `{ ok:false, error }` (batch); record unchanged.
- Re-running a courier check overwrites prior courier flags (dedupe by name) and refreshes `courier_data` — idempotent.
- `success_ratio` may arrive as number or numeric string — coerce with `Number()`.

## Testing

- **bdCourierService** (mock axios): correct URL + `Authorization: Bearer` header + body; `normalizeBdPhone` cases (`+8801…`, `8801…`, `01…`, `1…`, junk → null); throws when unconfigured; throws on non-success response.
- **courierScoring**: each threshold and its boundaries (49/50/69/70, total_parcel 0, reports empty vs non-empty), mutual exclusivity of ratio flags.
- **fraudDetectionService.runCourierCheck**: merges flags without duplicating on re-check, recomputes score = sum of points, re-derives level, persists courier_data (mock prisma + bdCourierService).
- **riskLevelFromScore** helper: 30/31/50/51 boundaries.

## Non-goals

- Automatic courier checks (placement, cron, or background).
- Per-courier scoring nuance beyond the summary thresholds above.
- Caching courier results / rate-limit backoff (sequential batch is enough for now).
- Toast/notification infrastructure changes.
