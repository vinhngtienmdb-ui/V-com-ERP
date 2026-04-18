import { useState } from 'react';
import { 
  Users, Building2, Settings, BarChart2, FileSignature, GitBranch, 
  Calculator, ShoppingCart, CreditCard, Star, FileText, ArrowLeft,
  Briefcase, Search, Filter, BadgeDollarSign
} from 'lucide-react';
import { cn } from '../lib/utils';

const PURCHASING_MODULE_GROUPS = [
  {
    title: 'Đề xuất mua hàng',
    items: [
      { id: 'pur_req_form', label: 'Phiếu đề xuất mua hàng', desc: 'Tạo phiếu đề xuất mới.', icon: FileSignature, color: 'blue' },
      { id: 'pur_req_workflow', label: 'Quy trình mua hàng', desc: 'Theo dõi quy trình duyệt.', icon: GitBranch, color: 'indigo' },
      { id: 'pur_req_quote', label: 'Bảng báo giá', desc: 'So sánh & chọn báo giá.', icon: Calculator, color: 'emerald' },
      { id: 'pur_req_po', label: 'Đơn đặt hàng', desc: 'Quản lý đơn PO.', icon: ShoppingCart, color: 'orange' },
      { id: 'pur_req_partner_list', label: 'Danh sách đối tác', desc: 'Thông tin đối tác.', icon: Users, color: 'purple' },
      { id: 'pur_req_payment', label: 'Thanh toán đối tác', desc: 'Quản lý công nợ, chi trả.', icon: CreditCard, color: 'rose' },
      { id: 'pur_req_report', label: 'Báo cáo đề xuất', desc: 'Thống kê tình hình mua.', icon: BarChart2, color: 'fuchsia' },
      { id: 'pur_req_config', label: 'Thiết lập mua hàng', desc: 'Quy trình phê duyệt, hệ số.', icon: Settings, color: 'slate' }
    ]
  },
  {
    title: 'Quản lý & Đánh giá NCC',
    items: [
      { id: 'sup_list', label: 'Danh sách NCC', desc: 'Quản lý NCC tiềm năng.', icon: Building2, color: 'blue' },
      { id: 'sup_eval', label: 'Đánh giá NCC', desc: 'Chấm điểm & xếp hạng.', icon: Star, color: 'emerald' },
      { id: 'sup_contract', label: 'Quản lý hợp đồng NCC', desc: 'Hồ sơ pháp lý, HĐ.', icon: FileText, color: 'indigo' },
      { id: 'sup_config', label: 'Thiết lập NCC', desc: 'Config quy tắc.', icon: Settings, color: 'slate' },
    ]
  }
];

function getColorClasses(color: string) {
  switch (color) {
    case 'blue': return 'bg-blue-50 text-blue-600';
    case 'orange': return 'bg-orange-50 text-orange-600';
    case 'indigo': return 'bg-indigo-50 text-indigo-600';
    case 'purple': return 'bg-purple-50 text-purple-600';
    case 'emerald': return 'bg-emerald-50 text-emerald-600';
    case 'fuchsia': return 'bg-fuchsia-50 text-fuchsia-600';
    case 'rose': return 'bg-rose-50 text-rose-600';
    case 'slate':
    default: return 'bg-slate-50 text-slate-600';
  }
}

export function Procurement() {
  const [activeTab, setActiveTab] = useState<string>('overview');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="text-2xl font-semibold text-[#111827]">Mua hàng & Nhà cung cấp</h1>
          <p className="text-sm text-[#6B7280] mt-1">Quản lý quy trình mua sắm, đề xuất và đánh giá NCC.</p>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="space-y-12 bg-transparent mt-4">
            {PURCHASING_MODULE_GROUPS.map((group, gIdx) => (
              <div key={gIdx} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                  <h2 className="text-xl font-bold text-[#111827]">{group.title}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {group.items.map(item => (
                      <button 
                         key={item.id}
                         onClick={() => setActiveTab(item.id)}
                         className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md hover:bg-white transition-all text-left flex gap-4 items-start group"
                      >
                         <div className={cn("p-3 rounded-xl shrink-0 transition-transform group-hover:scale-105", getColorClasses(item.color))}>
                            <item.icon className="w-6 h-6" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-[#111827] mb-1">{item.label}</h3>
                            <p className="text-xs text-slate-500 leading-relaxed mb-3">{item.desc}</p>
                         </div>
                      </button>
                   ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab !== 'overview' && (
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4">
        <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50">
           <button 
             onClick={() => setActiveTab('overview')} 
             className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors bg-white border border-slate-200 px-4 py-2 rounded-xl w-fit shadow-sm"
           >
              <ArrowLeft className="w-4 h-4" /> Quay lại Giao diện chung
           </button>
        </div>
        
        <div className="p-16 flex flex-col items-center justify-center text-center">
             <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <ShoppingCart className="w-10 h-10 text-blue-500" />
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">Phân hệ: {activeTab}</h3>
             <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                Tính năng này đang trong quá trình phát triển chi tiết cho phân hệ Mua hàng.
             </p>
        </div>
      </div>
      )}
    </div>
  );
}
