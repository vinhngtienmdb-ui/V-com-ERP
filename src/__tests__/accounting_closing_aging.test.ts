import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db, addDoc, doc, setDoc, getDoc } from '../lib/firebase';
import { syncTransactionToMisa, unpostTransaction } from '../services/misaService';
import axios from 'axios';

vi.mock('axios');

// Direct Method Cash Flow statement calculation algorithm (replicated from Finance.tsx)
function calculateDirectCashFlow(displayEntries: any[]) {
  let cfInSales = 0;
  let cfInOther = 0;
  let cfOutSupplier = 0;
  let cfOutEmployee = 0;
  let cfOutTax = 0;
  let cfOutOther = 0;

  displayEntries.forEach(je => {
    if (!je.items || je.id.startsWith('JE-CLOSE-')) return;
    
    const hasCashBank = je.items.some((item: any) => item.accountId === '1111' || item.accountId === '1121');
    if (!hasCashBank) return;

    je.items.forEach((item: any) => {
      const isCashBank = item.accountId === '1111' || item.accountId === '1121';
      if (isCashBank) {
        const isDebit = item.debit > 0;
        const counterItems = je.items.filter((i: any) => isDebit ? i.credit > 0 : i.debit > 0);
        
        if (isDebit) {
          const hasSales = counterItems.some((i: any) => i.accountId.startsWith('5') || i.accountId === '1311');
          if (hasSales) {
            cfInSales += item.debit;
          } else {
            cfInOther += item.debit;
          }
        } else {
          const hasSupplier = counterItems.some((i: any) => i.accountId.startsWith('331') || i.accountId === '1561');
          const hasEmployee = counterItems.some((i: any) => i.accountId === '3341');
          const hasTax = counterItems.some((i: any) => i.accountId.startsWith('333'));
          
          if (hasSupplier) {
            cfOutSupplier += item.credit;
          } else if (hasEmployee) {
            cfOutEmployee += item.credit;
          } else if (hasTax) {
            cfOutTax += item.credit;
          } else {
            cfOutOther += item.credit;
          }
        }
      }
    });
  });

  const totalCfIn = cfInSales + cfInOther;
  const totalCfOut = cfOutSupplier + cfOutEmployee + cfOutTax + cfOutOther;
  const netCashFlow = totalCfIn - totalCfOut;

  return { cfInSales, cfInOther, totalCfIn, cfOutSupplier, cfOutEmployee, cfOutTax, cfOutOther, totalCfOut, netCashFlow };
}

// FIFO Accounts Receivable Aging analysis algorithm (replicated from Finance.tsx)
function calculateARAging(displayEntries: any[], today: Date = new Date()) {
  const customerAgingMap: Record<string, { partnerId: string, totalOutstanding: number, bucket0_30: number, bucket31_60: number, bucket61_90: number, bucketOver90: number }> = {};
  const arItems: any[] = [];
  
  displayEntries.forEach(je => {
    if (!je.items || je.id.startsWith('JE-CLOSE-')) return;
    je.items.forEach((item: any) => {
      if (item.accountId === '1311') {
        arItems.push({
          jeId: je.id,
          date: je.date,
          partnerId: item.partnerId || 'KHLE',
          debit: item.debit || 0,
          credit: item.credit || 0
        });
      }
    });
  });

  const partners = Array.from(new Set(arItems.map(item => item.partnerId)));

  partners.forEach(partnerId => {
    if (partnerId === 'SYSTEM') return;
    
    const partnerItems = arItems.filter(item => item.partnerId === partnerId);
    const debits = partnerItems.filter(item => item.debit > 0);
    const totalPaid = partnerItems.filter(item => item.credit > 0).reduce((sum, item) => sum + item.credit, 0);

    const parseDate = (dStr: string) => {
      if (!dStr) return new Date(0);
      const parts = dStr.split('/');
      if (parts.length === 3) {
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
      return new Date(dStr);
    };
    debits.sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());

    let remainingPaid = totalPaid;
    let totalOutstanding = 0;
    let bucket0_30 = 0;
    let bucket31_60 = 0;
    let bucket61_90 = 0;
    let bucketOver90 = 0;

    debits.forEach(inv => {
      const invAmount = inv.debit;
      let outstanding = 0;

      if (remainingPaid >= invAmount) {
        remainingPaid -= invAmount;
      } else {
        outstanding = invAmount - remainingPaid;
        remainingPaid = 0;
      }

      if (outstanding > 0) {
        totalOutstanding += outstanding;
        const invDate = parseDate(inv.date);
        const diffTime = Math.abs(today.getTime() - invDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 30) {
          bucket0_30 += outstanding;
        } else if (diffDays <= 60) {
          bucket31_60 += outstanding;
        } else if (diffDays <= 90) {
          bucket61_90 += outstanding;
        } else {
          bucketOver90 += outstanding;
        }
      }
    });

    if (totalOutstanding > 0 || totalPaid > 0) {
      customerAgingMap[partnerId] = {
        partnerId,
        totalOutstanding,
        bucket0_30,
        bucket31_60,
        bucket61_90,
        bucketOver90
      };
    }
  });

  return Object.values(customerAgingMap);
}

