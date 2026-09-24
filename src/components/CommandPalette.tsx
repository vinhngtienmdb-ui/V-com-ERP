import { safeLocalStorage } from '../lib/storage';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  ArrowRight, 
  Hash, 
  Package, 
  Users, 
  ShoppingCart, 
  X, 
  Clock, 
  Keyboard,
  Sparkles,
  Zap,
  FolderLock,
  ShieldAlert,
  FileCheck2,
  FileSpreadsheet,
  Warehouse,
  Wallet,
  Building2,
  FileText
} from 'lucide-react';
import { db, collection, query, where, orderBy, limit, getDocs } from '../lib/firebase';
import { navGroups } from '../constants';
import { MISA_APPS } from '../data/misaApps';
import { cn } from '../lib/utils';

interface Result {
  id: string;
  type: 'action' | 'nav' | 'order' | 'product' | 'customer';
  title: string;
  subtitle?: string;
  path: string;
  icon: React.ElementType;
}

// 1. Core Quick Actions Spotlight
const QUICK_ACTIONS: Result[] = [
  {
    id: 'act-scan-verify',
    type: 'action',
    title: '⚡ Trạm Đóng Gói Scan-to-Verify (Chống nhầm hàng)',
    subtitle: 'Quét barcode SKU, đối soát đơn hàng và in tem vận đơn A6',
    path: '/orders',
    icon: Zap
  },
  {
    id: 'act-finance-tt99',
    type: 'action',
    title: '⚡ Báo Cáo Tài Chính Chuẩn Thông Tư 99/2025/TT-BTC',
    subtitle: 'Mẫu B01-DN (Tình hình tài chính), B02-DN (Kết quả HĐ), B03-DN (Lưu chuyển tiền tệ) & Xuất Excel',
    path: '/finance',
    icon: FileSpreadsheet
  },
  {
    id: 'act-wms-2d',
    type: 'action',
    title: '⚡ Bản Đồ Số 2D Digital Twin WMS & Điểm Đặt Hàng Lại (ROP)',
    subtitle: 'Mặt bằng kho theo Dãy/Kệ/Ô (Bin), bản đồ nhiệt và tính toán ROP tự động',
    path: '/warehouse',
    icon: Warehouse
  },
  {
    id: 'act-labor-compliance',
    type: 'action',
    title: '⚡ Sổ Quản Lý Lao Động Điện Tử (Nghị định 283/2026/NĐ-CP)',
    subtitle: 'Động cơ quét rủi ro HĐLĐ, BHXH, OT và tính toán mức phạt tiền triệu VNĐ',
    path: '/hr?tab=labor_compliance',
    icon: FileCheck2
  },
  {
    id: 'act-erm-risk',
    type: 'action',
    title: '⚡ Ma Trận Rủi Ro & Tuân Thủ Doanh Nghiệp (ERM Heatmap 5x5)',
    subtitle: 'Risk Register, phân loại rủi ro 5 cấp độ và kế hoạch giảm thiểu rủi ro',
    path: '/compliance',
    icon: ShieldAlert
  },
  {
    id: 'act-dochub',
    type: 'action',
    title: '⚡ Tài Liệu Điện Tử DocHub (Cây Thư Mục & Phân Quyền RBAC)',
    subtitle: 'Quản lý tài liệu đa cấp, bảo mật 4 cấp độ và lưu trữ vĩnh viễn',
    path: '/dochub',
    icon: FolderLock
  },
  {
    id: 'act-payslip',
    type: 'action',
    title: '⚡ Phiếu Lương Điện Tử e-Payslip & Ký Nhận Số',
    subtitle: 'Tra cứu thu nhập, bảo hiểm, thuế TNCN và ký xác nhận phiếu lương',
    path: '/hr?tab=payroll',
    icon: Wallet
  }
];

// 2. Index all MISA_APPS
const MISA_NAV_RESULTS: Result[] = MISA_APPS.map(app => ({
  id: app.id,
  type: 'nav' as const,
  title: app.name,
  subtitle: app.description,
  path: app.path,
  icon: app.icon || Building2
}));

// 3. Fallback navGroups
const NAV_RESULTS: Result[] = [
  ...QUICK_ACTIONS,
  ...MISA_NAV_RESULTS,
  ...navGroups.flatMap(g =>
    g.items.map(item => ({
      id: item.path,
      type: 'nav' as const,
      title: item.label,
      subtitle: item.description ?? g.title,
      path: item.path,
      icon: item.icon,
    }))
  )
];

// Remove duplicate paths
const UNIQUE_NAV_RESULTS = Array.from(new Map(NAV_RESULTS.map(item => [item.path, item])).values());

const RECENTS_KEY = 'cmd-palette-recents';
function getRecents(): Result[] {
  try { return JSON.parse(safeLocalStorage.getItem(RECENTS_KEY) ?? '[]'); } catch { return []; }
}
function saveRecent(r: Result) {
  const prev = getRecents().filter(x => x.id !== r.id);
  safeLocalStorage.setItem(RECENTS_KEY, JSON.stringify([r, ...prev].slice(0, 6)));
}

interface Props { onClose: () => void; }

