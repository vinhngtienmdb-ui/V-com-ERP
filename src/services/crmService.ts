import { db, doc, getDoc, updateDoc, addDoc, getDocs, collection, query, where } from './dbService';
import {
  computeRfmFromOrders,
  rfmTierOf,
  rfmSegmentOf,
  computeSlaDeadline,
} from './crmTicketService';

/**
 * GĐ 4.6 — các hàm RFM/SLA tính TOÁN đã chuyển sang `crmTicketService.ts`
 * (module thuần, có test) để:
 *   · RFM không còn bị tính ở 2 nơi với 2 kết quả khác nhau (xưa có thêm logic
 *     rải rác trong Customers.tsx)
 *   · SLA tính theo GIỜ HÀNH CHÍNH thay vì cộng giờ thực (T6 16:00 + 4h
 *     từng ra T6 20:00 — ngoài giờ làm việc, vô nghĩa với tổng đài)
 * File này chỉ giữ phần ĐỌC/GHI DB để không phá vỡ nơi đang gọi (Orders.tsx).
 */

export async function calculateRfmScores(customerId: string): Promise<any> {
  try {
    const ordersRef = collection(db, 'orders');
    // Fetch all orders of this customer
    const q = query(ordersRef, where('customerId', '==', customerId));
    const snapshot = await getDocs(q);

    const orders = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    // Thuật toán RFM dùng chung (đã có test riêng trong crmTicketService.test.ts)
    const rfm = computeRfmFromOrders(orders);
    if (!rfm) {
      return null;
    }

    const { recency, frequency, monetary } = rfm;
    const tier = rfmTierOf(monetary);
    const segment = rfmSegmentOf(rfm, tier);

    // Ngày ĐƠN GẦN NHẤT (lấy trực tiếp, không suy ngược từ recency — sẽ sai lệch
    // do làm tròn số ngày).
    const counted = orders
      .map((o: any) => new Date(o.date))
      .filter((d: Date) => !Number.isNaN(d.getTime()));
    const lastOrderDate = new Date(Math.max(...counted.map((d: Date) => d.getTime())));

    // 3. Update Customer profile
    const customerRef = doc(db, 'customers', customerId);
    const updatePayload = {
      rfmScore: { recency, frequency, monetary },
      tier,
      segment,
      totalSpent: monetary,
      orderCount: frequency,
      lastOrderDate: lastOrderDate.toLocaleDateString('vi-VN')
    };

    await updateDoc(customerRef, updatePayload);
    console.log(`[CRM-RFM] Recalculated RFM for customer ${customerId}: Recency ${recency}d, Frequency ${frequency}, Monetary ${monetary}đ -> Tier: ${tier}`);
    return updatePayload;
  } catch (err) {
    console.error(`[CRM-RFM] Failed to calculate RFM for ${customerId}:`, err);
    throw err;
  }
}

export async function addLoyaltyPoints(
  customerId: string,
  pointsChange: number,
  transactionType: 'earn' | 'spend' | 'refund' | 'expire',
  description: string,
  referenceType?: string,
  referenceId?: string
): Promise<number> {
  try {
    const tenantId = 'tenant-vcomm-prod-01';
    
    // 1. Log transaction in loyalty_points_ledger
    const ledgerRef = collection(db, 'loyalty_points_ledger');
    await addDoc(ledgerRef, {
      customerId,
      pointsChange,
      transactionType,
      description,
      referenceType: referenceType || null,
      referenceId: referenceId || null,
      tenantId,
      createdAt: new Date().toISOString()
    });

    // 2. Fetch current customer points balance
    const customerRef = doc(db, 'customers', customerId);
    const customerSnap = await getDoc(customerRef);
    let currentPoints = 0;
    if (customerSnap.exists()) {
      currentPoints = Number(customerSnap.data().points || 0);
    }

    const newPoints = Math.max(0, currentPoints + pointsChange);

    // 3. Update customer cached points field
    await updateDoc(customerRef, {
      points: newPoints
    });

    console.log(`[CRM-Loyalty] Customer ${customerId} points balance updated: ${currentPoints} -> ${newPoints} (${pointsChange >= 0 ? '+' : ''}${pointsChange} points)`);
    return newPoints;
  } catch (err) {
    console.error(`[CRM-Loyalty] Failed to add loyalty points for ${customerId}:`, err);
    throw err;
  }
}

export async function createSupportTicket(
  customerId: string,
  subject: string,
  priority: 'low' | 'medium' | 'high' | 'urgent',
  type: 'complaint' | 'inquiry' | 'refund' | 'feedback'
): Promise<any> {
  try {
    const tenantId = 'tenant-vcomm-prod-01';

    // 1. Fetch customer name
    const customerRef = doc(db, 'customers', customerId);
    const customerSnap = await getDoc(customerRef);
    const customerName = customerSnap.exists() ? customerSnap.data().name : 'Khách hàng vãng lai';

    // 2. Calculate SLA Deadline based on priority
    // ⚠️ GĐ 4.6: ĐỔI từ GIỜ THỰC sang GIỜ HÀNH CHÍNH. Cách cũ `now + 24h` cho ra
    // hạn rơi vào nửa đêm/cuối tuần — KPI SLA của tổng đài không bao giờ đúng.
    const now = new Date();
    const slaDeadline = computeSlaDeadline(now, priority).toISOString();

    // 3. Create ticket
    const ticketRef = collection(db, 'support_tickets');
    const newTicket = {
      customerId,
      customerName,
      subject,
      status: 'open',
      priority,
      type,
      slaDeadline,
      tenantId,
      createdAt: now.toISOString()
    };

    const docRef = await addDoc(ticketRef, newTicket);
    console.log(`[CRM-Ticket] Created ticket ${docRef.id} for customer ${customerName}: Priority ${priority}, SLA Deadline ${slaDeadline}`);
    return { id: docRef.id, ...newTicket };
  } catch (err) {
    console.error('[CRM-Ticket] Failed to create support ticket:', err);
    throw err;
  }
}
