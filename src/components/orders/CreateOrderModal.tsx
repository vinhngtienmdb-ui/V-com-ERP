import React, { useState, useMemo } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Package, 
  User, 
  MapPin, 
  Truck, 
  DollarSign, 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  Calculator,
  Store,
  Globe,
  PhoneCall
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateOrder: (orderData: any) => void;
  warehouses: any[];
}

const AVAILABLE_PRODUCTS = [
  { id: '1073131895', sku: 'SKU-NAM-01', name: 'Áo Thun Nam Cotton Premium', price: 250000, category: 'Thời trang', stockHN: 150, stockHCM: 200, stockDN: 80 },
  { id: '1073131896', sku: 'SKU-TECH-02', name: 'Laptop LG Gram 14 2026 i7', price: 28500000, category: 'Công nghệ', stockHN: 25, stockHCM: 40, stockDN: 12 },
  { id: '1073131897', sku: 'SKU-GD-03', name: 'Bộ Hộp Cơm Giữ Nhiệt LockLock 3 Ngăn', price: 450000, category: 'Gia dụng', stockHN: 320, stockHCM: 180, stockDN: 95 },
  { id: '1073131898', sku: 'SKU-POS-04', name: 'Máy POS Cầm Tay VComm SmartPay NFC', price: 2200000, category: 'Thiết bị O2O', stockHN: 60, stockHCM: 80, stockDN: 30 },
  { id: '1073131899', sku: 'SKU-MP-05', name: 'Serum Phục Hồi Da B5 GoodnDoc 30ml', price: 380000, category: 'Mỹ phẩm', stockHN: 210, stockHCM: 350, stockDN: 110 }
];

const PRESET_CUSTOMERS = [
  { name: 'Công ty CP Thời Trang H&M Vietnam', phone: '0987654321', address: 'Quận 1, TP.HCM', email: 'hm@vietnam.com', type: 'b2b' },
  { name: 'Gia Dụng LockLock Vietnam', phone: '0912345678', address: 'Cầu Giấy, Hà Nội', email: 'locklock@vietnam.com', type: 'b2b' },
  { name: 'Lê Hoàng Minh', phone: '0909123456', address: 'Hải Châu, Đà Nẵng', email: 'minh.lh@gmail.com', type: 'retail' },
  { name: 'Nguyễn Thị Bích Trâm', phone: '0938112233', address: 'Quận Bình Thạnh, TP.HCM', email: 'tram.ntb@gmail.com', type: 'retail' },
  { name: 'Trần Văn Long', phone: '0903112233', address: 'Đống Đa, Hà Nội', email: 'long.tv@gmail.com', type: 'retail' }
];

