import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Factory, Tractor, Users, Plus, RefreshCw, Search, X, CheckCircle2,
  AlertTriangle, Clock, Trash2, Ban, Loader2, TrendingUp, PackageCheck,
  Truck, Hammer, BadgeCheck, MapPin, Star, ChevronDown, ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency } from '../lib/utils';
import { Modal } from './ui/Modal';
import { VietnamAddressSelector, EMPTY_ADDRESS } from './VietnamAddressSelector';
import type { VietnamAddress } from './VietnamAddressSelector';
import type {
  F2B2BSource, F2B2BPoolOrder, F2B2BPoolParticipant,
  F2B2BPoolStatus, F2B2BPriceTier, F2B2BSourceType,
} from '../types/erp';
import * as f2b2bService from '../services/f2b2bService';
import {
  F2B2B_POOL_STATUS_LABEL, F2B2B_SOURCE_TYPE_LABEL, F2B2B_SOURCE_STATUS_LABEL,
} from '../services/f2b2bService';

/**
 * TRỤ CỘT 4 — F2B2B (Farm / Factory → Business → Business) — spec 016
 *
 * Hai tab:
 *   1. Nguồn hàng  — nông trại / nhà máy / hợp tác xã, hồ sơ năng lực + đánh giá
 *   2. Phiên gom   — vòng đời draft → open → closed → confirmed → producing →
 *                    shipping → completed, giá bậc thang khớp lùi khi chốt sổ
 *
 * KHÁC Mua chung (Trụ cột 3): gom đủ sản lượng để ĐẶT SẢN XUẤT / thu mua
 * trực tiếp từ nguồn. Hai mô hình không gộp bảng.
 */

const POOL_STATUS_STYLES: Record<F2B2BPoolStatus, string> = {
  draft: 'bg-slate-100 text-slate-500 border-slate-200',
  open: 'bg-rose-50 text-rose-600 border-rose-200',
  closed: 'bg-amber-50 text-amber-600 border-amber-200',
  confirmed: 'bg-sky-50 text-sky-600 border-sky-200',
  producing: 'bg-violet-50 text-violet-600 border-violet-200',
  shipping: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  completed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-400 border-slate-200',
};

const SOURCE_TYPE_ICONS: Record<F2B2BSourceType, React.ReactNode> = {
  farm: <Tractor className="h-4 w-4" />,
  factory: <Factory className="h-4 w-4" />,
  cooperative: <Users className="h-4 w-4" />,
};

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// TAB 1 — NGUỒN HÀNG
// ---------------------------------------------------------------------------

const EMPTY_SOURCE: {
  code: string; name: string; type: F2B2BSourceType;
  taxCode: string; contactName: string; phone: string; email: string;
  capacityPerCycle: number; capacityUnit: string; leadTimeDays: number;
  certifications: string;
} = {
  code: '', name: '', type: 'farm',
  taxCode: '', contactName: '', phone: '', email: '',
  capacityPerCycle: 0, capacityUnit: 'kg', leadTimeDays: 7,
  certifications: '',
};

