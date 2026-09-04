import { describe, it, expect } from 'vitest';
import {
  reconcileBankStatement,
  normalizeRef,
  extractRefTokens,
  refMatches,
  findAmountGroup,
  BankReconciliationError,
  type BankStatementLine,
  type LedgerLine,
} from './bankReconciliationService';

const D = '2026-09-01';

describe('GĐ 2.2 — normalizeRef / extractRefTokens / refMatches', () => {
  it('chuẩn hoá mã: viết hoa, bỏ ký tự đặc biệt', () => {
    expect(normalizeRef('vcm ord-2026-001')).toBe('VCMORD2026001');
    expect(normalizeRef(null)).toBe('');
  });

  it('tách token từ nội dung chuyển khoản (bỏ token quá ngắn, GIỮ NGUYÊN mã ghép)', () => {
    // ⭐ "ORD-2026-001" phải còn NGUYÊN VẸN thành "ORD2026001" — nếu bị xé bởi dấu
    // gạch ngang thì "ORD"(3) và "001"(3) rớt qua bộ lọc độ dài → mất mã đơn.
    expect(extractRefTokens('THANH TOAN ORD-2026-001 SEPAY')).toEqual([
      'THANH', 'TOAN', 'ORD2026001', 'SEPAY',
    ]);
    expect(extractRefTokens('ab cd', 4)).toEqual([]);
    // dấu phẩy / chấm phẩy / gạch đứng cũng là ranh giới token; mã ngân hàng
    // viết tắt ngắn (VCB=3, MB=2) bị lọc theo minLength → tránh nhiễu
    expect(extractRefTokens('THANH TOAN, ORD-2026-001; SEPAY|MBBANK')).toEqual([
      'THANH', 'TOAN', 'ORD2026001', 'SEPAY', 'MBBANK',
    ]);
    expect(extractRefTokens('VCB MB', 4)).toEqual([]);
  });

  it('⭐ tìm được mã đơn nằm LẪN trong nội dung sao kê', () => {
    const bank = { refCode: null, description: 'THANH TOAN DON HANG ORD-2026-001 SEPAY' };
    const ledger = { refCode: 'ORD-2026-001', description: null };
    expect(refMatches(bank, ledger)).toBe(true);
  });

  it('không khớp khi mã khác nhau', () => {
    expect(refMatches({ description: 'ORD-2026-002' }, { refCode: 'ORD-2026-001' })).toBe(false);
  });

  it('khớp chiều ngược: mã sao kê nằm trong mô tả sổ cái', () => {
    expect(refMatches({ refCode: 'FT26091XYZ', description: null }, { refCode: null, description: 'chuyen khoan FT26091XYZ' })).toBe(true);
  });
});

describe('GĐ 2.2 — lượt ①: khớp theo MÃ THAM CHIẾU', () => {
  it('khớp 1–1 khi mã đơn nằm trong nội dung CK', () => {
    const bank: BankStatementLine[] = [
      { id: 'B1', date: D, amount: 1_000_000, description: 'THANH TOAN ORD-2026-001' },
    ];
    const ledger: LedgerLine[] = [{ id: 'L1', date: D, amount: 1_000_000, refCode: 'ORD-2026-001' }];

    const r = reconcileBankStatement(bank, ledger);
    expect(r.matches).toHaveLength(1);
    expect(r.matches[0].confidence).toBe('exact_ref');
    expect(r.unmatchedBank).toHaveLength(0);
    expect(r.unmatchedLedger).toHaveLength(0);
  });

  it('ưu tiên MÃ hơn SỐ TIỀN: 2 chứng từ cùng số tiền → chọn đúng mã', () => {
    const bank: BankStatementLine[] = [
      { id: 'B1', date: D, amount: 500_000, description: 'TT don ORD-B' },
    ];
    const ledger: LedgerLine[] = [
      { id: 'LA', date: D, amount: 500_000, refCode: 'ORD-A' },
      { id: 'LB', date: D, amount: 500_000, refCode: 'ORD-B' },
    ];
    const r = reconcileBankStatement(bank, ledger);
    expect(r.matches[0].ledgerLineIds).toEqual(['LB']);
  });

  it('có mã nhưng LỆCH TIỀN quá tolerance → KHÔNG khớp mù quáng', () => {
    const bank: BankStatementLine[] = [
      { id: 'B1', date: D, amount: 900_000, description: 'TT don ORD-A' },
    ];
    const ledger: LedgerLine[] = [{ id: 'L1', date: D, amount: 1_000_000, refCode: 'ORD-A' }];

    const r = reconcileBankStatement(bank, ledger, { tolerance: 0 });
    expect(r.matches).toHaveLength(0);
    expect(r.unmatchedBank).toHaveLength(1);
  });
});

