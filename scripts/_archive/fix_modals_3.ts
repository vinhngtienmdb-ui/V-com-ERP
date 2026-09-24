import fs from 'fs';
let code = fs.readFileSync('src/components/SignatureHub.tsx', 'utf-8');

code = code.replace(
  /<div className="fixed inset-0 z-\[60\] flex items-center justify-center bg-slate-900\/60 backdrop-blur-sm animate-in fade-in">/,
  '<div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSigningModalOpen(false)}>'
);

code = code.replace(
  /<div className="bg-white rounded-xl shadow-sm w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">/,
  '<div className="bg-white rounded-xl shadow-sm w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>'
);

fs.writeFileSync('src/components/SignatureHub.tsx', code);
