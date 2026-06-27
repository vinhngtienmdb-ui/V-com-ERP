const fs = require('fs');
const path = 'src/components/Settings.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. MISA MODAL
const misaStart = content.indexOf('{/* --- MISA CONFIGURATION MODAL --- */}');
const sepayStart = content.indexOf('{/* --- SEPAY CONFIGURATION MODAL --- */}');

if (misaStart !== -1 && sepayStart !== -1) {
  const replacementMisa = `{\/* --- MISA CONFIGURATION MODAL --- *\/}
      {activeConfigModal === 'misa' && (
        <Modal
          isOpen={activeConfigModal === 'misa'}
          onClose={() => setActiveConfigModal(null)}
          title="Cấu hình Kế toán Doanh nghiệp MISA"
          icon={<Building2 className="w-5 h-5 text-emerald-600" />}
          maxWidth="lg"
          onConfirm={() => {
            saveMisaConfigLocal(misaConfig);
            logAction('Settings.Misa', 'UPDATE', 'Cập nhật cấu hình Misa');
            setActiveConfigModal(null);
          }}
          confirmText="Lưu cấu hình MISA"
          confirmButtonClass="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200/50 dark:border-yellow-900/30 p-3.5 rounded-2xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-[10px] text-yellow-800 dark:text-yellow-300">
                <span className="font-bold">Lưu ý nghiệp vụ</span>: Bắt buộc tuân thủ <span className="font-bold">Thông tư 99/2025/TT-BTC</span> của Bộ Tài chính khi hạch toán. Các mã tài khoản phải khớp chính xác với hệ thống tài khoản kế toán doanh nghiệp (COA) hiện hành.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">MISA App ID</label>
                <input 
                  type="text" 
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 font-mono"
                  value={misaConfig.appId}
                  onChange={e => setMisaConfig(prev => ({ ...prev, appId: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Access Token (API Connect)</label>
                <input 
                  type="password" 
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 font-mono"
                  value={misaConfig.accessToken}
                  onChange={e => setMisaConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700/50 pt-3">
              <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-3">Thiết lập tài khoản hạch toán mặc định</h5>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500">Tài khoản Nợ thu (Ngân hàng)</label>
                  <input 
                    type="text" 
                    maxLength={5}
                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 font-mono"
                    value={misaConfig.debitAccountDefault}
                    onChange={e => setMisaConfig(prev => ({ ...prev, debitAccountDefault: e.target.value.replace(/\\D/g, '') }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500">Tài khoản Doanh thu (Có)</label>
                  <input 
                    type="text" 
                    maxLength={5}
                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 font-mono"
                    value={misaConfig.creditAccountDefault}
                    onChange={e => setMisaConfig(prev => ({ ...prev, creditAccountDefault: e.target.value.replace(/\\D/g, '') }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500">Tài khoản Phải thu (131)</label>
                  <input 
                    type="text" 
                    maxLength={5}
                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 font-mono"
                    value={misaConfig.receivableAccountDefault}
                    onChange={e => setMisaConfig(prev => ({ ...prev, receivableAccountDefault: e.target.value.replace(/\\D/g, '') }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500">Thuế GTGT đầu ra (33311)</label>
                  <input 
                    type="text" 
                    maxLength={5}
                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 font-mono"
                    value={misaConfig.taxAccountOutDefault || ''}
                    onChange={e => setMisaConfig(prev => ({ ...prev, taxAccountOutDefault: e.target.value.replace(/\\D/g, '') }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500">Mã kho mặc định</label>
                  <input 
                    type="text" 
                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 font-mono uppercase"
                    value={misaConfig.defaultWarehouseCode || ''}
                    onChange={e => setMisaConfig(prev => ({ ...prev, defaultWarehouseCode: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500">Phải trả nhà cung cấp (331)</label>
                  <input 
                    type="text" 
                    maxLength={5}
                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 font-mono"
                    value={misaConfig.partnerLiabilitiesAccount || ''}
                    onChange={e => setMisaConfig(prev => ({ ...prev, partnerLiabilitiesAccount: e.target.value.replace(/\\D/g, '') }))}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700/50 pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300">Tách giao dịch sàn TMĐT</h5>
                  <p className="text-[9px] text-slate-500">Tự động hạch toán riêng phí hoa hồng Shopee/TikTok vào TK 641.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={misaConfig.enableMarketplaceSplit}
                    onChange={e => setMisaConfig(prev => ({ ...prev, enableMarketplaceSplit: e.target.checked }))}
                  />
                  <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-3.5 after:width-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300">Chế độ Kế toán Nội bộ (Mock Mode)</h5>
                  <p className="text-[9px] text-slate-500">Chạy các nghiệp vụ ở dạng Sandbox, không đẩy trực tiếp vào sổ cái chính thức.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={misaConfig.localAccountingMode}
                    onChange={e => setMisaConfig(prev => ({ ...prev, localAccountingMode: e.target.checked }))}
                  />
                  <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-3.5 after:width-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>
          </div>
        </Modal>
      )}

      `;
  content = content.substring(0, misaStart) + replacementMisa + content.substring(sepayStart);
  console.log("Misa replaced");
}

