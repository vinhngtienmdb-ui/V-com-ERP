import React, { useState, useEffect } from 'react';
import { Building2, Save, X, CheckSquare, Square, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export interface ThongTinCongTy {
  tenantId: string;
  maCongTy: string;
  tenCongTy: string;
  maSoThue: string;
  diaChi: string;
  dienThoai?: string;
  email?: string;
  nguoiDaiDien: string;
  keToanTruong: string;
  linhVucHoatDong: string[]; // ['THUONG_MAI', 'DICH_VU', ...]
  thongTuApDung: string;
  hinhThucSo: string;
}

const LINH_VUC_OPTIONS = [
  { id: 'THUONG_MAI', label: 'Thương mại & Bán lẻ', desc: 'Kích hoạt checklist Phần 12 (Mua bán hàng hóa, tồn kho 156)' },
  { id: 'DICH_VU', label: 'Dịch vụ & Giải pháp', desc: 'Kích hoạt checklist Phần 13 (Chi phí dở dang 154, doanh thu chờ phân bổ)' },
  { id: 'SAN_XUAT', label: 'Sản xuất & Chế tạo', desc: 'Kích hoạt checklist Phần 14 (NVL 621, nhân công 622, SXC 627, giá thành 155)' },
  { id: 'XAY_DUNG', label: 'Xây dựng & Xây lắp', desc: 'Kích hoạt checklist Phần 15 (Hợp đồng thi công, nghiệm thu giai đoạn 337)' },
  { id: 'XNK', label: 'Xuất nhập khẩu & Logistics', desc: 'Kích hoạt checklist Phần 16 (Hồ sơ hải quan, C/O, thuế NK, tỷ giá)' },
  { id: 'BDS', label: 'Bất động sản & Cho thuê', desc: 'Kích hoạt checklist Phần 17 (BĐS đầu tư 217, pháp lý dự án, giải phóng mặt bằng)' },
];

const DEFAULT_COMPANY_CONFIG: ThongTinCongTy = {
  tenantId: 'tenant-vcomm-prod-01',
  maCongTy: 'VCOMM',
  tenCongTy: 'CÔNG TY TNHH VCOMM VIỆT NAM',
  maSoThue: '0101234567',
  diaChi: 'Tầng 12, Tòa nhà VComm Center, Hà Nội',
  dienThoai: '024 3999 8888',
  email: 'contact@vcomm.vn',
  nguoiDaiDien: 'Nguyễn Văn An (Giám đốc)',
  keToanTruong: 'Trần Thị Mai (Kế toán trưởng)',
  linhVucHoatDong: ['THUONG_MAI', 'DICH_VU'],
  thongTuApDung: 'TT99',
  hinhThucSo: 'NKC'
};

interface ThietLapCongTyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (config: ThongTinCongTy) => void;
}

