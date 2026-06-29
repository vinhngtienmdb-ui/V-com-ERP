import React, { useState, useEffect } from 'react';
import { X, Printer, Check, Loader2, Sparkles, Smile } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface QuickPrintModalProps {
  order: {
    id: string;
    customerName: string;
    date: string;
    total: number;
    paymentMethod: string;
    items?: any[];
    carrier?: string;
    tracking?: string;
    shippingCost?: number;
  } | null;
  onClose: () => void;
}

export function QuickPrintModal({ order, onClose }: QuickPrintModalProps) {
  const [printStatus, setPrintStatus] = useState<'idle' | 'linking' | 'printing' | 'completed'>('idle');

  useEffect(() => {
    if (!order) return;
    setPrintStatus('idle');
  }, [order]);

  if (!order) return null;

  // Standardize item data
  const normalizedItems = order.items && order.items.length > 0 
    ? order.items.map(it => ({
        name: it.name || it.productName || 'Sản phẩm dịch vụ',
        price: it.price || 0,
        qty: it.quantity || it.qty || 1
      }))
    : [
        {
          name: `Đơn hàng #${order.id.split('-').pop()}`,
          price: order.total,
          qty: 1
        }
      ];

  const subtotal = normalizedItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const vatAmount = Math.round(subtotal * 0.08); // 8% VAT
  const shippingFee = order.shippingCost || 0;
  const discountAmount = Math.max(0, (subtotal + vatAmount + shippingFee) - order.total);

  const paymentLabels: Record<string, string> = {
    cod: 'Thanh toán COD',
    bank_transfer: 'Chuyển khoản Ngân hàng',
    e_wallet: 'Ví điện tử',
    cash: 'Tiền mặt tại quầy',
    qr: 'Quét mã QR iPOS',
    pos: 'Quẹt thẻ POS',
    loyalty: 'Điểm thành viên'
  };

  const paymentLabel = paymentLabels[order.paymentMethod] || order.paymentMethod || 'Tiền mặt';

  const handlePrintAction = () => {
    // 1. Show "linking to printer..." state
    setPrintStatus('linking');
    
    setTimeout(() => {
      // 2. Transition to native print dialogue
      setPrintStatus('printing');
      
      // We will actually call window.print() but wrap inside a setTimeout so DOM has updated status
      setTimeout(() => {
        window.print();
        // 3. Show "completed" state after printing dialog closes
        setPrintStatus('completed');
        
        // Auto-close modal after brief success presentation
        setTimeout(() => {
          onClose();
        }, 1200);
      }, 350);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 print:hidden animate-fade-in">
      <div className="bg-slate-100 dark:bg-slate-900 w-full max-w-lg rounded-none border border-slate-300 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header Controls */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-sm">
              <Printer className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">
                Lệnh in nhanh Biên lai POS
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">
                Mã đơn: #{order.id.split('-').pop()}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-sm text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Banner */}
        <div className="shrink-0">
          {printStatus === 'linking' && (
            <div className="bg-yellow-500 text-slate-950 text-xs font-black px-6 py-2.5 flex items-center gap-2 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              ĐANG KẾT NỐI VỚI MÁY IN KHÔNG DÂY (CỔNG K80)... VUI LÒNG ĐỢI
            </div>
          )}
          {printStatus === 'printing' && (
            <div className="bg-primary-600 text-white text-xs font-black px-6 py-2.5 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              ĐANG GỬI TẬP LỆNH IN K80 ĐỂ IN NATIVE...
            </div>
          )}
          {printStatus === 'completed' && (
            <div className="bg-emerald-600 text-white text-xs font-black px-6 py-2.5 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              IN HOÀN TẤT! ĐÃ GHI NHẬN LỊCH SỬ BIÊN LAI TRỰC TIẾP.
            </div>
          )}
          {printStatus === 'idle' && (
            <div className="bg-slate-800 text-slate-300 text-[10px] font-bold px-6 py-2 uppercase tracking-wider flex justify-between items-center">
              <span>Thiết bị: Citizen CT-S310II (80mm)</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> Trực tuyến</span>
            </div>
          )}
        </div>

        {/* Receipt Slip Preview (Thermal receipt Simulation) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-200 dark:bg-slate-950/80 flex justify-center custom-scrollbar">
          
          {/* Scrollable Receipt paper container */}
          <div className="w-[80mm] min-h-[380px] bg-white border border-slate-300/80 shadow-md p-4 relative font-mono text-slate-900 text-xs leading-relaxed flex flex-col select-none select-text">
            
            {/* Top jagged paper edge effect */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[radial-gradient(circle,transparent_20%,#e2e8f0_21%,#e2e8f0_34%,transparent_35%,transparent_100%)] bg-[length:6px_12px] bg-repeat-x -translate-y-0.5 pointer-events-none" />

            {/* Receipt Header */}
            <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-300">
              <h4 className="font-extrabold text-sm uppercase tracking-tight leading-tight">iPOS OMNICHANNEL</h4>
              <p className="text-[10px] text-slate-600 font-bold uppercase leading-tight">Hệ Thống Bán Lẻ & Giao Vận</p>
              <div className="text-[9px] text-slate-500 mt-1 space-y-0.5">
                <p>CS1: 128 Trần Hưng Đạo, Q1, TPHCM</p>
                <p>CS2: Lô C3-2, KCN Cát Lái, Q2, TPHCM</p>
                <p>Hotline: 1900.6789 - ipos.com.vn</p>
              </div>
            </div>

            {/* Invoice Info */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-[10px] font-medium text-slate-700">
              <div className="text-center font-extrabold text-slate-950 text-xs uppercase py-1 mb-1 tracking-wider border border-slate-900">
                HÓA ĐƠN BÁN HÀNG CHUYỂN PHÁT
              </div>
              <p><span className="font-bold">Mã Đơn:</span> {order.id}</p>
              <p><span className="font-bold">Thời gian:</span> {order.date}</p>
              <p><span className="font-bold">Khách:</span> <span className="font-bold text-slate-950">{order.customerName}</span></p>
              <p><span className="font-bold">Thanh toán:</span> {paymentLabel}</p>
              {order.carrier && (
                <p><span className="font-bold">ĐVVC:</span> {order.carrier} | <span className="font-bold">{order.tracking}</span></p>
              )}
            </div>

            {/* Table Header */}
            <div className="pt-2 text-[10px] font-bold text-slate-900 flex justify-between uppercase">
              <span className="w-1/12 text-center">SL</span>
              <span className="w-7/12 text-left">TÊN SP</span>
              <span className="w-4/12 text-right">ĐƠN GIÁ</span>
            </div>
            
            <div className="h-0 border-b border-dashed border-slate-400 my-1.5" />

            {/* Line Items */}
            <div className="space-y-2 text-[10px]">
              {normalizedItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <span className="w-1/12 text-center text-slate-700">{item.qty}</span>
                  <span className="w-7/12 text-left text-slate-950 font-bold truncate leading-tight pr-1">{item.name}</span>
                  <span className="w-4/12 text-right text-slate-900 font-bold">{formatCurrency(item.price)}</span>
                </div>
              ))}
            </div>

            <div className="h-0 border-b border-dashed border-slate-300 my-2.5" />

            {/* Subtotal & Extras */}
            <div className="space-y-1 text-[10px] pr-0 text-slate-800">
              <div className="flex justify-between">
                <span>Cộng tiền hàng:</span>
                <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (8%):</span>
                <span>{formatCurrency(vatAmount)}</span>
              </div>
              {shippingFee > 0 && (
                <div className="flex justify-between">
                  <span>Phí ship dự kiến:</span>
                  <span>{formatCurrency(shippingFee)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>Chiết khấu giảm:</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
            </div>

            <div className="h-0 border-b border-slate-900 my-2" />

            {/* Grand Total */}
            <div className="flex justify-between items-center text-right py-1">
              <span className="text-xs font-black uppercase text-slate-950">TỔNG THANH TOÁN:</span>
              <span className="text-sm font-black text-slate-950">{formatCurrency(order.total)}</span>
            </div>

            <div className="h-0 border-b border-dashed border-slate-300 my-2" />

            {/* Bottom Note & QR Code */}
            <div className="text-center pt-2 space-y-2">
              <div className="text-[9px] text-slate-500 italic space-y-0.5">
                <p>Cảm ơn quý khách đã tin cậy iPOS!</p>
                <p>Biên lai in nhanh trực tiếp không qua chi tiết.</p>
                <p>Hệ thống CSKH AI tự động rà soát RMA.</p>
              </div>

              {/* Simulating code line lines */}
              <div className="mx-auto w-32 h-6 flex items-center justify-between opacity-80 pt-1">
                {[1, 3, 2, 4, 1, 3, 2, 4, 2, 1, 3, 4, 2, 1, 3, 2, 4, 1, 3].map((heightVal, idx) => (
                  <div 
                    key={idx} 
                    className="bg-black" 
                    style={{ 
                      width: idx % 3 === 0 ? '2px' : idx % 5 === 0 ? '3px' : '1px', 
                      height: `${heightVal * 5 + 6}px`
                    }} 
                  />
                ))}
              </div>
              <p className="text-[8px] tracking-[0.25em] font-mono text-slate-500 uppercase">{order.id}</p>
            </div>

            {/* Bottom jagged paper edge effect */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[radial-gradient(circle,transparent_20%,#e2e8f0_21%,#e2e8f0_34%,transparent_35%,transparent_100%)] bg-[length:6px_12px] bg-repeat-x translate-y-0.5 pointer-events-none" />

          </div>
        </div>

        {/* Action Button Footer */}
        <div className="bg-white p-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-sm text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all uppercase"
          >
            Đóng
          </button>
          <button
            onClick={handlePrintAction}
            disabled={printStatus !== 'idle'}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-5 py-2 rounded-sm text-xs font-black shadow-sm flex items-center gap-2 transition-all uppercase active:scale-95"
          >
            {printStatus === 'idle' ? (
              <>
                <Printer className="w-4 h-4" /> Bắn lệnh in ngay
              </>
            ) : (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Đang in...
              </>
            )}
          </button>
        </div>

      </div>

      {/* ==========================================================
          OFFSCREEN PRINTABLE THERMAL RECEIPT
          This container triggers during standard print (Ctrl + P / window.print())
          Visible ONLY to thermal printers according to `#pos-print-document` rules
          ========================================================== */}
      <div 
        id="pos-print-document" 
        className="hidden print:block leading-relaxed bg-white text-black p-4 font-mono select-none"
        style={{ width: '80mm', fontFamily: 'monospace', fontSize: '10px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>iPOS OMNICHANNEL</h4>
          <p style={{ margin: '2px 0 0', fontSize: '8px', fontWeight: 'bold' }}>Hệ Thống Bán Lẻ & Giao Vận</p>
          <p style={{ margin: '4px 0 0', fontSize: '7px' }}>CS1: 128 Trần Hưng Đạo, Q1, TPHCM</p>
          <p style={{ margin: '1px 0 0', fontSize: '7px' }}>CS2: Lô C3-2, KCN Cát Lái, Q2, TPHCM</p>
          <p style={{ margin: '1px 0 0', fontSize: '7px' }}>Hotline: 1900.6789</p>
        </div>

        <div style={{ borderBottom: '1px dashed #000', paddingBottom: '4px', marginBottom: '4px', fontSize: '8px' }}>
          <div style={{ textTransform: 'uppercase', fontWeight: 'bold', fontSize: '9px', textAlign: 'center', border: '1px solid #000', margin: '4px 0', padding: '2px' }}>
            HÓA ĐƠN BÁN HÀNG CHUYỂN PHÁT
          </div>
          <div>Mã Đơn: {order.id}</div>
          <div>Thời gian: {order.date}</div>
          <div>Khách: {order.customerName}</div>
          <div>Thanh toán: {paymentLabel}</div>
          {order.carrier && (
            <div>ĐVVC: {order.carrier} | {order.tracking}</div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '8px' }}>
          <div style={{ width: '10%', textAlign: 'center' }}>SL</div>
          <div style={{ width: '60%', textAlign: 'left' }}>TÊN SP</div>
          <div style={{ width: '30%', textAlign: 'right' }}>ĐƠN GIÁ</div>
        </div>
        <div style={{ borderBottom: '1px dashed #000', margin: '2px 0' }} />

        <div style={{ fontSize: '8px' }}>
          {normalizedItems.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
              <div style={{ width: '10%', textAlign: 'center' }}>{item.qty}</div>
              <div style={{ width: '60%', textAlign: 'left', fontWeight: 'bold' }}>{item.name}</div>
              <div style={{ width: '30%', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(item.price)}</div>
            </div>
          ))}
        </div>

        <div style={{ borderBottom: '1px dashed #000', margin: '4px 0' }} />

        <div style={{ fontSize: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Cộng tiền hàng:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>VAT (8%):</span>
            <span>{formatCurrency(vatAmount)}</span>
          </div>
          {shippingFee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Phí ship dự kiến:</span>
              <span>{formatCurrency(shippingFee)}</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff0000' }}>
              <span>Chiết khấu giảm:</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}
        </div>

        <div style={{ borderBottom: '1px solid #000', margin: '4px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '10px' }}>
          <span>TỔNG THANH TOÁN:</span>
          <span>{formatCurrency(order.total)}</span>
        </div>

        <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />

        <div style={{ textAlign: 'center', fontSize: '7px', color: '#555', marginTop: '6px' }}>
          <div>Cảm ơn quý khách đã tin cậy iPOS!</div>
          <div>Biên lai in nhanh trực tiếp không qua chi tiết.</div>
          <div style={{ margin: '4px 0', fontSize: '8px' }}>Mã vạch đơn hàng:</div>
          <div style={{ letterSpacing: '2px', fontWeight: 'bold', fontSize: '9px' }}>{order.id}</div>
        </div>
      </div>

    </div>
  );
}
