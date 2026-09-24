import React, { useState } from 'react';
import { 
  FolderTree, FileText, Layers, Warehouse, 
  Trash2, ShieldCheck, Sparkles, ChevronRight
} from 'lucide-react';
import { DanhMucLoaiHoSoPage } from './DanhMucLoaiHoSoPage';
import { DanhSachHoSoPage } from './DanhSachHoSoPage';
import { ChiTietHoSoPage } from './ChiTietHoSoPage';
import { TrichXuatHoSoPage } from './TrichXuatHoSoPage';
import { ViTriLuuTruPage } from './ViTriLuuTruPage';
import { TieuHuyTaiLieuPage } from './TieuHuyTaiLieuPage';

export type HoSoTab = 'DANH_SACH' | 'DANH_MUC' | 'TRICH_XUAT' | 'VI_TRI' | 'TIEU_HUY';

export const HoSoApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<HoSoTab>('TRICH_XUAT'); // Default to center-piece extraction screen
  const [selectedHoSoId, setSelectedHoSoId] = useState<string | null>(null);

  const handleSelectHoSo = (id: string) => {
    setSelectedHoSoId(id);
  };

  const handleBackToList = () => {
    setSelectedHoSoId(null);
  };

  return (
    <div className="w-full space-y-6">
      {/* Phân hệ Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Phân hệ Hồ sơ – Lưu trữ kế toán
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                NĐ 174 & TT99
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Quản lý hồ sơ chứng từ, sắp xếp theo thời gian, trích xuất 6 mức & tiêu hủy đúng luật.
            </p>
          </div>
        </div>

        {/* 6 Sub-screens Navigation */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('TRICH_XUAT');
              setSelectedHoSoId(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'TRICH_XUAT' && !selectedHoSoId
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Trích xuất đa mức
          </button>

          <button
            onClick={() => {
              setActiveTab('DANH_SACH');
              setSelectedHoSoId(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'DANH_SACH' || selectedHoSoId
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Bộ hồ sơ
          </button>

          <button
            onClick={() => {
              setActiveTab('DANH_MUC');
              setSelectedHoSoId(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'DANH_MUC'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            Danh mục loại
          </button>

          <button
            onClick={() => {
              setActiveTab('VI_TRI');
              setSelectedHoSoId(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'VI_TRI'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Warehouse className="w-3.5 h-3.5" />
            Vị trí lưu trữ
          </button>

          <button
            onClick={() => {
              setActiveTab('TIEU_HUY');
              setSelectedHoSoId(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'TIEU_HUY'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Tiêu hủy
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="animate-in fade-in duration-150">
        {selectedHoSoId ? (
          <ChiTietHoSoPage hoSoId={selectedHoSoId} onBack={handleBackToList} />
        ) : (
          <>
            {activeTab === 'TRICH_XUAT' && <TrichXuatHoSoPage />}
            {activeTab === 'DANH_SACH' && <DanhSachHoSoPage onSelectHoSo={handleSelectHoSo} />}
            {activeTab === 'DANH_MUC' && <DanhMucLoaiHoSoPage />}
            {activeTab === 'VI_TRI' && <ViTriLuuTruPage />}
            {activeTab === 'TIEU_HUY' && <TieuHuyTaiLieuPage />}
          </>
        )}
      </div>
    </div>
  );
};
