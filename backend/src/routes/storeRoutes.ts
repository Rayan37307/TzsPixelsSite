import { Router } from 'express';

const router = Router();

interface Store {
  id: string;
  name: string;
  platform: 'Shopify' | 'WordPress';
  url: string;
  accessToken: string;
  consumerKey?: string;
  consumerSecret?: string;
  status: 'Connected' | 'Disconnected';
  lastSync: string;
}

const stores: Store[] = [];

router.post('/connect', async (req, res) => {
  const { shopUrl, clientId, clientSecret, platform, consumerKey, consumerSecret } = req.body;

  if (!shopUrl) {
    return res.status(400).json({ error: 'Store URL is required' });
  }

  try {
    let accessToken = '';

    if (platform === 'Shopify') {
      if (!clientId || !clientSecret) {
        return res.status(400).json({ error: 'Client ID and Secret are required for Shopify' });
      }

      const response = await fetch(`https://${shopUrl}/admin/oauth/access_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate with Shopify');
      }

      const data = await response.json();
      accessToken = data.access_token;
    } else if (platform === 'WordPress') {
      if (!consumerKey || !consumerSecret) {
        return res.status(400).json({ error: 'Consumer Key and Secret are required for WordPress' });
      }

      const wpUrl = shopUrl.endsWith('/') ? shopUrl.slice(0, -1) : shopUrl;
      const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

      const response = await fetch(`${wpUrl}/wp-json/wc/v3/system_status`, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate with WordPress/WooCommerce');
      }

      accessToken = consumerKey;
    }

    const store: Store = {
      id: `store_${Date.now()}`,
      name: shopUrl.split('.')[0].replace(/^https?:\/\//, '').toUpperCase(),
      platform: platform as 'Shopify' | 'WordPress',
      url: shopUrl,
      accessToken,
      consumerKey: platform === 'WordPress' ? consumerKey : undefined,
      consumerSecret: platform === 'WordPress' ? consumerSecret : undefined,
      status: 'Connected',
      lastSync: 'Just now'
    };

    stores.push(store);

    res.json({
      success: true,
      store: {
        id: store.id,
        name: store.name,
        platform: store.platform,
        url: store.url,
        accessToken: store.accessToken,
        status: store.status,
        lastSync: store.lastSync
      }
    });
  } catch (error: any) {
    console.error('Store connection error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to connect store' });
  }
});

router.get('/', (req, res) => {
  res.json(stores.map(s => ({
    id: s.id,
    name: s.name,
    platform: s.platform,
    url: s.url,
    status: s.status,
    lastSync: s.lastSync
  })));
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const index = stores.findIndex(s => s.id === id);
  if (index > -1) {
    stores.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Store not found' });
  }
});

export const storeRoutes = router;