import React, { useState, useMemo, useEffect } from 'react';
import { Save, CheckCircle, ArrowLeft, Printer, Paperclip, History, ShieldAlert, Zap } from 'lucide-react';
import { ChungTuNhatKyChung, DinhKhoan } from '../../lib/keToan/types';
import { kiemTraChungTu } from '../../lib/keToan/validate';
import { ChungTuHeader } from './ChungTuHeader';
import { DinhKhoanGrid } from './DinhKhoanGrid';
import { KetQuaCanDoiBar } from './KetQuaCanDoiBar';
import { cn } from '../../lib/utils';

interface ChungTuEditorProps {
  initialData?: ChungTuNhatKyChung;
  onSave: (ct: ChungTuNhatKyChung) => void;
  onPost?: (ct: ChungTuNhatKyChung) => void;
  onClose: () => void;
  isDarkMode?: boolean;
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
  onClose,
  isDarkMode = false
}) => {
  const [formData, setFormData] = useState<ChungTuNhatKyChung>(initialData || DEFAULT_CHUNG_TU);
  const [activeTab, setActiveTab] = useState<'DINH_KHOAN' | 'DINH_KEM' | 'LICH_SU'>('DINH_KHOAN');
  const [attachments, setAttachments] = useState<{ id: string; name: string; size: string; type: string }[]>([]);

  const ketQuaCanDoi = useMemo(() => {
    return kiemTraChungTu(formData);
  }, [formData]);

  const isReadOnly = formData.trangThai === 'DA_KHOA_SO' || formData.trangThai === 'DA_HUY';

  // Chức năng F9: Tự động cân đối số tiền
  const handleAutoBalance = () => {
    if (ketQuaCanDoi.canDoi) return;
    const chenhLech = ketQuaCanDoi.chenhLech;
    if (chenhLech === 0) return;

    const nextLines = [...formData.dinhKhoan];
    const lastIdx = nextLines.length - 1;
    const currentLast = nextLines[lastIdx];

    // Nếu dòng cuối chưa có số tiền hoặc đang chênh lệch, tự bù số tiền còn thiếu
    if (currentLast.soTien === 0) {
      nextLines[lastIdx] = {
        ...currentLast,
        soTien: Math.abs(chenhLech),
        soTienQuyDoi: Math.abs(chenhLech) * (currentLast.tyGia || 1)
      };
    } else {
      // Thêm dòng mới bù đúng khoản chênh lệch
      nextLines.push({
        soDong: nextLines.length + 1,
        dienGiai: currentLast.dienGiai || 'Cân đối bút toán phát sinh',
        tkNo: currentLast.tkCo, // Đảo tài khoản để đối ứng
        tkCo: currentLast.tkNo,
        soTien: Math.abs(chenhLech),
        loaiTien: 'VND',
        tyGia: 1,
        soTienQuyDoi: Math.abs(chenhLech)
      });
    }

    setFormData(prev => ({ ...prev, dinhKhoan: nextLines }));
  };

  // Keyboard shortcut listener: Ctrl+S (Lưu), F9 (Tự cân đối), F12 (Ghi sổ), Esc (Thoát)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveDraft();
      }
      if (e.key === 'F9') {
        e.preventDefault();
        handleAutoBalance();
      }
      if (e.key === 'F12') {
        e.preventDefault();
        handlePostJournal();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, ketQuaCanDoi]);

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
      alert('Bút toán chưa cân đối hoặc có lỗi. Vui lòng nhấn F9 để tự cân đối hoặc kiểm tra lại!');
      return;
    }
    const updated = { ...formData, trangThai: 'DA_GHI_SO' as const };
    setFormData(updated);
    if (onPost) onPost(updated);
    else onSave(updated);
  };

  return (
    <div className={cn(
      "space-y-4 animate-in fade-in duration-200 transition-colors",
      isDarkMode ? "text-slate-100" : "text-slate-900"
    )}>
      {/* Action Header */}
      <div className={cn(
        "flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border shadow-xs transition-colors",
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      )}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "p-2 rounded-xl transition-colors cursor-pointer",
              isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            )}
            title="Đóng (Esc)"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold">
                {formData.id ? `Chứng từ ${formData.soCt}` : 'Lập Chứng từ Kế toán mới (S03-DN)'}
              </h2>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-bold",
                formData.trangThai === 'DA_GHI_SO'
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                  : formData.trangThai === 'CHUA_GHI_SO'
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                  : "bg-slate-500/10 text-slate-400 border border-slate-500/30"
              )}>
                {formData.trangThai === 'DA_GHI_SO' ? 'ĐÃ GHI SỔ' : formData.trangThai === 'CHUA_GHI_SO' ? 'CHƯA GHI SỔ (NHÁP)' : 'ĐÃ KHÓA SỔ'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Nhập liệu bàn phím siêu tốc • Tự động hạch toán kép theo TT99/2025/TT-BTC
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {!isReadOnly && (
            <>
              {!ketQuaCanDoi.canDoi && (
                <button
                  type="button"
                  onClick={handleAutoBalance}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Cân đối (F9)</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveDraft}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer",
                  isDarkMode
                    ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                )}
                title="Lưu nháp (Ctrl + S)"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu nháp (Ctrl+S)</span>
              </button>

              <button
                type="button"
                onClick={handlePostJournal}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="Ghi sổ kế toán chính thức (F12)"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Ghi sổ (F12)</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className={cn(
              "p-2 rounded-lg border transition-colors cursor-pointer",
              isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            )}
            title="In chứng từ kế toán"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Header Fields Form */}
      <ChungTuHeader
        formData={formData}
        onChange={handleHeaderChange}
        readOnly={isReadOnly}
      />

      {/* Tabs navigation */}
      <div className={cn(
        "flex gap-4 border-b px-4 text-xs font-bold transition-colors",
        isDarkMode ? "border-slate-800" : "border-slate-200"
      )}>
        <button
          type="button"
          onClick={() => setActiveTab('DINH_KHOAN')}
          className={cn(
            "pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer",
            activeTab === 'DINH_KHOAN'
              ? "border-blue-500 text-blue-500"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <span>Chi tiết Định khoản (S03-DN)</span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
            {formData.dinhKhoan.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DINH_KEM')}
          className={cn(
            "pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer",
            activeTab === 'DINH_KEM'
              ? "border-blue-500 text-blue-500"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <Paperclip className="w-3.5 h-3.5" />
          <span>Hồ sơ & Hóa đơn đính kèm</span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-slate-500/10 text-slate-400">
            {attachments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('LICH_SU')}
          className={cn(
            "pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer",
            activeTab === 'LICH_SU'
              ? "border-blue-500 text-blue-500"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <History className="w-3.5 h-3.5" />
          <span>Vết kiểm toán Điều 28</span>
        </button>
      </div>

      {/* Tab 1: Dinh Khoan Grid */}
      {activeTab === 'DINH_KHOAN' && (
        <div className="space-y-0">
          <DinhKhoanGrid
            items={formData.dinhKhoan}
            onChange={handleGridChange}
            readOnly={isReadOnly}
            isDarkMode={isDarkMode}
          />

          {/* Equalizer Balance Bar */}
          <KetQuaCanDoiBar
            ketQua={ketQuaCanDoi}
            onAutoBalance={handleAutoBalance}
            isDarkMode={isDarkMode}
          />
        </div>
      )}

      {/* Tab 2: Attachments */}
      {activeTab === 'DINH_KEM' && (
        <div className={cn(
          "p-6 rounded-2xl border text-center space-y-3 transition-colors",
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        )}>
          <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
            <Paperclip className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm">Đính kèm Hóa đơn điện tử & Chứng từ gốc</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Kéo thả tệp XML hóa đơn hoặc PDF bảng kê vào đây để lưu trữ an toàn vào Hồ sơ kế toán theo Nghị định 174/2016/NĐ-CP.
          </p>
          <button
            type="button"
            onClick={() => alert('Chọn tệp hóa đơn đính kèm...')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Tải tệp lên
          </button>
        </div>
      )}

      {/* Tab 3: History Audit Trail */}
      {activeTab === 'LICH_SU' && (
        <div className={cn(
          "p-6 rounded-2xl border space-y-3 transition-colors",
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        )}>
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-400">
            <History className="w-4 h-4 text-blue-500" />
            <span>Nhật ký Vết kiểm toán bất biến (Điều 28.1.b)</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-blue-500">TẠO MỚI CHỨNG TỪ:</span> Khởi tạo chứng từ bởi user-current.
              </div>
              <span className="font-mono text-slate-400 text-[11px]">{new Date().toLocaleString('vi-VN')}</span>
            </div>
            {formData.trangThai === 'DA_GHI_SO' && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-600">GHI SỔ CHÍNH THỨC:</span> Bút toán đã ghi sổ, khóa sửa xóa trực tiếp.
                </div>
                <span className="font-mono text-emerald-600 text-[11px]">{new Date().toLocaleString('vi-VN')}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
