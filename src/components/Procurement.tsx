import { useState } from 'react';
import { 
  Users, Building2, Settings, BarChart2, FileSignature, GitBranch, 
  Calculator, ShoppingCart, CreditCard, Star, FileText, ArrowLeft,
  Briefcase, Search, Filter, BadgeDollarSign, Phone, Mail, 
  Plus, Clock, CheckCircle2, AlertCircle
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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const MOCK_SUPPLIERS = [
  { id: 'SUP-001', name: 'Công ty CP Điện tử LG Việt Nam', category: 'Điện tử & Công nghệ', phone: '0901234567', email: 'sales@lg.com.vn', rating: 4.8, policies: 'Công nợ 30 ngày, Giao hàng miễn phí', status: 'active' },
  { id: 'SUP-002', name: 'Nhà phân phối Thời trang Yody', category: 'Thời trang & Phụ kiện', phone: '0987654321', email: 'contact@yody.vn', rating: 4.5, policies: 'Thanh toán trước 50%, Đổi trả trong 7 ngày', status: 'active' },
  { id: 'SUP-003', name: 'Sunhouse VN', category: 'Gia dụng & Đời sống', phone: '0911223344', email: 'partner@sunhouse.com', rating: 4.9, policies: 'Công nợ 45 ngày, Chiết khấu 5% đơn sỉ', status: 'active' },
  { id: 'SUP-004', name: 'L\'Oréal Việt Nam', category: 'Sức khỏe & Sắc đẹp', phone: '0888999777', email: 'b2b@loreal.vn', rating: 4.7, policies: 'Thanh toán ngay, Hỗ trợ marketing', status: 'active' },
  { id: 'SUP-005', name: 'Unilever Việt Nam', category: 'Gia dụng & Đời sống', phone: '19001234', email: 'sales.unilever@unilever.com', rating: 4.2, policies: 'Công nợ 60 ngày', status: 'inactive' },
];

const MOCK_PURCHASE_REQUESTS = [
  { id: 'PR-20240401', department: 'Hành chính', title: 'Đề xuất mua văn phòng phẩm Tháng 4', requester: 'Lê Hoàng Minh', value: 15500000, status: 'approved', date: '01/04/2024', itemsCount: 15 },
  { id: 'PR-20240402', department: 'IT', title: 'Trang bị 5 Laptop cho nhân sự mới', requester: 'Trần Bình', value: 125000000, status: 'pending', date: '05/04/2024', itemsCount: 1 },
  { id: 'PR-20240405', department: 'Marketing', title: 'Sản xuất quà tặng khách hàng VIP', requester: 'Nguyễn Diệu Nhi', value: 50000000, status: 'rejected', date: '10/04/2024', itemsCount: 3 },
  { id: 'PR-20240410', department: 'Sản xuất', title: 'Nhập nguyên liệu vải Cotton T5', requester: 'Phạm Tuấn', value: 350000000, status: 'approved', date: '12/04/2024', itemsCount: 10 },
];

function SupplierManagement({ onBack }: { onBack: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredSuppliers = MOCK_SUPPLIERS.filter(sup => {
    const matchesSearch = sup.name.toLowerCase().includes(searchTerm.toLowerCase()) || sup.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || sup.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(MOCK_SUPPLIERS.map(s => s.category)));

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="flex items-center justify-center p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-200"
            title="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Quản lý Nhà cung cấp</h2>
            <p className="text-xs text-slate-500 mt-0.5">Danh sách {filteredSuppliers.length} nhà cung cấp</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm theo tên ncc..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
          </div>
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="all">Tất cả ngành hàng</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-sm">
            + Thêm NCC
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Nhà cung cấp</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Ngành hàng</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Liên hệ</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Chính sách & HĐ</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-center">Đánh giá</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredSuppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                      {supplier.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer">{supplier.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{supplier.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-600 text-[11px] font-semibold">
                    {supplier.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span className="font-medium">{supplier.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span className="italic">{supplier.email}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-start gap-2 max-w-[200px]">
                    <FileText className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 leading-snug">{supplier.policies}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-bold text-slate-800">{supplier.rating}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={cn(
                    "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                    supplier.status === 'active' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                  )}>
                    {supplier.status === 'active' ? 'Đang hợp tác' : 'Tạm dừng'}
                  </span>
                </td>
              </tr>
            ))}
            {filteredSuppliers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                  <p className="text-sm font-medium">Không tìm thấy nhà cung cấp nào phù hợp.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PurchaseRequests({ onBack }: { onBack: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredRequests = MOCK_PURCHASE_REQUESTS.filter(req => {
    const matchesSearch = req.title.toLowerCase().includes(searchTerm.toLowerCase()) || req.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="flex items-center justify-center p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-200"
            title="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Phiếu Đề xuất mua hàng</h2>
            <p className="text-xs text-slate-500 mt-0.5">Quản lý các yêu cầu sắm tài sản, thiết bị, dịch vụ</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm theo tiêu đề, ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ phê duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
            </select>
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tạo Đề xuất
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border-b border-slate-100 bg-slate-50">
        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
           <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2"><FileSignature className="w-4 h-4 text-blue-500" /> Tổng phiếu</h3>
           <p className="text-2xl font-black text-slate-900 mt-2">{MOCK_PURCHASE_REQUESTS.length}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
           <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /> Chờ duyệt</h3>
           <p className="text-2xl font-black text-slate-900 mt-2">{MOCK_PURCHASE_REQUESTS.filter(r => r.status === 'pending').length}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
           <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Đã duyệt (Tháng)</h3>
           <p className="text-2xl font-black text-slate-900 mt-2">{MOCK_PURCHASE_REQUESTS.filter(r => r.status === 'approved').length}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
           <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2"><BadgeDollarSign className="w-4 h-4 text-purple-500" /> Tổng kinh phí duyệt</h3>
           <p className="text-2xl font-black text-slate-900 mt-2">{formatCurrency(MOCK_PURCHASE_REQUESTS.filter(r => r.status === 'approved').reduce((acc, curr) => acc + curr.value, 0))}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap w-[20%]">Mã Phiếu / Khối</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest min-w-[200px]">Nội dung & Người đề xuất</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-right">Dự toán / Mặt hàng</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-center">Trạng thái</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-right">Ngày gửi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredRequests.map((req) => (
              <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                   <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">{req.id}</p>
                   <span className="mt-1 inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">{req.department}</span>
                </td>
                <td className="px-6 py-4">
                   <p className="text-sm font-bold text-slate-800 cursor-pointer hover:text-blue-600 transition-colors">{req.title}</p>
                   <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5"><Users className="w-3 h-3" /> {req.requester}</p>
                </td>
                <td className="px-6 py-4 text-right">
                   <p className="text-sm font-black text-rose-600">{formatCurrency(req.value)}</p>
                   <p className="text-[10px] text-slate-500 font-medium">{req.itemsCount} Danh mục mặt hàng</p>
                </td>
                <td className="px-6 py-4 text-center">
                   <span className={cn(
                     "px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-tight inline-flex items-center gap-1",
                     req.status === 'approved' ? "bg-emerald-50 text-emerald-600" : 
                     req.status === 'pending' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                   )}>
                     {req.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                     {req.status === 'pending' && <Clock className="w-3 h-3" />}
                     {req.status === 'rejected' && <AlertCircle className="w-3 h-3" />}
                     {req.status === 'approved' ? 'Đã duyệt' : req.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                   </span>
                </td>
                <td className="px-6 py-4 text-right">
                   <p className="text-sm text-slate-600 font-mono">{req.date}</p>
                </td>
              </tr>
            ))}
            {filteredRequests.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  <FileSignature className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                  <p className="text-sm font-medium">Không tìm thấy phiếu đề xuất nào phù hợp.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
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
              <div key={gIdx} className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                  <h2 className="text-xl font-bold text-[#111827]">{group.title}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {group.items.map(item => (
                      <button 
                         key={item.id}
                         onClick={() => setActiveTab(item.id)}
                         className="bg-slate-50 border border-slate-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md hover:bg-white transition-all text-left flex gap-4 items-start group"
                      >
                         <div className={cn("p-3 rounded-lg shrink-0 transition-transform group-hover:scale-105", getColorClasses(item.color))}>
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

      {activeTab === 'sup_list' && <SupplierManagement onBack={() => setActiveTab('overview')} />}
      {activeTab === 'pur_req_form' && <PurchaseRequests onBack={() => setActiveTab('overview')} />}

      {activeTab !== 'overview' && activeTab !== 'sup_list' && activeTab !== 'pur_req_form' && (
      <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4">
        <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50">
           <button 
             onClick={() => setActiveTab('overview')} 
             className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors bg-white border border-slate-200 px-4 py-2 rounded-lg w-fit shadow-sm"
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
