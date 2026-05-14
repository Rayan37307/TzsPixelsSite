import { Router } from 'express';
import { getSettings, updateSettings } from '../services/settingsService';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:key', async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  try {
    const updated = await updateSettings(key, value);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const settingsRoutes = router;
