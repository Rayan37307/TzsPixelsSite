import prisma from '../config/db.js';

export async function initializeSettingsTable(): Promise<void> {
  console.log('[Migration] Initializing settings table...');

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const defaults = [
      { key: 'neural_config', value: {
          model: 'GPT-4-Turbo',
          geminiKey: '',
          chatgptKey: '',
      } },
      { key: 'ecommerce', value: {
          shopifyAppId: '',
          shopifyAppSecret: '',
          wooUrl: '',
          wooConsumerKey: '',
          wooConsumerSecret: '',
      } },
    ];

    for (const { key, value } of defaults) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: {},
        create: { key, value },
      });
    }

    console.log('[Migration] settings table ready');
  } catch (error: any) {
    console.error('[Migration] Settings table initialization failed:', error.message);
    throw error;
  }
}

export async function getSettings() {
  const rows = await prisma.systemSetting.findMany();
  const settings: Record<string, any> = {};
  rows.forEach(row => {
    settings[row.key] = row.value;
  });
  return settings;
}

export async function updateSettings(key: string, value: any) {
  return prisma.systemSetting.upsert({
    where: { key },
    update: { value, updatedAt: new Date() },
    create: { key, value },
  });
}
