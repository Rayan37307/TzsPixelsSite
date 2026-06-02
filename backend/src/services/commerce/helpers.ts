import type { CustomerOrderHistory } from './types.js';

// Both WooCommerceService.fetchOrders and ShopifyService.fetchOrders return
// orders normalized to { phone, status, ... } where delivered orders have
// status === 'Delivered'. This computes success-rate history for a phone.
export function historyFromOrders(orders: any[], phone: string): CustomerOrderHistory {
  const digits = phone.replace(/\D/g, '');
  const matched = orders.filter((o) => {
    const op = String(o.phone ?? '').replace(/\D/g, '');
    return op.length > 0 && digits.length > 0 && (op.includes(digits) || digits.includes(op));
  });

  const delivered = matched.filter((o) => o.status === 'Delivered').length;
  const total = matched.length;
  const successRate = total > 0 ? Math.round((delivered / total) * 100) : 0;
  return { total, delivered, successRate };
}
