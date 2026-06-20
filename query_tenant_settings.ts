import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const { supabase } = await import('./src/lib/supabase.js');
  try {
    const { data, error } = await supabase
      .from('tenant_settings')
      .select('*');
    if (error) {
      console.error("Error querying tenant_settings:", error);
    } else {
      console.log("tenant_settings data:", JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error("Fatal error:", e);
  }
}
run();
