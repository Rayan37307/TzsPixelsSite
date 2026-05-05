import { MongoClient, Db, Collection } from 'mongodb';

const N8N_MONGO_URI = process.env.N8N_MONGO_URI || 'mongodb+srv://n8n:n8n@todo.8yhhs.mongodb.net/?appName=todo';
const N8N_DB_NAME = process.env.N8N_DB_NAME || 'n8n';
const N8N_COLLECTION_NAME = 'n8n_chat_histories';

let client: MongoClient | null = null;
let db: Db | null = null;

export const connectN8nMongo = async (): Promise<Db> => {
  if (db) return db;
  
  client = new MongoClient(N8N_MONGO_URI);
  await client.connect();
  db = client.db(N8N_DB_NAME);
  console.log('[N8N MongoDB] Connected to', N8N_DB_NAME);
  return db;
};

export const getN8nCollection = async (): Promise<Collection> => {
  const database = await connectN8nMongo();
  return database.collection(N8N_COLLECTION_NAME);
};

export interface N8nChatHistory {
  _id: unknown;
  chatId: string;
  sessionId: string;
  threadId?: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export const getAllConversations = async (): Promise<N8nChatHistory[]> => {
  const collection = await getN8nCollection();
  const conversations = await collection
    .find({})
    .sort({ updatedAt: -1 })
    .limit(100)
    .toArray();
  return conversations as N8nChatHistory[];
};

export const getConversationById = async (chatId: string): Promise<N8nChatHistory | null> => {
  const collection = await getN8nCollection();
  const conversation = await collection.findOne({ chatId });
  return conversation as N8nChatHistory | null;
};