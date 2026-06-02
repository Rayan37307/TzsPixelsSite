import prisma from '../config/db.js';

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

const FREE_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'aol.com', 'icloud.com', 'mail.com', 'protonmail.com',
  'yandex.com', 'live.com', 'msn.com'
];

const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
  'throwaway.email', 'fakeinbox.com', 'trashmail.com', 'dispostable.com',
  'yopmail.com', 'getnada.com', 'mintemail.com', 'sharklasers.com',
  'spam4.me', 'grr.la', 'maildrop.cc', 'emailondeck.com'
];

export function isFreeEmail(email: string): boolean {
  if (!email) return false;
  const domain = email.toLowerCase().split('@')[1];
  return FREE_EMAIL_DOMAINS.includes(domain);
}

export function isDisposableEmail(email: string): boolean {
  if (!email) return false;
  const domain = email.toLowerCase().split('@')[1];
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
}

export function getPhoneCountry(phone: string): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  if (cleaned.startsWith('+')) {
    const match = cleaned.match(/^\+(\d{1,3})/);
    if (match) {
const countryCodeMap: Record<string, string> = {
        '1': 'US',
        '44': 'GB',
        '49': 'DE',
        '33': 'FR',
        '81': 'JP',
        '86': 'CN',
        '91': 'IN',
        '880': 'BD',
        '61': 'AU',
        '55': 'BR',
        '7': 'RU'
      };
      return countryCodeMap[match[1]] || match[1];
    }
  }
  return null;
}

export function normalizeCountryCode(country: string): string {
  if (!country) return '';
  const countryMap: Record<string, string> = {
    'US': 'US', 'USA': 'US', 'United States': 'US',
    'GB': 'GB', 'UK': 'GB', 'United Kingdom': 'GB',
    'BD': 'BD', 'Bangladesh': 'BD',
    'IN': 'IN', 'India': 'IN',
    'CN': 'CN', 'China': 'CN',
    'DE': 'DE', 'Germany': 'DE',
    'FR': 'FR', 'France': 'FR',
    'CA': 'CA', 'Canada': 'CA',
    'AU': 'AU', 'Australia': 'AU',
    'JP': 'JP', 'Japan': 'JP'
  };
  return countryMap[country.toUpperCase()] || country.toUpperCase();
}

export function addressesDiffer(billing: string, shipping: string): boolean {
  if (!billing || !shipping) return false;
  const normalize = (addr: string) => addr.toLowerCase().replace(/\s+/g, ' ').trim();
  return normalize(billing) !== normalize(shipping);
}

export function isPhoneCountryMismatch(phone: string, billingCountry: string): boolean {
  if (!phone || !billingCountry) return false;
  const phoneCountry = getPhoneCountry(phone);
  if (!phoneCountry) return false;
  const normalizedBilling = normalizeCountryCode(billingCountry);
  return phoneCountry !== normalizedBilling;
}

export function hasVPNProxyIndicators(ipAddress?: string): boolean {
  if (!ipAddress) return false;
  return false;
}

export async function getAverageOrderAmount(): Promise<number> {
  try {
    const result = await prisma.$queryRawUnsafe<Array<{ avg_amount: string | null }>>(
      `SELECT AVG(total_price::numeric) as avg_amount 
       FROM orders 
       WHERE created_at > NOW() - INTERVAL '90 days'`
    );
    return result[0]?.avg_amount ? parseFloat(result[0].avg_amount) : 0;
  } catch (error) {
    console.error('Error calculating average order amount:', error);
    return 0;
  }
}

export async function hasPriorOrders(phone: string, email: string): Promise<boolean> {
  try {
    const count = await prisma.order.count({
      where: {
        OR: [
          { customerPhone: phone },
          { customerEmail: email },
        ],
        createdAt: { lt: new Date() },
      },
    });
    return count > 0;
  } catch (error) {
    console.error('Error checking prior orders:', error);
    return false;
  }
}

export async function getRecentOrderCountByPhone(phone: string, hoursBack: number = 24): Promise<number> {
  try {
    const count = await prisma.order.count({
      where: {
        customerPhone: phone,
        createdAt: { gte: new Date(Date.now() - hoursBack * 60 * 60 * 1000) },
      },
    });
    return count;
  } catch (error) {
    console.error('Error checking recent orders by phone:', error);
    return 0;
  }
}

