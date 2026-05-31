import * as fs from 'fs';
import * as path from 'path';

const settingsPath = path.join(process.cwd(), 'src/components/Settings.tsx');
const content = fs.readFileSync(settingsPath, 'utf8');

const lines = content.split('\n');
console.log('Total lines:', lines.length);

for (let i = lines.length - 25; i < lines.length; i++) {
  if (lines[i] !== undefined) {
    console.log(`Line ${i + 1}: ${JSON.stringify(lines[i])}`);
  }
}
