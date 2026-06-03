import { WooCommerceService } from '../woocommerceService.js';
import { ShopifyService } from '../shopifyService.js';
import { wooProvider } from './wooProvider.js';
import { shopifyProvider } from './shopifyProvider.js';
import type { CommerceProvider } from './types.js';

export * from './types.js';

// CMS env var explicitly picks the platform. Falls back to whichever is configured.
export function getActiveProvider(): CommerceProvider | null {
  const cms = (process.env.CMS || '').toLowerCase();
  if (cms === 'shopify') return ShopifyService.isConfigured() ? shopifyProvider : null;
  if (cms === 'woocommerce') return WooCommerceService.isConfigured() ? wooProvider : null;
  // No CMS set — auto-detect (WooCommerce first for legacy compat)
  if (WooCommerceService.isConfigured()) return wooProvider;
  if (ShopifyService.isConfigured()) return shopifyProvider;
  return null;
}
