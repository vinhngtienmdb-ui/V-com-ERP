 import React, { useState } from 'react';
import { Package, ArrowDownToLine, ArrowUpFromLine, RefreshCw, ClipboardList, Boxes, AlertTriangle, Play, Settings2, Plus, Search, Filter, Layers, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/utils';

export function IPosInventory({ activeStore }: { activeStore: any }) {
  const [invTab, setInvTab] = useState<'nhap' | 'xuat' | 'kiem' | 'chuyen' | 'goi' | 'canhbao' | 'vitri' | 'kiemke_thang'>('kiem');

  const FNB_MODE = activeStore?.industry === "F&B" || activeStore?.industry === "Nhà hàng, quán ăn, quán cafe";

  return (
    <div className="col-span-12 flex-1 bg-slate-50 overflow-hidden flex flex-col h-full animate-in fade-in duration-300">
      <div className="bg-white border-b border-slate-300 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-5 h-5 text-primary-600" /> Quản lý Kho {FNB_MODE ? '(F&B Định Lượng)' : '(Sản phẩm hoàn chỉnh)'}
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">{activeStore?.name}</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <input type="text" placeholder="Tìm tên NL/SKU..." className="bg-transparent border-none focus:ring-0 text-sm px-3 w-48 text-slate-800 outline-none placeholder:text-slate-500" />
          <button className="p-2 text-slate-600 hover:text-primary-600 transition-colors"><Search className="w-4 h-4"/></button>
        </div>
      </div>
      <div className="bg-white border-b border-slate-300 px-6 py-2.5 flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
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
                "px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 border",
                invTab === t.id ? "bg-primary-600 text-white border-primary-600 shadow-md shadow-indigo-200" : "bg-white border-slate-300 text-slate-700 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50"
              )}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
      </div>
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white border border-slate-300 rounded-xl shadow-sm p-6 min-h-[400px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="font-black text-slate-900 uppercase text-lg">{invTab.replace('_', ' ')}</h3>
            <div className="flex gap-2">
                <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 hover:border-primary-200 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Tạo Phiếu Nháp
                </button>
                <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-indigo-600/20 hover:bg-primary-700 transition-colors flex items-center gap-2">
                  <Play className="w-4 h-4" /> Thực hiện
                </button>
            </div>
          </div>
          
           {invTab === 'kiem' ? (
             <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                 <div className="bg-slate-50 p-5 border-b border-slate-200 flex justify-between items-center">
                    <h4 className="font-bold text-sm text-slate-800">Phiếu kiểm kho & Bàn giao kho cuối ngày</h4>
                    <button className="text-sm text-primary-600 font-bold hover:underline">Lịch sử kiểm kho</button>
                 </div>
                 <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-white border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                            <th className="px-5 py-4">Mã NL/SKU</th>
                            <th className="px-5 py-4">Tên Nguyên Liệu / Sản Phẩm</th>
                            {FNB_MODE && <th className="px-5 py-4">ĐV Tính</th>}
                            <th className="px-5 py-4 text-right">Tồn Kho Lý Thuyết</th>
                            <th className="px-5 py-4 text-right">Tồn Kho Thực Tế</th>
                            <th className="px-5 py-4 text-center">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[1,2,3,4,5].map(i => (
                            <tr key={i} className="border-b last:border-0 border-stone-50 hover:bg-slate-50/50 transition-colors">
                                <td className="px-5 py-4 font-mono text-slate-500 text-xs font-bold">NL00{i}</td>
                                <td className="px-5 py-4 font-bold text-slate-900">{FNB_MODE ? `Hạt cà phê Arabica Lô ${i}` : `Sản phẩm đóng gói ${i}`}</td>
                                {FNB_MODE && <td className="px-5 py-4 text-slate-700 font-medium">Kg</td>}
                                <td className="px-5 py-4 text-right text-slate-600 font-medium">{4 + i * 2.5}</td>
                                <td className="px-5 py-4 text-right text-primary-700 font-black text-base">{4 + i * 2.5}</td>
                                <td className="px-5 py-4 text-center"><span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Khớp</span></td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
                 </div>
             </div>
          ) : invTab === 'nhap' ? (
             <div className="border border-slate-200 rounded-xl p-10 text-center bg-slate-50/50 shadow-sm">
                <ArrowDownToLine className="w-16 h-16 text-primary-300 mx-auto mb-5" />
                <h4 className="font-bold text-slate-900 text-xl mb-2">Nhập kho & Dự báo</h4>
                <p className="text-sm text-slate-600 mb-8 max-w-md mx-auto">Tạo phiếu nhập kho từ nhà cung cấp hoặc xem dự báo nhập hàng dựa trên AI.</p>
                <div className="flex gap-4 justify-center">
                    <button className="px-8 py-3 bg-primary-600 text-white font-bold rounded-lg text-sm shadow-md hover:bg-primary-700 transition-colors">Tạo Phiếu Nhập</button>
                    <button className="px-8 py-3 bg-white text-primary-700 border border-primary-200 font-bold rounded-lg text-sm shadow-sm hover:bg-primary-50 transition-colors">Xem Phân Tích Dự Báo</button>
                </div>
             </div>
          ) : invTab === 'xuat' ? (
             <div className="border border-slate-200 rounded-xl p-10 text-center bg-slate-50/50 shadow-sm">
                <ArrowUpFromLine className="w-16 h-16 text-orange-300 mx-auto mb-5" />
                <h4 className="font-bold text-slate-900 text-xl mb-2">Xuất kho & Hàng Lỗi/Hủy</h4>
                <p className="text-sm text-slate-600 mb-8 max-w-md mx-auto">Tạo phiếu xuất kho sử dụng hoặc ghi nhận sản phẩm lỗi, hỏng.</p>
                <div className="flex gap-4 justify-center">
                    <button className="px-8 py-3 bg-orange-600 text-white font-bold rounded-lg text-sm shadow-md hover:bg-orange-700 transition-colors">Tạo Phiếu Xuất</button>
                    <button className="px-8 py-3 bg-white text-orange-700 border border-orange-200 font-bold rounded-lg text-sm shadow-sm hover:bg-orange-50 transition-colors">Khai Báo Hàng Lỗi</button>
                </div>
             </div>
          ) : invTab === 'goi' ? (
             <div className="border border-slate-200 rounded-xl p-10 text-center bg-slate-50/50 shadow-sm">
                <Package className="w-16 h-16 text-teal-300 mx-auto mb-5" />
                <h4 className="font-bold text-slate-900 text-xl mb-2">Quản lý Gói Sản Phẩm (Bundle)</h4>
                <p className="text-sm text-slate-600 mb-8 max-w-md mx-auto">Đóng gói hoặc bung gói các sản phẩm để quản lý tồn kho linh hoạt.</p>
                <div className="flex gap-4 justify-center">
                    <button className="px-8 py-3 bg-teal-600 text-white font-bold rounded-lg text-sm shadow-md hover:bg-teal-700 transition-colors">Đóng Gói SP</button>
                    <button className="px-8 py-3 bg-white text-teal-700 border border-teal-200 font-bold rounded-lg text-sm shadow-sm hover:bg-teal-50 transition-colors">Bung Gói SP</button>
                </div>
             </div>
          ) : invTab === 'kiemke_thang' ? (
             <div className="border border-slate-200 rounded-xl p-10 text-center bg-slate-50/50 shadow-sm">
                <Layers className="w-16 h-16 text-blue-300 mx-auto mb-5" />
                <h4 className="font-bold text-slate-900 text-xl mb-2">Kiểm Kê Tháng (Kế Toán)</h4>
                <p className="text-sm text-slate-600 mb-8 max-w-lg mx-auto">Tính năng dành riêng cho bộ phận Kế Toán chốt tồn kho cuối tháng theo phương pháp FIFO/LIFO.</p>
                <button className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg text-sm shadow-md hover:bg-blue-700 transition-colors">Mở Dashboard Kế Toán</button>
             </div>
          ) : (
             <div className="mt-8 border border-dashed border-slate-300 rounded-xl p-16 text-center text-slate-500 bg-slate-50/30">
                {FNB_MODE ? (
                  <p className="mb-3 font-bold text-slate-800 text-lg">Đang bật Mô hình Kho F&B (Định lượng BOM)</p>
                ) : (
                  <p className="mb-3 font-bold text-slate-800 text-lg">Đang bật Mô hình Kho Bán Lẻ (Quản lý theo SKU/Lô/HSD)</p>
                )}
                <p className="text-sm max-w-md mx-auto">Tính năng <span className="font-bold text-primary-600 uppercase tracking-wide">{invTab.replace('_', ' ')}</span> sẽ được đồng bộ với Hệ thống Kế toán và báo cáo chốt ca cuối ngày.</p>
                <div className="flex justify-center mt-8">
                   <Settings2 className="w-12 h-12 text-slate-500 animate-spin-slow" />
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
