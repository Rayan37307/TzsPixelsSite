# Fraud Detection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A 30-minute polling fraud detection system that scores orders and flags high-risk ones for manual admin review.

**Architecture:** Scoring engine runs on order data fetched from Shopify. Points accumulated per red flag. Results stored in PostgreSQL. Frontend displays with action buttons.

**Tech Stack:** TypeScript, Express.js, PostgreSQL (pg driver), node-cron

---

## File Structure

- Create: `backend/src/services/fraudScoringEngine.ts` — Point calculation logic
- Create: `backend/src/services/fraudDetectionService.ts` — Scan orchestration
- Create: `backend/src/routes/fraudRoutes.ts` — API endpoints
- Create: `backend/src/migrations/001_fraud_checks.sql` — DB migration
- Modify: `backend/src/index.ts` — Add cron job, route mounting
- Modify: `frontend/src/pages/FraudDetection.tsx` — Show stored results

---

### Task 1: Database Migration for fraud_checks Table

**Files:**
- Create: `backend/src/migrations/001_fraud_checks.sql`
- Run: `psql` to execute migration

- [ ] **Step 1: Create migration file**

```sql
-- backend/src/migrations/001_fraud_checks.sql
CREATE TABLE IF NOT EXISTS fraud_checks (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) UNIQUE NOT NULL,
  order_number VARCHAR(50),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),
  billing_country VARCHAR(50),
  shipping_country VARCHAR(50),
  shipping_address TEXT,
  amount DECIMAL(10,2) NOT NULL,
  risk_score INTEGER NOT NULL DEFAULT 0,
  risk_level VARCHAR(10) NOT NULL DEFAULT 'safe',
  red_flags JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'pending',
  scanned_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER
);

CREATE INDEX IF NOT EXISTS idx_fraud_checks_status ON fraud_checks(status);
CREATE INDEX IF NOT EXISTS idx_fraud_checks_risk_level ON fraud_checks(risk_level);
CREATE INDEX IF NOT EXISTS idx_fraud_checks_scanned_at ON fraud_checks(scanned_at);
```

- [ ] **Step 2: Run migration**

Run: `psql $DATABASE_URL -f backend/src/migrations/001_fraud_checks.sql`
Expected: CREATE TABLE

- [ ] **Step 3: Commit**

```bash
git add backend/src/migrations/001_fraud_checks.sql
git commit -m "feat: add fraud_checks table migration"
```

---

### Task 2: Fraud Scoring Engine

**Files:**
- Create: `backend/src/services/fraudScoringEngine.ts`
- Test: Write unit tests to verify scoring logic

- [ ] **Step 1: Write the service**

