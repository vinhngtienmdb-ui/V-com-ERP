import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

async function run() {
  console.log('=== VComm ERP Phase 3 DDL Deployment ===');
  
  let connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.log('No DATABASE_URL found in .env.');
    const dbUrl = "db.wivioicznwyhmpbeqoib.supabase.co";
    console.log(`Supabase Project Database Host: ${dbUrl}`);
    
    const password = await askQuestion('Please enter your Supabase Database Password: ');
    if (!password) {
      console.error('Password cannot be empty.');
      process.exit(1);
    }
    
    connectionString = `postgresql://postgres:${encodeURIComponent(password)}@${dbUrl}:5432/postgres`;
  }
  
  rl.close();
  
  console.log('\nConnecting to PostgreSQL Database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected successfully!');

    const sqlPath = 'C:\\Users\\vinhn\\.gemini\\antigravity\\brain\\1b6b94e2-e93f-446e-a263-b71a47b3375d\\scratch\\setup_phase3_rbac.sql';
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`SQL file not found at ${sqlPath}`);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Executing setup_phase3_rbac.sql...');
    await client.query(sql);
    console.log('Executed setup_phase3_rbac.sql successfully!');
    console.log('\n=== Migration completed successfully! ===');
  } catch (err: any) {
    console.error('Deployment failed:', err.message || err);
  } finally {
    await client.end();
  }
}

run();
