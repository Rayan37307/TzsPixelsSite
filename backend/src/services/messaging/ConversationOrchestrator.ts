import { getAdapter } from './adapterRegistry.js';
import { ChatbotService } from '../chatbot/ChatbotService.js';
import * as db from '../messaging/conversationDb.js';

export class ConversationOrchestrator {
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
        await db.updateConversation(conversation.id, {
          ai_mode: false,
          status: 'pending_human',
        });
        console.log(`[Orchestrator] User requested human takeover for conversation ${conversation.id}`);
        return;
      }

      await adapter.setTypingIndicator(platformUserId, 'on');

      console.log(`[Orchestrator] Calling ChatbotService for message: "${messageText.substring(0, 50)}..."`);
      const aiResponse = await ChatbotService.processMessage(
        {
          conversationId: conversation.id,
          platformUserId,
          customerName: conversation.customerName ?? 'Customer',
          customerPhone: conversation.customerPhone ?? undefined,
        },
        enrichedText
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