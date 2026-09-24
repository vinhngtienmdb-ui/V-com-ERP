import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Barcode, 
  CheckCircle2, 
  AlertTriangle, 
  Package, 
  Printer, 
  RotateCcw, 
  Sparkles, 
  Truck, 
  ShieldCheck,
  Search,
  ScanLine
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { WaybillPrintModal } from './WaybillPrintModal';

interface ScanItem {
  sku: string;
  name: string;
  requiredQty: number;
  scannedQty: number;
  price: number;
}

interface ScanToVerifyModalProps {
  orders: any[];
  onClose: () => void;
  onOrderVerified: (orderId: string) => void;
}

export function ScanToVerifyModal({ orders, onClose, onOrderVerified }: ScanToVerifyModalProps) {
  // Orders eligible for packing
  const pendingOrders = orders.filter(o => o.status === 'processing' || o.status === 'confirmed' || o.status === 'pending');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(pendingOrders[0]?.id || orders[0]?.id || '');
  
  const currentOrder = orders.find(o => o.id === selectedOrderId);
  
  // Transform order items into scan items
  const [items, setItems] = useState<ScanItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [feedback, setFeedback] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: 'Sẵn sàng quét mã SKU hoặc Barcode sản phẩm...'
  });
  const [showWaybillModal, setShowWaybillModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset items when selected order changes
  useEffect(() => {
    if (!currentOrder) return;
    const orderItems: ScanItem[] = (currentOrder.items || [
      { name: currentOrder.productName || 'Sản phẩm TMĐT VComm', quantity: currentOrder.quantity || 1, price: currentOrder.total || 0 }
    ]).map((it: any, idx: number) => ({
      sku: it.sku || it.productId || `SKU-VC-${(idx + 1) * 100}`,
      name: it.name || it.productName || 'Sản phẩm VComm',
      requiredQty: it.quantity || 1,
      scannedQty: 0,
      price: it.price || 0,
    }));
    setItems(orderItems);
    setFeedback({ status: 'idle', message: 'Sẵn sàng quét mã SKU hoặc Barcode sản phẩm...' });
    inputRef.current?.focus();
  }, [selectedOrderId, currentOrder]);

  const isAllScanned = items.length > 0 && items.every(it => it.scannedQty >= it.requiredQty);
  const totalRequired = items.reduce((acc, it) => acc + it.requiredQty, 0);
  const totalScanned = items.reduce((acc, it) => acc + it.scannedQty, 0);

  const handleScan = (scannedCode: string) => {
    const code = scannedCode.trim().toUpperCase();
    if (!code) return;

    // Find matching item by SKU or partial name
    const itemIndex = items.findIndex(
      it => it.sku.toUpperCase() === code || it.name.toUpperCase().includes(code)
    );

    if (itemIndex === -1) {
      setFeedback({
        status: 'error',
        message: `❌ CẢNH BÁO NHẦM HÀNG! Mã "${code}" không có trong đơn ${selectedOrderId}!`
      });
      setBarcodeInput('');
      return;
    }

    const targetItem = items[itemIndex];
    if (targetItem.scannedQty >= targetItem.requiredQty) {
      setFeedback({
        status: 'error',
        message: `⚠️ Sản phẩm "${targetItem.name}" đã quét đủ số lượng (${targetItem.requiredQty}/${targetItem.requiredQty})!`
      });
      setBarcodeInput('');
      return;
    }

    // Increment scanned quantity
    const updated = [...items];
    updated[itemIndex] = {
      ...targetItem,
      scannedQty: targetItem.scannedQty + 1
    };
    setItems(updated);

    const willBeAllScanned = updated.every(it => it.scannedQty >= it.requiredQty);
    if (willBeAllScanned) {
      setFeedback({
        status: 'success',
        message: `🎉 HOÀN TẤT! Toàn bộ sản phẩm trong đơn đã khớp 100%. Sẵn sàng dán tem vận đơn A6!`
      });
    } else {
      setFeedback({
        status: 'success',
        message: `✓ Khớp mã: ${targetItem.name} (${updated[itemIndex].scannedQty}/${targetItem.requiredQty})`
      });
    }
    setBarcodeInput('');
    inputRef.current?.focus();
  };

  const handleConfirmPacked = () => {
    if (!currentOrder) return;
    onOrderVerified(currentOrder.id);
    setShowWaybillModal(true);
  };

  const handleResetScan = () => {
    setItems(prev => prev.map(it => ({ ...it, scannedQty: 0 })));
    setFeedback({ status: 'idle', message: 'Đã đặt lại bộ đếm quét mã.' });
    inputRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <ScanLine className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">Trạm Đóng Gói Scan-to-Verify</h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Chống nhầm hàng 100%
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Quét mã vạch sản phẩm đối soát trực tiếp trước khi niêm phong và dán tem vận đơn.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Order Selector & Info */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                Chọn Đơn Hàng Cần Đóng Gói
              </label>
              <select
                value={selectedOrderId}
                onChange={e => setSelectedOrderId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {pendingOrders.map(o => (
                  <option key={o.id} value={o.id}>
                    #{o.id.split('-').pop()} - {o.customerName} ({formatCurrency(o.total)})
                  </option>
                ))}
              </select>
            </div>

            {currentOrder && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Mã đơn hàng:</span>
                  <span className="font-mono font-bold text-slate-800">#{currentOrder.id}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Khách nhận:</span>
                  <span className="font-bold text-slate-800">{currentOrder.customerName}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Đơn vị vận chuyển:</span>
                  <span className="font-bold text-indigo-700 uppercase">{currentOrder.carrier || 'GHN Fast'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Địa chỉ giao:</span>
                  <span className="font-medium text-slate-700 text-right truncate max-w-[150px]" title={currentOrder.shippingAddress || currentOrder.address}>
                    {currentOrder.shippingAddress || currentOrder.address || 'Hà Nội'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Tổng thu COD:</span>
                  <span className="font-mono font-bold text-orange-600">
                    {currentOrder.paymentMethod === 'cod' ? formatCurrency(currentOrder.total) : '0 ₫ (Đã thanh toán)'}
                  </span>
                </div>
              </div>
            )}

            {/* Quick barcode simulation buttons for testing */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Giả lập máy quét Barcode:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {items.map(it => (
                  <button
                    key={it.sku}
                    onClick={() => handleScan(it.sku)}
                    className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-[10px] font-mono font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    Quét {it.sku}
                  </button>
                ))}
                <button
                  onClick={() => handleScan('WRONG-SKU-999')}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 rounded-lg text-[10px] font-mono font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
                >
                  Quét mã sai (Test)
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Scan Station & Item Progress */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Barcode Scanner Input */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200 shadow-xs">
              <label className="text-xs font-bold text-orange-950 flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5">
                  <Barcode className="w-4 h-4 text-orange-600" />
                  Ô Quét Mã Vạch (Đầu đọc Barcode/QR hoặc nhập tay):
                </span>
                <span className="text-[11px] font-mono font-bold text-orange-700">
                  Tiến độ: {totalScanned} / {totalRequired} món
                </span>
              </label>

              <form 
                onSubmit={e => {
                  e.preventDefault();
                  handleScan(barcodeInput);
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={e => setBarcodeInput(e.target.value)}
                    placeholder="Quét mã SKU/Barcode (Nhấn Enter sau khi quét)..."
                    className="w-full bg-white border-2 border-orange-300 focus:border-orange-600 rounded-xl px-4 py-3 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-orange-500/20 shadow-inner tracking-wider uppercase"
                  />
                  {barcodeInput && (
                    <button
                      type="button"
                      onClick={() => setBarcodeInput('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Xác nhận
                </button>
              </form>

              {/* Realtime Feedback Alert */}
              <div className={cn(
                "mt-3 p-3 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all",
                feedback.status === 'success' ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                feedback.status === 'error' ? "bg-rose-100 text-rose-800 border border-rose-300 animate-shake" :
                "bg-white/80 text-slate-600 border border-slate-200"
              )}>
                {feedback.status === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> :
                 feedback.status === 'error' ? <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" /> :
                 <Barcode className="w-4 h-4 text-slate-400 shrink-0" />}
                <span>{feedback.message}</span>
              </div>
            </div>

            {/* Checklist Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Danh Sách Hàng Cần Đóng Gói
                </span>
                <button
                  onClick={handleResetScan}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Quét lại từ đầu
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {items.map((item, idx) => {
                  const isDone = item.scannedQty >= item.requiredQty;
                  return (
                    <div 
                      key={idx}
                      className={cn(
                        "p-3.5 flex items-center justify-between transition-colors",
                        isDone ? "bg-emerald-50/60" : "hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors",
                          isDone ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-100 text-slate-500"
                        )}>
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : (idx + 1)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded font-bold">
                              {item.sku}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Đơn giá: {formatCurrency(item.price)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className={cn(
                            "font-mono text-sm font-black",
                            isDone ? "text-emerald-700" : "text-slate-700"
                          )}>
                            {item.scannedQty} / {item.requiredQty}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold">SP</span>
                        </div>
                        <span className={cn(
                          "inline-block text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5",
                          isDone ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        )}>
                          {isDone ? 'Đã đủ ✓' : 'Chưa đủ'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Complete Action */}
            <div className="pt-2 flex justify-between items-center">
              <div className="text-xs text-slate-500">
                {isAllScanned ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Đã kiểm tra đầy đủ, gói hàng an toàn!
                  </span>
                ) : (
                  <span className="text-slate-500">
                    Vui lòng quét đủ tất cả sản phẩm để mở khóa In Vận Đơn.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPacked}
                  disabled={!isAllScanned}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Printer className="w-4 h-4" />
                  <span>Xác Nhận Đóng Gói & In Tem Vận Đơn A6</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Embedded Waybill Print Modal upon finishing */}
      {showWaybillModal && currentOrder && (
        <WaybillPrintModal
          order={currentOrder}
          onClose={() => {
            setShowWaybillModal(false);
            onClose();
          }}
        />
      )}
    </div>
  );
}
