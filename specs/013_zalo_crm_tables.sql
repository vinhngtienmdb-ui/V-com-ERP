-- 013_zalo_crm_tables.sql
-- Mô phỏng cấu trúc database ZaloCRM v3.4 cho V-com ERP

CREATE TABLE IF NOT EXISTS zalo_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  qr_code_data TEXT,
  access_token TEXT,
  refresh_token TEXT,
  proxy_config JSONB,
  status VARCHAR(50) DEFAULT 'DISCONNECTED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zalo_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zalo_global_id VARCHAR(255) UNIQUE,
  crm_customer_id UUID REFERENCES customers(id),
  zalo_name VARCHAR(255) NOT NULL,
  alias_name VARCHAR(255),
  phone VARCHAR(20),
  gender VARCHAR(10),
  avatar_url TEXT,
  pipeline_stage VARCHAR(50) DEFAULT 'NEW',
  lead_score INTEGER DEFAULT 0,
  tags JSONB,
  is_stuck BOOLEAN DEFAULT false,
  priority_updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zalo_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES zalo_accounts(id),
  customer_id UUID REFERENCES zalo_customers(id),
  assigned_to UUID REFERENCES sellers(id), -- Lead Pool routing
  is_group BOOLEAN DEFAULT false,
  unread_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_muted BOOLEAN DEFAULT false,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zalo_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES zalo_conversations(id),
  sender_type VARCHAR(50) CHECK (sender_type IN ('CUSTOMER', 'SELLER', 'SYSTEM', 'BOT')),
  sender_id UUID,
  msg_type VARCHAR(50) DEFAULT 'TEXT', -- TEXT, IMAGE, VIDEO, FILE, STICKER, BANK_CARD
  content TEXT,
  attachments JSONB, -- { type: 'IMAGE', url: 's3_url', original_name: 'file.jpg', size: 1024 }
  reply_to_msg_id UUID REFERENCES zalo_messages(id),
  reactions JSONB,
  status VARCHAR(20) DEFAULT 'SENT', -- SENT, DELIVERED, READ, FAILED
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zalo_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shortcut VARCHAR(50) NOT NULL UNIQUE, -- e.g. /baogia
  content TEXT NOT NULL,
  created_by UUID REFERENCES sellers(id),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zalo_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES zalo_customers(id),
  seller_id UUID REFERENCES sellers(id),
  title VARCHAR(255) NOT NULL,
  appointment_date TIMESTAMP NOT NULL,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'SCHEDULED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zalo_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type VARCHAR(100) NOT NULL,
  performed_by UUID REFERENCES sellers(id),
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
