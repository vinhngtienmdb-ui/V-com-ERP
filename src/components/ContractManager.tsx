import React, { useState } from 'react';
import { 
 MessageSquare, Send, File, Download, Reply,
  CornerDownRight, XCircle,
 FileText, 
 Briefcase, 
 ShoppingCart, 
 FileSignature, 
 Search, 
 Plus,
 RefreshCw,
 Clock,
 CheckCircle2,
 AlertCircle,
 X,
 AlertTriangle,
 ShieldCheck,
 Check,
 PenTool,
 Key,
 Settings,
 Users,
 Trash2,
 Edit2,
 ChevronDown,
 ChevronUp,
 Copy,
 Sliders,
 Lock,
 Eye,
 Info
} from 'lucide-react';
import { Modal } from './ui/Modal';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MOCK_CONTRACTS = [
 { id: 'HDLD-001', title: 'Hợp đồng lao động - Nguyễn Văn A', type: 'labor', subtype: 'Chính thức', status: 'active', party: 'Nguyễn Văn A', expiry: '01/01/2025', value: '-', signatureStatus: 'signed', signers: [{role: 'Người sử dụng lao động', name: 'Giám đốc', status: 'signed'}, {role: 'Người lao động', name: 'Nguyễn Văn A', status: 'signed'}], file: { name: 'HDLD_NguyenVanA.docx', type: 'docx' }, comments: [ { id: 1, author: 'Nhân sự', time: '10:00 01/02', content: 'Đã cập nhật phụ lục đính kèm.' } ] },
 { id: 'HDTV-002', title: 'Hợp đồng thử việc - Trần Thái B', type: 'labor', subtype: 'Thử việc', status: 'expiring_soon', signatureStatus: 'signed', party: 'Trần Thái B', expiry: '10/05/2024', value: '-', signers: [{role: 'Người sử dụng ND', name: 'Giám đốc', status: 'signed'}, {role: 'Người lao động', name: 'Trần Thái B', status: 'signed'}], file: { name: 'HDTV_TranThaiB_v2.pdf', type: 'pdf' }, comments: [] },
 { id: 'HDMB-001', title: 'Hợp đồng mua bán thiết bị VP', type: 'sales', subtype: 'Mua bán', status: 'pending', signatureStatus: 'pending', party: 'Công ty ABC', expiry: '31/12/2024', value: '50,000,000 ₫', signers: [{role: 'Bên mua', name: 'Giám đốc', status: 'pending'}, {role: 'Bên bán', name: 'Đại diện bên bán', status: 'pending'}], file: { name: 'HDMB_ThietBi_VP.xlsx', type: 'xlsx' }, comments: [ { id: 2, author: 'Kế toán', time: '09:15 10/05', content: 'Nhờ xem lại điều khoản thanh toán mục 3.2.' } ] },
 { id: 'HDDV-001', title: 'Hợp đồng tư vấn AI', type: 'service', subtype: 'Dịch vụ', status: 'expired', signatureStatus: 'signed', party: 'AI Partner LLC', expiry: '01/02/2024', value: '120,000,000 ₫', signers: [{role: 'Bên thuê', name: 'Giám đốc', status: 'signed'}, {role: 'Bên tư vấn', name: 'AI Partner LLC', status: 'signed'}], file: { name: 'HDDV_AI_Partner.pptx', type: 'pptx' }, comments: [] }
];

