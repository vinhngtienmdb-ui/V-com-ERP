import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  console.log('=== V-com-ERP Supabase Products Table Upgrade ===');
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not found in .env file!');
    process.exit(1);
  }
  
  console.log('Connecting to PostgreSQL Database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('Connected successfully!');
    
    const sql = `
      ALTER TABLE public.products 
      ADD COLUMN IF NOT EXISTS brand TEXT,
      ADD COLUMN IF NOT EXISTS stock INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS cost_price NUMERIC(15, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS hidden_costs NUMERIC(15, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS margin NUMERIC(5, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS profit NUMERIC(15, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS seller_name TEXT,
      ADD COLUMN IF NOT EXISTS weight TEXT,
      ADD COLUMN IF NOT EXISTS dimensions TEXT,
      ADD COLUMN IF NOT EXISTS video_url TEXT,
      ADD COLUMN IF NOT EXISTS images TEXT[],
      ADD COLUMN IF NOT EXISTS specs JSONB;
    `;
    
    console.log('Executing alter table query...');
    await client.query(sql);
    console.log('Table products upgraded successfully!');
  } catch (err: any) {
    console.error('Upgrade failed with error:', err.message || err);
  } finally {
    await client.end();
  }
}

run();
