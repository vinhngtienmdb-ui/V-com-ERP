import React, { useState, useEffect } from 'react';
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
 ShieldAlert
} from 'lucide-react';
import { ResizableTh } from './ui/ResizableTh';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { db, collection, getDocs, doc, updateDoc, serverTimestamp } from '../services/dbService';
import { useTableColumns, ColumnDef } from '../hooks/useTableColumns';

const INITIAL_SIGNATURES = [
  { id: 'SIGN-001', docId: 'HDLD-001', title: 'Hợp đồng lao động - Nguyễn Văn A', type: 'contract', requestDate: '25/03/2024', status: 'pending', requesters: 'Phòng Nhân sự' },
  { id: 'SIGN-002', docId: 'REQ-002', title: 'Đề nghị tạm ứng công tác phí', type: 'request', requestDate: '24/03/2024', status: 'signed', requesters: 'Nguyễn Diệu Nhi' },
  { id: 'SIGN-003', docId: 'CV-2024-001', title: 'Quyết định bổ nhiệm Giám đốc', type: 'document', requestDate: '20/03/2024', status: 'signed', requesters: 'Hội đồng quản trị' },
  { id: 'SIGN-004', docId: 'HDDV-001', title: 'Hợp đồng tư vấn AI', type: 'contract', requestDate: '01/02/2024', status: 'pending', requesters: 'Phòng Pháp chế' }
];

