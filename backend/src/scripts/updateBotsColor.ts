import pool from '../config/db';

async function updateBotsColor() {
  console.log('🔄 Checking and updating existing bot colors in database...');
  try {
    const result = await pool.query(
      "UPDATE bots SET primary_color = '#10b981' WHERE primary_color = '#7c3aed' OR primary_color IS NULL OR primary_color = '' RETURNING *"
    );
    console.log(`✅ Successfully updated ${result.rowCount} bot(s) to emerald green!`);
    
    // Also, let's log the details of all bots currently in the database to be absolutely sure
    const allBots = await pool.query("SELECT id, name, primary_color FROM bots");
    console.log('🤖 Current bots in DB:', allBots.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to update bot colors in database:', error);
    process.exit(1);
  }
}

updateBotsColor();