function SourceModal({ isOpen, onClose, onSaved }: {
  isOpen: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState(EMPTY_SOURCE);
  const [address, setAddress] = useState<VietnamAddress>(EMPTY_ADDRESS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) { setForm(EMPTY_SOURCE); setAddress(EMPTY_ADDRESS); setError(null); }
  }, [isOpen]);

  const set = <K extends keyof typeof EMPTY_SOURCE>(k: K, v: (typeof EMPTY_SOURCE)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setError(null);
    if (!form.code.trim()) return setError('Mã nguồn hàng bắt buộc.');
    if (!form.name.trim()) return setError('Tên nguồn hàng bắt buộc.');
    setSaving(true);
    try {
      await f2b2bService.createSource({
        code: form.code.trim(),
        name: form.name.trim(),
        type: form.type,
        taxCode: form.taxCode.trim() || undefined,
        contactName: form.contactName.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        provinceCode: address.provinceCode ? String(address.provinceCode) : undefined,
        provinceName: address.provinceName || undefined,
        address: [address.street, address.wardName, address.provinceName].filter(Boolean).join(', ') || undefined,
        capacityPerCycle: Number(form.capacityPerCycle) || 0,
        capacityUnit: form.capacityUnit || 'kg',
        leadTimeDays: Number(form.leadTimeDays) || 0,
        certifications: form.certifications
          .split(/[,;]/).map(s => s.trim()).filter(Boolean),
        status: 'pending',
        tenantId: undefined,
      } as any);
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Không lưu được nguồn hàng.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm nguồn hàng (nông trại / nhà máy / HTX)"
      icon={<Factory className="w-5 h-5" />}
      onConfirm={submit}
      confirmText="Lưu nguồn hàng"
      confirmDisabled={saving}
      maxWidth="3xl"
    >
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Mã nguồn *</span>
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            placeholder="SRC-FARM-01" value={form.code} onChange={e => set('code', e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Tên nguồn *</span>
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            placeholder="Nông trại Đà Lạt" value={form.name} onChange={e => set('name', e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Loại nguồn</span>
          <select className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            value={form.type} onChange={e => set('type', e.target.value as F2B2BSourceType)}>
            <option value="farm">Nông trại</option>
            <option value="factory">Nhà máy</option>
            <option value="cooperative">Hợp tác xã</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Mã số thuế</span>
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            value={form.taxCode} onChange={e => set('taxCode', e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Người liên hệ</span>
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            value={form.contactName} onChange={e => set('contactName', e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Điện thoại</span>
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            value={form.phone} onChange={e => set('phone', e.target.value)} />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block font-medium text-slate-700">Địa chỉ nguồn hàng</span>
          <VietnamAddressSelector
            value={address}
            onChange={setAddress}
            compact
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Năng lực / chu kỳ</span>
          <input type="number" min={0}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            value={form.capacityPerCycle} onChange={e => set('capacityPerCycle', Number(e.target.value) || 0)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Đơn vị</span>
          <select className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            value={form.capacityUnit} onChange={e => set('capacityUnit', e.target.value)}>
            <option value="kg">kg</option>
            <option value="tấn">tấn</option>
            <option value="lít">lít</option>
            <option value="cái">cái</option>
            <option value="thùng">thùng</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Thời gian lead-time (ngày)</span>
          <input type="number" min={0}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            value={form.leadTimeDays} onChange={e => set('leadTimeDays', Number(e.target.value) || 0)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Chứng nhận</span>
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            placeholder="VietGAP, HACCP, Organic..."
            value={form.certifications} onChange={e => set('certifications', e.target.value)} />
          <span className="mt-1 block text-xs text-slate-400">Ngăn cách bằng dấu phẩy.</span>
        </label>
      </div>
    </Modal>
  );
}

function SourceCard({ source, onStatus, busy }: {
  source: F2B2BSource;
  onStatus: (s: F2B2BSource, next: 'active' | 'suspended' | 'blacklisted') => void;
  busy: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            {SOURCE_TYPE_ICONS[source.type]}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-800">{source.name}</h3>
              <span className={cn(
                'rounded-full border px-2 py-0.5 text-xs font-medium',
                source.status === 'active' && 'border-emerald-200 bg-emerald-50 text-emerald-600',
                source.status === 'pending' && 'border-amber-200 bg-amber-50 text-amber-600',
                source.status === 'suspended' && 'border-slate-200 bg-slate-100 text-slate-500',
                source.status === 'blacklisted' && 'border-rose-200 bg-rose-50 text-rose-600',
              )}>
                {F2B2B_SOURCE_STATUS_LABEL[source.status]}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-xs text-slate-400">
              {source.code} · {F2B2B_SOURCE_TYPE_LABEL[source.type]}
              {source.provinceName ? ` · ${source.provinceName}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-sm font-bold text-amber-600">
          <Star className="h-3.5 w-3.5 fill-current" /> {Number(source.rating || 0).toFixed(1)}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 md:grid-cols-4">
        <div>
          <p className="text-slate-400">Năng lực / chu kỳ</p>
          <p className="font-semibold text-slate-700">
            {source.capacityPerCycle.toLocaleString('vi-VN')} {source.capacityUnit}
          </p>
        </div>
        <div>
          <p className="text-slate-400">Lead-time</p>
          <p className="font-semibold text-slate-700">{source.leadTimeDays} ngày</p>
        </div>
        <div>
          <p className="text-slate-400">Phiên hoàn tất</p>
          <p className="font-semibold text-slate-700">{source.totalCompletedPools || 0}</p>
        </div>
        <div>
          <p className="text-slate-400">Chứng nhận</p>
          <p className="font-semibold text-slate-700">
            {source.certifications?.length ? source.certifications.join(', ') : '—'}
          </p>
        </div>
      </div>

      {source.phone && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
          <MapPin className="h-3 w-3" /> {source.address || source.provinceName || 'Chưa có địa chỉ'}
          {source.phone ? ` · ${source.phone}` : ''}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        {source.status === 'pending' && (
          <button disabled={busy} onClick={() => onStatus(source, 'active')}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">
            <BadgeCheck className="h-3.5 w-3.5" /> Duyệt hoạt động
          </button>
        )}
        {source.status === 'active' && (
          <button disabled={busy} onClick={() => onStatus(source, 'suspended')}
            className="flex items-center gap-1.5 rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-50 disabled:opacity-50">
            <Ban className="h-3.5 w-3.5" /> Tạm ngưng
          </button>
        )}
        {(source.status === 'active' || source.status === 'suspended' || source.status === 'pending') && (
          <button disabled={busy} onClick={() => onStatus(source, 'blacklisted')}
            className="flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50">
            <X className="h-3.5 w-3.5" /> Đưa vào danh sách đen
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB 2 — PHIÊN GOM
// ---------------------------------------------------------------------------

const EMPTY_POOL: {
  code: string; sourceId: string; productId: string; productName: string;
  unit: string; targetQty: number; minQty: number; baseUnitPrice: number;
  tiers: F2B2BPriceTier[]; closeHours: number; deliveryDays: number;
} = {
  code: '', sourceId: '', productId: '', productName: '',
  unit: 'kg', targetQty: 1000, minQty: 500, baseUnitPrice: 0,
  tiers: [], closeHours: 72, deliveryDays: 14,
};

function PoolModal({ isOpen, sources, onClose, onSaved }: {
  isOpen: boolean;
  sources: F2B2BSource[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(EMPTY_POOL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (isOpen) { setForm(EMPTY_POOL); setError(null); } }, [isOpen]);

  const set = <K extends keyof typeof EMPTY_POOL>(k: K, v: (typeof EMPTY_POOL)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const addTier = () => setForm(f => ({
    ...f,
    tiers: [...f.tiers, { minQty: f.tiers.length ? f.tiers[f.tiers.length - 1].minQty * 2 : f.minQty * 2, unitPrice: Math.round(f.baseUnitPrice * 0.92) }],
  }));
  const setTier = (i: number, patch: Partial<F2B2BPriceTier>) =>
    setForm(f => ({ ...f, tiers: f.tiers.map((t, idx) => idx === i ? { ...t, ...patch } : t) }));
  const removeTier = (i: number) => setForm(f => ({ ...f, tiers: f.tiers.filter((_, idx) => idx !== i) }));

  const activeSources = sources.filter(s => s.status === 'active');

  const submit = async () => {
    setError(null);
    if (!form.code.trim()) return setError('Mã phiên gom bắt buộc.');
    if (!form.sourceId) return setError('Chọn nguồn hàng.');
    if (!form.productName.trim()) return setError('Tên sản phẩm bắt buộc.');
    if (form.minQty <= 0 || form.targetQty <= 0) return setError('Sản lượng phải lớn hơn 0.');
    if (form.minQty > form.targetQty) return setError('Sản lượng tối thiểu vượt mục tiêu.');
    if (form.baseUnitPrice <= 0) return setError('Giá cơ sở phải lớn hơn 0.');

    setSaving(true);
    try {
      const pool = await f2b2bService.createPool({
        code: form.code.trim(),
        sourceId: form.sourceId,
        productId: form.productId.trim() || undefined,
        productName: form.productName.trim(),
        unit: form.unit,
        targetQty: form.targetQty,
        minQty: form.minQty,
        baseUnitPrice: form.baseUnitPrice,
        priceTiers: form.tiers,
        closeAt: new Date(Date.now() + form.closeHours * 3_600_000).toISOString(),
        expectedDeliveryAt: new Date(Date.now() + form.deliveryDays * 86_400_000).toISOString(),
      });
      // Tạo xong ở trạng thái nháp — mở nhận gom ngay để vận hành nhanh
      await f2b2bService.openPool(pool.id);
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Không tạo được phiên gom.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo phiên gom F2B2B"
      icon={<Users className="w-5 h-5" />}
      onConfirm={submit}
      confirmText="Tạo & mở gom"
      confirmDisabled={saving}
      maxWidth="3xl"
    >
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span>
        </div>
      )}
      {activeSources.length === 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Chưa có nguồn hàng nào đang hoạt động. Hãy thêm & duyệt nguồn ở tab "Nguồn hàng" trước.</span>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Mã phiên gom *</span>
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            placeholder="POOL-2026-001" value={form.code} onChange={e => set('code', e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Nguồn hàng *</span>
          <select className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            value={form.sourceId} onChange={e => set('sourceId', e.target.value)}>
            <option value="">— Chọn nguồn —</option>
            {activeSources.map(s => (
              <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Mã sản phẩm</span>
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            placeholder="P-001 (tuỳ chọn)" value={form.productId} onChange={e => set('productId', e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Tên sản phẩm *</span>
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            placeholder="Cà phê Robusta rang mùi" value={form.productName} onChange={e => set('productName', e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Đơn vị</span>
          <select className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            value={form.unit} onChange={e => set('unit', e.target.value)}>
            <option value="kg">kg</option>
            <option value="tấn">tấn</option>
            <option value="lít">lít</option>
            <option value="cái">cái</option>
            <option value="thùng">thùng</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Giá cơ sở (đ/{form.unit})</span>
          <input type="number" min={0} step={500}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            value={form.baseUnitPrice} onChange={e => set('baseUnitPrice', Number(e.target.value) || 0)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Sản lượng tối thiểu ({form.unit}) *</span>
          <input type="number" min={1}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            value={form.minQty} onChange={e => set('minQty', Number(e.target.value) || 0)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Sản lượng mục tiêu ({form.unit}) *</span>
          <input type="number" min={1}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            value={form.targetQty} onChange={e => set('targetQty', Number(e.target.value) || 0)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Đóng gom sau (giờ)</span>
          <input type="number" min={1}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            value={form.closeHours} onChange={e => set('closeHours', Number(e.target.value) || 1)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Dự kiến giao sau (ngày)</span>
          <input type="number" min={1}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            value={form.deliveryDays} onChange={e => set('deliveryDays', Number(e.target.value) || 1)} />
        </label>

        {/* Giá bậc thang */}
        <div className="md:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              Bậc giá theo sản lượng <span className="text-xs font-normal text-slate-400">(chạm càng cao, giá càng tốt — khớp lùi cho tất cả khi chốt)</span>
            </span>
            <button type="button" onClick={addTier}
              className="flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
              <Plus className="h-3.5 w-3.5" /> Thêm bậc
            </button>
          </div>
          {form.tiers.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-300 p-3 text-xs text-slate-400">
              Chưa có bậc giá — mọi bên trả giá cơ sở {formatCurrency(form.baseUnitPrice)}/{form.unit}.
            </p>
          )}
          <div className="space-y-2">
            {form.tiers.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 text-center text-xs font-semibold text-slate-400">#{i + 1}</span>
                <input type="number" min={1} placeholder="Từ số lượng"
                  className="w-40 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                  value={t.minQty} onChange={e => setTier(i, { minQty: Number(e.target.value) || 0 })} />
                <span className="text-xs text-slate-400">{form.unit} trở lên →</span>
                <input type="number" min={0} step={500} placeholder="Đơn giá"
                  className="w-40 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                  value={t.unitPrice} onChange={e => setTier(i, { unitPrice: Number(e.target.value) || 0 })} />
                <span className="text-xs text-slate-400">đ/{form.unit}</span>
                <button type="button" onClick={() => removeTier(i)}
                  className="ml-auto rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50 hover:text-rose-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function PoolRow({ pool, sources, onAction, busy, onCommitted }: {
  pool: F2B2BPoolOrder;
  sources: F2B2BSource[];
  onAction: (a: 'open' | 'close' | 'confirm' | 'produce' | 'ship' | 'complete' | 'cancel' | 'delete', p: F2B2BPoolOrder) => void;
  busy: boolean;
  onCommitted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [participants, setParticipants] = useState<F2B2BPoolParticipant[] | null>(null);
  const [loadingPpl, setLoadingPpl] = useState(false);

  const source = sources.find(s => s.id === pool.sourceId);
  const pct = f2b2bService.poolProgressPercent(pool);
  const reachedMin = pool.pooledQty >= pool.minQty;

  useEffect(() => {
    if (!open || participants) return;
    let alive = true;
    setLoadingPpl(true);
    f2b2bService.listParticipants(pool.id)
      .then(rows => { if (alive) setParticipants(rows); })
      .catch(() => { if (alive) setParticipants([]); })
      .finally(() => { if (alive) setLoadingPpl(false); });
    return () => { alive = false; };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const canOpen = pool.status === 'draft';
  const canClose = pool.status === 'open' && reachedMin;
  const canConfirm = pool.status === 'closed';
  const canProduce = pool.status === 'confirmed';
  const canShip = pool.status === 'producing';
  const canComplete = pool.status === 'shipping';
  const canCancel = ['draft', 'open', 'closed', 'confirmed', 'producing', 'shipping'].includes(pool.status);
  const canDelete = pool.status === 'draft';

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
          title={open ? 'Thu gọn' : 'Xem bên tham gia'}>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        <div className="min-w-[220px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-slate-800">{pool.code}</span>
            <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', POOL_STATUS_STYLES[pool.status])}>
              {F2B2B_POOL_STATUS_LABEL[pool.status]}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {pool.productName} · Nguồn: {source ? source.name : pool.sourceId}
            {pool.closeAt ? ` · Đóng ${formatDate(pool.closeAt)}` : ''}
          </p>
        </div>

        <div className="min-w-[170px]">
          <div className="flex items-baseline gap-1">
            <span className={cn('text-lg font-bold', reachedMin ? 'text-emerald-600' : 'text-rose-600')}>
              {pool.pooledQty.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-slate-400">
              / mục tiêu {pool.targetQty.toLocaleString('vi-VN')} {pool.unit} · min {pool.minQty.toLocaleString('vi-VN')}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn('h-full rounded-full transition-all', reachedMin ? 'bg-emerald-500' : 'bg-rose-400')}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="min-w-[130px] text-sm">
          <p className="text-slate-400 text-xs">Đơn giá hiện tại</p>
          <p className="font-semibold text-slate-700">
            {formatCurrency(
              pool.finalUnitPrice ??
              f2b2bService.resolveTierPrice(pool.pooledQty, pool.priceTiers, pool.baseUnitPrice)
            )} /{pool.unit}
          </p>
          {pool.finalUnitPrice != null && (
            <p className="text-xs font-medium text-emerald-600">Đã chốt khớp lùi</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canOpen && (
            <button disabled={busy} onClick={() => onAction('open', pool)}
              className="flex items-center gap-1.5 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-50">
              <Clock className="h-3.5 w-3.5" /> Mở gom
            </button>
          )}
          {canClose && (
            <button disabled={busy} onClick={() => onAction('close', pool)}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50">
              <BadgeCheck className="h-3.5 w-3.5" /> Chốt sổ
            </button>
          )}
          {canConfirm && (
            <button disabled={busy} onClick={() => onAction('confirm', pool)}
              className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-600 disabled:opacity-50">
              <BadgeCheck className="h-3.5 w-3.5" /> Nguồn xác nhận
            </button>
          )}
          {canProduce && (
            <button disabled={busy} onClick={() => onAction('produce', pool)}
              className="flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-600 disabled:opacity-50">
              <Hammer className="h-3.5 w-3.5" /> Sản xuất
            </button>
          )}
          {canShip && (
            <button disabled={busy} onClick={() => onAction('ship', pool)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-600 disabled:opacity-50">
              <Truck className="h-3.5 w-3.5" /> Giao hàng
            </button>
          )}
          {canComplete && (
            <button disabled={busy} onClick={() => onAction('complete', pool)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">
              <PackageCheck className="h-3.5 w-3.5" /> Hoàn tất
            </button>
          )}
          {canCancel && (
            <button disabled={busy} onClick={() => onAction('cancel', pool)}
              className="flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50">
              <Ban className="h-3.5 w-3.5" /> Huỷ
            </button>
          )}
          {canDelete && (
            <button disabled={busy} onClick={() => onAction('delete', pool)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              title="Xoá nháp">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          {pool.status === 'completed' && (
            <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Hoàn tất {formatDate(pool.completedAt)}
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
              {f2b2bService.isPoolOpen(pool) && (
                <CommitForm pool={pool} onCommitted={onCommitted} />
              )}
              <div className="mb-3 mt-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-700">Bên tham gia gom</h4>
                <span className="text-xs text-slate-400">
                  Tổng cam kết: {formatCurrency((participants || []).filter(p => p.status !== 'cancelled').reduce((s, p) => s + p.amount, 0))}
                </span>
              </div>
              {loadingPpl ? (
                <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                </div>
              ) : (participants || []).length === 0 ? (
                <p className="py-4 text-sm text-slate-400">Chưa có bên nào đăng ký gom.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                        <th className="py-2 pr-4">Bên mua</th>
                        <th className="py-2 pr-4">SL cam kết</th>
                        <th className="py-2 pr-4">Đơn giá</th>
                        <th className="py-2 pr-4">Thành tiền</th>
                        <th className="py-2 pr-4">Điểm giao</th>
                        <th className="py-2 pr-4">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(participants || []).map(p => (
                        <tr key={p.id} className="border-b border-slate-50 last:border-0">
                          <td className="py-2 pr-4">
                            <div className="font-medium text-slate-700">{p.buyerName || p.buyerId}</div>
                            <div className="font-mono text-xs text-slate-400">{p.buyerId}</div>
                          </td>
                          <td className="py-2 pr-4">{p.committedQty.toLocaleString('vi-VN')} {pool.unit}</td>
                          <td className="py-2 pr-4">{formatCurrency(p.unitPrice)}</td>
                          <td className="py-2 pr-4 font-semibold">{formatCurrency(p.amount)}</td>
                          <td className="max-w-[220px] truncate py-2 pr-4 text-xs text-slate-500" title={p.deliveryAddress}>
                            {p.deliveryAddress || '—'}
                          </td>
                          <td className="py-2 pr-4">
                            <span className={cn(
                              'rounded-full px-2 py-0.5 text-xs',
                              p.status === 'committed' && 'bg-sky-50 text-sky-600',
                              p.status === 'delivered' && 'bg-emerald-50 text-emerald-600',
                              p.status === 'cancelled' && 'bg-slate-100 text-slate-400',
                            )}>
                              {p.status === 'committed' ? 'Đã cam kết' : p.status === 'delivered' ? 'Đã giao' : 'Đã huỷ'}
                            </span>
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

function CommitForm({ pool, onCommitted }: { pool: F2B2BPoolOrder; onCommitted: () => void }) {
  const [buyerId, setBuyerId] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [qty, setQty] = useState(0);
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    if (!buyerId.trim()) return setErr('Nhập mã bên mua.');
    if (qty <= 0) return setErr('Sản lượng phải lớn hơn 0.');
    setSaving(true);
    try {
      await f2b2bService.commitToPool({
        poolId: pool.id,
        buyerId: buyerId.trim(),
        buyerName: buyerName.trim() || undefined,
        committedQty: qty,
        deliveryAddress: address.trim() || undefined,
      });
      setBuyerId(''); setBuyerName(''); setQty(0); setAddress('');
      onCommitted();
    } catch (e: any) {
      setErr(e?.message || 'Không đăng ký được.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-2 rounded-lg border border-sky-100 bg-sky-50/50 p-3">
      <p className="mb-2 text-xs font-semibold text-sky-700">Thêm bên đăng ký gom</p>
      {err && <p className="mb-2 text-xs text-rose-600">{err}</p>}
      <div className="flex flex-wrap items-end gap-2">
        <input placeholder="Mã bên mua (SEL-001 / B2B-01)" value={buyerId}
          onChange={e => setBuyerId(e.target.value)}
          className="w-44 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none" />
        <input placeholder="Tên (tuỳ chọn)" value={buyerName}
          onChange={e => setBuyerName(e.target.value)}
          className="w-40 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none" />
        <input type="number" min={0} placeholder={`SL (${pool.unit})`} value={qty || ''}
          onChange={e => setQty(Number(e.target.value) || 0)}
          className="w-28 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none" />
        <input placeholder="Điểm giao hàng" value={address}
          onChange={e => setAddress(e.target.value)}
          className="w-56 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none" />
        <button onClick={submit} disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Đăng ký gom
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Màn hình chính
// ---------------------------------------------------------------------------

export function F2B2BManager() {
  const [tab, setTab] = useState<'pools' | 'sources'>('pools');
  const [sources, setSources] = useState<F2B2BSource[]>([]);
  const [pools, setPools] = useState<F2B2BPoolOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showPoolModal, setShowPoolModal] = useState(false);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [src, pls] = await Promise.all([
        f2b2bService.listSources(),
        f2b2bService.listPools(),
      ]);
      setSources(src);
      setPools(pls);
    } catch (e: any) {
      setError(e?.message || 'Không tải được dữ liệu F2B2B.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const poolStats = useMemo(() => {
    const open = pools.filter(p => p.status === 'open').length;
    const running = pools.filter(p => ['closed', 'confirmed', 'producing', 'shipping'].includes(p.status)).length;
    const done = pools.filter(p => p.status === 'completed').length;
    const activeSources = sources.filter(s => s.status === 'active').length;
    return { open, running, done, activeSources };
  }, [pools, sources]);

  const visiblePools = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pools;
    return pools.filter(p =>
      p.code.toLowerCase().includes(q) ||
      p.productName.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  }, [pools, search]);

  const visibleSources = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sources;
    return sources.filter(s =>
      s.code.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (s.provinceName || '').toLowerCase().includes(q)
    );
  }, [sources, search]);

  const onSourceStatus = async (s: F2B2BSource, next: 'active' | 'suspended' | 'blacklisted') => {
    setBusy(true);
    try {
      if (next === 'blacklisted') {
        const reason = window.prompt('Lý do đưa vào danh sách đen?', 'Không đạt chuẩn chất lượng');
        if (reason === null) return;
        const r = await f2b2bService.blacklistSource(s.id, reason);
        window.alert(`Đã đưa nguồn vào danh sách đen. ${r.cancelledPools} phiên gom đang mở bị huỷ.`);
      } else {
        await f2b2bService.updateSource(s.id, { status: next });
      }
      await reload();
    } catch (e: any) {
      alert(e?.message || 'Thao tác thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const onPoolAction = async (
    action: 'open' | 'close' | 'confirm' | 'produce' | 'ship' | 'complete' | 'cancel' | 'delete',
    p: F2B2BPoolOrder
  ) => {
    setBusy(true);
    try {
      if (action === 'open') await f2b2bService.openPool(p.id);
      else if (action === 'close') {
        const r = await f2b2bService.closePool(p.id);
        window.alert(
          `Chốt sổ thành công.\nĐơn giá cuối: ${formatCurrency(r.pool.finalUnitPrice || 0)}/${p.unit}\n` +
          `Khớp lùi giá cho ${r.repriced} bên tham gia.`
        );
      }
      else if (action === 'confirm') await f2b2bService.confirmPool(p.id);
      else if (action === 'produce') await f2b2bService.startProducing(p.id);
      else if (action === 'ship') await f2b2bService.startShipping(p.id);
      else if (action === 'complete') {
        const rating = window.prompt('Điểm đánh giá nguồn sau phiên này (0–5, để trống nếu không đánh giá)?');
        await f2b2bService.completePool(p.id, rating !== null && rating !== '' ? Number(rating) : undefined);
      }
      else if (action === 'cancel') {
        const reason = window.prompt('Lý do huỷ phiên gom?', 'Không đạt sản lượng tối thiểu');
        if (reason === null) return;
        await f2b2bService.cancelPool(p.id, reason);
      }
      else if (action === 'delete') {
        if (!window.confirm('Xoá nháp phiên gom này?')) return;
        await f2b2bService.deletePool(p.id);
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
            <Factory className="h-7 w-7 text-emerald-500" /> F2B2B — Gom đơn doanh nghiệp (Trụ cột 4)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Nguồn (nông trại / nhà máy) → gom đủ sản lượng → đặt sản xuất → giao B2B · giá bậc thang khớp lùi khi chốt
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reload}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" /> Làm mới
          </button>
          {tab === 'sources' ? (
            <button onClick={() => setShowSourceModal(true)}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
              <Plus className="h-4 w-4" /> Thêm nguồn hàng
            </button>
          ) : (
            <button onClick={() => setShowPoolModal(true)}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
              <Plus className="h-4 w-4" /> Tạo phiên gom
            </button>
          )}
        </div>
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Phiên đang gom', value: poolStats.open, icon: <Clock className="h-5 w-5" />, cls: 'text-rose-500' },
          { label: 'Đang sản xuất / giao', value: poolStats.running, icon: <Hammer className="h-5 w-5" />, cls: 'text-violet-500' },
          { label: 'Hoàn tất', value: poolStats.done, icon: <CheckCircle2 className="h-5 w-5" />, cls: 'text-emerald-500' },
          { label: 'Nguồn đang hoạt động', value: poolStats.activeSources, icon: <TrendingUp className="h-5 w-5" />, cls: 'text-indigo-500' },
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

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {([['pools', 'Phiên gom đơn', <Users key="i" className="h-4 w-4" />], ['sources', 'Nguồn hàng', <Tractor key="j" className="h-4 w-4" />]] as const).map(([key, label, icon]) => (
          <button
            key={key}
            onClick={() => setTab(key as 'pools' | 'sources')}
            className={cn(
              '-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition',
              tab === key
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {icon} {label}
          </button>
        ))}
        <div className="relative ml-auto mb-1.5">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-60 rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none"
            placeholder={tab === 'pools' ? 'Tìm phiên gom...' : 'Tìm nguồn hàng...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Đang tải F2B2B...
        </div>
      ) : tab === 'pools' ? (
        visiblePools.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <Factory className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-500">Chưa có phiên gom nào</p>
            <p className="text-sm text-slate-400">Đề án xác định F2B2B là động cơ lợi nhuận chính — tạo phiên gom đầu tiên.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visiblePools.map(p => (
              <PoolRow key={p.id} pool={p} sources={sources} onAction={onPoolAction} busy={busy} onCommitted={reload} />
            ))}
          </div>
        )
      ) : (
        visibleSources.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <Tractor className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-500">Chưa có nguồn hàng nào</p>
            <p className="text-sm text-slate-400">Thêm nông trại / nhà máy / hợp tác xã để bắt đầu gom đơn.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visibleSources.map(s => (
              <SourceCard key={s.id} source={s} onStatus={onSourceStatus} busy={busy} />
            ))}
          </div>
        )
      )}

      <SourceModal isOpen={showSourceModal} onClose={() => setShowSourceModal(false)} onSaved={reload} />
      <PoolModal isOpen={showPoolModal} sources={sources} onClose={() => setShowPoolModal(false)} onSaved={reload} />
    </div>
  );
}

export default F2B2BManager;
