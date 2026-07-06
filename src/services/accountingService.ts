import { db, doc, setDoc, getDoc } from './dbService';
import { Order } from '../types/erp';

export async function postOrderJournalEntries(order: Order): Promise<string> {
  const tenantId = order.tenantId || 'tenant-vcomm-prod-01';
  const orderTotal = Number(order.total || 0);
  const commission = Number(order.commissionFee || 0);

  // 1. Calculate Cost of Goods Sold (COGS)
  let totalCogs = 0;
  if (Array.isArray(order.items)) {
    for (const item of order.items) {
      try {
        const prodRef = doc(db, 'products', item.productId);
        const prodSnap = await getDoc(prodRef);
        let costPrice = 0;
        if (prodSnap.exists()) {
          costPrice = Number(prodSnap.data().costPrice || 0);
        }
        // Fallback to 60% of sale price if cost price is 0 or product not found
        if (costPrice <= 0) {
          costPrice = Number(item.price || 0) * 0.6;
        }
        totalCogs += costPrice * Number(item.quantity || 0);
      } catch (err) {
        console.warn(`[Accounting] Failed to get costPrice for ${item.productId}, fallback to 60%`, err);
        totalCogs += Number(item.price || 0) * 0.6 * Number(item.quantity || 0);
      }
    }
  }

  // 2. Build Journal Entry items
  // Revenue entry: Debit 1311 (Receivable) / Credit 5111 (Revenue) + Credit 3331 (VAT)
  const netRevenue = Math.round(orderTotal / 1.1);
  const vat = orderTotal - netRevenue;

  const journalEntryId = `je-order-complete-${order.id}-${Date.now()}`;
  const journalEntry: any = {
    id: journalEntryId,
    date: new Date().toISOString(),
    ref: order.id,
    description: `Hạch toán hoàn tất đơn hàng ${order.id}`,
    tenantId,
    items: [
      // Revenue
      { accountId: '1311', debit: orderTotal, credit: 0, partnerId: order.customerId || null },
      { accountId: '5111', debit: 0, credit: netRevenue },
      { accountId: '3331', debit: 0, credit: vat }
    ]
  };

  // COGS entry: Debit 632 / Credit 156
  if (totalCogs > 0) {
    journalEntry.items.push(
      { accountId: '632', debit: Math.round(totalCogs), credit: 0 },
      { accountId: '156', debit: 0, credit: Math.round(totalCogs) }
    );
  }

  // Commission entry: Debit 641 / Credit 3388
  if (commission > 0) {
    journalEntry.items.push(
      { accountId: '641', debit: commission, credit: 0 },
      { accountId: '3388', debit: 0, credit: commission, partnerId: order.sellerId || null }
    );
  }

  const docRef = doc(db, 'journal_entries', journalEntryId);
  await setDoc(docRef, journalEntry);
  console.log(`[Accounting] Auto-posted completed order ${order.id}: JE ID ${journalEntryId}`);
  return journalEntryId;
}

export async function postWithdrawalJournalEntries(withdrawal: {
  id: string;
  userId: string;
  userType: string;
  amount: number;
  tenantId?: string;
}): Promise<string> {
  const tenantId = withdrawal.tenantId || 'tenant-vcomm-prod-01';
  const amount = Number(withdrawal.amount || 0);

  const journalEntryId = `je-withdrawal-${withdrawal.id}-${Date.now()}`;
  const journalEntry: any = {
    id: journalEntryId,
    date: new Date().toISOString(),
    ref: withdrawal.id,
    description: `Hạch toán duyệt chi rút tiền ${withdrawal.id}`,
    tenantId,
    items: [
      // Debit 3388 (liability reduction) / Credit 1121 (Cash at Bank)
      { accountId: '3388', debit: amount, credit: 0, partnerId: withdrawal.userId },
      { accountId: '1121', debit: 0, credit: amount }
    ]
  };

  const docRef = doc(db, 'journal_entries', journalEntryId);
  await setDoc(docRef, journalEntry);
  console.log(`[Accounting] Auto-posted withdrawal ${withdrawal.id}: JE ID ${journalEntryId}`);
  return journalEntryId;
}
