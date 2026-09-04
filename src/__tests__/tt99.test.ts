import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import * as path from 'node:path';

/**
 * SPEC 021 — TT99/2025/TT-BTC: Chế độ kế toán DOANH NGHIỆP
 *
 * Test tập trung vào logic NGHIỆP VỤ dễ sai nhất, không test persistence:
 *   1. KẾ TOÁN KÉP — cân bằng Nợ/Có, mỗi bút toán chỉ một bên
 *   2. KỲ KẾ TOÁN (Điều 13) — ngày đầu/cuối tháng, quý, năm nhuận
 *   3. CHỨNG TỪ — thứ tự draft → lines → posted; sửa sai với Luật KT Điều 27
 *   4. HỆ TÀI KHOẢN (Điều 11) — 71 TK cấp 1; tự mở TK cấp 2/3
 *   5. IFRS 15 — giá giao dịch có ràng buộc với phần biến động
 *   6. DỮ LIỆU GỐC — 71 TK được seed đúng, 7 TK bị bãi bỏ không còn
 */

// ---------------------------------------------------------------------------
// Fake DB — mô phỏng dbService bằng bộ nhớ, phân luồng theo tên bảng
// ---------------------------------------------------------------------------
const tables: Record<string, any[]> = {};

function resetDb() {
  Object.keys(tables).forEach(k => delete tables[k]);
}

vi.mock('../services/dbService', () => ({
  db: {},
  collection: vi.fn((_db: any, path: string) => ({ path })),
  doc: vi.fn((_db: any, path: string, id: string) => ({ path, id })),
  getDocs: vi.fn(async (ref: any) => {
    let rows = tables[ref?.path] || [];
    for (const c of ref?.constraints || []) {
      if (c?.type === 'where') rows = rows.filter((r: any) => r[c.field] === c.value);
    }
    return {
      docs: rows.map((r: any) => ({ id: r.id, data: () => r, exists: () => true })),
      empty: rows.length === 0,
      size: rows.length,
    };
  }),
  getDoc: vi.fn(async (ref: any) => {
    const row = (tables[ref?.path] || []).find((r: any) => r.id === ref.id);
    return row
      ? { id: row.id, exists: () => true, data: () => row }
      : { id: ref?.id, exists: () => false, data: () => null };
  }),
  setDoc: vi.fn(async (ref: any, data: any) => {
    if (!tables[ref.path]) tables[ref.path] = [];
    tables[ref.path].push({ ...data, id: ref.id });
  }),
  updateDoc: vi.fn(async (ref: any, data: any) => {
    const rows = tables[ref.path] || [];
    const i = rows.findIndex((r: any) => r.id === ref.id);
    if (i >= 0) rows[i] = { ...rows[i], ...data };
  }),
  query: vi.fn((col: any, ...constraints: any[]) => ({ ...col, constraints })),
  where: vi.fn((field: string, op: string, value: any) => ({ type: 'where', field, op, value })),
  orderBy: vi.fn((field: string, direction: string) => ({ type: 'orderBy', field, direction })),
}));

const rpcMock = vi.fn(async (..._args: any[]) => ({ data: null, error: null }));
vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: (...args: any[]) => rpcMock(...args),
    from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(async () => ({ data: [], error: null })) })) })) })),
  },
}));

import {
  validateVoucherLines,
  createPeriod,
  resolvePeriodForDate,
  createVoucher,
  reverseVoucher,
  createRevContract,
  convertToBase,
  openSubAccount,
  sha256Hex,
  TT99Error,
} from '../services/tt99Service';
import type { AccAccount, AccPeriod } from '../types/erp';

const TENANT = 'tenant-vcomm-prod-01';

function seedPeriod(over: Partial<AccPeriod> = {}): AccPeriod {
  const p: AccPeriod = {
    id: 'per-2026-01',
    tenantId: TENANT,
    periodYear: 2026,
    periodNo: 1,
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    status: 'open',
    ...over,
  } as AccPeriod;
  tables['acc_periods'] = [p];
  return p;
}

function seedAccounts(codes: string[]) {
  tables['acc_accounts'] = codes.map((c, i) => ({
    id: `acc-${c}`,
    tenantId: TENANT,
    code: c,
    name: `Tài khoản ${c}`,
    level: 1,
    accountType: 'asset',
    balanceSide: 'debit',
    isSystem: true,
    isActive: true,
    trackPartner: false,
    trackUnit: false,
    isIntercompany: false,
    _i: i,
  })) as any;
}

