import { onSchedule } from 'firebase-functions/v2/scheduler';
import admin from 'firebase-admin';
import { REGION } from './config.js';

/**
 * Weekly summary: chạy 9:00 sáng thứ 2 ICT, tổng hợp tuần trước.
 * Ghi /weekly_summaries/{YYYY-Www} để admin xem trên Dashboard.
 *
 * Metrics:
 *   - GMV tuần, số đơn delivered, AOV
 *   - So sánh với tuần trước (% change)
 *   - Top 5 seller, top 5 product (theo doanh thu)
 *   - Số seller mới + active, số customer mới
 *   - Số đơn returning + tỉ lệ return
 *   - Số commission affiliate đã trả
 *   - Số điểm loyalty đã cấp
 */
export const weeklySummary = onSchedule(
  { region: REGION, schedule: '0 9 * * 1', timeZone: 'Asia/Ho_Chi_Minh' },
  async () => {
    const db = admin.firestore();
    const now = new Date();
    // Tuần trước: thứ 2 → CN
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - now.getDay() - 6);
    lastMonday.setHours(0, 0, 0, 0);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 7);

    // Week key: YYYY-Www (ISO week)
    const year = lastMonday.getFullYear();
    const firstJan = new Date(year, 0, 1);
    const weekNum = Math.ceil(((lastMonday.getTime() - firstJan.getTime()) / 86400000 + firstJan.getDay() + 1) / 7);
    const weekKey = `${year}-W${String(weekNum).padStart(2, '0')}`;

    console.log(`[weeklySummary] processing ${weekKey} (${lastMonday.toISOString()} → ${lastSunday.toISOString()})`);

    // Orders trong tuần
    const ordersSnap = await db.collection('orders')
      .where('createdAt', '>=', lastMonday)
      .where('createdAt', '<', lastSunday)
      .get();

    const deliveredOrders = ordersSnap.docs.filter(d => {
      const s = d.data().status;
      return s === 'delivered' || s === 'completed';
    });
    const returningOrders = ordersSnap.docs.filter(d => {
      const s = d.data().status;
      return s === 'returning' || s === 'returned';
    });

    const totalGmv = deliveredOrders.reduce((s, d) => s + (d.data().total ?? 0), 0);
    const totalOrders = deliveredOrders.length;
    const aov = totalOrders > 0 ? Math.round(totalGmv / totalOrders) : 0;
    const returnRate = totalOrders > 0 ? Number((returningOrders.length / totalOrders).toFixed(3)) : 0;

    // Tuần trước (cho so sánh)
    const prevMonday = new Date(lastMonday);
    prevMonday.setDate(lastMonday.getDate() - 7);
    const prevOrdersSnap = await db.collection('orders')
      .where('createdAt', '>=', prevMonday)
      .where('createdAt', '<', lastMonday)
      .get();
    const prevDelivered = prevOrdersSnap.docs.filter(d => ['delivered', 'completed'].includes(d.data().status));
    const prevGmv = prevDelivered.reduce((s, d) => s + (d.data().total ?? 0), 0);
    const gmvChange = prevGmv > 0 ? Number(((totalGmv - prevGmv) / prevGmv).toFixed(3)) : 0;

    // Top sellers by GMV
    const sellerGmvMap = new Map<string, { name: string; gmv: number; orders: number }>();
    for (const d of deliveredOrders) {
      const sellerId = d.data().sellerId;
      if (!sellerId) continue;
      const cur = sellerGmvMap.get(sellerId) ?? { name: '', gmv: 0, orders: 0 };
      cur.gmv += d.data().total ?? 0;
      cur.orders += 1;
      sellerGmvMap.set(sellerId, cur);
    }
    // Lấy tên seller
    const topSellersIds = Array.from(sellerGmvMap.entries())
      .sort((a, b) => b[1].gmv - a[1].gmv).slice(0, 5).map(([id]) => id);
    if (topSellersIds.length > 0) {
      for (const sid of topSellersIds) {
        const s = await db.collection('sellers').doc(sid).get();
        const item = sellerGmvMap.get(sid)!;
        item.name = s.data()?.name ?? sid;
      }
    }
    const topSellers = Array.from(sellerGmvMap.entries())
      .sort((a, b) => b[1].gmv - a[1].gmv).slice(0, 5)
      .map(([id, v]) => ({ sellerId: id, name: v.name, gmv: v.gmv, orders: v.orders }));

    // Số seller mới + customer mới trong tuần
    const newSellersSnap = await db.collection('sellers')
      .where('joinedAt', '>=', lastMonday).where('joinedAt', '<', lastSunday).get();
    const activeSellersSnap = await db.collection('sellers')
      .where('status', 'in', ['active', 'verified']).get();

    // Affiliate commission đã trả trong tuần
    const commissionsSnap = await db.collection('transactions')
      .where('type', '==', 'commission')
      .where('createdAt', '>=', lastMonday).where('createdAt', '<', lastSunday)
      .get();
    const totalCommissionPaid = commissionsSnap.docs.reduce((s, d) => s + Math.abs(d.data().amount ?? 0), 0);

    // Loyalty points cấp trong tuần
    const pointsSnap = await db.collection('point_transactions')
      .where('type', '==', 'earn_order')
      .where('createdAt', '>=', lastMonday).where('createdAt', '<', lastSunday)
      .get();
    const totalPointsAwarded = pointsSnap.docs.reduce((s, d) => s + (d.data().points ?? 0), 0);

    await db.collection('weekly_summaries').doc(weekKey).set({
      weekKey,
      weekStart: lastMonday.toISOString(),
      weekEnd: lastSunday.toISOString(),
      totalGmv,
      totalOrders,
      aov,
      gmvChangeWoW: gmvChange,
      returningOrdersCount: returningOrders.length,
      returnRate,
      topSellers,
      newSellersCount: newSellersSnap.size,
      activeSellersCount: activeSellersSnap.size,
      totalCommissionPaid,
      totalPointsAwarded,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[weeklySummary] ${weekKey}: GMV=${totalGmv}, orders=${totalOrders}, WoW=${(gmvChange * 100).toFixed(1)}%`);
  },
);
