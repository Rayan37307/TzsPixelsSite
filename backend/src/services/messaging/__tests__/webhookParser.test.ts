import { describe, it, expect, beforeEach } from 'vitest';
import { parseInstagramDms, extractImageUrl } from '../webhookParser.js';

describe('extractImageUrl', () => {
  it('returns the url of an image attachment', () => {
    expect(extractImageUrl([{ type: 'image', payload: { url: 'https://img/1.jpg' } }])).toBe(
      'https://img/1.jpg'
    );
  });

  it('ignores non-image attachments', () => {
    expect(extractImageUrl([{ type: 'audio', payload: { url: 'https://a/1.mp3' } }])).toBeUndefined();
  });

  it('returns undefined when there are no attachments', () => {
    expect(extractImageUrl(undefined)).toBeUndefined();
  });
});

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

  it('extracts an image attachment alongside caption text', () => {
    const body = {
      object: 'instagram',
      entry: [
        {
          messaging: [
            {
              sender: { id: 'IGSID1' },
              message: {
                mid: 'mid1',
                text: 'is this in stock?',
                attachments: [{ type: 'image', payload: { url: 'https://img/p.jpg' } }],
              },
            },
          ],
        },
      ],
    };
    expect(parseInstagramDms(body)).toEqual([
      { senderId: 'IGSID1', text: 'is this in stock?', mid: 'mid1', imageUrl: 'https://img/p.jpg' },
    ]);
  });

  it('extracts an image-only DM with no caption', () => {
    const body = {
      object: 'instagram',
      entry: [
        {
          messaging: [
            {
              sender: { id: 'IGSID1' },
              message: {
                mid: 'mid2',
                attachments: [{ type: 'image', payload: { url: 'https://img/q.jpg' } }],
              },
            },
          ],
        },
      ],
    };
    expect(parseInstagramDms(body)).toEqual([
      { senderId: 'IGSID1', text: '', mid: 'mid2', imageUrl: 'https://img/q.jpg' },
    ]);
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
