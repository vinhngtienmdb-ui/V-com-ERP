import fs from 'fs';
let code = fs.readFileSync('src/components/ContractManager.tsx', 'utf-8');

code = code.replace(/px-6 py-4/g, 'px-4 py-3')
           .replace(/text-sm font-bold text-slate-900/g, 'text-[13px] font-bold text-slate-900')
           .replace(/text-sm font-medium text-slate-900/g, 'text-[13px] font-medium text-slate-900')
           .replace(/text-sm font-bold text-slate-800/g, 'text-[13px] font-bold text-slate-800')
           .replace(/text-\[11px\]/g, 'text-[10px]')
           .replace(/text-\[10px\]/g, 'text-[9px]')
           .replace(/text-sm /g, 'text-xs ');

fs.writeFileSync('src/components/ContractManager.tsx', code);
