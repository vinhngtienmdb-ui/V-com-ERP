import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import admin from 'firebase-admin';
import { REGION } from './config.js';

/**
 * Trigger: khi order chuyển sang 'delivered' và có customerId → cộng điểm.
 * Quy đổi mặc định: 1000 VND = 1 điểm (tùy theo /loyalty_programs/default).
 * Idempotent qua flag order.loyaltyPointsCredited.
 */
export const onOrderDelivered_creditLoyaltyPoints = onDocumentUpdated(
  { region: REGION, document: 'orders/{orderId}' },
  async (event) => {
    const orderId = event.params.orderId;
    const before = event.data?.before.data() as any | undefined;
    const after = event.data?.after.data() as any | undefined;
    if (!before || !after) return;
    if (before.status === 'delivered' || after.status !== 'delivered') return;
    if (after.loyaltyPointsCredited === true) return;

    const customerId = after.customerId as string | undefined;
    if (!customerId) return;

    const db = admin.firestore();
    // Load program config (fallback defaults nếu chưa setup)
    const programSnap = await db.collection('loyalty_programs').doc('default').get();
    const program = programSnap.exists ? (programSnap.data() as any) : null;
    if (program && program.enabled === false) return; // program off
    const vndPerPoint = program?.vndPerPoint ?? 1000;

    const total = after.total ?? 0;
    if (total <= 0) return;
    const points = Math.floor(total / vndPerPoint);
    if (points <= 0) return;

    // Tier multiplier (load customer current tier)
    const customerSnap = await db.collection('customers').doc(customerId).get();
    let multiplier = 1;
    if (customerSnap.exists && program?.tiers) {
      const customer = customerSnap.data() as any;
      const totalSpent = (customer.totalSpent ?? 0) + total;
      // Tìm tier cao nhất khớp
      const tier = (program.tiers as any[])
        .filter((t) => totalSpent >= t.minTotalSpent)
        .sort((a, b) => b.minTotalSpent - a.minTotalSpent)[0];
      multiplier = tier?.multiplier ?? 1;
    }
    const finalPoints = Math.floor(points * multiplier);

    const txId = `${orderId}_loyalty`;
    const expiresAt = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 12 tháng
    );

    await db.runTransaction(async (tx) => {
      // Ghi point_transactions
      tx.set(db.collection('point_transactions').doc(txId), {
        customerId,
        type: 'earn_order',
        points: finalPoints,
        refOrderId: orderId,
        description: `Tích từ đơn ${orderId} (${total} VND × multiplier ${multiplier})`,
        staffId: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt,
      });

      // Cộng vào customer.points
      tx.update(db.collection('customers').doc(customerId), {
        points: admin.firestore.FieldValue.increment(finalPoints),
        totalSpent: admin.firestore.FieldValue.increment(total),
        orderCount: admin.firestore.FieldValue.increment(1),
        lastOrderDate: new Date().toISOString(),
      });

      // Flag idempotent
      tx.update(db.collection('orders').doc(orderId), {
        loyaltyPointsCredited: true,
        loyaltyPointsAmount: finalPoints,
      });
    });

    console.log(`[loyalty] cộng ${finalPoints} điểm cho customer ${customerId} từ order ${orderId}`);
  },
);
