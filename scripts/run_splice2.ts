import fs from 'fs';
let lines = fs.readFileSync('src/components/ContractManager.tsx', 'utf-8').split('\n');

// Clean up lines 255 to 264
lines.splice(254, 10); // remove from line index 254 (which is line 255)

fs.writeFileSync('src/components/ContractManager.tsx', lines.join('\n'));
