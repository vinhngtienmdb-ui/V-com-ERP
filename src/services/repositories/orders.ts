import { doc, runTransaction, serverTimestamp, increment } from 'firebase/firestore';
import { db, auth, handleFirestoreError } from '../../lib/firebase';
import type { OrderInput } from './schemas';

/**
 * Business logic transactional cho Orders.
 *
 * Mọi thao tác đụng vào nhiều doc cùng lúc (orders + products.stock +
 * inventory_movements + transactions) phải qua transaction để đảm bảo
 * atomicity. Không gọi update trực tiếp từ component.
 */

interface ShipOrderResult {
  orderId: string;
  movements: Array<{ productId: string; quantity: number }>;
}

/**
 * Đánh dấu đơn `orderId` đã giao hàng:
 *   1. Set order.status = 'shipped'
 *   2. Với mỗi item:
 *      - Trừ products.{productId}.stock theo quantity
 *      - Tạo /inventory_movements/{auto} type='stock_out'
 *
 * Atomic: nếu 1 product không đủ stock hoặc không tồn tại → rollback toàn bộ.
 */
export async function shipOrder(orderId: string): Promise<ShipOrderResult> {
  const user = auth.currentUser;
  if (!user) throw new Error('Chưa đăng nhập');

  try {
    const result = await runTransaction(db, async (tx) => {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await tx.get(orderRef);
      if (!orderSnap.exists()) throw new Error(`Order ${orderId} không tồn tại`);
      const order = orderSnap.data() as OrderInput;

      if (order.status === 'shipped' || order.status === 'delivered') {
        throw new Error(`Đơn ${orderId} đã ${order.status} — không thể ship lại`);
      }

      // Đọc tất cả products trước khi write (Firestore rule)
      const productSnaps = await Promise.all(
        order.items.map((it) => tx.get(doc(db, 'products', it.productId))),
      );

      // Validate stock đủ
      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        const ps = productSnaps[i];
        if (!ps.exists()) throw new Error(`Product ${item.productId} không tồn tại`);
        const stock = (ps.data().stock as number | undefined) ?? 0;
        if (stock < item.quantity) {
          throw new Error(`Product ${item.productId} chỉ còn ${stock}, cần ${item.quantity}`);
        }
      }

      // Update order status
      tx.update(orderRef, {
        status: 'shipped',
        updatedAt: serverTimestamp(),
      });

      // Trừ stock + ghi inventory_movements
      const movements: Array<{ productId: string; quantity: number }> = [];
      for (const item of order.items) {
        tx.update(doc(db, 'products', item.productId), {
          stock: increment(-item.quantity),
          updatedAt: serverTimestamp(),
        });
        const movRef = doc(db, 'inventory_movements', `${orderId}_${item.productId}_${Date.now()}`);
        tx.set(movRef, {
          productId: item.productId,
          productName: item.productName,
          storeId: (order as any).storeId ?? null,
          type: 'stock_out',
          quantity: -item.quantity,
          reason: 'Ship đơn hàng',
          refOrderId: orderId,
          staffId: user.uid,
          createdAt: serverTimestamp(),
        });
        movements.push({ productId: item.productId, quantity: item.quantity });
      }

      return { orderId, movements };
    });
    return result;
  } catch (err) {
    handleFirestoreError(err, 'write', `orders/${orderId}`);
    throw err;
  }
}

/**
 * Đánh dấu đơn đã giao đến tay khách → tạo /transactions/{auto} type='income'
 * cho doanh thu thực tế. Không trừ stock (đã trừ ở shipOrder).
 */
export async function deliverOrder(orderId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Chưa đăng nhập');

  try {
    await runTransaction(db, async (tx) => {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await tx.get(orderRef);
      if (!orderSnap.exists()) throw new Error(`Order ${orderId} không tồn tại`);
      const order = orderSnap.data() as OrderInput;

      if (order.status !== 'shipped') {
        throw new Error(`Đơn ${orderId} phải ở trạng thái 'shipped' (hiện: ${order.status})`);
      }

      tx.update(orderRef, {
        status: 'delivered',
        updatedAt: serverTimestamp(),
      });

      tx.set(doc(db, 'transactions', `${orderId}_revenue`), {
        description: `Doanh thu đơn #${orderId} - ${order.customerName}`,
        amount: order.total,
        type: 'income',
        category: 'Sales',
        orderId,
        staffId: user.uid,
        createdAt: serverTimestamp(),
      });
    });
  } catch (err) {
    handleFirestoreError(err, 'write', `orders/${orderId}`);
    throw err;
  }
}
