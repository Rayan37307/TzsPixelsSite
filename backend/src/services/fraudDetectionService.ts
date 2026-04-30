import { ShopifyService } from './shopifyService';
import { calculateRiskScore, OrderData, ScoringResult } from './fraudScoringEngine';
import { NotificationService } from './notificationService';
import { query } from '../config/db';

/**
 * Shopify order format returned by fetchOrders()
 */
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

/**
 * Fraud check record combining scoring result with order details
 */
export interface FraudCheckRecord {
  id?: number;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  billingCountry: string;
  shippingCountry: string;
  shippingAddress: string;
  amount: number;
  riskScore: number;
  riskLevel: 'safe' | 'medium' | 'high';
  redFlags: Array<{
    name: string;
    points: number;
    description: string;
  }>;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  reviewedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Map Shopify order format to OrderData format for fraud scoring
 */
function mapShopifyOrderToOrderData(order: ShopifyOrder): OrderData {
  // Extract amount from string like "USD 125.00"
  const amountStr = order.amount.replace(/[^\d.]/g, '');
  const amount = parseFloat(amountStr) || 0;

  return {
    id: order.id,
    orderNumber: order.id.replace('SHP-', ''),
    customerName: order.customer,
    customerPhone: order.phone,
    customerEmail: '', // Shopify order mapped format doesn't include email
    billingCountry: '', // Would need to extract from order
    shippingCountry: '',
    shippingAddress: '',
    amount
  };
}

/**
 * Scan new orders from Shopify and perform fraud scoring
 * Inserts/updates fraud_checks table and triggers notifications for high risk
 */
export async function scanNewOrders(): Promise<FraudCheckRecord[]> {
  console.log('[Fraud Detection] Starting scan of new orders...');
  
  const results: FraudCheckRecord[] = [];
  
  try {
    // Fetch all orders from Shopify
    const orders = await ShopifyService.fetchOrders();
    console.log(`[Fraud Detection] Fetched ${orders.length} orders from Shopify`);
    
    // Process each order
    for (const order of orders) {
      try {
        // Map to OrderData for scoring
        const orderData = mapShopifyOrderToOrderData(order);
        
        // Calculate risk score
        const scoringResult = await calculateRiskScore(orderData);
        
        // Extract amount from string
        const amountStr = order.amount.replace(/[^\d.]/g, '');
        const amount = parseFloat(amountStr) || 0;
        
        // Create fraud check record
        const fraudCheck: FraudCheckRecord = {
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
          status: 'pending',
          createdAt: new Date()
        };
        
        // Insert or update in fraud_checks table using ON CONFLICT
        const dbResult = await query(
          `INSERT INTO fraud_checks (
            order_id, order_number, customer_name, customer_phone, customer_email,
            billing_country, shipping_country, shipping_address, amount,
            risk_score, risk_level, red_flags, status, scanned_at, reviewed_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
          )
          ON CONFLICT (order_id) DO UPDATE SET
            risk_score = EXCLUDED.risk_score,
            risk_level = EXCLUDED.risk_level,
            red_flags = EXCLUDED.red_flags,
            reviewed_at = EXCLUDED.reviewed_at,
            status = CASE 
              WHEN fraud_checks.status = 'reviewed' THEN fraud_checks.status 
              ELSE EXCLUDED.status 
            END
          RETURNING id`,
          [
            fraudCheck.orderId,
            fraudCheck.orderNumber,
            fraudCheck.customerName,
            fraudCheck.customerPhone,
            fraudCheck.customerEmail,
            fraudCheck.billingCountry,
            fraudCheck.shippingCountry,
            fraudCheck.shippingAddress,
            fraudCheck.amount,
            fraudCheck.riskScore,
            fraudCheck.riskLevel,
            JSON.stringify(fraudCheck.redFlags),
            fraudCheck.status,
            fraudCheck.createdAt,
            fraudCheck.createdAt
          ]
        );
        
        fraudCheck.id = dbResult.rows[0]?.id;
        
        // Trigger notification if high risk
        if (fraudCheck.riskLevel === 'high') {
          console.log(`[Fraud Detection] High risk detected for order ${fraudCheck.orderId}`);
          
          await NotificationService.addNotification({
            type: 'fraud',
            title: 'High Risk Order Detected',
            message: `Order ${fraudCheck.orderId} has a fraud score of ${fraudCheck.riskScore}. Review required.`,
            time: 'Just now'
          });
        }
        
        results.push(fraudCheck);
        
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

/**
 * Fetch fraud checks from database with optional filtering
 */
export async function getFraudChecks(
  status?: string,
  limit: number = 50
): Promise<FraudCheckRecord[]> {
  try {
    let sql = 'SELECT * FROM fraud_checks';
    const params: any[] = [];
    
    if (status) {
      sql += ' WHERE status = $1';
      params.push(status);
    }
    
    sql += ' ORDER BY scanned_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);
    
    const result = await query(sql, params);
    
    return result.rows.map(mapRowToFraudCheck);
  } catch (error) {
    console.error('[Fraud Detection] Error fetching fraud checks:', error);
    throw error;
  }
}

function mapRowToFraudCheck(row: any): FraudCheckRecord {
  return {
    id: row.id,
    orderId: row.order_id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    billingCountry: row.billing_country,
    shippingCountry: row.shipping_country,
    shippingAddress: row.shipping_address,
    amount: parseFloat(row.amount),
    riskScore: row.risk_score,
    riskLevel: row.risk_level,
    redFlags: typeof row.red_flags === 'string' ? JSON.parse(row.red_flags) : row.red_flags,
    status: row.status,
    reviewedBy: row.reviewed_by,
    createdAt: row.scanned_at,
    updatedAt: row.reviewed_at
  };
}

/**
 * Update fraud check status (e.g., mark as reviewed, approved, or rejected)
 */
export async function updateFraudCheckStatus(
  orderId: string,
  status: 'pending' | 'reviewed' | 'approved' | 'rejected' | 'blocked' | 'held',
  reviewedBy?: string
): Promise<FraudCheckRecord | null> {
  try {
    const result = await query(
      `UPDATE fraud_checks 
       SET status = $1, reviewed_by = $2, reviewed_at = NOW()
       WHERE order_id = $3
       RETURNING *`,
      [status, reviewedBy || null, orderId]
    );
    
    if (result.rows.length === 0) {
      console.warn(`[Fraud Detection] No fraud check found for order ${orderId}`);
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      orderId: row.order_id,
      orderNumber: row.order_number,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerEmail: row.customer_email,
      billingCountry: row.billing_country,
      shippingCountry: row.shipping_country,
      shippingAddress: row.shipping_address,
      amount: parseFloat(row.amount),
      riskScore: row.risk_score,
      riskLevel: row.risk_level,
      redFlags: typeof row.red_flags === 'string' ? JSON.parse(row.red_flags) : row.red_flags,
      status: row.status,
      reviewedBy: row.reviewed_by,
      createdAt: row.scanned_at,
      updatedAt: row.reviewed_at
    };
    
  } catch (error) {
    console.error(`[Fraud Detection] Error updating fraud check status:`, error);
    throw error;
  }
}

/**
 * Get single fraud check by order ID
 */
export async function getFraudCheckByOrderId(orderId: string): Promise<FraudCheckRecord | null> {
  try {
    const result = await query(
      'SELECT * FROM fraud_checks WHERE order_id = $1',
      [orderId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      orderId: row.order_id,
      orderNumber: row.order_number,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerEmail: row.customer_email,
      billingCountry: row.billing_country,
      shippingCountry: row.shipping_country,
      shippingAddress: row.shipping_address,
      amount: parseFloat(row.amount),
      riskScore: row.risk_score,
      riskLevel: row.risk_level,
      redFlags: typeof row.red_flags === 'string' ? JSON.parse(row.red_flags) : row.red_flags,
      status: row.status,
      reviewedBy: row.reviewed_by,
      createdAt: row.scanned_at,
      updatedAt: row.reviewed_at
    };
    
  } catch (error) {
    console.error(`[Fraud Detection] Error fetching fraud check:`, error);
    throw error;
  }
}