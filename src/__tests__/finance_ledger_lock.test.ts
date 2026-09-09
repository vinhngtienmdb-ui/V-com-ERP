import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Quét Finance.tsx: handlePerformClosing tính vân tay khóa sổ bằng
// `String(Math.abs(netProfit) + totalRevenue + totalExpenses)` rồi ký HSM →
// lãi 100 và lỗ 100 CÙNG vân tay, sửa sổ sau khóa không phát hiện được (pattern #75).
// Sửa: hashLedgerClosing(closingCanonical(...)) — SHA-256 GIỮ DẤU. Revert (trả
// Math.abs) → test đỏ. (Lưu ý: `const absLoss = Math.abs(netProfit)` ở bút toán
// là HỢP LỆ — chỉ cấm vân tay `String(Math.abs(netProfit)`.)
const src = readFileSync(resolve(__dirname, '../components/Finance.tsx'), 'utf-8').replace(/\r/g, '');

const start = src.indexOf('const handlePerformClosing = async () => {');
const end = src.indexOf('const handleResetLockDate = async () => {', start);
const fn = src.slice(start, end > start ? end : src.length);

describe('GĐ 2.4 — Finance.handlePerformClosing wiring (pattern #75)', () => {
  it('hàm handlePerformClosing tồn tại', () => {
    expect(start).toBeGreaterThan(-1);
    expect(fn.length).toBeGreaterThan(50);
  });

  it('dùng hashLedgerClosing (SHA-256 thật) để ký khóa sổ', () => {
    expect(fn).toContain('hashLedgerClosing(');
    expect(fn).toContain('closingCanonical(');
  });

  it('🔴 KHÔNG còn vân tay Math.abs(netProfit) (mất dấu)', () => {
    expect(fn).not.toContain('String(Math.abs(netProfit)');
  });
});