// Period closing entry generator logic (replicated from Finance.tsx)
function generateClosingEntry(closingMonth: number, closingYear: number, journalEntries: any[]) {
  const startOfMonth = new Date(closingYear, closingMonth - 1, 1);
  const endOfMonth = new Date(closingYear, closingMonth, 0);
  const startOfPeriodTime = startOfMonth.getTime();
  const endOfPeriodTime = endOfMonth.getTime();

  const currentPeriodEntries = journalEntries.filter(je => {
    if (je.id.startsWith('JE-CLOSE-')) return false;
    const parseDate = (dStr: string) => {
      if (!dStr) return new Date(0);
      const parts = dStr.split('/');
      if (parts.length === 3) {
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
      return new Date(dStr);
    };
    const jeTime = parseDate(je.date).getTime();
    return jeTime >= startOfPeriodTime && jeTime <= endOfPeriodTime;
  });

  if (currentPeriodEntries.length === 0) {
    throw new Error('Không tìm thấy giao dịch nào phát sinh');
  }

  let totalRevenue = 0;
  let totalCogs = 0;
  let totalSellingExpense = 0;
  let totalAdminExpense = 0;

  currentPeriodEntries.forEach(je => {
    if (!je.items) return;
    je.items.forEach((item: any) => {
      const accId = item.accountId || '';
      if (accId.startsWith('5')) {
        totalRevenue += (item.credit || 0) - (item.debit || 0);
      } else if (accId.startsWith('632')) {
        totalCogs += (item.debit || 0) - (item.credit || 0);
      } else if (accId === '6421') {
        totalSellingExpense += (item.debit || 0) - (item.credit || 0);
      } else if (accId === '6422') {
        totalAdminExpense += (item.debit || 0) - (item.credit || 0);
      }
    });
  });

  const totalExpenses = totalCogs + totalSellingExpense + totalAdminExpense;
  const netProfit = totalRevenue - totalExpenses;
  const closeItems: any[] = [];

  // A. Kết chuyển doanh thu sang 911
  if (totalRevenue > 0) {
    closeItems.push({ accountId: '5111', debit: totalRevenue, credit: 0, partnerId: 'SYSTEM' });
    closeItems.push({ accountId: '911', debit: 0, credit: totalRevenue, partnerId: 'SYSTEM' });
  }

  // B. Kết chuyển chi phí sang 911
  if (totalCogs > 0) {
    closeItems.push({ accountId: '911', debit: totalCogs, credit: 0, partnerId: 'SYSTEM' });
    closeItems.push({ accountId: '632', debit: 0, credit: totalCogs, partnerId: 'SYSTEM' });
  }
  if (totalSellingExpense > 0) {
    closeItems.push({ accountId: '911', debit: totalSellingExpense, credit: 0, partnerId: 'SYSTEM' });
    closeItems.push({ accountId: '6421', debit: 0, credit: totalSellingExpense, partnerId: 'SYSTEM' });
  }
  if (totalAdminExpense > 0) {
    closeItems.push({ accountId: '911', debit: totalAdminExpense, credit: 0, partnerId: 'SYSTEM' });
    closeItems.push({ accountId: '6422', debit: 0, credit: totalAdminExpense, partnerId: 'SYSTEM' });
  }

  // C. Kết chuyển lợi nhuận ròng từ 911 sang 4212
  if (netProfit > 0) {
    closeItems.push({ accountId: '911', debit: netProfit, credit: 0, partnerId: 'SYSTEM' });
    closeItems.push({ accountId: '4212', debit: 0, credit: netProfit, partnerId: 'SYSTEM' });
  } else if (netProfit < 0) {
    const absLoss = Math.abs(netProfit);
    closeItems.push({ accountId: '4212', debit: absLoss, credit: 0, partnerId: 'SYSTEM' });
    closeItems.push({ accountId: '911', debit: 0, credit: absLoss, partnerId: 'SYSTEM' });
  }

  return {
    id: `JE-CLOSE-${closingYear}-${String(closingMonth).padStart(2, '0')}`,
    date: endOfMonth.toISOString(),
    ref: `CLOSED-${closingMonth}/${closingYear}`,
    description: `Kết chuyển cuối kỳ khóa sổ tự động - Tháng ${closingMonth}/${closingYear}`,
    tenantId: 'tenant-vcomm-prod-01',
    items: closeItems,
    netProfit
  };
}

describe('Advanced Accounting Extensions (Closing, Lock Date, Cash Flow, FIFO Aging)', () => {
  beforeEach(() => {
    vi.mocked(doc).mockImplementation((db: any, col: string, id: string) => {
      return { path: `${col}/${id}`, id } as any;
    });
    vi.clearAllMocks();
  });

  describe('1. Automated Closing Period & Transfer Entries', () => {
    it('nên tự động kết chuyển doanh thu (5111), chi phí (632, 6421, 6422) sang 911 và lợi nhuận ròng sang 4212', () => {
      const mockJournalEntries = [
        {
          id: 'JE-01',
          date: '15/12/2023',
          items: [
            { accountId: '1311', debit: 110, credit: 0 },
            { accountId: '5111', debit: 0, credit: 100 } // Doanh thu: 100
          ]
        },
        {
          id: 'JE-02',
          date: '20/12/2023',
          items: [
            { accountId: '632', debit: 40, credit: 0 }, // Giá vốn: 40
            { accountId: '1561', debit: 0, credit: 40 }
          ]
        },
        {
          id: 'JE-03',
          date: '22/12/2023',
          items: [
            { accountId: '6421', debit: 10, credit: 0 }, // Chi phí bán hàng: 10
            { accountId: '1111', debit: 0, credit: 10 }
          ]
        },
        {
          id: 'JE-04',
          date: '25/12/2023',
          items: [
            { accountId: '6422', debit: 20, credit: 0 }, // Chi phí QLDN: 20
            { accountId: '1111', debit: 0, credit: 20 }
          ]
        }
      ];

      // Run closing for Month 12, Year 2023
      const closeEntry = generateClosingEntry(12, 2023, mockJournalEntries);

      // Verify generated entry balance: Sum Debits = Sum Credits
      const sumDebits = closeEntry.items.reduce((sum, item) => sum + item.debit, 0);
      const sumCredits = closeEntry.items.reduce((sum, item) => sum + item.credit, 0);
      expect(sumDebits).toBe(sumCredits);
      expect(sumDebits).toBe(200); // 100 (5111) + 40 (911 -> 632) + 10 (911 -> 6421) + 20 (911 -> 6422) + 30 (911 -> 4212) = 200

      // Net profit: 100 - (40 + 10 + 20) = 30
      expect(closeEntry.netProfit).toBe(30);

      // Verify transfers
      // Doanh thu Nợ 5111 / Có 911: 100
      expect(closeEntry.items).toContainEqual(expect.objectContaining({ accountId: '5111', debit: 100, credit: 0 }));
      expect(closeEntry.items).toContainEqual(expect.objectContaining({ accountId: '911', debit: 0, credit: 100 }));

      // Giá vốn Nợ 911 / Có 632: 40
      expect(closeEntry.items).toContainEqual(expect.objectContaining({ accountId: '911', debit: 40, credit: 0 }));
      expect(closeEntry.items).toContainEqual(expect.objectContaining({ accountId: '632', debit: 0, credit: 40 }));

      // Lợi nhuận ròng Nợ 911 / Có 4212: 30
      expect(closeEntry.items).toContainEqual(expect.objectContaining({ accountId: '911', debit: 30, credit: 0 }));
      expect(closeEntry.items).toContainEqual(expect.objectContaining({ accountId: '4212', debit: 0, credit: 30 }));
    });
  });

  describe('2. Lock Date Gate Enforcement (misaService)', () => {
    it('nên chặn Ghi sổ Kế toán và Hủy ghi sổ khi chứng từ thuộc thời gian đã khóa sổ', async () => {
      // Mock tenant_settings config: Lock date is 2023-12-31
      vi.mocked(getDoc).mockImplementation((ref: any) => {
        if (ref.id === 'config') {
          return Promise.resolve({
            exists: () => true,
            data: () => ({ closingLockDate: '2023-12-31' })
          }) as any;
        }
        if (ref.id === 'tx-locked') {
          return Promise.resolve({
            exists: () => true,
            data: () => ({ id: 'tx-locked', date: '30/12/2023', amount: 100000, type: 'income' })
          }) as any;
        }
        if (ref.id === 'tx-unlocked') {
          return Promise.resolve({
            exists: () => true,
            data: () => ({ id: 'tx-unlocked', date: '01/01/2024', amount: 100000, type: 'income' })
          }) as any;
        }
        return Promise.resolve({ exists: () => false }) as any;
      });

      // 1. syncTransactionToMisa on a locked transaction (30/12/2023 <= 31/12/2023) should throw error
      await expect(syncTransactionToMisa('tx-locked')).rejects.toThrow('thuộc kỳ kế toán đã khóa sổ');

      // 2. unpostTransaction on a locked transaction should throw error
      await expect(unpostTransaction('tx-locked')).rejects.toThrow('thuộc kỳ kế toán đã khóa sổ');

      // 3. syncTransactionToMisa on an unlocked transaction (01/01/2024 > 31/12/2023) should NOT throw lock error
      vi.mocked(axios.post).mockResolvedValue({ data: { status: 'success' } });
      await expect(syncTransactionToMisa('tx-unlocked')).resolves.not.toThrow('thuộc kỳ kế toán đã khóa sổ');
    });
  });

  describe('3. Webhook Lock Date Check (useSepayListener)', () => {
    it('nên chặn/bỏ qua webhook tự động hạch toán nếu giao dịch SePay rơi vào ngày đã khóa sổ', async () => {
      const mockEvents = [
        { id: 955, transactionDate: '2023-12-25T10:00:00Z', transactionContent: 'IPOS_PAY_ORD955', transferAmount: 150000, bankAccountNumber: '123' }
      ];
      vi.mocked(axios.get).mockResolvedValue({ data: { events: mockEvents } });

      let checkCallback: any = null;
      vi.spyOn(global, 'setInterval').mockImplementation((cb: any) => {
        checkCallback = cb;
        return 999 as any;
      });

      // Mock getDoc to return lock date configuration
      vi.mocked(getDoc).mockImplementation((ref: any) => {
        if (ref.id === 'config') {
          return Promise.resolve({
            exists: () => true,
            data: () => ({ closingLockDate: '2023-12-31' }) // Locked before Dec 31
          }) as any;
        }
        return Promise.resolve({ exists: () => false }) as any;
      });

      const { useSepayListener } = await import('../hooks/useSepayListener');
      
      // Mount mock listener
      const { createRoot } = await import('react-dom/client');
      const container = document.createElement('div');
      const root = createRoot(container);
      const React = await import('react');
      const TestComp = () => {
        useSepayListener();
        return null;
      };
      root.render(React.createElement(TestComp));
      
      // Wait longer (100ms) for React to fully run useEffect & setInterval
      await new Promise(resolve => setTimeout(resolve, 100));

      // Clear all firebase write spy calls
      const { addDoc: fbAddDoc, setDoc: fbSetDoc } = await import('../lib/firebase');
      vi.mocked(fbAddDoc).mockClear();
      vi.mocked(fbSetDoc).mockClear();

      // Trigger webhook callback processing
      expect(checkCallback).not.toBeNull();
      await checkCallback();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify that no transaction or journal entries were added/written since it is locked
      expect(fbAddDoc).not.toHaveBeenCalled();
      expect(fbSetDoc).not.toHaveBeenCalled();
    });
  });

  describe('4. Direct Method Cash Flow Statement', () => {
    it('nên tổng hợp dòng tiền vào/ra chính xác dựa trên tài khoản đối ứng của 1111/1121', () => {
      const mockJournalEntries = [
        {
          id: 'JE-CF-01',
          date: '10/12/2023',
          items: [
            { accountId: '1121', debit: 200, credit: 0 }, // Tiền gửi ngân hàng vào: 200
            { accountId: '1311', debit: 0, credit: 200 } // Đối ứng 1311 -> Thu nợ / Bán hàng
          ]
        },
        {
          id: 'JE-CF-02',
          date: '12/12/2023',
          items: [
            { accountId: '1111', debit: 50, credit: 0 },  // Tiền mặt vào: 50
            { accountId: '3388', debit: 0, credit: 50 }  // Đối ứng 3388 -> Tiền thu khác
          ]
        },
        {
          id: 'JE-CF-03',
          date: '14/12/2023',
          items: [
            { accountId: '331', debit: 120, credit: 0 },
            { accountId: '1121', debit: 0, credit: 120 } // Chi tiền đối ứng 331 -> Chi trả NCC
          ]
        },
        {
          id: 'JE-CF-04',
          date: '16/12/2023',
          items: [
            { accountId: '3341', debit: 60, credit: 0 },
            { accountId: '1111', debit: 0, credit: 60 }  // Chi tiền đối ứng 3341 -> Chi trả NLĐ
          ]
        },
        {
          id: 'JE-CF-05',
          date: '18/12/2023',
          items: [
            { accountId: '33311', debit: 20, credit: 0 },
            { accountId: '1121', debit: 0, credit: 20 }  // Chi tiền đối ứng 33311 -> Thuế
          ]
        },
        {
          id: 'JE-CF-06',
          date: '20/12/2023',
          items: [
            { accountId: '6422', debit: 15, credit: 0 },
            { accountId: '1121', debit: 0, credit: 15 }  // Chi tiền đối ứng 6422 -> Vận hành khác
          ]
        }
      ];

      const cf = calculateDirectCashFlow(mockJournalEntries);

      expect(cf.cfInSales).toBe(200);
      expect(cf.cfInOther).toBe(50);
      expect(cf.totalCfIn).toBe(250);

      expect(cf.cfOutSupplier).toBe(120);
      expect(cf.cfOutEmployee).toBe(60);
      expect(cf.cfOutTax).toBe(20);
      expect(cf.cfOutOther).toBe(15);
      expect(cf.totalCfOut).toBe(215);

      expect(cf.netCashFlow).toBe(35);
    });
  });

  describe('5. FIFO Accounts Receivable Aging', () => {
    it('nên phân bổ tiền đã trả vào hóa đơn cũ nhất (FIFO) và phân loại tuổi nợ chính xác', () => {
      // Setup current test date to a fixed value: 2023-12-15
      const testToday = new Date('2023-12-15');

      const mockJournalEntries = [
        {
          id: 'JE-AG-01',
          date: '10/09/2023', // Day 96 ago (>90 days bucket)
          items: [
            { accountId: '1311', debit: 100, credit: 0, partnerId: 'CUST-A' }, // Debit: 100
            { accountId: '5111', debit: 0, credit: 100 }
          ]
        },
        {
          id: 'JE-AG-02',
          date: '20/10/2023', // Day 56 ago (31-60 days bucket)
          items: [
            { accountId: '1311', debit: 150, credit: 0, partnerId: 'CUST-A' }, // Debit: 150
            { accountId: '5111', debit: 0, credit: 150 }
          ]
        },
        {
          id: 'JE-AG-03',
          date: '01/12/2023', // Day 14 ago (0-30 days bucket)
          items: [
            { accountId: '1311', debit: 200, credit: 0, partnerId: 'CUST-A' }, // Debit: 200
            { accountId: '5111', debit: 0, credit: 200 }
          ]
        },
        {
          id: 'JE-AG-04',
          date: '05/12/2023', // Payment of 180
          items: [
            { accountId: '1121', debit: 180, credit: 0 },
            { accountId: '1311', debit: 0, credit: 180, partnerId: 'CUST-A' }  // Credit: 180
          ]
        }
      ];

      // Running FIFO Aging
      // Total Debits = 100 + 150 + 200 = 450
      // Total Payments = 180
      // Outstanding balance = 450 - 180 = 270
      // FIFO Payoff order:
      // First paid off: 100 of inv 1 (fully paid, 0 outstanding remaining) -> remaining payment = 80
      // Second paid off: 80 of inv 2 (outstanding remaining = 150 - 80 = 70) -> remaining payment = 0
      // Third paid off: 0 of inv 3 (outstanding remaining = 200) -> remaining payment = 0
      // Buckets classification:
      // - inv 1 (10/09/2023, >90 days): 0 outstanding -> bucketOver90 = 0
      // - inv 2 (20/10/2023, 56 days ago -> 31-60 days): 70 outstanding -> bucket31_60 = 70
      // - inv 3 (01/12/2023, 14 days ago -> 0-30 days): 200 outstanding -> bucket0_30 = 200
      
      const aging = calculateARAging(mockJournalEntries, testToday);
      expect(aging.length).toBe(1);

      const custA = aging[0];
      expect(custA.partnerId).toBe('CUST-A');
      expect(custA.totalOutstanding).toBe(270);
      expect(custA.bucketOver90).toBe(0);
      expect(custA.bucket61_90).toBe(0);
      expect(custA.bucket31_60).toBe(70);
      expect(custA.bucket0_30).toBe(200);
    });
  });
});
