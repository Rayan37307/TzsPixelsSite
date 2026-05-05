import { Router } from 'express';
import { getAllConversations, getConversationById } from '../services/n8nChatService';

const router = Router();

router.get('/conversations', async (req, res) => {
  try {
    const conversations = await getAllConversations();
    res.json(conversations);
  } catch (error: any) {
    console.error('Failed to fetch conversations:', error.message);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/conversations/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const conversation = await getConversationById(chatId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json(conversation);
  } catch (error: any) {
    console.error('Failed to fetch conversation:', error.message);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

export const messengerRoutes = router;