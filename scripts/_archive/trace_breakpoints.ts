import * as fs from 'fs';
import * as path from 'path';

const settingsPath = path.join(process.cwd(), 'src/components/Settings.tsx');
const content = fs.readFileSync(settingsPath, 'utf8');

const lines = content.split('\n');

let curlies = 0;
let parens = 0;

for (let i = 0; i < lines.length; i++) {
  const lineText = lines[i];
  
  for (let c = 0; c < lineText.length; c++) {
    const char = lineText[c];
    if (char === '{') curlies++;
    if (char === '}') curlies--;
    if (char === '(') parens++;
    if (char === ')') parens--;
  }
  
  // Log specific tab endings or significant blocks
  if (lineText.includes("activeTab === 'general'") && lineText.includes('&& (')) {
    console.log(`Line ${i + 1} (general start) - Curlies: ${curlies}, Parens: ${parens}`);
  }
  if (lineText.includes("activeTab === 'fees'") && lineText.includes('&& (')) {
    console.log(`Line ${i + 1} (fees start) - Curlies: ${curlies}, Parens: ${parens}`);
  }
  if (lineText.includes("activeTab === 'api'") && lineText.includes('&& (')) {
    console.log(`Line ${i + 1} (api start) - Curlies: ${curlies}, Parens: ${parens}`);
  }
  if (lineText.includes("activeTab === 'inventory'") && lineText.includes('&& (')) {
    console.log(`Line ${i + 1} (inventory start) - Curlies: ${curlies}, Parens: ${parens}`);
  }
  if (lineText.includes("activeTab === 'saas_subscription'") && lineText.includes('&& (')) {
    console.log(`Line ${i + 1} (saas start) - Curlies: ${curlies}, Parens: ${parens}`);
  }
}
