import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState } from 'react';
import { 
  FileText, 
  Send, 
  Inbox, 
  BookOpen, 
  FileSignature, 
  Settings, 
  Search, 
  Plus,
  Sparkles,
  RefreshCw,
  Tag,
  Edit2,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  Download,
  Eye,
  MessageSquare,
  Clock,
  CheckSquare,
  UserCheck,
  AlertCircle,
  Filter,
  Share,
  CornerUpRight,
  ShieldCheck,
  PenTool,
  MessageCircle,
  FileBadge,
  Maximize2,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  UserCog,
  Fingerprint,
  Upload,
  X,
  Users,
  FileSpreadsheet,
  Grid3X3,
  AlignLeft,
  Image as ImageIcon,
  History,
  Link as LinkIcon
} from 'lucide-react';
import { ResizableTh } from './ui/ResizableTh';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useTableColumns, ColumnDef } from '../hooks/useTableColumns';

const MOCK_DOCS = [
  { id: 'CV-2024-001', title: 'Quyết định bổ nhiệm Giám đốc Khối Vận hành', type: 'outbound', status: 'signed', date: '20/03/2024', signer: 'CEO', category: 'Quyết định', aiSummary: 'Bổ nhiệm ông Nguyễn Văn A giữ chức vụ Giám đốc Khối Vận hành từ ngày 01/04/2024.', department: 'Ban Giám đốc', urgency: 'high', fileType: 'pdf' },
  { id: 'CV-2024-002', title: 'Công văn từ Bộ TT&TT về an toàn thông tin', type: 'inbound', status: 'processing', date: '21/03/2024', signer: 'Bộ TT&TT', category: 'Công văn', aiSummary: 'Yêu cầu các đơn vị trực thuộc tăng cường rà soát lỗ hổng bảo mật hệ thống do các nguy cơ tấn công gia tăng.', department: 'CNTT', urgency: 'critical', fileType: 'docx' },
  { id: 'QĐ-2024-05A', title: 'Quyết định ban hành nội quy công ty 2024', type: 'internal', status: 'draft', date: '22/03/2024', signer: 'CEO', category: 'Quy định', aiSummary: 'Cập nhật nội quy về thời gian làm việc, chính sách đãi ngộ, quy định trang phục cho toàn bộ cán bộ công nhân viên.', department: 'Nhân sự', urgency: 'normal', fileType: 'pdf' },
  { id: 'TB-2024-003', title: 'Danh sách nhân sự thưởng thi đua Quý 1/2024', type: 'internal', status: 'processing', date: '25/03/2024', signer: 'HR Director', category: 'Danh sách', aiSummary: 'Bảng tổng hợp chi tiết mức thưởng cho 45 cá nhân xuất sắc trong Quý 1.', department: 'Nhân sự', urgency: 'normal', fileType: 'xlsx' }
];

const MOCK_CATEGORIES = [
  { id: 'cat-1', name: 'Quyết định', code: 'QĐ', type: 'Nội bộ/Đi', status: 'active', desc: 'Văn bản bắt buộc thi hành' },
  { id: 'cat-2', name: 'Quy định', code: 'QuyĐ', type: 'Nội bộ', status: 'active', desc: 'Văn bản quy định nội bộ cơ quan' },
  { id: 'cat-3', name: 'Thông báo', code: 'TB', type: 'Nội bộ/Đi', status: 'active', desc: 'Văn bản truyền đạt thông tin' }
];

