import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  FileSignature, 
  Award, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone, 
  Landmark, 
  Receipt, 
  Heart, 
  CheckCircle2, 
  Lock,
  QrCode,
  Share2,
  Download
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';

export interface EmployeePassportData {
  id: string;
  employeeCode: string;
  fullName: string;
  department: string;
  position: string;
  status: string;
  gender: string;
  birthDate: string;
  identityCard: string;
  identityDate: string;
  identityPlace: string;
  permanentAddress: string;
  currentAddress: string;
  email: string;
  phone: string;
  bankAccount: string;
  bankName: string;
  bankBeneficiary: string;
  taxCode: string;
  insuranceBookNo: string;
  contractType: string;
  contractNumber: string;
  contractSignDate: string;
  contractExpiryDate: string;
  rsaHash: string;
  baseSalary: number;
  allowance: number;
  leaveTotal: number;
  leaveUsed: number;
  skills: { name: string; level: number }[];
}

interface HREmployeePassportModalProps {
  employee: EmployeePassportData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function HREmployeePassportModal({ employee, isOpen, onClose }: HREmployeePassportModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'contract' | 'skills' | 'finance'>('profile');

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-white/90 backdrop-blur-2xl border border-white/80 shadow-2xl flex flex-col">
        {/* Modal Top Header (Passport Header) */}
        <div className="relative p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Left: Avatar & Identity Summary */}
          <div className="relative z-10 flex items-center gap-5">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 border-2 border-white/40 shadow-xl flex items-center justify-center text-white text-2xl font-black">
                {employee.fullName.charAt(0)}
              </div>
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-md bg-emerald-500 text-[10px] font-bold text-white border border-white">
                Active
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">{employee.fullName}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white/10 text-indigo-200 border border-white/10">
                  {employee.employeeCode}
                </span>
              </div>
              <p className="text-xs text-indigo-200 font-medium mt-1 flex items-center gap-2">
                <span>{employee.position}</span>
                <span>•</span>
                <span>{employee.department}</span>
              </p>

              {/* RSA Holographic Stamp Pill */}
              <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-[11px] font-mono text-emerald-300 w-fit">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ký số RSA: {employee.rsaHash.slice(0, 16)}...</span>
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="relative z-10 w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-4 pb-2 border-b border-slate-200 bg-slate-50/60 shrink-0 text-xs font-bold">
          {[
            { id: 'profile', label: '1. Hồ sơ & Định danh' },
            { id: 'contract', label: '2. Hợp đồng & Ký số' },
            { id: 'skills', label: '3. Skill Matrix & Năng lực' },
            { id: 'finance', label: '4. Lương & Phúc lợi' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-2 rounded-xl transition-all cursor-pointer",
                activeTab === tab.id
                  ? "bg-white text-indigo-600 shadow-sm shadow-slate-200 border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* TAB 1: PROFILE & IDENTITY */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-600" /> Căn cước công dân & Định danh
                </h4>
                <div className="space-y-2 text-slate-700">
                  <div className="flex justify-between"><span className="text-slate-400">Số CCCD:</span><strong className="font-mono">{employee.identityCard}</strong></div>
                  <div className="flex justify-between"><span className="text-slate-400">Ngày cấp:</span><span>{employee.identityDate}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Nơi cấp:</span><span>{employee.identityPlace}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Giới tính:</span><span>{employee.gender}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Ngày sinh:</span><span>{employee.birthDate}</span></div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" /> Thông tin Cư trú & Liên lạc
                </h4>
                <div className="space-y-2 text-slate-700">
                  <div><span className="text-slate-400 block mb-0.5">Email công việc:</span><strong className="text-indigo-600">{employee.email}</strong></div>
                  <div><span className="text-slate-400 block mb-0.5">Điện thoại di động:</span><strong>{employee.phone}</strong></div>
                  <div><span className="text-slate-400 block mb-0.5">Thường trú:</span><span>{employee.permanentAddress}</span></div>
                  <div><span className="text-slate-400 block mb-0.5">Chỗ ở hiện nay:</span><span>{employee.currentAddress}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTRACT & RSA DIGITAL SIGNATURE */}
          {activeTab === 'contract' && (
            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white relative overflow-hidden shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSignature className="w-5 h-5 text-indigo-400" />
                    <span className="font-black text-sm">Hợp đồng Lao động Điện tử (Chuẩn BLLĐ 2019)</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    Đã Ký số RSA Hợp pháp
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
                  <div><span className="text-slate-400 block">Số HĐ:</span><strong className="font-mono">{employee.contractNumber}</strong></div>
                  <div><span className="text-slate-400 block">Loại HĐ:</span><strong>{employee.contractType}</strong></div>
                  <div><span className="text-slate-400 block">Ngày ký:</span><span>{employee.contractSignDate}</span></div>
                  <div><span className="text-slate-400 block">Thời hạn đến:</span><span>{employee.contractExpiryDate || 'Vô thời hạn'}</span></div>
                </div>

                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 font-mono text-[10px] space-y-1">
                  <span className="text-slate-400 block">Chữ ký số RSA 512-bit Timestamped Hash:</span>
                  <span className="text-indigo-300 break-all">{employee.rsaHash}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SKILL MATRIX */}
          {activeTab === 'skills' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" /> Ma trận Kỹ năng & Xếp hạng Năng lực
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {employee.skills.map((s, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">{s.name}</span>
                      <span className="font-mono font-black text-indigo-600">{s.level}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all" style={{ width: `${s.level}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: FINANCE & PAYROLL */}
          {activeTab === 'finance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-indigo-600" /> Tài khoản Ngân hàng Chi trả Lương
                </h4>
                <div className="space-y-2 text-slate-700">
                  <div className="flex justify-between"><span className="text-slate-400">Ngân hàng:</span><strong>{employee.bankName}</strong></div>
                  <div className="flex justify-between"><span className="text-slate-400">Số tài khoản:</span><strong className="font-mono text-indigo-600 text-sm">{employee.bankAccount}</strong></div>
                  <div className="flex justify-between"><span className="text-slate-400">Chủ tài khoản:</span><strong className="uppercase">{employee.bankBeneficiary}</strong></div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" /> Thuế, BHXH & Quỹ phép năm
                </h4>
                <div className="space-y-2 text-slate-700">
                  <div className="flex justify-between"><span className="text-slate-400">Mã số thuế cá nhân:</span><strong className="font-mono">{employee.taxCode}</strong></div>
                  <div className="flex justify-between"><span className="text-slate-400">Mã số sổ BHXH:</span><strong className="font-mono">{employee.insuranceBookNo}</strong></div>
                  <div className="flex justify-between"><span className="text-slate-400">Mức lương thỏa thuận:</span><strong className="text-slate-900 font-bold">{formatCurrency(employee.baseSalary)}</strong></div>
                  <div className="flex justify-between"><span className="text-slate-400">Quỹ phép năm còn lại:</span><strong className="text-emerald-600 font-bold">{employee.leaveTotal - employee.leaveUsed} / {employee.leaveTotal} ngày</strong></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-400 font-medium">Hồ sơ được xác thực an toàn bởi VComm Core Backend</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer transition-all shadow-xs"
          >
            Đóng Passport
          </button>
        </div>
      </div>
    </div>
  );
}
