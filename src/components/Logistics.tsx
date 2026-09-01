import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Package, Search, Filter, ChevronDown, CheckCircle2, AlertCircle, Clock, CreditCard, DollarSign } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { db, collection, query, where, onSnapshot, orderBy } from '../services/dbService';
import { reconcileCodStatement } from '../services/codReconciliationService';

/**
 * Shipment view-model build từ orders thật:
 * - Đơn có carrier/tracking và status từ 'paid' trở đi → coi là đang trong hành trình vận chuyển.
 * - Map order.status → shipment.status: pending (chờ lấy), delivering (đang giao),
 *   delivered (đã giao), returned (chuyển hoàn/cancelled).
 */
interface ShipmentRow {
  id: string;
  orderId: string;
  customer: string;
  address: string;
  partner: string;
  fee: number;
  status: 'pending' | 'delivering' | 'delivered' | 'returned';
  trackingCode: string;
  estimatedDate: string;
  seller: string;
}

function orderToShipment(o: any): ShipmentRow | null {
  // Chỉ những đơn đã vào chuỗi vận chuyển (có đối tác vận chuyển gán)
  if (!o.carrier) return null;
  const status: ShipmentRow['status'] =
    o.status === 'delivered' || o.status === 'completed' ? 'delivered'
    : o.status === 'cancelled' || o.status === 'returned' ? 'returned'
    : o.status === 'shipped' ? 'delivering'
    : 'pending'; // paid/confirmed/allocated/picking/packed → chờ lấy hàng
  return {
    id: o.id,
    orderId: o.id,
    customer: o.customerName || 'N/A',
    address: o.customerAddress || o.customer_address || '',
    partner: o.carrier,
    fee: Number(o.shippingCost || o.shipping_cost || 0),
    status,
    trackingCode: o.tracking || o.id,
    estimatedDate: o.estimatedDate || '',
    seller: o.sellerName || o.sellerId || 'VComm'
  };
}