describe('GĐ 2.2 — lượt ②: khớp theo SỐ TIỀN + CỬA SỐ NGÀY', () => {
  it('không có mã → vẫn khớp nhờ số tiền + ngày gần nhau', () => {
    const bank: BankStatementLine[] = [{ id: 'B1', date: '2026-09-03', amount: 2_000_000, description: 'CK' }];
    const ledger: LedgerLine[] = [{ id: 'L1', date: '2026-09-01', amount: 2_000_000 }];

    const r = reconcileBankStatement(bank, ledger);
    expect(r.matches[0].confidence).toBe('amount_date');
  });

  it('lệch ngày QUÁ cửa sổ → không khớp', () => {
    const bank: BankStatementLine[] = [{ id: 'B1', date: '2026-09-20', amount: 2_000_000 }];
    const ledger: LedgerLine[] = [{ id: 'L1', date: '2026-09-01', amount: 2_000_000 }];

    const r = reconcileBankStatement(bank, ledger, { maxDateSkewDays: 3 });
    expect(r.matches).toHaveLength(0);
  });

  it('tolerance hấp thụ PHÍ CHUYỂN KHOẢN, có ghi chú để soát', () => {
    const bank: BankStatementLine[] = [{ id: 'B1', date: D, amount: 999_000 }]; // trừ 1.000đ phí
    const ledger: LedgerLine[] = [{ id: 'L1', date: D, amount: 1_000_000 }];

    const r = reconcileBankStatement(bank, ledger, { tolerance: 5_000 });
    expect(r.matches[0].difference).toBe(-1000);
    expect(r.matches[0].note).toMatch(/PHÍ CHUYỂN KHOẢN/);
  });

  it('chọn ứng viên GẦN NGÀY NHẤT khi có nhiều dòng cùng số tiền', () => {
    const bank: BankStatementLine[] = [{ id: 'B1', date: '2026-09-10', amount: 1_000_000 }];
    const ledger: LedgerLine[] = [
      { id: 'Lxa', date: '2026-09-01', amount: 1_000_000 },
      { id: 'Lgan', date: '2026-09-09', amount: 1_000_000 },
    ];
    const r = reconcileBankStatement(bank, ledger);
    expect(r.matches[0].ledgerLineIds).toEqual(['Lgan']);
  });

  it('1 dòng sổ cái chỉ được khớp 1 lần (không dùng lại)', () => {
    const bank: BankStatementLine[] = [
      { id: 'B1', date: D, amount: 1_000_000 },
      { id: 'B2', date: D, amount: 1_000_000 },
    ];
    const ledger: LedgerLine[] = [{ id: 'L1', date: D, amount: 1_000_000 }];

    const r = reconcileBankStatement(bank, ledger);
    expect(r.matches).toHaveLength(1);
    expect(r.unmatchedBank).toHaveLength(1);
  });
});

