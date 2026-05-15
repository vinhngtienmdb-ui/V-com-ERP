/**
 * E2E Invoice flow:
 *   1. Setup: 1 order delivered total 2.5M (3 items: 500k×2, 700k×1, 800k×1)
 *   2. Mô phỏng issueInvoice logic (Cloud Function dùng cùng pattern):
 *      - Tính subtotal + VAT 10% mỗi item
 *      - Sinh số HĐ tuần tự dựa trên counter
 *      - Ghi /invoices/{INV_YYYY_NNNNNNN}
 *      - Ghi /transactions/{id}_vat type='tax'
 *   3. Verify: invoice fields đầy đủ, subtotal/vat/total đúng, transaction tax exist
 *   4. Cleanup
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
const O = 'E2E_INV_O1';

async function cleanup() {
  for (const c of ['orders', 'invoices', 'transactions']) {
    const s = await db.collection(c).get();
    const b = db.batch();
    s.docs.forEach(d => { if (d.id.startsWith('E2E_INV') || d.id.startsWith('INV_E2E')) b.delete(d.ref); });
    await b.commit().catch(() => {});
  }
}

async function nextInvoiceNumber(year: number) {
  const counterRef = db.collection('_internal').doc(`invoice_counter_${year}`);
  return await db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const cur = snap.exists ? (snap.data()?.value ?? 0) : 0;
    const newVal = cur + 1;
    tx.set(counterRef, { value: newVal, year }, { merge: true });
    return newVal;
  });
}

async function main() {
  console.log('🧪 E2E Invoice flow\n');
  await cleanup();

  // Setup order
  const items = [
    { productId: 'P1', productName: 'SP1', quantity: 2, price: 500_000 },  // 1M
    { productId: 'P2', productName: 'SP2', quantity: 1, price: 700_000 },  // 700k
    { productId: 'P3', productName: 'SP3', quantity: 1, price: 800_000 },  // 800k
  ];
  const total = items.reduce((s, it) => s + it.price * it.quantity, 0); // 2.5M
  await db.collection('orders').doc(O).set({
    customerName: 'Khách INV E2E', customerId: 'CUST_INV', total, status: 'delivered',
    paymentMethod: 'bank_transfer', staffId: STAFF, items,
    createdAt: FV.serverTimestamp(),
  });
  console.log(`  Setup order ${O} (3 items, total ${total.toLocaleString('vi-VN')}đ)`);

  // Issue invoice (mô phỏng cloud function)
  const VAT = 0.1;
  const lineItems = items.map(it => {
    const amount = it.price * it.quantity;
    return { ...it, vatRate: VAT, amount, vatAmount: Math.round(amount * VAT) };
  });
  const subtotal = lineItems.reduce((s, it) => s + it.amount, 0);
  const vatTotal = lineItems.reduce((s, it) => s + it.vatAmount, 0);
  const year = new Date().getFullYear();
  const seq = await nextInvoiceNumber(year);
  const number = String(seq).padStart(7, '0');
  const invoiceId = `INV_E2E_${year}_${number}`;

  await db.collection('invoices').doc(invoiceId).set({
    invoiceNumber: number, serialNumber: `K${String(year).slice(-2)}TVC`,
    templateNumber: '1/001',
    sellerTaxCode: '0123456789', sellerName: 'VComm Việt Nam (test)',
    sellerAddress: '123 Lê Lợi, Q.1, TP.HCM',
    buyerName: 'Khách INV E2E',
    items: lineItems, subtotal, vatTotal, total: subtotal + vatTotal,
    paymentMethod: 'bank_transfer', status: 'issued',
    issuedAt: FV.serverTimestamp(), orderId: O,
  });
  await db.collection('transactions').doc(`${invoiceId}_vat`).set({
    description: `VAT 10% — HĐ ${invoiceId}`, amount: vatTotal, type: 'tax',
    category: 'VAT_OUTPUT', orderId: O, staffId: STAFF, createdAt: FV.serverTimestamp(),
  });

  // Verify
  const inv = await db.collection('invoices').doc(invoiceId).get();
  const tx = await db.collection('transactions').doc(`${invoiceId}_vat`).get();

  check('Invoice exists', inv.exists);
  check('Invoice number 7-digit padded', inv.data()?.invoiceNumber === number && number.length === 7);
  check(`Serial K${String(year).slice(-2)}TVC`, inv.data()?.serialNumber === `K${String(year).slice(-2)}TVC`);
  check(`Subtotal = ${subtotal.toLocaleString('vi-VN')}`, inv.data()?.subtotal === 2_500_000);
  check(`VAT total = 10% × 2.5M = 250k`, inv.data()?.vatTotal === 250_000);
  check(`Total = 2.75M`, inv.data()?.total === 2_750_000);
  check(`Items count = 3`, inv.data()?.items?.length === 3);
  check(`Tax transaction amount = 250k`, tx.data()?.amount === 250_000);
  check(`Tax transaction type = 'tax'`, tx.data()?.type === 'tax');

  // Reissue with same order would generate next sequential number
  const seq2 = await nextInvoiceNumber(year);
  check(`Counter monotonically increases (${seq} → ${seq2})`, seq2 === seq + 1);

  await cleanup();
  console.log(`\n✓ ${pass} PASS  ✗ ${fail} FAIL`);
  process.exit(fail > 0 ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
