import React, { useState } from 'react';
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
  PenLine,
  X,
  Upload,
  AlertTriangle,
  ChevronRight,
  Stamp,
  Eye,
  Printer
} from 'lucide-react';
import { cn } from '../lib/utils';

// ─── Sig type definitions ─────────────────────────────────────────────────────

type SigType = 'company_ca' | 'personal_ca' | 'personal_image';

const SIG_TYPE_META: Record<SigType, {
  label: string;
  short: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  badge: string;
  warning?: string;
}> = {
  company_ca: {
    label: 'Chữ ký số Công ty',
    short: 'CA Doanh nghiệp',
    desc: 'Sử dụng chứng thư số pháp nhân công ty, phù hợp cho hợp đồng, văn bản pháp lý có giá trị pháp lý cao.',
    icon: Building2,
    color: 'border-blue-300 bg-blue-50 text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
  },
  personal_ca: {
    label: 'Chữ ký số Cá nhân (CA)',
    short: 'CA Cá nhân – Danh nghĩa Công ty',
    desc: 'Chứng thư số cá nhân từ VNPT SmartCA / Viettel CA, hoạt động dưới danh nghĩa công ty. Dùng cho phê duyệt nội bộ và hợp đồng điện tử.',
    icon: UserCheck,
    color: 'border-emerald-300 bg-emerald-50 text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  personal_image: {
    label: 'Chữ ký hình ảnh',
    short: 'Hình ảnh – Văn bản nội bộ',
    desc: 'Sử dụng ảnh chữ ký tay số hóa cho các văn bản nội bộ không yêu cầu giá trị pháp lý từ CA.',
    icon: PenLine,
    color: 'border-amber-300 bg-amber-50 text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
    warning: 'Chữ ký hình ảnh CHỈ có giá trị nội bộ, không được công nhận là chữ ký số hợp pháp theo pháp luật Việt Nam.',
  },
};

const CA_PROVIDERS = ['VNPT SmartCA', 'Viettel CA', 'USB Token (HSM)'];

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_SIGNATURES = [
  { id: 'SIGN-001', docId: 'HDLD-001', title: 'Hợp đồng lao động – Nguyễn Văn A', type: 'contract', requestDate: '25/03/2024', status: 'pending', requesters: 'Phòng Nhân sự', requiredSigType: 'company_ca' as SigType },
  { id: 'SIGN-002', docId: 'REQ-002', title: 'Đề nghị tạm ứng công tác phí', type: 'request', requestDate: '24/03/2024', status: 'signed', requesters: 'Nguyễn Diệu Nhi', requiredSigType: 'personal_ca' as SigType, signedAt: '24/03/2024 09:32', signedBy: 'Giám đốc – Nguyễn Văn B', sigTypeUsed: 'personal_ca' as SigType },
  { id: 'SIGN-003', docId: 'CV-2024-001', title: 'Quyết định bổ nhiệm Giám đốc', type: 'document', requestDate: '20/03/2024', status: 'signed', requesters: 'Hội đồng quản trị', requiredSigType: 'company_ca' as SigType, signedAt: '20/03/2024 14:00', signedBy: 'Chủ tịch HĐQT', sigTypeUsed: 'company_ca' as SigType },
  { id: 'SIGN-004', docId: 'HDDV-001', title: 'Hợp đồng tư vấn AI', type: 'contract', requestDate: '01/02/2024', status: 'pending', requesters: 'Phòng Pháp chế', requiredSigType: 'company_ca' as SigType },
  { id: 'SIGN-005', docId: 'BB-2024-03', title: 'Biên bản họp Ban điều hành T3/2024', type: 'document', requestDate: '28/03/2024', status: 'pending', requesters: 'Văn phòng Công ty', requiredSigType: 'personal_image' as SigType },
];

