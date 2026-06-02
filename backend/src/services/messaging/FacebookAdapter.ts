import axios from 'axios';
import type { MessagingAdapter, NormalizedProfile } from './MessagingAdapter.js';

interface FacebookUser {
  id: string;
  first_name: string;
  last_name: string;
  profile_pic?: string;
}

export class FacebookAdapter implements MessagingAdapter {
  private get PAGE_ID() {
    return process.env.FB_PAGE_ID || '';
  }

  private get ACCESS_TOKEN() {
    return process.env.FB_ACCESS_TOKEN || '';
  }

  private get BASE_URL() {
    return `https://graph.facebook.com/v21.0/${this.PAGE_ID}`;
  }

  isConfigured(): boolean {
    return !!(this.PAGE_ID && this.ACCESS_TOKEN);
  }

  async sendTextMessage(recipientId: string, message: string): Promise<string | null> {
    if (!this.isConfigured()) {
      throw new Error('Facebook adapter not configured');
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
      console.error('[Facebook] Send text error:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendQuickReply(
    recipientId: string,
    text: string,
    buttons: { title: string; payload: string }[]
  ): Promise<string | null> {
    if (!this.isConfigured()) {
      throw new Error('Facebook adapter not configured');
    }
    try {
      const response = await axios.post(
        `${this.BASE_URL}/messages`,
        {
          messaging_type: 'RESPONSE',
          recipient: { id: recipientId },
          message: {
            text,
            quick_replies: buttons.map((btn) => ({
              content_type: 'text',
              title: btn.title,
              payload: btn.payload,
            })),
          },
        },
        { params: { access_token: this.ACCESS_TOKEN } }
      );
      return response.data.message_id || null;
    } catch (error: any) {
      console.error('[Facebook] Send quick reply error:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendAttachment(
    recipientId: string,
    attachmentType: 'image' | 'audio' | 'video' | 'file',
    attachmentUrl: string
  ): Promise<string | null> {
    if (!this.isConfigured()) {
      throw new Error('Facebook adapter not configured');
    }
    try {
      const response = await axios.post(
        `${this.BASE_URL}/messages`,
        {
          messaging_type: 'RESPONSE',
          recipient: { id: recipientId },
          message: {
            attachment: {
              type: attachmentType,
              payload: { url: attachmentUrl, is_reusable: true },
            },
          },
        },
        { params: { access_token: this.ACCESS_TOKEN } }
      );
      return response.data.message_id || null;
    } catch (error: any) {
      console.error('[Facebook] Send attachment error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<NormalizedProfile> {
    if (!this.isConfigured()) {
      throw new Error('Facebook adapter not configured');
    }
    try {
      const response = await axios.get(`https://graph.facebook.com/v21.0/${userId}`, {
        params: {
          fields: 'first_name,last_name,profile_pic',
          access_token: this.ACCESS_TOKEN,
        },
      });
      const data = response.data as FacebookUser;
      return {
        id: userId,
        first_name: data.first_name || 'Unknown',
        last_name: data.last_name || 'User',
        profile_pic: data.profile_pic,
      };
    } catch (error: any) {
      console.error('[Facebook] Get user profile error:', error.response?.data || error.message);
      return { id: userId, first_name: 'Unknown', last_name: 'User' };
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
      console.error('[Facebook] Typing indicator error:', error.message);
    }
  }

  // Comment automation is currently disabled (no webhook trigger). Kept for re-enable.
  async replyToComment(commentId: string, message: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Facebook adapter not configured');
    }
    try {
      await axios.post(
        `https://graph.facebook.com/v21.0/${commentId}/comments`,
        { message },
        { params: { access_token: this.ACCESS_TOKEN } }
      );
    } catch (error: any) {
      console.error('[Facebook] Reply to comment error:', error.response?.data || error.message);
      throw error;
    }
  }
}

export const facebookAdapter = new FacebookAdapter();
