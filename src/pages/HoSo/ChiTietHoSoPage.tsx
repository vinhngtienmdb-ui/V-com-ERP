import React, { useState } from 'react';
import { 
  ArrowLeft, Paperclip, UploadCloud, CheckCircle2, Clock, 
  ShieldCheck, FileText, Printer, Package, Star, AlertTriangle, 
  Trash2, Plus, ExternalLink, Calendar, User, Eye
} from 'lucide-react';
import { SAMPLE_BO_HO_SO, BoHoSoItem, ThanhPhanHoSoItem, LichSuHoSoItem } from '../../data/danhMucHoSoData';
import { formatDateVN, formatMonthVN } from '../../lib/keToan/dateUtils';
import { useDocumentPreview } from '../../components/document-viewer';

interface Props {
  hoSoId: string;
  onBack: () => void;
}

export const ChiTietHoSoPage: React.FC<Props> = ({ hoSoId, onBack }) => {
  const { openPreview, openDrawer } = useDocumentPreview();
  const [hoSo, setHoSo] = useState<BoHoSoItem>(() => {
    return SAMPLE_BO_HO_SO.find(h => h.id === hoSoId) || SAMPLE_BO_HO_SO[0];
  });

  // Modal: Đánh dấu Vĩnh viễn (Chỉ Giám đốc/Đại diện pháp luật - NĐ 174 Đ.14.2)
  const [showVinhVienModal, setShowVinhVienModal] = useState<boolean>(false);
  const [lyDoVinhVien, setLyDoVinhVien] = useState<string>('');
  const [canCuVinhVien, setCanCuVinhVien] = useState<string>('NĐ 174/2016/NĐ-CP Điều 14 khoản 2');

  // Modal: Gắn chứng từ / tài liệu
  const [showAttachModal, setShowAttachModal] = useState<boolean>(false);
  const [selectedThanhPhan, setSelectedThanhPhan] = useState<ThanhPhanHoSoItem | null>(null);
  const [attachSoHieu, setAttachSoHieu] = useState<string>('');
  const [attachTenFile, setAttachTenFile] = useState<string>('');

  const recalculateProgress = (thanhPhans: ThanhPhanHoSoItem[]) => {
    const batBuocs = thanhPhans.filter(t => t.batBuoc);
    if (batBuocs.length === 0) return 100;
    const co = batBuocs.filter(t => t.daCo).length;
    return Math.round((co / batBuocs.length) * 100);
  };

  const handleAttachSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThanhPhan || !attachSoHieu) return;

    const updatedThanhPhan = hoSo.thanhPhan.map(tp => {
      if (tp.id === selectedThanhPhan.id) {
        return {
          ...tp,
          soHieu: attachSoHieu,
          tenTaiLieu: attachTenFile || `${attachSoHieu}.pdf`,
          daCo: true,
          ngayDinhKem: new Date().toISOString().split('T')[0]
        };
      }
      return tp;
    });

    const newProgress = recalculateProgress(updatedThanhPhan);
    const newLichSu: LichSuHoSoItem = {
      id: `ls-${Date.now()}`,
      thoiDiem: new Date().toLocaleString('vi-VN'),
      hanhDong: selectedThanhPhan.nguon === 'KE_TOAN' ? 'GAN_CHUNG_TU' : 'GAN_TAI_LIEU',
      nguoiThucHien: 'Minh (Kế toán)',
      vaiTro: 'ACCOUNTANT',
      moTa: `Gắn ${attachSoHieu} vào thành phần ${selectedThanhPhan.tenThanhPhan}`
    };

    setHoSo({
      ...hoSo,
      thanhPhan: updatedThanhPhan,
      tyLeDayDu: newProgress,
      trangThai: newProgress >= 100 ? 'DA_DU' : 'DANG_MO',
      lichSu: [newLichSu, ...hoSo.lichSu]
    });

    setShowAttachModal(false);
    setSelectedThanhPhan(null);
    setAttachSoHieu('');
    setAttachTenFile('');
  };

  const handleRemoveThanhPhan = (tpId: string) => {
    const tp = hoSo.thanhPhan.find(t => t.id === tpId);
    if (!tp || !tp.daCo) return;

    if (!confirm(`Bạn có chắc chắn muốn gỡ tài liệu khỏi thành phần "${tp.tenThanhPhan}"?`)) return;

    const updatedThanhPhan = hoSo.thanhPhan.map(t => {
      if (t.id === tpId) {
        return { ...t, soHieu: undefined, tenTaiLieu: undefined, daCo: false, ngayDinhKem: undefined };
      }
      return t;
    });

    const newProgress = recalculateProgress(updatedThanhPhan);
    const newLichSu: LichSuHoSoItem = {
      id: `ls-${Date.now()}`,
      thoiDiem: new Date().toLocaleString('vi-VN'),
      hanhDong: 'GO_THANH_PHAN',
      nguoiThucHien: 'Minh (Kế toán)',
      vaiTro: 'ACCOUNTANT',
      moTa: `Gỡ bỏ tài liệu khỏi thành phần ${tp.tenThanhPhan}`
    };

    setHoSo({
      ...hoSo,
      thanhPhan: updatedThanhPhan,
      tyLeDayDu: newProgress,
      trangThai: newProgress >= 100 ? 'DA_DU' : 'DANG_MO',
      lichSu: [newLichSu, ...hoSo.lichSu]
    });
  };

  const handleMarkDayDu = () => {
    if (hoSo.tyLeDayDu < 100) {
      alert('Chưa thể đánh dấu Đầy đủ vì chưa đạt 100% các thành phần bắt buộc!');
      return;
    }
    const newLichSu: LichSuHoSoItem = {
      id: `ls-${Date.now()}`,
      thoiDiem: new Date().toLocaleString('vi-VN'),
      hanhDong: 'DANH_DAU_DAY_DU',
      nguoiThucHien: 'Kế toán trưởng',
      vaiTro: 'CHIEF_ACCOUNTANT',
      moTa: 'Phê duyệt đánh dấu bộ hồ sơ đã hoàn thành đầy đủ'
    };
    setHoSo({
      ...hoSo,
      trangThai: 'DA_DU',
      lichSu: [newLichSu, ...hoSo.lichSu]
    });
    alert('Đã cập nhật trạng thái bộ hồ sơ thành: ĐÃ ĐỦ');
  };

  const handleLuuKho = () => {
    const newLichSu: LichSuHoSoItem = {
      id: `ls-${Date.now()}`,
      thoiDiem: new Date().toLocaleString('vi-VN'),
      hanhDong: 'LUU_TRU',
      nguoiThucHien: 'Thủ kho lưu trữ',
      vaiTro: 'WAREHOUSE',
      moTa: `Đưa bộ hồ sơ vào kho lưu trữ an toàn: ${hoSo.viTriTen || 'Kho tài liệu điện tử'}`
    };
    setHoSo({
      ...hoSo,
      trangThai: 'DA_LUU_TRU',
      lichSu: [newLichSu, ...hoSo.lichSu]
    });
    alert(`Đã đưa bộ hồ sơ ${hoSo.soHoSo} vào lưu trữ chính thức.`);
  };

  const handleConfirmVinhVien = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lyDoVinhVien.trim()) return;

    const newLichSu: LichSuHoSoItem = {
      id: `ls-${Date.now()}`,
      thoiDiem: new Date().toLocaleString('vi-VN'),
      hanhDong: 'DANH_DAU_VINH_VIEN',
      nguoiThucHien: 'Người đại diện theo pháp luật (Tổng Giám đốc)',
      vaiTro: 'DIRECTOR',
      moTa: `Quyết định đánh dấu lưu trữ VĨNH VIỄN theo NĐ 174 Điều 14.2. Lý do: ${lyDoVinhVien}`
    };

    setHoSo({
      ...hoSo,
      thoiHanLuuTru: 'VINH_VIEN',
      lichSu: [newLichSu, ...hoSo.lichSu]
    });

    setShowVinhVienModal(false);
    setLyDoVinhVien('');
    alert(`Đã ban hành Quyết định lưu trữ VĨNH VIỄN cho bộ hồ sơ ${hoSo.soHoSo}.`);
  };

  const handlePrintBia = () => {
    const newLichSu: LichSuHoSoItem = {
      id: `ls-${Date.now()}`,
      thoiDiem: new Date().toLocaleString('vi-VN'),
      hanhDong: 'IN_BIA',
      nguoiThucHien: 'Kế toán viên',
      vaiTro: 'ACCOUNTANT',
      moTa: 'In bìa hồ sơ lưu trữ và mục lục thành phần'
    };
    setHoSo({ ...hoSo, lichSu: [newLichSu, ...hoSo.lichSu] });
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {hoSo.soHoSo}
                </span>
                <span className="text-slate-400">•</span>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  {hoSo.tenHoSo}
                </h1>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                <span>Đối tượng: <strong className="text-slate-700">{hoSo.doiTuongTen}</strong></span>
                <span>Kỳ: <strong className="text-indigo-600 tabular-nums">{formatMonthVN(hoSo.kyKeToan || `${hoSo.nam}-${hoSo.thang}`)}</strong></span>
                <span>Ngày PS: <strong className="text-slate-700 tabular-nums">{formatDateVN(hoSo.ngayPhatSinh)}</strong></span>
                <span>Hình thức: <strong className="text-slate-700">{hoSo.hinhThucLuuTru}</strong></span>
                <span>Hạn lưu: <strong className="text-indigo-600">{hoSo.thoiHanLuuTru === 'VINH_VIEN' ? 'VĨNH VIỄN' : hoSo.thoiHanLuuTru === 'NAM_10' ? '10 Năm' : '5 Năm'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Độ đầy đủ thành phần</span>
              <span className={`text-base font-black ${hoSo.tyLeDayDu >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {hoSo.tyLeDayDu}%
              </span>
            </div>
            <div className="w-24 h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${hoSo.tyLeDayDu >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${hoSo.tyLeDayDu}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleMarkDayDu}
              className="flex items-center gap-1.5 px-3 py-1.5 font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đánh dấu Đầy đủ
            </button>
            <button
              onClick={handleLuuKho}
              className="flex items-center gap-1.5 px-3 py-1.5 font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
            >
              <Package className="w-3.5 h-3.5" />
              Đưa vào lưu trữ
            </button>
            <button
              onClick={() => setShowVinhVienModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
              title="Quyền Tổng Giám đốc (NĐ 174 Điều 14)"
            >
              <Star className="w-3.5 h-3.5" />
              Đánh dấu VĨNH VIỄN
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintBia}
              className="flex items-center gap-1.5 px-3 py-1.5 font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              In bìa hồ sơ
            </button>
            <button
              onClick={() => alert(`Đã đóng gói hồ sơ ${hoSo.soHoSo}.zip chuẩn bị nộp kiểm toán/thuế!`)}
              className="flex items-center gap-1.5 px-3 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Kết xuất gói hồ sơ
            </button>
          </div>
        </div>
      </div>

      {/* Main Checklist Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <span>Checklist thành phần tài liệu hồ sơ</span>
            <span className="text-slate-400 font-normal">({hoSo.thanhPhan.length} thành phần)</span>
          </h2>
          <span className="text-[11px] text-slate-500">
            NĐ 174 Đ.9: Mỗi thành phần có đúng một nguồn chứng từ hoặc tài liệu
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-2.5 px-4 w-12 text-center">#</th>
                <th className="py-2.5 px-4">Tên thành phần hồ sơ</th>
                <th className="py-2.5 px-4 w-28 text-center">Bắt buộc</th>
                <th className="py-2.5 px-4 w-28 text-center">Nguồn</th>
                <th className="py-2.5 px-4">Chứng từ / Tài liệu gắn kèm</th>
                <th className="py-2.5 px-4 w-32">Trạng thái</th>
                <th className="py-2.5 px-4 w-32 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hoSo.thanhPhan.map((tp, idx) => (
                <tr key={tp.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 text-center font-mono text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{tp.tenThanhPhan}</div>
                    <div className="font-mono text-[10px] text-slate-400">{tp.maLoaiHoSo}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {tp.batBuoc ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 rounded">
                        BẮT BUỘC
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Tùy chọn</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-700 rounded">
                      {tp.nguon}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {tp.daCo ? (
                      <div
                        onClick={() => openPreview({
                          fileName: tp.tenTaiLieu || `${tp.soHieu}.pdf`,
                          title: tp.tenThanhPhan,
                          subtitle: `Số hiệu chứng từ: ${tp.soHieu} • Nguồn: ${tp.nguon} • Bộ hồ sơ: ${hoSo.soHoSo}`
                        })}
                        className="flex items-center gap-2 cursor-pointer group/file"
                        title="Bấm để xem trước tài liệu trực tiếp"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-indigo-600 group-hover/file:scale-110 transition-transform shrink-0" />
                        <div>
                          <div className="font-mono font-bold text-slate-800 group-hover/file:text-indigo-600 transition-colors">{tp.soHieu}</div>
                          <div className="text-[11px] text-slate-500 group-hover/file:text-indigo-600 transition-colors underline decoration-slate-300">{tp.tenTaiLieu}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Chưa gắn tài liệu/chứng từ</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {tp.daCo ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã có
                      </span>
                    ) : tp.batBuoc ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                        <AlertTriangle className="w-3.5 h-3.5" /> THIẾU
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Chưa bổ sung</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {tp.daCo ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openPreview({
                            fileName: tp.tenTaiLieu || `${tp.soHieu}.pdf`,
                            title: tp.tenThanhPhan,
                            subtitle: `Số hiệu chứng từ: ${tp.soHieu} • Nguồn: ${tp.nguon} • Bộ hồ sơ: ${hoSo.soHoSo}`
                          })}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition-colors"
                          title="Xem trước trực tiếp (không tải về)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveThanhPhan(tp.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                          title="Gỡ thành phần"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedThanhPhan(tp);
                          setShowAttachModal(true);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        Gắn tài liệu
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Append-only Audit History (TT99 Điều 28.1.b) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Lịch sử vết kiểm toán (Append-only — TT99 Điều 28.1.b)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Bất biến: REVOKE UPDATE, DELETE
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {hoSo.lichSu.map(ls => (
            <div key={ls.id} className="py-2.5 flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{ls.moTa}</span>
                  <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 font-mono text-[10px] rounded">
                    {ls.hanhDong}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <User className="w-3 h-3 text-slate-300" />
                  <span>{ls.nguoiThucHien} ({ls.vaiTro})</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-mono shrink-0">
                {ls.thoiDiem}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Gắn chứng từ / tài liệu */}
      {showAttachModal && selectedThanhPhan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Gắn tài liệu: {selectedThanhPhan.tenThanhPhan}
              </h3>
              <button onClick={() => setShowAttachModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAttachSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số hiệu chứng từ / Số tài liệu *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: HD-001234, PNK-0042, UNC-MB01..."
                  value={attachSoHieu}
                  onChange={(e) => setAttachSoHieu(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên file tài liệu điện tử
                </label>
                <input
                  type="text"
                  placeholder="VD: ChungTu_Goc.pdf, HDe_signed.xml..."
                  value={attachTenFile}
                  onChange={(e) => setAttachTenFile(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-800 text-[11px] space-y-1">
                <div className="font-semibold">NĐ 174 Điều 9 & HSo-04:</div>
                <p>Mỗi thành phần hồ sơ liên kết duy nhất 1 nguồn chứng từ kế toán hoặc tài liệu số hóa hợp lệ.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAttachModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700"
                >
                  Xác nhận gắn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Đánh dấu Vĩnh viễn (Chỉ Giám đốc) */}
      {showVinhVienModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-purple-700 border-b border-slate-100 pb-3">
              <Star className="w-5 h-5 fill-purple-600" />
              <h3 className="text-base font-bold text-slate-900">
                Quyết định lưu trữ VĨNH VIỄN (NĐ 174 Điều 14.2)
              </h3>
            </div>

            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 text-[11px] space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                Căn cứ Nghị định 174/2016/NĐ-CP Điều 14 khoản 2:
              </div>
              <p>
                Tài liệu kế toán lưu trữ vĩnh viễn ở doanh nghiệp do <strong>người đại diện theo pháp luật quyết định</strong> căn cứ vào tính chất lịch sử, ý nghĩa quan trọng về kinh tế, pháp lý.
              </p>
              <p className="font-semibold text-rose-700">
                ⚠️ Cảnh báo: Hồ sơ đã đánh dấu VĨNH VIỄN sẽ KHÔNG BAO GIỜ được phép đưa vào danh mục tiêu hủy.
              </p>
            </div>

            <form onSubmit={handleConfirmVinhVien} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Căn cứ pháp lý *
                </label>
                <input
                  type="text"
                  required
                  value={canCuVinhVien}
                  onChange={(e) => setCanCuVinhVien(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lý do quyết định lưu trữ vĩnh viễn * (Bắt buộc theo HSo-10)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="VD: Tài liệu có ý nghĩa lịch sử sáng lập công ty / Báo cáo tài chính năm chuyển đổi mô hình..."
                  value={lyDoVinhVien}
                  onChange={(e) => setLyDoVinhVien(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVinhVienModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700"
                >
                  Ký duyệt VĨNH VIỄN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
