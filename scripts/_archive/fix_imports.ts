import fs from 'fs';
import { execSync } from 'child_process';

const files = execSync('find src/components -name "*.tsx"').toString().split('\n').filter(Boolean);
for (const file of files) {
   let content = fs.readFileSync(file, 'utf8');
   if (content.includes('<DraggableGrid') && !content.includes('import { DraggableGrid }')) {
      const isUi = file.includes('/ui/');
      const importPath = isUi ? './DraggableGrid' : './ui/DraggableGrid';
      content = `import { DraggableGrid } from '${importPath}';\\n` + content;
      fs.writeFileSync(file, content);
      console.log('Added import to', file);
   }
}
