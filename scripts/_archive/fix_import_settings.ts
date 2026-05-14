import fs from 'fs';

let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');
code = code.replace("  Check\n} from 'lucide-react';", "  Check,\n  Wallet\n} from 'lucide-react';");
fs.writeFileSync('src/components/Settings.tsx', code);
console.log('Fixed import');
