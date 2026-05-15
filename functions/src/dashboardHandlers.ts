import { onSchedule } from 'firebase-functions/v2/scheduler';
import admin from 'firebase-admin';
import { REGION } from './config.js';

/**
 * Hourly aggregation cho dashboard chính.
 * Mỗi giờ tổng hợp số liệu ngày hiện tại → ghi /dashboard_stats/{YYYY-MM-DD}.
 * Client subscribe 30 ngày gần nhất để render chart live.
 */
export const hourlyDashboardAggregation = onSchedule(
  { region: REGION, schedule: '0 * * * *', timeZone: 'Asia/Ho_Chi_Minh' },
  async () => {
    const db = admin.firestore();
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Đơn delivered/completed trong ngày
    const ordersSnap = await db.collection('orders')
      .where('status', 'in', ['delivered', 'completed'])
      .where('createdAt', '>=', startOfDay)
      .get();

    const totalOrders = ordersSnap.size;
    const totalGmv = ordersSnap.docs.reduce((s, d) => s + (d.data().total ?? 0), 0);
    const averageOrderValue = totalOrders > 0 ? Math.round(totalGmv / totalOrders) : 0;

    // Category distribution
    const categoryMap = new Map<string, number>();
    for (const orderDoc of ordersSnap.docs) {
      const items = (orderDoc.data().items ?? []) as any[];
      for (const item of items) {
        // Lấy category từ product (tốn thêm 1 read; OK cho aggregate)
        if (item.productId) {
          const prodSnap = await db.collection('products').doc(item.productId).get();
          const cat = prodSnap.data()?.category ?? 'Khác';
          categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + (item.price * item.quantity));
        }
      }
    }
    const categoryDistribution = Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Top sellers (theo GMV)
    const sellerGmvMap = new Map<string, number>();
    for (const orderDoc of ordersSnap.docs) {
      const sellerId = orderDoc.data().sellerId;
      if (sellerId) {
        sellerGmvMap.set(sellerId, (sellerGmvMap.get(sellerId) ?? 0) + (orderDoc.data().total ?? 0));
      }
    }
    const topSellers = Array.from(sellerGmvMap.entries())
      .map(([sellerId, gmv]) => ({ sellerId, gmv }))
      .sort((a, b) => b.gmv - a.gmv)
      .slice(0, 5);

    // Đơn pending/processing → cần xử lý
    const pendingSnap = await db.collection('orders')
      .where('status', 'in', ['pending', 'processing'])
      .get();
    const pendingOrders = pendingSnap.size;

    // Active sellers (verified hoặc active)
    const sellersSnap = await db.collection('sellers')
      .where('status', 'in', ['active', 'verified']).get();
    const activeSellers = sellersSnap.size;

    // Customers tổng
    const customersAgg = await db.collection('customers').count().get();
    const totalCustomers = customersAgg.data().count;

    await db.collection('dashboard_stats').doc(today).set({
      date: today,
      totalGmv,
      totalOrders,
      averageOrderValue,
      pendingOrders,
      activeSellers,
      totalCustomers,
      categoryDistribution,
      topSellers,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`[dashboard] aggregated for ${today}: ${totalOrders} orders, ${totalGmv} GMV`);
  },
);
