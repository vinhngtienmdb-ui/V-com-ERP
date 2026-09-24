import React, { useState, useMemo, useRef } from 'react';
import { Search, UserCheck, X, Building2, User, Users } from 'lucide-react';

export interface DoiTuongKeToan {
  id: string;
  maDt: string;
  tenDt: string;
  loaiDt: 'KHACH_HANG' | 'NHA_CUNG_CAP' | 'NHAN_VIEN' | 'KHAC';
  maSoThue?: string;
  diaChi?: string;
}

// Sample mock data for quick offline UI interaction
const MOCK_DOI_TUONG: DoiTuongKeToan[] = [
  { id: '1', maDt: 'KHLE', tenDt: 'Khách hàng vãng lai / Bán lẻ', loaiDt: 'KHACH_HANG' },
  { id: '2', maDt: 'KH-CONGTY-A', tenDt: 'Công ty Cổ phần Thương mại Đại Việt', loaiDt: 'KHACH_HANG', maSoThue: '0108992123' },
  { id: '3', maDt: 'NCC-LOGISTIC-01', tenDt: 'Công ty CP Giao Hàng Nhanh Viễn Thông', loaiDt: 'NHA_CUNG_CAP', maSoThue: '0314567890' },
  { id: '4', maDt: 'NCC-KHO-HN', tenDt: 'Tổng kho Phân phối Phụ kiện Hà Nội', loaiDt: 'NHA_CUNG_CAP', maSoThue: '0106789123' },
  { id: '5', maDt: 'NV-MINHNT', tenDt: 'Nguyễn Tiến Minh (Kế toán trưởng)', loaiDt: 'NHAN_VIEN' },
  { id: '6', maDt: 'NV-HAOLN', tenDt: 'Lê Nhật Hảo (Nhân viên mua hàng)', loaiDt: 'NHAN_VIEN' }
];

interface DoiTuongPickerProps {
  value?: string;
  onChange: (dt: DoiTuongKeToan) => void;
  placeholder?: string;
  className?: string;
}

export const DoiTuongPicker: React.FC<DoiTuongPickerProps> = ({
  value,
  onChange,
  placeholder = 'F4 - Chọn đối tượng...',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedDoiTuong = useMemo(() => {
    return MOCK_DOI_TUONG.find(d => d.maDt === value || d.id === value);
  }, [value]);

  const filteredDoiTuong = useMemo(() => {
    return MOCK_DOI_TUONG.filter(dt => {
      if (activeFilter === 'KH' && dt.loaiDt !== 'KHACH_HANG') return false;
      if (activeFilter === 'NCC' && dt.loaiDt !== 'NHA_CUNG_CAP') return false;
      if (activeFilter === 'NV' && dt.loaiDt !== 'NHAN_VIEN') return false;

      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        dt.maDt.toLowerCase().includes(term) ||
        dt.tenDt.toLowerCase().includes(term) ||
        (dt.maSoThue && dt.maSoThue.includes(term))
      );
    });
  }, [activeFilter, searchTerm]);

  const handleSelect = (dt: DoiTuongKeToan) => {
    onChange(dt);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="w-full text-left font-mono font-bold text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 flex items-center justify-between transition-colors shadow-2xs"
        title="Bấm F4 để chọn đối tượng theo dõi công nợ"
      >
        <span className={selectedDoiTuong ? 'text-slate-800' : 'text-slate-400 font-normal truncate'}>
          {selectedDoiTuong ? `${selectedDoiTuong.maDt} - ${selectedDoiTuong.tenDt}` : placeholder}
        </span>
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-sans font-semibold text-slate-400 bg-slate-100 rounded border border-slate-200">
          F4
        </kbd>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Danh mục Đối tượng (Khách hàng / NCC / Nhân viên)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="px-5 pt-3 flex gap-2 border-b border-slate-100 text-xs font-semibold">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'KH', label: 'Khách hàng' },
                { id: 'NCC', label: 'Nhà cung cấp' },
                { id: 'NV', label: 'Nhân viên' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeFilter === tab.id
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
                  placeholder="Tìm theo mã đối tượng, tên hoặc MST..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 p-2">
              {filteredDoiTuong.map(dt => (
                <div
                  key={dt.id}
                  onClick={() => handleSelect(dt)}
                  className="px-3 py-2.5 rounded-xl flex items-center justify-between cursor-pointer hover:bg-indigo-50/70 transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    {dt.loaiDt === 'KHACH_HANG' && <Building2 className="w-4 h-4 text-sky-500" />}
                    {dt.loaiDt === 'NHA_CUNG_CAP' && <Building2 className="w-4 h-4 text-amber-500" />}
                    {dt.loaiDt === 'NHAN_VIEN' && <User className="w-4 h-4 text-emerald-500" />}

                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="font-mono text-indigo-700">{dt.maDt}</span>
                        <span>{dt.tenDt}</span>
                      </div>
                      {dt.maSoThue && (
                        <div className="text-[11px] text-slate-400 mt-0.5">MST: {dt.maSoThue}</div>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {dt.loaiDt === 'KHACH_HANG' ? 'Khách hàng' : dt.loaiDt === 'NHA_CUNG_CAP' ? 'Nhà cung cấp' : 'Nhân viên'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
