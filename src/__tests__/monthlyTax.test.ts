import { describe, it, expect } from 'vitest';

/**
 * Logic monthlySellerTaxAggregation (rút gọn từ functions/src/invoiceHandlers.ts):
 *  - period = tháng trước (YYYY-MM)
 *  - Lọc orders status in ['delivered','completed'] trong period → totalGmv, totalOrders
 *  - Lọc orders status in ['returning','returned'] → totalReturns
 *  - netRevenue = max(0, totalGmv - totalReturns)
 *  - estimatedTaxAmount cho cá nhân = round(netRevenue * 1.5%); HKD/DN = 0 (tự khai)
 */

const PERSONAL_SELLER_TAX_RATE = 0.015;

interface MockOrder {
  total: number;
  status: 'delivered' | 'completed' | 'returning' | 'returned' | 'shipped' | 'pending';
  createdAt: Date;
}

function inPeriod(d: Date, start: Date, end: Date): boolean {
  return d >= start && d < end;
}

function aggregateForSeller(orders: MockOrder[], periodStart: Date, periodEnd: Date) {
  const inP = orders.filter((o) => inPeriod(o.createdAt, periodStart, periodEnd));

  const delivered = inP.filter((o) => o.status === 'delivered' || o.status === 'completed');
  const returns = inP.filter((o) => o.status === 'returning' || o.status === 'returned');

  const totalGmv = delivered.reduce((s, o) => s + o.total, 0);
  const totalOrders = delivered.length;
  const totalReturns = returns.reduce((s, o) => s + o.total, 0);
  const netRevenue = Math.max(0, totalGmv - totalReturns);

  return { totalGmv, totalOrders, totalReturns, netRevenue };
}

function estimatedTax(netRevenue: number, entityType: 'individual' | 'household' | 'company'): number {
  return entityType === 'individual' ? Math.round(netRevenue * PERSONAL_SELLER_TAX_RATE) : 0;
}

const PERIOD_START = new Date('2026-04-01T00:00:00+07:00');
const PERIOD_END   = new Date('2026-05-01T00:00:00+07:00');

describe('Monthly tax — period filter', () => {
  it('chỉ tính đơn trong period', () => {
    const orders: MockOrder[] = [
      { total: 1_000_000, status: 'delivered', createdAt: new Date('2026-04-15') }, // in
      { total: 2_000_000, status: 'delivered', createdAt: new Date('2026-04-30') }, // in
      { total: 3_000_000, status: 'delivered', createdAt: new Date('2026-05-01') }, // out (sau)
      { total: 4_000_000, status: 'delivered', createdAt: new Date('2026-03-31') }, // out (trước)
    ];
    const agg = aggregateForSeller(orders, PERIOD_START, PERIOD_END);
    expect(agg.totalOrders).toBe(2);
    expect(agg.totalGmv).toBe(3_000_000);
  });

  it('không tính đơn pending/shipped', () => {
    const orders: MockOrder[] = [
      { total: 1_000_000, status: 'pending',   createdAt: new Date('2026-04-15') },
      { total: 2_000_000, status: 'shipped',   createdAt: new Date('2026-04-15') },
      { total: 3_000_000, status: 'delivered', createdAt: new Date('2026-04-15') },
    ];
    const agg = aggregateForSeller(orders, PERIOD_START, PERIOD_END);
    expect(agg.totalOrders).toBe(1);
    expect(agg.totalGmv).toBe(3_000_000);
  });

  it('trừ returns đúng', () => {
    const orders: MockOrder[] = [
      { total: 10_000_000, status: 'delivered', createdAt: new Date('2026-04-10') },
      { total: 2_000_000,  status: 'returned',  createdAt: new Date('2026-04-20') },
      { total: 1_500_000,  status: 'returning', createdAt: new Date('2026-04-25') },
    ];
    const agg = aggregateForSeller(orders, PERIOD_START, PERIOD_END);
    expect(agg.totalGmv).toBe(10_000_000);
    expect(agg.totalReturns).toBe(3_500_000);
    expect(agg.netRevenue).toBe(6_500_000);
  });

  it('netRevenue không âm khi returns > delivered (edge case)', () => {
    const orders: MockOrder[] = [
      { total: 1_000_000, status: 'delivered', createdAt: new Date('2026-04-10') },
      { total: 5_000_000, status: 'returned',  createdAt: new Date('2026-04-20') }, // return từ tháng trước
    ];
    const agg = aggregateForSeller(orders, PERIOD_START, PERIOD_END);
    expect(agg.netRevenue).toBe(0);
  });

  it('không đơn → 0', () => {
    const agg = aggregateForSeller([], PERIOD_START, PERIOD_END);
    expect(agg).toEqual({ totalGmv: 0, totalOrders: 0, totalReturns: 0, netRevenue: 0 });
  });
});

describe('Monthly tax — TT 40/2021 rate', () => {
  it('cá nhân doanh thu 100tr → 1.5tr (1.5%)', () => {
    expect(estimatedTax(100_000_000, 'individual')).toBe(1_500_000);
  });

  it('cá nhân doanh thu 33.333 → round 500đ (rounding)', () => {
    expect(estimatedTax(33_333, 'individual')).toBe(500);
  });

  it('hộ KD: 0 (tự khai)', () => {
    expect(estimatedTax(50_000_000, 'household')).toBe(0);
  });

  it('doanh nghiệp: 0 (tự khai)', () => {
    expect(estimatedTax(50_000_000, 'company')).toBe(0);
  });

  it('cá nhân doanh thu 0 → 0', () => {
    expect(estimatedTax(0, 'individual')).toBe(0);
  });
});

describe('Monthly tax — period key format', () => {
  function periodKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  it('Tháng 4/2026', () => {
    expect(periodKey(new Date('2026-04-01'))).toBe('2026-04');
  });

  it('Tháng 12 padding đúng', () => {
    expect(periodKey(new Date('2026-12-01'))).toBe('2026-12');
  });

  it('Tháng 1 padding đúng', () => {
    expect(periodKey(new Date('2027-01-15'))).toBe('2027-01');
  });
});
