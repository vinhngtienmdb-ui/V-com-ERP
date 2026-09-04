import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Warehouse, Package, QrCode, Clock, AlertTriangle, RefreshCw, Plus,
  Search, Loader2, Snowflake, Lock, Store, CheckCircle2, MapPin, Timer,
  RotateCcw, Phone, User,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn, formatCurrency } from '../lib/utils';
import { Modal } from './ui/Modal';
import type {
  VCommHub, VCommHubType, HubShipment, HubShipmentStatus,
} from '../types/erp';
import * as hubSvc from '../services/vcommHubService';
import {
  HUB_TYPE_LABEL, HUB_STATUS_LABEL, HUB_SHIPMENT_STATUS_LABEL,
  MAX_PICKUP_HOURS,
} from '../services/vcommHubService';

/**
 * O2O (Phần A) — VCOMM HUB — spec 018
 *
 * Trạm giao hàng / shop offline do VComm TỰ VẬN HÀNH, dùng phần mềm VComm HUB,
 * cùng tenant với VComm.
 *
 * Shop Offline ĐỐI TÁC (iPOS) là sản phẩm SaaS ĐA TENANT RIÊNG BIỆT — không nằm
 * ở đây. Hai sản phẩm giao nhau ở đúng một điểm: xác thực QR nhận hàng
 * (`hubSvc.verifyPickup`) — cả VComm HUB và iPOS đều gọi chung.
 *
 * Hai tab: Trạm · Kiện hàng.
 */

const HUB_TYPES: VCommHubType[] = ['standard', 'freeze', 'locker'];

const HUB_TYPE_ICONS: Record<VCommHubType, React.ReactNode> = {
  standard: <Store className="h-4 w-4" />,
  freeze: <Snowflake className="h-4 w-4" />,
  locker: <Lock className="h-4 w-4" />,
};

const HUB_STATUS_STYLES: Record<VCommHub['status'], string> = {
  active: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  full: 'bg-rose-50 text-rose-600 border-rose-200',
  maintenance: 'bg-amber-50 text-amber-600 border-amber-200',
  inactive: 'bg-slate-100 text-slate-400 border-slate-200',
};

const SHIPMENT_STATUS_STYLES: Record<HubShipmentStatus, string> = {
  in_transit: 'bg-slate-100 text-slate-500 border-slate-200',
  arrived: 'bg-sky-50 text-sky-600 border-sky-200',
  ready: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  picked_up: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  expired: 'bg-rose-50 text-rose-600 border-rose-200',
  returned: 'bg-slate-100 text-slate-400 border-slate-200',
};

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Số giờ đã chờ kể từ khi sẵn sàng nhận */
function hoursWaiting(s: HubShipment): number | null {
  if (!s.readyAt) return null;
  return (Date.now() - new Date(s.readyAt).getTime()) / 36e5;
}

function StatusBadge({ label, className }: { label: string; className: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', className)}>
      {label}
    </span>
  );
}

// -----------------------------------------------------------------------------
// MODAL — TẠO TRẠM
// -----------------------------------------------------------------------------

const EMPTY_HUB = {
  code: '', name: '', type: 'standard' as VCommHubType,
  provinceCode: '', provinceName: '', address: '',
  capacity: 100, open247: false, operatingHours: '',
  managerName: '', phone: '',
};

