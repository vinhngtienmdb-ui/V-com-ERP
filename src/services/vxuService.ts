import {
  db, collection, doc, getDocs, getDoc, setDoc, updateDoc,
  query, where, orderBy,
} from './dbService';
import type {
  VxuAccount, VxuLedgerEntry, VxuRedemption, VxuTier,
} from '../types/erp';
import { VXU_TIERS } from '../types/erp';

/**
 * TRỤ CỘT 7 — V-XU (điểm thưởng xuyên suốt hệ sinh thái) — spec 019
 *
 * KHÁC loyalty điểm hiện có (spec 010 / loyalty_points_ledger):
 * V-Xu dùng SỔ CÁI KẾ TOÁN KÉP (double-entry, Đề án F.5):
 *   - Mỗi giao dịch ghi ĐÚNG 2 vế: một debit, một credit, cùng amount
 *   - Hai vế cùng transactionId → đối chiếu được với sổ kế toán tài chính
 *   - View SQL `vxu_ledger_balance_check` sẽ phát hiện bút toán lệch
 *
 * Tài khoản chuẩn:
 *   vxu_customer:<customerId> — ví V-Xu của khách
 *   vxu_issuer                — nguồn phát hành (VComm)
 *   vxu_revenue               — doanh thu VComm (khi khách tiêu V-Xu)
 *   vxu_expired               — điểm hết hạn
 *
 * Hạng theo chi tiêu lũy kế + số đơn (Đề án E.5):
 *   Đồng: mặc định (1% hoàn) · Bạc: >2tr & 5 đơn (2%)
 *   Vàng: >8tr & 20 đơn (3,5%) · Kim Cương: >20tr & 50 đơn (5%)
 *
 * Quy ước giá trị: 1 V-Xu = 1 VND khi tiêu (đổi trực tiếp, không tỷ lệ quy đổi)
 */

const DEFAULT_TENANT = 'tenant-vcomm-prod-01';

const ACCT_ISSUER = 'vxu_issuer';
const ACCT_REVENUE = 'vxu_revenue';
const ACCT_EXPIRED = 'vxu_expired';

export class VxuError extends Error {
  constructor(message: string, public readonly code: string = 'VXU_ERROR') {
    super(message);
    this.name = 'VxuError';
  }
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function customerAccount(customerId: string): string {
  return `vxu_customer:${customerId}`;
}

// -----------------------------------------------------------------------------
// HẠNG & HOÀN TIỀN
// -----------------------------------------------------------------------------

/** Xếp hạng theo chi tiêu lũy kế + số đơn. Cả hai điều kiện phải thoả (">"). */
export function resolveTier(lifetimeSpendVnd: number, lifetimeOrders: number): VxuTier {
  // Duyệt từ hạng cao xuống — hạng cao nhất mà khách CHẠM ngưỡng (không tính Đồng)
  for (let i = VXU_TIERS.length - 1; i > 0; i -= 1) {
    const t = VXU_TIERS[i];
    if (lifetimeSpendVnd > t.minSpendVnd && lifetimeOrders >= t.minOrders) {
      return t.tier;
    }
  }
  return 'dong';
}

/** Tỉ lệ hoàn tiền của một hạng */
export function cashbackRateOf(tier: VxuTier): number {
  return VXU_TIERS.find(t => t.tier === tier)?.cashbackRate ?? 0.01;
}

/** Nhãn hiển thị của một hạng */
export function tierLabel(tier: VxuTier): string {
  return VXU_TIERS.find(t => t.tier === tier)?.label ?? 'Đồng';
}

/**
 * Số V-Xu hoàn cho một đơn: giá trị đơn × tỉ lệ hoàn của hạng.
 * Bỏ phần thập phân (V-Xu là số nguyên).
 */
export function computeCashback(orderValueVnd: number, tier: VxuTier): number {
  if (orderValueVnd <= 0) return 0;
  return Math.floor(orderValueVnd * cashbackRateOf(tier));
}

// -----------------------------------------------------------------------------
// VÍ V-XU
// -----------------------------------------------------------------------------

/** Lấy (hoặc tự tạo) ví V-Xu của một khách hàng */
export async function getOrCreateAccount(
  customerId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<VxuAccount> {
  const snap = await getDocs(query(
    collection(db, 'vxu_accounts'),
    where('tenantId', '==', tenantId),
    where('customerId', '==', customerId)
  ));

  const found = snap.docs?.[0];
  if (found) return { ...(found.data() as VxuAccount), id: found.id };

  const now = new Date().toISOString();
  const id = newId('vxu');
  const account: VxuAccount = {
    id,
    tenantId,
    customerId,
    balance: 0,
    lifetimeEarned: 0,
    lifetimeSpendVnd: 0,
    lifetimeOrders: 0,
    tier: 'dong',
    tierChangedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, 'vxu_accounts', id), account);
  return account;
}

export async function listAccounts(
  tenantId: string = DEFAULT_TENANT,
  tier?: VxuTier
): Promise<VxuAccount[]> {
  const constraints: any[] = [where('tenantId', '==', tenantId)];
  if (tier) constraints.push(where('tier', '==', tier));

  const snap = await getDocs(query(collection(db, 'vxu_accounts'), ...constraints));
  return snap.docs
    .map((d: any) => ({ ...(d.data() as VxuAccount), id: d.id }))
    .sort((a: VxuAccount, b: VxuAccount) => (b.lifetimeSpendVnd || 0) - (a.lifetimeSpendVnd || 0));
}

// -----------------------------------------------------------------------------
// SỔ CÁI KÉP — ghi bút toán
// -----------------------------------------------------------------------------

/** Thứ tự vế trong sổ để đối chiếu ổn định */
let txnSeq = 0;
function nextTransactionId(): string {
  txnSeq += 1;
  return `vxu-txn-${Date.now()}-${txnSeq}`;
}

/**
 * Ghi một bút toán kép: 2 dòng debit + credit với cùng transactionId.
 * Đây là hàm GHI DUY NHẤT — mọi thao tác V-Xu (earn/spend/refund/expire/adjust)
 * đều phải đi qua đây để đảm bảo sổ luôn cân.
 */
async function postDoubleEntry(params: {
  tenantId: string;
  type: VxuLedgerEntry['type'];
  amount: number;
  /** Tài khoản bên debit */
  debitAccount: string;
  /** Tài khoản bên credit */
  creditAccount: string;
  customerId?: string;
  referenceType?: string;
  referenceId?: string;
  note?: string;
}): Promise<{ transactionId: string; entries: VxuLedgerEntry[] }> {
  const amount = Math.floor(Number(params.amount));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new VxuError('Số V-Xu của bút toán phải là số dương.', 'INVALID_AMOUNT');
  }

