import { Router } from 'express';
import { AIService } from '../services/aiService';

const router = Router();

router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    
    const response = await AIService.chat(message, history || []);
    res.json({ response });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const aiRoutes = router;
