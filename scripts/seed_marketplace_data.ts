/**
 * Seed dữ liệu vận hành thật cho sàn: seller demo + KYC approved + sản phẩm mẫu.
 * Chạy 1 lần: npx tsx scripts/seed_marketplace_data.ts
 *
 * Seller demo có KYC ĐÃ DUYỆT + hợp đồng khung đã ký → publish sản phẩm hợp lệ
 * (NĐ 52 gate). Dùng để test chuỗi: escrow → delivered → settlement end-to-end.
 */
import 'dotenv/config';

async function main() {
  const { Client } = await import('pg');
  const pg = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await pg.connect();
  const T = 'tenant-vcomm-prod-01';

  console.log('=== Seed marketplace: seller + KYC + sản phẩm mẫu ===\n');

  // 1. Seller demo
  const sellerId = 'SEL-DEMO-001';
  await pg.query(
    `INSERT INTO public.sellers (id, tenant_id, name, email, phone, total_products, rating, gmv,
                                  wallet_balance, status, tax_code, identity_card, address,
                                  representative, commission_rate, join_date, onboarding_step,
                                  partner_type, active_modules)
     VALUES ($1, $2, 'Gian hàng Demo VComm', 'seller.demo@vcomm.vn', '0901234567',
             2, 5.0, 0, 0, 'active', '0109876543', '001203001234',
             '123 Đường Lê Lợi, Q.1, TP.HCM', 'Trần Demo', 5, now(), 'completed',
             'seller', '["orders","marketing"]'::jsonb)
     ON CONFLICT (id) DO UPDATE SET status = 'active', onboarding_step = 'completed'`,
    [sellerId, T]
  );
  console.log('✓ Seller demo:', sellerId);

  // 2. KYC approved + hợp đồng khung ký (NĐ 52 Điều 17)
  await pg.query(
    `INSERT INTO public.seller_kyc (tenant_id, seller_id, status, tax_code, identity_card,
                                    business_license_url, contract_signed_at, submitted_at,
                                    reviewed_at, reviewed_by)
     VALUES ($1, $2, 'approved', '0109876543', '001203001234',
             'https://example.com/gpkd-demo.pdf', now(), now(), now(), NULL)
     ON CONFLICT (seller_id) DO UPDATE SET status = 'approved', contract_signed_at = now()`,
    [T, sellerId]
  );
  console.log('✓ KYC approved + hợp đồng khung đã ký');

  // 3. Sản phẩm mẫu (published hợp lệ — seller đã KYC)
  const products = [
    ['PRD-DEMO-001', 'Bình giữ nhiệt VComm 500ml', 'VCM-BGH-500', 'Gia dụng', 250000, 100, 150000],
    ['PRD-DEMO-002', 'Balo laptop VComm chống sốc', 'VCM-BLO-15', 'Phụ kiện', 450000, 50, 280000]
  ];
  for (const [id, name, sku, category, price, stock, cost] of products) {
    await pg.query(
      `INSERT INTO public.products (id, tenant_id, name, description, price, sku, category,
                                    image_url, status, seller_id, stock, cost_price, brand, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'published', $9, $10, $11, 'VComm', now())
       ON CONFLICT (id) DO UPDATE SET status = 'published', seller_id = $9`,
      [id, T, name, `Sản phẩm demo chính hãng ${name}`, price, sku, category,
       'https://picsum.photos/seed/' + id + '/400/400', sellerId, stock, cost]
    );
  }
  console.log('✓ 2 sản phẩm published');

  // 4. Tồn kho ở kho chính
  for (const [id, , sku, , , stock] of products) {
    await pg.query(
      `INSERT INTO public.warehouse_stock (id, tenant_id, warehouse_id, product_id, product_name, quantity, safety_stock)
       VALUES ($1, $2, 'WH-MAIN-01', $3, $4, $5, 10)
       ON CONFLICT (id) DO UPDATE SET quantity = $5`,
      ['ws-' + id, T, id, sku, stock]
    );
  }
  console.log('✓ Tồn kho WH-MAIN-01');

  const check = await pg.query(
    `SELECT (SELECT count(*) FROM public.sellers) AS sellers,
            (SELECT count(*) FROM public.seller_kyc WHERE status='approved') AS kyc_approved,
            (SELECT count(*) FROM public.products WHERE status='published') AS published`
  );
  console.log('\nTổng kết:', JSON.stringify(check.rows[0]));
  await pg.end();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