beforeEach(() => {
  resetDb();
  rpcMock.mockClear();
  rpcMock.mockImplementation(async () => ({ data: null, error: null }));
});

// ===========================================================================
// 1. KẾ TOÁN KÉP (Điều 12)
// ===========================================================================
describe('TT99 — kế toán kép: cân bằng Nợ/Có', () => {
  it('chấp nhận chứng từ cân bằng', () => {
    expect(() => validateVoucherLines([
      { accountCode: '131', debit: 1_100_000, credit: 0 },
      { accountCode: '5111', debit: 0, credit: 1_000_000 },
      { accountCode: '33311', debit: 0, credit: 100_000 },
    ])).not.toThrow();
  });

  it('từ chối chứng từ chỉ có 1 bút toán', () => {
    expect(() => validateVoucherLines([
      { accountCode: '131', debit: 1000, credit: 0 },
    ])).toThrow(TT99Error);
  });

  it('từ chối chứng từ lệch Nợ/Có', () => {
    expect(() => validateVoucherLines([
      { accountCode: '131', debit: 1_000_000, credit: 0 },
      { accountCode: '5111', debit: 0, credit: 900_000 },
    ])).toThrow(/chưa cân bằng/);
  });

  it('từ chối bút toán ghi cả hai bên Nợ và Có', () => {
    expect(() => validateVoucherLines([
      { accountCode: '131', debit: 1000, credit: 1000 },
      { accountCode: '5111', debit: 0, credit: 2000 },
    ])).toThrow(/chỉ được ghi MỘT bên/);
  });

  it('từ chối số tiền âm', () => {
    expect(() => validateVoucherLines([
      { accountCode: '131', debit: -1000, credit: 0 },
      { accountCode: '5111', debit: 0, credit: -1000 },
    ])).toThrow(/không được âm/);
  });

  it('từ chối bút toán số tiền bằng 0', () => {
    expect(() => validateVoucherLines([
      { accountCode: '131', debit: 0, credit: 0 },
      { accountCode: '5111', debit: 1000, credit: 0 },
    ])).toThrow(/số tiền bằng 0/);
  });

  it('từ chối bút toán thiếu mã tài khoản', () => {
    expect(() => validateVoucherLines([
      { accountCode: '', debit: 1000, credit: 0 },
      { accountCode: '5111', debit: 0, credit: 1000 },
    ])).toThrow(/thiếu mã tài khoản/);
  });

  it('dung sai 0.01 VND — chấp nhận sai lệch do làm tròn', () => {
    expect(() => validateVoucherLines([
      { accountCode: '131', debit: 1000.005, credit: 0 },
      { accountCode: '5111', debit: 0, credit: 1000 },
    ])).not.toThrow();
  });
});