describe('GĐ 2.2 — lượt ③: GỘP NHIỀU chứng từ = 1 lần chuyển khoản', () => {
  it('gộp 3 đơn thành 1 lần CK', () => {
    const bank: BankStatementLine[] = [{ id: 'B1', date: D, amount: 600_000 }];
    const ledger: LedgerLine[] = [
      { id: 'L1', date: D, amount: 100_000 },
      { id: 'L2', date: D, amount: 200_000 },
      { id: 'L3', date: D, amount: 300_000 },
    ];

    const r = reconcileBankStatement(bank, ledger);
    expect(r.matches[0].confidence).toBe('grouped');
    expect(r.matches[0].ledgerLineIds.sort()).toEqual(['L1', 'L2', 'L3']);
    expect(r.matches[0].difference).toBe(0);
    expect(r.matches[0].note).toMatch(/SOÁT TAY/);
  });

  it('ưu tiên ghép ÍT dòng nhất (2 dòng đẹp hơn 3 dòng)', () => {
    const bank: BankStatementLine[] = [{ id: 'B1', date: D, amount: 300_000 }];
    const ledger: LedgerLine[] = [
      { id: 'L100', date: D, amount: 100_000 },
      { id: 'L200', date: D, amount: 200_000 },
      { id: 'L150', date: D, amount: 150_000 },
      { id: 'L150b', date: D, amount: 150_000 },
    ];
    const r = reconcileBankStatement(bank, ledger);
    // {200+100} được thử trước {150+150} vì sort theo |amount| giảm dần
    expect(r.matches[0].ledgerLineIds.sort()).toEqual(['L100', 'L200']);
  });

  it('không gộp khi tổng không khớp', () => {
    const bank: BankStatementLine[] = [{ id: 'B1', date: D, amount: 999_999 }];
    const ledger: LedgerLine[] = [
      { id: 'L1', date: D, amount: 100_000 },
      { id: 'L2', date: D, amount: 200_000 },
    ];
    const r = reconcileBankStatement(bank, ledger);
    expect(r.matches).toHaveLength(0);
    expect(r.unmatchedBank).toHaveLength(1);
  });

  it('tắt allowManyToOne → không gộp', () => {
    const bank: BankStatementLine[] = [{ id: 'B1', date: D, amount: 600_000 }];
    const ledger: LedgerLine[] = [
      { id: 'L1', date: D, amount: 300_000 },
      { id: 'L2', date: D, amount: 300_000 },
    ];
    const r = reconcileBankStatement(bank, ledger, { allowManyToOne: false });
    expect(r.matches).toHaveLength(0);
  });

  it('maxGroupSize giới hạn độ lớn tổ hợp (chống nổ)', () => {
    const bank: BankStatementLine[] = [{ id: 'B1', date: D, amount: 1_000_000 }];
    const ledger: LedgerLine[] = Array.from({ length: 40 }, (_, i) => ({
      id: `L${String(i).padStart(2, '0')}`, date: D, amount: 25_000,
    }));
    const r = reconcileBankStatement(bank, ledger, { maxGroupSize: 5 });
    expect(r.matches).toHaveLength(0); // cần 40 dòng > giới hạn 5
  });

  it('findAmountGroup: không ghép các dòng TRÁI DẤU (triệt tiêu nhau, vô nghĩa)', () => {
    const group = findAmountGroup(100_000, [{ id: 'a', date: D, amount: 500_000 }, { id: 'b', date: D, amount: -400_000 }], 5, 0);
    expect(group).toBeNull();
  });
});

