const fs = require('fs');
let content = fs.readFileSync('src/components/ui/Modal.tsx', 'utf8');

const fixHook = `  const onCloseRef = React.useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCloseRef.current();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);`;

content = content.replace(/  useEffect\(\(\) => \{[\s\S]*?\}, \[isOpen, onClose\]\);/, fixHook);

fs.writeFileSync('src/components/ui/Modal.tsx', content, 'utf8');
console.log('Modal.tsx patched');
