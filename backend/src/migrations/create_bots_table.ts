import pool from '../config/db';

const createBotsTable = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS bots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      system_instruction TEXT,
      primary_color TEXT DEFAULT '#10b981',
      welcome_message TEXT DEFAULT 'Hello! How can I help you?',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(queryText);
    console.log('✅ Bots table created successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating bots table:', err);
    process.exit(1);
  }
};

createBotsTable();
