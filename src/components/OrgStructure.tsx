import React, { useState } from 'react';
import { Building2, Users, Briefcase, Plus, Search, Edit2, Trash2, X, ChevronRight, ChevronDown, AlignLeft, GitMerge } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Department {
  id: string;
  name: string;
  manager: string;
  parentId: string | null;
  description: string;
}

interface JobTitle {
  id: string;
  name: string;
  departmentId: string;
}

interface JobRank {
  id: string;
  name: string;
  level: number;
}

const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'D-001', name: 'Ban Giám đốc', manager: 'Trần Văn Sếp', parentId: null, description: 'Điều hành chung' },
  { id: 'D-002', name: 'Vận hành Sàn', manager: 'Lê Hoàng Minh', parentId: 'D-001', description: 'Quản lý vận hành hàng ngày' },
  { id: 'D-003', name: 'Marketing', manager: 'Nguyễn Diệu Nhi', parentId: 'D-001', description: 'Tiếp thị và truyền thông' },
  { id: 'D-004', name: 'CSKH', manager: 'Trần Thị B', parentId: 'D-002', description: 'Chăm sóc khách hàng' },
  { id: 'D-005', name: 'Nhân sự & Đào tạo', manager: 'Võ Văn C', parentId: 'D-001', description: 'Tuyển dụng và đào tạo' },
];

const INITIAL_JOB_TITLES: JobTitle[] = [
  { id: 'T-001', name: 'Giám đốc Điều hành', departmentId: 'D-001' },
  { id: 'T-002', name: 'Trưởng phòng Vận hành', departmentId: 'D-002' },
  { id: 'T-003', name: 'Nhân viên CSKH', departmentId: 'D-004' },
  { id: 'T-004', name: 'Chuyên viên Marketing', departmentId: 'D-003' },
];

const INITIAL_JOB_RANKS: JobRank[] = [
  { id: 'R-001', name: 'Thực tập sinh', level: 1 },
  { id: 'R-002', name: 'Nhân viên', level: 2 },
  { id: 'R-003', name: 'Trưởng nhóm', level: 3 },
  { id: 'R-004', name: 'Trưởng phòng', level: 4 },
  { id: 'R-005', name: 'Giám đốc', level: 5 },
];

