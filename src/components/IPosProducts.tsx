import React, { useState } from 'react';
import { Tag, Plus, Search, Filter, Box } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/utils';

export function IPosProducts({ activeStore }: { activeStore: any }) {
  return (
    <div className="flex-1 bg-stone-50 overflow-hidden flex flex-col h-full animate-in fade-in duration-300">
      <div className="bg-white border-b border-stone-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-600" /> Quản lý Sản Phẩm
          </h2>
          <p className="text-xs font-bold text-stone-400 mt-1 uppercase tracking-widest">{activeStore?.name}</p>
        </div>
        <div className="flex gap-3">
           <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input type="text" placeholder="Tìm SKU, tên..." className="pl-9 pr-4 py-2 bg-stone-100 border border-stone-200 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 w-64" />
           </div>
           <button className="bg-indigo-600 text-white px-4 py-2 rounded-sm text-xs font-bold shadow-sm hover:bg-indigo-700 flex items-center gap-2">
             <Plus className="w-3.5 h-3.5" /> Thêm Sản Phẩm Mới
           </button>
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto">
         <div className="bg-white border border-stone-200 rounded-sm shadow-sm md:flex min-h-[500px]">
             {/* Sidebar */}
             <div className="w-full md:w-48 xl:w-56 border-r border-stone-200 p-4 space-y-1">
                 <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">Danh mục</p>
                 {['Tất cả', 'Danh mục 1', 'Danh mục 2', 'Thương hiệu', 'Thuộc tính', 'Lô/HSD', 'Nhà cung cấp'].map((item, i) => (
                    <button key={item} className={cn("w-full text-left px-3 py-2 text-xs font-bold rounded-sm transition-colors", i===0 ? "bg-indigo-50 text-indigo-700" : "text-stone-600 hover:bg-stone-50")}>
                        {item}
                    </button>
                 ))}
             </div>
             {/* Content */}
             <div className="flex-1 p-6">
                <div className="flex items-center gap-2 mb-4 text-stone-500 font-medium text-sm">
                   <Box className="w-4 h-4" /> Danh sách sản phẩm (Mô phỏng)
                </div>
                <div className="border border-stone-200 rounded-sm overflow-hidden">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold">
                            <tr>
                                <th className="px-4 py-3">SKU</th>
                                <th className="px-4 py-3">Tên Sản Phẩm</th>
                                <th className="px-4 py-3">Giá Bán</th>
                                <th className="px-4 py-3">Danh Mục</th>
                                <th className="px-4 py-3 text-right">Tồn Kho</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1,2,3,4,5].map(i => (
                                <tr key={i} className="border-b last:border-0 border-stone-100 hover:bg-stone-50 transition-colors">
                                    <td className="px-4 py-3 font-mono text-stone-500">SP00{i}</td>
                                    <td className="px-4 py-3 font-semibold text-stone-900">Sản phẩm mẫu {i}</td>
                                    <td className="px-4 py-3 font-medium text-indigo-600">{formatCurrency(150000 * i)}</td>
                                    <td className="px-4 py-3">Phân loại A</td>
                                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{i * 12}</td>
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
