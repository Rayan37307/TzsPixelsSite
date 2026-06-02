import axios from 'axios';
import type { MessagingAdapter, NormalizedProfile } from './MessagingAdapter.js';

export class InstagramAdapter implements MessagingAdapter {
  private get IG_ID() {
    return process.env.IG_BUSINESS_ACCOUNT_ID || '';
  }

  private get ACCESS_TOKEN() {
    return process.env.FB_ACCESS_TOKEN || '';
  }

  private get BASE_URL() {
    return `https://graph.facebook.com/v21.0/${this.IG_ID}`;
  }

  isConfigured(): boolean {
    return !!(this.IG_ID && this.ACCESS_TOKEN);
  }

  async sendTextMessage(recipientId: string, message: string): Promise<string | null> {
    if (!this.isConfigured()) {
      throw new Error('Instagram adapter not configured');
    }
    try {
      const response = await axios.post(
        `${this.BASE_URL}/messages`,
        {
          messaging_type: 'RESPONSE',
          recipient: { id: recipientId },
          message: { text: message },
        },
        { params: { access_token: this.ACCESS_TOKEN } }
      );
      return response.data.message_id || null;
    } catch (error: any) {
      console.error('[Instagram] Send text error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<NormalizedProfile> {
    if (!this.isConfigured()) {
      throw new Error('Instagram adapter not configured');
    }
    try {
      const response = await axios.get(`https://graph.facebook.com/v21.0/${userId}`, {
        params: {
          fields: 'name,username,profile_pic',
          access_token: this.ACCESS_TOKEN,
        },
      });
      const data = response.data as { name?: string; username?: string; profile_pic?: string };
      return {
        id: userId,
        first_name: data.name || data.username || 'Instagram User',
        last_name: '',
        profile_pic: data.profile_pic,
      };
    } catch (error: any) {
      console.error('[Instagram] Get user profile error:', error.response?.data || error.message);
      return { id: userId, first_name: 'Instagram', last_name: 'User' };
    }
  }

  async setTypingIndicator(recipientId: string, state: 'on' | 'off'): Promise<void> {
    if (!this.isConfigured()) return;
    try {
      await axios.post(
        `${this.BASE_URL}/messages`,
        {
          recipient: { id: recipientId },
          sender_action: state === 'on' ? 'typing_on' : 'typing_off',
        },
        { params: { access_token: this.ACCESS_TOKEN } }
      );
    } catch (error: any) {
      console.error('[Instagram] Typing indicator error:', error.message);
    }
  }
}

export const instagramAdapter = new InstagramAdapter();
