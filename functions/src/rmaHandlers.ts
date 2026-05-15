import { onRequest } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';
import { verifyAuth, requireRole, HttpAuthError } from './auth.js';
import { REGION } from './config.js';

type ExpressResponse = import('express').Response;

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
 * HTTPS: Manager+ duyệt yêu cầu hoàn trả (RMA).
 *   POST /api/orders/process-return { orderId, action: 'approve'|'reject', reason?: string }
 *
 * Logic approve (atomic transaction):
 *   1. Order phải ở status='returning'
 *   2. Set order.status='returned'
 *   3. Tạo /transactions/{orderId}_refund: type='refund', amount = -order.total
 *   4. Cho mỗi item: cộng products.stock + ghi /inventory_movements type='return'
 *
 * Logic reject:
 *   1. Order phải ở status='returning'
 *   2. Set order.status='delivered' (revert) + rejectReason
 */
export const processReturn = onRequest(
  { region: REGION, cors: true },
  async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
    try {
      const auth = await verifyAuth(req);
      requireRole(auth, ['admin', 'director', 'manager']);

      const { orderId, action, reason } = req.body ?? {};
      if (!orderId || !['approve', 'reject'].includes(action)) {
        res.status(400).json({ error: 'orderId + action (approve|reject) bắt buộc' });
        return;
      }
      if (action === 'reject' && !reason?.trim()) {
        res.status(400).json({ error: 'reason bắt buộc khi reject' });
        return;
      }

      const db = admin.firestore();
      const orderRef = db.collection('orders').doc(orderId);
      const result = await db.runTransaction(async (tx) => {
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists) throw new HttpAuthError(404, `Order ${orderId} không tồn tại`);
        const order = orderSnap.data() as any;

        if (order.status !== 'returning') {
          throw new HttpAuthError(409, `Đơn phải ở status='returning' (hiện: ${order.status})`);
        }

        if (action === 'reject') {
          tx.update(orderRef, {
            status: 'delivered', // revert về delivered
            returnRejectReason: reason,
            returnProcessedBy: auth.uid,
            returnProcessedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          return { action: 'reject', refundAmount: 0, itemsReturned: 0 };
        }

        // Approve: hoàn tiền + trả stock
        // 1. Đọc tất cả product trước (Firestore tx phải read trước write)
        const items = (order.items ?? []) as Array<{ productId: string; productName: string; quantity: number; price: number }>;
        const productSnaps = await Promise.all(
          items.filter(it => it.productId).map(it => tx.get(db.collection('products').doc(it.productId)))
        );

        // 2. Update order status
        tx.update(orderRef, {
          status: 'returned',
          returnApprovedBy: auth.uid,
          returnApprovedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 3. Tạo refund transaction (amount âm)
        tx.set(db.collection('transactions').doc(`${orderId}_refund`), {
          description: `Hoàn tiền đơn ${orderId} - ${order.customerName ?? ''}`,
          amount: -(order.total ?? 0),
          type: 'refund',
          orderId,
          staffId: auth.uid,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 4. Trả stock + inventory_movements
        let returnedCount = 0;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (!item.productId) continue;
          const ps = productSnaps[i];
          if (!ps?.exists) continue;
          tx.update(db.collection('products').doc(item.productId), {
            stock: admin.firestore.FieldValue.increment(item.quantity),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          tx.set(db.collection('inventory_movements').doc(`RET_${orderId}_${item.productId}_${i}`), {
            productId: item.productId,
            productName: item.productName,
            storeId: order.storeId ?? null,
            type: 'return',
            quantity: item.quantity, // dương = trả lại kho
            reason: `RMA approve ${orderId}`,
            refOrderId: orderId,
            staffId: auth.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          returnedCount++;
        }

        return { action: 'approve', refundAmount: order.total, itemsReturned: returnedCount };
      });

      res.json({ ok: true, orderId, ...result });
    } catch (err) {
      handleError(res, err, 'processReturn');
    }
  },
);
