import React, { useState } from 'react';
import { Search, X, FileText, CheckSquare, DollarSign, Briefcase, Users, PlusCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface TemplateGalleryModalProps {
  onClose: () => void;
  onSelectTemplate: (template: any) => void;
  onCreateNew: () => void;
}

const CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'vang_mat', label: 'Vắng mặt' },
  { id: 'giai_trinh', label: 'Giải trình công' },
  { id: 'tai_chinh', label: 'Tài chính' },
  { id: 'hanh_chinh', label: 'Hành chính' },
  { id: 'nhan_su', label: 'Nhân sự' },
  { id: 'khac', label: 'Khác' },
];

const TEMPLATES = [
  { id: 't1', title: 'Đơn xin phép', category: 'vang_mat', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
  { id: 't2', title: 'Đi muộn/về sớm', category: 'vang_mat', icon: CheckSquare, color: 'text-purple-600', bg: 'bg-purple-100' },
  { id: 't3', title: 'Tăng ca', category: 'vang_mat', icon: Briefcase, color: 'text-teal-600', bg: 'bg-teal-100' },
  { id: 't4', title: 'Đơn giải trình công', category: 'giai_trinh', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
  { id: 't5', title: 'Đề nghị thanh toán', category: 'tai_chinh', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
  { id: 't6', title: 'Đề nghị tạm ứng', category: 'tai_chinh', icon: DollarSign, color: 'text-teal-600', bg: 'bg-teal-100' },
  { id: 't7', title: 'Đề xuất cấp văn phòng phẩm', category: 'hanh_chinh', icon: Briefcase, color: 'text-red-600', bg: 'bg-red-100' },
  { id: 't8', title: 'Đề nghị cấp danh thiếp', category: 'hanh_chinh', icon: Users, color: 'text-orange-600', bg: 'bg-orange-100' },
  { id: 't9', title: 'Đề xuất đào tạo nhân sự', category: 'nhan_su', icon: FileText, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { id: 't10', title: 'Đề xuất tuyển dụng mới', category: 'nhan_su', icon: CheckSquare, color: 'text-lime-600', bg: 'bg-lime-100' }
];

export function TemplateGalleryModal({ onClose, onSelectTemplate, onCreateNew }: TemplateGalleryModalProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = TEMPLATES.filter(t => {
    if (activeCategory !== 'all' && t.category !== activeCategory) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Group by category for display
  const groupedTemplates = CATEGORIES.slice(1).reduce((acc, cat) => {
    const items = filteredTemplates.filter(t => t.category === cat.id);
    if (items.length > 0) acc.push({ ...cat, items });
    return acc;
  }, [] as any[]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#F3F4F6] rounded-xl w-full max-w-5xl h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-white px-6 py-4 flex flex-col items-center justify-center relative border-b border-slate-300">
          <button 
            onClick={onClose} 
            className="absolute right-4 top-4 p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="text-xl font-bold text-slate-900">Mẫu yêu cầu</h2>
          <p className="text-sm text-slate-600 mb-4">Chọn một gợi ý và chỉnh sửa để tạo nhanh yêu cầu</p>
          
          <div className="w-full max-w-2xl relative">
            <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Tìm kiếm yêu cầu"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-100 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        {/* Create new bar */}
        <div className="bg-white border-b border-slate-300 px-6 py-3 flex justify-center">
          <button 
            onClick={onCreateNew}
            className="flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            Tạo yêu cầu mới
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-white border-r border-slate-300 overflow-y-auto p-4 space-y-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "w-full flex items-center px-4 py-3 rounded-lg text-sm font-semibold transition-colors text-left",
                  activeCategory === cat.id 
                    ? "bg-emerald-50 text-emerald-700" 
                    : "text-slate-800 hover:bg-slate-50"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-8 bg-[#F8F9FA]">
            {groupedTemplates.map(group => (
              <div key={group.id} className="mb-8">
                <h3 className="text-sm font-bold text-slate-900 mb-4">{group.label}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map((t: any) => (
                    <button
                      key={t.id}
                      onClick={() => onSelectTemplate(t)}
                      className="bg-white p-4 rounded-xl border border-slate-300 hover:shadow-md hover:border-emerald-200 transition-all flex items-center gap-4 text-left group"
                    >
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", t.bg, t.color)}>
                        <t.icon className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-slate-800 group-hover:text-emerald-700">{t.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            
            {groupedTemplates.length === 0 && (
              <div className="text-center text-slate-500 py-12 font-medium">
                Không tìm thấy mẫu yêu cầu nào.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
