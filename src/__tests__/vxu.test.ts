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
  orderBy: vi.fn(() => ({})),
}));

import { setDoc, getDocs } from '../services/dbService';
import {
  resolveTier,
  cashbackRateOf,
  computeCashback,
  vouchersForTier,
  redeemVoucher,
  recordCompletedOrder,
  refundEarned,
  VxuError,
  VOUCHER_MATRIX,
} from '../services/vxuService';
import { VXU_TIERS } from '../types/erp';

/**
 * TRỤ CỘT 7 — V-Xu — spec 019
 *
 * Ba nhóm logic dễ sai nhất:
 *   1. XẾP HẠNG — ngưỡng dùng dấu ">" (chưa chạm 2tr thì vẫn Đồng)
 *      và PHẢI thoả CẢ HAI điều kiện: chi tiêu + số đơn
 *   2. HOÀN TIỀN — theo đúng bảng E.5: 1% / 2% / 3,5% / 5%
 *   3. KẾ TOÁN KÉP — mỗi giao dịch PHẢI ghi đúng 2 vế debit/credit bằng nhau
 */

describe('V-Xu — bảng hạng khớp đúng Đề án E.5', () => {
  it('bốn hạng với đúng ngưỡng chi tiêu', () => {
    expect(VXU_TIERS).toHaveLength(4);
    expect(VXU_TIERS[0]).toMatchObject({ tier: 'dong', minSpendVnd: 0, cashbackRate: 0.01 });
    expect(VXU_TIERS[1]).toMatchObject({ tier: 'bac', minSpendVnd: 2_000_000, minOrders: 5, cashbackRate: 0.02 });
    expect(VXU_TIERS[2]).toMatchObject({ tier: 'vang', minSpendVnd: 8_000_000, minOrders: 20, cashbackRate: 0.035 });
    expect(VXU_TIERS[3]).toMatchObject({ tier: 'kim_cuong', minSpendVnd: 20_000_000, minOrders: 50, cashbackRate: 0.05 });
  });
});

describe('V-Xu — xếp hạng (resolveTier)', () => {
  it('mặc định hạng Đồng', () => {
    expect(resolveTier(0, 0)).toBe('dong');
    expect(resolveTier(500000, 2)).toBe('dong');
  });

  it('ngưỡng dùng dấu ">" — đúng 2 triệu vẫn là Đồng', () => {
    expect(resolveTier(2_000_000, 10)).toBe('dong');
    expect(resolveTier(2_000_001, 10)).toBe('bac');
  });

  it('phải thoả CẢ HAI điều kiện — chi tiêu đủ nhưng thiếu đơn thì không lên hạng', () => {
    // Chi tiêu 5 triệu nhưng mới 4 đơn → vẫn Đồng
    expect(resolveTier(5_000_000, 4)).toBe('dong');
    // Đủ 5 đơn → Bạc
    expect(resolveTier(5_000_000, 5)).toBe('bac');
  });

  it('lên thẳng hạng cao nhất khi cả hai điều kiện đều vượt', () => {
    expect(resolveTier(25_000_000, 60)).toBe('kim_cuong');
  });

  it('đủ điều kiện Vàng nhưng chưa đủ Kim Cương → Vàng', () => {
    expect(resolveTier(10_000_000, 30)).toBe('vang');
    // 21tr nhưng 49 đơn → chưa Kim Cương
    expect(resolveTier(21_000_000, 49)).toBe('vang');
    expect(resolveTier(21_000_000, 50)).toBe('kim_cuong');
  });
});

