const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Identify which components are routes to be lazy loaded
const componentsToLazyLoad = [
  'Dashboard', 'Home', 'Orders', 'PIM', 'SellerManagement', 'Customers', 'Marketing', 
  'FlashSale', 'AffiliateManagement', 'WarehouseModule', 'Procurement', 'Finance', 
  'SettlementManagement', 'HumanResources', 'Performance', 'Workspace', 'AnalyticsBI', 
  'SalesManagement', 'LoyaltyManagement', 'SettingsPage', 'UserProfile', 'WalletHub', 
  'LiveCommerce', 'AdManager', 'Compliance', 'SellerFinance', 'SocialCommerce', 'OmniChat', 
  'WorkflowHub', 'AIOperations', 'AIChatBot', 'OrgStructure', 'IPosModule', 'EMenu', 
  'CustomerService', 'RequestHub', 'ContractManager', 'DocumentManager', 'SignatureHub', 
  'VCommSupermarket', 'DeviceLeasing', 'IPosSettings'
];

let hasChanges = false;

componentsToLazyLoad.forEach(comp => {
  const regex = new RegExp(`import \\{ ${comp} \\} from '\\./components/([^']+)';\\n`);
  const match = content.match(regex);
  if (match) {
    const importPath = match[1];
    content = content.replace(regex, `const ${comp} = React.lazy(() => import('./components/${importPath}').then(m => ({ default: m.${comp} })));\n`);
    hasChanges = true;
  }
});

// Wrap the Routes block in a Suspense if not done already
if (hasChanges && !content.includes('<Suspense')) {
  if (!content.includes('Suspense')) {
    content = content.replace("import React from 'react';", "import React, { Suspense } from 'react';");
  }
  
  content = content.replace(/<Routes>/g, '<Suspense fallback={<div className="flex h-full flex-col items-center justify-center p-10 bg-slate-50 rounded-2xl border border-slate-200 mt-4"><div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div><p className="text-slate-500 text-sm font-medium animate-pulse">Đang tải phân hệ...</p></div>}>\n            <Routes>');
  content = content.replace(/<\/Routes>/g, '</Routes>\n          </Suspense>');
}

fs.writeFileSync('src/App.tsx', content);
console.log("App.tsx patched to use React.lazy successfully!");
