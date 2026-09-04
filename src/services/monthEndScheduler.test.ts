import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  runMonthEndDepreciation,
  periodOf,
  periodToRun,
  lastDayOf,
  type MonthEndDeps,
  type MonthEndRunRecord,
} from './monthEndScheduler';
import type { FixedAsset } from './fixedAssetService';

/** TSCĐ tối giản, hợp lệ để engine không đưa vào `skipped`. */
function asset(id: string, over: Partial<FixedAsset> = {}): FixedAsset {
  return {
    id,
    name: `Tài sản ${id}`,
    assetClass: 'MTB.VP',
    putIntoUseDate: '2026-01-15',
    cost: 12_000_000,
    usefulLifeMonths: 12,
    status: 'in_use',
    tenantId: 'tenant-vcomm-prod-01',
    ...over,
  } as FixedAsset;
}

function makeDeps(over: Partial<MonthEndDeps> = {}) {
  const saved: string[] = [];
  const marked: MonthEndRunRecord[] = [];
  const deps: MonthEndDeps = {
    loadAssets: vi.fn(async () => [asset('A1'), asset('A2')]),
    saveEntry: vi.fn(async (e) => void saved.push(e.id)),
    getRun: vi.fn(async () => null),
    markRun: vi.fn(async (r) => void marked.push(r)),
    now: () => new Date('2026-10-05T02:00:00.000Z'),
    ...over,
  };
  return { deps, saved, marked };
}

const TENANT = 'tenant-vcomm-prod-01';

