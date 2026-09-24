import * as fs from 'fs';
import * as path from 'path';

const settingsPath = path.join(process.cwd(), 'src/components/Settings.tsx');
let text = fs.readFileSync(settingsPath, 'utf8');

// Strip JSX comments
text = text.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const lines = text.split('\n');
const tagRegex = /<([a-zA-Z1-9]+)(?:\s+[^>]*?)?>|<\/([a-zA-Z1-9]+)>/g;
const stack: { tag: string; line: number; text: string }[] = [];

for (let r = 0; r < lines.length; r++) {
  const lineText = lines[r];
  if (lineText.trim().startsWith('//')) continue;
  
  let match;
  tagRegex.lastIndex = 0;
  
  while ((match = tagRegex.exec(lineText)) !== null) {
    const openTag = match[1];
    const closeTag = match[2];
    
    // Ignore self-closing XML lines or single-line self closers
    const isSelfClosing = match[0].endsWith('/>') || 
                          /^(input|img|br|hr|link|meta)$/i.test(openTag) ||
                          match[0].includes('AlertCircle') || 
                          match[0].includes('Check') || 
                          match[0].includes('FileText') || 
                          match[0].includes('Globe') || 
                          match[0].includes('Database') || 
                          match[0].includes('CreditCard') || 
                          match[0].includes('Sparkles') ||
                          match[0].includes('Settings') ||
                          match[0].includes('Save') ||
                          match[0].includes('ChevronLeft') ||
                          match[0].includes('Edit2') ||
                          match[0].includes('RefreshCw') ||
                          match[0].includes('ChevronRight') ||
                          match[0].includes('Trash2') ||
                          match[0].includes('Key') ||
                          match[0].includes('Lock') ||
                          match[0].includes('Activity') ||
                          match[0].includes('Plus') ||
                          match[0].includes('X') ||
                          match[0].includes('Building2') ||
                          match[0].includes('Store') ||
                          match[0].includes('Package') ||
                          match[0].includes('BadgeDollarSign') ||
                          match[0].includes('Bell') ||
                          match[0].includes('MessageSquare') ||
                          match[0].includes('Webhook') ||
                          match[0].includes('MapPin') ||
                          match[0].includes('ShieldCheck') ||
                          match[0].includes('PageEditorModal') ||
                          match[0].includes('Clock');

    if (openTag) {
      if (!isSelfClosing) {
        stack.push({ tag: openTag, line: r + 1, text: match[0] });
      }
    } else if (closeTag) {
      if (stack.length === 0) {
        console.error(`Error: Unexpected closing tag </${closeTag}> at line ${r + 1}`);
      } else {
        const last = stack.pop();
        if (last && last.tag !== closeTag) {
          console.warn(`Mismatch: </${closeTag}> at line ${r + 1} does not match <${last.tag}> opened at line ${last.line} (${last.text})`);
          // Put the expected one back on stack for recovery
          stack.push(last);
        }
      }
    }
  }
}

console.log('Unclosed tags remaining in stack (Count:', stack.length, '):');
for (const item of stack.slice(-20)) {
  console.log(`- <${item.tag}> on line ${item.line}: "${item.text.trim().substring(0, 50)}"`);
}
