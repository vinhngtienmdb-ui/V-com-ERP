import * as fs from 'fs';
import * as path from 'path';

const settingsPath = path.join(process.cwd(), 'src/components/Settings.tsx');
const saasLayoutPath = path.join(process.cwd(), 'saas_layout.txt');

if (!fs.existsSync(settingsPath)) {
  console.error('Settings.tsx does not exist.');
  process.exit(1);
}

if (!fs.existsSync(saasLayoutPath)) {
  console.error('saas_layout.txt does not exist.');
  process.exit(1);
}

let content = fs.readFileSync(settingsPath, 'utf8');
const saasLayout = fs.readFileSync(saasLayoutPath, 'utf8');

// We find the index of "{activeTab === 'inventory' && ("
const searchStart = "{activeTab === 'inventory' && (";
const startIndex = content.indexOf(searchStart);

// We find the index of "{showAddJobTitleModal && ("
const searchEnd = "{showAddJobTitleModal && (";
const endIndex = content.indexOf(searchEnd);

if (startIndex !== -1 && endIndex !== -1) {
  console.log(`Found startIndex: ${startIndex}, endIndex: ${endIndex}`);

  // Reconstruct correct inventory block
  const correctInventoryBlock = `  {activeTab === 'inventory' && (
    <div className="animate-in fade-in duration-300 space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" /> Phân loại & Cấu hình Hàng hóa
        </h3>
        <p className="text-sm text-slate-600 mb-4">Quản lý các loại mặt hàng, định mức dự trữ, đơn vị tính, và các thuộc tính lưu kho (SKU/Barcode).</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-slate-900">Danh mục Nhóm Hàng hóa</h4>
              <button className="text-xs text-blue-600 font-bold hover:underline">+ Thêm nhóm</button>
            </div>
            <div className="space-y-2">
              {['Nguyên vật liệu (Raw Materials)', 'Thành phẩm (Finished Goods)', 'Bán thành phẩm (WIP)', 'Hàng hóa thương mại (Trading Goods)'].map((type, i) => (
                <div key={i} className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-2xl">
                  <span className="text-sm font-medium">{type}</span>
                  <button className="text-slate-500 hover:text-slate-700"><Edit2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <h4 className="font-bold text-slate-950 mb-4">Phương pháp Quản lý Kho</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/50">
                <input type="radio" name="inventory_method" className="w-4 h-4 text-blue-600" defaultChecked />
                <span className="text-sm font-medium">Bình quan gia quyền (Weighted Average)</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/50">
                <input type="radio" name="inventory_method" className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Nhập trước xuất trước (FIFO)</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}\n\n`;

  // Merge them with outer layout closing tags closed BEFORE tail
  const head = content.substring(0, startIndex);
  const tail = content.substring(endIndex);

  const repairedSection = head + correctInventoryBlock + saasLayout + '\n\n  </div>\n  </div>\n\n  ' + tail;
  
  fs.writeFileSync(settingsPath, repairedSection, 'utf8');
  console.log('✓ Replaced intermediate segment and restored closing div tags perfectly!');
} else {
  console.error(`✘ Failed to locate start or end boundary in Settings.tsx. Start: ${startIndex}, End: ${endIndex}`);
}