export async function hasChargebackHistory(phone: string, email: string): Promise<boolean> {
  try {
    const count = await prisma.order.count({
      where: {
        AND: [
          {
            OR: [
              { customerPhone: phone },
              { customerEmail: email },
            ],
          },
          {
            OR: [
              { status: 'chargeback' },
              { refundStatus: 'charged_back' },
            ],
          },
        ],
      },
    });
    return count > 0;
  } catch (error) {
    console.error('Error checking chargeback history:', error);
    return false;
  }
}

export function riskLevelFromScore(score: number): 'safe' | 'medium' | 'high' {
  if (score <= 30) return 'safe';
  if (score <= 50) return 'medium';
  return 'high';
}

export async function calculateRiskScore(order: OrderData): Promise<ScoringResult> {
  const redFlags: RedFlag[] = [];
  let totalPoints = 0;

  console.log(`[Fraud Scoring] Analyzing order: ${order.orderNumber}`);

  const hasPrior = await hasPriorOrders(order.customerPhone, order.customerEmail);
  if (!hasPrior) {
    redFlags.push({
      name: 'New Customer',
      points: 10,
      description: 'No prior order history found'
    });
    totalPoints += 10;
  }

  if (order.amount > 1000) {
    redFlags.push({
      name: 'Very High Value Order',
      points: 25,
      description: `Order amount $${order.amount} exceeds $1000`
    });
    totalPoints += 25;
  } else if (order.amount > 500) {
    redFlags.push({
      name: 'High Value Order',
      points: 15,
      description: `Order amount $${order.amount} exceeds $500`
    });
    totalPoints += 15;
  }

  const vpnDetected = hasVPNProxyIndicators();
  if (vpnDetected) {
    redFlags.push({
      name: 'VPN/Proxy Detected',
      points: 30,
      description: 'Location masking detected'
    });
    totalPoints += 30;
  }

  if (addressesDiffer(order.shippingAddress, order.billingCountry)) {
    console.log('[Fraud Scoring] Address differ check - needs full billing address');
  }

  if (isPhoneCountryMismatch(order.customerPhone, order.billingCountry)) {
    redFlags.push({
      name: 'Phone Country Mismatch',
      points: 20,
      description: 'Phone number country does not match billing country'
    });
    totalPoints += 20;
  }

  const recentOrders = await getRecentOrderCountByPhone(order.customerPhone, 24);
  if (recentOrders > 1) {
    redFlags.push({
      name: 'Multiple Orders Same Phone',
      points: 30,
      description: `${recentOrders} orders from same phone in last 24 hours`
    });
    totalPoints += 30;
  }

  if (isFreeEmail(order.customerEmail)) {
    redFlags.push({
      name: 'Free Email Provider',
      points: 5,
      description: 'Using free email service (gmail, yahoo, etc.)'
    });
    totalPoints += 5;
  }

  if (isDisposableEmail(order.customerEmail)) {
    redFlags.push({
      name: 'Disposable Email',
      points: 35,
      description: 'Using temporary/disposable email service'
    });
    totalPoints += 35;
  }

  const avgAmount = await getAverageOrderAmount();
  if (avgAmount > 0 && order.amount > avgAmount * 3) {
    redFlags.push({
      name: 'Unusual Spending Pattern',
      points: 20,
      description: `Order amount ${order.amount.toFixed(2)} is >3x average (${avgAmount.toFixed(2)})`
    });
    totalPoints += 20;
  }

  const hasChargeback = await hasChargebackHistory(order.customerPhone, order.customerEmail);
  if (hasChargeback) {
    redFlags.push({
      name: 'Prior Chargeback',
      points: 25,
      description: 'Customer has prior chargeback history'
    });
    totalPoints += 25;
  }

  const riskLevel = riskLevelFromScore(totalPoints);

  console.log(`[Fraud Scoring] Order ${order.orderNumber}: Score=${totalPoints}, Level=${riskLevel}`);

  return {
    orderId: order.id,
    riskScore: totalPoints,
    riskLevel,
    redFlags
  };
}
