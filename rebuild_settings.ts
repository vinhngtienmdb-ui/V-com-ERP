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

// Find head boundary
const inventoryHeading = "  {activeTab === 'inventory' && (";
const startIndex = content.indexOf(inventoryHeading);

// Find tail boundary
const modalHeading = "  {showAddJobTitleModal && (";
const endIndex = content.indexOf(modalHeading);

if (startIndex === -1) {
  console.error('Cannot find activeTab === inventory starting statement.');
  process.exit(1);
}

if (endIndex === -1) {
  console.error('Cannot find showAddJobTitleModal starting statement.');
  process.exit(1);
}

console.log(`Indices found - Start: ${startIndex}, End: ${endIndex}`);

// 1. Rebuild clean inventory block
const cleanInventoryBlock = `  {activeTab === 'inventory' && (
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
  )}`;

// Sub-components wrapper closing tags for layout (since they were opened in head)
const mainWrappersClosing = `\n\n  </div>\n  </div>\n\n`;

const head = content.substring(0, startIndex);
let tail = content.substring(endIndex);

// 2. Ensure FileText import is present in head
if (!head.includes('FileText')) {
  console.log('Adding FileText to lucide-react imports...');
  // Find a reliable spot inside lucide-react imports:
  let updatedHead = head.replace('Link2', 'Link2,\n  FileText');
  
  // If Link2 replace fell back, let's inject check
  if (updatedHead === head) {
    updatedHead = head.replace("import { Wallet , Save } from 'lucide-react';", "import { Wallet , Save, FileText } from 'lucide-react';");
  }
  fs.writeFileSync(settingsPath, updatedHead + cleanInventoryBlock + '\n\n' + saasLayout + mainWrappersClosing + tail, 'utf8');
} else {
  fs.writeFileSync(settingsPath, head + cleanInventoryBlock + '\n\n' + saasLayout + mainWrappersClosing + tail, 'utf8');
}

console.log('✓ Rebuild successfully completed.');
