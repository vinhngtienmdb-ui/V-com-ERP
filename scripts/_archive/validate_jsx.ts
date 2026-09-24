import * as fs from 'fs';
import * as path from 'path';

const saasLayoutPath = path.join(process.cwd(), 'saas_layout.txt');
const text = fs.readFileSync(saasLayoutPath, 'utf8');

// Simple tag balance checker
let openDivs = 0;
let closeDivs = 0;

const regex = /<div|<\/div>/g;
let match;
while ((match = regex.exec(text)) !== null) {
  if (match[0] === '<div') {
    openDivs++;
  } else {
    closeDivs++;
  }
}

console.log(`saas_layout.txt divs stat - Open: ${openDivs}, Close: ${closeDivs}`);
if (openDivs !== closeDivs) {
  console.log('✘ Mismatched divs in saas_layout.txt!');
} else {
  console.log('✓ Divs in saas_layout.txt are perfectly balanced!');
}
