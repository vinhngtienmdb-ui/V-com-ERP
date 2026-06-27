const fs = require('fs');
const path = 'src/components/Settings.tsx';
const content = fs.readFileSync(path, 'utf8');

const feeModalStart = content.indexOf('{/* Fee Management Modal */}');
const pageEditorStart = content.indexOf('{/* Page Editor Modal */}');

if (feeModalStart !== -1 && pageEditorStart !== -1) {
  const before = content.substring(0, feeModalStart);
  const after = content.substring(pageEditorStart);

  const feeModalReplacement = `{\/* Fee Management Modal *\/}
  {showFeeModal && (
    <Modal
      title={editingFee ? 'Chỉnh sửa loại phí' : 'Thêm loại phí mới'}
      icon={<BadgeDollarSign className="w-5 h-5 text-blue-600" />}
      isOpen={showFeeModal}
      maxWidth="lg"
      onClose={() => setShowFeeModal(false)}
      onConfirm={() => {
        if (editingFee) {
          setSystemFees(systemFees.map(f => f.id === editingFee.id ? { ...newFee, id: f.id } : f));
          logAction('Settings.Fees', 'UPDATE', \`Cập nhật loại phí: \${newFee.name}\`);
        } else {
          setSystemFees([...systemFees, { ...newFee, id: \`sys-\${Date.now()}\`, isActive: true }]);
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
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:border-slate-900 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Loại phí</label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setNewFee({ ...newFee, type: 'percentage' })}
                className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", newFee.type === 'percentage' ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800")}
              >
                Phần trăm (%)
              </button>
              <button 
                onClick={() => setNewFee({ ...newFee, type: 'fixed' })}
                className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", newFee.type === 'fixed' ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800")}
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
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold focus:border-slate-900 outline-none"
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
              const isSelected = newFee.applyTo?.sellerTypes.includes(type);
              return (
                <div 
                  key={type}
                  onClick={() => {
                    const current = newFee.applyTo?.sellerTypes || [];
                    const next = isSelected ? current.filter(t => t !== type) : [...current, type];
                    setNewFee({ ...newFee, applyTo: { ...newFee.applyTo, sellerTypes: next } });
                  }}
                  className={cn(
                    "flex-1 p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3",
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
              onClick={() => setNewFee({ ...newFee, applyTo: { ...newFee.applyTo, categories: ['all'] } })}
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
                    setNewFee({ ...newFee, applyTo: { ...newFee.applyTo, categories: next } });
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
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:border-slate-900 outline-none resize-none"
          />
        </div>
      </div>
    </Modal>
  )}

  `;

  fs.writeFileSync(path, before + feeModalReplacement + after);
  console.log('Fee Modal successfully replaced.');
} else {
  console.error('Could not find markers');
}