// 2. Job Title & Fee Management Modal
const jobTitleStartStr = "{showAddJobTitleModal && (";
const jobTitleStart = content.indexOf(jobTitleStartStr);
const feeModalStartStr = "{/* Fee Management Modal */}";
const feeModalStart = content.indexOf(feeModalStartStr);
const pageEditorModalStartStr = "{/* Page Editor Modal */}";
const pageEditorModalStart = content.indexOf(pageEditorModalStartStr);

if (jobTitleStart !== -1 && feeModalStart !== -1 && pageEditorModalStart !== -1) {
  const beforeJobTitle = content.substring(0, jobTitleStart);
  const afterPageEditor = content.substring(pageEditorModalStart);

  const newJobAndFeeModals = `{showAddJobTitleModal && (
    <Modal
      isOpen={showAddJobTitleModal}
      onClose={() => { setShowAddJobTitleModal(false); setEditingJobTitle(null); }}
      title={editingJobTitle ? 'Chỉnh sửa Chức danh' : 'Thêm Chức danh mới'}
      maxWidth="lg"
      onConfirm={handleSaveJobTitle}
      confirmText="Lưu Chức danh"
      confirmDisabled={!newJobTitle.name || !newJobTitle.department}
      confirmButtonClass="bg-blue-600 hover:bg-slate-800 text-white"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1">Tên chức danh <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            value={newJobTitle.name || ''} 
            onChange={e => setNewJobTitle({...newJobTitle, name: e.target.value})}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 text-sm"
            placeholder="VD: Trưởng phòng Marketing"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1">Phòng ban <span className="text-red-500">*</span></label>
          <select 
            value={newJobTitle.department || ''} 
            onChange={e => setNewJobTitle({...newJobTitle, department: e.target.value})}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 text-sm"
          >
            <option value="">Chọn phòng ban</option>
            {MOCK_DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1">Cấp bậc</label>
          <select 
            value={newJobTitle.rank || ''} 
            onChange={e => setNewJobTitle({...newJobTitle, rank: e.target.value})}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 text-sm"
          >
            <option value="">Chọn cấp bậc</option>
            {MOCK_JOB_RANKS.map(r => <option key={r.id} value={r.id}>{r.name} (Level {r.level})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1">Mô tả công việc</label>
          <textarea 
            value={newJobTitle.description || ''} 
            onChange={e => setNewJobTitle({...newJobTitle, description: e.target.value})}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 text-sm min-h-[100px]"
            placeholder="Mô tả ngắn gọn chức năng, nhiệm vụ..."
          />
        </div>
      </div>
    </Modal>
  )}

  {/* Fee Management Modal */}
  {showFeeModal && (
    <Modal
      title={editingFee ? 'Chỉnh sửa loại phí' : 'Thêm loại phí mới'}
      icon={<BadgeDollarSign className="w-5 h-5 text-blue-600" />}
      isOpen={showFeeModal}
      maxWidth="lg"
      onClose={() => setShowFeeModal(false)}
      onConfirm={() => {
        if (editingFee) {
          setSystemFees(systemFees.map(f => f.id === editingFee.id ? { ...newFee as SystemFee, id: f.id } : f));
          logAction('Settings.Fees', 'UPDATE', \`Cập nhật loại phí: \${newFee.name}\`);
        } else {
          setSystemFees([...systemFees, { ...newFee as SystemFee, id: \`sys-\${Date.now()}\`, isActive: true }]);
          logAction('Settings.Fees', 'CREATE', \`Thêm mới loại phí: \${newFee.name}\`);
        }
        setShowFeeModal(false);
        addNotification('Đã cập nhật cấu hình', \`Loại phí \${newFee.name} đã được lưu thành công.\`);
      }}
      confirmText={editingFee ? 'Cập nhật' : 'Xác nhận Thêm'}
    >
      <div className="space-y-6">
        {/* Fee Name */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tên loại phí</label>
          <input 
            type="text" 
            value={newFee.name || ''}
            onChange={(e) => setNewFee({ ...newFee, name: e.target.value })}
            placeholder="VD: Phí vận hành kho, Phí thanh toán..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:border-slate-900 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Loại phí</label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setNewFee({ ...newFee, type: 'percentage' })}
                className={cn("flex-1 py-2 text-xs font-bold rounded-md transition-all", newFee.type === 'percentage' ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800")}
              >
                Phần trăm (%)
              </button>
              <button 
                onClick={() => setNewFee({ ...newFee, type: 'fixed' })}
                className={cn("flex-1 py-2 text-xs font-bold rounded-md transition-all", newFee.type === 'fixed' ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800")}
              >
                Cố định (đ)
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Giá trị</label>
            <div className="relative">
              <input 
                type="number" 
                value={newFee.value || ''}
                onChange={(e) => setNewFee({ ...newFee, value: parseFloat(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-4 pr-10 py-2.5 text-sm font-bold focus:border-slate-900 outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">
                {newFee.type === 'percentage' ? '%' : 'đ'}
              </span>
            </div>
          </div>
        </div>

        {/* Targeting: Seller Type */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Áp dụng cho Loại Nhà Bán</label>
          <div className="flex gap-4">
            {['mall', 'normal'].map((type) => {
              const isSelected = newFee.applyTo?.sellerTypes.includes(type as any);
              return (
                <div 
                  key={type}
                  onClick={() => {
                    const current = newFee.applyTo?.sellerTypes || [];
                    const next = isSelected ? current.filter(t => t !== type) : [...current, type as any];
                    setNewFee({ ...newFee, applyTo: { ...newFee.applyTo!, sellerTypes: next } });
                  }}
                  className={cn(
                    "flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3",
                    isSelected ? "border-slate-900 bg-slate-100/50" : "border-slate-300 bg-white hover:border-slate-400"
                  )}
                >
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", isSelected ? "border-slate-900 bg-slate-900" : "border-slate-400")}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={cn("text-xs font-bold", isSelected ? "text-orange-800" : "text-slate-700")}>
                    {type === 'mall' ? 'Shop Mall' : 'Seller thường'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Targeting: Categories */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Ngành hàng áp dụng</label>
            <button 
              onClick={() => setNewFee({ ...newFee, applyTo: { ...newFee.applyTo!, categories: ['all'] } })}
              className="text-[10px] font-bold text-blue-600 hover:underline"
            >
              Tất cả ngành
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categoryFees.map(cat => {
              const isAll = newFee.applyTo?.categories.includes('all');
              const isSelected = isAll || newFee.applyTo?.categories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  disabled={isAll && newFee.applyTo?.categories.length === 1}
                  onClick={() => {
                    let next;
                    if (isAll) {
                      next = [cat.id];
                    } else {
                      const current = newFee.applyTo?.categories || [];
                      next = isSelected ? current.filter(id => id !== cat.id) : [...current, cat.id];
                      if (next.length === 0) next = ['all'];
                    }
                    setNewFee({ ...newFee, applyTo: { ...newFee.applyTo!, categories: next } });
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all",
                    isSelected ? "bg-primary-600 border-primary-600 text-white shadow-sm" : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"
                  )}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Mô tả (Ghi chú)</label>
          <textarea 
            rows={2}
            value={newFee.description || ''}
            onChange={(e) => setNewFee({ ...newFee, description: e.target.value })}
            placeholder="Ghi chú về ý nghĩa loại phí này..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:border-slate-900 outline-none resize-none"
          />
        </div>
      </div>
    </Modal>
  )}

  `;

  content = beforeJobTitle + newJobAndFeeModals + afterPageEditor;
  console.log("Job Title & Fee Modals replaced");
}

fs.writeFileSync(path, content);
console.log("Saved Settings.tsx successfully.");