describe('monthEndScheduler — lập lịch khấu hao cuối tháng', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ------------------------------------------------------------- kỳ (period) ---

  it('periodOf: lấy yyyy-mm từ Date', () => {
    expect(periodOf(new Date('2026-09-03T00:00:00Z'))).toBe('2026-09');
    expect(periodOf(new Date('2026-01-01T00:00:00Z'))).toBe('2026-01');
  });

  it('periodToRun: LUÔN là tháng TRƯỚC (kể cả đang là ngày cuối tháng)', () => {
    // Chạy 05/10 → tháng 9 đã xong
    expect(periodToRun(new Date('2026-10-05T00:00:00Z'))).toBe('2026-09');
    // ⚠️ Điểm dễ sai: 31/10 23:59 thì tháng 10 VẪN CHƯA xong.
    // Engine trả trọn tháng (không chia theo ngày) → trích tháng 10 lúc này
    // sẽ khống chi phí. Phải vẫn là tháng 9.
    expect(periodToRun(new Date('2026-10-31T23:59:00Z'))).toBe('2026-09');
    // Sang 01/11 thì tháng 10 đã xong
    expect(periodToRun(new Date('2026-11-01T00:05:00Z'))).toBe('2026-10');
  });

  it('periodToRun: qua năm (01/2027 → kỳ 2026-12)', () => {
    expect(periodToRun(new Date('2027-01-01T00:00:00Z'))).toBe('2026-12');
  });

  it('lastDayOf: ngày cuối tháng, kể cả tháng 2 năm nhuận', () => {
    expect(lastDayOf('2026-09')).toBe('2026-09-30');
    expect(lastDayOf('2026-02')).toBe('2026-02-28');
    expect(lastDayOf('2028-02')).toBe('2028-02-29'); // năm nhuận
    expect(lastDayOf('2026-12')).toBe('2026-12-31');
  });

  // -------------------------------------------------------------- chạy kỳ ----

  it('chạy kỳ, ghi chứng từ GỘP (mặc định consolidate=true)', async () => {
    const { deps, saved, marked } = makeDeps();
    const r = await runMonthEndDepreciation(deps, TENANT);

    expect(r.period).toBe('2026-09');
    expect(r.alreadyRun).toBe(false);
    expect(r.error).toBeUndefined();
    // Gộp → đúng 1 chứng từ tổng hợp, id CỐ ĐỊNH theo kỳ
    expect(saved).toEqual(['KH-TONG-2026-09']);
    expect(r.savedEntryIds).toEqual(['KH-TONG-2026-09']);
    // Ghi dấu đã chạy
    expect(marked).toHaveLength(1);
    expect(marked[0].id).toBe(`${TENANT}-2026-09`);
  });

  it('consolidate=false → ghi TỪNG chứng từ (id KH-<assetId>-<period>)', async () => {
    const { deps, saved } = makeDeps({ consolidate: false });
    const r = await runMonthEndDepreciation(deps, TENANT);
    expect(saved).toEqual(['KH-A1-2026-09', 'KH-A2-2026-09']);
    expect(r.savedEntryIds).toHaveLength(2);
  });

  it('IDEMPOTENT: gọi lặp 2 lần không sinh chứng từ thứ hai', async () => {
    const { deps, saved } = makeDeps();
    await runMonthEndDepreciation(deps, TENANT);
    // Lần 2: đứng từ góc nhìn scheduler, kỳ đã có bản ghi → bỏ qua.
    // (Giả lập việc mở app lại — `getRun` giờ trả về bản ghi.)
    const withRun = makeDeps({
      getRun: vi.fn(async () => ({
        id: `${TENANT}-2026-09`,
        period: '2026-09',
        tenantId: TENANT,
        ranAt: '2026-10-01T00:00:00.000Z',
        entryCount: 1,
        totalAmount: 1_000_000,
        skippedCount: 0,
        warnings: [],
      })),
    });
    const r2 = await runMonthEndDepreciation(withRun.deps, TENANT);
    expect(r2.alreadyRun).toBe(true);
    expect(withRun.saved).toHaveLength(0); // KHÔNG ghi thêm gì
    expect(saved).toHaveLength(1);
  });

  it('force=true BỎ QUA bản ghi đã chạy (admin muốn chạy lại)', async () => {
    const { deps, saved } = makeDeps({
      force: true,
      getRun: vi.fn(async () => ({
        id: `${TENANT}-2026-09`,
        period: '2026-09',
        tenantId: TENANT,
        ranAt: '2026-10-01T00:00:00.000Z',
        entryCount: 1,
        totalAmount: 1,
        skippedCount: 0,
        warnings: [],
      })),
    });
    const r = await runMonthEndDepreciation(deps, TENANT);
    expect(r.alreadyRun).toBe(false);
    expect(deps.getRun).not.toHaveBeenCalled(); // không thèm kiểm tra
    expect(saved).toEqual(['KH-TONG-2026-09']);
  });

  // ------------------------------------------------------------- lỗi ---------

  it('không tải được tài sản → error, KHÔNG ghi dấu đã chạy', async () => {
    const { deps, saved, marked } = makeDeps({
      loadAssets: vi.fn(async () => {
        throw new Error('RLS chặn');
      }),
    });
    const r = await runMonthEndDepreciation(deps, TENANT);
    expect(r.error).toContain('Không tải được danh sách tài sản');
    expect(saved).toHaveLength(0);
    expect(marked).toHaveLength(0); // quan trọng: lần sau phải chạy lại được
  });

  it('getRun lỗi → VẪN CHẠY (chứng từ id cố định → ghi đè an toàn)', async () => {
    // Chọn "chạy" thay vì "dừng": nếu dừng thì bảng dấu vết chưa tạo sẽ khiến
    // khấu hao không bao giờ được trích → sai BCTC và thuế TNDN, tệ hơn nhiều
    // so với việc ghi đè một chứng từ có nội dung y hệt.
    const { deps, saved } = makeDeps({
      getRun: vi.fn(async () => {
        throw new Error('bảng month_end_runs chưa tồn tại');
      }),
    });
    const r = await runMonthEndDepreciation(deps, TENANT);
    expect(r.error).toBeUndefined();
    expect(saved).toEqual(['KH-TONG-2026-09']);
  });

  it('một chứng từ ghi lỗi → KHÔNG dừng các chứng từ còn lại', async () => {
    let n = 0;
    const { deps, saved, marked } = makeDeps({
      consolidate: false,
      saveEntry: vi.fn(async (e) => {
        n += 1;
        if (n === 1) throw new Error('khoá sổ');
        saved.push(e.id);
      }),
    });
    const r = await runMonthEndDepreciation(deps, TENANT);
    // A1 lỗi, A2 vẫn ghi
    expect(r.savedEntryIds).toEqual(['KH-A2-2026-09']);
    // Vẫn ghi dấu nhưng kèm cảnh báo (đã ghi được ít nhất 1)
    expect(marked).toHaveLength(1);
    expect(marked[0].warnings.join(' ')).toContain('Ghi sổ thất bại');
  });

  it('ghi sổ thất bại TẤT CẢ → KHÔNG ghi dấu đã chạy (kẻo bỏ mất kỳ)', async () => {
    const { deps, marked } = makeDeps({
      saveEntry: vi.fn(async () => {
        throw new Error('DB sập');
      }),
    });
    const r = await runMonthEndDepreciation(deps, TENANT);
    expect(r.savedEntryIds).toHaveLength(0);
    expect(marked).toHaveLength(0);
    expect(r.error).toBeUndefined(); // lỗi nằm trong warnings của bản ghi
  });

  it('markRun lỗi KHÔNG huỷ kết quả đã ghi sổ', async () => {
    const { deps, saved } = makeDeps({
      markRun: vi.fn(async () => {
        throw new Error('không lưu được dấu vết');
      }),
    });
    const r = await runMonthEndDepreciation(deps, TENANT);
    expect(saved).toEqual(['KH-TONG-2026-09']); // đã ghi sổ vẫn giữ
    expect(r.error).toBeUndefined();
  });

  it('không có tài sản nào → không ghi gì, không lỗi', async () => {
    const { deps, saved, marked } = makeDeps({ loadAssets: vi.fn(async () => []) });
    const r = await runMonthEndDepreciation(deps, TENANT);
    expect(saved).toHaveLength(0);
    expect(marked).toHaveLength(0);
    expect(r.error).toBeUndefined();
    expect(r.run?.entries).toHaveLength(0);
  });

  it('tài sản lỗi cấu hình được gom vào skipped, KHÔNG làm sập kỳ', async () => {
    const { deps, saved } = makeDeps({
      loadAssets: vi.fn(async () => [
        asset('OK'),
        // resolveDepreciation chỉ tra `assetClass` khi KHÔNG có usefulLifeMonths,
        // nên phải xoá field này thì mới lọt vào nhánh "assetClass chưa có định mức".
        asset('BAD', { assetClass: 'KHONG-TON-TAI', usefulLifeMonths: undefined }),
      ]),
      consolidate: false,
    });
    const r = await runMonthEndDepreciation(deps, TENANT);
    expect(r.run?.skipped.length).toBeGreaterThan(0);
    expect(r.savedEntryIds).toContain('KH-OK-2026-09');
    expect(saved.length).toBeGreaterThan(0);
  });
});
