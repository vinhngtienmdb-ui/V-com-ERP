/**
 * dbService.test.ts — LẦN ĐẦU CÓ TEST cho tầng dữ liệu (phần addDoc, GĐ 2.4).
 *
 * Tập trung vào `addDoc` KHÔNG được nuốt lỗi ghi Supabase: trước đây bắt lỗi
 * rồi trả ref GIẢ `mock-id-…` → caller (tạo giao dịch tài chính, bút toán ví,
 * đơn hàng...) tưởng xong mà thực tế MẤT ÂM THẦM. Giờ phải NÉM để khớp với
 * setDoc/updateDoc (pattern #84).
 */

import { describe, it, expect, vi } from 'vitest';

// Chỉ mock Supabase (dbService khởi tạo client khi import). `from(table)` NÉM
// với mọi bảng không được phép → mô phỏng Supabase ghi thất bại.
vi.mock('../lib/supabase', () => ({
  supabase: {
    from(table: string) {
      if (table !== 'finance_transactions') {
        throw new Error(`dbService.test: không được chạm bảng ${table}`);
      }
      const emit = (method: string, args: unknown[]) => {
        // no-op recorder
      };
      const api: any = {
        select: (...a: unknown[]) => ({ emit, ...api }),
        eq: (...a: unknown[]) => ({ emit, ...api }),
        order: (...a: unknown[]) => ({ emit, ...api }),
        limit: (...a: unknown[]) => ({ emit, ...api }),
        insert: (payload: any) => Promise.resolve({ error: null }),
        upsert: (payload: any) => Promise.resolve({ error: null }),
        maybeSingle: () => Promise.resolve({ data: null }),
      };
      // chainable no-ops
      const chainable: any = {
        select: () => chainable,
        eq: () => chainable,
        order: () => chainable,
        limit: () => chainable,
        insert: () => Promise.resolve({ error: null }),
        upsert: () => Promise.resolve({ error: null }),
        maybeSingle: () => Promise.resolve({ data: null }),
      };
      return chainable;
    },
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => ({ error: null }),
    },
  },
}));

vi.mock('../lib/storage', () => ({
  safeLocalStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  },
}));

// Gỡ mock dbService (test chính nó).
vi.unmock('./dbService');

import { addDoc, collection, db } from './dbService';

describe('dbService — addDoc KHÔNG được nuốt lỗi (pattern #84)', () => {
  it('🔴 Supabase thất bại → addDoc PHẢI NÉM, không trả ref giả `mock-id`', async () => {
    // `from(...)` NÉM với bảng không được phép → mô phỏng Supabase ghi thất bại.
    // `wallet_transactions` map sang `seller_transactions` (bị cấm trong harness)
    // → setDoc ném → addDoc PHẢI ném tiếp. Trước đây addDoc bắt lỗi rồi trả
    // `{ id: 'mock-id-…' }` → MẤT ÂM THẦM.
    await expect(
      addDoc(collection(db, 'wallet_transactions'), { amount: 1_000_000, type: 'expense' })
    ).rejects.toThrow(/không được chạm bảng/);
  });

  it('addDoc thành công → trả ref THẬT (id khớp, không chứa "mock-id")', async () => {
    const ref = await addDoc(collection(db, 'finance_transactions'), {
      id: 'TX-REAL-1',
      amount: 500_000,
    });
    expect(ref).toBeTruthy();
    expect(String(ref.id)).toBe('TX-REAL-1');
    expect(String(ref.id)).not.toMatch(/mock-id/);
  });
});
