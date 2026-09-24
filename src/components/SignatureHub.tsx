import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileSignature, 
  Key, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Search, 
  RefreshCw,
  FileText,
  Lock,
  UserCheck,
  Building2,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  Server,
  Zap,
  Plus,
  Filter,
  Check,
  X,
  ChevronRight,
  Download,
  Upload,
  Layers,
  Sparkles,
  Sliders,
  DollarSign,
  Calendar,
  Eye,
  ExternalLink,
  Shield,
  Activity,
  UserX,
  RotateCw
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { 
  CompanyHSMProfile,
  PersonalCertificate,
  SigningDocument,
  SigningAuthorityRule,
  HSMAuditLog,
  INITIAL_COMPANY_HSM,
  INITIAL_PERSONAL_CERTS,
  INITIAL_SIGNING_DOCUMENTS,
  INITIAL_AUTHORITY_RULES,
  INITIAL_HSM_LOGS
} from '../data/hsmSignatureData';
import { HrmStaffOrRequestPickerModal } from './common/HrmStaffOrRequestPickerModal';
import { hrmEmployeeService, HrmEmployee, HrmPersonalRequest } from '../services/hrmEmployeeService';

export function SignatureHub() {
  const navigate = useNavigate();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<
    'company_hsm' | 'personal_certs' | 'signing_workspace' | 'authority_matrix' | 'audit_logs'
  >('company_hsm');

  // HSM Company State
  const [companyHsm, setCompanyHsm] = useState<CompanyHSMProfile>(INITIAL_COMPANY_HSM);
  const [isTestingHsm, setIsTestingHsm] = useState(false);
  const [testHsmSuccess, setTestHsmSuccess] = useState(false);

  // Personal Certificates State
  const [personalCerts, setPersonalCerts] = useState<PersonalCertificate[]>(INITIAL_PERSONAL_CERTS);
  const [certFilterStatus, setCertFilterStatus] = useState<string>('all');
  const [certSearch, setCertSearch] = useState<string>('');

  // Signing Documents State
  const [documents, setDocuments] = useState<SigningDocument[]>(INITIAL_SIGNING_DOCUMENTS);
  const [docFilterStatus, setDocFilterStatus] = useState<'pending' | 'signed'>('pending');
  const [docSearch, setDocSearch] = useState<string>('');

  // Modals State
  const [showIssueCertModal, setShowIssueCertModal] = useState(false);
  const [showSigningModal, setShowSigningModal] = useState(false);
  const [selectedDocToSign, setSelectedDocToSign] = useState<SigningDocument | null>(null);
  const [signingMethod, setSigningMethod] = useState<'company_hsm' | 'personal_cert'>('company_hsm');
  const [signingPin, setSigningPin] = useState('');
  const [isSigningProcess, setIsSigningProcess] = useState(false);

  // Verification Modal State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedDocToVerify, setSelectedDocToVerify] = useState<SigningDocument | null>(null);

  // HRM Integration State (Strict No-Manual-Entry)
  const [showHrmPicker, setShowHrmPicker] = useState(false);
  const [pickerDefaultTab, setPickerDefaultTab] = useState<'cbnv' | 'hrm_request'>('cbnv');
  const [hrmSourceLabel, setHrmSourceLabel] = useState<string | null>(
    'Đã trích xuất từ Hồ sơ CBNV: EMP-2068 - Hoàng Văn Thái'
  );

  // New Certificate Form State (Locked from manual input, filled from HRM)
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

  const handleSelectHrmStaff = (emp: HrmEmployee, source: 'cbnv' | 'current_user', originalReq?: HrmPersonalRequest) => {
    let determinedCertType: 'executive' | 'accounting_warehouse' | 'staff_internal' = 'staff_internal';
    let defaultLimit = 30000000;

    if (emp.department.includes('Giám Đốc') || emp.title.includes('Giám Đốc') || emp.title.includes('CEO') || emp.title.includes('COO')) {
      determinedCertType = 'executive';
      defaultLimit = 0; // unlimited
    } else if (emp.department.includes('Kế toán') || emp.department.includes('Tài chính') || emp.department.includes('Kho')) {
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

  // Logs State
  const [auditLogs, setAuditLogs] = useState<HSMAuditLog[]>(INITIAL_HSM_LOGS);

  // Filtered Personal Certs
  const filteredCerts = personalCerts.filter(cert => {
    const matchStatus = certFilterStatus === 'all' || cert.status === certFilterStatus;
    const matchSearch = cert.fullName.toLowerCase().includes(certSearch.toLowerCase()) ||
                        cert.email.toLowerCase().includes(certSearch.toLowerCase()) ||
                        cert.serialNumber.toLowerCase().includes(certSearch.toLowerCase()) ||
                        cert.department.toLowerCase().includes(certSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Filtered Signing Documents
  const filteredDocs = documents.filter(doc => {
    const matchStatus = doc.status === docFilterStatus;
    const matchSearch = doc.title.toLowerCase().includes(docSearch.toLowerCase()) ||
                        doc.docCode.toLowerCase().includes(docSearch.toLowerCase()) ||
                        doc.requestedBy.toLowerCase().includes(docSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Handle Test HSM Connection
  const handleTestHsm = () => {
    setIsTestingHsm(true);
    setTimeout(() => {
      setIsTestingHsm(false);
      setTestHsmSuccess(true);
      setTimeout(() => setTestHsmSuccess(false), 4000);
    }, 900);
  };

  // Handle Toggle Auto Sign Rule
  const handleToggleAutoSign = (rule: keyof CompanyHSMProfile['autoSignRules']) => {
    setCompanyHsm(prev => ({
      ...prev,
      autoSignRules: {
        ...prev.autoSignRules,
        [rule]: !prev.autoSignRules[rule]
      }
    }));
  };

  // Handle Certificate Status Changes
  const handleCertAction = (certId: string, action: 'suspend' | 'activate' | 'revoke' | 'renew') => {
    setPersonalCerts(prev => prev.map(cert => {
      if (cert.id === certId) {
        if (action === 'suspend') return { ...cert, status: 'suspended', revocationReason: 'Tạm khóa theo yêu cầu kiểm tra nội bộ' };
        if (action === 'activate') return { ...cert, status: 'active', revocationReason: undefined };
        if (action === 'revoke') return { ...cert, status: 'revoked', revocationReason: 'Đã thu hồi chứng thư do chấm dứt nhiệm vụ' };
        if (action === 'renew') return { ...cert, expiryDate: '18/09/2029', status: 'active' };
      }
      return cert;
    }));
  };

  // Handle Submit Issue New Certificate
  const handleIssueCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    const newCert: PersonalCertificate = {
      id: `CERT-${String(personalCerts.length + 1).padStart(3, '0')}`,
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

    setPersonalCerts([newCert, ...personalCerts]);
    
    // Add audit log
    const newLog: HSMAuditLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      action: `Cấp phát Chứng thư số cá nhân (${newCertForm.algorithm}) cho ${newCertForm.fullName}`,
      performedBy: 'Nguyễn Tiến Vĩnh (Super Admin)',
      certSerial: newCert.serialNumber,
      targetDocCode: newCert.staffCode,
      algorithm: newCertForm.algorithm,
      hashSHA256: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
      ipAddress: '118.69.182.10 (Office SG)',
      status: 'success'
    };
    setAuditLogs([newLog, ...auditLogs]);

    setShowIssueCertModal(false);
    alert(`Đã cấp phát thành công Chứng thư số cho ${newCert.fullName} (Serial: ${newCert.serialNumber})!`);
  };

  // Handle Document Signing Execution
  const handleExecuteSigning = () => {
    if (!selectedDocToSign) return;
    if (signingPin.length < 4) {
      alert('Vui lòng nhập đầy đủ mã PIN xác thực chữ ký!');
      return;
    }

    setIsSigningProcess(true);
    setTimeout(() => {
      const isHsm = signingMethod === 'company_hsm';
      const signerName = isHsm 
        ? 'Viettel Cloud HSM (CÔNG TY CP TMĐT VCOMM)' 
        : 'Nguyễn Tiến Vĩnh (Tổng Giám đốc)';
      const certSerial = isHsm ? companyHsm.serialNumber : '7A:31:09:FE:44:88:91:AA';
      const methodText = isHsm ? 'Cloud HSM Remote Signing' : 'Personal Certificate RSA 2048';

      // Update Document Status
      setDocuments(prev => prev.map(doc => {
        if (doc.id === selectedDocToSign.id) {
          return {
            ...doc,
            status: 'signed',
            signedBy: {
              name: signerName,
              certSerial,
              signedAt: new Date().toLocaleString('vi-VN'),
              method: methodText,
              hashSHA256: 'b4c6e9a01f48821d3e8e19b52a129d3810f92b7c61589da016cf29410ea6911c'
            }
          };
        }
        return doc;
      }));

      // Deduct HSM quota if HSM was used
      if (isHsm) {
        setCompanyHsm(prev => ({
          ...prev,
          remainingSignatures: Math.max(0, prev.remainingSignatures - 1)
        }));
      }

      // Add to Audit Log
      const signLog: HSMAuditLog = {
        id: `LOG-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleString('vi-VN'),
        action: `Ký số thành công tài liệu #${selectedDocToSign.docCode} (${selectedDocToSign.title})`,
        performedBy: signerName,
        certSerial,
        targetDocCode: selectedDocToSign.docCode,
        algorithm: 'RSA-SHA256',
        hashSHA256: 'b4c6e9a01f48821d3e8e19b52a129d3810f92b7c61589da016cf29410ea6911c',
        ipAddress: '118.69.182.10 (SSL Verified Session)',
        status: 'success'
      };
      setAuditLogs([signLog, ...auditLogs]);

      setIsSigningProcess(false);
      setShowSigningModal(false);
      setSigningPin('');
      alert(`Đã ký số thành công văn bản #${selectedDocToSign.docCode} bằng ${isHsm ? 'Cloud HSM Công ty' : 'Chứng thư số Cá nhân'}!`);
    }, 800);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 text-slate-800 p-2 md:p-4">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md">
            <Key className="w-3.5 h-3.5 text-amber-300" />
            Trung Tâm Ký Số & Cloud HSM Doanh Nghiệp
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Quản Trị Chữ Ký Số Cloud HSM & Cấp Phát Chứng Thư
          </h1>
          <p className="text-indigo-200 text-xs md:text-sm max-w-2xl leading-relaxed">
            Kết nối chữ ký số HSM pháp nhân công ty (<code className="font-mono text-white font-bold">MST: {companyHsm.taxCode}</code>), ký số tự động hóa đơn & thuế, đồng thời quản lý cấp phát chứng thư số nội bộ cho từng cán bộ nhân viên.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 flex-wrap">
          <button
            onClick={() => {
              setNewCertForm({
                staffCode: 'EMP-0006',
                fullName: 'Hoàng Văn Thái',
                email: 'thai.hv@vcomm.vn',
                department: 'Kinh doanh & Bán lẻ',
                title: 'Trưởng nhóm Bán hàng O2O',
                certType: 'staff_internal',
                algorithm: 'RSA 2048-bit',
                signingLimitVND: 30000000,
                validYears: 3,
                pinCode: '123456'
              });
              setShowIssueCertModal(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-900/40 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Cấp Chứng Thư Mới
          </button>

          <button
            onClick={() => setActiveTab('signing_workspace')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2"
          >
            <FileSignature className="w-4 h-4 text-amber-300" /> Bàn Ký Điện Tử
          </button>
        </div>
      </div>

      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Trạng Thái Cloud HSM</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            Operational
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            {companyHsm.provider} • Tốc độ {companyHsm.tpsSpeed} TPS
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Hạn Ngạch Lượt Ký HSM</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {companyHsm.remainingSignatures.toLocaleString('vi-VN')}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Còn lại trên tổng {companyHsm.totalSignaturesQuota.toLocaleString('vi-VN')} lượt
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Chứng Thư Cá Nhân Đã Cấp</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600">
            {personalCerts.length} Cán bộ
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {personalCerts.filter(c => c.status === 'active').length} Đang hoạt động • {personalCerts.filter(c => c.status === 'suspended').length} Tạm khóa
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Tài Liệu Đang Chờ Ký</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">
            {documents.filter(d => d.status === 'pending').length} Văn bản
          </div>
          <div className="mt-2 text-xs text-rose-500 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> 02 văn bản ưu tiên cao
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs Bar */}
        <div className="p-4 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'company_hsm', label: 'Chữ Ký Số HSM Công Ty', icon: Server },
              { id: 'personal_certs', label: 'Cấp Phát Chứng Thư Cá Nhân', icon: UserCheck },
              { id: 'signing_workspace', label: 'Bàn Ký Số & Trình Ký', icon: FileSignature },
              { id: 'authority_matrix', label: 'Ma Trận Thẩm Quyền Ký', icon: Sliders },
              { id: 'audit_logs', label: 'Nhật Ký Truy Vết Ký Số', icon: Lock }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2",
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-500 font-medium hidden lg:flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Tuân thủ Luật Giao dịch điện tử & NĐ 130/2018/NĐ-CP
          </div>
        </div>

        {/* TAB 1: QUẢN TRỊ CHỮ KÝ SỐ HSM PHÁP NHÂN CÔNG TY */}
        {activeTab === 'company_hsm' && (
          <div className="p-6 space-y-6 animate-in fade-in">
            {testHsmSuccess && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-center gap-3 text-emerald-800 text-xs animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <span className="font-bold">Kiểm tra kết nối HSM thành công!</span> Cụm Cloud HSM Viettel-CA phản hồi với độ trễ <strong>14ms</strong>, Slot Token sẵn sàng xử lý ký số với tốc độ <strong>120 TPS</strong>.
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Certificate Details & HSM Appliance Specs */}
              <div className="lg:col-span-2 space-y-6">
                {/* Certificate Identity Card */}
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4 relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-6 h-6 text-amber-400" />
                      <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                        Chứng Thư Số Pháp Nhân Công Ty
                      </span>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-black rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Có hiệu lực
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-black">{companyHsm.companyName}</h2>
                    <div className="text-xs text-indigo-200 mt-1 flex items-center gap-3 flex-wrap">
                      <span>Mã số thuế: <strong className="text-white font-mono">{companyHsm.taxCode}</strong></span>
                      <span>•</span>
                      <span>Nhà cung cấp: <strong className="text-white">{companyHsm.provider}</strong></span>
                      <span>•</span>
                      <span>Tiêu chuẩn: <strong className="text-white">{companyHsm.fipsStandard}</strong></span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 font-mono text-xs text-indigo-100 break-all space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-sans">Subject DN:</div>
                    <div className="text-[11px]">{companyHsm.subjectDN}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-sans pt-1">Serial Number:</div>
                    <div className="text-amber-300 font-bold">{companyHsm.serialNumber}</div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs pt-1 border-t border-white/10">
                    <div>
                      <span className="block text-slate-400 text-[10px]">Ngày cấp</span>
                      <span className="font-semibold">{companyHsm.validFrom}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[10px]">Ngày hết hạn</span>
                      <span className="font-semibold">{companyHsm.validTo}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[10px]">Thời gian còn lại</span>
                      <span className="font-bold text-amber-300">{companyHsm.daysRemaining} ngày</span>
                    </div>
                  </div>
                </div>

                {/* Cloud HSM Infrastructure Monitoring */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">Thông Số Kỹ Thuật Cloud HSM</h3>
                      <p className="text-xs text-slate-500">Giám sát Slot, Token ID và lưu lượng ký số</p>
                    </div>
                    <button
                      onClick={handleTestHsm}
                      disabled={isTestingHsm}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {isTestingHsm ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5 text-indigo-600" />}
                      Test Kết Nối HSM
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase block">Slot ID</span>
                      <span className="font-mono font-bold text-slate-800">{companyHsm.slotId}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase block">Token Label</span>
                      <span className="font-mono font-bold text-slate-800">{companyHsm.tokenLabel}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase block">Tốc độ Ký (TPS)</span>
                      <span className="font-bold text-emerald-600">{companyHsm.tpsSpeed} TPS</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase block">Mã PIN Slot</span>
                      <span className="font-mono font-bold text-slate-800">•••••••• (Đã khóa)</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 flex items-center justify-between">
                    <div>
                      Endpoint kết nối: <code className="font-mono font-bold text-indigo-900">{companyHsm.serverEndpoint}</code>
                    </div>
                    <button
                      onClick={() => alert('Chức năng bảo mật: Yêu cầu xác thực OTP của Super Admin trước khi thay đổi mã PIN Slot HSM.')}
                      className="text-xs text-indigo-700 hover:underline font-bold"
                    >
                      Đổi mã PIN HSM
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Col: Auto Batch Signing Rules */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Cấu Hình Ký Tự Động (Auto-Sign)</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Tự động kích hoạt ký Cloud HSM theo sự kiện luồng nghiệp vụ</p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900">Hóa Đơn Điện Tử (TT78)</div>
                        <div className="text-[11px] text-slate-500">Tự động ký số khi đơn hàng giao thành công</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={companyHsm.autoSignRules.invoices}
                          onChange={() => handleToggleAutoSign('invoices')}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900">Phiếu Xuất Kho Vận Chuyển</div>
                        <div className="text-[11px] text-slate-500">Ký số lệnh xuất kho 3PL GHN/GHTK</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={companyHsm.autoSignRules.warehouseReceipts}
                          onChange={() => handleToggleAutoSign('warehouseReceipts')}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900">Biên Bản Đối Soát Công Nợ</div>
                        <div className="text-[11px] text-slate-500">Tự động ký đối soát nhà bán định kỳ T+7</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={companyHsm.autoSignRules.reconciliations}
                          onChange={() => handleToggleAutoSign('reconciliations')}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900">Tờ Khai Thuế Định Kỳ</div>
                        <div className="text-[11px] text-slate-500">Yêu cầu duyệt thủ công của Kế toán trưởng</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={companyHsm.autoSignRules.taxDeclarations}
                          onChange={() => handleToggleAutoSign('taxDeclarations')}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-2 text-xs text-amber-900">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Lưu Ý Bảo Mật Pháp Lý (TT 16/2019/TT-BTTTT)
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Khóa ký số HSM được lưu trữ an toàn trong vùng bảo mật chuẩn FIPS 140-2 Level 3 của nhà cung cấp. Mọi giao dịch ký số tự động đều được gắn kèm Dấu thời gian điện tử (Timestamp Authority - TSA).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CẤP PHÁT & QUẢN LÝ CHỨNG THƯ SỐ CÁ NHÂN */}
        {activeTab === 'personal_certs' && (
          <div className="p-6 space-y-6 animate-in fade-in">
            {/* Filter and Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                <span className="text-xs font-bold text-slate-600 mr-2 flex-shrink-0">Trạng thái:</span>
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'active', label: 'Hoạt động' },
                  { id: 'suspended', label: 'Tạm khóa' },
                  { id: 'revoked', label: 'Đã thu hồi' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setCertFilterStatus(item.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                      certFilterStatus === item.id
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={certSearch}
                  onChange={e => setCertSearch(e.target.value)}
                  placeholder="Tìm nhân sự, email, serial..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Personal Certificates Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Cán bộ Nhân sự</th>
                      <th className="py-3 px-4">Phòng ban & Chức danh</th>
                      <th className="py-3 px-4">Serial Chứng thư</th>
                      <th className="py-3 px-4">Thuật toán</th>
                      <th className="py-3 px-4 text-center">Hạn mức Ký (VND)</th>
                      <th className="py-3 px-4 text-center">Thời hạn</th>
                      <th className="py-3 px-4 text-center">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCerts.map(cert => (
                      <tr key={cert.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{cert.fullName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{cert.staffCode} • {cert.email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800">{cert.title}</div>
                          <div className="text-[11px] text-slate-500">{cert.department}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-indigo-700 font-bold">
                          {cert.serialNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold border border-slate-200">
                            {cert.algorithm}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {cert.signingLimitVND === 0 ? (
                            <span className="text-emerald-700 font-black text-xs">Không giới hạn</span>
                          ) : (
                            <span className="font-bold text-slate-800">
                              {formatCurrency(cert.signingLimitVND)}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-600 text-[11px]">
                          <div>{cert.expiryDate}</div>
                          <div className="text-[10px] text-slate-400">Cấp: {cert.issuedDate}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1",
                            cert.status === 'active' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            cert.status === 'suspended' ? "bg-amber-50 text-amber-700 border border-amber-200" :
                            "bg-rose-50 text-rose-700 border border-rose-200"
                          )}>
                            {cert.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {cert.status === 'active' ? 'Đang hoạt động' : cert.status === 'suspended' ? 'Tạm khóa' : 'Đã thu hồi'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {cert.status === 'active' && (
                              <button
                                onClick={() => handleCertAction(cert.id, 'suspend')}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Tạm khóa chứng thư"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {cert.status === 'suspended' && (
                              <button
                                onClick={() => handleCertAction(cert.id, 'activate')}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Mở khóa hoạt động lại"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {cert.status !== 'revoked' && (
                              <button
                                onClick={() => {
                                  if (confirm(`Bạn có chắc chắn muốn thu hồi vĩnh viễn chứng thư của ${cert.fullName}? Thao tác này không thể hoàn tác!`)) {
                                    handleCertAction(cert.id, 'revoke');
                                  }
                                }}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Thu hồi vĩnh viễn (Revoke)"
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                handleCertAction(cert.id, 'renew');
                                alert(`Đã gia hạn chứng thư cho ${cert.fullName} thêm 3 năm!`);
                              }}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Gia hạn thời hạn sử dụng"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BÀN KÝ SỐ & TRÌNH KÝ ĐIỆN TỬ */}
        {activeTab === 'signing_workspace' && (
          <div className="p-6 space-y-6 animate-in fade-in">
            {/* Filter and Switcher */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDocFilterStatus('pending')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                    docFilterStatus === 'pending'
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  )}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Chờ Tôi Ký ({documents.filter(d => d.status === 'pending').length})
                </button>
                <button
                  onClick={() => setDocFilterStatus('signed')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                    docFilterStatus === 'signed'
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  )}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã Hoàn Tất Ký ({documents.filter(d => d.status === 'signed').length})
                </button>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={docSearch}
                  onChange={e => setDocSearch(e.target.value)}
                  placeholder="Tìm mã tài liệu, tiêu đề..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Documents List Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Tài liệu / Văn bản</th>
                      <th className="py-3 px-4">Phân loại & Người tạo</th>
                      <th className="py-3 px-4 text-center">Số tiền (nếu có)</th>
                      <th className="py-3 px-4 text-center">Yêu cầu Ký</th>
                      <th className="py-3 px-4 text-center">Thời gian</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDocs.map(doc => (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                            <span>{doc.title}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            Mã số: {doc.docCode} • {doc.fileSize} • {doc.totalPages} trang
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{doc.requestedBy}</div>
                          <div className="text-[11px] text-slate-500">{doc.department}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                          {doc.amount ? formatCurrency(doc.amount) : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-[10px] border border-indigo-200">
                            {doc.signatureTypeNeeded === 'company_hsm' ? 'Cloud HSM Công ty' :
                             doc.signatureTypeNeeded === 'personal_cert' ? 'Chứng thư Cá nhân' : 'Ký duyệt 2 lớp'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-500 text-[11px]">
                          {doc.createdDate}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {doc.status === 'pending' ? (
                            <button
                              onClick={() => {
                                setSelectedDocToSign(doc);
                                setSigningMethod(doc.signatureTypeNeeded === 'company_hsm' ? 'company_hsm' : 'personal_cert');
                                setSigningPin('');
                                setShowSigningModal(true);
                              }}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 ml-auto transition-all"
                            >
                              <Key className="w-3.5 h-3.5" /> Ký ngay
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedDocToVerify(doc);
                                setShowVerifyModal(true);
                              }}
                              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs border border-emerald-200 flex items-center gap-1.5 ml-auto transition-colors"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Xác thực chữ ký
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MA TRẬN THẨM QUYỀN KÝ SỐ */}
        {activeTab === 'authority_matrix' && (
          <div className="p-6 space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Quy Định Thẩm Quyền Ký Số Doanh Nghiệp</h3>
                <p className="text-xs text-slate-500">Phân định hạn mức tài chính tối đa và loại chữ ký bắt buộc cho từng chức vụ</p>
              </div>
              <button
                onClick={() => alert('Đã lưu cấu hình ma trận thẩm quyền ký số!')}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-indigo-700 transition-all"
              >
                Cập nhật ma trận
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {INITIAL_AUTHORITY_RULES.map((rule, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{rule.roleName}</h4>
                      <span className="text-[11px] text-slate-500">{rule.department}</span>
                    </div>
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-[10px] border border-indigo-200">
                      {rule.requiredSignType}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <div>
                      Hạn mức phê duyệt tối đa: <strong className="text-emerald-700 font-black">{rule.maxLimitVND === 0 ? 'Không giới hạn' : formatCurrency(rule.maxLimitVND)}</strong>
                    </div>
                    <div>
                      Loại văn bản thẩm quyền: <strong className="text-slate-800">{rule.documentTypes.join(', ')}</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 italic leading-relaxed">
                    {rule.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: NHẬT KÝ TRUY VẾT KÝ SỐ (AUDIT TRAIL) */}
        {activeTab === 'audit_logs' && (
          <div className="p-6 space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Nhật Ký Truy Vết Ký Số & Cloud HSM (Audit Trail)</h3>
                <p className="text-xs text-slate-500">Ghi nhận chi tiết mọi giao dịch ký số mật mã học theo Nghị định 130/2018/NĐ-CP</p>
              </div>
              <button
                onClick={() => alert('Đã xuất toàn bộ dữ liệu nhật ký ký số ra định dạng file Excel thẩm tra!')}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Xuất Log Audit
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Hành động & Tài liệu</th>
                    <th className="py-3 px-4">Chủ thể Ký số</th>
                    <th className="py-3 px-4">Mã băm SHA-256</th>
                    <th className="py-3 px-4">IP & Thiết bị</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{log.timestamp}</td>
                      <td className="py-3 px-4 font-sans text-xs font-semibold text-slate-900">{log.action}</td>
                      <td className="py-3 px-4 font-sans text-xs text-slate-800">{log.performedBy}</td>
                      <td className="py-3 px-4 text-slate-500 truncate max-w-xs" title={log.hashSHA256}>
                        {log.hashSHA256.substring(0, 24)}...
                      </td>
                      <td className="py-3 px-4 text-slate-500">{log.ipAddress}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded text-[10px] border border-emerald-200 font-sans">
                          Thành công
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CẤP PHÁT CHỨNG THƯ SỐ CÁ NHÂN MỚI */}
      {showIssueCertModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Cấp Phát Chứng Thư Số Cá Nhân Mới</h3>
              </div>
              <button
                onClick={() => setShowIssueCertModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueCertificate} className="p-6 space-y-4 text-xs">
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
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold transition-all cursor-pointer text-[11px]"
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-600" />
                    <span>Chọn từ Đơn yêu cầu HRM</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const current = hrmEmployeeService.getCurrentLoggedInStaff();
                      handleSelectHrmStaff(current, 'current_user');
                    }}
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
                  onClick={() => setShowIssueCertModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md"
                >
                  Tạo & Cấp Chứng Thư
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KÝ SỐ TÀI LIỆU */}
      {showSigningModal && selectedDocToSign && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">Xác Nhận Ký Số Mật Mã Học</h3>
              </div>
              <button
                onClick={() => setShowSigningModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Văn bản trình ký</div>
                <div className="font-bold text-sm text-slate-900">{selectedDocToSign.title}</div>
                <div className="text-slate-500 font-mono">Mã số: {selectedDocToSign.docCode}</div>
                {selectedDocToSign.amount && (
                  <div className="text-emerald-700 font-bold mt-1">
                    Giá trị tài chính: {formatCurrency(selectedDocToSign.amount)}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-2">Chọn nguồn Chữ ký số</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSigningMethod('company_hsm')}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      signingMethod === 'company_hsm'
                        ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-400"
                        : "border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Server className="w-4 h-4 text-indigo-600" /> Cloud HSM Công ty
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Ký thay pháp nhân VComm (Slot: {companyHsm.slotId})
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSigningMethod('personal_cert')}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      signingMethod === 'personal_cert'
                        ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-400"
                        : "border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-purple-600" /> Chứng Thư Cá Nhân
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Ký chức danh thẩm quyền cá nhân (RSA 2048)
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nhập mã PIN Ký Số Bí Mật</label>
                <input
                  type="password"
                  value={signingPin}
                  onChange={e => setSigningPin(e.target.value)}
                  placeholder="Nhập mã PIN 6 số của bạn..."
                  maxLength={6}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-center font-mono tracking-widest text-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block text-center">
                  Mã PIN bảo mật giúp mở khóa vùng nhớ mật mã học để sinh chữ ký số
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSigningModal(false)}
                  disabled={isSigningProcess}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSigning}
                  disabled={isSigningProcess}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {isSigningProcess ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  {isSigningProcess ? 'Đang thực thi ký số...' : 'Xác Nhận Ký Số'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC THỰC TÍNH TOÀN VẸN CHỮ KÝ (VERIFY INTEGRITY) */}
      {showVerifyModal && selectedDocToVerify && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Kết Quả Xác Thực Tính Toàn Vẹn</h3>
              </div>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-900">Chữ Ký Số Hợp Lệ & Nguyên Vẹn 100%</h4>
                  <p className="text-emerald-700 text-xs mt-1 leading-relaxed">
                    Văn bản không bị chỉnh sửa sau thời điểm ký. Dấu thời gian điện tử (TSA) và chứng thư số còn hiệu lực tại thời điểm ký.
                  </p>
                </div>
              </div>

              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Tài liệu:</span>
                  <strong className="text-slate-900">{selectedDocToVerify.title}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Người ký xác thực:</span>
                  <strong className="text-slate-900">{selectedDocToVerify.signedBy?.name || 'Hệ thống'}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Serial Chứng thư:</span>
                  <span className="font-mono text-indigo-700 font-bold">{selectedDocToVerify.signedBy?.certSerial}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Thời gian ký (TSA):</span>
                  <span className="font-semibold text-slate-800">{selectedDocToVerify.signedBy?.signedAt}</span>
                </div>
                <div className="pt-1">
                  <span className="text-slate-500 block mb-1">Mã băm toàn vẹn (SHA-256 Checksum):</span>
                  <div className="p-2 bg-white rounded border border-slate-300 font-mono text-[10px] break-all text-slate-700">
                    {selectedDocToVerify.signedBy?.hashSHA256}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HRM STAFF / REQUEST PICKER MODAL */}
      <HrmStaffOrRequestPickerModal
        isOpen={showHrmPicker}
        onClose={() => setShowHrmPicker(false)}
        onSelectEmployee={handleSelectHrmStaff}
        filterRequestCategory="signature"
        title="Trích Xuất Nhân Sự Cho Chứng Thư Số Cá Nhân"
        defaultTab={pickerDefaultTab}
      />
    </div>
  );
}
