import fs from 'fs';
let code = fs.readFileSync('src/components/SignatureHub.tsx', 'utf-8');

code = code.replace(/px-6 py-4/g, 'px-4 py-3')
           .replace(/px-6 py-3/g, 'px-4 py-2')
           .replace(/text-sm font-bold/g, 'text-[13px] font-bold')
           .replace(/text-sm font-medium/g, 'text-[13px] font-medium')
           .replace(/text-sm text-slate/g, 'text-xs text-slate')
           .replace(/text-\[11px\]/g, 'text-[10px]');

fs.writeFileSync('src/components/SignatureHub.tsx', code);
