import { onSchedule } from 'firebase-functions/v2/scheduler';
import admin from 'firebase-admin';
import { REGION } from './config.js';

/**
 * Daily 7h sáng ICT: quét toàn bộ /products, tìm SP có stock ≤ threshold
 * (default 5 hoặc lấy từ product.minStock nếu có), ghi vào
 * /low_stock_alerts/{YYYY-MM-DD} để admin reviewing trong Compliance hoặc
 * Warehouse module.
 *
 * Cũng update product.lowStockFlag = true để UI biểu thị warning ngay
 * trong PIM + iPos.
 */
export const dailyLowStockAlert = onSchedule(
  { region: REGION, schedule: '0 7 * * *', timeZone: 'Asia/Ho_Chi_Minh' },
  async () => {
    const db = admin.firestore();
    const today = new Date().toISOString().split('T')[0];

    const productsSnap = await db.collection('products').get();
    const lowStockItems: any[] = [];
    const outOfStockItems: any[] = [];
    const batch = db.batch();

    for (const doc of productsSnap.docs) {
      const p = doc.data();
      if (p.status === 'hidden' || p.status === 'pending_approval') continue;

      const stock = (p.stock as number | undefined) ?? 0;
      const threshold = (p.minStock as number | undefined) ?? 5;
      const wasFlagged = p.lowStockFlag === true;

      if (stock === 0) {
        outOfStockItems.push({ id: doc.id, name: p.name, sku: p.sku, sellerId: p.sellerId });
        if (!wasFlagged) {
          batch.update(doc.ref, { lowStockFlag: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        }
      } else if (stock <= threshold) {
        lowStockItems.push({ id: doc.id, name: p.name, sku: p.sku, stock, threshold, sellerId: p.sellerId });
        if (!wasFlagged) {
          batch.update(doc.ref, { lowStockFlag: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        }
      } else if (wasFlagged) {
        // Stock đã hồi phục → clear flag
        batch.update(doc.ref, { lowStockFlag: false, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      }
    }

    await batch.commit().catch((e) => console.warn('[lowStock] batch update failed:', e));

    await db.collection('low_stock_alerts').doc(today).set({
      date: today,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      lowStock: lowStockItems.slice(0, 100),       // cap 100 cho doc size
      outOfStock: outOfStockItems.slice(0, 100),
      totalScanned: productsSnap.size,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[lowStock] ${today}: ${lowStockItems.length} low, ${outOfStockItems.length} out, ${productsSnap.size} scanned`);
  },
);
