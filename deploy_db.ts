import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Setup __dirname in ES modules
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
  console.log('=== V-com-ERP Supabase Migration Script ===');
  
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
    ssl: { rejectUnauthorized: false } // Required for Supabase SSL
  });
  
  try {
    await client.connect();
    console.log('Connected successfully!');
    
    const scripts = [
      { name: 'setup_accounting.sql', file: path.join(__dirname, 'scripts', 'setup_accounting.sql') },
      { name: 'setup_tenant_settings.sql', file: path.join(__dirname, 'scripts', 'setup_tenant_settings.sql') },
      { name: 'setup_cross_module_triggers.sql', file: path.join(__dirname, 'scripts', 'setup_cross_module_triggers.sql') }
    ];
    
    for (const script of scripts) {
      console.log(`\nExecuting ${script.name}...`);
      
      let filePath = script.file;
      if (!fs.existsSync(filePath)) {
        // Fallback for root path
        const altPath = path.join(process.cwd(), 'scripts', script.name);
        if (fs.existsSync(altPath)) {
          filePath = altPath;
        } else {
          throw new Error(`File not found: ${filePath}`);
        }
      }
      
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Execute the SQL queries
      await client.query(sql);
      console.log(`Executed ${script.name} successfully!`);
    }
    
    console.log('\n=== All migrations completed successfully! ===');
  } catch (err: any) {
    console.error('\nMigration failed with error:', err.message || err);
  } finally {
    await client.end();
  }
}

run();