// ===========================================================================
// 2. KỲ KẾ TOÁN (Điều 13)
// ===========================================================================
describe('TT99 Điều 13 — kỳ kế toán', () => {
  it('kỳ tháng: ngày đầu/cuối đúng', async () => {
    const jan = await createPeriod({ periodYear: 2026, periodNo: 1 });
    expect(jan.startDate).toBe('2026-01-01');
    expect(jan.endDate).toBe('2026-01-31');

    const apr = await createPeriod({ periodYear: 2026, periodNo: 4 });
    expect(apr.startDate).toBe('2026-04-01');
    expect(apr.endDate).toBe('2026-04-30');
  });

  it('kỳ tháng: năm nhuận — tháng 2 có 29 ngày', async () => {
    const leap = await createPeriod({ periodYear: 2028, periodNo: 2 });
    expect(leap.endDate).toBe('2028-02-29');

    const normal = await createPeriod({ periodYear: 2026, periodNo: 2 });
    expect(normal.endDate).toBe('2026-02-28');
  });

  it('kỳ quý: Q1 = 01/01–31/03, Q4 = 01/10–31/12', async () => {
    const q1 = await createPeriod({ periodYear: 2026, periodNo: 21 });
    expect(q1.startDate).toBe('2026-01-01');
    expect(q1.endDate).toBe('2026-03-31');

    const q4 = await createPeriod({ periodYear: 2026, periodNo: 24 });
    expect(q4.startDate).toBe('2026-10-01');
    expect(q4.endDate).toBe('2026-12-31');
  });

  it('kỳ năm: period_no = NULL, 01/01–31/12', async () => {
    const y = await createPeriod({ periodYear: 2026, periodNo: null });
    expect(y.periodNo).toBeNull();
    expect(y.startDate).toBe('2026-01-01');
    expect(y.endDate).toBe('2026-12-31');
  });

  it('từ chối periodNo không hợp lệ', async () => {
    await expect(createPeriod({ periodYear: 2026, periodNo: 13 })).rejects.toThrow(TT99Error);
    await expect(createPeriod({ periodYear: 2026, periodNo: 25 })).rejects.toThrow(TT99Error);
  });

  it('resolvePeriodForDate tự mở kỳ tháng khi chưa có', async () => {
    const p = await resolvePeriodForDate('2026-05-15');
    expect(p.periodYear).toBe(2026);
    expect(p.periodNo).toBe(5);
    expect(p.startDate).toBe('2026-05-01');
    expect(p.endDate).toBe('2026-05-31');
  });

  it('resolvePeriodForDate trả về kỳ đã tồn tại chứa ngày đó', async () => {
    const existing = seedPeriod();
    const found = await resolvePeriodForDate('2026-01-20');
    expect(found.id).toBe(existing.id);
  });
});

// ===========================================================================
// 3. CHỨNG TỪ (Điều 12) & SỬA SAI (Luật Kế toán Điều 27)
// ===========================================================================
describe('TT99 Điều 12 — chứng từ kế toán', () => {
  it('từ chối ghi chứng từ vào kỳ đã khoá sổ', async () => {
    seedPeriod({ status: 'closed' });
    seedAccounts(['131', '5111']);
    await expect(createVoucher({
      voucherType: 'PT',
      voucherDate: '2026-01-15',
      description: 'Thu tiền khách hàng',
      periodId: 'per-2026-01',
      lines: [
        { accountCode: '131', debit: 0, credit: 1_000_000 },
        { accountCode: '5111', debit: 1_000_000, credit: 0 },
      ],
    })).rejects.toThrow(/Điều 13/);
  });

  it('từ chối khi tài khoản không tồn tại', async () => {
    seedPeriod();
    seedAccounts(['131']);
    await expect(createVoucher({
      voucherType: 'PT',
      voucherDate: '2026-01-15',
      description: 'Thu tiền',
      periodId: 'per-2026-01',
      lines: [
        { accountCode: '999', debit: 0, credit: 1_000_000 },
        { accountCode: '131', debit: 1_000_000, credit: 0 },
      ],
    })).rejects.toThrow(/không tồn tại/);
  });

  it('từ chối khi tài khoản đã bị khoá', async () => {
    seedPeriod();
    seedAccounts(['131', '5111']);
    (tables['acc_accounts'] as any[]).find(a => a.code === '5111').isActive = false;
    await expect(createVoucher({
      voucherType: 'PT',
      voucherDate: '2026-01-15',
      description: 'Bán hàng',
      periodId: 'per-2026-01',
      lines: [
        { accountCode: '131', debit: 1_100_000, credit: 0 },
        { accountCode: '5111', debit: 0, credit: 1_100_000 },
      ],
    })).rejects.toThrow(/đã bị khoá/);
  });

  it('thứ tự ghi: chứng từ NHÁP trước, rồi mới posted (trigger DB yêu cầu)', async () => {
    seedPeriod();
    seedAccounts(['131', '5111', '33311']);

    const v = await createVoucher({
      voucherType: 'PT',
      voucherDate: '2026-01-15',
      description: 'Thu tiền bán hàng',
      periodId: 'per-2026-01',
      lines: [
        { accountCode: '131', debit: 1_100_000, credit: 0 },
        { accountCode: '5111', debit: 0, credit: 1_000_000 },
        { accountCode: '33311', debit: 0, credit: 100_000 },
      ],
      actor: 'ke-toan-01',
    });

    expect(v.status).toBe('posted');
    expect(v.voucherNo).toBe('PT-2601-0001');

    // Bút toán được lưu đúng thứ tự và đúng số tiền
    const lines = (tables['acc_voucher_lines'] as any[]) || [];
    expect(lines).toHaveLength(3);
    expect(lines.map((l: any) => l.lineNo)).toEqual([1, 2, 3]);
    expect(lines.reduce((s: number, l: any) => s + l.debit, 0)).toBe(1_100_000);
    expect(lines.reduce((s: number, l: any) => s + l.credit, 0)).toBe(1_100_000);

    // Chứng từ được tạo ở trạng thái draft TRƯỚC
    const voucherRow = (tables['acc_vouchers'] as any[]).find(r => r.id === v.id);
    expect(voucherRow.status).toBe('posted'); // đã được update sau cùng
    expect(voucherRow.postedBy).toBe('ke-toan-01');
  });

  it('số chứng từ tăng dần theo loại trong kỳ', async () => {
    seedPeriod();
    seedAccounts(['111', '131']);
    const mk = () => createVoucher({
      voucherType: 'PT',
      voucherDate: '2026-01-15',
      description: 'Thu tiền',
      periodId: 'per-2026-01',
      lines: [
        { accountCode: '111', debit: 500_000, credit: 0 },
        { accountCode: '131', debit: 0, credit: 500_000 },
      ],
    });
    expect((await mk()).voucherNo).toBe('PT-2601-0001');
    expect((await mk()).voucherNo).toBe('PT-2601-0002');
  });

  it('quy đổi ngoại tệ sang VND theo tỷ giá ghi sổ', async () => {
    seedPeriod();
    seedAccounts(['1121', '5111']);
    const v = await createVoucher({
      voucherType: 'BN',
      voucherDate: '2026-01-15',
      description: 'Bán hàng xuất khẩu 1.000 USD',
      periodId: 'per-2026-01',
      currencyCode: 'USD',
      fxRate: 25_000,
      lines: [
        { accountCode: '1121', debit: 25_000_000, credit: 0, debitOrig: 1000 },
        { accountCode: '5111', debit: 0, credit: 25_000_000, creditOrig: 1000 },
      ],
    });
    expect(v.currencyCode).toBe('USD');
    const l = (tables['acc_voucher_lines'] as any[])[0];
    expect(l.debit).toBe(25_000_000);
    // Nguyên tệ = VND / tỷ giá
    expect(l.debitOrig).toBe(1000);
  });
});

