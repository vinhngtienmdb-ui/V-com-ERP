import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not found in environment!");
  process.exit(1);
}

const sqlPath = path.join('..', 'create_seller_portal_tables.sql');
if (!fs.existsSync(sqlPath)) {
  console.error("SQL file not found at:", sqlPath);
  process.exit(1);
}

const sqlContent = fs.readFileSync(sqlPath, 'utf8');

async function applySql() {
  console.log("Connecting to Supabase DB via pg client...");
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected successfully. Running SQL script...");
    await client.query(sqlContent);
    console.log("✅ SQL schema applied successfully!");
  } catch (err) {
    console.error("❌ SQL execution failed:", err);
  } finally {
    await client.end();
  }
}

applySql();
