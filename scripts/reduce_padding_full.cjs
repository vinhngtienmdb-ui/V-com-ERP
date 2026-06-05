const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

try {
  let modifiedFiles = 0;

  walkDir('src', function(file) {
    if (!file.match(/\.(tsx|ts|jsx|js|css)$/)) return;
    
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // Very large padding -> 8
    content = content.replace(/\bp-(10|12|14|16)\b/g, 'p-8');
    content = content.replace(/\bpx-(10|12|14|16)\b/g, 'px-8');
    content = content.replace(/\bpy-(10|12|14|16)\b/g, 'py-8');
    content = content.replace(/\bgap-(10|12|16)\b/g, 'gap-8');
    
    // Padding 8 -> 6
    content = content.replace(/\bp-8\b/g, 'p-6');
    content = content.replace(/\bpx-8\b/g, 'px-6');
    content = content.replace(/\bpy-8\b/g, 'py-6');
    content = content.replace(/\bgap-8\b/g, 'gap-6');

    if (content !== originalContent) {
      fs.writeFileSync(file, content);
      modifiedFiles++;
    }
  });

  console.log(`Optimization pass 3 (padding) complete. Modified ${modifiedFiles} files.`);
} catch (e) {
  console.error("Error running optimization:", e);
}
