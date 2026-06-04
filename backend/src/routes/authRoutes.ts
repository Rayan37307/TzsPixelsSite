import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/api/auth/login', (req: Request, res: Response) => {
  const { token } = req.body;
  const accessToken = process.env.ACCESS_TOKEN;
  const jwtSecret = process.env.JWT_SECRET;

  if (!accessToken || !jwtSecret) {
    console.error('[Auth] ACCESS_TOKEN or JWT_SECRET not set in .env');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  if (!token || token !== accessToken) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const authToken = jwt.sign({ authenticated: true }, jwtSecret, { expiresIn: '7d' });
  res.json({ token: authToken });
});

export default router;
