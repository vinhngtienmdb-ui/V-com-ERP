import fs from 'fs';
let code = fs.readFileSync('src/components/ContractManager.tsx', 'utf-8');

code = code.replace(
  /selectedContract\.status === 'expiring_soon' \? "bg-orange-50 text-blue-600 border border-blue-200" :\n\s*"bg-red-50 text-red-600 border border-red-200"/,
  'selectedContract.status === "expiring_soon" ? "bg-orange-50 text-blue-600 border border-blue-200" :\n              selectedContract.status === "returned" ? "bg-slate-100 text-slate-700 border border-slate-300" : "bg-red-50 text-red-600 border border-red-200"'
);

code = code.replace(
  /\{selectedContract\.status === 'expired' && <AlertCircle className="w-3\.5 h-3\.5" \/>\}/,
  '{selectedContract.status === "expired" || selectedContract.status === "rejected" ? <AlertCircle className="w-3.5 h-3.5" /> : null}\n              {selectedContract.status === "returned" && <CornerDownRight className="w-3.5 h-3.5" />}'
);

code = code.replace(
  /selectedContract\.status === 'expiring_soon' \? 'Sắp hết hạn' : 'Đã hết hạn'/,
  'selectedContract.status === "expiring_soon" ? "Sắp hết hạn" : selectedContract.status === "returned" ? "Bị trả lại" : selectedContract.status === "rejected" ? "Từ chối duyệt" : "Đã hết hạn"'
);

fs.writeFileSync('src/components/ContractManager.tsx', code);
