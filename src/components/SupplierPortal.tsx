import React, { useState, useEffect } from 'react';
import { 
  Building2, ShoppingBag, Truck, CheckCircle2, Clock, AlertCircle, 
  ArrowLeft, Search, Filter, Calendar, QrCode, ClipboardList, Shield,
  ArrowRight, Landmark, Mail, Phone, MapPin, User, LogIn, ChevronRight, Package, Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Initial Supplier Accounts
const SUPPLIERS = [
  { id: 'SUP-001', name: 'Công ty CP Điện tử LG Việt Nam', category: 'Điện tử & Công nghệ', phone: '0901234567', email: 'sales@lg.com.vn', address: 'KCN Tràng Duệ, An Dương, Hải Phòng' },
  { id: 'SUP-002', name: 'Nhà phân phối Thời trang Yody', category: 'Thời trang & Phụ kiện', phone: '0987654321', email: 'contact@yody.vn', address: 'Đường An Định, TP. Hải Dương, Hải Dương' },
  { id: 'SUP-003', name: 'Sunhouse VN', category: 'Gia dụng & Đời sống', phone: '0911223344', email: 'partner@sunhouse.com', address: 'KCN Ngọc Liệp, Quốc Oai, Hà Nội' },
];

export function SupplierPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('SUP-001');
  const [password, setPassword] = useState('123456');
  const [loginError, setLoginError] = useState('');
  
  // Supplier Portal state
  const [pos, setPos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPo, setSelectedPo] = useState<any | null>(null);
  
  // Simulated action states
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [estDeliveryDate, setEstDeliveryDate] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);

  // Load POs from localStorage on mount & login
  useEffect(() => {
    const loadPos = () => {
      const cachedRequests = localStorage.getItem('vcomm_purchase_requests');
      if (cachedRequests) {
        setPos(JSON.parse(cachedRequests));
      } else {
        // Fallback to seeding default requests if not present
        const defaultRequests = [
          { id: 'PR-20240401', supplierId: 'SUP-003', title: 'Đề xuất mua văn phòng phẩm Tháng 4', requester: 'Lê Hoàng Minh', value: 15500000, status: 'approved', date: '01/04/2024', itemsCount: 15, deliveryStatus: 'pending' },
          { id: 'PR-20240402', supplierId: 'SUP-001', title: 'Trang bị 5 Laptop cho nhân sự mới', requester: 'Trần Bình', value: 125000000, status: 'approved', date: '05/04/2024', itemsCount: 5, deliveryStatus: 'pending' },
          { id: 'PR-20240405', supplierId: 'SUP-002', title: 'Sản xuất quà tặng khách hàng VIP', requester: 'Nguyễn Diệu Nhi', value: 50000000, status: 'rejected', date: '10/04/2024', itemsCount: 3, deliveryStatus: 'none' },
          { id: 'PR-20240410', supplierId: 'SUP-002', title: 'Nhập nguyên liệu vải Cotton T5', requester: 'Phạm Tuấn', value: 350000000, status: 'approved', date: '12/04/2024', itemsCount: 1000, deliveryStatus: 'pending' },
        ];
        localStorage.setItem('vcomm_purchase_requests', JSON.stringify(defaultRequests));
        setPos(defaultRequests);
      }
    };
    loadPos();
    
    // Add event listener to listen for updates from ERP tab
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'vcomm_purchase_requests') {
        loadPos();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isLoggedIn]);

  const currentSupplier = SUPPLIERS.find(s => s.id === selectedSupplierId);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '123456') {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Mật khẩu không đúng. Vui lòng nhập "123456" để thử nghiệm.');
    }
  };

  // Update PO Delivery Status
  const updatePoDelivery = (poId: string, status: string, additionalData: any = {}) => {
    setUpdatingStatus(status);
    setTimeout(() => {
      const updated = pos.map(p => {
        if (p.id === poId) {
          const updatedPo = { 
            ...p, 
            deliveryStatus: status,
            ...additionalData 
          };
          if (selectedPo && selectedPo.id === poId) {
            setSelectedPo(updatedPo);
          }
          return updatedPo;
        }
        return p;
      });
      setPos(updated);
      localStorage.setItem('vcomm_purchase_requests', JSON.stringify(updated));
      
      // If delivered, we simulate increasing warehouse stock
      if (status === 'delivered') {
        simulateWarehouseStockInbound(poId);
      }

      setUpdatingStatus(null);
    }, 1000);
  };

  // Simulate updating warehouse stock levels in local storage (sync with ERP)
  const simulateWarehouseStockInbound = (poId: string) => {
    const po = pos.find(p => p.id === poId);
    if (!po) return;

    // Simulate product ID mapping
    let productId = '1073131895'; // default shirt
    if (po.id === 'PR-20240402') productId = '1073131896'; // Laptop
    if (po.id === 'PR-20240401') productId = '1073131897'; // Sunhouse box

    // Load warehouse stock cache
    const stockCache = localStorage.getItem('fs_cache_docs_products');
    if (stockCache) {
      try {
        const products = JSON.parse(stockCache);
        const updatedProducts = products.map((item: any) => {
          if (item.id === productId || item.data?.id === productId) {
            const currentStock = Number(item.data?.stock || 0);
            const addedStock = Number(po.itemsCount || 10);
            return {
              ...item,
              data: {
                ...item.data,
                stock: currentStock + addedStock
              }
            };
          }
          return item;
        });
        localStorage.setItem('fs_cache_docs_products', JSON.stringify(updatedProducts));
        console.log(`[Supplier Portal] Automatically stocked in ${po.itemsCount} units for product ${productId} on local cache.`);
      } catch (err) {
        console.error('Failed to update stock cache:', err);
      }
    }
  };

  // Filter POs for the logged in supplier
  const supplierPos = pos.filter(p => {
    // Only approved requests count as POs
    const isApproved = p.status === 'approved';
    const belongsToSupplier = p.supplierId === selectedSupplierId || 
      // Fallback matching logic for old/seeded data
      (selectedSupplierId === 'SUP-001' && p.id === 'PR-20240402') ||
      (selectedSupplierId === 'SUP-002' && p.id === 'PR-20240410') ||
      (selectedSupplierId === 'SUP-003' && p.id === 'PR-20240401');

    if (!isApproved || !belongsToSupplier) return false;

    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.deliveryStatus === statusFilter || (statusFilter === 'pending' && !p.deliveryStatus);
    return matchesSearch && matchesStatus;
  });

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]" />

        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-xl relative z-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-blue-500 shadow-lg">
              <Building2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-serif font-black tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Supplier Portal
            </h1>
            <p className="text-sm text-slate-400 mt-2">Cổng thông tin giao hàng dành riêng cho Nhà cung cấp VComm</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-500" /> Chọn Nhà cung cấp
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-semibold"
              >
                {SUPPLIERS.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-500" /> Mật khẩu truy cập
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Mẹo: Sử dụng mật khẩu mặc định "123456"</span>
            </div>

            {loginError && (
              <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-400 font-medium">{loginError}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Đăng nhập hệ thống
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <span className="text-xs text-slate-500">
              Hệ sinh thái liên kết VComm &copy; 2026
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600/10 border border-blue-500/20 rounded-lg flex items-center justify-center text-blue-500">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-serif font-black tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                VComm Supplier Portal
              </h1>
              <p className="text-[10px] text-slate-400">Kênh tương tác và đối soát nhà cung cấp</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-slate-200">{currentSupplier?.name}</p>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Đang kết nối
              </span>
            </div>
            <button 
              onClick={() => setIsLoggedIn(false)}
              className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg font-semibold transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Stats & Info Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Supplier Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-500" /> Thông tin nhà cung cấp
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Mã đối tác</p>
                <p className="font-mono font-bold text-blue-400">{currentSupplier?.id}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Địa chỉ kho gửi</p>
                <p className="text-slate-300 font-medium leading-relaxed text-xs">{currentSupplier?.address}</p>
              </div>
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-slate-500" /> {currentSupplier?.phone}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> {currentSupplier?.email}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Thống kê giao nhận
            </h3>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg text-center">
                <p className="text-xs text-slate-500 font-medium">Chờ xác nhận</p>
                <p className="text-xl font-black text-amber-500 mt-1">
                  {supplierPos.filter(p => !p.deliveryStatus || p.deliveryStatus === 'pending').length}
                </p>
              </div>
              <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg text-center">
                <p className="text-xs text-slate-500 font-medium">Đang giao</p>
                <p className="text-xl font-black text-blue-400 mt-1">
                  {supplierPos.filter(p => p.deliveryStatus === 'shipping').length}
                </p>
              </div>
              <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg text-center col-span-2">
                <p className="text-xs text-slate-500 font-medium">Đã giao thành công</p>
                <p className="text-xl font-black text-emerald-400 mt-1">
                  {supplierPos.filter(p => p.deliveryStatus === 'delivered').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right PO Management Column */}
        <div className="lg:col-span-9 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            
            {/* Table Header Filter controls */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-200">Đơn đặt hàng mua (Purchase Orders)</h2>
                <p className="text-xs text-slate-400 mt-0.5">Xác nhận và phối hợp lộ trình giao hàng cho VComm</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1 md:w-60">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Tìm mã PO, tiêu đề..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-8 py-2 text-sm font-semibold text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending">Chờ xác nhận</option>
                    <option value="confirmed">Đang chuẩn bị</option>
                    <option value="shipping">Đang giao hàng</option>
                    <option value="delivered">Đã giao hàng</option>
                  </select>
                  <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>
            </div>

            {/* PO List Table */}
            <div className="overflow-x-auto min-w-0 mt-6">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Mã đơn PO</th>
                    <th className="py-3 px-4">Nội dung mua hàng</th>
                    <th className="py-3 px-4 text-right">Tổng giá trị</th>
                    <th className="py-3 px-4 text-center">Tiến độ giao hàng</th>
                    <th className="py-3 px-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/50">
                  {supplierPos.map((po) => {
                    const dStatus = po.deliveryStatus || 'pending';
                    return (
                      <tr key={po.id} className="hover:bg-slate-850/20 transition-colors group">
                        <td className="py-4 px-4">
                          <p className="text-xs font-mono font-bold text-blue-400 tracking-wider">
                            PO-{po.id.replace('PR-', '')}
                          </p>
                          <span className="text-[9px] text-slate-500 mt-1 block">Đề xuất: {po.id}</span>
                        </td>
                        <td className="py-4 px-4 max-w-xs truncate">
                          <p className="text-xs font-bold text-slate-200 hover:text-blue-400 transition-colors cursor-pointer" onClick={() => setSelectedPo(po)}>
                            {po.title}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Package className="w-3 h-3 text-slate-500" /> Số lượng đặt: {po.itemsCount} đơn vị
                          </p>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <p className="text-xs font-black text-emerald-400">{formatCurrency(po.value)}</p>
                          <span className="text-[9px] text-slate-500">VAT bao gồm</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={cn(
                            "px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1",
                            dStatus === 'delivered' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            dStatus === 'shipping' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                            dStatus === 'confirmed' ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                            "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          )}>
                            {dStatus === 'delivered' && <CheckCircle2 className="w-3 h-3 animate-pulse" />}
                            {dStatus === 'shipping' && <Truck className="w-3 h-3 animate-bounce" />}
                            {dStatus === 'confirmed' && <Clock className="w-3 h-3" />}
                            {dStatus === 'pending' && <AlertCircle className="w-3 h-3" />}
                            {dStatus === 'delivered' ? 'Đã giao' : dStatus === 'shipping' ? 'Đang giao' : dStatus === 'confirmed' ? 'Đang chuẩn bị' : 'Chờ xác nhận'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => setSelectedPo(po)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
                          >
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {supplierPos.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        <ShoppingBag className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                        <p className="text-xs">Không tìm thấy đơn hàng nào.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Selected PO Details Card */}
          {selectedPo && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom duration-300">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedPo(null)} className="p-1.5 hover:bg-slate-850 rounded-lg text-slate-400 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      Chi tiết đơn đặt hàng PO-{selectedPo.id.replace('PR-', '')}
                    </h3>
                    <p className="text-[11px] text-slate-500">Yêu cầu mua từ phòng ban: {selectedPo.department}</p>
                  </div>
                </div>
                
                <span className="text-xs text-slate-400 font-mono">Ngày tạo: {selectedPo.date}</span>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Mặt hàng & Yêu cầu kỹ thuật</p>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                      <p className="text-sm font-bold text-slate-200">{selectedPo.title}</p>
                      <div className="flex justify-between items-center mt-3 text-xs text-slate-400">
                        <span>Số lượng đặt:</span>
                        <span className="font-bold text-slate-200">{selectedPo.itemsCount} đơn vị</span>
                      </div>
                      <div className="flex justify-between items-center mt-2 text-xs text-slate-400">
                        <span>Đơn giá tạm tính:</span>
                        <span className="font-bold text-slate-200">{formatCurrency(selectedPo.value / (selectedPo.itemsCount || 1))}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-900 text-xs font-bold text-slate-200">
                        <span>Tổng giá trị đơn hàng:</span>
                        <span className="text-emerald-400 font-black">{formatCurrency(selectedPo.value)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Trạng thái vận chuyển & Phối hợp</p>
                    <div className="bg-slate-955 p-4 rounded-xl border border-slate-850 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Trạng thái:</span>
                        <span className="font-bold text-blue-400 uppercase tracking-wider">
                          {selectedPo.deliveryStatus || 'Chờ xác nhận'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Dự kiến giao hàng:</span>
                        <span className="font-bold text-slate-200 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-400" />
                          {selectedPo.estDeliveryDate || 'Chưa thiết lập'}
                        </span>
                      </div>

                      {/* Date config */}
                      {(!selectedPo.deliveryStatus || selectedPo.deliveryStatus === 'pending' || selectedPo.deliveryStatus === 'confirmed') && (
                        <div className="pt-2 border-t border-slate-900">
                          <label className="block text-[10px] text-slate-500 font-bold mb-1.5 uppercase">Thiết lập ngày giao dự kiến</label>
                          <div className="flex gap-2">
                            <input 
                              type="date"
                              value={estDeliveryDate}
                              onChange={(e) => setEstDeliveryDate(e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 flex-1"
                            />
                            <button
                              onClick={() => updatePoDelivery(selectedPo.id, selectedPo.deliveryStatus || 'pending', { estDeliveryDate })}
                              className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1 rounded border border-slate-700 text-slate-200 font-bold"
                            >
                              Lưu
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800 justify-end">
                {/* 1. Accept PO */}
                {(!selectedPo.deliveryStatus || selectedPo.deliveryStatus === 'pending') && (
                  <button
                    onClick={() => updatePoDelivery(selectedPo.id, 'confirmed')}
                    disabled={updatingStatus !== null}
                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-4 py-2.5 rounded-lg font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-purple-600/10"
                  >
                    {updatingStatus === 'confirmed' && <Clock className="w-4 h-4 animate-spin" />}
                    Xác nhận đơn PO
                  </button>
                )}

                {/* 2. Ship PO */}
                {selectedPo.deliveryStatus === 'confirmed' && (
                  <button
                    onClick={() => updatePoDelivery(selectedPo.id, 'shipping')}
                    disabled={updatingStatus !== null}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2.5 rounded-lg font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-blue-600/10"
                  >
                    {updatingStatus === 'shipping' && <Clock className="w-4 h-4 animate-spin" />}
                    Bắt đầu giao hàng (Xuất kho NCC)
                  </button>
                )}

                {/* 3. Deliver PO with QR code */}
                {selectedPo.deliveryStatus === 'shipping' && (
                  <>
                    <button
                      onClick={() => setShowQrModal(true)}
                      className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs px-4 py-2.5 rounded-lg font-bold transition-all flex items-center gap-1.5"
                    >
                      <QrCode className="w-4 h-4 text-blue-400" /> Tạo mã QR giao nhận
                    </button>
                    <button
                      onClick={() => updatePoDelivery(selectedPo.id, 'delivered')}
                      disabled={updatingStatus !== null}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2.5 rounded-lg font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-emerald-600/10"
                    >
                      {updatingStatus === 'delivered' && <Clock className="w-4 h-4 animate-spin" />}
                      Xác nhận Đã giao tới Kho
                    </button>
                  </>
                )}

                {selectedPo.deliveryStatus === 'delivered' && (
                  <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/25">
                    <CheckCircle2 className="w-4 h-4" /> Giao hàng hoàn tất & Đã nhập kho VComm 🟢
                  </span>
                )}
              </div>

            </div>
          )}

        </div>

      </main>

      {/* QR Code Delivery Note Modal */}
      {showQrModal && selectedPo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full text-center relative space-y-4">
            <h3 className="text-sm font-bold text-slate-200">Mã QR Phiếu giao hàng (Delivery Note)</h3>
            <p className="text-[11px] text-slate-400">Nhân viên kho VComm có thể quét mã này bằng điện thoại hoặc camera ERP để xác nhận nhập kho nhanh.</p>
            
            <div className="bg-white p-4 rounded-xl inline-block border border-slate-250 mx-auto shadow-inner">
              {/* Visual Simulated QR code using CSS */}
              <div className="w-48 h-48 bg-slate-950 flex flex-col items-center justify-center p-2 relative overflow-hidden rounded">
                <div className="absolute inset-0 bg-[radial-gradient(#2563eb_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
                <QrCode className="w-32 h-32 text-blue-400" />
                <span className="text-[10px] text-slate-400 font-mono tracking-widest mt-2">DN-{selectedPo.id.replace('PR-', '')}</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-left text-xs font-mono space-y-1.5 text-slate-300">
              <p>Mã PO: PO-{selectedPo.id.replace('PR-', '')}</p>
              <p>Sản phẩm: {selectedPo.title}</p>
              <p>Số lượng: {selectedPo.itemsCount} đơn vị</p>
              <p>Nhà cung cấp: {currentSupplier?.name}</p>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 rounded-lg font-bold transition-colors"
            >
              Đóng cửa sổ
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
