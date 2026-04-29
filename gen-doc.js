import fs from 'fs';

const newContent = `import React, { useState } from 'react';
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
  Hash,
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
  Filter
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const MOCK_DOCS = [
  { id: 'CV-2024-001', title: 'Quyết định bổ nhiệm Giám đốc Khối Vận hành', type: 'outbound', status: 'signed', date: '20/03/2024', signer: 'CEO', category: 'Quyết định', aiSummary: 'Bổ nhiệm ông Nguyễn Văn A giữ chức vụ Giám đốc Khối Vận hành từ ngày 01/04/2024.', department: 'Ban Giám đốc', urgency: 'high' },
  { id: 'CV-2024-002', title: 'Công văn từ Bộ TT&TT về an toàn thông tin', type: 'inbound', status: 'processing', date: '21/03/2024', signer: 'Bộ TT&TT', category: 'Công văn', aiSummary: 'Yêu cầu các đơn vị trực thuộc tăng cường rà soát lỗ hổng bảo mật hệ thống do các nguy cơ tấn công gia tăng.', department: 'CNTT', urgency: 'critical' },
  { id: 'QĐ-2024-05A', title: 'Quyết định ban hành nội quy công ty 2024', type: 'internal', status: 'signed', date: '22/03/2024', signer: 'CEO', category: 'Quy định', aiSummary: 'Cập nhật nội quy về thời gian làm việc, chính sách đãi ngộ, quy định trang phục cho toàn bộ cán bộ công nhân viên.', department: 'Nhân sự', urgency: 'normal' },
  { id: 'TB-2024-003', title: 'Thông báo lịch nghỉ lễ 30/4', type: 'internal', status: 'draft', date: '25/03/2024', signer: 'HR Director', category: 'Thông báo', aiSummary: 'Lịch nghỉ kỷ niệm Ngày Chiến thắng và Quốc tế Lao động kéo dài 5 ngày.', department: 'Nhân sự', urgency: 'normal' }
];

const MOCK_CATEGORIES = [
  { id: 'cat-1', name: 'Quyết định', code: 'QĐ', type: 'Nội bộ/Đi', status: 'active', desc: 'Văn bản bắt buộc thi hành' },
  { id: 'cat-2', name: 'Quy định', code: 'QuyĐ', type: 'Nội bộ', status: 'active', desc: 'Văn bản quy định nội bộ cơ quan' },
  { id: 'cat-3', name: 'Thông báo', code: 'TB', type: 'Nội bộ/Đi', status: 'active', desc: 'Văn bản truyền đạt thông tin' },
  { id: 'cat-4', name: 'Biên bản', code: 'BB', type: 'Nội bộ', status: 'active', desc: 'Văn bản ghi nhận sự việc' },
  { id: 'cat-5', name: 'Nghị định', code: 'NĐ', type: 'Đến', status: 'active', desc: 'Văn bản cấp Chính phủ' },
  { id: 'cat-6', name: 'Thông tư', code: 'TT', type: 'Đến', status: 'active', desc: 'Văn bản cấp Bộ' },
  { id: 'cat-7', name: 'Luật', code: 'L', type: 'Đến', status: 'active', desc: 'Văn bản quy phạm pháp luật' },
  { id: 'cat-8', name: 'Công văn', code: 'CV', type: 'Đến/Đi', status: 'active', desc: 'Văn bản hành chính thông thường' }
];

export function DocumentManager() {
  const [activeTab, setActiveTab] = useState('inbound');
  const [isCreatingBook, setIsCreatingBook] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const navigate = useNavigate();

  const handleDocClick = (doc: any) => {
    setSelectedDoc(doc);
  };

  const backToList = () => {
    setSelectedDoc(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="font-serif tracking-tight text-2xl font-semibold text-stone-900">Quản trị Công văn & e-Office</h1>
          <p className="text-sm text-stone-500 mt-1">Hệ thống quản lý văn bản đi/đến, áp dụng Nghị định 30/CP, ký số và tự động hóa AI.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-stone-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-50 transition-all flex items-center gap-2 text-orange-700 border-orange-200">
            <Sparkles className="w-4 h-4" />
            Soạn thảo bằng AI
          </button>
          <button className="bg-stone-900 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-stone-800 transition-all shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tạo văn bản mới
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        {!selectedDoc && (
          <div className="w-full lg:w-[240px] shrink-0 space-y-1">
            {[
              { id: 'inbound', label: 'Văn bản đến', icon: Inbox },
              { id: 'outbound', label: 'Văn bản đi', icon: Send },
              { id: 'internal', label: 'Văn bản nội bộ', icon: FileText },
              { id: 'books', label: 'Sổ văn bản', icon: BookOpen },
              { id: 'categories', label: 'Hình thức văn bản', icon: Tag },
              { id: 'config', label: 'Cấu hình & Đánh số', icon: Settings },
              { id: 'signature', label: 'Trình ký số', icon: FileSignature },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => tab.id === 'signature' ? navigate('/signature') : setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all text-left",
                  activeTab === tab.id 
                    ? "bg-[#F2F0E9] text-orange-800 font-bold" 
                    : "text-stone-600 hover:bg-stone-50 hover:text-stone-900 font-medium"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className={cn("flex-1 bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden flex flex-col", selectedDoc ? "lg:w-full" : "")}>
          
          {selectedDoc ? (
            // Document Detail View
            <div className="flex flex-col h-full fade-in animate-in duration-300">
              {/* Toolbar */}
              <div className="flex items-center justify-between p-4 border-b border-stone-100 bg-stone-50">
                <button onClick={backToList} className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm font-semibold">Quay lại danh sách</span>
                </button>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-white border border-stone-200 text-sm font-medium rounded hover:bg-stone-50 flex items-center gap-2 text-stone-600">
                    <Download className="w-4 h-4" /> Tải về
                  </button>
                  <button className="px-3 py-1.5 bg-stone-900 text-[#FAF9F5] text-sm font-medium rounded hover:bg-stone-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> {selectedDoc.type === 'inbound' ? 'Tiếp nhận xử lý' : 'Phê duyệt'}
                  </button>
                </div>
              </div>

              {/* Detail Content */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  {/* Header info */}
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={cn(
                        "px-2.5 py-1 text-[11px] font-bold rounded uppercase tracking-tight",
                        selectedDoc.type === 'inbound' ? "bg-amber-50 text-amber-600" : 
                        selectedDoc.type === 'outbound' ? "bg-[#F2F0E9] text-orange-700" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {selectedDoc.category}
                      </span>
                      {selectedDoc.urgency === 'critical' && (
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded uppercase tracking-tight bg-red-50 text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Hỏa tốc
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-stone-800">{selectedDoc.title}</h2>
                    <p className="text-sm text-stone-500 mt-2">Số KH/Ký hiệu: <span className="font-semibold text-stone-700">{selectedDoc.id}</span> • Ngày ban hành: <span className="font-semibold text-stone-700">{selectedDoc.date}</span></p>
                  </div>

                  {/* AI Summary */}
                  <div className="bg-orange-50/50 border border-orange-100 rounded-lg p-5 flex gap-4 items-start">
                    <div className="bg-orange-100 p-2 rounded-full text-orange-600 shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-orange-800 mb-1">AI Tóm tắt nội dung</h4>
                      <p className="text-sm text-stone-600 leading-relaxed">{selectedDoc.aiSummary}</p>
                    </div>
                  </div>

                  {/* Document Preview Placeholder */}
                  <div className="border border-stone-200 bg-stone-50 rounded-lg min-h-[400px] flex items-center justify-center flex-col gap-3">
                    <FileText className="w-12 h-12 text-stone-300" />
                    <p className="text-sm text-stone-500 font-medium">Bản xem trước tài liệu (PDF)</p>
                    <button className="text-sm text-orange-600 font-semibold hover:underline">Nhấn để xem toàn màn hình</button>
                  </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                  {/* Metadata */}
                  <div className="bg-white border border-stone-200 rounded-lg shadow-sm">
                    <div className="p-4 border-b border-stone-100 font-bold text-stone-800 text-sm">
                      Thông tin chung
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <p className="text-xs text-stone-500 font-medium">Người ký/Cơ quan ban hành</p>
                        <p className="text-sm font-semibold text-stone-800 mt-0.5 flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-stone-400" /> {selectedDoc.signer}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-500 font-medium">Phòng ban phụ trách</p>
                        <p className="text-sm font-semibold text-stone-800 mt-0.5">{selectedDoc.department}</p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-500 font-medium">Trạng thái xử lý</p>
                        <p className="text-sm font-semibold text-stone-800 mt-0.5 flex items-center gap-2">
                          {selectedDoc.status === 'processing' ? (
                            <><RefreshCw className="w-4 h-4 text-blue-500 animate-spin-slow" /> Đang xử lý</>
                          ) : selectedDoc.status === 'signed' ? (
                            <><CheckSquare className="w-4 h-4 text-emerald-500" /> Đã ký ban hành</>
                          ) : (
                            <><Clock className="w-4 h-4 text-amber-500" /> Bản nháp</>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Routing/Workflow */}
                  <div className="bg-white border border-stone-200 rounded-lg shadow-sm">
                    <div className="p-4 border-b border-stone-100 font-bold text-stone-800 text-sm">
                      Luân chuyển & Phê duyệt
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="flex gap-3">
                         <div className="flex flex-col items-center">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                               <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div className="w-px h-full bg-stone-200 my-1"></div>
                         </div>
                         <div className="pb-4">
                            <p className="text-sm font-bold text-stone-800">Tạo mới (Lê Văn B)</p>
                            <p className="text-xs text-stone-500">20/03/2024 09:00</p>
                         </div>
                      </div>
                      <div className="flex gap-3">
                         <div className="flex flex-col items-center">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 animate-pulse">
                               <Clock className="w-4 h-4" />
                            </div>
                            <div className="w-px h-full bg-stone-200 my-1"></div>
                         </div>
                         <div className="pb-4">
                            <p className="text-sm font-bold text-stone-800">Chờ phê duyệt (Giám đốc)</p>
                            <p className="text-xs text-stone-500">Đang chờ xử lý...</p>
                         </div>
                      </div>
                      <div className="flex gap-3">
                         <div className="flex flex-col items-center">
                            <div className="w-6 h-6 rounded-full border-2 border-stone-200 flex items-center justify-center shrink-0">
                            </div>
                         </div>
                         <div>
                            <p className="text-sm font-medium text-stone-500">Ban hành & Phân phối</p>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            // List View
            <>
              {['inbound', 'outbound', 'internal', 'signature'].includes(activeTab) && (
                <>
                  <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input 
                          type="text" 
                          placeholder="Tìm kiếm theo số KH, trích yếu..."
                          className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-orange-600"
                        />
                      </div>
                      <button className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-colors">
                        <Filter className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      <button className="p-2 text-stone-400 hover:text-stone-600 bg-white border border-stone-200 rounded-lg shadow-sm transition-colors">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-0 overflow-auto flex-1">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-[#FDFCF8] border-b border-[#F3F4F6] sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest whitespace-nowrap">Số KH/Ký hiệu</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Trích yếu</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest whitespace-nowrap">Hình thức</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest whitespace-nowrap">Ngày ban hành</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest whitespace-nowrap text-right">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F3F4F6]">
                        {MOCK_DOCS.filter(doc => doc.type === activeTab).map(doc => (
                          <tr 
                            key={doc.id} 
                            onClick={() => handleDocClick(doc)}
                            className="hover:bg-stone-50 transition-colors cursor-pointer group"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm font-bold text-[#111827] group-hover:text-orange-700 transition-colors">{doc.id}</p>
                              <p className="text-[10px] text-stone-500 font-bold uppercase mt-1 flex items-center gap-1"><UserCheck className="w-3 h-3"/> {doc.signer}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-medium text-stone-800 line-clamp-2">{doc.title}</p>
                              {doc.urgency === 'critical' && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-red-600 font-semibold mt-1">
                                  <AlertCircle className="w-3 h-3" /> Hỏa tốc
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={cn(
                                "px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-tight",
                                doc.type === 'inbound' ? "bg-amber-50 text-amber-600" : 
                                doc.type === 'outbound' ? "bg-[#F2F0E9] text-orange-700" : "bg-emerald-50 text-emerald-600"
                              )}>
                                {doc.category || 'Văn bản'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm text-stone-600">{doc.date}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                               <div className="flex justify-end">
                                  {doc.status === 'processing' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-md">
                                      <Clock className="w-3 h-3" /> Đang xử lý
                                    </span>
                                  ) : doc.status === 'signed' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md">
                                      <CheckCircle2 className="w-3 h-3" /> Đã ký
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-stone-600 bg-stone-100 border border-stone-200 rounded-md">
                                      <FileText className="w-3 h-3" /> Bản nháp
                                    </span>
                                  )}
                               </div>
                            </td>
                          </tr>
                        ))}
                        {MOCK_DOCS.filter(doc => doc.type === activeTab).length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-16 text-center text-stone-500">
                              <div className="flex flex-col items-center gap-3">
                                <Inbox className="w-10 h-10 text-stone-300" />
                                <p className="text-sm font-medium">Không có văn bản nào trong mục này.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Other tabs remain essentially unchanged, but updated styles */}
              {activeTab === 'books' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-stone-800">Quản lý Sổ văn bản</h3>
                      <p className="text-sm text-stone-500">Tạo và quản lý các sổ đăng ký văn bản đi/đến theo năm và loại hình.</p>
                    </div>
                    <button onClick={() => setIsCreatingBook(true)} className="bg-stone-900 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-stone-800">
                      <Plus className="w-4 h-4" />
                      Thêm sổ mới
                    </button>
                  </div>
                  
                  {isCreatingBook && (
                    <div className="mb-6 p-5 border border-orange-200 bg-[#F2F0E9]/50 rounded-lg animate-in fade-in slide-in-">
                      <h4 className="font-bold text-stone-800 mb-4">Tạo Sổ Văn bản mới</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">Tên Số văn bản</label>
                          <input type="text" placeholder="VD: Sổ công văn đi 2025" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-orange-600" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">Loại sổ</label>
                          <select defaultValue="inbound" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-orange-600">
                            <option value="inbound">Công văn đến</option>
                            <option value="outbound">Công văn đi</option>
                            <option value="internal">Văn bản nội bộ</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">Năm quản lý</label>
                          <input type="number" defaultValue="2024" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-orange-600" />
                        </div>
                        <div className="flex items-end gap-2">
                          <button onClick={() => setIsCreatingBook(false)} className="px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 rounded-lg border border-transparent transition-colors">Hủy</button>
                          <button onClick={() => setIsCreatingBook(false)} className="px-4 py-2 text-sm font-bold text-[#FAF9F5] bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm w-full transition-colors">Lưu & Tạo Sổ</button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { id: 'book-1', name: 'Sổ công văn đến 2024', type: 'Đến', year: 2024, currentNumber: 345, status: 'Đang mở' },
                      { id: 'book-2', name: 'Sổ công văn đi 2024', type: 'Đi', year: 2024, currentNumber: 112, status: 'Đang mở' },
                      { id: 'book-3', name: 'Sổ quyết định 2024', type: 'Nội bộ', year: 2024, currentNumber: 45, status: 'Đang mở' },
                      { id: 'book-4', name: 'Sổ công văn đến 2023', type: 'Đến', year: 2023, currentNumber: 1250, status: 'Đã khóa' },
                    ].map(book => (
                      <div key={book.id} className="border border-stone-200 rounded-lg p-4 hover:border-orange-300 transition-colors bg-white shadow-sm hover:shadow-md group">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-stone-800 group-hover:text-orange-700 transition-colors">{book.name}</h4>
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                            book.status === 'Đang mở' ? "bg-emerald-50 text-emerald-600" : "bg-stone-100 text-stone-600"
                          )}>{book.status}</span>
                        </div>
                        <div className="text-sm text-stone-500 mb-4 space-y-1">
                          <p>Loại: <span className="font-semibold text-stone-700">{book.type}</span> • Năm: <span className="font-semibold text-stone-700">{book.year}</span></p>
                          <p>Số đến hiện tại: <span className="font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">{book.currentNumber}</span></p>
                        </div>
                        <div className="flex gap-2 pt-3 border-t border-stone-100">
                          <button className="text-xs font-semibold text-orange-700 hover:text-orange-800 border-r border-stone-200 pr-3 transition-colors">Cấu hình sổ</button>
                          <button className="text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors pl-1">Khóa sổ</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'categories' && (
                <div className="p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-stone-800">Danh mục Hình thức Văn bản</h3>
                      <p className="text-sm text-stone-500">Quản lý các loại hình văn bản sử dụng trong cơ quan (Quyết định, Thông báo, Tờ trình...).</p>
                    </div>
                    <button className="bg-stone-900 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-stone-800">
                      <Plus className="w-4 h-4" />
                      Thêm hình thức
                    </button>
                  </div>
                  
                  <div className="bg-white border border-stone-200 rounded-lg overflow-hidden flex-1 shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-[#FDFCF8] border-b border-stone-200">
                        <tr>
                          <th className="px-6 py-3 text-xs font-bold text-stone-500 uppercase tracking-widest">Tên hình thức</th>
                          <th className="px-6 py-3 text-xs font-bold text-stone-500 uppercase tracking-widest">Mã (Ký hiệu)</th>
                          <th className="px-6 py-3 text-xs font-bold text-stone-500 uppercase tracking-widest">Phân loại</th>
                          <th className="px-6 py-3 text-xs font-bold text-stone-500 uppercase tracking-widest">Mô tả</th>
                          <th className="px-6 py-3 text-xs font-bold text-stone-500 uppercase tracking-widest text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {MOCK_CATEGORIES.map(cat => (
                          <tr key={cat.id} className="hover:bg-stone-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-sm font-bold text-stone-800">{cat.name}</p>
                              {cat.status === 'active' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-1.5 uppercase tracking-wider">
                                  <CheckCircle2 className="w-3 h-3" /> Đang dùng
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded mt-1.5 uppercase tracking-wider">
                                  Tạm ẩn
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-stone-100 text-stone-700 rounded text-xs font-mono font-bold tracking-wider">{cat.code}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-semibold text-stone-600 border border-stone-200 px-2 py-1 rounded-md bg-white">{cat.type}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs text-stone-500">{cat.desc}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-end gap-2">
                                <button className="p-1.5 text-stone-400 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                                <button className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'config' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-stone-800">Cấu hình Đánh số Văn bản</h3>
                    <p className="text-sm text-stone-500">Thiết lập quy tắc sinh số công văn tự động theo quy định (Ví dụ: Số/Năm/Mã-PhòngBan).</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Văn bản đi */}
                    <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Quy tắc sinh số Công văn ĐI</label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <input type="text" defaultValue="{Số thứ tự}/{Năm ban hành}/{Ký hiệu cơ quan}" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:ring-1 focus:ring-orange-600 font-mono text-stone-700" />
                            </div>
                          </div>
                          <p className="text-xs text-stone-500 mt-2 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5"/> Kết quả mẫu: <strong className="text-stone-800 bg-stone-100 px-1 py-0.5 rounded">112/2024/CV-VCOMM</strong></p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-100">
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-2">Độ dài số thứ tự</label>
                            <select defaultValue="3" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-orange-600">
                              <option value="1">Không cố định</option>
                              <option value="3">3 chữ số (001)</option>
                              <option value="4">4 chữ số (0001)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-2">Reset số theo</label>
                            <select defaultValue="year" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-orange-600">
                              <option value="year">Theo năm</option>
                              <option value="book">Theo sổ văn bản</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Văn bản đến */}
                    <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Quy tắc sinh số ĐẾN (Số tự động)</label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <input type="text" defaultValue="ĐẾN-{Số thứ tự}/{Năm ban hành}" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:ring-1 focus:ring-orange-600 font-mono text-stone-700" />
                            </div>
                          </div>
                          <p className="text-xs text-stone-500 mt-2 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5"/> Kết quả mẫu: <strong className="text-stone-800 bg-stone-100 px-1 py-0.5 rounded">ĐẾN-345/2024</strong></p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-100">
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-2">Độ dài số thứ tự</label>
                            <select defaultValue="4" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-orange-600">
                              <option value="1">Không cố định</option>
                              <option value="3">3 chữ số (001)</option>
                              <option value="4">4 chữ số (0001)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-2">Reset số theo</label>
                            <select defaultValue="year" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-orange-600">
                              <option value="year">Theo năm</option>
                              <option value="book">Theo sổ văn bản</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quyết định/Nội bộ */}
                    <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Quy tắc Quyết định/Nội bộ</label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <input type="text" defaultValue="{Số thứ tự}/QĐ-{Ký hiệu phòng ban}" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:ring-1 focus:ring-orange-600 font-mono text-stone-700" />
                            </div>
                          </div>
                          <p className="text-xs text-stone-500 mt-2 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5"/> Kết quả mẫu: <strong className="text-stone-800 bg-stone-100 px-1 py-0.5 rounded">45/QĐ-NS</strong></p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-100">
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-2">Độ dài số thứ tự</label>
                            <select defaultValue="1" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-orange-600">
                              <option value="1">Không cố định</option>
                              <option value="3">3 chữ số (001)</option>
                              <option value="4">4 chữ số (0001)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-2">Reset số theo</label>
                            <select defaultValue="year" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-orange-600">
                              <option value="year">Theo năm</option>
                              <option value="book">Theo sổ văn bản</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 flex justify-end">
                    <button className="bg-stone-900 hover:bg-stone-800 text-[#FAF9F5] px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors border border-transparent">
                      Lưu tất cả cấu hình
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
`

fs.writeFileSync('src/components/DocumentManager.tsx', newContent, 'utf-8');
