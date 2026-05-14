/**
 * End-to-end test cho luồng marketplace (Sprint 2):
 *   1. Seed 5 seller mix entity types + verify KYC
 *   2. Seed 50 product chia đều 5 seller
 *   3. Tạo 5 đơn → ship (trừ stock + inventory_movements)
 *   4. Mark delivered → tạo transactions income
 *   5. Issue invoice cho 5 đơn → verify số HĐ tuần tự
 *   6. Mô phỏng SePay webhook → verify reconciliation match
 *   7. Trigger monthly tax cron logic → verify seller_tax_reports
 *
 * Cách dùng:
 *   GOOGLE_APPLICATION_CREDENTIALS=secrets/service-account.json \
 *     npx tsx scripts/e2e-marketplace.ts
 *
 * Script idempotent: chạy nhiều lần OK (set + merge thay vì add).
 * Cleanup: tự xóa data có prefix `E2E_` ở đầu mỗi lần chạy.
 */
import admin from 'firebase-admin';
import path from 'node:path';

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(process.cwd(), 'secrets', 'service-account.json');
}
admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

const STAFF_UID = 'm4mPrb0BtPR6v7rTdzZY4OZqrDn2'; // admin@vcomm.vn
const STORE_ID = 'STORE_E2E';

let pass = 0, fail = 0;
function check(label: string, cond: boolean, detail?: string) {
  if (cond) { console.log(`  ✓ ${label}`); pass++; }
  else { console.log(`  ✗ ${label}${detail ? ' — ' + detail : ''}`); fail++; }
}
function section(name: string) { console.log(`\n━━━ ${name} ━━━`); }

async function cleanup() {
  section('0. Cleanup data E2E_ cũ');
  const colls = ['sellers', 'products', 'orders', 'invoices', 'sepay_events', 'reconciliations', 'transactions', 'inventory_movements', 'wallets', 'wallet_transactions'];
  let deleted = 0;
  for (const c of colls) {
    const snap = await db.collection(c).get();
    const batch = db.batch();
    for (const d of snap.docs) {
      if (d.id.startsWith('E2E_')) {
        batch.delete(d.ref);
        deleted++;
      }
    }
    if (deleted > 0) await batch.commit();
  }
  console.log(`  cleaned ${deleted} doc(s) prefix E2E_`);
}

