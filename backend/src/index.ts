import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cron from 'node-cron';
import { orderRoutes } from './routes/orderRoutes';
import { dashboardRoutes } from './routes/dashboardRoutes';
import { notificationRoutes } from './routes/notificationRoutes';
import { aiRoutes } from './routes/aiRoutes';
import { botRoutes } from './routes/botRoutes';
import { fraudRoutes } from './routes/fraudRoutes';
import { messengerRoutes } from './routes/messengerRoutes';
import { storeRoutes } from './routes/storeRoutes';
import abandonedRoutes from './routes/abandonedRoutes';
import messagingRoutes from './routes/messagingRoutes';
import { scanNewOrders } from './services/fraudDetectionService';
import { ShopifyService } from './services/shopifyService';
import { initializeMessagingTables } from './services/messaging/conversationDb';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(morgan('dev')); // Detailed HTTP logs
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/bots', botRoutes);
app.use('/api/fraud', fraudRoutes);
app.use('/api/messenger', messengerRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/shopify', abandonedRoutes);
app.use('/', messagingRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Fraud detection scan every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log('[Fraud] Running scheduled scan...');
  try {
    await scanNewOrders();
    console.log('[Fraud] Scan completed');
  } catch (error) {
    console.error('[Fraud] Scan failed:', error);
  }
});

// Abandoned checkout scan every 30 minutes (Shopify only)
cron.schedule('*/30 * * * *', async () => {
  const cms = (process.env.CMS || 'shopify').toLowerCase();
  if (cms !== 'shopify') {
    console.log('[Abandoned] Skipped - WooCommerce does not support abandoned checkouts API');
    return;
  }
  console.log('[Abandoned] Running scheduled scan...');
  try {
    await ShopifyService.fetchAbandonedCheckouts();
    console.log('[Abandoned] Scan completed');
  } catch (error) {
    console.error('[Abandoned] Scan failed:', error);
  }
});

app.listen(PORT, async () => {
  console.log(`🚀 Scalefy Backend running on http://localhost:${PORT}`);
  
  // Initialize messaging tables
  try {
    await initializeMessagingTables();
  } catch (error) {
    console.error('[Init] Failed to initialize messaging tables:', error);
  }
});
