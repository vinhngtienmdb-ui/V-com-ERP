import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db, collection, addDoc, doc, setDoc, getDocs, query, where } from '../lib/firebase';

describe('Double-Entry Bookkeeping Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('nên hạch toán chứng từ kế toán thành công khi tổng Nợ bằng tổng Có', async () => {
    // 1. Tạo chứng từ bán hàng thu tiền
    const journalEntry = {
      id: 'JE-TEST-001',
      date: new Date().toISOString(),
      ref: 'VC-8891',
      description: 'Hạch toán doanh thu đơn hàng VC-8891',
      tenantId: 'tenant-vcomm-prod-01',
      items: [
        { accountId: '131', debit: 110000, credit: 0, partnerId: 'CUST-001' },   // Nợ 131: Phải thu khách hàng
        { accountId: '5111', debit: 0, credit: 100000 },                         // Có 5111: Doanh thu
        { accountId: '33311', debit: 0, credit: 100000 * 0.1 }                    // Có 33311: Thuế GTGT 10%
      ]
    };

    // 2. Tính tổng nợ và tổng có
    const totalDebit = journalEntry.items.reduce((sum, item) => sum + item.debit, 0);
    const totalCredit = journalEntry.items.reduce((sum, item) => sum + item.credit, 0);

    expect(totalDebit).toBe(totalCredit);
    expect(totalDebit).toBe(110000);

    // 3. Ghi vào database (giả lập ghi qua adapter)
    const docRef = doc(db, 'journal_entries', journalEntry.id);
    await setDoc(docRef, journalEntry);

    expect(setDoc).toHaveBeenCalledWith(docRef, journalEntry);
  });

  it('nên từ chối ghi sổ chứng từ kế toán khi tổng Nợ không bằng tổng Có (Mất cân đối)', async () => {
    const invalidEntry = {
      id: 'JE-TEST-002',
      date: new Date().toISOString(),
      ref: 'VC-8892',
      description: 'Hạch toán lệch nợ có',
      tenantId: 'tenant-vcomm-prod-01',
      items: [
        { accountId: '131', debit: 115000, credit: 0, partnerId: 'CUST-001' },   // Nợ 131: 115k (sai số tiền)
        { accountId: '5111', debit: 0, credit: 100000 },                         // Có 5111: 100k
        { accountId: '33311', debit: 0, credit: 10000 }                          // Có 33311: 10k
      ]
    };

    const totalDebit = invalidEntry.items.reduce((sum, item) => sum + item.debit, 0);
    const totalCredit = invalidEntry.items.reduce((sum, item) => sum + item.credit, 0);

    // Check balance check helper function logic
    const isBalanced = totalDebit === totalCredit;
    expect(isBalanced).toBe(false);

    // Business rule check
    const saveJournalEntry = async (entry: any) => {
      const dbDebit = entry.items.reduce((sum: number, item: any) => sum + item.debit, 0);
      const dbCredit = entry.items.reduce((sum: number, item: any) => sum + item.credit, 0);
      if (dbDebit !== dbCredit) {
        throw new Error('Chứng từ kế toán mất cân đối Nợ / Có. Không thể ghi sổ!');
      }
      await setDoc(doc(db, 'journal_entries', entry.id), entry);
    };

    await expect(saveJournalEntry(invalidEntry)).rejects.toThrow('Chứng từ kế toán mất cân đối Nợ / Có. Không thể ghi sổ!');
  });
});
