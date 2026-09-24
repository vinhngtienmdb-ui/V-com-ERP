import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Filter, FileSpreadsheet, Eye, CheckCircle2, Clock, Lock, ArrowUpDown, TrendingUp, TrendingDown, BookOpen, FolderPlus, Sparkles, Check } from 'lucide-react';
import { ChungTuNhatKyChung, LoaiChungTu, TrangThaiChungTu } from '../../lib/keToan/types';
import { ChungTuEditor } from './ChungTuEditor';
import { formatCurrency, cn } from '../../lib/utils';
import { formatDateVN, formatMonthVN } from '../../lib/keToan/dateUtils';
import { tuDongLuuTruMotChungTu, dongBoTatCaChungTuVaoHoSo } from '../../lib/keToan/autoArchiveService';

// Mock initial data for immediate interactive viewing
const MOCK_CHUNG_TU_LIST: ChungTuNhatKyChung[] = [
  {
    id: 'ct-1',
    tenantId: 'tenant-vcomm-prod-01',
    loaiCt: 'BAN',
    soCt: 'HDB-2026-03-001',
    ngayCt: '2026-03-01',
    ngayHachToan: '2026-03-01',
    kyKeToan: '2026-03',
    dienGiai: 'Bán hàng điện thoại Flagship - Đơn hàng ORD-VC-88912',
    nguoiLapId: 'user-sales-01',
    trangThai: 'DA_GHI_SO',
    thongTuApDung: 'TT99',
    dinhKhoan: [
      {
        soDong: 1,
        dienGiai: 'Phải thu khách lẻ bán hàng',
        tkNo: '131',
        tkCo: '511',
        soTien: 12500000,
        loaiTien: 'VND',
        tyGia: 1,
        soTienQuyDoi: 12500000,
        maDoiTuong: 'KHLE',
        tenDoiTuong: 'Khách hàng vãng lai'
      },
      {
        soDong: 2,
        dienGiai: 'Thuế GTGT đầu ra phải nộp',
        tkNo: '131',
        tkCo: '3331',
        soTien: 1250000,
        loaiTien: 'VND',
        tyGia: 1,
        soTienQuyDoi: 1250000,
        maDoiTuong: 'KHLE',
        tenDoiTuong: 'Khách hàng vãng lai'
      }
    ]
  },
  {
    id: 'ct-2',
    tenantId: 'tenant-vcomm-prod-01',
    loaiCt: 'KHO',
    soCt: 'XK-2026-03-001',
    ngayCt: '2026-03-01',
    ngayHachToan: '2026-03-01',
    kyKeToan: '2026-03',
    dienGiai: 'Xuất kho giá vốn đơn hàng ORD-VC-88912',
    nguoiLapId: 'user-wh-01',
    trangThai: 'DA_GHI_SO',
    thongTuApDung: 'TT99',
    dinhKhoan: [
      {
        soDong: 1,
        dienGiai: 'Giá vốn hàng bán',
        tkNo: '632',
        tkCo: '156',
        soTien: 9800000,
        loaiTien: 'VND',
        tyGia: 1,
        soTienQuyDoi: 9800000,
        maKho: 'KHO-TONG-HN'
      }
    ]
  },
  {
    id: 'ct-3',
    tenantId: 'tenant-vcomm-prod-01',
    loaiCt: 'MUA',
    soCt: 'HDM-2026-03-005',
    ngayCt: '2026-03-03',
    ngayHachToan: '2026-03-03',
    kyKeToan: '2026-03',
    dienGiai: 'Mua phụ kiện điện thoại NCC Tổng kho',
    nguoiLapId: 'user-proc-01',
    trangThai: 'CHUA_GHI_SO',
    thongTuApDung: 'TT99',
    dinhKhoan: [
      {
        soDong: 1,
        dienGiai: 'Nhập kho hàng hóa phụ kiện',
        tkNo: '156',
        tkCo: '331',
        soTien: 45000000,
        loaiTien: 'VND',
        tyGia: 1,
        soTienQuyDoi: 45000000,
        maDoiTuong: 'NCC-KHO-HN',
        tenDoiTuong: 'Tổng kho Phân phối Phụ kiện Hà Nội'
      },
      {
        soDong: 2,
        dienGiai: 'Thuế GTGT đầu vào được khấu trừ',
        tkNo: '1331',
        tkCo: '331',
        soTien: 4500000,
        loaiTien: 'VND',
        tyGia: 1,
        soTienQuyDoi: 4500000,
        maDoiTuong: 'NCC-KHO-HN',
        tenDoiTuong: 'Tổng kho Phân phối Phụ kiện Hà Nội'
      }
    ]
  }
];

