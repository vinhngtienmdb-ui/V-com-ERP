import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Loader2, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const API_BASE = 'https://provinces.open-api.vn/api/v2';

interface Province { code: number; name: string; unit: string; }
interface Ward     { code: number; name: string; unit: string; }

export interface VietnamAddress {
  provinceCode: number | null;
  provinceName: string;
  wardCode:     number | null;
  wardName:     string;
  street:       string;
}

export const EMPTY_ADDRESS: VietnamAddress = {
  provinceCode: null, provinceName: '',
  wardCode:     null, wardName:     '',
  street:       '',
};

/** Trả về chuỗi địa chỉ đầy đủ: "Số nhà, Phường/Xã, Tỉnh/TP" */
export function formatAddress(a: VietnamAddress): string {
  return [a.street, a.wardName, a.provinceName].filter(Boolean).join(', ');
}

/* ─────────────────────────────────────────────────────────────────────────
   Cascade selector — 2 cấp: Tỉnh/Thành phố → Phường/Xã
───────────────────────────────────────────────────────────────────────── */
interface SelectorProps {
  value:              VietnamAddress;
  onChange:           (v: VietnamAddress) => void;
  className?:         string;
  disabled?:          boolean;
  showStreet?:        boolean;
  streetPlaceholder?: string;
  compact?:           boolean;
}

