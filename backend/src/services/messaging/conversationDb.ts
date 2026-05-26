import prisma from '../../config/db.js';

export async function initializeMessagingTables(): Promise<void> {
  console.log('[Migration] Initializing messaging tables...');
  try {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS conversations (
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
    )`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
      sender VARCHAR(20) NOT NULL,
      sender_id VARCHAR(255),
      sender_name VARCHAR(255),
      content TEXT NOT NULL,
      platform_message_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_conversations_platform_user ON conversations(platform_user_id)`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status)`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)`);
    console.log('[Migration] Messaging tables ready');
  } catch (error: any) {
    console.error('[Migration] Error:', error.message);
    throw error;
  }
}

export async function getConversations(limit = 50, offset = 0) {
  const rows = await prisma.conversation.findMany({
    orderBy: { updatedAt: 'desc' },
    take: limit,
    skip: offset,
  });
  return { rows };
}

export async function getConversationByPlatformUserId(platformUserId: string, platform = 'facebook') {
  return prisma.conversation.findFirst({
    where: { platformUserId, platform },
  });
}

export async function createConversation(data: {
  platform_user_id: string;
  platform?: string;
  customer_name?: string;
  customer_phone?: string;
  profile_pic?: string;
}) {
  return prisma.conversation.upsert({
    where: {
      platformUserId_platform: {
        platformUserId: data.platform_user_id,
        platform: data.platform || 'facebook',
      },
    },
    update: { updatedAt: new Date() },
    create: {
      platformUserId: data.platform_user_id,
      platform: data.platform || 'facebook',
      customerName: data.customer_name || 'Customer',
      profilePic: data.profile_pic || null,
    },
  });
}

export async function updateConversation(id: string, data: Partial<{
  customer_name: string;
  customer_phone: string;
  status: string;
  ai_mode: boolean;
  assigned_to: string;
  last_message: string;
}>) {
  const prismaData: any = {};
  if (data.customer_name !== undefined) prismaData.customerName = data.customer_name;
  if (data.customer_phone !== undefined) prismaData.customerPhone = data.customer_phone;
  if (data.status !== undefined) prismaData.status = data.status;
  if (data.ai_mode !== undefined) prismaData.aiMode = data.ai_mode;
  if (data.assigned_to !== undefined) prismaData.assignedTo = data.assigned_to;
  if (data.last_message !== undefined) prismaData.lastMessage = data.last_message;
  prismaData.updatedAt = new Date();

  return prisma.conversation.update({
    where: { id },
    data: prismaData,
  });
}

export async function getConversationMessages(conversationId: string) {
  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });
  return { rows };
}

export async function addMessage(data: {
  conversation_id: string;
  sender: string;
  sender_id?: string;
  sender_name?: string;
  content: string;
  platform_message_id?: string;
}) {
  const result = await prisma.message.create({
    data: {
      conversationId: data.conversation_id,
      sender: data.sender,
      senderId: data.sender_id || null,
      senderName: data.sender_name || null,
      content: data.content,
      platformMessageId: data.platform_message_id || null,
    },
  });

  await prisma.conversation.update({
    where: { id: data.conversation_id },
    data: {
      lastMessage: data.content.substring(0, 200),
      updatedAt: new Date(),
    },
  });

  return result;
}

export async function getConversationById(id: string) {
  return prisma.conversation.findUnique({ where: { id } });
}

export async function getAllConversations(includeMessages = false) {
  const conversations = await prisma.conversation.findMany({
    orderBy: { updatedAt: 'desc' },
  });

  if (includeMessages) {
    for (const conv of conversations) {
      (conv as any).messages = await prisma.message.findMany({
        where: { conversationId: conv.id },
        orderBy: { createdAt: 'asc' },
      });
    }
  }

  return conversations;
}

export async function searchConversations(search: string) {
  const rows = await prisma.conversation.findMany({
    where: {
      OR: [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { lastMessage: { contains: search, mode: 'insensitive' } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
  });
  return { rows };
}
