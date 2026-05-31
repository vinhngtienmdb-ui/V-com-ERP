import React, { useState } from 'react';
import { Tag, Plus, Search, Filter, Box } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/utils';

export function IPosProducts({ activeStore }: { activeStore: any }) {
  return (
    <div className="col-span-12 flex-1 bg-slate-50 overflow-hidden flex flex-col h-full animate-in fade-in duration-300">
      <div className="bg-white border-b border-slate-300 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary-600" /> Quản lý Sản Phẩm
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">{activeStore?.name}</p>
        </div>
        <div className="flex gap-3">
           <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" placeholder="Tìm SKU, tên..." className="pl-9 pr-4 py-2 bg-slate-100 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 w-64" />
           </div>
           <button className="bg-primary-600 text-white px-4 py-2 rounded-sm text-xs font-bold shadow-sm hover:bg-primary-700 flex items-center gap-2">
             <Plus className="w-3.5 h-3.5" /> Thêm Sản Phẩm Mới
           </button>
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto">
         <div className="bg-white border border-slate-300 rounded-sm shadow-sm md:flex min-h-[500px]">
             {/* Sidebar */}
             <div className="w-full md:w-48 xl:w-56 border-r border-slate-300 p-4 space-y-1">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Phân loại & Quản lý</p>
                 {['Tất cả Sản phẩm', 'Lô Sản phẩm / HSD', 'Thương hiệu', 'Thời gian Lưu kho', 'Tồn kho thấp', 'Danh mục', 'Thuộc tính', 'Nhà cung cấp'].map((item, i) => (
                    <button key={item} className={cn("w-full text-left px-3 py-2 text-xs font-bold rounded-sm transition-colors", i===0 ? "bg-primary-50 text-primary-700" : "text-slate-700 hover:bg-slate-50")}>
                        {item}
                    </button>
                 ))}
             </div>
             {/* Content */}
             <div className="flex-1 p-6">
                <div className="flex items-center gap-2 mb-4 text-slate-600 font-medium text-sm">
                   <Box className="w-4 h-4" /> Danh sách sản phẩm (Mô phỏng)
                </div>
                <div className="border border-slate-300 rounded-sm overflow-hidden overflow-x-auto min-w-0">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-300 text-slate-600 font-bold">
                            <tr>
                                <th className="px-4 py-3">SKU</th>
                                <th className="px-4 py-3">Tên Sản Phẩm</th>
                                <th className="px-4 py-3">Lô/HSD</th>
                                <th className="px-4 py-3">Thương hiệu</th>
                                <th className="px-4 py-3 text-right">Tồn Kho</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1,2,3,4,5].map(i => (
                                <tr key={i} className="border-b last:border-0 border-slate-200 hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-mono text-slate-600">SP00{i}</td>
                                    <td className="px-4 py-3">
                                       <p className="font-semibold text-slate-900">Sản phẩm mẫu {i}</p>
                                       <p className="text-[10px] text-slate-600">Giá: {formatCurrency(150000 * i)} • NCC {i}</p>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-700">Lô {2026+i} • 12/2027</td>
                                    <td className="px-4 py-3 font-medium text-slate-700">Brand {i}</td>
                                    <td className="px-4 py-3 text-right">
                                       <p className="font-bold text-emerald-600">{i * 12}</p>
                                       <p className="text-[10px] text-slate-500">Lưu kho: {10 * i} ngày</p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
         </div>
      </div>
    </div>
  );
}
