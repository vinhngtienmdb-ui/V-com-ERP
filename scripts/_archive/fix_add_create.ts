import fs from 'fs';
let code = fs.readFileSync('src/components/ContractManager.tsx', 'utf-8');

// remove the trailing piece I mistakenly added if there's any
const check = code.indexOf('{showCreateModal &&');
if (check !== -1) {
    code = code.substring(0, check);
}

const createModal = ` {showCreateModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
 <div className="bg-white rounded-xl shadow-sm w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
 <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
 <h3 className="text-lg font-bold text-slate-900">Tạo hợp đồng mới</h3>
 <button onClick={() => setShowCreateModal(false)} className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors">
 <X className="w-5 h-5" />
 </button>
 </div>
 <div className="p-6 space-y-4">
 <div>
 <label className="block text-sm font-bold text-slate-800 mb-2">Tiêu đề hợp đồng</label>
 <input type="text" placeholder="Nhập tiêu đề..." className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" />
 </div>
 <div className="grid grid-cols-2 gap-4">
   <div>
   <label className="block text-sm font-bold text-slate-800 mb-2">Đối tác / Nhân sự</label>
   <input type="text" placeholder="Tên bên B..." className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" />
   </div>
   <div>
   <label className="block text-sm font-bold text-slate-800 mb-2">Giá trị dự kiến</label>
   <input type="text" placeholder="VD: 50,000,000 ₫" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" />
   </div>
 </div>
 <div>
  <label className="block text-sm font-bold text-slate-800 mb-2">Đính kèm dự thảo (docx, xlsx, pdf...)</label>
  <div className="border-2 border-dashed border-slate-300 p-8 rounded-xl flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
    <div className="bg-white p-3 rounded-full shadow-sm border border-slate-200 group-hover:scale-110 transition-transform mb-3">
      <File className="w-6 h-6 text-primary-600" />
    </div>
    <p className="text-sm font-bold text-slate-700">Kéo thả hoặc bấm để chọn tệp</p>
    <p className="text-xs text-slate-500 mt-1">Hỗ trợ PDF, DOCX, XLSX, PPTX (Tối đa 20MB)</p>
  </div>
 </div>
 </div>
 <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
 <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors">Hủy</button>
 <button onClick={() => { alert('Tạo hợp đồng thành công!'); setShowCreateModal(false); }} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 transition-colors">Tạo & Trình duyệt</button>
 </div>
 </div>
 </div>
 )}`;

// Inject at the end of the root div inside ContractManager
code = code.replace(/<\/div>\n\s*<\/div>\n\s*\);\n\}/, `  ${createModal}\n  </div>\n  );\n}`);

fs.writeFileSync('src/components/ContractManager.tsx', code);
