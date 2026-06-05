import fs from 'fs';
let code = fs.readFileSync('src/components/FormConfigModal.tsx', 'utf-8');

code = code.replace(
  /<div className="fixed inset-0 z-\[100\] flex items-center justify-center p-4 bg-slate-900\/60 backdrop-blur-sm animate-in fade-in">/,
  '<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>'
);

code = code.replace(
  /<div className="bg-\[#F8F9FA\] rounded-xl w-full max-w-4xl h-\[85vh\] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">/,
  '<div className="bg-[#F8F9FA] rounded-xl w-full max-w-4xl h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>'
);

fs.writeFileSync('src/components/FormConfigModal.tsx', code);
