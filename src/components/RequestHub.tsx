import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Send, Inbox, Settings, Search, Plus, RefreshCw, Clock,
  CheckCircle2, AlertCircle, FileSignature, DollarSign, Coffee, Briefcase,
  UserPlus, PenTool, X, FileEdit, ShieldCheck, Zap, Printer, ChevronRight,
  Layout, AlertTriangle, Trash2, Eye, Building2, UserCheck, Image, Key,
  ChevronDown, Download, Stamp, PenLine, Fingerprint, BadgeCheck, SlidersHorizontal,
  LayoutTemplate, Pencil, Save, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { TemplateGalleryModal } from './TemplateGalleryModal';
import { FormConfigModal } from './FormConfigModal';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';

// ── Signature Types ──────────────────────────────────────────────
export type SigType = 'company_ca' | 'personal_ca' | 'personal_image';

export const SIG_TYPE_META: Record<SigType, { label: string; short: string; desc: string; icon: any; color: string; badge: string }> = {
  company_ca: {
    label: 'Chữ ký số Công ty',
    short: 'CA Doanh nghiệp',
    desc: 'Dùng chứng thư số của Công ty (VNPT/Viettel CA). Có giá trị pháp lý cao nhất, dùng cho hợp đồng và văn bản đối ngoại.',
    icon: Building2,
    color: 'bg-blue-50 border-blue-300 text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
  },
  personal_ca: {
    label: 'Chữ ký số Cá nhân (CA)',
    short: 'CA Cá nhân – Danh nghĩa công ty',
    desc: 'Dùng chứng thư cá nhân từ nhà cung cấp (SmartCA/Viettel) nhân danh Công ty. Phù hợp cho phê duyệt nội bộ và hợp đồng mua bán.',
    icon: UserCheck,
    color: 'bg-emerald-50 border-emerald-300 text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  personal_image: {
    label: 'Chữ ký hình ảnh',
    short: 'Hình ảnh – Văn bản nội bộ',
    desc: 'Dùng hình ảnh chữ ký tay số hóa. Chỉ dùng cho văn bản nội bộ, không có giá trị pháp lý bên ngoài.',
    icon: PenLine,
    color: 'bg-amber-50 border-amber-300 text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
  },
};

// ── Print Template ───────────────────────────────────────────────
interface SignatureZone {
  id: string;
  label: string;
  role: string;
  sigType: SigType;
  position: 'left' | 'center' | 'right';
}

interface PrintTemplate {
  companyName: string;
  companyAddress: string;
  documentTitle: string;
  docNumberPrefix: string;
  showLogo: boolean;
  headerNote: string;
  footerNote: string;
  signatureZones: SignatureZone[];
}

const DEFAULT_PRINT_TEMPLATES: Record<string, PrintTemplate> = {
  'Đơn xin nghỉ phép': {
    companyName: 'CÔNG TY CỔ PHẦN VCOMM ERP',
    companyAddress: 'Tầng 10, 123 Lê Lợi, Q.1, TP.HCM',
    documentTitle: 'ĐƠN XIN NGHỈ PHÉP',
    docNumberPrefix: 'NP-',
    showLogo: true,
    headerNote: 'Kính gửi: Ban Giám đốc và Phòng Nhân sự',
    footerNote: 'Đơn này có hiệu lực sau khi được phê duyệt đủ các cấp ký dưới đây.',
    signatureZones: [
      { id: 'sz1', label: 'Người đề xuất', role: 'Nhân viên', sigType: 'personal_image', position: 'left' },
      { id: 'sz2', label: 'Quản lý trực tiếp', role: 'Trưởng phòng', sigType: 'personal_ca', position: 'center' },
      { id: 'sz3', label: 'Phê duyệt cuối', role: 'Giám đốc Nhân sự', sigType: 'personal_ca', position: 'right' },
    ],
  },
  'Đăng ký OT': {
    companyName: 'CÔNG TY CỔ PHẦN VCOMM ERP',
    companyAddress: 'Tầng 10, 123 Lê Lợi, Q.1, TP.HCM',
    documentTitle: 'PHIẾU ĐĂNG KÝ LÀM THÊM GIỜ (OT)',
    docNumberPrefix: 'OT-',
    showLogo: true,
    headerNote: 'Kính gửi: Phòng Nhân sự',
    footerNote: '',
    signatureZones: [
      { id: 'sz1', label: 'Người đề xuất', role: 'Nhân viên', sigType: 'personal_image', position: 'left' },
      { id: 'sz2', label: 'Quản lý duyệt', role: 'Trưởng phòng', sigType: 'personal_ca', position: 'right' },
    ],
  },
  'Tạm ứng': {
    companyName: 'CÔNG TY CỔ PHẦN VCOMM ERP',
    companyAddress: 'Tầng 10, 123 Lê Lợi, Q.1, TP.HCM',
    documentTitle: 'GIẤY ĐỀ NGHỊ TẠM ỨNG',
    docNumberPrefix: 'TU-',
    showLogo: true,
    headerNote: 'Kính gửi: Phòng Kế toán – Tài chính',
    footerNote: 'Số tiền tạm ứng sẽ được hoàn trả hoặc thanh toán theo quy định tài chính nội bộ.',
    signatureZones: [
      { id: 'sz1', label: 'Người đề nghị', role: 'Nhân viên', sigType: 'personal_image', position: 'left' },
      { id: 'sz2', label: 'Kế toán trưởng', role: 'CFO', sigType: 'personal_ca', position: 'center' },
      { id: 'sz3', label: 'Giám đốc duyệt', role: 'CEO', sigType: 'company_ca', position: 'right' },
    ],
  },
  'Thanh toán': {
    companyName: 'CÔNG TY CỔ PHẦN VCOMM ERP',
    companyAddress: 'Tầng 10, 123 Lê Lợi, Q.1, TP.HCM',
    documentTitle: 'ĐỀ NGHỊ THANH TOÁN',
    docNumberPrefix: 'TT-',
    showLogo: true,
    headerNote: 'Kính gửi: Phòng Kế toán',
    footerNote: '',
    signatureZones: [
      { id: 'sz1', label: 'Người đề nghị', role: 'Nhân viên', sigType: 'personal_image', position: 'left' },
      { id: 'sz2', label: 'Kế toán trưởng', role: 'CFO', sigType: 'company_ca', position: 'right' },
    ],
  },
  'Mua sắm': {
    companyName: 'CÔNG TY CỔ PHẦN VCOMM ERP',
    companyAddress: 'Tầng 10, 123 Lê Lợi, Q.1, TP.HCM',
    documentTitle: 'PHIẾU ĐỀ NGHỊ MUA SẮM',
    docNumberPrefix: 'MS-',
    showLogo: true,
    headerNote: 'Kính gửi: Phòng Mua sắm & Hành chính',
    footerNote: '',
    signatureZones: [
      { id: 'sz1', label: 'Người đề xuất', role: 'Nhân viên', sigType: 'personal_image', position: 'left' },
      { id: 'sz2', label: 'Quản lý duyệt', role: 'Trưởng phòng', sigType: 'personal_ca', position: 'right' },
    ],
  },
  'Tuyển dụng': {
    companyName: 'CÔNG TY CỔ PHẦN VCOMM ERP',
    companyAddress: 'Tầng 10, 123 Lê Lợi, Q.1, TP.HCM',
    documentTitle: 'ĐỀ XUẤT TUYỂN DỤNG NHÂN SỰ',
    docNumberPrefix: 'TD-',
    showLogo: true,
    headerNote: 'Kính gửi: Ban Giám đốc và Phòng Nhân sự',
    footerNote: 'Đề xuất tuyển dụng sẽ được xem xét trong vòng 5 ngày làm việc.',
    signatureZones: [
      { id: 'sz1', label: 'Trưởng bộ phận', role: 'Dept. Manager', sigType: 'personal_ca', position: 'left' },
      { id: 'sz2', label: 'Giám đốc Nhân sự', role: 'HR Director', sigType: 'personal_ca', position: 'center' },
      { id: 'sz3', label: 'Tổng Giám đốc', role: 'CEO', sigType: 'company_ca', position: 'right' },
    ],
  },
};

