import type { MessagingAdapter } from './MessagingAdapter.js';
import { facebookAdapter } from './FacebookAdapter.js';
import { instagramAdapter } from './InstagramAdapter.js';

const adapters: Record<string, MessagingAdapter> = {
  facebook: facebookAdapter,
  instagram: instagramAdapter,
};

export function getAdapter(platform: string): MessagingAdapter {
  const adapter = adapters[platform];
  if (!adapter) {
    throw new Error(`Unknown platform: ${platform}`);
  }
  return adapter;
}
