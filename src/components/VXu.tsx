import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Coins, RefreshCw, Search, Loader2, AlertTriangle, CheckCircle2,
  Ticket, TrendingUp, Users, ArrowUpRight, Wallet, ChevronRight,
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { Modal } from './ui/Modal';
import type { VxuAccount, VxuTier, VxuLedgerEntry, VxuRedemption } from '../types/erp';
import { VXU_TIERS } from '../types/erp';
import * as vxu from '../services/vxuService';
import { VOUCHER_MATRIX, vouchersForTier } from '../services/vxuService';

/**
 * TRỤ CỘT 7 — V-XU (điểm thưởng xuyên suốt hệ sinh thái) — spec 019
 *
 * Ba tab:
 *   1. Tổng quan    — bảng 4 hạng + ngưỡng + tỉ lệ hoàn (khớp Đề án E.5)
 *   2. Ví khách     — danh sách ví, hạng, số dư; xem sổ cái kép từng khách
 *   3. Phiếu ưu đãi — ma trận phiếu theo hạng + phiếu đã đổi
 *
 * Sổ cái KÉP: mỗi giao dịch hiển thị đủ 2 vế debit/credit cùng transactionId —
 * đối chiếu được với sổ kế toán tài chính (Đề án F.5).
 */

const TIER_STYLE: Record<VxuTier, { badge: string; text: string; ring: string }> = {
  dong: { badge: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-600', ring: 'ring-amber-200' },
  bac: { badge: 'bg-slate-100 text-slate-600 border-slate-300', text: 'text-slate-500', ring: 'ring-slate-300' },
  vang: { badge: 'bg-yellow-50 text-yellow-700 border-yellow-300', text: 'text-yellow-600', ring: 'ring-yellow-300' },
  kim_cuong: { badge: 'bg-violet-50 text-violet-700 border-violet-300', text: 'text-violet-600', ring: 'ring-violet-300' },
};

const TYPE_LABEL: Record<VxuLedgerEntry['type'], string> = {
  earn: 'Tích luỹ',
  spend: 'Tiêu',
  refund: 'Hoàn lại',
  expire: 'Hết hạn',
  adjust: 'Điều chỉnh',
};

const SIDE_LABEL: Record<VxuLedgerEntry['side'], string> = {
  debit: 'Nợ (Debit)',
  credit: 'Có (Credit)',
};

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Tỉ lệ hạng cao nhất tính theo vị trí trong mảng VXU_TIERS */
const tierRank = (t: VxuTier) => VXU_TIERS.findIndex(x => x.tier === t);

function AccountLabel({ tier }: { tier: VxuTier }) {
  const s = TIER_STYLE[tier];
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', s.badge)}>
      {vxu.tierLabel(tier)}
    </span>
  );
}

// -----------------------------------------------------------------------------
// MODAL — SỔ CÁI KÉP CỦA MỘT KHÁCH
// -----------------------------------------------------------------------------

