import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Quét Warehouse.tsx: handleApproveVoucher PHẢI gọi validateVoucherApproval và
// KHÔNG còn clamp `Math.max(0, ...)` che giấu thiếu hụt. Trước đây duyệt phiếu xuất
// vượt tồn kho → stock clamp về 0 nhưng inventory_logs ghi đủ số lượng → phantom
// shipment (pattern #89). Hàm dùng supabase client nên không render được unit → quét nguồn.
// Revert (gỡ validate + trả Math.max(0,)) → test đỏ.
const src = readFileSync(resolve(__dirname, '../components/Warehouse.tsx'), 'utf-8').replace(/\r/g, '');

const start = src.indexOf('const handleApproveVoucher');
const end = src.indexOf('const handleCancelVoucher', start);
const fn = src.slice(start, end > start ? end : src.length);

describe('GĐ 2.4 — Warehouse.handleApproveVoucher wiring (pattern #89)', () => {
  it('hàm handleApproveVoucher tồn tại', () => {
    expect(start).toBeGreaterThan(-1);
    expect(fn.length).toBeGreaterThan(50);
  });

  it('gọi validateVoucherApproval TRƯỚC khi ghi', () => {
    expect(fn).toContain('validateVoucherApproval(');
  });

  it('có chốt từ chối khi plan không ok (if (\'code\' in approvalPlan))', () => {
    expect(fn).toContain("if ('code' in approvalPlan) {");
  });

  it('🔴 KHÔNG còn clamp Math.max(0, ...) che giấu thiếu hụt', () => {
    expect(fn).not.toContain('Math.max(0,');
  });
});
