import React, { useState } from 'react';
import { X, FileText, Settings, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

interface FormConfigModalProps {
  initialConfig: any;
  onClose: () => void;
  onSave: (config: any) => void;
}

const TABS = [
  { id: 'basic', label: 'Thông tin cơ bản' },
  { id: 'design', label: 'Thiết kế biểu mẫu' },
  { id: 'workflow', label: 'Tạo luồng phê duyệt' },
  { id: 'print', label: 'In yêu cầu' },
];

export function FormConfigModal({ initialConfig, onClose, onSave }: FormConfigModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('basic');
  const [config, setConfig] = useState(initialConfig);

  const handleSave = () => {
    onSave(config);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#F8F9FA] rounded-xl w-full max-w-4xl h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Tabs */}
        <div className="bg-white border-b border-stone-200 pt-4 px-6 flex justify-between items-end relative">
          <div className="flex gap-6">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "pb-3 text-sm font-bold transition-colors relative",
                  activeTab === tab.id 
                    ? "text-emerald-600" 
                    : "text-stone-500 hover:text-stone-700"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 mb-2">
            <button 
              onClick={onClose} 
              className="px-4 py-1.5 text-sm font-semibold text-stone-500 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button 
              onClick={handleSave} 
              className="px-4 py-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              Lưu cấu hình
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {activeTab === 'basic' && (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-100 max-w-2xl mx-auto space-y-6">
              
              <div className="flex gap-4 items-start border-b border-stone-200 pb-4">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <input 
                    type="text" 
                    value={config.name}
                    onChange={(e) => setConfig({...config, name: e.target.value})}
                    placeholder="Nhập tên yêu cầu"
                    className="w-full text-2xl font-bold bg-transparent border-none focus:outline-none placeholder:text-stone-300 text-stone-800"
                  />
                  <div className="text-right text-xs text-stone-400 mt-1">{config.name.length}/150</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-800 mb-2">Mô tả</label>
                <textarea 
                  value={config.description || ''}
                  onChange={(e) => setConfig({...config, description: e.target.value})}
                  placeholder="Nhập mô tả cho yêu cầu"
                  className="w-full border border-stone-200 rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-800 mb-2">Nhóm yêu cầu<span className="text-rose-500">*</span></label>
                <select 
                  value={config.category}
                  onChange={(e) => setConfig({...config, category: e.target.value})}
                  className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="vang_mat">Vắng mặt</option>
                  <option value="giai_trinh">Giải trình công</option>
                  <option value="tai_chinh">Tài chính</option>
                  <option value="hanh_chinh">Hành chính</option>
                  <option value="nhan_su">Nhân sự</option>
                  <option value="khac">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-800 mb-3">Đối tượng áp dụng<span className="text-rose-500">*</span></label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="radio" 
                      checked={!config.specificTarget}
                      onChange={() => setConfig({...config, specificTarget: false})}
                      className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 border-stone-300"
                    />
                    <span className="text-sm font-medium text-stone-700">Tất cả thành viên</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="radio" 
                      checked={config.specificTarget === true}
                      onChange={() => setConfig({...config, specificTarget: true})}
                      className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 border-stone-300"
                    />
                    <span className="text-sm font-medium text-stone-700">Chỉ định thành viên</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-800 mb-2">Người tạo</label>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center overflow-hidden">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-stone-500" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-stone-700">{user?.displayName || user?.email || 'Người dùng'}</span>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'design' && (
            <div className="text-center py-20 text-stone-400 font-medium">
              <Settings className="w-12 h-12 mx-auto mb-4 text-stone-300" />
              <p>Trình thiết kế biểu mẫu (Kéo thả trường dữ liệu)</p>
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="text-center py-20 text-stone-400 font-medium">
              <Settings className="w-12 h-12 mx-auto mb-4 text-stone-300" />
              <p>Màn hình cấu hình luồng phê duyệt</p>
            </div>
          )}

          {activeTab === 'print' && (
            <div className="text-center py-20 text-stone-400 font-medium">
              <Settings className="w-12 h-12 mx-auto mb-4 text-stone-300" />
              <p>Cấu hình mẫu in yêu cầu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
