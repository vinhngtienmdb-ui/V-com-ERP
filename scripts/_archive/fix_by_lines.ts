import * as fs from 'fs';
import * as path from 'path';

const settingsPath = path.join(process.cwd(), 'src/components/Settings.tsx');
let content = fs.readFileSync(settingsPath, 'utf8');

const lines = content.split('\n');
console.log('Searching lines with "}))}"...');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('}))}')) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
  }
}
