import axios from 'axios';
import { getAdapter } from './adapterRegistry.js';
import type { MessagingAdapter } from './MessagingAdapter.js';
import { ChatbotService } from '../chatbot/ChatbotService.js';
import * as db from '../messaging/conversationDb.js';

type ConversationRecord = NonNullable<Awaited<ReturnType<typeof db.getConversationByPlatformUserId>>>;

interface BurstPart {
  text: string;
  imageUrl?: string;
  imageDataUri?: string;
}

interface PendingBurst {
  parts: BurstPart[];
  timer: NodeJS.Timeout;
}

export class ConversationOrchestrator {
  // Messenger/Instagram often deliver an image + caption as two separate
  // webhook events moments apart (the spec's "Sequential" delivery pattern).
  // Answering each independently sends the customer two separate — and each
  // individually incomplete — AI replies. Buffer same-sender messages for a
  // short window and answer them together as a single turn instead.
  private static readonly REPLY_DEBOUNCE_MS = 2500;
  private static pendingBursts = new Map<string, PendingBurst>();

  private static async imageUrlToDataUri(imageUrl: string): Promise<string | undefined> {
    const requestConfig = {
      responseType: 'arraybuffer' as const,
      timeout: 15000,
      maxRedirects: 5,
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
      },
    };

    try {
      const response = await axios.get(imageUrl, requestConfig);
      const rawType = (response.headers['content-type'] as string) || '';
      const contentType = rawType.split(';')[0].trim() || 'image/jpeg';
      if (!contentType.startsWith('image/')) {
        console.warn(`[Orchestrator] Image predownload skipped: non-image content-type ${contentType}`);
        return undefined;
      }

      const base64 = Buffer.from(response.data as ArrayBuffer).toString('base64');
      console.log(`[Orchestrator] Predownloaded image for vision (${contentType}, ${base64.length} base64 chars)`);
      return `data:${contentType};base64,${base64}`;
    } catch (error: any) {
      const accessToken = process.env.FB_ACCESS_TOKEN || process.env.PAGE_ACCESS_TOKEN || '';
      const shouldRetryWithToken =
        imageUrl.includes('fbcdn.net') && accessToken && [401, 403].includes(error.response?.status);
      if (shouldRetryWithToken) {
        try {
          console.warn('[Orchestrator] Retrying Facebook image predownload with page access token');
          const response = await axios.get(imageUrl, {
            ...requestConfig,
            params: { access_token: accessToken },
          });
          const rawType = (response.headers['content-type'] as string) || '';
          const contentType = rawType.split(';')[0].trim() || 'image/jpeg';
          if (!contentType.startsWith('image/')) {
            console.warn(`[Orchestrator] Image predownload retry skipped: non-image content-type ${contentType}`);
            return undefined;
          }

          const base64 = Buffer.from(response.data as ArrayBuffer).toString('base64');
          console.log(`[Orchestrator] Predownloaded image with token for vision (${contentType}, ${base64.length} base64 chars)`);
          return `data:${contentType};base64,${base64}`;
        } catch (retryError: any) {
          const retryStatus = retryError.response?.status;
          console.warn(`[Orchestrator] Image predownload token retry failed${retryStatus ? ` HTTP ${retryStatus}` : ''}: ${retryError.message}`);
        }
      }

      const status = error.response?.status;
      console.warn(`[Orchestrator] Image predownload failed${status ? ` HTTP ${status}` : ''}: ${error.message}`);
      return undefined;
    }
  }

  static async handleIncomingMessage(
    platformUserId: string,
    messageText: string,
    platformMessageId?: string,
    platform: string = 'facebook',
    imageUrl?: string
  ): Promise<void> {
    console.log(`[Orchestrator] Processing ${platform} message from ${platformUserId}: ${messageText.substring(0, 50)}`);

    const adapter = getAdapter(platform);
    const enrichedText = imageUrl
      ? `[Customer sent an image: ${imageUrl}]${messageText ? `\n${messageText}` : ''}`
      : messageText;
    const imageDataUri = imageUrl ? await this.imageUrlToDataUri(imageUrl) : undefined;

    try {
      let conversation = await db.getConversationByPlatformUserId(platformUserId, platform);

      let customerName = 'Customer';
      let profilePic: string | undefined;

      if (!conversation) {
        const userProfile = await adapter.getUserProfile(platformUserId);
        customerName = `${userProfile.first_name} ${userProfile.last_name}`.trim();
        profilePic = userProfile.profile_pic;

        conversation = await db.createConversation({
          platform_user_id: platformUserId,
          platform,
          customer_name: customerName,
          profile_pic: profilePic,
        });
        console.log(`[Orchestrator] Created new conversation ${conversation.id}`);
      }

      await db.addMessage({
        conversation_id: conversation.id,
        sender: 'customer',
        sender_id: platformUserId,
        sender_name: conversation.customerName ?? undefined,
        content: enrichedText,
        platform_message_id: platformMessageId,
      });

      if (!conversation.aiMode) {
        console.log(`[Orchestrator] Conversation ${conversation.id} in human mode - awaiting admin response`);
        return;
      }

      const takeoverTrigger = ['মানুষ', 'এজেন্ট', 'talk to human', 'কথা বলতে চাই', 'admin', 'support'];
      const shouldTakeover = takeoverTrigger.some((t) => messageText.toLowerCase().includes(t));

      if (shouldTakeover) {
        this.cancelPendingBurst(platform, platformUserId);
        await db.updateConversation(conversation.id, {
          ai_mode: false,
          status: 'pending_human',
        });
        console.log(`[Orchestrator] User requested human takeover for conversation ${conversation.id}`);
        return;
      }

      await this.bufferForReply(platform, platformUserId, adapter, conversation, { text: messageText, imageUrl, imageDataUri });
    } catch (error: any) {
      console.error('[Orchestrator] Error:', error.message);
    }
  }

  // Collects messages arriving within REPLY_DEBOUNCE_MS of each other for the
  // same sender (resetting the timer on each new arrival), then answers them
  // together as a single AI turn once the burst goes quiet.
  private static async bufferForReply(
    platform: string,
    platformUserId: string,
    adapter: MessagingAdapter,
    conversation: ConversationRecord,
    part: BurstPart
  ): Promise<void> {
    const key = `${platform}:${platformUserId}`;
    let burst = this.pendingBursts.get(key);

    if (!burst) {
      burst = { parts: [], timer: null as unknown as NodeJS.Timeout };
      this.pendingBursts.set(key, burst);
      await adapter.setTypingIndicator(platformUserId, 'on');
    }

    burst.parts.push(part);
    clearTimeout(burst.timer);
    burst.timer = setTimeout(() => {
      this.pendingBursts.delete(key);
      void this.respondToBurst(platformUserId, adapter, conversation, burst!.parts);
    }, this.REPLY_DEBOUNCE_MS);
  }

  private static cancelPendingBurst(platform: string, platformUserId: string): void {
    const key = `${platform}:${platformUserId}`;
    const burst = this.pendingBursts.get(key);
    if (burst) {
      clearTimeout(burst.timer);
      this.pendingBursts.delete(key);
    }
  }

  private static async respondToBurst(
    platformUserId: string,
    adapter: MessagingAdapter,
    conversation: ConversationRecord,
    parts: BurstPart[]
  ): Promise<void> {
    try {
      const combinedText = parts
        .map((p) => {
          const imageSource = p.imageDataUri ?? p.imageUrl;
          return imageSource ? `[Customer sent an image: ${imageSource}]${p.text ? `\n${p.text}` : ''}` : p.text;
        })
        .filter((t) => t.length > 0)
        .join('\n');

      console.log(`[Orchestrator] Calling ChatbotService for combined message: "${combinedText.substring(0, 50)}..."`);
      const aiResponse = await ChatbotService.processMessage(
        {
          conversationId: conversation.id,
          platformUserId,
          customerName: conversation.customerName ?? 'Customer',
          customerPhone: conversation.customerPhone ?? undefined,
        },
        combinedText
      );

      console.log(`[Orchestrator] AI response received: "${aiResponse.substring(0, 100)}..."`);

      await adapter.sendTextMessage(platformUserId, aiResponse);

      await db.addMessage({
        conversation_id: conversation.id,
        sender: 'ai',
        sender_id: 'system',
        sender_name: 'AI Assistant',
        content: aiResponse,
      });

      await adapter.setTypingIndicator(platformUserId, 'off');
      console.log(`[Orchestrator] AI response sent to ${platformUserId}`);
    } catch (error: any) {
      console.error('[Orchestrator] Error:', error.message);
    }
  }

  static async takeOverConversation(conversationId: string, adminId: string): Promise<void> {
    console.log(`[Orchestrator] Admin ${adminId} taking over conversation ${conversationId}`);
    
    await db.updateConversation(conversationId, {
      ai_mode: false,
      status: 'human',
      assigned_to: adminId
    });
  }

  static async returnToAI(conversationId: string): Promise<void> {
    console.log(`[Orchestrator] Returning conversation ${conversationId} to AI mode`);
    
    await db.updateConversation(conversationId, {
      ai_mode: true,
      status: 'active',
      assigned_to: ''
    });
  }

  static async sendAdminMessage(conversationId: string, message: string): Promise<void> {
    const conversation = await db.getConversationById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const adapter = getAdapter(conversation.platform);
    await adapter.sendTextMessage(conversation.platformUserId, message);

    await db.addMessage({
      conversation_id: conversationId,
      sender: 'admin',
      sender_id: 'admin',
      sender_name: 'Support Team',
      content: message,
    });
  }
}