export const ThietLapCongTyModal: React.FC<ThietLapCongTyModalProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const [formData, setFormData] = useState<ThongTinCongTy>(() => {
    const saved = localStorage.getItem('vcomm_company_config');
    return saved ? JSON.parse(saved) : DEFAULT_COMPANY_CONFIG;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    // Attempt load from Supabase if online
    const fetchDbConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('dm_cong_ty')
          .select('*')
          .eq('tenant_id', 'tenant-vcomm-prod-01')
          .single();

        if (data && !error) {
          const config: ThongTinCongTy = {
            tenantId: data.tenant_id,
            maCongTy: data.ma_cong_ty || 'VCOMM',
            tenCongTy: data.ten_cong_ty || '',
            maSoThue: data.ma_so_thue || '',
            diaChi: data.dia_chi || '',
            dienThoai: data.dien_thoai || '',
            email: data.email || '',
            nguoiDaiDien: data.nguoi_dai_dien || '',
            keToanTruong: data.ke_toan_truong || '',
            linhVucHoatDong: data.linh_vuc_hoat_dong || ['THUONG_MAI', 'DICH_VU'],
            thongTuApDung: data.thong_tu_ap_dung || 'TT99',
            hinh_thuc_so: data.hinh_thuc_so || 'NKC'
          };
          setFormData(config);
          localStorage.setItem('vcomm_company_config', JSON.stringify(config));
        }
      } catch (err) {
        // Fallback to local storage
      }
    };

    if (isOpen) {
      fetchDbConfig();
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleLinhVuc = (id: string) => {
    setFormData(prev => {
      const exists = prev.linhVucHoatDong.includes(id);
      const next = exists
        ? prev.linhVucHoatDong.filter(item => item !== id)
        : [...prev.linhVucHoatDong, id];
      return { ...prev, linhVucHoatDong: next };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      localStorage.setItem('vcomm_company_config', JSON.stringify(formData));

      // Attempt upsert to Supabase dm_cong_ty
      await supabase.from('dm_cong_ty').upsert({
        tenant_id: formData.tenantId,
        ma_cong_ty: formData.maCongTy,
        ten_cong_ty: formData.tenCongTy,
        ma_so_thue: formData.maSoThue,
        dia_chi: formData.diaChi,
        dien_thoai: formData.dienThoai,
        email: formData.email,
        nguoi_dai_dien: formData.nguoiDaiDien,
        ke_toan_truong: formData.keToanTruong,
        linh_vuc_hoat_dong: formData.linhVucHoatDong,
        thong_tu_ap_dung: formData.thongTuApDung,
        hinh_thuc_so: formData.hinhThucSo,
        updated_at: new Date().toISOString()
      });

      setSavedSuccess(true);
      if (onSaved) onSaved(formData);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.warn('Saved locally:', err);
      setSavedSuccess(true);
      if (onSaved) onSaved(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Cấu hình Pháp nhân & Lĩnh vực Hoạt động</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  Thông tư 99/2025
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Thiết lập thông tin in trên báo cáo tài chính và kích hoạt checklist hồ sơ lưu trữ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-6 flex-1 text-xs">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2 font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Đã lưu thành công cấu hình pháp nhân doanh nghiệp!</span>
            </div>
          )}

          {/* Section 1: Thông tin pháp lý */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>1. Thông tin Pháp lý Doanh nghiệp (Tiêu đề Sổ & BCTC)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Tên công ty pháp lý <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.tenCongTy}
                  onChange={(e) => setFormData({ ...formData, tenCongTy: e.target.value })}
                  placeholder="VD: CÔNG TY TNHH VCOMM..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mã số thuế (MST) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.maSoThue}
                  onChange={(e) => setFormData({ ...formData, maSoThue: e.target.value })}
                  placeholder="VD: 0101234567"
                  className="w-full px-3 py-2 font-mono font-bold text-indigo-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã đơn vị nội bộ</label>
                <input
                  type="text"
                  value={formData.maCongTy}
                  onChange={(e) => setFormData({ ...formData, maCongTy: e.target.value })}
                  className="w-full px-3 py-2 font-mono rounded-xl border border-slate-200 bg-slate-50 text-slate-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Địa chỉ trụ sở chính</label>
                <input
                  type="text"
                  value={formData.diaChi}
                  onChange={(e) => setFormData({ ...formData, diaChi: e.target.value })}
                  placeholder="Địa chỉ ghi trên giấy đăng ký kinh doanh..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Người đại diện theo pháp luật (Giám đốc)</label>
                <input
                  type="text"
                  value={formData.nguoiDaiDien}
                  onChange={(e) => setFormData({ ...formData, nguoiDaiDien: e.target.value })}
                  placeholder="Họ và tên Giám đốc..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kế toán trưởng / Phụ trách kế toán</label>
                <input
                  type="text"
                  value={formData.keToanTruong}
                  onChange={(e) => setFormData({ ...formData, keToanTruong: e.target.value })}
                  placeholder="Họ và tên Kế toán trưởng..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Lĩnh vực hoạt động */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2">
                <span>2. Lĩnh vực Hoạt động Doanh nghiệp (Kích hoạt Hồ sơ Kế toán)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Các mục được tích chọn sẽ tự động kích hoạt bộ checklist thành phần bổ sung trong Phân hệ Hồ sơ – Lưu trữ (NĐ 174/2016).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {LINH_VUC_OPTIONS.map(opt => {
                const isChecked = formData.linhVucHoatDong.includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    onClick={() => toggleLinhVuc(opt.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isChecked
                        ? 'border-indigo-500 bg-indigo-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="mt-0.5 text-indigo-600">
                      {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{opt.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] text-slate-400">
              Chế độ áp dụng: <span className="font-bold text-slate-700">Thông tư 99/2025/TT-BTC</span> • Hình thức sổ: <span className="font-bold text-slate-700">Nhật ký chung (S03-DN)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