  const now = new Date().toISOString();
  const transactionId = nextTransactionId();
  const base = {
    tenantId: params.tenantId,
    transactionId,
    type: params.type,
    referenceType: params.referenceType || null,
    referenceId: params.referenceId || null,
    note: params.note || null,
    createdAt: now,
  };

  const debit: VxuLedgerEntry = {
    ...base,
    id: newId('vxu'),
    side: 'debit',
    account: params.debitAccount,
    counterAccount: params.creditAccount,
    customerId: params.customerId || null,
    amount,
  };
  const credit: VxuLedgerEntry = {
    ...base,
    id: newId('vxu'),
    side: 'credit',
    account: params.creditAccount,
    counterAccount: params.debitAccount,
    customerId: params.customerId || null,
    amount,
  };

  await setDoc(doc(db, 'vxu_ledger', debit.id), debit);
  await setDoc(doc(db, 'vxu_ledger', credit.id), credit);

  return { transactionId, entries: [debit, credit] };
}

/** Sổ của một khách (đọc theo customerId trên dòng, cả 2 vế đều có customerId) */
export async function listCustomerLedger(
  customerId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<VxuLedgerEntry[]> {
  const snap = await getDocs(query(
    collection(db, 'vxu_ledger'),
    where('tenantId', '==', tenantId),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  ));
  return snap.docs.map((d: any) => ({ ...(d.data() as VxuLedgerEntry), id: d.id }));
}

/**
 * Kiểm tra cân bằng tại tầng service: gom theo transactionId,
 * mỗi nhóm phải có debit = credit. Trả về danh sách bút toán lệch.
 */
export async function findUnbalancedTransactions(
  tenantId: string = DEFAULT_TENANT
): Promise<Array<{ transactionId: string; totalDebit: number; totalCredit: number }>> {
  const snap = await getDocs(query(
    collection(db, 'vxu_ledger'),
    where('tenantId', '==', tenantId)
  ));

  const byTxn = new Map<string, { debit: number; credit: number }>();
  for (const d of snap.docs) {
    const e = d.data() as VxuLedgerEntry;
    const agg = byTxn.get(e.transactionId) || { debit: 0, credit: 0 };
    if (e.side === 'debit') agg.debit += Number(e.amount) || 0;
    else agg.credit += Number(e.amount) || 0;
    byTxn.set(e.transactionId, agg);
  }

  const bad: Array<{ transactionId: string; totalDebit: number; totalCredit: number }> = [];
  for (const [transactionId, agg] of byTxn) {
    if (agg.debit !== agg.credit) {
      bad.push({ transactionId, totalDebit: agg.debit, totalCredit: agg.credit });
    }
  }
  return bad;
}

// -----------------------------------------------------------------------------
// TÍCH LUỸ — khi đơn hoàn tất
// -----------------------------------------------------------------------------

/**
 * Ghi nhận chi tiêu + tích V-Xu cho một đơn hoàn tất.
 *
 * Luồng:
 *   1. Cộng chi tiêu lũy kế & số đơn
 *   2. XÉP LẠI HẠNG theo chi tiêu mới (có thể thăng hạng)
 *   3. Hoàn V-Xu theo tỉ lệ của HẠNG SAU KHI XÉP LẠI (khách được hưởng
 *      ngay mức hoàn của hạng mới nếu đơn này đưa họ lên hạng)
 *   4. Ghi bút toán kép earn: debit vxu_issuer / credit ví khách
 *
 * Idempotent: nếu orderId đã được ghi earn rồi thì bỏ qua (trả về null).
 */
export async function recordCompletedOrder(
  customerId: string,
  orderId: string,
  orderValueVnd: number,
  options: { tenantId?: string; note?: string } = {}
): Promise<{
  account: VxuAccount;
  cashback: number;
  tierUpgraded: boolean;
  transactionId: string;
} | null> {
  const tenantId = options.tenantId || DEFAULT_TENANT;

  if (orderValueVnd < 0) throw new VxuError('Giá trị đơn không được âm.', 'INVALID_ORDER_VALUE');

  // Idempotency: kiểm tra đã có bút toán earn cho đơn này chưa
  const dupSnap = await getDocs(query(
    collection(db, 'vxu_ledger'),
    where('tenantId', '==', tenantId),
    where('type', '==', 'earn'),
    where('referenceId', '==', orderId)
  ));
  if (dupSnap.docs?.length) return null;

  let account = await getOrCreateAccount(customerId, tenantId);

  // 1–2. Cập nhật lũy kế và xếp lại hạng
  const newSpend = (Number(account.lifetimeSpendVnd) || 0) + Number(orderValueVnd);
  const newOrders = (Number(account.lifetimeOrders) || 0) + 1;
  const newTier = resolveTier(newSpend, newOrders);
  const tierUpgraded = VXU_TIERS.findIndex(t => t.tier === newTier)
    > VXU_TIERS.findIndex(t => t.tier === account.tier);

  // 3. Hoàn tiền theo hạng (sau khi xếp lại)
  const cashback = computeCashback(orderValueVnd, newTier);

  // Đơn quá nhỏ có thể hoàn 0 V-Xu sau khi làm tròn xuống — KHÔNG ghi sổ
  // (không có bút toán 0), nhưng vẫn cập nhật chi tiêu lũy kế & số đơn.
  let transactionId = '';
  if (cashback > 0) {
    const posted = await postDoubleEntry({
      tenantId,
      type: 'earn',
      amount: cashback,
      debitAccount: ACCT_ISSUER,
      creditAccount: customerAccount(customerId),
      customerId,
      referenceType: 'order',
      referenceId: orderId,
      note: options.note || `Hoàn ${cashbackRateOf(newTier) * 100}% hạng ${tierLabel(newTier)} cho đơn`,
    });
    transactionId = posted.transactionId;
  }

  const now = new Date().toISOString();
  const updatedAccount: VxuAccount = {
    ...account,
    balance: (Number(account.balance) || 0) + cashback,
    lifetimeEarned: (Number(account.lifetimeEarned) || 0) + cashback,
    lifetimeSpendVnd: newSpend,
    lifetimeOrders: newOrders,
    tier: newTier,
    tierChangedAt: tierUpgraded ? now : account.tierChangedAt,
    updatedAt: now,
  };
  await updateDoc(doc(db, 'vxu_accounts', account.id), {
    balance: updatedAccount.balance,
    lifetimeEarned: updatedAccount.lifetimeEarned,
    lifetimeSpendVnd: updatedAccount.lifetimeSpendVnd,
    lifetimeOrders: updatedAccount.lifetimeOrders,
    tier: updatedAccount.tier,
    tierChangedAt: updatedAccount.tierChangedAt,
    updatedAt: now,
  });

  account = updatedAccount;
  return { account, cashback, tierUpgraded, transactionId };
}

// -----------------------------------------------------------------------------
// TIÊU V-XU — đổi phiếu ưu đãi
// -----------------------------------------------------------------------------

/** Mẫu phiếu trong ma trận ưu đãi — mở khoá theo hạng */
export interface VoucherTemplate {
  templateCode: string;
  title: string;
  vxuCost: number;
  voucherValueVnd: number;
  requiredTier: VxuTier;
  minSpendVnd: number;
  /** Số ngày có hiệu lực sau khi đổi */
  validDays: number;
}

/** Ma trận phiếu ưu đãi (Đề án E.5) — mỗi hạng mở khoá một tập phiếu */
export const VOUCHER_MATRIX: VoucherTemplate[] = [
  { templateCode: 'VC-20K',  title: 'Giảm 20.000đ',  vxuCost: 20000,  voucherValueVnd: 20000,  requiredTier: 'dong',      minSpendVnd: 200000,  validDays: 30 },
  { templateCode: 'VC-50K',  title: 'Giảm 50.000đ',  vxuCost: 45000,  voucherValueVnd: 50000,  requiredTier: 'bac',      minSpendVnd: 400000,  validDays: 30 },
  { templateCode: 'VC-100K', title: 'Giảm 100.000đ', vxuCost: 85000,  voucherValueVnd: 100000, requiredTier: 'bac',      minSpendVnd: 800000,  validDays: 60 },
  { templateCode: 'VC-200K', title: 'Giảm 200.000đ', vxuCost: 160000, voucherValueVnd: 200000, requiredTier: 'vang',    minSpendVnd: 1500000, validDays: 60 },
  { templateCode: 'VC-500K', title: 'Giảm 500.000đ', vxuCost: 380000, voucherValueVnd: 500000, requiredTier: 'kim_cuong', minSpendVnd: 4000000, validDays: 90 },
];

/** Thứ tự hạng để so sánh */
const TIER_ORDER: Record<VxuTier, number> = { dong: 0, bac: 1, vang: 2, kim_cuong: 3 };

/** Ma trận phiếu mà một hạng được phép đổi */
export function vouchersForTier(tier: VxuTier): VoucherTemplate[] {
  const rank = TIER_ORDER[tier];
  return VOUCHER_MATRIX.filter(v => TIER_ORDER[v.requiredTier] <= rank);
}

/**
 * Đổi V-Xu lấy phiếu ưu đãi.
 * Kiểm tra: hạng có đủ mở khoá mẫu phiếu + số dư đủ chi trả.
 * Ghi bút toán kép spend: debit ví khách / credit vxu_revenue.
 */
export async function redeemVoucher(
  customerId: string,
  templateCode: string,
  options: { tenantId?: string } = {}
): Promise<{ redemption: VxuRedemption; account: VxuAccount }> {
  const tenantId = options.tenantId || DEFAULT_TENANT;

  const template = VOUCHER_MATRIX.find(v => v.templateCode === templateCode);
  if (!template) throw new VxuError('Mẫu phiếu không tồn tại trong ma trận.', 'TEMPLATE_NOT_FOUND');

  const account = await getOrCreateAccount(customerId, tenantId);

  // Hạng phải đủ mở khoá
  if (TIER_ORDER[account.tier] < TIER_ORDER[template.requiredTier]) {
    throw new VxuError(
      `Phiếu "${template.title}" yêu cầu hạng ${tierLabel(template.requiredTier)} trở lên — khách đang hạng ${tierLabel(account.tier)}.`,
      'TIER_NOT_ENOUGH'
    );
  }

  // Số dư phải đủ
  if (account.balance < template.vxuCost) {
    throw new VxuError(
      `Không đủ V-Xu: cần ${template.vxuCost}, ví còn ${account.balance}.`,
      'INSUFFICIENT_BALANCE'
    );
  }

  const { transactionId } = await postDoubleEntry({
    tenantId,
    type: 'spend',
    amount: template.vxuCost,
    debitAccount: customerAccount(customerId),
    creditAccount: ACCT_REVENUE,
    customerId,
    referenceType: 'voucher_redemption',
    referenceId: template.templateCode,
    note: `Đổi phiếu "${template.title}"`,
  });

  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + template.validDays * 864e5).toISOString();

  const id = newId('vred');
  const redemption: VxuRedemption = {
    id,
    tenantId,
    customerId,
    voucherCode: `VXU-${template.templateCode}-${Date.now().toString(36).toUpperCase()}`,
    templateCode: template.templateCode,
    vxuCost: template.vxuCost,
    voucherValueVnd: template.voucherValueVnd,
    requiredTier: template.requiredTier,
    minSpendVnd: template.minSpendVnd,
    status: 'issued',
    transactionId,
    expiresAt,
    createdAt: now,
  };
  await setDoc(doc(db, 'vxu_redemptions', id), redemption);

  const updatedAccount: VxuAccount = {
    ...account,
    balance: account.balance - template.vxuCost,
    updatedAt: now,
  };
  await updateDoc(doc(db, 'vxu_accounts', account.id), {
    balance: updatedAccount.balance,
    updatedAt: now,
  });

  return { redemption, account: updatedAccount };
}

