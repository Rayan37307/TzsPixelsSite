import { describe, it, expect } from 'vitest';
import { getAdapter } from '../adapterRegistry.js';
import { FacebookAdapter } from '../FacebookAdapter.js';
import { InstagramAdapter } from '../InstagramAdapter.js';

describe('adapterRegistry', () => {
  it('returns FacebookAdapter for facebook', () => {
    expect(getAdapter('facebook')).toBeInstanceOf(FacebookAdapter);
  });

  it('returns InstagramAdapter for instagram', () => {
    expect(getAdapter('instagram')).toBeInstanceOf(InstagramAdapter);
  });

  it('throws on unknown platform', () => {
    expect(() => getAdapter('twitter' as any)).toThrow('Unknown platform: twitter');
  });
});
