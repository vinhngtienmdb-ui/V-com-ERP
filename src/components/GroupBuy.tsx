import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users2, Plus, RefreshCw, Search, X, CheckCircle2, AlertTriangle,
  Clock, TrendingUp, Trash2, Lock, Factory, PackageCheck, Ban,
  ChevronDown, ChevronUp, UserPlus, LogOut, Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency } from '../lib/utils';
import { Modal } from './ui/Modal';
import type { GroupBuySession, GroupBuyParticipant, GroupBuyStatus } from '../types/erp';
import * as groupBuyService from '../services/groupBuyService';
import { GROUP_BUY_STATUS_LABEL, GROUP_BUY_PARTICIPANT_STATUS_LABEL } from '../services/groupBuyService';

/**
 * TRỤ CỘT 3 — MUA CHUNG (GROUP BUY) — spec 016
 *
 * Màn hình vận hành phiên mua chung: tạo phiên, theo dõi tiến độ đạt min,
 * quản lý người tham gia, và đi vòng đời:
 *   group_open → group_reached_minimum → group_locked → supplier_confirmed → completed
 *   (bất kỳ bước nào cũng có thể → cancelled | expired)
 *
 * `currentParticipants` do DB trigger quản lý — UI chỉ đọc.
 */

type StatusFilter = 'all' | GroupBuyStatus;

const STATUS_STYLES: Record<GroupBuyStatus, string> = {
  group_open: 'bg-rose-50 text-rose-600 border-rose-200',
  group_reached_minimum: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  group_locked: 'bg-amber-50 text-amber-600 border-amber-200',
  supplier_confirmed: 'bg-sky-50 text-sky-600 border-sky-200',
  completed: 'bg-slate-100 text-slate-600 border-slate-200',
  cancelled: 'bg-slate-100 text-slate-400 border-slate-200',
  expired: 'bg-slate-100 text-slate-400 border-slate-200',
};

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function countdown(iso?: string | null): { text: string; danger: boolean } {
  if (!iso) return { text: 'Không giới hạn', danger: false };
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return { text: '—', danger: false };
  if (ms <= 0) return { text: 'Đã hết hạn', danger: true };
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 24) return { text: `${Math.floor(h / 24)} ngày ${h % 24} giờ`, danger: false };
  return { text: `${h} giờ ${m} phút`, danger: h < 6 };
}

// ---------------------------------------------------------------------------
// Tạo phiên
// ---------------------------------------------------------------------------

interface CreateForm {
  comboId: string;
  productId: string;
  minParticipants: number;
  unitPrice: number;
  hours: number;
}

const EMPTY_FORM: CreateForm = { comboId: '', productId: '', minParticipants: 5, unitPrice: 0, hours: 48 };

