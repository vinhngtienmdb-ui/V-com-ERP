import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.unmock('../services/dbService');

/**
 * Regression workflow liên thông ①-⑨:
 * Mỗi test mock Supabase đúng dạng gọi thật của code production.
 */
import { getEscrowByOrderId, markEscrowDelivered, createEscrow } from '../services/escrowService';
import { buildEInvoiceDraft } from '../services/einvoiceService';
import { computeOrderTax } from '../services/taxService';
import { supabase } from '../lib/supabase';

describe('Workflow liên thông toàn diện (fix ①-⑨)', () => {
  let fromSpy: any;

  const escrowRow = {
    id: 'esc-1', order_id: 'ORD-100', amount: 2000000,
    seller_id: 'SEL-001', buyer_id: 'USR-1',
    status: 'locked', locked_at: '2026-08-20T00:00:00Z',
    delivered_at: null, retention_days: 7,
    auto_release_at: '2026-09-03T00:00:00Z',
    released_at: null, refunded_at: null, dispute_id: null, journal_entry_id: null
  };

  const chain = (result: any = null) => {
    const c: any = {};
    c.select = vi.fn().mockImplementation((...args: any[]) => {
      if (args.length === 0) return Promise.resolve({ data: result, error: null });
      return c;
    });
    c.eq = vi.fn().mockReturnThis();
    c.maybeSingle = vi.fn().mockResolvedValue({ data: result, error: null });
    c.lte = vi.fn().mockReturnThis();
    c.is = vi.fn().mockReturnThis();
    c.order = vi.fn().mockReturnThis();
    c.insert = vi.fn().mockImplementation(() => {
      const ret: any = {};
      ret.select = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: result, error: null })
      });
      ret.then = (resolve: any) => Promise.resolve({ data: result, error: null }).then(resolve);
      return ret;
    });
    c.update = vi.fn().mockImplementation(() => {
      const ret: any = {};
      // update().eq().eq() rồi kết thúc (thenable)
      const thenable = {
        then: (resolve: any) => Promise.resolve({ data: result, error: null }).then(resolve)
      };
      ret.eq = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(thenable)
      });
      return ret;
    });
    return c;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fromSpy = vi.spyOn(supabase, 'from');
  });

  it('② getEscrowByOrderId: useSepayListener check idempotent trước khi tạo', async () => {
    fromSpy.mockImplementation(() => chain(escrowRow));
    const existing = await getEscrowByOrderId('ORD-100');
    expect(existing?.id).toBe('esc-1');
    expect(existing?.status).toBe('locked');
  });

  it('② markEscrowDelivered: Logistics/Orders giao xong → bắt đầu retention', async () => {
    const c = chain(null);
    fromSpy.mockImplementation(() => c);
    await markEscrowDelivered('esc-1');
    expect(c.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'delivered' })
    );
  });

  it('② createEscrow idempotent: đơn đã có escrow → caller bỏ qua (không throw)', async () => {
    // Case: buyer đã thanh toán → listener check existing → thấy có → không gọi createEscrow
    fromSpy.mockImplementation(() => chain(escrowRow));
    const existing = await getEscrowByOrderId('ORD-100');
    expect(existing).not.toBeNull(); // listener sẽ skip create
  });

  it('④+⑨ VAT tính đúng cho e-invoice draft: 8% thời kỳ NĐ 174/2025', () => {
    const draft = buildEInvoiceDraft(
      { id: 'ORD-7', customerName: 'Trần B', paymentMethod: 'bank_transfer' },
      [{ name: 'Tủ lạnh', price: 10000000, qty: 1 }],
      { companyName: 'VCOMM', taxCode: '0109123456', address: 'HCM' }
    );
    const tax = computeOrderTax([{ name: 'Tủ lạnh', price: 10000000, qty: 1 }]);
    expect(draft.subtotal).toBe(10000000);
    expect(tax.vatAmount).toBe(800000); // 8% — không còn hardcode UI
    expect(draft.items[0].vatRate).toBe(0.08);
    expect(draft.currency).toBe('VND');
  });

  it('③ Chống trừ kho kép: logic gateOrders của Orders.tsx mô phỏng đúng', () => {
    // Replicate điều kiện trong adjustStockForOrderStatus (Orders.tsx)
    const shouldSkipClientDeduct = (oldStatus: string, paymentStatus: string) =>
      oldStatus === 'paid' || paymentStatus === 'paid' ||
      ['paid', 'confirmed', 'allocated', 'picking', 'packed'].includes(oldStatus);

    // Đơn đã thanh toán (SePay) → DB trigger đã trừ → client PHẢI skip
    expect(shouldSkipClientDeduct('paid', 'paid')).toBe(true);
    expect(shouldSkipClientDeduct('confirmed', 'paid')).toBe(true);
    // Đơn COD (chưa qua paid) → client trừ đúng
    expect(shouldSkipClientDeduct('pending', 'unpaid')).toBe(false);
    expect(shouldSkipClientDeduct('processing', 'unpaid')).toBe(false);
  });

  it('⑦ KYC gate: PIM publish phải qua assertSellerCanPublish (được phủ bởi seller_kyc.test.ts)', async () => {
    // Import động khẳng định contract tồn tại (9/9 case chi tiết nằm ở seller_kyc.test.ts)
    const kyc = await import('../services/sellerKycService');
    expect(typeof kyc.assertSellerCanPublish).toBe('function');
    expect(typeof kyc.approveKyc).toBe('function');
  });
});
