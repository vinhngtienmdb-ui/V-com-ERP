import { describe, it, expect } from 'vitest';

/**
 * Logic affiliate commission tính toán (rút gọn từ functions/src/affiliateCommission.ts).
 * Test pure function: tính commission đúng theo rate, idempotency, gate điều kiện.
 */

interface Order {
  total: number;
  status: string;
  refCode?: string;
  commissionPaid?: boolean;
}
interface Affiliate {
  status: string;
  commissionRate: number;
}

function shouldPayCommission(before: Order, after: Order): boolean {
  if (before.status === 'delivered' || after.status !== 'delivered') return false;
  if (after.commissionPaid === true) return false;
  if (!after.refCode) return false;
  return true;
}

function computeCommission(order: Order, affiliate: Affiliate | null): number {
  if (!affiliate || affiliate.status !== 'active') return 0;
  if (!order.refCode) return 0;
  return Math.round((order.total ?? 0) * (affiliate.commissionRate ?? 0));
}

describe('Affiliate commission — trigger gating', () => {
  it('Trigger khi processing → delivered (có refCode)', () => {
    expect(shouldPayCommission(
      { total: 1000000, status: 'processing', refCode: 'ABC123' },
      { total: 1000000, status: 'delivered', refCode: 'ABC123' },
    )).toBe(true);
  });

  it('KHÔNG trigger khi delivered → delivered (không thay đổi)', () => {
    expect(shouldPayCommission(
      { total: 1000000, status: 'delivered', refCode: 'ABC123' },
      { total: 1000000, status: 'delivered', refCode: 'ABC123' },
    )).toBe(false);
  });

  it('KHÔNG trigger khi pending → shipped (chưa delivered)', () => {
    expect(shouldPayCommission(
      { total: 1000000, status: 'pending', refCode: 'ABC123' },
      { total: 1000000, status: 'shipped', refCode: 'ABC123' },
    )).toBe(false);
  });

  it('KHÔNG trigger khi không có refCode', () => {
    expect(shouldPayCommission(
      { total: 1000000, status: 'processing' },
      { total: 1000000, status: 'delivered' },
    )).toBe(false);
  });

  it('KHÔNG trigger 2 lần (idempotent qua commissionPaid)', () => {
    expect(shouldPayCommission(
      { total: 1000000, status: 'processing', refCode: 'ABC' },
      { total: 1000000, status: 'delivered', refCode: 'ABC', commissionPaid: true },
    )).toBe(false);
  });
});

describe('Affiliate commission — amount calculation', () => {
  it('10% × 1M = 100k', () => {
    expect(computeCommission(
      { total: 1_000_000, status: 'delivered', refCode: 'X' },
      { status: 'active', commissionRate: 0.10 },
    )).toBe(100_000);
  });

  it('5% × 2M = 100k', () => {
    expect(computeCommission(
      { total: 2_000_000, status: 'delivered', refCode: 'X' },
      { status: 'active', commissionRate: 0.05 },
    )).toBe(100_000);
  });

  it('Round commission lẻ Math.round (1.5% × 99999 = 1499.985 → 1500)', () => {
    expect(computeCommission(
      { total: 99_999, status: 'delivered', refCode: 'X' },
      { status: 'active', commissionRate: 0.015 },
    )).toBe(1_500);
  });

  it('Affiliate suspended → 0', () => {
    expect(computeCommission(
      { total: 1_000_000, status: 'delivered', refCode: 'X' },
      { status: 'suspended', commissionRate: 0.10 },
    )).toBe(0);
  });

  it('Affiliate null → 0', () => {
    expect(computeCommission(
      { total: 1_000_000, status: 'delivered', refCode: 'X' },
      null,
    )).toBe(0);
  });

  it('Rate 0 → 0', () => {
    expect(computeCommission(
      { total: 1_000_000, status: 'delivered', refCode: 'X' },
      { status: 'active', commissionRate: 0 },
    )).toBe(0);
  });
});
