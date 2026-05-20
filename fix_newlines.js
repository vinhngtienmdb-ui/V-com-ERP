const fs = require('fs');
const files = require('child_process').execSync('find src/components -name "*.tsx"').toString().split(String.fromCharCode(10)).filter(Boolean);
for (const file of files) {
   let content = fs.readFileSync(file, 'utf8');
   if (content.includes(';\\nimport React')) {
      content = content.replace(';\\nimport React', ';\nimport React');
      fs.writeFileSync(file, content);
      console.log('Fixed', file);
   }
   if (content.includes(';\\n')) {
      content = content.replace(';\\n', ';\n');
      fs.writeFileSync(file, content);
      console.log('Fixed', file);
   }
}
