const fs = require('fs');

let c = fs.readFileSync('src/components/PIM.tsx', 'utf8');

if (!c.includes("useAuditLog")) {
  c = c.replace(/import \{([^}]+)\} from 'lucide-react';/, "import {$1} from 'lucide-react';\nimport { useAuditLog } from '../hooks/useAuditLog';");
}

if (!c.includes("const { log } = useAuditLog();")) {
  c = c.replace(/export default function PIM\(\) \{/, "export default function PIM() {\n  const { log } = useAuditLog();");
}

// Add log for product.updated (edit product)
if (!c.includes("action: 'product.updated'")) {
  const updatePattern = "await updateDoc(doc(db, 'products', showDetailForProduct.id), updatedProduct);";
  c = c.replace(updatePattern, updatePattern + "\n                      log({ action: 'product.updated', targetId: showDetailForProduct.id, targetLabel: updatedProduct.name, meta: { updatedProduct } });");
}

// Add log for product.created (add product)
if (!c.includes("action: 'product.created'")) {
  const addPattern = "const docRef = await addDoc(collection(db, 'products'), newProductData);";
  c = c.replace(addPattern, addPattern + "\n      log({ action: 'product.created', targetId: docRef.id, targetLabel: newProductData.name, meta: { newProductData } });");
}

// Add log for product.deleted?
// Need to find if there is a delete action in PIM.tsx
if (!c.includes("action: 'product.deleted'")) {
  const deletePattern = /await deleteDoc\(doc\(db, 'products', ([^)]+)\)\);/g;
  c = c.replace(deletePattern, "await deleteDoc(doc(db, 'products', $1));\n      log({ action: 'product.deleted', targetId: $1, targetLabel: 'Sản phẩm đã xóa' });");
}

fs.writeFileSync('src/components/PIM.tsx', c);
console.log("PIM.tsx patched with useAuditLog.");
