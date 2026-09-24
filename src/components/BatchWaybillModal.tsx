import React, { useRef, useState } from 'react';
import { 
  X, 
  Printer, 
  Truck, 
  CheckCircle2, 
  Download, 
  Layers, 
  Building2, 
  ShieldCheck,
  Send,
  Loader2
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { SHIPPING_CARRIERS, maskPhoneNumber } from '../services/shippingService';

interface BatchWaybillModalProps {
  orders: any[];
  onClose: () => void;
  onBatchDispatch?: (carrierId: string) => Promise<void>;
}

export function BatchWaybillModal({ orders, onClose, onBatchDispatch }: BatchWaybillModalProps) {
  const [selectedCarrier, setSelectedCarrier] = useState<string>('ghn');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  const handlePrintAll = () => {
    window.print();
  };

  const handleDispatch = async () => {
    if (!onBatchDispatch) return;
    setIsDispatching(true);
    try {
      await onBatchDispatch(selectedCarrier);
      setDispatchSuccess(true);
      setTimeout(() => {
        setDispatchSuccess(false);
      }, 3000);
    } catch (err) {
      console.error(err);
      alert('Lỗi bàn giao hàng loạt: ' + err);
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header with Carrier Dispatch Controls */}
        <div className="bg-slate-900 text-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">In Tem Vận Đơn Hàng Loạt (Khổ A6)</h3>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold rounded-full border border-indigo-500/30">
                  {orders.length} Đơn Hàng Đã Chọn
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Xem trước và in ấn tem vận chuyển nhiệt A6 theo chuẩn bưu cục (GHN, Viettel Post, GHTK, SPX, J&T).
              </p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 px-2 font-bold uppercase">Hãng 3PL:</span>
              <select
                value={selectedCarrier}
                onChange={e => setSelectedCarrier(e.target.value)}
                className="bg-slate-900 text-white border-0 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ghn">Giao Hàng Nhanh (GHN)</option>
                <option value="viettel_post">Viettel Post</option>
                <option value="ghtk">Giao Hàng Tiết Kiệm (GHTK)</option>
                <option value="vnpost">VNPost (Bưu Điện Việt Nam)</option>
                <option value="jnt">J&T Express</option>
                <option value="ninja_van">Ninja Van</option>
              </select>
            </div>

            {onBatchDispatch && (
              <button
                onClick={handleDispatch}
                disabled={isDispatching}
                className="px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDispatching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang bàn giao...</span>
                  </>
                ) : dispatchSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Đã bàn giao shipper!</span>
                  </>
                ) : (
                  <>
                    <Truck className="w-3.5 h-3.5" />
                    <span>Bàn Giao Shipper Loạt</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={handlePrintAll}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-500/30 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In Tất Cả ({orders.length} Tem)</span>
            </button>

            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Waybill List with A6 Styling */}
        <div className="p-6 overflow-y-auto bg-slate-100 flex-1 space-y-6">
          <div className="max-w-xl mx-auto space-y-8 print:m-0 print:p-0 print:w-full print:max-w-none">
            {orders.map((order, index) => {
              const carrier = SHIPPING_CARRIERS[order.shippingCarrier || selectedCarrier] || SHIPPING_CARRIERS.ghn;
              const trackingNumber = order.tracking || order.trackingNumber || `VC${order.id?.slice(-8) || '883921'}`;
              const sortCode = order.sortCode || 'HN-CG-102B';
              const items = order.items && order.items.length > 0 ? order.items : [
                { name: order.productName || 'Sản phẩm TMĐT VComm', quantity: order.quantity || 1, weightGram: 350 }
              ];
              const totalWeight = order.weightGram || items.reduce((acc: number, it: any) => acc + (it.weightGram || 300) * (it.quantity || 1), 0);
              const codAmount = order.paymentMethod === 'cod' ? (order.total || 0) : 0;

              return (
                <div 
                  key={order.id || index}
                  className="bg-white border-2 border-dashed border-slate-300 print:border-solid print:border-black rounded-xl p-5 shadow-sm space-y-3 font-sans relative page-break-after"
                  style={{ pageBreakAfter: 'always' }}
                >
                  {/* Badge Index */}
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-slate-100 print:hidden text-slate-500 font-mono text-[10px] font-bold rounded">
                    Tem #{index + 1} / {orders.length}
                  </div>

                  {/* Header: Carrier Logo + Sort Code */}
                  <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2.5">
                    <div>
                      <span className="font-black text-lg tracking-wider text-slate-900 uppercase">
                        {carrier.name}
                      </span>
                      <p className="text-[10px] text-slate-500 font-mono font-bold">HOTLINE: {carrier.hotline}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Mã phân loại</span>
                      <span className="text-lg font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                        {sortCode}
                      </span>
                    </div>
                  </div>

                  {/* Barcode & Tracking Number */}
                  <div className="text-center py-1 border-b border-slate-200">
                    <div className="font-mono tracking-widest text-3xl font-bold select-none text-slate-900 scale-y-125 py-1">
                      ||| | ||||| || |||| ||| |||| |
                    </div>
                    <p className="font-mono text-xs font-black text-slate-900 tracking-widest mt-0.5">
                      {trackingNumber}
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono">Mã đơn VComm: #{order.id}</p>
                  </div>

                  {/* Sender & Recipient Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs border-b border-slate-200 pb-3">
                    <div className="border-r border-slate-200 pr-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Từ (Người gửi):</span>
                      <p className="font-bold text-slate-900 uppercase text-[11px]">VCOMM FULFILLMENT HUB</p>
                      <p className="text-slate-600 text-[10px] mt-0.5">Hotline: 1900 8888</p>
                      <p className="text-slate-500 text-[10px] line-clamp-2 mt-0.5">Lô D4, Cụm CN Cầu Giấy, P. Dịch Vọng Hậu, Q. Cầu Giấy, Hà Nội</p>
                    </div>

                    <div className="pl-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Đến (Người nhận):</span>
                      <p className="font-bold text-slate-900 text-[11px]">{order.customerName}</p>
                      <p className="text-slate-700 font-mono font-bold text-[10px] mt-0.5">
                        {maskPhoneNumber(order.customerPhone || '0981234567')}
                      </p>
                      <p className="text-slate-700 text-[10px] font-medium mt-0.5 line-clamp-2">
                        {order.shippingAddress || order.address || 'Hà Nội, Việt Nam'}
                      </p>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="border-b border-slate-200 pb-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Nội dung bưu gửi (Đã kiểm tra khớp 100%):</span>
                    <div className="space-y-1">
                      {items.map((it: any, i: number) => (
                        <div key={i} className="flex justify-between text-[11px] text-slate-700">
                          <span className="truncate max-w-[280px]">{i + 1}. {it.name || it.productName}</span>
                          <span className="font-mono font-bold text-slate-900">x{it.quantity || 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer: COD Amount & Signature Box */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-center">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Tiền thu người nhận (COD)</span>
                      <span className="text-base font-black font-mono text-slate-900 block mt-0.5">
                        {codAmount > 0 ? formatCurrency(codAmount) : '0 VNĐ (ĐÃ TT)'}
                      </span>
                      <span className="text-[9px] text-slate-500 block mt-0.5 font-medium">Khối lượng: {totalWeight}g</span>
                    </div>

                    <div className="border border-slate-300 rounded-lg p-2 text-center flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Chữ ký người nhận</span>
                      <span className="text-[9px] text-slate-400 italic mb-1">(Đồng kiểm khi nhận)</span>
                    </div>
                  </div>

                  {/* Bottom Security Note */}
                  <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>In tự động từ VComm Fulfillment System</span>
                    <span className="font-mono font-semibold">TẬN TÂM - TỐC ĐỘ - CHUẨN XÁC</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Hỗ trợ máy in tem mã vạch Xprinter, HPRT, Gprinter khổ A6 (100x150mm) hoặc A7 (75x100mm).
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Đóng
            </button>
            <button
              onClick={handlePrintAll}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In {orders.length} Vận Đơn</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
