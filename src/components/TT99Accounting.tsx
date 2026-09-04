import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpenCheck, Scale, ShieldCheck, GitMerge, TrendingUp, FileSpreadsheet,
  CalendarRange, Receipt, RefreshCw, Loader2, AlertTriangle, CheckCircle2,
  Plus, Lock, Search, Building2, ChevronRight, Download, XCircle, Info,
  ArrowRightLeft, Wallet,
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { Modal } from './ui/Modal';
import type {
  AccAccount, AccAccountType, AccPeriod, AccVoucher, AccVoucherType,
  AccAuditLogEntry, AccChainBreak, AccUnit, AccElimination,
  RevContract, RevPerformanceObligation, FsReport, FsReportLine, FsReportCode,
  AccJournalRow,
} from '../types/erp';
import {
  ACC_ACCOUNT_TYPE_LABEL, ACC_PERIOD_STATUS_LABEL, ACC_VOUCHER_TYPES,
  ACC_VOUCHER_STATUS_LABEL, ACC_AUDIT_ACTION_LABEL, ACC_UNIT_TYPE_LABEL,
  ACC_INTERNAL_STATUS_LABEL, ACC_INTERNAL_TXN_LABEL, ACC_ELIMINATION_LABEL,
  ACC_BALANCE_SIDE_LABEL, REV_CONTRACT_STATUS_LABEL, REV_OBLIGATION_TYPE_LABEL,
  FS_REPORT_LABEL,
} from '../types/erp';
import * as tt99 from '../services/tt99Service';

/**
 * SPEC 021 — KẾ TOÁN TT99/2025/TT-BTC
 * ============================================================================
 * Chế độ kế toán DOANH NGHIỆP, có hiệu lực 01/01/2026, thay thế TT200/2014
 * (Điều 31). Áp dụng cho MỌI chủ thể trong VComm ERP — kể cả hộ kinh doanh.
 *
 * 8 tab tương ứng 8 đầu việc của spec 021:
 *   1. Tổng quan      — mức độ tuân thủ TT99 theo Điều
 *   2. Hệ tài khoản   — Điều 11 (71 TK cấp 1 + TK tự mở)
 *   3. Kỳ kế toán     — Điều 13 (mở sổ / ghi sổ / khoá sổ bất biến)
 *   4. Chứng từ       — Điều 12 (bút toán kép Nợ/Có)
 *   5. Lưu vết        — Điều 28 (chuỗi băm, xuất dữ liệu cho thuế)
 *   6. Hợp nhất       — Điều 7 (loại bỏ toàn bộ giao dịch nội bộ)
 *   7. IFRS 15        — 5 bước ghi nhận doanh thu
 *   8. Báo cáo TC     — Điều 14-27 (B01-DN "Báo cáo tình hình tài chính")
 */

const TENANT = 'tenant-vcomm-prod-01';

type TabKey =
  | 'overview' | 'accounts' | 'periods' | 'vouchers'
  | 'audit' | 'consolidation' | 'ifrs15' | 'reports';

const TABS: { key: TabKey; label: string; icon: React.ElementType; hint: string }[] = [
  { key: 'overview', label: 'Tổng quan', icon: BookOpenCheck, hint: 'Mức độ tuân thủ TT99 theo Điều' },
  { key: 'accounts', label: 'Hệ tài khoản', icon: Scale, hint: 'Điều 11 — 71 TK cấp 1 bắt buộc' },
  { key: 'periods', label: 'Kỳ kế toán', icon: CalendarRange, hint: 'Điều 13 — mở/ghi/khoá sổ' },
  { key: 'vouchers', label: 'Chứng từ & Sổ cái', icon: Receipt, hint: 'Điều 12 — bút toán kép Nợ/Có' },
  { key: 'audit', label: 'Lưu vết (Điều 28)', icon: ShieldCheck, hint: 'Chuỗi băm + xuất dữ liệu cho thuế' },
  { key: 'consolidation', label: 'Hợp nhất (Điều 7)', icon: GitMerge, hint: 'Loại bỏ giao dịch nội bộ' },
  { key: 'ifrs15', label: 'Doanh thu IFRS 15', icon: TrendingUp, hint: 'Mô hình 5 bước' },
  { key: 'reports', label: 'Báo cáo tài chính', icon: FileSpreadsheet, hint: 'Điều 14-27 — B01-DN / B02-DN' },
];

// ---------------------------------------------------------------------------
// TIỆN ÍCH HIỂN THỊ
// ---------------------------------------------------------------------------

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function fmtNum(n?: number | null): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(n);
}

function errText(e: unknown): string {
  if (e instanceof tt99.TT99Error) return e.message;
  if (e instanceof Error) return e.message;
  return String(e);
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  );
}

function CardHeader({ title, desc, right }: { title: string; desc?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {desc && <p className="mt-0.5 text-xs text-slate-500">{desc}</p>}
      </div>
      {right}
    </div>
  );
}

type Tone = 'green' | 'amber' | 'red' | 'slate' | 'blue' | 'violet' | 'rose';

const TONE: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-rose-50 text-rose-700 border-rose-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
};

function Badge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', TONE[tone])}>
      {children}
    </span>
  );
}

function Btn({
  children, onClick, disabled, variant = 'secondary', loading, title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  loading?: boolean;
  title?: string;
}) {
  const styles: Record<string, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300',
    ghost: 'text-slate-600 hover:bg-slate-100',
  };
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        styles[variant]
      )}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}

function Empty({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
      <Icon className="h-8 w-8" />
      <p className="text-xs">{text}</p>
    </div>
  );
}

/** Thanh cảnh báo nổi — dùng cho lỗi nghiệp vụ & lỗi chưa áp dụng migration */
function Notice({ tone, title, children }: {
  tone: 'amber' | 'red' | 'green' | 'blue';
  title: string;
  children?: React.ReactNode;
}) {
  const map = {
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    red: 'border-rose-200 bg-rose-50 text-rose-800',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
  };
  const Icon = tone === 'green' ? CheckCircle2 : tone === 'blue' ? Info : AlertTriangle;
  return (
    <div className={cn('flex items-start gap-2 rounded-lg border px-3 py-2 text-xs', map[tone])}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-0.5 opacity-90">{children}</div>}
      </div>
    </div>
  );
}

// =============================================================================
// TAB 1 — TỔNG QUAN
// =============================================================================

interface ComplianceItem {
  dieu: string;
  tieuDe: string;
  yeuCau: string;
  trangThai: 'done' | 'partial' | 'todo';
  chiTiet: string;
}

