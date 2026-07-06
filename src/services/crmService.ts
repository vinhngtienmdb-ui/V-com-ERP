import { db, doc, getDoc, updateDoc, addDoc, getDocs, collection, query, where } from './dbService';

export async function calculateRfmScores(customerId: string): Promise<any> {
  try {
    const ordersRef = collection(db, 'orders');
    // Fetch all orders of this customer
    const q = query(ordersRef, where('customerId', '==', customerId));
    const snapshot = await getDocs(q);

    const completedOrders = snapshot.docs
      .map((d: any) => ({ id: d.id, ...d.data() }))
      .filter((o: any) => o.status === 'completed' || o.status === 'delivered');

    if (completedOrders.length === 0) {
      return null;
    }

    // 1. Calculate Recency
    const now = new Date();
    const orderDates = completedOrders.map((o: any) => new Date(o.date));
    const mostRecentDate = new Date(Math.max(...orderDates.map(d => d.getTime())));
    const diffTime = Math.abs(now.getTime() - mostRecentDate.getTime());
    const recency = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Days since last order

    // 2. Calculate Frequency
    const frequency = completedOrders.length;

    // 3. Calculate Monetary
    const monetary = completedOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);

    // 4. Determine Tier
    let tier = 'Bronze';
    if (monetary >= 50000000) {
      tier = 'Diamond';
    } else if (monetary >= 15000000) {
      tier = 'Platinum';
    } else if (monetary >= 5000000) {
      tier = 'Gold';
    } else if (monetary >= 1000000) {
      tier = 'Silver';
    }

    // 5. Update Customer profile
    const customerRef = doc(db, 'customers', customerId);
    const updatePayload = {
      rfmScore: { recency, frequency, monetary },
      tier,
      totalSpent: monetary,
      orderCount: frequency,
      lastOrderDate: mostRecentDate.toLocaleDateString('vi-VN')
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
    const now = new Date();
    let slaHours = 24; // default medium
    if (priority === 'urgent') {
      slaHours = 1;
    } else if (priority === 'high') {
      slaHours = 4;
    } else if (priority === 'low') {
      slaHours = 48;
    }

    const slaDeadline = new Date(now.getTime() + slaHours * 60 * 60 * 1000).toISOString();

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
