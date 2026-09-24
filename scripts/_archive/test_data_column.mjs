import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wivioicznwyhmpbeqoib.supabase.co';
const supabaseAnonKey = 'sb_publishable_BDs07J3DlUgYfFz6X-8qFw_JKf7zJsa';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDataColumn() {
  const { data, error } = await supabase
    .from('customers')
    .update({ wallet_balance: 100 })
    .eq('id', 'f623a169-f4a5-4c4b-a877-0db1f8dbc039');
  
  console.log("Update wallet_balance:", error || "Success");

  const { data: d2, error: e2 } = await supabase
    .from('customers')
    .update({ data: { wallet_balance: 100 } })
    .eq('id', 'f623a169-f4a5-4c4b-a877-0db1f8dbc039');
    
  console.log("Update data jsonb:", e2 || "Success");
}

testDataColumn();
