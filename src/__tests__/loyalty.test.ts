import { describe, it, expect } from 'vitest';

/**
 * Logic loyalty points (rút gọn từ functions/src/loyaltyTriggers.ts).
 */

interface Program {
  enabled: boolean;
  vndPerPoint: number;
  tiers?: { name: string; minTotalSpent: number; multiplier: number }[];
}

interface Customer {
  totalSpent: number;
}

function computePoints(
  orderTotal: number,
  program: Program | null,
  customer: Customer,
): number {
  if (program?.enabled === false) return 0;
  const vndPerPoint = program?.vndPerPoint ?? 1000;
  const basePoints = Math.floor(orderTotal / vndPerPoint);
  if (basePoints <= 0) return 0;

  // Tier multiplier: dựa trên totalSpent SAU đơn hiện tại
  let multiplier = 1;
  if (program?.tiers) {
    const projectedSpent = customer.totalSpent + orderTotal;
    const tier = program.tiers
      .filter((t) => projectedSpent >= t.minTotalSpent)
      .sort((a, b) => b.minTotalSpent - a.minTotalSpent)[0];
    multiplier = tier?.multiplier ?? 1;
  }
  return Math.floor(basePoints * multiplier);
}

const DEFAULT_TIERS = [
  { name: 'Bronze', minTotalSpent: 0, multiplier: 1 },
  { name: 'Silver', minTotalSpent: 5_000_000, multiplier: 1.5 },
  { name: 'Gold', minTotalSpent: 20_000_000, multiplier: 2 },
  { name: 'Platinum', minTotalSpent: 100_000_000, multiplier: 3 },
];

describe('Loyalty points — base calculation', () => {
  it('1M VND × 1000/point = 1000 điểm (Bronze)', () => {
    expect(computePoints(1_000_000, { enabled: true, vndPerPoint: 1000, tiers: DEFAULT_TIERS },
      { totalSpent: 0 })).toBe(1000);
  });

  it('Round down 1999 / 1000 = 1 (không phải 2)', () => {
    expect(computePoints(1999, { enabled: true, vndPerPoint: 1000 },
      { totalSpent: 0 })).toBe(1);
  });

  it('Order 500 VND < 1 điểm = 0', () => {
    expect(computePoints(500, { enabled: true, vndPerPoint: 1000 },
      { totalSpent: 0 })).toBe(0);
  });

  it('Order 0 → 0', () => {
    expect(computePoints(0, { enabled: true, vndPerPoint: 1000 },
      { totalSpent: 0 })).toBe(0);
  });

  it('Program disabled → 0', () => {
    expect(computePoints(1_000_000, { enabled: false, vndPerPoint: 1000 },
      { totalSpent: 0 })).toBe(0);
  });

  it('Program null → dùng default 1000 vndPerPoint', () => {
    expect(computePoints(1_000_000, null, { totalSpent: 0 })).toBe(1000);
  });

  it('Custom vndPerPoint 500 → gấp đôi điểm', () => {
    expect(computePoints(1_000_000, { enabled: true, vndPerPoint: 500 },
      { totalSpent: 0 })).toBe(2000);
  });
});

describe('Loyalty points — tier multiplier', () => {
  it('Customer Bronze (totalSpent=0) → multiplier 1', () => {
    expect(computePoints(1_000_000, { enabled: true, vndPerPoint: 1000, tiers: DEFAULT_TIERS },
      { totalSpent: 0 })).toBe(1000);
  });

  it('Customer mới có order 6M → Silver (1.5x) cho TOÀN BỘ điểm đơn này', () => {
    expect(computePoints(6_000_000, { enabled: true, vndPerPoint: 1000, tiers: DEFAULT_TIERS },
      { totalSpent: 0 })).toBe(9000); // 6000 × 1.5
  });

  it('Customer đã Silver, đặt 1M → 1500 điểm', () => {
    expect(computePoints(1_000_000, { enabled: true, vndPerPoint: 1000, tiers: DEFAULT_TIERS },
      { totalSpent: 6_000_000 })).toBe(1500);
  });

  it('Customer đã Gold (totalSpent=21M), đặt 1M → 2000 điểm (2x)', () => {
    expect(computePoints(1_000_000, { enabled: true, vndPerPoint: 1000, tiers: DEFAULT_TIERS },
      { totalSpent: 21_000_000 })).toBe(2000);
  });

  it('Customer Platinum 101M, đặt 500k → 1500 điểm (500 × 3)', () => {
    expect(computePoints(500_000, { enabled: true, vndPerPoint: 1000, tiers: DEFAULT_TIERS },
      { totalSpent: 101_000_000 })).toBe(1500);
  });

  it('Chuyển tier giữa đơn: customer 4.5M, đặt 1M → projected 5.5M ≥ Silver → 1500', () => {
    expect(computePoints(1_000_000, { enabled: true, vndPerPoint: 1000, tiers: DEFAULT_TIERS },
      { totalSpent: 4_500_000 })).toBe(1500);
  });

  it('Không có tiers → multiplier 1', () => {
    expect(computePoints(1_000_000, { enabled: true, vndPerPoint: 1000 },
      { totalSpent: 50_000_000 })).toBe(1000);
  });
});
