import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

async function test() {
  console.log('Testing connection to Supabase...');
  console.log('URL:', process.env.VITE_SUPABASE_URL);
  
  const { supabase } = await import('./src/lib/supabase');
  
  try {
    const { data, error } = await supabase
      .from('pos_products')
      .select('*')
      .limit(5);
      
    if (error) {
      console.error('Connection failed with error:', error);
    } else {
      console.log('Connection successful!');
      console.log('First 5 products:', JSON.stringify(data, null, 2));
    }
  } catch (e: any) {
    console.error('Fatal connection error:', e.message || e);
  }
}

test();
