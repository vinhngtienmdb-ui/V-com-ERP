import * as fs from 'fs';
import * as path from 'path';

const settingsPath = path.join(process.cwd(), 'src/components/Settings.tsx');
const content = fs.readFileSync(settingsPath, 'utf8');

const lines = content.split('\n');
console.log('--- Tracing inventory block from line 2190 to 2235 ---');

let curlies = 0;
let parens = 0;

for (let i = 2189; i < 2233; i++) {
  if (lines[i] === undefined) continue;
  const lineText = lines[i];
  
  for (let c = 0; c < lineText.length; c++) {
    const char = lineText[c];
    if (char === '{') curlies++;
    if (char === '}') curlies--;
    if (char === '(') parens++;
    if (char === ')') parens--;
  }
  console.log(`Line ${i + 1} (${curlies} curlies, ${parens} parens): ${JSON.stringify(lineText)}`);
}