export interface NhatKyChungPageProps {
  forceCreateTrigger?: number;
}

export const NhatKyChungPage: React.FC<NhatKyChungPageProps> = ({ forceCreateTrigger }) => {
  const [dataList, setDataList] = useState<ChungTuNhatKyChung[]>(MOCK_CHUNG_TU_LIST);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLoaiCt, setFilterLoaiCt] = useState<string>('ALL');
  const [filterTrangThai, setFilterTrangThai] = useState<string>('ALL');
  const [editingItem, setEditingItem] = useState<ChungTuNhatKyChung | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (forceCreateTrigger && forceCreateTrigger > 0) {
      setIsCreating(true);
      setEditingItem(null);
    }
  }, [forceCreateTrigger]);

  // Phím tắt Alt + N lập chứng từ mới
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        e.stopPropagation();
        setIsCreating(true);
        setEditingItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Tính toán số liệu thống kê nhanh
  const stats = useMemo(() => {
    let tongPhatSinh = 0;
    let soDaGhiSo = 0;
    let soChuaGhiSo = 0;

    dataList.forEach(ct => {
      const sum = ct.dinhKhoan.reduce((acc, row) => acc + (row.soTien || 0), 0);
      tongPhatSinh += sum;
      if (ct.trangThai === 'DA_GHI_SO') soDaGhiSo += 1;
      if (ct.trangThai === 'CHUA_GHI_SO') soChuaGhiSo += 1;
    });

    return {
      tongChungTu: dataList.length,
      tongPhatSinh,
      soDaGhiSo,
      soChuaGhiSo
    };
  }, [dataList]);

  // Bộ lọc chứng từ
  const filteredList = useMemo(() => {
    return dataList.filter(item => {
      if (filterLoaiCt !== 'ALL' && item.loaiCt !== filterLoaiCt) return false;
      if (filterTrangThai !== 'ALL' && item.trangThai !== filterTrangThai) return false;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchSoCt = item.soCt.toLowerCase().includes(query);
        const matchDienGiai = item.dienGiai.toLowerCase().includes(query);
        const matchDinhKhoan = item.dinhKhoan.some(dk =>
          dk.tkNo.toLowerCase().includes(query) ||
          dk.tkCo.toLowerCase().includes(query) ||
          (dk.tenDoiTuong && dk.tenDoiTuong.toLowerCase().includes(query))
        );
        return matchSoCt || matchDienGiai || matchDinhKhoan;
      }
      return true;
    });
  }, [dataList, filterLoaiCt, filterTrangThai, searchTerm]);

  const [archiveSyncToast, setArchiveSyncToast] = useState<string | null>(null);

  const handleSaveItem = (saved: ChungTuNhatKyChung) => {
    if (saved.id) {
      setDataList(prev => prev.map(item => item.id === saved.id ? saved : item));
    } else {
      const newItem = {
        ...saved,
        id: `ct-${Date.now()}`
      };
      setDataList(prev => [newItem, ...prev]);
    }
    setEditingItem(null);
    setIsCreating(false);
  };

  const handlePostItem = (posted: ChungTuNhatKyChung) => {
    handleSaveItem(posted);
    try {
      tuDongLuuTruMotChungTu(posted);
      setArchiveSyncToast(`Đã ghi sổ & tự động lưu trữ chứng từ ${posted.soCt} vào Hồ sơ NĐ 174!`);
      setTimeout(() => setArchiveSyncToast(null), 4000);
    } catch (e) {
      console.error('Lỗi khi tự động lưu trữ hồ sơ:', e);
    }
  };

  const handleSyncAllToArchive = () => {
    try {
      const res = dongBoTatCaChungTuVaoHoSo(dataList);
      setArchiveSyncToast(`Đã tự động lưu trữ ${res.addedCount + res.updatedCount} chứng từ vào Hồ sơ NĐ 174!`);
      setTimeout(() => setArchiveSyncToast(null), 4500);
    } catch (e) {
      console.error('Lỗi khi đồng bộ toàn bộ chứng từ vào hồ sơ:', e);
    }
  };

  return (
    <div className="space-y-4">
      {/* If Editor is Active, render Editor screen */}
      {isCreating || editingItem ? (
        <ChungTuEditor
          initialData={editingItem || undefined}
          onSave={handleSaveItem}
          onPost={handlePostItem}
          onClose={() => {
            setIsCreating(false);
            setEditingItem(null);
          }}
        />
      ) : (
        <>
          {/* Top Quick Stats Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">Tổng phát sinh kỳ {formatMonthVN('2026-03')}:</span>
                <p className="text-base font-extrabold text-blue-600 dark:text-blue-400 tabular-nums mt-0.5">
                  {formatCurrency(stats.tongPhatSinh)}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">Đã ghi sổ chính thức:</span>
                <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                  {stats.soDaGhiSo} <span className="text-xs font-normal text-slate-400">chứng từ</span>
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">Chưa ghi sổ (Bản nháp):</span>
                <p className="text-base font-extrabold text-amber-600 dark:text-amber-400 tabular-nums mt-0.5">
                  {stats.soChuaGhiSo} <span className="text-xs font-normal text-slate-400">chứng từ</span>
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">Chuẩn mực áp dụng:</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                  TT 99/2025/TT-BTC
                </p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">172 Tài khoản • Bất biến</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Action & Filter Toolbar */}
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsCreating(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="Lập chứng từ mới (Alt+N)"
              >
                <Plus className="w-4 h-4" />
                <span>Lập Chứng từ mới (Alt+N)</span>
              </button>

              {/* Status filter pills */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
                {[
                  { id: 'ALL', label: 'Tất cả' },
                  { id: 'DA_GHI_SO', label: 'Đã ghi sổ' },
                  { id: 'CHUA_GHI_SO', label: 'Bản nháp' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setFilterTrangThai(p.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer",
                      filterTrangThai === p.id
                        ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Loai CT selector */}
              <select
                value={filterLoaiCt}
                onChange={(e) => setFilterLoaiCt(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">Mọi loại chứng từ</option>
                <option value="THU">Phiếu thu (THU)</option>
                <option value="CHI">Phiếu chi (CHI)</option>
                <option value="BAN">Hóa đơn bán (BAN)</option>
                <option value="MUA">Hóa đơn mua (MUA)</option>
                <option value="KHO">Phiếu xuất kho (KHO)</option>
                <option value="PKT">Phiếu kế toán khác (PKT)</option>
              </select>

              <button
                type="button"
                onClick={handleSyncAllToArchive}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Tự động thêm toàn bộ chứng từ vào Hồ sơ lưu trữ theo chuẩn NĐ 174 & TT99"
              >
                <FolderPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Thêm tự động vào Hồ sơ lưu trữ (NĐ 174)</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm số CT, diễn giải, TK..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 w-64 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Sync Success Toast Banner */}
          {archiveSyncToast && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in">
              <div className="flex items-center gap-2 font-semibold">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{archiveSyncToast}</span>
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Nghị định 174/2016/NĐ-CP</span>
            </div>
          )}

          {/* S03-DN Journal Entries Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-slate-500 text-[11px]">
                    <th className="p-3 w-28 text-center">Số chứng từ</th>
                    <th className="p-3 w-24 text-center">Ngày ghi sổ</th>
                    <th className="p-3 min-w-[220px]">Diễn giải</th>
                    <th className="p-3 w-32">Định khoản (Nợ / Có)</th>
                    <th className="p-3 w-32 text-right">Tổng tiền (VND)</th>
                    <th className="p-3 w-28 text-center">Trạng thái</th>
                    <th className="p-3 w-20 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredList.map((ct) => {
                    const tongTien = (ct.dinhKhoan || []).reduce((sum, d) => sum + (d.soTien || 0), 0);
                    return (
                      <tr
                        key={ct.id}
                        onClick={() => setEditingItem({ ...ct })}
                        className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      >
                        <td className="p-3 text-center tabular-nums font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                          {ct.soCt}
                        </td>
                        <td className="p-3 text-center text-slate-600 dark:text-slate-400 tabular-nums">
                          {formatDateVN(ct.ngayHachToan)}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{ct.dienGiai}</div>
                          {ct.dinhKhoan[0]?.tenDoiTuong && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Đối tượng: {ct.dinhKhoan[0].tenDoiTuong}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-xs">
                          {ct.dinhKhoan.map((dk, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              <span className="font-bold text-blue-600 dark:text-blue-400">Nợ {dk.tkNo}</span>
                              <span className="text-slate-400">/</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">Có {dk.tkCo}</span>
                            </div>
                          ))}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                          {formatCurrency(tongTien)}
                        </td>
                        <td className="p-3 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1",
                            ct.trangThai === 'DA_GHI_SO'
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-600 border border-amber-500/30"
                          )}>
                            {ct.trangThai === 'DA_GHI_SO' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {ct.trangThai === 'DA_GHI_SO' ? 'Đã ghi sổ' : 'Nháp'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingItem({ ...ct });
                            }}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Xem / Chỉnh sửa"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
