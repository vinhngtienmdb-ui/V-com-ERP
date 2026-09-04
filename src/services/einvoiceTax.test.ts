import { describe, it, expect } from 'vitest';
import {
  resolveInvoiceShape,
  computeDelegatedOrderTax,
  assertSellerTaxMethodForIssue,
} from './einvoiceTax';
import { validateDelegationForIssue, type DelegationRecord } from './einvoiceService';

const items = [
  { name: 'Áo', price: 100_000, qty: 2, category: 'apparel' },
  { name: 'Sách', price: 50_000, qty: 1, category: 'book' },
];

describe('#21 — tax_method ủy nhiệm (TT 91/2026 Điều 9.1.h)', () => {
  it('resolveInvoiceShape: platform không ủy nhiệm → 7K26XYY', () => {
    expect(resolveInvoiceShape({ channel: 'platform', issueDate: new Date('2026-08-01') })).toEqual({
      formNo: '7',
      symbol: '7K26XYY',
    });
  });

  it('resolveInvoiceShape: hub_pos không ủy nhiệm → 1K26TYY (Điều 6.1.c)', () => {
    expect(resolveInvoiceShape({ channel: 'hub_pos', issueDate: new Date('2026-08-01') })).toEqual({
      formNo: '1',
      symbol: '1K26TYY',
    });
  });

  it('resolveInvoiceShape: ủy nhiệm kê khai → mẫu 1, khoán → mẫu 2 (Điều 9.1.h)', () => {
    const declKhai = {
      delegationId: 'D1',
      seller: { name: 'S', taxCode: '01', address: 'HN' },
      taxMethod: 'declaration' as const,
      formNo: '1' as const,
    };
    expect(resolveInvoiceShape({ channel: 'platform', delegation: declKhai, issueDate: new Date('2026-08-01') })).toEqual({
      formNo: '1',
      symbol: '1K26TYY',
    });
    const declKhoan = {
      delegationId: 'D2',
      seller: { name: 'S', taxCode: '01', address: 'HN' },
      taxMethod: 'presumptive' as const,
      formNo: '2' as const,
    };
    expect(resolveInvoiceShape({ channel: 'platform', delegation: declKhoan, issueDate: new Date('2026-08-01') })).toEqual({
      formNo: '2',
      symbol: '2K26TYY',
    });
  });

  it('computeDelegatedOrderTax: kê khai → tách dòng VAT (8%/10%)', () => {
    const r = computeDelegatedOrderTax(items, { taxMethod: 'declaration' });
    expect(r.isPresumptive).toBe(false);
    expect(r.subtotal).toBe(250_000);
    expect(r.vatAmount).toBeGreaterThan(0); // VAT theo biểu luật
    expect(r.total).toBe(r.subtotal + r.vatAmount);
  });

  it('computeDelegatedOrderTax: khoán → không tách dòng VAT, total = subtotal', () => {
    const r = computeDelegatedOrderTax(items, { taxMethod: 'presumptive', presumptiveVatRatio: 0.01, presumptivePitRatio: 0.005 });
    expect(r.isPresumptive).toBe(true);
    expect(r.subtotal).toBe(250_000);
    expect(r.vatAmount).toBe(2_500); // 1% trên doanh thu
    expect(r.pitAmount).toBe(1_250); // 0,5% trên doanh thu
    expect(r.total).toBe(250_000); // giá khoán đã bao gồm thuế
  });

  it('assertSellerTaxMethodForIssue: thiếu tax_method → ném (Điều 9.1.h)', () => {
    expect(() => assertSellerTaxMethodForIssue({ id: 'D9' }, null)).toThrow(/tax_method/);
    expect(() => assertSellerTaxMethodForIssue({ id: 'D9' }, 'not_applicable')).toThrow(/tax_method/);
    expect(() => assertSellerTaxMethodForIssue({ id: 'D9' }, 'declaration')).not.toThrow();
  });

  it('validateDelegationForIssue: có sellerTaxMethod thì bắt buộc khai báo', () => {
    const active: DelegationRecord = {
      sellerId: 'S1', delegatorName: 'S', delegatorTaxCode: '01', status: 'active',
      delegatedFrom: '2026-01-01', noticePublishedAt: '2026-01-02T00:00:00Z',
      invoiceForm: '7', invoiceSymbol: '7K26XYY',
    };
    // không truyền taxMethod → vẫn qua (tương thích S3, chưa áp dụng #21)
    expect(() => validateDelegationForIssue(active)).not.toThrow();
    // truyền 'declaration' (đã khai báo) → qua (Điều 9.1.h thỏa)
    expect(() => validateDelegationForIssue(active, 'declaration')).not.toThrow();
    // truyền 'not_applicable' (đã truyền nhưng Seller chưa có phương pháp đúng) → chặn
    expect(() => validateDelegationForIssue(active, 'not_applicable')).toThrow(/tax_method/);
  });

  it('validateDelegationForIssue: giữ nguyên gate Điều 9.1.đ (thiếu notice → ném)', () => {
    const noNotice: DelegationRecord = {
      sellerId: 'S1', delegatorName: 'S', delegatorTaxCode: '01', status: 'active',
      delegatedFrom: '2026-01-01', invoiceForm: '7', invoiceSymbol: '7K26XYY',
    };
    expect(() => validateDelegationForIssue(noNotice, 'declaration')).toThrow(/9\.1\.đ/);
  });

  it('#28 — platform_7 strategy: tự bán = XAB, ủy nhiệm = XAC (spec 030 §6.1)', () => {
    const self = resolveInvoiceShape({
      channel: 'platform', issueDate: new Date('2026-08-01'), symbolStrategy: 'platform_7',
    });
    expect(self).toEqual({ formNo: '7', symbol: '7K26XAB' });

    const delegated = resolveInvoiceShape({
      channel: 'platform',
      delegation: { delegationId: 'D1', seller: { name: 'S', taxCode: '01', address: 'HN' }, taxMethod: 'declaration' },
      issueDate: new Date('2026-08-01'),
      symbolStrategy: 'platform_7',
    });
    expect(delegated).toEqual({ formNo: '7', symbol: '7K26XAC' });
  });

  it('#28 — mặc định seller_form: ủy nhiệm vẫn dùng Mẫu của Seller (Model B, TT 91 Điều 9.1.h)', () => {
    const delegated = resolveInvoiceShape({
      channel: 'platform',
      delegation: { delegationId: 'D1', seller: { name: 'S', taxCode: '01', address: 'HN' }, taxMethod: 'presumptive', formNo: '2' },
      issueDate: new Date('2026-08-01'),
    });
    expect(delegated).toEqual({ formNo: '2', symbol: '2K26TYY' });
  });
});
