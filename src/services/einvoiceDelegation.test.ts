import { describe, it, expect } from 'vitest';
import {
  isDelegationActive,
  validateDelegationForIssue,
  summarizeDelegationNotice,
  type DelegationRecord
} from './einvoiceService';

/**
 * S3 — Ủy nhiệm phát hành HĐĐT (TT 91/2026 Điều 9).
 * Test các hàm thuần: gate phát hành (9.1.đ) + helper.
 */

const activeNotice: DelegationRecord = {
  sellerId: 'S1', delegatorName: 'Công ty TNHH ABC', delegatorTaxCode: '0101234567',
  status: 'active', delegatedFrom: '2026-09-01', invoiceForm: '7', invoiceSymbol: '7K26XYY',
  noticePublishedAt: '2026-09-01T00:00:00.000Z'
};

const activeNoNotice: DelegationRecord = { ...activeNotice, noticePublishedAt: undefined };
const pendingNotice: DelegationRecord = { ...activeNotice, status: 'pending' };

describe('Ủy nhiệm HĐĐT — TT 91/2026 Điều 9', () => {
  it('isDelegationActive: chỉ status=active mới true (notice là gate riêng)', () => {
    expect(isDelegationActive(activeNotice)).toBe(true);
    expect(isDelegationActive(activeNoNotice)).toBe(true); // status active dù chưa đăng notice
    expect(isDelegationActive(pendingNotice)).toBe(false);
    expect(isDelegationActive(null)).toBe(false);
    expect(isDelegationActive(undefined)).toBe(false);
  });

  it('Điều 9.1.đ — gate phát hành: active + đã đăng thông báo → hợp lệ', () => {
    expect(() => validateDelegationForIssue(activeNotice)).not.toThrow();
  });

  it('Điều 9.1.đ — gate phát hành: thiếu thông báo gian hàng → từ chối', () => {
    expect(() => validateDelegationForIssue(activeNoNotice)).toThrow(/9\.1\.đ/);
  });

  it('Điều 9 — gate phát hành: chưa active → từ chối', () => {
    expect(() => validateDelegationForIssue(pendingNotice)).toThrow(/chưa active/);
  });

  it('summarizeDelegationNotice: chứa tên + MST người ủy nhiệm', () => {
    const s = summarizeDelegationNotice(activeNotice);
    expect(s).toContain('Công ty TNHH ABC');
    expect(s).toContain('0101234567');
    expect(s).toContain('TT 91/2026');
  });
});
