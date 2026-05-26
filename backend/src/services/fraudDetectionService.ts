import { ShopifyService } from './shopifyService.js';
import { calculateRiskScore, OrderData, ScoringResult } from './fraudScoringEngine.js';
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
}

function mapShopifyOrderToOrderData(order: ShopifyOrder): OrderData {
  const amountStr = order.amount.replace(/[^\d.]/g, '');
  const amount = parseFloat(amountStr) || 0;

  return {
    id: order.id,
    orderNumber: order.id.replace('SHP-', ''),
    customerName: order.customer,
    customerPhone: order.phone,
    customerEmail: '',
    billingCountry: '',
    shippingCountry: '',
    shippingAddress: '',
    amount
  };
}

export async function scanNewOrders(): Promise<FraudCheckRecord[]> {
  console.log('[Fraud Detection] Starting scan of new orders...');

  const results: FraudCheckRecord[] = [];

  try {
    const orders = await ShopifyService.fetchOrders();
    console.log(`[Fraud Detection] Fetched ${orders.length} orders from Shopify`);

    for (const order of orders) {
      try {
        const orderData = mapShopifyOrderToOrderData(order);
        const scoringResult = await calculateRiskScore(orderData);

        const amountStr = order.amount.replace(/[^\d.]/g, '');
        const amount = parseFloat(amountStr) || 0;

        const now = new Date();
        const fraudCheck = {
          orderId: order.id,
          orderNumber: order.id.replace('SHP-', ''),
          customerName: order.customer,
          customerPhone: order.phone,
          customerEmail: orderData.customerEmail,
          billingCountry: orderData.billingCountry,
          shippingCountry: orderData.shippingCountry,
          shippingAddress: orderData.shippingAddress,
          amount,
          riskScore: scoringResult.riskScore,
          riskLevel: scoringResult.riskLevel,
          redFlags: scoringResult.redFlags,
          status: 'pending' as const,
          createdAt: now,
        };

        const existing = await prisma.fraudCheck.findUnique({
          where: { orderId: fraudCheck.orderId },
          select: { status: true },
        });

        const redFlagsJson = JSON.parse(JSON.stringify(fraudCheck.redFlags));

        const dbResult = await prisma.fraudCheck.upsert({
          where: { orderId: fraudCheck.orderId },
          update: {
            riskScore: fraudCheck.riskScore,
            riskLevel: fraudCheck.riskLevel,
            redFlags: redFlagsJson,
            status: existing?.status === 'reviewed' ? 'reviewed' : fraudCheck.status,
          },
          create: {
            orderId: fraudCheck.orderId,
            orderNumber: fraudCheck.orderNumber,
            customerName: fraudCheck.customerName,
            customerPhone: fraudCheck.customerPhone,
            customerEmail: fraudCheck.customerEmail,
            billingCountry: fraudCheck.billingCountry,
            shippingCountry: fraudCheck.shippingCountry,
            shippingAddress: fraudCheck.shippingAddress,
            amount: fraudCheck.amount,
            riskScore: fraudCheck.riskScore,
            riskLevel: fraudCheck.riskLevel,
            redFlags: redFlagsJson,
            status: fraudCheck.status,
            scannedAt: fraudCheck.createdAt,
            reviewedAt: fraudCheck.createdAt,
          },
        });

        const fraudRecord: FraudCheckRecord = {
          id: dbResult.id,
          orderId: fraudCheck.orderId,
          orderNumber: fraudCheck.orderNumber,
          customerName: fraudCheck.customerName,
          customerPhone: fraudCheck.customerPhone,
          customerEmail: fraudCheck.customerEmail,
          billingCountry: fraudCheck.billingCountry,
          shippingCountry: fraudCheck.shippingCountry,
          shippingAddress: fraudCheck.shippingAddress,
          amount: fraudCheck.amount,
          riskScore: fraudCheck.riskScore,
          riskLevel: fraudCheck.riskLevel,
          redFlags: fraudCheck.redFlags,
          status: fraudCheck.status,
          reviewedBy: null,
          createdAt: fraudCheck.createdAt,
          updatedAt: null,
        };

        if (fraudCheck.riskLevel === 'high') {
          console.log(`[Fraud Detection] High risk detected for order ${fraudCheck.orderId}`);

          await NotificationService.addNotification({
            type: 'fraud',
            title: 'High Risk Order Detected',
            message: `Order ${fraudCheck.orderId} has a fraud score of ${fraudCheck.riskScore}. Review required.`,
            time: 'Just now'
          });
        }

        results.push(fraudRecord);

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
    updatedAt: row.reviewedAt
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
