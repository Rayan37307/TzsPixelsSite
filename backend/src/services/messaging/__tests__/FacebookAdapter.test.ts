import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { facebookAdapter } from '../FacebookAdapter.js';

vi.mock('axios');

describe('FacebookAdapter', () => {
  beforeEach(() => {
    process.env.FB_PAGE_ID = 'PAGE123';
    process.env.FB_ACCESS_TOKEN = 'TOKEN123';
  });

  it('isConfigured true when page id and token set', () => {
    expect(facebookAdapter.isConfigured()).toBe(true);
  });

  it('sendTextMessage posts to page messages endpoint', async () => {
    (axios.post as any).mockResolvedValue({ data: { message_id: 'm1' } });
    const id = await facebookAdapter.sendTextMessage('USER1', 'hi');
    expect(id).toBe('m1');
    const [url, body] = (axios.post as any).mock.calls[0];
    expect(url).toContain('/PAGE123/messages');
    expect(body.recipient.id).toBe('USER1');
    expect(body.message.text).toBe('hi');
  });

  it('replyToComment posts to comment comments endpoint', async () => {
    (axios.post as any).mockResolvedValue({ data: {} });
    await facebookAdapter.replyToComment('C1', 'thanks');
    const [url] = (axios.post as any).mock.calls[0];
    expect(url).toContain('/C1/comments');
  });
});
