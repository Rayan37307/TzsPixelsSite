import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cron from 'node-cron';
import { orderRoutes } from './routes/orderRoutes.js';
import { dashboardRoutes } from './routes/dashboardRoutes.js';
import { notificationRoutes } from './routes/notificationRoutes.js';
import { aiRoutes } from './routes/aiRoutes.js';
import { botRoutes } from './routes/botRoutes.js';
import { fraudRoutes } from './routes/fraudRoutes.js';
import { messengerRoutes } from './routes/messengerRoutes.js';
import { storeRoutes } from './routes/storeRoutes.js';
import abandonedRoutes from './routes/abandonedRoutes.js';
import messagingRoutes from './routes/messagingRoutes.js';
import { settingsRoutes } from './routes/settingsRoutes.js';
import { scanNewOrders } from './services/fraudDetectionService.js';
import { ShopifyService } from './services/shopifyService.js';
import { initializeMessagingTables } from './services/messaging/conversationDb.js';
import { initializeSettingsTable } from './services/settingsService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Restrict CORS to the configured frontend origin(s) in production.
// FRONTEND_ORIGIN is a comma-separated list; if unset, allow all (dev).
// Note: Meta/IG webhooks are server-to-server and unaffected by CORS.
const allowedOrigins = process.env.FRONTEND_ORIGIN
  ? process.env.FRONTEND_ORIGIN.split(',').map((o) => o.trim())
  : undefined;

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors(allowedOrigins ? { origin: allowedOrigins, credentials: true } : {}));
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
app.use('/api/settings', settingsRoutes);
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

async function startServer() {
  // Initialize database tables before accepting connections
  try {
    await initializeMessagingTables();
    await initializeSettingsTable();
    console.log('[Init] All database tables initialized');
  } catch (error) {
    console.error('[Init] Failed to initialize database tables:', error);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Tzs Pixels Backend running on http://localhost:${PORT}`);
  });
}

startServer();