export function OrgStructure() {
  const [activeTab, setActiveTab] = useState<'departments' | 'titles' | 'ranks' | 'org_chart'>('departments');
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>(INITIAL_JOB_TITLES);
  const [jobRanks, setJobRanks] = useState<JobRank[]>(INITIAL_JOB_RANKS);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'department' | 'title' | 'rank' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState<any>({});

  const handleOpenModal = (type: 'department' | 'title' | 'rank', item: any = null) => {
    setModalType(type);
    setEditingItem(item);
    if (item) {
      setFormData(item);
    } else {
      if (type === 'department') setFormData({ name: '', manager: '', parentId: '', description: '' });
      if (type === 'title') setFormData({ name: '', departmentId: '' });
      if (type === 'rank') setFormData({ name: '', level: 1 });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalType(null);
    setEditingItem(null);
    setFormData({});
  };

  const currentMaxId = (arr: any[], prefix: string) => {
    const ids = arr.map(a => parseInt(a.id.replace(prefix, ''))).filter(n => !isNaN(n));
    return ids.length > 0 ? Math.max(...ids) : 0;
  };

  const handleSave = () => {
    if (modalType === 'department') {
      if (editingItem) {
        setDepartments(departments.map(d => d.id === editingItem.id ? { ...d, ...formData, parentId: formData.parentId || null } : d));
      } else {
        const newId = `D-${String(currentMaxId(departments, 'D-') + 1).padStart(3, '0')}`;
        setDepartments([...departments, { ...formData, id: newId, parentId: formData.parentId || null }]);
      }
    } else if (modalType === 'title') {
      if (editingItem) {
        setJobTitles(jobTitles.map(t => t.id === editingItem.id ? { ...t, ...formData } : t));
      } else {
        const newId = `T-${String(currentMaxId(jobTitles, 'T-') + 1).padStart(3, '0')}`;
        setJobTitles([...jobTitles, { ...formData, id: newId }]);
      }
    } else if (modalType === 'rank') {
      if (editingItem) {
        setJobRanks(jobRanks.map(r => r.id === editingItem.id ? { ...r, ...formData } : r));
      } else {
        const newId = `R-${String(currentMaxId(jobRanks, 'R-') + 1).padStart(3, '0')}`;
        setJobRanks([...jobRanks, { ...formData, id: newId }]);
      }
    }
    handleCloseModal();
  };

  const handleDelete = (type: 'department' | 'title' | 'rank', id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa?')) return;
    if (type === 'department') {
      // Check if it has children
      if (departments.some(d => d.parentId === id)) {
        alert('Không thể xóa phòng ban đang có phòng ban con!');
        return;
      }
      setDepartments(departments.filter(d => d.id !== id));
      setJobTitles(jobTitles.filter(t => t.departmentId !== id));
    }
    if (type === 'title') setJobTitles(jobTitles.filter(t => t.id !== id));
    if (type === 'rank') setJobRanks(jobRanks.filter(r => r.id !== id));
  };

  const OrgChartNode = ({ node, level = 0 }: { node: Department, level?: number }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const children = departments.filter(d => d.parentId === node.id);
    const hasChildren = children.length > 0;
    
    return (
      <div className="flex flex-col relative w-full pt-4">
        <div className="flex justify-center items-center relative z-10 w-full">
          <div className="${level > 0 ? 'mt-4 border-t-2 border-slate-400 w-px h-4 top-0 absolute' : ''}"></div>
          <div className="bg-white border-2 border-primary-500 rounded-lg p-4 shadow-sm w-64 text-center hover:shadow-md transition-shadow cursor-default flex flex-col items-center">
             <div className="font-bold text-slate-900 line-clamp-1" title={node.name}>{node.name}</div>
             <div className="text-xs text-slate-600 mt-1 line-clamp-1" title={node.manager}>Quản lý: {node.manager || 'Chưa cập nhật'}</div>
             {hasChildren && (
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-3 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center hover:bg-primary-100 text-slate-700 hover:text-primary-600 transition-colors"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
             )}
          </div>
        </div>
        
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div 
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: 'auto' }}
               exit={{ opacity: 0, height: 0 }}
               className="flex relative justify-center gap-8 mt-6 pt-6"
            >
              {/* Connecting vertical line down from parent */}
              <div className="absolute top-0 w-px h-6 bg-slate-300 z-0"></div>
              {/* Horizontal connecting line across children */}
              {children.length > 1 && (
                <div className="absolute top-6 h-px bg-slate-300 pointer-events-none" 
                     style={{ 
                       left: `calc(140px)`, // approx offset
                       right: `calc(140px)` 
                     }}></div>
              )}
              
              {children.map(child => (
                <div key={child.id} className="relative flex-1 min-w-[280px]">
                  <OrgChartNode node={child} level={level + 1} />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const rootDepartments = departments.filter(d => !d.parentId);

  return (
    <div className="space-y-6 animate-in fade-in slide-in- duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="font-serif tracking-tight text-2xl font-bold text-slate-900">Cơ cấu Tổ chức</h1>
          <p className="text-sm text-slate-600">Quản lý sơ đồ bộ máy phòng ban, chức danh và cấp bậc trong hệ thống.</p>
        </div>
        {activeTab !== 'org_chart' && (
          <button 
            onClick={() => handleOpenModal(activeTab === 'departments' ? 'department' : activeTab === 'titles' ? 'title' : 'rank')}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> 
            Thêm {activeTab === 'departments' ? 'phòng ban' : activeTab === 'titles' ? 'chức danh' : 'cấp bậc'}
          </button>
        )}
      </div>

      <div className="flex border-b border-slate-300 gap-6">
        {[
          { id: 'departments', label: 'Danh Sách Phòng Ban', icon: Building2 },
          { id: 'titles', label: 'Danh Sách Chức Danh', icon: Briefcase },
          { id: 'ranks', label: 'Cấp Bậc Nhân Sự', icon: AlignLeft },
          { id: 'org_chart', label: 'Sơ Đồ Tổ Chức', icon: GitMerge }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "pb-3 font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-2 relative",
              activeTab === tab.id ? "text-primary-700" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="activeTabOrg" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden min-h-[500px]">
        {activeTab === 'departments' && (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-300 text-xs font-bold text-slate-600 uppercase tracking-widest">
                <th className="px-6 py-4">Mã PB</th>
                <th className="px-6 py-4">Tên Phòng Ban</th>
                <th className="px-6 py-4">Quản Lý</th>
                <th className="px-6 py-4">Trực Thuộc</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-slate-600">Chưa có dữ liệu.</td>
                </tr>
              ) : (
                departments.map(dept => (
                  <tr key={dept.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-sm text-slate-600 font-bold">{dept.id}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{dept.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{dept.manager || 'Chưa có'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {departments.find(d => d.id === dept.parentId)?.name || '---'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 text-slate-500">
                        <button onClick={() => handleOpenModal('department', dept)} className="p-1 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete('department', dept.id)} className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'titles' && (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-300 text-xs font-bold text-slate-600 uppercase tracking-widest">
                <th className="px-6 py-4">Mã CD</th>
                <th className="px-6 py-4">Tên Chức Danh</th>
                <th className="px-6 py-4">Phòng Ban Cấp Bộ</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobTitles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-slate-600">Chưa có dữ liệu.</td>
                </tr>
              ) : (
                jobTitles.map(title => (
                  <tr key={title.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-sm text-slate-600 font-bold">{title.id}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{title.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {departments.find(d => d.id === title.departmentId)?.name || '---'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 text-slate-500">
                        <button onClick={() => handleOpenModal('title', title)} className="p-1 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete('title', title.id)} className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'ranks' && (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-300 text-xs font-bold text-slate-600 uppercase tracking-widest">
                <th className="px-6 py-4">Mã CB</th>
                <th className="px-6 py-4">Tên Cấp Bậc</th>
                <th className="px-6 py-4">Level</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobRanks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-slate-600">Chưa có dữ liệu.</td>
                </tr>
              ) : (
                jobRanks.sort((a,b) => a.level - b.level).map(rank => (
                  <tr key={rank.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-sm text-slate-600 font-bold">{rank.id}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{rank.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-bold">Lvl {rank.level}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 text-slate-500">
                        <button onClick={() => handleOpenModal('rank', rank)} className="p-1 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete('rank', rank.id)} className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'org_chart' && (
          <div className="p-8 overflow-auto min-h-[500px] w-full flex justify-center bg-slate-50/50">
             {rootDepartments.length === 0 ? (
                <div className="text-slate-600 text-sm mt-8">Chưa có sơ đồ tổ chức</div>
             ) : (
                <div className="inline-flex gap-16 pb-12 w-full justify-center">
                  {rootDepartments.map(root => (
                    <OrgChartNode key={root.id} node={root} />
                  ))}
                </div>
             )}
          </div>
        )}
      </div>

      {/* MODAL CẬP NHẬT */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-slate-300"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-bold text-slate-900">
                  {editingItem ? 'Cập nhật' : 'Thêm mới'}{' '}
                  {modalType === 'department' ? 'Phòng Ban' : modalType === 'title' ? 'Chức Danh' : 'Cấp Bậc'}
                </h3>
                <button onClick={handleCloseModal} className="text-slate-500 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {modalType === 'department' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Tên Phòng Ban</label>
                      <input 
                        type="text" 
                        value={formData.name || ''} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full border border-slate-300 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" 
                        placeholder="VD: Phòng IT"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Tên Quản Lý</label>
                      <input 
                        type="text" 
                        value={formData.manager || ''} 
                        onChange={(e) => setFormData({...formData, manager: e.target.value})}
                        className="w-full border border-slate-300 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="VD: Nguyễn Văn A"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Trực thuộc phòng ban</label>
                      <select 
                        value={formData.parentId || ''} 
                        onChange={(e) => setFormData({...formData, parentId: e.target.value})}
                        className="w-full border border-slate-300 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      >
                        <option value="">Không có cữ bộ trực thuộc (Cao nhất)</option>
                        {departments.filter(d => d.id !== editingItem?.id).map(d => (
                          <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {modalType === 'title' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Tên Chức Danh</label>
                      <input 
                        type="text" 
                        value={formData.name || ''} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full border border-slate-300 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" 
                        placeholder="VD: Trưởng phòng IT"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Thuộc phòng ban</label>
                      <select 
                        value={formData.departmentId || ''} 
                        onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                        className="w-full border border-slate-300 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      >
                        <option value="">-- Chọn phòng ban --</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {modalType === 'rank' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Tên Cấp Bậc</label>
                      <input 
                        type="text" 
                        value={formData.name || ''} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full border border-slate-300 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" 
                        placeholder="VD: Thực tập sinh"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Level (Số nguyên dương)</label>
                      <input 
                        type="number" 
                        min="1"
                        value={formData.level || 1} 
                        onChange={(e) => setFormData({...formData, level: parseInt(e.target.value) || 1})}
                        className="w-full border border-slate-300 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" 
                      />
                      <p className="text-xs text-slate-600 mt-2">Level càng cao thì cấp bậc/vị thế chức vu càng lớn (vd: Giám đốc cấp 5 &gt; Nhân viên cấp 2).</p>
                    </div>
                  </>
                )}
              </div>
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                <button 
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={handleSave}
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  disabled={!formData.name}
                >
                  {editingItem ? 'Lưu thay đổi' : 'Thêm mới'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

