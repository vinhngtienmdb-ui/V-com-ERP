import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
dotenv.config();

async function run() {
  const { supabase } = await import('./src/lib/supabase');
  const productsFile = path.join(process.cwd(), 'erp_products.json');
  const nextHubFile = path.join(process.cwd(), '..', 'vcomm-nexthub', 'src', 'data', 'extracted_products.json');

  if (!fs.existsSync(productsFile)) {
    console.error('erp_products.json not found!');
    return;
  }

  const erpProducts = JSON.parse(fs.readFileSync(productsFile, 'utf-8'));
  let nextHubProducts: any[] = [];
  if (fs.existsSync(nextHubFile)) {
    nextHubProducts = JSON.parse(fs.readFileSync(nextHubFile, 'utf-8')).products || [];
  }

  console.log(`Seeding ${erpProducts.length} products to Supabase with UI Metadata...`);

  for (const p of erpProducts) {
    // Try to find matching product in nextHub to get metadata
    const hubMatch = nextHubProducts.find(h => h.title === p.name);
    
    const uiMetadata = {
      old_price: hubMatch ? hubMatch.old_price : '',
      discount: hubMatch ? hubMatch.discount : '',
      image: hubMatch ? hubMatch.image : ''
    };

    const payload = {
      id: p.id,
      tenant_id: 'tenant-vcomm-prod-01',
      name: p.name,
      description: JSON.stringify(uiMetadata), // store UI metadata as JSON in description
      price: p.price,
      sku: p.sku,
      category: p.category,
      image_url: uiMetadata.image || `https://cdn.hstatic.net/products/200001108779/no_image.jpg`,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('products')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error(`Failed to upsert product ${p.id}:`, error);
    } else {
      console.log(`Successfully upserted product: ${p.id}`);
    }

    // Seed warehouse stock
    const stockPayload = {
      id: `ws-${p.id}`,
      tenant_id: 'tenant-vcomm-prod-01',
      store_id: 'STORE_001',
      product_id: p.id,
      product_name: p.name,
      quantity: p.stock || 100,
      safety_stock: 10,
      updated_at: new Date().toISOString()
    };

    const { error: wsError } = await supabase
      .from('warehouse_stock')
      .upsert(stockPayload, { onConflict: 'id' });

    if (wsError) {
      console.error(`Failed to upsert warehouse_stock for product ${p.id}:`, wsError);
    }
  }

  console.log('Seeding finished!');
}

run();