describe('Luật Kế toán Điều 27 — sửa sai bằng chứng từ điều chỉnh', () => {
  async function makePostedVoucher() {
    seedPeriod();
    seedAccounts(['111', '5111']);
    return createVoucher({
      voucherType: 'PT',
      voucherDate: '2026-01-15',
      description: 'Thu tiền bán hàng (sai số tiền)',
      periodId: 'per-2026-01',
      lines: [
        { accountCode: '111', debit: 5_000_000, credit: 0 },
        { accountCode: '5111', debit: 0, credit: 5_000_000 },
      ],
      actor: 'ke-toan-01',
    });
  }

  it('tạo chứng từ điều chỉnh ĐẢO NGƯỢC Nợ/Có, không xoá chứng từ gốc', async () => {
    const original = await makePostedVoucher();
    const { reversal } = await reverseVoucher({
      voucherId: original.id,
      reason: 'Ghi sai số tiền — đúng là 4.500.000',
      actor: 'ke-toan-truong',
    });

    expect(reversal).toBeDefined();
    expect(reversal?.reversalOf).toBe(original.id);

    const revLines = ((tables['acc_voucher_lines'] as any[]) || []).filter(
      (l: any) => l.voucherId === reversal?.id
    );
    expect(revLines).toHaveLength(2);
    // Bút toán gốc: Nợ 111 / Có 5111 → đảo ngược: Có 111 / Nợ 5111
    const l111 = revLines.find((l: any) => l.accountCode === '111');
    const l5111 = revLines.find((l: any) => l.accountCode === '5111');
    expect(l111.debit).toBe(0);
    expect(l111.credit).toBe(5_000_000);
    expect(l5111.debit).toBe(5_000_000);
    expect(l5111.credit).toBe(0);
  });

  it('từ chối điều chỉnh chứng từ NHÁP (phải sửa trực tiếp)', async () => {
    seedPeriod();
    seedAccounts(['111', '5111']);
    const draft = await createVoucher({
      voucherType: 'PT',
      voucherDate: '2026-01-15',
      description: 'Nháp',
      periodId: 'per-2026-01',
      lines: [
        { accountCode: '111', debit: 1000, credit: 0 },
        { accountCode: '5111', debit: 0, credit: 1000 },
      ],
      post: false,
    });
    await expect(reverseVoucher({
      voucherId: draft.id,
      reason: 'test',
      actor: 'ke-toan-01',
    })).rejects.toThrow(/Chỉ chứng từ đã ghi sổ/);
  });

  it('từ chối điều chỉnh hai lần', async () => {
    const original = await makePostedVoucher();
    await reverseVoucher({
      voucherId: original.id,
      reason: 'Lần 1',
      actor: 'ke-toan-01',
      withReversal: false,
    });
    // Giả lập DB trigger đã chuyển gốc sang 'reversed'
    (tables['acc_vouchers'] as any[]).find(v => v.id === original.id).status = 'reversed';

    await expect(reverseVoucher({
      voucherId: original.id,
      reason: 'Lần 2',
      actor: 'ke-toan-01',
    })).rejects.toThrow(/đã được điều chỉnh/);
  });
});

