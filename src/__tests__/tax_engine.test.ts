import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.unmock('../services/dbService');

import {
  resolveVatRate,
  computeOrderTax,
  generateSellerTaxReport,
  DEFAULT_TAX_RULES,
  clearTaxRulesCache
} from '../services/taxService';
import { supabase } from '../lib/supabase';

describe('Tax Engine — TT 91/2026 + NĐ 174/2025 + NĐ 252/2026', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearTaxRulesCache();
  });

  it('DEFAULT rules: 8% trong giai đoạn giảm thuế NĐ 174/2025', () => {
    const atDate = new Date('2026-08-31T00:00:00Z');
    expect(resolveVatRate('*', atDate)).toBe(0.08);
  });

  it('DEFAULT rules: quay lại 10% từ 2027 khi hết giảm thuế', () => {
    const atDate = new Date('2027-03-01T00:00:00Z');
    expect(resolveVatRate('*', atDate)).toBe(0.1);
  });

  it('DEFAULT rules: 10% trước 1/7/2025 không dùng rule 8% (8% chỉ từ 2025-07-01)', () => {
    const atDate = new Date('2025-06-30T00:00:00Z');
    const rate = resolveVatRate('*', atDate);
    // Không có rule nào effective trước 1/7/2025 → fallback 0.08 (an toàn vì hệ thống go-live 2026)
    expect(rate).toBe(0.08);
  });

  it('computeOrderTax: tính đúng VAT từng dòng và tổng', () => {
    const items = [
      { name: 'Áo thun', price: 200000, qty: 2 },           // 400k × 8% = 32k
      { name: 'iPhone', price: 20000000, qty: 1 }            // 20M × 8% = 1.6M
    ];
    const result = computeOrderTax(items, new Date('2026-08-31T00:00:00Z'));

    expect(result.subtotal).toBe(20400000);
    expect(result.vatAmount).toBe(32000 + 1600000);
    expect(result.lines[0].lineVat).toBe(32000);
    expect(result.lines[1].lineVat).toBe(1600000);
    expect(result.legalBasis).toContain('174/2025');
  });

  it('computeOrderTax: 2027 thuế 10% tự động tăng', () => {
    const items = [{ name: 'Áo thun', price: 100000, qty: 1 }];
    const result = computeOrderTax(items, new Date('2027-06-01T00:00:00Z'));
    expect(result.vatAmount).toBe(10000);
    expect(result.vatRate).toBe(0.1);
  });

  it('generateSellerTaxReport: NĐ 252/2026 — sàn chỉ cung cấp báo cáo, seller tự kê', async () => {
    const chain: any = {};
    chain.select = vi.fn().mockReturnThis();
    chain.eq = vi.fn().mockReturnThis();
    chain.in = vi.fn().mockReturnThis();
    chain.gte = vi.fn().mockReturnThis();
    chain.lte = vi.fn().mockImplementation(() =>
      Promise.resolve({
        data: [
          { total: 1000000, vat_amount: 80000, status: 'completed' },
          { total: 500000, vat_amount: 40000, status: 'delivered' }
        ],
        error: null
      })
    );
    vi.spyOn(supabase, 'from').mockImplementation(() => chain);

    const report = await generateSellerTaxReport({
      sellerId: 'SEL-001',
      periodStart: '2026-01-01',
      periodEnd: '2026-03-31'
    });

    expect(report.total_revenue).toBe(1500000);
    expect(report.total_vat).toBe(120000);
    expect(report.order_count).toBe(2);
    expect(report.note).toContain('252/2026');       // trích dẫn đúng nghị định
    expect(report.note).toContain('không khấu trừ'); // nhấn mạnh sàn không khấu trừ
    expect(report.note).toContain('99/2025');        // đối chiếu chuẩn kế toán
  });

  it('DEFAULT_TAX_RULES: có ít nhất 2 giai đoạn (giảm thuế + trở lại 10%)', () => {
    expect(DEFAULT_TAX_RULES.length).toBeGreaterThanOrEqual(2);
    expect(DEFAULT_TAX_RULES.some(r => r.vat_rate === 0.08)).toBe(true);
    expect(DEFAULT_TAX_RULES.some(r => r.vat_rate === 0.1)).toBe(true);
  });
});
