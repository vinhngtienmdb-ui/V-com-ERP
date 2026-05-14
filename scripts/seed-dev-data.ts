/**
 * Seed dữ liệu mẫu cho môi trường mới (vcomm-erp-prod hoặc sandbox).
 * Chạy 1 lần sau khi tạo Firestore, để có UI demo + test luồng nghiệp vụ.
 *
 * Cách dùng:
 *   GOOGLE_APPLICATION_CREDENTIALS=secrets/service-account.json npx tsx scripts/seed-dev-data.ts
 */
import admin from 'firebase-admin';
import path from 'path';

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(process.cwd(), 'secrets', 'service-account.json');
}
admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const STORE_ID = 'STORE_HCM_Q1';
const STAFF_UID = 'm4mPrb0BtPR6v7rTdzZY4OZqrDn2'; // admin@vcomm.vn

async function seed() {
  console.log('🌱 Seeding vcomm-erp-prod...');

  // 1 store
  await db.collection('stores').doc(STORE_ID).set({
    name: 'Chi nhánh Quận 1 (HCM)',
    address: '123 Lê Lợi, Q.1, TP.HCM',
    domain: 'sg1.vcomm.vn',
    companyId: 'COMP_VCOMM',
    companyName: 'VComm Việt Nam',
    createdAt: FieldValue.serverTimestamp(),
  });

  // 3 products
  const products = [
    { id: 'PROD_KEYBOARD', name: 'Bàn phím cơ Keychron K2', sku: 'KEY-K2-RGB', price: 2500000, costPrice: 1800000, stock: 25, category: 'Phụ kiện', status: 'in_stock' },
    { id: 'PROD_MOUSE',    name: 'Chuột không dây Logitech MX', sku: 'LOG-MX-MASTER3', price: 1200000, costPrice: 850000, stock: 40, category: 'Phụ kiện', status: 'in_stock' },
    { id: 'PROD_HEADSET',  name: 'Tai nghe Sony WH-1000XM5', sku: 'SONY-WH1000XM5', price: 8500000, costPrice: 6200000, stock: 8, category: 'Âm thanh', status: 'low_stock' },
  ];
  for (const p of products) {
    const { id, ...data } = p;
    await db.collection('products').doc(id).set({ ...data, updatedAt: FieldValue.serverTimestamp() });
  }

  // 2 customers
  await db.collection('customers').doc('CUST_NVA').set({
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    email: 'a@example.com',
    totalSpent: 5000000,
    orderCount: 3,
    status: 'active',
    channels: ['web', 'zalo'],
    points: 250,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await db.collection('customers').doc('CUST_TTB').set({
    name: 'Trần Thị B',
    phone: '0912345678',
    email: 'b@example.com',
    totalSpent: 1200000,
    orderCount: 1,
    status: 'active',
    channels: ['facebook'],
    points: 60,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // 2 orders — 1 processing để test shipOrder, 1 delivered để test report
  await db.collection('orders').doc('ORD_2026_001').set({
    customerName: 'Nguyễn Văn A',
    customerId: 'CUST_NVA',
    staffId: STAFF_UID,
    storeId: STORE_ID,
    total: 3700000,
    status: 'processing',
    paymentMethod: 'cod',
    items: [
      { productId: 'PROD_KEYBOARD', productName: 'Bàn phím cơ Keychron K2', quantity: 1, price: 2500000 },
      { productId: 'PROD_MOUSE', productName: 'Chuột không dây Logitech MX', quantity: 1, price: 1200000 },
    ],
    source: 'erp',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await db.collection('orders').doc('ORD_2026_002').set({
    customerName: 'Trần Thị B',
    customerId: 'CUST_TTB',
    staffId: STAFF_UID,
    storeId: STORE_ID,
    total: 1200000,
    status: 'delivered',
    paymentMethod: 'e_wallet',
    items: [
      { productId: 'PROD_MOUSE', productName: 'Chuột không dây Logitech MX', quantity: 1, price: 1200000 },
    ],
    source: 'erp',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Bootstrap staff doc cho admin
  await db.collection('staff').doc(STAFF_UID).set({
    uid: STAFF_UID,
    email: 'admin@vcomm.vn',
    name: 'Admin VComm',
    role: 'admin',
    storeIds: [STORE_ID],
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  console.log('✓ Seeded: 1 store, 2 customers, 3 products, 2 orders, 1 staff');
  console.log('  → Bây giờ login admin@vcomm.vn vào http://localhost:3000 sẽ thấy dữ liệu thật.');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
