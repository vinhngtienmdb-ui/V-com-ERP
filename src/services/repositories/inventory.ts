import { doc, runTransaction, serverTimestamp, increment } from 'firebase/firestore';
import { db, auth, handleFirestoreError } from '../../lib/firebase';

/**
 * Inventory operations transactional cho Warehouse module.
 */

interface StockInOptions {
  productId: string;
  productName?: string;
  storeId?: string;
  quantity: number;          // dương
  costPriceAtMove?: number;
  reason?: string;           // 'Nhập NCC', 'Nhập từ sản xuất', ...
}

interface StockAdjustOptions {
  productId: string;
  productName?: string;
  storeId?: string;
  delta: number;             // dương = thêm, âm = bớt (vd kiểm kê thiếu)
  reason: string;            // BẮT BUỘC cho audit (vd 'Kiểm kê cuối tháng — hao hụt')
}

/**
 * Nhập kho: tăng products.{id}.stock + ghi /inventory_movements type='stock_in'.
 */
export async function stockIn(opts: StockInOptions): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Chưa đăng nhập');
  if (opts.quantity <= 0) throw new Error('quantity phải > 0');

  try {
    await runTransaction(db, async (tx) => {
      const prodRef = doc(db, 'products', opts.productId);
      const snap = await tx.get(prodRef);
      if (!snap.exists()) throw new Error(`Product ${opts.productId} không tồn tại`);

      tx.update(prodRef, {
        stock: increment(opts.quantity),
        updatedAt: serverTimestamp(),
      });

      tx.set(doc(db, 'inventory_movements', `IN_${opts.productId}_${Date.now()}`), {
        productId: opts.productId,
        productName: opts.productName ?? snap.data().name,
        storeId: opts.storeId ?? null,
        type: 'stock_in',
        quantity: opts.quantity,
        costPriceAtMove: opts.costPriceAtMove ?? null,
        reason: opts.reason ?? 'Nhập kho',
        staffId: user.uid,
        createdAt: serverTimestamp(),
      });
    });
  } catch (err) {
    handleFirestoreError(err, 'write', `products/${opts.productId}`);
    throw err;
  }
}

/**
 * Hiệu chỉnh stock (kiểm kê) — delta có thể âm hoặc dương.
 * Bắt buộc có reason để giữ minh bạch.
 */
export async function adjustStock(opts: StockAdjustOptions): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Chưa đăng nhập');
  if (opts.delta === 0) throw new Error('delta phải khác 0');
  if (!opts.reason?.trim()) throw new Error('reason bắt buộc cho adjustment');

  try {
    await runTransaction(db, async (tx) => {
      const prodRef = doc(db, 'products', opts.productId);
      const snap = await tx.get(prodRef);
      if (!snap.exists()) throw new Error(`Product ${opts.productId} không tồn tại`);
      const currentStock = (snap.data().stock as number | undefined) ?? 0;
      const newStock = currentStock + opts.delta;
      if (newStock < 0) {
        throw new Error(`Stock không thể âm: ${currentStock} + ${opts.delta} = ${newStock}`);
      }

      tx.update(prodRef, {
        stock: increment(opts.delta),
        updatedAt: serverTimestamp(),
      });

      tx.set(doc(db, 'inventory_movements', `ADJ_${opts.productId}_${Date.now()}`), {
        productId: opts.productId,
        productName: opts.productName ?? snap.data().name,
        storeId: opts.storeId ?? null,
        type: 'adjustment',
        quantity: opts.delta,
        reason: opts.reason,
        staffId: user.uid,
        createdAt: serverTimestamp(),
      });
    });
  } catch (err) {
    handleFirestoreError(err, 'write', `products/${opts.productId}`);
    throw err;
  }
}
