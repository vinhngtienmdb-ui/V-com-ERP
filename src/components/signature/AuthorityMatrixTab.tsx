import React, { useState, useEffect } from 'react';
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
  Scale,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Check,
  RotateCcw,
  FileText,
  AlertCircle
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { SigningAuthorityRule, INITIAL_AUTHORITY_RULES } from '../../data/hsmSignatureData';

export interface AuthorityMatrixTabProps {
  rules?: SigningAuthorityRule[];
  onSaveMatrix?: (updatedRules?: SigningAuthorityRule[]) => void;
  onUpdateRules?: (updatedRules: SigningAuthorityRule[]) => void;
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

// Document Type Quick Suggestion Tags
const SUGGESTED_DOC_TYPES = [
  'Hợp đồng kinh tế',
  'Hóa đơn điện tử VAT (TT78)',
  'Lệnh chi ngân hàng',
  'Phiếu xuất kho 3PL',
  'Đề nghị thanh toán',
  'Báo cáo tài chính',
  'Tờ khai thuế định kỳ',
  'Quyết định bổ nhiệm',
  'Hợp đồng lao động',
  'Tờ trình chi phí'
];

interface RuleFormData {
  roleName: string;
  department: string;
  documentTypesText: string;
  maxLimitVND: number;
  isUnlimited: boolean;
  requiredSignType: 'Ký nháy' | 'Ký số Cá nhân' | 'Ký số HSM Doanh nghiệp';
  description: string;
}

const DEFAULT_FORM_DATA: RuleFormData = {
  roleName: '',
  department: '',
  documentTypesText: 'Hợp đồng kinh tế, Hóa đơn điện tử VAT',
  maxLimitVND: 50000000,
  isUnlimited: false,
  requiredSignType: 'Ký số Cá nhân',
  description: ''
};

export const AuthorityMatrixTab: React.FC<AuthorityMatrixTabProps> = ({
  rules,
  onSaveMatrix,
  onUpdateRules
}) => {
  // If rules are provided and non-empty, use them; otherwise use comprehensive extended default matrix
  const initialRules = rules && rules.length > 0 ? rules : EXTENDED_DEFAULT_RULES;
  const [rulesList, setRulesList] = useState<SigningAuthorityRule[]>(initialRules);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<RuleFormData>(DEFAULT_FORM_DATA);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal State for Delete Confirmation
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  // Sync with prop when parent updates rules
  useEffect(() => {
    if (rules && rules.length > 0) {
      setRulesList(rules);
    }
  }, [rules]);

  const showNotification = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 3500);
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

