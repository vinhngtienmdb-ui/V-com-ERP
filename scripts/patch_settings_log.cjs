const fs = require('fs');

let c = fs.readFileSync('src/components/Settings.tsx', 'utf8');

if (!c.includes("useAuditLog")) {
  c = c.replace(/import \{([^}]+)\} from 'lucide-react';/, "import {$1} from 'lucide-react';\nimport { useAuditLog } from '../hooks/useAuditLog';");
}

if (!c.includes("const logAction =")) {
  c = c.replace(/export default function Settings\(\) \{/, "export default function Settings() {\n  const { log } = useAuditLog();\n  const logAction = (module: string, actionName: string, label: string) => log({ action: 'settings.updated', targetLabel: label, meta: { module, actionName } });");
}

fs.writeFileSync('src/components/Settings.tsx', c);
console.log("Settings.tsx patched.");
