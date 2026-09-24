import * as fs from 'fs';
import * as path from 'path';

const saasLayoutPath = path.join(process.cwd(), 'saas_layout.txt');
const text = fs.readFileSync(saasLayoutPath, 'utf8');

const lines = text.split('\n');
let opened = 0;
let closed = 0;

for (let i = 0; i < lines.length; i++) {
  const lineText = lines[i];
  if (lineText.trim().startsWith('//')) continue;
  
  for (let c = 0; c < lineText.length; c++) {
    const char = lineText[c];
    if (char === '(') opened++;
    if (char === ')') closed++;
  }
}

console.log(`Parentheses stat - Opened: ${opened}, Closed: ${closed}`);
if (opened !== closed) {
  console.log(`Mismatch count: ${opened - closed}`);
} else {
  console.log('✓ Parentheses are perfectly balanced!');
}
