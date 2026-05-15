/**
 * E2E Loyalty + Affiliate combined flow:
 *   1. Setup: 1 active affiliate (commission 10%), 1 loyalty program enabled
 *      vndPerPoint=1000 + Silver tier (5M+ multiplier 1.5x), 1 customer Bronze
 *   2. Order 6M VND với refCode → delivered
 *   3. Đợi 2 trigger chạy (onOrderDelivered_payAffiliate +
 *      onOrderDelivered_creditLoyaltyPoints)
 *   4. Verify:
 *      - affiliate wallet +600k (10% × 6M)
 *      - customer points +9000 (6M / 1k = 6000 × 1.5 Silver)
 *      - customer.totalSpent = 6M (qualify Silver)
 *      - order.commissionPaid + loyaltyPointsCredited = true
 *      - point_transactions có entry
 *      - /transactions có commission entry
 */
import admin from 'firebase-admin';
import path from 'node:path';

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(process.cwd(), 'secrets', 'service-account.json');
}
admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();
const FV = admin.firestore.FieldValue;

let pass = 0, fail = 0;
function check(label: string, cond: boolean, detail?: string) {
  if (cond) { console.log(`  ✓ ${label}`); pass++; }
  else { console.log(`  ✗ ${label}${detail ? ' — ' + detail : ''}`); fail++; }
}

const AFL = 'E2E_LA_AFL';
const CUST = 'E2E_LA_CUST';
const O = 'E2E_LA_O1';
const REF = 'E2ELA1';

async function cleanup() {
  for (const c of ['affiliates', 'customers', 'loyalty_programs', 'orders', 'wallets', 'wallet_transactions', 'point_transactions', 'transactions']) {
    const s = await db.collection(c).get();
    const b = db.batch();
    s.docs.forEach(d => {
      const id = d.id;
      if (id.startsWith('E2E_LA') || id.includes(AFL) || id.includes(CUST) || id === 'default' ||
          id.includes(REF) || id.startsWith(`affiliate_${AFL}`)) {
        b.delete(d.ref);
      }
    });
    await b.commit().catch(() => {});
  }
}

async function main() {
  console.log('🧪 E2E Loyalty + Affiliate flow\n');
  await cleanup();

  await db.collection('affiliates').doc(AFL).set({
    name: 'KOL E2E Loyalty-Affiliate test', type: 'kol', status: 'active',
    commissionRate: 0.10, refCode: REF, joinedAt: FV.serverTimestamp(),
  });
  await db.collection('customers').doc(CUST).set({
    name: 'Khách E2E LA', phone: '0911223344', points: 0, totalSpent: 0, orderCount: 0,
  });
  await db.collection('loyalty_programs').doc('default').set({
    name: 'Default Program', enabled: true, vndPerPoint: 1000, pointValueVnd: 100,
    tiers: [
      { name: 'Bronze', minTotalSpent: 0, multiplier: 1 },
      { name: 'Silver', minTotalSpent: 5000000, multiplier: 1.5 },
      { name: 'Gold', minTotalSpent: 20000000, multiplier: 2 },
    ],
  });
  console.log('  setup done\n');

  // Tạo order processing rồi update sang delivered (trigger fire)
  console.log('  Creating order 6M VND with refCode...');
  await db.collection('orders').doc(O).set({
    customerName: 'Khách E2E LA', customerId: CUST, refCode: REF,
    sellerId: 'TEST_SELLER', staffId: 'test', storeId: 'TEST',
    total: 6000000, status: 'processing', paymentMethod: 'bank_transfer',
    items: [{ productId: 'X', productName: 'Test', quantity: 1, price: 6000000 }],
    createdAt: FV.serverTimestamp(),
  });
  await db.collection('orders').doc(O).update({ status: 'delivered' });
  console.log('  Order delivered. Waiting 15s for triggers...\n');
  await new Promise(r => setTimeout(r, 15000));

  // Verify
  const order = await db.collection('orders').doc(O).get();
  const customer = await db.collection('customers').doc(CUST).get();
  const wallet = await db.collection('wallets').doc(`affiliate_${AFL}`).get();

  check('order.commissionPaid = true', order.data()?.commissionPaid === true);
  check('order.commissionAmount = 600000 (10%)', order.data()?.commissionAmount === 600000,
    `actual=${order.data()?.commissionAmount}`);
  check('order.loyaltyPointsCredited = true', order.data()?.loyaltyPointsCredited === true);
  check('order.loyaltyPointsAmount = 9000 (6M / 1k × 1.5 Silver)',
    order.data()?.loyaltyPointsAmount === 9000,
    `actual=${order.data()?.loyaltyPointsAmount}`);

  check('Customer points = 9000', customer.data()?.points === 9000,
    `actual=${customer.data()?.points}`);
  check('Customer totalSpent = 6000000', customer.data()?.totalSpent === 6000000,
    `actual=${customer.data()?.totalSpent}`);

  check(`Affiliate wallet balance = 600000`,
    wallet.exists && wallet.data()?.balance === 600000,
    `actual=${wallet.data()?.balance}`);

  // Verify point_transactions có entry
  const ptx = await db.collection('point_transactions').where('customerId', '==', CUST).get();
  check('1 point_transaction entry với type=earn_order', ptx.size === 1 && ptx.docs[0].data().type === 'earn_order');

  // Verify /transactions có commission entry
  const txs = await db.collection('transactions').where('orderId', '==', O).get();
  const hasCommission = txs.docs.some(d => d.data().type === 'commission');
  check('/transactions có entry type=commission cho order', hasCommission);

  await cleanup();
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✓ ${pass} PASS    ✗ ${fail} FAIL`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  process.exit(fail > 0 ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
