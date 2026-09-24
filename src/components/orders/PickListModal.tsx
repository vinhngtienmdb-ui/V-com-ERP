import React from 'react';
import { 
  Printer, 
  X, 
  Package, 
  MapPin, 
  Barcode, 
  CheckCircle2, 
  FileText,
  Boxes
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export interface PickListItem {
  productId: string;
  sku: string;
  productName: string;
  shelfLocation: string; // VD: Kệ A1-T2-O3
  totalQty: number;
  orderIds: string[];
  unit: string;
}

interface PickListModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrders: any[];
}

export function PickListModal({ isOpen, onClose, selectedOrders }: PickListModalProps) {
  if (!isOpen) return null;

  // Gom nhóm sản phẩm từ các đơn đã chọn theo sản phẩm và vị trí kệ kho
  const pickListItems: PickListItem[] = React.useMemo(() => {
    const map = new Map<string, PickListItem>();

    // Mock vị trí kệ kho theo mã sản phẩm
    const getShelfLocation = (productId: string) => {
      const char = String.fromCharCode(65 + (productId.charCodeAt(0) % 6)); // A - F
      const aisle = (productId.charCodeAt(productId.length - 1) % 5) + 1;
      const shelf = (productId.charCodeAt(1) % 4) + 1;
      return `Kệ ${char}${aisle}-Tầng ${shelf}`;
    };

    selectedOrders.forEach(order => {
      (order.items || []).forEach((it: any) => {
        const pId = it.productId || it.id || it.productName || 'PROD-001';
        const key = pId;
        const qty = Number(it.quantity) || 1;

        if (map.has(key)) {
          const existing = map.get(key)!;
          existing.totalQty += qty;
          if (!existing.orderIds.includes(order.id)) {
            existing.orderIds.push(order.id);
          }
        } else {
          map.set(key, {
            productId: pId,
            sku: it.sku || `SKU-${pId.substring(0, 8)}`,
            productName: it.productName || it.name || 'Sản phẩm tiêu chuẩn',
            shelfLocation: it.shelfLocation || getShelfLocation(pId),
            totalQty: qty,
            orderIds: [order.id],
            unit: it.unit || 'Cái'
          });
        }
      });
    });

    // Sắp xếp theo vị trí kệ kho để nhân viên di chuyển tối ưu nhất
    return Array.from(map.values()).sort((a, b) => a.shelfLocation.localeCompare(b.shelfLocation));
  }, [selectedOrders]);

  const totalItems = pickListItems.reduce((s, i) => s + i.totalQty, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 border border-slate-200" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/40 rounded-xl border border-indigo-400/30">
              <Boxes className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Phiếu Nhặt Hàng Tổng Hợp (Pick List)
                <span className="text-xs bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full font-mono border border-indigo-400/30">
                  {selectedOrders.length} Đơn hàng
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Gom nhóm hàng hóa theo vị trí kệ kho để xuất kho siêu tốc</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              In Phiếu (Ctrl+P)
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area for Preview & Printing */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {/* Metadata Banner */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Mã Lô Nhặt Hàng:</span>
              <p className="font-mono font-bold text-sm text-slate-900 mt-0.5">BATCH-{Date.now().toString().slice(-6)}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Thời gian tạo:</span>
              <p className="font-bold text-slate-800 mt-0.5">{new Date().toLocaleString('vi-VN')}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Tổng Số Mặt Hàng (SKUs):</span>
              <p className="font-bold text-slate-800 mt-0.5">{pickListItems.length} SKUs khác nhau</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Tổng Số Lượng Cần Nhặt:</span>
              <p className="font-bold text-indigo-700 text-sm mt-0.5 font-mono">{totalItems} đơn vị hàng</p>
            </div>
          </div>

          {/* Orders Reference Badges */}
          <div className="space-y-1.5">
            <span className="font-bold text-slate-700 text-[11px]">Bao gồm các đơn hàng:</span>
            <div className="flex flex-wrap gap-1.5">
              {selectedOrders.map(o => (
                <span key={o.id} className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[10px] font-mono">
                  {o.id} ({o.customerName || 'Khách lẻ'})
                </span>
              ))}
            </div>
          </div>

          {/* Pick Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5 w-12 text-center">STT</th>
                  <th className="px-3 py-2.5 w-32">Vị trí Kệ Kho</th>
                  <th className="px-3 py-2.5">Sản phẩm & Mã SKU</th>
                  <th className="px-3 py-2.5 w-24 text-center">Đơn vị</th>
                  <th className="px-3 py-2.5 w-28 text-center font-black">Cần Nhặt</th>
                  <th className="px-3 py-2.5 w-44">Đơn Hàng Gốc</th>
                  <th className="px-3 py-2.5 w-20 text-center">Kiểm tra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {pickListItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2.5 text-center font-mono text-slate-500 font-bold">{idx + 1}</td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded font-bold font-mono text-[11px] inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-600" />
                        {item.shelfLocation}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-bold text-slate-900">{item.productName}</p>
                      <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <Barcode className="w-3 h-3 text-slate-400" />
                        {item.sku}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-center text-slate-600 font-medium">{item.unit}</td>
                    <td className="px-3 py-2.5 text-center font-mono font-black text-sm text-indigo-700 bg-indigo-50/50">
                      {item.totalQty}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1 max-w-[170px]">
                        {item.orderIds.map(oid => (
                          <span key={oid} className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                            {oid}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="w-5 h-5 border-2 border-slate-300 rounded mx-auto cursor-pointer hover:border-emerald-500"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Notes for Warehouse Staff */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-[11px] text-slate-600">
            <div>
              <span className="font-bold text-slate-800">Quy chuẩn nhặt hàng:</span> Quét mã barcode từng sản phẩm trước khi đưa vào xe đẩy phân loại (Sorting Cart).
            </div>
            <div className="flex gap-6 font-medium">
              <span>Người nhặt hàng: ....................</span>
              <span>Người kiểm hàng: ....................</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            Đóng
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            Xác Nhận & In Phiếu Nhặt Hàng
          </button>
        </div>
      </div>
    </div>
  );
}
