import { Router } from 'express';
import * as db from '../services/messaging/conversationDb.js';

const router = Router();

router.get('/conversations', async (req, res) => {
  try {
    const conversations = await db.getAllConversations();
    res.json(conversations);
  } catch (error: any) {
    console.error('Failed to fetch conversations:', error.message);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await db.getConversationById(id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const messages = await db.getConversationMessages(conversation.id);
    res.json({ ...conversation, messages: messages.rows });
  } catch (error: any) {
    console.error('Failed to fetch conversation:', error.message);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

export const messengerRoutes = router;