export function CommandPalette({ onClose }: Props) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [q, setQ] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [recents, setRecents] = useState<Result[]>(getRecents);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Search logic
  useEffect(() => {
    if (!q.trim()) { 
      // Default: show Quick Actions and Recents
      setResults(QUICK_ACTIONS); 
      setSelected(0); 
      return; 
    }
    const lower = q.toLowerCase();

    // Instant nav results with fuzzy / contains matching
    const navHits = UNIQUE_NAV_RESULTS.filter(
      r => r.title.toLowerCase().includes(lower) || (r.subtitle ?? '').toLowerCase().includes(lower)
    );
    setResults(navHits);
    setSelected(0);

    // Async Firestore search (debounced)
    if (q.trim().length < 2) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const hits: Result[] = [...navHits];

        // 1. Search Customers from localStorage cache
        try {
          const rawCust = safeLocalStorage.getItem('vcomm_customers_cache');
          if (rawCust) {
            const custs: any[] = JSON.parse(rawCust);
            custs
              .filter(c => (c.name?.toLowerCase() || '').includes(lower) || (c.phone || '').includes(lower) || (c.id?.toLowerCase() || '').includes(lower))
              .slice(0, 3)
              .forEach(c => {
                hits.push({
                  id: c.id,
                  type: 'customer',
                  title: `Khách hàng: ${c.name}`,
                  subtitle: `SĐT: ${c.phone} • Chi tiêu: ${Number(c.totalSpent || 0).toLocaleString()}đ (${c.tier || 'VIP'})`,
                  path: `/customers?search=${encodeURIComponent(c.phone || c.name)}`,
                  icon: Users,
                });
              });
          }
        } catch {}

        // 2. Search Leased Devices
        try {
          const rawLeases = safeLocalStorage.getItem('vcomm_leases_cache');
          if (rawLeases) {
            const leases: any[] = JSON.parse(rawLeases);
            leases
              .filter(l => (l.deviceModel?.toLowerCase() || '').includes(lower) || (l.phone || '').includes(lower) || (l.id?.toLowerCase() || '').includes(lower))
              .slice(0, 3)
              .forEach(l => {
                hits.push({
                  id: l.id,
                  type: 'product',
                  title: `Thiết bị: ${l.deviceModel}`,
                  subtitle: `Khách: ${l.phone} • Trạng thái: ${l.status || 'active'} • Knox: ${l.knoxStatus || 'normal'}`,
                  path: `/device-leasing?search=${encodeURIComponent(l.phone || l.id)}`,
                  icon: Package,
                });
              });
          }
        } catch {}

        // 3. Orders — search by customerName
        const ordersQ = query(
          collection(db, 'orders'),
          where('customerName', '>=', q),
          where('customerName', '<=', q + '\uf8ff'),
          limit(4)
        );
        const orderSnap = await getDocs(ordersQ);
        orderSnap.forEach(d => {
          const data = d.data();
          hits.push({ 
            id: d.id, 
            type: 'order', 
            title: `Đơn #${d.id.slice(-8)}: ${data.customerName || 'Khách hàng'}`, 
            subtitle: `Trạng thái: ${data.status ?? ''} • Tổng: ${data.total ? data.total.toLocaleString() + 'đ' : ''}`, 
            path: `/orders?orderId=${encodeURIComponent(d.id)}`, 
            icon: ShoppingCart 
          });
        });

        setResults(hits);
      } catch {
        // Ignore firestore offline errors
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [q]);

  const handleSelect = (r: Result) => {
    saveRecent(r);
    onClose();
    navigate(r.path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(prev => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(prev => (prev - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selected]) {
        handleSelect(results[selected]);
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col text-slate-100 animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Bar Input */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/60">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Tìm kiếm nhanh module, tính năng, chứng từ (VD: doc, thuế, kho, lương, rủi ro)..."
            className="w-full bg-transparent text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none"
          />
          {q && (
            <button 
              onClick={() => setQ('')} 
              className="text-slate-500 hover:text-white p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-slate-800/40 custom-scrollbar">
          {results.length > 0 ? (
            <div className="space-y-1">
              {!q && (
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Tính Năng Nổi Bật & Đột Phá ERP
                </div>
              )}
              {results.map((r, idx) => {
                const Icon = r.icon;
                const isSelected = selected === idx;
                return (
                  <div
                    key={r.id + idx}
                    onClick={() => handleSelect(r)}
                    onMouseEnter={() => setSelected(idx)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                      isSelected ? "bg-indigo-600/30 border border-indigo-500/50 text-white shadow-xs" : "hover:bg-slate-800/50 text-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs",
                        r.type === 'action' ? "bg-amber-500/20 text-amber-300" :
                        r.type === 'order' ? "bg-blue-500/20 text-blue-300" :
                        "bg-slate-800 text-slate-400"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-100 truncate">{r.title}</p>
                        {r.subtitle && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{r.subtitle}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[10px] font-mono text-slate-500 font-medium hidden sm:inline">
                        {r.path}
                      </span>
                      <ArrowRight className={cn(
                        "w-4 h-4 transition-transform",
                        isSelected ? "text-indigo-400 translate-x-0.5" : "text-slate-600"
                      )} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              Không tìm thấy kết quả nào khớp với "{q}".
            </div>
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">↓</kbd>
              <span>di chuyển</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">Enter</kbd>
              <span>chọn</span>
            </span>
          </div>
          <span className="font-mono text-slate-500">VComm ERP Spotlight • AI Search</span>
        </div>

      </div>
    </div>
  );
}
