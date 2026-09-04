import { describe, it, expect } from 'vitest';
import {
  computeFilingDeadline,
  qualifiesForIncidentGrace,
  nextWorkingDay,
  buildFilingBatch,
  shouldRunFiling,
} from './taxFilingService';

const iso = (dt: Date) => dt.toISOString().slice(0, 10);
const d = (s: string) => new Date(`${s}T12:00:00.000Z`);

describe('S5 — job kê khai thuế (NĐ 252 Điều 10 + TT 89 Điều 12.3 + Điều 43.4)', () => {
  it('hạn nộp tháng = ngày 20 tháng tiếp theo', () => {
    expect(iso(computeFilingDeadline('2026-M01'))).toBe('2026-02-20');
    expect(iso(computeFilingDeadline('2026-M12'))).toBe('2027-01-20');
  });

  it('hạn nộp quý = cuối tháng đầu quý sau', () => {
    expect(iso(computeFilingDeadline('2026-Q1'))).toBe('2026-04-30');
    expect(iso(computeFilingDeadline('2026-Q2'))).toBe('2026-07-31');
    expect(iso(computeFilingDeadline('2026-Q4'))).toBe('2027-01-31');
  });

  it('hạn nộp năm = 31/03 năm sau', () => {
    expect(iso(computeFilingDeadline('2026-Y'))).toBe('2027-03-31');
  });

  it('Điều 12.3: đúng ngày cuối & CQT sập → được gia hạn', () => {
    // deadline Q1/2026 = 2026-04-30
    expect(qualifiesForIncidentGrace('2026-Q1', true, d('2026-04-30'))).toBe(true);
    // CQT không sập → không gia hạn
    expect(qualifiesForIncidentGrace('2026-Q1', false, d('2026-04-30'))).toBe(false);
    // không phải ngày cuối → không gia hạn (dù CQT sập)
    expect(qualifiesForIncidentGrace('2026-Q1', true, d('2026-04-15'))).toBe(false);
  });

  it('nextWorkingDay bỏ qua T7/CN', () => {
    // 2026-04-25 là Thứ Bảy → ngày làm việc kế là T2 2026-04-27
    expect(iso(nextWorkingDay(d('2026-04-25')))).toBe('2026-04-27');
    // 2026-05-06 Thứ Tư → T5 2026-05-07
    expect(iso(nextWorkingDay(d('2026-05-06')))).toBe('2026-05-07');
  });

  it('Điều 43.4: loại trừ giao dịch đã bị bên thứ 3 khấu trừ', () => {
    const txns = [
      { id: 'T1', orderId: 'O1', sellerTaxCode: '010010', amount: 1_000_000 },
      { id: 'T2', orderId: 'O2', sellerTaxCode: '020020', amount: 2_000_000 },
      { id: 'T3', orderId: 'O3', sellerTaxCode: '030030', amount: 3_000_000 },
    ];
    // O2 đã bị tổ chức tại VN khấu trừ → nhận thông báo
    const withheld = new Set<string>(['O2']);
    const batch = buildFilingBatch('2026-Q1', txns, withheld);
    expect(batch.included.map((t) => t.id).sort()).toEqual(['T1', 'T3']);
    expect(batch.excludedByThirdParty.map((t) => t.id)).toEqual(['T2']);
    expect(batch.totalIncludedAmount).toBe(4_000_000);
    expect(batch.totalExcludedAmount).toBe(2_000_000);
  });

  it('Điều 43.4: khớp theo sellerTaxCode khi không có orderId', () => {
    const txns = [{ id: 'T9', sellerTaxCode: '090090', amount: 500_000 }];
    const withheld = new Set<string>(['090090']);
    const batch = buildFilingBatch('2026-Q2', txns, withheld);
    expect(batch.included).toHaveLength(0);
    expect(batch.excludedByThirdParty).toHaveLength(1);
  });

  it('shouldRunFiling: trước/đúng hạn đều chạy', () => {
    expect(shouldRunFiling('2026-Q1', false, d('2026-03-01'))).toBe(true);
    expect(shouldRunFiling('2026-Q1', false, d('2026-04-30'))).toBe(true);
  });
});
