import dotenv from 'dotenv';
dotenv.config();
import { supabase } from './src/lib/supabase';

async function run() {
  const { data: accountsData, error: accountsError } = await supabase.from('accounts').select('*');
  if (accountsError) {
    console.error('Table accounts check failed:', accountsError.message || accountsError);
  } else {
    console.log('Table accounts exists! Rows:', accountsData?.length);
  }

  const { data: jeData, error: jeError } = await supabase.from('journal_entries').select('*');
  if (jeError) {
    console.error('Table journal_entries check failed:', jeError.message || jeError);
  } else {
    console.log('Table journal_entries exists! Rows:', jeData?.length);
  }
}
run();