describe('GĐ 2.2 — báo cáo & cảnh báo rủi ro', () => {
  it('phát hiện TIỀN VÀO CHƯA RÕ NGUỒN (sao kê có, sổ không)', () => {
    const r = reconcileBankStatement(
      [{ id: 'B1', date: D, amount: 5_000_000, description: 'CK la' }],
      []
    );
    expect(r.unmatchedBank).toHaveLength(1);
    expect(r.warnings.join(' ')).toMatch(/chưa có chứng từ/);
  });

  it('phát hiện ĐÃ GHI SỔ MÀ CHƯA THẤY TIỀN (rủi ro doanh thu khống)', () => {
    const r = reconcileBankStatement([], [{ id: 'L1', date: D, amount: 5_000_000 }]);
    expect(r.unmatchedLedger).toHaveLength(1);
    expect(r.warnings.join(' ')).toMatch(/CHƯA THẤY TIỀN/);
  });

  it('phát hiện giao dịch TRÙNG trên sao kê (nghi double-count)', () => {
    const r = reconcileBankStatement(
      [
        { id: 'B1', date: D, amount: 1_000_000, refCode: 'ORD-1' },
        { id: 'B2', date: D, amount: 1_000_000, refCode: 'ORD-1' },
      ],
      [{ id: 'L1', date: D, amount: 1_000_000, refCode: 'ORD-1' }]
    );
    expect(r.warnings.join(' ')).toMatch(/TRÙNG giao dịch/);
  });

  it('summary: tổng hợp đúng', () => {
    const r = reconcileBankStatement(
      [
        { id: 'B1', date: D, amount: 1_000_000, refCode: 'ORD-1' },
        { id: 'B2', date: D, amount: 7_000_000 },
      ],
      [{ id: 'L1', date: D, amount: 1_000_000, refCode: 'ORD-1' }]
    );
    expect(r.summary.bankLineCount).toBe(2);
    expect(r.summary.ledgerLineCount).toBe(1);
    expect(r.summary.matchedBankCount).toBe(1);
    expect(r.summary.bankTotal).toBe(8_000_000);
    expect(r.summary.ledgerTotal).toBe(1_000_000);
    expect(r.summary.netDifference).toBe(7_000_000);
  });

  it('đối chiếu xong hoàn toàn → netDifference = 0, không cảnh báo', () => {
    const r = reconcileBankStatement(
      [{ id: 'B1', date: D, amount: 1_000_000, refCode: 'ORD-1' }],
      [{ id: 'L1', date: D, amount: 1_000_000, refCode: 'ORD-1' }]
    );
    expect(r.summary.netDifference).toBe(0);
    expect(r.warnings).toHaveLength(0);
  });
});

describe('GĐ 2.2 — tính ổn định & chống dữ liệu rác', () => {
  const bank: BankStatementLine[] = [
    { id: 'B2', date: '2026-09-05', amount: 300_000, description: 'CK ORD-2' },
    { id: 'B1', date: '2026-09-01', amount: 100_000, description: 'CK ORD-1' },
  ];
  const ledger: LedgerLine[] = [
    { id: 'L2', date: '2026-09-05', amount: 300_000, refCode: 'ORD-2' },
    { id: 'L1', date: '2026-09-01', amount: 100_000, refCode: 'ORD-1' },
  ];

  it('đổi thứ tự đầu vào → CÙNG kết quả (không phụ thuộc thứ tự mảng)', () => {
    const a = reconcileBankStatement(bank, ledger);
    const b = reconcileBankStatement([...bank].reverse(), [...ledger].reverse());
    expect(b.matches.map((m) => m.ledgerLineIds)).toEqual(a.matches.map((m) => m.ledgerLineIds));
  });

  it('thiếu id → ném lỗi', () => {
    expect(() => reconcileBankStatement([{ id: '', date: D, amount: 1 }], [])).toThrow(BankReconciliationError);
  });

  it('amount NaN → ném lỗi (không lén bỏ qua)', () => {
    expect(() => reconcileBankStatement([{ id: 'B1', date: D, amount: NaN }], [])).toThrow(BankReconciliationError);
  });

  it('ngày rác → ném lỗi', () => {
    expect(() => reconcileBankStatement([{ id: 'B1', date: 'không-phải-ngày', amount: 1 }], [])).toThrow(
      BankReconciliationError
    );
  });

  it('hai danh sách rỗng → kết quả rỗng hợp lệ, không ném lỗi', () => {
    const r = reconcileBankStatement([], []);
    expect(r.matches).toEqual([]);
    expect(r.summary.netDifference).toBe(0);
  });
});
