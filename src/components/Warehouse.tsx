import { useState } from 'react';
import { 
  Users, Building2, Settings, BarChart2, FileSignature, GitBranch, 
  ArrowLeft, Search, Filter, Warehouse, Package, FileInput, FileOutput, ClipboardList,
  Phone, Mail, Percent, Globe, Plus, MoreVertical, Receipt, ArrowRight, CheckCircle2, AlertCircle, XCircle, DollarSign,
  Truck, MapPin, Navigation, ListTodo, Clock
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

const WAREHOUSE_MODULE_GROUPS = [
  {
    title: 'Nhập/xuất kho',
    items: [
      { id: 'wh_in_out', label: 'Phiếu kho', desc: 'Nhập kho, xuất kho, điều chuyển.', icon: FileInput, color: 'blue' },
      { id: 'wh_req_purchase', label: 'Phiếu đề xuất mua hàng', desc: 'Đề xuất hàng thiếu.', icon: GitBranch, color: 'indigo' },
      { id: 'wh_inventory', label: 'Kiểm kê kho', desc: 'Thực hiện kiểm kê định kỳ.', icon: ClipboardList, color: 'emerald' },
    ]
  },
  {
    title: 'Vận chuyển & Fulfillment',
    items: [
      { id: 'wh_ff_orders', label: 'Quản lý đơn vận chuyển', desc: 'Theo dõi đơn hàng đang giao.', icon: ListTodo, color: 'indigo' },
      { id: 'wh_ff_tracking', label: 'Theo dõi lộ trình', desc: 'Real-time tracking vận chuyển.', icon: Navigation, color: 'blue' },
      { id: 'wh_ff_optimize', label: 'Tối ưu tuyến đường', desc: 'Smart routing giao hàng.', icon: MapPin, color: 'emerald' },
    ]
  },
  {
    title: 'Báo cáo',
    items: [
      { id: 'wh_stock', label: 'Tồn kho', desc: 'Danh sách tồn kho hiện tại.', icon: Package, color: 'orange' },
      { id: 'wh_in_out_report', label: 'Báo cáo nhập xuất tồn', desc: 'Thống kê luân chuyển.', icon: BarChart2, color: 'purple' },
    ]
  },
  {
    title: 'Thiết lập và danh mục',
    items: [
      { id: 'wh_cat', label: 'Danh mục hàng hóa', desc: 'Phân loại hàng hóa.', icon: FileSignature, color: 'rose' },
      { id: 'wh_items', label: 'Danh sách hàng hóa', desc: 'Quản lý mã hàng, SKU.', icon: Package, color: 'fuchsia' },
      { id: 'wh_list', label: 'Danh sách kho', desc: 'Quản lý các vị trí kho.', icon: Warehouse, color: 'blue' },
      { id: 'wh_partners', label: 'Danh sách đối tác', desc: 'Đối tác kho vận.', icon: Users, color: 'slate' },
      { id: 'wh_settings', label: 'Thiết lập kho', desc: 'Config quy tắc kho.', icon: Settings, color: 'slate' }
    ]
  }
];

const LOGISTICS_PARTNERS = [
  { 
    id: 'LP001', 
    name: 'Giao Hàng Nhanh (GHN)', 
    contact: '1900 636683', 
    email: 'cskh@ghn.vn', 
    policy: 'Chiết khấu 10% cho đơn trên 100tr/tháng', 
    status: 'Active',
    website: 'ghn.vn',
    coverage: 'Toàn quốc'
  },
  { 
    id: 'LP002', 
    name: 'Viettel Post', 
    contact: '1900 8095', 
    email: 'support@viettelpost.com.vn', 
    policy: 'Đồng giá 22k nội tỉnh', 
    status: 'Active',
    website: 'viettelpost.com.vn',
    coverage: 'Toàn quốc'
  },
  { 
    id: 'LP003', 
    name: 'Ninja Van', 
    contact: '1900 888685', 
    email: 'support_vn@ninjavan.co', 
    policy: 'Giảm 15% cho shop mới', 
    status: 'Maintenance',
    website: 'ninjavan.co',
    coverage: 'Toàn quốc'
  }
];

const LOGISTICS_FEES: Record<string, any[]> = {
  // ... existing fees
};

const MOCK_SHIPMENTS = [
  { id: 'SHIP-001', orderId: 'ORD-5521', partner: 'GHN', status: 'In Transit', driver: 'Nguyễn Văn Nam', eta: '15:30 Today' },
  { id: 'SHIP-002', orderId: 'ORD-5525', partner: 'Viettel Post', status: 'Delivered', driver: 'Trần Văn Tú', eta: 'Success' },
  { id: 'SHIP-003', orderId: 'ORD-5528', partner: 'Ninja Van', status: 'Pending', driver: 'Chưa điều phối', eta: 'Tomorrow' },
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

export function WarehouseModule() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedPartnerForFees, setSelectedPartnerForFees] = useState<string | null>(null);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="text-2xl font-semibold text-[#111827]">Quản trị Kho vận</h1>
          <p className="text-sm text-[#6B7280] mt-1">Quản lý nhập xuất kho, kiểm kê và vận hành Fulfillment.</p>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="space-y-12 bg-transparent mt-4">
            {WAREHOUSE_MODULE_GROUPS.map((group, gIdx) => (
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

      {activeTab === 'wh_partners' && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4">
          <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50 flex justify-between items-center">
             <button 
               onClick={() => setActiveTab('overview')} 
               className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors bg-white border border-slate-200 px-4 py-2 rounded-xl w-fit shadow-sm"
             >
                <ArrowLeft className="w-4 h-4" /> Quay lại Giao diện chung
             </button>
             <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20">
                <Plus className="w-4 h-4" /> Thêm đơn vị vận chuyển
             </button>
          </div>
          
          {!selectedPartnerForFees && (
            <div className="p-8">
            <div className="flex justify-between items-center mb-8">
               <div className="relative w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Tìm kiếm đơn vị vận chuyển..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
               </div>
               <button className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
                  <Filter className="w-4 h-4" /> Lọc
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               {LOGISTICS_PARTNERS.map(partner => (
                  <div key={partner.id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all group">
                     <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                           <Warehouse className="w-6 h-6" />
                        </div>
                        <button className="text-slate-300 hover:text-slate-600">
                           <MoreVertical className="w-5 h-5" />
                        </button>
                     </div>
                     <h3 className="text-lg font-bold text-slate-900 mb-1">{partner.name}</h3>
                     <p className="text-xs text-slate-500 mb-4">{partner.id} • {partner.coverage}</p>
                     
                     <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                           <Phone className="w-3.5 h-3.5 text-slate-400" /> {partner.contact}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                           <Mail className="w-3.5 h-3.5 text-slate-400" /> {partner.email}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                           <Globe className="w-3.5 h-3.5 text-slate-400" /> {partner.website}
                        </div>
                     </div>

                     <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                           <Percent className="w-3.5 h-3.5 text-blue-600" />
                           <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Chính sách chiết khấu</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                           {partner.policy}
                        </p>
                     </div>

                         <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                           <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                              partner.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                           )}>
                              {partner.status}
                           </span>
                           <div className="flex gap-2">
                              <button 
                                onClick={() => setSelectedPartnerForFees(partner.id)}
                                className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                              >
                                 <Receipt className="w-3.5 h-3.5" /> Biểu phí
                              </button>
                              <button className="text-xs font-bold text-slate-500 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors">API</button>
                           </div>
                         </div>
                      </div>
                   ))}
                </div>
              </div>
            )}

            {selectedPartnerForFees && (
              <div className="p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-8">
                  <button 
                    onClick={() => setSelectedPartnerForFees(null)}
                    className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Danh sách đối tác
                  </button>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900">
                      Biểu phí dịch vụ: {LOGISTICS_PARTNERS.find(p => p.id === selectedPartnerForFees)?.name}
                    </h3>
                    <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      {selectedPartnerForFees}
                    </span>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20">
                    <Plus className="w-4 h-4" /> Thêm khoản phí mới
                  </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tên khoản phí</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loại phí</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Giá trị</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {LOGISTICS_FEES[selectedPartnerForFees]?.map(fee => (
                        <tr key={fee.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                <DollarSign className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-bold text-slate-900">{fee.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-medium text-slate-500">{fee.type}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-black text-blue-600">{fee.value}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {fee.status === 'Active' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-500" />
                              )}
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wider",
                                fee.status === 'Active' ? "text-emerald-600" : "text-rose-600"
                              )}>
                                {fee.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button className="text-slate-400 hover:text-blue-600 transition-colors">
                                <MoreVertical className="w-5 h-5" />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(!LOGISTICS_FEES[selectedPartnerForFees] || LOGISTICS_FEES[selectedPartnerForFees].length === 0) && (
                    <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
                      <Receipt className="w-12 h-12 mb-4 text-slate-300" />
                      <p className="text-sm font-medium text-slate-500">Chưa có dữ liệu biểu phí cho đối tác này</p>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      )}

      {activeTab === 'wh_ff_orders' && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4">
          <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50 flex justify-between items-center">
             <button 
               onClick={() => setActiveTab('overview')} 
               className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors bg-white border border-slate-200 px-4 py-2 rounded-xl w-fit shadow-sm"
             >
                <ArrowLeft className="w-4 h-4" /> Quay lại Giao diện chung
             </button>
             <div className="flex gap-3">
               <button className="bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold border border-slate-200">Xuất báo cáo</button>
               <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20">
                  <Plus className="w-4 h-4" /> Tạo đơn vận mới
               </button>
             </div>
          </div>
          
          <div className="p-8">
            <div className="flex gap-4 mb-8">
               <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Mã vận đơn, mã đơn hàng, shipper..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
               </div>
               <select className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium outline-none">
                  <option>Tất cả trạng thái</option>
                  <option>Đang giao</option>
                  <option>Đã giao</option>
                  <option>Chờ lấy hàng</option>
               </select>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Vận đơn</th>
                    <th className="px-6 py-4">Đối tác</th>
                    <th className="px-6 py-4">Tài xế/Shipper</th>
                    <th className="px-6 py-4">Dự kiến</th>
                    <th className="px-6 py-4 text-center">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MOCK_SHIPMENTS.map(ship => (
                    <tr key={ship.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{ship.id}</span>
                          <span className="text-[10px] text-slate-500 font-medium">{ship.orderId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-sm text-slate-700">{ship.partner}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-600">
                            {ship.driver.charAt(0)}
                          </div>
                          <span className="text-sm text-slate-600 font-medium">{ship.driver}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{ship.eta}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight",
                          ship.status === 'In Transit' ? "bg-blue-50 text-blue-600" :
                          ship.status === 'Delivered' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                        )}>
                          {ship.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                           <Navigation className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                           <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'wh_ff_tracking' && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4">
           <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50">
             <button onClick={() => setActiveTab('overview')} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600">
                <ArrowLeft className="w-4 h-4" /> Quay lại
             </button>
          </div>
          <div className="flex-1 flex">
             <div className="w-80 border-r border-slate-100 p-6 space-y-4 overflow-y-auto">
                <h3 className="font-bold text-slate-900 border-b pb-4 mb-4">Đơn đang giao (2)</h3>
                {MOCK_SHIPMENTS.filter(s => s.status === 'In Transit').map(s => (
                  <div key={s.id} className="p-4 bg-slate-50 rounded-xl border border-blue-200 cursor-pointer hover:bg-white transition-all">
                      <div className="flex justify-between items-start mb-2">
                         <span className="font-bold text-sm text-blue-600">{s.id}</span>
                         <span className="text-[10px] font-bold text-slate-400">Đang chạy</span>
                      </div>
                      <p className="text-xs text-slate-600 mb-2">{s.driver}</p>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                         <Clock className="w-3 h-3" /> Cập nhật: 2 phút trước
                      </div>
                  </div>
                ))}
             </div>
             <div className="flex-1 bg-slate-100 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="text-center opacity-40">
                      <Navigation className="w-16 h-16 mx-auto mb-4" />
                      <p className="font-bold">BẢN ĐỒ LỘ TRÌNH REAL-TIME</p>
                      <p className="text-xs">Đang tải dữ liệu vệ tinh GPS...</p>
                   </div>
                </div>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl space-y-3 w-48">
                   <div className="flex items-center justify-between text-xs font-bold text-slate-600 border-b pb-2">
                      <span>Tổng số xe</span>
                      <span className="text-blue-600">12</span>
                   </div>
                   <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                      <span>Đang giao hàng</span>
                      <span className="text-emerald-500">8</span>
                   </div>
                   <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                      <span>Dừng nghỉ</span>
                      <span className="text-orange-500">4</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'wh_ff_optimize' && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4 p-12 items-center justify-center text-center">
           <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6 animate-bounce">
              <MapPin className="w-10 h-10 text-emerald-600" />
           </div>
           <h2 className="text-2xl font-bold text-slate-900 mb-4">Tối ưu Tuyến đường Giao hàng</h2>
           <p className="text-slate-500 max-w-lg mx-auto leading-relaxed mb-8">
              Sử dụng thuật toán AI để sắp xếp thứ tự các điểm giao hàng, giảm 20% quãng đường di chuyển và tối ưu hóa thời gian nhận hàng của khách hàng.
           </p>
           <div className="flex gap-4">
              <button className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-600/20">Chạy Optimization ngay</button>
              <button 
                onClick={() => setActiveTab('overview')}
                className="bg-slate-100 text-slate-600 px-8 py-3 rounded-2xl font-bold"
              >
                Hủy bỏ
              </button>
           </div>
        </div>
      )}

      {activeTab !== 'overview' && activeTab !== 'wh_partners' && !activeTab.startsWith('wh_ff_') && (
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
                <Warehouse className="w-10 h-10 text-blue-500" />
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">Phân hệ: {activeTab}</h3>
             <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                Tính năng này đang trong quá trình phát triển chi tiết cho phân hệ Kho vận.
             </p>
        </div>
      </div>
      )}
    </div>
  );
}