  // --- Handlers: Modal Open & Close ---
  const handleOpenAddModal = () => {
    setEditingIndex(null);
    setFormData(DEFAULT_FORM_DATA);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (targetIndex: number) => {
    const rule = rulesList[targetIndex];
    if (!rule) return;

    setEditingIndex(targetIndex);
    setFormData({
      roleName: rule.roleName,
      department: rule.department,
      documentTypesText: rule.documentTypes.join(', '),
      maxLimitVND: rule.maxLimitVND,
      isUnlimited: rule.maxLimitVND === 0 && rule.requiredSignType !== 'Ký nháy',
      requiredSignType: rule.requiredSignType,
      description: rule.description
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingIndex(null);
    setFormError(null);
  };

  // Add tag suggestion to text
  const handleAddDocTypeSuggestion = (tag: string) => {
    const currentTypes = formData.documentTypesText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (!currentTypes.includes(tag)) {
      currentTypes.push(tag);
      setFormData(prev => ({
        ...prev,
        documentTypesText: currentTypes.join(', ')
      }));
    }
  };

  // --- Submit Add / Edit Form ---
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roleName.trim()) {
      setFormError('Vui lòng nhập tên chức danh / cấp bậc.');
      return;
    }
    if (!formData.department.trim()) {
      setFormError('Vui lòng nhập phòng ban hoặc bộ phận.');
      return;
    }

    const docTypes = formData.documentTypesText
      .split(/[,;\n]/)
      .map(s => s.trim())
      .filter(Boolean);

    const newRule: SigningAuthorityRule = {
      roleName: formData.roleName.trim(),
      department: formData.department.trim(),
      documentTypes: docTypes.length > 0 ? docTypes : ['Văn bản nội bộ theo phân công'],
      maxLimitVND: formData.isUnlimited ? 0 : Math.max(0, Number(formData.maxLimitVND) || 0),
      requiredSignType: formData.requiredSignType,
      description: formData.description.trim() || `Quy định thẩm quyền ký số cấp ${formData.roleName} thuộc ${formData.department}.`
    };

    let updatedRules: SigningAuthorityRule[];
    if (editingIndex !== null) {
      updatedRules = rulesList.map((item, idx) => (idx === editingIndex ? newRule : item));
      showNotification(`Đã cập nhật quy định thẩm quyền cho "${newRule.roleName}"!`);
    } else {
      updatedRules = [...rulesList, newRule];
      showNotification(`Đã thêm mới quy định thẩm quyền cho "${newRule.roleName}"!`);
    }

    setRulesList(updatedRules);
    if (onUpdateRules) onUpdateRules(updatedRules);
    if (onSaveMatrix) onSaveMatrix(updatedRules);

    handleCloseModal();
  };

  // --- Handlers: Delete Rule ---
  const handleRequestDelete = (index: number) => {
    setDeletingIndex(index);
  };

  const handleConfirmDelete = () => {
    if (deletingIndex === null) return;
    const deletedRole = rulesList[deletingIndex]?.roleName;
    const updatedRules = rulesList.filter((_, idx) => idx !== deletingIndex);

    setRulesList(updatedRules);
    if (onUpdateRules) onUpdateRules(updatedRules);
    if (onSaveMatrix) onSaveMatrix(updatedRules);

    setDeletingIndex(null);
    showNotification(`Đã xóa quy định thẩm quyền "${deletedRole || ''}" thành công!`);
  };

  // --- Manual Sync Button ---
  const handleSave = () => {
    if (onSaveMatrix) {
      onSaveMatrix(rulesList);
    }
    showNotification('Cập nhật ma trận thẩm quyền thành công!');
  };

  // Filtered rules for search
  const filteredRulesWithOriginalIndex = rulesList.map((rule, origIdx) => ({ rule, origIdx })).filter(({ rule }) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      rule.roleName.toLowerCase().includes(query) ||
      rule.department.toLowerCase().includes(query) ||
      rule.requiredSignType.toLowerCase().includes(query) ||
      rule.documentTypes.some(d => d.toLowerCase().includes(query))
    );
  });

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in" data-testid="authority-matrix-tab">
      {/* Save Success Alert */}
      {saveSuccessMsg && (
        <div 
          className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl p-4 flex items-center justify-between text-xs animate-in fade-in shadow-xs"
          data-testid="matrix-save-success-alert"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <span className="font-bold text-sm block">Cập nhật ma trận thẩm quyền thành công!</span>
              <span className="text-emerald-700">
                {saveSuccessMsg} Các quy định về hạn mức ký duyệt và phân quyền chữ ký số đã được đồng bộ hóa với hệ thống workflow.
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

        <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Phân quyền {rulesList.length} cấp</span>
          </div>

          {/* Nút Thêm mới Quy định */}
          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
            data-testid="btn-add-authority-rule"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm Quy Định Phân Quyền</span>
          </button>

          {/* Nút Cập nhật Đồng bộ */}
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
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

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo chức danh, phòng ban, loại chứng từ..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            data-testid="input-search-authority-rules"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Hiển thị <strong>{filteredRulesWithOriginalIndex.length}</strong> / {rulesList.length} quy định thẩm quyền
        </div>
      </div>

      {/* Authority Matrix Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="authority-rules-grid">
        {filteredRulesWithOriginalIndex.map(({ rule, origIdx }) => {
          const style = getRoleBadgeStyle(rule);
          const IconComp = style.icon;

          return (
            <div
              key={origIdx}
              className={cn(
                "bg-white dark:bg-slate-900 p-5 rounded-2xl border shadow-xs transition-all flex flex-col justify-between space-y-4 relative group",
                style.cardBorder
              )}
              data-testid={`authority-rule-card-${origIdx}`}
            >
              {/* Card Header: Role, Department, and Action Buttons */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs", style.badgeBg)}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                        {rule.roleName}
                      </h3>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{rule.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete buttons */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(origIdx)}
                      className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-300 dark:hover:bg-indigo-950/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer"
                      title="Sửa quy định thẩm quyền"
                      data-testid={`btn-edit-rule-${origIdx}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Sửa</span>
                    </button>
                    <button
                      onClick={() => handleRequestDelete(origIdx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
                      title="Xóa quy định thẩm quyền"
                      data-testid={`btn-delete-rule-${origIdx}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Badge Sign Type */}
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-bold border flex-shrink-0 whitespace-nowrap",
                    rule.requiredSignType === 'Ký số HSM Doanh nghiệp' 
                      ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300" 
                      : rule.requiredSignType === 'Ký số Cá nhân'
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300"
                      : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  )}>
                    {rule.requiredSignType}
                  </span>
                </div>

                {/* Financial Limit Highlight Box */}
                <div className={cn("p-3 rounded-xl border border-slate-200/80 space-y-1.5", style.limitBg)}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                      Hạn mức phê duyệt tối đa:
                    </span>
                    <span className="font-black text-sm">
                      {rule.maxLimitVND === 0 && rule.requiredSignType === 'Ký nháy' ? (
                        <span className="text-slate-600 dark:text-slate-400">Ký nháy nội bộ</span>
                      ) : rule.maxLimitVND === 0 ? (
                        <span className="text-emerald-700 dark:text-emerald-400">Không giới hạn</span>
                      ) : (
                        <span className="text-slate-900 dark:text-white font-mono">{formatCurrency(rule.maxLimitVND)}</span>
                      )}
                    </span>
                  </div>

                  {rule.maxLimitVND > 0 && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span>Vượt hạn mức trên: Tự động luân chuyển lên cấp thẩm quyền cao hơn.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Types Allowed */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Loại văn bản được phép ký duyệt:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {rule.documentTypes.map((docType, dIdx) => (
                    <span
                      key={dIdx}
                      className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-[11px] font-medium border border-slate-200/60 dark:border-slate-700/60"
                    >
                      {docType}
                    </span>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 italic leading-relaxed">
                "{rule.description}"
              </div>
            </div>
          );
        })}
      </div>

      {filteredRulesWithOriginalIndex.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <Sliders className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Không tìm thấy quy định phù hợp</h4>
          <p className="text-xs text-slate-500">Thử tìm kiếm với từ khóa khác hoặc bấm nút thêm mới để thiết lập quy định phân quyền.</p>
          <button
            onClick={() => setSearchQuery('')}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Xóa bộ lọc tìm kiếm
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Thêm / Sửa Quy Định Thẩm Quyền (Add/Edit Modal) */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          data-testid="authority-rule-modal"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm md:text-base text-slate-900 dark:text-white">
                    {editingIndex !== null ? 'Chỉnh Sửa Quy Định Thẩm Quyền' : 'Thêm Quy Định Thẩm Quyền Mới'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cấu hình chức danh, phân tầng hạn mức duyệt và loại chứng thư số
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                data-testid="btn-close-rule-modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Row 1: Role Name & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    Tên Chức danh / Cấp bậc <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.roleName}
                    onChange={e => setFormData({ ...formData, roleName: e.target.value })}
                    placeholder="VD: Phó Tổng Giám Đốc (COO)"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    data-testid="input-rule-role"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    Phòng ban / Khối ban <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    placeholder="VD: Khối Vận hành & Logistics"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    data-testid="input-rule-dept"
                  />
                </div>
              </div>

              {/* Row 2: Required Sign Type */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                  Loại Chữ ký số Bắt buộc
                </label>
                <select
                  value={formData.requiredSignType}
                  onChange={e => setFormData({ ...formData, requiredSignType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  data-testid="select-rule-sign-type"
                >
                  <option value="Ký số HSM Doanh nghiệp">Ký số HSM Doanh nghiệp (Pháp nhân tối cao)</option>
                  <option value="Ký số Cá nhân">Ký số Cá nhân (Chứng thư số CBNV theo vị trí)</option>
                  <option value="Ký nháy">Ký nháy (Xác thực nội bộ)</option>
                </select>
              </div>

              {/* Row 3: Max Financial Limit VND */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-200">
                    Hạn mức phê duyệt tối đa (VNĐ)
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 cursor-pointer font-semibold">
                    <input
                      type="checkbox"
                      checked={formData.isUnlimited}
                      onChange={e => setFormData({ ...formData, isUnlimited: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                      data-testid="checkbox-rule-unlimited"
                    />
                    <span>Không giới hạn hạn mức</span>
                  </label>
                </div>

                {!formData.isUnlimited ? (
                  <div className="space-y-1">
                    <input
                      type="number"
                      min={0}
                      step={1000000}
                      value={formData.maxLimitVND}
                      onChange={e => setFormData({ ...formData, maxLimitVND: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      data-testid="input-rule-limit"
                    />
                    <div className="text-[11px] text-slate-500 flex justify-between font-mono">
                      <span>Bằng chữ:</span>
                      <strong className="text-indigo-600 dark:text-indigo-400">{formatCurrency(formData.maxLimitVND)}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Cấp bậc này có quyền ký duyệt không hạn chế số tiền giao dịch.</span>
                  </div>
                )}
              </div>

              {/* Row 4: Document Types */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                  Danh mục Loại văn bản được phép ký (cách nhau bởi dấu phẩy)
                </label>
                <textarea
                  rows={2}
                  value={formData.documentTypesText}
                  onChange={e => setFormData({ ...formData, documentTypesText: e.target.value })}
                  placeholder="VD: Hợp đồng kinh tế, Hóa đơn GTGT, Phiếu xuất kho 3PL..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  data-testid="input-rule-doc-types"
                />

                {/* Suggestions */}
                <div className="mt-2 space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                    Gợi ý nhanh loại chứng từ:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {SUGGESTED_DOC_TYPES.map((tag, tIdx) => (
                      <button
                        type="button"
                        key={tIdx}
                        onClick={() => handleAddDocTypeSuggestion(tag)}
                        className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 rounded-md text-[10px] text-slate-600 dark:text-slate-400 transition-colors border border-slate-200 dark:border-slate-700"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 5: Description & Policy Basis */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                  Mô tả Trách nhiệm & Căn cứ Pháp lý
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ghi chú phân quyền, phạm vi áp dụng và cơ chế kiểm soát rủi ro..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  data-testid="textarea-rule-desc"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors cursor-pointer"
                  data-testid="btn-cancel-rule-modal"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  data-testid="btn-save-rule-modal"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingIndex !== null ? 'Lưu Thay Đổi' : 'Thêm Quy Định'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Xác Nhận Xóa Quy Định Thẩm Quyền (Delete Confirm Modal) */}
      {/* ========================================================================= */}
      {deletingIndex !== null && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          data-testid="delete-rule-confirm-modal"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Xác nhận xóa quy định thẩm quyền?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Bạn có chắc chắn muốn xóa quy định thẩm quyền của{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {rulesList[deletingIndex]?.roleName}
                  </strong>{' '}
                  thuộc bộ phận{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {rulesList[deletingIndex]?.department}
                  </strong>
                  ?
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                  ⚠️ Việc xóa có thể ảnh hưởng đến luồng xét duyệt tự động của các văn bản đang chờ ký.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => setDeletingIndex(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors cursor-pointer"
                data-testid="btn-cancel-delete-rule"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                data-testid="btn-confirm-delete-rule"
              >
                Xóa Quy Định
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
