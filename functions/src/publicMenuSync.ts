import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import admin from 'firebase-admin';
import { REGION } from './config.js';

/**
 * Trigger: mỗi khi /products/{id} thay đổi, mirror các field PUBLIC
 * sang /public_menu/{id}. Loại bỏ costPrice/hiddenCosts/margin/profit để
 * không lộ ra eMenu (public read).
 *
 * Rule:
 *   - delete: cũng xóa /public_menu/{id}
 *   - update product.status='hidden' hoặc 'pending_approval': xóa /public_menu/{id}
 *   - update với status visible: upsert
 */
export const syncProductToPublicMenu = onDocumentWritten(
  { region: REGION, document: 'products/{productId}' },
  async (event) => {
    const productId = event.params.productId;
    const before = event.data?.before.data() as any | undefined;
    const after = event.data?.after.data() as any | undefined;
    const publicRef = admin.firestore().collection('public_menu').doc(productId);

    // Product bị xóa
    if (!after) {
      await publicRef.delete().catch(() => {});
      console.log(`[publicMenuSync] deleted public_menu/${productId} (product removed)`);
      return;
    }

    // Product ẩn hoặc đang chờ duyệt → không hiển thị public
    const isVisible = !['hidden', 'pending_approval', 'out_of_stock'].includes(after.status);
    if (!isVisible) {
      await publicRef.delete().catch(() => {});
      console.log(`[publicMenuSync] removed public_menu/${productId} (status=${after.status})`);
      return;
    }

    // Mirror PUBLIC fields only
    const publicDoc = {
      name: after.name,
      price: after.price,
      category: after.category ?? null,
      image: after.image ?? null,
      brand: after.brand ?? null,
      sku: after.sku ?? null,
      sellerId: after.sellerId ?? null,
      sellerName: after.sellerName ?? null,
      // Có hàng = true khi stock > 0 (hoặc không track stock)
      available: typeof after.stock === 'number' ? after.stock > 0 : true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await publicRef.set(publicDoc, { merge: true });

    if (!before) {
      console.log(`[publicMenuSync] created public_menu/${productId}`);
    } else {
      console.log(`[publicMenuSync] updated public_menu/${productId}`);
    }
  },
);
