const fs = require('fs');
const path = require('path');

function replacePadding(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  content = content.replace(/\bp-8\b/g, 'p-6');
  content = content.replace(/\bp-10\b/g, 'p-8');
  content = content.replace(/\bp-12\b/g, 'p-8');
  if (content !== original) {
    fs.writeFileSync(filePath, content);
  }
}

replacePadding('src/components/Home.tsx');
replacePadding('src/components/Dashboard.tsx');
replacePadding('src/components/Settings.tsx');
replacePadding('src/components/HR.tsx');