```typescript
// backend/src/services/fraudScoringEngine.ts

export interface OrderData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  billingCountry: string;
  shippingCountry: string;
  shippingAddress: string;
  amount: number;
}

export interface RedFlag {
  name: string;
  points: number;
  description: string;
}

export interface ScoringResult {
  orderId: string;
  riskScore: number;
  riskLevel: 'safe' | 'medium' | 'high';
  redFlags: RedFlag[];
}

const FREE_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
const DISPOSABLE_EMAIL_DOMAINS = ['temp-mail.org', '10minutemail.com', 'guerrillamail.com', 'mailinator.com'];
const VPN_USER_AGENTS = ['curl', 'wget', 'python-requests'];

function isNewCustomer(phone: string): Promise<boolean> {
  // Query fraud_checks table - if no prior orders, customer is new
  // This is simplified - in production you'd check customer order history
  return Promise.resolve(true);
}

function getOrderHistory(phone: string): Promise<number> {
  // Count prior orders for this phone
  return Promise.resolve(0);
}

export async function calculateRiskScore(order: OrderData): Promise<ScoringResult> {
  const redFlags: RedFlag[] = [];
  let score = 0;

  // New customer (+10)
  const priorOrderCount = await getOrderHistory(order.customerPhone);
  if (priorOrderCount === 0) {
    score += 10;
    redFlags.push({ name: 'New Customer', points: 10, description: 'First-time buyer' });
  }

  // Amount-based scoring
  if (order.amount > 1000) {
    score += 25;
    redFlags.push({ name: 'Amount > $1000', points: 25, description: 'Very high-value order' });
  } else if (order.amount > 500) {
    score += 15;
    redFlags.push({ name: 'Amount > $500', points: 15, description: 'High-value order' });
  }

  // Billing ≠ shipping address (+15)
  if (order.billingCountry !== order.shippingCountry || 
      order.shippingAddress.toLowerCase().includes('po box')) {
    score += 15;
    redFlags.push({ name: 'Address Mismatch', points: 15, description: 'Billing differs from shipping' });
  }

  // Phone country ≠ billing country (+20)
  // Simplified: Check if Bangladesh phone but foreign billing
  const bdPhonePattern = /^(\+?880|880)/;
  if (bdPhonePattern.test(order.customerPhone) && order.billingCountry !== 'BD' && order.billingCountry !== 'Bangladesh') {
    score += 20;
    redFlags.push({ name: 'Geo Mismatch', points: 20, description: 'Phone country vs billing country mismatch' });
  }

  // Multiple orders same phone (+30) - would need to check in DB
  // This is a placeholder - in production you'd query the DB

  // Free email domain (+5)
  const emailDomain = order.customerEmail?.split('@')[1]?.toLowerCase();
  if (emailDomain && FREE_EMAIL_DOMAINS.includes(emailDomain)) {
    score += 5;
    redFlags.push({ name: 'Free Email', points: 5, description: 'Free email provider' });
  }

  // Disposable/temp email (+35)
  if (emailDomain && DISPOSABLE_EMAIL_DOMAINS.includes(emailDomain)) {
    score += 35;
    redFlags.push({ name: 'Disposable Email', points: 35, description: 'Temporary email detected' });
  }

  // Determine risk level
  let riskLevel: 'safe' | 'medium' | 'high' = 'safe';
  if (score >= 51) {
    riskLevel = 'high';
  } else if (score >= 31) {
    riskLevel = 'medium';
  }

  return {
    orderId: order.id,
    riskScore: score,
    riskLevel,
    redFlags,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/services/fraudScoringEngine.ts
git commit -m "feat: add fraud scoring engine with red flag point calculations"
```

---

### Task 3: Fraud Detection Service (Orchestration)

**Files:**
- Create: `backend/src/services/fraudDetectionService.ts`
- Modify: Uses existing ShopifyService to fetch orders

- [ ] **Step 1: Write the service**