export function CreateOrderModal({ isOpen, onClose, onCreateOrder, warehouses }: CreateOrderModalProps) {
  if (!isOpen) return null;

  // Form states
  const [channel, setChannel] = useState<'o2o' | 'b2b' | 'pos' | 'manual'>('o2o');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('WH-HN-01');
  const [carrier, setCarrier] = useState('GHN Fast');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank_transfer' | 'e_wallet' | 'b2b_credit'>('cod');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [note, setNote] = useState('');

  const [orderItems, setOrderItems] = useState<{
    productId: string;
    productName: string;
    sku: string;
    price: number;
    quantity: number;
    total: number;
  }[]>([
    {
      productId: AVAILABLE_PRODUCTS[0].id,
      productName: AVAILABLE_PRODUCTS[0].name,
      sku: AVAILABLE_PRODUCTS[0].sku,
      price: AVAILABLE_PRODUCTS[0].price,
      quantity: 1,
      total: AVAILABLE_PRODUCTS[0].price
    }
  ]);

  // Geo-routing tự động gợi ý kho dựa trên địa chỉ khách hàng
  const autoSuggestedWarehouse = useMemo(() => {
    const addr = address.toLowerCase();
    if (addr.includes('hcm') || addr.includes('hồ chí minh') || addr.includes('quận 1') || addr.includes('bình thạnh') || addr.includes('miền nam')) {
      return warehouses.find(w => w.id.includes('HCM')) || warehouses[1] || warehouses[0];
    }
    if (addr.includes('đà nẵng') || addr.includes('dn') || addr.includes('miền trung') || addr.includes('hải châu')) {
      return warehouses.find(w => w.id.includes('DN')) || warehouses[2] || warehouses[0];
    }
    // Default Hà Nội
    return warehouses.find(w => w.id.includes('HN')) || warehouses[0];
  }, [address, warehouses]);

  // Áp dụng khách hàng mẫu
  const handleSelectCustomer = (cust: any) => {
    setCustomerName(cust.name);
    setPhone(cust.phone);
    setAddress(cust.address);
    if (cust.type === 'b2b') {
      setChannel('b2b');
      setPaymentMethod('b2b_credit');
    }
    // Gợi ý kho tự động
    const addr = cust.address.toLowerCase();
    if (addr.includes('hcm') || addr.includes('hồ chí minh') || addr.includes('quận 1') || addr.includes('bình thạnh')) {
      setSelectedWarehouseId(warehouses.find(w => w.id.includes('HCM'))?.id || 'WH-HCM-01');
    } else if (addr.includes('đà nẵng') || addr.includes('hải châu')) {
      setSelectedWarehouseId(warehouses.find(w => w.id.includes('DN'))?.id || 'WH-DN-01');
    } else {
      setSelectedWarehouseId(warehouses.find(w => w.id.includes('HN'))?.id || 'WH-HN-01');
    }
  };

  // Thêm dòng sản phẩm
  const handleAddItem = () => {
    const defaultProd = AVAILABLE_PRODUCTS[0];
    setOrderItems(prev => [
      ...prev,
      {
        productId: defaultProd.id,
        productName: defaultProd.name,
        sku: defaultProd.sku,
        price: defaultProd.price,
        quantity: 1,
        total: defaultProd.price
      }
    ]);
  };

  // Cập nhật sản phẩm
  const handleUpdateItem = (index: number, productId: string) => {
    const prod = AVAILABLE_PRODUCTS.find(p => p.id === productId);
    if (!prod) return;
    setOrderItems(prev => {
      const next = [...prev];
      const current = next[index];
      next[index] = {
        ...current,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        price: prod.price,
        total: prod.price * current.quantity
      };
      return next;
    });
  };

  const handleUpdateQuantity = (index: number, qty: number) => {
    const safeQty = Math.max(1, qty);
    setOrderItems(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        quantity: safeQty,
        total: next[index].price * safeQty
      };
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  // Tính toán tài chính
  const subtotal = orderItems.reduce((s, it) => s + it.total, 0);
  const shippingFee = channel === 'pos' ? 0 : 35000;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      alert('Vui lòng điền đầy đủ Tên khách hàng, SĐT và Địa chỉ giao hàng!');
      return;
    }
    if (orderItems.length === 0) {
      alert('Vui lòng thêm ít nhất 1 sản phẩm vào đơn hàng!');
      return;
    }

    const newOrderId = `ORD-2026-${String(Date.now()).slice(-4)}`;
    const newTracking = `${carrier.slice(0, 3).toUpperCase()}${Date.now().toString().slice(-8)}`;

    const newOrder = {
      id: newOrderId,
      customerName,
      phone,
      address,
      date: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
      total: grandTotal,
      status: 'pending',
      channel,
      paymentMethod,
      carrier,
      tracking: newTracking,
      shippingCost: shippingFee,
      routedWarehouse: selectedWarehouseId,
      items: orderItems.map(it => ({
        productId: it.productId,
        productName: it.productName,
        price: it.price,
        quantity: it.quantity,
        sku: it.sku
      })),
      note,
      misaSynced: false,
      einvoiceStatus: 'pending',
      codAccrued: false
    };

    onCreateOrder(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/40 rounded-xl border border-indigo-400/30">
              <Package className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Tạo Đơn Hàng Mới (New Order Studio)</h3>
              <p className="text-[11px] text-indigo-200">Đa kênh B2B, Telesale, O2O & Tự động điều phối kho (Geo-Routing)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {/* Sales Channel Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 block">Kênh Bán Hàng & Phân Loại Đơn:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'o2o', label: 'VComm O2O App', icon: Globe, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
                { id: 'b2b', label: 'Hợp đồng Đại lý B2B', icon: Building2, color: 'text-purple-600 bg-purple-50 border-purple-200' },
                { id: 'pos', label: 'Cửa hàng POS Quầy', icon: Store, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                { id: 'manual', label: 'Telesale / Tư Vấn', icon: PhoneCall, color: 'text-blue-600 bg-blue-50 border-blue-200' },
              ].map(ch => (
                <button
                  type="button"
                  key={ch.id}
                  onClick={() => setChannel(ch.id as any)}
                  className={cn(
                    "p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all font-bold",
                    channel === ch.id 
                      ? `${ch.color} ring-2 ring-indigo-500 shadow-2xs` 
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <ch.icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{ch.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick CRM Customer Presets */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Chọn nhanh Khách hàng từ Danh bạ CRM Doanh nghiệp:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_CUSTOMERS.map((cust, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSelectCustomer(cust)}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-lg text-[11px] font-medium transition-all text-slate-700 flex items-center gap-1"
                >
                  <User className="w-3 h-3 text-slate-400" />
                  {cust.name} ({cust.address.split(',')[0]})
                </button>
              ))}
            </div>
          </div>

          {/* Customer Info Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tên khách hàng / Đơn vị mua *</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Nguyễn Văn A / Công ty..."
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Số điện thoại liên hệ *</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="0912345678"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Địa chỉ giao hàng (Tính cước & Kho) *</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="VD: Cầu Giấy, Hà Nội hoặc Quận 1, TP.HCM"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          {/* Geo-Routing: Auto-Assigned Warehouse */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Kho xuất hàng tự động (Geo-Routing thông minh):
              </span>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Hệ thống tự động điều phối về kho gần khách hàng nhất để tiết kiệm phí ship & giao nhanh:
              </p>
            </div>
            <select
              value={selectedWarehouseId}
              onChange={e => setSelectedWarehouseId(e.target.value)}
              className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-900 rounded-lg font-bold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 shrink-0"
            >
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.address.split(',')[w.address.split(',').length - 1]?.trim() || w.address})
                </option>
              ))}
            </select>
          </div>

          {/* Product Items Selection Table */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-800">Danh mục sản phẩm đặt mua:</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm sản phẩm
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] font-bold uppercase">
                  <tr>
                    <th className="p-2.5">Sản phẩm & Tồn kho</th>
                    <th className="p-2.5 w-24 text-center">Số lượng</th>
                    <th className="p-2.5 w-32 text-right">Đơn giá</th>
                    <th className="p-2.5 w-32 text-right">Thành tiền</th>
                    <th className="p-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orderItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2">
                        <select
                          value={item.productId}
                          onChange={e => handleUpdateItem(idx, e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-medium"
                        >
                          {AVAILABLE_PRODUCTS.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} — {formatCurrency(p.price)} (Tồn: {p.stockHN + p.stockHCM + p.stockDN})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => handleUpdateQuantity(idx, Number(e.target.value))}
                          className="w-full px-2 py-1 border border-slate-200 rounded text-center font-bold text-xs"
                        />
                      </td>
                      <td className="p-2 text-right font-mono font-medium text-slate-700">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="p-2 text-center">
                        {orderItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-400 hover:text-red-500 p-1 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delivery & Payment Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="font-bold text-slate-800 block">Đơn vị vận chuyển 3PL:</label>
              <select
                value={carrier}
                onChange={e => setCarrier(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
              >
                <option value="GHN Fast">GHN Fast (Giao Hàng Nhanh)</option>
                <option value="GHTK">GHTK (Giao Hàng Tiết Kiệm)</option>
                <option value="Viettel Post">Viettel Post Standard</option>
                <option value="VNPost">VNPost Express</option>
                <option value="VComm Express 2h">VComm Express (Nội thành 2H)</option>
              </select>

              <label className="font-bold text-slate-800 block pt-1">Ghi chú giao hàng:</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Giao giờ hành chính, gọi trước khi giao..."
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="font-bold text-slate-800 block">Hình thức thanh toán:</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
              >
                <option value="cod">Tiền mặt khi nhận hàng (COD)</option>
                <option value="bank_transfer">Chuyển khoản VietQR 247</option>
                <option value="e_wallet">Ví điện tử / Thẻ thanh toán</option>
                <option value="b2b_credit">Bảo lãnh công nợ B2B (Hạn mức 30 ngày)</option>
              </select>

              <div className="pt-2 flex justify-between items-center text-slate-600">
                <span>Chiết khấu / Mã giảm giá (₫):</span>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={e => setDiscountAmount(Number(e.target.value) || 0)}
                  className="w-28 px-2 py-1 bg-white border border-slate-300 rounded text-right font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Tạm tính tiền hàng:</span>
              <span className="font-mono font-bold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Phí vận chuyển 3PL:</span>
              <span className="font-mono font-bold">{formatCurrency(shippingFee)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Chiết khấu khuyến mại:</span>
                <span className="font-mono font-bold">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="border-t border-indigo-200 pt-2 flex justify-between items-center text-sm font-black text-indigo-950">
              <span>Tổng thanh toán thực thu:</span>
              <span className="text-base text-indigo-700 font-mono">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-2 flex justify-between items-center border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-900/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Xác Nhận & Tạo Đơn Hàng Ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
