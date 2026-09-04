import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock toàn bộ tầng DB — test logic nghiệp vụ, không test persistence
vi.mock('../services/dbService', () => ({
  db: {},
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
}));

import { getDoc, updateDoc } from '../services/dbService';
import {
  computeOrderFinancials,
  computeListingUnitMargin,
  advanceOrder,
  DropshipError,
} from '../services/dropshipService';
import type { DropshipOrder, DropshipOrderItem } from '../types/erp';

/**
 * TRỤ CỘT 1 (phần Dropship) — spec 017
 *
 * Quy ước tiền đang được kiểm chứng ở đây (dễ sai nhất):
 *   revenue     = Σ (unitPrice × quantity)
 *   totalCost   = Σ (unitCost  × quantity)
 *   grossMargin = revenue − totalCost
 *   codAmount   = revenue + shippingFee
 *   Phí ship là khoản THU HỘ CHI HỘ → không tính vào margin.
 *   partnerMargin = grossMargin × marginSplit
 *   vcommMargin   = grossMargin − partnerMargin
 */

const item = (over: Partial<DropshipOrderItem> = {}): DropshipOrderItem => ({
  productId: 'P1',
  productName: 'Áo thun',
  quantity: 1,
  unitCost: 100000,
  unitPrice: 150000,
  ...over,
});

function makeOrder(status: DropshipOrder['status'], over: Partial<DropshipOrder> = {}): DropshipOrder {
  return {
    id: 'dso-1',
    tenantId: 'tenant-vcomm-prod-01',
    partnerId: 'dsp-1',
    code: 'DS-00000001',
    externalOrderCode: 'SHP-123',
    channel: 'shopee',
    items: [item()],
    itemCount: 1,
    quantity: 1,
    codAmount: 170000,
    totalCost: 100000,
    shippingFee: 20000,
    grossMargin: 50000,
    partnerMargin: 40000,
    vcommMargin: 10000,
    status,
    createdAt: '2026-09-02T00:00:00.000Z',
    ...over,
  };
}

describe('Dropship — tính tiền (spec 017)', () => {
  it('tính đúng doanh thu, vốn, chênh lệch gộp và COD thu hộ', () => {
    const f = computeOrderFinancials(
      [item({ quantity: 2 })], // 2 × (150k − 100k)
      20000,
      0.8
    );

    expect(f.revenue).toBe(300000);
    expect(f.totalCost).toBe(200000);
    expect(f.grossMargin).toBe(100000);
    expect(f.partnerMargin).toBe(80000);
    expect(f.vcommMargin).toBe(20000);
    // COD = tiền hàng + phí ship (thu hộ)
    expect(f.codAmount).toBe(320000);
    expect(f.quantity).toBe(2);
    expect(f.itemCount).toBe(1);
  });

  it('phí ship KHÔNG được tính vào chênh lệch (thu hộ chi hộ)', () => {
    const withoutFee = computeOrderFinancials([item()], 0, 1);
    const withFee = computeOrderFinancials([item()], 50000, 1);

    expect(withoutFee.grossMargin).toBe(withFee.grossMargin);
    expect(withFee.codAmount - withoutFee.codAmount).toBe(50000);
  });

  it('chia chênh lệch đúng tỉ lệ 70/30', () => {
    const f = computeOrderFinancials([item({ quantity: 10 })], 0, 0.7);
    // 10 × 50k = 500k chênh lệch
    expect(f.grossMargin).toBe(500000);
    expect(f.partnerMargin).toBe(350000);
    expect(f.vcommMargin).toBe(150000);
  });

  it('kẹp tỉ lệ chia về [0,1] khi dữ liệu đối tác bị nhập sai', () => {
    const over = computeOrderFinancials([item()], 0, 1.5);
    expect(over.partnerMargin).toBe(over.grossMargin);
    expect(over.vcommMargin).toBe(0);

    const under = computeOrderFinancials([item()], 0, -0.5);
    expect(under.partnerMargin).toBe(0);
    expect(under.vcommMargin).toBe(under.grossMargin);
  });

  it('tôn trọng COD nhập tay khi kênh báo số tiền khác', () => {
    const f = computeOrderFinancials([item()], 20000, 0.8, 999000);
    expect(f.codAmount).toBe(999000);
  });

  it('cộng đúng nhiều dòng sản phẩm', () => {
    const f = computeOrderFinancials(
      [
        item({ productId: 'P1', unitCost: 100000, unitPrice: 150000, quantity: 2 }),
        item({ productId: 'P2', unitCost: 50000, unitPrice: 80000, quantity: 3 }),
      ],
      15000,
      0.8
    );
    // revenue = 300k + 240k = 540k ; cost = 200k + 150k = 350k
    expect(f.revenue).toBe(540000);
    expect(f.totalCost).toBe(350000);
    expect(f.grossMargin).toBe(190000);
    expect(f.quantity).toBe(5);
    expect(f.itemCount).toBe(2);
  });

  it('chênh lệch âm khi đối tác bán dưới giá vốn', () => {
    const f = computeOrderFinancials([item({ unitPrice: 80000 })], 0, 0.8);
    expect(f.grossMargin).toBe(-20000);
    expect(f.partnerMargin).toBe(-16000);
    expect(f.vcommMargin).toBe(-4000);
  });
});

describe('Dropship — chênh lệch trên listing', () => {
  it('tính chênh lệch đơn vị = giá niêm yết − giá vốn', () => {
    expect(computeListingUnitMargin({ listedPrice: 150000, baseCost: 100000, shippingFee: 0 })).toBe(50000);
    expect(computeListingUnitMargin({ listedPrice: 90000, baseCost: 100000, shippingFee: 0 })).toBe(-10000);
  });
});

describe('Dropship — vòng đời đơn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cho phép chuyển stock_reserved → picking', async () => {
    const order = makeOrder('stock_reserved');
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => order,
    } as any);

    await advanceOrder('dso-1', 'picking');

    expect(updateDoc).toHaveBeenCalled();
    const [, payload] = vi.mocked(updateDoc).mock.calls[0] as any[];
    expect(payload.status).toBe('picking');
  });

  it('chặn chuyển ngược delivered → picking', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => makeOrder('delivered'),
    } as any);

    await expect(advanceOrder('dso-1', 'picking')).rejects.toThrow(DropshipError);
    await expect(advanceOrder('dso-1', 'picking')).rejects.toThrow(/Không thể chuyển/);
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('chặn nhảy cóc pending → delivered', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => makeOrder('pending'),
    } as any);

    await expect(advanceOrder('dso-1', 'delivered')).rejects.toThrow(DropshipError);
  });

  it('báo lỗi khi đơn không tồn tại', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => false,
      data: () => undefined,
    } as any);

    await expect(advanceOrder('dso-nope', 'picking')).rejects.toThrow(/không tồn tại/i);
  });
});
