const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'CustomerService.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add standard imports for ZNS Service
const importTarget = "import { getAiChatResponse } from '../services/geminiService';";
const importReplacement = `import { getAiChatResponse } from '../services/geminiService';
import { 
  getZnsLogs, 
  getZnsTemplates, 
  getZnsConfig, 
  saveZnsConfig, 
  saveZnsTemplates, 
  sendZnsNotification, 
  clearZnsLogs 
} from '../services/znsService';`;
content = content.replace(importTarget, importReplacement);

// 2. Wrap MOCK_TICKETS map inside the JSX body to refer to tickets state instead
content = content.replace(/\{MOCK_TICKETS\.map\(ticket => \(/g, '{tickets.map(ticket => (');

// 3. Update state setup in export function CustomerService()
const stateTargetRegex = /export function CustomerService\(\) \{\r?\n\s*const \[activeTab, setActiveTab\] = useState<'dashboard' \| 'tickets' \| 'campaigns' \| 'feedback' \| 'chat' \| 'calls' \| 'config' \| 'livechat' \| 'agents'>\('dashboard'\);/;
const stateReplacement = `export function CustomerService() {
  const [activeTab, setActiveTab] = useState<any>('dashboard');
  const [tickets, setTickets] = useState(MOCK_TICKETS);
  const [znsToast, setZnsToast] = useState<{ show: boolean, message: string, logContent: string } | null>(null);
  
  // Zalo ZNS state variables
  const [znsLogs, setZnsLogs] = useState<any[]>([]);
  const [znsTemplates, setZnsTemplates] = useState<any[]>([]);
  const [znsOaConnected, setZnsOaConnected] = useState<boolean>(true);
  
  const [testTemplateCode, setTestTemplateCode] = useState<string>('ZNS_ORDER_CONFIRMED');
  const [testCustomerName, setTestCustomerName] = useState<string>('Nguyễn Hữu Nghĩa');
  const [testPhone, setTestPhone] = useState<string>('0981234567');
  const [testVar1, setTestVar1] = useState<string>('ORD-2026');
  const [testVar2, setTestVar2] = useState<string>('1,850,000đ');

  const [logsSearchQuery, setLogsSearchQuery] = useState<string>('');

  useEffect(() => {
    setZnsLogs(getZnsLogs());
    setZnsTemplates(getZnsTemplates());
    setZnsOaConnected(getZnsConfig().isActive);

    const handleZnsLogAdded = (e: any) => {
      setZnsLogs(prev => [e.detail, ...prev]);
    };
    
    window.addEventListener('zns-log-added', handleZnsLogAdded);
    return () => {
      window.removeEventListener('zns-log-added', handleZnsLogAdded);
    };
  }, []);

  const handleToggleTemplate = (templateId: string) => {
    const updated = znsTemplates.map(t => t.id === templateId ? { ...t, isActive: !t.isActive } : t);
    setZnsTemplates(updated);
    saveZnsTemplates(updated);
  };

  const handleUpdateTemplateText = (templateId: string, newText: string) => {
    const updated = znsTemplates.map(t => t.id === templateId ? { ...t, contentTemplate: newText } : t);
    setZnsTemplates(updated);
    saveZnsTemplates(updated);
    setSuccessToast("Cập nhật mẫu tin ZNS thành công!");
  };

  const handleToggleZaloOA = () => {
    const newStatus = !znsOaConnected;
    setZnsOaConnected(newStatus);
    const config = getZnsConfig();
    config.isActive = newStatus;
    saveZnsConfig(config);
    setSuccessToast(newStatus ? "Đã bật kết nối Zalo OA & dịch vụ ZNS!" : "Đã tạm dừng kết nối Zalo OA.");
  };

  const handleSendTestZns = (e: React.FormEvent) => {
    e.preventDefault();
    if (!znsOaConnected) {
      alert("Zalo OA chưa kết nối! Vui lòng bật hoạt động để gửi.");
      return;
    }
    
    const activeTpl = znsTemplates.find(t => t.code === testTemplateCode);
    if (activeTpl && !activeTpl.isActive) {
      alert("Mẫu tin này đang bị tắt! Vui lòng kích hoạt mẫu tin.");
      return;
    }

    const vars: Record<string, string> = {
      'Tên_Khách_Hàng': testCustomerName,
      'Mã_Đơn_Hàng': testVar1,
      'Mã_Phiếu': testVar1,
      'Tổng_Tiền': testVar2,
      'Trạng_Thái': 'Đang vận chuyển',
      'Đơn_Vị_Vận_Chuyển': 'GHN Fast',
      'Mã_Vận_Đơn': 'GHN-VN-48201',
      'Tiêu_Đề': 'Yêu cầu thẩm định RMA',
      'Nội_Dung_Phản_Hồi': 'Phản hồi CSKH mẫu: Chúng tôi đã tiếp nhận ý kiến của khách hàng.'
    };

    const log = sendZnsNotification(testPhone, testTemplateCode, vars, {
      customerName: testCustomerName,
      ticketId: testTemplateCode.includes('TICKET') ? testVar1 : undefined,
      orderId: testTemplateCode.includes('ORDER') ? testVar1 : undefined
    });

    setZnsToast({
      show: true,
      message: \`Đã gửi tin nhắn Zalo ZNS thành công tới SĐT \${testPhone}!\`,
      logContent: log.content
    });
  };

  const handleCloseTicket = (ticket: any, replyText: string) => {
    // Update ticket in state
    setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: 'closed' } : t));
    
    const textOfReply = replyText.trim() || 'Chào anh/chị, yêu cầu hỗ trợ của anh/chị đã được giải quyết hoàn tất và bộ phận CSKH xin phép được đóng phiếu yêu cầu.';
    
    // Variables for ZNS replies
    const variables = {
      'Tên_Khách_Hàng': ticket.customerName,
      'Mã_Phiếu': ticket.id,
      'Tiêu_Đề': ticket.subject,
      'Nội_Dung_Phản_Hồi': textOfReply.length > 50 ? textOfReply.slice(0, 50) + '...' : textOfReply
    };
    
    // Send ZNS Notifications via service
    const log1 = sendZnsNotification('0912345678', 'ZNS_TICKET_REPLIED', variables, {
      ticketId: ticket.id,
      customerName: ticket.customerName
    });

    const closeVariables = {
      'Tên_Khách_Hàng': ticket.customerName,
      'Mã_Phiếu': ticket.id
    };
    sendZnsNotification('0912345678', 'ZNS_TICKET_CLOSED', closeVariables, {
      ticketId: ticket.id,
      customerName: ticket.customerName
    });

    setZnsToast({
      show: true,
      message: \`Ticket \${ticket.id} đã đóng! Đã gửi thông báo ZNS tự động cho khách hàng \${ticket.customerName}.\`,
      logContent: log1.content
    });

    setDraftedMessage('');
    setSelectedTicket(null);
  };`;

if (stateTargetRegex.test(content)) {
  content = content.replace(stateTargetRegex, stateReplacement);
  console.log('Successfully added ZNS state variables and helper hooks!');
} else {
  console.error('Could not find state target regex in CustomerService.tsx!');
}

// 4. Update the Gửi & Đóng Ticket button call
const closeBtnStr = `<button className="bg-slate-900 text-\\[#FAF9F5\\] px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-800 transition-all">\\r?\\n\\s*Gửi & Đóng Ticket\\r?\\n\\s*<\/button>`;
const closeBtnRegex = new RegExp(closeBtnStr, 'g');
const closeBtnReplacement = `<button 
   onClick={() => handleCloseTicket(selectedTicket, draftedMessage)}
   className="bg-slate-900 text-[#FAF9F5] px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-800 transition-all font-mono"
  >
  Gửi & Đóng Ticket
  </button>`;

if (closeBtnRegex.test(content)) {
  content = content.replace(closeBtnRegex, closeBtnReplacement);
  console.log('Successfully hooked Close Ticket button action!');
} else {
  // Let's try simpler exact string search replacement
  const exactButton = `<button className="bg-slate-900 text-[#FAF9F5] px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-800 transition-all">
 Gửi & Đóng Ticket
 </button>`;
  const targetReplace = `<button 
    onClick={() => handleCloseTicket(selectedTicket, draftedMessage)}
    className="bg-slate-900 text-[#FAF9F5] px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-800 transition-all"
  >
  Gửi & Đóng Ticket
  </button>`;
  if (content.indexOf(exactButton) !== -1) {
    content = content.replace(exactButton, targetReplace);
    console.log('Successfully hooked Close Ticket button action (via exact match)!');
  } else {
    console.error('Could not find close ticket button markup!');
  }
}

// 5. Add custom 'zalo_zns' tab button in the navigation tabs list
const campaignBtnStr = `<button \r?\n\s*onClick\=\{\(\) \=\> setActiveTab\('config'\)\}\r?\n\s*className\=\{cn\("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0", activeTab === 'config' \? "bg-white text-slate-900 shadow-sm border border-slate-300" : "text-slate-600 hover:bg-slate-100"\)\}\r?\n\s*>\r?\n\s*<Settings className="w-4 h-4" \/> Cấu hình Kênh\r?\n\s*<\/button>`;
// Let's locate settings button via simple replace
const tabButtonsTarget = `<Settings className="w-4 h-4" /> Cấu hình Kênh
 </button>`;
const tabButtonsReplacement = `<Settings className="w-4 h-4" /> Cấu hình Kênh
 </button>
 <button 
 onClick={() => setActiveTab('zalo_zns')}
 className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0", activeTab === 'zalo_zns' ? "bg-white text-blue-700 shadow-sm border border-blue-200" : "text-slate-600 hover:bg-slate-100")}
 >
 <MessageSquare className="w-4 h-4 text-blue-600" /> Bản tin Zalo ZNS
 </button>`;

if (content.indexOf(tabButtonsTarget) !== -1) {
  content = content.replace(tabButtonsTarget, tabButtonsReplacement);
  console.log('Successfully inserted Zalo ZNS tab link!');
} else {
  console.error('Could not locate tabButtonsTarget in CustomerService.tsx');
}

// 6. Define the ZNS Tab content layout inside the main rendered UI block
const closingBrace = `  {/* Ticket Detail / AI Reply Slide-over */}
  <AnimatePresence>
  {selectedTicket && (`;

const znsLayoutMarkup = `  {activeTab === 'zalo_zns' && (
   <div className="p-6 bg-slate-50 min-h-[600px] space-y-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5 gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900 text-xl flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600" /> Hệ thống Zalo Notification Service (ZNS)
          </h3>
          <span className="bg-blue-100 text-blue-700 font-bold px-2.5 py-0.5 rounded-full text-[10.5px] border border-blue-200 uppercase tracking-wide">
            Cơ chế Auto
          </span>
        </div>
        <p className="text-xs text-slate-600 mt-1">Cấu hình API kết nối ZNS với Zalo Cloud, chỉnh sửa kịch bản mẫu tin, theo dõi kiểm tra và truy xuất nhật ký tin nhắn gửi tự động.</p>
      </div>
      
      {/* Quick Power Switch */}
      <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-300 shadow-sm shrink-0">
        <span className="text-xs font-bold text-slate-700">Trạng thái kết nối:</span>
        <button 
          onClick={handleToggleZaloOA}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-900",
            znsOaConnected ? "bg-blue-600" : "bg-slate-300"
          )}
        >
          <span className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
            znsOaConnected ? "translate-x-5" : "translate-x-0"
          )} />
        </button>
        <span className={cn("text-xs font-black uppercase", znsOaConnected ? "text-emerald-600 animate-pulse" : "text-slate-400")}>
          {znsOaConnected ? "Đã liên kết" : "Hủy kết nối"}
        </span>
      </div>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left Columns: Config & Send Test */}
      <div className="space-y-6 xl:col-span-1">
        {/* Connection detail card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Zalo Official Account Linkage</p>
          <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-lg">Z</div>
            <div>
              <p className="text-xs font-bold text-slate-900">VComm Official Store OA</p>
              <p className="text-[10px] text-slate-500 font-mono">ID: 2938475928374928</p>
            </div>
            <span className="ml-auto bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-100 text-[10px]">Verified OA</span>
          </div>
          
          <div className="space-y-3.5 pt-1">
            <div>
              <span className="text-[10.5px] font-bold text-slate-500 block mb-1">Zalo App ID</span>
              <input type="text" readOnly value="142345234523" className="w-full bg-slate-100/70 text-xs font-mono text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none" />
            </div>
            <div>
              <span className="text-[10.5px] font-bold text-slate-500 block mb-1">Access Token</span>
              <input type="password" readOnly value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." className="w-full bg-slate-100/70 text-xs font-mono text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none" />
            </div>
          </div>
        </div>

        {/* Send Test Box */}
        <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">CSKH Sandbox - Gửi Thử Tin ZNS</p>
          <form onSubmit={handleSendTestZns} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Chọn mẫu tin nhắn ZNS:</label>
              <select 
                value={testTemplateCode}
                onChange={(e) => setTestTemplateCode(e.target.value)}
                className="w-full border border-slate-300 rounded-lg text-xs font-semibold p-2 bg-white cursor-pointer"
              >
                {znsTemplates.map(t => (
                  <option key={t.code} value={t.code}>{t.name} ({t.code})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tên khách hàng:</label>
                <input 
                  type="text" 
                  value={testCustomerName}
                  onChange={(e) => setTestCustomerName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg text-xs p-2 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Số điện thoại nhận:</label>
                <input 
                  type="text" 
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg text-xs font-mono p-2 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3.5 space-y-3.5">
              <p className="text-[10px] font-bold text-blue-600">THAM SỐ BIẾN SỐ (Template Variables)</p>
              <div>
                <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                  {testTemplateCode.includes('TICKET') ? 'Mã phiếu hỗ trợ ([Mã_Phiếu]):' : 'Mã đơn hàng ([Mã_Đơn_Hàng]):'}
                </label>
                <input 
                  type="text" 
                  value={testVar1}
                  onChange={(e) => setTestVar1(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg text-xs p-2"
                />
              </div>
              {!testTemplateCode.includes('TICKET') && (
                <div>
                  <label className="text-[10.5px] font-bold text-slate-600 block mb-1">Tổng giá trị đơn ([Tổng_Tiền]):</label>
                  <input 
                    type="text" 
                    value={testVar2}
                    onChange={(e) => setTestVar2(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg text-xs p-2"
                  />
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={!znsOaConnected}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 mt-2"
            >
              <Send className="w-3.5 h-3.5" /> Gửi truyền dẫn ZNS (Test API)
            </button>
          </form>
        </div>
      </div>

      {/* Middle & Right columns: Templates and running log streams */}
      <div className="xl:col-span-2 space-y-6">
        {/* Templates Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Các Mẫu Tin Bản Tin Configured</p>
          <div className="space-y-4">
            {znsTemplates.map((template) => (
              <div key={template.id} className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50/50 transition duration-250">
                <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 block">{template.id} • {template.code}</span>
                    <h5 className="font-bold text-slate-900 text-sm mt-0.5">{template.name}</h5>
                    <p className="text-xs text-slate-500 mt-0.5">{template.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        const newTxt = prompt("Chỉnh sửa nội dung kịch bản mẫu tin:", template.contentTemplate);
                        if (newTxt !== null && newTxt.trim() !== "") {
                          handleUpdateTemplateText(template.id, newTxt);
                        }
                      }}
                      className="text-[10.5px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition border border-blue-200"
                    >
                      Sửa kịch bản
                    </button>
                    
                    <button 
                      onClick={() => handleToggleTemplate(template.id)}
                      className={cn(
                        "text-[10.5px] font-bold px-2.5 py-1 rounded transition border",
                        template.isActive 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-slate-100 text-slate-400 border-slate-200"
                      )}
                    >
                      {template.isActive ? "Hoạt động" : "Tạm tắt"}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950/95 text-slate-350 p-3 rounded-lg border border-slate-800 font-mono text-[11px] leading-relaxed relative group">
                  <span className="absolute top-1 right-2 text-[8px] font-bold text-slate-600 uppercase tracking-widest">Kịch bản</span>
                  {template.contentTemplate}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-Time Sent logs list */}
        <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 mb-4 gap-3">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nhật Ký Truyền Dẫn Tin Nhắn (ZNS Sent Stream)</p>
              <p className="text-xs text-slate-500 mt-1">Lịch sử toàn bộ các tin nhắn tự động được kích hoạt gửi thành công thông qua API.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Lọc SĐT, tên..." 
                value={logsSearchQuery}
                onChange={(e) => setLogsSearchQuery(e.target.value)}
                className="border border-slate-300 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
              />
              <button 
                onClick={() => {
                  clearZnsLogs();
                  setZnsLogs([]);
                  setSuccessToast("Đã dọn dẹp nhật ký!");
                }}
                className="text-[10.5px] font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 bg-slate-100 px-2.5 py-1.5 rounded transition border border-slate-200 shrink-0"
              >
                Xóa tất cả
              </button>
            </div>
          </div>

          <div className="overflow-x-auto min-h-[250px] max-h-[450px] custom-scrollbar overflow-y-auto">
            {znsLogs.filter(l => 
              l.customerName.toLowerCase().includes(logsSearchQuery.toLowerCase()) ||
              l.recipientPhone.includes(logsSearchQuery) ||
              l.templateName.toLowerCase().includes(logsSearchQuery.toLowerCase())
            ).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                <MessageSquare className="w-10 h-10 text-slate-200 mb-2" />
                <p className="text-xs font-semibold">Chưa phát sinh lượt gửi tin nhắn ZNS nào.</p>
                <p className="text-[10px] text-slate-400 mt-1">Cập nhật đơn hàng, đóng ticket hỗ trợ hoặc gửi test để phát sinh nhật ký!</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10.5px] font-bold text-slate-500 uppercase">
                    <th className="py-2.5">Thời gian</th>
                    <th className="py-2.5">Khách hàng / SĐT</th>
                    <th className="py-2.5">Mẫu tin</th>
                    <th className="py-2.5">Nội dung đã gửi</th>
                    <th className="py-2.5 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {znsLogs.filter(l => 
                    l.customerName.toLowerCase().includes(logsSearchQuery.toLowerCase()) ||
                    l.recipientPhone.includes(logsSearchQuery) ||
                    l.templateName.toLowerCase().includes(logsSearchQuery.toLowerCase())
                  ).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-mono text-[10.5px] text-slate-600 whitespace-nowrap pr-2">{log.sentAt}</td>
                      <td className="py-3 whitespace-nowrap pr-2">
                        <p className="font-bold text-slate-900">{log.customerName}</p>
                        <p className="text-[10.5px] text-slate-600 font-mono font-medium">{log.recipientPhone}</p>
                      </td>
                      <td className="py-3 whitespace-nowrap pr-2">
                        <span className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded text-[10px] border border-slate-200">
                          {log.templateName}
                        </span>
                        {log.orderId && <p className="text-[9.5px] text-blue-600 font-bold mt-1">Đơn {log.orderId}</p>}
                        {log.ticketId && <p className="text-[9.5px] text-purple-600 font-bold mt-1">Ticket {log.ticketId}</p>}
                      </td>
                      <td className="py-3 text-slate-600 pr-4 leading-relaxed font-sans max-w-xs">{log.content}</td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                          log.status === 'read' ? "bg-emerald-100 text-emerald-700" :
                          log.status === 'delivered' ? "bg-blue-100 text-blue-700" :
                          log.status === 'sent' ? "bg-amber-100 text-amber-700" :
                          "bg-rose-100 text-rose-700"
                        )}>
                          {log.statusLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
   </div>
  )}

${closingBrace}`;

content = content.replace(closingBrace, znsLayoutMarkup);

// 8. Place the Toast floating panel markup inside the JSX before the very final return closing tag
const finalGridClosing = /<\/div>\s*<\/div>\s*<\/div>\s*\);\r?\n\s*\}/;
const finalGridMatch = content.match(finalGridClosing);

if (finalGridMatch) {
  const znsToastMarkup = `
  {/* Zalo ZNS Sentinel Success Floating Toast */}
  {znsToast && znsToast.show && (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-950 border border-blue-500/50 text-[#FAF9F5] rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shrink-0 shadow">
          Z
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black tracking-widest text-blue-400 uppercase">Zalo Notification Service (ZNS)</p>
          <p className="text-xs font-semibold text-slate-100 mt-1 leading-snug">{znsToast.message}</p>
          
          <div className="mt-3 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-mono">Bản tin đã gửi:</p>
            <p className="text-[11px] text-slate-350 font-mono leading-relaxed max-h-24 overflow-y-auto">
              {znsToast.logContent}
            </p>
          </div>
          
          <div className="flex items-center justify-between mt-3 text-[10px]">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              ● Đã chuyển tiếp thành công
            </span>
            <button 
              onClick={() => setZnsToast(null)}
              className="font-bold text-slate-450 hover:text-slate-100 underline transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )}
  `;
  content = content.replace(finalGridMatch[0], znsToastMarkup + finalGridMatch[0]);
  console.log('Successfully added ZNS floating toast container!');
} else {
  console.error('Could not find final return grid closing structure!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('CustomerService.tsx patched successfully!');