// ── Form Configs ─────────────────────────────────────────────────
const INITIAL_FORM_CONFIGS = [
  { id: 'F01', name: 'Đơn xin nghỉ phép', category: 'Hành chính', isActive: true, workflow: [{ id: 1, ruleType: 'system', sla: '24h', specificUser: '' }, { id: 2, ruleType: 'specific', sla: '48h', specificUser: 'Giám đốc Nhân sự' }], fields: [{ id: 'f1', label: 'Từ ngày', type: 'date', required: true }, { id: 'f2', label: 'Đến ngày', type: 'date', required: true }, { id: 'f3', label: 'Loại phép', type: 'select', options: ['Phép năm', 'Phép không lương', 'Nghỉ ốm'], required: true }], printTemplate: DEFAULT_PRINT_TEMPLATES['Đơn xin nghỉ phép'] },
  { id: 'F02', name: 'Đăng ký OT', category: 'Hành chính', isActive: true, workflow: [{ id: 1, ruleType: 'system', sla: '24h', specificUser: '' }], fields: [{ id: 'f1', label: 'Ngày OT', type: 'date', required: true }, { id: 'f2', label: 'Số giờ', type: 'number', required: true }], printTemplate: DEFAULT_PRINT_TEMPLATES['Đăng ký OT'] },
  { id: 'F03', name: 'Tạm ứng', category: 'Tài chính', isActive: true, workflow: [{ id: 1, ruleType: 'system', sla: '24h', specificUser: '' }, { id: 2, ruleType: 'specific', sla: '48h', specificUser: 'Kế toán trưởng' }], fields: [{ id: 'f1', label: 'Số tiền (VNĐ)', type: 'number', required: true }, { id: 'f2', label: 'Thông tin tài khoản nhận', type: 'text', required: true }], printTemplate: DEFAULT_PRINT_TEMPLATES['Tạm ứng'] },
  { id: 'F04', name: 'Thanh toán', category: 'Tài chính', isActive: true, workflow: [{ id: 1, ruleType: 'specific', sla: '48h', specificUser: 'Kế toán trưởng' }], fields: [{ id: 'f1', label: 'Số tiền (VNĐ)', type: 'number', required: true }, { id: 'f2', label: 'Thông tin tài khoản nhận', type: 'text', required: true }], printTemplate: DEFAULT_PRINT_TEMPLATES['Thanh toán'] },
  { id: 'F05', name: 'Mua sắm', category: 'Khác', isActive: true, workflow: [{ id: 1, ruleType: 'system', sla: '24h', specificUser: '' }], fields: [{ id: 'f1', label: 'Danh sách mặt hàng', type: 'textarea', required: true }, { id: 'f2', label: 'Kinh phí dự kiến (VNĐ)', type: 'number', required: true }], printTemplate: DEFAULT_PRINT_TEMPLATES['Mua sắm'] },
  { id: 'F06', name: 'Tuyển dụng', category: 'Khác', isActive: true, workflow: [{ id: 1, ruleType: 'system', sla: '24h', specificUser: '' }, { id: 2, ruleType: 'specific', sla: '48h', specificUser: 'Giám đốc Nhân sự' }], fields: [{ id: 'f1', label: 'Vị trí cần tuyển', type: 'text', required: true }, { id: 'f2', label: 'Số lượng', type: 'number', required: true }, { id: 'f3', label: 'Hạn chót cần offer', type: 'date', required: true }], printTemplate: DEFAULT_PRINT_TEMPLATES['Tuyển dụng'] },
];

const INITIAL_REQUESTS = [
  { id: 'REQ-001', type: 'admin', subtype: 'Đơn xin nghỉ phép', title: 'Xin nghỉ phép thường niên 2 ngày để đi du lịch gia đình', requester: 'Lê Hoàng Minh', status: 'pending', date: '25/03/2024', formData: { f1: '28/03/2024', f2: '29/03/2024', f3: 'Phép năm' }, approvalLog: [], currentLevel: 1 },
  { id: 'REQ-002', type: 'finance', subtype: 'Tạm ứng', title: 'Tạm ứng công tác phí chuyến Hà Nội Q2/2024', requester: 'Nguyễn Diệu Nhi', status: 'approved', signatureStatus: 'signed', date: '24/03/2024', formData: { f1: '5000000', f2: 'MB Bank - 0901234567 - Nguyễn Diệu Nhi' }, approvalLog: [{ level: 1, status: 'approved', by: 'Trần Văn Bình', time: '24/03/2024 09:00', stepName: 'Duyệt cấp 1' }, { level: 2, status: 'approved', by: 'Kế toán trưởng', time: '24/03/2024 14:30', stepName: 'Duyệt cấp cuối' }], currentLevel: 2, signedBy: 'Kế toán trưởng', signedAt: '24/03/2024 14:35', caProvider: 'PERSONAL CA', sigType: 'personal_ca' as SigType },
  { id: 'REQ-003', type: 'other', subtype: 'Tuyển dụng', title: 'Đề nghị tuyển dụng 2 nhân sự Marketing Digital', requester: 'Trần Văn Bình', status: 'rejected', date: '23/03/2024', formData: { f1: 'Marketing Digital Executive', f2: '2', f3: '30/04/2024' }, approvalLog: [{ level: 1, status: 'rejected', by: 'Giám đốc Nhân sự', time: '23/03/2024 16:00', stepName: 'Từ chối tại cấp 1' }], currentLevel: 1 },
];

