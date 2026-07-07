const fs = require('fs');

// Fix HR.tsx
let hrPath = 'src/components/HR.tsx';
if (fs.existsSync(hrPath)) {
  let hr = fs.readFileSync(hrPath, 'utf8');
  hr = hr.replace(/\/\/\s*const \[aiPayrollSuggestion/g, 'const [aiPayrollSuggestion');
  hr = hr.replace(/\/\/\s*const \[isCopilotOpen/g, 'const [isCopilotOpen');
  hr = hr.replace(/\/\/\s*const \[copilotInput/g, 'const [copilotInput');
  fs.writeFileSync(hrPath, hr, 'utf8');
  console.log("HR.tsx fixed");
}

// Fix Orders.tsx
let ordersPath = 'src/components/Orders.tsx';
if (fs.existsSync(ordersPath)) {
  let orders = fs.readFileSync(ordersPath, 'utf8');
  orders = orders.replace(/resp\.message/g, 'data.message');
  fs.writeFileSync(ordersPath, orders, 'utf8');
  console.log("Orders.tsx fixed");
}

// Fix Compliance.tsx
let compPath = 'src/components/Compliance.tsx';
if (fs.existsSync(compPath)) {
  let comp = fs.readFileSync(compPath, 'utf8');
  comp = comp.replace(/type: "string"/g, 'type: "string" as any');
  fs.writeFileSync(compPath, comp, 'utf8');
  console.log("Compliance.tsx fixed");
}
