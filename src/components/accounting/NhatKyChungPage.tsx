import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, FileSpreadsheet, Eye, CheckCircle2, Clock, Lock, ArrowUpDown } from 'lucide-react';
import { ChungTuNhatKyChung, LoaiChungTu, TrangThaiChungTu } from '../../lib/keToan/types';
import { ChungTuEditor } from './ChungTuEditor';

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

export const NhatKyChungPage: React.FC = () => {
  const [dataList, setDataList] = useState<ChungTuNhatKyChung[]>(MOCK_CHUNG_TU_LIST);
  const [editingItem, setEditingItem] = useState<ChungTuNhatKyChung | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Filters
  const [selectedKy, setSelectedKy] = useState<string>('2026-03');
  const [filterLoai, setFilterLoai] = useState<string>('ALL');
  const [filterTrangThai, setFilterTrangThai] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredList = useMemo(() => {
    return dataList.filter(item => {
      if (selectedKy && item.kyKeToan !== selectedKy) return false;
      if (filterLoai !== 'ALL' && item.loaiCt !== filterLoai) return false;
      if (filterTrangThai !== 'ALL' && item.trangThai !== filterTrangThai) return false;

      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        item.soCt.toLowerCase().includes(term) ||
        item.dienGiai.toLowerCase().includes(term) ||
        item.dinhKhoan.some(d => d.tenDoiTuong?.toLowerCase().includes(term))
      );
    });
  }, [dataList, selectedKy, filterLoai, filterTrangThai, searchTerm]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    let totalPhatSinh = 0;
    let totalPosted = 0;
    let totalDraft = 0;

    filteredList.forEach(ct => {
      if (ct.trangThai === 'DA_GHI_SO') totalPosted++;
      if (ct.trangThai === 'CHUA_GHI_SO') totalDraft++;

      const sumDong = ct.dinhKhoan.reduce((s, d) => s + (d.soTien || 0), 0);
      totalPhatSinh += sumDong;
    });

    return { totalPhatSinh, totalPosted, totalDraft, count: filteredList.length };
  }, [filteredList]);

  const handleSaveItem = (saved: ChungTuNhatKyChung) => {
    if (saved.id) {
      setDataList(prev => prev.map(item => item.id === saved.id ? saved : item));
    } else {
      const newItem = { ...saved, id: `ct-${Date.now()}` };
      setDataList(prev => [newItem, ...prev]);
    }
    setEditingItem(null);
    setIsCreatingNew(false);
  };

  const formatVnd = (val: number) => new Intl.NumberFormat('vi-VN').format(val);

  if (editingItem || isCreatingNew) {
    return (
      <ChungTuEditor
        initialData={editingItem || undefined}
        onSave={handleSaveItem}
        onClose={() => {
          setEditingItem(null);
          setIsCreatingNew(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold text-slate-900">
              Sổ Nhật ký chung & Danh mục Chứng từ (S03-DN)
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              TT 99/2025/TT-BTC
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ghi nhận toàn bộ biến động tài chính theo trình tự thời gian • Nguồn chân lý kế toán VComm
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsCreatingNew(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Lập chứng từ mới</span>
          </button>
          <button
            type="button"
            onClick={() => alert('Xuất file Excel Sổ Nhật ký chung thành công!')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Tổng số chứng từ</span>
          <div className="text-lg font-mono font-extrabold text-slate-900 mt-1">{metrics.count}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase">Đã ghi sổ</span>
          <div className="text-lg font-mono font-extrabold text-emerald-700 mt-1">{metrics.totalPosted}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase">Chưa ghi sổ (Nháp)</span>
          <div className="text-lg font-mono font-extrabold text-amber-700 mt-1">{metrics.totalDraft}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-indigo-600 uppercase">Tổng phát sinh</span>
          <div className="text-lg font-mono font-extrabold text-indigo-900 mt-1">{formatVnd(metrics.totalPhatSinh)} đ</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Kỳ hạch toán:</span>
            <input
              type="month"
              value={selectedKy}
              onChange={(e) => setSelectedKy(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-indigo-700 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Loại CT:</span>
            <select
              value={filterLoai}
              onChange={(e) => setFilterLoai(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold bg-white"
            >
              <option value="ALL">Tất cả loại</option>
              <option value="THU">Thu tiền</option>
              <option value="CHI">Chi tiền</option>
              <option value="BAN">Bán hàng</option>
              <option value="MUA">Mua hàng</option>
              <option value="KHO">Kho</option>
              <option value="LUONG">Lương</option>
              <option value="KET_CHUYEN">Kết chuyển</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Trạng thái:</span>
            <select
              value={filterTrangThai}
              onChange={(e) => setFilterTrangThai(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold bg-white"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="DA_GHI_SO">Đã ghi sổ</option>
              <option value="CHUA_GHI_SO">Chưa ghi sổ</option>
              <option value="DA_KHOA_SO">Đã khóa sổ</option>
            </select>
          </div>
        </div>

        <div className="w-full sm:w-64 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo số CT, diễn giải, đối tượng..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
          />
        </div>
      </div>

      {/* Table List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="p-3 w-12 text-center">STT</th>
                <th className="p-3 w-36">Số chứng từ</th>
                <th className="p-3 w-28">Ngày CT</th>
                <th className="p-3 w-28">Ngày HT</th>
                <th className="p-3">Diễn giải</th>
                <th className="p-3 text-right w-36">Tổng phát sinh</th>
                <th className="p-3 text-center w-32">Trạng thái</th>
                <th className="p-3 text-center w-20">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Không có chứng từ nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                filteredList.map((ct, idx) => {
                  const tongTien = ct.dinhKhoan.reduce((s, d) => s + (d.soTien || 0), 0);
                  return (
                    <tr
                      key={ct.id}
                      onClick={() => setEditingItem(ct)}
                      className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                    >
                      <td className="p-3 text-center font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="p-3 font-mono font-bold text-indigo-700">
                        {ct.soCt}
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {ct.ngayCt}
                      </td>
                      <td className="p-3 font-mono text-slate-900 font-bold">
                        {ct.ngayHachToan}
                      </td>
                      <td className="p-3 text-slate-800 font-medium">
                        {ct.dienGiai}
                      </td>
                      <td className="p-3 text-right font-mono font-extrabold text-slate-900">
                        {formatVnd(tongTien)} đ
                      </td>
                      <td className="p-3 text-center">
                        {ct.trangThai === 'DA_GHI_SO' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Đã ghi sổ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Chưa ghi sổ
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingItem(ct);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
