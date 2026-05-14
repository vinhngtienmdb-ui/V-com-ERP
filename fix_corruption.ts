import fs from 'fs';

// Fix OmniChat
let omni = fs.readFileSync('src/components/OmniChat.tsx', 'utf-8');
omni = omni.replace('olus,', 'Plus,');
omni = omni.replace('ỗTMLDivElement', 'HTMLDivElement');
fs.writeFileSync('src/components/OmniChat.tsx', omni);

// Fix RequestHub
let reqHub = fs.readFileSync('src/components/RequestHub.tsx', 'utf-8');
const linesReq = reqHub.split('\n');
// Let's print out lines around 545
for(let i = 540; i < 550; i++) {
   if (linesReq[i]) console.log(i+1 + ": " + linesReq[i]);
}

// I'll manually check and maybe remove the 'e'.
