const fs = require('fs');

let ordersPath = 'src/components/Orders.tsx';
if (fs.existsSync(ordersPath)) {
  let orders = fs.readFileSync(ordersPath, 'utf8');
  orders = orders.replace(/\bresp\b/g, 'data');
  fs.writeFileSync(ordersPath, orders, 'utf8');
}

let compPath = 'src/components/Compliance.tsx';
if (fs.existsSync(compPath)) {
  let comp = fs.readFileSync(compPath, 'utf8');
  comp = comp.replace(/type: "string"/g, 'type: "string" as any');
  comp = comp.replace(/type: 'string'/g, 'type: "string" as any');
  fs.writeFileSync(compPath, comp, 'utf8');
}
