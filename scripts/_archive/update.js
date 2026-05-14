const fs = require('fs');
let code = fs.readFileSync('src/components/RequestHub.tsx', 'utf-8');
code = code.replace(/doc\.status === 'pending' \? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"/, "doc.status === 'revoked' ? 'bg-slate-100 text-slate-500' : doc.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'");
code = code.replace(/\{doc\.status === 'rejected' && <AlertCircle className="w-3 h-3" \/>\}/, "{doc.status === 'rejected' && <AlertCircle className=\"w-3 h-3\" />}\n  {doc.status === 'revoked' && <X className=\"w-3 h-3\" />}");
code = code.replace(/doc\.status === 'approved' \? 'Đã duyệt' : doc\.status === 'pending' \? 'Chờ duyệt' : 'Từ chối'/, "doc.status === 'approved' ? 'Đã duyệt' : doc.status === 'revoked' ? 'Đã thu hồi' : doc.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'");
fs.writeFileSync('src/components/RequestHub.tsx', code);
