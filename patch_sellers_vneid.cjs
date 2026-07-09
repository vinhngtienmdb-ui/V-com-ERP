const fs = require('fs');
const path = require('path');

const sellersPath = path.join('C:\\Users\\VINHNT\\.gemini\\antigravity\\scratch\\V-com-ERP', 'src', 'components', 'Sellers.tsx');
let content = fs.readFileSync(sellersPath, 'utf8');

// 1. Add VNeidVerificationModal import
if (!content.includes('VNeidVerificationModal')) {
  content = content.replace(
    "import { formatCurrency, cn } from '../lib/utils';",
    "import { formatCurrency, cn } from '../lib/utils';\nimport { VNeidVerificationModal, VNeidData } from './ui/VNeidVerificationModal';"
  );
}

// 2. Update PartnerData interface
if (!content.includes('vneidVerified?: boolean')) {
  content = content.replace(
    "activeModules: string[];\n}",
    "activeModules: string[];\n vneidVerified?: boolean;\n vneidLinkedAt?: string | null;\n}"
  );
}

// 3. Update MOCK_SELLERS with some verified data
if (!content.includes('vneidVerified: true')) {
  content = content.replace(
    "partnerType: 'dealer',\n  activeModules: ['ipos', 'pim', 'scm', 'hr']\n  },",
    "partnerType: 'dealer',\n  activeModules: ['ipos', 'pim', 'scm', 'hr'],\n  vneidVerified: true,\n  vneidLinkedAt: '05/12/2023'\n  },"
  );
}

// 4. Add state for modal
if (!content.includes('isVNeidModalOpen')) {
  content = content.replace(
    "const [isFilterOpen, setIsFilterOpen] = useState(false);",
    "const [isFilterOpen, setIsFilterOpen] = useState(false);\n  const [isVNeidModalOpen, setIsVNeidModalOpen] = useState(false);\n  const [selectedSellerForVNeid, setSelectedSellerForVNeid] = useState<PartnerData | null>(null);"
  );
}

// 5. Add VNeID badge in the grid view
// Wait, how to find the grid view seller render?
// Look for `border-t border-slate-100 flex items-center justify-between` or similar in grid
content = content.replace(
  /<div className="flex items-center gap-2 mb-1">\s*<h3 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">([^<]+)<\/h3>\s*(.*?)<\/div>/g,
  (match, p1, p2) => {
    if (match.includes('vneidVerified')) return match;
    return `<div className="flex items-center gap-2 mb-1">\n  <h3 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">${p1}</h3>\n  ${p2}\n  {seller.vneidVerified && (\n    <div className="bg-emerald-50 text-emerald-600 p-1 rounded-full" title="Đã xác thực VNeID"><ShieldCheck className="w-3.5 h-3.5" /></div>\n  )}\n</div>`;
  }
);

// 6. Add "Xác thực VNeID" button and details in the Detail Panel
// Look for the KYC section in the right panel: "HỒ SƠ TÀI LIỆU (KYC)"
content = content.replace(
  /<h4 className="text-sm font-bold text-slate-900 mb-4">HỒ SƠ TÀI LIỆU \(KYC\)<\/h4>([\s\S]*?)<div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">/g,
  `<h4 className="text-sm font-bold text-slate-900 mb-4">HỒ SƠ TÀI LIỆU (KYC)</h4>
              
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={cn("w-5 h-5", selectedSeller.vneidVerified ? "text-emerald-600" : "text-slate-400")} />
                    <span className="font-semibold text-slate-900">Định danh VNeID (Mức 2)</span>
                  </div>
                  {selectedSeller.vneidVerified ? (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">ĐÃ LIÊN KẾT</span>
                  ) : (
                    <button 
                      onClick={() => { setSelectedSellerForVNeid(selectedSeller); setIsVNeidModalOpen(true); }}
                      className="text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded transition-colors"
                    >
                      Xác thực ngay
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {selectedSeller.vneidVerified 
                    ? \`Liên kết ngày \${selectedSeller.vneidLinkedAt}. Hệ thống tự động đối khớp thông tin cư dân.\` 
                    : 'Yêu cầu người bán dùng ứng dụng VNeID quét mã QR để chia sẻ thông tin định danh điện tử.'}
                </p>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">`
);

// 7. Add Modal to render
const modalCode = `
      <VNeidVerificationModal 
        isOpen={isVNeidModalOpen}
        onClose={() => { setIsVNeidModalOpen(false); setSelectedSellerForVNeid(null); }}
        targetName={selectedSellerForVNeid?.name}
        onSuccess={(data) => {
          if (selectedSellerForVNeid) {
            const updatedSellers = sellers.map(s => {
              if (s.id === selectedSellerForVNeid.id) {
                return { ...s, vneidVerified: true, vneidLinkedAt: new Date().toLocaleDateString('vi-VN'), status: 'active', onboardingStep: 'completed', identityCard: data.idNumber, representative: data.fullName } as PartnerData;
              }
              return s;
            });
            setSellers(updatedSellers);
            setSelectedSeller({ ...selectedSellerForVNeid, vneidVerified: true, vneidLinkedAt: new Date().toLocaleDateString('vi-VN'), status: 'active', onboardingStep: 'completed', identityCard: data.idNumber, representative: data.fullName });
          }
          setIsVNeidModalOpen(false);
        }}
      />
`;
if (!content.includes('VNeidVerificationModal isOpen={isVNeidModalOpen}')) {
  // Inject before final </div>
  content = content.replace(/(?:\s*)<\/div>\s*<\/div>\s*\)$/, (match) => {
    return modalCode + match;
  });
}

fs.writeFileSync(sellersPath, content, 'utf8');
console.log('Patched Sellers.tsx');