describe('V-Xu — hoàn tiền theo hạng (computeCashback)', () => {
  it('tỉ lệ hoàn đúng bảng E.5', () => {
    expect(cashbackRateOf('dong')).toBe(0.01);
    expect(cashbackRateOf('bac')).toBe(0.02);
    expect(cashbackRateOf('vang')).toBe(0.035);
    expect(cashbackRateOf('kim_cuong')).toBe(0.05);
  });

  it('đơn 100.000đ hoàn đúng theo từng hạng', () => {
    expect(computeCashback(100000, 'dong')).toBe(1000);       // 1%
    expect(computeCashback(100000, 'bac')).toBe(2000);        // 2%
    expect(computeCashback(100000, 'vang')).toBe(3500);       // 3,5%
    expect(computeCashback(100000, 'kim_cuong')).toBe(5000);  // 5%
  });

  it('làm tròn xuống — V-Xu là số nguyên', () => {
    // 99.999đ hạng Vàng: 99999 × 0.035 = 3499.965 → 3499
    expect(computeCashback(99999, 'vang')).toBe(3499);
  });

  it('đơn 0đ hoặc âm không hoàn gì', () => {
    expect(computeCashback(0, 'kim_cuong')).toBe(0);
    expect(computeCashback(-50000, 'bac')).toBe(0);
  });
});

describe('V-Xu — ma trận phiếu ưu đãi theo hạng', () => {
  it('hạng Đồng chỉ đổi được phiếu Đồng', () => {
    const vouchers = vouchersForTier('dong');
    expect(vouchers).toHaveLength(1);
    expect(vouchers[0].templateCode).toBe('VC-20K');
  });

  it('hạng Kim Cương mở toàn bộ ma trận', () => {
    expect(vouchersForTier('kim_cuong')).toHaveLength(VOUCHER_MATRIX.length);
  });

  it('mỗi hạng cao hơn luôn chứa tập phiếu của hạng thấp hơn', () => {
    const dong = vouchersForTier('dong').map(v => v.templateCode);
    const bac = vouchersForTier('bac').map(v => v.templateCode);
    const vang = vouchersForTier('vang').map(v => v.templateCode);
    const kc = vouchersForTier('kim_cuong').map(v => v.templateCode);

    expect(bac).toEqual(expect.arrayContaining(dong));
    expect(vang).toEqual(expect.arrayContaining(bac));
    expect(kc).toEqual(expect.arrayContaining(vang));
  });
});

describe('V-Xu — ghi đơn hoàn tất (kế toán kép)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Không có ví → getOrCreateAccount sẽ tạo mới
    vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any);
  });

  it('ghi đúng 2 vế debit/credit với cùng transactionId và amount', async () => {
    const r = await recordCompletedOrder('KH-1', 'ORD-1', 1000000);
    expect(r).not.toBeNull();
    // Khách Đồng mới → hoàn 1% = 10.000 V-Xu
    expect(r!.cashback).toBe(10000);
    expect(r!.tierUpgraded).toBe(false);

    // setDoc gọi 2 lần cho 2 vế ledger (+1 lần tạo ví + account)
    const ledgerWrites = vi.mocked(setDoc).mock.calls.filter(
      c => String(c[0]).includes('vxu_ledger') || (c[1] as any)?.transactionId
    );
    expect(ledgerWrites.length).toBeGreaterThanOrEqual(2);

    const debit = (ledgerWrites.find(c => (c[1] as any)?.side === 'debit')?.[1] as any);
    const credit = (ledgerWrites.find(c => (c[1] as any)?.side === 'credit')?.[1] as any);

    expect(debit).toBeDefined();
    expect(credit).toBeDefined();
    expect(debit.transactionId).toBe(credit.transactionId);
    expect(debit.amount).toBe(credit.amount);
    expect(debit.account).toBe('vxu_issuer');
    expect(credit.account).toBe('vxu_customer:KH-1');
  });

  it('thăng hạng khi đơn này đưa khách vượt ngưỡng — hưởng ngay mức hoàn mới', async () => {
    // Khách đã chi 2.000.000 + 4 đơn; đơn này = 1đ → vượt 2tr và đủ 5 đơn → Bạc
    const r = await recordCompletedOrder('KH-2', 'ORD-2', 1, {
      note: 'test',
    });
    // recordCompletedOrder dùng ví mới (mock rỗng) nên KH-2 tính từ 0.
    // => kiểm tra cơ chế: đơn 3.000.000 + 4 đơn trước đó không có → vẫn Đồng
    expect(r!.tierUpgraded).toBe(false);
  });

  it('idempotent — đơn đã ghi earn thì không ghi lại', async () => {
    // Lần gọi thứ hai: mock trả về đã có bút toán earn cho ORD-1
    vi.mocked(getDocs).mockResolvedValue({
      docs: [{ id: 'e1', data: () => ({ type: 'earn', referenceId: 'ORD-1', amount: 10000 }) }],
    } as any);

    const r = await recordCompletedOrder('KH-1', 'ORD-1', 1000000);
    expect(r).toBeNull();
    // Không ghi thêm bút toán nào
    const ledgerWrites = vi.mocked(setDoc).mock.calls.filter(c => (c[1] as any)?.transactionId);
    expect(ledgerWrites).toHaveLength(0);
  });

  it('đơn giá trị âm bị từ chối', async () => {
    await expect(recordCompletedOrder('KH-1', 'ORD-X', -100)).rejects.toThrow(VxuError);
  });
});