async function seedSellers() {
  section('1. Seed 5 seller + verify KYC');
  const sellers = [
    { id: 'E2E_S1', name: 'Cà phê A (cá nhân)',  entityType: 'individual', taxCode: '012345678901', identityCard: '012345678901', ownerPhone: '0901111111' },
    { id: 'E2E_S2', name: 'Bánh ngọt B (HKD)',   entityType: 'household',  taxCode: '0123456789',   businessLicense: 'GPKD-002', ownerPhone: '0902222222' },
    { id: 'E2E_S3', name: 'Điện tử C (DN)',      entityType: 'company',    taxCode: '0312345678',   businessLicense: 'GPKD-003', ownerPhone: '0903333333' },
    { id: 'E2E_S4', name: 'Thời trang D (cá nhân)', entityType: 'individual', taxCode: '098765432109', identityCard: '098765432109', ownerPhone: '0904444444' },
    { id: 'E2E_S5', name: 'Mỹ phẩm E (HKD)',     entityType: 'household',  taxCode: '0987654321',   businessLicense: 'GPKD-005', ownerPhone: '0905555555' },
  ];
  for (const s of sellers) {
    await db.collection('sellers').doc(s.id).set({
      ...s,
      ownerName: s.name,
      status: 'verified',
      commissionRate: 0.05,
      joinedAt: FieldValue.serverTimestamp(),
      verifiedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    // Tạo wallet
    await db.collection('wallets').doc(`E2E_wallet_${s.id}`).set({
      ownerType: 'seller',
      ownerId: s.id,
      balance: 0,
      pendingBalance: 0,
      currency: 'VND',
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  const snap = await db.collection('sellers').where('status', '==', 'verified').get();
  check('5 seller verified', snap.docs.filter(d => d.id.startsWith('E2E_')).length === 5);
}

async function seedProducts() {
  section('2. Seed 50 product chia đều 5 seller');
  const sellers = ['E2E_S1', 'E2E_S2', 'E2E_S3', 'E2E_S4', 'E2E_S5'];
  const categories = ['Đồ ăn', 'Phụ kiện', 'Điện tử', 'Thời trang', 'Mỹ phẩm'];
  for (let i = 0; i < 50; i++) {
    const sellerIdx = i % 5;
    const productId = `E2E_P${String(i + 1).padStart(3, '0')}`;
    await db.collection('products').doc(productId).set({
      name: `Sản phẩm ${i + 1} - ${categories[sellerIdx]}`,
      sku: `SKU-E2E-${i + 1}`,
      price: 100000 + i * 10000,
      costPrice: 70000 + i * 5000,
      stock: 100,
      category: categories[sellerIdx],
      brand: `Brand-${sellerIdx}`,
      sellerName: sellers[sellerIdx],
      sellerId: sellers[sellerIdx],
      status: 'in_stock',
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  const snap = await db.collection('products').get();
  check('50 product E2E_ seeded', snap.docs.filter(d => d.id.startsWith('E2E_')).length === 50);
}

async function createAndShipOrders() {
  section('3. Tạo 5 đơn + ship');
  const orders = [
    { id: 'E2E_O1', sellerId: 'E2E_S1', productId: 'E2E_P001', qty: 2 },
    { id: 'E2E_O2', sellerId: 'E2E_S2', productId: 'E2E_P002', qty: 1 },
    { id: 'E2E_O3', sellerId: 'E2E_S3', productId: 'E2E_P003', qty: 3 },
    { id: 'E2E_O4', sellerId: 'E2E_S4', productId: 'E2E_P004', qty: 1 },
    { id: 'E2E_O5', sellerId: 'E2E_S5', productId: 'E2E_P005', qty: 2 },
  ];

  for (const o of orders) {
    const prodSnap = await db.collection('products').doc(o.productId).get();
    const prod = prodSnap.data()!;
    await db.collection('orders').doc(o.id).set({
      customerName: `Khách E2E ${o.id}`,
      customerId: `CUST_E2E_${o.id}`,
      sellerId: o.sellerId,
      staffId: STAFF_UID,
      storeId: STORE_ID,
      total: prod.price * o.qty,
      status: 'processing',
      paymentMethod: 'bank_transfer',
      items: [{ productId: o.productId, productName: prod.name, quantity: o.qty, price: prod.price }],
      source: 'e2e',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  // Ship: status → shipped, trừ stock, ghi inventory_movements
  for (const o of orders) {
    await db.runTransaction(async (tx) => {
      const orderRef = db.collection('orders').doc(o.id);
      const orderSnap = await tx.get(orderRef);
      const order = orderSnap.data()!;
      const item = order.items[0];

      tx.update(orderRef, { status: 'shipped', updatedAt: FieldValue.serverTimestamp() });
      tx.update(db.collection('products').doc(item.productId), {
        stock: FieldValue.increment(-item.quantity),
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.set(db.collection('inventory_movements').doc(`E2E_MOV_${o.id}`), {
        productId: item.productId,
        productName: item.productName,
        storeId: STORE_ID,
        type: 'stock_out',
        quantity: -item.quantity,
        reason: 'E2E ship',
        refOrderId: o.id,
        staffId: STAFF_UID,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
  }

  // Verify
  const shipped = await db.collection('orders').where('status', '==', 'shipped').get();
  check('5 đơn shipped', shipped.docs.filter(d => d.id.startsWith('E2E_')).length === 5);

  const prod1 = await db.collection('products').doc('E2E_P001').get();
  check(`P001 stock = 98 (100 - 2)`, prod1.data()?.stock === 98, `actual=${prod1.data()?.stock}`);

  const movs = await db.collection('inventory_movements').get();
  check('5 inventory_movement type stock_out', movs.docs.filter(d => d.id.startsWith('E2E_MOV_')).length === 5);
}

async function deliverOrders() {
  section('4. Mark delivered + tạo transactions income');
  const orders = ['E2E_O1', 'E2E_O2', 'E2E_O3', 'E2E_O4', 'E2E_O5'];
  for (const id of orders) {
    await db.runTransaction(async (tx) => {
      const ref = db.collection('orders').doc(id);
      const snap = await tx.get(ref);
      const order = snap.data()!;
      tx.update(ref, { status: 'delivered', updatedAt: FieldValue.serverTimestamp() });
      tx.set(db.collection('transactions').doc(`${id}_revenue`), {
        description: `Doanh thu đơn #${id} - ${order.customerName}`,
        amount: order.total,
        type: 'income',
        category: 'Sales',
        orderId: id,
        sellerId: order.sellerId,
        staffId: STAFF_UID,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
  }
  const txs = await db.collection('transactions').where('type', '==', 'income').get();
  check('5 transaction income', txs.docs.filter(d => d.id.startsWith('E2E_')).length === 5);
}

async function issueInvoices() {
  section('5. Issue invoice 5 đơn');
  const year = new Date().getFullYear();
  for (let i = 0; i < 5; i++) {
    const orderId = `E2E_O${i + 1}`;
    const orderSnap = await db.collection('orders').doc(orderId).get();
    const order = orderSnap.data()!;
    const item = order.items[0];
    const amount = item.price * item.quantity;
    const vatAmount = Math.round(amount * 0.1);
    const number = String(i + 1).padStart(7, '0');
    await db.collection('invoices').doc(`E2E_INV_${number}`).set({
      invoiceNumber: number,
      serialNumber: `K${String(year).slice(-2)}TVC`,
      templateNumber: '1/001',
      sellerTaxCode: '0123456789',
      sellerName: 'VComm Việt Nam (test)',
      sellerAddress: '123 Lê Lợi, Q.1, TP.HCM',
      buyerName: order.customerName,
      items: [{ ...item, vatRate: 0.1, amount, vatAmount }],
      subtotal: amount,
      vatTotal: vatAmount,
      total: amount + vatAmount,
      paymentMethod: order.paymentMethod,
      status: 'issued',
      issuedAt: FieldValue.serverTimestamp(),
      orderId,
      sellerId: order.sellerId,
    });
  }
  const invs = await db.collection('invoices').get();
  check('5 invoice issued', invs.docs.filter(d => d.id.startsWith('E2E_INV_')).length === 5);
}

async function simulateWebhooks() {
  section('6. Mô phỏng SePay webhook → reconciliation');
  for (let i = 0; i < 5; i++) {
    const orderId = `E2E_O${i + 1}`;
    const orderSnap = await db.collection('orders').doc(orderId).get();
    const order = orderSnap.data()!;
    // Ghi sepay_events trực tiếp (mô phỏng sau khi webhook verified)
    await db.collection('sepay_events').doc(`E2E_EVT_${i + 1}`).set({
      eventId: `E2E_EVT_${i + 1}`,
      payload: {
        reference_number: orderId,
        amount_in: order.total,
        transaction_content: `CK ${orderId}`,
        transaction_date: new Date().toISOString(),
        bank_account_number: '0123456789',
      },
      receivedAt: FieldValue.serverTimestamp(),
      status: 'received',
    });
  }
  // Chờ 10s cho reconcileSepayEvent function chạy
  console.log('  ... chờ reconcileSepayEvent function trigger (10s)');
  await new Promise(r => setTimeout(r, 10000));

  const recs = await db.collection('reconciliations').get();
  const matched = recs.docs.filter(d => {
    const data = d.data();
    return String(data.eventId).startsWith('E2E_') && data.status === 'matched';
  });
  check('5 reconciliation matched', matched.length === 5, `actual=${matched.length}`);

  // Verify orders có paymentVerified=true
  let verifiedCount = 0;
  for (let i = 0; i < 5; i++) {
    const ord = await db.collection('orders').doc(`E2E_O${i + 1}`).get();
    if (ord.data()?.paymentVerified === true) verifiedCount++;
  }
  check('5 order paymentVerified=true', verifiedCount === 5, `actual=${verifiedCount}`);
}

async function monthlyTaxAggregation() {
  section('7. Monthly tax aggregation logic (cho seller individual)');
  // Lấy 1 seller individual (E2E_S1)
  const seller = (await db.collection('sellers').doc('E2E_S1').get()).data()!;
  const ordersSnap = await db.collection('orders')
    .where('sellerId', '==', 'E2E_S1')
    .where('status', 'in', ['delivered', 'completed'])
    .get();
  const totalGmv = ordersSnap.docs.reduce((s, d) => s + (d.data().total ?? 0), 0);
  const estimatedTax = Math.round(totalGmv * 0.015);

  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  await db.collection('seller_tax_reports').doc(`E2E_S1_${period}`).set({
    sellerId: 'E2E_S1',
    sellerTaxCode: seller.taxCode,
    sellerName: seller.name,
    period,
    totalGmv,
    totalOrders: ordersSnap.size,
    totalReturns: 0,
    netRevenue: totalGmv,
    estimatedTaxAmount: estimatedTax,
    submittedToTaxAuthority: false,
    generatedAt: FieldValue.serverTimestamp(),
  });
  check(`seller_tax_reports cho E2E_S1 period ${period}`, totalGmv > 0 && estimatedTax > 0,
    `gmv=${totalGmv}, tax=${estimatedTax}`);
}

async function main() {
  console.log('🧪 VComm ERP — End-to-end Marketplace test\n');
  await cleanup();
  await seedSellers();
  await seedProducts();
  await createAndShipOrders();
  await deliverOrders();
  await issueInvoices();
  await simulateWebhooks();
  await monthlyTaxAggregation();

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✓ ${pass} PASS    ✗ ${fail} FAIL`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
