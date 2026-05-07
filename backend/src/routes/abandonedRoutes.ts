import { Router } from 'express';
import { ShopifyService } from '../services/shopifyService';
import { NotificationService } from '../services/notificationService';

const router = Router();

let lastCheckoutCount = 0;

router.get('/abandoned', async (req, res) => {
  try {
    const cms = (process.env.CMS || 'shopify').toLowerCase();
    if (cms !== 'shopify') {
      return res.json({ success: true, data: [], stats: { totalAbandoned: 0, lostRevenue: 0, currency: 'BDT', topProducts: [] } });
    }

    const checkouts = await ShopifyService.fetchAbandonedCheckouts();
    
    if (checkouts.length > lastCheckoutCount && lastCheckoutCount > 0) {
      const newAbandoned = checkouts.length - lastCheckoutCount;
      await NotificationService.addNotification({
        type: 'abandoned',
        title: 'New Abandoned Checkouts',
        message: `${newAbandoned} new abandoned checkout${newAbandoned > 1 ? 's' : ''} detected`,
        time: 'Just now'
      });
    }
    lastCheckoutCount = checkouts.length;
    
    const stats = {
      totalAbandoned: checkouts.length,
      lostRevenue: checkouts.reduce((sum, c) => sum + c.amount, 0),
      currency: checkouts[0]?.currency || 'BDT',
      topProducts: getTopProducts(checkouts),
    };
    
    res.json({ success: true, data: checkouts, stats });
  } catch (error: any) {
    console.error('[Abandoned] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

function getTopProducts(checkouts: any[]) {
  const productCounts: Record<string, number> = {};
  for (const checkout of checkouts) {
    for (const item of checkout.lineItems) {
      productCounts[item.title] = (productCounts[item.title] || 0) + item.quantity;
    }
  }
  return Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
}

export default router;