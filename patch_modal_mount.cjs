const fs = require('fs');
let path = 'src/components/ui/Modal.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('useEffect(() => setMounted(true), []);')) {
  content = content.replace(/const \[mounted, setMounted\] = useState\(false\);/, "const [mounted, setMounted] = useState(false);\n  useEffect(() => setMounted(true), []);");
  fs.writeFileSync(path, content, 'utf8');
  console.log("Modal.tsx mounted issue fixed");
} else {
  console.log("Already fixed");
}