export function VietnamAddressSelector({
  value,
  onChange,
  className,
  disabled        = false,
  showStreet      = true,
  streetPlaceholder = 'Số nhà, tên đường...',
  compact         = false,
}: SelectorProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards,     setWards]     = useState<Ward[]>([]);
  const [loadingP,  setLoadingP]  = useState(false);
  const [loadingW,  setLoadingW]  = useState(false);
  const [errorP,    setErrorP]    = useState(false);
  const [errorW,    setErrorW]    = useState(false);

  /* Tải danh sách tỉnh/thành khi mount */
  const loadProvinces = useCallback(() => {
    setLoadingP(true); setErrorP(false);
    fetch(`${API_BASE}/?depth=1`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: Province[]) => setProvinces(data))
      .catch(() => setErrorP(true))
      .finally(() => setLoadingP(false));
  }, []);

  useEffect(() => { loadProvinces(); }, [loadProvinces]);

  /* Tải phường/xã khi chọn tỉnh (depth=2 → trực tiếp trả về wards) */
  useEffect(() => {
    if (!value.provinceCode) { setWards([]); return; }
    setLoadingW(true); setErrorW(false);
    fetch(`${API_BASE}/p/${value.provinceCode}?depth=2`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: Province & { wards?: Ward[] }) => setWards(data.wards ?? []))
      .catch(() => { setWards([]); setErrorW(true); })
      .finally(() => setLoadingW(false));
  }, [value.provinceCode]);

  const handleProvince = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value ? Number(e.target.value) : null;
    const prov = provinces.find(p => p.code === code);
    onChange({ ...value, provinceCode: code, provinceName: prov?.name ?? '', wardCode: null, wardName: '' });
  }, [provinces, value, onChange]);

  const handleWard = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value ? Number(e.target.value) : null;
    const ward = wards.find(w => w.code === code);
    onChange({ ...value, wardCode: code, wardName: ward?.name ?? '' });
  }, [wards, value, onChange]);

  const inputCls = cn(
    'w-full border border-slate-200 bg-white text-slate-800',
    'focus:outline-none focus:border-blue-500 transition-colors appearance-none',
    compact ? 'px-2.5 py-1.5 text-[13px]' : 'px-3 py-2 text-sm',
    disabled && 'opacity-50 cursor-not-allowed bg-slate-50',
  );
  const labelCls = 'block font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1';

  return (
    <div className={cn('space-y-2.5', className)}>

      {/* ── Tỉnh / Thành phố ── */}
      <div>
        <label className={labelCls}>Tỉnh / Thành phố</label>
        <div className="relative">
          <select
            value={value.provinceCode ?? ''}
            onChange={handleProvince}
            disabled={disabled || loadingP}
            className={inputCls}
          >
            <option value="">— Chọn Tỉnh / Thành phố —</option>
            {provinces.map(p => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
            {loadingP ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </div>
        {errorP && (
          <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
            <AlertCircle className="w-3 h-3" /> Không tải được dữ liệu.
            <button onClick={loadProvinces} className="underline font-bold">Thử lại</button>
          </p>
        )}
      </div>

      {/* ── Phường / Xã / Thị trấn ── */}
      <div>
        <label className={labelCls}>Phường / Xã / Thị trấn</label>
        <div className="relative">
          <select
            value={value.wardCode ?? ''}
            onChange={handleWard}
            disabled={disabled || !value.provinceCode || loadingW}
            className={inputCls}
          >
            <option value="">
              {!value.provinceCode ? '← Chọn tỉnh/thành trước' : '— Chọn Phường / Xã —'}
            </option>
            {wards.map(w => (
              <option key={w.code} value={w.code}>{w.name}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
            {loadingW ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </div>
        {errorW && (
          <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
            <AlertCircle className="w-3 h-3" /> Không tải được phường/xã.
          </p>
        )}
        {value.provinceCode && !loadingW && wards.length === 0 && !errorW && (
          <p className="text-[11px] text-slate-400 mt-1">Không có dữ liệu phường/xã cho tỉnh này.</p>
        )}
      </div>

      {/* ── Số nhà / đường ── */}
      {showStreet && (
        <div>
          <label className={labelCls}>Số nhà, tên đường</label>
          <input
            type="text"
            value={value.street}
            onChange={e => onChange({ ...value, street: e.target.value })}
            placeholder={streetPlaceholder}
            disabled={disabled}
            className={inputCls}
          />
        </div>
      )}

      {/* ── Preview địa chỉ hoàn chỉnh ── */}
      {(value.wardName || value.provinceName) && (
        <div className="flex items-start gap-1.5 bg-blue-50 border border-blue-100 px-2.5 py-1.5">
          <MapPin className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-[12px] text-blue-700 leading-snug">{formatAddress(value)}</p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Province Browser — bảng 63 tỉnh/thành, click để xem phường/xã trực tiếp
───────────────────────────────────────────────────────────────────────── */
export function VietnamProvinceBrowser() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(false);
  const [search,    setSearch]    = useState('');
  const [expanded,  setExpanded]  = useState<number | null>(null);
  const [wardMap,   setWardMap]   = useState<Record<number, Ward[]>>({});
  const [loadingExp, setLoadingExp] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true); setError(false);
    fetch(`${API_BASE}/?depth=1`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setProvinces)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const expandProvince = useCallback(async (code: number) => {
    if (expanded === code) { setExpanded(null); return; }
    setExpanded(code);
    if (wardMap[code]) return;
    setLoadingExp(code);
    try {
      const data = await fetch(`${API_BASE}/p/${code}?depth=2`).then(r => r.json());
      setWardMap(prev => ({ ...prev, [code]: data.wards ?? [] }));
    } catch {
      setWardMap(prev => ({ ...prev, [code]: [] }));
    } finally {
      setLoadingExp(null);
    }
  }, [expanded, wardMap]);

  const filtered = provinces.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    String(p.code).includes(search)
  );

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm tỉnh/thành phố hoặc mã số..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Tải lại
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Không kết nối được tới provinces.open-api.vn
          </span>
          <button onClick={load} className="text-xs font-bold underline">Thử lại</button>
        </div>
      )}

      {/* Summary bar */}
      {!loading && provinces.length > 0 && (
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
          <span>
            <span className="font-bold text-slate-700">{provinces.length}</span> tỉnh/thành phố
            <span className="text-slate-300 mx-1">·</span>
            <span className="text-slate-500">Địa chỉ hành chính 2 cấp (sau cải cách 2025)</span>
          </span>
          {search && <span>· Lọc: <span className="font-bold text-blue-600">{filtered.length}</span> kết quả</span>}
          <span className="ml-auto">provinces.open-api.vn</span>
        </div>
      )}

      {/* Table */}
      <div className="border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 w-16">Mã</th>
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Tên Tỉnh / Thành phố</th>
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 w-24">Đơn vị HC</th>
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right w-28">Phường / Xã</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading && (
              <tr>
                <td colSpan={4} className="py-10 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500 mx-auto mb-2" />
                  <p className="text-[12px] text-slate-400">Đang tải dữ liệu từ API...</p>
                </td>
              </tr>
            )}
            {!loading && filtered.map(prov => (
              <React.Fragment key={prov.code}>
                <tr
                  onClick={() => expandProvince(prov.code)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-3 py-2">
                    <span className="font-mono text-[11px] text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5">
                      {prov.code}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2 font-semibold text-slate-800">
                      <ChevronDown className={cn(
                        'w-3 h-3 text-slate-400 transition-transform shrink-0',
                        expanded === prov.code && 'rotate-180'
                      )} />
                      {prov.name}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[12px] text-slate-500">{prov.unit}</td>
                  <td className="px-3 py-2 text-right">
                    {loadingExp === prov.code
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400 inline" />
                      : wardMap[prov.code] !== undefined
                        ? <span className="text-[12px] font-bold text-slate-700">{wardMap[prov.code].length}</span>
                        : <span className="text-[11px] text-slate-400">—</span>
                    }
                  </td>
                </tr>

                {/* Wards panel */}
                {expanded === prov.code && wardMap[prov.code] !== undefined && (
                  <tr>
                    <td colSpan={4} className="bg-slate-50 border-t border-slate-100 px-4 py-3">
                      {wardMap[prov.code].length === 0 ? (
                        <p className="text-[12px] text-slate-400 italic">Không có dữ liệu phường/xã</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {wardMap[prov.code].map(w => (
                            <span
                              key={w.code}
                              className="text-[11px] font-medium text-slate-700 bg-white border border-slate-200 px-2 py-0.5 hover:border-blue-400 hover:text-blue-700 transition-colors cursor-default"
                            >
                              {w.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {!loading && filtered.length === 0 && !error && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[12px] text-slate-400">
                  Không có kết quả phù hợp
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