export function DocumentManager() {
  const [activeTab, setActiveTab] = useState('inbound');
  const [isCreatingBook, setIsCreatingBook] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  
  // New States for Advanced Features
  const [currentUserRole, setCurrentUserRole] = useState<'staff' | 'director' | 'archivist'>('staff');
  const [showRoutingForm, setShowRoutingForm] = useState(false);
  const [showSignForm, setShowSignForm] = useState(false);
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState('flow');
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);

  const docListCols: ColumnDef[] = [
    { id: 'id', label: 'SỐ KH/Ký hiệu', initialWidth: 150 },
    { id: 'title', label: 'Trích yếu', initialWidth: 300 },
    { id: 'type', label: 'Hình thức', initialWidth: 120 },
    { id: 'flow', label: 'Thiết lập luồng', initialWidth: 150 },
    { id: 'status', label: 'Trạng thái', initialWidth: 150 }
  ];
  const { columns: listCols, handleResize: handleListResize, getPinOffset: getListPinOffset } = useTableColumns('docList', docListCols);

  const docRolesCols: ColumnDef[] = [
    { id: 'role', label: 'Vai trò / Chức danh', initialWidth: 200 },
    { id: 'dept', label: 'Phòng ban', initialWidth: 200 },
    { id: 'perms', label: 'Quyền hạn hệ thống', initialWidth: 250 },
    { id: 'actions', label: 'Thao tác', initialWidth: 100 }
  ];
  const { columns: rolesCols, handleResize: handleRolesResize, getPinOffset: getRolesPinOffset } = useTableColumns('docRoles', docRolesCols);
  
  const navigate = useNavigate();

  const handleDocClick = (doc: any) => {
    setSelectedDoc(doc);
    setShowRoutingForm(false);
    setShowSignForm(false);
  };

  const backToList = () => {
    setSelectedDoc(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="font-serif tracking-tight text-2xl font-semibold text-slate-900">Quản trị Công văn & e-Office</h1>
          <p className="text-sm text-slate-600 mt-1">Hệ thống quản lý văn bản, áp dụng Nghị định 30/CP, ký số và luân chuyển.</p>
        </div>
        <div className="flex gap-3 items-center">
          {/* Role Toggle for Demo */}
          <div className="mr-4 flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-300">
            <UserCog className="w-4 h-4 text-slate-700" />
            <select 
              value={currentUserRole}
              onChange={(e) => setCurrentUserRole(e.target.value as any)}
              className="text-sm font-bold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer appearance-none outline-none py-0.5"
            >
              <option value="staff">Vai trò: Nhân viên / Chuyên viên</option>
              <option value="director">Vai trò: Giám đốc (Ký duyệt)</option>
              <option value="archivist">Vai trò: Văn thư</option>
            </select>
          </div>

          <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2 text-slate-800">
            <Filter className="w-4 h-4" />
            Lọc & Báo cáo
          </button>
          <button 
            onClick={() => setIsCreatingDoc(true)}
            className="bg-slate-900 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tạo văn bản mới
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Sidebar */}
        {!selectedDoc && (
          <div className="w-full lg:w-[240px] shrink-0 space-y-1">
            {[
              { id: 'inbound', label: 'Văn bản đến', icon: Inbox },
              { id: 'outbound', label: 'Văn bản đi', icon: Send },
              { id: 'internal', label: 'Văn bản nội bộ', icon: FileText },
              { id: 'books', label: 'Sổ văn bản', icon: BookOpen },
              { id: 'config', label: 'Cấu hình & Đánh số', icon: Settings },
              { id: 'signature', label: 'Trình ký số', icon: FileSignature },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => tab.id === 'signature' ? navigate('/signature') : setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all text-left",
                  activeTab === tab.id 
                    ? "bg-slate-100 text-orange-800 font-bold" 
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className={cn("flex-1 bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden flex flex-col", selectedDoc ? "lg:w-full" : "")}>
          
          {selectedDoc ? (
            // Document Detail View
            <div className="flex flex-col h-full fade-in animate-in duration-300 relative">
              {/* Toolbar specific to roles */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                <button onClick={backToList} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm font-semibold">Quay lại danh sách</span>
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setShowRoutingForm(!showRoutingForm)} className="px-3 py-1.5 bg-white border border-slate-300 text-sm font-medium rounded hover:bg-slate-50 flex items-center gap-2 text-slate-800">
                    <CornerUpRight className="w-4 h-4 text-primary-600" /> Luân chuyển
                  </button>
                  <button onClick={() => setShowSignForm(!showSignForm)} className="px-3 py-1.5 bg-white border border-slate-300 text-sm font-medium rounded hover:bg-slate-50 flex items-center gap-2 text-slate-800">
                    <PenTool className="w-4 h-4 text-emerald-600" /> Ký / Phê duyệt
                  </button>
                  {currentUserRole === 'archivist' && (
                    <button className="px-3 py-1.5 bg-orange-600 text-white text-sm font-medium rounded hover:bg-orange-700 flex items-center gap-2">
                      <Send className="w-4 h-4" /> Ban hành nhanh
                    </button>
                  )}
                </div>
              </div>

              {/* Routing Form Overlay */}
              {showRoutingForm && (
                <div className="absolute top-[65px] right-4 w-96 bg-white shadow-sm border border-slate-300 rounded-lg z-20 animate-in slide-in-from-top-2 p-5">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-200 pb-2"><Share className="w-4 h-4" /> Luân chuyển văn bản</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Người / Phòng ban nhận xử lý (Có thể chọn nhiều)</label>
                      <div className="space-y-1 max-h-48 overflow-y-auto p-2 border border-slate-300 rounded-md bg-slate-50">
                        {[
                          { id: 'bod', name: 'Ban Giám đốc', users: [{ id: 'u1', name: 'Nguyễn Văn A (Tổng GĐ)' }] },
                          { id: 'vt', name: 'Bộ phận Văn thư', users: [{ id: 'u2', name: 'Lê Văn C (Văn thư)' }] },
                          { id: 'hr', name: 'Phòng Nhân sự', users: [{ id: 'u3', name: 'Trần Thị B (Trưởng phòng)' }, { id: 'u4', name: 'Đỗ Văn D (Chuyên viên)' }] },
                          { id: 'it', name: 'Phòng CNTT', users: [] },
                        ].map(dept => (
                           <div key={dept.id} className="mb-2">
                             <label className="flex items-center gap-2 text-sm p-1.5 hover:bg-slate-100 rounded cursor-pointer font-semibold text-slate-900 border border-transparent hover:border-slate-300 transition-all">
                               <input type="checkbox" className="text-orange-600 rounded border-slate-400 w-4 h-4" />
                               {dept.name}
                             </label>
                             {dept.users.length > 0 && (
                               <div className="ml-6 mt-1 flex flex-col gap-1 border-l border-slate-300 pl-2">
                                 {dept.users.map(user => (
                                   <label key={user.id} className="flex items-center gap-2 text-sm p-1.5 hover:bg-white rounded cursor-pointer border border-transparent hover:border-slate-300 hover:shadow-sm transition-all text-slate-700">
                                     <input type="checkbox" className="text-orange-600 rounded border-slate-400 w-3.5 h-3.5" />
                                     {user.name}
                                   </label>
                                 ))}
                               </div>
                             )}
                           </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phân loại tiếp nhận</label>
                      <select className="w-full text-sm border border-slate-300 rounded-md p-2 bg-slate-50 focus:outline-none focus:border-slate-400">
                        <option>Để thi hành (Chủ trì / Xử lý chính)</option>
                        <option>Để phối hợp</option>
                        <option>Để biết / Theo dõi</option>
                        <option>Trình duyệt / Trình ký</option>
                        <option className="font-bold text-orange-700">Ban hành / Đóng dấu (Chuyển Văn thư)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Ý kiến chỉ đạo / Ghi chú</label>
                      <textarea rows={3} className="w-full text-sm border border-slate-300 rounded-md p-2 bg-slate-50 focus:outline-none focus:border-slate-400" placeholder="Nhập ý kiến hoặc yêu cầu xử lý..."></textarea>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                       <button onClick={() => setShowRoutingForm(false)} className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition">Hủy</button>
                       <button onClick={() => setShowRoutingForm(false)} className="px-4 py-1.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-md transition shadow-sm">Gửi đi</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sign Form Overlay */}
              {showSignForm && (
                <div className="absolute top-[65px] right-4 w-96 bg-white shadow-sm border border-slate-300 rounded-lg z-20 animate-in slide-in-from-top-2 p-5">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-200 pb-2"><ShieldCheck className="w-4 h-4" /> Ký & Thao tác</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Loại hình tác vụ</label>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-2 text-sm p-2 border border-slate-300 rounded cursor-pointer hover:bg-slate-50">
                          <input type="radio" name="signType" className="text-orange-600" defaultChecked /> Ký chỉ đạo
                        </label>
                        <label className="flex items-center gap-2 text-sm p-2 border border-slate-300 rounded cursor-pointer hover:bg-slate-50">
                          <input type="radio" name="signType" className="text-orange-600" /> Ký nháy
                        </label>
                        <label className="flex items-center gap-2 text-sm p-2 border border-slate-300 rounded cursor-pointer hover:bg-slate-50">
                          <input type="radio" name="signType" className="text-orange-600" /> Bút phê
                        </label>
                        {currentUserRole === 'archivist' && (
                          <label className="flex items-center gap-2 text-sm p-2 border border-orange-200 bg-orange-50 text-orange-800 rounded cursor-pointer hover:bg-orange-100 font-medium">
                            <input type="radio" name="signType" className="text-orange-600" /> Ký số Cty
                          </label>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Thiết bị ký / Chữ ký số</label>
                      <select className="w-full text-sm border border-slate-300 rounded-md p-2 bg-slate-50 focus:outline-none focus:border-slate-400">
                        <option>USB Token (VNPT CA)</option>
                        <option>Smart Sign (MobiFone)</option>
                        <option>Ký ảnh (Nội bộ)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung phê duyệt</label>
                      <textarea rows={2} className="w-full text-sm border border-slate-300 rounded-md p-2 bg-slate-50 focus:outline-none focus:border-slate-400" placeholder="Kính trình GĐ xem xét..."></textarea>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => setShowSignForm(false)} className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition">Hủy</button>
                      <button onClick={() => setShowSignForm(false)} className="px-4 py-1.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition shadow-sm flex items-center gap-1"><Fingerprint className="w-4 h-4"/> Thực hiện ký</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Detail Content */}
              <DraggableGrid className="p-4 grid grid-cols-1 xl:grid-cols-3 gap-4 flex-1 overflow-auto bg-slate-50/30" columns={3} gap={16}>
                <div className="xl:col-span-2 flex flex-col gap-4 h-[calc(100vh-200px)]">
                  {/* Header info */}
                  <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm shrink-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={cn(
                        "px-2.5 py-1 text-[11px] font-bold rounded uppercase tracking-tight",
                        selectedDoc.type === 'inbound' ? "bg-amber-50 text-amber-600" : 
                        selectedDoc.type === 'outbound' ? "bg-slate-100 text-orange-700" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {selectedDoc.category}
                      </span>
                      {selectedDoc.urgency === 'critical' && (
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded uppercase tracking-tight bg-red-50 text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Hỏa tốc
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 leading-snug">{selectedDoc.title}</h2>
                    <p className="text-sm text-slate-600 mt-2">Số/Ký hiệu: <span className="font-semibold text-slate-800">{selectedDoc.id}</span> • Ngày ban hành: <span className="font-semibold text-slate-800">{selectedDoc.date}</span></p>
                  </div>

                  {/* Advanced Document Reader Viewer */}
                  <div className="bg-slate-200/50 border border-slate-400 rounded-lg flex-1 flex flex-col overflow-hidden shadow-inner relative">
                    {/* Viewer Toolbar */}
                    <div className="bg-slate-800 text-slate-300 py-2 px-4 shadow flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono bg-slate-700 px-2 py-0.5 rounded text-white border border-slate-600 uppercase">{selectedDoc.fileType}</span>
                        <span className="text-sm font-medium truncate max-w-[200px]">{selectedDoc.title}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <button className="p-1 hover:bg-slate-700 rounded transition"><ZoomOut className="w-4 h-4" /></button>
                          <span className="text-xs font-mono w-10 text-center">100%</span>
                          <button className="p-1 hover:bg-slate-700 rounded transition"><ZoomIn className="w-4 h-4" /></button>
                        </div>
                        <div className="w-px h-4 bg-slate-600"></div>
                        <span className="text-xs font-mono">Trang 1 / 1</span>
                        <div className="w-px h-4 bg-slate-600"></div>
                        <button onClick={() => setIsViewerModalOpen(true)} className="p-1 hover:bg-slate-700 rounded text-slate-300 transition"><Maximize2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    
                    {/* Mock Document Page & Viewer */}
                    <div className={cn("flex-1 overflow-auto flex justify-center", selectedDoc.fileType === 'xlsx' ? "bg-white p-0" : "bg-slate-200 p-4 md:p-6")}>
                      {selectedDoc.fileType === 'xlsx' ? (
                        // Mock Excel Viewer
                        <div className="w-full h-full flex flex-col font-sans">
                          {/* Excel Toolbar Mock */}
                          <div className="bg-slate-50 border-b border-slate-300 p-2 flex items-center gap-4 text-xs shrink-0 select-none">
                            <div className="flex gap-2 text-slate-600 font-medium">
                              <span className="hover:bg-slate-200 px-2 py-1 rounded cursor-pointer">File</span>
                              <span className="bg-white border text-orange-700 px-2 py-1 rounded shadow-sm border-slate-300 cursor-pointer font-bold">Home</span>
                              <span className="hover:bg-slate-200 px-2 py-1 rounded cursor-pointer">Insert</span>
                              <span className="hover:bg-slate-200 px-2 py-1 rounded cursor-pointer">Data</span>
                              <span className="hover:bg-slate-200 px-2 py-1 rounded cursor-pointer">Review</span>
                              <span className="hover:bg-slate-200 px-2 py-1 rounded cursor-pointer">View</span>
                            </div>
                          </div>
                          
                          {/* Formula Bar Mock */}
                          <div className="bg-white border-b border-slate-300 px-2 py-1.5 flex items-center gap-2 text-xs shrink-0">
                             <div className="w-12 border border-slate-400 font-medium bg-slate-50 text-center py-0.5 shadow-inner">A1</div>
                             <div className="text-slate-500 italic shrink-0">fx</div>
                             <div className="flex-1 border border-slate-400 py-0.5 px-2 bg-white shadow-inner font-mono text-slate-800 break-all h-6 overflow-hidden">
                               DANH SÁCH NHÂN SỰ
                             </div>
                          </div>

                          {/* Grid Mock */}
                          <div className="flex-1 overflow-auto bg-slate-200 flex relative">
                            {/* Top row labels */}
                            <div className="absolute top-0 left-10 right-0 flex z-10 text-[11px] font-bold text-slate-700 border-b border-slate-400 h-6">
                              {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(col => (
                                <div key={col} className="w-32 bg-slate-100 border-r border-slate-400 shrink-0 flex items-center justify-center shadow-sm">{col}</div>
                              ))}
                            </div>
                            
                            <div className="pt-6 flex flex-col w-full min-w-max bg-white">
                              {Array.from({length: 15}).map((_, rowIndex) => (
                                <div key={rowIndex} className="flex h-7 border-b border-slate-300 text-xs text-slate-900">
                                  <div className="w-10 bg-slate-100 border-r border-slate-400 shrink-0 flex items-center justify-center font-semibold text-slate-600 shadow-sm sticky left-0 z-10">{rowIndex + 1}</div>
                                  
                                  {rowIndex === 0 ? (
                                    <>
                                      <div className="w-32 shrink-0 border-r border-slate-300 px-2 flex items-center font-bold bg-orange-50/50">STT</div>
                                      <div className="w-32 shrink-0 border-r border-slate-300 px-2 flex items-center font-bold bg-orange-50/50">Họ và Tên</div>
                                      <div className="w-32 shrink-0 border-r border-slate-300 px-2 flex items-center font-bold bg-orange-50/50">Phòng ban</div>
                                      <div className="w-32 shrink-0 border-r border-slate-300 px-2 flex items-center font-bold bg-orange-50/50">Mức thưởng</div>
                                      <div className="w-32 shrink-0 border-r border-slate-300 px-2 flex items-center font-bold bg-orange-50/50">Ghi chú</div>
                                      <div className="flex-1 w-full border-r border-slate-300 px-2 flex items-center"></div>
                                    </>
                                  ) : rowIndex < 5 ? (
                                    <>
                                      <div className="w-32 shrink-0 border-r border-slate-300 px-2 flex items-center text-center">{rowIndex}</div>
                                      <div className="w-32 shrink-0 border-r border-slate-300 px-2 flex items-center font-medium">Nguyễn Văn {['A','B','C','D'][rowIndex-1]}</div>
                                      <div className="w-32 shrink-0 border-r border-slate-300 px-2 flex items-center">{['Sale','Marketing','IT','HR'][rowIndex-1]}</div>
                                      <div className="w-32 shrink-0 border-r border-slate-300 px-2 flex items-center text-right text-emerald-700 font-mono">{(rowIndex * 1500000).toLocaleString()} ₫</div>
                                      <div className="w-32 shrink-0 border-r border-slate-300 px-2 flex items-center">Xuất sắc Quý 1</div>
                                      <div className="flex-1 w-full border-r border-slate-300 px-2 flex items-center"></div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-32 shrink-0 border-r border-slate-300 px-2 flex items-center"></div>
                                      <div className="w-32 shrink-0 border-r border-slate-300 px-2 flex items-center"></div>
                                      <div className="w-32 shrink-0 border-r border-slate-300 px-2 flex items-center"></div>
                                      <div className="w-32 shrink-0 border-r border-slate-300 px-2 flex items-center"></div>
                                      <div className="w-32 shrink-0 border-r border-slate-300 px-2 flex items-center"></div>
                                      <div className="flex-1 w-full border-r border-slate-300 px-2 flex items-center"></div>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Sheet Tabs */}
                          <div className="bg-slate-100 border-t border-slate-400 px-2 py-1 flex gap-1 h-8 shrink-0 text-xs font-semibold overflow-x-auto min-w-0">
                            <button className="px-4 py-1 bg-white border border-slate-400 text-orange-700 shadow-sm text-[11px] rounded flex items-center gap-1">Sheet1</button>
                            <button className="px-4 py-1 text-slate-600 hover:bg-slate-200 text-[11px] rounded flex items-center gap-1">Sheet2</button>
                            <button className="px-2 py-1 text-slate-600 hover:bg-slate-200 rounded flex items-center"><Plus className="w-3 h-3"/></button>
                          </div>
                        </div>
                      ) : (
                        // Mock PDF / Word Page
                        <div className="bg-white w-full max-w-[800px] min-h-[1000px] shadow-sm border border-slate-400 p-6 text-slate-900 font-serif relative transition-all">
                           {/* Watermark / Digital Signature Stamp mock */}
                           {selectedDoc.status === 'signed' && (
                             <div className="absolute top-12 right-12 border-2 border-red-600 text-red-600 px-3 py-2 rounded transform rotate-[-5deg] opacity-70 flex flex-col items-center max-w-[150px]">
                               <ShieldCheck className="w-6 h-6 mb-1"/>
                               <span className="text-[10px] font-bold uppercase text-center">Ký số bởi CTY CP DỊCH VỤ MDB</span>
                               <span className="text-[9px] font-mono mt-1">{selectedDoc.date}</span>
                             </div>
                           )}

                           <div className="flex justify-between items-start mb-12">
                             <div className="text-center w-48">
                               <h4 className="font-bold text-sm uppercase">CÔNG TY CỔ PHẦN MDB</h4>
                               <p className="text-xs mt-1 border-t border-slate-800 pt-1">Số: {selectedDoc.id}</p>
                             </div>
                             <div className="text-center">
                               <h4 className="font-bold text-sm uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
                               <h5 className="font-bold text-xs uppercase underline">Độc lập - Tự do - Hạnh phúc</h5>
                               <p className="text-xs italic mt-2">Hà Nội, ngày {selectedDoc.date}</p>
                             </div>
                           </div>
                           <h2 className="text-xl font-bold text-center uppercase px-6 leading-relaxed mb-6">
                             {selectedDoc.title}
                           </h2>
                           <div className="text-sm space-y-4 text-justify leading-relaxed">
                             <p>Căn cứ Luật Doanh nghiệp số 59/2020/QH14 được Quốc hội thông qua ngày 17 tháng 06 năm 2020;</p>
                             <p>Căn cứ Điều lệ tổ chức và hoạt động của Công ty Cổ phần MDB;</p>
                             <p>Căn cứ yêu cầu hoạt động và năng lực cán bộ;</p>
                             
                             {selectedDoc.fileType === 'pdf' ? (
                               <>
                                 <h3 className="font-bold pt-4">QUYẾT ĐỊNH:</h3>
                                 <p><span className="font-bold">Điều 1.</span> {selectedDoc.aiSummary}</p>
                                 <p><span className="font-bold">Điều 2.</span> Ông/bà có trách nhiệm thực hiện các nhiệm vụ được giao, tuân thủ các quy định của công ty và pháp luật hiện hành.</p>
                                 <p><span className="font-bold">Điều 3.</span> Quyết định này có hiệu lực kể từ ngày ký. Các phòng ban liên quan và cá nhân chịu trách nhiệm thi hành Quyết định này.</p>
                               </>
                             ) : (
                               <>
                                 <p className="italic">{selectedDoc.aiSummary}</p>
                                 <p>Đề nghị các phòng ban phối hợp thực hiện theo đúng nội dung trên.</p>
                               </>
                             )}
                           </div>
                           <div className="mt-16 flex justify-between">
                              <div className="w-48">
                                <h4 className="font-bold text-xs italic mb-2">Nơi nhận:</h4>
                                <p className="text-xs">- Như điều 3;</p>
                                <p className="text-xs">- Lưu: VT.</p>
                              </div>
                              <div className="w-48 text-center">
                                <h4 className="font-bold text-sm uppercase">{selectedDoc.signer}</h4>
                                {selectedDoc.status === 'signed' ? (
                                  <div className="py-2 text-blue-700">
                                     <div className="border border-blue-400 p-2 rounded-md inline-block bg-primary-50/50">
                                        <p className="text-[10px] font-bold uppercase mb-1">KÝ BỞI: CA_MDB_HANOI</p>
                                        <p className="text-[9px] font-mono">Dấu thời gian: 20/03 10:15:32</p>
                                     </div>
                                  </div>
                                ) : (
                                  <div className="h-24"></div> // empty space for signature
                                )}
                                <p className="font-bold mt-2">(Đã ký)</p>
                              </div>
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sidebar Context Panel */}
                <div className="space-y-4 flex flex-col h-[calc(100vh-200px)]">
                  
                  {/* AI Summary Block */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100/50 rounded-lg p-5 shadow-sm shrink-0">
                    <div className="flex items-center gap-2 text-orange-700 mb-2">
                      <Sparkles className="w-4 h-4" />
                      <h4 className="text-sm font-bold">AI Tóm tắt nội dung</h4>
                    </div>
                    <p className="text-sm text-slate-800 leading-relaxed font-medium">{selectedDoc.aiSummary}</p>
                  </div>

                  {/* Flow / Info Tabs */}
                  <div className="bg-white border border-slate-300 rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden">
                     {/* Mini tabs */}
                     <div className="flex border-b border-slate-200 bg-slate-50 shrink-0 overflow-x-auto">
                       <button onClick={() => setActiveDetailTab('flow')} className={cn("flex-1 py-3 px-2 text-xs justify-center font-bold flex items-center gap-1 whitespace-nowrap", activeDetailTab === 'flow' ? "text-slate-900 border-b-2 border-orange-600" : "text-slate-600 hover:bg-slate-100")}><RefreshCw className="w-3 h-3"/> Luồng xử lý</button>
                       <button onClick={() => setActiveDetailTab('versions')} className={cn("flex-1 py-3 px-2 text-xs justify-center font-bold flex items-center gap-1 whitespace-nowrap", activeDetailTab === 'versions' ? "text-slate-900 border-b-2 border-orange-600" : "text-slate-600 hover:bg-slate-100")}><History className="w-3 h-3"/> Phiên bản</button>
                       <button onClick={() => setActiveDetailTab('relations')} className={cn("flex-1 py-3 px-2 text-xs justify-center font-bold flex items-center gap-1 whitespace-nowrap", activeDetailTab === 'relations' ? "text-slate-900 border-b-2 border-orange-600" : "text-slate-600 hover:bg-slate-100")}><LinkIcon className="w-3 h-3"/> VB Liên quan</button>
                     </div>
                     
                     <div className="p-4 overflow-auto flex-1">
                        {activeDetailTab === 'flow' && (
                        <div className="space-y-6">
                          <div className="flex gap-4">
                             <div className="flex flex-col items-center">
                                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                                   <UserCheck className="w-4 h-4" />
                                </div>
                                <div className="w-0.5 h-full bg-emerald-100 my-1"></div>
                             </div>
                             <div className="pb-2">
                                <p className="text-sm font-bold text-slate-900">Soạn dự thảo & Trình ký</p>
                                <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-1"><UserCheck className="w-3 h-3"/> Lê Văn Phụ Trách</p>
                                <p className="text-[11px] text-slate-600 font-mono mt-0.5">20/03/2024 09:00</p>
                             </div>
                          </div>

                          <div className="flex gap-4">
                             <div className="flex flex-col items-center">
                                <div className="w-7 h-7 rounded-full bg-blue-100 text-primary-600 flex items-center justify-center shrink-0 border border-blue-200">
                                   <PenTool className="w-4 h-4" />
                                </div>
                                <div className="w-0.5 h-full bg-slate-100 my-1"></div>
                             </div>
                             <div className="pb-2">
                                <p className="text-sm font-bold text-slate-900 flex items-center gap-2">Ký duyệt <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-100 text-blue-700 border border-blue-200 uppercase font-bold tracking-wider">Ký chính</span></p>
                                <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-1"><UserCheck className="w-3 h-3"/> Trần Văn Sếp (Giám đốc)</p>
                                <div className="bg-slate-50 border border-slate-300 p-2 rounded-md mt-2 text-xs italic text-slate-700 border-l-2 border-l-blue-400">
                                  "Đã xem xét và đồng ý ban hành."
                                </div>
                                <p className="text-[11px] text-slate-600 font-mono mt-1">20/03/2024 10:15</p>
                             </div>
                          </div>

                          <div className="flex gap-4">
                             <div className="flex flex-col items-center">
                                <div className={cn(
                                  "w-7 h-7 rounded-full flex items-center justify-center shrink-0 border",
                                  currentUserRole === 'archivist' 
                                    ? "bg-amber-100 text-amber-600 border-amber-200 animate-pulse" 
                                    : "bg-slate-50 text-slate-500 border-slate-300"
                                )}>
                                   <FileBadge className="w-4 h-4" />
                                </div>
                             </div>
                             <div className="pb-2">
                                <p className={cn("text-sm font-bold", currentUserRole === 'archivist' ? "text-orange-600" : "text-slate-600")}>Phát hành / Đóng dấu</p>
                                <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-1"><UserCheck className="w-3 h-3"/> Bộ phận Văn thư</p>
                                {currentUserRole === 'archivist' ? (
                                  <button className="mt-2 text-xs font-bold bg-orange-600 text-white px-3 py-1.5 rounded-md hover:bg-orange-700 shadow-sm flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Thực hiện ký số pháp nhân
                                  </button>
                                ) : (
                                  <p className="text-[11px] text-slate-600 italic mt-1">Đang chờ văn thư xử lý...</p>
                                )}
                             </div>
                          </div>
                        </div>
                        )}

                        {activeDetailTab === 'versions' && (
                          <div className="space-y-4">
                            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 flex justify-between items-center">
                               <div>
                                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600"/> Phiên bản v1.2 (Hiện tại)</h4>
                                  <p className="text-xs text-slate-600 mt-1">Bởi: Trần Văn Sếp • 20/03/2024 10:15</p>
                               </div>
                               <button className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold shadow-sm hover:bg-slate-50">So sánh</button>
                            </div>
                            <div className="border border-slate-200 rounded-lg p-3 bg-white flex justify-between items-center opacity-70">
                               <div>
                                  <h4 className="text-sm font-bold text-slate-700">Phiên bản v1.1</h4>
                                  <p className="text-xs text-slate-500 mt-1">Bởi: Lê Văn Phụ Trách • 20/03/2024 09:30</p>
                               </div>
                               <button className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold shadow-sm hover:bg-slate-50">Xem</button>
                            </div>
                            <div className="border border-slate-200 rounded-lg p-3 bg-white flex justify-between items-center opacity-70">
                               <div>
                                  <h4 className="text-sm font-bold text-slate-700">Phiên bản v1.0</h4>
                                  <p className="text-xs text-slate-500 mt-1">Bởi: Lê Văn Phụ Trách • 20/03/2024 09:00</p>
                               </div>
                               <button className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold shadow-sm hover:bg-slate-50">Xem</button>
                            </div>
                          </div>
                        )}

                        {activeDetailTab === 'relations' && (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center mb-2">
                               <h4 className="text-sm font-bold text-slate-900">Văn bản liên quan</h4>
                               <button className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1"><Plus className="w-3 h-3"/> Thêm liên kết</button>
                            </div>
                            <div className="border border-slate-200 rounded-lg p-3 bg-white hover:bg-slate-50 cursor-pointer transition">
                               <div className="flex items-center justify-between">
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">Văn bản đến</span>
                                  <span className="text-xs text-slate-500">19/03/2024</span>
                               </div>
                               <p className="text-sm font-bold text-slate-900 mt-2">CV-2024-001</p>
                               <p className="text-xs text-slate-600 mt-1 line-clamp-2">Công văn từ Sở Kế hoạch Đầu tư về việc cung cấp hồ sơ năng lực.</p>
                            </div>
                            <div className="border border-slate-200 rounded-lg p-3 bg-white hover:bg-slate-50 cursor-pointer transition">
                               <div className="flex items-center justify-between">
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase">Hồ sơ</span>
                                  <span className="text-xs text-slate-500">18/03/2024</span>
                               </div>
                               <p className="text-sm font-bold text-slate-900 mt-2">HS-24-005</p>
                               <p className="text-xs text-slate-600 mt-1 line-clamp-2">Hồ sơ năng lực công ty cập nhật năm 2024.</p>
                            </div>
                          </div>
                        )}
                     </div>
                  </div>
                </div>

              </DraggableGrid>
            </div>
          ) : (
            // List View
            <>
              {['inbound', 'outbound', 'internal', 'signature'].includes(activeTab) && (
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white shrink-0">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                          type="text" 
                          placeholder="Tìm kiếm theo số KH, trích yếu..."
                          className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors">
                        <Filter className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      <button className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm transition-colors">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-0 overflow-auto flex-1">
                    <table className="w-max min-w-full text-left border-collapse whitespace-nowrap">
                      <thead className="bg-slate-50 border-b border-[#F3F4F6] sticky top-0 z-10 shadow-sm">
                        <tr>
                          <ResizableTh width={listCols.find(c => c.id === 'id')?.currentWidth} onResize={(w) => handleListResize('id', w)} isPinned={listCols.find(c => c.id === 'id')?.isPinned} pinOffset={getListPinOffset('id')} className="px-4 py-3 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">SỐ KH/Ký hiệu</ResizableTh>
                          <ResizableTh width={listCols.find(c => c.id === 'title')?.currentWidth} onResize={(w) => handleListResize('title', w)} isPinned={listCols.find(c => c.id === 'title')?.isPinned} pinOffset={getListPinOffset('title')} className="px-4 py-3 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Trích yếu</ResizableTh>
                          <ResizableTh width={listCols.find(c => c.id === 'type')?.currentWidth} onResize={(w) => handleListResize('type', w)} isPinned={listCols.find(c => c.id === 'type')?.isPinned} pinOffset={getListPinOffset('type')} className="px-4 py-3 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Hình thức</ResizableTh>
                          <ResizableTh width={listCols.find(c => c.id === 'flow')?.currentWidth} onResize={(w) => handleListResize('flow', w)} isPinned={listCols.find(c => c.id === 'flow')?.isPinned} pinOffset={getListPinOffset('flow')} className="px-4 py-3 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Thiết lập luồng</ResizableTh>
                          <ResizableTh width={listCols.find(c => c.id === 'status')?.currentWidth} onResize={(w) => handleListResize('status', w)} isPinned={listCols.find(c => c.id === 'status')?.isPinned} pinOffset={getListPinOffset('status')} className="px-4 py-3 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Trạng thái</ResizableTh>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F3F4F6]">
                        {documents.filter(doc => doc.type === activeTab).map(doc => (
                          <tr 
                            key={doc.id} 
                            onClick={() => handleDocClick(doc)}
                            className="hover:bg-slate-50 transition-colors cursor-pointer group"
                          >
                            <td className="px-4 py-3">
                              <p className="text-sm font-bold text-[#111827] group-hover:text-primary-600 transition-colors">{doc.id}</p>
                              <p className="text-[10px] text-slate-600 font-bold uppercase mt-1 flex items-center gap-1"><UserCheck className="w-3 h-3"/> {doc.signer}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-slate-900 line-clamp-2">{doc.title}</p>
                              {doc.urgency === 'critical' && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-red-600 font-semibold mt-1 bg-red-50 px-1.5 py-0.5 rounded">
                                  <AlertCircle className="w-3 h-3" /> Hỏa tốc
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn(
                                "px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-tight",
                                doc.type === 'inbound' ? "bg-amber-50 text-amber-600" : 
                                doc.type === 'outbound' ? "bg-slate-100 text-orange-700" : "bg-emerald-50 text-emerald-600"
                              )}>
                                {doc.category || 'Văn bản'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                               {/* Preview of routing to show it handles direct specific deps */}
                               <div className="flex items-center gap-2">
                                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded truncate max-w-[120px]">{doc.department}</span>
                                  <ChevronRight className="w-3 h-3 text-slate-500" />
                                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">NV Xử lý</span>
                               </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                               <div className="flex justify-end">
                                  {doc.status === 'processing' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-primary-50 border border-primary-100 rounded-md">
                                      <Clock className="w-3 h-3" /> Chờ xử lý
                                    </span>
                                  ) : doc.status === 'signed' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md">
                                      <ShieldCheck className="w-3 h-3" /> Đã duyệt/Ký
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded-md">
                                      <FileText className="w-3 h-3" /> Bản dự thảo
                                    </span>
                                  )}
                               </div>
                            </td>
                          </tr>
                        ))}
                        {documents.filter(doc => doc.type === activeTab).length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-6 text-center text-slate-600">
                              <div className="flex flex-col items-center gap-3">
                                <Inbox className="w-10 h-10 text-slate-500" />
                                <p className="text-sm font-medium">Không có văn bản nào trong mục này.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Simplified other tabs for brevity... */}
              {activeTab === 'books' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Quản lý Sổ văn bản</h3>
                      <p className="text-sm text-slate-600">Tạo và quản lý các sổ đăng ký văn bản đi/đến theo năm và loại hình.</p>
                    </div>
                  </div>
                  <DraggableGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" columns={3} gap={16}>
                    <div className="border border-slate-300 rounded-lg p-4 bg-white shadow-sm hover:shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-slate-900">Sổ công văn đến 2024</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-emerald-50 text-emerald-600">Đang mở</span>
                        </div>
                        <div className="text-sm text-slate-600 mb-4 space-y-1">
                          <p>Số đến hiện tại: <span className="font-bold text-orange-700">345</span></p>
                        </div>
                    </div>
                  </DraggableGrid>
                </div>
              )}
              {activeTab === 'config' && (
                 <div className="p-6">
                   <div className="flex justify-between items-center mb-6">
                     <div>
                       <h3 className="text-lg font-bold text-slate-900">Cấu hình hệ thống</h3>
                       <p className="text-sm text-slate-600">Quản lý sơ đồ tổ chức, phân quyền và quy trình luân chuyển.</p>
                     </div>
                     <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Thêm mới
                     </button>
                   </div>
                   
                   <div className="space-y-6">
                     <div className="bg-white border text-sm border-slate-300 rounded-lg overflow-hidden shadow-sm p-6 overflow-x-auto min-w-0">
                       <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-primary-600" /> Cấu hình vai trò & Phân quyền</h4>
                       <table className="w-max min-w-full text-left border-collapse whitespace-nowrap">
                         <thead className="bg-slate-50 border-b border-[#F3F4F6]">
                           <tr>
                             <ResizableTh width={rolesCols.find(c => c.id === 'role')?.currentWidth} onResize={(w) => handleRolesResize('role', w)} className="px-4 py-3 text-[11px] font-bold text-[#6B7280] uppercase">Vai trò / Chức danh</ResizableTh>
                             <ResizableTh width={rolesCols.find(c => c.id === 'dept')?.currentWidth} onResize={(w) => handleRolesResize('dept', w)} className="px-4 py-3 text-[11px] font-bold text-[#6B7280] uppercase">Phòng ban</ResizableTh>
                             <ResizableTh width={rolesCols.find(c => c.id === 'perms')?.currentWidth} onResize={(w) => handleRolesResize('perms', w)} className="px-4 py-3 text-[11px] font-bold text-[#6B7280] uppercase">Quyền hạn hệ thống</ResizableTh>
                             <ResizableTh width={rolesCols.find(c => c.id === 'actions')?.currentWidth} onResize={(w) => handleRolesResize('actions', w)} className="px-4 py-3 text-[11px] font-bold text-[#6B7280] uppercase text-right">Thao tác</ResizableTh>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-[#F3F4F6]">
                           <tr className="hover:bg-slate-50 transition-colors">
                             <td className="px-4 py-3 font-semibold text-slate-900">Tổng Giám đốc</td>
                             <td className="px-4 py-3 text-slate-700">Ban Giám đốc</td>
                             <td className="px-4 py-3"><span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded uppercase border border-emerald-100">Toàn quyền / Ký duyệt chính</span></td>
                             <td className="px-4 py-3 text-right">
                               <button className="text-primary-600 hover:text-blue-800 text-sm font-medium mr-3">Sửa</button>
                               <button className="text-red-600 hover:text-red-800 text-sm font-medium">Xóa</button>
                             </td>
                           </tr>
                           <tr className="hover:bg-slate-50 transition-colors">
                             <td className="px-4 py-3 font-semibold text-slate-900">Giám đốc Khối</td>
                             <td className="px-4 py-3 text-slate-700">Khối Vận hành, Kinh doanh...</td>
                             <td className="px-4 py-3"><span className="px-2.5 py-1 bg-primary-50 text-blue-700 text-[10px] font-bold rounded uppercase border border-primary-100">Ký nháy / Phê duyệt khối</span></td>
                             <td className="px-4 py-3 text-right">
                               <button className="text-primary-600 hover:text-blue-800 text-sm font-medium mr-3">Sửa</button>
                               <button className="text-red-600 hover:text-red-800 text-sm font-medium">Xóa</button>
                             </td>
                           </tr>
                           <tr className="hover:bg-slate-50 transition-colors">
                             <td className="px-4 py-3 font-semibold text-slate-900">Trưởng phòng / Trưởng bộ phận</td>
                             <td className="px-4 py-3 text-slate-700">Phòng Nhân sự, Kế toán...</td>
                             <td className="px-4 py-3"><span className="px-2.5 py-1 bg-slate-100 text-slate-800 text-[10px] font-bold rounded uppercase border border-slate-300">Điều phối / Phân công xử lý</span></td>
                             <td className="px-4 py-3 text-right">
                               <button className="text-primary-600 hover:text-blue-800 text-sm font-medium mr-3">Sửa</button>
                               <button className="text-red-600 hover:text-red-800 text-sm font-medium">Xóa</button>
                             </td>
                           </tr>
                           <tr className="hover:bg-slate-50 transition-colors">
                             <td className="px-4 py-3 font-semibold text-slate-900">Cán bộ Văn thư</td>
                             <td className="px-4 py-3 text-slate-700">Phòng Hành chính</td>
                             <td className="px-4 py-3"><span className="px-2.5 py-1 bg-orange-50 text-orange-700 text-[10px] font-bold rounded uppercase border border-orange-100">Văn thư / Cấp số / Ban hành</span></td>
                             <td className="px-4 py-3 text-right">
                               <button className="text-primary-600 hover:text-blue-800 text-sm font-medium mr-3">Sửa</button>
                               <button className="text-red-600 hover:text-red-800 text-sm font-medium">Xóa</button>
                             </td>
                           </tr>
                         </tbody>
                       </table>
                     </div>

                     <div className="bg-white border text-sm border-slate-300 rounded-lg overflow-hidden shadow-sm p-6">
                       <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-slate-600" /> Hệ thống sơ đồ phòng ban & Nhân sự</h4>
                       <div className="bg-emerald-50 text-emerald-800 p-4 rounded-lg border border-emerald-200 flex items-start gap-3">
                         <RefreshCw className="w-5 h-5 mt-0.5 text-emerald-600" />
                         <div>
                            <p className="font-bold text-sm">Đã đồng bộ với hệ thống HRM</p>
                            <p className="text-xs mt-1 text-emerald-700 leading-relaxed">Cơ cấu phòng ban, danh sách nhân sự, chức vụ được tự động đồng bộ theo thời gian thực từ phân hệ Quản trị Nguồn nhân lực (HRM). Hệ thống không yêu cầu thiết lập thủ công tại đây để tránh sai lệch dữ liệu.</p>
                         </div>
                       </div>
                     </div>

                     <div className="bg-white border text-sm border-slate-300 rounded-lg overflow-hidden shadow-sm p-6">
                       <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-slate-600" /> Cấu hình Đánh số & Hình thức văn bản</h4>
                       <p className="text-slate-600 mb-4 text-sm">Tùy biến bộ quy tắc sinh số tự động quản lý theo các hình thức văn bản, phòng ban, và biểu mẫu.</p>
                       
                       <div className="space-y-4">
                         <div className="border border-slate-300 rounded-lg p-4 bg-slate-50">
                           <div className="flex justify-between items-start mb-3">
                              <div>
                                 <h5 className="font-bold text-slate-900">Quyết định (Ban Giám đốc)</h5>
                                 <p className="text-xs text-slate-600 mt-1">Mã: QD • Reset: Mỗi năm</p>
                              </div>
                              <button className="text-xs px-3 py-1.5 font-semibold text-slate-700 border border-slate-400 rounded hover:bg-slate-100 bg-white shadow-sm transition">Chỉnh sửa</button>
                           </div>
                           <div className="flex flex-col gap-3">
                             <div className="flex gap-2 items-center">
                               <span className="text-xs font-semibold text-slate-600 w-24">Định dạng số:</span>
                               <div className="flex text-xs font-mono bg-white border border-slate-400 rounded overflow-hidden shadow-inner">
                                 <span className="px-2 py-1 bg-slate-50 border-r border-slate-300 text-slate-700" title="Tiền tố">QD</span>
                                 <span className="px-2 py-1 border-r border-slate-300 text-primary-600 font-bold bg-primary-50/30" title="Số thứ tự tự động">{`{SO_THU_TU:3}`}</span>
                                 <span className="px-2 py-1 border-r border-slate-300 text-emerald-600 bg-emerald-50/30" title="Biến Năm">{`/{NAM}`}</span>
                                 <span className="px-2 py-1 bg-slate-50 text-slate-700" title="Hậu tố">-MDB</span>
                               </div>
                             </div>
                             <div className="flex gap-2 items-center text-xs">
                               <span className="font-semibold text-slate-600 w-24">Ví dụ sinh số:</span>
                               <span className="font-mono text-slate-900 font-bold bg-slate-200/50 px-2 py-0.5 rounded">QD001/2024-MDB</span>
                             </div>
                           </div>
                         </div>
                         
                         <div className="border border-slate-300 rounded-lg p-4 bg-slate-50">
                           <div className="flex justify-between items-start mb-3">
                              <div>
                                 <h5 className="font-bold text-slate-900">Công văn nội bộ (Các phòng ban)</h5>
                                 <p className="text-xs text-slate-600 mt-1">Mã: CVNB • Reset: Mỗi tháng</p>
                              </div>
                              <button className="text-xs px-3 py-1.5 font-semibold text-slate-700 border border-slate-400 rounded hover:bg-slate-100 bg-white shadow-sm transition">Chỉnh sửa</button>
                           </div>
                           <div className="flex flex-col gap-3">
                             <div className="flex gap-2 items-center">
                               <span className="text-xs font-semibold text-slate-600 w-24">Định dạng số:</span>
                               <div className="flex text-xs font-mono bg-white border border-slate-400 rounded overflow-hidden shadow-inner">
                                 <span className="px-2 py-1 bg-slate-50 border-r border-slate-300 text-slate-700">{`CVNB`}</span>
                                 <span className="px-2 py-1 border-r border-slate-300 text-primary-600 font-bold bg-primary-50/30">{`-{SO_THU_TU:4}`}</span>
                                 <span className="px-2 py-1 border-r border-slate-300 text-emerald-600 bg-emerald-50/30">{`/{THANG}{NAM}`}</span>
                                 <span className="px-2 py-1 bg-purple-50/30 text-purple-600">{`-{MA_PHONG_BAN}`}</span>
                               </div>
                             </div>
                             <div className="flex gap-2 items-center text-xs">
                               <span className="font-semibold text-slate-600 w-24">Ví dụ sinh số:</span>
                               <span className="font-mono text-slate-900 font-bold bg-slate-200/50 px-2 py-0.5 rounded">CVNB-0042/032024-IT</span>
                             </div>
                           </div>
                         </div>

                         <button className="w-full py-3 border-2 border-dashed border-slate-400 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:text-slate-800 transition flex justify-center items-center gap-2 mt-2">
                           <Plus className="w-4 h-4" /> Thêm cấu hình đánh số & hình thức mới
                         </button>
                       </div>
                     </div>
                   </div>
                 </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Create Document Modal */}
      {isCreatingDoc && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-sm w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                Tiếp nhận / Khởi tạo văn bản
              </h2>
              <button onClick={() => setIsCreatingDoc(false)} className="text-slate-500 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)] grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-5">
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Loại văn bản</label>
                      <select className="w-full text-sm border border-slate-300 rounded-md p-2 focus:outline-none focus:border-slate-400 bg-slate-50">
                        <option value="inbound">Văn bản đến (Nhận)</option>
                        <option value="outbound">Văn bản đi (Khởi tạo)</option>
                        <option value="internal">Văn bản nội bộ</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Hình thức</label>
                      <select className="w-full text-sm border border-slate-300 rounded-md p-2 focus:outline-none focus:border-slate-400 bg-slate-50">
                        <option>Quyết định</option>
                        <option>Công văn</option>
                        <option>Tờ trình</option>
                        <option>Thông báo</option>
                      </select>
                   </div>
                 </div>
                 
                 <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Số / Ký hiệu</label>
                    <input type="text" className="w-full text-sm border border-slate-300 rounded-md p-2 focus:outline-none focus:border-slate-400" placeholder="VD: CV-2024-005" />
                 </div>
                 
                 <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Trích yếu nội dung</label>
                    <textarea rows={4} className="w-full text-sm border border-slate-300 rounded-md p-2 focus:outline-none focus:border-slate-400" placeholder="Nhập trích yếu văn bản..."></textarea>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="border border-dashed border-slate-400 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-slate-50 transition-colors hover:bg-slate-100 cursor-pointer">
                    <Upload className="w-8 h-8 text-slate-500 mb-2" />
                    <p className="text-sm font-medium text-slate-800">Kéo thả tệp hoặc chọn file</p>
                    <p className="text-xs text-slate-600 mt-1">Hỗ trợ PDF, DOCX, XLSX (Tối đa 50MB)</p>
                    <button className="mt-4 px-4 py-2 bg-white border border-slate-300 rounded-md text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm">Chọn file từ máy tính</button>
                 </div>

                 <div className="bg-orange-50/50 border border-orange-100 p-5 rounded-lg">
                    <h4 className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-2"><Users className="w-4 h-4"/> Phân công xử lý ban đầu</h4>
                    
                    <div className="space-y-4">
                       <label className="flex items-start gap-3 text-sm cursor-pointer p-2 hover:bg-orange-100/50 rounded-lg transition-colors border border-transparent hover:border-orange-200">
                         <input type="checkbox" className="mt-1 w-4 h-4 text-orange-600 rounded border-slate-400" defaultChecked />
                         <div>
                            <span className="font-bold text-slate-900">Trình Giám đốc / Tổng Giám đốc</span>
                            <p className="text-xs text-slate-600 mt-0.5">Để xem xét, phê duyệt và phân công xử lý tiếp theo</p>
                         </div>
                       </label>

                       <div className="pt-3 border-t border-orange-200/50">
                          <label className="block text-xs font-bold text-slate-800 mb-2">Hoặc chuyển trực tiếp các bộ phận/cá nhân:</label>
                          <div className="max-h-48 overflow-y-auto bg-white border border-orange-200 rounded-md p-2 space-y-1 shadow-inner">
                            {[
                              { id: 'bod', name: 'Ban Giám đốc', users: [{ id: 'u1', name: 'Nguyễn Văn A (Tổng GĐ)' }] },
                              { id: 'vt', name: 'Bộ phận Văn thư', users: [{ id: 'u2', name: 'Lê Văn C (Văn thư)' }] },
                              { id: 'hr', name: 'Phòng Nhân sự', users: [{ id: 'u3', name: 'Trần Thị B (Trưởng phòng)' }, { id: 'u4', name: 'Đỗ Văn D (Chuyên viên)' }] },
                              { id: 'it', name: 'Phòng CNTT', users: [] },
                            ].map(dept => (
                               <div key={dept.id} className="mb-2">
                                 <label className="flex items-center gap-2 text-sm p-1.5 hover:bg-slate-100 rounded cursor-pointer font-semibold text-slate-900 border border-transparent hover:border-slate-300 transition-all">
                                   <input type="checkbox" className="text-orange-600 rounded border-slate-400 w-4 h-4" />
                                   {dept.name}
                                 </label>
                                 {dept.users.length > 0 && (
                                   <div className="ml-6 mt-1 flex flex-col gap-1 border-l border-slate-300 pl-2">
                                     {dept.users.map(user => (
                                       <label key={user.id} className="flex items-center gap-2 text-sm p-1.5 hover:bg-white rounded cursor-pointer border border-transparent hover:border-slate-300 hover:shadow-sm transition-all text-slate-700">
                                         <input type="checkbox" className="text-orange-600 rounded border-slate-400 w-3.5 h-3.5" />
                                         {user.name}
                                       </label>
                                     ))}
                                   </div>
                                 )}
                               </div>
                            ))}
                          </div>
                          
                          <div className="mt-3">
                            <label className="block text-xs font-bold text-slate-700 mb-1">Phân loại tiếp nhận</label>
                            <select className="w-full text-sm border border-slate-300 rounded-md p-2 bg-slate-50 focus:outline-none focus:border-slate-400">
                              <option>Để thi hành (Chủ trì)</option>
                              <option>Để phối hợp</option>
                              <option>Để biết / Theo dõi</option>
                              <option>Trình duyệt / Trình ký</option>
                              <option className="font-bold text-orange-700">Ban hành / Đóng dấu (Chuyển Văn thư)</option>
                            </select>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
               <button onClick={() => setIsCreatingDoc(false)} className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition">Hủy bỏ</button>
               <button onClick={() => setIsCreatingDoc(false)} className="px-6 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-sm flex items-center gap-2">
                 <Send className="w-4 h-4" />
                 Khởi tạo & Luân chuyển
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Viewer Modal */}
      {isViewerModalOpen && selectedDoc && (
        <div className="fixed inset-0 bg-slate-900/90 z-[60] flex flex-col animate-in fade-in duration-200">
           <div className="flex justify-between items-center p-4 bg-slate-900 text-white shrink-0 shadow-sm border-b border-slate-800">
              <div className="flex items-center gap-3">
                 <div className="bg-slate-800 p-2 rounded"><FileText className="w-5 h-5 text-blue-400"/></div>
                 <div>
                    <h3 className="font-bold text-slate-100">{selectedDoc.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">ID: {selectedDoc.id} • PDF Viewer</p>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <button className="p-2 hover:bg-slate-800 rounded transition"><Download className="w-5 h-5" /></button>
                 <button onClick={() => setIsViewerModalOpen(false)} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"><X className="w-6 h-6" /></button>
              </div>
           </div>
           <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center bg-slate-800">
              <div className="bg-white w-full max-w-[900px] h-fit min-h-[1200px] shadow-2xl rounded p-12 text-slate-900 font-serif relative">
                 {/* Re-use mock PDF content */}
                 <div className="flex justify-between items-start mb-12">
                   <div className="text-center w-48">
                     <h4 className="font-bold text-sm uppercase">CÔNG TY CỔ PHẦN MDB</h4>
                     <p className="text-xs mt-1 border-t border-slate-800 pt-1">Số: {selectedDoc.id}</p>
                   </div>
                   <div className="text-center">
                     <h4 className="font-bold text-sm uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
                     <h5 className="font-bold text-xs uppercase underline">Độc lập - Tự do - Hạnh phúc</h5>
                     <p className="text-xs italic mt-2">Hà Nội, ngày {selectedDoc.date}</p>
                   </div>
                 </div>
                 <h2 className="text-xl font-bold text-center uppercase px-6 leading-relaxed mb-6">
                   {selectedDoc.title}
                 </h2>
                 <div className="text-sm space-y-4 text-justify leading-relaxed">
                   <p>Căn cứ Luật Doanh nghiệp số 59/2020/QH14 được Quốc hội thông qua ngày 17 tháng 06 năm 2020;</p>
                   <p>Căn cứ Điều lệ tổ chức và hoạt động của Công ty Cổ phần MDB;</p>
                   <p>Căn cứ yêu cầu hoạt động và năng lực cán bộ;</p>
                   <p className="italic bg-yellow-50 p-2 border-l-4 border-yellow-400">{selectedDoc.aiSummary}</p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