export function Logistics() {
  const { staffInfo } = useAuth();
  const isSeller = staffInfo?.role === 'seller';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [activeTab, setActiveTab] = useState<'shipments' | 'reconciliation'>('shipments');
  
  const [codOrders, setCodOrders] = useState<any[]>([]);
  const [loadingCod, setLoadingCod] = useState(false);
  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(true);

  const [selectedTrackingCode, setSelectedTrackingCode] = useState('');
  const [actualAmount, setActualAmount] = useState<number | ''>('');
  const [carrierName, setCarrierName] = useState('Giao Hàng Tiết Kiệm');
  const [reconcileResult, setReconcileResult] = useState<{
    success: boolean;
    status: string;
    message: string;
  } | null>(null);
  const [submittingReconcile, setSubmittingReconcile] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  /**
   * ⑥ Xác nhận giao hàng thành công → đồng bộ orders.status='delivered'.
   * Kích hoạt chuỗi downstream tự động: settlement_status='pending' (đối soát seller),
   * escrow delivered (đếm retention giải ngân), ZNS thông báo khách.
   */
  const confirmDelivery = async (item: { id: string; orderId: string }) => {
    if (!item.orderId || item.orderId === 'N/A') return;
    setSyncingId(item.id);
    try {
      const { updateDoc } = await import('../services/dbService');
      const orderRef = { path: `orders/${item.orderId}`, tableName: 'orders', id: item.orderId };
      await updateDoc(orderRef as any, {
        status: 'delivered',
        settlement_status: 'pending',
        delivered_at: new Date().toISOString()
      });
      // Escrow: bắt đầu đếm retention (nếu đơn có escrow)
      try {
        const { getEscrowByOrderId, markEscrowDelivered } = await import('../services/escrowService');
        const escrow = await getEscrowByOrderId(item.orderId);
        if (escrow) await markEscrowDelivered(escrow.id);
      } catch (e: any) {
        console.warn('[Logistics] Escrow mark delivered thất bại:', e.message);
      }
      alert(`Đã xác nhận giao thành công đơn ${item.orderId}. Đơn chuyển sang "Đã hoàn tất", sẵn sàng đối soát seller.`);
    } catch (err: any) {
      console.error('[Logistics] Sync delivered thất bại:', err);
      alert('Lỗi đồng bộ: ' + (err.message || err));
    } finally {
      setSyncingId(null);
    }
  };

  useEffect(() => {
    if (!isSeller && activeTab === 'reconciliation') {
      setLoadingCod(true);
      const q = query(collection(db, 'orders'), where('paymentMethod', '==', 'cod'));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          setCodOrders(data);
          setLoadingCod(false);
        },
        (err) => {
          console.error(err);
          setLoadingCod(false);
        }
      );
      return () => unsub();
    }
  }, [activeTab, isSeller]);

  // Vận đơn thật từ orders (có carrier) — realtime
  useEffect(() => {
    setLoadingShipments(true);
    const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .map(orderToShipment)
          .filter((s): s is ShipmentRow => s !== null);
        setShipments(rows);
        setLoadingShipments(false);
      },
      (err) => {
        console.error('[Logistics] Lỗi tải vận đơn:', err);
        setLoadingShipments(false);
      }
    );
    return () => unsub();
  }, []);

  const handleReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrackingCode || !actualAmount) return;

    setSubmittingReconcile(true);
    setReconcileResult(null);
    try {
      const res = await reconcileCodStatement(selectedTrackingCode, Number(actualAmount), carrierName);
      setReconcileResult({
        success: res.success,
        status: res.status,
        message: res.message
      });
      if (res.success) {
        setSelectedTrackingCode('');
        setActualAmount('');
      }
    } catch (err: any) {
      setReconcileResult({
        success: false,
        status: 'error',
        message: `Lỗi: ${err.message || err}`
      });
    } finally {
      setSubmittingReconcile(false);
    }
  };

  const filteredLogistics = shipments.filter(item => {
    const matchesSearch = (item.trackingCode?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (item.orderId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (item.customer?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
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

      {!isSeller && (
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('shipments')}
            className={cn(
              "px-5 py-2.5 text-sm font-semibold border-b-2 transition-all",
              activeTab === 'shipments'
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            Hành trình vận đơn
          </button>
          <button
            onClick={() => setActiveTab('reconciliation')}
            className={cn(
              "px-5 py-2.5 text-sm font-semibold border-b-2 transition-all",
              activeTab === 'reconciliation'
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            Đối soát COD chéo
          </button>
        </div>
      )}

      {activeTab === 'shipments' ? (
        <>
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
                          <div className="flex items-center justify-end gap-2">
                            {formatCurrency(item.fee)}
                            {!isSeller && item.status !== 'delivered' && (
                              <button
                                onClick={() => confirmDelivery(item)}
                                disabled={syncingId === item.id}
                                title="Xác nhận giao thành công — đồng bộ orders, kích hoạt kế toán, escrow & đối soát seller"
                                className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all disabled:opacity-50 shrink-0"
                              >
                                {syncingId === item.id ? 'Đang lưu...' : 'Xác nhận đã giao'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  
                  {loadingShipments ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        Đang tải vận đơn từ đơn hàng...
                      </td>
                    </tr>
                  ) : filteredLogistics.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        Chưa có vận đơn nào. Vận đơn tự xuất hiện khi đơn hàng được gắn
                        đối tác vận chuyển (carrier) trong Quản lý Đơn hàng.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom duration-300">
          <div className="lg:col-span-1 bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
              <DollarSign className="w-5 h-5 text-primary-600" />
              Thực hiện Đối soát COD
            </h3>

            <form onSubmit={handleReconcile} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">Mã vận đơn đối tác (GHTK/GHN...)</label>
                <select
                  value={selectedTrackingCode}
                  onChange={(e) => setSelectedTrackingCode(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  required
                >
                  <option value="">-- Chọn vận đơn cần đối soát --</option>
                  {codOrders
                    .filter(o => o.codReconciliationStatus !== 'matched')
                    .map(o => (
                      <option key={o.id} value={o.trackingCode || o.id}>
                        {o.trackingCode || o.id} ({o.customerName} - {formatCurrency(o.total)})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">Số tiền COD thực nhận từ đối tác</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">đ</span>
                  <input
                    type="number"
                    value={actualAmount}
                    onChange={(e) => setActualAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Nhập số tiền chuyển khoản thực tế..."
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">Đối tác vận chuyển</label>
                <select
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  <option value="Giao Hàng Tiết Kiệm">Giao Hàng Tiết Kiệm (GHTK)</option>
                  <option value="Giao Hàng Nhanh">Giao Hàng Nhanh (GHN)</option>
                  <option value="Viettel Post">Viettel Post</option>
                  <option value="Ninja Van">Ninja Van</option>
                </select>
              </div>

              {reconcileResult && (
                <div className={cn(
                  "p-3.5 rounded-lg text-xs font-semibold leading-relaxed border",
                  reconcileResult.success && reconcileResult.status === 'matched'
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : reconcileResult.status === 'discrepancy'
                      ? "bg-rose-50 border-rose-200 text-rose-800"
                      : "bg-slate-50 border-slate-200 text-slate-800"
                )}>
                  {reconcileResult.message}
                </div>
              )}

              <button
                type="submit"
                disabled={submittingReconcile || !selectedTrackingCode || !actualAmount}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-all animate-pulse"
              >
                Thực hiện Đối soát
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-3 mb-4">
              <Package className="w-5 h-5 text-primary-600" />
              Đơn hàng COD chờ Đối soát
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Mã Đơn / Vận Đơn</th>
                    <th className="px-4 py-3 font-semibold">Khách Hàng</th>
                    <th className="px-4 py-3 font-semibold">Trạng Thái</th>
                    <th className="px-4 py-3 font-semibold text-right">Tổng Tiền COD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingCod ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                        Đang tải danh sách...
                      </td>
                    </tr>
                  ) : codOrders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                        Không có đơn hàng COD nào đang chờ đối soát.
                      </td>
                    </tr>
                  ) : (
                    codOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-primary-600">{order.id}</div>
                          <div className="text-xs text-slate-500 mt-0.5">Vận đơn: {order.trackingCode || 'Chưa cập nhật'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{order.customerName}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold",
                            order.codReconciliationStatus === 'matched'
                              ? "bg-emerald-100 text-emerald-800"
                              : order.codReconciliationStatus === 'discrepancy'
                                ? "bg-rose-100 text-rose-800 text-[10px]"
                                : "bg-amber-100 text-amber-800"
                          )}>
                            {order.codReconciliationStatus === 'matched'
                              ? 'Đã đối soát'
                              : order.codReconciliationStatus === 'discrepancy'
                                ? 'Lệch đối soát (treo 1388)'
                                : 'Chờ đối soát'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {formatCurrency(order.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