function OverviewTab({ onGoTo }: { onGoTo: (t: TabKey) => void }) {
  const [accounts, setAccounts] = useState<AccAccount[]>([]);
  const [periods, setPeriods] = useState<AccPeriod[]>([]);
  const [integrity, setIntegrity] = useState<{ ok: boolean; breakCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, p] = await Promise.all([
        tt99.listAccounts(TENANT),
        tt99.listPeriods(TENANT),
      ]);
      setAccounts(a);
      setPeriods(p);
      try {
        const rep = await tt99.auditIntegrityReport(TENANT);
        setIntegrity({ ok: rep.ok, breakCount: rep.breakCount });
      } catch {
        setIntegrity(null);
      }
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const systemCount = useMemo(() => accounts.filter(a => a.isSystem).length, [accounts]);
  const openPeriods = useMemo(() => periods.filter(p => p.status === 'open'), [periods]);
  const closedPeriods = useMemo(() => periods.filter(p => p.status === 'closed'), [periods]);

  const items: ComplianceItem[] = [
    {
      dieu: 'Điều 11',
      tieuDe: 'Hệ tài khoản kế toán',
      yeuCau: '71 TK cấp 1 bắt buộc; tự chủ cấp 2/3 kèm Quy chế hạch toán',
      trangThai: systemCount >= 71 ? 'done' : systemCount > 0 ? 'partial' : 'todo',
      chiTiet: `Đã khởi tạo ${systemCount}/71 tài khoản cấp 1 bắt buộc`,
    },
    {
      dieu: 'Điều 12',
      tieuDe: 'Chứng từ & bút toán kép',
      yeuCau: 'Mỗi chứng từ ≥ 2 bút toán, mỗi bút toán chỉ một bên, Nợ = Có',
      trangThai: 'done',
      chiTiet: 'Kiểm tra ở tầng DB bằng constraint trigger (không chỉ ở UI)',
    },
    {
      dieu: 'Điều 13',
      tieuDe: 'Mở sổ / ghi sổ / khoá sổ',
      yeuCau: 'Khoá sổ là bất biến — không được mở lại',
      trangThai: periods.length > 0 ? 'done' : 'todo',
      chiTiet: `${openPeriods.length} kỳ đang mở · ${closedPeriods.length} kỳ đã khoá sổ`,
    },
    {
      dieu: 'Điều 28',
      tieuDe: 'Phần mềm kế toán — lưu vết',
      yeuCau: 'Lưu vết theo thời gian, chống xoá/sửa, xuất dữ liệu cho thuế',
      trangThai: integrity == null ? 'partial' : integrity.ok ? 'done' : 'partial',
      chiTiet: integrity == null
        ? 'Chưa thể kiểm tra chuỗi lưu vết'
        : integrity.ok
          ? 'Chuỗi lưu vết toàn vẹn — không phát hiện can thiệp'
          : `Phát hiện ${integrity.breakCount} điểm gãy trong chuỗi lưu vết`,
    },
    {
      dieu: 'Điều 7',
      tieuDe: 'Hợp nhất đơn vị trực thuộc',
      yeuCau: 'Loại bỏ TOÀN BỘ giao dịch nội bộ; không còn "BCTC tổng hợp"',
      trangThai: 'done',
      chiTiet: 'Giao dịch nội bộ được gắn cờ ngay khi ghi (trigger DB)',
    },
    {
      dieu: 'Điều 14-27',
      tieuDe: 'Báo cáo tài chính',
      yeuCau: '"Bảng cân đối kế toán" → "Báo cáo tình hình tài chính" (B01-DN)',
      trangThai: 'done',
      chiTiet: 'Chỉ được THÊM chỉ tiêu, không đổi tên hay đánh lại Mã số',
    },
  ];

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <Notice tone="amber" title="Chưa thể tải dữ liệu kế toán TT99">
          {error}
          <div className="mt-1">
            Hãy chạy 5 file migration trong{' '}
            <code className="rounded bg-white/70 px-1">specs/021-tt99-ke-toan-doanh-nghiep/migrations/</code>{' '}
            theo thứ tự 001 → 005.
          </div>
        </Notice>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: Scale, label: 'Tài khoản cấp 1', value: `${systemCount}/71`, tone: 'text-blue-600' },
          { icon: CalendarRange, label: 'Kỳ đang mở', value: String(openPeriods.length), tone: 'text-emerald-600' },
          { icon: Lock, label: 'Kỳ đã khoá sổ', value: String(closedPeriods.length), tone: 'text-slate-600' },
          {
            icon: ShieldCheck,
            label: 'Toàn vẹn lưu vết',
            value: integrity == null ? '—' : integrity.ok ? 'OK' : `${integrity.breakCount} gãy`,
            tone: integrity?.ok ? 'text-emerald-600' : 'text-amber-600',
          },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <s.icon className="h-4 w-4" />
              {s.label}
            </div>
            <div className={cn('mt-1 text-2xl font-semibold', s.tone)}>{s.value}</div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Mức độ tuân thủ TT99/2025/TT-BTC"
          desc="Có hiệu lực 01/01/2026 · thay thế TT200/2014/TT-BTC (Điều 31)"
          right={<Btn onClick={load}><RefreshCw className="h-3.5 w-3.5" /> Làm mới</Btn>}
        />
        <div className="divide-y divide-slate-100">
          {items.map(it => (
            <button
              key={it.dieu}
              type="button"
              onClick={() => onGoTo(
                it.dieu === 'Điều 11' ? 'accounts'
                  : it.dieu === 'Điều 13' ? 'periods'
                    : it.dieu === 'Điều 28' ? 'audit'
                      : it.dieu === 'Điều 7' ? 'consolidation'
                        : it.dieu === 'Điều 14-27' ? 'reports' : 'vouchers'
              )}
              className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
            >
              <div className="mt-0.5 shrink-0">
                {it.trangThai === 'done'
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  : it.trangThai === 'partial'
                    ? <AlertTriangle className="h-4 w-4 text-amber-500" />
                    : <XCircle className="h-4 w-4 text-slate-300" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-800">{it.dieu}</span>
                  <span className="text-xs text-slate-600">{it.tieuDe}</span>
                  <Badge tone={it.trangThai === 'done' ? 'green' : it.trangThai === 'partial' ? 'amber' : 'slate'}>
                    {it.trangThai === 'done' ? 'Đáp ứng' : it.trangThai === 'partial' ? 'Một phần' : 'Chưa có dữ liệu'}
                  </Badge>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500">{it.yeuCau}</p>
                <p className="mt-0.5 text-[11px] text-slate-600">{it.chiTiet}</p>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
            </button>
          ))}
        </div>
      </Card>

      <Notice tone="blue" title="Phạm vi áp dụng">
        TT99/2025/TT-BTC là chế độ kế toán <b>DOANH NGHIỆP</b>. Theo quyết định của chủ dự án
        ("Chỉ TT99, gỡ TT88"), <b>mọi chủ thể trong VComm ERP — kể cả hộ kinh doanh</b> — đều hạch
        toán theo TT99. Biểu thuế khoán của TT40/2021 (1,5% / 4,5% / 3% / 7%) thuộc về module Thuế,
        không nằm trong hệ thống tài khoản.
      </Notice>
    </div>
  );
}

// =============================================================================
// TAB 2 — HỆ TÀI KHOẢN (Điều 11)
// =============================================================================

