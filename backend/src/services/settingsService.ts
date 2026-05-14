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
      { key: 'system_core', value: { platformName: 'Scalefy Enterprise', webhookUrl: 'https://api.scalefy.ai/hooks/v1', currency: 'USD' } },
      { key: 'neural_config', value: { model: 'GPT-4-Turbo', temperature: 0.7, maxTokens: 2048, concurrentAnalysis: 10 } },
      { key: 'security', value: { auditLevel: 'Standard', fraudSensitivity: 0.8, sessionTimeout: 3600 } },
      { key: 'interface', value: { glassmorphism: 0.8, animations: true, compactMode: false } }
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
