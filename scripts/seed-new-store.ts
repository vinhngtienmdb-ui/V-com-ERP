/**
 * Seed demo data cho 1 store mới — onboarding flow.
 *
 * Cách dùng:
 *   GOOGLE_APPLICATION_CREDENTIALS=secrets/service-account.json \
 *     npx tsx scripts/seed-new-store.ts --storeId STORE_NEW_01 \
 *                                       --storeName "Chi nhánh Cầu Giấy" \
 *                                       --industry "Cafe, trà sữa"
 *
 * Tạo:
 *   - 1 store doc
 *   - 5 sản phẩm mẫu cho industry (F&B / Retail / Beauty)
 *   - 1 loyalty program default (nếu chưa có)
 *   - 3 office assets mẫu (Bàn A1, B1, B2)
 *   - In ra summary + link Firebase Console
 */
import admin from 'firebase-admin';
import path from 'node:path';

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(process.cwd(), 'secrets', 'service-account.json');
}
admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();
const FV = admin.firestore.FieldValue;

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.substring(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { out[key] = next; i++; }
      else out[key] = 'true';
    }
  }
  return out;
}

const PRODUCT_TEMPLATES: Record<string, any[]> = {
  fnb: [
    { name: 'Cafe Phin Sữa Đá', price: 25000, costPrice: 8000, category: 'Cà phê' },
    { name: 'Trà Đào Cam Sả', price: 45000, costPrice: 15000, category: 'Trà' },
    { name: 'Bạc xỉu nóng', price: 30000, costPrice: 10000, category: 'Cà phê' },
    { name: 'Sinh tố bơ', price: 50000, costPrice: 18000, category: 'Sinh tố' },
    { name: 'Bánh mì pate', price: 20000, costPrice: 7000, category: 'Đồ ăn' },
  ],
  retail: [
    { name: 'Áo polo nam basic', price: 350000, costPrice: 180000, category: 'Thời trang nam' },
    { name: 'Quần jean nữ skinny', price: 450000, costPrice: 220000, category: 'Thời trang nữ' },
    { name: 'Túi xách tote canvas', price: 280000, costPrice: 120000, category: 'Phụ kiện' },
    { name: 'Giày sneaker trắng', price: 850000, costPrice: 400000, category: 'Giày dép' },
    { name: 'Mũ lưỡi trai', price: 150000, costPrice: 50000, category: 'Phụ kiện' },
  ],
  beauty: [
    { name: 'Massage thư giãn 60p', price: 350000, costPrice: 100000, category: 'Massage' },
    { name: 'Chăm sóc da mặt 90p', price: 450000, costPrice: 150000, category: 'Skincare' },
    { name: 'Cắt tóc nữ', price: 200000, costPrice: 50000, category: 'Tóc' },
    { name: 'Sơn móng gel', price: 250000, costPrice: 80000, category: 'Nails' },
    { name: 'Tẩy tế bào chết toàn thân', price: 500000, costPrice: 180000, category: 'Body' },
  ],
};

function industryToCategory(industry: string): 'fnb' | 'retail' | 'beauty' {
  const lo = industry.toLowerCase();
  if (lo.includes('cafe') || lo.includes('trà') || lo.includes('quán ăn') || lo.includes('nhà hàng') || lo.includes('f&b')) return 'fnb';
  if (lo.includes('beauty') || lo.includes('spa') || lo.includes('massage') || lo.includes('salon') || lo.includes('nail')) return 'beauty';
  return 'retail';
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const storeId = args.storeId ?? `STORE_${Date.now()}`;
  const storeName = args.storeName ?? 'Store mới';
  const industry = args.industry ?? 'Cafe, trà sữa';
  const category = industryToCategory(industry);

  console.log(`🌱 Seed store ${storeId} (${storeName} — ${industry})\n`);

  // 1. Store doc
  await db.collection('stores').doc(storeId).set({
    name: storeName,
    address: args.address ?? 'Chưa cập nhật',
    industry,
    domain: `${storeId.toLowerCase()}.vcomm.vn`,
    companyId: args.companyId ?? 'COMP_VCOMM',
    companyName: args.companyName ?? 'VComm Việt Nam',
    createdAt: FV.serverTimestamp(),
  }, { merge: true });
  console.log(`  ✓ Store ${storeId} created`);

  // 2. Products
  const templates = PRODUCT_TEMPLATES[category];
  for (let i = 0; i < templates.length; i++) {
    const t = templates[i];
    const productId = `${storeId}_PROD_${String(i + 1).padStart(3, '0')}`;
    await db.collection('products').doc(productId).set({
      ...t,
      sku: `SKU-${storeId}-${i + 1}`,
      stock: 50,
      status: 'in_stock',
      storeId,
      sellerId: storeId,
      sellerName: storeName,
      updatedAt: FV.serverTimestamp(),
    });
  }
  console.log(`  ✓ ${templates.length} products seeded (${category})`);

  // 3. Loyalty program default (idempotent — chỉ tạo nếu chưa có)
  const programDoc = await db.collection('loyalty_programs').doc('default').get();
  if (!programDoc.exists) {
    await db.collection('loyalty_programs').doc('default').set({
      name: 'Chương trình thành viên VComm',
      enabled: true,
      vndPerPoint: 1000,
      pointValueVnd: 100,
      tiers: [
        { name: 'Bronze', minTotalSpent: 0, multiplier: 1, perks: [] },
        { name: 'Silver', minTotalSpent: 5_000_000, multiplier: 1.5, perks: ['Voucher 10% sinh nhật'] },
        { name: 'Gold', minTotalSpent: 20_000_000, multiplier: 2, perks: ['Voucher 15% sinh nhật', 'Ưu tiên CSKH'] },
        { name: 'Platinum', minTotalSpent: 100_000_000, multiplier: 3, perks: ['Voucher 20% sinh nhật', 'Manager đặt riêng'] },
      ],
      updatedAt: FV.serverTimestamp(),
    });
    console.log('  ✓ Loyalty program default created');
  } else {
    console.log('  ⏭  Loyalty program default đã tồn tại — skip');
  }

  // 4. Office assets mẫu
  const assets = category === 'fnb'
    ? [{ name: 'Bàn A1 (2 chỗ)', type: 'desk', capacity: 2 }, { name: 'Bàn B1 (4 chỗ)', type: 'desk', capacity: 4 }, { name: 'Bàn B2 (4 chỗ)', type: 'desk', capacity: 4 }]
    : category === 'beauty'
    ? [{ name: 'Phòng VIP 1', type: 'room', capacity: 1 }, { name: 'Phòng VIP 2', type: 'room', capacity: 1 }, { name: 'Phòng đôi 1', type: 'room', capacity: 2 }]
    : [{ name: 'Phòng thử đồ 1', type: 'room', capacity: 1 }, { name: 'Phòng thử đồ 2', type: 'room', capacity: 1 }, { name: 'Khu vực thanh toán', type: 'equipment', capacity: 1 }];

  for (let i = 0; i < assets.length; i++) {
    const a = assets[i];
    await db.collection('office_assets').doc(`${storeId}_ASSET_${i + 1}`).set({
      ...a,
      location: storeName,
      status: 'available',
      bookable: true,
      createdAt: FV.serverTimestamp(),
    });
  }
  console.log(`  ✓ ${assets.length} office assets seeded`);

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Store ${storeId} đã sẵn sàng.`);
  console.log(`Console: https://console.firebase.google.com/project/vcomm-erp-prod/firestore/data/~2Fstores~2F${storeId}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
