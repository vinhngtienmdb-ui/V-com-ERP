import React, { useState } from 'react';
import {
  Key,
  ShieldCheck,
  UserCheck,
  Lock,
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';
import { PersonalCertificate } from '../../../data/hsmSignatureData';
import { HrmStaffOrRequestPickerModal } from '../../common/HrmStaffOrRequestPickerModal';
import { hrmEmployeeService, HrmEmployee, HrmPersonalRequest } from '../../../services/hrmEmployeeService';

export interface IssueCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIssueSuccess: (newCert: PersonalCertificate, algorithm: string) => void;
  existingCertsCount?: number;
}

export const IssueCertificateModal: React.FC<IssueCertificateModalProps> = ({
  isOpen,
  onClose,
  onIssueSuccess,
  existingCertsCount = 5
}) => {
  const [showHrmPicker, setShowHrmPicker] = useState(false);
  const [pickerDefaultTab, setPickerDefaultTab] = useState<'cbnv' | 'hrm_request'>('cbnv');
  const [hrmSourceLabel, setHrmSourceLabel] = useState<string | null>(
    'Đã trích xuất từ Hồ sơ CBNV: EMP-2068 - Hoàng Văn Thái'
  );

  const [newCertForm, setNewCertForm] = useState({
    staffCode: 'EMP-2068',
    fullName: 'Hoàng Văn Thái',
    email: 'thai.hv@vcomm.vn',
    department: 'Kinh doanh & Bán lẻ',
    title: 'Trưởng nhóm Bán hàng O2O',
    certType: 'staff_internal' as 'executive' | 'accounting_warehouse' | 'staff_internal',
    algorithm: 'RSA 2048-bit' as 'RSA 2048-bit' | 'ECC P-256' | 'SmartCA Cloud',
    signingLimitVND: 30000000,
    validYears: 3,
    pinCode: '123456'
  });

  if (!isOpen) return null;

  const handleSelectHrmStaff = (
    emp: HrmEmployee,
    source: 'cbnv' | 'current_user',
    originalReq?: HrmPersonalRequest
  ) => {
    let determinedCertType: 'executive' | 'accounting_warehouse' | 'staff_internal' = 'staff_internal';
    let defaultLimit = 30000000;

    if (
      emp.department.includes('Giám Đốc') ||
      emp.title?.includes('Giám Đốc') ||
      emp.title?.includes('CEO') ||
      emp.title?.includes('COO')
    ) {
      determinedCertType = 'executive';
      defaultLimit = 0;
    } else if (
      emp.department.includes('Kế toán') ||
      emp.department.includes('Tài chính') ||
      emp.department.includes('Kho')
    ) {
      determinedCertType = 'accounting_warehouse';
      defaultLimit = 200000000;
    }

    setNewCertForm(prev => ({
      ...prev,
      staffCode: emp.id,
      fullName: emp.name,
      email: emp.email,
      department: emp.department,
      title: emp.title || emp.position,
      certType: determinedCertType,
      signingLimitVND: defaultLimit
    }));

    if (originalReq) {
      setHrmSourceLabel(`Trích xuất từ Đơn yêu cầu ${originalReq.id}: ${originalReq.title}`);
    } else if (source === 'current_user') {
      setHrmSourceLabel(`Thông tin CBNV của bạn (${emp.id} - ${emp.name})`);
    } else {
      setHrmSourceLabel(`Hồ sơ Cán bộ Nhân viên chính thức (${emp.id} - ${emp.name})`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCert: PersonalCertificate = {
      id: `CERT-${String(existingCertsCount + 1).padStart(3, '0')}`,
      staffCode: newCertForm.staffCode,
      fullName: newCertForm.fullName,
      email: newCertForm.email,
      department: newCertForm.department,
      title: newCertForm.title,
      role: newCertForm.title,
      serialNumber: `${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}:AB:CD:EF:01:23`,
      certType: newCertForm.certType,
      algorithm: newCertForm.algorithm,
      status: 'active',
      signingLimitVND: newCertForm.signingLimitVND,
      issuedDate: new Date().toLocaleDateString('vi-VN'),
      expiryDate: new Date(Date.now() + newCertForm.validYears * 365 * 24 * 3600 * 1000).toLocaleDateString('vi-VN'),
      pinCodeMasked: '••••••'
    };

    onIssueSuccess(newCert, newCertForm.algorithm);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        data-testid="issue-cert-modal"
      >
        <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200">
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base">Cấp Phát Chứng Thư Số Cá Nhân Mới</h3>
            </div>
            <button
              onClick={onClose}
              data-testid="close-issue-cert-modal"
              className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {/* HRM Staff / Request Selector Header */}
            <div className="p-3.5 bg-gradient-to-r from-indigo-50 via-slate-50 to-purple-50 border border-indigo-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-indigo-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Nguồn dữ liệu người dùng (Bắt buộc từ HRM)</span>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Khóa nhập tay
                </span>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                Để bảo đảm tính pháp lý và toàn vẹn của chứng thư số, thông tin cán bộ phải được trích xuất trực tiếp từ <strong>Hồ sơ Cán bộ Nhân viên (CBNV)</strong> hoặc <strong>Đơn yêu cầu cá nhân trong HRM</strong>.
              </p>

              <div className="flex items-center gap-2 flex-wrap pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPickerDefaultTab('cbnv');
                    setShowHrmPicker(true);
                  }}
                  data-testid="picker-cbnv-btn"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs transition-all cursor-pointer text-[11px]"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Chọn từ Danh sách CBNV</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPickerDefaultTab('hrm_request');
                    setShowHrmPicker(true);
                  }}
                  data-testid="picker-request-btn"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold transition-all cursor-pointer text-[11px]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  <span>Chọn từ Đơn yêu cầu HRM</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const current = hrmEmployeeService.getCurrentLoggedInStaff();
                    handleSelectHrmStaff(current, 'current_user');
                  }}
                  data-testid="picker-current-user-btn"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg font-bold transition-all cursor-pointer text-[11px]"
                >
                  <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>Dùng hồ sơ của tôi</span>
                </button>
              </div>

              {hrmSourceLabel && (
                <div className="p-2 bg-white rounded-lg border border-indigo-100 text-[11px] text-indigo-900 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">{hrmSourceLabel}</span>
                </div>
              )}
            </div>

            {/* Locked Staff Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Mã nhân viên</span>
                  <span className="text-[10px] text-slate-400 font-normal flex items-center gap-0.5">
                    <Lock className="w-3 h-3 text-slate-400" /> Khóa
                  </span>
                </label>
                <input
                  type="text"
                  value={newCertForm.staffCode}
                  readOnly
                  title="Thông tin được trích xuất từ HRM, không được sửa đổi"
                  className="w-full px-3 py-2 bg-slate-100 text-slate-800 font-mono font-bold border border-slate-300 rounded-lg cursor-not-allowed select-none"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Họ và tên cán bộ</span>
                  <span className="text-[10px] text-slate-400 font-normal flex items-center gap-0.5">
                    <Lock className="w-3 h-3 text-slate-400" /> Khóa
                  </span>
                </label>
                <input
                  type="text"
                  value={newCertForm.fullName}
                  readOnly
                  title="Thông tin được trích xuất từ HRM, không được sửa đổi"
                  className="w-full px-3 py-2 bg-slate-100 text-slate-800 font-bold border border-slate-300 rounded-lg cursor-not-allowed select-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Email công vụ</span>
                  <span className="text-[10px] text-slate-400 font-normal flex items-center gap-0.5">
                    <Lock className="w-3 h-3 text-slate-400" /> Khóa
                  </span>
                </label>
                <input
                  type="email"
                  value={newCertForm.email}
                  readOnly
                  title="Thông tin được trích xuất từ HRM, không được sửa đổi"
                  className="w-full px-3 py-2 bg-slate-100 text-slate-800 font-medium border border-slate-300 rounded-lg cursor-not-allowed select-none"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Phòng ban công tác</span>
                  <span className="text-[10px] text-slate-400 font-normal flex items-center gap-0.5">
                    <Lock className="w-3 h-3 text-slate-400" /> Khóa
                  </span>
                </label>
                <input
                  type="text"
                  value={newCertForm.department}
                  readOnly
                  title="Thông tin được trích xuất từ HRM, không được sửa đổi"
                  className="w-full px-3 py-2 bg-slate-100 text-slate-800 font-medium border border-slate-300 rounded-lg cursor-not-allowed select-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Chức danh bổ nhiệm</span>
                  <span className="text-[10px] text-slate-400 font-normal flex items-center gap-0.5">
                    <Lock className="w-3 h-3 text-slate-400" /> Khóa
                  </span>
                </label>
                <input
                  type="text"
                  value={newCertForm.title}
                  readOnly
                  title="Thông tin được trích xuất từ HRM, không được sửa đổi"
                  className="w-full px-3 py-2 bg-slate-100 text-slate-800 font-medium border border-slate-300 rounded-lg cursor-not-allowed select-none"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Hạn mức Ký tối đa (VND)</label>
                <input
                  type="number"
                  value={newCertForm.signingLimitVND}
                  onChange={e => setNewCertForm({ ...newCertForm, signingLimitVND: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="0 = Không giới hạn"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Thuật toán Mã hóa Cặp khóa</label>
                <select
                  value={newCertForm.algorithm}
                  onChange={e => setNewCertForm({ ...newCertForm, algorithm: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="RSA 2048-bit">RSA 2048-bit (Tiêu chuẩn phổ biến)</option>
                  <option value="ECC P-256">ECC P-256 (Hiệu năng cao)</option>
                  <option value="SmartCA Cloud">SmartCA Cloud (Ký số di động)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Thời hạn hiệu lực</label>
                <select
                  value={newCertForm.validYears}
                  onChange={e => setNewCertForm({ ...newCertForm, validYears: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={1}>1 Năm</option>
                  <option value={2}>2 Năm</option>
                  <option value={3}>3 Năm</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 leading-relaxed">
              <span className="font-bold">Quy trình cấp khóa tự động:</span> Hệ thống sẽ sinh cặp khóa mật mã học X.509, lưu khóa công khai (Public Key) trên máy chủ xác thực và gửi hướng dẫn kích hoạt mã PIN ký số vào email công vụ của nhân sự.
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                data-testid="submit-issue-cert-button"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
              >
                Tạo & Cấp Chứng Thư
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* HRM Staff or Request Picker Modal */}
      <HrmStaffOrRequestPickerModal
        isOpen={showHrmPicker}
        onClose={() => setShowHrmPicker(false)}
        onSelectEmployee={handleSelectHrmStaff}
        filterRequestCategory="signature"
        title="Trích Xuất Nhân Sự Cho Chứng Thư Số Cá Nhân"
        defaultTab={pickerDefaultTab}
      />
    </>
  );
};

export default IssueCertificateModal;
