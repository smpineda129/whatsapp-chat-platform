-- Initial database schema for WhatsApp Chat Platform

-- Users table (platform agents and admins)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- WhatsApp contacts (external users chatting via WhatsApp)
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  profile_picture_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
  assigned_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  chat_type VARCHAR(20) DEFAULT 'bot' CHECK (chat_type IN ('bot', 'human')),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  first_response_at TIMESTAMP,
  last_message_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  whatsapp_message_id VARCHAR(255) UNIQUE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('contact', 'agent', 'bot')),
  sender_id INTEGER,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document', 'audio', 'video')),
  media_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Statistics snapshots (pre-calculated for performance)
CREATE TABLE IF NOT EXISTS conversation_statistics (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  total_messages INTEGER DEFAULT 0,
  agent_messages INTEGER DEFAULT 0,
  bot_messages INTEGER DEFAULT 0,
  contact_messages INTEGER DEFAULT 0,
  duration_minutes INTEGER,
  first_response_time_seconds INTEGER,
  average_response_time_seconds INTEGER,
  calculated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_contact ON conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_user ON conversations(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_chat_type ON conversations(chat_type);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type);

-- Insert default admin user (password: admin123)
-- Password hash generated with bcrypt rounds=10
INSERT INTO users (email, password_hash, full_name, role) 
VALUES (
  'admin@whatsapp-platform.com',
  '$2b$10$YourHashWillGoHere',
  'Admin User',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample agent user (password: agent123)
INSERT INTO users (email, password_hash, full_name, role) 
VALUES (
  'agent@whatsapp-platform.com',
  '$2b$10$YourHashWillGoHere',
  'Agent User',
  'user'
) ON CONFLICT (email) DO NOTHING;
