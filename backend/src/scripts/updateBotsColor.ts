import prisma from '../config/db.js';

async function updateBotsColor() {
  console.log('🔄 Checking and updating existing bot colors in database...');
  try {
    const result = await prisma.$executeRawUnsafe(
      "UPDATE bots SET primary_color = '#10b981' WHERE primary_color = '#7c3aed' OR primary_color IS NULL OR primary_color = ''"
    );
    console.log(`✅ Successfully updated ${result} bot(s) to emerald green!`);

    const allBots = await prisma.bot.findMany({
      select: { id: true, name: true, primaryColor: true },
    });
    console.log('🤖 Current bots in DB:', allBots);

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to update bot colors in database:', error);
    process.exit(1);
  }
}

updateBotsColor();