/** Đánh dấu phiếu đã dùng trên một đơn */
export async function useVoucher(
  voucherCode: string,
  orderId: string,
  options: { tenantId?: string } = {}
): Promise<VxuRedemption> {
  const tenantId = options.tenantId || DEFAULT_TENANT;

  const snap = await getDocs(query(
    collection(db, 'vxu_redemptions'),
    where('tenantId', '==', tenantId),
    where('voucherCode', '==', voucherCode)
  ));
  const found = snap.docs?.[0];
  if (!found) throw new VxuError('Phiếu không tồn tại.', 'VOUCHER_NOT_FOUND');

  const redemption = { ...(found.data() as VxuRedemption), id: found.id };
  if (redemption.status !== 'issued') {
    throw new VxuError(`Phiếu đang ở trạng thái "${redemption.status}" — không thể dùng.`, 'VOUCHER_NOT_USABLE');
  }
  if (redemption.expiresAt && new Date(redemption.expiresAt) < new Date()) {
    await updateDoc(doc(db, 'vxu_redemptions', redemption.id), { status: 'expired' });
    throw new VxuError('Phiếu đã hết hạn.', 'VOUCHER_EXPIRED');
  }

  const now = new Date().toISOString();
  const updates: Partial<VxuRedemption> = { status: 'used', orderId, usedAt: now };
  await updateDoc(doc(db, 'vxu_redemptions', redemption.id), updates);
  return { ...redemption, ...updates };
}

