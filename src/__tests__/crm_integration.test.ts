import { describe, it, expect } from 'vitest';

// Define the Customer interface structure
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  walletBalance?: number;
  promoBalance?: number;
  totalSpent: number;
  orderCount: number;
}

// Integration helper functions mirroring Customers.tsx logic
function filterCustomerTransactions(customer: Customer, transactions: any[]) {
  return transactions.filter(t => 
    (t.description && t.description.toLowerCase().includes(customer.name.toLowerCase())) ||
    (t.accountingObjectCode && t.accountingObjectCode === customer.id)
  );
}

function filterCustomerContracts(customer: Customer, contracts: any[]) {
  return contracts.filter(c => 
    c.party && (
      c.party.toLowerCase().includes(customer.name.toLowerCase()) || 
      customer.name.toLowerCase().includes(c.party.toLowerCase())
    )
  );
}

describe('CRM 360-degree Multi-Service Linking Logic', () => {
  const mockCustomer: Customer = {
    id: 'CUST-001',
    name: 'Thời Trang H&M Vietnam',
    email: 'hm@vietnam.com',
    phone: '0987654321',
    walletBalance: 25000000,
    promoBalance: 3000000,
    totalSpent: 45000000,
    orderCount: 12
  };

  describe('Ledger Financial Transactions Linking', () => {
    it('should link transactions by containing customer name in description', () => {
      const mockTransactions = [
        { id: 'TX-01', description: 'Thanh toán tiền mua hàng cho Thời Trang H&M Vietnam tháng 5', amount: 50000000 },
        { id: 'TX-02', description: 'Chi phí văn phòng phẩm', amount: 200000 }
      ];

      const linked = filterCustomerTransactions(mockCustomer, mockTransactions);
      expect(linked).toHaveLength(1);
      expect(linked[0].id).toBe('TX-01');
    });

    it('should link transactions by matching customer ID as accounting object code', () => {
      const mockTransactions = [
        { id: 'TX-03', description: 'Chuyển khoản B2B', accountingObjectCode: 'CUST-001', amount: 120000000 },
        { id: 'TX-04', description: 'Chuyển khoản B2B', accountingObjectCode: 'CUST-999', amount: 15000000 }
      ];

      const linked = filterCustomerTransactions(mockCustomer, mockTransactions);
      expect(linked).toHaveLength(1);
      expect(linked[0].id).toBe('TX-03');
    });
  });

  describe('B2B Contracts Linking', () => {
    it('should link contracts by matching party name partially', () => {
      const mockContracts = [
        { id: 'CTR-01', title: 'Hợp đồng nguyên tắc H&M', party: 'H&M Vietnam' }, // Customer name contains party
        { id: 'CTR-02', title: 'Hợp đồng Thời Trang H&M Vietnam', party: 'Công ty Thời Trang H&M Vietnam' }, // Party contains customer name
        { id: 'CTR-03', title: 'Hợp đồng đối tác khác', party: 'Công ty ABC' }
      ];

      const linked = filterCustomerContracts(mockCustomer, mockContracts);
      expect(linked).toHaveLength(2);
      expect(linked.map(c => c.id)).toContain('CTR-01');
      expect(linked.map(c => c.id)).toContain('CTR-02');
    });
  });
});
