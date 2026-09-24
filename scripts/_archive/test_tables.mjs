import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wivioicznwyhmpbeqoib.supabase.co';
const supabaseAnonKey = 'sb_publishable_BDs07J3DlUgYfFz6X-8qFw_JKf7zJsa';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listTables() {
  // We can fetch table names by querying the information_schema, but we don't have SQL access.
  // We can try a few known non-relational tables to see if they exist without error.
  const tablesToTest = ['settings', 'tenant_settings', 'order_metadata', 'misa_status', 'users', 'finance_transactions', 'journal_entries'];
  
  for (const t of tablesToTest) {
    const { error } = await supabase.from(t).select('id').limit(1);
    console.log(`Table ${t}: ${error ? error.message : 'EXISTS'}`);
  }
}

listTables();
