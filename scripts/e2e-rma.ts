/**
 * E2E RMA flow:
 *   1. Create product (stock 10) + order delivered (qty 3)
 *   2. Customer request return (status → returning)
 *   3. Manager approve via processReturn-style atomic transaction
 *   4. Verify: order.status=returned, product.stock=13 (back), refund tx created,
 *      inventory_movement type='return' created
 *   5. Cleanup
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
const STAFF = 'm4mPrb0BtPR6v7rTdzZY4OZqrDn2';
const P = 'E2E_RMA_P1';
const O = 'E2E_RMA_O1';

async function cleanup() {
  for (const c of ['products', 'orders', 'transactions', 'inventory_movements']) {
    const s = await db.collection(c).get();
    const b = db.batch();
    s.docs.forEach(d => { if (d.id.startsWith('E2E_RMA')) b.delete(d.ref); });
    await b.commit().catch(() => {});
  }
}

async function main() {
  console.log('🧪 E2E RMA flow');
  await cleanup();

  // Setup
  await db.collection('products').doc(P).set({
    name: 'RMA test product', price: 200000, costPrice: 100000, stock: 10, status: 'in_stock',
    updatedAt: FV.serverTimestamp(),
  });
  await db.collection('orders').doc(O).set({
    customerName: 'Khách RMA', customerId: 'CUST_RMA', total: 600000,
    status: 'delivered', paymentMethod: 'bank_transfer', staffId: STAFF, storeId: 'TEST',
    items: [{ productId: P, productName: 'RMA test product', quantity: 3, price: 200000 }],
    createdAt: FV.serverTimestamp(), updatedAt: FV.serverTimestamp(),
  });
  console.log('  setup done');

  // Step: customer request return
  await db.collection('orders').doc(O).update({ status: 'returning', updatedAt: FV.serverTimestamp() });
  const r1 = await db.collection('orders').doc(O).get();
  check('Order status → returning', r1.data()?.status === 'returning');

  // Step: manager approve (atomic)
  await db.runTransaction(async (tx) => {
    const orderRef = db.collection('orders').doc(O);
    const prodRef = db.collection('products').doc(P);
    const order = (await tx.get(orderRef)).data()!;
    await tx.get(prodRef);
    const item = order.items[0];
    tx.update(orderRef, { status: 'returned', returnApprovedAt: FV.serverTimestamp() });
    tx.set(db.collection('transactions').doc(`${O}_refund`), {
      description: `Hoàn tiền đơn ${O}`, amount: -order.total, type: 'refund',
      orderId: O, staffId: STAFF, createdAt: FV.serverTimestamp(),
    });
    tx.update(prodRef, { stock: FV.increment(item.quantity), updatedAt: FV.serverTimestamp() });
    tx.set(db.collection('inventory_movements').doc(`RET_${O}_${P}`), {
      productId: P, productName: item.productName, type: 'return', quantity: item.quantity,
      reason: `RMA approve ${O}`, refOrderId: O, staffId: STAFF, createdAt: FV.serverTimestamp(),
    });
  });

  // Verify
  const order = await db.collection('orders').doc(O).get();
  const prod = await db.collection('products').doc(P).get();
  const refundTx = await db.collection('transactions').doc(`${O}_refund`).get();
  const mov = await db.collection('inventory_movements').doc(`RET_${O}_${P}`).get();
  check('Order status → returned', order.data()?.status === 'returned');
  check('Product stock = 13 (10 + 3 back)', prod.data()?.stock === 13, `actual=${prod.data()?.stock}`);
  check('Refund tx amount = -600000', refundTx.data()?.amount === -600000);
  check('Inventory movement type=return quantity=3', mov.data()?.type === 'return' && mov.data()?.quantity === 3);

  await cleanup();
  console.log(`\n✓ ${pass} PASS  ✗ ${fail} FAIL`);
  process.exit(fail > 0 ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
