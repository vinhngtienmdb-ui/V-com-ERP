import { describe, it, expect } from 'vitest';
import {
  buildInternalIssueVoucher,
  computeTransmitDueAt,
  createPosOrder,
  openShift,
} from './hubService';

const d = (s: string) => new Date(`${s}T12:00:00.000Z`);

describe('#19 — Hub bán cả hai (kho + POS + offline)', () => {
  it('buildInternalIssueVoucher: 6N nội bộ → 6K26NAB (KHÔNG MÃ)', () => {
    const v = buildInternalIssueVoucher({ edocForm: '6N', docNo: 'PXK001', fromLocation: 'KHO-TONG', toHubId: 'HUB-01', issueDate: d('2026-08-01') });
    expect(v.symbol).toBe('6K26NAB');
    expect(v.edocForm).toBe('6N');
  });

  it('buildInternalIssueVoucher: 6B đại lý bắt buộc seller_id → 6K26BAB', () => {
    const v = buildInternalIssueVoucher({ edocForm: '6B', docNo: 'PXK002', fromLocation: 'KHO-TONG', toHubId: 'HUB-02', sellerId: 'SELLER-9', issueDate: d('2026-08-01') });
    expect(v.symbol).toBe('6K26BAB');
  });

  it('buildInternalIssueVoucher: 6B thiếu seller_id → ném', () => {
    expect(() => buildInternalIssueVoucher({ edocForm: '6B', docNo: 'X', fromLocation: 'A', toHubId: 'B' })).toThrow();
  });

  it('ND 254 Điều 14.4/14.5: offline gán transmit_due_at (+2 / +3 ngày làm việc)', () => {
    // Thứ Sáu 2026-08-07 → +2 ngày làm việc = Thứ Ba 2026-08-11
    const due2 = computeTransmitDueAt(d('2026-08-07'), 'system_incident');
    expect(due2.toISOString().slice(0, 10)).toBe('2026-08-11');
    // force_majeure +3 ngày làm việc = Thứ Tư 2026-08-12
    const due3 = computeTransmitDueAt(d('2026-08-07'), 'force_majeure');
    expect(due3.toISOString().slice(0, 10)).toBe('2026-08-12');
  });

  it('buildInternalIssueVoucher offline: sinh offlineQueuedAt + transmitDueAt', () => {
    const v = buildInternalIssueVoucher({ edocForm: '6N', docNo: 'PXK003', fromLocation: 'A', toHubId: 'B', offline: true, offlineReason: 'system_incident', issueDate: d('2026-08-07') });
    expect(v.offlineQueuedAt).toBeTruthy();
    expect(v.transmitDueAt).toBeTruthy();
  });

  it('createPosOrder: HĐ tại trạm luôn mẫu 1 KHÔNG MÃ (1K26TYY)', () => {
    const o = createPosOrder({
      hubId: 'HUB-01', ownership: 'vcomm', clientTxnId: 'cli-1',
      items: [{ productId: 'P1', name: 'Nước', qty: 2, unitPrice: 10_000 }],
    });
    expect(o.invoiceForm).toBe('1');
    expect(o.invoiceSymbol).toBe('1K26TYY');
    expect(o.total).toBe(2 * 10_000 + Math.round(2 * 10_000 * 0.1 * 100) / 100);
  });

  it('createPosOrder: consignment bắt buộc seller_id', () => {
    expect(() => createPosOrder({ hubId: 'HUB-01', ownership: 'consignment', clientTxnId: 'c2', items: [{ productId: 'P1', name: 'X', qty: 1, unitPrice: 5_000 }] })).toThrow();
  });

  it('createPosOrder: ký gửi có seller_id → hợp lệ, total đúng', () => {
    const o = createPosOrder({
      hubId: 'HUB-01', ownership: 'consignment', sellerId: 'S9', clientTxnId: 'c3',
      items: [{ productId: 'P1', name: 'X', qty: 1, unitPrice: 100_000, vatRate: 0.1 }],
    });
    expect(o.sellerId).toBe('S9');
    expect(o.subtotal).toBe(100_000);
    expect(o.vatAmount).toBe(10_000);
    expect(o.total).toBe(110_000);
  });

  it('openShift: sinh ca với opening cash', () => {
    const s = openShift({ hubId: 'HUB-01', openedBy: 'U1', openingCash: 500_000 });
    expect(s.hubId).toBe('HUB-01');
    expect(s.openingCash).toBe(500_000);
    expect(s.openedAt).toBeTruthy();
  });
});
