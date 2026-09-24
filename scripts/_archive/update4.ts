import fs from 'fs';
let code = fs.readFileSync('src/components/RequestHub.tsx', 'utf-8');

// The place where the signature is printed
const oldSignatureSlot = ` {selectedRequestForPrint.signatureStatus === 'signed' ? (
 <div className="relative flex flex-col items-center gap-1 p-2 text-center scale-90">
 <div className="text-orange-800 font-bold text-[8px] uppercase tracking-tighter border-2 border-blue-700 px-2 py-1 bg-slate-100/50">
 CERTIFICATE OK<br/>
 <span className="text-[10px] uppercase">{selectedRequestForPrint.signedBy}</span>
 </div>
 <p className="text-[7px] text-blue-600 font-mono font-bold">{selectedRequestForPrint.signedAt}</p>
 </div>
 ) : (`;

const newSignatureSlot = ` {selectedRequestForPrint.signatureStatus === 'signed' ? (
  selectedRequestForPrint.caProvider === 'PERSONAL IMAGE' ? (
    <div className="relative flex flex-col items-center gap-1 p-2 text-center">
      <div className="text-blue-800 font-cursive text-xl opacity-80 -rotate-3 mb-1">
        {selectedRequestForPrint.signedBy}
      </div>
      <p className="text-[7px] text-slate-500 font-mono font-bold">{selectedRequestForPrint.signedAt}</p>
    </div>
  ) : (
    <div className="relative flex flex-col items-center gap-1 p-2 text-center scale-90">
      <div className="text-orange-800 font-bold text-[8px] uppercase tracking-tighter border-2 border-blue-700 px-2 py-1 bg-slate-100/50">
        CERTIFICATE: {selectedRequestForPrint.caProvider}<br/>
        <span className="text-[10px] uppercase">{selectedRequestForPrint.signedBy}</span>
      </div>
      <p className="text-[7px] text-blue-600 font-mono font-bold">{selectedRequestForPrint.signedAt}</p>
    </div>
  )
 ) : (`;

code = code.replace(oldSignatureSlot, newSignatureSlot);

fs.writeFileSync('src/components/RequestHub.tsx', code);
