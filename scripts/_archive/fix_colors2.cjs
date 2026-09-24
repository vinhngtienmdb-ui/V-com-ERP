const fs = require('fs');

const fixGradients = (file) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/bg-white from-(black\/60)/g, 'bg-gradient-to-t from-$1');
    content = content.replace(/bg-white from-(white\/40)/g, 'bg-gradient-to-t from-$1');
    content = content.replace(/bg-white from-(white\/10)/g, 'bg-gradient-to-t from-$1');
    content = content.replace(/bg-white from-\[#111827\]/g, 'bg-gradient-to-br from-[#111827] to-slate-900');
    fs.writeFileSync(file, content, 'utf8');
  }
}

fixGradients('src/components/LiveCommerce.tsx');
fixGradients('src/components/IPos.tsx');
fixGradients('src/components/HR.tsx');
