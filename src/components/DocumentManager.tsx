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
  Hash
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const MOCK_DOCS = [
  { id: 'CV-2024-001', title: 'Quyết định bổ nhiệm Giám đốc', type: 'outbound', status: 'signed', date: '2024-03-20', signer: 'CEO' },
  { id: 'CV-2024-002', title: 'Công văn từ Bộ TT&TT', type: 'inbound', status: 'processing', date: '2024-03-21', signer: 'Bộ TT&TT' }
];

export function DocumentManager() {
  const [activeTab, setActiveTab] = useState('inbound');
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="text-2xl font-semibold text-[#111827]">Quản trị Công văn & e-Office</h1>
          <p className="text-sm text-[#6B7280] mt-1">Hệ thống quản lý văn bản đi/đến, áp dụng Nghị định 30/CP, ký số và tự động hóa AI.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-[#E5E7EB] px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2 text-blue-600 border-blue-200">
            <Sparkles className="w-4 h-4" />
            Soạn thảo bằng AI
          </button>
          <button className="bg-[#111827] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tạo văn bản mới (NĐ 30)
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-[240px] shrink-0 space-y-1">
          {[
            { id: 'inbound', label: 'Văn bản đến', icon: Inbox },
            { id: 'outbound', label: 'Văn bản đi', icon: Send },
            { id: 'internal', label: 'Văn bản nội bộ', icon: FileText },
            { id: 'books', label: 'Sổ văn bản', icon: BookOpen },
            { id: 'signature', label: 'Trình ký số', icon: FileSignature },
            { id: 'config', label: 'Cấu hình Đánh số', icon: Hash },
          ].map(tab => (
             <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all text-left",
                  activeTab === tab.id 
                    ? "bg-blue-50 text-blue-700 font-bold" 
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
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
             <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm công văn..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                      <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Số KH/Ký hiệu</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Trích yếu</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Loại</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Ngày ban hành</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                   {MOCK_DOCS.filter(doc => activeTab === 'inbound' ? doc.type === 'inbound' : doc.type === 'outbound').map(doc => (
                     <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                           <p className="text-sm font-bold text-[#111827]">{doc.id}</p>
                           <p className="text-[10px] text-slate-500 font-bold uppercase">{doc.signer}</p>
                        </td>
                        <td className="px-6 py-4">
                           <p className="text-sm font-medium text-slate-800">{doc.title}</p>
                        </td>
                        <td className="px-6 py-4">
                           <span className={cn(
                             "px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-tight",
                             doc.type === 'inbound' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                           )}>
                             {doc.type === 'inbound' ? 'Văn bản đến' : 'Văn bản đi'}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <p className="text-sm text-slate-600">{doc.date}</p>
                        </td>
                     </tr>
                   ))}
                   {MOCK_DOCS.length === 0 && (
                      <tr>
                         <td colSpan={4} className="px-6 py-12 text-center text-slate-500 text-sm">
                            Không có văn bản nào trong mục này.
                         </td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>
  );
}
