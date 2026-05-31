import { safeLocalStorage } from '../lib/storage';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Hash, Package, Users, ShoppingCart, X, Clock, Keyboard } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { navGroups } from '../constants';
import { cn } from '../lib/utils';

interface Result {
  id: string;
  type: 'nav' | 'order' | 'product' | 'customer';
  title: string;
  subtitle?: string;
  path: string;
  icon: React.ElementType;
}

const NAV_RESULTS: Result[] = navGroups.flatMap(g =>
  g.items.map(item => ({
    id: item.path,
    type: 'nav' as const,
    title: item.label,
    subtitle: item.description ?? g.title,
    path: item.path,
    icon: item.icon,
  }))
);

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
    if (!q.trim()) { setResults([]); setSelected(0); return; }
    const lower = q.toLowerCase();

    // Instant nav results
    const navHits = NAV_RESULTS.filter(
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

        // Orders — search by orderId prefix
        const ordersQ = query(
          collection(db, 'orders'),
          where('customerName', '>=', q),
          where('customerName', '<=', q + ''),
          limit(4)
        );
        const orderSnap = await getDocs(ordersQ);
        orderSnap.forEach(d => {
          const data = d.data();
          hits.push({ id: d.id, type: 'order', title: `Đơn #${d.id}`, subtitle: `${data.customerName} — ${data.status ?? ''}`, path: '/orders', icon: ShoppingCart });
        });

        // Products — search by name
        const prodsQ = query(
          collection(db, 'products'),
          where('name', '>=', q),
          where('name', '<=', q + ''),
          limit(4)
        );
        const prodSnap = await getDocs(prodsQ);
        prodSnap.forEach(d => {
          const data = d.data();
          hits.push({ id: d.id, type: 'product', title: data.name ?? d.id, subtitle: `Tồn kho: ${data.stock ?? '?'}`, path: '/pim', icon: Package });
        });

        // Customers — search by name
        const custsQ = query(
          collection(db, 'customers'),
          where('name', '>=', q),
          where('name', '<=', q + ''),
          limit(4)
        );
        const custSnap = await getDocs(custsQ);
        custSnap.forEach(d => {
          const data = d.data();
          hits.push({ id: d.id, type: 'customer', title: data.name ?? d.id, subtitle: data.email ?? data.phone ?? '', path: '/customers', icon: Users });
        });

        setResults(hits);
      } catch { /* silent — offline or no index */ }
      finally { setLoading(false); }
    }, 280);
    return () => clearTimeout(timer);
  }, [q]);

  const displayed = q.trim() ? results : recents;

  const go = useCallback((r: Result) => {
    saveRecent(r);
    setRecents(getRecents());
    navigate(r.path);
    onClose();
  }, [navigate, onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, displayed.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter' && displayed[selected]) go(displayed[selected]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [displayed, selected, go, onClose]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selected}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  const typeLabel: Record<string, string> = { nav: 'MENU', order: 'ĐƠN', product: 'SẢN PHẨM', customer: 'KH' };
  const typeColor: Record<string, string> = {
    nav:      'bg-blue-50 text-blue-700 border-blue-200',
    order:    'bg-rose-50 text-rose-700 border-rose-200',
    product:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    customer: 'bg-violet-50 text-violet-700 border-violet-200',
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-start justify-center pt-[10vh] px-4"
      style={{ background: 'rgba(9,11,17,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white border border-slate-300 overflow-hidden animate-in scale-in duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50">
          <Search className={cn('w-4 h-4 shrink-0 transition-colors', loading ? 'text-blue-500 animate-pulse' : 'text-slate-400')} />
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Tìm kiếm menu, đơn hàng, sản phẩm, khách hàng..."
            className="flex-1 bg-transparent font-mono text-[13px] text-slate-800 placeholder-slate-400 outline-none"
          />
          {q && (
            <button onClick={() => setQ('')} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="hidden sm:flex items-center border border-slate-200 px-1.5 py-0.5 font-mono text-[9px] text-slate-400 bg-white">
            ESC
          </span>
        </div>

        {/* Results list */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {displayed.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
              {q ? (
                <>
                  <Search className="w-7 h-7 opacity-25" />
                  <p className="font-mono text-[11px]">KHÔNG TÌM THẤY: <strong className="text-slate-600">"{q}"</strong></p>
                </>
              ) : (
                <>
                  <Clock className="w-7 h-7 opacity-25" />
                  <p className="font-mono text-[11px] text-slate-400">CHƯA CÓ LỊCH SỬ</p>
                </>
              )}
            </div>
          )}

          {!q && displayed.length > 0 && (
            <div className="px-4 py-2 border-b border-slate-100 bg-[#FAFAFA]">
              <p className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Truy cập gần đây
              </p>
            </div>
          )}

          <div className="divide-y divide-slate-100">
            {displayed.map((r, i) => {
              const Icon = r.icon;
              return (
                <button
                  key={r.id}
                  data-idx={i}
                  onClick={() => go(r)}
                  onMouseEnter={() => setSelected(i)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left',
                    selected === i ? 'bg-[#EFF6FF]' : 'hover:bg-slate-50'
                  )}
                >
                  <div className={cn('w-7 h-7 flex items-center justify-center shrink-0 border', typeColor[r.type] ?? 'bg-slate-50 text-slate-500 border-slate-200')}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-slate-800 truncate leading-snug">{r.title}</div>
                    {r.subtitle && <div className="font-mono text-[10px] text-slate-400 truncate">{r.subtitle}</div>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('font-mono text-[9px] font-bold px-1.5 py-0.5 border', typeColor[r.type] ?? 'bg-slate-100 text-slate-400 border-slate-200')}>
                      {typeLabel[r.type] ?? r.type}
                    </span>
                    {selected === i && <ArrowRight className="w-3 h-3 text-blue-500" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-200 bg-slate-50">
          {[['↑↓', 'điều hướng'], ['↵', 'mở'], ['Esc', 'đóng']].map(([key, desc]) => (
            <span key={key} className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center h-4 px-1 border border-slate-300 bg-white font-mono text-[9px] text-slate-500">{key}</span>
              <span className="font-mono text-[9px] text-slate-400">{desc}</span>
            </span>
          ))}
          <span className="ml-auto flex items-center gap-1 font-mono text-[9px] text-slate-400">
            <Keyboard className="w-3 h-3" /> Ctrl+K
          </span>
        </div>
      </div>
    </div>
  );
}
