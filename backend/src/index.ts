import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { orderRoutes } from './routes/orderRoutes';
import { authRoutes } from './routes/authRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(morgan('dev')); // Detailed HTTP logs
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Scalefy Backend running on http://localhost:${PORT}`);
});
