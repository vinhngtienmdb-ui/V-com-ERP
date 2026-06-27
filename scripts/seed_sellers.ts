import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env vars
dotenv.config({ path: resolve(process.cwd(), '.env') });
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xofmksgqqungiqzttmll.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const MOCK_SELLERS = [
  {
    id: 'SEL-001',
    owner_id: 'system',
    name: 'Mobile World',
    email: 'contact@mobileworld.com',
    phone: '0987654321',
    total_products: 1250,
    rating: 4.8,
    gmv: 4500000000,
    status: 'active',
    tax_code: '0101234567',
    identity_card: '001090123456',
    address: '123 Nguyen Trai, Q1, HCMC',
    representative: 'Nguyen Van A',
    commission_rate: 5,
    onboarding_step: 'completed',
    partner_type: 'dealer',
    active_modules: ['ipos', 'pim', 'scm', 'hr'],
    wallet_balance: 15000000,
    business_license_url: 'https://example.com/license1.jpg'
  },
  {
    id: 'SEL-002',
    owner_id: 'system',
    name: 'Fashion Hub',
    email: 'fashionhub@vn.net',
    phone: '0912345678',
    total_products: 850,
    rating: 4.6,
    gmv: 2800000000,
    status: 'active',
    tax_code: '0309876543',
    identity_card: '079090987654',
    address: '456 Le Loi, Q1, HCMC',
    representative: 'Tran Thi B',
    commission_rate: 8,
    onboarding_step: 'completed',
    partner_type: 'seller',
    active_modules: ['orders', 'pim', 'marketing', 'flashsale', 'affiliate'],
    wallet_balance: 5000000
  },
  {
    id: 'SEL-003',
    owner_id: 'system',
    name: 'Eco Mart',
    email: 'eco@mart.vn',
    phone: '0900112233',
    total_products: 120,
    rating: 0,
    gmv: 0,
    status: 'pending',
    tax_code: '0401122334',
    identity_card: '012345678901',
    address: '789 Dien Bien Phu, Q3, HCMC',
    representative: 'Le Van C',
    commission_rate: 10,
    onboarding_step: 'verification',
    partner_type: 'seller',
    active_modules: [],
    wallet_balance: 0
  }
];

async function seedSellers() {
  console.log("Seeding sellers data...");
  for (const seller of MOCK_SELLERS) {
    const { error } = await supabase.from('sellers').upsert(seller, { onConflict: 'id' });
    if (error) {
      console.error(`Error inserting ${seller.id}:`, error.message);
    } else {
      console.log(`Successfully seeded ${seller.id}`);
    }
  }
  console.log("Seeding complete.");
}

seedSellers().catch(console.error);
