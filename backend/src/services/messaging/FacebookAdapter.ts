import axios from 'axios';

interface FacebookUser {
  id: string;
  first_name: string;
  last_name: string;
  profile_pic?: string;
}

export class FacebookAdapter {
  private static get PAGE_ID() {
    return process.env.FB_PAGE_ID || '';
  }

  private static get ACCESS_TOKEN() {
    return process.env.FB_ACCESS_TOKEN || '';
  }

  private static get BASE_URL() {
    return `https://graph.facebook.com/v21.0/${this.PAGE_ID}`;
  }

  static isConfigured(): boolean {
    return !!(this.PAGE_ID && this.ACCESS_TOKEN);
  }

  static async sendMessage(recipientId: string, message: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Facebook adapter not configured');
    }

    try {
      await axios.post(
        `${this.BASE_URL}/messages`,
        {
          messaging_type: 'RESPONSE',
          recipient: { id: recipientId },
          message: { text: message }
        },
        {
          params: { access_token: this.ACCESS_TOKEN }
        }
      );
    } catch (error: any) {
      console.error('[Facebook] Send message error:', error.response?.data || error.message);
      throw error;
    }
  }

  static async sendTextMessage(recipientId: string, message: string): Promise<string | null> {
    if (!this.isConfigured()) {
      throw new Error('Facebook adapter not configured');
    }

    try {
      const response = await axios.post(
        `${this.BASE_URL}/messages`,
        {
          messaging_type: 'RESPONSE',
          recipient: { id: recipientId },
          message: { text: message }
        },
        {
          params: { access_token: this.ACCESS_TOKEN }
        }
      );
      return response.data.message_id || null;
    } catch (error: any) {
      console.error('[Facebook] Send text error:', error.response?.data || error.message);
      throw error;
    }
  }

  static async sendQuickReply(recipientId: string, text: string, buttons: { title: string; payload: string }[]): Promise<string | null> {
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
            quick_replies: buttons.map(btn => ({
              content_type: 'text',
              title: btn.title,
              payload: btn.payload
            }))
          }
        },
        {
          params: { access_token: this.ACCESS_TOKEN }
        }
      );
      return response.data.message_id || null;
    } catch (error: any) {
      console.error('[Facebook] Send quick reply error:', error.response?.data || error.message);
      throw error;
    }
  }

  static async sendAttachment(recipientId: string, attachmentType: 'image' | 'audio' | 'video' | 'file', attachmentUrl: string): Promise<string | null> {
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
              payload: {
                url: attachmentUrl,
                is_reusable: true
              }
            }
          }
        },
        {
          params: { access_token: this.ACCESS_TOKEN }
        }
      );
      return response.data.message_id || null;
    } catch (error: any) {
      console.error('[Facebook] Send attachment error:', error.response?.data || error.message);
      throw error;
    }
  }

  static async getUserProfile(userId: string): Promise<FacebookUser> {
    if (!this.isConfigured()) {
      throw new Error('Facebook adapter not configured');
    }

    try {
      const response = await axios.get(`https://graph.facebook.com/v21.0/${userId}`, {
        params: {
          fields: 'first_name,last_name,profile_pic',
          access_token: this.ACCESS_TOKEN
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('[Facebook] Get user profile error:', error.response?.data || error.message);
      return { id: userId, first_name: 'Unknown', last_name: 'User' };
    }
  }

  static async setTypingIndicator(recipientId: string, state: 'on' | 'off'): Promise<void> {
    if (!this.isConfigured()) return;

    try {
      await axios.post(
        `${this.BASE_URL}/messages`,
        {
          recipient: { id: recipientId },
          sender_action: state === 'on' ? 'typing_on' : 'typing_off'
        },
        {
          params: { access_token: this.ACCESS_TOKEN }
        }
      );
    } catch (error: any) {
      console.error('[Facebook] Typing indicator error:', error.message);
    }
  }

  static verifyWebhook(mode: string, token: string, challenge: string): boolean {
    const verifyToken = process.env.FB_VERIFY_TOKEN || 'your_verify_token';
    return mode === 'subscribe' && token === verifyToken;
  }

  static async replyToComment(commentId: string, message: string): Promise<{ id: string; success: boolean }> {
    if (!this.isConfigured()) {
      throw new Error('Facebook adapter not configured');
    }

    try {
      console.log('[Facebook] Replying to comment:', commentId);

      const response = await axios.post(
        `https://graph.facebook.com/v21.0/${commentId}/private_replies`,
        {
          message: message
        },
        {
          params: { access_token: this.ACCESS_TOKEN }
        }
      );

      console.log('[Facebook] Comment reply success:', response.data.id);
      return { id: response.data.id, success: true };
    } catch (error: any) {
      console.error('[Facebook] Comment reply error:', error.response?.data || error.message);
      return { id: '', success: false };
    }
  }

  static async getComment(commentId: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Facebook adapter not configured');
    }

    try {
      const response = await axios.get(
        `https://graph.facebook.com/v21.0/${commentId}`,
        {
          params: { access_token: this.ACCESS_TOKEN }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('[Facebook] Get comment error:', error.response?.data || error.message);
      return null;
    }
  }

  static async subscribeToFeed(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('[Facebook] Not configured, cannot subscribe to feed');
      return false;
    }

    try {
      console.log('[Facebook] Subscribing to feed field for page:', this.PAGE_ID);
      
      const response = await axios.post(
        `https://graph.facebook.com/v21.0/${this.PAGE_ID}/subscribed_apps`,
        {
          subscribed_fields: 'feed'
        },
        {
          params: { access_token: this.ACCESS_TOKEN }
        }
      );

      console.log('[Facebook] Subscribe result:', response.data);
      return true;
    } catch (error: any) {
      console.error('[Facebook] Subscribe error:', error.response?.data || error.message);
      return false;
    }
  }
}