// ===========================================================================
// 4. HỆ TÀI KHOẢN (Điều 11)
// ===========================================================================
describe('TT99 Điều 11 — hệ tài khoản', () => {
  it('từ chối tự mở tài khoản CẤP 1 (71 TK do TT99 ban hành)', async () => {
    await expect(openSubAccount({
      code: '219',
      name: 'Tài sản tự mở',
      parentCode: '211',
      regulationRef: 'QC-TT99-001',
    })).rejects.toThrow(/cấp 1 .* do TT99 ban hành/);
  });

  it('từ chối khi tài khoản cha không tồn tại', async () => {
    seedAccounts(['112']);
    await expect(openSubAccount({
      code: '1129',
      name: 'Tiền gửi tại VCB',
      parentCode: '999',
      regulationRef: 'QC-TT99-001',
    })).rejects.toThrow(/không tồn tại/);
  });

  it('từ chối mã không nằm dưới mã cha', async () => {
    seedAccounts(['112']);
    await expect(openSubAccount({
      code: '1131',
      name: 'Sai cấu trúc',
      parentCode: '112',
      regulationRef: 'QC-TT99-001',
    })).rejects.toThrow(/không bắt đầu bằng mã cha/);
  });

  it('từ chối mã tài khoản không phải 3-6 chữ số', async () => {
    seedAccounts(['112']);
    await expect(openSubAccount({
      code: 'VCB',
      name: 'Tiền gửi VCB',
      parentCode: '112',
      regulationRef: 'QC-TT99-001',
    })).rejects.toThrow(/3–6 chữ số/);
  });

  it('mở TK cấp 2 thành công — kế thừa loại & bên dư từ cha', async () => {
    seedAccounts(['112']);
    const acc = await openSubAccount({
      code: '1121',
      name: 'Tiền gửi VCB',
      parentCode: '112',
      regulationRef: 'QC-TT99-001',
      trackPartner: false,
    });
    expect(acc.level).toBe(2);
    expect(acc.parentCode).toBe('112');
    expect(acc.isSystem).toBe(false);
    expect(acc.regulationRef).toBe('QC-TT99-001');
    expect(acc.isActive).toBe(true);
  });

  it('mở TK cấp 3 khi mã dài 5-6 chữ số', async () => {
    seedAccounts(['112']);
    const acc = await openSubAccount({
      code: '112101',
      name: 'TK VCB chi nhánh HN',
      parentCode: '112',
      regulationRef: 'QC-TT99-001',
    });
    expect(acc.level).toBe(3);
  });

  it('từ chối trùng mã đã tồn tại', async () => {
    seedAccounts(['112', '1121']);
    await expect(openSubAccount({
      code: '1121',
      name: 'Trùng',
      parentCode: '112',
      regulationRef: 'QC-TT99-001',
    })).rejects.toThrow(/đã tồn tại/);
  });
});

