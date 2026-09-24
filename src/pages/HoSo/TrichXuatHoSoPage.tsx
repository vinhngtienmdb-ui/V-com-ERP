import React, { useState, useMemo } from 'react';
import { Download, FileSpreadsheet, FileArchive, Search, Filter, Calendar, FolderTree, ChevronRight, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

export type MucThoiGian = 'NGAY' | 'TUAN' | 'THANG' | 'QUY' | 'BAN_NIEN' | 'NAM';

interface HangTrichXuat {
  mucThoiGian: string; // '2026-03-01', '2026-W10', '2026-03', '2026-Q1', '2026-H1', '2026'
  kyBatDau: string;
  kyKetThuc: string;
  maLoai: string;
  tenLoai: string;
  soHoSo: number;
  soThanhPhan: number;
  soChungTu: number;
  soTaiLieu: number;
  soThieu: number;
  tongGiaTri: number;
  tyLeDayDuTb: number;
}

// Sample aggregated dataset matching fn_trich_xuat_ho_so
const SAMPLE_RECORDS: Record<MucThoiGian, HangTrichXuat[]> = {
  NGAY: [
    { mucThoiGian: '2026-03-01', kyBatDau: '2026-03-01', kyKetThuc: '2026-03-01', maLoai: '04', tenLoai: 'Hóa đơn đầu vào', soHoSo: 12, soThanhPhan: 68, soChungTu: 52, soTaiLieu: 16, soThieu: 1, tongGiaTri: 380000000, tyLeDayDuTb: 98.5 },
    { mucThoiGian: '2026-03-02', kyBatDau: '2026-03-02', kyKetThuc: '2026-03-02', maLoai: '05', tenLoai: 'Hóa đơn đầu ra', soHoSo: 18, soThanhPhan: 94, soChungTu: 80, soTaiLieu: 14, soThieu: 2, tongGiaTri: 560000000, tyLeDayDuTb: 97.2 },
    { mucThoiGian: '2026-03-03', kyBatDau: '2026-03-03', kyKetThuc: '2026-03-03', maLoai: '03', tenLoai: 'Tiền mặt & Ngân hàng', soHoSo: 8, soThanhPhan: 36, soChungTu: 30, soTaiLieu: 6, soThieu: 0, tongGiaTri: 220000000, tyLeDayDuTb: 100.0 },
    { mucThoiGian: '2026-03-04', kyBatDau: '2026-03-04', kyKetThuc: '2026-03-04', maLoai: '04', tenLoai: 'Hóa đơn đầu vào', soHoSo: 14, soThanhPhan: 72, soChungTu: 58, soTaiLieu: 14, soThieu: 3, tongGiaTri: 420000000, tyLeDayDuTb: 95.8 },
  ],
  TUAN: [
    { mucThoiGian: '2026-W09', kyBatDau: '2026-02-23', kyKetThuc: '2026-03-01', maLoai: '04', tenLoai: 'Hóa đơn đầu vào', soHoSo: 45, soThanhPhan: 240, soChungTu: 190, soTaiLieu: 50, soThieu: 5, tongGiaTri: 1250000000, tyLeDayDuTb: 97.8 },
    { mucThoiGian: '2026-W10', kyBatDau: '2026-03-02', kyKetThuc: '2026-03-08', maLoai: '04', tenLoai: 'Hóa đơn đầu vào', soHoSo: 52, soThanhPhan: 285, soChungTu: 230, soTaiLieu: 55, soThieu: 4, tongGiaTri: 1680000000, tyLeDayDuTb: 98.6 },
    { mucThoiGian: '2026-W11', kyBatDau: '2026-03-09', kyKetThuc: '2026-03-15', maLoai: '05', tenLoai: 'Hóa đơn đầu ra', soHoSo: 48, soThanhPhan: 260, soChungTu: 215, soTaiLieu: 45, soThieu: 6, tongGiaTri: 1420000000, tyLeDayDuTb: 97.4 },
  ],
  THANG: [
    { mucThoiGian: '2026-01', kyBatDau: '2026-01-01', kyKetThuc: '2026-01-31', maLoai: '04', tenLoai: 'Hóa đơn đầu vào', soHoSo: 118, soThanhPhan: 642, soChungTu: 511, soTaiLieu: 131, soThieu: 14, tongGiaTri: 3240000000, tyLeDayDuTb: 96.4 },
    { mucThoiGian: '2026-02', kyBatDau: '2026-02-01', kyKetThuc: '2026-02-28', maLoai: '04', tenLoai: 'Hóa đơn đầu vào', soHoSo: 94, soThanhPhan: 508, soChungTu: 402, soTaiLieu: 106, soThieu: 21, tongGiaTri: 2118500000, tyLeDayDuTb: 95.8 },
    { mucThoiGian: '2026-03', kyBatDau: '2026-03-01', kyKetThuc: '2026-03-31', maLoai: '04', tenLoai: 'Hóa đơn đầu vào', soHoSo: 127, soThanhPhan: 701, soChungTu: 560, soTaiLieu: 141, soThieu: 9, tongGiaTri: 4005750000, tyLeDayDuTb: 98.7 },
  ],
  QUY: [
    { mucThoiGian: '2026-Q1', kyBatDau: '2026-01-01', kyKetThuc: '2026-03-31', maLoai: '04', tenLoai: 'Hóa đơn đầu vào', soHoSo: 339, soThanhPhan: 1851, soChungTu: 1473, soTaiLieu: 378, soThieu: 44, tongGiaTri: 9364250000, tyLeDayDuTb: 97.0 },
    { mucThoiGian: '2026-Q2', kyBatDau: '2026-04-01', kyKetThuc: '2026-06-30', maLoai: '04', tenLoai: 'Hóa đơn đầu vào', soHoSo: 312, soThanhPhan: 1720, soChungTu: 1380, soTaiLieu: 340, soThieu: 38, tongGiaTri: 8750000000, tyLeDayDuTb: 97.6 },
  ],
  BAN_NIEN: [
    { mucThoiGian: '2026-H1', kyBatDau: '2026-01-01', kyKetThuc: '2026-06-30', maLoai: '04', tenLoai: 'Hóa đơn đầu vào', soHoSo: 651, soThanhPhan: 3571, soChungTu: 2853, soTaiLieu: 718, soThieu: 82, tongGiaTri: 18114250000, tyLeDayDuTb: 97.3 },
  ],
  NAM: [
    { mucThoiGian: '2025', kyBatDau: '2025-01-01', kyKetThuc: '2025-12-31', maLoai: '04', tenLoai: 'Hóa đơn đầu vào', soHoSo: 1150, soThanhPhan: 6200, soChungTu: 4950, soTaiLieu: 1250, soThieu: 160, tongGiaTri: 31200000000, tyLeDayDuTb: 97.1 },
    { mucThoiGian: '2026', kyBatDau: '2026-01-01', kyKetThuc: '2026-12-31', maLoai: '04', tenLoai: 'Hóa đơn đầu vào', soHoSo: 1284, soThanhPhan: 6980, soChungTu: 5540, soTaiLieu: 1440, soThieu: 182, tongGiaTri: 34512000000, tyLeDayDuTb: 97.4 },
  ]
};

export const TrichXuatHoSoPage: React.FC = () => {
  const [mucThoiGian, setMucThoiGian] = useState<MucThoiGian>('THANG');
  const [selectedNam, setSelectedNam] = useState<number>(2026);
  const [selectedPhan, setSelectedPhan] = useState<string>('ALL');
  const [onlyBatBuoc, setOnlyBatBuoc] = useState<boolean>(false);
  const [onlyThieu, setOnlyThieu] = useState<boolean>(false);
  const [selectedRow, setSelectedRow] = useState<HangTrichXuat | null>(null);

  const displayData = useMemo(() => {
    let rows = SAMPLE_RECORDS[mucThoiGian] || [];
    if (selectedPhan !== 'ALL') {
      rows = rows.filter(r => r.maLoai === selectedPhan);
    }
    if (onlyThieu) {
      rows = rows.filter(r => r.soThieu > 0);
    }
    return rows;
  }, [mucThoiGian, selectedPhan, onlyThieu]);

  const summary = useMemo(() => {
    return displayData.reduce(
      (acc, r) => ({
        soHoSo: acc.soHoSo + r.soHoSo,
        soThanhPhan: acc.soThanhPhan + r.soThanhPhan,
        soChungTu: acc.soChungTu + r.soChungTu,
        soTaiLieu: acc.soTaiLieu + r.soTaiLieu,
        soThieu: acc.soThieu + r.soThieu,
        tongGiaTri: acc.tongGiaTri + r.tongGiaTri
      }),
      { soHoSo: 0, soThanhPhan: 0, soChungTu: 0, soTaiLieu: 0, soThieu: 0, tongGiaTri: 0 }
    );
  }, [displayData]);

  const formatVnd = (val: number) => new Intl.NumberFormat('vi-VN').format(val);

  const handleExportZip = () => {
    alert(`Đã xuất gói hồ sơ ZIP nộp cơ quan thuế: VCOMM_${selectedNam}_${mucThoiGian}.zip cấu trúc theo NĐ 174 Điều 9!`);
  };

  const handleExportExcel = () => {
    alert(`Đã xuất bảng kê trích xuất ${mucThoiGian} ra file Excel thành công!`);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold text-slate-900">
              Trích xuất Hồ sơ Kế toán Đa mức Thời gian
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
              NĐ 174/2016 • TT99 Điều 28.1.d
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Nguyên tắc <strong>"Một trục thời gian, Sáu phép cắt"</strong> — trích xuất đầy đủ, phân bổ theo Ngày, Tuần, Tháng, Quý, Bán niên, Năm từ cùng một nguồn chân lý duy nhất.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>
          <button
            type="button"
            onClick={handleExportZip}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <FileArchive className="w-4 h-4" />
            <span>Gói ZIP Nộp Thuế</span>
          </button>
        </div>
      </div>

      {/* 6 Tabs Mức Thời Gian */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-bold">
          <span className="px-3 text-slate-400 uppercase text-[11px] font-semibold tracking-wider flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Phân bổ theo:</span>
          </span>
          {[
            { id: 'NGAY', label: 'Ngày' },
            { id: 'TUAN', label: 'Tuần' },
            { id: 'THANG', label: 'Tháng' },
            { id: 'QUY', label: 'Quý' },
            { id: 'BAN_NIEN', label: 'Bán niên' },
            { id: 'NAM', label: 'Năm' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setMucThoiGian(tab.id as MucThoiGian);
                setSelectedRow(null);
              }}
              className={`px-4 py-2 rounded-xl transition-all ${
                mucThoiGian === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs font-extrabold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-[11px] text-slate-400 font-mono hidden md:block pr-3">
          Gọi API: <span className="font-bold text-indigo-700">/api/ho-so/trich-xuat?muc_thoi_gian={mucThoiGian}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Năm tài chính:</span>
            <select
              value={selectedNam}
              onChange={(e) => setSelectedNam(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-indigo-700 bg-white"
            >
              <option value={2026}>2026 (TT99)</option>
              <option value={2025}>2025 (TT200)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Phần hồ sơ:</span>
            <select
              value={selectedPhan}
              onChange={(e) => setSelectedPhan(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold bg-white"
            >
              <option value="ALL">Tất cả 18 phần</option>
              <option value="01">01 - Pháp lý doanh nghiệp</option>
              <option value="02">02 - Sổ sách kế toán TT99</option>
              <option value="03">03 - Tiền mặt & Ngân hàng</option>
              <option value="04">04 - Hóa đơn đầu vào (Mua hàng)</option>
              <option value="05">05 - Hóa đơn đầu ra (Bán hàng)</option>
              <option value="07">07 - Hàng tồn kho & Kho</option>
              <option value="08">08 - TSCĐ, CCDC, Trả trước</option>
              <option value="09">09 - Tiền lương & BHXH</option>
              <option value="10">10 - Hồ sơ Thuế</option>
              <option value="11">11 - BCTC & Quyết toán năm</option>
              <option value="18">18 - Hợp đồng kinh tế</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={onlyThieu}
              onChange={(e) => setOnlyThieu(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600"
            />
            <span>Chỉ hồ sơ còn thiếu thành phần</span>
          </label>
        </div>

        <div className="text-[11px] text-slate-500 font-medium">
          Hiển thị <strong>{displayData.length}</strong> chu kỳ phân bổ
        </div>
      </div>

      {/* Main Aggregated Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="p-3 w-32">Kỳ phân bổ</th>
                <th className="p-3 w-40">Phần hồ sơ</th>
                <th className="p-3 text-right w-24">Bộ hồ sơ</th>
                <th className="p-3 text-right w-28">Thành phần</th>
                <th className="p-3 text-right w-24">Chứng từ</th>
                <th className="p-3 text-right w-24">Tài liệu</th>
                <th className="p-3 text-right w-20 text-rose-600">Thiếu</th>
                <th className="p-3 text-right w-36">Tổng giá trị</th>
                <th className="p-3 text-center w-24">Đầy đủ</th>
                <th className="p-3 text-center w-16">Xem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayData.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => setSelectedRow(row)}
                  className={`hover:bg-indigo-50/40 cursor-pointer transition-colors ${
                    selectedRow?.mucThoiGian === row.mucThoiGian ? 'bg-indigo-50/70 font-semibold' : ''
                  }`}
                >
                  <td className="p-3 font-mono font-bold text-indigo-900">
                    {row.mucThoiGian}
                  </td>
                  <td className="p-3 text-slate-700">
                    <span className="font-mono text-slate-400 font-bold mr-1">{row.maLoai}</span>
                    <span>{row.tenLoai}</span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-800">
                    {row.soHoSo}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-700">
                    {row.soThanhPhan}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-700">
                    {row.soChungTu}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-700">
                    {row.soTaiLieu}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-rose-600">
                    {row.soThieu > 0 ? row.soThieu : '-'}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    {formatVnd(row.tongGiaTri)} đ
                  </td>
                  <td className="p-3 text-center font-mono">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      row.tyLeDayDuTb >= 98
                        ? 'bg-emerald-100 text-emerald-800'
                        : row.tyLeDayDuTb >= 90
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {row.tyLeDayDuTb}%
                    </span>
                  </td>
                  <td className="p-3 text-center text-slate-400 hover:text-indigo-600">
                    <ChevronRight className="w-4 h-4 mx-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Total Footer Row */}
            <tfoot>
              <tr className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-xs text-slate-900">
                <td colSpan={2} className="p-3 uppercase">
                  TỔNG CỘNG ({mucThoiGian})
                </td>
                <td className="p-3 text-right font-mono font-extrabold text-indigo-900">
                  {summary.soHoSo}
                </td>
                <td className="p-3 text-right font-mono font-extrabold">
                  {summary.soThanhPhan}
                </td>
                <td className="p-3 text-right font-mono font-extrabold">
                  {summary.soChungTu}
                </td>
                <td className="p-3 text-right font-mono font-extrabold">
                  {summary.soTaiLieu}
                </td>
                <td className="p-3 text-right font-mono font-extrabold text-rose-600">
                  {summary.soThieu}
                </td>
                <td className="p-3 text-right font-mono font-extrabold text-indigo-900">
                  {formatVnd(summary.tongGiaTri)} đ
                </td>
                <td className="p-3 text-center font-mono font-extrabold text-emerald-700">
                  {displayData.length > 0 ? Math.round(displayData.reduce((s, r) => s + r.tyLeDayDuTb, 0) / displayData.length) : 0}%
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Drill-down Section if Row Selected */}
      {selectedRow && (
        <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-indigo-900 flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-indigo-600" />
              <span>Drill-down Chi tiết Thành phần cho kỳ: <span className="font-mono text-sm underline">{selectedRow.mucThoiGian}</span> ({selectedRow.tenLoai})</span>
            </h3>
            <button
              type="button"
              onClick={() => setSelectedRow(null)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Đóng chi tiết
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700">04.1.01 Hóa đơn GTGT đầu vào</span>
              <div className="text-[11px] text-slate-500 mt-1">Đã có 52 hóa đơn XML/PDF gốc đính kèm</div>
              <div className="text-emerald-600 font-bold mt-1 text-[11px]">✓ 100% Đầy đủ</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700">04.1.03 Biên bản giao nhận hàng</span>
              <div className="text-[11px] text-slate-500 mt-1">16 biên bản giao nhận có chữ ký người nhận</div>
              <div className="text-emerald-600 font-bold mt-1 text-[11px]">✓ 100% Đầy đủ</div>
            </div>
            <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-200">
              <span className="font-bold text-rose-900">04.3.01 Chứng từ thanh toán ngân hàng (≥ 5 triệu)</span>
              <div className="text-[11px] text-rose-700 mt-1">Thiếu 1 Ủy nhiệm chi chuyển khoản qua ngân hàng</div>
              <div className="text-rose-600 font-bold mt-1 text-[11px]">⚠ Còn thiếu (Cần bổ sung)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
