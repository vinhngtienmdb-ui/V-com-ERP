import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

import { supabase } from './src/lib/supabase';

async function test() {
  console.log('Testing connection to Supabase...');
  console.log('URL:', process.env.VITE_SUPABASE_URL);
  
  try {
    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.error('Connection failed with error:', error);
    } else {
      console.log('Connection successful! Table "products" exists.');
      console.log('Total products in database:', count);
    }
  } catch (e: any) {
    console.error('Fatal connection error:', e.message || e);
  }
}

test();
