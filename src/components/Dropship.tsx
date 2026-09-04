import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Store, Layers, ShoppingBag, Wallet, Plus, RefreshCw, Search, Loader2,
  AlertTriangle, CheckCircle2, Clock, PackageCheck, Truck, Ban, CreditCard,
  TrendingUp, Package, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency } from '../lib/utils';
import { Modal } from './ui/Modal';
import type {
  DropshipPartner, DropshipListing, DropshipOrder, DropshipOrderItem,
  DropshipMarginEntry, DropshipOrderStatus, DropshipChannel,
} from '../types/erp';
import * as ds from '../services/dropshipService';
import {
  DROPSHIP_ORDER_STATUS_LABEL, DROPSHIP_CHANNEL_LABEL,
  DROPSHIP_PARTNER_STATUS_LABEL, DROPSHIP_LISTING_STATUS_LABEL,
} from '../services/dropshipService';

/**
 * TRỤ CỘT 1 (phần DROPSHIP) — DROPSHIP — spec 017
 *
 * KHÁC AFFILIATE (đây là hai mô hình, KHÔNG gộp):
 *   - Affiliate: người GIỚI THIỆU, nhận HOA HỒNG. Không bán, không đặt giá,
 *     không chạm kho, không chạm giao hàng.
 *   - Dropship : người BÁN trên kênh của họ (Shopee / Lazada / TikTok Shop /
 *     website riêng), tự đặt giá, ăn CHÊNH LỆCH. VComm giữ kho + giao + thu hộ.
 *
 * Bốn tab: Đối tác · Listing · Đơn hàng · Sổ margin.
 */

const CHANNELS: DropshipChannel[] = ['shopee', 'lazada', 'tiktok', 'tiki', 'sendo', 'website', 'other'];

const ORDER_STATUS_STYLES: Record<DropshipOrderStatus, string> = {
  pending: 'bg-amber-50 text-amber-600 border-amber-200',
  stock_reserved: 'bg-sky-50 text-sky-600 border-sky-200',
  picking: 'bg-violet-50 text-violet-600 border-violet-200',
  shipping: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  delivered: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  settled: 'bg-teal-50 text-teal-600 border-teal-200',
  cancelled: 'bg-slate-100 text-slate-400 border-slate-200',
  returned: 'bg-rose-50 text-rose-600 border-rose-200',
};

const PARTNER_STATUS_STYLES: Record<DropshipPartner['status'], string> = {
  pending: 'bg-amber-50 text-amber-600 border-amber-200',
  active: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  suspended: 'bg-slate-100 text-slate-500 border-slate-200',
  blacklisted: 'bg-rose-50 text-rose-600 border-rose-200',
};

const LISTING_STATUS_STYLES: Record<DropshipListing['status'], string> = {
  draft: 'bg-slate-100 text-slate-500 border-slate-200',
  active: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  paused: 'bg-amber-50 text-amber-600 border-amber-200',
  delisted: 'bg-slate-100 text-slate-400 border-slate-200',
};

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function StatusBadge({ label, className }: { label: string; className: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', className)}>
      {label}
    </span>
  );
}

// -----------------------------------------------------------------------------
// MODAL — ĐỐI TÁC
// -----------------------------------------------------------------------------

const EMPTY_PARTNER = {
  code: '', name: '', shopName: '', taxCode: '', contactName: '',
  phone: '', email: '', address: '', marginSplit: 0.8,
  bankName: '', bankAccount: '', bankAccountName: '',
};

