import { describe, it, expect, vi } from 'vitest';

/**
 * Logic walletAdjust (rút gọn từ functions/src/sellerHandlers.ts):
 *   1. Yêu cầu role admin|director (test bằng requireRole logic riêng)
 *   2. Validate walletId + amount(!=0) + description không rỗng
 *   3. runTransaction: cộng increment(amount) vào balance + ghi /wallet_transactions
 *      type='adjustment' (append-only)
 *
 * Tests focus vào pure validation + write shape.
 */

type FakeWallet = { balance: number; ownerType: string };

function makeFakeTx(wallet: FakeWallet | null) {
  const writes: any[] = [];
  return {
    writes,
    get: vi.fn(async (ref: any) => ({
      exists: () => ref.kind === 'wallet' && wallet !== null,
      data: () => wallet as any,
    })),
    update: vi.fn((ref: any, patch: any) => writes.push({ op: 'update', ref, patch })),
    set: vi.fn((ref: any, data: any) => writes.push({ op: 'set', ref, data })),
  };
}

function validateRequest(input: { walletId?: string; amount?: number; description?: string }) {
  if (!input.walletId) return 'walletId bắt buộc';
  if (typeof input.amount !== 'number') return 'amount phải là số';
  if (input.amount === 0) return 'amount khác 0';
  if (!input.description?.trim()) return 'description bắt buộc';
  return null;
}

async function walletAdjustLogic(
  walletId: string,
  amount: number,
  description: string,
  staffUid: string,
  tx: ReturnType<typeof makeFakeTx>,
) {
  const walletRef = { kind: 'wallet', id: walletId };
  const snap = await tx.get(walletRef);
  if (!snap.exists()) throw new Error(`Wallet ${walletId} không tồn tại`);

  const txId = `${walletId}_adj_${Date.now()}`;
  tx.update(walletRef, {
    balance: { __increment: amount },
  });
  tx.set({ kind: 'wallet_transaction', id: txId }, {
    walletId,
    type: 'adjustment',
    amount,
    description,
    staffId: staffUid,
  });
  return { txId };
}

describe('walletAdjust validation', () => {
  it('reject thiếu walletId', () => {
    expect(validateRequest({ amount: 100, description: 'x' })).toContain('walletId');
  });

  it('reject amount = 0', () => {
    expect(validateRequest({ walletId: 'w1', amount: 0, description: 'x' })).toContain('khác 0');
  });

  it('reject description rỗng', () => {
    expect(validateRequest({ walletId: 'w1', amount: 100, description: '' })).toContain('description');
    expect(validateRequest({ walletId: 'w1', amount: 100, description: '   ' })).toContain('description');
  });

  it('reject amount không phải số', () => {
    expect(validateRequest({ walletId: 'w1', amount: 'abc' as any, description: 'x' })).toContain('số');
  });

  it('pass khi đủ field hợp lệ', () => {
    expect(validateRequest({ walletId: 'w1', amount: 100, description: 'bonus' })).toBeNull();
    expect(validateRequest({ walletId: 'w1', amount: -50, description: 'refund' })).toBeNull();
  });
});

describe('walletAdjust transaction', () => {
  const wallet: FakeWallet = { balance: 1000000, ownerType: 'seller' };

  it('cộng tiền: tạo 2 write (update balance + set tx)', async () => {
    const tx = makeFakeTx(wallet);
    const r = await walletAdjustLogic('seller_X', 50000, 'Bonus campaign', 'admin1', tx);
    expect(r.txId).toMatch(/^seller_X_adj_/);
    expect(tx.writes).toHaveLength(2);

    const updateOp = tx.writes.find((w) => w.op === 'update');
    expect(updateOp.patch.balance.__increment).toBe(50000);

    const setOp = tx.writes.find((w) => w.op === 'set');
    expect(setOp.data.type).toBe('adjustment');
    expect(setOp.data.amount).toBe(50000);
    expect(setOp.data.description).toBe('Bonus campaign');
    expect(setOp.data.staffId).toBe('admin1');
  });

  it('trừ tiền (amount âm): increment âm', async () => {
    const tx = makeFakeTx(wallet);
    await walletAdjustLogic('seller_X', -30000, 'Chargeback', 'admin1', tx);
    const updateOp = tx.writes.find((w) => w.op === 'update');
    expect(updateOp.patch.balance.__increment).toBe(-30000);
  });

  it('reject wallet không tồn tại', async () => {
    const tx = makeFakeTx(null);
    await expect(walletAdjustLogic('w_X', 100, 'x', 'admin1', tx)).rejects.toThrow(/không tồn tại/);
    expect(tx.writes).toHaveLength(0);
  });

  it('mỗi adjust sinh 1 wallet_transaction unique (append-only)', async () => {
    const tx = makeFakeTx(wallet);
    const r1 = await walletAdjustLogic('seller_X', 100, 'a', 'admin1', tx);
    await new Promise((r) => setTimeout(r, 5));
    const r2 = await walletAdjustLogic('seller_X', 200, 'b', 'admin1', tx);
    expect(r1.txId).not.toBe(r2.txId);
    const txWrites = tx.writes.filter((w) => w.ref.kind === 'wallet_transaction');
    expect(txWrites).toHaveLength(2);
  });
});
