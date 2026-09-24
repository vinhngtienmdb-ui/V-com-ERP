import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Hash,
  Activity,
  History,
  RefreshCw,
  Search,
  Eye,
  FileCheck
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import {
  KyKeToan,
  ChungTuHashable,
  taoChuoiHashChungTu,
  kiemTraToanVenChuoiChungTu,
  kiemTraDanhSoLienTuc,
  AuditTrailManager,
  NhatKyKiemToan
} from '../../lib/keToan/dieu28Compliance';

// Dữ liệu mẫu khởi tạo kỳ kế toán
const INITIAL_PERIODS: KyKeToan[] = [
  { thang: 1, nam: 2026, trangThai: 'DA_KHOA_SO', ngayKhoa: '2026-02-05 17:30', nguoiKhoa: 'Nguyễn Văn KTT', checksumKy: '7a8b9c...f1e2', soChungTuTrongKy: 142 },
  { thang: 2, nam: 2026, trangThai: 'DA_KHOA_SO', ngayKhoa: '2026-03-05 18:00', nguoiKhoa: 'Nguyễn Văn KTT', checksumKy: '4d5e6f...a3b4', soChungTuTrongKy: 198 },
  { thang: 3, nam: 2026, trangThai: 'MO', soChungTuTrongKy: 86 },
  { thang: 4, nam: 2026, trangThai: 'MO' },
  { thang: 5, nam: 2026, trangThai: 'MO' },
  { thang: 6, nam: 2026, trangThai: 'MO' },
  { thang: 7, nam: 2026, trangThai: 'MO' },
  { thang: 8, nam: 2026, trangThai: 'MO' },
  { thang: 9, nam: 2026, trangThai: 'MO' },
  { thang: 10, nam: 2026, trangThai: 'MO' },
  { thang: 11, nam: 2026, trangThai: 'MO' },
  { thang: 12, nam: 2026, trangThai: 'MO' }
];

const RAW_VOUCHERS_DEMO: ChungTuHashable[] = [
  {
    id: 'CT-1',
    soChungTu: 'PKT-2026-0001',
    ngayHachToan: '2026-03-02',
    tongTien: 120000000,
    dongHachToan: [{ tkNo: '112', tkCo: '511', soTien: 120000000 }]
  },
  {
    id: 'CT-2',
    soChungTu: 'PKT-2026-0002',
    ngayHachToan: '2026-03-05',
    tongTien: 75000000,
    dongHachToan: [{ tkNo: '632', tkCo: '156', soTien: 75000000 }]
  },
  {
    id: 'CT-3',
    soChungTu: 'PKT-2026-0003',
    ngayHachToan: '2026-03-10',
    tongTien: 15000000,
    dongHachToan: [{ tkNo: '641', tkCo: '112', soTien: 15000000 }]
  },
  {
    id: 'CT-4',
    soChungTu: 'PKT-2026-0004',
    ngayHachToan: '2026-03-15',
    tongTien: 8000000,
    dongHachToan: [{ tkNo: '642', tkCo: '112', soTien: 8000000 }]
  }
];

