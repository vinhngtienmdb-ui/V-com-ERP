import fs from 'fs';
import { execSync } from 'child_process';
const files = execSync('find src/components -name "*.tsx"').toString().split(String.fromCharCode(10)).filter(Boolean);
for (const file of files) {
   let content = fs.readFileSync(file, 'utf8');
   if (content.includes(';\\nimport React')) {
      content = content.replace(';\\nimport React', ';\nimport React');
      fs.writeFileSync(file, content);
      console.log('Fixed', file);
   }
   if (content.includes(';\\nglobal')) {
      content = content.replace(';\\nglobal', ';\nglobal');
      fs.writeFileSync(file, content);
      console.log('Fixed', file);
   }
   if (content.includes(';\\n')) {
      content = content.replaceAll(';\\n', ';\n');
      fs.writeFileSync(file, content);
      console.log('Fixed', file);
   }
}