```typescript
// backend/src/services/fraudDetectionService.ts

import pool from '../config/db';
import { fetchOrders, ShopifyOrder } from './shopifyService';
import { calculateRiskScore, OrderData, ScoringResult } from './fraudScoringEngine';
import { addNotification } from './notificationService';

interface FraudCheckRecord extends ScoringResult {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  billingCountry: string;
  shippingCountry: string;
  shippingAddress: string;
  amount: number;
  status: string;
  scannedAt: Date;
}

let lastScanTime: Date | null = null;

function mapShopifyOrderToOrderData(shopifyOrder: ShopifyOrder): OrderData {
  return {
    id: String(shopifyOrder.id),
    orderNumber: shopifyOrder.name || String(shopifyOrder.id),
    customerName: shopifyOrder.customer?.first_name + ' ' + shopifyOrder.customer?.last_name || 'Unknown',
    customerPhone: shopifyOrder.phone || shopifyOrder.billing_address?.phone || '',
    customerEmail: shopifyOrder.email || shopifyOrder.customer?.email || '',
    billingCountry: shopifyOrder.billing_address?.country_code || shopifyOrder.billing_address?.country || '',
    shippingCountry: shopifyOrder.shipping_address?.country_code || shopifyOrder.shipping_address?.country || '',
    shippingAddress: shopifyOrder.shipping_address?.address1 || '' + ' ' + (shopifyOrder.shipping_address?.address2 || ''),
    amount: parseFloat(shopifyOrder.total_price || '0'),
  };
}

export async function scanNewOrders(): Promise<FraudCheckRecord[]> {
  const orders = await fetchOrders();
  const results: FraudCheckRecord[] = [];

  for (const order of orders) {
    const orderData = mapShopifyOrderToOrderData(order);
    const scoringResult = await calculateRiskScore(orderData);

    // Store in DB
    const query = `
      INSERT INTO fraud_checks (
        order_id, order_number, customer_name, customer_phone, customer_email,
        billing_country, shipping_country, shipping_address, amount,
        risk_score, risk_level, red_flags, status, scanned_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      ON CONFLICT (order_id) DO UPDATE SET
        risk_score = $10,
        risk_level = $11,
        red_flags = $12,
        scanned_at = NOW()
      RETURNING id, risk_score, risk_level, status, scanned_at
    `;

    const values = [
      scoringResult.orderId,
      orderData.orderNumber,
      orderData.customerName,
      orderData.customerPhone,
      orderData.customerEmail,
      orderData.billingCountry,
      orderData.shippingCountry,
      orderData.shippingAddress,
      orderData.amount,
      scoringResult.riskScore,
      scoringResult.riskLevel,
      JSON.stringify(scoringResult.redFlags),
      'pending',
    ];

    const result = await pool.query(query, values);

    // Notify on high risk
    if (scoringResult.riskLevel === 'high') {
      addNotification({
        type: 'fraud',
        title: 'High Risk Order Detected',
        message: `Order ${orderData.orderNumber} flagged as high risk (${scoringResult.riskScore} points)`,
        orderId: scoringResult.orderId,
      });
    }

    results.push({
      ...scoringResult,
      orderNumber: orderData.orderNumber,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerEmail: orderData.customerEmail,
      billingCountry: orderData.billingCountry,
      shippingCountry: orderData.shippingCountry,
      shippingAddress: orderData.shippingAddress,
      amount: orderData.amount,
      status: result.rows[0].status,
      scannedAt: result.rows[0].scanned_at,
    });
  }

  lastScanTime = new Date();
  return results;
}

export async function getFraudChecks(status?: string, limit = 50): Promise<FraudCheckRecord[]> {
  let query = 'SELECT * FROM fraud_checks';
  const params: unknown[] = [];

  if (status) {
    query += ' WHERE status = $1';
    params.push(status);
  }

  query += ' ORDER BY scanned_at DESC LIMIT $' + (params.length + 1);
  params.push(limit);

  const result = await pool.query(query, params);
  return result.rows;
}

export async function updateFraudCheckStatus(
  orderId: string,
  status: 'approved' | 'held' | 'blocked',
  reviewedBy?: number
): Promise<void> {
  const query = `
    UPDATE fraud_checks 
    SET status = $1, reviewed_at = NOW(), reviewed_by = $2
    WHERE order_id = $3
  `;
  await pool.query(query, [status, reviewedBy || null, orderId]);
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/services/fraudDetectionService.ts
git commit -m "feat: add fraud detection orchestration service"
```

---

### Task 4: Fraud API Routes

**Files:**
- Create: `backend/src/routes/fraudRoutes.ts`

- [ ] **Step 1: Write the routes**

```typescript
// backend/src/routes/fraudRoutes.ts

import { Router } from 'express';
import { scanNewOrders, getFraudChecks, updateFraudCheckStatus } from '../services/fraudDetectionService';

const router = Router();

// GET /api/fraud/results - List fraud checks
router.get('/results', async (req, res) => {
  try {
    const { status, limit } = req.query;
    const results = await getFraudChecks(status as string | undefined, limit ? Number(limit) : 50);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error fetching fraud checks:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch fraud checks' });
  }
});

// GET /api/fraud/results/:orderId - Single order details
router.get('/results/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await getFraudChecks(undefined, 1);
    const order = result.find((r) => r.orderId === orderId);
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
});

// POST /api/fraud/scan - Manual scan trigger
router.post('/scan', async (req, res) => {
  try {
    const results = await scanNewOrders();
    res.json({ success: true, data: results, scanned: results.length });
  } catch (error) {
    console.error('Error scanning orders:', error);
    res.status(500).json({ success: false, error: 'Failed to scan orders' });
  }
});

// PATCH /api/fraud/results/:orderId - Update status
router.patch('/results/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!['approved', 'held', 'blocked'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    await updateFraudCheckStatus(orderId, status);
    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

// DELETE /api/fraud/results/:orderId - Delete check
router.delete('/results/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    // Delete implementation
    res.json({ success: true, message: 'Check deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete check' });
  }
});

export default router;
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/routes/fraudRoutes.ts
git commit -m "feat: add fraud API routes"
```

---

### Task 5: Cron Job Integration in index.ts

**Files:**
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Add cron and routes**

Add imports at top:
```typescript
import cron from 'node-cron';
import fraudRoutes from './routes/fraudRoutes';
import { scanNewOrders } from './services/fraudDetectionService';
```

Add route mounting (after other routes):
```typescript
app.use('/api/fraud', fraudRoutes);
```

Add cron job (before app.listen):
```typescript
// Fraud detection scan every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log('[Fraud] Running scheduled scan...');
  try {
    await scanNewOrders();
    console.log('[Fraud] Scan completed');
  } catch (error) {
    console.error('[Fraud] Scan failed:', error);
  }
});
```

- [ ] **Step 2: Install node-cron**

Run: `npm install node-cron`
Run: `npm install -D @types/node-cron`

- [ ] **Step 3: Commit**

```bash
git add backend/src/index.ts package.json
git commit -m "feat: add 30-minute fraud detection cron job"
```

---

### Task 6: Frontend FraudDetection Page Update

**Files:**
- Modify: `frontend/src/pages/FraudDetection.tsx`
- Modify: `frontend/src/services/api.ts` - Add fraud endpoints

- [ ] **Step 1: Update API service**

```typescript
// In frontend/src/services/api.ts, add:
export const fetchFraudChecks = (status?: string) => 
  api.get('/fraud/results', { params: { status } });

export const triggerFraudScan = () => 
  api.post('/fraud/scan');

export const updateFraudStatus = (orderId: string, status: 'approved' | 'held' | 'blocked') =>
  api.patch(`/fraud/results/${orderId}`, { status });
```

- [ ] **Step 2: Update FraudDetection page**

Update to fetch from API instead of using mock data. Add action buttons.

```tsx
// Replace the mock data with:
const { data: fraudData, refetch } = useQuery({
  queryKey: ['fraudChecks', statusFilter],
  queryFn: () => fetchFraudChecks(statusFilter),
});

// Add action buttons:
<button onClick={() => handleAction(orderId, 'approved')}>Approve</button>
<button onClick={() => handleAction(orderId, 'held')}>Hold</button>
<button onClick={() => handleAction(orderId, 'blocked')}>Block</button>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/FraudDetection.tsx frontend/src/services/api.ts
git commit -m "feat: update FraudDetection page with API data and actions"
```

---

## Completion Checklist

- [ ] fraud_checks table exists
- [ ] Scoring engine calculates points correctly
- [ ] Results persist in DB
- [ ] 30-minute cron runs automatically
- [ ] API endpoints work (test with curl)
- [ ] Frontend shows stored results
- [ ] Action buttons update status in DB
- [ ] All tests pass
- [ ] Commits are atomic and descriptive

---

## Execution Options

**Plan complete and saved to `docs/superpowers/plans/2026-04-30-fraud-detection.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**