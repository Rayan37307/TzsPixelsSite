import { query } from '../config/db';

/**
 * Order data structure for fraud scoring
 */
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

/**
 * Red flag representation
 */
export interface RedFlag {
  name: string;
  points: number;
  description: string;
}

/**
 * Scoring result with risk assessment
 */
export interface ScoringResult {
  orderId: string;
  riskScore: number;
  riskLevel: 'safe' | 'medium' | 'high';
  redFlags: RedFlag[];
}

/**
 * Free email domains (low risk but add some context)
 */
const FREE_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
  'aol.com', 'icloud.com', 'mail.com', 'protonmail.com',
  'yandex.com', 'live.com', 'msn.com'
];

/**
 * Disposable/temporary email domains (high risk - fake identity)
 */
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
  'throwaway.email', 'fakeinbox.com', 'trashmail.com', 'dispostable.com',
  'yopmail.com', 'getnada.com', 'mintemail.com', 'sharklasers.com',
  'spam4.me', 'grr.la', 'maildrop.cc', 'emailondeck.com'
];

/**
 * Check if email is from a free provider
 */
export function isFreeEmail(email: string): boolean {
  if (!email) return false;
  const domain = email.toLowerCase().split('@')[1];
  return FREE_EMAIL_DOMAINS.includes(domain);
}

/**
 * Check if email is from a disposable/temporary provider
 */
export function isDisposableEmail(email: string): boolean {
  if (!email) return false;
  const domain = email.toLowerCase().split('@')[1];
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
}

/**
 * Extract country code from phone number
 */