// ── PrintPreview Component ────────────────────────────────────────
function PrintPreview({ request, formConfig, onClose }: { request: any; formConfig: any; onClose: () => void }) {
  const tmpl: PrintTemplate = formConfig?.printTemplate || DEFAULT_PRINT_TEMPLATES[request.subtype] || DEFAULT_PRINT_TEMPLATES['Đơn xin nghỉ phép'];
  const approvalLog: any[] = request.approvalLog || [];
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML || '';
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><head><title>${tmpl.documentTitle}</title><style>
      body { font-family: 'Times New Roman', serif; font-size: 12pt; margin: 20mm; color: #000; }
      h1 { font-size: 16pt; text-align: center; text-transform: uppercase; margin: 12px 0; }
      h2 { font-size: 13pt; text-align: center; border-bottom: 1px solid #000; padding-bottom: 6px; }
      table { width: 100%; border-collapse: collapse; margin: 10px 0; }
      td, th { border: 1px solid #999; padding: 6px 10px; font-size: 11pt; }
      .sig-zone { text-align: center; border: 1px dashed #999; padding: 10px; min-height: 80px; }
      .sig-badge { font-size: 8pt; background: #f0f0f0; padding: 2px 6px; border-radius: 4px; }
      .no-print { display: none; }
      @media print { .no-print { display: none; } }
    </style></head><body>${content}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const sigZones = tmpl.signatureZones || [];
  const colClass = sigZones.length === 2 ? 'grid-cols-2' : sigZones.length >= 3 ? 'grid-cols-3' : 'grid-cols-1';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-bold text-slate-900">Xem trước – {tmpl.documentTitle}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5" /> In phiếu
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors">
              <X className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Document */}
        <div className="overflow-y-auto flex-1 bg-slate-100 p-6">
          <div ref={printRef} className="bg-white shadow-sm max-w-2xl mx-auto p-10 text-sm font-['Times_New_Roman',serif]" style={{ minHeight: 840 }}>
            {/* Header */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-slate-800">
              <div>
                <p className="font-bold text-base uppercase">{tmpl.companyName}</p>
                <p className="text-xs text-slate-600">{tmpl.companyAddress}</p>
              </div>
              <div className="text-right text-xs text-slate-600">
                <p>Số: <strong>{tmpl.docNumberPrefix}{request.id}</strong></p>
                <p>Ngày: {request.date}</p>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-center text-xl font-bold uppercase tracking-wide mb-2">{tmpl.documentTitle}</h1>
            {tmpl.headerNote && <p className="text-center text-sm italic text-slate-600 mb-6">{tmpl.headerNote}</p>}

            {/* Requester info */}
            <div className="mb-4 space-y-1.5">
              <p><strong>Họ và tên:</strong> {request.requester}</p>
              <p><strong>Nội dung đề xuất:</strong> {request.title}</p>
            </div>

            {/* Form fields */}
            {formConfig?.fields?.length > 0 && (
              <table className="w-full border-collapse mb-6 text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 px-3 py-2 text-left font-bold">Thông tin</th>
                    <th className="border border-slate-300 px-3 py-2 text-left font-bold">Nội dung</th>
                  </tr>
                </thead>
                <tbody>
                  {formConfig.fields.map((f: any) => (
                    <tr key={f.id}>
                      <td className="border border-slate-300 px-3 py-2 font-medium w-48">{f.label}</td>
                      <td className="border border-slate-300 px-3 py-2">{request.formData?.[f.id] || <span className="text-slate-400 italic">Chưa điền</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Approval log */}
            {approvalLog.length > 0 && (
              <div className="mb-6">
                <p className="font-bold text-sm mb-2 uppercase tracking-wide">Lịch sử phê duyệt</p>
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 px-2 py-1.5 text-left">Bước</th>
                      <th className="border border-slate-300 px-2 py-1.5 text-left">Người duyệt</th>
                      <th className="border border-slate-300 px-2 py-1.5 text-left">Kết quả</th>
                      <th className="border border-slate-300 px-2 py-1.5 text-left">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvalLog.map((log: any, i: number) => (
                      <tr key={i}>
                        <td className="border border-slate-300 px-2 py-1.5">{log.stepName}</td>
                        <td className="border border-slate-300 px-2 py-1.5 font-medium">{log.by}</td>
                        <td className="border border-slate-300 px-2 py-1.5">
                          <span className={cn('font-bold', log.status === 'approved' ? 'text-emerald-700' : 'text-red-700')}>
                            {log.status === 'approved' ? '✓ Đã duyệt' : '✗ Từ chối'}
                          </span>
                        </td>
                        <td className="border border-slate-300 px-2 py-1.5">{log.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tmpl.footerNote && <p className="text-xs italic text-slate-600 mb-6 border-t pt-3">{tmpl.footerNote}</p>}

            {/* Signature zones */}
            <div className={cn('grid gap-4 mt-8', colClass)}>
              {sigZones.map((zone) => {
                const meta = SIG_TYPE_META[zone.sigType];
                const isSigned = request.signatureStatus === 'signed' && zone.id === 'sz2';
                return (
                  <div key={zone.id} className="border border-dashed border-slate-400 rounded p-3 text-center">
                    <p className="font-bold text-xs uppercase tracking-wide mb-1">{zone.label}</p>
                    <p className="text-[10px] text-slate-500 mb-3">{zone.role}</p>
                    <div className={cn('text-[9px] font-bold px-2 py-0.5 rounded inline-block mb-2', meta.badge)}>
                      {meta.short}
                    </div>
                    {isSigned ? (
                      <div className="mt-2">
                        <div className="mx-auto w-20 h-12 bg-blue-50 border border-blue-200 rounded flex items-center justify-center">
                          <BadgeCheck className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-[9px] text-emerald-700 font-bold mt-1">ĐÃ KÝ SỐ</p>
                        <p className="text-[9px] text-slate-500">{request.signedBy} – {request.signedAt}</p>
                      </div>
                    ) : (
                      <div className="h-12 flex items-end justify-center">
                        <p className="text-[10px] text-slate-400 italic">Chờ ký</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SignatureModal ────────────────────────────────────────────────
function SignatureModal({ request, onClose, onSigned }: { request: any; onClose: () => void; onSigned: (data: any) => void }) {
  const [sigType, setSigType] = useState<SigType>('personal_ca');
  const [provider, setProvider] = useState<'vnpt_smartca' | 'viettel_ca' | 'usb_token'>('vnpt_smartca');
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImageFile(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    onSigned({
      signatureStatus: 'signed',
      status: 'approved',
      signedBy: 'Người dùng hiện tại',
      signedAt: new Date().toLocaleString('vi-VN'),
      sigType,
      caProvider: sigType === 'personal_image' ? 'HÌNH ẢNH' : provider.toUpperCase().replace('_', ' '),
    });
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-slate-900">Xác nhận Ký số – {request.id}</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Doc info */}
          <div className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-xs font-bold text-slate-500 uppercase mb-0.5">Tài liệu</p>
            <p className="text-sm font-bold text-slate-900">{request.title}</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{request.id} · {request.subtype}</p>
          </div>

          {/* Signature type */}
          <div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Loại chữ ký số</p>
            <div className="space-y-2">
              {(Object.entries(SIG_TYPE_META) as [SigType, typeof SIG_TYPE_META[SigType]][]).map(([type, meta]) => {
                const Icon = meta.icon;
                return (
                  <label key={type} className={cn('flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all', sigType === type ? `${meta.color} border-2` : 'border-slate-200 bg-white hover:bg-slate-50')}>
                    <input type="radio" name="sigType" value={type} checked={sigType === type} onChange={() => setSigType(type)} className="mt-0.5 shrink-0" />
                    <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold">{meta.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{meta.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Provider selection for CA types */}
          {sigType !== 'personal_image' && (
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Nhà cung cấp CA</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'vnpt_smartca', label: 'VNPT SmartCA', sub: 'Remote Signing' },
                  { id: 'viettel_ca', label: 'Viettel CA', sub: 'Cloud/SIM PKI' },
                  { id: 'usb_token', label: 'USB Token', sub: 'HSM vật lý' },
                ].map(p => (
                  <button key={p.id} onClick={() => setProvider(p.id as any)}
                    className={cn('p-2.5 border rounded-lg text-center transition-all', provider === p.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300')}>
                    <p className="text-xs font-bold text-slate-900">{p.label}</p>
                    <p className="text-[10px] text-slate-500">{p.sub}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Image upload for personal_image */}
          {sigType === 'personal_image' && (
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Hình ảnh chữ ký</p>
              <div className="border-2 border-dashed border-amber-300 rounded-xl p-4 text-center bg-amber-50">
                {imageFile ? (
                  <div className="space-y-2">
                    <img src={imageFile} alt="Chữ ký" className="max-h-20 mx-auto object-contain" />
                    <button onClick={() => setImageFile(null)} className="text-xs text-red-500 hover:underline">Xóa ảnh</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <PenLine className="w-8 h-8 text-amber-400 mx-auto" />
                    <p className="text-xs text-amber-700 font-medium">Tải lên hình ảnh chữ ký của bạn</p>
                    <button onClick={() => fileRef.current?.click()} className="px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600">Chọn ảnh</button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </div>
                )}
              </div>
              <p className="text-[10px] text-amber-700 mt-1.5 italic">⚠ Chữ ký hình ảnh chỉ dùng cho văn bản nội bộ, không có giá trị pháp lý bên ngoài.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-200 bg-slate-50">
          <button onClick={onClose} disabled={isProcessing} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50">Hủy</button>
          <button onClick={handleConfirm} disabled={isProcessing || (sigType === 'personal_image' && !imageFile)}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            {isProcessing ? 'Đang ký...' : 'Xác nhận Ký số'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Request Detail Panel ─────────────────────────────────────────
function RequestDetailPanel({ request, formConfig, onClose, onSign, onPrint, onApprove, onReject, isAdmin }: any) {
  const approvalLog: any[] = request.approvalLog || [];
  const tmpl: PrintTemplate = formConfig?.printTemplate || DEFAULT_PRINT_TEMPLATES[request.subtype];
  const sigZones = tmpl?.signatureZones || [];

  const statusMeta: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Chờ duyệt', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    approved: { label: 'Đã duyệt', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    rejected: { label: 'Từ chối', cls: 'bg-red-50 text-red-700 border-red-200' },
  };
  const sm = statusMeta[request.status] || statusMeta.pending;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="relative w-full max-w-xl h-full bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg"><ArrowLeft className="w-4 h-4" /></button>
            <div>
              <p className="text-sm font-bold text-slate-900">{request.id} – {request.subtype}</p>
              <p className="text-xs text-slate-500">{request.requester} · {request.date}</p>
            </div>
          </div>
          <span className={cn('text-xs font-bold px-2.5 py-1 rounded-lg border', sm.cls)}>{sm.label}</span>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Title */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Nội dung đề xuất</p>
            <p className="text-sm font-medium text-slate-900">{request.title}</p>
          </div>

          {/* Form data */}
          {formConfig?.fields?.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Chi tiết phiếu</p>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                {formConfig.fields.map((f: any, i: number) => (
                  <div key={f.id} className={cn('flex gap-3 px-4 py-3', i % 2 === 0 ? 'bg-white' : 'bg-slate-50')}>
                    <p className="text-xs font-bold text-slate-500 w-40 shrink-0">{f.label}</p>
                    <p className="text-xs font-medium text-slate-900">{request.formData?.[f.id] || <span className="italic text-slate-400">Chưa điền</span>}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approval flow */}
          <div className="space-y-2">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Luồng phê duyệt</p>
            <div className="space-y-2">
              {(formConfig?.workflow || []).map((step: any, idx: number) => {
                const log = approvalLog.find((l: any) => l.level === idx + 1);
                const isCurrent = (request.currentLevel || 1) === idx + 1 && request.status === 'pending';
                return (
                  <div key={step.id} className={cn('flex items-start gap-3 p-3 rounded-xl border', log?.status === 'approved' ? 'bg-emerald-50 border-emerald-200' : log?.status === 'rejected' ? 'bg-red-50 border-red-200' : isCurrent ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200')}>
                    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0', log?.status === 'approved' ? 'bg-emerald-600 text-white' : log?.status === 'rejected' ? 'bg-red-500 text-white' : isCurrent ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600')}>
                      {log?.status === 'approved' ? <CheckCircle2 className="w-4 h-4" /> : log?.status === 'rejected' ? <X className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900">Bước {idx + 1}{step.ruleType === 'specific' ? ` – ${step.specificUser}` : ' – Trưởng bộ phận'}</p>
                      {log && <p className="text-[10px] text-slate-500 mt-0.5">{log.by} · {log.time}</p>}
                      {isCurrent && <p className="text-[10px] text-amber-700 font-bold mt-0.5">⏳ Đang chờ phê duyệt</p>}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 shrink-0">SLA: {step.sla}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Signature zones */}
          {sigZones.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Vùng chữ ký (theo form mẫu)</p>
              <div className="grid grid-cols-1 gap-2">
                {sigZones.map((zone: SignatureZone) => {
                  const meta = SIG_TYPE_META[zone.sigType];
                  const Icon = meta.icon;
                  const isSigned = request.signatureStatus === 'signed';
                  return (
                    <div key={zone.id} className={cn('flex items-center gap-3 p-3 rounded-xl border', isSigned ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200')}>
                      <div className={cn('p-2 rounded-lg', meta.badge)}><Icon className="w-4 h-4" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900">{zone.label} <span className="text-slate-500 font-normal">({zone.role})</span></p>
                        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', meta.badge)}>{meta.label}</span>
                      </div>
                      {isSigned ? (
                        <div className="text-right shrink-0">
                          <BadgeCheck className="w-5 h-5 text-emerald-600 ml-auto" />
                          <p className="text-[10px] text-emerald-700 font-bold">Đã ký</p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Chưa ký</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Signed info */}
          {request.signatureStatus === 'signed' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
              <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-emerald-800">Đã ký số thành công</p>
                <p className="text-xs text-emerald-700 mt-0.5">Bởi: {request.signedBy} · {request.signedAt}</p>
                <p className="text-xs text-emerald-600 mt-0.5 font-mono">{request.caProvider} {request.sigType ? `· ${SIG_TYPE_META[request.sigType as SigType]?.label}` : ''}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-5 py-3 flex flex-wrap gap-2 justify-between">
          <button onClick={onPrint} className="px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5" /> Xem & In phiếu
          </button>
          <div className="flex gap-2">
            {request.status === 'approved' && request.signatureStatus !== 'signed' && (
              <button onClick={onSign} className="px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 flex items-center gap-1.5">
                <FileSignature className="w-3.5 h-3.5" /> Ký số
              </button>
            )}
            {request.status === 'pending' && isAdmin && (
              <>
                <button onClick={onApprove} className="px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt
                </button>
                <button onClick={onSign} className="px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 flex items-center gap-1.5">
                  <FileSignature className="w-3.5 h-3.5" /> Ký & Duyệt
                </button>
                <button onClick={onReject} className="px-3 py-2 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5" /> Từ chối
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── PrintTemplateDesigner ────────────────────────────────────────
function PrintTemplateDesigner({ config, onSave, onClose }: { config: any; onSave: (tmpl: PrintTemplate) => void; onClose: () => void }) {
  const [tmpl, setTmpl] = useState<PrintTemplate>(config.printTemplate || DEFAULT_PRINT_TEMPLATES[config.name] || {
    companyName: 'CÔNG TY CỔ PHẦN VCOMM ERP', companyAddress: 'Tầng 10, 123 Lê Lợi, Q.1, TP.HCM',
    documentTitle: config.name.toUpperCase(), docNumberPrefix: 'REQ-', showLogo: true,
    headerNote: '', footerNote: '', signatureZones: [
      { id: 'sz1', label: 'Người đề xuất', role: 'Nhân viên', sigType: 'personal_image', position: 'left' },
      { id: 'sz2', label: 'Phê duyệt', role: 'Quản lý', sigType: 'personal_ca', position: 'right' },
    ],
  });

  const updateZone = (id: string, field: string, val: any) => {
    setTmpl(t => ({ ...t, signatureZones: t.signatureZones.map(z => z.id === id ? { ...z, [field]: val } : z) }));
  };
  const addZone = () => {
    const id = `sz${Date.now()}`;
    setTmpl(t => ({ ...t, signatureZones: [...t.signatureZones, { id, label: 'Chữ ký mới', role: '', sigType: 'personal_ca', position: 'right' }] }));
  };
  const removeZone = (id: string) => setTmpl(t => ({ ...t, signatureZones: t.signatureZones.filter(z => z.id !== id) }));

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-slate-900">Thiết kế Form In – {config.name}</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Header info */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Tiêu đề văn bản</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tên công ty</label>
                <input className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={tmpl.companyName} onChange={e => setTmpl(t => ({ ...t, companyName: e.target.value }))} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Địa chỉ</label>
                <input className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={tmpl.companyAddress} onChange={e => setTmpl(t => ({ ...t, companyAddress: e.target.value }))} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tiêu đề phiếu</label>
                <input className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold" value={tmpl.documentTitle} onChange={e => setTmpl(t => ({ ...t, documentTitle: e.target.value }))} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tiền tố số hiệu</label>
                <input className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono" value={tmpl.docNumberPrefix} onChange={e => setTmpl(t => ({ ...t, docNumberPrefix: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Kính gửi / Ghi chú đầu</label>
              <input className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={tmpl.headerNote} onChange={e => setTmpl(t => ({ ...t, headerNote: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Ghi chú cuối phiếu</label>
              <input className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={tmpl.footerNote} onChange={e => setTmpl(t => ({ ...t, footerNote: e.target.value }))} />
            </div>
          </div>

          {/* Signature zones */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Vùng Chữ ký</p>
              <button onClick={addZone} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Thêm vùng ký
              </button>
            </div>
            {tmpl.signatureZones.map((zone, idx) => (
              <div key={zone.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700">Vùng ký #{idx + 1}</p>
                  {tmpl.signatureZones.length > 1 && (
                    <button onClick={() => removeZone(zone.id)} className="text-[10px] text-red-500 hover:text-red-700 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Xóa</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nhãn hiển thị</label>
                    <input className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm" value={zone.label} onChange={e => updateZone(zone.id, 'label', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Chức vụ ký</label>
                    <input className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm" value={zone.role} onChange={e => updateZone(zone.id, 'role', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Loại chữ ký</label>
                    <select className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm" value={zone.sigType} onChange={e => updateZone(zone.id, 'sigType', e.target.value)}>
                      {(Object.entries(SIG_TYPE_META) as [SigType, any][]).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Vị trí</label>
                    <select className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm" value={zone.position} onChange={e => updateZone(zone.id, 'position', e.target.value)}>
                      <option value="left">Trái</option>
                      <option value="center">Giữa</option>
                      <option value="right">Phải</option>
                    </select>
                  </div>
                </div>
                <div className={cn('text-[10px] font-bold px-2 py-1 rounded inline-block', SIG_TYPE_META[zone.sigType].badge)}>
                  {SIG_TYPE_META[zone.sigType].desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-5 py-3 border-t border-slate-200 bg-slate-50 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">Hủy</button>
          <button onClick={() => onSave(tmpl)} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2">
            <Save className="w-4 h-4" /> Lưu form mẫu
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export function RequestHub() {
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();
  const { user, isAdmin, staffInfo } = useAuth();
  const { addNotification } = useNotifications();
  const [requests, setRequests] = useState<any[]>(INITIAL_REQUESTS);
  const [dbRequestIds, setDbRequestIds] = useState<Set<string>>(new Set());
  const [formConfigs, setFormConfigs] = useState<any[]>(INITIAL_FORM_CONFIGS);

  useEffect(() => {
    const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) return;
      const dbReqs = snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
      const ids = new Set(dbReqs.map((r: any) => r.id));
      setDbRequestIds(ids);
      setRequests(prev => {
        const mockOnly = prev.filter(r => !ids.has(r.id));
        return [...dbReqs, ...mockOnly];
      });
    }, (err) => console.error('RequestHub snapshot error:', err));
    return () => unsub();
  }, []);

  // UI State
  const [searchReqQuery, setSearchReqQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [requesterFilter, setRequesterFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [templateAction, setTemplateAction] = useState<'create_config' | 'submit_request'>('submit_request');
  const [editingFormConfig, setEditingFormConfig] = useState<any>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedConfigForWorkflow, setSelectedConfigForWorkflow] = useState<string>('F01');
  const [designingTemplate, setDesigningTemplate] = useState<any>(null);

  // Detail / Signature / Print
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [signingRequest, setSigningRequest] = useState<any>(null);
  const [printingRequest, setPrintingRequest] = useState<any>(null);

  // New request form
  const [newRequest, setNewRequest] = useState<any>({ subtype: 'Đơn xin nghỉ phép', title: '', requester: 'Tôi (Người đang đăng nhập)', formData: {}, isUrgent: false, customReviewers: [{ step: 1, reviewer: 'Quản lý trực tiếp' }] });

  const clearAllFilters = () => { setSearchReqQuery(''); setStatusFilter('all'); setRequesterFilter('all'); setStartDate(''); setEndDate(''); };
  const isFiltered = searchReqQuery !== '' || statusFilter !== 'all' || requesterFilter !== 'all' || startDate !== '' || endDate !== '';

  const filteredRequests = requests.filter(doc => {
    const matchesTab = activeTab === 'all' || doc.type === activeTab;
    const matchesSearch = doc.title?.toLowerCase().includes(searchReqQuery.toLowerCase()) || doc.id?.toLowerCase().includes(searchReqQuery.toLowerCase()) || doc.subtype?.toLowerCase().includes(searchReqQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesRequester = requesterFilter === 'all' || doc.requester === requesterFilter;
    let matchesDate = true;
    if (startDate || endDate) {
      const [d, m, y] = (doc.date || '').split('/');
      const docDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      if (startDate && docDate < new Date(startDate)) matchesDate = false;
      if (endDate) { const e = new Date(endDate); e.setHours(23, 59, 59); if (docDate > e) matchesDate = false; }
    }
    return matchesTab && matchesSearch && matchesStatus && matchesRequester && matchesDate;
  });

  const uniqueRequesters = Array.from(new Set(requests.map(r => r.requester)));

  const handleStatusChange = (id: string, newStatus: string) => {
    setRequests(prev => prev.map(req => {
      if (req.id !== id) return req;
      const config = formConfigs.find(c => c.name === req.subtype);
      const currentLevel = req.currentLevel || 1;
      const totalLevels = config?.workflow?.length || 1;
      const approvalLog = req.approvalLog || [];
      if (newStatus === 'approved') {
        if (currentLevel < totalLevels) return { ...req, currentLevel: currentLevel + 1, status: 'pending', approvalLog: [...approvalLog, { level: currentLevel, status: 'approved', by: user?.displayName || 'Người duyệt', time: new Date().toLocaleString('vi-VN'), stepName: `Duyệt cấp ${currentLevel}` }] };
        return { ...req, status: 'approved', approvalLog: [...approvalLog, { level: currentLevel, status: 'approved', by: user?.displayName || 'Người duyệt', time: new Date().toLocaleString('vi-VN'), stepName: 'Duyệt cấp cuối' }] };
      }
      return { ...req, status: 'rejected', approvalLog: [...approvalLog, { level: currentLevel, status: 'rejected', by: user?.displayName || 'Người duyệt', time: new Date().toLocaleString('vi-VN'), stepName: `Từ chối cấp ${currentLevel}` }] };
    }));
    if (dbRequestIds.has(id)) updateDoc(doc(db, 'requests', id), { status: newStatus, updatedAt: serverTimestamp() }).catch(console.error);
  };

  const handleSigned = (id: string, data: any) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    if (dbRequestIds.has(id)) updateDoc(doc(db, 'requests', id), { ...data, updatedAt: serverTimestamp() }).catch(console.error);
    setSelectedRequest((prev: any) => prev?.id === id ? { ...prev, ...data } : prev);
  };

  const handleAddRequest = () => {
    if (!newRequest.title) return alert('Vui lòng nhập nội dung đề xuất');
    const matchedConfig = formConfigs.find(c => c.name === newRequest.subtype);
    let type = 'other';
    if (matchedConfig?.category === 'Hành chính') type = 'admin';
    if (matchedConfig?.category === 'Tài chính') type = 'finance';
    const request = { id: `REQ-${String(requests.length + 1).padStart(3, '0')}`, type, subtype: newRequest.subtype, title: newRequest.title, requester: user?.displayName || newRequest.requester, status: 'pending', date: new Date().toLocaleDateString('vi-VN'), currentLevel: 1, approvalLog: [], formData: newRequest.formData, isUrgent: newRequest.isUrgent };
    addDoc(collection(db, 'requests'), { ...request, createdAt: serverTimestamp() }).catch(console.error);
    setRequests(prev => [request, ...prev]);
    setShowAddModal(false);
    setNewRequest({ subtype: formConfigs[0]?.name || '', title: '', requester: '', formData: {}, isUrgent: false, customReviewers: [{ step: 1, reviewer: '' }] });
  };

  const getFormConfig = (req: any) => formConfigs.find(c => c.name === req?.subtype);

  const statusMeta: Record<string, { label: string; cls: string; dot: string }> = {
    pending: { label: 'Chờ duyệt', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    approved: { label: 'Đã duyệt', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    rejected: { label: 'Từ chối', cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in- duration-500 pb-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="header-title border-l-4 border-emerald-500 pl-4 py-1">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Đề xuất, Phê duyệt & Ký số <span className="text-emerald-600">E-Form</span></h1>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Hành chính · Tài chính · Nhân sự · Quy trình số</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/signature')} className="bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all flex items-center gap-2">
            <FileSignature className="w-4 h-4 text-blue-600" /> Trung tâm Ký số
          </button>
          <button onClick={() => { setTemplateAction('submit_request'); setShowTemplateGallery(true); }} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tạo đề xuất
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Cần tôi duyệt', value: requests.filter(r => r.status === 'pending').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Tôi gửi đi', value: requests.filter(r => r.requester === (user?.displayName || 'Tôi (Người đang đăng nhập)')).length, icon: Send, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Đã duyệt (tháng)', value: requests.filter(r => r.status === 'approved').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Chờ ký số', value: requests.filter(r => r.status === 'approved' && r.signatureStatus !== 'signed').length, icon: FileSignature, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
            <div className={cn('p-2 rounded-lg shrink-0', s.bg)}><s.icon className={cn('w-4 h-4', s.color)} /></div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{s.label}</p>
              <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        {/* Sidebar */}
        <div className="w-52 shrink-0 space-y-1">
          {[
            { id: 'all', label: 'Tất cả Đề xuất', icon: Inbox },
            { id: 'admin', label: 'Hành chính', icon: Coffee },
            { id: 'finance', label: 'Tài chính', icon: DollarSign },
            { id: 'other', label: 'Khác', icon: UserPlus },
            { id: 'settings', label: 'Cấu hình Form', icon: Settings },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all text-left', activeTab === tab.id ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-700 hover:bg-slate-50 font-medium')}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {activeTab !== 'settings' ? (
            <>
              {/* Filter bar */}
              <div className="p-3 border-b border-slate-100 flex flex-wrap items-center gap-2 bg-slate-50">
                <div className="relative flex-1 min-w-48">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Tìm mã, nội dung, loại phiếu..." value={searchReqQuery} onChange={e => setSearchReqQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm" />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm font-medium text-slate-700">
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chờ duyệt</option>
                  <option value="approved">Đã duyệt</option>
                  <option value="rejected">Từ chối</option>
                </select>
                <select value={requesterFilter} onChange={e => setRequesterFilter(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm font-medium text-slate-700 max-w-36">
                  <option value="all">Mọi người</option>
                  {uniqueRequesters.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {isFiltered && (
                  <button onClick={clearAllFilters} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-2 rounded-xl flex items-center gap-1.5 hover:bg-red-100">
                    <X className="w-3 h-3" /> Xóa lọc
                  </button>
                )}
              </div>

              {/* Table */}
              <div className="overflow-x-auto flex-1">
                <table className="min-w-[680px] w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-36">Loại / Mã phiếu</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nội dung</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-36">Người đề xuất</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-32 text-center">Trạng thái</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-28 text-right">Ngày</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRequests.length > 0 ? filteredRequests.map(doc => {
                      const sm = statusMeta[doc.status] || statusMeta.pending;
                      return (
                        <tr key={doc.id} onClick={() => setSelectedRequest(doc)}
                          className="hover:bg-slate-50 transition-colors cursor-pointer group">
                          <td className="px-4 py-3.5">
                            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded block w-fit mb-1">{doc.subtype}</span>
                            <p className="text-[10px] text-slate-400 font-mono">{doc.id}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-sm font-medium text-slate-900 line-clamp-2">{doc.title}</p>
                            {doc.isUrgent && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded mt-1 inline-flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" /> Khẩn</span>}
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-sm font-medium text-slate-800">{doc.requester}</p>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={cn('text-[11px] font-bold px-2.5 py-1 rounded-lg border inline-flex items-center gap-1', sm.cls)}>
                                <span className={cn('w-1.5 h-1.5 rounded-full', sm.dot)} />
                                {sm.label}
                              </span>
                              {doc.status === 'approved' && (
                                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-lg border inline-flex items-center gap-1', doc.signatureStatus === 'signed' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200')}>
                                  <FileSignature className="w-2.5 h-2.5" />
                                  {doc.signatureStatus === 'signed' ? 'Đã ký số' : 'Chờ ký số'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <p className="text-xs text-slate-500 font-mono">{doc.date}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 group-hover:text-blue-600 flex items-center gap-1 justify-end transition-colors">
                              <Eye className="w-2.5 h-2.5" /> Xem chi tiết
                            </p>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center">
                          <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                          <p className="text-sm font-medium text-slate-600">Không tìm thấy phiếu nào</p>
                          {isFiltered && <button onClick={clearAllFilters} className="mt-2 text-xs text-blue-600 hover:underline">Xóa bộ lọc</button>}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* Settings tab */
            <div className="p-5 space-y-5 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cấu hình Loại Phiếu (E-Form)</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Thiết kế form mẫu, form in và luồng phê duyệt cho từng loại phiếu.</p>
                </div>
                <button onClick={() => { setTemplateAction('create_config'); setShowTemplateGallery(true); }} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Thêm loại phiếu
                </button>
              </div>

              {/* Form config grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {formConfigs.map(item => (
                  <div key={item.id} className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition-colors group">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">{item.category}</span>
                      </div>
                      <div className="flex flex-col gap-1.5 invisible group-hover:visible transition-all">
                        <button onClick={() => { setEditingFormConfig(item); setShowConfigModal(true); }} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                          <SlidersHorizontal className="w-3 h-3" /> Luồng duyệt
                        </button>
                        <button onClick={() => setDesigningTemplate(item)} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
                          <LayoutTemplate className="w-3 h-3" /> Form in
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-600">Luồng duyệt: <span className="font-bold text-emerald-700">{item.workflow.length} cấp</span></p>
                      <p className="text-xs text-slate-600">Trường dữ liệu: <span className="font-bold text-slate-800">{item.fields.length} trường</span></p>
                      {item.printTemplate && (
                        <p className="text-xs text-slate-600">Vùng ký: <span className="font-bold text-blue-700">{item.printTemplate.signatureZones?.length || 0} vùng</span></p>
                      )}
                    </div>
                    {/* Signature zone preview */}
                    {item.printTemplate?.signatureZones?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {item.printTemplate.signatureZones.map((z: SignatureZone) => {
                          const meta = SIG_TYPE_META[z.sigType];
                          return <span key={z.id} className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', meta.badge)}>{meta.short}</span>;
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Workflow config */}
              {formConfigs.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Layout className="w-5 h-5 text-blue-600" />
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chỉnh luồng duyệt cho phiếu</label>
                        <select value={selectedConfigForWorkflow} onChange={e => setSelectedConfigForWorkflow(e.target.value)}
                          className="block text-sm font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer hover:text-blue-600 transition-colors mt-0.5">
                          {formConfigs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <button onClick={() => {
                      const updated = [...formConfigs];
                      const cIdx = updated.findIndex(f => f.id === selectedConfigForWorkflow);
                      if (cIdx > -1) { updated[cIdx].workflow.push({ id: Date.now(), ruleType: 'system', sla: '24h', specificUser: '' }); setFormConfigs(updated); }
                    }} className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                      <Plus className="w-3.5 h-3.5 text-emerald-600" /> Thêm bước duyệt
                    </button>
                  </div>

                  <div className="space-y-3 relative">
                    <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-slate-200" />
                    {formConfigs.find(f => f.id === selectedConfigForWorkflow)?.workflow.map((step: any, idx: number, arr: any[]) => (
                      <div key={step.id} className="flex items-start gap-4 relative z-10">
                        <div className={cn('w-10 h-10 rounded-xl font-bold flex items-center justify-center shrink-0 border-2 text-sm shadow-sm', idx === 0 ? 'bg-emerald-600 border-white text-white' : 'bg-white border-slate-200 text-slate-500')}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 bg-white border border-slate-200 p-4 rounded-xl">
                          <div className="flex justify-between items-center mb-3">
                            <h5 className="font-bold text-slate-900 text-xs uppercase">Bước {idx + 1}: {idx === 0 ? 'Phê duyệt cơ sở' : 'Phê duyệt cấp cao'}</h5>
                            {idx > 0 && (
                              <button onClick={() => {
                                const updated = [...formConfigs];
                                const cIdx = updated.findIndex(f => f.id === selectedConfigForWorkflow);
                                updated[cIdx].workflow = updated[cIdx].workflow.filter((w: any) => w.id !== step.id);
                                setFormConfigs(updated);
                              }} className="text-[10px] text-red-500 hover:bg-red-50 px-2 py-1 rounded flex items-center gap-1">
                                <X className="w-3 h-3" /> Gỡ
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Phương thức xác thực</label>
                              <select value={step.ruleType} onChange={e => {
                                const updated = [...formConfigs]; const cIdx = updated.findIndex(f => f.id === selectedConfigForWorkflow);
                                const wIdx = updated[cIdx].workflow.findIndex((w: any) => w.id === step.id);
                                updated[cIdx].workflow[wIdx].ruleType = e.target.value; setFormConfigs(updated);
                              }} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500">
                                <option value="system">🏢 Trưởng bộ phận (Auto)</option>
                                <option value="user_select">👤 Người dùng chọn</option>
                                <option value="specific">🎯 Chỉ định cố định</option>
                              </select>
                            </div>
                            <div>
                              {step.ruleType === 'specific' ? (
                                <>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Thành viên phê duyệt</label>
                                  <select value={step.specificUser} onChange={e => {
                                    const updated = [...formConfigs]; const cIdx = updated.findIndex(f => f.id === selectedConfigForWorkflow);
                                    const wIdx = updated[cIdx].workflow.findIndex((w: any) => w.id === step.id);
                                    updated[cIdx].workflow[wIdx].specificUser = e.target.value; setFormConfigs(updated);
                                  }} className="mt-1 w-full border border-blue-200 rounded-lg px-3 py-2 text-xs bg-blue-50/50 font-bold text-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500">
                                    <option value="">-- Chọn thành viên --</option>
                                    <option value="Giám đốc Nhân sự">Lê Thị Tuyết (HR Director)</option>
                                    <option value="Giám đốc Điều hành">Nguyễn Văn An (CEO)</option>
                                    <option value="Kế toán trưởng">Trần Thị Bích (CFO)</option>
                                  </select>
                                </>
                              ) : (
                                <>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">SLA xử lý</label>
                                  <select value={step.sla} onChange={e => {
                                    const updated = [...formConfigs]; const cIdx = updated.findIndex(f => f.id === selectedConfigForWorkflow);
                                    const wIdx = updated[cIdx].workflow.findIndex((w: any) => w.id === step.id);
                                    updated[cIdx].workflow[wIdx].sla = e.target.value; setFormConfigs(updated);
                                  }} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500">
                                    <option value="24h">⏱ Trong 24h</option>
                                    <option value="48h">⏱ Trong 48h</option>
                                    <option value="unlimited">♾ Không giới hạn</option>
                                  </select>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-4 relative z-10 opacity-40">
                      <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-slate-500" /></div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hoàn tất → Lưu vào WorkflowHub</p>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button onClick={() => alert('Đã lưu cấu hình!')} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">Lưu cấu hình luồng duyệt</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}

      {/* Request Detail Panel */}
      <AnimatePresence>
        {selectedRequest && (
          <RequestDetailPanel
            request={selectedRequest}
            formConfig={getFormConfig(selectedRequest)}
            isAdmin={isAdmin || staffInfo?.role === 'director'}
            onClose={() => setSelectedRequest(null)}
            onSign={() => setSigningRequest(selectedRequest)}
            onPrint={() => setPrintingRequest(selectedRequest)}
            onApprove={() => { handleStatusChange(selectedRequest.id, 'approved'); setSelectedRequest((prev: any) => ({ ...prev, status: 'approved' })); }}
            onReject={() => { handleStatusChange(selectedRequest.id, 'rejected'); setSelectedRequest((prev: any) => ({ ...prev, status: 'rejected' })); }}
          />
        )}
      </AnimatePresence>

      {/* Signature Modal */}
      {signingRequest && (
        <SignatureModal
          request={signingRequest}
          onClose={() => setSigningRequest(null)}
          onSigned={(data) => { handleSigned(signingRequest.id, data); setSigningRequest(null); }}
        />
      )}

      {/* Print Preview */}
      {printingRequest && (
        <PrintPreview
          request={printingRequest}
          formConfig={getFormConfig(printingRequest)}
          onClose={() => setPrintingRequest(null)}
        />
      )}

      {/* Print Template Designer */}
      {designingTemplate && (
        <PrintTemplateDesigner
          config={designingTemplate}
          onClose={() => setDesigningTemplate(null)}
          onSave={(tmpl) => {
            setFormConfigs(prev => prev.map(f => f.id === designingTemplate.id ? { ...f, printTemplate: tmpl } : f));
            setDesigningTemplate(null);
          }}
        />
      )}

      {/* Add Request Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-sm w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-base font-bold text-slate-900">Tạo đề xuất mới</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-200"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Loại đề xuất</label>
                <select value={newRequest.subtype} onChange={e => setNewRequest({ ...newRequest, subtype: e.target.value, formData: {} })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium">
                  {Array.from(new Set(formConfigs.map(c => c.category))).map(cat => (
                    <optgroup key={cat} label={cat}>
                      {formConfigs.filter(c => c.category === cat).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Lý do / Nội dung</label>
                <textarea value={newRequest.title} onChange={e => setNewRequest({ ...newRequest, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[70px] resize-none"
                  placeholder="Mô tả ngắn gọn mục đích đề xuất..." />
              </div>
              {formConfigs.find(c => c.name === newRequest.subtype)?.fields?.length > 0 && (
                <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-3">
                  {formConfigs.find(c => c.name === newRequest.subtype)?.fields?.map((field: any) => (
                    <div key={field.id} className={field.type === 'textarea' ? 'col-span-2' : ''}>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">{field.label} {field.required && <span className="text-red-500">*</span>}</label>
                      {field.type === 'textarea' ? (
                        <textarea className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[60px] resize-none" value={newRequest.formData[field.id] || ''} onChange={e => setNewRequest({ ...newRequest, formData: { ...newRequest.formData, [field.id]: e.target.value } })} />
                      ) : field.type === 'select' ? (
                        <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" value={newRequest.formData[field.id] || ''} onChange={e => setNewRequest({ ...newRequest, formData: { ...newRequest.formData, [field.id]: e.target.value } })}>
                          <option value="">-- Chọn --</option>
                          {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input type={field.type} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" value={newRequest.formData[field.id] || ''} onChange={e => setNewRequest({ ...newRequest, formData: { ...newRequest.formData, [field.id]: e.target.value } })} />
                      )}
                    </div>
                  ))}
                </div>
              )}
              <label className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl cursor-pointer">
                <input type="checkbox" checked={newRequest.isUrgent} onChange={e => setNewRequest({ ...newRequest, isUrgent: e.target.checked })} className="w-4 h-4 rounded" />
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <div>
                  <p className="text-sm font-bold text-red-800">Yêu cầu xử lý khẩn</p>
                  <p className="text-xs text-red-600">Ưu tiên thông báo đến người phê duyệt</p>
                </div>
              </label>
            </div>
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex gap-3 justify-end shrink-0">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">Hủy</button>
              <button onClick={handleAddRequest} className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700">Gửi đề xuất</button>
            </div>
          </div>
        </div>
      )}

      {showConfigModal && editingFormConfig && (
        <FormConfigModal initialConfig={editingFormConfig} onClose={() => setShowConfigModal(false)}
          onSave={(c: any) => { setFormConfigs(prev => prev.map(f => f.id === editingFormConfig.id ? c : f)); setShowConfigModal(false); }} />
      )}
      {showTemplateGallery && (
        <TemplateGalleryModal action={templateAction} onClose={() => setShowTemplateGallery(false)}
          onSelect={(template: any) => {
            if (templateAction === 'submit_request') { setNewRequest({ ...newRequest, subtype: template.name || newRequest.subtype }); setShowAddModal(true); }
            else { setFormConfigs(prev => [...prev, { id: `F${Date.now()}`, name: template.name, category: template.category || 'Khác', isActive: true, workflow: [{ id: 1, ruleType: 'system', sla: '24h', specificUser: '' }], fields: template.fields || [], printTemplate: DEFAULT_PRINT_TEMPLATES[template.name] || DEFAULT_PRINT_TEMPLATES['Đơn xin nghỉ phép'] }]); }
            setShowTemplateGallery(false);
          }} />
      )}
    </div>
  );
}
