import React, { useState, useEffect, useRef } from 'react';
import { 
 FileText, 
 Send, 
 Inbox, 
 Settings, 
 Search, 
 Plus,
 RefreshCw,
 Clock,
 CheckCircle2,
 AlertCircle,
 FileSignature,
 DollarSign,
 Coffee,
 Briefcase,
 UserPlus,
 PenTool,
 X,
 FileEdit,
 ShieldCheck,
 Zap,
 Printer,
 ChevronRight,
 Layout,
 AlertTriangle,
 Trash2,
 ArrowRightLeft,
 ShieldAlert,
 Sparkles,
 Scale,
 BookOpen,
 Loader2,
 Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { TemplateGalleryModal } from './TemplateGalleryModal';
import { FormConfigModal } from './FormConfigModal';
import { Modal } from './ui/Modal';
import { db, collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy, limit, serverTimestamp } from '../lib/firebase';
import { syncTransactionToMisa } from '../services/misaService';

const INITIAL_REQUESTS = [
 { id: 'REQ-001', type: 'admin', subtype: 'Nghỉ phép', title: 'Xin nghỉ phép thường niên', requester: 'Lê Hoàng Minh', status: 'pending', date: '25/03/2024' },
 { id: 'REQ-002', type: 'finance', subtype: 'Tạm ứng', title: 'Tạm ứng công tác phí', requester: 'Nguyễn Diệu Nhi', status: 'approved', signatureStatus: 'signed', date: '24/03/2024' },
 { id: 'REQ-003', type: 'other', subtype: 'Tuyển dụng', title: 'Đề nghị tuyển dụng Marketing', requester: 'Trần B', status: 'rejected', date: '23/03/2024' },
];

const INITIAL_FORM_CONFIGS = [
 { id: 'F01', name: 'Đơn xin nghỉ phép', category: 'Hành chính', isActive: true, workflow: [{ id: 1, ruleType: 'system', sla: '24h', specificUser: '' }, { id: 2, ruleType: 'specific', sla: '48h', specificUser: 'Giám đốc Nhân sự' }], fields: [{id: 'f1', label: 'Từ ngày', type: 'date', required: true}, {id: 'f2', label: 'Đến ngày', type: 'date', required: true}, {id: 'f3', label: 'Loại phép', type: 'select', options: ['Phép năm', 'Phép không lương', 'Nghỉ ốm'], required: true}] },
 { id: 'F02', name: 'Đăng ký OT', category: 'Hành chính', isActive: true, workflow: [{ id: 1, ruleType: 'system', sla: '24h', specificUser: '' }], fields: [{id: 'f1', label: 'Ngày OT', type: 'date', required: true}, {id: 'f2', label: 'Số giờ', type: 'number', required: true}] },
 { id: 'F03', name: 'Tạm ứng', category: 'Tài chính', isActive: true, workflow: [{ id: 1, ruleType: 'system', sla: '24h', specificUser: '' }, { id: 2, ruleType: 'specific', sla: '48h', specificUser: 'Kế toán trưởng' }], fields: [{id: 'f1', label: 'Số tiền (VNĐ)', type: 'number', required: true}, {id: 'f2', label: 'Thông tin tài khoản nhận', type: 'text', required: true}] },
 { id: 'F04', name: 'Thanh toán', category: 'Tài chính', isActive: true, workflow: [{ id: 1, ruleType: 'specific', sla: '48h', specificUser: 'Kế toán trưởng' }], fields: [{id: 'f1', label: 'Số tiền (VNĐ)', type: 'number', required: true}, {id: 'f2', label: 'Thông tin tài khoản nhận', type: 'text', required: true}] },
 { id: 'F05', name: 'Mua sắm', category: 'Khác', isActive: true, workflow: [{ id: 1, ruleType: 'system', sla: '24h', specificUser: '' }], fields: [{id: 'f1', label: 'Danh sách mặt hàng', type: 'textarea', required: true}, {id: 'f2', label: 'Kinh phí dự kiến (VNĐ)', type: 'number', required: true}] },
 { id: 'F06', name: 'Tuyển dụng', category: 'Khác', isActive: true, workflow: [{ id: 1, ruleType: 'system', sla: '24h', specificUser: '' }, { id: 2, ruleType: 'specific', sla: '48h', specificUser: 'Giám đốc Nhân sự' }], fields: [{id: 'f1', label: 'Vị trí cần tuyển', type: 'text', required: true}, {id: 'f2', label: 'Số lượng', type: 'number', required: true}, {id: 'f3', label: 'Hạn chót cần offer', type: 'date', required: true}] },
];

export function RequestHub() {
 const [activeTab, setActiveTab] = useState('all');
 const navigate = useNavigate();
 const { user, isAdmin, staffInfo } = useAuth();
 const { addNotification } = useNotifications();
 const [requests, setRequests] = useState(INITIAL_REQUESTS);
 const [dbRequestIds, setDbRequestIds] = useState<Set<string>>(new Set());

 useEffect(() => {
 const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'), limit(100));
 const unsub = onSnapshot(q, (snap) => {
  if (snap.empty) return;
  const dbReqs = snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
  const ids = new Set<string>(dbReqs.map((r: any) => r.id));
  setDbRequestIds(ids);
  setRequests(prev => {
  const mockOnly = prev.filter(r => !ids.has(r.id));
  return [...dbReqs, ...mockOnly];
  });
 }, (err) => console.error('RequestHub snapshot error:', err));
 return () => unsub();
 }, []);

 
 // Settings State
 const [formConfigs, setFormConfigs] = useState(INITIAL_FORM_CONFIGS);
 const [editingFormConfig, setEditingFormConfig] = useState<any>(null);
 const [showConfigModal, setShowConfigModal] = useState(false);
 const [showTemplateGallery, setShowTemplateGallery] = useState(false);
 const [templateAction, setTemplateAction] = useState<'create_config' | 'submit_request'>('submit_request');
 const [selectedConfigForWorkflow, setSelectedConfigForWorkflow] = useState<string>('F01');

 // Signature State
 const [signingRequestId, setSigningRequestId] = useState<string | null>(null);
 const [legalAuditResult, setLegalAuditResult] = useState<string | null>(null);
 const [isAuditing, setIsAuditing] = useState(false);
 const canvasRef = useRef<HTMLCanvasElement | null>(null);
 const [isCanvasDrawing, setIsCanvasDrawing] = useState(false);
 const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);
 const [drawnSignatureData, setDrawnSignatureData] = useState<string | null>(() => {
  try {
    return localStorage.getItem('vcomm_saved_signature') || null;
  } catch {
    return null;
  }
 });
 const [signatureMethod, setSignatureMethod] = useState<'company_ca' | 'personal_ca' | 'personal_image'>('company_ca');
 const [isSigningInProcess, setIsSigningInProcess] = useState(false);

 // MISA Sync State
  const [syncedMisaRequests, setSyncedMisaRequests] = useState<Record<string, boolean>>({});
  const [syncingMisaId, setSyncingMisaId] = useState<string | null>(null);

  const handleSyncRequestToMisa = async (req: any) => {
    setSyncingMisaId(req.id);
    try {
      let category = 'Operational';
      let debitAccount = '6422';
      let creditAccount = '1121';

      if (req.subtype.includes('Tạm ứng') || req.subtype.includes('tạm ứng')) {
        category = 'Tạm ứng';
        debitAccount = '141';
      } else if (req.subtype.includes('Quyết toán') || req.subtype.includes('Hoàn ứng') || req.subtype.includes('hoàn ứng')) {
        category = 'Quyết toán tạm ứng';
        debitAccount = '6422';
        creditAccount = '141';
      } else if (req.subtype.includes('Thêm giờ') || req.subtype.includes('OT')) {
        category = 'Operational';
        debitAccount = '6422';
      }

      const amount = req.formData?.amount || req.formData?.cost || req.value || 500000;
      const description = req.title || req.subtype;

      const result = await syncTransactionToMisa(req.id, {
        amount,
        description,
        type: 'expense',
        category,
        debitAccount,
        creditAccount,
        accountingObjectCode: 'NCCLE'
      });

      if (result && result.status === 'success') {
        setSyncedMisaRequests(prev => ({ ...prev, [req.id]: true }));
        addNotification('Ghi sổ thành công', `Đề xuất ${req.id} đã được ghi sổ chi phí.`);
      } else {
        throw new Error(result.message || 'Lỗi không xác định khi ghi sổ');
      }
    } catch (err: any) {
      console.error('Failed to sync:', err);
      addNotification('Lỗi Ghi sổ', `Không thể ghi sổ đề xuất ${req.id}: ${err.message || err}`);
    } finally {
      setSyncingMisaId(null);
    }
  };

 // Printing State
 const [showPrintModal, setShowPrintModal] = useState(false);
 const [selectedRequestForPrint, setSelectedRequestForPrint] = useState<any>(null);

 // Detail View State
 const [selectedRequestForView, setSelectedRequestForView] = useState<any>(null);

  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'verified' | 'tampered'>('unverified');
  const [verificationDetails, setVerificationDetails] = useState<any>(null);

  const verifyRequestSignature = async (reqItem: any) => {
    if (reqItem.signatureStatus !== 'signed') {
      setVerificationStatus('unverified');
      return;
    }
    setVerificationLoading(true);
    try {
      const documentData = {
        id: reqItem.id,
        title: reqItem.title,
        type: reqItem.type,
        date: reqItem.date
      };

      const res = await fetch('/api/signatures/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: reqItem.id,
          documentData
        })
      });
      if (res.ok) {
        const data = await res.json();
        setVerificationDetails(data);
        if (data.verified) {
          setVerificationStatus('verified');
        } else {
          setVerificationStatus('tampered');
        }
      } else {
        setVerificationStatus('tampered');
      }
    } catch (err) {
      console.error('Verify error:', err);
      setVerificationStatus('tampered');
    } finally {
      setVerificationLoading(false);
    }
  };

  useEffect(() => {
    setLegalAuditResult(null);
    if (selectedRequestForView) {
      verifyRequestSignature(selectedRequestForView);
    } else {
      setVerificationStatus('unverified');
      setVerificationDetails(null);
    }
  }, [selectedRequestForView]);

 // Routing State
 const [showRouteModal, setShowRouteModal] = useState(false);
 const [routingRequest, setRoutingRequest] = useState<any>(null);
 const [routingDepartment, setRoutingDepartment] = useState('accounting');
 const [routingRecipient, setRoutingRecipient] = useState('');
 const [routingNote, setRoutingNote] = useState('');

 const handleRevokeRequest = (id: string) => {
 if(window.confirm('Bạn có chắc muốn thu hồi đề xuất này?')) {
  handleStatusChange(id, 'revoked');
  if (selectedRequestForView?.id === id) {
  setSelectedRequestForView({ ...selectedRequestForView, status: 'revoked' });
  }
 }
 };

 const handleDeleteRequest = (id: string) => {
 if(window.confirm('Xóa vĩnh viễn đề xuất này?')) {
  setRequests(requests.filter(r => r.id !== id));
  setSelectedRequestForView(null);
 }
 };

 const executeRouting = async () => {
 if (!routingRequest) return;
 
 const departmentLabels: Record<string, string> = {
  accounting: 'Phòng Kế toán & Tài chính',
  hr: 'Phòng Nhân sự & Đào tạo',
  ceo: 'Văn phòng Ban Giám đốc',
  ops: 'Phòng Vận hành & Kho vận',
 };
 
 const selectedDeptLabel = departmentLabels[routingDepartment] || 'Đơn vị đích';
 const recipientSuffix = routingRecipient ? ` (${routingRecipient})` : '';
 const stepName = `Luân chuyển -> ${selectedDeptLabel}${recipientSuffix}`;
 
 const routingActionLog = {
  level: (routingRequest.approvalLog || []).length + 1,
  status: 'approved',
  by: user?.displayName || user?.email || 'Hệ thống',
  time: new Date().toLocaleString('vi-VN'),
  stepName: stepName,
  note: routingNote || 'Gửi kèm văn bản điện tử'
 };
 
 const updatedApprovalLog = [
  ...(routingRequest.approvalLog || []),
  routingActionLog
 ];
 
 // Update local state
 setRequests(prevRequests => prevRequests.map(req => 
  req.id === routingRequest.id 
    ? { ...req, approvalLog: updatedApprovalLog, status: 'pending' } 
    : req
 ));
 
 // If we have selectedRequestForPrint open, update its state as well
 if (selectedRequestForPrint && selectedRequestForPrint.id === routingRequest.id) {
  setSelectedRequestForPrint({
    ...selectedRequestForPrint,
    approvalLog: updatedApprovalLog,
    status: 'pending'
  });
 }

 // Also update selectedRequestForView if open
 if (selectedRequestForView && selectedRequestForView.id === routingRequest.id) {
  setSelectedRequestForView({
    ...selectedRequestForView,
    approvalLog: updatedApprovalLog,
    status: 'pending'
  });
 }
 
 // Check if DB record and update Firestore
 if (dbRequestIds.has(routingRequest.id)) {
  try {
    updateDoc(doc(db, 'requests', routingRequest.id), {
      approvalLog: updatedApprovalLog,
      status: 'pending',
      updatedAt: serverTimestamp()
    }).catch(err => console.error('Failed to update routed request in DB:', err));
  } catch (err) {
    console.error('Failed to update routed request in DB:', err);
  }
 }
 
 // Add real logs to Admin Audit Logs too for total corporate consistency
 try {
  const tenantId = staffInfo?.tenantId || 'tenant-vcomm-prod-01';
  const auditPayload = {
    email: user?.email || 'admin@v-erp.com',
    userId: user?.uid || 'admin-ai-system',
    action: `Circulate Document [${routingRequest.id}] to ${selectedDeptLabel}`,
    status: 'Success',
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    browser: 'WorkFlow Routing Engine',
    ipAddress: '127.0.0.1',
    tenantId
  };
  
  addDoc(collection(db, 'admin_audit_logs'), auditPayload).catch(err => console.error('Failed to log routing audit trail:', err));
 } catch (err) {
  console.error('Failed to log routing audit trail:', err);
 }
 
 addNotification(
  'Luân chuyển thành công', 
  `Đã chuyển tiếp văn bản ${routingRequest.id} đến bộ phận ${selectedDeptLabel}.`
 );
 
 // Close route modal
 setShowRouteModal(false);
 };

 const handleStatusChange = (id: string, newStatus: string) => {
 const isDbRecord = dbRequestIds.has(id);
 setRequests(requests.map(req => {
 if (req.id === id) {
 const config = formConfigs.find(c => c.name === req.subtype);
 const currentLevel = (req as any).currentLevel || 1;
 const workflowSteps = config?.workflow || [];
 const totalLevels = workflowSteps.length || 1;
 const approvalLog = (req as any).approvalLog || [];

 if (newStatus === 'approved') {
 // Check if there are more steps
 if (currentLevel < totalLevels) {
 // Move to next level
 return { 
 ...req, 
 currentLevel: currentLevel + 1, 
 status: 'pending',
 approvalLog: [...approvalLog, { 
 level: currentLevel, 
 status: 'approved', 
 by: user?.displayName || 'Cấp duyệt 1', 
 time: new Date().toLocaleString('vi-VN'),
 stepName: `Duyệt cấp ${currentLevel}`
 }]
 };
 } else {
 // Final approval
 return { 
 ...req, 
 status: 'approved',
 approvalLog: [...approvalLog, { 
 level: currentLevel, 
 status: 'approved', 
 by: user?.displayName || 'Director', 
 time: new Date().toLocaleString('vi-VN'),
 stepName: 'Duyệt cấp cuối'
 }]
 };
 }
 } else if (newStatus === 'rejected') {
 return {
 ...req,
 status: 'rejected',
 approvalLog: [...approvalLog, { 
 level: currentLevel, 
 status: 'rejected', 
 by: user?.displayName || 'Manager', 
 time: new Date().toLocaleString('vi-VN'),
 stepName: `Từ chối tại cấp ${currentLevel}`
 }]
 };
 }
 
 return { ...req, status: newStatus };
 }
 return req;
 }));
 if (isDbRecord) {
  updateDoc(doc(db, 'requests', id), { status: newStatus, updatedAt: serverTimestamp() })
  .catch(err => console.error('RequestHub status update error:', err));
 }
 };
 const [searchReqQuery, setSearchReqQuery] = useState('');
 const [statusFilter, setStatusFilter] = useState('all');
 const [requesterFilter, setRequesterFilter] = useState('all');
 const [startDate, setStartDate] = useState('');
 const [endDate, setEndDate] = useState('');

 const clearAllFilters = () => {
 setSearchReqQuery('');
 setStatusFilter('all');
 setRequesterFilter('all');
 setStartDate('');
 setEndDate('');
 };

 const isFiltered = searchReqQuery !== '' || statusFilter !== 'all' || requesterFilter !== 'all' || startDate !== '' || endDate !== '';

 const filteredRequests = requests.filter(doc => {
 const matchesTab = activeTab === 'all' || doc.type === activeTab;
 const matchesSearch = 
 doc.title.toLowerCase().includes(searchReqQuery.toLowerCase()) || 
 doc.id.toLowerCase().includes(searchReqQuery.toLowerCase()) ||
 doc.subtype.toLowerCase().includes(searchReqQuery.toLowerCase());
 
 const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
 const matchesRequester = requesterFilter === 'all' || doc.requester === requesterFilter;

 // Date Range Logic
 let matchesDate = true;
 if (startDate || endDate) {
 // Helper to parse DD/MM/YYYY to Date object
 const [d, m, y] = doc.date.split('/');
 const docDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
 
 if (startDate) {
 const start = new Date(startDate);
 start.setHours(0, 0, 0, 0);
 if (docDate < start) matchesDate = false;
 }
 if (endDate) {
 const end = new Date(endDate);
 end.setHours(23, 59, 59, 999);
 if (docDate > end) matchesDate = false;
 }
 }

 return matchesTab && matchesSearch && matchesStatus && matchesRequester && matchesDate;
 });

 const uniqueRequesters = Array.from(new Set(requests.map(r => r.requester)));

 // Create Request Modal State
 const [showAddModal, setShowAddModal] = useState(false);
 const [newRequest, setNewRequest] = useState<any>({ 
 subtype: 'Đơn xin nghỉ phép', 
 title: '', 
 requester: 'Tôi (Người đang đăng nhập)', 
 formData: {},
 isUrgent: false,
 customReviewers: [{ step: 1, reviewer: 'Quản lý trực tiếp' }]
 });

 const handleAddRequest = () => {
 if (!newRequest.title) return alert("Vui lòng nhập nội dung đề xuất");
 
 const matchedConfig = formConfigs.find(c => c.name === newRequest.subtype);
 let type = 'other';
 if (matchedConfig?.category === 'Hành chính') type = 'admin';
 if (matchedConfig?.category === 'Tài chính') type = 'finance';
 
 const request = {
 id: `REQ-00${requests.length + 1}`,
 type,
 subtype: newRequest.subtype,
 title: newRequest.title,
 requester: newRequest.requester,
 status: 'pending',
 date: new Date().toLocaleDateString('en-GB'),
 currentLevel: 1,
 approvalLog: [],
 formData: newRequest.formData,
 isUrgent: newRequest.isUrgent,
 customReviewers: newRequest.customReviewers
 };
 
 addDoc(collection(db, 'requests'), { ...request, createdAt: serverTimestamp() })
  .catch(err => console.error('RequestHub addRequest error:', err));
 setRequests([request, ...requests]);
 setShowAddModal(false);
 setNewRequest({ 
 subtype: formConfigs[0]?.name || '', 
 title: '', 
 requester: 'Tôi (Người đang đăng nhập)', 
 formData: {},
 isUrgent: false,
 customReviewers: [{ step: 1, reviewer: 'Quản lý trực tiếp' }]
 });
 };

 // --- START OF HANDDRAWN SIGNATURE PAD HELPERS ---
 const startCanvasDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
  if (!canvasRef.current) return;
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  setIsCanvasDrawing(true);
  setIsCanvasEmpty(false);

  // Setup drawing appearance
  ctx.strokeStyle = '#1e3a8a'; // Deep primary blue-900 for executive signing feel
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const pos = getCanvasPosition(e, canvas);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
 };

 const drawCanvas = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
  if (!isCanvasDrawing || !canvasRef.current) return;
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const pos = getCanvasPosition(e, canvas);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
 };

 const stopCanvasDrawing = () => {
  setIsCanvasDrawing(false);
  saveCanvasSignature();
 };

 const getCanvasPosition = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
  const rect = canvas.getBoundingClientRect();
  const clientX = 'touches' in e ? (e.touches[0] ? e.touches[0].clientX : e.changedTouches[0].clientX) : e.clientX;
  const clientY = 'touches' in e ? (e.touches[0] ? e.touches[0].clientY : e.changedTouches[0].clientY) : e.clientY;
  return {
   x: clientX - rect.left,
   y: clientY - rect.top
  };
 };

 const clearCanvasSignature = () => {
  if (!canvasRef.current) return;
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  setIsCanvasEmpty(true);
  setDrawnSignatureData(null);
  try {
    localStorage.removeItem('vcomm_saved_signature');
  } catch {}
 };

 const saveCanvasSignature = () => {
  if (!canvasRef.current || isCanvasEmpty) return;
  try {
    const dataUrl = canvasRef.current.toDataURL('image/png');
    setDrawnSignatureData(dataUrl);
    localStorage.setItem('vcomm_saved_signature', dataUrl);
  } catch (err) {
    console.error('Failed to save drawn signature:', err);
  }
 };
 // --- END OF HANDDRAWN SIGNATURE PAD HELPERS ---

 // --- START OF LEGAL AI AUDITOR ENGINE ---
 const handleAiLegalAudit = async (req: any) => {
  if (!req) return;
  setIsAuditing(true);
  setLegalAuditResult(null);
  try {
    const response = await fetch('/api/gemini/legal-audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentId: req.id,
        type: req.type || 'admin',
        subtype: req.subtype || 'Nghỉ phép',
        title: req.title || '',
        formData: req.formData || {}
      })
    });
    
    if (!response.ok) throw new Error('API Legal Audit failed');
    const data = await response.json();
    setLegalAuditResult(data.text);
    addNotification('Thẩm định AI hoàn tất', `Pháp chế VComm đã hoàn tất thẩm định tính tuân thủ cho hồ sơ ${req.id}.`);
  } catch (err) {
    console.error('AI Legal Audit Error:', err);
    addNotification('Lỗi Thẩm định AI', 'Hệ thống thẩm định pháp lý AI đang bận. Vui lòng thử lại sau.');
  } finally {
    setIsAuditing(false);
  }
 };
 // --- END OF LEGAL AI AUDITOR ENGINE ---

   const executeSignature = async () => {
    if (!signingRequestId) return;
    setIsSigningInProcess(true);
    try {
      const sigImage = signatureMethod === 'personal_image' ? drawnSignatureData : null;
      
      const userEmail = user?.email || 'admin@vcomm-erp.vn';
      let privateKey = localStorage.getItem(`vcomm_private_key_${userEmail}`);
      if (!privateKey) {
        console.log('[Auto-CA] Generating RSA keypair for user:', userEmail);
        const genRes = await fetch('/api/signatures/generate-keypair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userEmail,
            tenantId: 'tenant-vcomm-prod-01',
            certSubject: `CN=${user?.displayName || userEmail}, O=VComm ERP, C=VN`
          })
        });
        if (genRes.ok) {
          const genData = await genRes.json();
          privateKey = genData.privateKey;
          localStorage.setItem(`vcomm_private_key_${userEmail}`, genData.privateKey);
          console.log('[Auto-CA] Automatic keypair registered and stored.');
        } else {
          throw new Error('Auto key generation failed.');
        }
      }

      const reqObj = requests.find(r => r.id === signingRequestId);
      if (!reqObj) throw new Error('Không tìm thấy thông tin đề xuất.');

      const documentData = {
        id: reqObj.id,
        title: reqObj.title,
        type: reqObj.type,
        date: reqObj.date
      };

      const signRes = await fetch('/api/signatures/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privateKey: privateKey,
          documentId: reqObj.id,
          documentType: 'request',
          signerEmail: userEmail,
          signerName: user?.displayName || userEmail,
          tenantId: 'tenant-vcomm-prod-01',
          documentData
        })
      });

      if (!signRes.ok) {
        const signErr = await signRes.json();
        throw new Error(signErr.error || 'Lỗi ký số bảo mật.');
      }

      const resData = await signRes.json();
      const secureHash = resData.signature.substring(0, 24) + '...';

      const signedData = {
        signatureStatus: 'signed',
        status: 'approved',
        signedBy: user?.displayName || userEmail,
        signedAt: new Date().toLocaleString('vi-VN'),
        caProvider: 'RSA 2048-bit (Auto-CA)',
        secureHash: secureHash,
        signatureDraw: sigImage
      };

      setRequests(prev => prev.map(req =>
        req.id === signingRequestId ? { ...req, ...signedData } : req
      ));

      if (selectedRequestForView && selectedRequestForView.id === signingRequestId) {
        setSelectedRequestForView({ ...selectedRequestForView, ...signedData });
      }

      if (selectedRequestForPrint && selectedRequestForPrint.id === signingRequestId) {
        setSelectedRequestForPrint({ ...selectedRequestForPrint, ...signedData });
      }

      if (dbRequestIds.has(signingRequestId)) {
        await updateDoc(doc(db, 'requests', signingRequestId), { ...signedData, updatedAt: serverTimestamp() });
      }

      addNotification('Ký số thành công', `Đề xuất mã ${signingRequestId} đã được niêm phong điện tử bằng thuật toán RSA.`);
    } catch (err: any) {
      console.error('executeSignature error:', err);
      addNotification('Lỗi ký số', err.message || 'Không thể thực thi ký số điện tử.');
    } finally {
      setIsSigningInProcess(false);
      setSigningRequestId(null);
    }
  };
 return (
 <div className="space-y-4 animate-in fade-in slide-in- duration-500 pb-4">
 <div className="flex items-center justify-between">
 <div className="header-title border-l-4 border-primary-600 pl-4 py-1">
 <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight">Đề xuất, Phê duyệt & Ký số <span className="text-primary-600">E-Form</span></h1>
 <p className="text-xs font-bold text-slate-600 mt-2 uppercase tracking-widest">Hành chính • Tài chính • Nhân sự • Quy trình số</p>
 </div>
 <div className="flex gap-3">
 <button 
 onClick={() => navigate('/signature')}
 className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-2"
 >
 <FileSignature className="w-4 h-4" />
 Trung tâm Ký số
 </button>
 <button 
 onClick={() => {
   setTemplateAction('submit_request');
   setShowTemplateGallery(true);
 }}
 className="bg-[#111827] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 <Plus className="w-4 h-4" />
 Tạo đề xuất
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
 <div className="bg-white border border-slate-300 p-6 rounded-lg shadow-sm">
 <h3 className="text-[13px] font-bold text-slate-900 mb-1 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /> Cần tôi duyệt</h3>
 <p className="text-xl font-bold text-slate-900 mt-2">{requests.filter(r => r.status === 'pending').length}</p>
 </div>
 <div className="bg-white border border-slate-300 p-6 rounded-lg shadow-sm">
 <h3 className="text-[13px] font-bold text-slate-900 mb-1 flex items-center gap-2"><Send className="w-4 h-4 text-primary-600" /> Tôi gửi đi</h3>
 <p className="text-xl font-bold text-slate-900 mt-2">{requests.filter(r => r.requester === 'Tôi (Người đang đăng nhập)').length}</p>
 </div>
 <div className="bg-white border border-slate-300 p-6 rounded-lg shadow-sm">
 <h3 className="text-[13px] font-bold text-slate-900 mb-1 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Đã duyệt (Tháng)</h3>
 <p className="text-xl font-bold text-slate-900 mt-2">{requests.filter(r => r.status === 'approved').length}</p>
 </div>
 <div className="bg-white border border-slate-300 p-6 rounded-lg shadow-sm">
 <h3 className="text-[13px] font-bold text-slate-900 mb-1 flex items-center gap-2"><FileSignature className="w-4 h-4 text-purple-500" /> Chờ ký số</h3>
 <p className="text-xl font-bold text-slate-900 mt-2">{requests.filter(r => r.status === 'approved' && r.signatureStatus !== 'signed').length}</p>
 </div>
 </div>

 <div className="flex gap-6">
 {/* Sidebar */}
 <div className="w-[240px] shrink-0 space-y-1">
 {[
 { id: 'all', label: 'Tất cả Đề xuất', icon: Inbox },
 { id: 'admin', label: 'Hành chính (Nghỉ phép, OT)', icon: Coffee },
 { id: 'finance', label: 'Tài chính (Tạm ứng, TT)', icon: DollarSign },
 { id: 'other', label: 'Khác (VPP, Tuyển dụng)', icon: UserPlus },
 { id: 'settings', label: 'Cấu hình Form Đề xuất', icon: Settings },
 ].map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={cn(
 "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all text-left",
 activeTab === tab.id 
 ? "bg-emerald-50 text-emerald-700 font-bold" 
 : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium"
 )}
 >
 <tab.icon className="w-4 h-4" />
 {tab.label}
 </button>
 ))}
 </div>

 {/* Content */}
 <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
 {activeTab !== 'settings' ? (
 <>
 <div className="p-4 border-b border-slate-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-50/80">
 <div className="flex flex-wrap items-center gap-3 flex-1 w-full">
 <div className="relative flex-1 w-full max-w-sm">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
 <input 
 type="text" 
 placeholder="Tìm theo mã, nội dung hoặc loại phiếu..."
 value={searchReqQuery}
 onChange={(e) => setSearchReqQuery(e.target.value)}
 className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm placeholder:text-slate-500 transition-all"
 />
 </div>
 
 <div className="flex items-center gap-2">
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm font-medium text-slate-700 cursor-pointer hover:border-slate-400"
 >
 <option value="all">Trạng thái (Tất cả)</option>
 <option value="pending">Chờ duyệt</option>
 <option value="approved">Đã duyệt</option>
 <option value="rejected">Từ chối</option>
 </select>

 <select
 value={requesterFilter}
 onChange={(e) => setRequesterFilter(e.target.value)}
 className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm font-medium text-slate-700 max-w-[150px] cursor-pointer hover:border-slate-400"
 >
 <option value="all">Người tạo (Mọi người)</option>
 {uniqueRequesters.map(req => (
 <option key={req} value={req}>{req}</option>
 ))}
 </select>
 </div>

 <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm">
 <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-500 px-2 border-r border-slate-200">
 <Clock className="w-3 h-3" /> Từ
 </div>
 <input 
 type="date"
 value={startDate}
 onChange={(e) => setStartDate(e.target.value)}
 className="text-xs bg-transparent focus:outline-none font-bold text-slate-800"
 />
 <div className="text-slate-500 mx-1">/</div>
 <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-500 px-2 border-r border-slate-200">
 Đến
 </div>
 <input 
 type="date"
 value={endDate}
 onChange={(e) => setEndDate(e.target.value)}
 className="text-xs bg-transparent focus:outline-none font-bold text-slate-800"
 />
 </div>

 {isFiltered && (
 <button 
 onClick={clearAllFilters}
 className="text-xs font-bold text-rose-500 hover:text-rose-600 px-3 py-2 bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5"
 >
 <X className="w-3 h-3" /> Xóa bộ lọc
 </button>
 )}
 </div>
 
 <div className="flex items-center gap-2 shrink-0">
 <button 
 onClick={() => {}} // Could trigger a re-fetch if using API
 className="p-2 text-slate-500 hover:text-emerald-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all hover:bg-emerald-50 active:scale-95"
 title="Làm mới"
 >
 <RefreshCw className="w-4 h-4" />
 </button>
 </div>
 </div>

 <div className="overflow-x-auto min-w-0 custom-scrollbar-x">
 <table className="min-w-[680px] w-full text-left border-collapse">
 <thead className="bg-slate-50 border-b border-slate-100">
 <tr>
 <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-36 whitespace-nowrap">Loại / Mã phiếu</th>
 <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nội dung</th>
 <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-36 whitespace-nowrap">Người đề xuất</th>
 <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-36 whitespace-nowrap text-center">Trạng thái</th>
 <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-36 whitespace-nowrap text-right">Ngày gửi</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {filteredRequests.length > 0 ? filteredRequests.map(doc => (
 <tr key={doc.id} onClick={() => setSelectedRequestForView(doc)} className="hover:bg-slate-50 transition-colors group cursor-pointer">
 <td className="px-4 py-3">
 <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded inline-block mb-1">{doc.subtype}</span>
 <p className="text-[10px] text-slate-600 font-bold uppercase">{doc.id}</p>
 </td>
 <td className="px-4 py-3">
 <p className="text-[13px] font-medium text-slate-900">{doc.title}</p>
 </td>
 <td className="px-4 py-3">
 <p className="text-[13px] font-bold text-slate-800">{doc.requester}</p>
 </td>
 <td className="px-4 py-3 text-center">
 <div className="flex flex-col gap-1 items-center">
 <span className={cn(
 "px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-tight inline-flex items-center gap-1",
 doc.status === 'approved' ? "bg-emerald-50 text-emerald-600" : 
 doc.status === 'revoked' ? 'bg-slate-100 text-slate-500' : doc.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
 )}>
 {doc.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
 {doc.status === 'pending' && <Clock className="w-3 h-3" />}
 {doc.status === 'rejected' && <AlertCircle className="w-3 h-3" />}
  {doc.status === 'revoked' && <X className="w-3 h-3" />}
 {doc.status === 'approved' ? 'Đã duyệt' : doc.status === 'revoked' ? 'Đã thu hồi' : doc.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
 </span>
 {doc.status === 'approved' && (
 <span className={cn(
 "px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-tight inline-flex items-center gap-1",
 (doc as any).signatureStatus === 'signed' ? "bg-slate-100 text-primary-600" : "bg-slate-100 text-slate-700"
 )}>
 <FileSignature className="w-3 h-3" />
 {(doc as any).signatureStatus === 'signed' ? 'Đã ký số' : 'Chờ ký số'}
 </span>
 )}
 </div>
 </td>
 <td className="px-4 py-3 text-right">
 <div className="flex flex-col items-end gap-2">
 <p className="text-xs text-slate-700 font-mono">{doc.date}</p>
 {doc.status === 'pending' && (isAdmin || staffInfo?.role === 'director') && (
 <div className="flex gap-2 invisible group-hover:visible transition-all">
 <button 
 onClick={() => handleStatusChange(doc.id, 'approved')}
 className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded hover:bg-emerald-100 flex items-center gap-1"
 >
 <CheckCircle2 className="w-3 h-3" /> Duyệt
 </button>
 <button 
 onClick={() => setSigningRequestId(doc.id)}
 className="px-2 py-1 bg-slate-100 text-primary-600 text-[10px] font-bold rounded hover:bg-[#EAE7DF] flex items-center gap-1"
 >
 <FileSignature className="w-3 h-3" /> Ký & Duyệt
 </button>
 <button 
 onClick={() => handleStatusChange(doc.id, 'rejected')}
 className="px-2 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold rounded hover:bg-rose-100 flex items-center gap-1"
 >
 <X className="w-3 h-3" /> Từ chối
 </button>
 </div>
 )}
 <button 
 onClick={(e) => {
 e.stopPropagation(); setSelectedRequestForPrint(doc); setShowPrintModal(true);
 }}
 className="p-1 px-2 text-slate-500 hover:text-primary-600 transition-colors flex items-center gap-1 text-[10px] font-bold"
 >
 <Printer className="w-3.5 h-3.5" /> In phiếu
 </button>
 </div>
 </td>
 </tr>
 )) : (
 <tr>
 <td colSpan={5} className="px-6 py-20 text-center">
 <div className="flex flex-col items-center gap-4">
 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-500">
 <Inbox className="w-8 h-8" />
 </div>
 <div>
 <p className="text-lg font-bold text-slate-900">Không tìm thấy phiếu nào</p>
 <p className="text-xs text-slate-600">Hãy thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
 </div>
 <button 
 onClick={clearAllFilters}
 className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
 >
 Xóa tất cả bộ lọc
 </button>
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </>
 ) : (
 <div className="p-6 space-y-4">
 <div>
 <h3 className="text-lg font-bold text-slate-900 mb-2">Cài đặt Cấu trúc Phiếu (E-Form)</h3>
 <p className="text-xs text-slate-600 mb-4">Tạo và chỉnh sửa các loại phiếu đề xuất để sử dụng trong tổ chức.</p>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {formConfigs.map((item) => (
 <div key={item.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 relative group">
 <div className="flex justify-between items-start mb-2">
 <h4 className="font-bold text-slate-900">{item.name}</h4>
 <div className="flex gap-2 invisible group-hover:visible">
 <button onClick={() => { setEditingFormConfig(item); setShowConfigModal(true); }} className="text-emerald-600 hover:underline text-xs">Sửa</button>
 <button onClick={() => {
 if(window.confirm('Bạn có chắc muốn xóa loại phiếu này?')) {
 setFormConfigs(formConfigs.filter(f => f.id !== item.id));
 if (selectedConfigForWorkflow === item.id) {
 setSelectedConfigForWorkflow(formConfigs.find(f => f.id !== item.id)?.id || '');
 }
 }
 }} className="text-rose-600 hover:underline text-xs">Xóa</button>
 </div>
 </div>
 <p className="text-xs text-slate-600 mb-2">Nhóm: <span className="font-semibold text-slate-800">{item.category}</span></p>
 <p className="text-xs text-slate-600">Luồng duyệt: <span className="font-semibold text-primary-600">{item.workflow.length} cấp</span></p>
 </div>
 ))}
 <button onClick={() => {
 setTemplateAction('create_config');
 setShowTemplateGallery(true);
 }} className="border border-dashed border-slate-400 rounded-lg p-4 flex flex-col items-center justify-center text-slate-600 hover:text-emerald-600 hover:border-emerald-300 transition-colors bg-white">
 <Plus className="w-6 h-6 mb-2" />
 <span className="text-[13px] font-bold">Thêm loại phiếu mới</span>
 </button>
 </div>
 </div>

 {formConfigs.length > 0 && selectedConfigForWorkflow && (
 <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 shadow-sm">
 <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-300 pb-6">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-primary-600 text-white rounded-lg flex items-center justify-center shadow-sm shadow-indigo-200">
 <Layout className="w-6 h-6" />
 </div>
 <div>
 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Cấu hình luồng cho phiếu</label>
 <select 
 value={selectedConfigForWorkflow}
 onChange={(e) => setSelectedConfigForWorkflow(e.target.value)}
 className="text-lg font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer hover:text-primary-600 transition-colors"
 >
 {formConfigs.map(c => (
 <option key={c.id} value={c.id}>{c.name}</option>
 ))}
 </select>
 </div>
 </div>
 <button 
 onClick={() => {
 const updated = [...formConfigs];
 const cIdx = updated.findIndex(f => f.id === selectedConfigForWorkflow);
 if(cIdx > -1) {
 updated[cIdx].workflow.push({ id: Date.now(), ruleType: 'system', sla: '24h', specificUser: '' });
 setFormConfigs(updated);
 }
 }}
 className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 rounded-lg text-[13px] font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95"
 >
 <Plus className="w-4 h-4 text-emerald-600" /> Chèn bước duyệt mới
 </button>
 </div>

 <div className="space-y-6 relative">
 {/* Vertical line through steps */}
 <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-200" />

 {formConfigs.find(f => f.id === selectedConfigForWorkflow)?.workflow.map((step, idx, arr) => (
 <React.Fragment key={step.id}>
 <div className="flex items-start gap-6 relative z-10 group">
 <div className={cn(
 "w-12 h-12 rounded-lg font-bold flex items-center justify-center shrink-0 border-4 transition-all shadow-sm",
 idx === 0 ? "bg-emerald-600 border-white text-white shadow-emerald-100" : "bg-white border-slate-200 text-slate-500 group-hover:border-primary-100 group-hover:text-primary-600"
 )}>
 {idx + 1}
 </div>
 
 <div className="flex-1 bg-white border border-slate-300 p-5 rounded-lg shadow-sm group-hover:shadow-sm transition-all group-hover:border-primary-200">
 <div className="flex justify-between items-center mb-4">
 <div className="flex items-center gap-2">
 <h5 className="font-bold text-slate-900 text-sm uppercase tracking-tight">Bước {idx + 1}: {idx === 0 ? 'Phê duyệt cấp cơ sở' : 'Phê duyệt cấp cao'}</h5>
 {idx === 0 && <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-600 rounded uppercase">Bắt buộc</span>}
 </div>
 {idx > 0 && (
 <button onClick={() => {
 const updated = [...formConfigs];
 const cIdx = updated.findIndex(f => f.id === selectedConfigForWorkflow);
 updated[cIdx].workflow = updated[cIdx].workflow.filter(w => w.id !== step.id);
 setFormConfigs(updated);
 }} className="p-1 px-2 text-rose-500 hover:bg-rose-50 rounded text-[10px] font-bold flex items-center gap-1 transition-colors">
 <X className="w-3 h-3" /> Gỡ bỏ bước này
 </button>
 )}
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-1.5">
 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phương thức xác thực</label>
 <select 
 value={step.ruleType}
 onChange={(e) => {
 const updated = [...formConfigs];
 const cIdx = updated.findIndex(f => f.id === selectedConfigForWorkflow);
 const wIdx = updated[cIdx].workflow.findIndex(w => w.id === step.id);
 updated[cIdx].workflow[wIdx].ruleType = e.target.value;
 setFormConfigs(updated);
 }}
 className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-inner"
 >
 <option value="system">🏢 Trưởng bộ phận (System-Auto)</option>
 <option value="user_select">👤 Người dùng chọn thủ công</option>
 <option value="specific">🎯 Chỉ định thành viên cố định</option>
 </select>
 </div>

 <div className="space-y-1.5">
 {step.ruleType === 'specific' ? (
 <>
 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Thành viên phê duyệt</label>
 <select 
 value={step.specificUser}
 onChange={(e) => {
 const updated = [...formConfigs];
 const cIdx = updated.findIndex(f => f.id === selectedConfigForWorkflow);
 const wIdx = updated[cIdx].workflow.findIndex(w => w.id === step.id);
 updated[cIdx].workflow[wIdx].specificUser = e.target.value;
 setFormConfigs(updated);
 }}
 className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-primary-50/50 font-bold text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-inner border-primary-100"
 >
 <option value="">-- Chọn thành viên --</option>
 <option value="Giám đốc Nhân sự">Lê Thị Tuyết (HR Director)</option>
 <option value="Giám đốc Điều hành">Nguyễn Văn An (CEO)</option>
 <option value="Kế toán trưởng">Trần Thị Bích (CFO)</option>
 </select>
 </>
 ) : (
 <>
 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Thời hạn xác thực (SLA)</label>
 <select 
 value={step.sla}
 onChange={(e) => {
 const updated = [...formConfigs];
 const cIdx = updated.findIndex(f => f.id === selectedConfigForWorkflow);
 const wIdx = updated[cIdx].workflow.findIndex(w => w.id === step.id);
 updated[cIdx].workflow[wIdx].sla = e.target.value;
 setFormConfigs(updated);
 }}
 className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-inner"
 >
 <option value="24h">⏱️ Trong vòng 24h</option>
 <option value="48h">⏱️ Trong vòng 48h</option>
 <option value="unlimited">♾️ Không giới hạn thời gian</option>
 </select>
 </>
 )}
 </div>
 </div>
 </div>
 </div>
 </React.Fragment>
 ))}

 {/* Step Terminator */}
 <div className="flex items-center gap-6 relative z-10 px-2 opacity-50">
 <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center mx-2 text-slate-600">
 <CheckCircle2 className="w-4 h-4" />
 </div>
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phiếu được hoàn tất và lưu trữ vào WorkflowHub</p>
 </div>
 </div>

 <div className="mt-8 pt-6 border-t border-slate-300 flex justify-end">
 <button 
 onClick={() => alert('Đã lưu cấu hình luồng duyệt thành công!')}
 className="px-6 py-3 bg-primary-600 text-white rounded-lg text-[13px] font-bold shadow-sm shadow-indigo-100 hover:bg-primary-700 transition-all active:scale-95"
 >
 LƯU CẤU HÌNH LUỒNG DUYỆT
 </button>
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 </div>

 {showAddModal && (
 <Modal
   isOpen={true}
   onClose={() => setShowAddModal(false)}
   title="Tạo đề xuất mới"
   maxWidth="md"
   hideFooter
   noPadding
 >
 <div className="p-6 space-y-4">
 <div>
 <label className="block text-[13px] font-bold text-slate-800 mb-2">Loại đề xuất</label>
 <select 
 value={newRequest.subtype}
 onChange={(e) => setNewRequest({...newRequest, subtype: e.target.value, formData: {} })}
 className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
 >
 {Array.from(new Set(formConfigs.map(c => c.category))).map(cat => (
 <optgroup key={cat} label={cat}>
 {formConfigs.filter(c => c.category === cat).map(c => (
 <option key={c.id} value={c.name}>{c.name}</option>
 ))}
 </optgroup>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-[13px] font-bold text-slate-800 mb-2">Lý do / Nội dung chung</label>
 <textarea 
 value={newRequest.title}
 onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
 className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium min-h-[80px]"
 placeholder="Ví dụ: Nghỉ phép 2 ngày đi du lịch gia đình..."
 />
 </div>

 {/* Dynamic Fields */}
 <div className="pt-2 border-t border-slate-200 mt-2">
 <div className="grid grid-cols-2 gap-4">
 {formConfigs.find(c => c.name === newRequest.subtype)?.fields?.map(field => (
 <div key={field.id} className={cn(field.type === 'textarea' ? "col-span-2" : "")}>
 <label className="block text-xs font-bold text-slate-800 mb-1">
 {field.label} {field.required && <span className="text-red-500">*</span>}
 </label>
 {field.type === 'textarea' ? (
 <textarea 
 className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
 required={field.required}
 value={newRequest.formData[field.id] || ''}
 onChange={(e) => setNewRequest({...newRequest, formData: {...newRequest.formData, [field.id]: e.target.value}})}
 />
 ) : field.type === 'select' ? (
 <select
 className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
 required={field.required}
 value={newRequest.formData[field.id] || ''}
 onChange={(e) => setNewRequest({...newRequest, formData: {...newRequest.formData, [field.id]: e.target.value}})}
 >
 <option value="">-- Chọn --</option>
 {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
 </select>
 ) : (
 <input 
 type={field.type} 
 className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
 required={field.required}
 value={newRequest.formData[field.id] || ''}
 onChange={(e) => setNewRequest({...newRequest, formData: {...newRequest.formData, [field.id]: e.target.value}})}
 />
 )}
 </div>
 ))}
 </div>
 </div>
 </div>
  {/* Workflow Enhancements in Modal */}
  <div className="pt-6 border-t border-slate-200 mt-4">
  <h4 className="text-[13px] font-bold text-slate-900 mb-4 flex items-center gap-2">
  <UserPlus className="w-4 h-4 text-emerald-600" />
  Tùy chỉnh luồng xử lý
  </h4>
  <div className="space-y-4">
  <label className="flex items-center gap-3 p-3 bg-rose-50/50 border border-rose-100 rounded-lg cursor-pointer hover:bg-rose-50 transition-colors">
  <input 
  type="checkbox"
  checked={newRequest.isUrgent}
  onChange={(e) => setNewRequest({...newRequest, isUrgent: e.target.checked})}
  className="w-4 h-4 text-rose-600 rounded border-slate-400 focus:ring-rose-500"
  />
  <div className="flex gap-2 items-center">
  <AlertTriangle className="w-4 h-4 text-rose-500" />
  <div>
  <p className="text-[13px] font-bold text-rose-900">Yêu cầu xử lý khẩn cấp</p>
  <p className="text-xs text-rose-600/80">Bỏ qua SLA rườm rà, thông báo ưu tiên trực tiếp tới người phê duyệt.</p>
  </div>
  </div>
  </label>

  <div className="bg-slate-50 rounded-lg border border-slate-300 overflow-hidden">
  <div className="px-4 py-3 border-b border-slate-300 bg-white flex justify-between items-center">
  <p className="text-[13px] font-bold text-slate-800">Người phê duyệt từng bước</p>
  <button 
  type="button" 
  onClick={() => setNewRequest({...newRequest, customReviewers: [...(newRequest.customReviewers||[]), { step: (newRequest.customReviewers?.length || 0) + 1, reviewer: '' }]})}
  className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
  >
  <Plus className="w-3 h-3" /> Thêm bước
  </button>
  </div>
  <div className="p-4 space-y-3">
  {(newRequest.customReviewers || []).map((reviewer: any, index: number) => (
  <div key={index} className="flex items-center gap-3">
  <div className="w-16 shrink-0 text-xs font-bold text-slate-600 uppercase tracking-widest">
  Bước {reviewer.step}
  </div>
  <select 
  value={reviewer.reviewer}
  onChange={(e) => {
  const newRef = [...(newRequest.customReviewers||[])];
  newRef[index].reviewer = e.target.value;
  setNewRequest({...newRequest, customReviewers: newRef});
  }}
  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
  required
  >
  <option value="">-- Chọn người phê duyệt --</option>
  <option value="Quản lý trực tiếp">Quản lý trực tiếp</option>
  <option value="Giám đốc Nhân sự">Giám đốc Nhân sự</option>
  <option value="Kế toán trưởng">Kế toán trưởng</option>
  <option value="Giám đốc Điều hành">Giám đốc Điều hành (CEO)</option>
  <option value="Nguyễn Văn A (IT)">Nguyễn Văn A (IT)</option>
  </select>
  {(newRequest.customReviewers || []).length > 1 && (
  <button 
  type="button"
  onClick={() => {
  const newRef = [...(newRequest.customReviewers||[])];
  newRef.splice(index, 1);
  newRef.forEach((r, idx) => r.step = idx + 1);
  setNewRequest({...newRequest, customReviewers: newRef});
  }}
  className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
  >
  <Trash2 className="w-4 h-4" />
  </button>
  )}
  </div>
  ))}
  </div>
  </div>

  {signatureMethod === 'personal_image' && (
  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
   <div className="flex justify-between items-center text-xs">
    <span className="font-bold text-slate-700 flex items-center gap-1.5 font-sans">
     <PenTool className="w-4 h-4 text-primary-600 animate-pulse" /> Bàn vẽ chữ ký tay điện tử:
    </span>
    {drawnSignatureData && (
     <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded">
      Đã thiết lập chữ ký
     </span>
    )}
   </div>
   <div className="relative border border-slate-300 rounded-lg bg-white overflow-hidden h-40 shadow-inner">
    <canvas
     ref={canvasRef}
     width={600}
     height={160}
     className="w-full h-full cursor-crosshair rounded-lg block touch-none"
     onMouseDown={startCanvasDrawing}
     onMouseMove={drawCanvas}
     onMouseUp={stopCanvasDrawing}
     onMouseLeave={stopCanvasDrawing}
     onTouchStart={startCanvasDrawing}
     onTouchMove={drawCanvas}
     onTouchEnd={stopCanvasDrawing}
    />
    {isCanvasEmpty && !drawnSignatureData && (
     <div className="absolute inset-0 flex items-center justify-center p-4 text-center pointer-events-none select-none">
      <p className="text-[11px] text-slate-400 font-medium">Sử dụng chuột, bút cảm ứng hoặc ngón tay để vẽ chữ ký của bạn vào đây...</p>
     </div>
    )}
   </div>
   <div className="flex justify-between items-center gap-4">
    <button
     type="button"
     onClick={clearCanvasSignature}
     className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200"
    >
     <X className="w-3.5 h-3.5 text-slate-500" /> Xóa nét vẽ
    </button>
    <p className="text-[9px] text-slate-400 leading-snug font-medium text-right italic max-w-xs">Chữ ký tay sẽ được lưu tự động cục bộ và kết xuất trên văn bản trình in A4.</p>
   </div>
  </div>
  )}
  </div>
  </div>
 <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex gap-3 justify-end">
 <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-[13px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-sm">
 Hủy
 </button>
 <button 
 onClick={handleAddRequest}
 className="px-6 py-2.5 text-[13px] font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/30">
 Gửi đề xuất
 </button>
 </div>
 </Modal>
 )}
 {showConfigModal && editingFormConfig && <FormConfigModal initialConfig={editingFormConfig} onClose={() => setShowConfigModal(false)} onSave={(c) => { const exists = formConfigs.find(f => f.id === editingFormConfig.id); if (exists) { setFormConfigs(formConfigs.map((f: any) => f.id === editingFormConfig.id ? c : f)); } else { setFormConfigs([...formConfigs, c]); } setShowConfigModal(false); }} />} {/* Removed hidden old inline modal */}
 
  {/* Selected Request Detail Slide-over Panel */}
  <AnimatePresence>
  {selectedRequestForView && (
    <Modal
      isOpen={true}
      onClose={() => setSelectedRequestForView(null)}
      maxWidth="3xl"
      hideFooter
      noPadding
    >
        <div className="px-4 py-3 border-b border-emerald-100 bg-emerald-50/50 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Chi tiết Đề xuất</h3>
              <p className="text-xs text-emerald-700 font-medium">Phiếu: {selectedRequestForView.id} | {selectedRequestForView.subtype}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setSelectedRequestForPrint(selectedRequestForView);
                setShowPrintModal(true);
              }}
              className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1 font-bold text-xs"
            >
              <Printer className="w-4 h-4" /> In
            </button>
            <button onClick={() => setSelectedRequestForView(null)} className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 flex-1 space-y-8">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Người đề xuất</p>
              <p className="text-[13px] font-bold text-slate-900">{selectedRequestForView.requester}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Ngày gửi</p>
              <p className="text-[13px] font-bold text-slate-900">{selectedRequestForView.date}</p>
            </div>
            <div className="col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Tiêu đề / Lý do</p>
              <p className="text-[13px] font-bold text-slate-900">{selectedRequestForView.title}</p>
            </div>
          </div>

          {/* Form Data */}
          <div>
            <h4 className="text-[13px] font-bold text-slate-900 mb-3 border-b border-emerald-100 pb-2 text-emerald-800 flex items-center gap-2">
              <Layout className="w-4 h-4" /> Dữ liệu biểu mẫu
            </h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {formConfigs.find((c: any) => c.name === selectedRequestForView.subtype)?.fields?.map((field: any) => (
                <div key={field.id} className={field.type === 'textarea' ? "col-span-2" : ""}>
                  <p className="text-xs font-bold text-slate-500 border-b border-slate-200 pb-1 mb-1">{field.label}</p>
                  <p className="text-[13px] font-medium text-slate-900 mt-1">{(selectedRequestForView.formData || {})[field.id] || '---'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Thẩm định Pháp lý & Tuân thủ AI */}
          <div>
            <h4 className="text-[13px] font-bold text-slate-900 mb-3 border-b border-rose-100 pb-2 text-rose-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Scale className="w-4 h-4" /> Thẩm định Pháp chế & Tuân thủ AI
              </span>
              <span className="text-[10px] font-black uppercase text-rose-500 bg-rose-50 px-2 py-0.5 rounded tracking-wider leading-none">
                Luật Lao động & Kế toán VN
              </span>
            </h4>

            {legalAuditResult ? (
              <div className="bg-rose-50/50 border border-rose-100 rounded-lg p-5 space-y-4">
                <div className="prose prose-slate max-w-none text-xs leading-relaxed text-slate-700 whitespace-pre-line font-medium md:text-[13px]">
                  {legalAuditResult}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAiLegalAudit(selectedRequestForView)}
                    disabled={isAuditing}
                    className="px-3.5 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-50 text-rose-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isAuditing && "animate-spin")} /> Chạy lại kiểm tra
                  </button>
                  <button
                    onClick={() => setLegalAuditResult(null)}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-600 transition-all cursor-pointer"
                  >
                    Đóng kết quả
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#fafafa] border border-slate-200 rounded-lg p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg flex items-center justify-center mx-auto shadow-sm">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div className="max-w-md mx-auto">
                  <p className="text-[13px] font-bold text-slate-800">Quét rủi ro pháp lý bằng trí tuệ nhân tạo (Generative AI)</p>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium leading-normal">
                    Tự động rà soát nội dung phiếu so với Bộ luật Lao động 2019, Luật Kế toán 2015, định ngạch chi tiêu nội bộ, trần OT, và phát hiện lỗi trước khi quản cấp cao tiến hành "Ký số" phê duyệt.
                  </p>
                </div>
                <button
                  onClick={() => handleAiLegalAudit(selectedRequestForView)}
                  disabled={isAuditing}
                  className="px-5 py-2.5 bg-rose-950 text-rose-200 border border-rose-900 rounded-lg text-xs font-bold hover:bg-rose-900 hover:text-white transition-all flex items-center gap-2 mx-auto cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {isAuditing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Đang thẩm định điều khoản...
                    </>
                  ) : (
                    <>
                      <Scale className="w-4 h-4 text-rose-400" /> BẮT ĐẦU THẨM ĐỊNH TUÂN THỦ <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Chứng thư tài liệu / Security Sealed block */}
          {selectedRequestForView.signatureStatus === 'signed' && (
            <div className="space-y-3">
              {/* Integrity status alert banners */}
              {verificationLoading ? (
                <div className="bg-slate-100 border border-slate-300 text-slate-700 px-4 py-3 rounded-lg flex items-center gap-2 text-xs font-bold animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  Đang xác thực tính toàn vẹn chữ ký số...
                </div>
              ) : verificationStatus === 'verified' ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center gap-2 text-xs font-bold shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" />
                  Chữ ký số hợp lệ: Nội dung văn bản nguyên vẹn (Verified).
                </div>
              ) : verificationStatus === 'tampered' ? (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg flex items-center gap-2 text-xs font-bold shadow-sm border-l-4 border-l-rose-600 animate-bounce">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  CẢNH BÁO LỖI TOÀN VẸN: Dữ liệu đã bị thay đổi trái phép sau khi ký số!
                </div>
              ) : null}

              <div className="bg-slate-900 text-white rounded-lg p-5 border border-slate-950 shadow-sm space-y-4">
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-emerald-950 text-emerald-400 border border-emerald-900/50 rounded-lg">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-sans leading-none">Chứng Thư Niêm Phong Điện Tử</h4>
                      <span className="text-[9px] text-slate-400 font-medium">Xác thực mã hóa qua {selectedRequestForView.caProvider || 'CA'}</span>
                    </div>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded border",
                    verificationStatus === 'verified' 
                      ? "bg-emerald-950 text-emerald-400 border-emerald-900/40" 
                      : "bg-rose-950 text-rose-400 border-rose-900/40"
                  )}>
                    {verificationStatus === 'verified' ? 'SECURE INTEGRITY' : 'TAMPERED ALERT'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[11px] leading-tight font-medium pb-2">
                  <div>
                    <p className="text-slate-400 mb-0.5">Xác thực chứng thư:</p>
                    <p className="font-bold text-slate-100">{selectedRequestForView.signedBy || 'Quản trị viên'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-0.5">Thời gian ký số:</p>
                    <p className="font-bold text-slate-100">{selectedRequestForView.signedAt || '---'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-400 mb-0.5">Mã định danh bảo mật SHA-256 Seal:</p>
                    <p className="font-bold text-slate-100 text-[10px] font-mono tracking-tight bg-slate-950 p-2 rounded-lg border border-slate-800 truncate">
                      {selectedRequestForView.secureHash || 'AES-SHA256-D93B8C1D0F1C3E4'}
                    </p>
                  </div>
                </div>
                
                {selectedRequestForView.signatureDraw && (
                  <div className="border-t border-slate-800 pt-3">
                    <p className="text-[10px] text-slate-400 mb-1.5 uppercase font-bold tracking-wider">Bản quét Chữ ký tay điện tử:</p>
                    <div className="bg-white p-2 rounded-lg flex items-center justify-center max-w-[200px] border border-slate-700">
                      <img src={selectedRequestForView.signatureDraw} alt="Chữ ký tay điện tử" className="max-h-16 object-contain" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Approval Workflow */}
          <div>
            <h4 className="text-[13px] font-bold text-slate-900 mb-4 border-b border-indigo-100 pb-2 text-indigo-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Luồng Phê duyệt
            </h4>
            <div className="relative pl-4 space-y-6">
              <div className="absolute left-[7px] top-4 bottom-4 w-px bg-slate-200" />
              {(selectedRequestForView.approvalLog || []).map((log: any, idx: number) => (
                <div key={idx} className="relative z-10 flex gap-4">
                  <div className={cn(
                    "w-[14px] h-[14px] rounded-full shrink-0 border-2 mt-1 bg-white",
                    log.status === 'approved' ? "border-emerald-500" : "border-rose-500"
                  )} />
                  <div className="flex-1 bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-bold text-slate-800">{log.stepName}</p>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded",
                        log.status === 'approved' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      )}>{log.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}</span>
                    </div>
                    <p className="text-[13px] font-medium text-slate-900">{log.by}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{log.time}</p>
                  </div>
                </div>
              ))}
              
              {formConfigs.find((c: any) => c.name === selectedRequestForView.subtype)?.workflow?.slice((selectedRequestForView.approvalLog || []).length).map((_: any, idx: number) => (
                <div key={'w-'+idx} className="relative z-10 flex gap-4 opacity-50">
                  <div className="w-[14px] h-[14px] rounded-full shrink-0 border-2 border-slate-300 bg-slate-100 mt-1" />
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-xs font-bold text-slate-600 mb-1">Cấp duyệt {(selectedRequestForView.approvalLog || []).length + idx + 1}</p>
                    <p className="text-[10px] font-bold text-amber-600">Đang chờ xử lý...</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Action Area based on Rules */}
          <div className="pt-6 border-t border-slate-200">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Thao tác</h4>
            <div className="flex flex-wrap gap-3">
              {/* Creator Revoke */}
              {(selectedRequestForView.status === 'pending') && (!selectedRequestForView.approvalLog || selectedRequestForView.approvalLog.length === 0) && (
                <button 
                  onClick={() => handleRevokeRequest(selectedRequestForView.id)}
                  className="px-4 py-2 border border-rose-300 text-rose-600 rounded-lg text-[13px] font-bold hover:bg-rose-50 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" /> Thu hồi đề xuất
                </button>
              )}

              {/* Delete Request */}
              {(selectedRequestForView.status === 'revoked' || selectedRequestForView.status === 'rejected') && (
                <button 
                  onClick={() => handleDeleteRequest(selectedRequestForView.id)}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg text-[13px] font-bold hover:bg-rose-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Xóa vĩnh viễn
                </button>
              )}
              
              {/* Approver Action */}
              {selectedRequestForView.status === 'pending' && (
                <>
                  <button 
                    onClick={() => {
                      handleStatusChange(selectedRequestForView.id, 'approved');
                      const updatedReq = { ...selectedRequestForView, status: 'approved' };
                      setSelectedRequestForView(updatedReq);
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[13px] font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Phê duyệt
                  </button>
                  <button 
                    onClick={() => setSigningRequestId(selectedRequestForView.id)}
                    className="px-4 py-2 border border-blue-600 text-primary-600 rounded-lg text-[13px] font-bold hover:bg-primary-50 transition-colors flex items-center gap-2"
                  >
                    <FileSignature className="w-4 h-4" /> Ký & Duyệt
                  </button>
                  <button 
                    onClick={() => {
                      handleStatusChange(selectedRequestForView.id, 'rejected');
                      setSelectedRequestForView({ ...selectedRequestForView, status: 'rejected' });
                    }}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg text-[13px] font-bold hover:bg-slate-900 transition-colors flex items-center gap-2"
                  >
                    Từ chối
                  </button>
                </>
              )}

              {/* Change Approval */}
              {(selectedRequestForView.status === 'approved' || selectedRequestForView.status === 'rejected') && (
                 <button 
                    onClick={() => {
                      if(window.confirm('Bạn muốn lùi trạng thái về chờ duyệt?')) {
                        handleStatusChange(selectedRequestForView.id, 'pending');
                        setSelectedRequestForView({ ...selectedRequestForView, status: 'pending' });
                      }
                    }}
                    className="px-4 py-2 border border-amber-500 text-amber-600 rounded-lg text-[13px] font-bold hover:bg-amber-50 transition-colors flex items-center gap-2"
                 >
                   <RefreshCw className="w-4 h-4" /> Reset trạng thái
                 </button>
              )}

              {selectedRequestForView.status === 'approved' && (
                syncedMisaRequests[selectedRequestForView.id] ? (
                  <span className="px-4 py-2 bg-emerald-50 text-emerald-700 text-[13px] font-bold border border-emerald-200 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Đã ghi sổ Chi phí 🟢
                  </span>
                ) : (
                  <button
                    onClick={() => handleSyncRequestToMisa(selectedRequestForView)}
                    disabled={syncingMisaId === selectedRequestForView.id}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-[13px] font-bold flex items-center gap-2 disabled:opacity-50"
                  >
                    {syncingMisaId === selectedRequestForView.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Calculator className="w-4 h-4" />
                    )}
                    Ghi sổ Chi phí
                  </button>
                )
              )}

            </div>
          </div>

        </div>
  </Modal>
  )}
  </AnimatePresence>

  {/* Digital Signature Modal */}
 <AnimatePresence>
 {signingRequestId && (
 <Modal
   isOpen={true}
   onClose={() => setSigningRequestId(null)}
   maxWidth="2xl"
   hideFooter
   noPadding
 >
 <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-primary-600 text-white rounded-lg flex items-center justify-center">
 <FileSignature className="w-5 h-5" />
 </div>
 <div>
 <h3 className="font-bold text-lg text-slate-900">Xác thực Chữ ký số</h3>
 <p className="text-xs text-slate-600 font-medium">Bảo mật bởi chuẩn mã hóa AES-256</p>
 </div>
 </div>
 <button onClick={() => setSigningRequestId(null)} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-300">
 <X className="w-5 h-5 text-slate-500" />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto p-6 space-y-4">
 {/* Document Preview */}
 <div className="bg-slate-50 rounded-lg p-6 border border-slate-300 space-y-4">
 <div className="flex justify-between items-center border-b border-slate-300 pb-4">
 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tài liệu phê duyệt</span>
 <span className="px-2 py-0.5 bg-[#EAE7DF] text-primary-600 text-[10px] font-bold rounded">Hash: 8A2F...3B9C</span>
 </div>
 <div className="space-y-3">
 <h4 className="text-xl font-bold text-slate-900">{requests.find(r => r.id === signingRequestId)?.title}</h4>
 <div className="grid grid-cols-2 gap-4 text-xs">
 <div>
 <p className="text-slate-500 mb-1">Loại chứng từ:</p>
 <p className="font-bold text-slate-800">{requests.find(r => r.id === signingRequestId)?.subtype}</p>
 </div>
 <div>
 <p className="text-slate-500 mb-1">Người đề xuất:</p>
 <p className="font-bold text-slate-800">{requests.find(r => r.id === signingRequestId)?.requester}</p>
 </div>
 </div>
 </div>
 </div>

 {/* CA Selection */}
 <div className="space-y-4">
 <label className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
 <ShieldCheck className="w-4 h-4 text-primary-600" /> Chọn Nhà cung cấp Chứng thực (CA)
 </label>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 {[
 { id: 'company_ca', label: 'CA Công ty', desc: 'Chữ ký CA Doanh nghiệp', color: 'blue' },
 { id: 'personal_ca', label: 'CA Cá nhân', desc: 'Chứng thư của NCC', color: 'emerald' },
 { id: 'personal_image', label: 'Chữ ký ảnh', desc: 'Văn bản nội bộ', color: 'slate' }
 ].map((ca) => (
 <div 
 key={ca.id}
 onClick={() => setSignatureMethod(ca.id as any)}
 className={cn(
 "p-4 rounded-lg border-2 cursor-pointer transition-all flex flex-col gap-2",
 signatureMethod === ca.id ? "bg-slate-100 border-slate-900 ring-2 ring-blue-100" : "bg-white border-slate-200 hover:border-slate-400"
 )}
 >
 <div className="flex justify-between items-center">
 <h5 className="font-bold text-xs text-slate-900">{ca.label}</h5>
 <div className={cn("w-3 h-3 rounded-full border-2", signatureMethod === ca.id ? "bg-slate-900 border-slate-900" : "bg-white border-slate-400")} />
 </div>
 <p className="text-[10px] text-slate-600 font-medium">{ca.desc}</p>
 </div>
 ))}
 </div>
 </div>

 <div className="bg-amber-50 rounded-lg p-4 border border-amber-100 flex items-start gap-4">
 <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
 <Clock className="w-4 h-4" />
 </div>
 <p className="text-[10px] text-amber-700 leading-relaxed font-medium">Hệ thống sẽ chuyển hướng hoặc gửi thông báo (OTP/Push Notification) về thiết bị đã đăng ký với {signatureMethod.replace('_', ' ').toUpperCase()}. Vui lòng không đóng trang này.</p>
 </div>
 </div>

 <div className="p-6 border-t border-slate-200 bg-slate-50/50 flex gap-4 mt-auto">
 <button 
 onClick={() => setSigningRequestId(null)}
 disabled={isSigningInProcess}
 className="flex-1 py-4 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
 >
 Hủy bỏ
 </button>
 <button 
 onClick={executeSignature}
 disabled={isSigningInProcess}
 className="flex-[2] py-4 bg-primary-600 text-white rounded-lg font-bold text-sm shadow-sm shadow-blue-100 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
 >
 {isSigningInProcess ? (
 <>
 <RefreshCw className="w-5 h-5 animate-spin" /> Đang kết nối CA...
 </>
 ) : (
 <>
 XÁC NHẬN KÝ SỐ <Zap className="w-5 h-5" />
 </>
 )}
 </button>
 </div>
 </Modal>
 )}
 </AnimatePresence>
 {/* Print PDF / A4 Modal */}
 <AnimatePresence>
 {showPrintModal && selectedRequestForPrint && (
 <Modal
   isOpen={true}
   onClose={() => setShowPrintModal(false)}
   maxWidth="full"
   hideFooter
   noPadding
 >
 <div className="bg-white rounded-none shadow-sm w-[210mm] min-h-[297mm] mx-auto p-[20mm] relative overflow-y-auto" id="a4-print-document">
 {/* Print Control Overlay (Visible only on UI, hidden in Print) */}
 <div className="absolute top-4 -right-16 flex flex-col gap-2 print:hidden">
 <button 
 onClick={() => {
   setSigningRequestId(selectedRequestForPrint.id);
   setShowPrintModal(false);
 }}
 className="p-3 bg-amber-600 text-white rounded-full shadow-sm hover:scale-105 active:translate-y-0.5 transition-all cursor-pointer"
 title="Gửi ký số"
 >
 <FileSignature className="w-5 h-5" />
 </button>

 <button 
 onClick={() => {
   setRoutingRequest(selectedRequestForPrint);
   setShowRouteModal(true);
 }}
 className="p-3 bg-emerald-600 text-white rounded-full shadow-sm hover:scale-105 active:translate-y-0.5 transition-all cursor-pointer"
 title="Luân chuyển văn bản"
 >
 <ArrowRightLeft className="w-5 h-5" />
 </button>
 <button 
 onClick={() => window.print()}
 className="p-3 bg-primary-600 text-white rounded-full shadow-sm  transition-transform"
 title="In ngay"
 >
 <Printer className="w-5 h-5" />
 </button>
 <button 
 onClick={() => setShowPrintModal(false)}
 className="p-3 bg-white text-slate-700 rounded-full shadow-sm border border-slate-300  transition-transform"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* A4 Content */}
 <div className="flex flex-col h-full border-[3px] border-slate-900 p-6">
 <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
 <div className="flex items-center gap-4">
 <div className="w-16 h-16 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-2xl tracking-tighter">OS</div>
 <div>
 <h2 className="text-xl font-bold uppercase tracking-tighter">Omni-System Enterprise</h2>
 <p className="text-[10px] font-bold text-slate-600 italic">Hệ thống Quản trị Doanh nghiệp Toàn diện</p>
 <p className="text-[10px] text-slate-500">Số 102, Tòa nhà TechHub, Quận 1, TP. HCM</p>
 </div>
 </div>
 <div className="text-right">
 <h1 className="font-sans tracking-tight text-xl font-bold uppercase tracking-tight text-slate-900 underline underline-offset-8">PHIẾU ĐỀ XUẤT</h1>
 <p className="text-xs font-bold text-slate-800 mt-4 italic">Số: {selectedRequestForPrint.id}</p>
 <p className="text-xs font-bold text-slate-800">Ngày tạo: {selectedRequestForPrint.date}</p>
 </div>
 </div>

 <div className="flex-1 space-y-4">
 <div className="bg-slate-50 p-6 rounded-none border border-slate-300">
 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
 <FileText className="w-4 h-4" /> THÔNG TIN ĐỀ XUẤT
 </h3>
 <div className="grid grid-cols-2 gap-y-4 gap-x-8">
 <div className="border-b border-slate-300 pb-1">
 <p className="text-[10px] font-bold text-slate-600 uppercase">Người đề xuất</p>
 <p className="text-[13px] font-bold text-slate-900">{selectedRequestForPrint.requester}</p>
 </div>
 <div className="border-b border-slate-300 pb-1">
 <p className="text-[10px] font-bold text-slate-600 uppercase">Loại phiếu</p>
 <p className="text-[13px] font-bold text-slate-900">{selectedRequestForPrint.subtype}</p>
 </div>
 <div className="col-span-2 border-b border-slate-300 pb-1">
 <p className="text-[10px] font-bold text-slate-600 uppercase">Nội dung / Lý do</p>
 <p className="text-[13px] font-bold text-slate-900">{selectedRequestForPrint.title}</p>
 </div>
 </div>
 </div>

 <div className="space-y-4 overflow-x-auto min-w-0">
 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 px-2">
 <Layout className="w-4 h-4" /> DỮ LIỆU CHI TIẾT
 </h3>
 <table className="w-full border-2 border-slate-900 whitespace-nowrap">
 <thead>
 <tr className="bg-primary-600 text-white">
 <th className="px-4 py-2 text-[10px] font-bold uppercase text-left border-r border-white/20">Trường thông tin</th>
 <th className="px-4 py-2 text-[10px] font-bold uppercase text-left">Giá trị</th>
 </tr>
 </thead>
 <tbody>
 {formConfigs.find(c => c.name === selectedRequestForPrint.subtype)?.fields.map((field: any) => (
 <tr key={field.id} className="border-b border-slate-900">
 <td className="px-4 py-3 text-xs font-bold text-slate-800 border-r border-slate-900 bg-slate-50">{field.label}</td>
 <td className="px-4 py-3 text-xs font-bold text-slate-900">
 {(selectedRequestForPrint as any).formData?.[field.id] || '---'}
 </td>
 </tr>
 ))}
 {!formConfigs.find(c => c.name === selectedRequestForPrint.subtype)?.fields.length && (
 <tr>
 <td colSpan={2} className="px-4 py-6 text-center text-xs text-slate-500 italic">Không có dữ liệu chi tiết kèm theo.</td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 border-t-2 border-slate-900 pt-8 px-4">
 <div className="flex flex-col items-center gap-3">
 <p className="text-[10px] font-bold text-slate-900 uppercase">NGƯỜI ĐỀ XUẤT</p>
 <div className="h-24 w-full flex items-center justify-center italic text-slate-500 text-[10px] border border-dashed border-slate-400 bg-slate-50/50 p-2 text-center">
 (Ký hồ sơ điện tử, <br/>ghi rõ họ tên)
 </div>
 <p className="text-[10px] font-bold text-slate-900">{selectedRequestForPrint.requester}</p>
 <p className="text-[8px] text-slate-500 font-mono">{selectedRequestForPrint.date}</p>
 </div>
 
 {/* Dynamic Approval Logs for N levels */}
 {(selectedRequestForPrint.approvalLog || []).map((log: any, lIdx: number) => (
 <div key={lIdx} className="flex flex-col items-center gap-3">
 <p className="text-[10px] font-bold text-slate-900 uppercase text-center">{log.stepName.toUpperCase()}</p>
 <div className="h-24 w-full flex flex-col items-center justify-center relative border border-slate-400 bg-slate-50/30 p-2">
 <div className="text-center">
 <div className={cn(
 "font-mono text-[9px] border-2 p-1 rotate-[-5deg] tracking-tight font-bold uppercase mb-1 px-2 whitespace-nowrap",
 log.status === 'approved' ? "text-emerald-700 border-emerald-700" : "text-rose-700 border-rose-700"
 )}>
 {log.status === 'approved' ? '✓ ĐÃ DUYỆT' : '✗ TỪ CHỐI'}
 </div>
 <p className="text-[8px] font-bold text-slate-800">{log.by}</p>
 <p className="text-[7px] text-slate-600 font-mono italic">{log.time}</p>
 </div>
 </div>
 </div>
 ))}

 {/* Waiting Steps */}
 {formConfigs.find(c => c.name === selectedRequestForPrint.subtype)?.workflow.slice((selectedRequestForPrint.approvalLog || []).length).map((_: any, sIdx: number) => (
 <div key={`wait-${sIdx}`} className="flex flex-col items-center gap-3 opacity-40">
 <p className="text-[10px] font-bold text-slate-500 uppercase text-center">Xác thực cấp {(selectedRequestForPrint.approvalLog || []).length + sIdx + 1}</p>
 <div className="h-24 w-full flex items-center justify-center relative border border-dashed border-slate-300 bg-slate-100">
 <span className="text-[8px] font-bold text-slate-500 italic">Đang chờ xử lý...</span>
 </div>
 </div>
 ))}
 
 {/* Digital Signature Slot */}
 <div className="flex flex-col items-center gap-3">
 <p className="text-[10px] font-bold text-slate-900 uppercase">NIÊM PHONG SỐ (CA)</p>
 <div className="h-24 w-full flex items-center justify-center relative border-2 border-slate-900 bg-slate-50/10">
 {selectedRequestForPrint.signatureStatus === 'signed' ? (
  selectedRequestForPrint.signatureDraw ? (
    <div className="relative flex flex-col items-center h-full justify-between p-1 text-center font-sans">
      <img 
        src={selectedRequestForPrint.signatureDraw} 
        alt="Chữ ký tay điện tử" 
        className="max-h-14 object-contain max-w-[95%] mx-auto mt-0.5" 
        referrerPolicy="no-referrer" 
      />
      <div className="text-[6.5px] text-slate-500 leading-none font-mono">
        Ký bởi: {selectedRequestForPrint.signedBy}<br/>
        {selectedRequestForPrint.signedAt}
      </div>
    </div>
  ) : selectedRequestForPrint.caProvider === 'PERSONAL IMAGE' ? (
    <div className="relative flex flex-col items-center gap-1 p-2 text-center">
      <div className="text-blue-800 text-xl opacity-80 -rotate-3 mb-1" style={{ fontFamily: 'cursive' }}>
        {selectedRequestForPrint.signedBy}
      </div>
      <p className="text-[7px] text-slate-500 font-mono font-bold">{selectedRequestForPrint.signedAt}</p>
    </div>
  ) : (
    <div className="relative flex flex-col items-center gap-1 p-2 text-center scale-90">
      <div className="text-orange-800 font-bold text-[8px] uppercase tracking-tighter border-2 border-blue-700 px-2 py-1 bg-slate-100/50">
        CERTIFICATE: {selectedRequestForPrint.caProvider}<br/>
        <span className="text-[10px] uppercase">{selectedRequestForPrint.signedBy}</span>
      </div>
      <p className="text-[7px] text-primary-600 font-mono font-bold">{selectedRequestForPrint.signedAt}</p>
    </div>
  )
 ) : (
 <div className="text-slate-400 italic text-[9px] text-center px-4 leading-tight">
 (Chờ ký số niêm phong điện tử)
 </div>
 )}
 </div>
 </div>
 </div>
 </div>

 <div className="mt-20 pt-8 border-t border-slate-300 flex justify-between items-center gap-8 text-left font-sans">
  <div className="flex items-center gap-4">
   <div className="w-12 h-12 bg-white border border-slate-300 p-1 shrink-0 flex items-center justify-center">
    <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 animate-pulse" fill="currentColor">
     <rect x="0" y="0" width="30" height="30" />
     <rect x="5" y="5" width="20" height="20" fill="white" />
     <rect x="10" y="10" width="10" height="10" />

     <rect x="70" y="0" width="30" height="30" />
     <rect x="75" y="5" width="20" height="20" fill="white" />
     <rect x="80" y="10" width="10" height="10" />

     <rect x="0" y="70" width="30" height="30" />
     <rect x="5" y="75" width="20" height="20" fill="white" />
     <rect x="10" y="80" width="10" height="10" />
     
     <rect x="35" y="5" width="8" height="8" />
     <rect x="48" y="12" width="12" height="6" />
     <rect x="35" y="20" width="10" height="10" />
     <rect x="55" y="25" width="8" height="8" />
     
     <rect x="5" y="35" width="14" height="6" />
     <rect x="24" y="42" width="12" height="12" />
     
     <rect x="42" y="42" width="16" height="16" />
     <rect x="75" y="42" width="10" height="10" />
     
     <rect x="35" y="70" width="14" height="8" />
     <rect x="55" y="75" width="8" height="12" />
     <rect x="70" y="75" width="12" height="8" />
     <rect x="88" y="88" width="12" height="12" />
    </svg>
   </div>
   <div className="space-y-1">
    <p className="text-[9px] font-bold text-slate-900 uppercase">Xác thực chứng từ điện tử (VComm E-Verify Portal)</p>
    <p className="text-[8px] text-slate-500 leading-normal max-w-sm">
      Quét mã QR để đối soát nguyên trạng nội dung gốc và lịch sử lưu vết thay đổi của chứng từ lưu mã hóa trên mạng lưới của Omni-System ERP v2.0.
    </p>
   </div>
  </div>
  <div className="text-right space-y-1 shrink-0">
   <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Hệ thống Trình ký & Ký số VComm Legal v2.0</p>
   <p className="text-[7px] text-slate-400 font-mono mt-0.5">
    Secure Hash: {selectedRequestForPrint.secureHash || 'AES-PENDING-UNSEALED'}<br />
    Xác minh UTC: {new Date().toLocaleString('vi-VN')}
   </p>
  </div>
 </div>
 </div>
 </div>
 </Modal>
 )}
 </AnimatePresence>

 {/* Routing / Luân chuyển văn bản modal */}
 <AnimatePresence>
 {showRouteModal && routingRequest && (
  <Modal
    isOpen={true}
    onClose={() => setShowRouteModal(false)}
    maxWidth="lg"
    hideFooter
    noPadding
  >
     {/* Header */}
     <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between">
       <div className="flex items-center gap-3">
         <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-900/50">
           <ArrowRightLeft className="w-5 h-5 animate-pulse" />
         </div>
         <div>
           <h3 className="font-bold text-sm uppercase tracking-wider font-sans text-slate-100 flex items-center gap-1.5">
             Luân chuyển văn bản điện tử
           </h3>
           <p className="text-[10px] text-slate-400 font-medium">Bàn giao hồ sơ số và phân luồng tiếp nhận quy trình tự động.</p>
         </div>
       </div>
       <button 
         type="button"
         onClick={() => setShowRouteModal(false)}
         className="text-slate-400 hover:text-white transition-colors cursor-pointer"
       >
         <X className="w-5 h-5" />
       </button>
     </div>

     {/* Info Strip */}
     <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 text-xs flex justify-between items-center text-slate-600 font-medium">
       <span>Phiếu: <strong className="text-slate-900 font-bold">{routingRequest.id}</strong> ({routingRequest.subtype})</span>
       <span>Người gửi: <strong className="text-slate-900 font-bold">{routingRequest.requester}</strong></span>
     </div>

     {/* Content */}
     <div className="p-6 space-y-4">
       <div className="space-y-2">
         <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Chọn Bộ phận / Phòng ban tiếp nhận:</label>
         <div className="grid grid-cols-2 gap-3">
           {[
             { id: 'accounting', name: 'Phòng Kế toán & Tài chính', desc: 'Quyết toán, đối soát tạm ứng', color: 'blue' },
             { id: 'hr', name: 'Phòng Nhân sự & Đào tạo', desc: 'Phê duyệt nghỉ phép, tuyển dụng', color: 'purple' },
             { id: 'ceo', name: 'Văn phòng Ban Giám đốc', desc: 'Duyệt tối cao & đầu tư lớn', color: 'rose' },
             { id: 'ops', name: 'Phòng Vận hành & Kho vận', desc: 'Logistics, iPOS, siêu thị VComm', color: 'emerald' },
           ].map((dept) => (
             <div 
               key={dept.id}
               onClick={() => setRoutingDepartment(dept.id)}
               className={cn(
                 "p-3 rounded-lg border cursor-pointer transition-all flex flex-col gap-1.5",
                 routingDepartment === dept.id 
                   ? "bg-slate-50 border-slate-950 ring-2 ring-slate-100" 
                   : "bg-white border-slate-200 hover:border-slate-300"
               )}
             >
               <div className="flex justify-between items-center">
                 <span className="font-bold text-xs text-slate-900">{dept.name}</span>
                 <div className={cn("w-3 h-3 rounded-full border-2", routingDepartment === dept.id ? "bg-slate-900 border-slate-900" : "bg-white border-slate-300")} />
               </div>
               <span className="text-[10px] text-slate-500 leading-tight font-medium ml-0.5">{dept.desc}</span>
             </div>
           ))}
         </div>
       </div>

       {/* Recipient name */}
       <div className="space-y-1">
         <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Chỉ định đích danh người xử lý (Tùy chọn):</label>
         <input 
           type="text"
           placeholder="Ví dụ: Nguyễn Văn A (Trưởng phòng), hoặc bỏ trống để tự động nhận..."
           value={routingRecipient}
           onChange={(e) => setRoutingRecipient(e.target.value)}
           className="w-full bg-[#fafafa] text-slate-900 text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:border-slate-900 focus:outline-none placeholder-slate-400 font-medium"
         />
       </div>

       {/* Ghi chú / Đi kèm */}
       <div className="space-y-1">
         <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Ý kiến luân chuyển / Hướng dẫn xử lý:</label>
         <textarea
           rows={3}
           placeholder="Nhập hướng dẫn xử lý hồ sơ..."
           value={routingNote}
           onChange={(e) => setRoutingNote(e.target.value)}
           className="w-full bg-[#fafafa] text-slate-900 text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:border-slate-900 focus:outline-none placeholder-slate-400 font-medium resize-none text-slate-800"
         />
       </div>
     </div>

     {/* Footer */}
     <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
       <button 
         type="button"
         onClick={() => setShowRouteModal(false)}
         className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
       >
         Hủy bỏ
       </button>
       <button 
         type="button"
         onClick={executeRouting}
         className="flex-1 py-3 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm shadow-emerald-100 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
       >
         Xác nhận Luân chuyển <Send className="w-4 h-4" />
       </button>
     </div>
  </Modal>
  )}
  </AnimatePresence>

  {showTemplateGallery && (
 <TemplateGalleryModal
   onClose={() => setShowTemplateGallery(false)}
   onSelectTemplate={(template) => {
   setShowTemplateGallery(false);
   if (templateAction === 'create_config') {
     const nextId = `F${(formConfigs.length + 1).toString().padStart(2, '0')}`;
     setEditingFormConfig({ id: nextId, name: template.title, category: template.category, isActive: true, workflow: [], fields: [], templateRef: template.id });
     setShowConfigModal(true);
   } else {
     setNewRequest({ subtype: template.title, title: '', requester: 'Tôi (Người đang đăng nhập)', formData: {} });
     setShowAddModal(true);
   }
   }}
   onCreateNew={() => {
   setShowTemplateGallery(false);
   if (templateAction === 'create_config') {
     const nextId = `F${(formConfigs.length + 1).toString().padStart(2, '0')}`;
     setEditingFormConfig({ id: nextId, name: 'Loại phiếu mới', category: 'Khác', isActive: true, workflow: [], fields: [] });
     setShowConfigModal(true);
   } else {
     setNewRequest({ subtype: formConfigs[0]?.name || 'Loại phiếu mới', title: '', requester: 'Tôi (Người đang đăng nhập)', formData: {} });
     setShowAddModal(true);
   }
   }}
 />
 )}
 </div>
 );
}