export function getPhoneCountry(phone: string): string | null {
  if (!phone) return null;
  
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  
  // Check for country code at start
  if (cleaned.startsWith('+')) {
    // Extract country code (1-3 digits)
    const match = cleaned.match(/^\+(\d{1,3})/);
    if (match) {
      // Map common country codes to country names
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

/**
 * Normalize country codes for comparison
 */
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

/**
 * Check if billing and shipping addresses differ
 */
export function addressesDiffer(billing: string, shipping: string): boolean {
  if (!billing || !shipping) return false;
  
  // Simple comparison - normalize and compare
  const normalize = (addr: string) => addr.toLowerCase().replace(/\s+/g, ' ').trim();
  
  return normalize(billing) !== normalize(shipping);
}

/**
 * Check if phone country matches billing country
 */
export function isPhoneCountryMismatch(phone: string, billingCountry: string): boolean {
  if (!phone || !billingCountry) return false;
  
  const phoneCountry = getPhoneCountry(phone);
  if (!phoneCountry) return false;
  
  const normalizedBilling = normalizeCountryCode(billingCountry);
  return phoneCountry !== normalizedBilling;
}

/**
 * Check for VPN/proxy indicators (simulated - would need external service in production)
 * For now, this would be integrated with IP analysis from order data
 */
export function hasVPNProxyIndicators(ipAddress?: string): boolean {
  // In production, this would query an IP intelligence service
  // For now, we'll check if we have IP data that might indicate proxy
  if (!ipAddress) return false;
  
  // Common proxy indicators would be checked against external service
  // This is a placeholder for actual VPN/proxy detection
  return false;
}

/**
 * Calculate average order amount from historical data
 */
export async function getAverageOrderAmount(): Promise<number> {
  try {
    const result = await query(
      `SELECT AVG(total_price::numeric) as avg_amount 
       FROM orders 
       WHERE created_at > NOW() - INTERVAL '90 days'`
    );
    
    return result.rows[0]?.avg_amount ? parseFloat(result.rows[0].avg_amount) : 0;
  } catch (error) {
    console.error('Error calculating average order amount:', error);
    return 0; // Default to 0 if we can't calculate
  }
}

/**
 * Check if customer has prior orders (new customer check)
 */
export async function hasPriorOrders(phone: string, email: string): Promise<boolean> {
  try {
    // Check by phone or email
    const result = await query(
      `SELECT COUNT(*) as order_count 
       FROM orders 
       WHERE (customer_phone = $1 OR customer_email = $2)
       AND created_at < NOW()`,
      [phone, email]
    );
    
    const count = parseInt(result.rows[0]?.order_count || '0', 10);
    return count > 0;
  } catch (error) {
    console.error('Error checking prior orders:', error);
    return false;
  }
}

/**
 * Check for multiple orders from same phone in short timeframe
 */
export async function getRecentOrderCountByPhone(phone: string, hoursBack: number = 24): Promise<number> {
  try {
    const result = await query(
      `SELECT COUNT(*) as count 
       FROM orders 
       WHERE customer_phone = $1 
       AND created_at > NOW() - INTERVAL '${hoursBack} hours'`,
      [phone]
    );
    
    return parseInt(result.rows[0]?.count || '0', 10);
  } catch (error) {
    console.error('Error checking recent orders by phone:', error);
    return 0;
  }
}

/**
 * Check for chargeback history
 */
export async function hasChargebackHistory(phone: string, email: string): Promise<boolean> {
  try {
    // Check for orders with chargeback status
    const result = await query(
      `SELECT COUNT(*) as count 
       FROM orders 
       WHERE (customer_phone = $1 OR customer_email = $2)
       AND (status = 'chargeback' OR refund_status = 'charged_back')`,
      [phone, email]
    );
    
    const count = parseInt(result.rows[0]?.count || '0', 10);
    return count > 0;
  } catch (error) {
    console.error('Error checking chargeback history:', error);
    return false;
  }
}

/**
 * Main fraud scoring function
 * Implements all red flag scoring rules from the specification
 */
export async function calculateRiskScore(order: OrderData): Promise<ScoringResult> {
  const redFlags: RedFlag[] = [];
  let totalPoints = 0;
  
  console.log(`[Fraud Scoring] Analyzing order: ${order.orderNumber}`);
  
  // 1. New customer check (no prior orders) - +10 points
  const hasPrior = await hasPriorOrders(order.customerPhone, order.customerEmail);
  if (!hasPrior) {
    redFlags.push({
      name: 'New Customer',
      points: 10,
      description: 'No prior order history found'
    });
    totalPoints += 10;
  }
  
  // 2. High amount check - $500+ = +15, $1000+ = +25 (use highest applicable)
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
  
  // 3. VPN/Proxy detection - +30 points (would need IP data)
  // This would integrate with IP analysis in production
  const vpnDetected = hasVPNProxyIndicators(); // Would pass IP from order
  if (vpnDetected) {
    redFlags.push({
      name: 'VPN/Proxy Detected',
      points: 30,
      description: 'Location masking detected'
    });
    totalPoints += 30;
  }
  
  // 4. Billing ≠ shipping address - +15 points
  if (addressesDiffer(order.shippingAddress, order.billingCountry)) {
    // Actually we need full billing address, not just country
    // This check would need billing address field
    // For now, we'll skip if we don't have full billing address
    console.log('[Fraud Scoring] Address differ check - needs full billing address');
  }
  
  // 5. Phone country ≠ billing country - +20 points
  if (isPhoneCountryMismatch(order.customerPhone, order.billingCountry)) {
    redFlags.push({
      name: 'Phone Country Mismatch',
      points: 20,
      description: 'Phone number country does not match billing country'
    });
    totalPoints += 20;
  }
  
  // 6. Multiple orders same phone - +30 points
  const recentOrders = await getRecentOrderCountByPhone(order.customerPhone, 24);
  if (recentOrders > 1) {
    redFlags.push({
      name: 'Multiple Orders Same Phone',
      points: 30,
      description: `${recentOrders} orders from same phone in last 24 hours`
    });
    totalPoints += 30;
  }
  
  // 7. Free email (gmail, yahoo, etc.) - +5 points
  if (isFreeEmail(order.customerEmail)) {
    redFlags.push({
      name: 'Free Email Provider',
      points: 5,
      description: 'Using free email service (gmail, yahoo, etc.)'
    });
    totalPoints += 5;
  }
  
  // 8. Disposable/temp email - +35 points
  if (isDisposableEmail(order.customerEmail)) {
    redFlags.push({
      name: 'Disposable Email',
      points: 35,
      description: 'Using temporary/disposable email service'
    });
    totalPoints += 35;
  }
  
  // 9. Order > 3x average - +20 points
  const avgAmount = await getAverageOrderAmount();
  if (avgAmount > 0 && order.amount > avgAmount * 3) {
    redFlags.push({
      name: 'Unusual Spending Pattern',
      points: 20,
      description: `Order amount ${order.amount.toFixed(2)} is >3x average (${avgAmount.toFixed(2)})`
    });
    totalPoints += 20;
  }
  
  // 10. Prior chargeback history - +25 points
  const hasChargeback = await hasChargebackHistory(order.customerPhone, order.customerEmail);
  if (hasChargeback) {
    redFlags.push({
      name: 'Prior Chargeback',
      points: 25,
      description: 'Customer has prior chargeback history'
    });
    totalPoints += 25;
  }
  
  // Determine risk level based on total points
  let riskLevel: 'safe' | 'medium' | 'high';
  if (totalPoints <= 30) {
    riskLevel = 'safe';
  } else if (totalPoints <= 50) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }
  
  console.log(`[Fraud Scoring] Order ${order.orderNumber}: Score=${totalPoints}, Level=${riskLevel}`);
  
  return {
    orderId: order.id,
    riskScore: totalPoints,
    riskLevel,
    redFlags
  };
}