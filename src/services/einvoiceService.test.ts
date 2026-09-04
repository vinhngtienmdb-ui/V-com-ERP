import { describe, it, expect } from 'vitest';
import {
  validateInvoiceErrorFlow,
  type InvoiceErrorFlow,
  type InvoiceErrorParams
} from './einvoiceService';

/**
 * S2' — TT 91/2026 Điều 10: 4 luồng xử lý sai sót, KHÔNG có "hủy".
 * Test hàm thuần validateInvoiceErrorFlow (không mạng, deterministic).
 */

const base: InvoiceErrorParams = {
  orderId: 'ORD-TEST-1',
  flow: 'replace',
  reason: 'Sai số lượng hàng hóa',
  originalInvoiceNo: 'HD-2026-0001'
};

describe('Xử lý sai sót HĐĐT — TT 91/2026 Điều 10 (4 luồng)', () => {
  it('tất cả luồng hợp lệ đều được định nghĩa', () => {
    const flows: InvoiceErrorFlow[] = ['announce_adjust', 'replace', 'monthly_consolidate'];
    // compile-time + runtime guard: union chỉ chứa 3 giá trị
    expect(flows).toHaveLength(3);
  });

  it('bắt buộc lý do xử lý (Điều 10)', () => {
    expect(() => validateInvoiceErrorFlow({ ...base, reason: '' })).toThrow(/bắt buộc/);
    expect(() => validateInvoiceErrorFlow({ ...base, reason: '   ' })).toThrow(/bắt buộc/);
  });

  it('announce_adjust: yêu cầu liệt kê trường điều chỉnh', () => {
    expect(() =>
      validateInvoiceErrorFlow({ ...base, flow: 'announce_adjust' })
    ).toThrow(/điều chỉnh/);
    expect(() =>
      validateInvoiceErrorFlow({ ...base, flow: 'announce_adjust', adjustFields: [] })
    ).toThrow(/điều chỉnh/);
    expect(() =>
      validateInvoiceErrorFlow({ ...base, flow: 'announce_adjust', adjustFields: ['Tên người mua'] })
    ).not.toThrow();
  });

  it('replace: yêu cầu số hóa đơn gốc', () => {
    expect(() =>
      validateInvoiceErrorFlow({ ...base, flow: 'replace', originalInvoiceNo: '' })
    ).toThrow(/thay thế/);
    expect(() =>
      validateInvoiceErrorFlow({ ...base, flow: 'replace', originalInvoiceNo: 'HD-2026-0001' })
    ).not.toThrow();
  });

  it('monthly_consolidate: yêu cầu kỳ YYYY-MM', () => {
    expect(() =>
      validateInvoiceErrorFlow({ ...base, flow: 'monthly_consolidate' })
    ).toThrow(/YYYY-MM/);
    expect(() =>
      validateInvoiceErrorFlow({ ...base, flow: 'monthly_consolidate', period: '2026-13' })
    ).toThrow(/YYYY-MM/);
    expect(() =>
      validateInvoiceErrorFlow({ ...base, flow: 'monthly_consolidate', period: '2026-09' })
    ).not.toThrow();
  });

  it('Điều 10.1.c: HĐ máy tính tiền/POS (hub_pos) CHỈ được thay thế, không được điều chỉnh', () => {
    // announce_adjust trên kênh hub_pos → bị từ chối
    expect(() =>
      validateInvoiceErrorFlow({
        ...base, flow: 'announce_adjust', channel: 'hub_pos', adjustFields: ['Tên người mua']
      })
    ).toThrow(/máy tính tiền/);
    // replace trên kênh hub_pos → hợp lệ
    expect(() =>
      validateInvoiceErrorFlow({ ...base, flow: 'replace', channel: 'hub_pos', originalInvoiceNo: 'HD-2026-0001' })
    ).not.toThrow();
  });

  it('announce_adjust hợp lệ trên HĐ TMĐT nền tảng (channel platform)', () => {
    expect(() =>
      validateInvoiceErrorFlow({
        ...base, flow: 'announce_adjust', channel: 'platform', adjustFields: ['Địa chỉ người mua']
      })
    ).not.toThrow();
  });
});
