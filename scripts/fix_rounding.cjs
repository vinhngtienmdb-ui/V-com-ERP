const fs = require('fs');
const path = require('path');

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

let modifiedCount = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace rounded-2xl and rounded-xl with rounded-lg
  // Be careful not to replace things like `rounded-xl` if they are part of a very specific element that needs it?
  // Actually, the user asked to reduce corner rounding generally.
  // Replacing globally in the codebase is safe because rounded-lg is standard.
  content = content.replace(/rounded-2xl/g, 'rounded-lg');
  content = content.replace(/rounded-xl/g, 'rounded-lg');
  
  // Replace h-[85vh] or h-[95vh] with max-h-[90vh] in fixed modals?
  // No, some might be h-screen for sidebars. Let's just fix rounding.

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    modifiedCount++;
    console.log(`Updated ${file}`);
  }
}

console.log(`Done. Modified ${modifiedCount} files.`);
