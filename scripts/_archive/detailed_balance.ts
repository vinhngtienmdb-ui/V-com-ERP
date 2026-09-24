import * as fs from 'fs';
import * as path from 'path';

const saasLayoutPath = path.join(process.cwd(), 'saas_layout.txt');
let text = fs.readFileSync(saasLayoutPath, 'utf8');

// Strip JSX comments: {/* ... */}
text = text.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

// Split into tags
const tagRegex = /<([a-zA-Z1-9]+)(?:\s+[^>]*?)?>|<\/([a-zA-Z1-9]+)>/g;
const stack: { tag: string; line: number }[] = [];

// Track lines to pinpoint errors
const lines = text.split('\n');

for (let r = 0; r < lines.length; r++) {
  const lineText = lines[r];
  
  // Skip comment lines
  if (lineText.trim().startsWith('//')) continue;
  
  let match;
  tagRegex.lastIndex = 0;
  
  while ((match = tagRegex.exec(lineText)) !== null) {
    const openTag = match[1];
    const closeTag = match[2];
    
    // Skip self-closing tags like <input />, <img />, <Sparkles />, etc.
    const isSelfClosing = match[0].endsWith('/>') || match[0].includes('input') || match[0].includes('AlertCircle') || match[0].includes('Check') || match[0].includes('FileText') || match[0].includes('Globe') || match[0].includes('Database') || match[0].includes('CreditCard') || match[0].includes('Sparkles');
    
    if (openTag) {
      if (!isSelfClosing) {
        stack.push({ tag: openTag, line: r + 1 });
      }
    } else if (closeTag) {
      if (stack.length === 0) {
        console.error(`Error: Unexpected closing tag </${closeTag}> at line ${r + 1}`);
      } else {
        const last = stack.pop();
        if (last && last.tag !== closeTag) {
          console.warn(`Warning: Mismatched tag </${closeTag}> at line ${r + 1} does not match <${last.tag}> opened at line ${last.line}`);
        }
      }
    }
  }
}

console.log('Remaining open tags in stack:', stack);
