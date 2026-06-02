import { WooCommerceService } from '../woocommerceService.js';
import { ShopifyService } from '../shopifyService.js';
import { wooProvider } from './wooProvider.js';
import { shopifyProvider } from './shopifyProvider.js';
import type { CommerceProvider } from './types.js';

export * from './types.js';

// The environment determines the active commerce platform. Only one is
// configured at a time; WooCommerce takes precedence if both somehow are.
export function getActiveProvider(): CommerceProvider | null {
  if (WooCommerceService.isConfigured()) return wooProvider;
  if (ShopifyService.isConfigured()) return shopifyProvider;
  return null;
}
