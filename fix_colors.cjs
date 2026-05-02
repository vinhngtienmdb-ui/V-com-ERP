const fs = require('fs');

const files = [
  'src/components/AIOperations.tsx',
  'src/components/CustomerService.tsx',
  'src/components/HR.tsx',
  'src/components/PIM.tsx',
  'src/components/Performance.tsx',
  'src/components/Sales.tsx',
  'src/components/Wallet.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Gradient fixes
    content = content.replace(/bg-white from-\[#1E293B\] to-\[#0F172A\]/g, 'bg-gradient-to-br from-[#1E293B] to-[#0F172A]');
    content = content.replace(/bg-white from-\[#2563EB\] to-\[#1E40AF\]/g, 'bg-gradient-to-br from-[#2563EB] to-[#1E40AF]');
    content = content.replace(/bg-white from-\[#2563EB\] to-\[#1D4ED8\]/g, 'bg-gradient-to-br from-[#2563EB] to-[#1D4ED8]');
    
    // Plain bg-white to bg-slate-900 when used with text-[#FAF9F5]
    content = content.replace(/bg-white(.*?text-\[#FAF9F5\])/g, 'bg-slate-900$1');
    content = content.replace(/(text-\[#FAF9F5\].*?)bg-white/g, '$1bg-slate-900');

    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
