const fs = require('fs');

let modalContent = fs.readFileSync('src/components/ui/Modal.tsx', 'utf8');

// Replace the useEffect for overflow
modalContent = modalContent.replace(/document\.body\.style\.overflow\s*=\s*'hidden';/g, 'document.body.classList.add(\'modal-open\');');
modalContent = modalContent.replace(/document\.body\.style\.overflow\s*=\s*'';/g, 'document.body.classList.remove(\'modal-open\');');

// We also need to fix if the modal has NO title and NO footer, we should inject a close button at the top right.
if (modalContent.includes('if (fullscreen) {') && !modalContent.includes('absolute top-4 right-4 z-50')) {
    modalContent = modalContent.replace(
        /<div className={cn\("flex-1 flex flex-col w-full mx-auto relative"/g,
        `<div className={cn("flex-1 flex flex-col w-full mx-auto relative", maxWidthClasses[maxWidth] !== 'max-w-[95vw]' ? maxWidthClasses[maxWidth] : 'max-w-7xl')}>
          {(!title) && (
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-[60] p-2 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full shadow-md transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}`
    );
    // Note: the replace above will mess up the original string if we're not careful. Let's just use string replacement carefully.
}

fs.writeFileSync('src/components/ui/Modal.tsx', modalContent);

let indexCss = fs.readFileSync('src/index.css', 'utf8');
if (!indexCss.includes('body.modal-open')) {
    indexCss += '\n/* Lock scroll on main container when modal is open */\nbody.modal-open #main-scroll-container { overflow: hidden !important; }\n';
    fs.writeFileSync('src/index.css', indexCss);
}

console.log('Patched Modal.tsx and index.css');
