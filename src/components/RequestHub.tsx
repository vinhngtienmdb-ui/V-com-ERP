import React, { useState } from 'react';
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
  PenTool
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const MOCK_REQUESTS = [
  { id: 'REQ-001', type: 'admin', subtype: 'Nghỉ phép', title: 'Xin nghỉ phép thường niên', requester: 'Lê Hoàng Minh', status: 'pending', date: '25/03/2024' },
  { id: 'REQ-002', type: 'finance', subtype: 'Tạm ứng', title: 'Tạm ứng công tác phí', requester: 'Nguyễn Diệu Nhi', status: 'approved', signatureStatus: 'signed', date: '24/03/2024' },
  { id: 'REQ-003', type: 'other', subtype: 'Tuyển dụng', title: 'Đề nghị tuyển dụng Marketing', requester: 'Trần B', status: 'rejected', date: '23/03/2024' },
];

export function RequestHub() {
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="text-2xl font-semibold text-[#111827]">Đề xuất, Phê duyệt & Ký số (E-Form)</h1>
          <p className="text-sm text-[#6B7280] mt-1">Cấu hình linh hoạt các loại đề xuất hành chính, tài chính, nhân sự.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/signature')}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-2"
          >
            <FileSignature className="w-4 h-4" />
            Trung tâm Ký số
          </button>
          <button className="bg-[#111827] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tạo đề xuất
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm">
           <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /> Cần tôi duyệt (Pending)</h3>
           <p className="text-2xl font-black text-slate-900 mt-2">12</p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm">
           <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2"><Send className="w-4 h-4 text-blue-500" /> Tôi gửi đi</h3>
           <p className="text-2xl font-black text-slate-900 mt-2">5</p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm">
           <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Đã duyệt (Tháng)</h3>
           <p className="text-2xl font-black text-slate-900 mt-2">142</p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm">
           <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2"><FileSignature className="w-4 h-4 text-purple-500" /> Chờ ký số</h3>
           <p className="text-2xl font-black text-slate-900 mt-2">3</p>
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
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
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
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <div className="relative w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm phiếu..."
                      className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                 </div>
                 <button className="p-2 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <RefreshCw className="w-4 h-4" />
                 </button>
              </div>

              <div className="p-0 overflow-auto">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                       <tr>
                          <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Loại / Mã phiếu</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Nội dung</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Người đề xuất</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Trạng thái</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Ngày gửi</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6]">
                       {MOCK_REQUESTS.filter(doc => activeTab === 'all' || doc.type === activeTab).map(doc => (
                         <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                               <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded inline-block mb-1">{doc.subtype}</span>
                               <p className="text-[10px] text-slate-500 font-bold uppercase">{doc.id}</p>
                            </td>
                            <td className="px-6 py-4">
                               <p className="text-sm font-medium text-slate-800">{doc.title}</p>
                            </td>
                            <td className="px-6 py-4">
                               <p className="text-sm font-bold text-slate-700">{doc.requester}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <div className="flex flex-col gap-1 items-center">
                                 <span className={cn(
                                   "px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-tight inline-flex items-center gap-1",
                                   doc.status === 'approved' ? "bg-emerald-50 text-emerald-600" : 
                                   doc.status === 'pending' ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                                 )}>
                                   {doc.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                                   {doc.status === 'pending' && <Clock className="w-3 h-3" />}
                                   {doc.status === 'rejected' && <AlertCircle className="w-3 h-3" />}
                                   {doc.status === 'approved' ? 'Đã duyệt' : doc.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                                 </span>
                                 {doc.status === 'approved' && (
                                    <span className={cn(
                                       "px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-tight inline-flex items-center gap-1",
                                       (doc as any).signatureStatus === 'signed' ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-600"
                                    )}>
                                       <FileSignature className="w-3 h-3" />
                                       {(doc as any).signatureStatus === 'signed' ? 'Đã ký số' : 'Chờ ký số'}
                                    </span>
                                 )}
                               </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <p className="text-sm text-slate-600 font-mono">{doc.date}</p>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </>
          ) : (
            <div className="p-6 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Cài đặt Cấu trúc Phiếu (E-Form)</h3>
                <p className="text-sm text-slate-500 mb-4">Tạo và chỉnh sửa các loại phiếu đề xuất để sử dụng trong tổ chức.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {name: 'Đơn xin nghỉ phép', type: 'Hành chính', levels: 2},
                    {name: 'Đề nghị công tác phí', type: 'Tài chính', levels: 3},
                    {name: 'Yêu cầu mua sắm VPP', type: 'Khác', levels: 1},
                  ].map((item, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-slate-50 relative group">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-800">{item.name}</h4>
                        <button className="text-emerald-600 invisible group-hover:visible hover:underline text-xs">Sửa</button>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">Nhóm: <span className="font-semibold text-slate-700">{item.type}</span></p>
                      <p className="text-xs text-slate-500">Luồng duyệt: <span className="font-semibold text-indigo-600">{item.levels} cấp</span></p>
                    </div>
                  ))}
                  <button className="border border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center text-slate-500 hover:text-emerald-600 hover:border-emerald-300 transition-colors bg-white">
                    <Plus className="w-6 h-6 mb-2" />
                    <span className="text-sm font-bold">Thêm loại phiếu mới</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-8">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Thiết lập Luồng phê duyệt (Approval Workflow)</h3>
                <p className="text-sm text-slate-500 mb-4">Mô phỏng cấu hình luồng duyệt mặc định cho một loại phiếu cụ thể.</p>
                
                <div className="bg-white border border-slate-200 rounded-lg p-5">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Cấu hình luồng cho phiếu</label>
                      <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 w-64 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                        <option>Đơn xin nghỉ phép</option>
                        <option>Đề nghị công tác phí</option>
                        <option>Yêu cầu mua sắm VPP</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-600">Số cấp duyệt:</span>
                      <select defaultValue="2 Cấp" className="border border-slate-200 rounded-lg px-2 py-1 text-sm bg-indigo-50 text-indigo-700 font-bold outline-none">
                        <option>1 Cấp</option>
                        <option>2 Cấp</option>
                        <option>3 Cấp</option>
                        <option>Nhiều Cấp</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Cấp duyệt 1 */}
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center shrink-0 mt-2">1</div>
                      <div className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-lg">
                        <h5 className="font-bold text-slate-800 mb-3 text-sm">Cấp duyệt 1 (Bắt buộc)</h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Quy tắc chọn người duyệt</label>
                            <select className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm bg-white">
                              <option>Theo hệ thống (Trưởng bộ phận)</option>
                              <option>Người dùng tự chọn khi tạo</option>
                              <option>Chỉ định đích danh</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Thời hạn duyệt (SLA)</label>
                            <select className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm bg-white">
                              <option>24 giờ</option>
                              <option>48 giờ</option>
                              <option>Không giới hạn</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center -my-1 text-slate-300 ml-4">
                      <div className="border-l-2 border-dashed border-slate-300 h-6"></div>
                    </div>

                    {/* Cấp duyệt 2 */}
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center shrink-0 mt-2">2</div>
                      <div className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-lg">
                        <h5 className="font-bold text-slate-800 mb-3 text-sm flex justify-between items-center">
                          Cấp duyệt 2
                          <button className="text-xs text-red-500 hover:underline">Xóa cấp duyệt</button>
                        </h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Quy tắc chọn người duyệt</label>
                            <select className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm bg-white">
                              <option>Chỉ định đích danh</option>
                              <option>Theo hệ thống (Trưởng bộ phận)</option>
                              <option>Người dùng tự chọn khi tạo</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Người duyệt cụ thể</label>
                            <select className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm bg-white">
                              <option>Nguyễn Văn A (Giám đốc NS)</option>
                              <option>Trần Thị B (Trưởng phòng)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">Hủy</button>
                    <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm">Lưu cấu hình luồng duyệt</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
