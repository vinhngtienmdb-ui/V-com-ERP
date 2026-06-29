import { DraggableGrid } from './ui/DraggableGrid';
import { useState, useEffect } from 'react';
import { 
  Users, Building2, Settings, BarChart2, FileSignature, GitBranch, 
  Calculator, ShoppingCart, CreditCard, Star, FileText, ArrowLeft,
  Briefcase, Search, Filter, BadgeDollarSign, Phone, Mail, 
  Plus, Clock, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { syncVendorToMisa, syncTransactionToMisa } from '../services/misaService';
import axios from 'axios';

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
 case 'blue': return 'bg-slate-100 text-orange-700';
 case 'orange': return 'bg-orange-50 text-orange-600';
 case 'indigo': return 'bg-primary-50 text-primary-600';
 case 'purple': return 'bg-purple-50 text-purple-600';
 case 'emerald': return 'bg-emerald-50 text-emerald-600';
 case 'fuchsia': return 'bg-fuchsia-50 text-fuchsia-600';
 case 'rose': return 'bg-rose-50 text-rose-600';
 case 'slate':
 default: return 'bg-slate-50 text-slate-700';
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
 const [syncedSuppliers, setSyncedSuppliers] = useState<Record<string, boolean>>({});
 const [syncingSupplierId, setSyncingSupplierId] = useState<string | null>(null);

 const handleSyncSupplier = async (sup: any) => {
   setSyncingSupplierId(sup.id);
   try {
      await syncVendorToMisa(sup.id, sup.name, '', sup.phone, sup.email);
      setSyncedSuppliers(prev => ({ ...prev, [sup.id]: true }));
    } catch (err) {
      console.error('Failed to sync supplier to MISA:', err);
      alert('Có lỗi xảy ra khi ghi sổ nhà cung cấp.');
    } finally {
      setSyncingSupplierId(null);
    }
 };

 const filteredSuppliers = MOCK_SUPPLIERS.filter(sup => {
 const matchesSearch = sup.name.toLowerCase().includes(searchTerm.toLowerCase()) || sup.id.toLowerCase().includes(searchTerm.toLowerCase());
 const matchesCategory = categoryFilter === 'all' || sup.category === categoryFilter;
 return matchesSearch && matchesCategory;
 });

 const categories = Array.from(new Set(MOCK_SUPPLIERS.map(s => s.category)));

 return (
 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden mt-4 animate-in fade-in slide-in- duration-500">
 <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50/50">
 <div className="flex items-center gap-4">
 <button 
 onClick={onBack} 
 className="flex items-center justify-center p-2 text-slate-500 hover:text-primary-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-300"
 title="Quay lại"
 >
 <ArrowLeft className="w-5 h-5" />
 </button>
 <div>
 <h2 className="text-lg font-bold text-slate-900">Quản lý Nhà cung cấp</h2>
 <p className="text-xs text-slate-600 mt-0.5">Danh sách {filteredSuppliers.length} nhà cung cấp</p>
 </div>
 </div>

 <div className="flex items-center gap-3 w-full md:w-auto">
 <div className="relative flex-1 md:w-64">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
 <input 
 type="text" 
 placeholder="Tìm theo tên ncc..." 
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
 />
 </div>
 <div className="relative">
 <select
 value={categoryFilter}
 onChange={(e) => setCategoryFilter(e.target.value)}
 className="appearance-none bg-white border border-slate-300 rounded-lg pl-9 pr-8 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 cursor-pointer"
 >
 <option value="all">Tất cả ngành hàng</option>
 {categories.map(c => (
 <option key={c} value={c}>{c}</option>
 ))}
 </select>
 <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
 </div>
 <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-700 transition-all shadow-sm">
 + Thêm NCC
 </button>
 </div>
 </div>

 <div className="overflow-x-auto min-w-0">
 <table className="w-full text-left border-collapse whitespace-nowrap">
 <thead>
 <tr className="bg-slate-50 border-b border-slate-300">
 <th className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Nhà cung cấp</th>
 <th className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Ngành hàng</th>
 <th className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Liên hệ</th>
 <th className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Chính sách & HĐ</th>
 <th className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center">Đánh giá</th>
 <th className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center">Trạng thái</th>
 <th className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center">Trạng thái Ghi sổ</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 bg-white">
 {filteredSuppliers.map((supplier) => (
 <tr key={supplier.id} className="hover:bg-slate-50/50 transition-colors group">
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm shrink-0">
 {supplier.name.charAt(0)}
 </div>
 <div>
 <p className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors cursor-pointer">{supplier.name}</p>
 <p className="text-[10px] text-slate-600 font-mono mt-0.5">{supplier.id}</p>
 </div>
 </div>
 </td>
 <td className="px-6 py-4">
 <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
 {supplier.category}
 </span>
 </td>
 <td className="px-6 py-4">
 <div className="space-y-1">
 <div className="flex items-center gap-2 text-xs text-slate-700">
 <Phone className="w-3 h-3 text-slate-500" />
 <span className="font-medium">{supplier.phone}</span>
 </div>
 <div className="flex items-center gap-2 text-xs text-slate-700">
 <Mail className="w-3 h-3 text-slate-500" />
 <span className="italic">{supplier.email}</span>
 </div>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-start gap-2 max-w-[200px]">
 <FileText className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
 <p className="text-xs text-slate-700 leading-snug">{supplier.policies}</p>
 </div>
 </td>
 <td className="px-6 py-4 text-center">
 <div className="flex items-center justify-center gap-1">
 <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
 <span className="text-sm font-bold text-slate-900">{supplier.rating}</span>
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
 <td className="px-6 py-4 text-center">
    {syncedSuppliers[supplier.id] ? (
      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 rounded-full">
        Đã ghi sổ 🟢
      </span>
    ) : (
      <button
        onClick={() => handleSyncSupplier(supplier)}
        disabled={syncingSupplierId === supplier.id}
        className="px-2.5 py-1 bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-bold rounded-lg disabled:opacity-50 flex items-center gap-1 mx-auto"
      >
        {syncingSupplierId === supplier.id && <Loader2 className="w-3 h-3 animate-spin" />}
        Ghi sổ
      </button>
    )}
  </td>
 </tr>
 ))}
 {filteredSuppliers.length === 0 && (
 <tr>
 <td colSpan={7} className="px-6 py-6 text-center text-slate-600">
 <Building2 className="w-10 h-10 mx-auto text-slate-500 mb-3" />
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
  const [syncedRequests, setSyncedRequests] = useState<Record<string, boolean>>({});
  const [syncingRequestId, setSyncingRequestId] = useState<string | null>(null);
  
  // Phase 3 stateful requests and PO email triggers
  const [requests, setRequests] = useState<any[]>(() => {
    const cached = localStorage.getItem('vcomm_purchase_requests');
    if (cached) return JSON.parse(cached);
    
    // Add default supplier mappings & delivery status for Phase 3 PO tracking
    return MOCK_PURCHASE_REQUESTS.map(req => ({
      ...req,
      supplierId: req.id === 'PR-20240402' ? 'SUP-001' : 
                  req.id === 'PR-20240410' ? 'SUP-002' : 'SUP-003',
      deliveryStatus: req.status === 'approved' ? 'pending' : 'none'
    }));
  });

  const [selectedRequestForPo, setSelectedRequestForPo] = useState<any | null>(null);
  // Close modal on ESC keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedRequestForPo(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRequestForPo]);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    localStorage.setItem('vcomm_purchase_requests', JSON.stringify(requests));
  }, [requests]);

  // Sync to MISA API
  const handleSyncRequest = async (req: any) => {
    setSyncingRequestId(req.id);
    try {
      const result = await syncTransactionToMisa(req.id, {
        amount: req.value,
        description: req.title,
        type: 'expense',
        category: 'Inventory',
        accountingObjectCode: req.supplierId || 'SUP-001'
      });
      if (result && result.status === 'success') {
        setSyncedRequests(prev => ({ ...prev, [req.id]: true }));
      } else {
        throw new Error(result.message || 'Lỗi không xác định khi ghi sổ');
      }
    } catch (err: any) {
      console.error('Failed to sync purchase requests:', err);
      alert('Có lỗi xảy ra khi ghi sổ mua hàng: ' + (err.message || err));
    } finally {
      setSyncingRequestId(null);
    }
  };

  const handleApprove = (id: string) => {
    const updated = requests.map(req => {
      if (req.id === id) {
        return { ...req, status: 'approved', deliveryStatus: 'pending' };
      }
      return req;
    });
    setRequests(updated);
  };

  const handleReject = (id: string) => {
    const updated = requests.map(req => {
      if (req.id === id) {
        return { ...req, status: 'rejected', deliveryStatus: 'none' };
      }
      return req;
    });
    setRequests(updated);
  };

  // Simulate calling Supabase Edge Function to email the PO PDF to the Supplier
  const handleSendPoEmail = async (req: any) => {
    setSendingEmail(true);
    try {
      // Simulate API call to Supabase Edge Function
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const supplierEmail = req.id === 'PR-20240402' ? 'sales@lg.com.vn' : 
                            req.id === 'PR-20240410' ? 'contact@yody.vn' : 'partner@sunhouse.com';

      alert(`[Supabase Edge Function] Đã tự động tạo và gửi Đơn mua hàng PO PDF thành công tới email nhà cung cấp (${supplierEmail}).`);
      
      // Update PO delivery status to 'pending' if it was 'none'
      const updated = requests.map(r => {
        if (r.id === req.id) {
          return { ...r, deliveryStatus: 'pending' };
        }
        return r;
      });
      setRequests(updated);
      setSelectedRequestForPo(null);
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi gọi Edge Function gửi email PO.');
    } finally {
      setSendingEmail(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.title.toLowerCase().includes(searchTerm.toLowerCase()) || req.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden mt-4 animate-in fade-in slide-in- duration-500">
      <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="flex items-center justify-center p-2 text-slate-500 hover:text-primary-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-300"
            title="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Phiếu Đề xuất mua hàng</h2>
            <p className="text-xs text-slate-600 mt-0.5">Quản lý các yêu cầu sắm tài sản, thiết bị, dịch vụ và phê duyệt luồng PO</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Tìm theo tiêu đề, ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-300 rounded-lg pl-9 pr-8 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ phê duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
            </select>
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-700 transition-all shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tạo Đề xuất
          </button>
        </div>
      </div>

      <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border-b border-slate-200 bg-slate-50" columns={4} gap={16}>
        <div className="bg-white border border-slate-300 p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2"><FileSignature className="w-4 h-4 text-orange-600" /> Tổng phiếu</h3>
          <p className="text-2xl font-black text-slate-900 mt-2">{requests.length}</p>
        </div>
        <div className="bg-white border border-slate-300 p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /> Chờ duyệt</h3>
          <p className="text-2xl font-black text-slate-900 mt-2">{requests.filter(r => r.status === 'pending').length}</p>
        </div>
        <div className="bg-white border border-slate-300 p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Đã duyệt (Tháng)</h3>
          <p className="text-2xl font-black text-slate-900 mt-2">{requests.filter(r => r.status === 'approved').length}</p>
        </div>
        <div className="bg-white border border-slate-300 p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2"><BadgeDollarSign className="w-4 h-4 text-purple-500" /> Tổng kinh phí duyệt</h3>
          <p className="text-2xl font-black text-slate-900 mt-2">{formatCurrency(requests.filter(r => r.status === 'approved').reduce((acc, curr) => acc + curr.value, 0))}</p>
        </div>
      </DraggableGrid>

      <div className="overflow-x-auto min-w-0">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-300">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest w-[15%]">Mã Phiếu / Khối</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest w-full">Nội dung & Người đề xuất</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-right">Dự toán / Mặt hàng</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center">Trạng thái duyệt</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center">Hành động phê duyệt</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center">Đơn hàng PO</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center">Trạng thái Ghi sổ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredRequests.map((req) => (
              <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">{req.id}</p>
                  <span className="mt-1 inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">{req.department}</span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-slate-900 cursor-pointer hover:text-primary-600 transition-colors">{req.title}</p>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5"><Users className="w-3 h-3" /> {req.requester}</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="text-sm font-black text-rose-600">{formatCurrency(req.value)}</p>
                  <p className="text-[10px] text-slate-600 font-medium">{req.itemsCount} đơn vị</p>
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
                <td className="px-6 py-4 text-center">
                  {req.status === 'pending' ? (
                    <div className="flex gap-2 justify-center">
                      <button 
                        onClick={() => handleApprove(req.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-[#FAF9F5] text-[10px] font-bold rounded"
                      >
                        Duyệt
                      </button>
                      <button 
                        onClick={() => handleReject(req.id)}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-[#FAF9F5] text-[10px] font-bold rounded"
                      >
                        Từ chối
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs italic">Đã xử lý</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {req.status === 'approved' ? (
                    <div className="space-y-1.5">
                      <button
                        onClick={() => setSelectedRequestForPo(req)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-primary-700 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 mx-auto"
                      >
                        Xem PO (PDF)
                      </button>
                      {req.deliveryStatus && req.deliveryStatus !== 'none' && (
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider block w-fit mx-auto",
                          req.deliveryStatus === 'delivered' ? "bg-emerald-50 text-emerald-600" :
                          req.deliveryStatus === 'shipping' ? "bg-primary-50 text-primary-600 animate-pulse" :
                          "bg-amber-50 text-amber-600"
                        )}>
                          NCC: {req.deliveryStatus === 'delivered' ? 'Đã giao' : req.deliveryStatus === 'shipping' ? 'Đang giao' : 'Đã xác nhận'}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs italic">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {req.status === 'approved' ? (
                    syncedRequests[req.id] ? (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 rounded-full">
                        Đã ghi sổ 🟢
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSyncRequest(req)}
                        disabled={syncingRequestId === req.id}
                        className="px-2.5 py-1 bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-bold rounded-lg disabled:opacity-50 flex items-center gap-1 mx-auto"
                      >
                        {syncingRequestId === req.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Ghi sổ Mua
                      </button>
                    )
                  ) : (
                    <span className="text-slate-400 text-xs italic">-</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredRequests.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-6 text-center text-slate-600">
                  <FileSignature className="w-10 h-10 mx-auto text-slate-500 mb-3" />
                  <p className="text-sm font-medium">Không tìm thấy phiếu đề xuất nào phù hợp.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PO PDF visualizer modal */}
      {selectedRequestForPo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Chi tiết Đơn đặt hàng (Purchase Order PDF)</h3>
                <p className="text-xs text-slate-600 mt-0.5">Xuất PO mẫu chuẩn và mô phỏng tự động hóa quy trình</p>
              </div>
              <button 
                onClick={() => setSelectedRequestForPo(null)} 
                className="p-1 hover:bg-slate-100 rounded text-slate-600"
              >
                Đóng
              </button>
            </div>

            {/* Visual PDF Body */}
            <div className="flex-1 overflow-y-auto my-6 p-6 border border-slate-350 bg-slate-50 rounded-lg font-mono text-slate-800 text-xs space-y-6">
              
              {/* PDF Header */}
              <div className="flex justify-between items-start pb-4 border-b border-dashed border-slate-400">
                <div>
                  <h4 className="font-serif font-black text-sm text-slate-900">CÔNG TY CỔ PHẦN VCOMM</h4>
                  <p className="text-[10px] text-slate-600 mt-1">15 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội</p>
                  <p className="text-[10px] text-slate-600">Mã số thuế: 0102030405</p>
                </div>
                <div className="text-right">
                  <h4 className="font-bold text-slate-900 text-sm">ĐƠN ĐẶT HÀNG (PO)</h4>
                  <p className="text-[10px] font-bold text-orange-700 mt-1">Số PO: PO-{selectedRequestForPo.id.replace('PR-', '')}</p>
                  <p className="text-[10px] text-slate-600">Ngày tạo: {selectedRequestForPo.date}</p>
                </div>
              </div>

              {/* Vendor & Delivery details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-bold text-slate-900 mb-1">ĐƠN VỊ BÁN HÀNG (NCC):</p>
                  <p className="font-bold text-slate-800">
                    {selectedRequestForPo.id === 'PR-20240402' ? 'Công ty CP Điện tử LG Việt Nam' :
                     selectedRequestForPo.id === 'PR-20240410' ? 'Nhà phân phối Thời trang Yody' : 'Sunhouse VN'}
                  </p>
                  <p className="text-[10px] text-slate-600">Điện thoại: {selectedRequestForPo.id === 'PR-20240402' ? '0901234567' : '0987654321'}</p>
                  <p className="text-[10px] text-slate-600">Email: {
                    selectedRequestForPo.id === 'PR-20240402' ? 'sales@lg.com.vn' :
                    selectedRequestForPo.id === 'PR-20240410' ? 'contact@yody.vn' : 'partner@sunhouse.com'
                  }</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900 mb-1">ĐƠN VỊ MUA HÀNG (GIAO ĐẾN):</p>
                  <p className="font-bold text-slate-800">Kho Trung Tâm VComm Hà Nội</p>
                  <p className="text-[10px] text-slate-600">Người nhận: {selectedRequestForPo.requester}</p>
                  <p className="text-[10px] text-slate-600">Phòng ban: {selectedRequestForPo.department}</p>
                </div>
              </div>

              {/* PO Items Table */}
              <div>
                <table className="w-full text-left border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-200 border-b border-slate-400 font-bold text-slate-900">
                      <th className="p-2 border-r border-slate-400">Mô tả mặt hàng</th>
                      <th className="p-2 text-right border-r border-slate-400 w-20">SL</th>
                      <th className="p-2 text-right border-r border-slate-400 w-32">Đơn giá</th>
                      <th className="p-2 text-right w-32">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-400">
                      <td className="p-2 border-r border-slate-400 leading-normal font-sans font-bold text-slate-900">
                        {selectedRequestForPo.title}
                      </td>
                      <td className="p-2 text-right border-r border-slate-400 font-bold">{selectedRequestForPo.itemsCount}</td>
                      <td className="p-2 text-right border-r border-slate-400">{formatCurrency(selectedRequestForPo.value / (selectedRequestForPo.itemsCount || 1))}</td>
                      <td className="p-2 text-right font-bold">{formatCurrency(selectedRequestForPo.value)}</td>
                    </tr>
                    <tr className="bg-slate-100 font-bold text-slate-900">
                      <td colSpan={3} className="p-2 text-right border-r border-slate-400">TỔNG CỘNG THANH TOÁN (ĐÃ VAT)</td>
                      <td className="p-2 text-right text-rose-600 font-black">{formatCurrency(selectedRequestForPo.value)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="flex justify-between pt-12 text-center text-[10px] font-bold text-slate-700">
                <div>
                  <p>NGƯỜI LẬP BIỂU</p>
                  <p className="mt-8 italic text-slate-500 font-sans font-normal">(Đã duyệt điện tử)</p>
                  <p className="mt-2 text-slate-800">{selectedRequestForPo.requester}</p>
                </div>
                <div>
                  <p>GIÁM ĐỐC PHÊ DUYỆT</p>
                  <p className="mt-8 text-emerald-600 border border-emerald-500 bg-emerald-50/50 px-2 py-0.5 rounded inline-block font-sans font-bold text-[9px]">
                    VCOMM CA SIGNED ✔
                  </p>
                  <p className="mt-2 text-slate-800">Hệ thống VComm</p>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <span className="text-[10px] text-slate-500 font-medium">
                NCC có thể truy cập Cổng thông tin tại <code className="bg-slate-100 px-1 py-0.5 rounded font-bold">/supplier-portal</code> để xử lý.
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedRequestForPo(null)}
                  className="bg-white border border-slate-355 hover:bg-slate-100 text-slate-800 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                >
                  Quay lại
                </button>
                <button
                  onClick={() => handleSendPoEmail(selectedRequestForPo)}
                  disabled={sendingEmail}
                  className="bg-primary-600 hover:bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-blue-500/10"
                >
                  {sendingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang kết nối Supabase Edge...
                    </>
                  ) : (
                    'Gửi Email PO tự động 📧'
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export function Procurement() {
 const [activeTab, setActiveTab] = useState<string>('overview');

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <div className="flex items-center gap-2 mb-1">
 {activeTab !== 'overview' && (
 <button onClick={() => setActiveTab('overview')} className="p-1 hover:bg-slate-100 rounded-md transition-colors mr-1">
 <ArrowLeft className="w-4 h-4 text-slate-600" />
 </button>
 )}
 <h1 className="font-serif tracking-tight text-2xl font-bold text-[#111827]">Mua hàng & Nhà cung cấp</h1>
 </div>
 <p className="text-sm text-[#6B7280]">Quản lý quy trình mua sắm, đề xuất và đánh giá NCC.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <BadgeDollarSign className="w-4 h-4 text-emerald-600" /> Báo cáo chi tiêu
 </button>
 <button className="bg-primary-600 text-[#FAF9F5] px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-primary-700 transition-all shadow-sm flex items-center gap-2">
 <Plus className="w-4 h-4" /> Tạo đề xuất mới
 </button>
 </div>
 </div>

 {activeTab === 'overview' && (
 <div className="space-y-8">
 {/* Stats Cards */}
 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-6" columns={4} gap={24}>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Chi phí mua hàng (T3)</span>
 <BadgeDollarSign className="w-4 h-4 text-emerald-600" />
 </div>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-[#111827]">{formatCurrency(1850000000)}</span>
 <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">+8.2%</span>
 </div>
 </div>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Đề xuất chờ duyệt</span>
 <Clock className="w-4 h-4 text-orange-700" />
 </div>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-[#111827]">12 Phiếu</span>
 <span className="text-[10px] text-orange-700 font-bold bg-slate-100 px-2 py-0.5 rounded">High Priority</span>
 </div>
 </div>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Nhà cung cấp Core</span>
 <Building2 className="w-4 h-4 text-orange-600" />
 </div>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-[#111827]">240 NCC</span>
 <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded">8 New</span>
 </div>
 </div>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Đánh giá trung bình</span>
 <Star className="w-4 h-4 text-primary-600" />
 </div>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-[#111827]">4.85/5</span>
 <span className="text-[10px] text-primary-600 font-bold bg-primary-50 px-2 py-0.5 rounded">Excellent</span>
 </div>
 </div>
 </DraggableGrid>

 {/* Matrix Grid Layout */}
 <div className="space-y-6">
 {PURCHASING_MODULE_GROUPS.map((group, gIdx) => (
 <div key={gIdx} className="space-y-4">
 <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 px-1">
 <span className="w-1 h-4 bg-primary-600 rounded-full inline-block" />
 {group.title}
 </h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
 {group.items.map((mod) => (
 <div 
 key={mod.id}
 onClick={() => setActiveTab(mod.id as any)}
 className="group bg-white p-5 rounded-lg border border-slate-300 shadow-sm hover:shadow-sm hover:border-primary-500/50 transition-all cursor-pointer flex flex-col gap-4 relative overflow-hidden"
 >
 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
 <mod.icon className="w-24 h-24 transform -rotate-12 translate-x-4 -translate-y-4" />
 </div>
 <div className={cn("w-12 h-12 rounded relative z-10 flex items-center justify-center  group-hover:bg-primary-600 group-hover:text-[#FAF9F5] transition-all shadow-sm", getColorClasses(mod.color))}>
 <mod.icon className="w-6 h-6" />
 </div>
 <div className="relative z-10">
 <h3 className="font-bold text-[#111827] text-sm mb-1.5 group-hover:text-primary-700 transition-colors">{mod.label}</h3>
 <p className="text-[11px] text-[#6B7280] leading-relaxed line-clamp-2">{mod.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {activeTab === 'sup_list' && <SupplierManagement onBack={() => setActiveTab('overview')} />}
 {activeTab === 'pur_req_form' && <PurchaseRequests onBack={() => setActiveTab('overview')} />}

 {activeTab !== 'overview' && activeTab !== 'sup_list' && activeTab !== 'pur_req_form' && (
 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4">
 <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50">
 <button 
 onClick={() => setActiveTab('overview')} 
 className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-primary-600 transition-colors bg-white border border-slate-300 px-4 py-2 rounded-lg w-fit shadow-sm"
 >
 <ArrowLeft className="w-4 h-4" /> Quay lại Giao diện chung
 </button>
 </div>
 
 <div className="p-6 flex flex-col items-center justify-center text-center">
 <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
 <ShoppingCart className="w-10 h-10 text-orange-600" />
 </div>
 <h3 className="text-xl font-bold text-slate-900 mb-2">Phân hệ: {activeTab}</h3>
 <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
 Tính năng này đang trong quá trình phát triển chi tiết cho phân hệ Mua hàng.
 </p>
 </div>
 </div>
 )}
 </div>
 );
}
