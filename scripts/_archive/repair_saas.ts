import * as fs from 'fs';
import * as path from 'path';

const settingsPath = path.join(process.cwd(), 'src/components/Settings.tsx');
let content = fs.readFileSync(settingsPath, 'utf8');

// 1. Repair FileText import
if (!content.includes('FileText')) {
  content = content.replace('Link2\n}', 'Link2, FileText\n}');
  // Alternative match if whitespaces differ
  content = content.replace('Link2', 'Link2, FileText');
  console.log('✓ FileText successfully added to lucide imports.');
}

// 2. Repair inventory loop and nesting
const badSegment = `\t{['Nguyên vật liệu (Raw Materials)', 'Thành phẩm (Finished Goods)', 'Bán thành phẩm (WIP)', 'Hàng hóa thương mại (Trading Goods)'].map((type, i) => (
\t<div key={i} className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-2xl">
\t<span className="text-sm font-medium">{type}</span>
\t<button className="text-slate-500 hover:text-slate-700"><Edit2 className="w-4 h-4" /></button>
\t</div>
\t))}
\t{activeTab === 'saas_subscription' && (`;

const goodSegment = `\t{['Nguyên vật liệu (Raw Materials)', 'Thành phẩm (Finished Goods)', 'Bán thành phẩm (WIP)', 'Hàng hóa thương mại (Trading Goods)'].map((type, i) => (
\t<div key={i} className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-2xl">
\t<span className="text-sm font-medium">{type}</span>
\t<button className="text-slate-500 hover:text-slate-700"><Edit2 className="w-4 h-4" /></button>
\t</div>
\t))}
\t</div>
\t</div>

\t<div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
\t<h4 className="font-bold text-slate-900 mb-4">Phương pháp Quản lý Kho</h4>
\t<div className="space-y-3">
\t<label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/50">
\t<input type="radio" name="inventory_method" className="w-4 h-4 text-blue-600" defaultChecked />
\t<span className="text-sm font-medium">Bình quân gia quyền (Weighted Average)</span>
\t</label>
\t<label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/50">
\t<input type="radio" name="inventory_method" className="w-4 h-4 text-blue-600" />
\t<span className="text-sm font-medium">Nhập trước xuất trước (FIFO)</span>
\t</label>
\t</div>
\t</div>
\t</div>
\t</div>
\t</div>
\t)}

\t{activeTab === 'saas_subscription' && (`;

if (content.includes("['Nguyên vật liệu (Raw Materials)'") || content.includes('inventory_method')) {
  // Let's use robust search and replace
  // We can target the part where saas_subscription directly follows the closing map parenthesis
  const targetPattern = /"Hàng hóa thương mại\s*\(Trading Goods\)"\s*\]\.map[\s\S]*?\)\s*\)\s*\}\s*\{\s*activeTab\s*===\s*'saas_subscription'/;
  
  const found = content.match(targetPattern);
  if (found) {
    const originalBlock = found[0];
    const repairedBlock = originalBlock.replace("activeTab === 'saas_subscription'", 
      `</div>\n\t</div>\n\n\t<div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">\n\t<h4 className="font-bold text-slate-900 mb-4">Phương pháp Quản lý Kho</h4>\n\t<div className="space-y-3">\n\t<label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/50">\n\t<input type="radio" name="inventory_method" className="w-4 h-4 text-blue-600" defaultChecked />\n\t<span className="text-sm font-medium">Bình quân gia quyền (Weighted Average)</span>\n\t</label>\n\t<label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/50">\n\t<input type="radio" name="inventory_method" className="w-4 h-4 text-blue-600" />\n\t<span className="text-sm font-medium">Nhập trước xuất trước (FIFO)</span>\n\t</label>\n\t</div>\n\t</div>\n\t</div>\n\t</div>\n\t</div>\n\t)}\n\n\t{activeTab === 'saas_subscription'`
    );
    content = content.replace(originalBlock, repairedBlock);
    console.log('✓ Successfully repaired inventory block and SaaS layout separation.');
  } else {
    // Try simple split repair
    let badIndex = content.indexOf(`{activeTab === 'saas_subscription' && (`);
    if (badIndex !== -1) {
      // Let's find the closing map before it
      const beforeStr = content.substring(0, badIndex);
      const afterStr = content.substring(badIndex);
      
      const lastMapCloseIndex = beforeStr.lastIndexOf('))}');
      if (lastMapCloseIndex !== -1 && lastMapCloseIndex > beforeStr.lastIndexOf("activeTab === 'inventory'")) {
        const insertionPoint = lastMapCloseIndex + 3;
        const head = beforeStr.substring(0, insertionPoint);
        const middle = `\n\t</div>\n\t</div>\n\n\t<div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">\n\t<h4 className="font-bold text-slate-900 mb-4">Phương pháp Quản lý Kho</h4>\n\t<div className="space-y-3">\n\t<label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/50">\n\t<input type="radio" name="inventory_method" className="w-4 h-4 text-blue-600" defaultChecked />\n\t<span className="text-sm font-medium">Bình quân gia quyền (Weighted Average)</span>\n\t</label>\n\t<label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/50">\n\t<input type="radio" name="inventory_method" className="w-4 h-4 text-blue-600" />\n\t<span className="text-sm font-medium">Nhập trước xuất trước (FIFO)</span>\n\t</label>\n\t</div>\n\t</div>\n\t</div>\n\t</div>\n\t</div>\n\t)}`;
        const tail = beforeStr.substring(insertionPoint) + afterStr;
        content = head + middle + tail;
        console.log('✓ Repaired via fall-back map split insertion.');
      }
    }
  }
}

fs.writeFileSync(settingsPath, content, 'utf8');
console.log('✓ Repair completed.');
