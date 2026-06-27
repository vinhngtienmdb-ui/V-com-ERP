const fs = require('fs');
const path = 'src/components/Settings.tsx';
let content = fs.readFileSync(path, 'utf8');

const startStr = "{/* --- SEPAY CONFIGURATION MODAL --- */}";
const endStr = "{activeTab === 'address' && (";

const startIndex = content.indexOf(startStr);
const endMatchIndex = content.indexOf(endStr);

if (startIndex !== -1 && endMatchIndex !== -1) {
  // We need to keep the closing tags of the integration tab
  const beforeIntegrationClose = "    </div>\n  )}\n\n\n\n ";
  
  const replacement = `{/* --- SEPAY CONFIGURATION MODAL --- */}
      {activeConfigModal === 'sepay' && (
        <Modal
          title="Cấu hình Cổng Thanh toán SePay"
          icon={<CreditCard className="w-5 h-5 text-blue-600" />}
          isOpen={activeConfigModal === 'sepay'}
          maxWidth="md"
          onClose={() => setActiveConfigModal(null)}
          onConfirm={() => {
            saveApiKeys();
            setActiveConfigModal(null);
            logAction('Settings.Integration', 'UPDATE', 'Cập nhật cấu hình SePay');
          }}
          confirmText="Lưu cấu hình"
          confirmButtonClass="bg-blue-600 hover:bg-blue-700 text-white"
        >
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">SePay API JWT Token</label>
                <input 
                  type="password" 
                  placeholder="Bearer JWT Token..."
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-100 font-mono"
                  value={apiKeys.sepayToken}
                  onChange={e => setApiKeys(prev => ({ ...prev, sepayToken: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Client ID</label>
                  <input 
                    type="text" 
                    placeholder="SePay client ID"
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-100"
                    value={apiKeys.sepayId}
                    onChange={e => setApiKeys(prev => ({ ...prev, sepayId: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Client Secret</label>
                  <input 
                    type="password" 
                    placeholder="SePay client secret"
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-100"
                    value={apiKeys.sepaySecret}
                    onChange={e => setApiKeys(prev => ({ ...prev, sepaySecret: e.target.value }))}
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <h5 className="font-bold text-[10px] text-slate-600 dark:text-slate-400 uppercase">SePay Webhook URL để nhận biến động số dư</h5>
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="font-mono text-[9px] text-slate-500 truncate select-all flex-1">https://api.vcomm.vn/v1/webhooks/sepay-callback</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('https://api.vcomm.vn/v1/webhooks/sepay-callback');
                      addNotification('Copy Webhook', 'Đã sao chép URL webhook của SePay.');
                    }}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Webhook Simulator Section */}
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800/50 space-y-3 font-sans">
                <h5 className="font-bold text-[10.5px] text-blue-800 dark:text-blue-400 uppercase tracking-wider">Bộ Giả Lập Webhook (Webhook Simulator)</h5>
                
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Nội dung chuyển khoản (Content)</label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: VCOMM_ORD_123 hoặc VCOMM_DEP_cust123"
                      className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg focus:outline-none dark:text-slate-100 font-mono"
                      value={simCode}
                      onChange={e => setSimCode(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Số tiền chuyển khoản (Amount)</label>
                    <input 
                      type="number" 
                      placeholder="Số tiền (VND)"
                      className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg focus:outline-none dark:text-slate-100"
                      value={simAmount}
                      onChange={e => setSimAmount(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={handleSimulateWebhook}
                    disabled={simulating || !simCode}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {simulating ? 'Đang giả lập...' : 'Kích hoạt Webhook giả lập 🚀'}
                  </button>
                </div>
              </div>
            </div>
        </Modal>
      )}

      {/* --- ZALO ZNS CONFIGURATION MODAL --- */}
      {activeConfigModal === 'zns' && (
        <Modal
          title="Cấu hình Zalo ZNS (Zalo OA)"
          icon={<MessageSquare className="w-5 h-5 text-sky-600" />}
          isOpen={activeConfigModal === 'zns'}
          maxWidth="md"
          onClose={() => setActiveConfigModal(null)}
          onConfirm={() => {
            saveZnsConfigLocal(znsConfig);
            setActiveConfigModal(null);
            logAction('Settings.Integration', 'UPDATE', 'Cập nhật cấu hình Zalo ZNS');
          }}
          confirmText="Lưu cấu hình ZNS"
          confirmButtonClass="bg-sky-600 hover:bg-sky-700 text-white"
        >
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Zalo Official Account ID (OA ID)</label>
                <input 
                  type="text" 
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 dark:text-slate-100 font-mono"
                  value={znsConfig.oaId}
                  onChange={e => setZnsConfig(prev => ({ ...prev, oaId: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Zalo Developer App ID</label>
                <input 
                  type="text" 
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 dark:text-slate-100 font-mono"
                  value={znsConfig.appId}
                  onChange={e => setZnsConfig(prev => ({ ...prev, appId: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">OA Access Token</label>
                <input 
                  type="password" 
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 dark:text-slate-100 font-mono"
                  value={znsConfig.accessToken}
                  onChange={e => setZnsConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300">Tự động refresh token</h5>
                  <p className="text-[9px] text-slate-500">Sử dụng Refresh Token để gia hạn Access Token tự động.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={znsConfig.autoRefresh}
                    onChange={e => setZnsConfig(prev => ({ ...prev, autoRefresh: e.target.checked }))}
                  />
                  <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-3.5 after:width-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-sky-500"></div>
                </label>
              </div>
            </div>
        </Modal>
      )}

      {/* --- SHOPIFY / HARAVAN CONFIGURATION MODAL --- */}
      {activeConfigModal === 'shopify' && (
        <Modal
          title="Cấu hình Shopify / Haravan Integration"
          icon={<Store className="w-5 h-5 text-teal-600" />}
          isOpen={activeConfigModal === 'shopify'}
          maxWidth="md"
          onClose={() => setActiveConfigModal(null)}
          onConfirm={() => {
            saveShopifyHaravanConfig(shopifyHaravanConfig);
            setActiveConfigModal(null);
            logAction('Settings.Integration', 'UPDATE', 'Cập nhật cấu hình Shopify/Haravan');
          }}
          confirmText="Lưu cấu hình"
          confirmButtonClass="bg-teal-600 hover:bg-teal-700 text-white"
        >
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Shop URL (Domain hoặc sub-domain)</label>
                <input 
                  type="text" 
                  placeholder="shop-retail.myshopify.com hoặc nexhubshop.vn"
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 dark:text-slate-100"
                  value={shopifyHaravanConfig.shopUrl}
                  onChange={e => setShopifyHaravanConfig(prev => ({ ...prev, shopUrl: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Admin API Access Token</label>
                <input 
                  type="password" 
                  placeholder="shpat_..."
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 dark:text-slate-100 font-mono"
                  value={shopifyHaravanConfig.accessToken}
                  onChange={e => setShopifyHaravanConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                />
              </div>

              <div className="space-y-3 border-t border-slate-100 dark:border-slate-700 pt-3">
                <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300">Tùy chọn đồng bộ</h5>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">Đồng bộ sản phẩm tự động (PIM)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={shopifyHaravanConfig.syncProducts}
                      onChange={e => setShopifyHaravanConfig(prev => ({ ...prev, syncProducts: e.target.checked }))}
                    />
                    <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-3.5 after:width-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-teal-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">Tải đơn hàng về hệ thống ERP</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={shopifyHaravanConfig.syncOrders}
                      onChange={e => setShopifyHaravanConfig(prev => ({ ...prev, syncOrders: e.target.checked }))}
                    />
                    <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-3.5 after:width-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-teal-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">Đồng bộ tồn kho tức thời (Stock sync)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={shopifyHaravanConfig.autoInventorySync}
                      onChange={e => setShopifyHaravanConfig(prev => ({ ...prev, autoInventorySync: e.target.checked }))}
                    />
                    <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-3.5 after:width-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-teal-500"></div>
                  </label>
                </div>
              </div>
            </div>
        </Modal>
      )}

      {/* --- SHOPEE / TIKTOK SHOP CONFIGURATION MODAL --- */}
      {activeConfigModal === 'marketplace' && (
        <Modal
          title="Cấu hình Shopee / TikTok Shop Integration"
          icon={<Zap className="w-5 h-5 text-orange-500" />}
          isOpen={activeConfigModal === 'marketplace'}
          maxWidth="md"
          onClose={() => setActiveConfigModal(null)}
          onConfirm={() => {
            saveMarketplaceConfig(marketplaceConfig);
            setActiveConfigModal(null);
            logAction('Settings.Integration', 'UPDATE', \`Cập nhật cấu hình \${marketplaceConfig.platform}\`);
          }}
          confirmText="Lưu cấu hình"
          confirmButtonClass="bg-orange-600 hover:bg-orange-700 text-white"
        >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Sàn Thương mại</label>
                  <select 
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-slate-100"
                    value={marketplaceConfig.platform}
                    onChange={e => setMarketplaceConfig(prev => ({ ...prev, platform: e.target.value as 'shopee' | 'tiktok' }))}
                  >
                    <option value="shopee">Shopee Mall / Live</option>
                    <option value="tiktok">TikTok Shop VN</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Gian hàng Shop ID</label>
                  <input 
                    type="text" 
                    placeholder="shop_id_12345"
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-slate-100"
                    value={marketplaceConfig.shopId}
                    onChange={e => setMarketplaceConfig(prev => ({ ...prev, shopId: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">App Key (API Partner)</label>
                  <input 
                    type="text" 
                    placeholder="app_key"
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-slate-100"
                    value={marketplaceConfig.appKey}
                    onChange={e => setMarketplaceConfig(prev => ({ ...prev, appKey: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">App Secret Key</label>
                  <input 
                    type="password" 
                    placeholder="app_secret"
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-slate-100"
                    value={marketplaceConfig.appSecret}
                    onChange={e => setMarketplaceConfig(prev => ({ ...prev, appSecret: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Access Token hiện tại</label>
                <input 
                  type="password" 
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-slate-100 font-mono"
                  value={marketplaceConfig.accessToken}
                  onChange={e => setMarketplaceConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                />
              </div>

              <div className="space-y-3 border-t border-slate-100 dark:border-slate-700 pt-3">
                <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300">Tùy chọn đồng bộ</h5>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">Đồng bộ tồn kho tự động</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={marketplaceConfig.autoSyncStock}
                      onChange={e => setMarketplaceConfig(prev => ({ ...prev, autoSyncStock: e.target.checked }))}
                    />
                    <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-3.5 after:width-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-orange-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">Kéo đơn hàng về để tạo phiếu đóng gói</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={marketplaceConfig.autoSyncOrders}
                      onChange={e => setMarketplaceConfig(prev => ({ ...prev, autoSyncOrders: e.target.checked }))}
                    />
                    <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-3.5 after:width-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              </div>
            </div>
        </Modal>
      )}

      {/* --- CUSTOM WEBHOOKS / OPENAPI NEW KEY CONFIG MODAL --- */}
      {activeConfigModal === 'webhook' && (
        <Modal
          title={createdKeyDetails ? "Client Key Đã Được Tạo Thành Công" : "Tạo mới OpenAPI Client Key"}
          icon={createdKeyDetails ? <ShieldCheck className="w-5 h-5 text-emerald-600" /> : <Key className="w-5 h-5 text-indigo-600" />}
          isOpen={activeConfigModal === 'webhook'}
          maxWidth="md"
          onClose={() => {
            if (createdKeyDetails) setCreatedKeyDetails(null);
            setActiveConfigModal(null);
          }}
          onConfirm={() => {
            if (createdKeyDetails) {
              setCreatedKeyDetails(null);
              setActiveConfigModal(null);
            } else {
              handleCreateApiKey();
            }
          }}
          confirmText={createdKeyDetails ? "Tôi đã lưu, đóng cửa sổ" : "Tạo Token Key"}
          confirmButtonClass={createdKeyDetails ? "bg-slate-900 hover:bg-slate-800 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"}
        >
          {createdKeyDetails ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Vui lòng sao chép Client Secret Key dưới đây. Bạn chỉ có thể xem khóa này <span className="font-bold text-red-500">một lần duy nhất</span> vì lý do bảo mật.
              </p>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <span className="font-mono text-[10px] text-slate-800 dark:text-slate-100 font-bold select-all flex-1 break-all">{createdKeyDetails}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(createdKeyDetails);
                    addNotification('Sao chép Key', 'Đã lưu OpenAPI Secret Key vào Clipboard.');
                  }}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-400"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Tên ứng dụng / Đối tác tích hợp</label>
                <input 
                  type="text" 
                  placeholder="ví dụ: Giao Hàng Tiết Kiệm (GHTK)"
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100"
                  value={newOpenApiKey.name || ''}
                  onChange={e => setNewOpenApiKey(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Gán Quyền Hạn (Scopes)</label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 max-h-[140px] overflow-y-auto">
                  {[
                    { id: 'orders.read', name: 'Đọc Đơn hàng' },
                    { id: 'orders.write', name: 'Tạo/Sửa Đơn hàng' },
                    { id: 'products.read', name: 'Đọc Sản phẩm' },
                    { id: 'products.write', name: 'Tạo/Sửa Sản phẩm' },
                    { id: 'inventory.read', name: 'Đọc Kho hàng' },
                    { id: 'customers.read', name: 'Đọc Khách hàng' }
                  ].map(scope => (
                    <label key={scope.id} className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400">
                      <input 
                        type="checkbox"
                        className="rounded text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                        checked={newOpenApiKey.scopes?.includes(scope.id) || false}
                        onChange={e => {
                          const current = newOpenApiKey.scopes || [];
                          if (e.target.checked) {
                            setNewOpenApiKey(prev => ({ ...prev, scopes: [...current, scope.id] }));
                          } else {
                            setNewOpenApiKey(prev => ({ ...prev, scopes: current.filter(s => s !== scope.id) }));
                          }
                        }}
                      />
                      <span className="text-[10px] font-semibold">{scope.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}

    </div>
  )}

`;

  // Find the exact line in content to split at
  const lines = content.split('\\n');
  let beforePart = content.substring(0, startIndex);
  
  // We need to find where the integration tab closes. The previous code showed it was:
  //         </div>
  //       )}
  //     </div>
  //   )}
  // 
  //  {activeTab === 'address' && (
  // We can just find the index of "{activeTab === 'address' && (" and work backwards to preserve everything from that line onwards.
  const addressMatch = content.indexOf("{activeTab === 'address' && (");
  
  // Actually, we just need to replace everything from startIndex to addressMatch
  // but preserving the `\n {activeTab === 'address' && (` part.
  const afterPart = content.substring(addressMatch);
  
  content = beforePart + replacement + "\\n\\n " + afterPart;
  console.log("Integration modals replaced successfully.");
  fs.writeFileSync(path, content);
} else {
  console.log("Could not find start or end strings.");
}
