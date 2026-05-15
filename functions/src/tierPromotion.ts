import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import admin from 'firebase-admin';
import { REGION } from './config.js';

/**
 * Trigger: khi customer.totalSpent thay đổi (do loyalty trigger cộng), kiểm tra
 * tier hiện tại và tự promote nếu vượt threshold trong /loyalty_programs/default.
 *
 * Ghi /point_transactions type='earn_bonus' với 0 điểm nhưng description ghi
 * tier change (cho audit), và update customer.tier.
 *
 * Idempotent qua check trước/sau tier name.
 */
export const onCustomerSpentChange_promoteTier = onDocumentUpdated(
  { region: REGION, document: 'customers/{customerId}' },
  async (event) => {
    const customerId = event.params.customerId;
    const before = event.data?.before.data() as any | undefined;
    const after = event.data?.after.data() as any | undefined;
    if (!before || !after) return;

    const beforeSpent = before.totalSpent ?? 0;
    const afterSpent = after.totalSpent ?? 0;
    if (afterSpent <= beforeSpent) return;  // chỉ trigger khi tăng

    const db = admin.firestore();
    const programSnap = await db.collection('loyalty_programs').doc('default').get();
    if (!programSnap.exists) return;
    const program = programSnap.data() as any;
    if (program.enabled === false) return;
    const tiers = (program.tiers as any[]) ?? [];
    if (tiers.length === 0) return;

    // Tìm tier cao nhất khớp với spent mới
    const sortedTiers = [...tiers].sort((a, b) => b.minTotalSpent - a.minTotalSpent);
    const newTier = sortedTiers.find(t => afterSpent >= t.minTotalSpent);
    if (!newTier) return;

    const oldTier = after.tier;
    if (oldTier === newTier.name) return; // không đổi

    // Update tier + ghi audit
    await db.collection('customers').doc(customerId).update({
      tier: newTier.name,
      tierPromotedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await db.collection('point_transactions').add({
      customerId,
      type: 'earn_bonus',
      points: 0,
      description: `Lên hạng: ${oldTier ?? 'Mới'} → ${newTier.name} (totalSpent=${afterSpent.toLocaleString('vi-VN')})`,
      staffId: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[tierPromotion] customer ${customerId}: ${oldTier ?? 'Mới'} → ${newTier.name}`);
  },
);
