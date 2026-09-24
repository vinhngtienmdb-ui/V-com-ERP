import fs from 'fs';
let code = fs.readFileSync('src/components/RequestHub.tsx', 'utf-8');

// 1. New Request Modal
code = code.replace(
  /<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900\/50 backdrop-blur-sm">/,
  '<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>'
);
code = code.replace(
  /<div className="bg-white rounded-xl shadow-sm w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95">/,
  '<div className="bg-white rounded-xl shadow-sm w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>'
);

// 2. Slide Over Modal
code = code.replace(
  /<div className="fixed inset-0 z-\[60\] flex justify-end bg-slate-900\/50 backdrop-blur-sm">/,
  '<div className="fixed inset-0 z-[60] flex justify-end bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedRequestForView(null)}>'
);
code = code.replace(
  /className="w-full max-w-3xl bg-white shadow-2xl h-full overflow-y-auto flex flex-col border-l border-emerald-200"\s*>/,
  'className="w-full max-w-3xl bg-white shadow-2xl h-full overflow-y-auto flex flex-col border-l border-emerald-200" onClick={(e) => e.stopPropagation()}>'
);

// 3. Digital Signature Modal
code = code.replace(
  /<div className="fixed inset-0 z-\[100\] flex items-center justify-center p-8 bg-slate-900\/60 backdrop-blur-md">/,
  '<div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-md" onClick={() => setSigningRequestId(null)}>'
);
code = code.replace(
  /className="bg-white rounded-xl w-full max-w-2xl shadow-sm overflow-hidden flex flex-col max-h-\[90vh\]"\s*>/,
  'className="bg-white rounded-xl w-full max-w-2xl shadow-sm overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>'
);

// 4. Print Modal
code = code.replace(
  /<div className="fixed inset-0 z-\[110\] flex items-center justify-center p-4 bg-slate-900\/40 backdrop-blur-sm overflow-y-auto">/,
  '<div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto" onClick={() => setShowPrintModal(false)}>'
);
code = code.replace(
  /className="bg-white rounded-none shadow-sm w-\[210mm\] min-h-\[297mm\] mx-auto p-\[20mm\] relative"\s*id="a4-print-document"\s*>/,
  'className="bg-white rounded-none shadow-sm w-[210mm] min-h-[297mm] mx-auto p-[20mm] relative" id="a4-print-document" onClick={(e) => e.stopPropagation()}>'
);

fs.writeFileSync('src/components/RequestHub.tsx', code);
