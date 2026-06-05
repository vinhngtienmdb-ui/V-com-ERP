import fs from 'fs';
let omni = fs.readFileSync('src/components/OmniChat.tsx', 'utf-8');
omni = omni.replace('scrollỗeight', 'scrollHeight');
fs.writeFileSync('src/components/OmniChat.tsx', omni);
