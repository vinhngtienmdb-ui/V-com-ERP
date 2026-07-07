const fs = require('fs');
let content = fs.readFileSync('src/components/CustomerService.tsx', 'utf8');

// Find the simulateNewTicket button and remove it
content = content.replace(/<div className="ml-auto flex items-center gap-2 max-sm:w-full max-sm:justify-between">[\s\S]*?<span className="text-\[11px\] font-mono font-bold text-slate-500">Đăng ký tự động:<\/span>[\s\S]*?<\/button>\s*<\/div>/g, "");

fs.writeFileSync('src/components/CustomerService.tsx', content, 'utf8');
console.log('Button removed');