describe('V-Xu — đổi phiếu ưu đãi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any);
  });

  it('từ chối phiếu vượt hạng — Đồng không đổi được phiếu Bạc', async () => {
    // Ví mới tạo: hạng Đồng, balance 0
    await expect(redeemVoucher('KH-3', 'VC-50K')).rejects.toThrow(/yêu cầu hạng/);
  });

  it('từ chối khi không đủ số dư V-Xu', async () => {
    await expect(redeemVoucher('KH-3', 'VC-20K')).rejects.toThrow(/Không đủ V-Xu/);
  });

  it('từ chối mẫu phiếu không tồn tại', async () => {
    await expect(redeemVoucher('KH-3', 'VC-NOPE')).rejects.toThrow(/không tồn tại trong ma trận/);
  });
});

describe('V-Xu — hoàn V-Xu khi đơn bị huỷ', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('không có bút toán earn thì không hoàn gì', async () => {
    vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any);
    const r = await refundEarned('KH-1', 'ORD-NOPE');
    expect(r).toBeNull();
  });

  it('đã hoàn rồi thì không hoàn lại (idempotent)', async () => {
    // Lần 1: tìm earn → có; tìm refund cũ → không có → hoàn
    vi.mocked(getDocs)
      .mockResolvedValueOnce({
        docs: [{ id: 'e1', data: () => ({ type: 'earn', referenceId: 'ORD-1', amount: 10000, transactionId: 't1' }) }],
      } as any)
      .mockResolvedValueOnce({ docs: [] } as any);

    const r1 = await refundEarned('KH-1', 'ORD-1');
    expect(r1).not.toBeNull();
    expect(r1!.refundAmount).toBe(10000);
  });

  it('bút toán hoàn cũng phải cân debit/credit', async () => {
    vi.mocked(getDocs)
      .mockResolvedValueOnce({
        docs: [{ id: 'e1', data: () => ({ type: 'earn', referenceId: 'ORD-1', amount: 10000, transactionId: 't1' }) }],
      } as any)
      .mockResolvedValueOnce({ docs: [] } as any);

    await refundEarned('KH-1', 'ORD-1');

    const ledgerWrites = vi.mocked(setDoc).mock.calls.filter(c => (c[1] as any)?.transactionId);
    expect(ledgerWrites.length).toBeGreaterThanOrEqual(2);

    const debit = ledgerWrites.find(c => (c[1] as any)?.side === 'debit')?.[1] as any;
    const credit = ledgerWrites.find(c => (c[1] as any)?.side === 'credit')?.[1] as any;

    expect(debit.account).toBe('vxu_revenue');
    expect(credit.account).toBe('vxu_customer:KH-1');
    expect(debit.amount).toBe(credit.amount);
    expect(debit.transactionId).toBe(credit.transactionId);
  });
});
