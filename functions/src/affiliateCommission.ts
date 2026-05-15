import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import admin from 'firebase-admin';
import { REGION } from './config.js';

/**
 * Trigger: khi order.status chuyển sang 'delivered', kiểm tra `order.refCode`.
 * Nếu match affiliate → tính commission = order.total * affiliate.commissionRate
 * và ghi:
 *   - /wallet_transactions/{auto}: type='order_credit', walletId=affiliate_wallet, amount=+commission
 *   - /wallets/affiliate_{id}: balance += commission (cộng dồn)
 *   - /affiliates/{id}: commissionEarned += commission, ordersCount += 1
 *
 * Đồng thời /transactions/{auto}: type='commission' (sàn ghi chi phí).
 *
 * Idempotent: nếu order.commissionPaid=true rồi → skip.
 */
export const onOrderDelivered_payAffiliate = onDocumentUpdated(
  { region: REGION, document: 'orders/{orderId}' },
  async (event) => {
    const orderId = event.params.orderId;
    const before = event.data?.before.data() as any | undefined;
    const after = event.data?.after.data() as any | undefined;
    if (!before || !after) return;

    // Chỉ trigger khi status chuyển TỪ != delivered SANG delivered
    if (before.status === 'delivered' || after.status !== 'delivered') return;

    // Idempotency
    if (after.commissionPaid === true) {
      console.log(`[affiliate] order ${orderId} đã pay commission, skip`);
      return;
    }

    const refCode = after.refCode as string | undefined;
    if (!refCode) return; // Order không có refCode → không qua affiliate

    const db = admin.firestore();
    // Tìm affiliate theo refCode
    const affSnap = await db.collection('affiliates')
      .where('refCode', '==', refCode.toUpperCase())
      .where('status', '==', 'active')
      .limit(1).get();
    if (affSnap.empty) {
      console.log(`[affiliate] refCode ${refCode} không match active affiliate`);
      return;
    }
    const affDoc = affSnap.docs[0];
    const affiliate = affDoc.data() as any;
    const commission = Math.round((after.total ?? 0) * (affiliate.commissionRate ?? 0));
    if (commission <= 0) return;

    const walletId = `affiliate_${affDoc.id}`;
    const txId = `${orderId}_aff_${affDoc.id}`;

    await db.runTransaction(async (tx) => {
      // Ensure wallet
      const walletRef = db.collection('wallets').doc(walletId);
      const walletSnap = await tx.get(walletRef);
      if (!walletSnap.exists) {
        tx.set(walletRef, {
          ownerType: 'system', // affiliate dùng wallet system-managed
          ownerId: affDoc.id,
          balance: 0, pendingBalance: 0, currency: 'VND',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Cộng commission vào wallet
      tx.update(walletRef, {
        balance: admin.firestore.FieldValue.increment(commission),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Ghi wallet_transactions
      tx.set(db.collection('wallet_transactions').doc(txId), {
        walletId,
        type: 'order_credit',
        amount: commission,
        refOrderId: orderId,
        description: `Hoa hồng đơn #${orderId} (affiliate ${affDoc.id} refCode=${refCode})`,
        staffId: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update affiliate KPI
      tx.update(db.collection('affiliates').doc(affDoc.id), {
        commissionEarned: admin.firestore.FieldValue.increment(commission),
        ordersCount: admin.firestore.FieldValue.increment(1),
      });

      // Ghi sổ /transactions type='commission' (sàn ghi chi phí)
      tx.set(db.collection('transactions').doc(`${orderId}_commission`), {
        description: `Hoa hồng affiliate cho đơn ${orderId}`,
        amount: -commission, // âm vì sàn chi
        type: 'commission',
        orderId,
        staffId: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Idempotency: set flag
      tx.update(db.collection('orders').doc(orderId), {
        commissionPaid: true,
        commissionAffiliateId: affDoc.id,
        commissionAmount: commission,
      });
    });

    console.log(`[affiliate] paid ${commission} cho affiliate ${affDoc.id} từ order ${orderId}`);
  },
);
