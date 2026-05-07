import { query } from '../../config/db';

export { query } from '../../config/db';

export async function initializeMessagingTables(): Promise<void> {
  console.log('[Migration] Initializing messaging tables...');

  try {
    // Create conversations table
    await query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        platform_user_id VARCHAR(255) NOT NULL,
        platform VARCHAR(50) DEFAULT 'facebook',
        customer_name VARCHAR(255),
        customer_phone VARCHAR(50),
        profile_pic VARCHAR(500),
        status VARCHAR(20) DEFAULT 'active',
        ai_mode BOOLEAN DEFAULT true,
        assigned_to VARCHAR(255),
        last_message TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(platform_user_id, platform)
      )
    `);
    console.log('[Migration] conversations table created/verified');

    // Create messages table
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
        sender VARCHAR(20) NOT NULL,
        sender_id VARCHAR(255),
        sender_name VARCHAR(255),
        content TEXT NOT NULL,
        platform_message_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('[Migration] messages table created/verified');

    // Create indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_conversations_platform_user ON conversations(platform_user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)`);
    console.log('[Migration] Indexes created/verified');

    console.log('[Migration] Messaging tables ready');
  } catch (error: any) {
    console.error('[Migration] Error:', error.message);
    throw error;
  }
}

export async function getConversations(limit = 50, offset = 0) {
  return query(
    `SELECT * FROM conversations 
     ORDER BY updated_at DESC 
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
}

export async function getConversationByPlatformUserId(platformUserId: string, platform = 'facebook') {
  const result = await query(
    `SELECT * FROM conversations WHERE platform_user_id = $1 AND platform = $2`,
    [platformUserId, platform]
  );
  return result.rows[0] || null;
}

export async function createConversation(data: {
  platform_user_id: string;
  platform?: string;
  customer_name?: string;
  customer_phone?: string;
  profile_pic?: string;
}) {
  const result = await query(
    `INSERT INTO conversations (platform_user_id, platform, customer_name, profile_pic)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (platform_user_id, platform) 
     DO UPDATE SET updated_at = NOW()
     RETURNING *`,
    [data.platform_user_id, data.platform || 'facebook', data.customer_name || 'Customer', data.profile_pic || null]
  );
  return result.rows[0];
}

export async function updateConversation(id: string, data: Partial<{
  customer_name: string;
  customer_phone: string;
  status: string;
  ai_mode: boolean;
  assigned_to: string;
  last_message: string;
}>) {
  const fields = Object.keys(data).map((key, i) => `${key} = $${i + 2}`).join(', ');
  const values = Object.values(data);
  
  const result = await query(
    `UPDATE conversations SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0];
}

export async function getConversationMessages(conversationId: string) {
  return query(
    `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
    [conversationId]
  );
}

export async function addMessage(data: {
  conversation_id: string;
  sender: string;
  sender_id?: string;
  sender_name?: string;
  content: string;
  platform_message_id?: string;
}) {
  const result = await query(
    `INSERT INTO messages (conversation_id, sender, sender_id, sender_name, content, platform_message_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.conversation_id, data.sender, data.sender_id || null, data.sender_name || null, data.content, data.platform_message_id || null]
  );
  
  // Update conversation's last_message and updated_at
  await query(
    `UPDATE conversations SET last_message = $1, updated_at = NOW() WHERE id = $2`,
    [data.content.substring(0, 200), data.conversation_id]
  );
  
  return result.rows[0];
}

export async function getConversationById(id: string) {
  const result = await query(`SELECT * FROM conversations WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

export async function getAllConversations(includeMessages = false) {
  let conversations = await query(
    `SELECT * FROM conversations ORDER BY updated_at DESC`
  );
  
  if (includeMessages) {
    for (const conv of conversations.rows) {
      const messages = await getConversationMessages(conv.id);
      conv.messages = messages.rows;
    }
  }
  
  return conversations.rows;
}

export async function searchConversations(search: string) {
  return query(
    `SELECT * FROM conversations 
     WHERE customer_name ILIKE $1 OR customer_phone ILIKE $1 OR last_message ILIKE $1
     ORDER BY updated_at DESC`,
    [`%${search}%`]
  );
}