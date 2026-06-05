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
function filterCustomerLeases(customer: Customer, leases: any[]) {
  return leases.filter(l => 
    (l.phone && l.phone === customer.phone) || 
    (l.email && l.email.toLowerCase() === customer.email.toLowerCase())
  );
}

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

function findCustomerSeller(customer: Customer, sellers: any[]) {
  return sellers.find(s => 
    s.sellerName && (
      s.sellerName.toLowerCase().includes(customer.name.toLowerCase()) || 
      customer.name.toLowerCase().includes(s.sellerName.toLowerCase())
    )
  );
}

function filterCustomerPayouts(seller: any, payouts: any[]) {
  return seller 
    ? payouts.filter(p => p.sellerId === seller.sellerId)
    : [];
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

  describe('Device Leasing Linking', () => {
    it('should link lease by matching phone number', () => {
      const mockLeases = [
        { id: 'L-01', deviceModel: 'iPhone 15 Pro', phone: '0987654321', email: 'other@test.com' },
        { id: 'L-02', deviceModel: 'Samsung S24 Ultra', phone: '0123456789', email: 'hm@vietnam.com' }
      ];

      const linked = filterCustomerLeases(mockCustomer, mockLeases);
      expect(linked).toHaveLength(2); // Matches L-01 (phone) and L-02 (email)
      expect(linked[0].id).toBe('L-01');
      expect(linked[1].id).toBe('L-02');
    });

    it('should link lease by matching email (case insensitive)', () => {
      const mockLeases = [
        { id: 'L-03', deviceModel: 'iPad Pro', phone: '0000000000', email: 'HM@VIETNAM.COM' },
        { id: 'L-04', deviceModel: 'MacBook Air', phone: '1111111111', email: 'wrong@vietnam.com' }
      ];

      const linked = filterCustomerLeases(mockCustomer, mockLeases);
      expect(linked).toHaveLength(1);
      expect(linked[0].id).toBe('L-03');
    });
  });

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

  describe('B2B Seller Finance & Early Payouts Linking', () => {
    it('should link seller profile and then its payouts', () => {
      const mockSellers = [
        { sellerId: 'SEL-01', sellerName: 'Thời Trang H&M Vietnam Retail', score: 850, tier: 'AAA' },
        { sellerId: 'SEL-02', sellerName: 'Other Seller', score: 700, tier: 'A' }
      ];

      const mockPayouts = [
        { id: 'EP-01', sellerId: 'SEL-01', amount: 50000000, status: 'pending' },
        { id: 'EP-02', sellerId: 'SEL-01', amount: 20000000, status: 'disbursed' },
        { id: 'EP-03', sellerId: 'SEL-02', amount: 15000000, status: 'pending' }
      ];

      const seller = findCustomerSeller(mockCustomer, mockSellers);
      expect(seller).toBeDefined();
      expect(seller!.sellerId).toBe('SEL-01');

      const payouts = filterCustomerPayouts(seller, mockPayouts);
      expect(payouts).toHaveLength(2);
      expect(payouts[0].id).toBe('EP-01');
      expect(payouts[1].id).toBe('EP-02');
    });

    it('should handle cases where customer is not a seller', () => {
      const mockSellers = [
        { sellerId: 'SEL-02', sellerName: 'Other Seller', score: 700, tier: 'A' }
      ];
      const mockPayouts = [
        { id: 'EP-03', sellerId: 'SEL-02', amount: 15000000, status: 'pending' }
      ];

      const seller = findCustomerSeller(mockCustomer, mockSellers);
      expect(seller).toBeUndefined();

      const payouts = filterCustomerPayouts(seller, mockPayouts);
      expect(payouts).toHaveLength(0);
    });
  });
});
