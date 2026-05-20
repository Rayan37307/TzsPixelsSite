import { query } from '../config/db';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations() {
  console.log('🚀 Starting database migrations...');

  try {
    // 1. Messaging Tables (handled in conversationDb.ts usually, but we'll ensure here)
    console.log('📦 Creating messaging tables...');
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

    // 2. Bots Table
    console.log('📦 Creating bots table...');
    await query(`
      CREATE TABLE IF NOT EXISTS bots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        system_instruction TEXT,
        primary_color TEXT DEFAULT '#10b981',
        welcome_message TEXT DEFAULT 'Hello! How can I help you?',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Orders Table (Cache for historical fraud scoring)
    console.log('📦 Creating orders table...');
    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(50) UNIQUE NOT NULL,
        total_price VARCHAR(50),
        customer_phone VARCHAR(50),
        customer_email VARCHAR(255),
        status VARCHAR(50),
        refund_status VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 4. Fraud Checks Table (From 001_fraud_checks.sql)
    console.log('📦 Creating fraud_checks table...');
    await query(`
      CREATE TABLE IF NOT EXISTS fraud_checks (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(50) UNIQUE NOT NULL,
        order_number VARCHAR(50),
        customer_name VARCHAR(255),
        customer_phone VARCHAR(20),
        customer_email VARCHAR(255),
        billing_country VARCHAR(50),
        shipping_country VARCHAR(50),
        shipping_address TEXT,
        amount DECIMAL(10,2) NOT NULL,
        risk_score INTEGER NOT NULL DEFAULT 0,
        risk_level VARCHAR(10) NOT NULL DEFAULT 'safe',
        red_flags JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(20) DEFAULT 'pending',
        scanned_at TIMESTAMP DEFAULT NOW(),
        reviewed_at TIMESTAMP,
        reviewed_by INTEGER
      )
    `);

    // 5. Indexes
    console.log('📦 Creating indexes...');
    await query(`CREATE INDEX IF NOT EXISTS idx_conversations_platform_user ON conversations(platform_user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_fraud_checks_status ON fraud_checks(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email)`);

    console.log('✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
