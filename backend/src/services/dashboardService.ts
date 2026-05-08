import { ShopifyService } from './shopifyService';
import { WooCommerceService } from './woocommerceService';
import { NotificationService } from './notificationService';

function getCMS() {
  return (process.env.CMS || 'shopify').toLowerCase();
}

function isCMSConfigured(): boolean {
  const cms = getCMS();
  console.log('[Dashboard] CMS:', cms);
  if (cms === 'shopify') {
    const configured = !!(process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET &&
      process.env.SHOPIFY_CLIENT_ID !== 'your_client_id');
    console.log('[Dashboard] Shopify configured:', configured);
    return configured;
  }
  if (cms === 'wordpress' || cms === 'woocommerce') {
    const configured = WooCommerceService.isConfigured();
    console.log('[Dashboard] WooCommerce configured:', configured);
    return configured;
  }
  return false;
}

async function fetchOrders(): Promise<any[]> {
  const cms = getCMS();
  console.log('[Dashboard] Fetching orders from CMS:', cms);
  try {
    if (cms === 'wordpress' || cms === 'woocommerce') {
      return await WooCommerceService.fetchOrders();
    }
    return await ShopifyService.fetchOrders();
  } catch (error: any) {
    console.error('[Dashboard] fetchOrders error:', error.message);
    return [];
  }
}

export class DashboardService {
  static async getDashboardStats() {
    try {
      let orders: any[] = [];
      
      console.log('[Dashboard] isCMSConfigured:', isCMSConfigured());
      
      if (isCMSConfigured()) {
        orders = await fetchOrders();
      }
      
      console.log('[Dashboard] Raw orders count:', orders.length);
      if (orders.length > 0) {
        console.log('[Dashboard] Sample order:', JSON.stringify(orders[0]));
      }
      
      // Calculate basic stats
      const totalOrders = orders.length;
      let totalRevenue = 0;
      let fraudAlerts = 0;
      
      const statusCounts: Record<string, number> = {
        'Delivered': 0,
        'Pending': 0,
        'Shipped': 0,
        'Returned': 0
      };

      // Aggregate sales by day for the last 7 days
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const last7DaysSales: Record<string, { revenue: number, orders: number }> = {};
      
      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayName = days[d.getDay()];
        last7DaysSales[dayName] = { revenue: 0, orders: 0 };
      }

      orders.forEach((order: any) => {
        // Parse amount (expecting "CURRENCY VALUE")
        const amountMatch = order.amount.match(/(\d+\.?\d*)/);
        const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
        
        console.log('[Dashboard] Parsing order:', order.id, 'amount:', order.amount, '-> parsed:', amount, 'status:', order.status);
        
        totalRevenue += amount;
        
        if (order.fraudRisk === 'High' || order.fraudRisk === 'Medium') {
          fraudAlerts++;
        }
        
        if (statusCounts[order.status] !== undefined) {
          statusCounts[order.status]++;
        } else {
          statusCounts['Pending']++;
        }

        // Sales data by day
        const orderDate = new Date(order.date);
        const dayName = days[orderDate.getDay()];
        if (last7DaysSales[dayName]) {
          last7DaysSales[dayName].revenue += amount;
          last7DaysSales[dayName].orders += 1;
        }
      });

      const salesData = Object.entries(last7DaysSales).map(([name, data]) => ({
        name,
        revenue: Math.round(data.revenue),
        orders: data.orders
      }));

      const orderStatusData = [
        { name: 'Delivered', value: statusCounts['Delivered'], color: '#10b981' },
        { name: 'Pending', value: statusCounts['Pending'], color: '#f59e0b' },
        { name: 'Shipped', value: statusCounts['Shipped'], color: '#3b82f6' },
        { name: 'Returned', value: statusCounts['Returned'], color: '#ef4444' },
      ];

      const notifications = await NotificationService.getNotifications();
      const activityFeed = notifications.slice(0, 5).map((n: any) => ({
        id: n.id,
        type: n.type,
        message: n.message,
        time: n.time,
        status: n.type === 'fraud' ? 'danger' : 
                n.type === 'order' ? 'success' : 
                n.type === 'abandoned' ? 'warning' : 'info'
      }));

      return {
        stats: {
          totalRevenue: `৳ ${totalRevenue.toLocaleString('en-IN')}`,
          totalOrders: totalOrders,
          fraudAlerts: fraudAlerts,
          recoveryRate: '12.5%', // Mocked for now
          revenueChange: '+15.2%',
          ordersChange: '+8.4%',
          fraudChange: '-2.1%',
          recoveryChange: '+1.2%'
        },
        salesData,
        orderStatusData,
        activityFeed
      };
    } catch (error) {
      console.error('Error in DashboardService:', error);
      throw error;
    }
  }
}
