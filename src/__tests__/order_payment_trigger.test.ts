import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Quét src/services/dbService.ts: `handleOrderPaymentTrigger` ghi bản ghi thanh toán
// (bảng `payments`, status 'success') khi đơn chuyển sang `paid`. Trước đây catch chỉ
// `console.error('[Order-Payment-Trigger] Failed to check/record payment:', e)` → lỗi
// ghi payments bị NUỐT THẦM, đơn báo lưu xong nhưng không có dòng thanh toán (hụt đối
// soát). Sửa: báo qua `reportWriteFailure` (pattern #74). Revert (trả console.error cũ)
// → test đỏ. (Lưu ý: reportWriteFailure tự console.error BÊN TRONG writeFailure.ts,
// không phải trong hàm này — nên cấm đúng chuỗi thông báo cũ.)
const src = readFileSync(resolve(__dirname, '../services/dbService.ts'), 'utf-8').replace(/\r/g, '');

const start = src.indexOf('async function handleOrderPaymentTrigger');
const end = src.indexOf('async function handleProductPriceHistoryTrigger', start);
const fn = src.slice(start, end > start ? end : src.length);

describe('GĐ 2.4 — handleOrderPaymentTrigger ghi nhận thanh toán (pattern #74)', () => {
  it('hàm handleOrderPaymentTrigger tồn tại', () => {
    expect(start).toBeGreaterThan(-1);
    expect(fn.length).toBeGreaterThan(50);
  });

  it('🔴 lỗi ghi payments KHÔNG bị nuốt thầm — báo qua reportWriteFailure', () => {
    expect(fn).toContain('reportWriteFailure(');
  });

  it('🔴 KHÔNG còn console.error nuốt thầm thông báo cũ', () => {
    expect(fn).not.toContain('Failed to check/record payment');
  });
});
