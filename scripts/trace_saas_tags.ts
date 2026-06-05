import * as fs from 'fs';
import * as path from 'path';

const saasLayoutPath = path.join(process.cwd(), 'saas_layout.txt');
const text = fs.readFileSync(saasLayoutPath, 'utf8');

const lines = text.split('\n');

// Standard simplified tag regex
const tagRegex = /<([a-zA-Z1-9]+)(?:\s+[^>]*?)?>|<\/([a-zA-Z1-9]+)>/g;
let stack: string[] = [];

for (let r = 0; r < lines.length; r++) {
  const lineText = lines[r];
  
  // Skip comment lines
  if (lineText.trim().startsWith('//')) continue;
  
  let match;
  tagRegex.lastIndex = 0;
  
  while ((match = tagRegex.exec(lineText)) !== null) {
    const openTag = match[1];
    const closeTag = match[2];
    
    // Ignore self-closers and icon components
    const isSelfClosing = match[0].endsWith('/>') || 
                          /^(input|img|br|hr|link|meta)$/i.test(openTag) ||
                          /^(Sparkles|Check|AlertCircle|CreditCard|FileText|Globe|Database)$/.test(openTag);
                          
    if (openTag) {
      if (!isSelfClosing) {
        stack.push(openTag);
      }
    } else if (closeTag) {
      const idx = stack.lastIndexOf(closeTag);
      if (idx !== -1) {
        stack.splice(idx, 1);
      } else {
        console.warn(`Unmatched closing tag </${closeTag}> on line ${r + 1}`);
      }
    }
  }
  
  // Print stack status
  console.log(`Line ${r + 1}: [ ${stack.join(' > ')} ]`);
}