export function ContractManager() {
 const [activeTab, setActiveTab] = useState('labor');
 const [contracts, setContracts] = useState(MOCK_CONTRACTS);
 const [selectedContract, setSelectedContract] = useState<any>(null);
 const [signingModalOpen, setSigningModalOpen] = useState(false);
 const [showCreateModal, setShowCreateModal] = useState(false);
 const [newComment, setNewComment] = useState('');
 const navigate = useNavigate();

 // Workflow structures for: labor, sales, service
 const [workflows, setWorkflows] = useState<any[]>([
   {
     contractType: 'labor',
     contractTypeName: 'Hợp đồng Lao động',
     steps: [
       { id: 'step-1', name: 'Nhân sự chuẩn bị và ban hành hồ sơ dự thảo', role: 'Nhân viên Hành chính Nhân sự', actionType: 'create', order: 1 },
       { id: 'step-2', name: 'Cố vấn Pháp chế kiểm tra độ chuẩn mực pháp lý', role: 'Ban Pháp Chế', actionType: 'review', order: 2 },
       { id: 'step-3', name: 'Trưởng phòng Nhân sự duyệt chuyển tiếp', role: 'Trưởng phòng HR', actionType: 'approve', order: 3 },
       { id: 'step-4', name: 'Đại diện Ban Giám Đốc đóng dấu & ký số', role: 'Tổng Giám Đốc (CEO)', actionType: 'sign', order: 4 },
       { id: 'step-5', name: 'Ứng viên nhận thư mời & ký số từ xa', role: 'Người lao động', actionType: 'sign', order: 5 }
     ],
     templates: [
       { id: 'temp-lab-01', name: 'Mẫu hợp đồng lao động không xác định thời hạn 2026', fileSize: '185 KB', version: 'v2.4', lastUpdated: '12/03/2026', requiredFields: ['{HO_TEN}', '{SO_CCCD}', '{NGAY_SINH}', '{LUONG_CO_BAN}', '{PHU_CAP}', '{VI_TRI_CONG_VIEC}', '{NGAY_BAT_DAU}'] },
       { id: 'temp-lab-02', name: 'Thỏa thuận bảo mật thông tin & sở hữu trí tuệ (NDA)', fileSize: '124 KB', version: 'v3.2', lastUpdated: '28/05/2026', requiredFields: ['{HO_TEN}', '{CONG_TY_A}', '{CS_PHAT_CO_PHAN}', '{NGAY_KY}'] },
       { id: 'temp-lab-03', name: 'Mẫu quyết định tuyển dụng và thử việc tiêu chuẩn', fileSize: '98 KB', version: 'v1.5', lastUpdated: '15/01/2026', requiredFields: ['{HO_TEN}', '{THOI_GIAN_THU_VIEC}', '{LUONG_THU_VIEC}', '{NGAY_AP_DUNG}'] }
     ],
     permissions: [
       { role: 'Ban Giám Đốc', view: true, edit: true, approve: true, sign: true },
       { role: 'Trưởng phòng HR', view: true, edit: true, approve: true, sign: false },
       { role: 'Ban Pháp Chế', view: true, edit: true, approve: true, sign: false },
       { role: 'Nhân viên HR', view: true, edit: true, approve: false, sign: false },
       { role: 'Người lao động', view: true, edit: false, approve: false, sign: true }
     ],
     securityLevel: 'high',
     allowUSB: false,
     allowSmartCA: true,
     allowSMS: true
   },
   {
     contractType: 'sales',
     contractTypeName: 'Hợp đồng Mua bán',
     steps: [
       { id: 'step-1', name: 'Nhân viên sale lên đơn hàng và biểu giá', role: 'Nhân viên Kinh doanh', actionType: 'create', order: 1 },
       { id: 'step-2', name: 'Kế toán đối soát hạn mức công nợ', role: 'Kế toán trưởng', actionType: 'approve', order: 2 },
       { id: 'step-3', name: 'Phó giám đốc duyệt chiết khấu đặc biệt', role: 'Phó Giám Đốc Kinh Doanh', actionType: 'approve', order: 3 },
       { id: 'step-4', name: 'Giám đốc ký chứng thư số USB Token đại diện', role: 'Ban Giám Đốc', actionType: 'sign', order: 4 },
       { id: 'step-5', name: 'Khách hàng đối tác ký xác nhận hóa đơn', role: 'Đại diện bên mua', actionType: 'sign', order: 5 }
     ],
     templates: [
       { id: 'temp-sl-01', name: 'Mẫu hợp đồng mua bán thiết bị văn phòng VN', fileSize: '210 KB', version: 'v3.0', lastUpdated: '20/01/2026', requiredFields: ['{TEN_BEN_MAN}', '{TEN_BEN_BAN}', '{DANH_SACH_THIET_BI}', '{GIA_TRI_HOP_DONG}', '{NGAY_BAT_DAU_TRA_GOP}'] },
       { id: 'temp-sl-02', name: 'Mẫu hợp đồng đại lý và phân phối linh kiện', fileSize: '345 KB', version: 'v1.0', lastUpdated: '02/02/2026', requiredFields: ['{TEN_DAI_LY}', '{CHIET_KHAU_TI_LE}', '{VI_TRI_KHO_BAI}'] }
     ],
     permissions: [
       { role: 'Ban Giám Đốc', view: true, edit: true, approve: true, sign: true },
       { role: 'Kế toán trưởng', view: true, edit: true, approve: true, sign: true },
       { role: 'Phó Giám Đốc Kinh Doanh', view: true, edit: true, approve: true, sign: false },
       { role: 'Nhân viên Kinh doanh', view: true, edit: true, approve: false, sign: false },
       { role: 'Đại diện bên mua', view: true, edit: false, approve: false, sign: true }
     ],
     securityLevel: 'medium',
     allowUSB: true,
     allowSmartCA: true,
     allowSMS: true
   },
   {
     contractType: 'service',
     contractTypeName: 'Hợp đồng Dịch vụ',
     steps: [
       { id: 'step-1', name: 'Quản lý dự án soạn thảo điều khoản công việc', role: 'Quản lý Dự án (PM)', actionType: 'create', order: 1 },
       { id: 'step-2', name: 'Bộ phận pháp chế thẩm định ràng buộc SLAs', role: 'BP Pháp Chế', actionType: 'review', order: 2 },
       { id: 'step-3', name: 'Đối tác ký duyệt đồng ý các điều khoản', role: 'Khách hàng/Đối tác', actionType: 'sign', order: 3 },
       { id: 'step-4', name: 'Giám đốc VComm ký số đóng dấu xác nhận', role: 'Tổng Giám Đốc (CEO)', actionType: 'sign', order: 4 }
     ],
     templates: [
       { id: 'temp-srv-01', name: 'Mẫu hợp đồng dịch vụ thuê máy Knox Cloud v4', fileSize: '320 KB', version: 'v4.1', lastUpdated: '15/02/2026', requiredFields: ['{TEN_CONG_TY_KNOX}', '{SO_LUONG_MAY}', '{SLA_HO_TRO_PHANTRAM}', '{PHI_THEO_THANG}'] }
     ],
     permissions: [
       { role: 'Tổng Giám Đốc (CEO)', view: true, edit: true, approve: true, sign: true },
       { role: 'BP Pháp Chế', view: true, edit: true, approve: true, sign: false },
       { role: 'Quản lý Dự án (PM)', view: true, edit: true, approve: false, sign: false },
       { role: 'Khách hàng/Đối tác', view: true, edit: false, approve: false, sign: true }
     ],
     securityLevel: 'high',
     allowUSB: true,
     allowSmartCA: true,
     allowSMS: false
   }
 ]);

 const [selectedWorkflowType, setSelectedWorkflowType] = useState<string>('labor');

 // Modal triggers inside configuration
 const [isAddingStepModal, setIsAddingStepModal] = useState(false);
 const [isAddingTemplateModal, setIsAddingTemplateModal] = useState(false);

 // Form states
 const [newStepName, setNewStepName] = useState('');
 const [newStepRole, setNewStepRole] = useState('Trưởng phòng HR');
 const [newStepAction, setNewStepAction] = useState<'create' | 'approve' | 'sign' | 'review'>('approve');

 const [newTempName, setNewTempName] = useState('');
 const [newTempFields, setNewTempFields] = useState('');
 const [newTempVersion, setNewTempVersion] = useState('v1.0');

 // Operational handlers
 const handleAddWorkflowStep = () => {
   if (!newStepName.trim()) return;
   
   setWorkflows(prev => prev.map(wf => {
     if (wf.contractType === selectedWorkflowType) {
       const nextOrder = wf.steps.length + 1;
       const newStepObj = {
         id: `step-${Date.now()}`,
         name: newStepName.trim(),
         role: newStepRole,
         actionType: newStepAction,
         order: nextOrder
       };
       return {
         ...wf,
         steps: [...wf.steps, newStepObj]
       };
     }
     return wf;
   }));

   setNewStepName('');
   setIsAddingStepModal(false);
 };

 const handleRemoveWorkflowStep = (stepId: string) => {
   setWorkflows(prev => prev.map(wf => {
     if (wf.contractType === selectedWorkflowType) {
       const filtered = wf.steps.filter((s: any) => s.id !== stepId);
       const reordered = filtered.map((s: any, idx: number) => ({ ...s, order: idx + 1 }));
       return {
         ...wf,
         steps: reordered
       };
     }
     return wf;
   }));
 };

 const handleMoveStep = (stepId: string, direction: 'up' | 'down') => {
   setWorkflows(prev => prev.map(wf => {
     if (wf.contractType === selectedWorkflowType) {
       const stepsCopy = [...wf.steps];
       const index = stepsCopy.findIndex((s: any) => s.id === stepId);
       if (index === -1) return wf;

       if (direction === 'up' && index > 0) {
         const temp = stepsCopy[index];
         stepsCopy[index] = stepsCopy[index - 1];
         stepsCopy[index - 1] = temp;
       } else if (direction === 'down' && index < stepsCopy.length - 1) {
         const temp = stepsCopy[index];
         stepsCopy[index] = stepsCopy[index + 1];
         stepsCopy[index + 1] = temp;
       }

       const reordered = stepsCopy.map((s: any, idx: number) => ({ ...s, order: idx + 1 }));
       return { ...wf, steps: reordered };
     }
     return wf;
   }));
 };

 const handleUpdateSecuritySettings = (field: 'securityLevel' | 'allowUSB' | 'allowSmartCA' | 'allowSMS', value: any) => {
   setWorkflows(prev => prev.map(wf => {
     if (wf.contractType === selectedWorkflowType) {
       return {
         ...wf,
         [field]: value
       };
     }
     return wf;
   }));
 };

 const handleTogglePermission = (roleName: string, permissionField: 'view' | 'edit' | 'approve' | 'sign') => {
   setWorkflows(prev => prev.map(wf => {
     if (wf.contractType === selectedWorkflowType) {
       const updatedPermissions = wf.permissions.map((p: any) => {
         if (p.role === roleName) {
           return {
             ...p,
             [permissionField]: !p[permissionField]
           };
         }
         return p;
       });
       return {
         ...wf,
         permissions: updatedPermissions
       };
     }
     return wf;
   }));
 };

 const handleAddTemplate = () => {
   if (!newTempName.trim()) return;

   const fieldsArray = newTempFields
     .split(',')
     .map(f => f.trim().toUpperCase())
     .filter(f => f.length > 0)
     .map(f => f.startsWith('{') && f.endsWith('}') ? f : `{${f}}`);

   setWorkflows(prev => prev.map(wf => {
     if (wf.contractType === selectedWorkflowType) {
       return {
         ...wf,
         templates: [
           ...wf.templates,
           {
             id: `temp-${Date.now()}`,
             name: newTempName.trim(),
             fileSize: '150 KB',
             version: newTempVersion || 'v1.0',
             lastUpdated: new Date().toLocaleDateString('vi-VN'),
             requiredFields: fieldsArray.length > 0 ? fieldsArray : ['{HO_TEN}', '{SO_CCCD}']
           }
         ]
       };
     }
     return wf;
   }));

   setNewTempName('');
   setNewTempFields('');
   setNewTempVersion('v1.0');
   setIsAddingTemplateModal(false);
 };

 const handleRemoveTemplate = (tempId: string) => {
   setWorkflows(prev => prev.map(wf => {
     if (wf.contractType === selectedWorkflowType) {
       return {
         ...wf,
         templates: wf.templates.filter((t: any) => t.id !== tempId)
       };
     }
     return wf;
   }));
 };

 const handleStatusChange = (id: string, newStatus: string) => {
   if (window.confirm('Bạn có chắc chắn muốn thực hiện hành động này?')) {
     setContracts(contracts.map(c => c.id === id ? { ...c, status: newStatus } : c));
     if (selectedContract?.id === id) {
       setSelectedContract({ ...selectedContract, status: newStatus });
     }
   }
 };

 const handleAddComment = () => {
   if (!newComment.trim() || !selectedContract) return;
   const commentObj = {
     id: Date.now(),
     author: 'Tôi (Đang đăng nhập)',
     time: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit' }),
     content: newComment.trim()
   };
   
   const updatedContracts = contracts.map(c => 
     c.id === selectedContract.id 
       ? { ...c, comments: [...(c.comments || []), commentObj] } 
       : c
   );
   
   setContracts(updatedContracts);
   setSelectedContract({ ...selectedContract, comments: [...(selectedContract.comments || []), commentObj] });
   setNewComment('');
 };

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
   {selectedContract && (
  <Modal
    isOpen={true}
    onClose={() => setSelectedContract(null)}
    maxWidth="full"
    hideFooter
    noPadding
  >
  <div className="flex flex-col h-full overflow-hidden">
 <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
 <div>
 <h3 className="text-lg font-bold text-slate-900">{selectedContract.title}</h3>
 <p className="text-xs font-mono text-slate-500 mt-0.5"><span className="uppercase font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{selectedContract.subtype || selectedContract.type}</span> • {selectedContract.id}</p>
 </div>
 <div className="flex items-center gap-2">
 {selectedContract.file && (
   <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 shadow-sm">
     <Download className="w-4 h-4" /> Tải tệp ({selectedContract.file.type})
   </button>
 )}
 <button 
 onClick={() => setSelectedContract(null)}
 className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors ml-2"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 </div>
 
 <div className="flex flex-1 overflow-hidden">
  {/* Left Panel: Document Viewer */}
  <div className="flex-1 bg-slate-100/50 border-r border-slate-200 flex flex-col relative">
    {selectedContract.file ? (
      <div className="flex-1 overflow-auto bg-[#e5e7eb] p-6 flex justify-center">
        {/* Mock Document Render */}
        <div className="bg-white w-[210mm] min-h-[297mm] shadow-sm p-[20mm]  mx-auto relative origin-top max-w-full">
           <div className="absolute top-4 right-4 bg-slate-100 text-slate-500 px-2 py-1 text-[9px] font-bold rounded uppercase">
              Preview: {selectedContract.file.name}
           </div>
           
           <div className="space-y-6 text-xs text-slate-800 leading-relaxed mt-12 font-serif">
             <h1 className="text-2xl font-bold text-center mb-8 uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br/><span className="text-lg">Độc lập - Tự do - Hạnh phúc</span></h1>
             <h2 className="text-xl font-bold text-center mt-12 mb-8">{selectedContract.title.split('-')[0].toUpperCase()}</h2>
             <p className="text-right italic">Hà Nội, ngày ... tháng ... năm ...</p>
             <p>Căn cứ các văn bản pháp luật hiện hành và sự thỏa thuận của hai bên.</p>
             <p>Hôm nay, chúng tôi gồm có:</p>
             <div className="pl-4 border-l-2 border-slate-300 space-y-2">
                <p><strong>Bên A:</strong> {selectedContract.signers?.[0]?.name || 'Công ty CP Giải pháp Công nghệ'}</p>
                <p><strong>Bên B:</strong> {selectedContract.party}</p>
             </div>
             <p>Nội dung chi tiết hợp đồng được đính kèm ở các điều khoản tiếp theo...</p>
             
             {/* Mock text repeats */}
             <div className="opacity-50 space-y-4">
                <p>Điều 1: Nội dung công việc và thời gian thực hiện. Hai bên thống nhất thực hiện theo phụ lục đính kèm, đảm bảo các tiêu chí chất lượng, kỹ thuật và tiến độ.</p>
                <p>Điều 2: Giá trị và phương thức thanh toán. Áp dụng thanh toán chuyển khoản, thời hạn không quá 5 ngày làm việc kể từ khi nhận đủ hồ sơ hợp lệ.</p>
             </div>
           </div>

        </div>
      </div>
    ) : (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
        <File className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-xs font-medium">Không có tệp đính kèm nào được tìm thấy</p>
      </div>
    )}
    
    {/* Comments Overlay Toggle */}
    
  </div>

  {/* Right Panel: Details & Comments & Actions */}
  <div className="w-[400px] shrink-0 bg-white flex flex-col">
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 space-y-6">
        
        {/* Status Box */}
        <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg">
          <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">Tình trạng hồ sơ</h4>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className={cn(
              "px-3 py-1.5 text-[9px] font-bold rounded uppercase tracking-tight inline-flex items-center gap-1.5",
              selectedContract.status === 'active' ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : 
              selectedContract.status === 'pending' ? "bg-amber-50 text-amber-600 border border-amber-200" : 
              selectedContract.status === "expiring_soon" ? "bg-orange-50 text-blue-600 border border-blue-200" :
              selectedContract.status === "returned" ? "bg-slate-100 text-slate-700 border border-slate-300" : "bg-red-50 text-red-600 border border-red-200"
              )}>
              {selectedContract.status === 'active' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {selectedContract.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
              {selectedContract.status === 'expiring_soon' && <AlertTriangle className="w-3.5 h-3.5" />}
              {selectedContract.status === "expired" || selectedContract.status === "rejected" ? <AlertCircle className="w-3.5 h-3.5" /> : null}
              {selectedContract.status === "returned" && <CornerDownRight className="w-3.5 h-3.5" />}
              {selectedContract.status === 'active' ? 'Đang có hiệu lực' : 
              selectedContract.status === 'pending' ? 'Chờ duyệt' : 
              selectedContract.status === "expiring_soon" ? "Sắp hết hạn" : selectedContract.status === "returned" ? "Bị trả lại" : selectedContract.status === "rejected" ? "Từ chối duyệt" : "Đã hết hạn"}
              </span>
            </div>

            <div className="border-t border-slate-200 pt-3">
               <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Thời hạn</p>
               <p className={cn(
                  "text-xs font-bold",
                  selectedContract.status === 'expired' ? "text-red-600" :
                  selectedContract.status === 'expiring_soon' ? "text-blue-600" : "text-slate-900"
               )}>{selectedContract.expiry}</p>
            </div>
            
            <div className="border-t border-slate-200 pt-3">
               <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Giá trị</p>
               <p className="text-[13px] font-bold text-slate-900">{selectedContract.value}</p>
            </div>
          </div>
        </div>

        {/* Action Panel for Pending */}
        {selectedContract.status === 'pending' && (
          <div className="bg-blue-50/50 p-4 border border-blue-100 rounded-lg space-y-3">
             <h4 className="text-xs font-bold uppercase text-blue-800 tracking-wider mb-2">Thao tác phê duyệt</h4>
             <button onClick={() => handleStatusChange(selectedContract.id, "active")} className="w-full px-4 py-2 bg-emerald-600 text-white rounded font-bold text-xs hover:bg-emerald-700 shadow-sm flex items-center justify-center gap-2">
               <CheckCircle2 className="w-4 h-4" /> Phê duyệt hồ sơ
             </button>
             <button onClick={() => handleStatusChange(selectedContract.id, "returned")} className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded font-bold text-xs hover:bg-slate-50 shadow-sm flex items-center justify-center gap-2">
               <CornerDownRight className="w-4 h-4" /> Trả lại / Yêu cầu sửa
             </button>
             <button onClick={() => handleStatusChange(selectedContract.id, "rejected")} className="w-full px-4 py-2 border border-red-200 text-red-600 bg-red-50 rounded font-bold text-xs hover:bg-red-100 shadow-sm flex items-center justify-center gap-2">
               <XCircle className="w-4 h-4" /> Từ chối ký
             </button>
          </div>
        )}

        {/* Progress */}
        {selectedContract.signers && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> 
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Tiến trình chữ ký số</h4>
          </div>
          <div className="p-3 space-y-3">
          {selectedContract.signers.map((signer: any, idx: number) => (
            <div key={idx} className="flex gap-3">
              <div className="w-[20px] flex flex-col items-center">
                 <div className={cn("w-2.5 h-2.5 rounded-full mt-1 shrink-0", signer.status === 'signed' ? "bg-emerald-500" : "bg-slate-300")} />
                 {idx < selectedContract.signers.length - 1 && <div className="w-[2px] h-full bg-slate-200 my-1" />}
              </div>
              <div className="pb-1">
                 <p className="text-[13px] font-bold text-slate-900">{signer.name}</p>
                 <p className="text-[9px] text-slate-500">{signer.role}</p>
                 {signer.status === 'signed' ? (
                   <span className="inline-block mt-1 text-[9px] uppercase font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Đã ký</span>
                 ) : (
                   <span className="inline-block mt-1 text-[9px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Đang chờ</span>
                 )}
              </div>
            </div>
          ))}
          </div>
          
          {selectedContract.signatureStatus === 'pending' && (
             <div className="p-3 border-t border-slate-200 bg-slate-50">
               <button 
                onClick={() => setSigningModalOpen(true)}
                className="w-full py-2 bg-primary-600 text-white rounded text-xs font-bold hover:bg-primary-700 flex items-center justify-center gap-2"
               >
                 <Key className="w-3.5 h-3.5" /> Ký số ngay
               </button>
             </div>
          )}
        </div>
        )}

      </div>
      
      {/* Comments Area */}
      <div className="border-t border-slate-200">
        <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-200">
          <h4 className="text-xs font-bold uppercase text-slate-600 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Bình luận & Góp ý ({selectedContract.comments?.length || 0})
          </h4>
        </div>
        <div className="p-4 space-y-4">
          {(selectedContract.comments || []).map((cmt: any) => (
             <div key={cmt.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100 relative group">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-slate-900">{cmt.author}</span>
                  <span className="text-[9px] text-slate-400">{cmt.time}</span>
                </div>
                <p className="text-xs text-slate-700">{cmt.content}</p>
                
                <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-opacity">
                  <Reply className="w-3 h-3" />
                </button>
             </div>
          ))}
          {(!selectedContract.comments || selectedContract.comments.length === 0) && (
            <p className="text-center justify-center py-6 text-xs text-slate-400 italic">Chưa có bình luận nào.</p>
          )}
        </div>
      </div>
      
    </div>

    {/* Comment Input */}
    <div className="p-4 border-t border-slate-200 bg-white shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
       <div className="relative">
         <textarea 
           rows={2}
           value={newComment}
           onChange={(e) => setNewComment(e.target.value)}
           placeholder="Nhập góp ý, ghi chú để yêu cầu sửa đổi..."
           className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none pr-12 bg-slate-50 focus:bg-white"
         />
         <button onClick={handleAddComment} className="absolute bottom-2 right-2 p-1.5 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors">
           <Send className="w-3.5 h-3.5" />
         </button>
       </div>
    </div>
  </div>
 </div>
  </div>
  </Modal>
 )}


 {signingModalOpen && (
  <Modal
    isOpen={true}
    onClose={() => setSigningModalOpen(false)}
    maxWidth="2xl"
    hideFooter
    noPadding
  >
 <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
 <div>
 <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
 <ShieldCheck className="w-5 h-5 text-primary-600" />
 Ký số Hợp đồng
 </h3>
 </div>
 <button 
 onClick={() => setSigningModalOpen(false)}
 className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
 title="Đóng (Esc)"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 
 <div className="p-6 space-y-5">
 <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg">
 <p className="text-xs text-blue-800 font-medium leading-relaxed">Bạn đang thực hiện ký số cho tài liệu: <br/><strong className="text-blue-900">{selectedContract?.title}</strong></p>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-800 mb-3">Chọn phương thức ký số</label>
 <div className="space-y-3">
 <label className="flex items-center gap-3 p-3 border border-primary-200 bg-primary-50/50 rounded-lg cursor-pointer hover:bg-primary-50 transition-colors">
 <input type="radio" name="signMethod" defaultChecked className="w-4 h-4 text-primary-600 border-slate-400 focus:ring-primary-600" />
 <div>
 <p className="text-[13px] font-bold text-slate-900 flex items-center gap-2">Ký số SmartCA (Viettel, VNPT) <span className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded font-bold">Khuyên dùng</span></p>
 <p className="text-xs text-slate-600 mt-0.5">Xác thực qua ứng dụng trên điện thoại thông minh.</p>
 </div>
 </label>
 <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors opacity-70">
 <input type="radio" name="signMethod" className="w-4 h-4 text-primary-600 border-slate-400 focus:ring-primary-600" />
 <div>
 <p className="text-[13px] font-bold text-slate-900">Ký bằng USB Token</p>
 <p className="text-xs text-slate-600 mt-0.5">Yêu cầu cắm USB và có phần mềm hỗ trợ (plugin).</p>
 </div>
 </label>
 </div>
 </div>
 </div>

 <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
 <button 
 onClick={() => setSigningModalOpen(false)}
 className="px-4 py-2.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
 >
 Hủy bỏ
 </button>
 <button 
 className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700 shadow-sm shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2"
 onClick={() => {
 alert(`Yêu cầu ký số đã được gửi đến thiết bị SmartCA của bạn!`);
 setSigningModalOpen(false);
 }}
 >
 <Key className="w-4 h-4" /> Xác nhận ký số
 </button>
 </div>
 </Modal>
 )}

 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-sans tracking-tight text-xl font-bold text-slate-900">Quản trị Hợp đồng</h1>
 <p className="text-xs text-slate-500 mt-1">Hợp đồng lao động, dịch vụ, mua bán và theo dõi thời hạn hợp đồng.</p>
 </div>
 <div className="flex gap-3">
 <button onClick={() => setShowCreateModal(true)} className="bg-[#111827] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 <Plus className="w-4 h-4" />
 Tạo hợp đồng mới
 </button>
 </div>
 </div>

 <div className="flex gap-6">
 {/* Sidebar */}
 <div className="w-[240px] shrink-0 space-y-1">
 {[
 { id: 'labor', label: 'Hợp đồng LĐ, Thử việc', icon: Briefcase },
 { id: 'sales', label: 'Hợp đồng Mua bán', icon: ShoppingCart },
 { id: 'service', label: 'Hợp đồng Dịch vụ', icon: FileText },
 { id: 'signature', label: 'Trình ký (e-Sign)', icon: FileSignature },
 ].map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={cn(
 "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs transition-all text-left",
 activeTab === tab.id 
 ? "bg-primary-50 text-primary-700 font-bold" 
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
 <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
 <div className="relative w-64">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
 <input 
 type="text" 
 placeholder="Tìm kiếm hợp đồng..."
 className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
 />
 </div>
 <button className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm">
 <RefreshCw className="w-4 h-4" />
 </button>
 </div>

 <div className="overflow-x-auto min-w-0 custom-scrollbar-x">
 <table className="min-w-[680px] w-full text-left border-collapse">
 <thead className="bg-slate-50 border-b border-slate-100">
 <tr>
 <th className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Mã HĐ / Tiêu đề</th>
 <th className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest w-40">Đối tác / Nhân sự</th>
 <th className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest w-32 whitespace-nowrap">Giá trị</th>
 <th className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest w-40 whitespace-nowrap text-center">Trạng thái</th>
 <th className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest w-36 whitespace-nowrap text-right">Ngày hết hạn</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {contracts.filter(doc => activeTab === 'signature' ? true : doc.type === activeTab).map(doc => (
 <tr key={doc.id} onClick={() => setSelectedContract(doc)} className="hover:bg-slate-50 transition-colors cursor-pointer">
 <td className="px-4 py-3">
 <p className="text-[13px] font-bold text-slate-900">{doc.title}</p>
 <p className="text-[9px] text-slate-600 font-bold uppercase">{doc.id}</p>
 </td>
 <td className="px-4 py-3">
 <p className="text-[13px] font-medium text-slate-900">{doc.party}</p>
 </td>
 <td className="px-4 py-3">
 <p className="text-[13px] font-bold text-slate-800">{doc.value}</p>
 </td>
 <td className="px-4 py-3 text-center">
 <span className={cn(
 "px-2.5 py-1 text-[9px] font-bold rounded-lg uppercase tracking-tight inline-flex items-center gap-1",
 doc.status === 'active' ? "bg-emerald-50 text-emerald-600" : 
 doc.status === 'pending' ? "bg-amber-50 text-amber-600" :
 doc.status === "expiring_soon" ? "bg-orange-50 text-blue-600" : doc.status === "returned" ? "bg-slate-100 text-slate-700" : "bg-red-50 text-red-600"
 )}>
 {doc.status === 'active' && <CheckCircle2 className="w-3 h-3" />}
 {doc.status === 'pending' && <Clock className="w-3 h-3" />}
 {doc.status === 'expiring_soon' && <AlertTriangle className="w-3 h-3" />}
 {doc.status === "expired" || doc.status === "rejected" ? <AlertCircle className="w-3 h-3" /> : null}
 {doc.status === "returned" && <CornerDownRight className="w-3 h-3" />}
 {doc.status === 'active' ? 'Hiệu lực' : 
 doc.status === 'pending' ? 'Chờ duyệt' : 
 doc.status === "expiring_soon" ? "Sắp hết hạn" : doc.status === "returned" ? "Trả lại" : doc.status === "rejected" ? "Từ chối" : "Hết hạn"}
 </span>
 {doc.signatureStatus && (
 <div className="mt-1.5">
 <span className={cn(
 "px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-tight inline-flex items-center gap-1",
 doc.signatureStatus === 'signed' ? "bg-slate-100 text-blue-600" : "bg-slate-100 text-slate-700"
 )}>
 <PenTool className="w-3 h-3" />
 {doc.signatureStatus === 'signed' ? 'Đã ký số' : 'Chưa ký'}
 </span>
 </div>
 )}
 </td>
 <td className="px-4 py-3 text-right">
 <p className={cn(
 "text-xs font-mono font-medium",
 doc.status === 'expired' ? "text-red-500" :
 doc.status === 'expiring_soon' ? "text-blue-600 font-bold" : "text-slate-700"
 )}>{doc.expiry}</p>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
    {showCreateModal && (
  <Modal
    isOpen={true}
    onClose={() => setShowCreateModal(false)}
    maxWidth="md"
    hideFooter
    noPadding
  >
 <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
 <h3 className="text-lg font-bold text-slate-900">Tạo hợp đồng mới</h3>
 <button onClick={() => setShowCreateModal(false)} className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors">
 <X className="w-5 h-5" />
 </button>
 </div>
 <div className="p-6 space-y-4">
 <div>
 <label className="block text-[13px] font-bold text-slate-800 mb-2">Tiêu đề hợp đồng</label>
 <input type="text" placeholder="Nhập tiêu đề..." className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" />
 </div>
 <div className="grid grid-cols-2 gap-4">
   <div>
   <label className="block text-[13px] font-bold text-slate-800 mb-2">Đối tác / Nhân sự</label>
   <input type="text" placeholder="Tên bên B..." className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" />
   </div>
   <div>
   <label className="block text-[13px] font-bold text-slate-800 mb-2">Giá trị dự kiến</label>
   <input type="text" placeholder="VD: 50,000,000 ₫" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" />
   </div>
 </div>
 <div>
  <label className="block text-[13px] font-bold text-slate-800 mb-2">Đính kèm dự thảo (docx, xlsx, pdf...)</label>
  <div className="border-2 border-dashed border-slate-300 p-6 rounded-lg flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
    <div className="bg-white p-3 rounded-full shadow-sm border border-slate-200  transition-transform mb-3">
      <File className="w-6 h-6 text-primary-600" />
    </div>
    <p className="text-xs font-bold text-slate-700">Kéo thả hoặc bấm để chọn tệp</p>
    <p className="text-xs text-slate-500 mt-1">Hỗ trợ PDF, DOCX, XLSX, PPTX (Tối đa 20MB)</p>
  </div>
 </div>
 </div>
 <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
 <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors">Hủy</button>
 <button onClick={() => { alert('Tạo hợp đồng thành công!'); setShowCreateModal(false); }} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700 transition-colors">Tạo & Trình duyệt</button>
 </div>
 </Modal>
 )}
  </div>
  </div>
  );
}