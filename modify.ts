import fs from 'fs';

let code = fs.readFileSync('src/components/RequestHub.tsx', 'utf8');
const lines = code.split('\n');

const endDivIndex = lines.findIndex((line, index) => 
  line.includes('<div className="px-6 py-4 border-t border-stone-100 bg-stone-50 flex gap-3 justify-end">') &&
  lines[index-1] && lines[index-1].includes('</div>') &&
  lines[index+1] && lines[index+1].includes('setShowAddModal(false)')
);

if (endDivIndex > -1) {
  lines.splice(endDivIndex, 0, `  {/* Workflow Enhancements in Modal */}
  <div className="pt-6 border-t border-stone-100 mt-4">
  <h4 className="text-sm font-bold text-stone-800 mb-4 flex items-center gap-2">
  <UserPlus className="w-4 h-4 text-emerald-600" />
  Tùy chỉnh luồng xử lý
  </h4>
  <div className="space-y-4">
  <label className="flex items-center gap-3 p-3 bg-rose-50/50 border border-rose-100 rounded-lg cursor-pointer hover:bg-rose-50 transition-colors">
  <input 
  type="checkbox"
  checked={newRequest.isUrgent}
  onChange={(e) => setNewRequest({...newRequest, isUrgent: e.target.checked})}
  className="w-4 h-4 text-rose-600 rounded border-stone-300 focus:ring-rose-500"
  />
  <div className="flex gap-2 items-center">
  <AlertTriangle className="w-4 h-4 text-rose-500" />
  <div>
  <p className="text-sm font-bold text-rose-900">Yêu cầu xử lý khẩn cấp</p>
  <p className="text-xs text-rose-600/80">Bỏ qua SLA rườm rà, thông báo ưu tiên trực tiếp tới người phê duyệt.</p>
  </div>
  </div>
  </label>

  <div className="bg-stone-50 rounded-lg border border-stone-200 overflow-hidden">
  <div className="px-4 py-3 border-b border-stone-200 bg-white flex justify-between items-center">
  <p className="text-sm font-bold text-stone-700">Người phê duyệt từng bước</p>
  <button 
  type="button" 
  onClick={() => setNewRequest({...newRequest, customReviewers: [...(newRequest.customReviewers||[]), { step: (newRequest.customReviewers?.length || 0) + 1, reviewer: '' }]})}
  className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
  >
  <Plus className="w-3 h-3" /> Thêm bước
  </button>
  </div>
  <div className="p-4 space-y-3">
  {(newRequest.customReviewers || []).map((reviewer: any, index: number) => (
  <div key={index} className="flex items-center gap-3">
  <div className="w-16 shrink-0 text-xs font-bold text-stone-500 uppercase tracking-widest">
  Bước {reviewer.step}
  </div>
  <select 
  value={reviewer.reviewer}
  onChange={(e) => {
  const newRef = [...(newRequest.customReviewers||[])];
  newRef[index].reviewer = e.target.value;
  setNewRequest({...newRequest, customReviewers: newRef});
  }}
  className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
  required
  >
  <option value="">-- Chọn người phê duyệt --</option>
  <option value="Quản lý trực tiếp">Quản lý trực tiếp</option>
  <option value="Giám đốc Nhân sự">Giám đốc Nhân sự</option>
  <option value="Kế toán trưởng">Kế toán trưởng</option>
  <option value="Giám đốc Điều hành">Giám đốc Điều hành (CEO)</option>
  <option value="Nguyễn Văn A (IT)">Nguyễn Văn A (IT)</option>
  </select>
  {(newRequest.customReviewers || []).length > 1 && (
  <button 
  type="button"
  onClick={() => {
  const newRef = [...(newRequest.customReviewers||[])];
  newRef.splice(index, 1);
  newRef.forEach((r, idx) => r.step = idx + 1);
  setNewRequest({...newRequest, customReviewers: newRef});
  }}
  className="p-2 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
  >
  <Trash2 className="w-4 h-4" />
  </button>
  )}
  </div>
  ))}
  </div>
  </div>
  </div>
  </div>`);

  fs.writeFileSync('src/components/RequestHub.tsx', lines.join('\n'));
  console.log('Successfully modified RequestHub.tsx using splice!');
} else {
  console.log('Target string not found in RequestHub.tsx!');
}
