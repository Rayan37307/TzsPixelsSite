import { ShopifyService } from './shopifyService.js';
import { checkCourier, normalizeBdPhone } from './bdCourierService.js';
import { deriveCourierRedFlags, COURIER_FLAG_NAMES, riskLevelFromScore, RedFlag } from './courierScoring.js';
import { NotificationService } from './notificationService.js';
import prisma from '../config/db.js';

export interface ShopifyOrder {
  id: string;
  customer: string;
  phone: string;
  amount: string;
  status: string;
  fraudRisk: string;
  courier: string;
  date: string;
}

export interface FraudCheckRecord {
  id: number;
  orderId: string;
  orderNumber: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  billingCountry: string | null;
  shippingCountry: string | null;
  shippingAddress: string | null;
  amount: number;
  riskScore: number;
  riskLevel: string;
  redFlags: any;
  status: string;
  reviewedBy: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  courierData: any | null;
  courierCheckedAt: Date | null;
}

export async function scanNewOrders(): Promise<FraudCheckRecord[]> {
  console.log('[Fraud Detection] Starting scan of new orders...');

  const results: FraudCheckRecord[] = [];

  try {
    const orders = await ShopifyService.fetchOrders();
    console.log(`[Fraud Detection] Fetched ${orders.length} orders from Shopify`);

    for (const order of orders) {
      try {
        const amountStr = order.amount.replace(/[^\d.]/g, '');
        const amount = parseFloat(amountStr) || 0;

        const now = new Date();
        const orderNumber = order.id.replace('SHP-', '');

        // Scan only records the order. Risk score comes solely from the
        // BDCourier phone-number check, run via runCourierCheck.
        const existing = await prisma.fraudCheck.findUnique({
          where: { orderId: order.id },
          select: { status: true },
        });

        const dbResult = await prisma.fraudCheck.upsert({
          where: { orderId: order.id },
          update: {
            customerName: order.customer,
            customerPhone: order.phone,
            amount,
            status: existing?.status === 'reviewed' ? 'reviewed' : 'pending',
          },
          create: {
            orderId: order.id,
            orderNumber,
            customerName: order.customer,
            customerPhone: order.phone,
            customerEmail: '',
            billingCountry: '',
            shippingCountry: '',
            shippingAddress: '',
            amount,
            riskScore: 0,
            riskLevel: 'safe',
            redFlags: [],
            status: 'pending',
            scannedAt: now,
            reviewedAt: now,
          },
        });

        results.push(mapRowToFraudCheck(dbResult));

      } catch (error) {
        console.error(`[Fraud Detection] Error processing order ${order.id}:`, error);
      }
    }

    console.log(`[Fraud Detection] Scan complete. Processed ${results.length} orders`);

  } catch (error) {
    console.error('[Fraud Detection] Error scanning orders:', error);
    throw error;
  }

  return results;
}

export async function getFraudChecks(
  status?: string,
  limit: number = 50
): Promise<FraudCheckRecord[]> {
  try {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const rows = await prisma.fraudCheck.findMany({
      where,
      orderBy: { scannedAt: 'desc' },
      take: limit,
    });

    return rows.map(mapRowToFraudCheck);
  } catch (error) {
    console.error('[Fraud Detection] Error fetching fraud checks:', error);
    throw error;
  }
}

function mapRowToFraudCheck(row: any): FraudCheckRecord {
  return {
    id: row.id,
    orderId: row.orderId,
    orderNumber: row.orderNumber,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerEmail: row.customerEmail,
    billingCountry: row.billingCountry,
    shippingCountry: row.shippingCountry,
    shippingAddress: row.shippingAddress,
    amount: Number(row.amount),
    riskScore: row.riskScore,
    riskLevel: row.riskLevel,
    redFlags: row.redFlags,
    status: row.status,
    reviewedBy: row.reviewedBy,
    createdAt: row.scannedAt,
    updatedAt: row.reviewedAt,
    courierData: row.courierData ?? null,
    courierCheckedAt: row.courierCheckedAt ?? null,
  };
}

export async function updateFraudCheckStatus(
  orderId: string,
  status: 'pending' | 'reviewed' | 'approved' | 'rejected' | 'blocked' | 'held',
  reviewedBy?: string
): Promise<FraudCheckRecord | null> {
  try {
    const row = await prisma.fraudCheck.update({
      where: { orderId },
      data: {
        status,
        reviewedBy: reviewedBy || null,
        reviewedAt: new Date(),
      },
    });

    return mapRowToFraudCheck(row);

  } catch (error) {
    console.error(`[Fraud Detection] Error updating fraud check status:`, error);
    throw error;
  }
}

export async function getFraudCheckByOrderId(orderId: string): Promise<FraudCheckRecord | null> {
  try {
    const row = await prisma.fraudCheck.findUnique({
      where: { orderId },
    });

    if (!row) return null;

    return mapRowToFraudCheck(row);

  } catch (error) {
    console.error(`[Fraud Detection] Error fetching fraud check:`, error);
    throw error;
  }
}

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

  if (riskLevel === 'high') {
    console.log(`[Fraud Detection] High risk detected for order ${orderId}`);
    await NotificationService.addNotification({
      type: 'fraud',
      title: 'High Risk Order Detected',
      message: `Order ${orderId} has a courier fraud score of ${riskScore}. Review required.`,
      time: 'Just now',
    });
  }

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
