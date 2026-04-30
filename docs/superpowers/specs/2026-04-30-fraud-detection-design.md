# Fraud Detection System Design

**Date:** 2026-04-30
**Project:** tzspixels-app (Scalefy)

## Overview

A scoring-based fraud detection system that scans new orders every 30 minutes and assigns risk levels. Admin manually reviews flagged orders — no auto-blocking.

## Trigger

- **Polling:** Every 30 minutes via cron scheduler
- **Manual:** Endpoint available for on-demand scan

## Scoring Rules

| Red Flag | Points | Notes |
|----------|--------|-------|
| New customer (no prior orders) | +10 | First-time buyer |
| Amount > $500 | +15 | High-value order |
| Amount > $1000 | +25 | Very high-value |
| VPN/proxy detected | +30 | Location masking |
| Billing ≠ shipping address | +15 | Address mismatch |
| Phone country ≠ billing country | +20 | Geo mismatch |
| Multiple orders same phone | +30 | Card testing |
| Free email (gmail, yahoo) | +5 | Added context |
| Disposable/temp email | +35 | Fake identity |
| Order > 3x average order value | +20 | Unusual spending |
| Prior chargeback history | +25 | Customer risk |

## Risk Thresholds

- **Safe:** 0-30 points
- **Medium:** 31-50 points
- **High:** 51+ points

## Action on Detection

**Flag only** — All orders displayed in UI, admin manually approves each.

## Data Flow

```
1. Cron fires every 30 min
2. Fetch orders from Shopify since last check
3. Execute fraud scoring engine on each order
4. Calculate points and assign risk level
5. Store in fraud_checks table
6. Fire notification if High risk found
7. Frontend displays stored results
```

## Components

### Backend

1. `services/fraudScoringEngine.ts` — Point calculation logic
2. `services/fraudDetectionService.ts` — Orchestrates scan, stores results
3. `routes/fraudRoutes.ts` — API endpoints
4. `routes/fraudRoutes.ts` + cron integration in `index.ts`
5. Database migration for `fraud_checks` table

### Frontend

1. `pages/FraudDetection.tsx` — Updated to show stored results
2. Action buttons: Approve, Hold, Block

## Database Schema (fraud_checks)

```sql
CREATE TABLE fraud_checks (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) UNIQUE NOT NULL,
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),
  amount DECIMAL(10,2),
  risk_score INTEGER NOT NULL,
  risk_level VARCHAR(10) NOT NULL,
  red_flags JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  scanned_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER
);
```

## API Endpoints

- `GET /api/fraud/results` — List all fraud checks with filters
- `GET /api/fraud/results/:orderId` — Single order details
- `POST /api/fraud/scan` — Manual trigger
- `PATCH /api/fraud/results/:orderId` — Update status (approve/hold/block)
- `DELETE /api/fraud/results/:orderId` — Delete check

## Acceptance Criteria

1. Fraud scanner runs every 30 minutes automatically
2. Each order gets a risk score and level
3. Results persist in database
4. High-risk orders trigger notification
5. Admin can approve/hold/block from UI
6. Manual scan endpoint works
7. Dashboard shows fraud statistics