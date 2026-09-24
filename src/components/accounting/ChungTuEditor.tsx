import React, { useState, useMemo, useEffect } from 'react';
import { Save, CheckCircle, ArrowLeft, Printer, Paperclip, History, ShieldAlert } from 'lucide-react';
import { ChungTuNhatKyChung, DinhKhoan } from '../../lib/keToan/types';
import { kiemTraChungTu } from '../../lib/keToan/validate';
import { ChungTuHeader } from './ChungTuHeader';
import { DinhKhoanGrid } from './DinhKhoanGrid';
import { KetQuaCanDoiBar } from './KetQuaCanDoiBar';

interface ChungTuEditorProps {
  initialData?: ChungTuNhatKyChung;
  onSave: (ct: ChungTuNhatKyChung) => void;
  onPost?: (ct: ChungTuNhatKyChung) => void;
  onClose: () => void;
}

const DEFAULT_CHUNG_TU: ChungTuNhatKyChung = {
  tenantId: 'tenant-vcomm-prod-01',
  loaiCt: 'THU',
  soCt: `CT-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9000 + 1000))}`,
  ngayCt: new Date().toISOString().substring(0, 10),
  ngayHachToan: new Date().toISOString().substring(0, 10),
  kyKeToan: new Date().toISOString().substring(0, 7),
  dienGiai: '',
  nguoiLapId: 'user-current',
  trangThai: 'CHUA_GHI_SO',
  thongTuApDung: 'TT99',
  dinhKhoan: [
    {
      soDong: 1,
      dienGiai: '',
      tkNo: '112',
      tkCo: '511',
      soTien: 0,
      loaiTien: 'VND',
      tyGia: 1,
      soTienQuyDoi: 0
    }
  ]
};

export const ChungTuEditor: React.FC<ChungTuEditorProps> = ({
  initialData,
  onSave,
  onPost,
  onClose
}) => {
  const [formData, setFormData] = useState<ChungTuNhatKyChung>(initialData || DEFAULT_CHUNG_TU);
  const [activeTab, setActiveTab] = useState<'DINH_KHOAN' | 'DINH_KEM' | 'LICH_SU'>('DINH_KHOAN');
  const [attachments, setAttachments] = useState<{ id: string; name: string; size: string; type: string }[]>([]);

  const ketQuaCanDoi = useMemo(() => {
    return kiemTraChungTu(formData);
  }, [formData]);

  const isReadOnly = formData.trangThai === 'DA_KHOA_SO' || formData.trangThai === 'DA_HUY';

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveDraft();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData]);

  const handleHeaderChange = (fields: Partial<ChungTuNhatKyChung>) => {
    setFormData(prev => ({ ...prev, ...fields }));
  };

  const handleGridChange = (dinhKhoan: DinhKhoan[]) => {
    setFormData(prev => ({ ...prev, dinhKhoan }));
  };

  const handleSaveDraft = () => {
    onSave(formData);
  };

  const handlePostJournal = () => {
    if (!ketQuaCanDoi.canDoi) {
      alert('Bút toán chưa cân đối hoặc có lỗi. Vui lòng kiểm tra lại trước khi ghi sổ!');
      return;
    }
    const updated = { ...formData, trangThai: 'DA_GHI_SO' as const };
    setFormData(updated);
    if (onPost) onPost(updated);
    else onSave(updated);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Quay lại danh sách chứng từ"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[11px] font-mono uppercase text-indigo-600 font-bold">
              Phân hệ Kế toán TT99
            </span>
            <h1 className="text-sm font-bold text-slate-900">
              {formData.id ? `Chỉnh sửa chứng từ: ${formData.soCt}` : 'Lập chứng từ Kế toán mới'}
            </h1>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isReadOnly}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            title="Lưu nháp chứng từ (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Lưu nháp (Ctrl+S)</span>
          </button>

          {formData.trangThai !== 'DA_GHI_SO' ? (
            <button
              type="button"
              onClick={handlePostJournal}
              disabled={isReadOnly || !ketQuaCanDoi.canDoi}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 rounded-xl shadow-xs transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Ghi sổ kế toán</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                const updated = { ...formData, trangThai: 'CHUA_GHI_SO' as const };
                setFormData(updated);
                onSave(updated);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors"
            >
              <span>Bỏ ghi sổ</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="In phiếu chứng từ (Ctrl+P)"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Header Info */}
      <ChungTuHeader data={formData} onChange={handleHeaderChange} readOnly={isReadOnly} />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('DINH_KHOAN')}
          className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'DINH_KHOAN'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Định khoản hạch toán</span>
          <span className="px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono text-[10px]">
            {formData.dinhKhoan.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DINH_KEM')}
          className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'DINH_KEM'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Paperclip className="w-3.5 h-3.5" />
          <span>Hồ sơ đính kèm (NĐ 174)</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px]">
            {attachments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('LICH_SU')}
          className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'LICH_SU'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Trail (Điều 28 TT99)</span>
        </button>
      </div>

      {/* Tab 1: Định khoản */}
      {activeTab === 'DINH_KHOAN' && (
        <div className="space-y-4">
          <DinhKhoanGrid
            items={formData.dinhKhoan}
            onChange={handleGridChange}
            readOnly={isReadOnly}
          />
          <KetQuaCanDoiBar ketQua={ketQuaCanDoi} />
        </div>
      )}

      {/* Tab 2: Đính kèm hồ sơ */}
      {activeTab === 'DINH_KEM' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-indigo-50/20 transition-colors">
            <Paperclip className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-800">
              Kéo thả tài liệu chứng từ gốc hoặc bấm để tải lên
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Hỗ trợ PDF, XML hóa đơn điện tử, PNG, JPG (tối đa 15MB/file)
            </div>
            <button
              type="button"
              className="mt-4 px-4 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
            >
              Chọn tệp đính kèm
            </button>
          </div>

          <div className="text-xs text-slate-500 bg-blue-50/70 border border-blue-200 p-3 rounded-xl flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-blue-900">Quy chuẩn lưu trữ NĐ 174/2016/NĐ-CP:</span> Các tệp đính kèm tại đây sẽ được tự động đồng bộ vào <strong>Bộ hồ sơ kế toán (Phân hệ Hồ sơ & Lưu trữ)</strong> và trích xuất nguyên vẹn khi có yêu cầu kiểm toán hoặc thanh tra thuế.
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Lịch sử Audit Trail */}
      {activeTab === 'LICH_SU' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Nhật ký kiểm toán biến động (Append-only - TT 99 Điều 28.1.b)
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-600 font-bold">[KHỞI TẠO]</span>
                <span className="text-slate-700">Tạo mới chứng từ {formData.soCt}</span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">
                {formData.ngayCt} 08:30 • {formData.nguoiLapId}
              </span>
            </div>
            {formData.trangThai === 'DA_GHI_SO' && (
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-indigo-600 font-bold">[GHI SỔ]</span>
                  <span className="text-slate-700">Hạch toán ghi sổ kế toán thành công</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">
                  {formData.ngayHachToan} 08:35 • Kế toán trưởng
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
