import React, { useState } from 'react';
import {
  Sliders,
  ShieldCheck,
  CheckCircle2,
  Crown,
  DollarSign,
  Briefcase,
  Warehouse,
  FileCheck,
  Building2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
  Scale
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { SigningAuthorityRule, INITIAL_AUTHORITY_RULES } from '../../data/hsmSignatureData';

export interface AuthorityMatrixTabProps {
  rules?: SigningAuthorityRule[];
  onSaveMatrix?: () => void;
}

// Comprehensive default authority matrix covering all enterprise tiers
const EXTENDED_DEFAULT_RULES: SigningAuthorityRule[] = [
  {
    roleName: 'Tổng Giám đốc (CEO) / Ban Giám Đốc',
    department: 'Ban Giám Đốc & Hội đồng Quản trị',
    documentTypes: [
      'Hợp đồng kinh tế lớn',
      'Quyết định bổ nhiệm nhân sự cao cấp',
      'Báo cáo tài chính năm kiểm toán',
      'Tờ khai thuế định kỳ',
      'Quyết định đầu tư vốn'
    ],
    maxLimitVND: 0, // Không giới hạn
    requiredSignType: 'Ký số HSM Doanh nghiệp',
    description: 'Đại diện pháp luật tối cao thay mặt công ty giao kết mọi giao dịch thương mại và quyết định đầu tư không giới hạn giá trị.'
  },
  {
    roleName: 'Giám đốc Tài chính / Kế toán trưởng',
    department: 'Tài chính - Kế toán',
    documentTypes: [
      'Hóa đơn điện tử VAT (TT78)',
      'Lệnh chi ngân hàng VietQR',
      'Biên bản đối soát công nợ',
      'Hồ sơ quyết toán quý',
      'Đề nghị thanh toán nhà cung cấp'
    ],
    maxLimitVND: 500000000, // 500 triệu
    requiredSignType: 'Ký số Cá nhân',
    description: 'Chịu trách nhiệm kiểm soát dòng tiền, ký duyệt giải ngân tài chính và báo cáo thuế điện tử trong hạn mức đến 500 triệu đồng.'
  },
  {
    roleName: 'Trưởng phòng Kinh doanh & Mua hàng',
    department: 'Khối Kinh doanh & Thương mại B2B',
    documentTypes: [
      'Hợp đồng đại lý đối tác B2B',
      'Đơn đặt hàng nhà cung cấp (PO)',
      'Biên bản thỏa thuận chiết khấu thương mại',
      'Cam kết bảo lãnh đơn hàng'
    ],
    maxLimitVND: 200000000, // 200 triệu
    requiredSignType: 'Ký số Cá nhân',
    description: 'Ký kết hợp đồng phân phối, đơn mua sắm trang thiết bị và chính sách thương mại đối tác đến 200 triệu đồng.'
  },
  {
    roleName: 'Trưởng kho & Điều phối Vận tải',
    department: 'Kho vận & Vận hành Logistics',
    documentTypes: [
      'Phiếu xuất kho kiêm vận chuyển nội bộ',
      'Phiếu nhập kho hàng hóa PO',
      'Biên bản bàn giao 3PL',
      'Biên bản xử lý hàng hỏng/hao hụt'
    ],
    maxLimitVND: 50000000, // 50 triệu
    requiredSignType: 'Ký số Cá nhân',
    description: 'Xác thực luân chuyển hàng hóa đa kho, điều chuyển tài sản vận tải và biên bản nhập xuất tồn đến 50 triệu đồng.'
  },
  {
    roleName: 'Chuyên viên & Nhân viên Nghiệp vụ',
    department: 'Các Phòng ban Chức năng',
    documentTypes: [
      'Tờ trình đề xuất chi phí',
      'Bảng chấm công & tính lương',
      'Phiếu yêu cầu cấp vật tư',
      'Báo cáo nghiệm thu kỹ thuật'
    ],
    maxLimitVND: 0,
    requiredSignType: 'Ký nháy',
    description: 'Ký nháy kiểm tra xác thực tính chính xác của dữ liệu và hồ sơ chứng từ trước khi trình lên cấp thẩm quyền phê duyệt chính thức.'
  }
];

export const AuthorityMatrixTab: React.FC<AuthorityMatrixTabProps> = ({
  rules,
  onSaveMatrix
}) => {
  const [saveSuccess, setSaveSuccess] = useState(false);

  // If rules are provided and non-empty, use them; otherwise use comprehensive extended default matrix
  const displayRules = rules && rules.length > 0 ? rules : EXTENDED_DEFAULT_RULES;

  const handleSave = () => {
    if (onSaveMatrix) {
      onSaveMatrix();
    }
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  // Helper for role icon and styling
  const getRoleBadgeStyle = (rule: SigningAuthorityRule) => {
    if (rule.maxLimitVND === 0 && rule.requiredSignType === 'Ký số HSM Doanh nghiệp') {
      return {
        icon: Crown,
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        cardBorder: 'border-emerald-200 hover:border-emerald-300',
        limitBg: 'bg-emerald-500/10 text-emerald-800'
      };
    }
    if (rule.maxLimitVND >= 500000000) {
      return {
        icon: DollarSign,
        badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        cardBorder: 'border-indigo-200 hover:border-indigo-300',
        limitBg: 'bg-indigo-500/10 text-indigo-800'
      };
    }
    if (rule.maxLimitVND >= 100000000) {
      return {
        icon: Briefcase,
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
        cardBorder: 'border-blue-200 hover:border-blue-300',
        limitBg: 'bg-blue-500/10 text-blue-800'
      };
    }
    if (rule.maxLimitVND > 0) {
      return {
        icon: Warehouse,
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        cardBorder: 'border-amber-200 hover:border-amber-300',
        limitBg: 'bg-amber-500/10 text-amber-800'
      };
    }
    return {
      icon: FileCheck,
      badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
      cardBorder: 'border-slate-200 hover:border-slate-300',
      limitBg: 'bg-slate-100 text-slate-700'
    };
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in" data-testid="authority-matrix-tab">
      {/* Save Success Alert */}
      {saveSuccess && (
        <div 
          className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl p-4 flex items-center justify-between text-xs animate-in fade-in shadow-xs"
          data-testid="matrix-save-success-alert"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <span className="font-bold text-sm block">Cập nhật ma trận thẩm quyền thành công!</span>
              <span className="text-emerald-700">
                Các quy định về hạn mức ký duyệt và phân quyền chữ ký số đã được đồng bộ hóa với hệ thống workflow.
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-emerald-600 bg-white/60 px-2 py-1 rounded-md">
            RFC 3161 Synced
          </span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
              Quy Định & Ma Trận Thẩm Quyền Ký Số Doanh Nghiệp
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Căn cứ Luật Giao dịch Điện tử số 20/2023/QH15, Nghị định 130/2018/NĐ-CP và Quy chế An toàn Mật mã VComm Corporation.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Phân quyền 5 cấp</span>
          </div>

          <button
            onClick={handleSave}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2"
            data-testid="save-matrix-button"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Cập Nhật Ma Trận</span>
          </button>
        </div>
      </div>

      {/* Signing Multi-Tier Workflow Visual Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-3 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              Quy Trình Leo Thang Thẩm Quyền Phê Duyệt (Escalation Policy)
            </span>
          </div>
          <span className="px-2.5 py-0.5 bg-white/10 rounded-full text-[10px] text-indigo-200 font-mono">
            Auto Enforce
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 relative z-10 text-xs">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Bước 1: Soạn thảo & Ký nháy</div>
            <div className="font-bold text-slate-100">Chuyên viên phòng ban</div>
            <div className="text-[11px] text-indigo-300">Ký nháy nội bộ xác thực hồ sơ</div>
          </div>

          <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Bước 2: Quản lý bộ phận</div>
            <div className="font-bold text-slate-100">Trưởng phòng / Trưởng kho</div>
            <div className="text-[11px] text-indigo-300">Ký số cá nhân (≤ 200 triệu)</div>
          </div>

          <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Bước 3: Thẩm định tài chính</div>
            <div className="font-bold text-slate-100">Kế toán trưởng / CFO</div>
            <div className="text-[11px] text-indigo-300">Ký số cá nhân (≤ 500 triệu)</div>
          </div>

          <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
            <div className="text-[10px] text-amber-300 font-semibold uppercase">Bước 4: Phê duyệt tối cao</div>
            <div className="font-bold text-amber-200">Tổng Giám Đốc (CEO)</div>
            <div className="text-[11px] text-amber-300">Đóng mộc số Cloud HSM (&gt; 500 triệu)</div>
          </div>
        </div>
      </div>

      {/* Authority Matrix Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="authority-rules-grid">
        {displayRules.map((rule, idx) => {
          const style = getRoleBadgeStyle(rule);
          const IconComp = style.icon;

          return (
            <div
              key={idx}
              className={cn(
                "bg-white p-5 rounded-2xl border shadow-xs transition-all flex flex-col justify-between space-y-4",
                style.cardBorder
              )}
              data-testid={`authority-rule-card-${idx}`}
            >
              {/* Card Header: Role & Department */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs", style.badgeBg)}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-snug">
                        {rule.roleName}
                      </h3>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{rule.department}</span>
                      </div>
                    </div>
                  </div>

                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-bold border flex-shrink-0 whitespace-nowrap",
                    rule.requiredSignType === 'Ký số HSM Doanh nghiệp' 
                      ? "bg-purple-50 text-purple-700 border-purple-200" 
                      : rule.requiredSignType === 'Ký số Cá nhân'
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  )}>
                    {rule.requiredSignType}
                  </span>
                </div>

                {/* Financial Limit Highlight Box */}
                <div className={cn("p-3 rounded-xl border border-slate-200/80 space-y-1.5", style.limitBg)}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                      Hạn mức phê duyệt tối đa:
                    </span>
                    <span className="font-black text-sm">
                      {rule.maxLimitVND === 0 && rule.requiredSignType === 'Ký nháy' ? (
                        <span className="text-slate-600">Ký nháy nội bộ</span>
                      ) : rule.maxLimitVND === 0 ? (
                        <span className="text-emerald-700">Không giới hạn</span>
                      ) : (
                        <span className="text-slate-900 font-mono">{formatCurrency(rule.maxLimitVND)}</span>
                      )}
                    </span>
                  </div>

                  {rule.maxLimitVND > 0 && (
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span>Vượt hạn mức trên: Tự động luân chuyển lên cấp thẩm quyền cao hơn.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Types Allowed */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Loại văn bản được phép ký duyệt:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {rule.documentTypes.map((docType, dIdx) => (
                    <span
                      key={dIdx}
                      className="px-2 py-0.8 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium border border-slate-200/60"
                    >
                      {docType}
                    </span>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 italic leading-relaxed">
                "{rule.description}"
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
