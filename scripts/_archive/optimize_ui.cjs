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

    // Remove empty translations left behind
    content = content.replace(/hover:-translate-y-0/g, '');
    
    // Convert shadow-md to shadow-sm globally to make it cleaner ("thoáng hơn")
    content = content.replace(/shadow-md/g, 'shadow-sm');
    content = content.replace(/shadow-lg/g, 'shadow-sm');

    // Reduce group-hover scale effect if it causes "vibration" or "floating"
    content = content.replace(/group-hover:scale-1\d{2}/g, '');
    content = content.replace(/hover:scale-1\d{2}/g, '');

    if (content !== originalContent) {
      fs.writeFileSync(file, content);
      modifiedFiles++;
    }
  });

  console.log(`Optimization pass 2 complete. Modified ${modifiedFiles} files.`);
} catch (e) {
  console.error("Error running optimization:", e);
}
