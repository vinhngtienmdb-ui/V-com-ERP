const fs = require('fs');
const glob = require('glob');

const files = require('child_process').execSync('find src/components -name "*.tsx"').toString().split(String.fromCharCode(10)).filter(Boolean);

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
     // match bg-COLOR-XXX text-COLOR-XXX where XXX are near
     const match = line.match(/bg-([a-z]+)-([1-9]00).*text-\1-([1-9]00)/);
     if (match) {
        const bgWeight = parseInt(match[2]);
        const textWeight = parseInt(match[3]);
        if (Math.abs(bgWeight - textWeight) < 400) {
           console.log(`${file}:${i+1} : ${line.trim()}`);
        }
     }
     
     const match2 = line.match(/text-([a-z]+)-([1-9]00).*bg-\1-([1-9]00)/);
     if (match2) {
        const textWeight = parseInt(match2[2]);
        const bgWeight = parseInt(match2[3]);
        if (Math.abs(bgWeight - textWeight) < 400) {
           console.log(`${file}:${i+1} : ${line.trim()}`);
        }
     }
  });
}
