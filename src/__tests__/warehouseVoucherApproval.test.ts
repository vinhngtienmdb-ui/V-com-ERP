import { describe, it, expect } from 'vitest';
import { validateVoucherApproval } from '../services/warehouseVoucherApproval';

const SNAP = [
  { warehouse_id: 'wh-a', product_id: 'P1', quantity: 30 },
  { warehouse_id: 'wh-a', product_id: 'P2', quantity: 5 },
  { warehouse_id: 'wh-b', product_id: 'P1', quantity: 100 },
];

describe('GĐ 2.4 — validateVoucherApproval (pattern #89)', () => {
  it('outbound đủ tồn kho → ok', () => {
    const r = validateVoucherApproval('out', 'wh-a', [{ product_id: 'P1', quantity: 10 }], SNAP);
    expect(r.ok).toBe(true);
  });

  it('outbound vừa đủ (biên) → ok', () => {
    const r = validateVoucherApproval('out', 'wh-a', [{ product_id: 'P1', quantity: 30 }], SNAP);
    expect(r.ok).toBe(true);
  });

  it('🔴 outbound VƯỢT tồn kho → từ chối (INSUFFICIENT_SOURCE_STOCK)', () => {
    // Trước: Math.max(0, 30-50) → stock=0 nhưng log ghi 50 xuất → phantom shipment.
    const r = validateVoucherApproval('out', 'wh-a', [{ product_id: 'P1', quantity: 50 }], SNAP);
    expect(r.ok).toBe(false);
    if ('code' in r) {
      expect(r.code).toBe('INSUFFICIENT_SOURCE_STOCK');
      expect(r.message).toContain('Không đủ tồn kho');
    }
  });

  it('🔴 outbound mà kho nguồn KHÔNG có mặt hàng → từ chối (MISSING_SOURCE_STOCK)', () => {
    // Trước: sourceStock null → bỏ qua trừ, nhưng vẫn ghi inventory_logs → di chuyển ảo.
    const r = validateVoucherApproval('out', 'wh-a', [{ product_id: 'P9', quantity: 1 }], SNAP);
    expect(r.ok).toBe(false);
    if ('code' in r) expect(r.code).toBe('MISSING_SOURCE_STOCK');
  });

  it('🔴 outbound thiếu kho nguồn (sourceWarehouseId null) → từ chối', () => {
    const r = validateVoucherApproval('out', null, [{ product_id: 'P1', quantity: 1 }], SNAP);
    expect(r.ok).toBe(false);
    if ('code' in r) expect(r.code).toBe('MISSING_SOURCE_STOCK');
  });

  it('transfer thiếu tồn kho ở nguồn → từ chối', () => {
    const r = validateVoucherApproval('transfer', 'wh-a', [{ product_id: 'P2', quantity: 9 }], SNAP);
    expect(r.ok).toBe(false);
    if ('code' in r) expect(r.code).toBe('INSUFFICIENT_SOURCE_STOCK');
  });

  it('transfer đủ tồn kho → ok', () => {
    const r = validateVoucherApproval('transfer', 'wh-a', [{ product_id: 'P2', quantity: 5 }], SNAP);
    expect(r.ok).toBe(true);
  });

  it('inbound không cần kho nguồn → ok (thêm tồn kho)', () => {
    const r = validateVoucherApproval('in', null, [{ product_id: 'P1', quantity: 5 }], SNAP);
    expect(r.ok).toBe(true);
  });

  it('🔴 số lượng = 0 → từ chối (INVALID_QUANTITY)', () => {
    const r = validateVoucherApproval('in', null, [{ product_id: 'P1', quantity: 0 }], SNAP);
    expect(r.ok).toBe(false);
    if ('code' in r) expect(r.code).toBe('INVALID_QUANTITY');
  });

  it('🔴 số lượng âm → từ chối', () => {
    const r = validateVoucherApproval('out', 'wh-a', [{ product_id: 'P1', quantity: -5 }], SNAP);
    expect(r.ok).toBe(false);
    if ('code' in r) expect(r.code).toBe('INVALID_QUANTITY');
  });

  it('🔴 số lượng NaN/rỗng → từ chối', () => {
    const r = validateVoucherApproval('out', 'wh-a', [{ product_id: 'P1', quantity: NaN }], SNAP);
    expect(r.ok).toBe(false);
    if ('code' in r) expect(r.code).toBe('INVALID_QUANTITY');
  });

  it('🔴 phiếu rỗng → từ chối', () => {
    const r = validateVoucherApproval('out', 'wh-a', [], SNAP);
    expect(r.ok).toBe(false);
    if ('code' in r) expect(r.code).toBe('INVALID_QUANTITY');
  });
});
