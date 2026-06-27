const fs = require('fs');

let c = fs.readFileSync('src/components/Warehouse.tsx', 'utf8');

if (!c.includes("useAuditLog")) {
  c = c.replace(/import \{([^}]+)\} from 'lucide-react';/, "import {$1} from 'lucide-react';\nimport { useAuditLog } from '../hooks/useAuditLog';");
}

if (!c.includes("const { log } = useAuditLog();")) {
  c = c.replace(/export default function Warehouse\(\) \{/, "export default function Warehouse() {\n  const { log } = useAuditLog();");
}

c = c.replace(/await addDoc\(collection\(db, 'stock_transfers'\), ([^)]+)\);/g, (match, p1) => {
  if (match.includes('log({ action:')) return match;
  return match + "\n      log({ action: 'warehouse.transfer_created', meta: { transferData: " + p1 + " } });";
});

fs.writeFileSync('src/components/Warehouse.tsx', c);
console.log("Warehouse.tsx patched.");
