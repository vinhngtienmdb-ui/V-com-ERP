import fs from 'fs';
let code = fs.readFileSync('src/components/ContractManager.tsx', 'utf-8');

code = code.replace(
  /  <\/div>\n  \);\n\}/,
  '  </div>\n  </div>\n  );\n}'
);

fs.writeFileSync('src/components/ContractManager.tsx', code);
