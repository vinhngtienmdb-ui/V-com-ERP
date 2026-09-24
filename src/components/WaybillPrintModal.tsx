import React, { useRef } from 'react';
import { X, Printer, CheckCircle2, Truck, Copy, Download, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { SHIPPING_CARRIERS, maskPhoneNumber } from '../services/shippingService';

interface WaybillPrintModalProps {
  order: any;
  onClose: () => void;
}

export function WaybillPrintModal({ order, onClose }: WaybillPrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const carrier = SHIPPING_CARRIERS[order.shippingCarrier || 'ghn'] || SHIPPING_CARRIERS.ghn;
  const trackingNumber = order.trackingNumber || `VC${order.id?.slice(-8) || '883921'}`;
  const sortCode = order.sortCode || 'HN-CG-102B';
  const orderSource = order.orderSource || (order.sellerId ? '3P_SELLER' : '1P_VCOMM');

  const senderInfo = orderSource === '1P_VCOMM'
    ? {
        name: 'VCOMM FULFILLMENT HUB (KHO TỔNG)',
        phone: '1900 8888',
        address: 'Kho FBL Cầu Giấy, Lô D4, Cụm CN Cầu Giấy, P. Dịch Vọng Hậu, Q. Cầu Giấy, Hà Nội'
      }
    : {
        name: order.sellerName || 'Gian hàng Chính hãng VComm Partner',
        phone: order.sellerPhone || '0988 123 456',
        address: order.sellerAddress || 'Số 88 Phố Huế, P. Hàng Bài, Q. Hoàn Kiếm, Hà Nội'
      };

  const recipientInfo = {
    name: order.customerName || order.customer || 'Khách hàng VComm',
    phone: order.customerPhone || order.phone || '0912 345 678',
    address: order.shippingAddress || order.address || 'Tầng 12, Tòa nhà V-Center, 29 Liễu Giai, P. Ngọc Khánh, Q. Ba Đình, Hà Nội'
  };

  const items = order.items && order.items.length > 0
    ? order.items
    : [
        {
          name: order.productName || 'Sản phẩm TMĐT VComm',
          quantity: order.quantity || 1,
          weightGram: 350
        }
      ];

  const totalWeight = order.weightGram || items.reduce((acc: number, it: any) => acc + (it.weightGram || 300) * (it.quantity || 1), 0);
  const codAmount = order.paymentMethod === 'cod' ? (order.total || 0) : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg shadow-sm">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                In Vận Đơn TMĐT Tiêu Chuẩn (A6)
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                  Chuẩn 3PL
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Mã vận đơn: <span className="font-mono font-bold text-indigo-600">{trackingNumber}</span> • Hãng: {carrier.name}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Printable Label Area */}
        <div className="p-6 bg-slate-100/50 flex flex-col items-center justify-center overflow-x-auto">
          
          {/* Vận đơn tiêu chuẩn A6 (100mm x 150mm) */}
          <div 
            ref={printRef}
            id="vcomm-printable-waybill"
            className="w-[420px] bg-white border-2 border-slate-900 rounded-lg p-4 text-slate-900 shadow-md font-sans text-xs relative select-none print:m-0 print:border-none print:shadow-none print:w-full"
          >
            {/* Header: VComm + 3PL Carrier */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-orange-600 text-white font-black text-sm flex items-center justify-center">
                  VC
                </div>
                <div>
                  <div className="font-black text-sm tracking-tight leading-none text-slate-900">VCOMM EXPRESS</div>
                  <div className="text-[10px] text-slate-500 font-semibold">SÀN TMĐT VIỆT NAM</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-slate-900 text-white inline-block">
                  {carrier.name}
                </div>
                <div className="text-[10px] text-slate-600 font-mono mt-0.5">Hotline: {carrier.hotline}</div>
              </div>
            </div>

            {/* Mã phân loại bưu cục & Barcode 128 */}
            <div className="border-b-2 border-slate-900 pb-2 mb-2 text-center">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-black bg-slate-200 px-2 py-0.5 rounded">
                  HUB: {sortCode}
                </span>
                <span className="font-mono text-xs font-semibold text-slate-700">
                  {orderSource === '1P_VCOMM' ? '★ KHO VCOMM (1P)' : '🏷️ GIAN HÀNG (3P)'}
                </span>
              </div>

              {/* Barcode Simulation */}
              <div className="py-2 flex flex-col items-center justify-center">
                <div className="font-mono tracking-widest font-black text-lg py-1 px-4 bg-slate-50 border border-dashed border-slate-300 rounded mb-1">
                  ||||| | |||| || ||||| ||| ||||| ||
                </div>
                <div className="font-mono font-black text-sm tracking-wider text-indigo-900">
                  {trackingNumber}
                </div>
              </div>
            </div>

            {/* Thông tin Người gửi & Người nhận */}
            <div className="grid grid-cols-2 gap-2 border-b-2 border-slate-900 pb-2 mb-2">
              {/* Người gửi */}
              <div className="border-r border-slate-300 pr-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Từ (Sender):</div>
                <div className="font-bold text-[11px] text-slate-800 line-clamp-1">{senderInfo.name}</div>
                <div className="text-[10px] text-slate-600">{maskPhoneNumber(senderInfo.phone)}</div>
                <div className="text-[10px] text-slate-600 line-clamp-3 mt-0.5 leading-tight">{senderInfo.address}</div>
              </div>

              {/* Người nhận */}
              <div className="pl-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Đến (Recipient):</div>
                <div className="font-bold text-xs text-slate-950 line-clamp-1">{recipientInfo.name}</div>
                <div className="text-[11px] font-bold text-indigo-700 font-mono">{maskPhoneNumber(recipientInfo.phone)}</div>
                <div className="text-[10px] text-slate-800 line-clamp-3 mt-0.5 leading-tight font-medium">{recipientInfo.address}</div>
              </div>
            </div>

            {/* Nội dung hàng hóa */}
            <div className="border-b-2 border-slate-900 pb-2 mb-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase mb-1">
                <span>Nội dung hàng hóa (Mã ĐH: #{order.id?.slice(-8) || order.id})</span>
                <span>TL: {totalWeight}g</span>
              </div>
              <div className="space-y-1 max-h-16 overflow-hidden">
                {items.slice(0, 3).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-[10px] text-slate-700">
                    <span className="truncate pr-2">• {item.name || item.productName}</span>
                    <span className="font-mono font-bold whitespace-nowrap">x{item.quantity || item.qty || 1}</span>
                  </div>
                ))}
                {items.length > 3 && (
                  <div className="text-[9px] text-slate-400 italic text-right">+ {items.length - 3} sản phẩm khác...</div>
                )}
              </div>
            </div>

            {/* COD & Tiền thu */}
            <div className="border-b-2 border-slate-900 pb-2 mb-2 bg-slate-50 p-2 rounded border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">TIỀN THU NGƯỜI NHẬN (COD):</div>
                <div className="text-base font-black text-rose-600 leading-none mt-1">
                  {codAmount > 0 ? formatCurrency(codAmount) : '0 ₫ (ĐÃ THANH TOÁN ONLINE)'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-semibold text-slate-500">Chỉ dẫn giao hàng:</div>
                <div className="text-[10px] font-bold text-slate-800 bg-amber-100 px-1.5 py-0.5 rounded mt-0.5">
                  CHO XEM HÀNG, KHÔNG THỬ
                </div>
              </div>
            </div>

            {/* Chữ ký người nhận & Lưu ý */}
            <div className="pt-1 flex items-center justify-between text-[9px] text-slate-500">
              <div>
                <div>Cam kết hàng hóa đúng quy định an toàn.</div>
                <div className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Bản quyền vận hành VComm TMĐT
                </div>
              </div>
              <div className="text-center w-24 border-t border-dashed border-slate-300 pt-1">
                Chữ ký người nhận
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Khổ in: <strong className="text-slate-700">Decal nhiệt A6 (100x150mm)</strong> hoặc <strong className="text-slate-700">K80</strong>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              In Vận Đơn Ngay (1-Click)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
