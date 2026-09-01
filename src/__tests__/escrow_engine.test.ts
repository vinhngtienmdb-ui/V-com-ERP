import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.unmock('../services/dbService');

import { releaseEscrow, refundEscrow, processDueEscrows, createEscrow, markEscrowDelivered, openDispute, EscrowRecord } from '../services/escrowService';
import { supabase } from '../lib/supabase';
import * as dbService from '../services/dbService';

const mockEscrow = (over: Partial<EscrowRecord> = {}): EscrowRecord => ({
  id: 'esc-1',
  order_id: 'ORD-100',
  amount: 2500000,
  seller_id: 'SEL-001',
  buyer_id: 'USR-882',
  status: 'delivered',
  locked_at: '2026-08-01T00:00:00Z',
  delivered_at: '2026-08-05T00:00:00Z',
  retention_days: 7,
  auto_release_at: '2026-08-12T00:00:00Z',
  released_at: null,
  refunded_at: null,
  dispute_id: null,
  journal_entry_id: null,
  ...over
});

describe('Escrow Engine — Luật 36/2024/QH15', () => {
  let updateWalletSpy: any;
  let ledgerSpy: any;
  let fromSpy: any;
  const updateResult = vi.fn().mockResolvedValue({ error: null });
  const insertResult = vi.fn().mockResolvedValue({ data: mockEscrow(), error: null });

  // Chain mock: mô phỏng Supabase query builder (update().eq() / insert().select().single())
  const makeChain = () => {
    const chain: any = {};
    chain.update = vi.fn().mockReturnThis();
    chain.insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: mockEscrow({ status: 'locked' }), error: null }) })
    });
    chain.select = vi.fn().mockImplementation((...args: any[]) => {
      if (args.length === 0 || (args[0] && args[0].count)) {
        // select('*', {count}) hoặc cuối chuỗi filter → trả kết quả
        return Promise.resolve({ data: [], error: null, count: 0 });
      }
      return chain;
    });
    chain.eq = vi.fn().mockReturnThis();
    chain.in = vi.fn().mockReturnThis();
    chain.is = vi.fn().mockReturnThis();
    chain.lte = vi.fn().mockReturnThis();
    chain.order = vi.fn().mockReturnThis();
    chain.range = vi.fn().mockReturnThis();
    chain.limit = vi.fn().mockReturnThis();
    chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    chain.single = vi.fn().mockResolvedValue({ data: mockEscrow(), error: null });
    chain.then = (resolve: any, reject: any) => updateResult().then(resolve, reject);
    return chain;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    updateWalletSpy = vi.spyOn(dbService, 'updateWalletBalance').mockResolvedValue({} as any);
    ledgerSpy = vi.spyOn(dbService, 'recordPartnerLedgerEntry').mockResolvedValue(0);
    fromSpy = vi.spyOn(supabase, 'from').mockImplementation(() => makeChain());
  });

  it('createEscrow: đặt status locked + auto_release_at theo retention', async () => {
    const single = vi.fn().mockResolvedValue({ data: mockEscrow({ status: 'locked' }), error: null });
    const chain = makeChain();
    chain.insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) });
    fromSpy.mockImplementation(() => chain);
    await createEscrow({ orderId: 'ORD-100', amount: 2500000, sellerId: 'SEL-001', buyerId: 'USR-882' });
    expect(single).toHaveBeenCalled();
  });

  it('releaseEscrow: giải ngân đủ điều kiện → ghi ví seller + partner ledger + đóng escrow', async () => {
    await releaseEscrow(mockEscrow());

    expect(updateWalletSpy).toHaveBeenCalledWith('SEL-001', 2500000, expect.objectContaining({
      type: 'payout',
      gateway: 'escrow_release'
    }));
    expect(ledgerSpy).toHaveBeenCalledWith(expect.objectContaining({
      partnerId: 'SEL-001',
      refType: 'order',
      refId: 'ORD-100',
      credit: 2500000
    }));
  });

  it('releaseEscrow: PHẢI từ chối khi escrow đang khiếu nại (disputed)', async () => {
    await expect(releaseEscrow(mockEscrow({ status: 'disputed', dispute_id: 'dsp-1' })))
      .rejects.toThrow('không thể giải ngân');
    expect(updateWalletSpy).not.toHaveBeenCalled();
  });

  it('releaseEscrow: PHẢI idempotent khi đã released (không ghi bút toán kép)', async () => {
    await releaseEscrow(mockEscrow({ status: 'released', released_at: '2026-08-12T00:00:00Z' }));
    expect(updateWalletSpy).not.toHaveBeenCalled();
    expect(ledgerSpy).not.toHaveBeenCalled();
  });

  it('refundEscrow: hoàn tiền người mua và đóng escrow refunded', async () => {
    await refundEscrow(mockEscrow({ status: 'locked' }));

    expect(updateWalletSpy).toHaveBeenCalledWith('USR-882', 2500000, expect.objectContaining({
      type: 'refund',
      gateway: 'escrow_refund'
    }));
  });

  it('refundEscrow: idempotent khi đã refunded', async () => {
    await refundEscrow(mockEscrow({ status: 'refunded', refunded_at: '2026-08-10T00:00:00Z' }));
    expect(updateWalletSpy).not.toHaveBeenCalled();
  });

  it('processDueEscrows: release hàng loạt escrow đến hạn + refund escrow locked quá 14 ngày', async () => {
    const dueRelease = { data: [mockEscrow()], error: null };
    const staleLocked = { data: [mockEscrow({ status: 'locked', id: 'esc-2', buyer_id: 'USR-129' })], error: null };

    // Query 1: select().eq().lte().is() → dueRelease
    // Query 2: select().eq().lte() → staleLocked (không có .is)
    const chain = makeChain();
    let queryDepth = 0;
    chain.is = vi.fn().mockImplementation(() => {
      queryDepth = 1;
      return dueRelease;
    });
    chain.lte = vi.fn().mockImplementation(() => {
      // lte cuối cùng của query 1 (trước is) hoặc query 2
      return chain;
    });
    // lte của query 2 resolve ngay vì không có is() theo sau
    // → cần đếm: query 1 đi qua is(), query 2 kết thúc ở lte()
    const originalLte = chain.lte;
    chain.lte = vi.fn().mockImplementation(() => {
      isCalledAfterLte = false;
      // Trả về thenable: nếu is() được gọi sau → dùng dueRelease, nếu không → staleLocked
      return {
        is: vi.fn().mockImplementation(() => dueRelease),
        then: (resolve: any) => {
          // Kết thúc chuỗi tại lte (query 2) → staleLocked
          setTimeout(() => resolve(staleLocked), 0);
        }
      };
    });
    let isCalledAfterLte = false;
    fromSpy.mockImplementation(() => chain);

    const result = await processDueEscrows();

    expect(result.released).toBe(1);
    expect(result.refunded).toBe(1);
  });

  it('markEscrowDelivered: chỉ chuyển từ locked (không thể từ released)', async () => {
    await markEscrowDelivered('esc-1');
    const chain = fromSpy.mock.results[0].value;
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'delivered' }));
  });

  it('openDispute: phong tỏa escrow, chặn giải ngân tự động', async () => {
    await openDispute('esc-1', 'dsp-9');
    const chain = fromSpy.mock.results[0].value;
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({
      status: 'disputed',
      dispute_id: 'dsp-9'
    }));
  });
});
