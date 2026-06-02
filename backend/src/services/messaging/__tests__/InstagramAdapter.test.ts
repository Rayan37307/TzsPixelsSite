import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { instagramAdapter } from '../InstagramAdapter.js';

vi.mock('axios');

describe('InstagramAdapter', () => {
  beforeEach(() => {
    process.env.IG_BUSINESS_ACCOUNT_ID = 'IG123';
    process.env.FB_ACCESS_TOKEN = 'TOKEN123';
  });

  it('isConfigured true when ig id and token set', () => {
    expect(instagramAdapter.isConfigured()).toBe(true);
  });

  it('isConfigured false when ig id missing', () => {
    delete process.env.IG_BUSINESS_ACCOUNT_ID;
    expect(instagramAdapter.isConfigured()).toBe(false);
  });

  it('sendTextMessage posts to ig account messages endpoint with igsid recipient', async () => {
    (axios.post as any).mockResolvedValue({ data: { message_id: 'm1' } });
    const id = await instagramAdapter.sendTextMessage('IGSID1', 'hi');
    expect(id).toBe('m1');
    const [url, body] = (axios.post as any).mock.calls[0];
    expect(url).toContain('/IG123/messages');
    expect(body.recipient.id).toBe('IGSID1');
    expect(body.message.text).toBe('hi');
  });

  it('getUserProfile normalizes name/username into first_name', async () => {
    (axios.get as any).mockResolvedValue({ data: { name: 'Jane Doe', username: 'jane' } });
    const profile = await instagramAdapter.getUserProfile('IGSID1');
    expect(profile.id).toBe('IGSID1');
    expect(profile.first_name).toBe('Jane Doe');
    expect(profile.last_name).toBe('');
  });

  it('getUserProfile falls back on error', async () => {
    (axios.get as any).mockRejectedValue(new Error('boom'));
    const profile = await instagramAdapter.getUserProfile('IGSID1');
    expect(profile.first_name).toBe('Instagram');
    expect(profile.last_name).toBe('User');
  });

  it('setTypingIndicator swallows errors', async () => {
    (axios.post as any).mockRejectedValue(new Error('nope'));
    await expect(instagramAdapter.setTypingIndicator('IGSID1', 'on')).resolves.toBeUndefined();
  });
});
