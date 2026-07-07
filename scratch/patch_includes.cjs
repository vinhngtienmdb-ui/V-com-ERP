const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let patchCount = 0;

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;

    // Patch .includes()
    newContent = newContent.replace(/([a-zA-Z0-9_.[\]]+)\?\.(toLowerCase|toUpperCase)\(\)\.includes\(/g, "($1?.$2() || '').includes(");
    
    // Patch .startsWith() just in case
    newContent = newContent.replace(/([a-zA-Z0-9_.[\]]+)\?\.(toLowerCase|toUpperCase)\(\)\.startsWith\(/g, "($1?.$2() || '').startsWith(");

    // Patch .endsWith() just in case
    newContent = newContent.replace(/([a-zA-Z0-9_.[\]]+)\?\.(toLowerCase|toUpperCase)\(\)\.endsWith\(/g, "($1?.$2() || '').endsWith(");

    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      patchCount++;
      console.log('Patched:', filePath);
    }
  }
});

console.log('Total files patched:', patchCount);
