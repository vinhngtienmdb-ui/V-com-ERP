import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

async function run() {
  console.log('=== VComm Supabase Unified Tables Migration Script ===');
  
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
    
    const filePath = path.join(__dirname, 'scripts', 'setup_unified_tables.sql');
    console.log(`\nExecuting setup_unified_tables.sql...`);
    
    const sql = fs.readFileSync(filePath, 'utf8');
    await client.query(sql);
    console.log(`Executed setup_unified_tables.sql successfully!`);
    console.log('\n=== Migration completed successfully! ===');
  } catch (err: any) {
    console.error('\nMigration failed with error:', err.message || err);
  } finally {
    await client.end();
  }
}

run();
