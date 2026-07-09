const fs = require('fs');
const path = require('path');

const affiliatePath = path.join('C:\\Users\\VINHNT\\.gemini\\antigravity\\scratch\\V-com-ERP', 'src', 'components', 'Affiliate.tsx');
let content = fs.readFileSync(affiliatePath, 'utf8');

// 1. Add VNeidVerificationModal import & ShieldCheck
if (!content.includes('VNeidVerificationModal')) {
  content = content.replace(
    "import { formatCurrency, cn } from '../lib/utils';",
    "import { formatCurrency, cn } from '../lib/utils';\nimport { VNeidVerificationModal } from './ui/VNeidVerificationModal';"
  );
  if (!content.includes('ShieldCheck')) {
    content = content.replace("Users,", "Users,\n ShieldCheck,");
  }
}

// 2. Add state for affiliates and modal
if (!content.includes('isVNeidModalOpen')) {
  content = content.replace(
    "const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');",
    "const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');\n  const [affiliates, setAffiliates] = useState(MOCK_AFFILIATES);\n  const [isVNeidModalOpen, setIsVNeidModalOpen] = useState(false);\n  const [selectedAffiliateForVNeid, setSelectedAffiliateForVNeid] = useState<Affiliate | null>(null);"
  );
}

// 3. Update MOCK_AFFILIATES.map to affiliates.map
content = content.replace(
  /MOCK_AFFILIATES\.filter/g,
  "affiliates.filter"
);

// 4. Update MOCK_AFFILIATES to add vneidVerified to one of them
if (!content.includes('vneidVerified: true')) {
  content = content.replace(
    "categoryTags: ['Thời trang', 'Đời sống']\n  },",
    "categoryTags: ['Thời trang', 'Đời sống'],\n  vneidVerified: true,\n  vneidLinkedAt: '12/03/2024'\n  },"
  );
}

// 5. Add VNeID badge near the affiliate name
content = content.replace(
  /<p className="text-sm font-semibold text-\[#111827\]">\{affiliate\.name\}<\/p>/g,
  `<div className="flex items-center gap-1">\n  <p className="text-sm font-semibold text-[#111827]">{affiliate.name}</p>\n  {affiliate.vneidVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" title="Đã xác thực VNeID" />}\n</div>`
);

// 6. Update action buttons (add Xác thực VNeID)
content = content.replace(
  /<button className="px-3 py-1.5 bg-primary-600 text-\[#FAF9F5\] text-\[11px\] font-bold rounded-md hover:bg-slate-800 shadow-sm">Duyệt KOL<\/button>/g,
  `<div className="flex flex-col gap-1 items-end">\n  <button onClick={() => { setSelectedAffiliateForVNeid(affiliate); setIsVNeidModalOpen(true); }} className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold rounded hover:bg-emerald-100 shadow-sm flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Xác thực VNeID</button>\n  <button onClick={() => {\n    setAffiliates(affiliates.map(a => a.id === affiliate.id ? {...a, status: 'active'} : a));\n  }} className="px-3 py-1 bg-primary-600 text-[#FAF9F5] text-[10px] font-bold rounded hover:bg-slate-800 shadow-sm">Duyệt thường</button>\n</div>`
);

// 7. Add Modal to render
const modalCode = `
      <VNeidVerificationModal 
        isOpen={isVNeidModalOpen}
        onClose={() => { setIsVNeidModalOpen(false); setSelectedAffiliateForVNeid(null); }}
        targetName={selectedAffiliateForVNeid?.name}
        onSuccess={(data) => {
          if (selectedAffiliateForVNeid) {
            setAffiliates(affiliates.map(a => 
              a.id === selectedAffiliateForVNeid.id 
                ? { ...a, vneidVerified: true, vneidLinkedAt: new Date().toLocaleDateString('vi-VN'), status: 'active' } 
                : a
            ));
          }
          setIsVNeidModalOpen(false);
        }}
      />
`;
if (!content.includes('VNeidVerificationModal isOpen={isVNeidModalOpen}')) {
  // Inject before final </div> of AffiliateManagement
  content = content.replace(/(?:\s*)<\/div>\s*\);\s*}\s*$/, (match) => {
    return modalCode + match;
  });
}

fs.writeFileSync(affiliatePath, content, 'utf8');
console.log('Patched Affiliate.tsx');
