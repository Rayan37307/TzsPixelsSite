import { Router } from 'express';
import { BotModel } from '../models/Bot.js';
import { AIService } from '../services/aiService.js';

const router = Router();

// CRUD for bots
router.post('/', async (req, res) => {
  try {
    const bot = await BotModel.create(req.body);
    res.json(bot);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const bots = await BotModel.findAll();
    res.json(bots);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const bot = await BotModel.findById(req.params.id);
    res.json(bot);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const bot = await BotModel.update(req.params.id, req.body);
    res.json(bot);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await BotModel.delete(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Bot-specific chat
router.post('/:id/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    const bot = await BotModel.findById(req.params.id);
    if (!bot) {
      return res.status(404).json({ error: "Bot not found" });
    }

    const response = await AIService.chat(message, history || [], bot.system_instruction ?? undefined);
    res.json({ response });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const botRoutes = router;
