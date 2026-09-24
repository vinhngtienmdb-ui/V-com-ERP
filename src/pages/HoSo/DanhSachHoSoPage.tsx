import React, { useState, useMemo, useEffect } from 'react';
import { 
  FolderPlus, Search, Filter, Calendar, AlertTriangle, CheckCircle2, 
  Clock, ShieldAlert, ArrowUpDown, ChevronRight, FileText, ExternalLink, Plus, Zap, Check
} from 'lucide-react';
import { SAMPLE_BO_HO_SO, BoHoSoItem, DANH_MUC_18_PHAN } from '../../data/danhMucHoSoData';
import { layDanhSachHoSoLuuTru, dongBoTatCaChungTuVaoHoSo, HO_SO_SYNC_EVENT } from '../../lib/keToan/autoArchiveService';

interface Props {
  onSelectHoSo: (hoSoId: string) => void;
}

export const DanhSachHoSoPage: React.FC<Props> = ({ onSelectHoSo }) => {
  const [hoSoList, setHoSoList] = useState<BoHoSoItem[]>(() => layDanhSachHoSoLuuTru());
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [selectedNam, setSelectedNam] = useState<number>(2026);
  const [selectedThang, setSelectedThang] = useState<string>('ALL');
  const [selectedPhan, setSelectedPhan] = useState<string>('ALL');
  const [selectedTrangThai, setSelectedTrangThai] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortAsc, setSortAsc] = useState<boolean>(true); // Strictly sorted by ngay_phat_sinh asc by default

  // Lắng nghe sự kiện đồng bộ tự động từ phân hệ Kế toán
  useEffect(() => {
    const handleUpdate = () => {
      setHoSoList(layDanhSachHoSoLuuTru());
    };
    window.addEventListener(HO_SO_SYNC_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(HO_SO_SYNC_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Xử lý tự động quét và đưa chứng từ kế toán vào Hồ sơ lưu trữ NĐ 174
  const handleAutoSyncFromAccounting = () => {
    // Lấy chứng từ mẫu thực tế phát sinh của VComm
    const sampleVouchers = [
      {
        id: 'ct-sync-01',
        tenantId: 'tenant-vcomm-prod-01',
        loaiCt: 'BAN' as const,
        soCt: 'HDB-2026-03-001',
        ngayCt: '2026-03-01',
        ngayHachToan: '2026-03-01',
        kyKeToan: '2026-03',
        dienGiai: 'Bán hàng điện thoại Flagship - Đơn hàng ORD-VC-88912',
        nguoiLapId: 'user-sales-01',
        trangThai: 'DA_GHI_SO' as const,
        thongTuApDung: 'TT99' as const,
        dinhKhoan: [
          { soDong: 1, dienGiai: 'Phải thu khách lẻ', tkNo: '131', tkCo: '511', soTien: 12500000, loaiTien: 'VND', tyGia: 1, soTienQuyDoi: 12500000, tenDoiTuong: 'Khách hàng vãng lai' },
          { soDong: 2, dienGiai: 'Thuế GTGT', tkNo: '131', tkCo: '3331', soTien: 1250000, loaiTien: 'VND', tyGia: 1, soTienQuyDoi: 1250000, tenDoiTuong: 'Khách hàng vãng lai' }
        ]
      },
      {
        id: 'ct-sync-02',
        tenantId: 'tenant-vcomm-prod-01',
        loaiCt: 'KHO' as const,
        soCt: 'XK-2026-03-001',
        ngayCt: '2026-03-01',
        ngayHachToan: '2026-03-01',
        kyKeToan: '2026-03',
        dienGiai: 'Xuất kho giá vốn đơn hàng ORD-VC-88912',
        nguoiLapId: 'user-wh-01',
        trangThai: 'DA_GHI_SO' as const,
        thongTuApDung: 'TT99' as const,
        dinhKhoan: [
          { soDong: 1, dienGiai: 'Giá vốn', tkNo: '632', tkCo: '156', soTien: 9800000, loaiTien: 'VND', tyGia: 1, soTienQuyDoi: 9800000 }
        ]
      },
      {
        id: 'ct-sync-03',
        tenantId: 'tenant-vcomm-prod-01',
        loaiCt: 'MUA' as const,
        soCt: 'HDM-2026-03-005',
        ngayCt: '2026-03-03',
        ngayHachToan: '2026-03-03',
        kyKeToan: '2026-03',
        dienGiai: 'Mua phụ kiện điện thoại NCC Tổng kho',
        nguoiLapId: 'user-proc-01',
        trangThai: 'DA_GHI_SO' as const,
        thongTuApDung: 'TT99' as const,
        dinhKhoan: [
          { soDong: 1, dienGiai: 'Nhập kho', tkNo: '156', tkCo: '331', soTien: 45000000, loaiTien: 'VND', tyGia: 1, soTienQuyDoi: 45000000, tenDoiTuong: 'Tổng kho Phân phối Phụ kiện Hà Nội' }
        ]
      },
      {
        id: 'ct-sync-04',
        tenantId: 'tenant-vcomm-prod-01',
        loaiCt: 'THU' as const,
        soCt: 'PT-2026-03-001',
        ngayCt: '2026-03-04',
        ngayHachToan: '2026-03-04',
        kyKeToan: '2026-03',
        dienGiai: 'Rút tiền gửi ngân hàng nhập quỹ tiền mặt',
        nguoiLapId: 'user-treasury-01',
        trangThai: 'DA_GHI_SO' as const,
        thongTuApDung: 'TT99' as const,
        dinhKhoan: [
          { soDong: 1, dienGiai: 'Thu tiền mặt', tkNo: '111', tkCo: '112', soTien: 20000000, loaiTien: 'VND', tyGia: 1, soTienQuyDoi: 20000000, tenDoiTuong: 'Ngân hàng Vietcombank' }
        ]
      }
    ];

    const result = dongBoTatCaChungTuVaoHoSo(sampleVouchers);
    setHoSoList(layDanhSachHoSoLuuTru());
    setSyncToast(`Đã tự động đưa ${result.addedCount + result.updatedCount} chứng từ kế toán vào các phần tương ứng của Hồ sơ lưu trữ theo NĐ 174!`);
    setTimeout(() => setSyncToast(null), 5000);
  };

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTenHoSo, setNewTenHoSo] = useState('');
  const [newMaLoai, setNewMaLoai] = useState('04');
  const [newNgayPS, setNewNgayPS] = useState('2026-03-08');
  const [newDoiTuong, setNewDoiTuong] = useState('');
  const [newHopDong, setNewHopDong] = useState('');

  // 4-Axis Filtering
  const filteredList = useMemo(() => {
    return hoSoList.filter(item => {
      const matchNam = selectedNam === 0 || item.nam === selectedNam;
      const matchThang = selectedThang === 'ALL' || item.thang.toString() === selectedThang;
      const matchPhan = selectedPhan === 'ALL' || item.maLoaiHoSo === selectedPhan;
      const matchStatus = selectedTrangThai === 'ALL' || item.trangThai === selectedTrangThai;
      const matchSearch = 
        item.soHoSo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tenHoSo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.doiTuongTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.hopDongSo && item.hopDongSo.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchNam && matchThang && matchPhan && matchStatus && matchSearch;
    }).sort((a, b) => {
      const cmp = a.ngayPhatSinh.localeCompare(b.ngayPhatSinh);
      return sortAsc ? cmp : -cmp;
    });
  }, [hoSoList, selectedNam, selectedThang, selectedPhan, selectedTrangThai, searchTerm, sortAsc]);

  // 5 KPI summary metrics
  const kpi = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let tong = hoSoList.length;
    let daDu = 0;
    let conThieu = 0;
    let chuaLuu = 0;
    let quaHan = 0;

    hoSoList.forEach(item => {
      if (item.tyLeDayDu >= 100) daDu++;
      else conThieu++;

      if (item.trangThai !== 'DA_LUU_TRU' && item.trangThai !== 'DA_TIEU_HUY') chuaLuu++;
      if (item.trangThai !== 'DA_LUU_TRU' && item.hanDuaVaoLuuTru < today) quaHan++;
    });

    return { tong, daDu, conThieu, chuaLuu, quaHan };
  }, [hoSoList]);

  const handleCreateHoSo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenHoSo.trim()) return;

    const newId = `hs-${Date.now()}`;
    const year = parseInt(newNgayPS.split('-')[0]) || 2026;
    const month = parseInt(newNgayPS.split('-')[1]) || 3;
    const codeSeq = String(hoSoList.length + 1).padStart(4, '0');
    const soHoSo = `HS-${year}-${String(month).padStart(2, '0')}-${codeSeq}`;

    const newRecord: BoHoSoItem = {
      id: newId,
      soHoSo,
      tenHoSo: newTenHoSo,
      maLoaiHoSo: newMaLoai,
      phanLoai: `${newMaLoai} ${DANH_MUC_18_PHAN.find(p => p.ma === newMaLoai)?.ten || ''}`,
      kyKeToan: String(year),
      nam: year,
      thang: month,
      ngayPhatSinh: newNgayPS,
      hanDuaVaoLuuTru: `${year + 1}-12-31`,
      doiTuongTen: newDoiTuong || 'Chưa xác định',
      hopDongSo: newHopDong,
      hinhThucLuuTru: 'DIEN_TU',
      thoiHanLuuTru: 'NAM_10',
      tyLeDayDu: 25,
      trangThai: 'DANG_MO',
      tongGiaTri: 0,
      thanhPhan: [
        { id: `tp-${Date.now()}-1`, maLoaiHoSo: `${newMaLoai}.1.01`, tenThanhPhan: 'Hóa đơn / Chứng từ gốc', batBuoc: true, nguon: 'KE_TOAN', daCo: false },
        { id: `tp-${Date.now()}-2`, maLoaiHoSo: `${newMaLoai}.2.01`, tenThanhPhan: 'Biên bản / Phiếu xuất/nhập', batBuoc: true, nguon: 'ERP', daCo: false },
      ],
      lichSu: [
        {
          id: `ls-${Date.now()}`,
          thoiDiem: new Date().toLocaleString('vi-VN'),
          hanhDong: 'TAO',
          nguoiThucHien: 'Kế toán viên',
          vaiTro: 'ACCOUNTANT',
          moTa: `Khởi tạo bộ hồ sơ ${soHoSo}`
        }
      ]
    };

    setHoSoList([newRecord, ...hoSoList]);
    setShowCreateModal(false);
    setNewTenHoSo('');
    setNewDoiTuong('');
    setNewHopDong('');
    onSelectHoSo(newId);
  };

  const getStatusBadge = (tt: string) => {
    switch (tt) {
      case 'DA_DU':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> Đã đủ</span>;
      case 'DANG_MO':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"><AlertTriangle className="w-3 h-3" /> Đang mở</span>;
      case 'DA_LUU_TRU':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200"><Clock className="w-3 h-3" /> Đã lưu trữ</span>;
      case 'DA_TIEU_HUY':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Đã tiêu hủy</span>;
      default:
        return <span>{tt}</span>;
    }
  };

  const getProgressColor = (tyLe: number) => {
    if (tyLe >= 100) return 'bg-emerald-500 text-emerald-700';
    if (tyLe >= 50) return 'bg-amber-500 text-amber-700';
    return 'bg-rose-500 text-rose-700';
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </span>
            Danh sách Bộ hồ sơ – Lưu trữ kế toán
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tuân thủ NĐ 174 Điều 9: Sắp xếp theo trình tự thời gian phát sinh & kỳ kế toán năm.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAutoSyncFromAccounting}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors cursor-pointer"
            title="Tự động đồng bộ và gom các chứng từ từ Nhật ký chung vào 18 Phần Hồ sơ theo NĐ 174"
          >
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Tự động thêm chứng từ vào Hồ sơ lưu trữ</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tạo bộ hồ sơ mới
          </button>
        </div>
      </div>

      {/* Sync Notification Banner */}
      {syncToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-in fade-in">
          <div className="flex items-center gap-2 font-semibold">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{syncToast}</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
            Nghị định 174/2016/NĐ-CP • Điều 28 TT99
          </span>
        </div>
      )}

      {/* Axis Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Năm:</span>
            <select
              value={selectedNam}
              onChange={(e) => setSelectedNam(Number(e.target.value))}
              className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
              <option value={2015}>2015 (Cũ)</option>
              <option value={0}>Tất cả năm</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Tháng:</span>
            <select
              value={selectedThang}
              onChange={(e) => setSelectedThang(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white"
            >
              <option value="ALL">Tất cả tháng</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m.toString()}>Tháng {m < 10 ? `0${m}` : m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Phần:</span>
            <select
              value={selectedPhan}
              onChange={(e) => setSelectedPhan(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white max-w-[200px] truncate"
            >
              <option value="ALL">Tất cả 18 phần</option>
              {DANH_MUC_18_PHAN.map(p => (
                <option key={p.ma} value={p.ma}>{p.ma} — {p.ten}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Trạng thái:</span>
            <select
              value={selectedTrangThai}
              onChange={(e) => setSelectedTrangThai(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="DANG_MO">Đang mở</option>
              <option value="DA_DU">Đã đủ thành phần</option>
              <option value="DA_LUU_TRU">Đã đưa vào lưu trữ</option>
              <option value="DA_TIEU_HUY">Đã tiêu hủy</option>
            </select>
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo số hồ sơ, đối tượng, hợp đồng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 5 KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Tổng hồ sơ</span>
          <span className="text-2xl font-black text-slate-900">{kpi.tong}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block mb-1">Đã đủ 100%</span>
          <span className="text-2xl font-black text-emerald-600">{kpi.daDu}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-xs">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block mb-1">Còn thiếu</span>
          <span className="text-2xl font-black text-amber-600">{kpi.conThieu}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-1">Chưa lưu kho</span>
          <span className="text-2xl font-black text-blue-600">{kpi.chuaLuu}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/30 shadow-xs">
          <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider block mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            Quá hạn lưu trữ
          </span>
          <span className="text-2xl font-black text-rose-600">{kpi.quaHan}</span>
        </div>
      </div>

      {/* Main Table: Ordered strictly by ngay_phat_sinh asc */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Số hồ sơ</th>
                <th className="py-3 px-4">
                  <button
                    onClick={() => setSortAsc(!sortAsc)}
                    className="flex items-center gap-1 hover:text-indigo-600"
                    title="NĐ 174 Đ.9: Bắt buộc sắp xếp theo thời gian phát sinh"
                  >
                    Ngày phát sinh
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-4">Phần</th>
                <th className="py-3 px-4">Tên bộ hồ sơ</th>
                <th className="py-3 px-4">Đối tượng</th>
                <th className="py-3 px-4">Tiến độ đầy đủ</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((item) => {
                const today = new Date().toISOString().split('T')[0];
                const isOverdue = item.trangThai !== 'DA_LUU_TRU' && item.hanDuaVaoLuuTru < today;

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectHoSo(item.id)}
                    className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${isOverdue ? 'bg-rose-50/40' : ''}`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                      {item.soHoSo}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.ngayPhatSinh}</span>
                        {isOverdue && (
                          <span title="Đã quá 12 tháng chưa đưa vào lưu trữ (Luật KT Đ.41)">
                            <Clock className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 font-mono font-semibold text-slate-700 rounded text-[11px]">
                        {item.maLoaiHoSo}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.tenHoSo}</div>
                      {item.hopDongSo && (
                        <div className="text-[11px] text-slate-500 font-mono">HĐ: {item.hopDongSo}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-[180px] truncate">
                      {item.doiTuongTen}
                    </td>
                    <td className="py-3 px-4 min-w-[130px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-bold">{item.tyLeDayDu}%</span>
                          <span className="text-slate-400 text-[10px]">{item.thanhPhan.filter(t => t.daCo).length}/{item.thanhPhan.length} t/p</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getProgressColor(item.tyLeDayDu).split(' ')[0]}`}
                            style={{ width: `${item.tyLeDayDu}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(item.trangThai)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectHoSo(item.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Không tìm thấy bộ hồ sơ nào khớp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Khởi tạo bộ hồ sơ mới</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateHoSo} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên bộ hồ sơ *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hồ sơ mua vật tư dự án A..."
                  value={newTenHoSo}
                  onChange={(e) => setNewTenHoSo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phân loại (18 phần) *</label>
                  <select
                    value={newMaLoai}
                    onChange={(e) => setNewMaLoai(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {DANH_MUC_18_PHAN.map(p => (
                      <option key={p.ma} value={p.ma}>{p.ma} — {p.ten}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ngày phát sinh * (Trục gốc NĐ 174)
                  </label>
                  <input
                    type="date"
                    required
                    value={newNgayPS}
                    onChange={(e) => setNewNgayPS(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Đối tượng (Khách hàng / NCC / Nhân viên)</label>
                <input
                  type="text"
                  placeholder="VD: Công ty TNHH Nam Việt"
                  value={newDoiTuong}
                  onChange={(e) => setNewDoiTuong(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số hợp đồng liên kết (nếu có)</label>
                <input
                  type="text"
                  placeholder="VD: HĐKT-2026/01"
                  value={newHopDong}
                  onChange={(e) => setNewHopDong(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px]">
                💡 Hồ sơ tạo ra sẽ tự động sinh checklist thành phần tương ứng và hạn đưa vào lưu trữ theo Luật Kế toán 2015 Điều 41.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
                >
                  Tạo hồ sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
