import * as fs from 'fs';
import * as path from 'path';

const settingsPath = path.join(process.cwd(), 'src/components/Settings.tsx');
let content = fs.readFileSync(settingsPath, 'utf8');

// Use correct curly order: )}
const regexStr = /<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;
if (regexStr.test(content)) {
  console.log('✓ Found target pattern!');
  content = content.replace(regexStr, `</button>\n  </div>\n  </div>\n  )}`);
  fs.writeFileSync(settingsPath, content, 'utf8');
  console.log('✓ Replaced successfully!');
} else {
  console.log('pattern not found');
}
