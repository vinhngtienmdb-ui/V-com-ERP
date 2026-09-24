import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Key,
  ShieldCheck,
  Server,
  UserCheck,
  FileSignature,
  Sliders,
  Lock,
  Plus,
  Sparkles,
  Upload
} from 'lucide-react';
import { cn } from '../lib/utils';
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
  INITIAL_HSM_LOGS,
  calculateDocumentHashSHA256
} from '../data/hsmSignatureData';
import {
  SignatureDashboard,
  CompanyHsmManager,
  PersonalCertsManager,
  SigningWorkspace,
  AuthorityMatrixTab,
  SignatureAuditLogsTab
} from './signature';
import {
  CertificateInspectorModal,
  VerifyIntegrityModal,
  DocumentSigningStudioModal,
  BatchSigningModal,
  NewDocumentUploadModal,
  IssueCertificateModal
} from './signature/modals';

export type SignatureTabType =
  | 'dashboard'
  | 'company_hsm'
  | 'personal_certs'
  | 'signing_workspace'
  | 'authority_matrix'
  | 'audit_logs';

export function SignatureHub() {
  const navigate = useNavigate();

  // Active Main Tab (Defaults to Executive Dashboard)
  const [activeTab, setActiveTab] = useState<SignatureTabType>('dashboard');

  // Core Synchronized Enterprise State
  const [companyHsm, setCompanyHsm] = useState<CompanyHSMProfile>(INITIAL_COMPANY_HSM);
  const [isTestingHsm, setIsTestingHsm] = useState(false);
  const [testHsmSuccess, setTestHsmSuccess] = useState(false);

  const [personalCerts, setPersonalCerts] = useState<PersonalCertificate[]>(INITIAL_PERSONAL_CERTS);
  const [documents, setDocuments] = useState<SigningDocument[]>(INITIAL_SIGNING_DOCUMENTS);
  const [authorityRules, setAuthorityRules] = useState<SigningAuthorityRule[]>(INITIAL_AUTHORITY_RULES);
  const [auditLogs, setAuditLogs] = useState<HSMAuditLog[]>(INITIAL_HSM_LOGS);

  // Modal Coordination States
  const [studioDoc, setStudioDoc] = useState<SigningDocument | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchSelectedDocs, setBatchSelectedDocs] = useState<SigningDocument[]>([]);
  const [inspectCertData, setInspectCertData] = useState<CompanyHSMProfile | PersonalCertificate | null>(null);
  const [verifyDoc, setVerifyDoc] = useState<SigningDocument | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [showIssueCertModal, setShowIssueCertModal] = useState(false);

  // --- Handlers: HSM Company Management ---
  const handleTestHsm = () => {
    setIsTestingHsm(true);
    setTimeout(() => {
      setIsTestingHsm(false);
      setTestHsmSuccess(true);
      setTimeout(() => setTestHsmSuccess(false), 4000);
    }, 500);
  };

  const handleToggleAutoSign = (rule: keyof CompanyHSMProfile['autoSignRules']) => {
    setCompanyHsm(prev => ({
      ...prev,
      autoSignRules: {
        ...prev.autoSignRules,
        [rule]: !prev.autoSignRules[rule]
      }
    }));
  };

  // --- Handlers: Personal Certificates ---
  const handleCertAction = (certId: string, action: 'suspend' | 'activate' | 'revoke' | 'renew') => {
    const targetCert = personalCerts.find(c => c.id === certId);
    if (!targetCert) return;

    let newStatus: PersonalCertificate['status'] = targetCert.status;
    let actionDesc = '';
    let updatedExpiryDate = targetCert.expiryDate;

    if (action === 'suspend') {
      newStatus = 'suspended';
      actionDesc = `Tạm khóa chứng thư số ${targetCert.fullName} (Serial: ${targetCert.serialNumber})`;
    } else if (action === 'activate') {
      newStatus = 'active';
      actionDesc = `Mở khóa kích hoạt lại chứng thư số ${targetCert.fullName} (Serial: ${targetCert.serialNumber})`;
    } else if (action === 'revoke') {
      newStatus = 'revoked';
      actionDesc = `Thu hồi vĩnh viễn chứng thư số ${targetCert.fullName} (Serial: ${targetCert.serialNumber})`;
    } else if (action === 'renew') {
      newStatus = 'active';
      const currentYear = new Date().getFullYear();
      updatedExpiryDate = `24/09/${currentYear + 2}`;
      actionDesc = `Gia hạn hiệu lực chứng thư số ${targetCert.fullName} (Serial: ${targetCert.serialNumber})`;
    }

    setPersonalCerts(prev =>
      prev.map(c => (c.id === certId ? { ...c, status: newStatus, expiryDate: updatedExpiryDate } : c))
    );

    const newLog: HSMAuditLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      action: actionDesc,
      performedBy: 'Nguyễn Tiến Vĩnh (Super Admin)',
      certSerial: targetCert.serialNumber,
      targetDocCode: targetCert.staffCode,
      algorithm: targetCert.algorithm,
      hashSHA256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
      ipAddress: '118.69.182.10 (Office SG)',
      status: 'success'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleIssueCertificateSuccess = (newCert: PersonalCertificate, algorithm: string) => {
    setPersonalCerts(prev => [newCert, ...prev]);

    const newLog: HSMAuditLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      action: `Cấp phát Chứng thư số cá nhân (${algorithm}) cho ${newCert.fullName}`,
      performedBy: 'Nguyễn Tiến Vĩnh (Super Admin)',
      certSerial: newCert.serialNumber,
      targetDocCode: newCert.staffCode,
      algorithm,
      hashSHA256: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
      ipAddress: '118.69.182.10 (Office SG)',
      status: 'success'
    };
    setAuditLogs(prev => [newLog, ...prev]);
    setShowIssueCertModal(false);
  };

  // --- Handlers: Document Signing Studio Modal ---
  const handleStudioSignSuccess = (
    docId: string,
    payload: {
      signerName: string;
      certSerial: string;
      method: string;
      signedAt: string;
      hashSHA256: string;
      stampPosition: {
        page: number;
        x: number;
        y: number;
        stampType: 'company_stamp' | 'personal_signature' | 'badge_eidas';
      };
      hasInitialStampAllPages: boolean;
    }
  ) => {
    const targetDoc = documents.find(d => d.id === docId);

    setDocuments(prev =>
      prev.map(doc => {
        if (doc.id === docId) {
          return {
            ...doc,
            status: 'signed' as const,
            signedBy: {
              name: payload.signerName,
              certSerial: payload.certSerial,
              signedAt: payload.signedAt,
              method: payload.method,
              hashSHA256: payload.hashSHA256
            }
          };
        }
        return doc;
      })
    );

    const isHsm = payload.method.toLowerCase().includes('hsm');
    if (isHsm) {
      setCompanyHsm(prev => ({
        ...prev,
        remainingSignatures: Math.max(0, prev.remainingSignatures - 1)
      }));
    }

    const newLog: HSMAuditLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: payload.signedAt || new Date().toLocaleString('vi-VN'),
      action: `Ký số thành công tài liệu #${targetDoc?.docCode || docId} (${targetDoc?.title || ''}) qua ${payload.method}`,
      performedBy: payload.signerName,
      certSerial: payload.certSerial,
      targetDocCode: targetDoc?.docCode || docId,
      algorithm: 'RSA-SHA256',
      hashSHA256: payload.hashSHA256,
      ipAddress: '118.69.182.10 (SSL Verified Session)',
      status: 'success'
    };
    setAuditLogs(prev => [newLog, ...prev]);
    setStudioDoc(null);
  };

  // --- Handlers: Batch Signing Modal ---
  const handleBatchSignSuccess = (
    signedDocIds: string[],
    payload: {
      signerName: string;
      certSerial: string;
      method: string;
      signedAt: string;
    }
  ) => {
    const signedCount = signedDocIds.length;
    const targetDocs = documents.filter(d => signedDocIds.includes(d.id));

    setDocuments(prev =>
      prev.map(doc => {
        if (signedDocIds.includes(doc.id)) {
          return {
            ...doc,
            status: 'signed' as const,
            signedBy: {
              name: payload.signerName,
              certSerial: payload.certSerial,
              signedAt: payload.signedAt,
              method: payload.method,
              hashSHA256: calculateDocumentHashSHA256(doc)
            }
          };
        }
        return doc;
      })
    );

    const isHsm = payload.method.toLowerCase().includes('hsm');
    if (isHsm) {
      setCompanyHsm(prev => ({
        ...prev,
        remainingSignatures: Math.max(0, prev.remainingSignatures - signedCount)
      }));
    }

    const newLogs: HSMAuditLog[] = targetDocs.map((doc, idx) => ({
      id: `LOG-BATCH-${Date.now().toString().slice(-4)}-${idx + 1}`,
      timestamp: payload.signedAt || new Date().toLocaleString('vi-VN'),
      action: `Ký số hàng loạt văn bản #${doc.docCode} (${doc.title}) qua ${payload.method}`,
      performedBy: payload.signerName,
      certSerial: payload.certSerial,
      targetDocCode: doc.docCode,
      algorithm: 'RSA-SHA256',
      hashSHA256: calculateDocumentHashSHA256(doc),
      ipAddress: '118.69.182.10 (Batch SSL Channel)',
      status: 'success'
    }));

    setAuditLogs(prev => [...newLogs, ...prev]);
    setIsBatchModalOpen(false);
    setBatchSelectedDocs([]);
  };

  // --- Handlers: Document Upload Modal ---
  const handleAddDocument = (newDoc: SigningDocument) => {
    setDocuments(prev => [newDoc, ...prev]);
    setIsUploadModalOpen(false);
    setActiveTab('signing_workspace');
  };

  // --- Quick Actions from Dashboard ---
  const handleQuickBatchSign = () => {
    const pendingDocs = documents.filter(d => d.status === 'pending');
    if (pendingDocs.length > 0) {
      setBatchSelectedDocs(pendingDocs);
      setIsBatchModalOpen(true);
    } else {
      setActiveTab('signing_workspace');
    }
  };

  const handleQuickIssueCert = () => {
    setShowIssueCertModal(true);
  };

  // Navigation tab definitions
  const TABS = [
    { id: 'dashboard' as const, label: 'Tổng Quan', icon: Sparkles },
    { id: 'company_hsm' as const, label: 'Chữ Ký Số HSM Công Ty', icon: Server },
    { id: 'personal_certs' as const, label: 'Cấp Phát Chứng Thư Cá Nhân', icon: UserCheck },
    { id: 'signing_workspace' as const, label: 'Bàn Ký Số & Trình Ký', icon: FileSignature },
    { id: 'authority_matrix' as const, label: 'Ma Trận Thẩm Quyền Ký', icon: Sliders },
    { id: 'audit_logs' as const, label: 'Nhật Ký Truy Vết Ký Số', icon: Lock }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 text-slate-800 p-2 md:p-4" data-testid="signature-hub">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

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
            onClick={() => setShowIssueCertModal(true)}
            data-testid="header-issue-cert-button"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-900/40 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Cấp Chứng Thư Mới
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            data-testid="header-upload-doc-button"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" /> + Trình Ký Văn Bản Mới
          </button>

          <button
            onClick={() => setActiveTab('signing_workspace')}
            data-testid="header-workspace-button"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileSignature className="w-4 h-4 text-amber-300" /> Bàn Ký Điện Tử
          </button>
        </div>
      </div>

      {/* Main Container with Nav Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs Bar */}
        <div className="p-4 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  data-testid={`tab-${tab.id}`}
                  className={cn(
                    "px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer",
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-500 font-medium hidden lg:flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Tuân thủ Luật Giao dịch điện tử & NĐ 130/2018/NĐ-CP
          </div>
        </div>

        {/* Tab Routing to Sub-components */}
        {activeTab === 'dashboard' && (
          <SignatureDashboard
            companyHsm={companyHsm}
            personalCerts={personalCerts}
            documents={documents}
            onNavigateTab={tabId => setActiveTab(tabId)}
            onOpenInspectHsm={() => setInspectCertData(companyHsm)}
            onTestHsm={handleTestHsm}
            isTestingHsm={isTestingHsm}
            testHsmSuccess={testHsmSuccess}
            onQuickBatchSign={handleQuickBatchSign}
            onQuickIssueCert={handleQuickIssueCert}
          />
        )}

        {activeTab === 'company_hsm' && (
          <CompanyHsmManager
            companyHsm={companyHsm}
            onToggleAutoSign={handleToggleAutoSign}
            onTestHsm={handleTestHsm}
            onOpenInspectHsm={() => setInspectCertData(companyHsm)}
            isTestingHsm={isTestingHsm}
            testHsmSuccess={testHsmSuccess}
          />
        )}

        {activeTab === 'personal_certs' && (
          <PersonalCertsManager
            certs={personalCerts}
            onCertAction={handleCertAction}
            onOpenIssueModal={() => setShowIssueCertModal(true)}
            onInspectCert={cert => setInspectCertData(cert)}
          />
        )}

        {activeTab === 'signing_workspace' && (
          <SigningWorkspace
            documents={documents}
            onOpenStudio={doc => setStudioDoc(doc)}
            onOpenVerify={doc => setVerifyDoc(doc)}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onBatchSign={selectedDocs => {
              setBatchSelectedDocs(selectedDocs);
              setIsBatchModalOpen(true);
            }}
          />
        )}

        {activeTab === 'authority_matrix' && (
          <AuthorityMatrixTab
            rules={authorityRules}
            onSaveMatrix={() => alert('Đã lưu thành công Ma trận Thẩm quyền ký duyệt!')}
          />
        )}

        {activeTab === 'audit_logs' && (
          <SignatureAuditLogsTab logs={auditLogs} />
        )}
      </div>

      {/* --- Coordinated Modals --- */}

      {/* 1. Document Signing Studio Modal */}
      <DocumentSigningStudioModal
        isOpen={Boolean(studioDoc)}
        onClose={() => setStudioDoc(null)}
        document={studioDoc}
        companyHsm={companyHsm}
        personalCerts={personalCerts}
        onSignSuccess={handleStudioSignSuccess}
      />

      {/* 2. Batch Signing Modal */}
      <BatchSigningModal
        isOpen={isBatchModalOpen}
        onClose={() => {
          setIsBatchModalOpen(false);
          setBatchSelectedDocs([]);
        }}
        selectedDocs={batchSelectedDocs}
        companyHsm={companyHsm}
        personalCerts={personalCerts}
        onBatchSignSuccess={handleBatchSignSuccess}
      />

      {/* 3. Certificate Inspector Modal (X.509) */}
      <CertificateInspectorModal
        isOpen={Boolean(inspectCertData)}
        onClose={() => setInspectCertData(null)}
        certData={inspectCertData}
      />

      {/* 4. Verify Integrity Modal */}
      <VerifyIntegrityModal
        isOpen={Boolean(verifyDoc)}
        onClose={() => setVerifyDoc(null)}
        doc={verifyDoc}
      />

      {/* 5. New Document Upload Modal */}
      <NewDocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAddDocument={handleAddDocument}
      />

      {/* 6. Issue New Certificate Modal */}
      <IssueCertificateModal
        isOpen={showIssueCertModal}
        onClose={() => setShowIssueCertModal(false)}
        onIssueSuccess={handleIssueCertificateSuccess}
        existingCertsCount={personalCerts.length}
      />
    </div>
  );
}

export default SignatureHub;
