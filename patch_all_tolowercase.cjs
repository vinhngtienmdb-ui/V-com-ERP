const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

let totalFixed = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Regex to match object property access followed by .toLowerCase()
  // Matches: `doc.title.toLowerCase()` or `item.trackingCode.toLowerCase()`
  // It specifically avoids replacing string literals like `"".toLowerCase()` or function calls like `foo().toLowerCase()`
  // Group 1: the object and property (e.g., "doc.title")
  const regex = /([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)\.toLowerCase\(\)/g;

  let fileChanged = false;
  let newContent = content.replace(regex, (match, p1) => {
    // If it's something like "searchQuery.toLowerCase()", the regex won't match because there's no dot before toLowerCase, wait, it might.
    // The regex `([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)` matches `a.b`, so `searchQuery` alone wouldn't match.
    // What if it's `searchReqQuery.toLowerCase()`? It won't match `a.b`.
    
    // Replace with optional chaining
    fileChanged = true;
    totalFixed++;
    return `${p1}?.toLowerCase()`;
  });

  // There might be cases where they check `if (doc.title)` already, e.g., `doc.title && doc.title.toLowerCase()`.
  // Changing to `doc.title?.toLowerCase()` is still perfectly valid and even cleaner.
  // There are also cases like `emp.fullName.toLowerCase()`, `p.name.toLowerCase()`, etc.

  if (fileChanged) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Patched ${file}`);
  }
}

console.log(`Done! Fixed ${totalFixed} occurrences.`);
