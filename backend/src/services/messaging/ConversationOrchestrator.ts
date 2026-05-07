import { FacebookAdapter } from '../messaging/FacebookAdapter';
import { ChatbotService } from '../chatbot/ChatbotService';
import * as db from '../messaging/conversationDb';

export class ConversationOrchestrator {
  static async handleIncomingMessage(
    platformUserId: string,
    messageText: string,
    platformMessageId?: string
  ): Promise<void> {
    console.log(`[Orchestrator] Processing message from ${platformUserId}: ${messageText.substring(0, 50)}`);

    try {
      // Get or create conversation
      let conversation = await db.getConversationByPlatformUserId(platformUserId, 'facebook');
      
      let customerName = 'Customer';
      let profilePic: string | undefined;
      
      if (!conversation) {
        // Get user profile from Facebook
        const userProfile = await FacebookAdapter.getUserProfile(platformUserId);
        customerName = `${userProfile.first_name} ${userProfile.last_name}`.trim();
        profilePic = userProfile.profile_pic;

        conversation = await db.createConversation({
          platform_user_id: platformUserId,
          platform: 'facebook',
          customer_name: customerName,
          profile_pic: profilePic
        });
        console.log(`[Orchestrator] Created new conversation ${conversation.id}`);
      }

      // Save user message
      await db.addMessage({
        conversation_id: conversation.id,
        sender: 'customer',
        sender_id: platformUserId,
        sender_name: conversation.customer_name,
        content: messageText,
        platform_message_id: platformMessageId
      });

      // Check if human takeover
      if (!conversation.ai_mode) {
        // Human mode - just log, don't respond via AI
        console.log(`[Orchestrator] Conversation ${conversation.id} in human mode - awaiting admin response`);
        return;
      }

      // Check for human takeover trigger in message
      const takeoverTrigger = ['মানুষ', 'এজেন্ট', 'talk to human', 'কথা বলতে চাই', 'admin', 'support'];
      const shouldTakeover = takeoverTrigger.some(t => messageText.toLowerCase().includes(t));

      if (shouldTakeover) {
        // Update to human mode
        await db.updateConversation(conversation.id, {
          ai_mode: false,
          status: 'pending_human'
        });
        console.log(`[Orchestrator] User requested human takeover for conversation ${conversation.id}`);
        return;
      }

      // Send typing indicator
      await FacebookAdapter.setTypingIndicator(platformUserId, 'on');

      // Process with AI
      const aiResponse = await ChatbotService.processMessage({
        conversationId: conversation.id,
        platformUserId,
        customerName: conversation.customer_name,
        customerPhone: conversation.customer_phone || undefined
      }, messageText);

      // Send response to user
      await FacebookAdapter.sendTextMessage(platformUserId, aiResponse);

      // Save AI response
      await db.addMessage({
        conversation_id: conversation.id,
        sender: 'ai',
        sender_id: 'system',
        sender_name: 'AI Assistant',
        content: aiResponse
      });

      await FacebookAdapter.setTypingIndicator(platformUserId, 'off');
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

    // Send via Facebook
    await FacebookAdapter.sendTextMessage(conversation.platform_user_id, message);

    // Save to database
    await db.addMessage({
      conversation_id: conversationId,
      sender: 'admin',
      sender_id: 'admin',
      sender_name: 'Support Team',
      content: message
    });
  }
}