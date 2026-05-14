import fs from 'fs';
import { execSync } from 'child_process';

const files = execSync('find src/components -name "*.tsx"').toString().split('\n').filter(Boolean);

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /<p[ >][^>]*>([\s\S]*?)<\/p>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match[1].includes('<div ')) {
       console.log(file + " : found <div inside <p>");
       console.log(match[0]);
       console.log("-------------------");
    }
  }
}
