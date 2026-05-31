const fs = require('fs');

let content = fs.readFileSync('src/components/Settings.tsx', 'utf8');

// Insert State Variables
const stateVars = `
  const [apiKeys, setApiKeys] = useState<{
    gemini: string;
    sepayToken: string;
    sepayId: string;
    sepaySecret: string;
  }>({
    gemini: safeLocalStorage.getItem('api_gemini_api_key') || '',
    sepayToken: safeLocalStorage.getItem('api_sepay_api_token') || '',
    sepayId: safeLocalStorage.getItem('api_sepay_client_id') || '',
    sepaySecret: safeLocalStorage.getItem('api_sepay_client_secret') || '',
  });

  const saveApiKeys = () => {
    safeLocalStorage.setItem('api_gemini_api_key', apiKeys.gemini);
    safeLocalStorage.setItem('api_sepay_api_token', apiKeys.sepayToken);
    safeLocalStorage.setItem('api_sepay_client_id', apiKeys.sepayId);
    safeLocalStorage.setItem('api_sepay_client_secret', apiKeys.sepaySecret);
    addNotification('Cập nhật API', 'Đã lưu cấu hình API tích hợp thành công.');
  };
`;

content = content.replace(
  "const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);",
  "const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);" + stateVars
);

// Replace UI in "api" tab
const newApiTab = `{activeTab === 'api' && (
  <div className="animate-in fade-in duration-300 space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Key className="w-4 h-4 text-orange-500" /> Hệ thống nội bộ (Third-party)
        </h3>
        <p className="text-xs text-slate-500">Cấu hình các Access Token và API Key dùng cho hoạt động cốt lõi của VComm (AI, Thanh toán).</p>
        
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Gemini (Google AI) API Key</label>
            <input 
              type="password"
              placeholder="AIzaSy..."
              className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
              value={apiKeys.gemini}
              onChange={e => setApiKeys(prev => ({...prev, gemini: e.target.value}))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">SePay API Token</label>
            <input 
              type="password"
              placeholder="JWT Token..."
              className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
              value={apiKeys.sepayToken}
              onChange={e => setApiKeys(prev => ({...prev, sepayToken: e.target.value}))}
            />
          </div>
          <div className="flex gap-3">
            <div className="space-y-1.5 w-1/2">
              <label className="text-xs font-bold text-slate-700">SePay Client ID</label>
              <input 
                type="text"
                placeholder="Client ID"
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                value={apiKeys.sepayId}
                onChange={e => setApiKeys(prev => ({...prev, sepayId: e.target.value}))}
              />
            </div>
            <div className="space-y-1.5 w-1/2">
              <label className="text-xs font-bold text-slate-700">SePay Client Secret</label>
              <input 
                type="password"
                placeholder="Client Secret"
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                value={apiKeys.sepaySecret}
                onChange={e => setApiKeys(prev => ({...prev, sepaySecret: e.target.value}))}
              />
            </div>
          </div>
        </div>

        <button onClick={saveApiKeys} className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors">
          Cập nhật cấu hình tích hợp
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <AppWindow className="w-4 h-4 text-blue-600" /> Webhook Settings
        </h3>
        <p className="text-xs text-slate-500">Tự động đẩy thông báo sự kiện (Đơn hàng, Đối soát) về Server đối tác.</p>
        <div className="space-y-3">
          {MOCK_WEBHOOKS.map(wb => (
            <div key={wb.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-900">{wb.name}</p>
                <p className="text-[9px] text-slate-500 font-mono truncate max-w-[150px]">{wb.url}</p>
              </div>
              <button className="p-1.5 hover:bg-red-50 text-red-500 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
        <button className="w-full py-2 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50">Cấu hình Webhook mới</button>
      </div>
    </div>

    <div className="bg-blue-900 text-white p-6 rounded-lg flex items-center gap-6">
      <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
        <Globe className="w-8 h-8 text-blue-600" />
      </div>
      <div>
        <h4 className="font-bold text-lg mb-1">OpenAPI Public Documentation</h4>
        <p className="text-slate-500 text-xs">Cung cấp tài liệu tích hợp (Swagger/Postman) cho cộng đồng phát triển và đối tác chiến lược để kết nối trực tiếp kho hàng Brand với vận hành sàn.</p>
        <div className="flex gap-4 mt-3">
          <button className="text-xs font-bold text-blue-600 hover:underline">Download API Spec</button>
          <button className="text-xs font-bold text-blue-600 hover:underline">Xem Sandbox logs</button>
        </div>
      </div>
    </div>
  </div>
)}`;

const regex = /{activeTab === 'api' && \([\s\S]*?(?=\n\s*{activeTab === 'address')/m;

if (content.match(regex)) {
  content = content.replace(regex, newApiTab + '\n');
  fs.writeFileSync('src/components/Settings.tsx', content);
  console.log("Settings.tsx patched with API form successfully!");
} else {
  console.log("Regex match for 'api' tab failed!");
}