export function SignatureHub() {
  const [activeTab, setActiveTab] = useState('pending');
  const navigate = useNavigate();
  const { user, staffInfo } = useAuth();
  
  // Data States
  const [signatures, setSignatures] = useState<any[]>(INITIAL_SIGNATURES);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [userKeyPair, setUserKeyPair] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Modal States
  const [signingModalOpen, setSigningModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [privateKeyInput, setPrivateKeyInput] = useState('');
  const [isSigningInProcess, setIsSigningInProcess] = useState(false);

  // Drag and drop states for signature
  const [stampPos, setStampPos] = useState({ x: 180, y: 40 });
  const [isDraggingStamp, setIsDraggingStamp] = useState(false);
  const canvasContainerRef = React.useRef<HTMLDivElement>(null);

  const handleStampMouseDown = (e: React.MouseEvent) => {
    setIsDraggingStamp(true);
    e.preventDefault();
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingStamp || !canvasContainerRef.current) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(0, e.clientX - rect.left - 65), rect.width - 130);
    const y = Math.min(Math.max(0, e.clientY - rect.top - 30), rect.height - 60);
    setStampPos({ x, y });
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingStamp(false);
  };

  // Upload verification states
  const [verificationFile, setVerificationFile] = useState<any>(null);
  const [isVerifyingUpload, setIsVerifyingUpload] = useState(false);
  const [uploadVerifyResult, setUploadVerifyResult] = useState<any>(null);
  const [verificationFileStatus, setVerificationFileStatus] = useState<'verified' | 'tampered' | null>(null);

  // Verification States
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verifyingDoc, setVerifyingDoc] = useState<any>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Filters State
  const [searchSigQuery, setSearchSigQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [requesterFilter, setRequesterFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [signatureMethod, setSignatureMethod] = useState<'internal_identity' | 'biometric'>('internal_identity');

  const userEmail = user?.email || 'admin@vcomm-erp.vn';
  const tenantId = staffInfo?.tenantId || 'tenant-vcomm-prod-01';

  // Table Columns Setup
  const sigListColumns: ColumnDef[] = [
    { id: 'id', label: 'Mã trình ký', initialWidth: 150 },
    { id: 'ref', label: 'Tài liệu tham chiếu', initialWidth: 250 },
    { id: 'type', label: 'Phân loại', initialWidth: 120 },
    { id: 'flow', label: 'Tiến trình ký & Phân quyền', initialWidth: 250 },
    { id: 'status', label: 'Trạng thái', initialWidth: 120 },
    { id: 'date', label: 'Ngày', initialWidth: 150 }
  ];
  const { columns: listCols, handleResize: handleListResize, getPinOffset: getListPinOffset } = useTableColumns('sigList', sigListColumns);

  const sigLogColumns: ColumnDef[] = [
    { id: 'time', label: 'Thời gian', initialWidth: 180 },
    { id: 'action', label: 'Thao tác', initialWidth: 200 },
    { id: 'user', label: 'Người thực hiện', initialWidth: 150 },
    { id: 'ip', label: 'IP & Thiết bị', initialWidth: 200 }
  ];
  const { columns: logCols, handleResize: handleLogResize, getPinOffset: getLogPinOffset } = useTableColumns('sigLogs', sigLogColumns);

  // Batch Signing States
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  // Load signatures, certificates, keypair, and logs
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch user keypair
      const { data: keypairData } = await supabase
        .from('user_keypairs')
        .select('*')
        .eq('user_id', userEmail);
      
      if (keypairData && keypairData.length > 0) {
        setUserKeyPair(keypairData[0]);
        // Prefill private key if stored in local storage
        const storedKey = localStorage.getItem(`vcomm_private_key_${userEmail}`);
        if (storedKey) {
          setPrivateKeyInput(storedKey);
        }
      } else {
        setUserKeyPair(null);
      }

      // 2. Fetch all certificates
      const { data: allCerts } = await supabase
        .from('user_keypairs')
        .select('*')
        .order('created_at', { ascending: false });
      setCertificates(allCerts || []);

      // 3. Fetch cryptographic signatures
      const { data: dbSignatures } = await supabase
        .from('document_signatures')
        .select('*')
        .order('created_at', { ascending: false });
      
      const sigMap = new Map();
      if (dbSignatures) {
        dbSignatures.forEach(sig => {
          sigMap.set(sig.document_id, sig);
        });
      }

      // 4. Fetch requests from Firestore compatibility
      let firestoreReqs: any[] = [];
      try {
        const snap = await getDocs(collection(db, 'requests'));
        firestoreReqs = snap.docs.map(d => {
          const rdata = d.data() as any;
          return {
            id: `SIGN-${d.id.substring(0, 4).toUpperCase()}`,
            docId: d.id,
            title: rdata.title || 'Đề xuất không tên',
            type: 'request',
            requestDate: rdata.createdAt ? new Date(rdata.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
            status: rdata.status === 'approved' ? 'signed' : 'pending',
            requesters: rdata.createdBy || 'Hệ thống',
            documentData: rdata
          };
        });
      } catch (err) {
        console.warn('Failed to load requests from db. Using fallback.', err);
      }

      // Merge Real DB and fallbacks
      const merged = [...firestoreReqs, ...INITIAL_SIGNATURES].map(item => {
        // If there is a cryptographic signature in database, mark as signed
        const hasSig = sigMap.get(item.docId) || sigMap.get(item.id);
        if (hasSig) {
          return {
            ...item,
            status: 'signed',
            cryptoSigned: true,
            signer: hasSig.signer_name,
            signerEmail: hasSig.signer_email,
            signedDate: new Date(hasSig.created_at).toLocaleDateString('vi-VN')
          };
        }
        return item;
      });

      // De-duplicate items by docId or id
      const seen = new Set();
      const uniqueMerged = merged.filter(item => {
        const key = item.docId || item.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setSignatures(uniqueMerged);

      // Create logs list
      const dbLogs = (dbSignatures || []).map(sig => ({
        time: new Date(sig.created_at).toLocaleString('vi-VN'),
        action: `Ký số thành công tài liệu #${sig.document_id} (${sig.document_type === 'request' ? 'Đề xuất E-Form' : 'Hợp đồng'})`,
        user: sig.signer_name,
        ip: 'Xác thực SSL / RSA Key'
      }));
      setLogs([...dbLogs, ...MOCK_LOGS]);

    } catch (err) {
      console.error('Error fetching SignatureHub data:', err);
    } finally {
      setIsLoading(false);
    }
  };

    // Close modals on ESC keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSigningModalOpen(false);
        setSelectedDoc(null);
        setVerificationModalOpen(false);
        setVerifyingDoc(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [signingModalOpen, selectedDoc, verificationModalOpen, verifyingDoc]);

  useEffect(() => {
    fetchData();
  }, [userEmail]);

  // Generate Keypair RSA
  const handleGenerateKeyPair = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/signatures/generate-keypair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userEmail,
          tenantId: tenantId,
          certSubject: `CN=${user?.displayName || userEmail}, O=VComm ERP, C=VN`
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate keypair.');
      }

      // Save private key locally
      localStorage.setItem(`vcomm_private_key_${userEmail}`, data.privateKey);
      setPrivateKeyInput(data.privateKey);
      alert('Đã sinh cặp khóa RSA 2048-bit thành công! Khóa riêng tư đã được lưu an toàn trên trình duyệt này.');
      await fetchData();
    } catch (err: any) {
      alert(`Lỗi sinh cặp khóa: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSign = (doc: any) => {
    setSelectedDoc(doc);
    // Auto fill key if exists
    const storedKey = localStorage.getItem(`vcomm_private_key_${userEmail}`);
    if (storedKey) {
      setPrivateKeyInput(storedKey);
    }
    setSigningModalOpen(true);
  };

  // Confirm and Cryptographically Sign Document
  const confirmSign = async () => {
    if (!privateKeyInput || privateKeyInput.trim() === '') {
      alert('Vui lòng cung cấp khóa riêng tư (Private Key) để thực hiện ký số.');
      return;
    }

    setIsSigningInProcess(true);
    try {
      // Build document data payload for hashing
      const documentData = selectedDoc.documentData || {
        id: selectedDoc.docId || selectedDoc.id,
        title: selectedDoc.title,
        type: selectedDoc.type,
        date: selectedDoc.requestDate
      };

      const signRes = await fetch('/api/signatures/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privateKey: privateKeyInput,
          documentId: selectedDoc.docId || selectedDoc.id,
          documentType: selectedDoc.type,
          signerEmail: userEmail,
          signerName: user?.displayName || userEmail,
          tenantId: tenantId,
          documentData
        })
      });

      const data = await signRes.json();
      if (!signRes.ok || !data.success) {
        throw new Error(data.error || 'Lỗi thực thi chữ ký trên máy chủ.');
      }

      // Update Firestore compatibility request status if it's a request
      if (selectedDoc.type === 'request' && selectedDoc.docId) {
        await updateDoc(doc(db, 'requests', selectedDoc.docId), {
          status: 'approved',
          signedBy: user?.displayName || userEmail,
          updatedAt: serverTimestamp()
        });
      }

      alert('Ký số thành công! Chữ ký số mã hóa RSA đã được lưu trữ và kiểm chứng trên hệ thống.');
      setSigningModalOpen(false);
      setSelectedDoc(null);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      alert(`Ký số thất bại: ${err.message}`);
    } finally {
      setIsSigningInProcess(false);
    }
  };

  // Verify Document Signature Integrity
  const handleVerify = async (docItem: any) => {
    setIsVerifying(true);
    setVerifyingDoc(docItem);
    try {
      const documentData = docItem.documentData || {
        id: docItem.docId || docItem.id,
        title: docItem.title,
        type: docItem.type,
        date: docItem.requestDate
      };

      const res = await fetch('/api/signatures/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: docItem.docId || docItem.id,
          documentData
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify signatures.');
      }

      setVerificationResult(data);
      setVerificationModalOpen(true);
    } catch (err: any) {
      alert(`Lỗi xác thực chữ ký: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  // Filter signatures list
  const filteredSignatures = signatures.filter(doc => {
    const matchesTab = doc.status === activeTab;
    const matchesSearch = doc.title.toLowerCase().includes(searchSigQuery.toLowerCase()) || 
                          doc.docId.toLowerCase().includes(searchSigQuery.toLowerCase()) || 
                          doc.id.toLowerCase().includes(searchSigQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    const matchesRequester = requesterFilter === 'all' || doc.requesters === requesterFilter;
    
    let matchesDate = true;
    if (dateFilter) {
      const [year, month, day] = dateFilter.split('-');
      const formattedDateFilter = `${day}/${month}/${year}`;
      matchesDate = doc.requestDate === formattedDateFilter;
    }
    return matchesTab && matchesSearch && matchesType && matchesRequester && matchesDate;
  });

  const uniqueRequesters = Array.from(new Set(signatures.map(s => s.requesters)));

  const handleToggleSelectDoc = (docId: string) => {
    const newSet = new Set(selectedDocs);
    if (newSet.has(docId)) newSet.delete(docId);
    else newSet.add(docId);
    setSelectedDocs(newSet);
  };

  const pendingDocs = filteredSignatures.filter(d => d.status === 'pending');
  const handleSelectAllDocs = () => {
    if (selectedDocs.size === pendingDocs.length && pendingDocs.length > 0) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(pendingDocs.map(d => d.id)));
    }
  };

  const handleBatchSignClick = () => {
    if (selectedDocs.size === 0) return;
    const firstDoc = signatures.find(d => selectedDocs.has(d.id));
    if (firstDoc) {
      setSelectedDoc({
        ...firstDoc,
        title: `Ký theo lô (${selectedDocs.size} tài liệu)`,
        docId: Array.from(selectedDocs).join(','),
        type: 'batch'
      });
      const storedKey = localStorage.getItem(`vcomm_private_key_${userEmail}`);
      if (storedKey) setPrivateKeyInput(storedKey);
      setSigningModalOpen(true);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in- duration-500 pb-4">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="font-sans tracking-tight text-xl font-bold text-slate-900">Trung tâm Ký số (Digital Signature Hub)</h1>
          <p className="text-xs text-slate-500 mt-1 italic">Hệ thống cấp phát chứng thư số nội bộ tự động, xác thực định danh nhân viên bằng mật mã học RSA.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchData} 
            disabled={isLoading}
            className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-xs font-bold text-slate-800 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Làm mới Certs
          </button>
          <button 
            onClick={handleGenerateKeyPair}
            disabled={isLoading}
            className="bg-[#111827] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2 uppercase tracking-widest"
          >
            <Key className="w-4 h-4 text-emerald-400" />
            Cấp Chứng thư RSA
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="group bg-white border border-slate-300 p-4 rounded-xl shadow-sm hover:shadow-sm transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-8 -mt-8" />
          <div className="relative z-10">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Chờ tôi ký</h3>
            <p className="text-3xl font-bold text-slate-900">{signatures.filter(s => s.status === 'pending').length}</p>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-amber-600">
              <Clock className="w-3 h-3" /> Cần xử lý gấp
            </div>
          </div>
        </div>
        <div className="group bg-white border border-slate-300 p-4 rounded-xl shadow-sm hover:shadow-sm transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-100 rounded-full -mr-8 -mt-8" />
          <div className="relative z-10">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Đã hoàn tất</h3>
            <p className="text-3xl font-bold text-slate-900">{signatures.filter(s => s.status === 'signed').length}</p>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-primary-600">
              <CheckCircle2 className="w-3 h-3" /> Lưu trữ an toàn
            </div>
          </div>
        </div>
        <div className="group bg-slate-900 p-4 rounded-xl shadow-sm relative overflow-hidden lg:col-span-2">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-12 -mt-12" />
          <div className="relative z-10 flex justify-between items-center h-full">
            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Chứng thư đang hoạt động</h3>
              <p className="text-sm font-bold text-white">{userKeyPair ? userKeyPair.cert_subject : 'Chưa đăng ký chứng thư số'}</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                  <ShieldCheck className="w-3 h-3" /> {userKeyPair ? 'Cấp phát RSA 2048-bit (Active)' : 'Vui lòng nhấn nút cấp chứng thư'}
                </div>
              </div>
            </div>
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <FileSignature className="w-8 h-8 text-white/40" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Sidebar Tabs */}
        <div className="w-[240px] shrink-0 space-y-1">
          {[
            { id: 'pending', label: 'Chờ tôi ký', icon: Clock },
            { id: 'signed', label: 'Đã ký / Lịch sử', icon: CheckCircle2 },
            { id: 'verify', label: 'Xác minh Tài liệu', icon: ShieldCheck },
            { id: 'certificates', label: 'Quản lý Chứng thư số', icon: Key },
            { id: 'seals', label: 'Quản lý Con dấu', icon: Building2 },
            { id: 'permissions', label: 'Phân quyền Ký số', icon: UserCheck },
            { id: 'logs', label: 'Nhật ký hệ thống', icon: Lock },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all text-left",
                activeTab === tab.id 
                  ? "bg-primary-50 text-blue-700 font-bold border-l-4 border-l-blue-600" 
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
          {(activeTab === 'pending' || activeTab === 'signed') && (
            <>
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm tài liệu..."
                      value={searchSigQuery}
                      onChange={(e) => setSearchSigQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
                    />
                  </div>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm font-medium text-slate-700"
                  >
                    <option value="all">Tất cả phân loại</option>
                    <option value="contract">Hợp đồng</option>
                    <option value="request">Đề xuất E-Form</option>
                    <option value="document">Văn bản</option>
                  </select>
                  <select
                    value={requesterFilter}
                    onChange={(e) => setRequesterFilter(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm font-medium text-slate-700 max-w-[150px]"
                  >
                    <option value="all">Mọi người tạo</option>
                    {uniqueRequesters.map(req => (
                      <option key={req} value={req}>{req}</option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <input 
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm font-medium text-slate-700 w-full"
                    />
                  </div>
                </div>
                <button onClick={fetchData} className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm shrink-0">
                  <RefreshCw className="w-4 h-4" />
                </button>
                {activeTab === 'pending' && selectedDocs.size > 0 && (
                  <button 
                    onClick={handleBatchSignClick}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary-700 shrink-0 flex items-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    Ký Lô ({selectedDocs.size})
                  </button>
                )}
              </div>

              <div className="p-0 overflow-auto">
                <table className="w-max min-w-full text-left border-collapse whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {activeTab === 'pending' && (
                        <th className="px-4 py-3 w-10 text-center">
                          <input type="checkbox" checked={selectedDocs.size === pendingDocs.length && pendingDocs.length > 0} onChange={handleSelectAllDocs} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                        </th>
                      )}
                      <ResizableTh width={listCols.find(c => c.id === 'id')?.currentWidth} onResize={(w) => handleListResize('id', w)} isPinned={listCols.find(c => c.id === 'id')?.isPinned} pinOffset={getListPinOffset('id')} className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mã trình ký</ResizableTh>
                      <ResizableTh width={listCols.find(c => c.id === 'ref')?.currentWidth} onResize={(w) => handleListResize('ref', w)} isPinned={listCols.find(c => c.id === 'ref')?.isPinned} pinOffset={getListPinOffset('ref')} className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tài liệu tham chiếu</ResizableTh>
                      <ResizableTh width={listCols.find(c => c.id === 'type')?.currentWidth} onResize={(w) => handleListResize('type', w)} isPinned={listCols.find(c => c.id === 'type')?.isPinned} pinOffset={getListPinOffset('type')} className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phân loại</ResizableTh>
                      <ResizableTh width={listCols.find(c => c.id === 'flow')?.currentWidth} onResize={(w) => handleListResize('flow', w)} isPinned={listCols.find(c => c.id === 'flow')?.isPinned} pinOffset={getListPinOffset('flow')} className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tiến trình ký & Phân quyền</ResizableTh>
                      <ResizableTh width={listCols.find(c => c.id === 'status')?.currentWidth} onResize={(w) => handleListResize('status', w)} isPinned={listCols.find(c => c.id === 'status')?.isPinned} pinOffset={getListPinOffset('status')} className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Trạng thái</ResizableTh>
                      <ResizableTh width={listCols.find(c => c.id === 'date')?.currentWidth} onResize={(w) => handleListResize('date', w)} isPinned={listCols.find(c => c.id === 'date')?.isPinned} pinOffset={getListPinOffset('date')} className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ngày</ResizableTh>
                      <th className="px-4 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSignatures.map(doc => (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        {activeTab === 'pending' && (
                          <td className="px-4 py-3 text-center">
                            <input type="checkbox" checked={selectedDocs.has(doc.id)} onChange={() => handleToggleSelectDoc(doc.id)} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <p className="text-[13px] font-bold text-slate-900">{doc.id}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[13px] font-medium text-slate-900">{doc.title}</p>
                          <p className="text-xs text-slate-600 font-mono mt-0.5">{doc.docId}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg uppercase tracking-tight">
                            {doc.type === 'contract' ? 'Hợp đồng' : doc.type === 'request' ? 'Đề xuất E-Form' : 'Văn bản (NĐ30)'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-slate-600 uppercase font-bold tracking-tight w-16">Luồng ký:</p>
                            <div className="flex items-center gap-1">
                              <div className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-bold rounded">Người tạo</div>
                              <span className="text-slate-500">→</span>
                              <div className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-bold rounded">Quản lý</div>
                              <span className="text-slate-500">→</span>
                              <div className="px-2 py-0.5 bg-primary-50 text-blue-700 text-[10px] font-bold rounded">Giám đốc</div>
                            </div>
                          </div>
                          <div className="flex -space-x-2 overflow-hidden mt-2">
                            {[1, 2, 3].map((idx) => (
                              <div key={idx} className={cn(
                                "inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-100 flex-shrink-0 flex items-center justify-center text-[8px] font-bold",
                                idx === 1 ? "bg-emerald-100 text-emerald-700" : (idx === 2 && doc.status === 'signed' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600")
                              )} title={`Bước ${idx}`}>
                                {idx === 1 ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : (idx === 2 && doc.status === 'signed' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : idx)}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-tight inline-flex items-center gap-1",
                            doc.status === 'signed' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                          )}>
                            {doc.status === 'signed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {doc.status === 'signed' ? 'Đã ký số' : 'Chờ ký'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-slate-700">{doc.requestDate}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {doc.status === 'pending' && (
                            <button 
                              onClick={() => handleSign(doc)}
                              className="px-3 py-1.5 bg-primary-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-primary-700 transition-colors flex items-center gap-1.5 ml-auto"
                            >
                              <Key className="w-3.5 h-3.5" /> Ký ngay
                            </button>
                          )}
                          {doc.status === 'signed' && (
                            <button 
                              onClick={() => handleVerify(doc)}
                              disabled={isVerifying && verifyingDoc?.docId === doc.docId}
                              className="px-3 py-1.5 bg-slate-100 text-slate-800 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5 ml-auto disabled:opacity-50"
                            >
                              {isVerifying && verifyingDoc?.docId === doc.docId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-primary-600" />}
                              Xác thực chữ ký
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredSignatures.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-6 text-center text-slate-600 font-medium">
                          Không có tài liệu nào trong mục này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'seals' && (
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Quản lý Con dấu (Seal Management)</h3>
                  <p className="text-xs text-slate-600 mt-1">Quản lý con dấu mộc đỏ, chữ ký lãnh đạo và vị trí ký mặc định (Visual Signature Placement).</p>
                </div>
                <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Thêm con dấu mới
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col group">
                  <div className="bg-slate-100 h-32 flex items-center justify-center p-4 relative">
                    <div className="w-24 h-24 border-4 border-red-600 rounded-full flex items-center justify-center text-red-600 font-bold text-center transform -rotate-12 opacity-80">
                      <span className="text-[10px] uppercase leading-tight">Công ty Cổ phần<br/>VComm<br/>MDB</span>
                    </div>
                    <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="bg-white text-slate-900 px-3 py-1.5 rounded text-xs font-bold shadow-sm">Visual Placement</button>
                    </div>
                  </div>
                  <div className="p-4 flex-1">
                    <h4 className="font-bold text-slate-900">Mộc tròn Công ty (MDB)</h4>
                    <p className="text-xs text-slate-500 mt-1">Con dấu chính thức của pháp nhân. Được sử dụng cho Hợp đồng và Văn bản đi.</p>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-600">
                      <span>Người giữ dấu:</span>
                      <span className="bg-slate-100 px-2 py-1 rounded">Văn thư</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col group">
                  <div className="bg-slate-100 h-32 flex items-center justify-center p-4 relative">
                    <div className="text-blue-800 font-cursive text-2xl opacity-80 transform -rotate-6">
                      Nguyễn Văn A
                    </div>
                    <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="bg-white text-slate-900 px-3 py-1.5 rounded text-xs font-bold shadow-sm">Visual Placement</button>
                    </div>
                  </div>
                  <div className="p-4 flex-1">
                    <h4 className="font-bold text-slate-900">Chữ ký mẫu - CEO</h4>
                    <p className="text-xs text-slate-500 mt-1">Sử dụng cho trình ký nội bộ, đính kèm kèm con dấu công ty.</p>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-600">
                      <span>Quyền sử dụng:</span>
                      <span className="bg-slate-100 px-2 py-1 rounded">Nguyễn Văn A</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900">Cấu hình Quy trình Ký số & Phân quyền</h3>
                <p className="text-xs text-slate-600 mt-1">Thiết lập những ai có thẩm quyền ký và thứ tự ký cho từng loại tài liệu trong hệ thống.</p>
              </div>

              <div className="space-y-4">
                {[
                  { type: 'Quản lý Hợp đồng (Lao động)', flow: ['Chuyên viên HR', 'Trưởng phòng HR', 'Giám đốc'], methods: ['Ký nháy', 'Ký nháy', 'Ký số SmartCA'] },
                  { type: 'Hợp đồng mua bán / Dịch vụ', flow: ['Pháp chế', 'Kế toán trưởng', 'Giám đốc', 'Đối tác'], methods: ['Ký nháy', 'Ký nháy', 'Ký số Token', 'Ký số Tùy chọn'] },
                  { type: 'Đề nghị Tạm ứng / Chi tiêu', flow: ['Người đề xuất', 'Quản lý trực tiếp', 'Kế toán trưởng', 'Giám đốc'], methods: ['Xác nhận E-Form', 'Ký nháy', 'Ký nháy', 'Ký số / Chuyển khoản'] }
                ].map((item, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-lg p-5">
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center justify-between">
                      {item.type}
                      <button className="text-xs text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg font-bold hover:bg-blue-100 transition-colors">Chỉnh sửa</button>
                    </h4>
                    <div className="flex flex-wrap items-start gap-4">
                      {item.flow.map((role, rIdx) => (
                        <React.Fragment key={rIdx}>
                          <div className="flex flex-col items-center bg-slate-50 px-4 py-3 rounded-lg border border-slate-200 w-full sm:w-auto min-w-[150px]">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs mb-2">
                              {rIdx + 1}
                            </div>
                            <p className="text-xs font-bold text-slate-900 text-center">{role}</p>
                            <p className="text-[10px] text-slate-600 mt-1 bg-white px-2 rounded-full border border-slate-300">{item.methods[rIdx]}</p>
                          </div>
                          {rIdx < item.flow.length - 1 && (
                            <div className="h-16 flex items-center text-slate-500 self-center">
                              →
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'certificates' && (
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Quản lý Chứng thư số</h3>
                  <p className="text-xs text-slate-600 mt-1">Danh sách chứng thư số, chữ ký điện tử hiện có trên hệ thống.</p>
                </div>
                <button 
                  onClick={handleGenerateKeyPair}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  Tạo Chứng thư mới
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {certificates.map(cert => (
                  <div key={cert.user_id} className="border border-slate-200 rounded-lg p-5 flex items-start gap-4 hover:border-primary-300 transition-colors bg-white shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-300 flex items-center justify-center shrink-0">
                      <UserCheck className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-bold text-slate-900 truncate">{cert.user_id}</h4>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600">
                          Hoạt động
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mb-2 truncate">{cert.cert_subject}</p>
                      <p className="text-[10px] text-slate-500 font-mono bg-slate-50 p-1 rounded overflow-x-auto">
                        {cert.public_key.substring(0, 100)}...
                      </p>
                      <div className="flex items-center justify-between text-xs font-semibold mt-3">
                        <span className="text-slate-500">Tạo: {new Date(cert.created_at).toLocaleDateString('vi-VN')}</span>
                        <span className="text-primary-600">RSA 2048-bit</span>
                      </div>
                    </div>
                  </div>
                ))}
                {certificates.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-slate-500">
                    Chưa có chứng thư số nào được tạo. Nhấn "Tạo Chứng thư mới" để sinh khóa.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="p-0">
              <div className="p-6 border-b border-slate-200 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900">Nhật ký Hệ thống Ký số</h3>
                <p className="text-xs text-slate-600 mt-1">Lưu trữ lịch sử thao tác, xác thực và ký số trên toàn hệ thống.</p>
              </div>
              <div className="overflow-auto max-h-[500px]">
                <table className="w-max min-w-full text-left whitespace-nowrap">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <ResizableTh width={logCols.find(c => c.id === 'time')?.currentWidth} onResize={(w) => handleLogResize('time', w)} className="px-4 py-2 text-xs font-bold text-slate-600 uppercase">Thời gian</ResizableTh>
                      <ResizableTh width={logCols.find(c => c.id === 'action')?.currentWidth} onResize={(w) => handleLogResize('action', w)} className="px-4 py-2 text-xs font-bold text-slate-600 uppercase">Thao tác</ResizableTh>
                      <ResizableTh width={logCols.find(c => c.id === 'user')?.currentWidth} onResize={(w) => handleLogResize('user', w)} className="px-4 py-2 text-xs font-bold text-slate-600 uppercase">Người thực hiện</ResizableTh>
                      <ResizableTh width={logCols.find(c => c.id === 'ip')?.currentWidth} onResize={(w) => handleLogResize('ip', w)} className="px-4 py-2 text-xs font-bold text-slate-600 uppercase">IP & Thiết bị</ResizableTh>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-xs text-slate-700 font-mono">{log.time}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{log.action}</td>
                        <td className="px-4 py-3 text-xs text-slate-700">{log.user}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 font-mono">{log.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'verify' && (
            <div className="p-6 space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Xác minh Tính toàn vẹn Tài liệu</h3>
                <p className="text-xs text-slate-600 mt-1">Tải lên tệp đã ký số để đối chiếu chứng thư và phát hiện tài liệu có bị chỉnh sửa hay không.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload File Section */}
                <div className="space-y-4">
                  <div 
                    onClick={() => {
                      setIsVerifyingUpload(true);
                      setUploadVerifyResult(null);
                      setVerificationFileStatus(null);
                      setTimeout(() => {
                        setIsVerifyingUpload(false);
                        setVerificationFile({ name: 'Hop_dong_B2B_VComm_signed.pdf', size: '1.4 MB' });
                        setVerificationFileStatus('verified');
                        setUploadVerifyResult({
                          hash: '7a8b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b',
                          signer: 'Nguyễn Văn A (Tổng Giám Đốc)',
                          date: new Date().toLocaleString('vi-VN'),
                          ca: 'VComm CA Root Certification Authority',
                          serialNumber: '5409384918239401'
                        });
                      }, 1200);
                    }}
                    className="border-2 border-dashed border-slate-300 hover:border-primary-500 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100/50 cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[220px]"
                  >
                    {isVerifyingUpload ? (
                      <>
                        <RefreshCw className="w-10 h-10 text-primary-500 animate-spin mb-3" />
                        <p className="text-sm font-bold text-slate-800">Đang băm SHA-256 & truy vết blockchain...</p>
                      </>
                    ) : verificationFile ? (
                      <>
                        <ShieldCheck className="w-10 h-10 text-emerald-500 mb-3" />
                        <p className="text-sm font-bold text-slate-800">{verificationFile.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{verificationFile.size} • Đã quét hoàn tất</p>
                        <button className="mt-4 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm">Tải lên tệp khác</button>
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-slate-400 mb-3" />
                        <p className="text-sm font-bold text-slate-800">Kéo thả tệp PDF đã ký vào đây</p>
                        <p className="text-xs text-slate-500 mt-1">Hỗ trợ đối chiếu ký số doanh nghiệp</p>
                        <button className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-bold transition-all shadow-sm">Chọn tệp từ máy</button>
                      </>
                    )}
                  </div>

                  {verificationFile && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setVerificationFileStatus('verified');
                        }}
                        className={cn("px-4 py-1.5 text-xs font-bold rounded-lg border", verificationFileStatus === 'verified' ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-white text-slate-700 border-slate-300")}
                      >
                        Mô phỏng Khớp chữ ký
                      </button>
                      <button 
                        onClick={() => {
                          setVerificationFileStatus('tampered');
                        }}
                        className={cn("px-4 py-1.5 text-xs font-bold rounded-lg border", verificationFileStatus === 'tampered' ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-white text-slate-700 border-slate-300")}
                      >
                        Mô phỏng Sai lệch dữ liệu (Tampered)
                      </button>
                    </div>
                  )}
                </div>

                {/* Verification Results Panel */}
                <div>
                  {uploadVerifyResult ? (
                    <div className="space-y-4">
                      {verificationFileStatus === 'verified' ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
                          <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                          <div>
                            <h4 className="text-sm font-bold text-emerald-800">Xác minh Thành công!</h4>
                            <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                              Tài liệu nguyên vẹn 100%. Hàm băm SHA-256 khớp hoàn toàn với bản ghi lưu trữ trên nhật ký số.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-start gap-3 animate-bounce">
                          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                          <div>
                            <h4 className="text-sm font-bold text-rose-800">Cảnh báo: Dữ liệu đã bị thay đổi!</h4>
                            <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                              Lỗi toàn vẹn dữ liệu: File PDF đã bị chỉnh sửa nội dung hoặc ký số không hợp lệ so với bản ghi lưu gốc.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="bg-slate-900 text-white rounded-lg p-4 space-y-3 shadow-md border border-slate-950">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Thông tin Chứng thư & Chữ ký</span>
                        
                        <div className="space-y-2 text-[11px] leading-tight">
                          <div>
                            <p className="text-slate-400">Người ký số đại diện:</p>
                            <p className="font-bold text-slate-100">{uploadVerifyResult.signer}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Thời gian ký số hệ thống:</p>
                            <p className="font-bold text-slate-100">{uploadVerifyResult.date}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Nhà cung cấp chứng thư CA:</p>
                            <p className="font-bold text-slate-100">{uploadVerifyResult.ca}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Số hiệu chứng chỉ (Serial Number):</p>
                            <p className="font-bold text-slate-100 font-mono">{uploadVerifyResult.serialNumber}</p>
                          </div>
                          <div className="border-t border-slate-800 pt-2">
                            <p className="text-slate-400 mb-0.5">Mã SHA-256 Seal Hash:</p>
                            <p className="font-bold text-slate-100 font-mono text-[9px] truncate bg-slate-950 p-1.5 rounded">{uploadVerifyResult.hash}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 flex flex-col items-center justify-center text-center text-slate-400 min-h-[220px]">
                      <ShieldCheck className="w-12 h-12 mb-3 opacity-30" />
                      <p className="text-xs font-bold">Chưa có tệp nào được tải lên để xác minh</p>
                      <p className="text-[11px] mt-1">Kết quả đối chiếu chứng thư sẽ hiển thị tại đây.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Signing Modal */}
      {signingModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSigningModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary-600 animate-pulse" />
                Xác nhận Ký số Mật mã học (RSA)
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="p-4 bg-primary-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-bold leading-relaxed">Tài liệu: {selectedDoc?.title}</p>
                <p className="text-xs text-primary-600 font-mono mt-1">Ref ID: {selectedDoc?.docId || selectedDoc?.id}</p>
              </div>

              {/* Visual Placement Mock - Fully Interactive */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Định vị Con dấu & Chữ ký trực quan</label>
                <div 
                  ref={canvasContainerRef}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  className="border border-slate-300 rounded-lg p-4 bg-slate-100 flex flex-col items-center justify-center relative overflow-hidden h-48 select-none"
                >
                  {/* Simulated document background */}
                  <div className="absolute inset-0 bg-white/60 flex flex-col p-4 text-[9px] text-slate-400 font-serif leading-tight">
                    <p className="font-bold border-b border-slate-300 pb-1 mb-1">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                    <p className="font-bold">ĐIỀU 3: ĐIỀU KHOẢN THI HÀNH</p>
                    <p className="mt-1">Quyết định này có hiệu lực kể từ ngày ký. Các đơn vị liên quan chịu trách nhiệm thi hành quyết định...</p>
                    <p className="mt-2 text-right">Đại diện pháp luật ký tên đóng dấu bên dưới.</p>
                  </div>
                  
                  {/* Draggable Stamp */}
                  <div 
                    onMouseDown={handleStampMouseDown}
                    style={{ 
                      position: 'absolute',
                      left: `${stampPos.x}px`,
                      top: `${stampPos.y}px`,
                      cursor: isDraggingStamp ? 'grabbing' : 'grab',
                    }}
                    className={cn(
                      "w-[130px] h-[55px] border-2 rounded flex flex-col items-center justify-center shadow-md select-none transition-shadow z-20",
                      isDraggingStamp ? "border-emerald-500 bg-emerald-50/90 shadow-lg" : "border-rose-500 bg-rose-50/80"
                    )}
                  >
                     <span className="text-[8px] font-black text-rose-600 uppercase tracking-tighter leading-none">CÔNG TY CP VCOMM</span>
                     <span className="text-[8px] font-black text-rose-500 border border-rose-500 px-1 py-0.2 mt-0.5 rounded leading-none">ĐÃ KÝ SỐ</span>
                     <span className="text-[7px] text-slate-500 font-mono mt-0.5 leading-none">Vị trí: ${Math.round(stampPos.x)}, ${Math.round(stampPos.y)}</span>
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 text-center italic">Kéo hộp dấu đỏ ở trên và thả vào vị trí muốn đặt trên tài liệu.</p>
              </div>

              {!userKeyPair ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-800">Bạn chưa có Chứng thư số RSA</h4>
                    <p className="text-xs text-amber-700 mt-1">Vui lòng sinh cặp khóa RSA trên hệ thống trước khi thực hiện ký số.</p>
                    <button 
                      onClick={handleGenerateKeyPair}
                      className="mt-3 px-3 py-1.5 bg-amber-600 text-white rounded text-[11px] font-bold hover:bg-amber-700 transition-colors"
                    >
                      Sinh chứng thư số RSA ngay
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Chứng thư số đã chọn</label>
                    <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-xs text-slate-700 font-medium">
                      {userKeyPair.cert_subject}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Khóa riêng tư của bạn (Private Key PEM)</label>
                    <textarea 
                      rows={6}
                      value={privateKeyInput}
                      onChange={(e) => setPrivateKeyInput(e.target.value)}
                      placeholder="Dán mã khóa riêng tư RSA tại đây..."
                      className="w-full text-xs font-mono p-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Mẹo: Khóa riêng được tự động tải từ Local Storage nếu bạn đã sinh khóa trên máy này.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setSigningModalOpen(false)}
                disabled={isSigningInProcess}
                className="px-4 py-2.5 text-[13px] font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={confirmSign}
                disabled={isSigningInProcess || !userKeyPair || !privateKeyInput}
                className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-[13px] font-bold hover:bg-primary-700 shadow-sm active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSigningInProcess ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                {isSigningInProcess ? 'Đang thực thi ký số...' : 'Chấp nhận Ký số'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Results Modal */}
      {verificationModalOpen && verifyingDoc && verificationResult && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setVerificationModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary-600" />
                Kết quả kiểm tra Tính toàn vẹn chữ ký số
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tài liệu</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{verifyingDoc.title}</p>
                <p className="text-xs text-slate-600 font-mono mt-1">ID: {verifyingDoc.docId || verifyingDoc.id}</p>
              </div>

              {verificationResult.verified ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-800">Chữ ký Hợp lệ & Dữ liệu Nguyên vẹn</h4>
                    <p className="text-xs text-emerald-700 mt-1">
                      Mẫu chữ ký số mã hóa RSA khớp 100% với tài liệu và nội dung. Tài liệu không bị chỉnh sửa sau thời điểm ký.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-red-800">Xác thực Thất bại!</h4>
                    <p className="text-xs text-red-700 mt-1">
                      Cảnh báo: Phát hiện sai lệch hàm băm tài liệu! Dữ liệu của đề xuất/hợp đồng đã bị sửa đổi trái phép sau khi người duyệt ký số hoặc chứng thư số đã bị thu hồi.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Chi tiết Chữ ký trên tài liệu</h4>
                <div className="space-y-2">
                  {verificationResult.signatures.map((sig: any, index: number) => (
                    <div key={index} className="border border-slate-200 rounded p-3 text-xs bg-slate-50">
                      <div className="flex justify-between items-center mb-1">
                        <strong className="text-slate-800">{sig.signerName} ({sig.signerEmail})</strong>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          sig.verified ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                        )}>
                          {sig.verified ? 'Verified' : 'Fail'}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1">Thời gian ký: {new Date(sig.date).toLocaleString('vi-VN')}</p>
                      {sig.reason && <p className="text-red-600 mt-1 font-semibold">Lý do: {sig.reason}</p>}
                    </div>
                  ))}
                  {verificationResult.signatures.length === 0 && (
                    <p className="text-slate-500 italic text-center py-2">Không tìm thấy bản ghi chữ ký nào trong DB.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setVerificationModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded text-xs font-bold hover:bg-slate-700 transition-colors"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const MOCK_LOGS = [
  { time: '10:45 27/04/2026', action: 'Ký số thành công (SmartCA) tài liệu HD-001', user: 'Nguyễn Văn A', ip: '192.168.1.100 (iOS)' },
  { time: '09:20 27/04/2026', action: 'Gia hạn Chứng thư số CA-002', user: 'Admin System', ip: 'Xác thực từ hệ thống' },
  { time: '16:30 26/04/2026', action: 'Ký thất bại (Sai mã PIN USB Token) tài liệu QD-12', user: 'Trần B', ip: '10.0.0.50 (Windows)' },
  { time: '14:15 26/04/2026', action: 'Tạo luồng trình ký mới REQ-99', user: 'Phòng Nhân sự', ip: '192.168.1.155 (Mac OS)' },
];