function AccountsTab() {
  const [accounts, setAccounts] = useState<AccAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<AccAccountType | ''>('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAccounts(await tt99.listAccounts(TENANT, { includeInactive: true }));
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts
      .filter(a => (includeInactive ? true : a.isActive))
      .filter(a => (typeFilter ? a.accountType === typeFilter : true))
      .filter(a => !q || a.code.includes(q) || a.name.toLowerCase().includes(q))
      .sort((x, y) => x.code.localeCompare(y.code));
  }, [accounts, search, typeFilter, includeInactive]);

  const systemCount = accounts.filter(a => a.isSystem).length;

  return (
    <div className="space-y-4">
      <Notice tone="blue" title="Điều 11 — Tài khoản kế toán">
        Chỉ <b>71 tài khoản cấp 1</b> là bắt buộc. Doanh nghiệp được tự mở tài khoản cấp 2/3
        không cần xin phép Bộ Tài chính, nhưng <b>phải quy định trong Quy chế hạch toán kế toán</b>{' '}
        (Điều 11(2)(d)). Tài khoản cấp 1 không thể xoá hay khoá — DB sẽ từ chối.
      </Notice>

      {error && <Notice tone="red" title="Lỗi tải hệ tài khoản">{error}</Notice>}

      <Card>
        <CardHeader
          title="Danh mục tài khoản"
          desc={`${systemCount} tài khoản cấp 1 (TT99) · ${accounts.length - systemCount} tài khoản tự mở`}
          right={<Btn variant="primary" onClick={() => setShowAdd(true)}><Plus className="h-3.5 w-3.5" /> Mở TK cấp 2/3</Btn>}
        />
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm mã hoặc tên tài khoản…"
              className="w-64 rounded-lg border border-slate-300 py-1.5 pl-7 pr-2 text-xs outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as AccAccountType | '')}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-blue-500"
          >
            <option value="">Tất cả loại</option>
            {(Object.keys(ACC_ACCOUNT_TYPE_LABEL) as AccAccountType[]).map(t => (
              <option key={t} value={t}>{ACC_ACCOUNT_TYPE_LABEL[t]}</option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={e => setIncludeInactive(e.target.checked)}
              className="rounded border-slate-300"
            />
            Hiện TK đã khoá
          </label>
          <span className="ml-auto text-[11px] text-slate-500">{filtered.length} tài khoản</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
        ) : filtered.length === 0 ? (
          <Empty icon={Scale} text="Chưa có tài khoản nào — hãy chạy migration 001_coa.sql" />
        ) : (
          <div className="max-h-[28rem] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-2 font-medium">Mã</th>
                  <th className="px-3 py-2 font-medium">Tên tài khoản</th>
                  <th className="px-3 py-2 font-medium">Loại</th>
                  <th className="px-3 py-2 font-medium text-center">Bên dư</th>
                  <th className="px-3 py-2 font-medium text-center">Cấp</th>
                  <th className="px-4 py-2 font-medium">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className={cn('px-4 py-1.5 font-mono font-medium', a.level === 1 ? 'text-slate-900' : 'text-blue-700')}>
                      {a.code}
                    </td>
                    <td className="px-3 py-1.5 text-slate-700">{a.name}</td>
                    <td className="px-3 py-1.5 text-slate-500">{ACC_ACCOUNT_TYPE_LABEL[a.accountType] || a.accountType}</td>
                    <td className="px-3 py-1.5 text-center text-slate-500">{ACC_BALANCE_SIDE_LABEL[a.balanceSide]}</td>
                    <td className="px-3 py-1.5 text-center">
                      {a.isSystem
                        ? <Badge tone="blue">Cấp 1 · TT99</Badge>
                        : <Badge tone="violet">Cấp {a.level}</Badge>}
                    </td>
                    <td className="px-4 py-1.5 text-[11px] text-slate-400">
                      {a.isIntercompany && <span className="mr-1 text-rose-600">nội bộ</span>}
                      {a.regulationRef && <span className="mr-1 text-slate-500">[{a.regulationRef}]</span>}
                      {a.note || (!a.isActive ? 'Đã khoá' : '')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AddAccountModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        accounts={accounts}
        onCreated={load}
      />
    </div>
  );
}

function AddAccountModal({ isOpen, onClose, accounts, onCreated }: {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccAccount[];
  onCreated: () => void;
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [parentCode, setParentCode] = useState('');
  const [regulationRef, setRegulationRef] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const parents = useMemo(
    () => accounts.filter(a => a.level === 1 && a.isActive).sort((x, y) => x.code.localeCompare(y.code)),
    [accounts]
  );

  const reset = () => { setCode(''); setName(''); setParentCode(''); setRegulationRef(''); setErr(null); };

  const submit = async () => {
    setErr(null);
    setBusy(true);
    try {
      await tt99.openSubAccount({ code, name, parentCode, regulationRef, tenantId: TENANT });
      reset();
      onClose();
      onCreated();
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { reset(); onClose(); }}
      title="Mở tài khoản cấp 2/3 (Điều 11(2))"
      icon={<Scale className="h-5 w-5 text-blue-600" />}
      confirmText="Mở tài khoản"
      onConfirm={submit}
      confirmDisabled={!code || !name || !parentCode || !regulationRef || busy}
    >
      <div className="space-y-3 text-xs">
        {err && <Notice tone="red" title="Không thể mở tài khoản">{err}</Notice>}
        <div>
          <label className="mb-1 block font-medium text-slate-700">Tài khoản cha (cấp 1)</label>
          <select
            value={parentCode}
            onChange={e => setParentCode(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-blue-500"
          >
            <option value="">— Chọn tài khoản cha —</option>
            {parents.map(p => <option key={p.code} value={p.code}>{p.code} — {p.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block font-medium text-slate-700">Mã tài khoản (4–6 chữ số)</label>
            <input
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="1121"
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 font-mono outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block font-medium text-slate-700">Tên tài khoản</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Tiền gửi VCB"
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block font-medium text-slate-700">
            Dẫn chiếu Quy chế hạch toán kế toán <span className="text-rose-500">*</span>
          </label>
          <input
            value={regulationRef}
            onChange={e => setRegulationRef(e.target.value)}
            placeholder="QC-TT99-001"
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-blue-500"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Điều 11(2)(d): tài khoản do doanh nghiệp tự mở phải được quy định rõ trong
            Quy chế hạch toán kế toán.
          </p>
        </div>
      </div>
    </Modal>
  );
}

// =============================================================================
// TAB 3 — KỲ KẾ TOÁN (Điều 13)
// =============================================================================

const PERIOD_TONE: Record<AccPeriod['status'], Tone> = {
  open: 'green', locked: 'amber', closed: 'slate',
};

function PeriodsTab() {
  const [periods, setPeriods] = useState<AccPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [closeTarget, setCloseTarget] = useState<AccPeriod | null>(null);
  const [closeNote, setCloseNote] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPeriods(await tt99.listPeriods(TENANT));
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createYear = async () => {
    setBusy('create');
    setError(null);
    try {
      const y = Number(year);
      // Tạo kỳ năm + 12 kỳ tháng
      await tt99.createPeriod({ periodYear: y, periodNo: null, tenantId: TENANT });
      for (let m = 1; m <= 12; m += 1) {
        await tt99.createPeriod({ periodYear: y, periodNo: m, tenantId: TENANT });
      }
      await load();
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(null);
    }
  };

  const lock = async (p: AccPeriod) => {
    setBusy(p.id);
    try { await tt99.lockPeriod(p.id); await load(); }
    catch (e) { setError(errText(e)); }
    finally { setBusy(null); }
  };

  const close = async () => {
    if (!closeTarget) return;
    setBusy('close');
    try {
      await tt99.closePeriod({
        periodId: closeTarget.id,
        closedBy: 'ke-toan-truong',
        closingNote: closeNote || undefined,
      });
      setCloseTarget(null);
      setCloseNote('');
      await load();
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(null);
    }
  };

  const label = (p: AccPeriod) =>
    p.periodNo == null
      ? `Năm ${p.periodYear}`
      : p.periodNo >= 21
        ? `Quý ${p.periodNo - 20}/${p.periodYear}`
        : `Tháng ${String(p.periodNo).padStart(2, '0')}/${p.periodYear}`;

  return (
    <div className="space-y-4">
      <Notice tone="blue" title="Điều 13 — Mở sổ, ghi sổ, khoá sổ">
        Chứng từ chỉ được ghi vào kỳ đang <b>mở</b>. <b>Khoá sổ là bất biến</b>: sau khi khoá, DB từ
        chối mọi sửa đổi trên kỳ và tự sinh mã băm đóng sổ. TT99 không cho phép mở lại sổ đã khoá —
        nếu cần sửa hãy ghi chứng từ điều chỉnh vào kỳ đang mở (Luật Kế toán Điều 27).
      </Notice>

      {error && <Notice tone="red" title="Lỗi">{error}</Notice>}

      <Card>
        <CardHeader
          title="Kỳ kế toán"
          desc="Mở sổ đầu kỳ (Điều 13(1))"
          right={
            <div className="flex items-center gap-2">
              <input
                value={year}
                onChange={e => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-blue-500"
              />
              <Btn variant="primary" onClick={createYear} loading={busy === 'create'}>
                <Plus className="h-3.5 w-3.5" /> Mở kỳ năm + 12 tháng
              </Btn>
            </div>
          }
        />
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
        ) : periods.length === 0 ? (
          <Empty icon={CalendarRange} text="Chưa có kỳ kế toán nào" />
        ) : (
          <div className="max-h-[30rem] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-2 font-medium">Kỳ</th>
                  <th className="px-3 py-2 font-medium">Từ</th>
                  <th className="px-3 py-2 font-medium">Đến</th>
                  <th className="px-3 py-2 font-medium text-center">Trạng thái</th>
                  <th className="px-3 py-2 font-medium">Đóng sổ</th>
                  <th className="px-4 py-2 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periods.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-slate-800">{label(p)}</td>
                    <td className="px-3 py-2 text-slate-500">{fmtDate(p.startDate)}</td>
                    <td className="px-3 py-2 text-slate-500">{fmtDate(p.endDate)}</td>
                    <td className="px-3 py-2 text-center">
                      <Badge tone={PERIOD_TONE[p.status]}>{ACC_PERIOD_STATUS_LABEL[p.status]}</Badge>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-400">
                      {p.closedAt ? `${fmtTime(p.closedAt)} · ${p.closedBy || '—'}` : '—'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {p.status === 'open' && (
                        <div className="flex justify-end gap-1.5">
                          <Btn onClick={() => lock(p)} loading={busy === p.id}>Khoá tạm</Btn>
                          <Btn variant="danger" onClick={() => setCloseTarget(p)}>
                            <Lock className="h-3.5 w-3.5" /> Khoá sổ
                          </Btn>
                        </div>
                      )}
                      {p.status === 'locked' && (
                        <Btn variant="danger" onClick={() => setCloseTarget(p)}>
                          <Lock className="h-3.5 w-3.5" /> Khoá sổ
                        </Btn>
                      )}
                      {p.status === 'closed' && (
                        <span className="font-mono text-[10px] text-slate-400" title={p.closingHash || ''}>
                          {(p.closingHash || '').slice(0, 12)}…
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={!!closeTarget}
        onClose={() => setCloseTarget(null)}
        title="Khoá sổ — hành động KHÔNG THỂ HOÀN TÁC"
        icon={<Lock className="h-5 w-5 text-rose-600" />}
        confirmText="Xác nhận khoá sổ"
        confirmVariant="danger"
        confirmDisabled={busy === 'close'}
        onConfirm={close}
      >
        <div className="space-y-3 text-xs">
          <Notice tone="red" title="TT99 Điều 13(3) — khoá sổ là bất biến">
            Sau khi khoá, kỳ kế toán này sẽ không thể mở lại, không thể sửa chứng từ, và sẽ được
            gắn mã băm đóng sổ. Mọi sai sót phát hiện sau đó phải được xử lý bằng chứng từ điều
            chỉnh ở kỳ đang mở.
          </Notice>
          {closeTarget && (
            <p className="text-slate-600">
              Kỳ: <b>{label(closeTarget)}</b> ({fmtDate(closeTarget.startDate)} → {fmtDate(closeTarget.endDate)})
            </p>
          )}
          <div>
            <label className="mb-1 block font-medium text-slate-700">Ghi chú đóng sổ</label>
            <textarea
              value={closeNote}
              onChange={e => setCloseNote(e.target.value)}
              rows={3}
              placeholder="VD: Đã đối chiếu công nợ, kiểm kê kho và chốt doanh thu tháng…"
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

// =============================================================================
// TAB 4 — CHỨNG TỪ & SỔ CÁI (Điều 12)
// =============================================================================

const VOUCHER_TONE: Record<AccVoucher['status'], Tone> = {
  draft: 'slate', posted: 'green', reversed: 'rose',
};

interface DraftLine {
  accountCode: string;
  description: string;
  debit: string;
  credit: string;
  partnerId: string;
  counterpartyUnitId: string;
}

function VouchersTab({ periods }: { periods: AccPeriod[] }) {
  const [vouchers, setVouchers] = useState<AccVoucher[]>([]);
  const [journal, setJournal] = useState<AccJournalRow[]>([]);
  const [accounts, setAccounts] = useState<AccAccount[]>([]);
  const [units, setUnits] = useState<AccUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'journal' | 'vouchers'>('journal');
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [v, j, a, u] = await Promise.all([
        tt99.listVouchers({ tenantId: TENANT }).catch(() => [] as AccVoucher[]),
        tt99.getGeneralJournal({ tenantId: TENANT }).catch(() => [] as AccJournalRow[]),
        tt99.listAccounts(TENANT).catch(() => [] as AccAccount[]),
        tt99.listUnits(TENANT).catch(() => [] as AccUnit[]),
      ]);
      setVouchers(v);
      setJournal(j);
      setAccounts(a);
      setUnits(u);
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <Notice tone="blue" title="Điều 12 — Chứng từ kế toán & bút toán kép">
        Mỗi chứng từ có <b>ít nhất 2 bút toán</b>; mỗi bút toán chỉ được ghi <b>một bên</b> (Nợ hoặc
        Có); <b>tổng Nợ phải bằng tổng Có</b>. Quy tắc này được kiểm tra ở <b>tầng cơ sở dữ liệu</b>{' '}
        bằng constraint trigger, không chỉ ở giao diện — nên mọi đường ghi dữ liệu đều bị ràng buộc.
      </Notice>

      {error && <Notice tone="red" title="Lỗi">{error}</Notice>}

      <Card>
        <CardHeader
          title="Sổ kế toán"
          desc="Nhật ký chung & chứng từ"
          right={
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-slate-300 p-0.5">
                <button
                  type="button"
                  onClick={() => setView('journal')}
                  className={cn('rounded px-2 py-1 text-[11px] font-medium', view === 'journal' ? 'bg-slate-800 text-white' : 'text-slate-600')}
                >
                  Nhật ký chung
                </button>
                <button
                  type="button"
                  onClick={() => setView('vouchers')}
                  className={cn('rounded px-2 py-1 text-[11px] font-medium', view === 'vouchers' ? 'bg-slate-800 text-white' : 'text-slate-600')}
                >
                  Chứng từ ({vouchers.length})
                </button>
              </div>
              <Btn variant="primary" onClick={() => setShowCreate(true)}>
                <Plus className="h-3.5 w-3.5" /> Lập chứng từ
              </Btn>
              <Btn onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Btn>
            </div>
          }
        />

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
        ) : view === 'journal' ? (
          journal.length === 0
            ? <Empty icon={Receipt} text="Chưa có bút toán nào được ghi sổ" />
            : (
              <div className="max-h-[30rem] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-4 py-2 font-medium">Ngày</th>
                      <th className="px-3 py-2 font-medium">Số CT</th>
                      <th className="px-3 py-2 font-medium">Diễn giải</th>
                      <th className="px-3 py-2 font-medium">TK</th>
                      <th className="px-3 py-2 text-right font-medium">Nợ</th>
                      <th className="px-4 py-2 text-right font-medium">Có</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {journal.map((r, i) => (
                      <tr key={`${r.voucherId}-${r.lineNo}-${i}`} className="hover:bg-slate-50">
                        <td className="px-4 py-1.5 text-slate-500">{fmtDate(r.voucherDate)}</td>
                        <td className="px-3 py-1.5 font-mono text-slate-700">{r.voucherNo}</td>
                        <td className="px-3 py-1.5 text-slate-600">
                          {r.voucherDesc}
                          {r.lineDesc && <span className="text-slate-400"> — {r.lineDesc}</span>}
                        </td>
                        <td className="px-3 py-1.5 font-mono text-slate-700">
                          {r.accountCode}
                          {r.isInternal && <span className="ml-1 text-[10px] text-rose-600">(NB)</span>}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono text-slate-800">{r.debit ? fmtNum(r.debit) : ''}</td>
                        <td className="px-4 py-1.5 text-right font-mono text-slate-800">{r.credit ? fmtNum(r.credit) : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-medium text-slate-700">
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-right">Tổng cộng</td>
                      <td className="px-3 py-2 text-right font-mono">
                        {fmtNum(journal.reduce((s, r) => s + (r.debit || 0), 0))}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {fmtNum(journal.reduce((s, r) => s + (r.credit || 0), 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )
        ) : vouchers.length === 0 ? (
          <Empty icon={Receipt} text="Chưa có chứng từ nào" />
        ) : (
          <div className="max-h-[30rem] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-2 font-medium">Số CT</th>
                  <th className="px-3 py-2 font-medium">Loại</th>
                  <th className="px-3 py-2 font-medium">Ngày</th>
                  <th className="px-3 py-2 font-medium">Diễn giải</th>
                  <th className="px-3 py-2 text-center font-medium">Trạng thái</th>
                  <th className="px-4 py-2 text-right font-medium">Số tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vouchers.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-mono text-slate-800">{v.voucherNo}</td>
                    <td className="px-3 py-2 text-slate-500">{v.voucherType}</td>
                    <td className="px-3 py-2 text-slate-500">{fmtDate(v.voucherDate)}</td>
                    <td className="px-3 py-2 text-slate-600">{v.description}</td>
                    <td className="px-3 py-2 text-center">
                      <Badge tone={VOUCHER_TONE[v.status]}>{ACC_VOUCHER_STATUS_LABEL[v.status]}</Badge>
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-slate-700">
                      {fmtNum((v.lines || []).reduce((s, l) => s + (l.debit || 0), 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CreateVoucherModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        periods={periods}
        accounts={accounts}
        units={units}
        onCreated={load}
      />
    </div>
  );
}

function CreateVoucherModal({ isOpen, onClose, periods, accounts, units, onCreated }: {
  isOpen: boolean;
  onClose: () => void;
  periods: AccPeriod[];
  accounts: AccAccount[];
  units: AccUnit[];
  onCreated: () => void;
}) {
  const emptyLine = (): DraftLine => ({
    accountCode: '', description: '', debit: '', credit: '', partnerId: '', counterpartyUnitId: '',
  });

  const [voucherType, setVoucherType] = useState<AccVoucherType>('PKT');
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [periodId, setPeriodId] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([emptyLine(), emptyLine()]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const openPeriods = useMemo(
    () => periods.filter(p => p.status === 'open').sort((a, b) => String(b.periodYear).localeCompare(String(a.periodYear))),
    [periods]
  );

  const totals = useMemo(() => {
    const debit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const credit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
    return { debit, credit, diff: debit - credit };
  }, [lines]);

  const balanced = lines.length >= 2 && Math.abs(totals.diff) < 0.01;

  const reset = () => {
    setVoucherType('PKT');
    setDescription('');
    setLines([emptyLine(), emptyLine()]);
    setErr(null);
  };

  const setLine = (i: number, patch: Partial<DraftLine>) =>
    setLines(prev => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const submit = async () => {
    setErr(null);
    setBusy(true);
    try {
      await tt99.createVoucher({
        voucherType,
        voucherDate,
        description,
        periodId: periodId || undefined,
        lines: lines.map(l => ({
          accountCode: l.accountCode,
          description: l.description || undefined,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          partnerId: l.partnerId || undefined,
          counterpartyUnitId: l.counterpartyUnitId || undefined,
        })),
        tenantId: TENANT,
        actor: 'ke-toan',
      });
      reset();
      onClose();
      onCreated();
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { reset(); onClose(); }}
      title="Lập chứng từ kế toán (Điều 12)"
      icon={<Receipt className="h-5 w-5 text-blue-600" />}
      maxWidth="4xl"
      confirmText="Ghi sổ"
      confirmVariant={balanced ? 'primary' : 'warning'}
      confirmDisabled={!balanced || !description || busy}
      onConfirm={submit}
    >
      <div className="space-y-3 text-xs">
        {err && <Notice tone="red" title="Không thể ghi sổ">{err}</Notice>}

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block font-medium text-slate-700">Loại chứng từ</label>
            <select
              value={voucherType}
              onChange={e => setVoucherType(e.target.value as AccVoucherType)}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-blue-500"
            >
              {ACC_VOUCHER_TYPES.map(t => <option key={t.code} value={t.code}>{t.code} — {t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block font-medium text-slate-700">Ngày chứng từ</label>
            <input
              type="date"
              value={voucherDate}
              onChange={e => setVoucherDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block font-medium text-slate-700">Kỳ kế toán</label>
            <select
              value={periodId}
              onChange={e => setPeriodId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-blue-500"
            >
              <option value="">— Tự động theo ngày —</option>
              {openPeriods.map(p => (
                <option key={p.id} value={p.id}>
                  {p.periodNo == null ? `Năm ${p.periodYear}`
                    : p.periodNo >= 21 ? `Quý ${p.periodNo - 20}/${p.periodYear}`
                      : `T${String(p.periodNo).padStart(2, '0')}/${p.periodYear}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block font-medium text-slate-700">Diễn giải</label>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="VD: Thu tiền bán hàng đơn ORD-00123"
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="font-medium text-slate-700">Bút toán (Nợ / Có)</span>
            <Btn onClick={() => setLines(p => [...p, emptyLine()])}>
              <Plus className="h-3.5 w-3.5" /> Thêm dòng
            </Btn>
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-2 py-1.5 font-medium">Tài khoản</th>
                  <th className="px-2 py-1.5 font-medium">Diễn giải</th>
                  <th className="px-2 py-1.5 text-right font-medium">Nợ</th>
                  <th className="px-2 py-1.5 text-right font-medium">Có</th>
                  <th className="px-2 py-1.5 font-medium">Đơn vị đối ứng</th>
                  <th className="w-8 px-2 py-1.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lines.map((l, i) => (
                  <tr key={i}>
                    <td className="px-1 py-1">
                      <select
                        value={l.accountCode}
                        onChange={e => setLine(i, { accountCode: e.target.value })}
                        className="w-full rounded border border-slate-200 px-1 py-1 outline-none focus:border-blue-500"
                      >
                        <option value="">—</option>
                        {accounts.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
                      </select>
                    </td>
                    <td className="px-1 py-1">
                      <input
                        value={l.description}
                        onChange={e => setLine(i, { description: e.target.value })}
                        className="w-full rounded border border-slate-200 px-1 py-1 outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <input
                        value={l.debit}
                        onChange={e => setLine(i, { debit: e.target.value.replace(/[^\d.]/g, '') })}
                        className="w-full rounded border border-slate-200 px-1 py-1 text-right font-mono outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <input
                        value={l.credit}
                        onChange={e => setLine(i, { credit: e.target.value.replace(/[^\d.]/g, '') })}
                        className="w-full rounded border border-slate-200 px-1 py-1 text-right font-mono outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <select
                        value={l.counterpartyUnitId}
                        onChange={e => setLine(i, { counterpartyUnitId: e.target.value })}
                        className="w-full rounded border border-slate-200 px-1 py-1 outline-none focus:border-blue-500"
                      >
                        <option value="">—</option>
                        {units.map(u => <option key={u.id} value={u.id}>{u.code} · {u.name}</option>)}
                      </select>
                    </td>
                    <td className="px-1 py-1 text-center">
                      {lines.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setLines(p => p.filter((_, idx) => idx !== i))}
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr className="font-medium text-slate-700">
                  <td className="px-2 py-1.5" colSpan={2}>Tổng cộng</td>
                  <td className="px-2 py-1.5 text-right font-mono">{fmtNum(totals.debit)}</td>
                  <td className="px-2 py-1.5 text-right font-mono">{fmtNum(totals.credit)}</td>
                  <td className="px-2 py-1.5 text-right" colSpan={2}>
                    {balanced
                      ? <span className="text-emerald-600">Đã cân bằng</span>
                      : <span className="text-rose-600">Lệch {formatCurrency(Math.abs(totals.diff))}</span>}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Mỗi dòng chỉ ghi MỘT bên. Chọn "Đơn vị đối ứng" để hệ thống tự động gắn cờ giao dịch
            nội bộ (Điều 7).
          </p>
        </div>
      </div>
    </Modal>
  );
}

// =============================================================================
// TAB 5 — LƯU VẾT (Điều 28)
// =============================================================================

const AUDIT_TONE: Record<string, Tone> = {
  INSERT: 'blue', UPDATE: 'amber', DELETE: 'red', POST: 'green', CLOSE: 'violet', EXPORT: 'slate',
};

function AuditTab({ periods }: { periods: AccPeriod[] }) {
  const [log, setLog] = useState<AccAuditLogEntry[]>([]);
  const [breaks, setBreaks] = useState<AccChainBreak[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tableFilter, setTableFilter] = useState('');
  const [exportPeriod, setExportPeriod] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLog(await tt99.listAuditLog({ tenantId: TENANT, limit: 300 }));
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const verify = async () => {
    setVerifying(true);
    try {
      setBreaks(await tt99.verifyAuditChain({ tenantId: TENANT }));
    } catch (e) {
      setError(errText(e));
    } finally {
      setVerifying(false);
    }
  };

  const exportData = async () => {
    if (!exportPeriod) return;
    setExporting(true);
    try {
      const { payload, checksum, fileName } = await tt99.exportForTaxAuthority({
        periodId: exportPeriod,
        actor: 'ke-toan-truong',
        format: 'json',
        tenantId: TENANT,
      });
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      window.alert(`Đã xuất ${fileName}\nChecksum kỳ: ${checksum}`);
      await load();
    } catch (e) {
      setError(errText(e));
    } finally {
      setExporting(false);
    }
  };

  const filtered = tableFilter ? log.filter(r => r.tableName === tableFilter) : log;
  const tableNames = useMemo(() => Array.from(new Set(log.map(r => r.tableName))).sort(), [log]);

  return (
    <div className="space-y-4">
      <Notice tone="blue" title="Điều 28 — Phần mềm kế toán">
        Từ 01/01/2026, phần mềm kế toán phải: (1) <b>lưu vết mọi thay đổi theo thời gian</b> và không
        cho phép xoá/sửa trái phép; (2) <b>xuất dữ liệu kịp thời, đầy đủ</b> cho cơ quan thuế.
        VComm dùng chuỗi băm SHA-256 nối đuôi nhau — mỗi bản ghi chứa băm của bản ghi trước, nên
        việc xoá/sửa ở giữa chuỗi sẽ bị phát hiện ngay.
      </Notice>

      <Notice tone="amber" title="Giới hạn trung thực">
        Chuỗi băm trong cơ sở dữ liệu <b>không thể ngăn chặn</b> một quản trị viên có quyền ghi
        trực tiếp vào Postgres — nó chỉ giúp <b>phát hiện và cảnh báo</b>. Chống can thiệp tuyệt đối
        cần lưu trữ append-only bên ngoài DB (ghi vào WORM storage hoặc dịch vụ bên thứ ba). Việc
        này đang được ghi nhận là nợ kỹ thuật ở spec 021 §9.
      </Notice>

      {error && <Notice tone="red" title="Lỗi">{error}</Notice>}

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Kiểm tra toàn vẹn chuỗi lưu vết"
            desc="Phát hiện bản ghi bị xoá hoặc sửa"
            right={<Btn variant="primary" onClick={verify} loading={verifying}>
              <ShieldCheck className="h-3.5 w-3.5" /> Kiểm tra
            </Btn>}
          />
          <div className="px-4 py-3">
            {breaks === null ? (
              <p className="text-xs text-slate-500">Chưa kiểm tra. Bấm "Kiểm tra" để xác thực chuỗi băm.</p>
            ) : breaks.length === 0 ? (
              <Notice tone="green" title="Chuỗi lưu vết toàn vẹn">
                Không phát hiện điểm gãy nào — không có dấu hiệu can thiệp.
              </Notice>
            ) : (
              <div className="space-y-2">
                <Notice tone="red" title={`Phát hiện ${breaks.length} điểm gãy`}>
                  Chuỗi băm bị gián đoạn — có bản ghi đã bị xoá hoặc sửa.
                </Notice>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-rose-200">
                  <table className="w-full text-[11px]">
                    <thead className="bg-rose-50 text-left text-rose-700">
                      <tr>
                        <th className="px-2 py-1 font-medium">#</th>
                        <th className="px-2 py-1 font-medium">Bảng</th>
                        <th className="px-2 py-1 font-medium">Thời gian</th>
                        <th className="px-2 py-1 font-medium">Vấn đề</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-100">
                      {breaks.map(b => (
                        <tr key={b.seq}>
                          <td className="px-2 py-1 font-mono">{b.seq}</td>
                          <td className="px-2 py-1 font-mono">{b.tableName}</td>
                          <td className="px-2 py-1">{fmtTime(b.occurredAt)}</td>
                          <td className="px-2 py-1">{b.issue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Xuất dữ liệu cho cơ quan thuế"
            desc="Điều 28(3) — kịp thời, đầy đủ"
          />
          <div className="space-y-2 px-4 py-3">
            <select
              value={exportPeriod}
              onChange={e => setExportPeriod(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-blue-500"
            >
              <option value="">— Chọn kỳ kế toán —</option>
              {periods.map(p => (
                <option key={p.id} value={p.id}>
                  {p.periodNo == null ? `Năm ${p.periodYear}`
                    : p.periodNo >= 21 ? `Quý ${p.periodNo - 20}/${p.periodYear}`
                      : `Tháng ${String(p.periodNo).padStart(2, '0')}/${p.periodYear}`}
                </option>
              ))}
            </select>
            <Btn variant="success" disabled={!exportPeriod} loading={exporting} onClick={exportData}>
              <Download className="h-3.5 w-3.5" /> Xuất JSON + checksum
            </Btn>
            <p className="text-[11px] text-slate-500">
              File xuất gồm toàn bộ chứng từ đã ghi sổ, sổ cái và mã băm kiểm tra của cả kỳ.
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Nhật ký lưu vết"
          desc="Bảng này chỉ được THÊM — không có chức năng xoá hay sửa"
          right={
            <div className="flex items-center gap-2">
              <select
                value={tableFilter}
                onChange={e => setTableFilter(e.target.value)}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-blue-500"
              >
                <option value="">Tất cả bảng</option>
                {tableNames.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <Btn onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Btn>
            </div>
          }
        />
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
        ) : filtered.length === 0 ? (
          <Empty icon={ShieldCheck} text="Chưa có bản ghi lưu vết nào" />
        ) : (
          <div className="max-h-[26rem] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Thời gian</th>
                  <th className="px-3 py-2 font-medium">Bảng</th>
                  <th className="px-3 py-2 font-medium">Hành động</th>
                  <th className="px-3 py-2 font-medium">Người thực hiện</th>
                  <th className="px-3 py-2 font-medium">Lý do</th>
                  <th className="px-4 py-2 font-medium">Băm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-1.5 font-mono text-slate-400">{r.seq}</td>
                    <td className="px-3 py-1.5 text-slate-500">{fmtTime(r.occurredAt)}</td>
                    <td className="px-3 py-1.5 font-mono text-slate-600">{r.tableName}</td>
                    <td className="px-3 py-1.5">
                      <Badge tone={AUDIT_TONE[r.action] || 'slate'}>
                        {ACC_AUDIT_ACTION_LABEL[r.action as keyof typeof ACC_AUDIT_ACTION_LABEL] || r.action}
                      </Badge>
                    </td>
                    <td className="px-3 py-1.5 text-slate-600">{r.actor || '—'}</td>
                    <td className="px-3 py-1.5 text-slate-500">{r.reason || '—'}</td>
                    <td className="px-4 py-1.5 font-mono text-[10px] text-slate-400">
                      {(r.hash || '').slice(0, 12)}…
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// =============================================================================
// TAB 6 — HỢP NHẤT (Điều 7)
// =============================================================================

const INTERNAL_TONE: Record<string, Tone> = {
  unmatched: 'amber', matched: 'blue', eliminated: 'green',
};

function ConsolidationTab({ periods }: { periods: AccPeriod[] }) {
  const [units, setUnits] = useState<AccUnit[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [elims, setElims] = useState<AccElimination[]>([]);
  const [consolidated, setConsolidated] = useState<any[]>([]);
  const [periodId, setPeriodId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [u, p] = await Promise.all([
        tt99.listUnits(TENANT).catch(() => [] as AccUnit[]),
        periodId
          ? tt99.listPendingInternalTxn(periodId, TENANT).catch(() => [] as any[])
          : Promise.resolve([] as any[]),
      ]);
      setUnits(u);
      setPending(p);
      if (periodId) {
        const [e, c] = await Promise.all([
          tt99.listEliminations(periodId, TENANT).catch(() => [] as AccElimination[]),
          tt99.getConsolidatedLedger({ periodId, tenantId: TENANT }).catch(() => [] as any[]),
        ]);
        setElims(e);
        setConsolidated(c);
      }
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  }, [periodId]);

  useEffect(() => { load(); }, [load]);

  const autoEliminate = async () => {
    if (!periodId) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await tt99.autoEliminateInternalTxn({ periodId, actor: 'ke-toan-truong', tenantId: TENANT });
      setResult(`Đã tạo ${r.eliminations.length} bút toán loại bỏ${r.skipped ? ` · ${r.skipped} giao dịch cần xử lý thủ công` : ''}.`);
      await load();
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Notice tone="blue" title="Điều 7 — Hợp nhất đơn vị trực thuộc">
        Doanh nghiệp phải hợp nhất báo cáo tài chính của các đơn vị trực thuộc và{' '}
        <b>loại bỏ toàn bộ giao dịch nội bộ</b>: doanh thu/chi phí nội bộ, công nợ nội bộ (136 ↔ 336)
        và lãi chưa thực hiện. TT99 <b>không còn khái niệm "BCTC tổng hợp"</b> như trước.
      </Notice>

      {error && <Notice tone="red" title="Lỗi">{error}</Notice>}
      {result && <Notice tone="green" title="Hoàn tất">{result}</Notice>}

      <Card>
        <CardHeader
          title="Chọn kỳ hợp nhất"
          right={
            <div className="flex items-center gap-2">
              <Btn variant="primary" disabled={!periodId || pending.length === 0} loading={busy} onClick={autoEliminate}>
                <ArrowRightLeft className="h-3.5 w-3.5" /> Tự động loại bỏ giao dịch nội bộ
              </Btn>
              <Btn onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Btn>
            </div>
          }
        />
        <div className="px-4 py-3">
          <select
            value={periodId}
            onChange={e => setPeriodId(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-blue-500"
          >
            <option value="">— Chọn kỳ kế toán —</option>
            {periods.map(p => (
              <option key={p.id} value={p.id}>
                {p.periodNo == null ? `Năm ${p.periodYear}`
                  : p.periodNo >= 21 ? `Quý ${p.periodNo - 20}/${p.periodYear}`
                    : `Tháng ${String(p.periodNo).padStart(2, '0')}/${p.periodYear}`}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
      ) : (
        <>
          <Card>
            <CardHeader
              title="Đơn vị trực thuộc"
              desc={`${units.length} đơn vị · chỉ những đơn vị có phương pháp "hợp nhất toàn phần" mới được cộng gộp`}
            />
            {units.length === 0 ? (
              <Empty icon={Building2} text="Chưa có đơn vị trực thuộc nào" />
            ) : (
              <div className="divide-y divide-slate-100">
                {units.map(u => (
                  <div key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-slate-700">{u.code}</span>
                        <span className="text-xs text-slate-700">{u.name}</span>
                        {u.isHeadOffice && <Badge tone="blue">Trụ sở chính</Badge>}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {ACC_UNIT_TYPE_LABEL[u.unitType]} · {u.taxCode || 'chưa có MST'}
                      </p>
                    </div>
                    <Badge tone={u.consolidationMethod === 'full' ? 'green' : 'slate'}>
                      {u.consolidationMethod === 'full' ? 'Hợp nhất toàn phần' : 'Hạch toán độc lập'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Giao dịch nội bộ chưa loại bỏ"
              desc="Điều 7 yêu cầu loại bỏ TOÀN BỘ trước khi lập BCTC hợp nhất"
            />
            {!periodId ? (
              <Empty icon={GitMerge} text="Chọn kỳ kế toán để xem" />
            ) : pending.length === 0 ? (
              <div className="px-4 py-3">
                <Notice tone="green" title="Không còn giao dịch nội bộ tồn đọng">
                  Có thể lập Báo cáo tài chính hợp nhất cho kỳ này.
                </Notice>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-4 py-2 font-medium">Số CT</th>
                      <th className="px-3 py-2 font-medium">Từ đơn vị</th>
                      <th className="px-3 py-2 font-medium">Đến đơn vị</th>
                      <th className="px-3 py-2 font-medium">TK</th>
                      <th className="px-3 py-2 text-right font-medium">Số tiền</th>
                      <th className="px-3 py-2 font-medium">Loại</th>
                      <th className="px-4 py-2 text-center font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pending.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="px-4 py-1.5 font-mono text-slate-700">{t.voucher_no || '—'}</td>
                        <td className="px-3 py-1.5 text-slate-600">{t.from_unit_name || t.from_unit_id}</td>
                        <td className="px-3 py-1.5 text-slate-600">{t.to_unit_name || t.to_unit_id}</td>
                        <td className="px-3 py-1.5 font-mono text-slate-600">{t.account_code}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-slate-800">{fmtNum(t.amount)}</td>
                        <td className="px-3 py-1.5 text-slate-500">
                          {ACC_INTERNAL_TXN_LABEL[t.txn_type as keyof typeof ACC_INTERNAL_TXN_LABEL] || t.txn_type}
                        </td>
                        <td className="px-4 py-1.5 text-center">
                          <Badge tone={INTERNAL_TONE[t.status] || 'slate'}>
                            {ACC_INTERNAL_STATUS_LABEL[t.status as keyof typeof ACC_INTERNAL_STATUS_LABEL] || t.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {elims.length > 0 && (
            <Card>
              <CardHeader title="Bút toán loại bỏ đã lập" desc={`${elims.length} bút toán`} />
              <div className="divide-y divide-slate-100">
                {elims.map(e => (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-2">
                    <span className="font-mono text-xs text-slate-700">{e.eliminationNo}</span>
                    <span className="flex-1 text-xs text-slate-600">{e.description}</span>
                    <span className="text-xs text-slate-500">
                      {ACC_ELIMINATION_LABEL[e.eliminationType]}
                    </span>
                    <span className="font-mono text-xs text-slate-800">{formatCurrency(e.totalAmount)}</span>
                    <Badge tone={e.status === 'posted' ? 'green' : 'slate'}>
                      {e.status === 'posted' ? 'Đã ghi sổ' : 'Nháp'}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {consolidated.length > 0 && (
            <Card>
              <CardHeader
                title="Sổ cái hợp nhất"
                desc="Đã trừ đi các bút toán loại bỏ giao dịch nội bộ"
              />
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-4 py-2 font-medium">Tài khoản</th>
                      <th className="px-3 py-2 text-right font-medium">Nợ</th>
                      <th className="px-3 py-2 text-right font-medium">Có</th>
                      <th className="px-4 py-2 text-right font-medium">Số dư</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {consolidated.map((r: any) => (
                      <tr key={r.accountCode} className="hover:bg-slate-50">
                        <td className="px-4 py-1.5 font-mono text-slate-700">{r.accountCode}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-slate-600">{fmtNum(r.debit)}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-slate-600">{fmtNum(r.credit)}</td>
                        <td className={cn('px-4 py-1.5 text-right font-mono font-medium',
                          r.balance >= 0 ? 'text-slate-800' : 'text-rose-600')}>
                          {fmtNum(r.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// =============================================================================
// TAB 7 — IFRS 15
// =============================================================================

const STEPS = [
  { n: 1, ten: 'Xác định hợp đồng với khách hàng', dieuKien: 'Có khả năng thu hồi tiền (collectability = probable)' },
  { n: 2, ten: 'Xác định nghĩa vụ thực hiện', dieuKien: 'Tách riêng hàng hóa, V-Xu (quyền lợi trọng yếu), bảo hành' },
  { n: 3, ten: 'Xác định giá giao dịch', dieuKien: 'Cố định + biến động sau khi áp ràng buộc' },
  { n: 4, ten: 'Phân bổ giá giao dịch', dieuKien: 'Theo tỷ lệ giá bán độc lập (relative SSP)' },
  { n: 5, ten: 'Ghi nhận doanh thu', dieuKien: 'Khi nghĩa vụ được thoả mãn (point-in-time / over-time / breakage)' },
];

function Ifrs15Tab() {
  const [contracts, setContracts] = useState<RevContract[]>([]);
  const [selected, setSelected] = useState<RevContract | null>(null);
  const [obligations, setObligations] = useState<RevPerformanceObligation[]>([]);
  const [deferred, setDeferred] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, d] = await Promise.all([
        tt99.listRevContracts({ tenantId: TENANT }).catch(() => [] as RevContract[]),
        tt99.getDeferredRevenue(TENANT).catch(() => [] as any[]),
      ]);
      setContracts(c);
      setDeferred(d);
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectContract = async (c: RevContract) => {
    setSelected(c);
    try {
      setObligations(await tt99.listObligations(c.id, TENANT));
    } catch {
      setObligations([]);
    }
  };

  const allocate = async () => {
    if (!selected) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await tt99.allocateTransactionPrice({ contractId: selected.id, actor: 'ke-toan' });
      setResult(`Bước 4: đã phân bổ cho ${r.allocatedCount} nghĩa vụ thực hiện theo tỷ lệ giá bán độc lập.`);
      await selectContract(selected);
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Notice tone="blue" title="IFRS 15 — mô hình 5 bước ghi nhận doanh thu">
        TT99 thay thế tiêu thức cũ "chuyển giao rủi ro và lợi ích" bằng mô hình 5 bước. Với
        VComm có 3 điểm đặc thù: <b>(a)</b> bán hàng là nghĩa vụ tại một thời điểm;{' '}
        <b>(b)</b> V-Xu là <b>quyền lợi trọng yếu</b> — một phần giá giao dịch phải phân bổ cho
        V-Xu và chỉ ghi nhận khi khách tiêu hoặc theo tỉ lệ breakage; <b>(c)</b> bảo hành/đổi trả
        là ràng buộc với phần biến động của giá giao dịch.
      </Notice>

      {error && <Notice tone="red" title="Lỗi">{error}</Notice>}
      {result && <Notice tone="green" title="Hoàn tất">{result}</Notice>}

      <Card>
        <CardHeader title="5 bước của IFRS 15" />
        <div className="divide-y divide-slate-100">
          {STEPS.map(s => (
            <div key={s.n} className="flex items-start gap-3 px-4 py-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                {s.n}
              </span>
              <div>
                <p className="text-xs font-medium text-slate-800">{s.ten}</p>
                <p className="text-[11px] text-slate-500">{s.dieuKien}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
      ) : (
        <>
          <Card>
            <CardHeader
              title="Hợp đồng với khách hàng"
              desc="Bước 1 + 3"
              right={<Btn onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Btn>}
            />
            {contracts.length === 0 ? (
              <Empty icon={TrendingUp} text="Chưa có hợp đồng doanh thu nào — sẽ được tạo tự động khi có đơn hàng" />
            ) : (
              <div className="divide-y divide-slate-100">
                {contracts.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectContract(c)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50',
                      selected?.id === c.id && 'bg-blue-50'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-slate-800">{c.contractNo}</span>
                        <Badge tone={c.collectability === 'probable' ? 'green' : 'amber'}>
                          {c.collectability === 'probable' ? 'Có khả năng thu hồi' : 'Nghi ngờ'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Ký {fmtDate(c.signedDate)} · KH {c.customerId}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-slate-800">{formatCurrency(c.transactionPrice)}</div>
                      <div className="text-[11px] text-slate-500">
                        Đã ghi nhận {formatCurrency(c.recognizedTotal)}
                      </div>
                    </div>
                    <Badge tone={c.status === 'active' ? 'blue' : 'slate'}>
                      {REV_CONTRACT_STATUS_LABEL[c.status]}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {selected && (
            <Card>
              <CardHeader
                title={`Nghĩa vụ thực hiện — ${selected.contractNo}`}
                desc="Bước 2 · 4 · 5"
                right={
                  <Btn variant="primary" loading={busy} onClick={allocate}>
                    <Wallet className="h-3.5 w-3.5" /> Phân bổ giá giao dịch (Bước 4)
                  </Btn>
                }
              />
              <div className="grid grid-cols-4 gap-3 border-b border-slate-100 px-4 py-3 text-center">
                {[
                  { l: 'Giá giao dịch', v: formatCurrency(selected.transactionPrice) },
                  { l: 'Đã phân bổ', v: formatCurrency(selected.allocatedTotal) },
                  { l: 'Đã ghi nhận', v: formatCurrency(selected.recognizedTotal) },
                  { l: 'Chờ phân bổ (TK 3387)', v: formatCurrency(selected.deferredTotal) },
                ].map(s => (
                  <div key={s.l}>
                    <div className="text-[11px] text-slate-500">{s.l}</div>
                    <div className="text-sm font-semibold text-slate-800">{s.v}</div>
                  </div>
                ))}
              </div>
              {obligations.length === 0 ? (
                <Empty icon={TrendingUp} text="Chưa có nghĩa vụ thực hiện nào" />
              ) : (
                <div className="divide-y divide-slate-100">
                  {obligations.map(o => (
                    <div key={o.id} className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-700">{o.code}</span>
                        <span className="text-xs text-slate-800">{o.name}</span>
                        <Badge tone={o.obligationType === 'point_in_time' ? 'blue' : 'violet'}>
                          {REV_OBLIGATION_TYPE_LABEL[o.obligationType]}
                        </Badge>
                        <Badge tone={o.status === 'satisfied' ? 'green' : o.status === 'in_progress' ? 'amber' : 'slate'}>
                          {o.status === 'satisfied' ? 'Đã thoả mãn' : o.status === 'in_progress' ? 'Đang thực hiện' : 'Chờ'}
                        </Badge>
                      </div>
                      <div className="mt-1.5 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${Math.min(100, Math.max(0, o.progressPct))}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500">{Math.round(o.progressPct)}%</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 text-[11px] text-slate-500">
                        <span>SSP: <b className="text-slate-700">{formatCurrency(o.standaloneSellingPrice)}</b></span>
                        <span>Phân bổ: <b className="text-slate-700">{formatCurrency(o.allocatedAmount)}</b></span>
                        <span>Đã ghi nhận: <b className="text-slate-700">{formatCurrency(o.recognizedAmount)}</b></span>
                        <span className="font-mono">Nợ TK {o.revenueAccountCode} / Có TK {o.deferredAccountCode}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {deferred.length > 0 && (
            <Card>
              <CardHeader title="Doanh thu chờ phân bổ (TK 3387)" desc="Doanh thu nhận trước nhưng chưa thoả mãn nghĩa vụ" />
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-4 py-2 font-medium">Hợp đồng</th>
                      <th className="px-3 py-2 text-right font-medium">Giá giao dịch</th>
                      <th className="px-3 py-2 text-right font-medium">Đã ghi nhận</th>
                      <th className="px-4 py-2 text-right font-medium">Chờ phân bổ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deferred.map((d: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-1.5 font-mono text-slate-700">{d.contract_no}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-slate-600">{fmtNum(d.transaction_price)}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-slate-600">{fmtNum(d.recognized_total)}</td>
                        <td className="px-4 py-1.5 text-right font-mono font-medium text-slate-800">{fmtNum(d.deferred_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// =============================================================================
// TAB 8 — BÁO CÁO TÀI CHÍNH (Điều 14-27)
// =============================================================================

function ReportsTab({ periods }: { periods: AccPeriod[] }) {
  const [reports, setReports] = useState<FsReport[]>([]);
  const [lines, setLines] = useState<FsReportLine[]>([]);
  const [selected, setSelected] = useState<FsReport | null>(null);
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportCode, setReportCode] = useState<FsReportCode>('B01-DN');
  const [periodId, setPeriodId] = useState('');
  const [scope, setScope] = useState<'company' | 'consolidated'>('company');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReports(await tt99.listReports({ tenantId: TENANT }).catch(() => [] as FsReport[]));
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    if (!periodId) return;
    setBusy(true);
    setError(null);
    try {
      if (scope === 'consolidated') {
        const chk = await tt99.validateBeforeConsolidation({ periodId, tenantId: TENANT });
        if (!chk.ok) {
          setError(chk.message);
          return;
        }
      }
      const r = await tt99.generateFinancialReport({
        reportCode, periodId, scope, reportType: 'annual',
        preparedBy: 'ke-toan-truong', tenantId: TENANT,
      });
      await select(r);
      await load();
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  const select = async (r: FsReport) => {
    setSelected(r);
    try {
      const [l, b] = await Promise.all([
        tt99.getReportLines(r.id).catch(() => [] as FsReportLine[]),
        r.reportCode === 'B01-DN'
          ? tt99.checkBalanceSheet(r.id).catch(() => null)
          : Promise.resolve(null),
      ]);
      setLines(l);
      setBalance(b);
    } catch (e) {
      setError(errText(e));
    }
  };

  return (
    <div className="space-y-4">
      <Notice tone="blue" title="Điều 14-27 — Báo cáo tài chính">
        TT99 <b>đổi tên "Bảng cân đối kế toán" thành "Báo cáo tình hình tài chính"</b> (B01-DN).
        BCTC <b>năm</b> là bắt buộc, BCTC giữa niên độ không bắt buộc. Doanh nghiệp được{' '}
        <b>thêm chỉ tiêu</b> nhưng không được đổi tên hay đánh lại số thứ tự ("Mã số") của chỉ tiêu
        TT99 — DB sẽ từ chối mọi thay đổi như vậy.
      </Notice>

      {error && <Notice tone="red" title="Lỗi">{error}</Notice>}

      <Card>
        <CardHeader title="Lập báo cáo tài chính" desc="Chọn kỳ, mẫu báo cáo và phạm vi hợp nhất" />
        <div className="grid gap-3 px-4 py-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-600">Kỳ kế toán</label>
            <select
              value={periodId}
              onChange={e => setPeriodId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-blue-500"
            >
              <option value="">— Chọn kỳ —</option>
              {periods.map(p => (
                <option key={p.id} value={p.id}>
                  {p.periodNo == null ? `Năm ${p.periodYear}`
                    : p.periodNo >= 21 ? `Quý ${p.periodNo - 20}/${p.periodYear}`
                      : `Tháng ${String(p.periodNo).padStart(2, '0')}/${p.periodYear}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-600">Mẫu báo cáo</label>
            <select
              value={reportCode}
              onChange={e => setReportCode(e.target.value as FsReportCode)}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-blue-500"
            >
              {(Object.keys(FS_REPORT_LABEL) as FsReportCode[]).map(c => (
                <option key={c} value={c}>{c} — {FS_REPORT_LABEL[c]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-600">Phạm vi</label>
            <select
              value={scope}
              onChange={e => setScope(e.target.value as 'company' | 'consolidated')}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-blue-500"
            >
              <option value="company">Công ty (riêng)</option>
              <option value="consolidated">Hợp nhất (Điều 7)</option>
            </select>
          </div>
          <div className="flex items-end">
            <Btn variant="primary" disabled={!periodId} loading={busy} onClick={generate}>
              <FileSpreadsheet className="h-3.5 w-3.5" /> Lập báo cáo
            </Btn>
          </div>
        </div>
      </Card>

      {balance && (
        <Card>
          <CardHeader title="Kiểm tra cân bằng B01-DN" desc="Tổng tài sản (Mã số 270) = Tổng nguồn vốn (Mã số 440)" />
          <div className="px-4 py-3">
            {balance.isBalanced ? (
              <Notice tone="green" title="Bảng cân đối đã cân bằng">
                Tổng tài sản = Tổng nguồn vốn = {formatCurrency(balance.totalAssets)}
              </Notice>
            ) : (
              <Notice tone="red" title="Bảng cân đối chưa cân bằng">
                Tổng tài sản {formatCurrency(balance.totalAssets)} ≠ Tổng nguồn vốn{' '}
                {formatCurrency(balance.totalResources)} — chênh lệch{' '}
                {formatCurrency(Math.abs(balance.difference))}.
              </Notice>
            )}
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader
            title="Báo cáo đã lập"
            right={<Btn onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Btn>}
          />
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
          ) : reports.length === 0 ? (
            <Empty icon={FileSpreadsheet} text="Chưa có báo cáo tài chính nào" />
          ) : (
            <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {reports.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => select(r)}
                  className={cn(
                    'w-full px-4 py-2.5 text-left transition-colors hover:bg-slate-50',
                    selected?.id === r.id && 'bg-blue-50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-medium text-slate-800">{r.reportCode}</span>
                    <Badge tone={r.scope === 'consolidated' ? 'violet' : 'slate'}>
                      {r.scope === 'consolidated' ? 'Hợp nhất' : 'Công ty'}
                    </Badge>
                    <Badge tone={r.status === 'approved' ? 'green' : r.status === 'submitted' ? 'blue' : 'amber'}>
                      {r.status === 'approved' ? 'Đã duyệt' : r.status === 'submitted' ? 'Đã nộp' : 'Nháp'}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {FS_REPORT_LABEL[r.reportCode]} · lần {r.revisionNo}
                  </p>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title={selected ? `${selected.reportCode} — ${FS_REPORT_LABEL[selected.reportCode]}` : 'Chi tiết báo cáo'}
            desc={selected ? `Lần ${selected.revisionNo} · ${selected.scope === 'consolidated' ? 'Hợp nhất' : 'Công ty'}` : undefined}
            right={selected && (
              <div className="flex gap-1.5">
                <Btn onClick={async () => { await tt99.recalculateReport(selected.id); await select(selected); }}>
                  Tính lại
                </Btn>
                {selected.status === 'draft' && (
                  <Btn variant="success" onClick={async () => {
                    await tt99.approveReport({ reportId: selected.id, approvedBy: 'giam-doc' });
                    await load(); await select(selected);
                  }}>
                    Duyệt
                  </Btn>
                )}
              </div>
            )}
          />
          {!selected ? (
            <Empty icon={FileSpreadsheet} text="Chọn một báo cáo để xem chi tiết" />
          ) : lines.length === 0 ? (
            <Empty icon={FileSpreadsheet} text="Báo cáo chưa có chỉ tiêu nào" />
          ) : (
            <div className="max-h-[32rem] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-medium">Mã số</th>
                    <th className="px-3 py-2 font-medium">Chỉ tiêu</th>
                    <th className="px-3 py-2 text-right font-medium">Kỳ này</th>
                    <th className="px-4 py-2 text-right font-medium">Kỳ trước</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map(l => (
                    <tr key={l.id} className={cn('hover:bg-slate-50', l.isSection && 'bg-slate-50')}>
                      <td className="px-3 py-1.5 font-mono text-slate-500">{l.lineCode}</td>
                      <td
                        className={cn(
                          'px-3 py-1.5 text-slate-700',
                          l.isBold && 'font-semibold text-slate-900',
                          l.isSection && 'font-semibold uppercase text-slate-800'
                        )}
                        style={{ paddingLeft: `${12 + l.indentLevel * 16}px` }}
                      >
                        {l.lineName}
                        {l.isCustom && <span className="ml-1 text-[10px] text-violet-600">(tự thêm)</span>}
                      </td>
                      <td className={cn('px-3 py-1.5 text-right font-mono',
                        l.isBold ? 'font-semibold text-slate-900' : 'text-slate-700')}>
                        {l.currentAmount != null ? fmtNum(l.currentAmount) : '—'}
                      </td>
                      <td className="px-4 py-1.5 text-right font-mono text-slate-500">
                        {l.priorAmount != null ? fmtNum(l.priorAmount) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENT CHÍNH
// =============================================================================

export function TT99Accounting() {
  const [tab, setTab] = useState<TabKey>('overview');
  const [periods, setPeriods] = useState<AccPeriod[]>([]);

  useEffect(() => {
    tt99.listPeriods(TENANT)
      .then(setPeriods)
      .catch(() => setPeriods([]));
  }, []);

  const active = TABS.find(t => t.key === tab);

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <BookOpenCheck className="h-5 w-5 text-blue-600" />
            Kế toán doanh nghiệp — TT99/2025/TT-BTC
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Có hiệu lực 01/01/2026 · thay thế TT200/2014/TT-BTC (Điều 31) · áp dụng cho mọi chủ thể
          </p>
        </div>
        <Badge tone="blue">spec 021</Badge>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-2">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            title={t.hint}
            onClick={() => setTab(t.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              tab === t.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {active && (
        <p className="text-[11px] text-slate-500">
          <span className="font-medium text-slate-600">{active.label}</span> — {active.hint}
        </p>
      )}

      {tab === 'overview' && <OverviewTab onGoTo={setTab} />}
      {tab === 'accounts' && <AccountsTab />}
      {tab === 'periods' && <PeriodsTab />}
      {tab === 'vouchers' && <VouchersTab periods={periods} />}
      {tab === 'audit' && <AuditTab periods={periods} />}
      {tab === 'consolidation' && <ConsolidationTab periods={periods} />}
      {tab === 'ifrs15' && <Ifrs15Tab />}
      {tab === 'reports' && <ReportsTab periods={periods} />}
    </div>
  );
}

export default TT99Accounting;
