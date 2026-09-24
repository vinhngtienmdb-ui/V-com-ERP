import React, { useState } from 'react';
import { 
  Warehouse, HardDrive, Building2, Box, Layers, Plus, 
  ChevronRight, ChevronDown, CheckCircle2, AlertCircle, Database
} from 'lucide-react';
import { SAMPLE_VI_TRI_LUU_TRU, ViTriLuuTruItem } from '../../data/danhMucHoSoData';

export const ViTriLuuTruPage: React.FC = () => {
  const [locations, setLocations] = useState<ViTriLuuTruItem[]>(SAMPLE_VI_TRI_LUU_TRU);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'vt-1': true,
    'vt-1-1': true,
    'vt-2': true
  });
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [newTen, setNewTen] = useState('');
  const [newMa, setNewMa] = useState('');
  const [newLoai, setNewLoai] = useState<'VAT_LY' | 'DIEN_TU' | 'THUE_NGOAI'>('VAT_LY');
  const [newSucChua, setNewSucChua] = useState(100);
  const [newDonVi, setNewDonVi] = useState('Hộp');

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getCapacityPercent = (used: number, total: number) => {
    if (!total) return 0;
    return Math.min(100, Math.round((used / total) * 100));
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 90) return 'bg-rose-500';
    if (pct >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const handleCreateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTen || !newMa) return;

    const newLoc: ViTriLuuTruItem = {
      id: `vt-${Date.now()}`,
      maViTri: newMa,
      tenViTri: newTen,
      loaiViTri: newLoai,
      sucChua: newSucChua,
      dangDung: 0,
      donVi: newDonVi,
      viTriChaId: selectedParentId || undefined,
      trangThai: 'HOAT_DONG'
    };

    if (selectedParentId) {
      const addRecursive = (items: ViTriLuuTruItem[]): ViTriLuuTruItem[] => {
        return items.map(item => {
          if (item.id === selectedParentId) {
            return { ...item, con: [...(item.con || []), newLoc] };
          }
          if (item.con) {
            return { ...item, con: addRecursive(item.con) };
          }
          return item;
        });
      };
      setLocations(addRecursive(locations));
      setExpandedNodes(prev => ({ ...prev, [selectedParentId]: true }));
    } else {
      setLocations([...locations, newLoc]);
    }

    setShowAddModal(false);
    setNewTen('');
    setNewMa('');
  };

  const renderLocationTree = (item: ViTriLuuTruItem, level: number = 0) => {
    const isExpanded = !!expandedNodes[item.id];
    const hasChildren = item.con && item.con.length > 0;
    const pct = getCapacityPercent(item.dangDung, item.sucChua);

    return (
      <div key={item.id} className="space-y-1">
        <div className={`flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-300 transition-colors shadow-2xs ${level > 0 ? 'ml-6' : ''}`}>
          <div className="flex items-center gap-3 min-w-0">
            {hasChildren ? (
              <button
                onClick={() => toggleNode(item.id)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <span className="w-6 flex justify-center text-slate-300">•</span>
            )}

            <div className="p-2 bg-slate-50 text-slate-700 rounded-lg shrink-0">
              {item.loaiViTri === 'VAT_LY' && <Warehouse className="w-4 h-4 text-amber-600" />}
              {item.loaiViTri === 'DIEN_TU' && <Database className="w-4 h-4 text-indigo-600" />}
              {item.loaiViTri === 'THUE_NGOAI' && <Building2 className="w-4 h-4 text-emerald-600" />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {item.maViTri}
                </span>
                <span className="text-xs font-bold text-slate-900 truncate">
                  {item.tenViTri}
                </span>
              </div>
              {item.donViThue && (
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Đơn vị thuê ngoài: {item.donViThue} ({item.hopDongLuuTru})
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right w-36">
              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span>{item.dangDung} / {item.sucChua} {item.donVi}</span>
                <span className="font-bold text-slate-700">{pct}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getProgressColor(pct)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedParentId(item.id);
                setShowAddModal(true);
              }}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Thêm vị trí con"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {item.con!.map(child => renderLocationTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <Warehouse className="w-5 h-5" />
            </span>
            Vị trí Lưu trữ & Sức chứa (NĐ 174 Điều 11)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi vị trí vật lý (kệ, hộp tài liệu) và kho điện tử (Cloud S3, KMS) hoặc tổ chức thuê ngoài bảo quản.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedParentId('');
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm kho / vị trí chính
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block uppercase font-semibold">Kho vật lý (Trụ sở)</span>
            <span className="text-lg font-bold text-slate-900">128 / 500 Hộp</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Sức chứa còn trống 74.4%</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block uppercase font-semibold">Kho điện tử (Cloud S3)</span>
            <span className="text-lg font-bold text-slate-900">340 / 1.000 GB</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Mã hóa chuẩn SHA-256</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block uppercase font-semibold">Thuê ngoài (Vinacert)</span>
            <span className="text-lg font-bold text-slate-900">2.400 Bộ hồ sơ</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Hạn hợp đồng: Năm 2034</span>
          </div>
        </div>
      </div>

      {/* Hierarchy Tree */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Sơ đồ phân cấp vị trí lưu trữ
          </h2>
          <span className="text-xs text-slate-400">
            NĐ 174 Điều 11: Bảo đảm an toàn, phòng chống cháy nổ và bảo mật dữ liệu
          </span>
        </div>

        <div className="space-y-2 pt-2">
          {locations.map(loc => renderLocationTree(loc))}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {selectedParentId ? 'Thêm vị trí con' : 'Thêm vị trí lưu trữ mới'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateLocation} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mã vị trí (duy nhất) *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: KE_03, HOP_05, S3_2027..."
                  value={newMa}
                  onChange={(e) => setNewMa(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên mô tả vị trí *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Kệ 03 - Tủ hồ sơ công nợ..."
                  value={newTen}
                  onChange={(e) => setNewTen(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loại vị trí *</label>
                  <select
                    value={newLoai}
                    onChange={(e) => setNewLoai(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="VAT_LY">Kho vật lý</option>
                    <option value="DIEN_TU">Kho điện tử (Cloud)</option>
                    <option value="THUE_NGOAI">Thuê ngoài bảo quản</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sức chứa tối đa *</label>
                  <input
                    type="number"
                    min={1}
                    value={newSucChua}
                    onChange={(e) => setNewSucChua(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Đơn vị đo lường</label>
                <input
                  type="text"
                  value={newDonVi}
                  onChange={(e) => setNewDonVi(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700"
                >
                  Lưu vị trí
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