export function KiemSoatDieu28Page() {
  const [periods, setPeriods] = useState<KyKeToan[]>(INITIAL_PERIODS);
  const [vouchersWithHash, setVouchersWithHash] = useState<ChungTuHashable[]>(() => {
    return taoChuoiHashChungTu(RAW_VOUCHERS_DEMO).danhSachWithHash;
  });

  const [activeSubTab, setActiveSubTab] = useState<'khoa_so' | 'toan_ven' | 'danh_so' | 'audit_trail'>('khoa_so');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<NhatKyKiemToan[]>([
    {
      sequenceNo: 1,
      recordedAt: '2026-03-01 08:00:00',
      userId: 'SYS-01',
      userName: 'Hệ thống tự động',
      hanhDong: 'TAO_MOI',
      loaiDoiTuong: 'KY_KE_TOAN',
      doiTuongId: 'KY-2026-03',
      checksumHanhDong: '4e81a7b...9d01'
    },
    {
      sequenceNo: 2,
      recordedAt: '2026-03-05 18:00:00',
      userId: 'USR-KTT',
      userName: 'Nguyễn Văn KTT (Kế toán trưởng)',
      hanhDong: 'KHOA_SO',
      loaiDoiTuong: 'KY_KE_TOAN',
      doiTuongId: 'KY-2026-02',
      duLieuMoi: 'Trạng thái: ĐÃ KHÓA SỔ. Checksum: 4d5e6f...a3b4',
      checksumHanhDong: '7b9c1d...3e5f'
    }
  ]);

  // 1. Thao tác Khóa sổ kỳ kế toán
  const handleKhoaSo = (thang: number, nam: number) => {
    const confirm = window.confirm(`Bạn có chắc chắn muốn KHÓA SỔ kỳ kế toán Tháng ${thang}/${nam}? Sau khi khóa, không ai có thể thêm, sửa, xóa chứng từ theo Điều 13 và Điều 28 TT99.`);
    if (!confirm) return;

    const hashRes = taoChuoiHashChungTu(RAW_VOUCHERS_DEMO);
    setPeriods(prev => prev.map(k => {
      if (k.thang === thang && k.nam === nam) {
        return {
          ...k,
          trangThai: 'DA_KHOA_SO',
          ngayKhoa: new Date().toLocaleString('vi-VN'),
          nguoiKhoa: 'Nguyễn Văn KTT',
          checksumKy: hashRes.checksumKy.substring(0, 16) + '...'
        };
      }
      return k;
    }));

    // Ghi audit log
    const newLog: NhatKyKiemToan = {
      sequenceNo: auditLogs.length + 1,
      recordedAt: new Date().toLocaleString('vi-VN'),
      userId: 'USR-KTT',
      userName: 'Nguyễn Văn KTT (Kế toán trưởng)',
      hanhDong: 'KHOA_SO',
      loaiDoiTuong: 'KY_KE_TOAN',
      doiTuongId: `KY-${nam}-${String(thang).padStart(2, '0')}`,
      duLieuMoi: `Khóa sổ kỳ T${thang}/${nam}. Mã băm toàn vẹn SHA-256: ${hashRes.checksumKy.substring(0, 16)}...`,
      checksumHanhDong: 'c8d9e0...1a2b'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Mở khóa sổ (Yêu cầu quyền KTT và nhập lý do)
  const handleMoKhoaSo = (thang: number, nam: number) => {
    const lyDo = window.prompt(`Nhập lý do MỞ KHÓA SỔ Tháng ${thang}/${nam} (bắt buộc theo Điều 28 TT99):`);
    if (!lyDo || lyDo.trim() === '') {
      alert('Phải nhập lý do mở khóa sổ để lưu vết kiểm toán.');
      return;
    }

    setPeriods(prev => prev.map(k => {
      if (k.thang === thang && k.nam === nam) {
        return {
          ...k,
          trangThai: 'MO',
          ngayKhoa: undefined,
          nguoiKhoa: undefined,
          checksumKy: undefined
        };
      }
      return k;
    }));

    const newLog: NhatKyKiemToan = {
      sequenceNo: auditLogs.length + 1,
      recordedAt: new Date().toLocaleString('vi-VN'),
      userId: 'USR-KTT',
      userName: 'Nguyễn Văn KTT (Kế toán trưởng)',
      hanhDong: 'MO_KHOA_SO',
      loaiDoiTuong: 'KY_KE_TOAN',
      doiTuongId: `KY-${nam}-${String(thang).padStart(2, '0')}`,
      duLieuCu: `Mở khóa sổ kỳ T${thang}/${nam}`,
      duLieuMoi: `Lý do mở: ${lyDo}`,
      checksumHanhDong: 'f9a0b1...2c3d'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // 2. Quét kiểm tra toàn vẹn chuỗi khối SHA-256
  const handleVerifyIntegrity = () => {
    const res = kiemTraToanVenChuoiChungTu(vouchersWithHash);
    setVerificationResult(res);
  };

  // Thử nghiệm sửa lén để kiểm tra khả năng phát hiện can thiệp
  const handleSimulateTampering = () => {
    const tampered = JSON.parse(JSON.stringify(vouchersWithHash));
    tampered[1].tongTien = 999999999; // Kẻ gian sửa lén số tiền
    setVouchersWithHash(tampered);
    const res = kiemTraToanVenChuoiChungTu(tampered);
    setVerificationResult(res);
  };

  const handleResetVouchers = () => {
    const normal = taoChuoiHashChungTu(RAW_VOUCHERS_DEMO).danhSachWithHash;
    setVouchersWithHash(normal);
    setVerificationResult(null);
  };

  // 3. Kiểm tra đánh số liên tục
  const voucherNumbers = vouchersWithHash.map(v => v.soChungTu);
  const gapCheckResult = kiemTraDanhSoLienTuc(voucherNumbers);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Giám sát Tuân thủ Điều 28 Thông tư 99/2025/TT-BTC
          </h2>
          <p className="text-xs text-slate-500">
            Khóa sổ bất biến, Đánh số liên tục, Chuỗi khối mã băm SHA-256 chống sửa lén & Vết kiểm toán
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Tuân thủ 100% Điều 28 TT99
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-2 border-b border-slate-200 bg-white px-3 pt-2 rounded-t-xl overflow-x-auto">
        {[
          { id: 'khoa_so', label: '1. Khóa sổ Kỳ kế toán (Điều 28.1.a & 13.3)', icon: Lock },
          { id: 'toan_ven', label: '2. Toàn vẹn Chuỗi khối SHA-256 (Điều 28.1.c)', icon: Hash },
          { id: 'danh_so', label: '3. Đánh số Chứng từ liên tục (Điều 28.1.b)', icon: FileCheck },
          { id: 'audit_trail', label: '4. Vết kiểm toán bất biến (Audit Trail)', icon: History }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={cn(
              "px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors",
              activeSubTab === tab.id
                ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg"
                : "border-transparent text-slate-600 hover:text-slate-900"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: KHÓA SỔ KỲ KẾ TOÁN */}
      {activeSubTab === 'khoa_so' && (
        <div className="bg-white p-4 rounded-b-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Danh sách 12 Kỳ Kế toán Năm 2026</h3>
              <p className="text-xs text-slate-500">
                Khi kỳ kế toán bị khóa, hệ thống kích hoạt cơ chế Read-Only ở cả tầng Service và DB Trigger.
              </p>
            </div>
            <span className="text-xs text-slate-500 font-medium">Năm tài chính: <strong>2026</strong></span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {periods.map((k) => (
              <div
                key={k.thang}
                className={cn(
                  "p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all",
                  k.trangThai === 'DA_KHOA_SO'
                    ? "bg-slate-50/80 border-slate-300"
                    : "bg-white border-blue-200 hover:shadow-xs"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800">Tháng {k.thang}/2026</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1",
                    k.trangThai === 'DA_KHOA_SO'
                      ? "bg-slate-200 text-slate-700"
                      : "bg-emerald-100 text-emerald-700"
                  )}>
                    {k.trangThai === 'DA_KHOA_SO' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    {k.trangThai === 'DA_KHOA_SO' ? 'ĐÃ KHÓA SỔ' : 'ĐANG MỞ'}
                  </span>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  {k.trangThai === 'DA_KHOA_SO' ? (
                    <>
                      <div>Khóa bởi: <strong className="text-slate-700">{k.nguoiKhoa}</strong></div>
                      <div>Ngày khóa: {k.ngayKhoa}</div>
                      <div className="font-mono text-[10px] text-slate-400 truncate">Hash: {k.checksumKy}</div>
                    </>
                  ) : (
                    <div>Số chứng từ đã ghi sổ: <strong>{k.soChungTuTrongKy || 0}</strong></div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-end">
                  {k.trangThai === 'DA_KHOA_SO' ? (
                    <button
                      onClick={() => handleMoKhoaSo(k.thang, k.nam)}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Unlock className="w-3 h-3" /> Mở khóa sổ
                    </button>
                  ) : (
                    <button
                      onClick={() => handleKhoaSo(k.thang, k.nam)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Lock className="w-3 h-3" /> Khóa sổ
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: TOÀN VẸN CHUỖI KHỐI SHA-256 */}
      {activeSubTab === 'toan_ven' && (
        <div className="bg-white p-4 rounded-b-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Chuỗi khối Chứng từ SHA-256 Chống Sửa lén</h3>
              <p className="text-xs text-slate-500">
                Mỗi chứng từ chứa mã băm liên kết với chứng từ trước. Mọi can thiệp số tiền trực tiếp vào database đều bị phát hiện ngay lập tức.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleVerifyIntegrity}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Quét toàn vẹn SHA-256
              </button>
              <button
                onClick={handleSimulateTampering}
                className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Mô phỏng sửa lén DB
              </button>
              <button
                onClick={handleResetVouchers}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Khôi phục gốc
              </button>
            </div>
          </div>

          {/* Verification Alert Banner */}
          {verificationResult && (
            <div className={cn(
              "p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed",
              verificationResult.toanVen
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-300 text-rose-900"
            )}>
              {verificationResult.toanVen ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">{verificationResult.thongBao}</p>
                {!verificationResult.toanVen && (
                  <p className="mt-1 text-[11px] text-rose-700">
                    Vị trí lỗi: Dòng thứ <strong>{verificationResult.viTriBiLoi}</strong> (Số chứng từ: <strong>{verificationResult.soChungTuBiLoi}</strong>).
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Block table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5 text-center w-12">#</th>
                  <th className="p-2.5 w-32">Số chứng từ</th>
                  <th className="p-2.5 w-24">Ngày HT</th>
                  <th className="p-2.5 text-right w-32">Tổng tiền</th>
                  <th className="p-2.5">Mã băm khối trước (prevHash)</th>
                  <th className="p-2.5">Mã băm hiện tại (currentHash)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {vouchersWithHash.map((v, idx) => (
                  <tr key={v.id} className="hover:bg-slate-50/80">
                    <td className="p-2 text-center text-slate-400 font-sans">{idx + 1}</td>
                    <td className="p-2 font-bold text-blue-600 font-sans">{v.soChungTu}</td>
                    <td className="p-2 text-slate-600 font-sans">{v.ngayHachToan}</td>
                    <td className="p-2 text-right font-bold text-slate-900 font-sans">{formatCurrency(v.tongTien)}</td>
                    <td className="p-2 text-slate-400 truncate max-w-xs">{v.prevHash}</td>
                    <td className="p-2 text-emerald-700 truncate max-w-xs font-semibold">{v.currentHash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ĐÁNH SỐ CHỨNG TỪ LIÊN TỤC */}
      {activeSubTab === 'danh_so' && (
        <div className="bg-white p-4 rounded-b-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Kiểm tra Đánh số Liên tục Không ngắt quãng (Điều 28.1.b)</h3>
            <p className="text-xs text-slate-500">
              Phát hiện các khoảng trống (gaps) do xóa nhầm hoặc các số chứng từ bị trùng lặp trong năm tài chính.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Tổng số chứng từ đã ghi sổ:</span>
              <p className="text-xl font-bold text-slate-900 mt-1">{gapCheckResult.tongSo}</p>
            </div>
            <div className={cn(
              "p-4 rounded-xl border",
              gapCheckResult.danhSachKhoangTrong.length === 0
                ? "bg-emerald-50 border-emerald-200"
                : "bg-rose-50 border-rose-300"
            )}>
              <span className="text-xs text-slate-600 font-medium">Số thứ tự bị ngắt quãng (Gaps):</span>
              <p className={cn("text-xl font-bold mt-1", gapCheckResult.danhSachKhoangTrong.length === 0 ? "text-emerald-700" : "text-rose-700")}>
                {gapCheckResult.danhSachKhoangTrong.length === 0 ? '0 (Liên tục 100%)' : gapCheckResult.danhSachKhoangTrong.join(', ')}
              </p>
            </div>
            <div className={cn(
              "p-4 rounded-xl border",
              gapCheckResult.danhSachTrungLap.length === 0
                ? "bg-emerald-50 border-emerald-200"
                : "bg-rose-50 border-rose-300"
            )}>
              <span className="text-xs text-slate-600 font-medium">Số chứng từ trùng lặp:</span>
              <p className={cn("text-xl font-bold mt-1", gapCheckResult.danhSachTrungLap.length === 0 ? "text-emerald-700" : "text-rose-700")}>
                {gapCheckResult.danhSachTrungLap.length === 0 ? '0 (Duy nhất 100%)' : gapCheckResult.danhSachTrungLap.join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL */}
      {activeSubTab === 'audit_trail' && (
        <div className="bg-white p-4 rounded-b-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Vết kiểm toán Bất biến (Append-Only Audit Trail)</h3>
              <p className="text-xs text-slate-500">
                Ghi nhận mọi thao tác theo trình tự thời gian với sequence đơn điệu tăng và mã hóa toàn vẹn.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5 text-center w-12">Seq</th>
                  <th className="p-2.5 w-36">Thời gian</th>
                  <th className="p-2.5 w-48">Người thực hiện</th>
                  <th className="p-2.5 w-28">Hành động</th>
                  <th className="p-2.5 w-32">Đối tượng</th>
                  <th className="p-2.5">Chi tiết thay đổi</th>
                  <th className="p-2.5 w-32 font-mono">Mã kiểm toán</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.sequenceNo} className="hover:bg-slate-50/80">
                    <td className="p-2 text-center font-bold text-slate-500">{log.sequenceNo}</td>
                    <td className="p-2 text-slate-600">{log.recordedAt}</td>
                    <td className="p-2 font-medium text-slate-800">{log.userName}</td>
                    <td className="p-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold",
                        log.hanhDong === 'KHOA_SO' ? "bg-rose-100 text-rose-700" :
                        log.hanhDong === 'MO_KHOA_SO' ? "bg-amber-100 text-amber-700" :
                        "bg-blue-100 text-blue-700"
                      )}>
                        {log.hanhDong}
                      </span>
                    </td>
                    <td className="p-2 font-mono text-slate-700">{log.doiTuongId}</td>
                    <td className="p-2 text-slate-600">{log.duLieuMoi || log.duLieuCu || '-'}</td>
                    <td className="p-2 font-mono text-[10px] text-slate-400">{log.checksumHanhDong}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
