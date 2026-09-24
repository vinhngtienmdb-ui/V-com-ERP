import fs from 'fs';
let code = fs.readFileSync('src/components/Settings.tsx', 'utf-8');

code = code.replace(
    /\`w-3 h-3 rounded-full bg-\\\$\{wallet\.color\}-500\`/g,
    'cn("w-3 h-3 rounded-full", wallet.color === "emerald" ? "bg-emerald-500" : wallet.color === "blue" ? "bg-blue-500" : wallet.color === "indigo" ? "bg-indigo-500" : "bg-slate-500")'
);
// fallback search if the regex didn't match
code = code.replace(
    /className=\{\`w-3 h-3 rounded-full bg-\\\$\{wallet.color\}-500\`\}/g,
    'className={cn("w-3 h-3 rounded-full", wallet.color === "emerald" ? "bg-emerald-500" : wallet.color === "blue" ? "bg-blue-500" : wallet.color === "indigo" ? "bg-indigo-500" : "bg-slate-500")}'
);

fs.writeFileSync('src/components/Settings.tsx', code);