function CreateSessionModal({ isOpen, onClose, onCreated }: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (s: GroupBuySession) => void;
}) {
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof CreateForm>(k: K, v: CreateForm[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setError(null);
    if (form.minParticipants < 2) return setError('Số lượng tối thiểu phải từ 2 người.');
    if (form.unitPrice <= 0) return setError('Đơn giá phải lớn hơn 0.');
    if (!form.comboId.trim() && !form.productId.trim()) {
      return setError('Cần nhập mã combo hoặc mã sản phẩm để phiên có thể truy vết.');
    }

    setSaving(true);
    try {
      const expiresAt = new Date(Date.now() + form.hours * 3_600_000).toISOString();
      const session = await groupBuyService.createSession({
        comboId: form.comboId.trim() || undefined,
        productId: form.productId.trim() || undefined,
        minParticipants: form.minParticipants,
        unitPrice: form.unitPrice,
        expiresAt,
      });
      onCreated(session);
      setForm(EMPTY_FORM);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Không tạo được phiên mua chung.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo phiên Mua chung"
      icon={<Users2 className="w-5 h-5" />}
      onConfirm={submit}
      confirmText="Tạo phiên"
      confirmDisabled={saving}
    >
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Mã combo <span className="text-slate-400">(nếu theo combo)</span></span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            placeholder="CB-001"
            value={form.comboId}
            onChange={e => set('comboId', e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Mã sản phẩm <span className="text-slate-400">(nếu theo SKU)</span></span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            placeholder="P-001"
            value={form.productId}
            onChange={e => set('productId', e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Số người tối thiểu</span>
          <input
            type="number" min={2} max={9999}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            value={form.minParticipants}
            onChange={e => set('minParticipants', Math.max(2, Number(e.target.value) || 2))}
          />
          <span className="mt-1 block text-xs text-slate-400">Từ 2 trở lên. Gợi ý theo Đề án: nhóm 3–5–10 người.</span>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Đơn giá (đ/người-số lượng)</span>
          <input
            type="number" min={0} step={1000}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            value={form.unitPrice}
            onChange={e => set('unitPrice', Math.max(0, Number(e.target.value) || 0))}
          />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block font-medium text-slate-700">Thời gian mở phiên (giờ)</span>
          <div className="flex flex-wrap gap-2">
            {[6, 12, 24, 48, 72].map(h => (
              <button
                key={h}
                type="button"
                onClick={() => set('hours', h)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-sm font-medium transition',
                  form.hours === h
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-slate-300 text-slate-600 hover:border-primary-400'
                )}
              >
                {h} giờ
              </button>
            ))}
            <input
              type="number" min={1} max={720}
              className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
              value={form.hours}
              onChange={e => set('hours', Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <span className="mt-1 block text-xs text-slate-400">
            Hết hạn chưa đạt tối thiểu, phiên tự chuyển "Hết hạn" và hoàn tiền người tham gia (cron DB).
          </span>
        </label>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Thêm người tham gia (demo vận hành nội bộ)
// ---------------------------------------------------------------------------

function AddParticipantModal({ isOpen, session, onClose, onDone }: {
  isOpen: boolean;
  session: GroupBuySession | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (isOpen) { setCustomerId(''); setCustomerName(''); setQuantity(1); setError(null); } }, [isOpen]);

  const submit = async () => {
    if (!session) return;
    setError(null);
    if (!customerId.trim()) return setError('Nhập mã khách hàng.');
    try {
      setSaving(true);
      await groupBuyService.joinSession({
        sessionId: session.id,
        customerId: customerId.trim(),
        customerName: customerName.trim() || undefined,
        quantity,
      });
      onDone();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Không tham gia được phiên.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Thêm người tham gia — ${session?.comboId || session?.productId || session?.id}`}
      icon={<UserPlus className="w-5 h-5" />}
      onConfirm={submit}
      confirmText="Tham gia"
      confirmDisabled={saving}
    >
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Mã khách hàng</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            placeholder="CUS-001"
            value={customerId}
            onChange={e => setCustomerId(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Tên khách (tuỳ chọn)</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Số lượng</span>
          <input
            type="number" min={1}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            value={quantity}
            onChange={e => setQuantity(Math.max(1, Number(e.target.value) || 1))}
          />
          <span className="mt-1 block text-xs text-slate-400">
            Thành tiền dự kiến: {formatCurrency(quantity * (session?.unitPrice || 0))}
          </span>
        </label>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Hàng phiên mua chung
// ---------------------------------------------------------------------------

function SessionRow({ session, onAction, busy }: {
  session: GroupBuySession;
  onAction: (a: 'detail' | 'lock' | 'confirm' | 'complete' | 'cancel' | 'delete', s: GroupBuySession) => void;
  busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [participants, setParticipants] = useState<GroupBuyParticipant[] | null>(null);
  const [loadingPpl, setLoadingPpl] = useState(false);

  useEffect(() => {
    if (!open || participants) return;
    let alive = true;
    setLoadingPpl(true);
    groupBuyService.listParticipants(session.id)
      .then(rows => { if (alive) setParticipants(rows); })
      .catch(() => { if (alive) setParticipants([]); })
      .finally(() => { if (alive) setLoadingPpl(false); });
    return () => { alive = false; };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const pct = groupBuyService.progressPercent(session);
  const cd = countdown(session.expiresAt);
  const reached = session.currentParticipants >= session.minParticipants;
  const canLock = (session.status === 'group_open' || session.status === 'group_reached_minimum') && reached;
  const canConfirm = session.status === 'group_locked';
  const canComplete = session.status === 'supplier_confirmed';
  const canCancel = ['group_open', 'group_reached_minimum', 'group_locked', 'supplier_confirmed'].includes(session.status);
  const canDelete = session.status === 'group_open' && session.currentParticipants === 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
          title={open ? 'Thu gọn' : 'Xem người tham gia'}
        >
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        <div className="min-w-[180px] flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-slate-800">
              {session.comboId || session.productId || session.id}
            </span>
            <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', STATUS_STYLES[session.status])}>
              {GROUP_BUY_STATUS_LABEL[session.status]}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Tạo {formatDate(session.createdAt)} · ID {session.id}
          </p>
        </div>

        <div className="min-w-[160px]">
          <div className="flex items-baseline gap-1">
            <span className={cn('text-lg font-bold', reached ? 'text-emerald-600' : 'text-rose-600')}>
              {session.currentParticipants}
            </span>
            <span className="text-sm text-slate-400">/ {session.minParticipants} người</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn('h-full rounded-full transition-all', reached ? 'bg-emerald-500' : 'bg-rose-400')}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="min-w-[120px] text-sm">
          <div className="font-semibold text-slate-700">{formatCurrency(session.unitPrice)}</div>
          <div className={cn('flex items-center gap-1 text-xs', cd.danger ? 'text-rose-500' : 'text-slate-400')}>
            <Clock className="h-3 w-3" /> {cd.text}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canLock && (
            <button disabled={busy} onClick={() => onAction('lock', session)}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50">
              <Lock className="h-3.5 w-3.5" /> Chốt sổ
            </button>
          )}
          {canConfirm && (
            <button disabled={busy} onClick={() => onAction('confirm', session)}
              className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-600 disabled:opacity-50">
              <Factory className="h-3.5 w-3.5" /> Nguồn xác nhận
            </button>
          )}
          {canComplete && (
            <button disabled={busy} onClick={() => onAction('complete', session)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">
              <PackageCheck className="h-3.5 w-3.5" /> Hoàn tất
            </button>
          )}
          {canCancel && (
            <button disabled={busy} onClick={() => onAction('cancel', session)}
              className="flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50">
              <Ban className="h-3.5 w-3.5" /> Huỷ
            </button>
          )}
          {canDelete && (
            <button disabled={busy} onClick={() => onAction('delete', session)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              title="Xóa phiên chưa có người tham gia">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          {session.status === 'completed' && (
            <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Đã hoàn tất {formatDate(session.completedAt)}
            </span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-700">Người tham gia</h4>
                <span className="text-xs text-slate-400">
                  Tổng góp: {formatCurrency(
                    (participants || []).filter(p => p.status !== 'cancelled')
                      .reduce((s, p) => s + p.amount, 0)
                  )}
                </span>
              </div>
              {loadingPpl ? (
                <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                </div>
              ) : (participants || []).length === 0 ? (
                <p className="py-4 text-sm text-slate-400">Chưa có ai tham gia phiên này.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                        <th className="py-2 pr-4">Khách</th>
                        <th className="py-2 pr-4">SL</th>
                        <th className="py-2 pr-4">Đơn giá</th>
                        <th className="py-2 pr-4">Thành tiền</th>
                        <th className="py-2 pr-4">Trạng thái</th>
                        <th className="py-2 pr-4">Tham gia</th>
                        <th className="py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(participants || []).map(p => (
                        <tr key={p.id} className="border-b border-slate-50 last:border-0">
                          <td className="py-2 pr-4">
                            <div className="font-medium text-slate-700">{p.customerName || p.customerId}</div>
                            <div className="font-mono text-xs text-slate-400">{p.customerId}</div>
                          </td>
                          <td className="py-2 pr-4">{p.quantity}</td>
                          <td className="py-2 pr-4">{formatCurrency(p.unitPrice)}</td>
                          <td className="py-2 pr-4 font-semibold">{formatCurrency(p.amount)}</td>
                          <td className="py-2 pr-4">
                            <span className={cn(
                              'rounded-full px-2 py-0.5 text-xs',
                              p.status === 'joined' && 'bg-sky-50 text-sky-600',
                              p.status === 'confirmed' && 'bg-emerald-50 text-emerald-600',
                              p.status === 'refunded' && 'bg-amber-50 text-amber-600',
                              p.status === 'cancelled' && 'bg-slate-100 text-slate-400',
                            )}>
                              {GROUP_BUY_PARTICIPANT_STATUS_LABEL[p.status]}
                            </span>
                          </td>
                          <td className="py-2 pr-4 text-xs text-slate-400">{formatDate(p.joinedAt)}</td>
                          <td className="py-2">
                            {(p.status === 'joined' || p.status === 'confirmed') && open && (
                              <LeaveButton session={session} participant={p} onLeft={() => setParticipants(null)} />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LeaveButton({ session, participant, onLeft }: {
  session: GroupBuySession;
  participant: GroupBuyParticipant;
  onLeft: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const leave = async () => {
    setBusy(true);
    try {
      await groupBuyService.leaveSession(session.id, participant.customerId);
      onLeft();
    } catch (e: any) {
      alert(e?.message || 'Không rời được phiên.');
    } finally {
      setBusy(false);
    }
  };
  const lockable = session.status !== 'group_open' && session.status !== 'group_reached_minimum';
  if (lockable) return null;
  return (
    <button
      onClick={leave}
      disabled={busy}
      className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50 disabled:opacity-50"
      title="Cho khách rời phiên (trước khi chốt sổ)"
    >
      <LogOut className="h-3 w-3" /> Rời
    </button>
  );
}

// ---------------------------------------------------------------------------
// Màn hình chính
// ---------------------------------------------------------------------------

export function GroupBuyManager() {
  const [sessions, setSessions] = useState<GroupBuySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [addSession, setAddSession] = useState<GroupBuySession | null>(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0); // ép render lại countdown

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await groupBuyService.listSessions();
      setSessions(rows);
    } catch (e: any) {
      setError(e?.message || 'Không tải được danh sách phiên mua chung.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload, tick]);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const stats = useMemo(() => {
    const open = sessions.filter(s => s.status === 'group_open' || s.status === 'group_reached_minimum').length;
    const locked = sessions.filter(s => s.status === 'group_locked' || s.status === 'supplier_confirmed').length;
    const done = sessions.filter(s => s.status === 'completed').length;
    const dead = sessions.filter(s => s.status === 'cancelled' || s.status === 'expired').length;
    const people = sessions
      .filter(s => s.status !== 'cancelled' && s.status !== 'expired')
      .reduce((s, x) => s + x.currentParticipants, 0);
    return { open, locked, done, dead, people };
  }, [sessions]);

  const visible = useMemo(() => {
    let rows = sessions;
    if (filter !== 'all') rows = rows.filter(s => s.status === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(s =>
        (s.comboId || '').toLowerCase().includes(q) ||
        (s.productId || '').toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [sessions, filter, search]);

  const onAction = async (action: 'detail' | 'lock' | 'confirm' | 'complete' | 'cancel' | 'delete', s: GroupBuySession) => {
    if (action === 'detail') { setAddSession(s); return; }
    setBusy(true);
    try {
      if (action === 'lock') {
        await groupBuyService.lockSession(s.id);
      } else if (action === 'confirm') {
        await groupBuyService.confirmBySupplier(s.id);
      } else if (action === 'complete') {
        await groupBuyService.completeSession(s.id);
      } else if (action === 'cancel') {
        const reason = window.prompt('Lý do huỷ phiên?', 'Không đủ người tham gia');
        if (reason === null) return; // user bỏ qua
        await groupBuyService.cancelSession(s.id, reason);
      } else if (action === 'delete') {
        if (!window.confirm('Xoá phiên này? Chỉ xoá được phiên chưa có người tham gia.')) return;
        await groupBuyService.deleteSession(s.id);
      }
      await reload();
    } catch (e: any) {
      alert(e?.message || 'Thao tác thất bại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
            <Users2 className="h-7 w-7 text-rose-500" /> Mua chung (Trụ cột 3)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Phiên mua theo nhóm 3–5–10 người · chốt khi đạt tối thiểu · hết hạn tự hoàn tiền
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTick(x => x + 1)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> Làm mới
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" /> Tạo phiên
          </button>
        </div>
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: 'Đang mở', value: stats.open, icon: <Clock className="h-5 w-5" />, cls: 'text-rose-500' },
          { label: 'Đã chốt sổ', value: stats.locked, icon: <Lock className="h-5 w-5" />, cls: 'text-amber-500' },
          { label: 'Hoàn tất', value: stats.done, icon: <CheckCircle2 className="h-5 w-5" />, cls: 'text-emerald-500' },
          { label: 'Huỷ / Hết hạn', value: stats.dead, icon: <Ban className="h-5 w-5" />, cls: 'text-slate-400' },
          { label: 'Tổng người tham gia', value: stats.people, icon: <TrendingUp className="h-5 w-5" />, cls: 'text-indigo-500' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={cn('flex items-center gap-2', s.cls)}>
              {s.icon}
              <span className="text-2xl font-bold">{s.value}</span>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Lọc + tìm kiếm */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-64 rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none"
            placeholder="Tìm theo combo / SKU / ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'group_open', 'group_reached_minimum', 'group_locked', 'supplier_confirmed', 'completed', 'cancelled', 'expired'] as StatusFilter[])
            .map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                  filter === f
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-primary-400'
                )}
              >
                {f === 'all' ? 'Tất cả' : GROUP_BUY_STATUS_LABEL[f]}
              </button>
            ))}
        </div>
      </div>

      {/* Danh sách */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Đang tải phiên mua chung...
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Users2 className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-medium text-slate-500">Chưa có phiên mua chung nào</p>
          <p className="text-sm text-slate-400">Tạo phiên đầu tiên để bắt đầu giữ chân người dùng theo Đề án Trụ cột 3.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(s => (
            <SessionRow key={s.id} session={s} onAction={onAction} busy={busy} />
          ))}
        </div>
      )}

      <CreateSessionModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => reload()}
      />
      <AddParticipantModal
        isOpen={addSession !== null}
        session={addSession}
        onClose={() => setAddSession(null)}
        onDone={() => reload()}
      />
    </div>
  );
}

export default GroupBuyManager;
