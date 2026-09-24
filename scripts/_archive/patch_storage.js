import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir('src', function(file) {
  if (!file.endsWith('.ts') && !file.endsWith('.tsx')) return;
  if (file.includes('storage.ts')) return;
  
  let content = fs.readFileSync(file, 'utf8');
  if (content.match(/\blocalStorage\./)) {
    if (!content.includes('safeLocalStorage')) {
      const depth = file.split('/').length - 2;
      const prefix = depth > 0 ? '../'.repeat(depth) : './';
      content = `import { safeLocalStorage } from '${prefix}lib/storage';\n` + content;
    }
    content = content.replace(/\blocalStorage\./g, 'safeLocalStorage.');
    fs.writeFileSync(file, content);
  }
});
