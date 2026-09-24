import React, { useState, useMemo } from 'react';
import { 
  FolderTree, Search, Filter, ShieldCheck, Clock, BookOpen, 
  ChevronRight, ChevronDown, CheckCircle2, AlertCircle, Info, Sparkles 
} from 'lucide-react';
import { DANH_MUC_18_PHAN, SAMPLE_DANH_MUC_LOAI_HO_SO, LoaiHoSoItem } from '../../data/danhMucHoSoData';

export const DanhMucLoaiHoSoPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTruc, setSelectedTruc] = useState<'ALL' | 'NGHIEP_VU' | 'NGANH' | 'HOP_DONG'>('ALL');
  const [selectedThoiHan, setSelectedThoiHan] = useState<string>('ALL');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    '04': true,
    '04.1': true,
    '01': true,
    '05': true
  });
  const [selectedDetail, setSelectedDetail] = useState<LoaiHoSoItem | null>(null);

  const toggleNode = (ma: string) => {
    setExpandedNodes(prev => ({ ...prev, [ma]: !prev[ma] }));
  };

  const filteredCategories = useMemo(() => {
    return SAMPLE_DANH_MUC_LOAI_HO_SO.filter(item => {
      const matchSearch = 
        item.maLoai.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tenLoai.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.taiKhoanLienQuan && item.taiKhoanLienQuan.includes(searchTerm));
      
      const matchTruc = selectedTruc === 'ALL' || item.truc === selectedTruc;
      const matchThoiHan = selectedThoiHan === 'ALL' || item.thoiHanLuuTru === selectedThoiHan;

      return matchSearch && matchTruc && matchThoiHan;
    });
  }, [searchTerm, selectedTruc, selectedThoiHan]);

  const formatThoiHan = (th: string) => {
    switch (th) {
      case 'NAM_5': return { label: '5 năm', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'NAM_10': return { label: '10 năm (chuẩn)', badge: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'VINH_VIEN': return { label: 'Vĩnh viễn', badge: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'KE_THUA': return { label: 'Kế thừa', badge: 'bg-slate-100 text-slate-600 border-slate-200' };
      default: return { label: th, badge: 'bg-slate-100 text-slate-700' };
    }
  };

  const formatTruc = (truc: string) => {
    switch (truc) {
      case 'NGHIEP_VU': return { label: 'Nghiệp vụ (01-11)', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
      case 'NGANH': return { label: 'Ngành (Checklist)', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
      case 'HOP_DONG': return { label: 'Hợp đồng (Phần 18)', color: 'text-amber-600 bg-amber-50 border-amber-200' };
      default: return { label: truc, color: 'text-slate-600 bg-slate-50' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick summary */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <FolderTree className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Danh mục Loại hồ sơ (Cây 3 cấp theo NĐ 174 & TT99)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gồm 18 phần nghiệp vụ, nhóm con và thành phần chi tiết. Phân loại một lần khi nhập — trích xuất đa chiều.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const allExpanded: Record<string, boolean> = {};
              SAMPLE_DANH_MUC_LOAI_HO_SO.forEach(i => allExpanded[i.maLoai] = true);
              setExpandedNodes(allExpanded);
            }}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Mở rộng tất cả
          </button>
          <button
            onClick={() => setExpandedNodes({})}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Thu gọn
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã loại, tên hồ sơ, số hiệu tài khoản..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Trục:</span>
          <select
            value={selectedTruc}
            onChange={(e) => setSelectedTruc(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium"
          >
            <option value="ALL">Tất cả trục</option>
            <option value="NGHIEP_VU">Nghiệp vụ (01-11)</option>
            <option value="NGANH">Ngành kinh doanh (12-17)</option>
            <option value="HOP_DONG">Hợp đồng (18)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Thời hạn:</span>
          <select
            value={selectedThoiHan}
            onChange={(e) => setSelectedThoiHan(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium"
          >
            <option value="ALL">Tất cả thời hạn</option>
            <option value="NAM_10">10 năm (Điều 13 NĐ 174)</option>
            <option value="NAM_5">5 năm (Điều 12 NĐ 174)</option>
            <option value="VINH_VIEN">Vĩnh viễn (Điều 14 NĐ 174)</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Tree list on the left, Category card / specs on the right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Cây phân cấp loại hồ sơ
            </span>
            <span className="text-xs text-slate-400">
              {filteredCategories.length} mục tìm thấy
            </span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[640px]">
            {filteredCategories.map((item) => {
              const hasChildren = SAMPLE_DANH_MUC_LOAI_HO_SO.some(child => child.maLoaiCha === item.maLoai);
              const isExpanded = !!expandedNodes[item.maLoai];
              const thInfo = formatThoiHan(item.thoiHanLuuTru);
              const trucInfo = formatTruc(item.truc);
              const indent = item.cap === 1 ? 'pl-4' : item.cap === 2 ? 'pl-9' : 'pl-14';

              return (
                <div
                  key={item.maLoai}
                  onClick={() => setSelectedDetail(item)}
                  className={`flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer transition-colors ${indent} ${selectedDetail?.maLoai === item.maLoai ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : ''}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.cap < 3 ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNode(item.maLoai);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded"
                      >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    ) : (
                      <span className="w-4 flex justify-center text-slate-300">•</span>
                    )}

                    <span className={`font-mono text-xs font-semibold ${item.cap === 1 ? 'text-indigo-700 text-sm' : item.cap === 2 ? 'text-slate-800' : 'text-slate-600'}`}>
                      {item.maLoai}
                    </span>

                    <span className={`text-xs truncate ${item.cap === 1 ? 'font-bold text-slate-900' : item.cap === 2 ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>
                      {item.tenLoai}
                    </span>

                    {item.batBuoc && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200 rounded">
                        Bắt buộc
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${trucInfo.color}`}>
                      {item.truc}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${thInfo.badge}`}>
                      {thInfo.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Details Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Info className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Chi tiết Loại hồ sơ & Căn cứ</h3>
          </div>

          {selectedDetail ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Mã loại & Cấp:</span>
                <div className="flex items-center gap-2 font-mono font-bold text-slate-800">
                  <span className="px-2 py-0.5 bg-slate-100 rounded">{selectedDetail.maLoai}</span>
                  <span className="text-slate-500">Cấp {selectedDetail.cap}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Tên gọi chuẩn TT99:</span>
                <span className="font-semibold text-slate-900 text-sm">{selectedDetail.tenLoai}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 block mb-1">Trục dữ liệu:</span>
                  <span className="font-medium text-slate-700">{selectedDetail.truc}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Nguồn tự động:</span>
                  <span className="font-medium text-slate-700">{selectedDetail.nguonTuDong}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 block mb-1">Thời hạn lưu trữ:</span>
                  <span className="font-medium text-indigo-700">
                    {formatThoiHan(selectedDetail.thoiHanLuuTru).label}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Mốc tính:</span>
                  <span className="font-medium text-slate-700">{selectedDetail.mocTinhThoiHan}</span>
                </div>
              </div>

              {selectedDetail.taiKhoanLienQuan && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block mb-1">Tài khoản liên quan (TT99):</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedDetail.taiKhoanLienQuan.split(',').map(tk => (
                      <span key={tk.trim()} className="px-2 py-0.5 bg-blue-50 text-blue-700 font-mono font-semibold rounded text-[11px]">
                        {tk.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedDetail.canCuPhapLy && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block mb-1">Căn cứ pháp lý:</span>
                  <div className="flex items-center gap-1.5 text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{selectedDetail.canCuPhapLy}</span>
                  </div>
                </div>
              )}

              {selectedDetail.moTa && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block mb-1">Ghi chú & Hướng dẫn:</span>
                  <p className="text-slate-600 leading-relaxed bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                    {selectedDetail.moTa}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <FolderTree className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs">Chọn một mục bất kỳ bên cây thư mục để xem căn cứ pháp lý và thời hạn lưu trữ chi tiết.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