function LedgerModal({ account, isOpen, onClose }: {
  account: VxuAccount | null; isOpen: boolean; onClose: () => void;
}) {
  const [entries, setEntries] = useState<VxuLedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !account) return;
    setLoading(true);
    vxu.listCustomerLedger(account.customerId)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [isOpen, account]);

  // Gom 2 vế cùng transactionId hiển thị cạnh nhau
  const txnGroups = useMemo(() => {
    const map = new Map<string, VxuLedgerEntry[]>();
    for (const e of entries) {
      const list = map.get(e.transactionId) || [];
      list.push(e);
      map.set(e.transactionId, list);
    }
    return Array.from(map.values()).sort((a, b) =>
      (b[0]?.createdAt || '').localeCompare(a[0]?.createdAt || ''));
  }, [entries]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="3xl" hideFooter
      title={account ? `Sổ cái V-Xu — ${account.customerId}` : 'Sổ cái V-Xu'}
      icon={<Coins className="h-5 w-5" />}>
      <div className="space-y-4">
        {account && (
          <div className="grid grid-cols-4 gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
            <div>
              <div className="text-xs text-slate-500">Hạng</div>
              <div className="mt-0.5"><AccountLabel tier={account.tier} /></div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Số dư V-Xu</div>
              <div className="font-bold text-orange-600">{formatCurrency(account.balance)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Tích luỹ từ trước</div>
              <div className="font-semibold">{formatCurrency(account.lifetimeEarned)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Chi tiêu lũy kế / Đơn</div>
              <div className="font-semibold">{formatCurrency(account.lifetimeSpendVnd)}</div>
              <div className="text-xs text-slate-400">{account.lifetimeOrders} đơn</div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Đang tải sổ cái...
          </div>
        ) : txnGroups.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">
            Chưa có bút toán nào — sổ luôn bắt đầu rỗng và cân bằng.
          </div>
        ) : (
          <div className="space-y-3">
            {txnGroups.map((group) => {
              const debit = group.find(e => e.side === 'debit');
              const credit = group.find(e => e.side === 'credit');
              const balanced = debit && credit && debit.amount === credit.amount;
              return (
                <div key={group[0]?.transactionId}
                  className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={cn('rounded-lg border px-2 py-0.5 text-xs font-medium',
                        group[0]?.type === 'earn' || group[0]?.type === 'refund'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : group[0]?.type === 'spend'
                            ? 'border-orange-200 bg-orange-50 text-orange-700'
                            : 'border-slate-200 bg-slate-50 text-slate-600')}>
                        {TYPE_LABEL[group[0]?.type] || group[0]?.type}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(group[0]?.createdAt)}</span>
                    </div>
                    <div className={cn('flex items-center gap-1 text-xs', balanced ? 'text-emerald-600' : 'text-rose-600')}>
                      {balanced ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                      {balanced ? 'Cân bằng' : 'LỆCH — cần kiểm tra!'}
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    {debit && (
                      <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
                        <div className="text-slate-400">{SIDE_LABEL.debit} · {debit.account}</div>
                        <div className="font-semibold text-slate-700">{formatCurrency(debit.amount)}</div>
                      </div>
                    )}
                    {credit && (
                      <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
                        <div className="text-slate-400">{SIDE_LABEL.credit} · {credit.account}</div>
                        <div className="font-semibold text-slate-700">{formatCurrency(credit.amount)}</div>
                      </div>
                    )}
                  </div>

                  {group[0]?.note && (
                    <div className="mt-2 text-xs text-slate-500">{group[0].note}</div>
                  )}
                  <div className="mt-1 text-xs text-slate-400">
                    Mã giao dịch: {group[0]?.transactionId}
                    {group[0]?.referenceId && ` · Tham chiếu: ${group[0].referenceType}/${group[0].referenceId}`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

// -----------------------------------------------------------------------------
// TRANG CHÍNH
// -----------------------------------------------------------------------------

export function VXuManager() {
  const [tab, setTab] = useState<'overview' | 'accounts' | 'vouchers'>('overview');
  const [accounts, setAccounts] = useState<VxuAccount[]>([]);
  const [redemptions, setRedemptions] = useState<VxuRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<VxuAccount | null>(null);
  const [showLedger, setShowLedger] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, r] = await Promise.all([
        vxu.listAccounts(),
        vxu.listRedemptions(),
      ]);
      setAccounts(a);
      setRedemptions(r);
    } catch (e: any) {
      setError(e?.message || 'Không tải được dữ liệu V-Xu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const stats = useMemo(() => {
    const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
    const totalEarned = accounts.reduce((s, a) => s + (a.lifetimeEarned || 0), 0);
    const totalSpend = accounts.reduce((s, a) => s + (a.lifetimeSpendVnd || 0), 0);
    const byTier = {
      dong: accounts.filter(a => a.tier === 'dong').length,
      bac: accounts.filter(a => a.tier === 'bac').length,
      vang: accounts.filter(a => a.tier === 'vang').length,
      kim_cuong: accounts.filter(a => a.tier === 'kim_cuong').length,
    };
    const issuedVouchers = redemptions.filter(r => r.status === 'issued').length;
    return { totalBalance, totalEarned, totalSpend, byTier, issuedVouchers };
  }, [accounts, redemptions]);

  const q = search.trim().toLowerCase();
  const visibleAccounts = useMemo(() => {
    if (!q) return accounts;
    return accounts.filter(a => a.customerId.toLowerCase().includes(q));
  }, [accounts, q]);

  const visibleRedemptions = useMemo(() => {
    if (!q) return redemptions;
    return redemptions.filter(r =>
      r.customerId.toLowerCase().includes(q) ||
      r.voucherCode.toLowerCase().includes(q)
    );
  }, [redemptions, q]);

  const openLedger = (a: VxuAccount) => {
    setSelected(a);
    setShowLedger(true);
  };

  const onRedeem = async (a: VxuAccount, templateCode: string) => {
    setBusy(true);
    try {
      const r = await vxu.redeemVoucher(a.customerId, templateCode);
      window.alert(
        `Đổi thành công!\nMã phiếu: ${r.redemption.voucherCode}\n` +
        `Giá trị: ${formatCurrency(r.redemption.voucherValueVnd)}\n` +
        `Còn lại: ${formatCurrency(r.account.balance)} V-Xu`
      );
      await reload();
    } catch (e: any) {
      alert(e?.message || 'Đổi phiếu thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const TABS = [
    { key: 'overview', label: 'Tổng quan hạng', icon: <TrendingUp className="h-4 w-4" /> },
    { key: 'accounts', label: 'Ví khách hàng', icon: <Users className="h-4 w-4" /> },
    { key: 'vouchers', label: 'Phiếu ưu đãi', icon: <Ticket className="h-4 w-4" /> },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
            <Coins className="h-7 w-7 text-orange-500" /> V-Xu (Trụ cột 7)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Điểm thưởng xuyên suốt hệ sinh thái · hoàn tiền 1–5% theo hạng ·
            sổ cái kế toán kép đối chiếu được tài chính
          </p>
        </div>
        <button onClick={reload}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" /> Làm mới
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Tổng V-Xu trong lưu thông', value: formatCurrency(stats.totalBalance), icon: <Coins className="h-4 w-4" />, tone: 'text-orange-600' },
          { label: 'Tổng đã tích luỹ', value: formatCurrency(stats.totalEarned), icon: <Wallet className="h-4 w-4" />, tone: 'text-emerald-600' },
          { label: 'Chi tiêu qua V-Xu', value: formatCurrency(stats.totalSpend), icon: <TrendingUp className="h-4 w-4" />, tone: 'text-sky-600' },
          { label: 'Phiếu đang lưu hành', value: stats.issuedVouchers, icon: <Ticket className="h-4 w-4" />, tone: 'text-violet-600' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className={s.tone}>{s.icon}</span> {s.label}
            </div>
            <div className="mt-1 text-lg font-bold text-slate-800">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === t.key
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}>
            {t.icon} {t.label}
          </button>
        ))}
        {tab !== 'overview' && (
          <div className="ml-auto pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Tìm mã khách / phiếu..."
                className="w-56 rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-orange-400" />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Đang tải dữ liệu V-Xu...
        </div>
      ) : (
        <>
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {VXU_TIERS.map((t, i) => (
                  <div key={t.tier}
                    className={cn('rounded-xl border-2 bg-white p-4 ring-2 ring-offset-0', 
                      TIER_STYLE[t.tier].badge.split(' ')[2] ? '' : '')}
                    style={{ borderColor: undefined }}>
                    <div className="flex items-center justify-between">
                      <AccountLabel tier={t.tier} />
                      {stats.byTier[t.tier] > 0 && (
                        <span className="text-xs text-slate-400">{stats.byTier[t.tier]} khách</span>
                      )}
                    </div>
                    <div className="mt-3 text-2xl font-bold text-slate-800">
                      {(t.cashbackRate * 100).toLocaleString('vi-VN')}%
                    </div>
                    <div className="text-xs text-slate-500">hoàn tiền mỗi đơn</div>
                    <div className="mt-3 space-y-1 border-t border-slate-100 pt-2 text-xs text-slate-600">
                      {t.minSpendVnd > 0 ? (
                        <>
                          <div>Chi tiêu &gt; <span className="font-semibold">{formatCurrency(t.minSpendVnd)}</span></div>
                          <div>Tối thiểu <span className="font-semibold">{t.minOrders} đơn</span></div>
                        </>
                      ) : (
                        <div>Mặc định khi tham gia</div>
                      )}
                      {i > 0 && (
                        <div className="mt-1 flex items-center gap-1 text-slate-400">
                          <ArrowUpRight className="h-3 w-3" />
                          Nâng từ {vxu.tierLabel(VXU_TIERS[i - 1].tier)}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      Mở {vouchersForTier(t.tier).length} mẫu phiếu ưu đãi
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-700">Cách tính hạng & hoàn tiền</h3>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                  <li>• Hạng xét theo <b>chi tiêu lũy kế</b> (dấu &gt;) <b>và số đơn hoàn tất</b> — phải đủ cả hai điều kiện.</li>
                  <li>• Đơn hoàn tất sẽ xếp lại hạng ngay; khách hưởng <b>tỉ lệ hoàn của hạng mới</b> nếu đơn đó đưa họ lên hạng.</li>
                  <li>• Đơn bị huỷ/trả: V-Xu đã tích bị <b>hoàn ngược</b> bằng bút toán refund.</li>
                  <li>• Mỗi giao dịch V-Xu ghi <b>đúng 2 vế debit/credit</b> cùng mã — mở sổ ở tab "Ví khách hàng" để đối chiếu.</li>
                </ul>
              </div>
            </div>
          )}

          {tab === 'accounts' && (
            visibleAccounts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-400">
                Chưa có ví V-Xu nào. Ví tự tạo khi khách có đơn hoàn tất đầu tiên.
              </div>
            ) : (
              <div className="space-y-2">
                {visibleAccounts.map(a => {
                  const nextTier = VXU_TIERS[tierRank(a.tier) + 1];
                  const pctToNext = nextTier
                    ? Math.min(100, Math.round((a.lifetimeSpendVnd / nextTier.minSpendVnd) * 100))
                    : 100;
                  return (
                    <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">{a.customerId}</span>
                            <AccountLabel tier={a.tier} />
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Chi tiêu lũy kế: {formatCurrency(a.lifetimeSpendVnd)} · {a.lifetimeOrders} đơn hoàn tất
                          </div>
                          <div className="mt-0.5 text-xs text-slate-400">
                            Cập nhật: {formatDate(a.updatedAt || a.createdAt)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-xs text-slate-500">Số dư V-Xu</div>
                            <div className="text-lg font-bold text-orange-600">{formatCurrency(a.balance)}</div>
                          </div>
                          <button onClick={() => openLedger(a)}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                            <Coins className="h-3.5 w-3.5" /> Sổ cái
                          </button>
                        </div>
                      </div>

                      {nextTier && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Tiến độ lên {vxu.tierLabel(nextTier.tier)}</span>
                            <span className="tabular-nums">
                              {a.lifetimeSpendVnd.toLocaleString('vi-VN')} / {nextTier.minSpendVnd.toLocaleString('vi-VN')}đ
                              {a.lifetimeOrders < nextTier.minOrders && (
                                <span className="ml-1 text-amber-600">· cần thêm {nextTier.minOrders - a.lifetimeOrders} đơn</span>
                              )}
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-orange-400" style={{ width: `${pctToNext}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}

          {tab === 'vouchers' && (
            <div className="space-y-5">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">
                  Ma trận phiếu ưu đãi — mở khoá theo hạng
                </h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Mẫu</th>
                        <th className="px-3 py-2">Giá trị</th>
                        <th className="px-3 py-2 text-right">Giá V-Xu</th>
                        <th className="px-3 py-2">Hạng mở khoá</th>
                        <th className="px-3 py-2 text-right">Chi tiêu tối thiểu</th>
                        <th className="px-3 py-2">Hiệu lực</th>
                      </tr>
                    </thead>
                    <tbody>
                      {VOUCHER_MATRIX.map(v => (
                        <tr key={v.templateCode} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-medium text-slate-800">{v.title}</td>
                          <td className="px-3 py-2">{formatCurrency(v.voucherValueVnd)}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-orange-600 font-semibold">{formatCurrency(v.vxuCost)}</td>
                          <td className="px-3 py-2"><AccountLabel tier={v.requiredTier} /></td>
                          <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(v.minSpendVnd)}</td>
                          <td className="px-3 py-2 text-xs text-slate-500">{v.validDays} ngày</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Phiếu đã đổi</h3>
                {visibleRedemptions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-400">
                    Chưa có phiếu nào được đổi.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {visibleRedemptions.map(r => (
                      <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-slate-700">{r.voucherCode}</span>
                            <span className={cn('rounded-full border px-2 py-0.5 text-xs',
                              r.status === 'issued' ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : r.status === 'used' ? 'border-slate-200 bg-slate-50 text-slate-500'
                                  : 'border-rose-200 bg-rose-50 text-rose-600')}>
                              {r.status === 'issued' ? 'Chờ dùng' : r.status === 'used' ? 'Đã dùng' : r.status === 'expired' ? 'Hết hạn' : 'Đã huỷ'}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Khách: {r.customerId} · Giá trị {formatCurrency(r.voucherValueVnd)}
                            {' · '}Tiêu {formatCurrency(r.vxuCost)} V-Xu
                          </div>
                          <div className="text-xs text-slate-400">
                            Đổi: {formatDate(r.createdAt)} · Hết hạn: {formatDate(r.expiresAt)}
                          </div>
                        </div>
                        {r.status === 'issued' && (
                          <div className="text-xs text-emerald-600">
                            Áp dụng cho đơn ≥ {formatCurrency(r.minSpendVnd)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <LedgerModal account={selected} isOpen={showLedger} onClose={() => setShowLedger(false)} />
    </div>
  );
}

export default VXuManager;
