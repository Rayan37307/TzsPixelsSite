import { Router, Request, Response } from 'express';
import * as db from '../services/messaging/conversationDb';
import { query } from '../config/db';
import { ConversationOrchestrator } from '../services/messaging/ConversationOrchestrator';
import { FacebookAdapter } from '../services/messaging/FacebookAdapter';
import { ChatbotService } from '../services/chatbot/ChatbotService';

const router = Router();

// Subscribe to feed webhooks on startup
if (FacebookAdapter.isConfigured()) {
  setTimeout(() => {
    FacebookAdapter.subscribeToFeed().then(success => {
      console.log('[Startup] Feed subscription:', success ? 'SUCCESS' : 'FAILED');
    });
  }, 3000);
}

// ==================== WEBHOOK ====================

// Facebook Webhook Verification (GET)
router.get('/webhooks/facebook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.FB_VERIFY_TOKEN || 'saajba_webhook_verify';
  
  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[Webhook] Facebook verified');
    res.status(200).send(challenge);
  } else {
    console.log('[Webhook] Verification failed');
    res.status(403).send('Verification failed');
  }
});

// Facebook Webhook Message Handler (POST)
router.post('/webhooks/facebook', async (req: Request, res: Response) => {
  console.log('[Webhook] Facebook event received');
  
  try {
    const body = req.body;
    console.log('[Webhook] Full body:', JSON.stringify(body).substring(0, 1000));
    
    if (body.object === 'page') {
      res.status(200).send('OK');
      
      console.log('[Webhook] Entry count:', body.entry?.length || 0);
      
      for (const entry of body.entry || []) {
        console.log('[Webhook] Entry:', JSON.stringify(entry).substring(0, 500));
        
        // Handle messaging events (direct messages)
        for (const messaging of entry.messaging || []) {
          console.log('[Webhook] Messaging:', JSON.stringify(messaging).substring(0, 300));
          const senderId = messaging.sender?.id;
          const messageText = messaging.message?.text;
          const messageId = messaging.message?.mid;
          
          if (senderId && messageText) {
            console.log(`[Webhook] Message from ${senderId}: ${messageText}`);
            await ConversationOrchestrator.handleIncomingMessage(senderId, messageText, messageId);
          }
        }

        // Handle feed events (comments on posts)
        if (entry.changes) {
          console.log('[Webhook] Changes:', JSON.stringify(entry.changes).substring(0, 500));
          for (const change of entry.changes || []) {
            console.log('[Webhook] Change:', JSON.stringify(change));
            
            if (change.field === 'feed' && (change.value.comment_id || change.value.message)) {
              const commentId = change.value.comment_id;
              const messageText = change.value.message;
              const commenterId = change.value.from?.id;
              const pagePostId = change.value.post_id;

              console.log(`[Webhook] Comment received:`, { commentId, messageText, commenterId, pagePostId: pagePostId?.toString().slice(-20) });

              if (commentId && messageText) {
                console.log(`[Webhook] Processing comment reply for: ${commentId}`);
                
                const commenterName = change.value.from?.name || 'Facebook User';
                
                const aiResponse = await ChatbotService.processMessage(
                  { conversationId: `fb_comment_${commentId}`, platformUserId: commenterId, customerName: commenterName },
                  messageText
                );
                
                console.log(`[Webhook] AI response:`, aiResponse);
                
                const replyResult = await FacebookAdapter.replyToComment(commentId, aiResponse);
                
                if (replyResult.success) {
                  console.log(`[Webhook] Comment reply sent successfully`);
                } else {
                  console.log(`[Webhook] Comment reply failed`);
                }
              }
            } else {
              console.log(`[Webhook] Skipping change:`, { field: change.field, hasCommentId: !!change.value?.comment_id, hasMessage: !!change.value?.message });
            }
          }
        }
      }
    } else {
      console.log('[Webhook] Unknown object type:', body.object);
    }
  } catch (error: any) {
    console.error('[Webhook] Error:', error.message);
    res.status(500).send('Error');
  }
});

// ==================== CONVERSATIONS ====================

// Get all conversations
router.get('/api/messaging/conversations', async (req: Request, res: Response) => {
  try {
    const { include_messages } = req.query;
    const conversations = await db.getAllConversations(include_messages === 'true');
    res.json(conversations);
  } catch (error: any) {
    console.error('[API] Get conversations error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Search conversations (must be before :id)
router.get('/api/messaging/conversations/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    const results = await db.searchConversations(q as string);
    res.json(results.rows);
  } catch (error: any) {
    console.error('[API] Search error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get single conversation with messages
router.get('/api/messaging/conversations/:id', async (req: Request, res: Response) => {
  try {
    const conversationId = req.params.id as string;
    const conversation = await db.getConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await db.getConversationMessages(conversation.id);
    res.json({ ...conversation, messages: messages.rows });
  } catch (error: any) {
    console.error('[API] Get conversation error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ACTIONS ====================

// Take over conversation (admin)
router.post('/api/messaging/conversations/:id/takeover', async (req: Request, res: Response) => {
  try {
    const { admin_id } = req.body;
    const conversationId = req.params.id as string;
    await ConversationOrchestrator.takeOverConversation(conversationId, admin_id || 'admin');
    res.json({ success: true, message: 'Conversation transferred to human' });
  } catch (error: any) {
    console.error('[API] Takeover error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Return conversation to AI
router.post('/api/messaging/conversations/:id/return-to-ai', async (req: Request, res: Response) => {
  try {
    const conversationId = req.params.id as string;
    await ConversationOrchestrator.returnToAI(conversationId);
    res.json({ success: true, message: 'Conversation returned to AI' });
  } catch (error: any) {
    console.error('[API] Return to AI error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Send message (admin)
router.post('/api/messaging/conversations/:id/message', async (req: Request, res: Response) => {
  try {
    const { message, sender_name } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }
    const conversationId = req.params.id as string;
    await ConversationOrchestrator.sendAdminMessage(conversationId, message);
    res.json({ success: true });
  } catch (error: any) {
    console.error('[API] Send message error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update conversation (assign, change status)
router.patch('/api/messaging/conversations/:id', async (req: Request, res: Response) => {
  try {
    const conversationId = req.params.id as string;
    const updated = await db.updateConversation(conversationId, req.body);
    res.json(updated);
  } catch (error: any) {
    console.error('[API] Update error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==================== STATS ====================

// Get messaging stats
router.get('/api/messaging/stats', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_conversations,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE ai_mode = false) as human_mode,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today
      FROM conversations
    `);
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('[API] Stats error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;