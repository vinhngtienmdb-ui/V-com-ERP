import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import admin from 'firebase-admin';
import { REGION } from './config.js';

/**
 * Cloud Function: đối soát tự động khi 1 SePay event được webhook lưu vào
 * /sepay_events/{eventId}. Mỗi event SePay (giao dịch ngân hàng) → match với
 * order có cùng amount + reference_number, tạo 1 doc /reconciliations/{id}:
 *
 *   - matched: order tìm được → status='matched', set order.paymentVerified=true
 *   - mismatch: amount khác → status='mismatch' để CSKH/Finance review
 *   - orphan: không tìm thấy order → status='orphan'
 *
 * Reconciliations là append-only; không update doc cũ, chỉ tạo mới.
 */

interface SepayPayload {
  reference_number?: string;
  amount_in?: number;
  amount_out?: number;
  transaction_content?: string;
  transaction_date?: string;
  bank_account_number?: string;
}

function extractOrderRef(content: string | undefined): string | null {
  if (!content) return null;
  // Convention: nội dung CK chứa mã đơn dạng ORD_XXXX hoặc ORDXXXX
  const m = content.match(/(ORD[_-]?[A-Z0-9_]+)/i);
  return m ? m[1].toUpperCase() : null;
}

export const reconcileSepayEvent = onDocumentCreated(
  { region: REGION, document: 'sepay_events/{eventId}' },
  async (event) => {
    const eventId = event.params.eventId;
    const data = event.data?.data();
    if (!data) return;
    const payload = data.payload as SepayPayload;
    const amount = payload.amount_in ?? 0;

    if (!payload || amount <= 0) {
      // Skip outflow / invalid
      return;
    }

    const db = admin.firestore();
    const orderRef = extractOrderRef(payload.reference_number ?? payload.transaction_content);

    let status: 'matched' | 'mismatch' | 'orphan' = 'orphan';
    let orderId: string | null = null;
    let expectedAmount: number | null = null;

    if (orderRef) {
      const tryRef = await db.collection('orders').doc(orderRef).get();
      if (tryRef.exists) {
        orderId = orderRef;
        expectedAmount = tryRef.data()?.total ?? null;
        status = expectedAmount === amount ? 'matched' : 'mismatch';
      } else {
        // Fallback: tìm theo amount + ngày gần
        const q = await db.collection('orders')
          .where('total', '==', amount)
          .where('status', 'in', ['pending', 'processing'])
          .limit(1)
          .get();
        if (!q.empty) {
          orderId = q.docs[0].id;
          expectedAmount = amount;
          status = 'matched';
        }
      }
    }

    await db.collection('reconciliations').add({
      eventId,
      orderId,
      status,
      expectedAmount,
      actualAmount: amount,
      transactionContent: payload.transaction_content ?? null,
      referenceNumber: payload.reference_number ?? null,
      bankAccount: payload.bank_account_number ?? null,
      transactionDate: payload.transaction_date ?? null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (status === 'matched' && orderId) {
      // Cập nhật order.paymentVerified — server-side write, không bị rule chặn
      // (vì server dùng Admin SDK)
      await db.collection('orders').doc(orderId).set(
        { paymentVerified: true, paymentVerifiedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true },
      );
    }

    console.log(`[reconcile] event ${eventId} → ${status}${orderId ? ` order=${orderId}` : ''}`);
  },
);