/** Liệt kê phiếu của một khách */
export async function listRedemptions(
  customerId?: string,
  tenantId: string = DEFAULT_TENANT
): Promise<VxuRedemption[]> {
  const constraints: any[] = [where('tenantId', '==', tenantId)];
  if (customerId) constraints.push(where('customerId', '==', customerId));

  const snap = await getDocs(query(collection(db, 'vxu_redemptions'), ...constraints));
  return snap.docs
    .map((d: any) => ({ ...(d.data() as VxuRedemption), id: d.id }))
    .sort((a: VxuRedemption, b: VxuRedemption) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

// -----------------------------------------------------------------------------
// HOÀN V-XU KHI ĐƠN BỊ HUỶ / TRẢ HÀNG
// -----------------------------------------------------------------------------

/** Hoàn lại V-Xu đã tích cho một đơn bị huỷ (không cộng lại chi tiêu lũy kế) */
export async function refundEarned(
  customerId: string,
  orderId: string,
  options: { tenantId?: string } = {}
): Promise<{ transactionId: string; refundAmount: number } | null> {
  const tenantId = options.tenantId || DEFAULT_TENANT;

  // Tìm bút toán earn của đơn
  const snap = await getDocs(query(
    collection(db, 'vxu_ledger'),
    where('tenantId', '==', tenantId),
    where('type', '==', 'earn'),
    where('referenceId', '==', orderId),
    where('customerId', '==', customerId)
  ));
  const earnEntry = snap.docs?.[0];
  if (!earnEntry) return null;

  const amount = Number(earnEntry.data().amount) || 0;
  if (amount <= 0) return null;

  // Kiểm tra đã hoàn chưa
  const refundSnap = await getDocs(query(
    collection(db, 'vxu_ledger'),
    where('tenantId', '==', tenantId),
    where('type', '==', 'refund'),
    where('referenceId', '==', orderId)
  ));
  if (refundSnap.docs?.length) return null;

  await postDoubleEntry({
    tenantId,
    type: 'refund',
    amount,
    debitAccount: ACCT_REVENUE,
    creditAccount: customerAccount(customerId),
    customerId,
    referenceType: 'order_refund',
    referenceId: orderId,
    note: `Hoàn V-Xu đã tích của đơn bị huỷ/trả`,
  });

  // Cập nhật ví (giảm lũy kế chi tiêu & số đơn vì đơn bị huỷ)
  const account = await getOrCreateAccount(customerId, tenantId);
  const now = new Date().toISOString();
  const updated: VxuAccount = {
    ...account,
    balance: Math.max(0, account.balance - amount),
    lifetimeSpendVnd: Math.max(0, (account.lifetimeSpendVnd || 0) - 0),
    updatedAt: now,
  };
  await updateDoc(doc(db, 'vxu_accounts', account.id), {
    balance: updated.balance,
    updatedAt: now,
  });

  return { transactionId: earnEntry.data().transactionId, refundAmount: amount };
}
