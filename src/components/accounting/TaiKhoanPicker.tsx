import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Check, Folder, FileText, X } from 'lucide-react';
import { DANH_MUC_TAI_KHOAN_TT99, TaiKhoanTt99 } from '../../data/danhMucTaiKhoanTt99';

interface TaiKhoanPickerProps {
  value: string;
  onChange: (account: TaiKhoanTt99) => void;
  onlyLeaf?: boolean;
  placeholder?: string;
  className?: string;
}

export const TaiKhoanPicker: React.FC<TaiKhoanPickerProps> = ({
  value,
  onChange,
  onlyLeaf = true,
  placeholder = 'F3 - Chọn TK...',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedAccount = useMemo(() => {
    return DANH_MUC_TAI_KHOAN_TT99.find(a => a.maTk === value);
  }, [value]);

  const filteredAccounts = useMemo(() => {
    return DANH_MUC_TAI_KHOAN_TT99.filter(acc => {
      // Leaf constraint
      if (onlyLeaf && !acc.laChiTiet) return false;

      // Group tab
      if (activeTab === 'TS' && !acc.maTk.startsWith('1') && !acc.maTk.startsWith('2')) return false;
      if (activeTab === 'NO' && !acc.maTk.startsWith('3')) return false;
      if (activeTab === 'VON' && !acc.maTk.startsWith('4')) return false;
      if (activeTab === 'DT' && !['5', '7'].includes(acc.maTk.charAt(0))) return false;
      if (activeTab === 'CP' && !['6', '8'].includes(acc.maTk.charAt(0))) return false;

      // Search term
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return acc.maTk.toLowerCase().includes(term) || acc.tenTk.toLowerCase().includes(term);
    });
  }, [onlyLeaf, activeTab, searchTerm]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredAccounts]);

  const handleSelect = (acc: TaiKhoanTt99) => {
    onChange(acc);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'F3' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredAccounts.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredAccounts[selectedIndex]) {
        handleSelect(filteredAccounts[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="w-full text-left font-mono font-bold text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 flex items-center justify-between transition-colors shadow-2xs"
        title="Bấm F3 để mở bảng tài khoản TT99"
      >
        <span className={selectedAccount ? 'text-indigo-900' : 'text-slate-400 font-normal'}>
          {selectedAccount ? `${selectedAccount.maTk} - ${selectedAccount.tenTk}` : placeholder}
        </span>
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-sans font-semibold text-slate-400 bg-slate-100 rounded border border-slate-200">
          F3
        </kbd>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Hệ thống 172 Tài khoản TT 99/2025/TT-BTC</span>
                  <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-semibold">
                    148 TK Chi tiết
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dùng phím mũi tên ↑ ↓ để di chuyển, Enter để chọn, Esc để thoát
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="px-5 pt-3 flex gap-1.5 border-b border-slate-100 overflow-x-auto text-xs font-semibold">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'TS', label: '1,2-Tài sản' },
                { id: 'NO', label: '3-Nợ phải trả' },
                { id: 'VON', label: '4-Vốn CSH' },
                { id: 'DT', label: '5,7-Doanh thu' },
                { id: 'CP', label: '6,8,9-Chi phí' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Gõ số hiệu (111, 112, 511...) hoặc tên tài khoản để tìm nhanh..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Account List */}
            <div ref={listRef} className="overflow-y-auto flex-1 divide-y divide-slate-100 p-2">
              {filteredAccounts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Không tìm thấy tài khoản phù hợp với từ khóa "{searchTerm}"
                </div>
              ) : (
                filteredAccounts.map((acc, index) => {
                  const isSelected = index === selectedIndex;
                  const isCurrent = acc.maTk === value;

                  return (
                    <div
                      key={acc.maTk}
                      onClick={() => handleSelect(acc)}
                      className={`px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors text-xs ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-950 font-medium'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-12 font-mono font-bold text-indigo-700">
                          {acc.maTk}
                        </span>
                        <div className="flex items-center gap-2">
                          {acc.laChiTiet ? (
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <Folder className="w-3.5 h-3.5 text-amber-500" />
                          )}
                          <span>{acc.tenTk}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {acc.laCongNo && (
                          <span className="text-[10px] bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-200">
                            Công nợ
                          </span>
                        )}
                        {acc.laKho && (
                          <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                            Kho
                          </span>
                        )}
                        {acc.laThue && (
                          <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">
                            Thuế
                          </span>
                        )}
                        {isCurrent && (
                          <Check className="w-4 h-4 text-emerald-600 font-bold ml-1" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between items-center">
              <span>Đang hiển thị {filteredAccounts.length} tài khoản</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
