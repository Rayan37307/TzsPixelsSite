import { describe, it, expect, beforeEach } from 'vitest';
import { parseInstagramDms } from '../webhookParser.js';

describe('parseInstagramDms', () => {
  beforeEach(() => {
    process.env.IG_BUSINESS_ACCOUNT_ID = 'IG123';
  });

  it('extracts a DM event', () => {
    const body = {
      object: 'instagram',
      entry: [
        { messaging: [{ sender: { id: 'IGSID1' }, message: { mid: 'mid1', text: 'hello' } }] },
      ],
    };
    expect(parseInstagramDms(body)).toEqual([{ senderId: 'IGSID1', text: 'hello', mid: 'mid1' }]);
  });

  it('skips echo and self-sent DMs', () => {
    const body = {
      object: 'instagram',
      entry: [
        {
          messaging: [
            { sender: { id: 'IGSID1' }, message: { mid: 'm', text: 'x', is_echo: true } },
            { sender: { id: 'IG123' }, message: { mid: 'm2', text: 'self' } },
          ],
        },
      ],
    };
    expect(parseInstagramDms(body)).toEqual([]);
  });

  it('ignores comment/changes events', () => {
    const body = {
      object: 'instagram',
      entry: [
        {
          changes: [
            { field: 'comments', value: { id: 'CMT1', text: 'price?', from: { id: 'U9', username: 'ann' } } },
          ],
        },
      ],
    };
    expect(parseInstagramDms(body)).toEqual([]);
  });
});
