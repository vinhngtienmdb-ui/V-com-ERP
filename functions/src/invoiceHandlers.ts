import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import admin from 'firebase-admin';
import { verifyAuth, requireRole, HttpAuthError } from './auth.js';
import { REGION } from './config.js';

type ExpressResponse = import('express').Response;

const VAT_RATE_DEFAULT = 0.1;
const PERSONAL_SELLER_TAX_RATE = 0.015; // 1.5% theo TT 40/2021 — TNCN cá nhân KD TMĐT

function setCors(res: ExpressResponse) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

function handleError(res: ExpressResponse, err: unknown, ctx: string) {
  if (err instanceof HttpAuthError) { res.status(err.status).json({ error: err.message }); return; }
  console.error(`[${ctx}]`, err);
  res.status(500).json({ error: 'Internal error' });
}

/**
 * Sinh số hóa đơn dạng "K23TVC{0000001}" theo TT 78/2021.
 * K = ký hiệu mẫu, 23 = năm, T = loại HĐ giá trị gia tăng, VC = ký hiệu doanh nghiệp.
 * Sequential thread-safe nhờ runTransaction trên counter doc.
 */
async function nextInvoiceNumber(year: number): Promise<{ number: string; serial: string }> {
  const db = admin.firestore();
  const counterRef = db.collection('_internal').doc(`invoice_counter_${year}`);
  const next = await db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const current = snap.exists ? (snap.data()?.value ?? 0) : 0;
    const newVal = current + 1;
    tx.set(counterRef, { value: newVal, year }, { merge: true });
    return newVal;
  });
  return {
    number: String(next).padStart(7, '0'),
    serial: `K${String(year).slice(-2)}TVC`,
  };
}

/**
 * HTTPS: Tạo hóa đơn điện tử từ 1 order.
 *   POST /api/invoices/issue { orderId }
 * Logic:
 *   1. Lấy order + verify status='delivered' hoặc 'completed'
 *   2. Lấy seller info (taxCode, name, address)
 *   3. Tính subtotal/vat/total từ items
 *   4. Sinh số HĐ tuần tự
 *   5. Lưu /invoices/{id} status='issued'
 *   6. (TODO) Gửi sang TCT qua SePay e-invoice API
 */
