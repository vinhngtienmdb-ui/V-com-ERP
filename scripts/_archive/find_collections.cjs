const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '..', 'src', 'components');
const files = fs.readdirSync(componentsDir);

const collections = new Set();
const collectionRegex = /collection\(\s*db\s*,\s*['"`]([^'"`]+)['"`]\)/g;

files.forEach(file => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    const content = fs.readFileSync(path.join(componentsDir, file), 'utf8');
    let match;
    while ((match = collectionRegex.exec(content)) !== null) {
      collections.add(`${file}: ${match[1]}`);
    }
  }
});

console.log('Found Firestore collections:');
collections.forEach(c => console.log('  ', c));
