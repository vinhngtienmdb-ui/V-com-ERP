const fs = require('fs');

let c = fs.readFileSync('src/components/Orders.tsx', 'utf8');

if (!c.includes("useAuditLog")) {
  c = c.replace(/import \{([^}]+)\} from 'lucide-react';/, "import {$1} from 'lucide-react';\nimport { useAuditLog } from '../hooks/useAuditLog';");
}

if (!c.includes("const { log } = useAuditLog();")) {
  c = c.replace(/export default function Orders\(\) \{/, "export default function Orders() {\n  const { log } = useAuditLog();");
}

c = c.replace(/await updateDoc\(doc\(db, 'orders', orderId\), \{([\s\S]*?)\}\);/g, (match) => {
  if (match.includes('log({ action:')) return match;
  return match + "\n      log({ action: 'order.updated', targetId: orderId, meta: { event: 'Status/payment update' } });";
});

fs.writeFileSync('src/components/Orders.tsx', c);
console.log("Orders.tsx patched.");