export const issueInvoice = onRequest(
  { region: REGION, cors: true },
  async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
    try {
      const auth = await verifyAuth(req);
      requireRole(auth, ['admin', 'director', 'manager']);

      const { orderId, sellerTaxCode, sellerName, sellerAddress } = req.body ?? {};
      if (!orderId) {
        res.status(400).json({ error: 'orderId bắt buộc' });
        return;
      }
      // Bắt buộc có thông tin bên bán (đáp ứng TT 78 — không thể issue HĐ thiếu MST)
      if (!sellerTaxCode || !sellerName) {
        res.status(400).json({ error: 'sellerTaxCode + sellerName bắt buộc (TT 78)' });
        return;
      }

      const db = admin.firestore();
      const orderSnap = await db.collection('orders').doc(orderId).get();
      if (!orderSnap.exists) { res.status(404).json({ error: `Order ${orderId} không tồn tại` }); return; }
      const order = orderSnap.data() as any;

      if (order.status !== 'delivered' && order.status !== 'completed') {
        res.status(409).json({ error: `Đơn ở trạng thái ${order.status} — chỉ xuất HĐ cho delivered/completed` });
        return;
      }

      // Build line items
      const items = (order.items as any[]).map((it) => {
        const amount = it.price * it.quantity;
        const vatAmount = Math.round(amount * VAT_RATE_DEFAULT);
        return {
          productCode: it.productId,
          description: it.productName ?? 'N/A',
          unit: 'cái',
          quantity: it.quantity,
          unitPrice: it.price,
          vatRate: VAT_RATE_DEFAULT,
          amount,
          vatAmount,
        };
      });
      const subtotal = items.reduce((s, it) => s + it.amount, 0);
      const vatTotal = items.reduce((s, it) => s + it.vatAmount, 0);
      const total = subtotal + vatTotal;

      const year = new Date().getFullYear();
      const { number, serial } = await nextInvoiceNumber(year);
      const invoiceId = `INV_${year}_${number}`;

      await db.collection('invoices').doc(invoiceId).set({
        invoiceNumber: number,
        serialNumber: serial,
        templateNumber: '1/001',
        sellerTaxCode,
        sellerName,
        sellerAddress: sellerAddress ?? '',
        buyerName: order.customerName,
        buyerTaxCode: order.buyerTaxCode ?? null,
        items,
        subtotal,
        vatTotal,
        total,
        paymentMethod: order.paymentMethod ?? null,
        status: 'issued',
        issuedAt: admin.firestore.FieldValue.serverTimestamp(),
        orderId,
        sellerId: order.sellerId ?? null,
        // TODO: ký số + gửi TCT khi tích hợp CA provider
        signatureProvider: null,
      });

      // Ghi transaction tax = VAT
      await db.collection('transactions').doc(`${invoiceId}_vat`).set({
        description: `VAT 10% — HĐ ${invoiceId} - đơn ${orderId}`,
        amount: vatTotal,
        type: 'tax',
        category: 'VAT_OUTPUT',
        orderId,
        staffId: auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({ ok: true, invoiceId, invoiceNumber: number, serial, subtotal, vatTotal, total });
    } catch (err) {
      handleError(res, err, 'issueInvoice');
    }
  },
);

/**
 * Scheduled: chạy ngày 1 mỗi tháng — tổng hợp doanh thu seller tháng trước
 * và ghi /seller_tax_reports/{sellerId}_{YYYY-MM} (NĐ 117/2025).
 */
export const monthlySellerTaxAggregation = onSchedule(
  { region: REGION, schedule: '0 2 1 * *', timeZone: 'Asia/Ho_Chi_Minh' },
  async () => {
    const db = admin.firestore();
    const now = new Date();
    // Tháng trước
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const periodStart = new Date(prev.getFullYear(), prev.getMonth(), 1);
    const periodEnd = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
    const periodKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;

    // Lấy tất cả seller active
    const sellersSnap = await db.collection('sellers')
      .where('status', 'in', ['active', 'verified', 'suspended'])
      .get();

    let count = 0;
    for (const sellerDoc of sellersSnap.docs) {
      const seller = sellerDoc.data() as any;
      const sellerId = sellerDoc.id;

      // Đơn delivered trong period
      const ordersSnap = await db.collection('orders')
        .where('sellerId', '==', sellerId)
        .where('status', 'in', ['delivered', 'completed'])
        .where('createdAt', '>=', periodStart)
        .where('createdAt', '<', periodEnd)
        .get();

      const totalGmv = ordersSnap.docs.reduce((s, d) => s + (d.data().total ?? 0), 0);
      const totalOrders = ordersSnap.size;

      // Đơn returning/returned
      const returnsSnap = await db.collection('orders')
        .where('sellerId', '==', sellerId)
        .where('status', 'in', ['returning', 'returned'])
        .where('createdAt', '>=', periodStart)
        .where('createdAt', '<', periodEnd)
        .get();
      const totalReturns = returnsSnap.docs.reduce((s, d) => s + (d.data().total ?? 0), 0);

      const netRevenue = Math.max(0, totalGmv - totalReturns);

      // TT 40/2021: cá nhân KD TMĐT nộp 1.5% doanh thu (VAT 1% + TNCN 0.5%)
      // HKD/DN tính theo NĐ riêng, đây mới là ước tính
      const estimatedTax = seller.entityType === 'individual'
        ? Math.round(netRevenue * PERSONAL_SELLER_TAX_RATE)
        : 0; // HKD/DN tự khai

      const reportId = `${sellerId}_${periodKey}`;
      await db.collection('seller_tax_reports').doc(reportId).set({
        sellerId,
        sellerTaxCode: seller.taxCode ?? '',
        sellerName: seller.name,
        period: periodKey,
        totalGmv,
        totalOrders,
        totalReturns,
        netRevenue,
        estimatedTaxAmount: estimatedTax,
        submittedToTaxAuthority: false,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      count++;
    }
    console.log(`[monthlySellerTaxAggregation] period=${periodKey} processed=${count} sellers`);
  },
);
