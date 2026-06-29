import React, { useState } from 'react';
import { Truck, MapPin, Package, Search, Filter, ChevronDown, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const mockLogistics = [
  {
    id: 'LOG-88231',
    orderId: 'ORD-5501',
    customer: 'Nguyễn Văn A',
    address: 'Quận 1, TP. Hồ Chí Minh',
    partner: 'Giao Hàng Nhanh',
    fee: 25000,
    status: 'delivering',
    trackingCode: 'GHN123456789',
    estimatedDate: '2026-06-28',
    seller: 'Mobile World'
  },
  {
    id: 'LOG-88232',
    orderId: 'ORD-5502',
    customer: 'Trần Thị B',
    address: 'Quận Cầu Giấy, Hà Nội',
    partner: 'Giao Hàng Tiết Kiệm',
    fee: 35000,
    status: 'pending',
    trackingCode: 'GHTK987654321',
    estimatedDate: '2026-06-29',
    seller: 'Fashion Hub'
  },
  {
    id: 'LOG-88233',
    orderId: 'ORD-5503',
    customer: 'Lê Văn C',
    address: 'Hải Châu, Đà Nẵng',
    partner: 'Viettel Post',
    fee: 40000,
    status: 'delivered',
    trackingCode: 'VTP11223344',
    estimatedDate: '2026-06-26',
    seller: 'Eco Mart'
  },
  {
    id: 'LOG-88234',
    orderId: 'ORD-5504',
    customer: 'Phạm Thị D',
    address: 'Quận 3, TP. Hồ Chí Minh',
    partner: 'Ninja Van',
    fee: 22000,
    status: 'returned',
    trackingCode: 'NJV55667788',
    estimatedDate: '2026-06-27',
    seller: 'Mobile World'
  }
];

export function Logistics() {
  const { staffInfo } = useAuth();
  const isSeller = staffInfo?.role === 'seller';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredLogistics = mockLogistics.filter(item => {
    const matchesSearch = item.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesSeller = !isSeller || item.seller === 'Mobile World'; // Mocking "Mobile World" as the seller
    return matchesSearch && matchesStatus && matchesSeller;
  });

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'Chờ lấy hàng', color: 'bg-amber-100 text-amber-800', icon: Clock };
      case 'delivering': return { label: 'Đang giao', color: 'bg-blue-100 text-blue-800', icon: Truck };
      case 'delivered': return { label: 'Đã giao', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 };
      case 'returned': return { label: 'Chuyển hoàn', color: 'bg-rose-100 text-rose-800', icon: AlertCircle };
      default: return { label: 'Không xác định', color: 'bg-slate-100 text-slate-800', icon: Package };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary-600" />
            Vận chuyển & Giao nhận
          </h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý hành trình đơn hàng và đối tác vận chuyển.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-primary-50 text-primary-600 rounded-lg">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-500 font-medium">Tổng vận đơn</div>
            <div className="text-2xl font-bold text-slate-900">{filteredLogistics.length}</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-500 font-medium">Giao thành công</div>
            <div className="text-2xl font-bold text-slate-900">
              {filteredLogistics.filter(l => l.status === 'delivered').length}
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-500 font-medium">Đang xử lý</div>
            <div className="text-2xl font-bold text-slate-900">
              {filteredLogistics.filter(l => l.status === 'pending' || l.status === 'delivering').length}
            </div>
          </div>
        </div>
        {!isSeller && (
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-slate-500 font-medium">Tổng phí vận chuyển</div>
              <div className="text-xl font-bold text-slate-900">
                {formatCurrency(filteredLogistics.reduce((sum, item) => sum + item.fee, 0))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm theo mã vận đơn, mã đơn hàng..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-shadow"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ lấy hàng</option>
                <option value="delivering">Đang giao</option>
                <option value="delivered">Đã giao</option>
                <option value="returned">Chuyển hoàn</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-semibold">Mã Vận Đơn</th>
                <th className="px-6 py-4 font-semibold">Mã Đơn Hàng</th>
                {!isSeller && <th className="px-6 py-4 font-semibold">Gian Hàng</th>}
                <th className="px-6 py-4 font-semibold">Đối Tác</th>
                <th className="px-6 py-4 font-semibold">Trạng Thái</th>
                <th className="px-6 py-4 font-semibold text-right">Phí Vận Chuyển</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogistics.map((item) => {
                const statusInfo = getStatusDisplay(item.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{item.trackingCode}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Dự kiến: {item.estimatedDate}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-primary-600">
                      {item.orderId}
                    </td>
                    {!isSeller && (
                      <td className="px-6 py-4 text-slate-600">
                        {item.seller}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-700">{item.partner}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", statusInfo.color)}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      {formatCurrency(item.fee)}
                    </td>
                  </tr>
                );
              })}
              
              {filteredLogistics.length === 0 && (
                <tr>
                  <td colSpan={isSeller ? 5 : 6} className="px-6 py-12 text-center text-slate-500">
                    Không tìm thấy dữ liệu vận đơn nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