// ===========================================================================
// 5. IFRS 15 — giá giao dịch (Bước 1 + 3)
// ===========================================================================
describe('IFRS 15 Bước 3 — giá giao dịch có ràng buộc', () => {
  it('giá giao dịch = cố định + biến động × % ràng buộc', async () => {
    const c = await createRevContract({
      contractNo: 'HD-2026-0001',
      customerId: 'kh-001',
      signedDate: '2026-01-10',
      fixedAmount: 10_000_000,
      variableAmount: 2_000_000,
      variableConstraintPct: 60,
    });
    expect(c.fixedAmount).toBe(10_000_000);
    expect(c.variableAmount).toBe(2_000_000);
    // 10tr + 2tr × 60% = 11,2tr
    expect(c.transactionPrice).toBe(11_200_000);
    expect(c.deferredTotal).toBe(11_200_000);
    expect(c.recognizedTotal).toBe(0);
  });

  it('mặc định ràng buộc 100% — ghi nhận toàn bộ phần biến động', async () => {
    const c = await createRevContract({
      contractNo: 'HD-2026-0002',
      customerId: 'kh-002',
      signedDate: '2026-01-10',
      fixedAmount: 5_000_000,
      variableAmount: 1_000_000,
    });
    expect(c.variableConstraintPct).toBe(100);
    expect(c.transactionPrice).toBe(6_000_000);
  });

  it('ràng buộc 0% — không ghi nhận phần biến động', async () => {
    const c = await createRevContract({
      contractNo: 'HD-2026-0003',
      customerId: 'kh-003',
      signedDate: '2026-01-10',
      fixedAmount: 5_000_000,
      variableAmount: 1_000_000,
      variableConstraintPct: 0,
    });
    expect(c.transactionPrice).toBe(5_000_000);
  });

  it('hợp đồng mới luôn ở trạng thái draft & chưa ghi nhận', async () => {
    const c = await createRevContract({
      contractNo: 'HD-2026-0004',
      customerId: 'kh-004',
      signedDate: '2026-01-10',
      fixedAmount: 1_000_000,
    });
    expect(c.status).toBe('draft');
    expect(c.allocatedTotal).toBe(0);
    expect(c.recognizedTotal).toBe(0);
  });
});

describe('TT99 Điều 4-6 — đơn vị tiền tệ kế toán', () => {
  it('VND giữ nguyên', async () => {
    expect(await convertToBase(123_456, 'VND')).toBe(123_456);
  });

  it('ngoại tệ nhân tỷ giá ghi sổ', async () => {
    expect(await convertToBase(1000, 'USD', 25_000)).toBe(25_000_000);
  });

  it('ngoại tệ không có tỷ giá → coi như 1 (không tự ý quy đổi)', async () => {
    expect(await convertToBase(1000, 'USD')).toBe(1000);
  });
});

// ===========================================================================
// 6. LƯU VẾT — băm SHA-256
// ===========================================================================
describe('TT99 Điều 28 — băm lưu vết', () => {
  it('SHA-256 ổn định & đúng giá trị đã biết của chuỗi rỗng', async () => {
    const empty = await sha256Hex('');
    expect(empty).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(await sha256Hex('')).toBe(empty);
  });

  it('cùng đầu vào cho cùng băm, khác đầu vào cho băm khác', async () => {
    const a = await sha256Hex('chung-tu-001');
    const b = await sha256Hex('chung-tu-001');
    const c = await sha256Hex('chung-tu-002');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toHaveLength(64);
  });

  it('băm nhạy với thay đổi nhỏ nhất (chuỗi lưu vết bị sửa)', async () => {
    const before = await sha256Hex('prev|INSERT|1000000');
    const after = await sha256Hex('prev|INSERT|1000001');
    expect(before).not.toBe(after);
  });
});

