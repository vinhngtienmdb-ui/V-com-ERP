import React, { useState } from 'react';
import { Package, ArrowDownToLine, ArrowUpFromLine, RefreshCw, ClipboardList, Boxes, AlertTriangle, Play, Settings2, Plus, Search, Filter, Layers, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/utils';

export function IPosInventory({ activeStore }: { activeStore: any }) {
  const [invTab, setInvTab] = useState<'nhap' | 'xuat' | 'kiem' | 'chuyen' | 'goi' | 'canhbao' | 'vitri' | 'kiemke_thang'>('kiem');

  const FNB_MODE = activeStore?.industry === "F&B" || activeStore?.industry === "Nhà hàng, quán ăn, quán cafe";

  return (
    <div className="flex-1 bg-stone-50 overflow-hidden flex flex-col h-full animate-in fade-in duration-300">
      <div className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-5 h-5 text-indigo-600" /> Quản lý Kho {FNB_MODE ? '(F&B Định Lượng)' : '(Sản phẩm hoàn chỉnh)'}
          </h2>
          <p className="text-xs font-bold text-stone-400 mt-1 uppercase tracking-widest">{activeStore?.name}</p>
        </div>
      </div>
      <div className="bg-white border-b border-stone-200 px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
          {[
            { id: 'kiem', label: 'Tồn Kho & Phiếu Nháp', icon: ClipboardList },
            { id: 'nhap', label: 'Nhập Hàng (Dự báo)', icon: ArrowDownToLine },
            { id: 'xuat', label: 'Xuất/Hàng Lỗi Hủy', icon: ArrowUpFromLine },
            { id: 'chuyen', label: 'Chuyển Kho', icon: RefreshCw },
            { id: 'goi', label: 'Đóng/Bung Gói SP', icon: Package },
            { id: 'vitri', label: 'Vị trí & Danh mục', icon: MapPin },
            { id: 'canhbao', label: 'Hạn mức tồn kho', icon: AlertTriangle },
            { id: 'kiemke_thang', label: 'Kiểm kê Tháng (Kế Toán)', icon: Layers },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setInvTab(t.id as any)}
              className={cn(
                "px-4 py-2 rounded-sm text-xs font-bold flex items-center gap-1.5 transition-all shrink-0",
                invTab === t.id ? "bg-stone-100 text-indigo-700 shadow-inner" : "text-stone-500 hover:bg-stone-50"
              )}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
      </div>
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white border border-stone-200 rounded-sm shadow-sm p-6 min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-stone-800 uppercase text-lg">{invTab.replace('_', ' ')}</h3>
            <div className="flex gap-2">
                <button className="bg-stone-100 text-stone-600 px-4 py-2 rounded-sm text-xs font-bold shadow-sm hover:bg-stone-200 flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5" /> Tạo Phiếu Nháp
                </button>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-sm text-xs font-bold shadow-sm hover:bg-indigo-700 flex items-center gap-2">
                  <Play className="w-3.5 h-3.5" /> Thực hiện
                </button>
            </div>
          </div>
          
          {invTab === 'kiem' ? (
             <div className="border border-stone-200 rounded-sm">
                 <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold">
                        <tr>
                            <th className="px-4 py-3">Mã NL/SKU</th>
                            <th className="px-4 py-3">Tên Nguyên Liệu / Sản Phẩm</th>
                            {FNB_MODE && <th className="px-4 py-3">ĐV Tính</th>}
                            <th className="px-4 py-3 text-right">Tồn Kho Lý Thuyết</th>
                            <th className="px-4 py-3 text-right">Tồn Kho Thực Tế</th>
                            <th className="px-4 py-3 text-center">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[1,2,3].map(i => (
                            <tr key={i} className="border-b last:border-0 border-stone-100 hover:bg-stone-50">
                                <td className="px-4 py-3 font-mono text-stone-500">NL00{i}</td>
                                <td className="px-4 py-3 font-bold text-stone-900">{FNB_MODE ? `Hạt cà phê Arabica Lô ${i}` : `Sản phẩm đóng gói ${i}`}</td>
                                {FNB_MODE && <td className="px-4 py-3">Kg</td>}
                                <td className="px-4 py-3 text-right text-stone-600 font-medium">{4 + i * 2.5}</td>
                                <td className="px-4 py-3 text-right text-indigo-600 font-black">{4 + i * 2.5}</td>
                                <td className="px-4 py-3 text-center"><span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded">Khớp</span></td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
             </div>
          ) : (
             <div className="mt-8 border border-dashed border-stone-300 rounded-sm p-12 text-center text-stone-400">
                {FNB_MODE ? (
                  <p className="mb-2 font-bold text-stone-600">Đang bật Mô hình Kho F&B (Định lượng BOM)</p>
                ) : (
                  <p className="mb-2 font-bold text-stone-600">Đang bật Mô hình Kho Bán Lẻ (Quản lý theo SKU/Lô/HSD)</p>
                )}
                <p>Tính năng <span className="font-bold text-indigo-600">{invTab}</span> sẽ được đồng bộ với Hệ thống Kế toán và báo cáo chốt ca cuối ngày.</p>
                <div className="flex justify-center mt-6">
                   <Settings2 className="w-12 h-12 text-stone-200 animate-spin-slow" />
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