const MOCK_CERTS = [
  { id: 'CA-001', name: 'Công ty Cổ phần VComm ERP', provider: 'Viettel CA (MST)', sigType: 'company_ca' as SigType, expiry: '20/01/2026', status: 'active', serial: 'VT-2024-000128' },
  { id: 'CA-002', name: 'Nguyễn Văn B (Giám đốc)', provider: 'VNPT SmartCA', sigType: 'personal_ca' as SigType, expiry: '15/10/2026', status: 'active', serial: 'VNPT-GD-00982' },
  { id: 'CA-003', name: 'Trần Minh C (Kế toán trưởng)', provider: 'USB Token (BKAV CA)', sigType: 'personal_ca' as SigType, expiry: '10/05/2024', status: 'expiring_soon', serial: 'BK-KT-00341' },
  { id: 'CA-004', name: 'Lê Thị D (Trưởng phòng HR)', provider: 'Hình ảnh chữ ký (upload)', sigType: 'personal_image' as SigType, expiry: 'N/A', status: 'active', serial: 'IMG-HR-001' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SigTypeBadge({ type }: { type: SigType }) {
  const meta = SIG_TYPE_META[type];
  const Icon = meta.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold', meta.badge)}>
      <Icon className="w-3 h-3" />{meta.short}
    </span>
  );
}

// ─── Document Detail Slide-over ───────────────────────────────────────────────

function DocDetailPanel({ doc, onClose, onSign }: { doc: any; onClose: () => void; onSign: (doc: any) => void }) {
  const sigMeta = SIG_TYPE_META[doc.requiredSigType as SigType];
  const SigIcon = sigMeta.icon;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-xl bg-white shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">{doc.id}</p>
            <h2 className="text-base font-bold text-slate-900">{doc.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Mã tài liệu</p>
              <p className="font-bold text-slate-900 font-mono">{doc.docId}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Ngày yêu cầu</p>
              <p className="font-bold text-slate-900">{doc.requestDate}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Người yêu cầu</p>
              <p className="font-bold text-slate-900">{doc.requesters}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Loại tài liệu</p>
              <p className="font-bold text-slate-900">
                {doc.type === 'contract' ? 'Hợp đồng' : doc.type === 'request' ? 'Đề xuất E-Form' : 'Văn bản'}
              </p>
            </div>
          </div>

          {/* Required signature type */}
          <div>
            <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Loại chữ ký yêu cầu</p>
            <div className={cn('border rounded-xl p-4 flex items-start gap-3', sigMeta.color)}>
              <SigIcon className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold">{sigMeta.label}</p>
                <p className="text-xs mt-0.5 opacity-80">{sigMeta.desc}</p>
                {sigMeta.warning && (
                  <div className="mt-2 flex items-start gap-1.5 text-amber-700">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-semibold leading-relaxed">{sigMeta.warning}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Approval flow */}
          <div>
            <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Luồng trình ký</p>
            <div className="space-y-2">
              {[
                { step: 1, role: 'Người tạo', done: true },
                { step: 2, role: 'Quản lý trực tiếp', done: doc.status === 'signed' },
                { step: 3, role: 'Giám đốc', done: doc.status === 'signed', current: doc.status === 'pending' },
              ].map((s, idx) => (
                <div key={idx} className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border text-sm',
                  s.done ? 'bg-emerald-50 border-emerald-200' : s.current ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-200'
                )}>
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                    s.done ? 'bg-emerald-500 text-white' : s.current ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'
                  )}>
                    {s.done ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                  </div>
                  <span className={cn('font-semibold', s.done ? 'text-emerald-700' : s.current ? 'text-blue-700' : 'text-slate-500')}>
                    {s.role}
                  </span>
                  {s.current && <span className="ml-auto text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">Chờ ký</span>}
                  {s.done && <span className="ml-auto text-[10px] font-bold text-emerald-600">✓ Đã ký</span>}
                </div>
              ))}
            </div>
          </div>

          {/* If signed — show signature info */}
          {doc.status === 'signed' && doc.signedAt && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Thông tin chữ ký số
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-slate-500 font-semibold">Ký bởi</p>
                  <p className="font-bold text-slate-900">{doc.signedBy}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-semibold">Thời điểm ký</p>
                  <p className="font-bold text-slate-900">{doc.signedAt}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500 font-semibold mb-1">Loại chữ ký đã dùng</p>
                  <SigTypeBadge type={doc.sigTypeUsed || doc.requiredSigType} />
                </div>
              </div>
            </div>
          )}

          {/* Document preview placeholder */}
          <div>
            <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Xem trước tài liệu</p>
            <div className="border border-dashed border-slate-300 rounded-xl h-48 flex flex-col items-center justify-center gap-3 bg-slate-50 text-slate-500">
              <FileText className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-semibold">Tài liệu PDF sẽ hiển thị tại đây</p>
              <button className="flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline">
                <Eye className="w-3.5 h-3.5" /> Mở xem đầy đủ
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-200 px-6 py-4 flex items-center gap-3 bg-slate-50 shrink-0">
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
            <Printer className="w-3.5 h-3.5" /> In tài liệu
          </button>
          <div className="flex-1" />
          {doc.status === 'pending' && (
            <button
              onClick={() => { onSign(doc); onClose(); }}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-all"
            >
              <Key className="w-4 h-4" /> Tiến hành Ký số
            </button>
          )}
          {doc.status === 'signed' && (
            <span className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" /> Đã ký số
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Signing Modal ────────────────────────────────────────────────────────────

function SigningModal({
  doc,
  onClose,
  onConfirm,
}: {
  doc: any;
  onClose: () => void;
  onConfirm: (sigType: SigType, provider?: string, imageFile?: File | null) => Promise<void>;
}) {
  const defaultType: SigType = doc.requiredSigType ?? 'personal_ca';
  const [sigType, setSigType] = useState<SigType>(defaultType);
  const [caProvider, setCaProvider] = useState(CA_PROVIDERS[0]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [signing, setSigning] = useState(false);

  const meta = SIG_TYPE_META[sigType];
  const Icon = meta.icon;

  const handleConfirm = async () => {
    setSigning(true);
    await onConfirm(sigType, caProvider, imageFile);
    setSigning(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Xác nhận Ký số
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Doc info */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-xs font-semibold text-slate-500 mb-0.5">Tài liệu</p>
            <p className="text-sm font-bold text-slate-900">{doc.title}</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{doc.docId}</p>
          </div>

          {/* Sig type selection */}
          <div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Chọn loại chữ ký</p>
            <div className="space-y-2">
              {(Object.entries(SIG_TYPE_META) as [SigType, typeof SIG_TYPE_META[SigType]][]).map(([id, m]) => {
                const MIcon = m.icon;
                const selected = sigType === id;
                return (
                  <div
                    key={id}
                    onClick={() => setSigType(id)}
                    className={cn(
                      'flex items-start gap-3 p-3.5 border rounded-xl cursor-pointer transition-all',
                      selected ? m.color + ' border-2' : 'border-slate-200 bg-white hover:bg-slate-50'
                    )}
                  >
                    <div className={cn('w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5', selected ? 'bg-current border-current' : 'bg-white border-slate-400')}>
                      {selected && <div className="w-full h-full rounded-full bg-white scale-[0.4] block" />}
                    </div>
                    <MIcon className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">{m.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{m.short}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CA provider — only for company_ca / personal_ca */}
          {(sigType === 'company_ca' || sigType === 'personal_ca') && (
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nhà cung cấp chứng thư</p>
              <div className="grid grid-cols-3 gap-2">
                {CA_PROVIDERS.map(p => (
                  <button
                    key={p}
                    onClick={() => setCaProvider(p)}
                    className={cn(
                      'py-2 px-2 text-xs font-bold rounded-lg border transition-all text-center',
                      caProvider === p ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Image upload — only for personal_image */}
          {sigType === 'personal_image' && (
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Tải lên hình ảnh chữ ký</p>
              <label className="flex flex-col items-center gap-2 border-2 border-dashed border-amber-300 bg-amber-50 rounded-xl p-4 cursor-pointer hover:bg-amber-100 transition-all">
                <Upload className="w-6 h-6 text-amber-500" />
                <span className="text-xs font-semibold text-amber-700">
                  {imageFile ? imageFile.name : 'Chọn ảnh PNG/JPG (nền trắng, trong suốt)'}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files?.[0] ?? null)} />
              </label>
              <div className="mt-2 flex items-start gap-1.5 text-amber-600">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <p className="text-[10px] font-semibold leading-relaxed">{meta.warning}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={signing}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            disabled={signing || (sigType === 'personal_image' && !imageFile)}
            onClick={handleConfirm}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {signing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            {signing ? 'Đang ký...' : 'Xác nhận Ký'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SignatureHub() {
  const [activeTab, setActiveTab] = useState('pending');
  const [signatures, setSignatures] = useState(INITIAL_SIGNATURES);
  const [signingModalOpen, setSigningModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [detailDoc, setDetailDoc] = useState<any>(null);

  // Filters
  const [searchSigQuery, setSearchSigQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [requesterFilter, setRequesterFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const filteredSignatures = signatures.filter(doc => {
    const matchesTab = doc.status === activeTab;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchSigQuery.toLowerCase()) ||
      doc.docId.toLowerCase().includes(searchSigQuery.toLowerCase()) ||
      doc.id.toLowerCase().includes(searchSigQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    const matchesRequester = requesterFilter === 'all' || doc.requesters === requesterFilter;
    let matchesDate = true;
    if (dateFilter) {
      const [year, month, day] = dateFilter.split('-');
      matchesDate = doc.requestDate === `${day}/${month}/${year}`;
    }
    return matchesTab && matchesSearch && matchesType && matchesRequester && matchesDate;
  });

  const uniqueRequesters = Array.from(new Set(signatures.map(s => s.requesters)));

  const handleSign = (doc: any) => {
    setSelectedDoc(doc);
    setSigningModalOpen(true);
  };

  const confirmSign = async (sigType: SigType, provider?: string, imageFile?: File | null) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (selectedDoc) {
      const now = new Date();
      const ts = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')} ${now.toLocaleDateString('vi-VN')}`;
      setSignatures(prev => prev.map(s =>
        s.id === selectedDoc.id
          ? { ...s, status: 'signed', signedAt: ts, signedBy: 'Giám đốc – Nguyễn Văn B', sigTypeUsed: sigType }
          : s
      ));
    }
    setSigningModalOpen(false);
    setSelectedDoc(null);
  };

  const pendingCount = signatures.filter(s => s.status === 'pending').length;
  const signedCount = signatures.filter(s => s.status === 'signed').length;

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans tracking-tight text-xl font-bold text-slate-900">Trung tâm Ký số</h1>
          <p className="text-sm text-slate-500 mt-1">Hệ thống ký số tập trung: CA Doanh nghiệp, CA Cá nhân, và Chữ ký hình ảnh nội bộ.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-xs font-bold text-slate-800 hover:bg-slate-50 transition-all flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Làm mới Certs
          </button>
          <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-400" /> Quản lý chứng thư
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0"><Clock className="w-4 h-4" /></div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">Chờ tôi ký</p>
            <span className="text-base font-bold text-slate-900">{pendingCount}</span>
          </div>
          <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded ml-auto shrink-0">Gấp</span>
        </div>
        <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0"><CheckCircle2 className="w-4 h-4" /></div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">Đã hoàn tất</p>
            <span className="text-base font-bold text-slate-900">{signedCount}</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded ml-auto shrink-0">Lưu trữ</span>
        </div>
        <div className="bg-white px-4 py-3 rounded-xl border border-blue-200 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0"><Building2 className="w-4 h-4" /></div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">CA Doanh nghiệp</p>
            <span className="text-sm font-bold text-slate-900">Viettel CA (Active)</span>
          </div>
        </div>
        <div className="bg-white px-4 py-3 rounded-xl border border-emerald-200 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0"><ShieldCheck className="w-4 h-4" /></div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">CA Cá nhân (GĐ)</p>
            <span className="text-sm font-bold text-slate-900">VNPT SmartCA</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded ml-auto shrink-0">Active</span>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex gap-4">
        {/* Sidebar */}
        <div className="w-[220px] shrink-0 space-y-1">
          {[
            { id: 'pending', label: 'Chờ tôi ký', icon: Clock },
            { id: 'signed', label: 'Đã ký / Lịch sử', icon: CheckCircle2 },
            { id: 'certificates', label: 'Quản lý Chứng thư', icon: Key },
            { id: 'permissions', label: 'Phân quyền Ký số', icon: UserCheck },
            { id: 'logs', label: 'Nhật ký hệ thống', icon: Lock },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all text-left',
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'pending' && pendingCount > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* Pending / Signed tabs */}
          {(activeTab === 'pending' || activeTab === 'signed') && (
            <>
              <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-3 bg-slate-50">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm tài liệu..."
                    value={searchSigQuery}
                    onChange={e => setSearchSigQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-400 w-56"
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none text-slate-700"
                >
                  <option value="all">Tất cả loại</option>
                  <option value="contract">Hợp đồng</option>
                  <option value="request">Đề xuất E-Form</option>
                  <option value="document">Văn bản</option>
                </select>
                <select
                  value={requesterFilter}
                  onChange={e => setRequesterFilter(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none text-slate-700"
                >
                  <option value="all">Mọi người tạo</option>
                  {uniqueRequesters.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <div className="relative">
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none text-slate-700"
                  />
                  {dateFilter && (
                    <button onClick={() => setDateFilter('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mã</th>
                      <th className="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tài liệu</th>
                      <th className="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Loại chữ ký</th>
                      <th className="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Luồng ký</th>
                      <th className="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Trạng thái</th>
                      <th className="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ngày</th>
                      <th className="px-5 py-3.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSignatures.map(doc => (
                      <tr
                        key={doc.id}
                        onClick={() => setDetailDoc(doc)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <td className="px-5 py-4">
                          <p className="text-xs font-bold text-slate-900 font-mono">{doc.id}</p>
                        </td>
                        <td className="px-5 py-4 max-w-[200px]">
                          <p className="text-sm font-semibold text-slate-900 truncate">{doc.title}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{doc.docId}</p>
                        </td>
                        <td className="px-5 py-4">
                          <SigTypeBadge type={doc.requiredSigType} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1 text-[10px] font-bold">
                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">Tạo</span>
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">QL</span>
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                            <span className={cn('px-1.5 py-0.5 rounded', doc.status === 'signed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-700')}>GĐ</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={cn(
                            'px-2 py-0.5 text-[10px] font-bold rounded-lg inline-flex items-center gap-1',
                            doc.status === 'signed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          )}>
                            {doc.status === 'signed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {doc.status === 'signed' ? 'Đã ký' : 'Chờ ký'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">{doc.requestDate}</td>
                        <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setDetailDoc(doc)}
                              className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" /> Xem
                            </button>
                            {doc.status === 'pending' && (
                              <button
                                onClick={() => handleSign(doc)}
                                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 flex items-center gap-1.5"
                              >
                                <Key className="w-3.5 h-3.5" /> Ký ngay
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredSignatures.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                          Không có tài liệu nào trong mục này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Certificates tab */}
          {activeTab === 'certificates' && (
            <div className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Quản lý Chứng thư số & Chữ ký</h3>
                  <p className="text-sm text-slate-500 mt-1">Ba loại chứng thư theo quy định nội bộ VComm ERP.</p>
                </div>
                <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-2">
                  <Key className="w-4 h-4" /> Thêm chứng thư
                </button>
              </div>

              {/* Sig type legend */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {(Object.entries(SIG_TYPE_META) as [SigType, typeof SIG_TYPE_META[SigType]][]).map(([id, m]) => {
                  const MIcon = m.icon;
                  return (
                    <div key={id} className={cn('border rounded-xl p-3 flex items-start gap-2.5', m.color)}>
                      <MIcon className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold">{m.label}</p>
                        <p className="text-[10px] mt-0.5 opacity-70">{m.short}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                {MOCK_CERTS.map(cert => {
                  const m = SIG_TYPE_META[cert.sigType];
                  const CIcon = m.icon;
                  return (
                    <div key={cert.id} className={cn('border rounded-xl p-4 flex items-start gap-4 hover:shadow-sm transition-all bg-white', m.color.replace('text-', 'border-').split(' ')[0])}>
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0 border', m.color)}>
                        <CIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{cert.name}</h4>
                          <div className="flex items-center gap-2 shrink-0">
                            <SigTypeBadge type={cert.sigType} />
                            <span className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded',
                              cert.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                            )}>
                              {cert.status === 'active' ? 'Active' : 'Sắp hết hạn'}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{cert.provider} · Serial: <span className="font-mono">{cert.serial}</span></p>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className="text-slate-600">Hết hạn: <span className={cert.status === 'expiring_soon' ? 'text-orange-600 font-bold' : ''}>{cert.expiry}</span></span>
                          <button className="text-blue-600 hover:underline font-semibold">Cập nhật / Gia hạn</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Permissions tab */}
          {activeTab === 'permissions' && (
            <div className="p-6">
              <h3 className="text-base font-bold text-slate-900 mb-1">Phân quyền & Luồng ký số</h3>
              <p className="text-sm text-slate-500 mb-5">Cấu hình thứ tự ký và loại chữ ký yêu cầu theo từng loại tài liệu.</p>
              <div className="space-y-4">
                {[
                  { type: 'Hợp đồng lao động', flow: ['Chuyên viên HR', 'Trưởng phòng HR', 'Giám đốc'], sigs: ['personal_image', 'personal_ca', 'company_ca'] as SigType[] },
                  { type: 'Hợp đồng mua bán / Dịch vụ', flow: ['Pháp chế', 'Kế toán trưởng', 'Giám đốc', 'Đối tác'], sigs: ['personal_image', 'personal_ca', 'company_ca', 'company_ca'] as SigType[] },
                  { type: 'Đề nghị tạm ứng / Chi tiêu', flow: ['Người đề xuất', 'Quản lý trực tiếp', 'Kế toán trưởng', 'Giám đốc'], sigs: ['personal_image', 'personal_ca', 'personal_ca', 'personal_ca'] as SigType[] },
                ].map((item, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-slate-900 text-sm">{item.type}</h4>
                      <button className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg font-bold hover:bg-blue-100">Chỉnh sửa</button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.flow.map((role, rIdx) => (
                        <React.Fragment key={rIdx}>
                          <div className="flex flex-col items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 gap-1 text-center">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">{rIdx + 1}</div>
                            <p className="text-xs font-bold text-slate-900">{role}</p>
                            <SigTypeBadge type={item.sigs[rIdx]} />
                          </div>
                          {rIdx < item.flow.length - 1 && <ChevronRight className="w-4 h-4 text-slate-400" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Logs tab */}
          {activeTab === 'logs' && (
            <div>
              <div className="p-5 border-b border-slate-200 bg-slate-50">
                <h3 className="text-base font-bold text-slate-900">Nhật ký Hệ thống Ký số</h3>
                <p className="text-sm text-slate-500 mt-1">Lịch sử thao tác xác thực và ký số toàn hệ thống.</p>
              </div>
              <div className="overflow-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase">Thời gian</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase">Thao tác</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase">Loại chữ ký</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase">Người thực hiện</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase">IP & Thiết bị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { time: '10:45 27/04/2026', action: 'Ký số thành công HDLD-001', type: 'company_ca' as SigType, user: 'Nguyễn Văn B', ip: '192.168.1.100 (iOS)' },
                      { time: '09:20 27/04/2026', action: 'Gia hạn Chứng thư CA-002', type: 'personal_ca' as SigType, user: 'Admin System', ip: 'Hệ thống' },
                      { time: '16:30 26/04/2026', action: 'Ký thất bại – Sai PIN USB Token QD-12', type: 'personal_ca' as SigType, user: 'Trần Minh C', ip: '10.0.0.50 (Windows)' },
                      { time: '14:15 26/04/2026', action: 'Ký hình ảnh BB-2024-03', type: 'personal_image' as SigType, user: 'Lê Thị D', ip: '192.168.1.155 (Mac OS)' },
                    ].map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-5 py-3.5 text-xs text-slate-600 font-mono">{log.time}</td>
                        <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">{log.action}</td>
                        <td className="px-5 py-3.5"><SigTypeBadge type={log.type} /></td>
                        <td className="px-5 py-3.5 text-sm text-slate-700">{log.user}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">{log.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Document detail slide-over */}
      {detailDoc && (
        <DocDetailPanel
          doc={detailDoc}
          onClose={() => setDetailDoc(null)}
          onSign={handleSign}
        />
      )}

      {/* Signing modal */}
      {signingModalOpen && selectedDoc && (
        <SigningModal
          doc={selectedDoc}
          onClose={() => { setSigningModalOpen(false); setSelectedDoc(null); }}
          onConfirm={confirmSign}
        />
      )}
    </div>
  );
}