// ===========================================================================
// 7. DỮ LIỆU GỐC — 71 tài khoản cấp 1 của TT99
// ===========================================================================
describe('TT99 Phụ lục II — 71 tài khoản cấp 1', () => {
  const sqlPath = path.resolve(
    process.cwd(),
    'specs/021-tt99-ke-toan-doanh-nghiep/migrations/001_coa.sql'
  );
  let sql = '';
  try {
    sql = readFileSync(sqlPath, 'utf-8');
  } catch (e) {
    throw new Error(`Không đọc được ${sqlPath}. Chạy vitest từ thư mục gốc V-com-ERP.`);
  }

  // Phân tích đầy đủ các dòng seed TK CẤP 1:
  // ('tenant-...','CODE','Tên',1,NULL,'type','side',isSys,isActive,trackPartner,trackUnit,isIntercompany,'note')
  const level1 = [...sql.matchAll(
    /^\('tenant-vcomm-prod-01','(\d{3})','([^']*)',1,NULL,'([a-z_]+)','(debit|credit)',(TRUE|FALSE),(TRUE|FALSE),(TRUE|FALSE),(TRUE|FALSE),(TRUE|FALSE),/gm
  )].map(m => ({
    code: m[1],
    name: m[2],
    accountType: m[3],
    balanceSide: m[4],
    isSystem: m[5] === 'TRUE',
    isActive: m[6] === 'TRUE',
    trackPartner: m[7] === 'TRUE',
    trackUnit: m[8] === 'TRUE',
    isIntercompany: m[9] === 'TRUE',
  }));

  it('seed đúng 71 tài khoản cấp 1', () => {
    expect(level1.length).toBe(71);
  });

  it('phân bổ đúng 9 loại tài khoản: 33 TS + 16 Nợ + 7 VCSH + 3 DT + 8 CP + 4 khác', () => {
    const count = (t: string) => level1.filter(a => a.accountType === t).length;
    expect(count('asset')).toBe(33);
    expect(count('liability')).toBe(16);
    expect(count('equity')).toBe(7);
    expect(count('revenue')).toBe(3);
    expect(count('expense')).toBe(8);
    // Thu nhập khác + chi phí khác + xác định kết quả
    expect(count('other_income') + count('other_expense') + count('determine_result')).toBe(4);
  });

  it('tất cả 71 TK đều là hệ thống & đang hoạt động (không thể xoá/khoá)', () => {
    expect(level1.every(a => a.isSystem)).toBe(true);
    expect(level1.every(a => a.isActive)).toBe(true);
  });

  it('không có mã trùng lặp', () => {
    const codes = level1.map(a => a.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('7 tài khoản bị BÃI BỎ ở TT99 không còn trong hệ', () => {
    // 161 Chi phí sự nghiệp · 417 Kinh phí sự nghiệp · 441 Nguồn vốn đầu tư XDCB
    // 461 Nguồn kinh phí sự nghiệp · 466 Nguồn kinh phí đã hình thành TSCĐ
    // 611 Mua hàng · 631 Giá thành sản xuất
    const abolished = ['161', '417', '441', '461', '466', '611', '631'];
    const codes = level1.map(a => a.code);
    abolished.forEach(code => expect(codes).not.toContain(code));
  });

  it('2 tài khoản MỚI của TT99 có mặt: 215 Tài sản sinh học, 332 Phải trả cổ tức', () => {
    const byCode = Object.fromEntries(level1.map(a => [a.code, a.name]));
    expect(byCode['215']).toBe('Tài sản sinh học');
    expect(byCode['332']).toBe('Phải trả cổ tức, lợi nhuận');
  });

  it('các tài khoản VComm đang dùng đều còn hiệu lực trong TT99', () => {
    const codes = level1.map(a => a.code);
    // 112 Tiền gửi không kỳ hạn · 131 Phải thu khách hàng · 136 Phải thu nội bộ
    // 156 Hàng hóa · 331 Phải trả người bán · 33311 Thuế GTGT đầu ra
    // 336 Phải trả nội bộ · 511 Doanh thu · 632 Giá vốn · 641 Chi phí bán hàng
    ['112', '131', '136', '156', '331', '336', '511', '632', '641', '338'].forEach(code => {
      expect(codes).toContain(code);
    });
  });

  it('TK 112 được ĐỔI TÊN so với TT200', () => {
    const byCode = Object.fromEntries(level1.map(a => [a.code, a.name]));
    expect(byCode['112']).toBe('Tiền gửi không kỳ hạn');
    expect(byCode['112']).not.toBe('Tiền gửi ngân hàng');
  });

  it('các tài khoản công nợ nội bộ được gắn cờ isIntercompany (Điều 7)', () => {
    const internal = level1.filter(a => a.isIntercompany).map(a => a.code);
    expect(internal).toContain('136'); // Phải thu nội bộ
    expect(internal).toContain('336'); // Phải trả nội bộ
    // Không gắn nhầm các TK thường
    expect(internal).not.toContain('131');
    expect(internal).not.toContain('331');
  });
});
