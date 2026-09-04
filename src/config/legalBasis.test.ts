import { describe, it, expect } from 'vitest';
import {
  LEGAL_BASIS,
  isBasisInForce,
  assertBasisInForce,
  getBasis,
  type LegalBasisKey,
} from './legalBasis';

const TODAY = new Date('2026-09-02');

describe('LEGAL_BASIS — single source of truth', () => {
  it('mọi văn bản đều có effectiveFrom hợp lệ', () => {
    for (const k of Object.keys(LEGAL_BASIS) as LegalBasisKey[]) {
      expect(new Date(LEGAL_BASIS[k].effectiveFrom).toString()).not.toBe('Invalid Date');
    }
  });

  it('mọi văn bản trong replaced đều có chuỗi mã hợp lệ (xx/yyyy)', () => {
    for (const k of Object.keys(LEGAL_BASIS) as LegalBasisKey[]) {
      for (const r of LEGAL_BASIS[k].replaced ?? []) {
        expect(r).toMatch(/^(TT|NĐ)\s?\d+\/\d{4}/);
      }
    }
  });

  it('NĐ 174/2025 (giảm 2% GTGT) đang hiệu lực đến 31/12/2026', () => {
    expect(LEGAL_BASIS.vatReduction.code).toBe('NĐ 174/2025/NĐ-CP');
    expect(LEGAL_BASIS.vatReduction.effectiveTo).toBe('2026-12-31');
    expect(LEGAL_BASIS.vatReduction.rate).toBe(0.08);
    expect(isBasisInForce('vatReduction', TODAY)).toBe(true);
  });

  it('sau 31/12/2026, giảm thuế 8% hết hiệu lực → assertBasisInForce ném lỗi', () => {
    expect(() => assertBasisInForce('vatReduction', new Date('2027-01-01'))).toThrow(/không còn hiệu lực/);
  });

  it('TT 91/2026 thay thế cả TT 78/2021 và TT 32/2025', () => {
    expect(getBasis('einvoice').replaced).toContain('TT 78/2021/TT-BTC');
    expect(getBasis('einvoice').replaced).toContain('TT 32/2025/TT-BTC');
  });

  it('NĐ 252/2026 thay thế NĐ 117/2025 (nghĩa vụ sàn cũ)', () => {
    expect(getBasis('platformTax').replaced).toContain('NĐ 117/2025/NĐ-CP');
  });

  it('KHÔNG được viện dẫn NĐ 72/2025 làm căn cứ giảm thuế GTGT (đó là giá điện)', () => {
    // Cạm bẫy lịch sử của dự án: NĐ 72/2025 sai văn bản. LegalBasis phải ghi rõ để ai đọc cũng thấy.
    expect(getBasis('vatReduction').notes ?? '').toMatch(/NĐ 72\/2025/);
    // và code không được để NĐ 72/2025 làm code căn cứ giảm thuế
    expect(getBasis('vatReduction').code).not.toMatch(/NĐ 72\/2025/);
  });

  it('code đang dùng không được trùng với bất kỳ văn bản bị thay thế', () => {
    const liveCodes = new Set(Object.values(LEGAL_BASIS).map((b) => b.code));
    const allReplaced = new Set(
      Object.values(LEGAL_BASIS).flatMap((b) => [...(b.replaced ?? [])]),
    );
    for (const live of liveCodes) {
      expect(allReplaced.has(live)).toBe(false);
    }
  });

  it('TT 99/2025 là căn cứ kế toán hiện hành (thay TT 200/2014)', () => {
    expect(getBasis('accounting').code).toBe('TT 99/2025/TT-BTC');
    expect(getBasis('accounting').replaced).toContain('TT 200/2014/TT-BTC');
    expect(isBasisInForce('accounting', TODAY)).toBe(true);
  });
});
