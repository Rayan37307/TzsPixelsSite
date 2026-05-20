import { query } from '../config/db';

export async function initializeSettingsTable(): Promise<void> {
  console.log('[Migration] Initializing settings table...');

  try {
    await query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Initialize default settings if they don't exist
    const defaults = [
      { key: 'neural_config', value: { 
          model: 'GPT-4-Turbo', 
          geminiKey: '',
          chatgptKey: ''
      } },
      { key: 'ecommerce', value: {
          shopifyAppId: '',
          shopifyAppSecret: '',
          wooUrl: '',
          wooConsumerKey: '',
          wooConsumerSecret: ''
      } }
    ];

    for (const { key, value } of defaults) {
      await query(`
        INSERT INTO system_settings (key, value)
        VALUES ($1, $2)
        ON CONFLICT (key) DO NOTHING
      `, [key, value]);
    }

    console.log('[Migration] settings table ready');
  } catch (error: any) {
    console.error('[Migration] Settings table initialization failed:', error.message);
    throw error;
  }
}

export async function getSettings() {
  const result = await query('SELECT key, value FROM system_settings');
  const settings: Record<string, any> = {};
  result.rows.forEach(row => {
    settings[row.key] = row.value;
  });
  return settings;
}

export async function updateSettings(key: string, value: any) {
  const result = await query(
    'INSERT INTO system_settings (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW() RETURNING *',
    [key, value]
  );
  return result.rows[0];
}
