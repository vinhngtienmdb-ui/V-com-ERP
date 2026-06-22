const dns = require('dns');
const { Client } = require('pg');

dns.resolve4('aws-0-ap-southeast-1.pooler.supabase.com', (err, addresses) => {
  if (err) {
    console.error('DNS error:', err);
    return;
  }
  const ip = addresses[0];
  console.log('Resolved to:', ip);

  const databaseUrl = `postgresql://postgres.wivioicznwyhmpbeqoib:Qazwsxedc123@${ip}:6543/postgres`;
  console.log('Connecting to:', databaseUrl);

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  client.connect()
    .then(() => {
      console.log('Connected!');
      return client.query(`
        ALTER TABLE public.orders 
        ADD COLUMN IF NOT EXISTS misa_synced BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS misa_voucher_id TEXT,
        ADD COLUMN IF NOT EXISTS misa_synced_at TEXT,
        ADD COLUMN IF NOT EXISTS misa_sync_error TEXT;

        ALTER TABLE public.customers
        ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0,
        ADD COLUMN IF NOT EXISTS v_xu NUMERIC DEFAULT 0,
        ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'Thành viên mới',
        ADD COLUMN IF NOT EXISTS misa_synced BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS misa_voucher_id TEXT,
        ADD COLUMN IF NOT EXISTS misa_synced_at TEXT,
        ADD COLUMN IF NOT EXISTS misa_sync_error TEXT;
      `);
    })
    .then(() => {
      console.log('Added columns successfully!');
      return client.end();
    })
    .catch(e => {
      console.error('DB Error:', e);
      client.end();
    });
});