function PartnerModal({ isOpen, onClose, onSaved }: {
  isOpen: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState(EMPTY_PARTNER);
  const [channels, setChannels] = useState<DropshipChannel[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) { setForm(EMPTY_PARTNER); setChannels([]); setError(null); }
  }, [isOpen]);

  const set = <K extends keyof typeof EMPTY_PARTNER>(k: K, v: (typeof EMPTY_PARTNER)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const toggleChannel = (c: DropshipChannel) =>
    setChannels(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const submit = async () => {
    setError(null);
    if (!form.code.trim()) return setError('Mã đối tác bắt buộc.');
    if (!form.name.trim()) return setError('Tên đối tác bắt buộc.');
    if (channels.length === 0) return setError('Chọn ít nhất một kênh bán.');

    setSaving(true);
    try {
      await ds.createPartner({
        ...form,
        channels,
        status: 'pending',
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Không tạo được đối tác.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm đối tác dropship"
      icon={<Store className="h-5 w-5" />} onConfirm={submit}
      confirmText="Lưu đối tác" confirmDisabled={saving} maxWidth="2xl">
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="text-slate-600">Mã đối tác *</span>
            <input value={form.code} onChange={e => set('code', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Tên đối tác *</span>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Tên shop</span>
            <input value={form.shopName} onChange={e => set('shopName', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Mã số thuế</span>
            <input value={form.taxCode} onChange={e => set('taxCode', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Người liên hệ</span>
            <input value={form.contactName} onChange={e => set('contactName', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Điện thoại</span>
            <input value={form.phone} onChange={e => set('phone', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
        </div>

        <div>
          <span className="text-sm text-slate-600">Kênh bán *</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {CHANNELS.map(c => (
              <button key={c} type="button" onClick={() => toggleChannel(c)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                  channels.includes(c)
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                )}>
                {DROPSHIP_CHANNEL_LABEL[c]}
              </button>
            ))}
          </div>
        </div>

        <label className="block text-sm">
          <span className="text-slate-600">
            Tỉ lệ chênh lệch đối tác hưởng — {(form.marginSplit * 100).toFixed(0)}%
          </span>
          <input type="range" min={0} max={1} step={0.05}
            value={form.marginSplit}
            onChange={e => set('marginSplit', Number(e.target.value))}
            className="mt-2 w-full accent-emerald-500" />
          <span className="text-xs text-slate-400">
            Phần còn lại {((1 - form.marginSplit) * 100).toFixed(0)}% là doanh thu VComm giữ
          </span>
        </label>

        <div className="grid grid-cols-3 gap-3">
          <label className="text-sm">
            <span className="text-slate-600">Ngân hàng</span>
            <input value={form.bankName} onChange={e => set('bankName', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Số tài khoản</span>
            <input value={form.bankAccount} onChange={e => set('bankAccount', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Chủ tài khoản</span>
            <input value={form.bankAccountName} onChange={e => set('bankAccountName', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
        </div>
      </div>
    </Modal>
  );
}

// -----------------------------------------------------------------------------
// MODAL — LISTING
// -----------------------------------------------------------------------------

function ListingModal({ isOpen, onClose, onSaved, partners }: {
  isOpen: boolean; onClose: () => void; onSaved: () => void; partners: DropshipPartner[];
}) {
  const [partnerId, setPartnerId] = useState('');
  const [channel, setChannel] = useState<DropshipChannel>('shopee');
  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [externalSku, setExternalSku] = useState('');
  const [baseCost, setBaseCost] = useState(0);
  const [listedPrice, setListedPrice] = useState(0);
  const [minSellingPrice, setMinSellingPrice] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPartnerId(partners[0]?.id || '');
      setChannel('shopee');
      setProductId(''); setProductName(''); setExternalSku('');
      setBaseCost(0); setListedPrice(0); setMinSellingPrice(0); setShippingFee(0);
      setError(null);
    }
  }, [isOpen, partners]);

  const unitMargin = listedPrice - baseCost;
  const belowFloor = minSellingPrice > 0 && listedPrice < minSellingPrice;

  const submit = async () => {
    setError(null);
    if (!partnerId) return setError('Chọn đối tác.');
    if (!productId.trim()) return setError('Mã sản phẩm bắt buộc.');
    if (belowFloor) return setError(`Giá niêm yết không được thấp hơn giá sàn ${formatCurrency(minSellingPrice)}.`);

    setSaving(true);
    try {
      await ds.createListing({
        partnerId, channel,
        productId: productId.trim(),
        productName: productName.trim() || productId.trim(),
        externalSku: externalSku.trim() || null,
        baseCost, listedPrice, minSellingPrice, shippingFee,
        status: 'draft',
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Không tạo được listing.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Niêm yết sản phẩm lên kênh đối tác"
      icon={<Layers className="h-5 w-5" />} onConfirm={submit}
      confirmText="Tạo listing" confirmDisabled={saving} maxWidth="2xl">
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="text-slate-600">Đối tác *</span>
            <select value={partnerId} onChange={e => setPartnerId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400">
              <option value="">— Chọn đối tác —</option>
              {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Kênh *</span>
            <select value={channel} onChange={e => setChannel(e.target.value as DropshipChannel)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400">
              {CHANNELS.map(c => <option key={c} value={c}>{DROPSHIP_CHANNEL_LABEL[c]}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Mã sản phẩm VComm *</span>
            <input value={productId} onChange={e => setProductId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Tên sản phẩm</span>
            <input value={productName} onChange={e => setProductName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
          <label className="col-span-2 text-sm">
            <span className="text-slate-600">SKU trên kênh (để khớp đơn đẩy về)</span>
            <input value={externalSku} onChange={e => setExternalSku(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Giá VComm xuất (vốn)</span>
            <input type="number" min={0} value={baseCost}
              onChange={e => setBaseCost(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Giá niêm yết</span>
            <input type="number" min={0} value={listedPrice}
              onChange={e => setListedPrice(Number(e.target.value))}
              className={cn('mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none',
                belowFloor ? 'border-rose-300 focus:border-rose-400' : 'border-slate-200 focus:border-emerald-400')} />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Giá sàn (chống phá giá)</span>
            <input type="number" min={0} value={minSellingPrice}
              onChange={e => setMinSellingPrice(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Phí ship (thu hộ)</span>
            <input type="number" min={0} value={shippingFee}
              onChange={e => setShippingFee(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
          <span className="text-slate-500">Chênh lệch trên mỗi đơn vị: </span>
          <span className={cn('font-semibold', unitMargin >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
            {formatCurrency(unitMargin)}
          </span>
          {belowFloor && (
            <span className="ml-2 text-xs text-rose-600">· Đang dưới giá sàn</span>
          )}
        </div>
      </div>
    </Modal>
  );
}

// -----------------------------------------------------------------------------
// MODAL — TẠO ĐƠN TỪ KÊNH
// -----------------------------------------------------------------------------

const emptyItem = (): DropshipOrderItem => ({
  productId: '', productName: '', quantity: 1, unitCost: 0, unitPrice: 0,
});

function OrderModal({ isOpen, onClose, onSaved, partners }: {
  isOpen: boolean; onClose: () => void; onSaved: () => void; partners: DropshipPartner[];
}) {
  const activePartners = useMemo(() => partners.filter(p => p.status === 'active'), [partners]);

  const [partnerId, setPartnerId] = useState('');
  const [channel, setChannel] = useState<DropshipChannel>('shopee');
  const [externalOrderCode, setExternalOrderCode] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingFee, setShippingFee] = useState(0);
  const [items, setItems] = useState<DropshipOrderItem[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPartnerId(activePartners[0]?.id || '');
      setChannel('shopee');
      setExternalOrderCode(''); setBuyerName(''); setBuyerPhone('');
      setShippingAddress(''); setShippingFee(0);
      setItems([emptyItem()]);
      setError(null);
    }
  }, [isOpen, activePartners]);

  const partner = partners.find(p => p.id === partnerId);
  const preview = useMemo(
    () => ds.computeOrderFinancials(items, shippingFee, partner?.marginSplit ?? 0.8),
    [items, shippingFee, partner]
  );

  const patchItem = (i: number, patch: Partial<DropshipOrderItem>) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it));

  const submit = async () => {
    setError(null);
    if (!partnerId) return setError('Chọn đối tác.');
    if (!externalOrderCode.trim()) return setError('Mã đơn trên kênh bắt buộc.');
    const valid = items.filter(it => it.productId.trim() && it.quantity > 0);
    if (!valid.length) return setError('Cần ít nhất một sản phẩm hợp lệ (mã SP + số lượng > 0).');

    setSaving(true);
    try {
      const res = await ds.createOrder({
        partnerId, channel,
        externalOrderCode: externalOrderCode.trim(),
        items: valid, shippingFee,
        buyerName, buyerPhone, shippingAddress,
      });
      onSaved();
      onClose();
      if (!res.reserved) {
        const detail = res.stockShortages
          .map(s => `SP ${s.productId}: cần ${s.need}, có ${s.available}`).join('; ');
        window.alert(
          `Đã nhận đơn ${res.order.code} nhưng CHƯA giữ được kho (đang ở trạng thái chờ kiểm tồn).\n${detail}`
        );
      }
    } catch (e: any) {
      setError(e?.message || 'Không tạo được đơn dropship.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nhận đơn từ kênh đối tác"
      icon={<ShoppingBag className="h-5 w-5" />} onConfirm={submit}
      confirmText="Nhận đơn" confirmDisabled={saving} maxWidth="3xl">
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {activePartners.length === 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Chưa có đối tác nào đang hoạt động. Cần duyệt đối tác trước khi nhận đơn.
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <label className="text-sm">
            <span className="text-slate-600">Đối tác *</span>
            <select value={partnerId} onChange={e => setPartnerId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400">
              <option value="">— Chọn đối tác —</option>
              {activePartners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Kênh *</span>
            <select value={channel} onChange={e => setChannel(e.target.value as DropshipChannel)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400">
              {CHANNELS.map(c => <option key={c} value={c}>{DROPSHIP_CHANNEL_LABEL[c]}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Mã đơn trên kênh *</span>
            <input value={externalOrderCode} onChange={e => setExternalOrderCode(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Người nhận</span>
            <input value={buyerName} onChange={e => setBuyerName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Điện thoại</span>
            <input value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Phí ship</span>
            <input type="number" min={0} value={shippingFee}
              onChange={e => setShippingFee(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </label>
        </div>

        <label className="block text-sm">
          <span className="text-slate-600">Địa chỉ giao</span>
          <input value={shippingAddress} onChange={e => setShippingAddress(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
        </label>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Sản phẩm</span>
            <button type="button" onClick={() => setItems(p => [...p, emptyItem()])}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
              <Plus className="h-3 w-3" /> Thêm dòng
            </button>
          </div>
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {items.map((it, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="grid grid-cols-12 items-end gap-2">
                  <input placeholder="Mã SP" value={it.productId}
                    onChange={e => patchItem(i, { productId: e.target.value })}
                    className="col-span-3 rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-emerald-400" />
                  <input placeholder="Tên SP" value={it.productName || ''}
                    onChange={e => patchItem(i, { productName: e.target.value })}
                    className="col-span-3 rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-emerald-400" />
                  <input type="number" min={0} placeholder="SL" value={it.quantity}
                    onChange={e => patchItem(i, { quantity: Number(e.target.value) })}
                    className="col-span-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-emerald-400" />
                  <input type="number" min={0} placeholder="Giá vốn" value={it.unitCost}
                    onChange={e => patchItem(i, { unitCost: Number(e.target.value) })}
                    className="col-span-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-emerald-400" />
                  <div className="col-span-1 flex items-center gap-1">
                    <input type="number" min={0} placeholder="Giá bán" value={it.unitPrice}
                      onChange={e => patchItem(i, { unitPrice: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-emerald-400" />
                    {items.length > 1 && (
                      <button type="button" onClick={() => setItems(p => p.filter((_, idx) => idx !== i))}
                        className="text-slate-400 hover:text-rose-500">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
          <div><div className="text-slate-500">Tiền hàng</div><div className="font-semibold">{formatCurrency(preview.revenue)}</div></div>
          <div><div className="text-slate-500">Vốn</div><div className="font-semibold">{formatCurrency(preview.totalCost)}</div></div>
          <div>
            <div className="text-slate-500">Chênh lệch gộp</div>
            <div className={cn('font-semibold', preview.grossMargin >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
              {formatCurrency(preview.grossMargin)}
            </div>
          </div>
          <div>
            <div className="text-slate-500">Đối tác nhận / VComm giữ</div>
            <div className="font-semibold">
              {formatCurrency(preview.partnerMargin)} / {formatCurrency(preview.vcommMargin)}
            </div>
          </div>
          <div className="col-span-4 text-xs text-slate-500">
            Thu hộ COD: <span className="font-semibold text-slate-700">{formatCurrency(preview.codAmount)}</span>
            {' · '}Tỉ lệ chia: {((partner?.marginSplit ?? 0.8) * 100).toFixed(0)}% cho đối tác
          </div>
        </div>
      </div>
    </Modal>
  );
}

// -----------------------------------------------------------------------------
// TRANG CHÍNH
// -----------------------------------------------------------------------------

export function DropshipManager() {
  const [tab, setTab] = useState<'partners' | 'listings' | 'orders' | 'ledger'>('orders');
  const [partners, setPartners] = useState<DropshipPartner[]>([]);
  const [listings, setListings] = useState<DropshipListing[]>([]);
  const [orders, setOrders] = useState<DropshipOrder[]>([]);
  const [ledger, setLedger] = useState<DropshipMarginEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPartner, setShowPartner] = useState(false);
  const [showListing, setShowListing] = useState(false);
  const [showOrder, setShowOrder] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, l, o, g] = await Promise.all([
        ds.listPartners(),
        ds.listListings(),
        ds.listOrders(),
        ds.listLedger(),
      ]);
      setPartners(p); setListings(l); setOrders(o); setLedger(g);
    } catch (e: any) {
      setError(e?.message || 'Không tải được dữ liệu dropship.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const partnerName = useCallback((id: string) =>
    partners.find(p => p.id === id)?.name || id, [partners]);

  const stats = useMemo(() => {
    const active = partners.filter(p => p.status === 'active').length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const shipping = orders.filter(o => ['stock_reserved', 'picking', 'shipping'].includes(o.status)).length;
    const delivered = orders.filter(o => ['delivered', 'settled'].includes(o.status)).length;
    const payable = ledger
      .filter(e => e.status === 'pending')
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const partnerMargin = orders
      .filter(o => ['delivered', 'settled'].includes(o.status))
      .reduce((s, o) => s + (Number(o.partnerMargin) || 0), 0);
    return { active, pending, shipping, delivered, payable, partnerMargin, listings: listings.length };
  }, [partners, orders, ledger, listings]);

  const q = search.trim().toLowerCase();
  const visibleOrders = useMemo(() => {
    if (!q) return orders;
    return orders.filter(o =>
      o.code.toLowerCase().includes(q) ||
      o.externalOrderCode.toLowerCase().includes(q) ||
      (o.buyerName || '').toLowerCase().includes(q) ||
      (o.buyerPhone || '').includes(q)
    );
  }, [orders, q]);

  const visiblePartners = useMemo(() => {
    if (!q) return partners;
    return partners.filter(p =>
      p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
    );
  }, [partners, q]);

  const visibleListings = useMemo(() => {
    if (!q) return listings;
    return listings.filter(l =>
      l.productId.toLowerCase().includes(q) ||
      l.productName.toLowerCase().includes(q) ||
      (l.externalSku || '').toLowerCase().includes(q)
    );
  }, [listings, q]);

  const onPartnerStatus = async (p: DropshipPartner, next: DropshipPartner['status']) => {
    setBusy(true);
    try {
      if (next === 'suspended') {
        const reason = window.prompt('Lý do tạm ngưng?', 'Vi phạm chính sách giá');
        if (reason === null) return;
        const r = await ds.suspendPartner(p.id, reason);
        window.alert(`Đã tạm ngưng đối tác. ${r.delisted} listing bị gỡ khỏi kênh.`);
      } else {
        await ds.updatePartner(p.id, { status: next });
      }
      await reload();
    } catch (e: any) {
      alert(e?.message || 'Thao tác thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const onOrderAction = async (action: 'picking' | 'shipping' | 'delivered' | 'settled' | 'returned' | 'cancel', o: DropshipOrder) => {
    setBusy(true);
    try {
      if (action === 'cancel') {
        const reason = window.prompt('Lý do huỷ?', 'Khách huỷ / hết hàng');
        if (reason === null) return;
        await ds.advanceOrder(o.id, 'cancelled', { cancelledReason: reason });
      } else if (action === 'shipping') {
        const tracking = window.prompt('Mã vận đơn?', o.trackingCode || '');
        if (tracking === null) return;
        await ds.advanceOrder(o.id, 'shipping', { trackingCode: tracking });
      } else {
        await ds.advanceOrder(o.id, action);
      }
      await reload();
    } catch (e: any) {
      alert(e?.message || 'Thao tác thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const onPayout = async (p: DropshipPartner) => {
    const ref = window.prompt('Mã chứng từ thanh toán?', `PAY-${Date.now().toString().slice(-8)}`);
    if (ref === null) return;
    setBusy(true);
    try {
      const r = await ds.payoutPartner(p.id, ref);
      window.alert(`Đã thanh toán ${formatCurrency(r.paidAmount)} cho ${p.name} (${r.settledEntries} bút toán).`);
      await reload();
    } catch (e: any) {
      alert(e?.message || 'Thanh toán thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const onSyncStock = async (l: DropshipListing) => {
    setBusy(true);
    try {
      const updated = await ds.syncListingStock(l.id);
      window.alert(`Đã đồng bộ tồn kho "${updated.productName}": ${updated.stockSynced}`);
      await reload();
    } catch (e: any) {
      alert(e?.message || 'Đồng bộ thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const TABS = [
    { key: 'orders', label: 'Đơn dropship', icon: <ShoppingBag className="h-4 w-4" /> },
    { key: 'partners', label: 'Đối tác', icon: <Store className="h-4 w-4" /> },
    { key: 'listings', label: 'Listing', icon: <Layers className="h-4 w-4" /> },
    { key: 'ledger', label: 'Sổ margin', icon: <Wallet className="h-4 w-4" /> },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
            <ShoppingBag className="h-7 w-7 text-orange-500" /> Dropship (Trụ cột 1)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Đối tác bán trên kênh của họ · VComm giữ kho, giao hàng &amp; thu hộ COD · đối tác ăn chênh lệch
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reload}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" /> Làm mới
          </button>
          {tab === 'orders' && (
            <button onClick={() => setShowOrder(true)}
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white hover:bg-orange-600">
              <Plus className="h-4 w-4" /> Nhận đơn từ kênh
            </button>
          )}
          {tab === 'partners' && (
            <button onClick={() => setShowPartner(true)}
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white hover:bg-orange-600">
              <Plus className="h-4 w-4" /> Thêm đối tác
            </button>
          )}
          {tab === 'listings' && (
            <button onClick={() => setShowListing(true)} disabled={partners.length === 0}
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50">
              <Plus className="h-4 w-4" /> Thêm listing
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: 'Đối tác hoạt động', value: stats.active, icon: <Store className="h-4 w-4" />, tone: 'text-emerald-600' },
          { label: 'Chờ kiểm tồn', value: stats.pending, icon: <Clock className="h-4 w-4" />, tone: 'text-amber-600' },
          { label: 'Đang xử lý', value: stats.shipping, icon: <PackageCheck className="h-4 w-4" />, tone: 'text-sky-600' },
          { label: 'Đã giao', value: stats.delivered, icon: <Truck className="h-4 w-4" />, tone: 'text-indigo-600' },
          { label: 'Margin chờ trả', value: formatCurrency(stats.payable), icon: <Wallet className="h-4 w-4" />, tone: 'text-orange-600' },
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
        <div className="ml-auto flex items-center gap-2 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-56 rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-orange-400" />
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
          <Loader2 className="h-5 w-5 animate-spin" /> Đang tải dữ liệu dropship...
        </div>
      ) : (
        <>
          {tab === 'orders' && (
            visibleOrders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-400">
                Chưa có đơn dropship nào. Nhấn “Nhận đơn từ kênh” để bắt đầu.
              </div>
            ) : (
              <div className="space-y-3">
                {visibleOrders.map(o => (
                  <div key={o.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{o.code}</span>
                          <StatusBadge label={DROPSHIP_ORDER_STATUS_LABEL[o.status]} className={ORDER_STATUS_STYLES[o.status]} />
                          <span className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-500">
                            {DROPSHIP_CHANNEL_LABEL[o.channel]}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Mã kênh: {o.externalOrderCode} · Đối tác: {partnerName(o.partnerId)} · Tạo: {formatDate(o.createdAt)}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Người nhận: {o.buyerName || '—'} · {o.buyerPhone || '—'}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {o.status === 'stock_reserved' && (
                          <button disabled={busy} onClick={() => onOrderAction('picking', o)}
                            className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-50">
                            Lấy hàng
                          </button>
                        )}
                        {o.status === 'picking' && (
                          <button disabled={busy} onClick={() => onOrderAction('shipping', o)}
                            className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50">
                            Giao hàng
                          </button>
                        )}
                        {o.status === 'shipping' && (
                          <>
                            <button disabled={busy} onClick={() => onOrderAction('delivered', o)}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                              Đã giao
                            </button>
                            <button disabled={busy} onClick={() => onOrderAction('returned', o)}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                              Hoàn hàng
                            </button>
                          </>
                        )}
                        {o.status === 'delivered' && (
                          <button disabled={busy} onClick={() => onOrderAction('settled', o)}
                            className="rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 hover:bg-teal-100 disabled:opacity-50">
                            Đối soát
                          </button>
                        )}
                        {['pending', 'stock_reserved', 'picking', 'returned'].includes(o.status) && (
                          <button disabled={busy} onClick={() => onOrderAction('cancel', o)}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                            <Ban className="h-3 w-3" /> Huỷ
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
                      <div><div className="text-xs text-slate-500">Thu hộ COD</div><div className="font-semibold">{formatCurrency(o.codAmount)}</div></div>
                      <div><div className="text-xs text-slate-500">Vốn hàng</div><div className="font-semibold">{formatCurrency(o.totalCost)}</div></div>
                      <div>
                        <div className="text-xs text-slate-500">Chênh lệch gộp</div>
                        <div className={cn('font-semibold', o.grossMargin >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                          {formatCurrency(o.grossMargin)}
                        </div>
                      </div>
                      <div><div className="text-xs text-slate-500">Đối tác nhận</div><div className="font-semibold text-orange-600">{formatCurrency(o.partnerMargin)}</div></div>
                      <div><div className="text-xs text-slate-500">VComm giữ</div><div className="font-semibold text-slate-700">{formatCurrency(o.vcommMargin)}</div></div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {o.items.map((it, i) => (
                        <span key={i} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
                          <Package className="mr-1 inline h-3 w-3" />
                          {it.productName || it.productId} × {it.quantity}
                        </span>
                      ))}
                    </div>

                    {o.status === 'pending' && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        Chưa giữ được kho — cần kiểm tra tồn trước khi lấy hàng.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'partners' && (
            visiblePartners.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-400">
                Chưa có đối tác dropship nào.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {visiblePartners.map(p => (
                  <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{p.name}</span>
                          <StatusBadge label={DROPSHIP_PARTNER_STATUS_LABEL[p.status]} className={PARTNER_STATUS_STYLES[p.status]} />
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {p.code}{p.shopName ? ` · Shop: ${p.shopName}` : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Chia chênh lệch</div>
                        <div className="text-lg font-bold text-orange-600">
                          {((p.marginSplit ?? 0.8) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(p.channels || []).map(c => (
                        <span key={c} className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-600">
                          {DROPSHIP_CHANNEL_LABEL[c]}
                        </span>
                      ))}
                      {(p.channels || []).length === 0 && (
                        <span className="text-xs text-slate-400">Chưa khai báo kênh</span>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-slate-500">Liên hệ</div>
                        <div className="text-slate-700">{p.contactName || '—'}</div>
                        <div className="text-xs text-slate-500">{p.phone || '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Định danh VNeID</div>
                        {p.vneidVerified
                          ? <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3 w-3" /> Đã xác thực</span>
                          : <span className="inline-flex items-center gap-1 text-xs text-amber-600"><AlertTriangle className="h-3 w-3" /> Chưa xác thực</span>}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {p.status === 'pending' && (
                        <button disabled={busy} onClick={() => onPartnerStatus(p, 'active')}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                          Duyệt hoạt động
                        </button>
                      )}
                      {p.status === 'active' && (
                        <button disabled={busy} onClick={() => onPartnerStatus(p, 'suspended')}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                          Tạm ngưng
                        </button>
                      )}
                      {p.status === 'suspended' && (
                        <button disabled={busy} onClick={() => onPartnerStatus(p, 'active')}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                          Kích hoạt lại
                        </button>
                      )}
                      {p.status !== 'blacklisted' && (
                        <button disabled={busy} onClick={() => onPartnerStatus(p, 'blacklisted')}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                          Danh sách đen
                        </button>
                      )}
                      <button disabled={busy} onClick={() => onPayout(p)}
                        className="ml-auto flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50">
                        <CreditCard className="h-3 w-3" /> Thanh toán margin
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'listings' && (
            visibleListings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-400">
                Chưa có listing nào. Cần có đối tác trước.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Sản phẩm</th>
                      <th className="px-3 py-2">Đối tác</th>
                      <th className="px-3 py-2">Kênh / SKU</th>
                      <th className="px-3 py-2 text-right">Vốn</th>
                      <th className="px-3 py-2 text-right">Niêm yết</th>
                      <th className="px-3 py-2 text-right">Giá sàn</th>
                      <th className="px-3 py-2 text-right">Chênh lệch</th>
                      <th className="px-3 py-2 text-right">Tồn đồng bộ</th>
                      <th className="px-3 py-2">Trạng thái</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleListings.map(l => {
                      const margin = l.listedPrice - l.baseCost;
                      const below = l.minSellingPrice > 0 && l.listedPrice < l.minSellingPrice;
                      return (
                        <tr key={l.id} className="border-t border-slate-100">
                          <td className="px-3 py-2">
                            <div className="font-medium text-slate-800">{l.productName}</div>
                            <div className="text-xs text-slate-400">{l.productId}</div>
                          </td>
                          <td className="px-3 py-2 text-slate-600">{partnerName(l.partnerId)}</td>
                          <td className="px-3 py-2 text-xs text-slate-600">
                            {DROPSHIP_CHANNEL_LABEL[l.channel]}
                            {l.externalSku && <div className="text-slate-400">{l.externalSku}</div>}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(l.baseCost)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            <span className={below ? 'text-rose-600' : ''}>{formatCurrency(l.listedPrice)}</span>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                            {l.minSellingPrice > 0 ? formatCurrency(l.minSellingPrice) : '—'}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            <span className={margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                              {formatCurrency(margin)}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {l.stockSynced}
                            {l.syncedAt && <div className="text-xs text-slate-400">{formatDate(l.syncedAt)}</div>}
                          </td>
                          <td className="px-3 py-2">
                            <StatusBadge label={DROPSHIP_LISTING_STATUS_LABEL[l.status]} className={LISTING_STATUS_STYLES[l.status]} />
                          </td>
                          <td className="px-3 py-2">
                            <button disabled={busy} onClick={() => onSyncStock(l)}
                              className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                              Đồng bộ tồn
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          {tab === 'ledger' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Wallet className="h-4 w-4 text-orange-600" /> Margin chờ trả
                  </div>
                  <div className="mt-1 text-lg font-bold text-orange-600">{formatCurrency(stats.payable)}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <TrendingUp className="h-4 w-4 text-emerald-600" /> Margin đối tác tích luỹ
                  </div>
                  <div className="mt-1 text-lg font-bold text-emerald-600">{formatCurrency(stats.partnerMargin)}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Layers className="h-4 w-4 text-slate-500" /> Số listing
                  </div>
                  <div className="mt-1 text-lg font-bold text-slate-800">{stats.listings}</div>
                </div>
              </div>

              {ledger.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-400">
                  Chưa có bút toán nào. Bút toán được ghi tự động khi đơn chuyển sang “Đã giao”.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Thời gian</th>
                        <th className="px-3 py-2">Đối tác</th>
                        <th className="px-3 py-2">Loại</th>
                        <th className="px-3 py-2">Kỳ</th>
                        <th className="px-3 py-2 text-right">Số tiền</th>
                        <th className="px-3 py-2">Trạng thái</th>
                        <th className="px-3 py-2">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map(e => (
                        <tr key={e.id} className="border-t border-slate-100">
                          <td className="px-3 py-2 text-xs text-slate-500">{formatDate(e.createdAt)}</td>
                          <td className="px-3 py-2 text-slate-700">{partnerName(e.partnerId)}</td>
                          <td className="px-3 py-2">
                            {e.type === 'accrual' && <span className="text-emerald-600">Ghi nhận</span>}
                            {e.type === 'payout' && <span className="text-orange-600">Thanh toán</span>}
                            {e.type === 'adjustment' && <span className="text-amber-600">Điều chỉnh</span>}
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-500">{e.period || '—'}</td>
                          <td className={cn('px-3 py-2 text-right tabular-nums font-semibold',
                            e.amount >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                            {e.amount >= 0 ? '+' : ''}{formatCurrency(e.amount)}
                          </td>
                          <td className="px-3 py-2">
                            {e.status === 'pending'
                              ? <StatusBadge label="Chờ trả" className="bg-amber-50 text-amber-600 border-amber-200" />
                              : e.status === 'paid'
                                ? <StatusBadge label="Đã trả" className="bg-emerald-50 text-emerald-600 border-emerald-200" />
                                : <StatusBadge label="Đã huỷ" className="bg-slate-100 text-slate-400 border-slate-200" />}
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-500">{e.note || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <PartnerModal isOpen={showPartner} onClose={() => setShowPartner(false)} onSaved={reload} />
      <ListingModal isOpen={showListing} onClose={() => setShowListing(false)} onSaved={reload} partners={partners} />
      <OrderModal isOpen={showOrder} onClose={() => setShowOrder(false)} onSaved={reload} partners={partners} />
    </div>
  );
}

export default DropshipManager;
