import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Quét src/services/dbService.ts: hàm `updateWalletBalance` lưu transaction record.
// Trước đây `amount: Math.abs(amount)` làm mất dấu → rút 500k lưu +500k, sai sổ phụ
// (tổng wallet_transactions lệch dấu so với sellers.walletBalance). Sửa: lưu ĐÚNG dấu.
// Hàm dùng Firestore global (db/doc/addDoc/...) nên KHÔNG render được trong unit test →
// dùng quét mã nguồn (pattern đã dùng cho RequestHub/HR/iPOS). Revert → test đỏ.
const src = readFileSync(resolve(__dirname, '../services/dbService.ts'), 'utf-8').replace(/\r/g, '');

// Cắt đúng hàm updateWalletBalance (từ khai báo đến export kế tiếp).
const start = src.indexOf('export const updateWalletBalance');
const after = src.indexOf('export async function recordPartnerLedgerEntry', start);
const fn = src.slice(start, after > start ? after : src.length);

describe('GĐ 2.4 — updateWalletBalance lưu ĐÚNG dấu amount (pattern #61/#84)', () => {
  it('hàm updateWalletBalance tồn tại', () => {
    expect(start).toBeGreaterThan(-1);
    expect(fn.length).toBeGreaterThan(50);
  });

  it('transaction record lưu amount CÓ DẤU (amount,)', () => {
    // Shorthand `amount,` ngay trước `type: transactionData.type,` → lưu đúng dấu.
    expect(fn).toContain('      amount,\n      type: transactionData.type,');
  });

  it('🔴 KHÔNG còn Math.abs(amount) làm mất dấu', () => {
    // Nếu ai sửa lại `amount: Math.abs(amount)` → test đỏ (sai sổ phụ).
    expect(fn).not.toContain('Math.abs(amount)');
  });

  it('vẫn giữ chốt insufficient balance (newBalance < 0 → throw)', () => {
    expect(fn).toContain('if (newBalance < 0) {');
    expect(fn).toContain("throw new Error('Insufficient wallet balance')");
  });
});