function HubModal({ isOpen, onClose, onSaved }: {
  isOpen: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState(EMPTY_HUB);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) { setForm(EMPTY_HUB); setError(null); }
  }, [isOpen]);

  const set = <K extends keyof typeof EMPTY_HUB>(k: K, v: (typeof EMPTY_HUB)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setError(null);
    if (!form.code.trim()) return setError('Mã trạm bắt buộc.');
    if (!form.name.trim()) return setError('Tên trạm bắt buộc.');
    if (form.capacity <= 0) return setError('Sức chứa phải lớn hơn 0.');

    setSaving(true);
    try {
      await hubSvc.createHub({
        ...form,
        provinceCode: form.provinceCode || undefined,
        provinceName: form.provinceName || undefined,
        address: form.address || undefined,
        operatingHours: form.operatingHours || undefined,
        managerName: form.managerName || undefined,
        phone: form.phone || undefined,
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Không tạo được trạm.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm trạm VComm Hub"
      icon={<Warehouse className="h-5 w-5" />} onConfirm={submit}
      confirmText="Lưu trạm" confirmDisabled={saving} maxWidth="2xl">
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="text-slate-600">Mã trạm *</span>
            <input value={form.code} onChange={e => set('code', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Tên trạm *</span>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
        </div>

        <div>
          <span className="text-sm text-slate-600">Loại trạm</span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {HUB_TYPES.map(t => (
              <button key={t} type="button" onClick={() => set('type', t)}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                  form.type === t
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                )}>
                {HUB_TYPE_ICONS[t]} {HUB_TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="text-slate-600">Mã tỉnh/thành</span>
            <input value={form.provinceCode} onChange={e => set('provinceCode', e.target.value)}
              placeholder="HCM" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Tên tỉnh/thành</span>
            <input value={form.provinceName} onChange={e => set('provinceName', e.target.value)}
              placeholder="TP. Hồ Chí Minh" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
          <label className="col-span-2 text-sm">
            <span className="text-slate-600">Địa chỉ</span>
            <input value={form.address} onChange={e => set('address', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Sức chứa *</span>
            <input type="number" min={1} value={form.capacity}
              onChange={e => set('capacity', Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Giờ hoạt động</span>
            <input value={form.operatingHours} onChange={e => set('operatingHours', e.target.value)}
              placeholder="08:00–21:00" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Người quản lý</span>
            <input value={form.managerName} onChange={e => set('managerName', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Điện thoại</span>
            <input value={form.phone} onChange={e => set('phone', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={form.open247}
            onChange={e => set('open247', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-emerald-500" />
          Hoạt động 24/7
        </label>
      </div>
    </Modal>
  );
}

// -----------------------------------------------------------------------------
// MODAL — QUÉT QR NHẬN HÀNG
// -----------------------------------------------------------------------------

function PickupModal({ isOpen, onClose, onDone }: {
  isOpen: boolean; onClose: () => void; onDone: () => void;
}) {
  const [tracking, setTracking] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) { setTracking(''); setCode(''); setResult(null); }
  }, [isOpen]);

  const submit = async () => {
    setBusy(true);
    setResult(null);
    try {
      const r = await hubSvc.verifyPickup(tracking.trim(), code.trim());
      if (r.ok) {
        setResult({ ok: true, message: `Xác thực thành công — ${r.shipment?.trackingCode} đã giao cho khách.` });
        onDone();
      } else {
        const msg: Record<string, string> = {
          NOT_FOUND: 'Không tìm thấy mã vận đơn này.',
          NOT_READY: 'Kiện hàng chưa sẵn sàng nhận (phải ở trạng thái "Sẵn sàng nhận").',
          INVALID_CODE: 'Mã QR không hợp lệ hoặc đã hết hạn (mã xoay vòng mỗi 30 giây).',
          EXPIRED: 'Kiện hàng đã quá hạn nhận.',
        };
        setResult({ ok: false, message: msg[r.reason] || 'Xác thực thất bại.' });
      }
    } catch (e: any) {
      setResult({ ok: false, message: e?.message || 'Xác thực thất bại.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quét QR nhận hàng"
      icon={<QrCode className="h-5 w-5" />} onConfirm={submit}
      confirmText="Xác thực" confirmDisabled={busy} maxWidth="md">
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          API xác thực dùng chung cho cả VComm HUB và iPOS — đảm bảo hai sản phẩm
          không bao giờ lệch chuẩn QR. Mã xoay vòng mỗi 30 giây.
        </p>

        <label className="block text-sm">
          <span className="text-slate-600">Mã vận đơn</span>
          <input value={tracking} onChange={e => setTracking(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Mã QR (6 chữ số)</span>
          <input value={code} onChange={e => setCode(e.target.value)}
            placeholder="000000" maxLength={6}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-lg tracking-[0.4em] outline-none focus:border-emerald-400" />
        </label>

        {result && (
          <div className={cn(
            'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
            result.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-rose-200 bg-rose-50 text-rose-700'
          )}>
            {result.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
            {result.message}
          </div>
        )}
      </div>
    </Modal>
  );
}

// -----------------------------------------------------------------------------
// TRANG CHÍNH
// -----------------------------------------------------------------------------

export function VCommHubManager() {
  const [tab, setTab] = useState<'hubs' | 'shipments'>('hubs');
  const [hubs, setHubs] = useState<VCommHub[]>([]);
  const [shipments, setShipments] = useState<HubShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [showHub, setShowHub] = useState(false);
  const [showPickup, setShowPickup] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [h, s] = await Promise.all([hubSvc.listHubs(), hubSvc.listShipments()]);
      setHubs(h);
      setShipments(s);
    } catch (e: any) {
      setError(e?.message || 'Không tải được dữ liệu VComm Hub.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const hubName = useCallback((id: string) =>
    hubs.find(h => h.id === id)?.name || id, [hubs]);

  const stats = useMemo(() => {
    const activeHubs = hubs.filter(h => h.status === 'active');
    const totalLoad = hubs.reduce((s, h) => s + (h.currentLoad || 0), 0);
    const totalCap = hubs.reduce((s, h) => s + (h.capacity || 0), 0);
    const waiting = shipments.filter(s => s.status === 'ready');
    const overdue = waiting.filter(s => (hoursWaiting(s) ?? 0) >= MAX_PICKUP_HOURS).length;
    const pickedUp = shipments.filter(s => s.status === 'picked_up').length;
    return {
      hubs: hubs.length, activeHubs: activeHubs.length,
      loadPct: totalCap ? Math.round((totalLoad / totalCap) * 100) : 0,
      waiting: waiting.length, overdue, pickedUp,
    };
  }, [hubs, shipments]);

  const q = search.trim().toLowerCase();
  const visibleHubs = useMemo(() => {
    if (!q) return hubs;
    return hubs.filter(h =>
      h.code.toLowerCase().includes(q) || h.name.toLowerCase().includes(q) ||
      (h.provinceName || '').toLowerCase().includes(q)
    );
  }, [hubs, q]);

  const visibleShipments = useMemo(() => {
    if (!q) return shipments;
    return shipments.filter(s =>
      s.trackingCode.toLowerCase().includes(q) ||
      (s.recipientName || '').toLowerCase().includes(q) ||
      (s.recipientPhone || '').includes(q)
    );
  }, [shipments, q]);

  const onShipmentAction = async (action: 'arrived' | 'ready' | 'returned', s: HubShipment) => {
    setBusy(true);
    try {
      if (action === 'returned') {
        const reason = window.prompt('Lý do hoàn?', 'Khách từ chối nhận');
        if (reason === null) return;
        await hubSvc.markReturned(s.id, reason);
      } else if (action === 'arrived') {
        await hubSvc.markArrived(s.id);
      } else {
        await hubSvc.markReady(s.id);
      }
      await reload();
    } catch (e: any) {
      alert(e?.message || 'Thao tác thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const onExpireStale = async () => {
    if (!window.confirm('Quét và tự huỷ các kiện quá 72h? Hệ thống sẽ ghi phạt 15% trên tiền thu hộ.')) return;
    setBusy(true);
    try {
      const r = await hubSvc.expireStalePackages();
      window.alert(
        r.expiredCount > 0
          ? `Đã huỷ ${r.expiredCount} kiện quá hạn.\nTổng tiền phạt ghi nhận: ${formatCurrency(r.totalPenalty)}`
          : 'Không có kiện nào quá hạn.'
      );
      await reload();
    } catch (e: any) {
      alert(e?.message || 'Xử lý thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const TABS = [
    { key: 'hubs', label: 'Trạm', icon: <Warehouse className="h-4 w-4" /> },
    { key: 'shipments', label: 'Kiện hàng', icon: <Package className="h-4 w-4" /> },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
            <Warehouse className="h-7 w-7 text-emerald-500" /> VComm Hub — O2O (Trụ cột 6)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Trạm giao hàng &amp; shop offline do VComm tự vận hành · nhận hàng QR 30 giây ·
            tự huỷ sau {MAX_PICKUP_HOURS}h
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reload}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" /> Làm mới
          </button>
          <button onClick={() => setShowPickup(true)}
            className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100">
            <QrCode className="h-4 w-4" /> Quét QR nhận hàng
          </button>
          {tab === 'shipments' && (
            <button onClick={onExpireStale} disabled={busy}
              className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50">
              <Timer className="h-4 w-4" /> Quét quá hạn
            </button>
          )}
          {tab === 'hubs' && (
            <button onClick={() => setShowHub(true)}
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600">
              <Plus className="h-4 w-4" /> Thêm trạm
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: 'Trạm hoạt động', value: `${stats.activeHubs}/${stats.hubs}`, icon: <Warehouse className="h-4 w-4" />, tone: 'text-emerald-600' },
          { label: 'Tải mạng lưới', value: `${stats.loadPct}%`, icon: <MapPin className="h-4 w-4" />, tone: 'text-sky-600' },
          { label: 'Chờ nhận', value: stats.waiting, icon: <Clock className="h-4 w-4" />, tone: 'text-amber-600' },
          { label: 'Quá hạn 72h', value: stats.overdue, icon: <AlertTriangle className="h-4 w-4" />, tone: 'text-rose-600' },
          { label: 'Đã giao', value: stats.pickedUp, icon: <CheckCircle2 className="h-4 w-4" />, tone: 'text-indigo-600' },
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
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}>
            {t.icon} {t.label}
          </button>
        ))}
        <div className="ml-auto pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-56 rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-emerald-400" />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Đang tải dữ liệu VComm Hub...
        </div>
      ) : (
        <>
          {tab === 'hubs' && (
            visibleHubs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-400">
                Chưa có trạm nào. Nhấn “Thêm trạm” để khai báo trạm đầu tiên.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {visibleHubs.map(h => {
                  const pct = h.capacity ? Math.min(100, Math.round(((h.currentLoad || 0) / h.capacity) * 100)) : 100;
                  const tone = pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
                  return (
                    <motion.div key={h.id} layout
                      className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={cn('rounded-lg p-1.5',
                            h.type === 'freeze' ? 'bg-sky-50 text-sky-600'
                              : h.type === 'locker' ? 'bg-violet-50 text-violet-600'
                                : 'bg-emerald-50 text-emerald-600')}>
                            {HUB_TYPE_ICONS[h.type]}
                          </span>
                          <div>
                            <div className="font-semibold text-slate-800">{h.name}</div>
                            <div className="text-xs text-slate-500">{h.code}</div>
                          </div>
                        </div>
                        <StatusBadge label={HUB_STATUS_LABEL[h.status]} className={HUB_STATUS_STYLES[h.status]} />
                      </div>

                      <div className="mt-3 text-xs text-slate-500">
                        <div>{HUB_TYPE_LABEL[h.type]}</div>
                        {h.provinceName && (
                          <div className="mt-0.5 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {h.provinceName}
                          </div>
                        )}
                        {h.open247 && <div className="mt-0.5 text-emerald-600">Mở 24/7</div>}
                        {!h.open247 && h.operatingHours && <div className="mt-0.5">{h.operatingHours}</div>}
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Tải</span>
                          <span className="tabular-nums">{h.currentLoad}/{h.capacity}</span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div className={cn('h-full rounded-full transition-all', tone)} style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      {(h.managerName || h.phone) && (
                        <div className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-500">
                          {h.managerName && <div className="flex items-center gap-1"><User className="h-3 w-3" /> {h.managerName}</div>}
                          {h.phone && <div className="mt-0.5 flex items-center gap-1"><Phone className="h-3 w-3" /> {h.phone}</div>}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )
          )}

          {tab === 'shipments' && (
            visibleShipments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-400">
                Chưa có kiện hàng nào tại trạm.
              </div>
            ) : (
              <div className="space-y-3">
                {visibleShipments.map(s => {
                  const hrs = hoursWaiting(s);
                  const nearExpiry = s.status === 'ready' && hrs != null && hrs >= 48 && hrs < MAX_PICKUP_HOURS;
                  const overdue = s.status === 'ready' && hrs != null && hrs >= MAX_PICKUP_HOURS;

                  return (
                    <div key={s.id} className={cn(
                      'rounded-xl border bg-white p-4',
                      overdue ? 'border-rose-300' : nearExpiry ? 'border-amber-300' : 'border-slate-200'
                    )}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">{s.trackingCode}</span>
                            <StatusBadge label={HUB_SHIPMENT_STATUS_LABEL[s.status]} className={SHIPMENT_STATUS_STYLES[s.status]} />
                            {s.inspectionOk === true && (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                                <CheckCircle2 className="h-3 w-3" /> Đồng kiểm đạt
                              </span>
                            )}
                            {s.inspectionOk === false && (
                              <span className="inline-flex items-center gap-1 text-xs text-rose-600">
                                <AlertTriangle className="h-3 w-3" /> Đồng kiểm không đạt
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Trạm: {hubName(s.hubId)} · Tạo: {formatDate(s.createdAt)}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            Người nhận: {s.recipientName || '—'} · {s.recipientPhone || '—'}
                          </div>
                        </div>

                        {s.status === 'ready' && hrs != null && (
                          <div className={cn(
                            'rounded-lg border px-3 py-1.5 text-center',
                            overdue ? 'border-rose-200 bg-rose-50' : nearExpiry ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'
                          )}>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Clock className="h-3 w-3" /> Chờ
                            </div>
                            <div className={cn('text-lg font-bold tabular-nums',
                              overdue ? 'text-rose-600' : nearExpiry ? 'text-amber-600' : 'text-slate-700')}>
                              {hrs.toFixed(1)}h
                            </div>
                            <div className="text-xs text-slate-400">/ {MAX_PICKUP_HOURS}h</div>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-1.5">
                          {s.status === 'in_transit' && (
                            <button disabled={busy} onClick={() => onShipmentAction('arrived', s)}
                              className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100 disabled:opacity-50">
                              Đã đến trạm
                            </button>
                          )}
                          {s.status === 'arrived' && (
                            <button disabled={busy} onClick={() => onShipmentAction('ready', s)}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                              Sẵn sàng nhận
                            </button>
                          )}
                          {['in_transit', 'arrived', 'ready', 'expired'].includes(s.status) && (
                            <button disabled={busy} onClick={() => onShipmentAction('returned', s)}
                              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                              <RotateCcw className="h-3 w-3" /> Hoàn
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                        <div>
                          <div className="text-xs text-slate-500">Thu hộ COD</div>
                          <div className="font-semibold">{formatCurrency(s.codAmount)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Quỹ bảo hiểm O2O</div>
                          <div className="font-semibold">{formatCurrency(s.insuranceFee)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Phạt (15%)</div>
                          <div className={cn('font-semibold', s.penaltyAmount > 0 ? 'text-rose-600' : 'text-slate-400')}>
                            {s.penaltyAmount > 0 ? formatCurrency(s.penaltyAmount) : '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Hoàn tại quầy</div>
                          <div className={cn('font-semibold', s.refundedAmount > 0 ? 'text-amber-600' : 'text-slate-400')}>
                            {s.refundedAmount > 0 ? formatCurrency(s.refundedAmount) : '—'}
                          </div>
                        </div>
                      </div>

                      {overdue && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          Đã quá {MAX_PICKUP_HOURS}h — sẽ bị tự huỷ và ghi phạt 15% khi chạy “Quét quá hạn”.
                        </div>
                      )}
                      {nearExpiry && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          Sắp quá hạn — cần nhắc khách đến nhận.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </>
      )}

      <HubModal isOpen={showHub} onClose={() => setShowHub(false)} onSaved={reload} />
      <PickupModal isOpen={showPickup} onClose={() => setShowPickup(false)} onDone={reload} />
    </div>
  );
}

export default VCommHubManager;
