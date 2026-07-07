import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Trash2, 
  Star, 
  Inbox, 
  FileText, 
  Search, 
  Plus, 
  ArrowLeft, 
  Download, 
  CornerUpLeft, 
  CornerUpRight, 
  Check, 
  X, 
  RefreshCw,
  Folder,
  AlertCircle,
  Paperclip,
  CheckCircle2,
  Settings,
  Bold,
  Italic,
  Underline,
  Palette
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNotifications } from '../context/NotificationContext';
import { MOCK_MEMBERS } from '../types/task';

interface EmailAttachment {
  name: string;
  size: string;
  type: string;
}

interface EmailItem {
  id: string;
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  preview: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  isFlagged: boolean;
  folder: 'inbox' | 'sent' | 'drafts' | 'trash';
  attachments?: EmailAttachment[];
}

const INITIAL_EMAILS: EmailItem[] = [
  {
    id: 'em-1',
    senderName: 'Microsoft 365 Team',
    senderEmail: 'no-reply@microsoft.com',
    recipientEmail: 'vinhnt@vcomm.vn',
    subject: 'Chào mừng bạn đến với Microsoft 365 dành cho doanh nghiệp',
    preview: 'Tài khoản Office của bạn đã được kích hoạt thành công. Tìm hiểu cách cài đặt các ứng dụng Outlook, Teams, Word...',
    body: `Chào Vinh,\n\nChào mừng bạn đến với dịch vụ Microsoft 365 Business Premium! Tài khoản của bạn đã được kích hoạt thành công và được gán giấy phép đầy đủ bởi ban quản trị VComm ERP.\n\nHãy bắt đầu cài đặt Outlook trên điện thoại và máy tính để đồng bộ lịch họp và hộp thư này.\n\nTrân trọng,\nĐội ngũ Microsoft 365`,
    timestamp: '09:15 AM (Hôm nay)',
    isRead: false,
    isFlagged: true,
    folder: 'inbox',
    attachments: [
      { name: 'Huong_dan_cai_dat_Outlook.pdf', size: '1.4 MB', type: 'pdf' }
    ]
  },
  {
    id: 'em-2',
    senderName: 'Lê Hoàng Minh (Vận hành Sàn)',
    senderEmail: 'minh.lh@vcomm.vn',
    recipientEmail: 'vinhnt@vcomm.vn',
    subject: 'Yêu cầu duyệt biên bản đối soát doanh số tuần 22',
    preview: 'Tôi gửi kèm file Excel biên bản đối soát doanh thu siêu thị VComm. Vui lòng duyệt trước 5:00 PM hôm nay...',
    body: `Anh Vinh thân mến,\n\nEm gửi biên bản đối soát chi tiết của tuần 22 cho toàn chuỗi siêu thị VComm và các gian hàng trực tuyến đối tác.\n\nAnh xem qua file Excel đính kèm và duyệt giúp em trên hệ thống kế toán nội bộ nhé. Có một vài khoản chênh lệch nhỏ đã được hạch toán tạm vào TK 3388 như anh chỉ đạo.\n\nCảm ơn anh,\nLê Hoàng Minh`,
    timestamp: 'Hôm qua',
    isRead: false,
    isFlagged: false,
    folder: 'inbox',
    attachments: [
      { name: 'Doi_soat_doanh_thu_T22_VComm.xlsx', size: '420 KB', type: 'xlsx' },
      { name: 'Bien_ban_xac_nhan.pdf', size: '850 KB', type: 'pdf' }
    ]
  },
  {
    id: 'em-3',
    senderName: 'Google Workspace',
    senderEmail: 'workspace-noreply@google.com',
    recipientEmail: 'vinhnt@vcomm.vn',
    subject: 'Cảnh báo bảo mật: Thiết bị mới đăng nhập tài khoản Google Workspace của bạn',
    preview: 'Tài khoản Google Workspace của bạn vừa được đăng nhập từ một thiết bị Windows 11 tại khu vực Hà Nội...',
    body: `Chào bạn,\n\nGoogle vừa phát hiện một thiết bị Windows 11 mới đăng nhập vào tài khoản Google Workspace (support@vcomm.vn) của bạn lúc 08:30 AM.\n\nNếu đây là bạn, không cần thực hiện thêm hành động nào. Nếu không, hãy đổi mật khẩu ngay lập tức và kiểm tra nhật ký kiểm toán AI.\n\nThân ái,\nGoogle Security Team`,
    timestamp: '08:30 AM (Hôm nay)',
    isRead: true,
    isFlagged: false,
    folder: 'inbox'
  },
  {
    id: 'em-4',
    senderName: 'Bạn (Vinh NT)',
    senderEmail: 'vinhnt@vcomm.vn',
    recipientEmail: 'ceo@vcomm.vn',
    subject: 'Báo cáo tiến độ nâng cấp phân hệ Settings & Security Enterprise',
    preview: 'Gửi anh báo cáo tiến độ. Đã hoàn thành bộ chẩn đoán DNS, AI Audit logs và COA. Đang chạy test case...',
    body: `Kính gửi Ban Giám đốc,\n\nTôi xin báo cáo tiến độ nâng cấp phân hệ Settings Enterprise:\n1. Đã hoàn thành Domain Diagnostic Engine trỏ DNS Vercel.\n2. Tích hợp AI Security Auditor alerts & logs.\n3. Xây dựng xong No-Code trigger rules (IF-THEN).\n4. Ràng buộc tài khoản kế toán chi tiết COA hoạt động ổn định.\n\nToàn bộ test suite đã pass 70/70 tests. Gửi anh xem bản báo cáo chi tiết đính kèm.\n\nTrân trọng,\nVinh NT`,
    timestamp: '02:40 AM (Hôm nay)',
    isRead: true,
    isFlagged: true,
    folder: 'sent',
    attachments: [
      { name: 'Bao_cao_Settings_Enterprise.pdf', size: '2.1 MB', type: 'pdf' }
    ]
  }
];

export function MailClient() {
  const { addNotification } = useNotifications();
  
  // Connection states
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    return localStorage.getItem('vcomm_mail_connected') === 'true';
  });
  const [accountType, setAccountType] = useState<'google' | 'microsoft' | null>(() => {
    return localStorage.getItem('vcomm_mail_account_type') as any || null;
  });
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem('vcomm_mail_user_email') || '';
  });
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [showOauthPopup, setShowOauthPopup] = useState<boolean>(false);

  // Live/Mock config states
  const [apiMode, setApiMode] = useState<'mock' | 'live'>(() => {
    return localStorage.getItem('vcomm_mail_api_mode') as any || 'mock';
  });
  const [clientId, setClientId] = useState(() => localStorage.getItem('vcomm_mail_client_id') || '');
  const [clientSecret, setClientSecret] = useState(() => localStorage.getItem('vcomm_mail_client_secret') || '');
  const [tenantId, setTenantId] = useState(() => localStorage.getItem('vcomm_mail_tenant_id') || '');
  const [scope, setScope] = useState(() => localStorage.getItem('vcomm_mail_scope') || 'https://graph.microsoft.com/Mail.ReadWrite');
  
  // Mailbox states
  const [emails, setEmails] = useState<EmailItem[]>(() => {
    const saved = localStorage.getItem('vcomm_mailbox_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_EMAILS;
      }
    }
    return INITIAL_EMAILS;
  });
  
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'drafts' | 'trash' | 'flagged' | 'settings'>('inbox');
  const [selectedMailId, setSelectedMailId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterUnread, setFilterUnread] = useState<boolean>(false);
  const [showComposeModal, setShowComposeModal] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
  // New mail state
  const [newMail, setNewMail] = useState({
    to: '',
    subject: '',
    body: '',
    attachments: [] as EmailAttachment[]
  });
  const [showAutocomplete, setShowAutocomplete] = useState<boolean>(false);
  
  // Save mail client state
  useEffect(() => {
    localStorage.setItem('vcomm_mailbox_data', JSON.stringify(emails));
  }, [emails]);

  useEffect(() => {
    localStorage.setItem('vcomm_mail_connected', String(isConnected));
    if (accountType) localStorage.setItem('vcomm_mail_account_type', accountType);
    else localStorage.removeItem('vcomm_mail_account_type');
    localStorage.setItem('vcomm_mail_user_email', userEmail);
    localStorage.setItem('vcomm_mail_api_mode', apiMode);
    localStorage.setItem('vcomm_mail_client_id', clientId);
    localStorage.setItem('vcomm_mail_client_secret', clientSecret);
    localStorage.setItem('vcomm_mail_tenant_id', tenantId);
    localStorage.setItem('vcomm_mail_scope', scope);
  }, [isConnected, accountType, userEmail, apiMode, clientId, clientSecret, tenantId, scope]);

  // Connect Simulation
  const handleStartConnection = (type: 'google' | 'microsoft') => {
    setAccountType(type);
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setShowOauthPopup(true);
    }, 800);
  };

  const handleConfirmOauth = () => {
    setShowOauthPopup(false);
    setIsConnected(true);
    const mockEmail = accountType === 'google' ? 'support@vcomm.vn' : 'vinhnt@vcomm.vn';
    setUserEmail(mockEmail);
    addNotification('Kết nối email', `Đã liên kết thành công tài khoản ${mockEmail} qua ${accountType === 'google' ? 'Google Workspace' : 'Microsoft 365'}.`);
  };

  const handleDisconnect = () => {
    if (confirm('Bạn có chắc muốn ngắt kết nối tài khoản email cá nhân này không?')) {
      setIsConnected(false);
      setAccountType(null);
      setUserEmail('');
      setSelectedMailId(null);
      addNotification('Ngắt kết nối email', 'Đã hủy liên kết tài khoản email.');
    }
  };

  // Sync simulated emails
  const handleSyncMail = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      
      // Simulate receiving a new email
      const hasNew = Math.random() > 0.4;
      if (hasNew) {
        const newMailItem: EmailItem = {
          id: `em-${Date.now()}`,
          senderName: 'Nguyễn Diệu Nhi (Marketing)',
          senderEmail: 'nhi.nd@vcomm.vn',
          recipientEmail: userEmail,
          subject: '📊 Đề xuất ngân sách chạy chiến dịch quảng cáo TikTok Ads tuần 23',
          preview: 'Gửi anh duyệt bảng đề xuất kinh phí chạy Ads cho chiến dịch siêu sale ngày 6/6 sắp tới...',
          body: `Chào anh Vinh,\n\nBên em đã lên ngân sách chi tiết cho đợt chạy quảng cáo TikTok Shop và Facebook Reels đón đầu chiến dịch 6/6 sắp tới.\n\nDự kiến ngân sách đề xuất là 45.000.000đ. Chi tiết hạng mục em đính kèm trong biên bản trình ký bên Request Hub.\n\nAnh xem duyệt sớm giúp em nhé!\n\nNhi ND`,
          timestamp: 'Vừa xong',
          isRead: false,
          isFlagged: false,
          folder: 'inbox'
        };
        setEmails(prev => [newMailItem, ...prev]);
        addNotification('Email mới', 'Bạn vừa nhận được 1 email mới từ Nguyễn Diệu Nhi.');
      } else {
        addNotification('Đồng bộ email', 'Hộp thư của bạn đã được cập nhật.');
      }
    }, 1200);
  };

  // Actions
  const toggleFlag = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEmails(prev => prev.map(m => m.id === id ? { ...m, isFlagged: !m.isFlagged } : m));
  };

  const deleteMail = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEmails(prev => prev.map(m => {
      if (m.id === id) {
        if (m.folder === 'trash') {
          // Permanently delete
          return null;
        } else {
          // Move to trash
          return { ...m, folder: 'trash' as const };
        }
      }
      return m;
    }).filter((m): m is EmailItem => m !== null));
    
    if (selectedMailId === id) {
      setSelectedMailId(null);
    }
    addNotification('Xóa email', 'Đã di chuyển email vào Thùng rác.');
  };

  const handleSendMail = () => {
    if (!newMail.to || !newMail.subject) {
      alert('Vui lòng điền thông tin người nhận và tiêu đề.');
      return;
    }
    
    const sentItem: EmailItem = {
      id: `em-${Date.now()}`,
      senderName: 'Bạn (Vinh NT)',
      senderEmail: userEmail,
      recipientEmail: newMail.to,
      subject: newMail.subject,
      preview: newMail.body.slice(0, 80) + '...',
      body: newMail.body,
      timestamp: 'Vừa gửi',
      isRead: true,
      isFlagged: false,
      folder: 'sent',
      attachments: newMail.attachments
    };

    setEmails(prev => [sentItem, ...prev]);
    addNotification('Gửi Email', `Đã gửi thành công email tới ${newMail.to}`);
    setShowComposeModal(false);
    setNewMail({ to: '', subject: '', body: '', attachments: [] });
  };

  const handleSelectMail = (id: string) => {
    setSelectedMailId(id);
    setEmails(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
  };

  const handleReply = (type: 'reply' | 'forward', mail: EmailItem) => {
    setNewMail({
      to: type === 'reply' ? mail.senderEmail : '',
      subject: type === 'reply' ? `Re: ${mail.subject}` : `Fwd: ${mail.subject}`,
      body: `\n\n--- Vào ${mail.timestamp}, ${mail.senderName} <${mail.senderEmail}> đã viết: ---\n> ${mail.body.replace(/\n/g, '\n> ')}`,
      attachments: []
    });
    setShowComposeModal(true);
  };

  // Get active emails list
  const activeFolderEmails = emails.filter(m => {
    if (activeFolder === 'flagged') return m.isFlagged && m.folder !== 'trash';
    return m.folder === activeFolder;
  });

  const searchedEmails = activeFolderEmails.filter(m => {
    const matchesSearch = 
      (m.subject?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
      (m.senderName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
      (m.senderEmail?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (m.body?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesUnread = filterUnread ? !m.isRead : true;
    return matchesSearch && matchesUnread;
  });

  const selectedMail = emails.find(m => m.id === selectedMailId);
  const unreadCount = emails.filter(m => m.folder === 'inbox' && !m.isRead).length;

  return (
    <div className="bg-white rounded-lg border border-slate-300 shadow-sm h-[calc(100vh-180px)] overflow-hidden flex flex-col animate-in fade-in duration-500">
      
      {/* ── NOT CONNECTED SCREEN ── */}
      {!isConnected ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 space-y-8 select-none">
          <div className="max-w-md space-y-4">
            <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center mx-auto border border-primary-100 shadow-xs">
              <Mail className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">Liên kết Hộp thư Cá nhân</h2>
              <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
                VComm ERP hỗ trợ tích hợp sâu tài khoản email công tác của bạn thông qua giao thức API an toàn. Kết nối để quản lý thư ngay tại chỗ.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg w-full">
            {/* Google Workspace Card */}
            <button 
              onClick={() => handleStartConnection('google')}
              disabled={isConnecting}
              className="bg-white p-5 rounded-lg border border-slate-250 hover:border-blue-400 hover:shadow-xs transition duration-150 flex flex-col items-center justify-center gap-3 text-center cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 font-bold text-slate-650 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">G</div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Google Workspace</span>
                <span className="text-[10px] text-slate-450 mt-0.5 block">Kết nối hộp thư Gmail API</span>
              </div>
            </button>

            {/* Microsoft 365 Card */}
            <button 
              onClick={() => handleStartConnection('microsoft')}
              disabled={isConnecting}
              className="bg-white p-5 rounded-lg border border-slate-250 hover:border-blue-400 hover:shadow-xs transition duration-150 flex flex-col items-center justify-center gap-3 text-center cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 font-bold text-slate-650 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">M</div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Microsoft Outlook 365</span>
                <span className="text-[10px] text-slate-450 mt-0.5 block">Kết nối tài khoản Microsoft Graph API</span>
              </div>
            </button>
          </div>

          {isConnecting && (
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-650" />
              <span>Đang mở trình bảo mật kết nối...</span>
            </div>
          )}
        </div>
      ) : (
        
        // ── MAIL CLIENT MAIN WORKSPACE ──
        <div className="flex-1 flex overflow-hidden">
          
          {/* 1. Left Navigation Sidebar */}
          <div className="w-[220px] bg-slate-50 border-r border-slate-200 p-4 flex flex-col justify-between shrink-0">
            <div className="space-y-6">
              {/* Compose button */}
              <button 
                onClick={() => {
                  setNewMail({ to: '', subject: '', body: '', attachments: [] });
                  setShowComposeModal(true);
                }}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Plus className="w-4 h-4" /> Soạn thư
              </button>

              {/* Folders List */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block px-3">Hộp thư</span>
                <div className="space-y-0.5">
                  {[
                    { id: 'inbox', label: 'Hộp thư đến', icon: Inbox, count: unreadCount },
                    { id: 'flagged', label: 'Gắn dấu sao', icon: Star },
                    { id: 'sent', label: 'Đã gửi', icon: Send },
                    { id: 'drafts', label: 'Bản nháp', icon: FileText },
                    { id: 'trash', label: 'Thùng rác', icon: Trash2 },
                    { id: 'settings', label: 'Cấu hình kết nối', icon: Settings }
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveFolder(item.id as any);
                        setSelectedMailId(null);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer border-0 bg-transparent text-left",
                        activeFolder === item.id 
                          ? "bg-slate-200 text-primary-600 font-bold" 
                          : "text-slate-650 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className={cn("w-4 h-4", activeFolder === item.id ? "text-primary-600" : "text-slate-450")} />
                        <span>{item.label}</span>
                      </div>
                      {item.count !== undefined && item.count > 0 && (
                        <span className="bg-blue-100 text-primary-600 font-bold px-2 py-0.5 rounded-full text-[9px] shadow-3xs">{item.count}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Profile / Account Status */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 select-none">
                  {userEmail[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-905 block truncate leading-tight">{userEmail}</span>
                  <span className="text-[9px] text-slate-400 font-medium block capitalize">{accountType} Linked 🟢</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleSyncMail} 
                  disabled={isSyncing}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[9px] font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  <RefreshCw className={cn("w-3 h-3 text-slate-500", isSyncing && "animate-spin")} /> Đồng bộ
                </button>
                <button 
                  onClick={handleDisconnect}
                  className="py-1.5 px-2 bg-red-50 hover:bg-red-100 rounded-lg text-[9px] font-bold text-red-650 flex items-center justify-center cursor-pointer border-0"
                >
                  Rời
                </button>
              </div>
            </div>
          </div>

          {activeFolder === 'settings' ? (
            <div className="flex-1 bg-slate-50 p-6 overflow-y-auto space-y-6">
              <div className="max-w-2xl mx-auto space-y-6 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-650" />
                    Cấu hình Kết nối API Hộp thư cá nhân
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Thiết lập kết nối bảo mật tới hộp thư doanh nghiệp của bạn thông qua giao thức OAuth/API của Google Workspace hoặc Microsoft Azure AD.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nhà cung cấp:</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAccountType('google');
                          setUserEmail('support@vcomm.vn');
                        }}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer",
                          accountType === 'google' ? "bg-primary-50 border-blue-500 text-primary-600" : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
                        )}
                      >
                        Google Workspace
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAccountType('microsoft');
                          setUserEmail('vinhnt@vcomm.vn');
                        }}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer",
                          accountType === 'microsoft' ? "bg-primary-50 border-blue-500 text-primary-600" : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
                        )}
                      >
                        Microsoft 365
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chế độ hoạt động:</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setApiMode('mock')}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer",
                          apiMode === 'mock' ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
                        )}
                      >
                        Mô phỏng (Mock)
                      </button>
                      <button
                        type="button"
                        onClick={() => setApiMode('live')}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer",
                          apiMode === 'live' ? "bg-primary-600 border-blue-600 text-white" : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
                        )}
                      >
                        Live API
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client ID (Application ID):</label>
                      <input
                        type="text"
                        value={clientId}
                        onChange={e => setClientId(e.target.value)}
                        placeholder="Ví dụ: 8a7d3910-349c-4621-a1b0-2b10df04acb2"
                        className="w-full p-2.5 bg-slate-50 border border-slate-250 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client Secret (Mã khóa bảo mật):</label>
                      <input
                        type="password"
                        value={clientSecret}
                        onChange={e => setClientSecret(e.target.value)}
                        placeholder="••••••••••••••••••••••••"
                        className="w-full p-2.5 bg-slate-50 border border-slate-250 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {accountType === 'microsoft' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tenant ID (Azure AD):</label>
                        <input
                          type="text"
                          value={tenantId}
                          onChange={e => setTenantId(e.target.value)}
                          placeholder="Ví dụ: common hoặc ID thư mục"
                          className="w-full p-2.5 bg-slate-50 border border-slate-250 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    )}
                    <div className="space-y-1 col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">API Scope Permissions:</label>
                      <input
                        type="text"
                        value={scope}
                        onChange={e => setScope(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-250 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "w-3 h-3 rounded-full flex shrink-0",
                      isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                    )} />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Trạng thái: {isConnected ? `Đã liên kết qua ${accountType === 'google' ? 'Google Workspace' : 'Microsoft 365'}` : 'Chưa liên kết'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {isConnected ? `Địa chỉ email hoạt động: ${userEmail}` : 'Cung cấp Client ID & Secret để kích hoạt kết nối API.'}
                      </span>
                    </div>
                  </div>
                  {isConnected ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsConnected(false);
                        setAccountType(null);
                        setUserEmail('');
                        addNotification('Hộp thư', 'Đã ngắt kết nối tài khoản email cá nhân.');
                      }}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg text-xs cursor-pointer border-0"
                    >
                      Hủy liên kết
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (!clientId) {
                          alert('Vui lòng điền Client ID trước khi kích hoạt.');
                          return;
                        }
                        setIsConnected(true);
                        addNotification('Hộp thư', 'Đã kích hoạt kết nối tài khoản thành công.');
                      }}
                      className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg text-xs cursor-pointer border-0"
                    >
                      Kích hoạt
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* 2. Mail List Pane */}
              <div className="w-[300px] border-r border-slate-200 flex flex-col shrink-0">
                {/* Search and filters */}
                <div className="p-4 border-b border-slate-150 space-y-3 bg-slate-50/50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Tìm email, người gửi..."
                      className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setFilterUnread(false)} 
                      className={cn("px-2.5 py-1 text-[9.5px] font-bold rounded-lg transition-colors cursor-pointer", !filterUnread ? "bg-slate-200 text-slate-805" : "bg-transparent text-slate-450 hover:bg-slate-100")}
                    >
                      Tất cả
                    </button>
                    <button 
                      onClick={() => setFilterUnread(true)} 
                      className={cn("px-2.5 py-1 text-[9.5px] font-bold rounded-lg transition-colors cursor-pointer", filterUnread ? "bg-slate-200 text-slate-805" : "bg-transparent text-slate-450 hover:bg-slate-100")}
                    >
                      Chưa đọc
                    </button>
                  </div>
                </div>

                {/* Emails list view */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {searchedEmails.length === 0 ? (
                    <div className="p-8 text-center text-slate-450 space-y-1 bg-slate-50/20 h-full flex flex-col justify-center select-none font-medium">
                      <span>📭 Hộp thư trống</span>
                      <span className="text-[10px] text-slate-400">Không có email nào khớp với điều kiện lọc.</span>
                    </div>
                  ) : (
                    searchedEmails.map(mail => (
                      <div
                        key={mail.id}
                        onClick={() => handleSelectMail(mail.id)}
                        className={cn(
                          "p-3.5 hover:bg-slate-50/70 transition duration-150 cursor-pointer flex flex-col gap-1.5 relative border-l-4",
                          selectedMailId === mail.id ? "bg-primary-50/30 border-blue-600" : "border-transparent",
                          !mail.isRead && "font-bold bg-slate-50/30"
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs text-slate-805 truncate flex-1 pr-2">{mail.senderName}</span>
                          <span className="text-[9px] text-slate-400 font-semibold shrink-0">{mail.timestamp}</span>
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-[11.5px] text-slate-955 truncate leading-snug">{mail.subject}</h4>
                          <p className="text-[10px] text-slate-450 line-clamp-2 leading-relaxed font-medium">{mail.preview}</p>
                        </div>
                        <div className="flex justify-between items-center pt-1.5">
                          <div className="flex gap-1.5 items-center">
                            {mail.attachments && mail.attachments.length > 0 && (
                              <span className="text-[9px] bg-slate-105 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold">
                                <Paperclip className="w-2.5 h-2.5" />
                                {mail.attachments.length}
                              </span>
                            )}
                            {!mail.isRead && (
                              <span className="w-1.5 h-1.5 bg-primary-600 rounded-full"></span>
                            )}
                          </div>
                          <button 
                            onClick={(e) => toggleFlag(mail.id, e)}
                            className="p-1 hover:bg-slate-100 rounded cursor-pointer border-0 bg-transparent"
                          >
                            <Star className={cn("w-3.5 h-3.5", mail.isFlagged ? "text-amber-500 fill-amber-500" : "text-slate-300")} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 3. Mail Reader Pane */}
              <div className="flex-1 bg-slate-50/40 flex flex-col overflow-hidden">
                {selectedMail ? (
                  <div className="flex-1 flex flex-col overflow-hidden bg-white animate-in fade-in duration-200">
                    {/* Mail Reader Header */}
                    <div className="p-6 border-b border-slate-200 space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <h2 className="text-sm font-bold text-slate-905 leading-snug">{selectedMail.subject}</h2>
                        <div className="flex gap-1 shrink-0">
                          <button 
                            onClick={() => handleReply('reply', selectedMail)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer border-0 bg-transparent"
                            title="Trả lời"
                          >
                            <CornerUpLeft className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleReply('forward', selectedMail)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer border-0 bg-transparent"
                            title="Chuyển tiếp"
                          >
                            <CornerUpRight className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => deleteMail(selectedMail.id, e)}
                            className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors cursor-pointer border-0 bg-transparent"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Sender details */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">
                            {selectedMail.senderName[0]?.toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block leading-tight">{selectedMail.senderName}</span>
                            <span className="text-[9.5px] text-slate-450 leading-none">&lt;{selectedMail.senderEmail}&gt; tới {selectedMail.recipientEmail}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold">{selectedMail.timestamp}</span>
                      </div>
                    </div>

                    {/* Mail Reader Body */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-6 select-text">
                      <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-sans">
                        {selectedMail.body}
                      </div>

                      {selectedMail.attachments && selectedMail.attachments.length > 0 && (
                        <div className="pt-6 border-t border-slate-150 space-y-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tài liệu đính kèm ({selectedMail.attachments.length})</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {selectedMail.attachments.map((file, idx) => (
                              <div 
                                key={idx} 
                                className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between hover:bg-slate-100/60 transition duration-150 group"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                                  <div className="min-w-0">
                                    <span className="text-[10.5px] font-bold text-slate-805 block truncate">{file.name}</span>
                                    <span className="text-[9px] text-slate-450 leading-none">{file.size}</span>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => alert(`Bắt đầu tải tệp: ${file.name}`)}
                                  className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 hover:shadow-2xs transition cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-450 select-none space-y-2 font-medium">
                    <Mail className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                    <div className="space-y-0.5">
                      <span className="text-xs block">Chọn một email để đọc nội dung</span>
                      <span className="text-[10px] text-slate-400">Hộp thư cá nhân được bảo vệ bằng mã hóa đầu cuối.</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── 4. COMPOSE EMAIL MODAL ── */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-lg shadow-sm border border-slate-350 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Compose Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-primary-600" />
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">Soạn thư mới</h3>
              </div>
              <button 
                onClick={() => setShowComposeModal(false)}
                className="p-1.5 hover:bg-slate-200 rounded-full cursor-pointer border-0 bg-transparent text-slate-550"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Compose Inputs */}
            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
              <div className="space-y-1 relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tới (To):</label>
                <input
                  type="text"
                  value={newMail.to}
                  onChange={e => {
                    setNewMail(prev => ({ ...prev, to: e.target.value }));
                    setShowAutocomplete(e.target.value.length > 0);
                  }}
                  placeholder="nhanvien@vcomm.vn"
                  className="w-full p-2.5 border border-slate-250 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
                
                {/* Autocomplete Popup */}
                {showAutocomplete && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-md z-30 max-h-[160px] overflow-y-auto divide-y divide-slate-100">
                    {MOCK_MEMBERS
                      .filter(m => (m.name?.toLowerCase() || '').includes(newMail.to?.toLowerCase()) || (m.email?.toLowerCase() || '').includes(newMail.to?.toLowerCase()))
                      .map(member => (
                        <div
                          key={member.id}
                          onClick={() => {
                            setNewMail(prev => ({ ...prev, to: member.email }));
                            setShowAutocomplete(false);
                          }}
                          className="p-2.5 hover:bg-slate-50 cursor-pointer text-left flex justify-between items-center text-xs"
                        >
                          <div className="font-semibold text-slate-805">
                            {member.name} <span className="text-[10px] font-medium text-slate-450">&lt;{member.email}&gt;</span>
                          </div>
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">{member.position}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tiêu đề (Subject):</label>
                <input
                  type="text"
                  value={newMail.subject}
                  onChange={e => setNewMail(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Tiêu đề thư..."
                  className="w-full p-2.5 border border-slate-250 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nội dung (Message Body):</label>
                <div className="flex items-center gap-1.5 p-2 bg-slate-50 border border-b-0 border-slate-250 rounded-t-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setNewMail(prev => ({ ...prev, body: prev.body + ' **văn bản đậm**' }));
                    }}
                    className="p-1.5 hover:bg-slate-200 rounded text-slate-605 cursor-pointer border-0 bg-transparent flex items-center justify-center"
                    title="In đậm"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewMail(prev => ({ ...prev, body: prev.body + ' *văn bản nghiêng*' }));
                    }}
                    className="p-1.5 hover:bg-slate-200 rounded text-slate-605 cursor-pointer border-0 bg-transparent flex items-center justify-center"
                    title="In nghiêng"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewMail(prev => ({ ...prev, body: prev.body + ' <u>văn bản gạch chân</u>' }));
                    }}
                    className="p-1.5 hover:bg-slate-200 rounded text-slate-605 cursor-pointer border-0 bg-transparent flex items-center justify-center"
                    title="Gạch chân"
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 bg-slate-300 mx-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setNewMail(prev => ({ ...prev, body: prev.body + ' <span style="color:red">văn bản đỏ</span>' }));
                    }}
                    className="p-1.5 hover:bg-slate-200 rounded text-slate-605 cursor-pointer border-0 bg-transparent flex items-center gap-1"
                    title="Màu chữ"
                  >
                    <Palette className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
                <textarea
                  value={newMail.body}
                  onChange={e => setNewMail(prev => ({ ...prev, body: e.target.value }))}
                  rows={8}
                  placeholder="Nhập nội dung thư điện tử của bạn tại đây..."
                  className="w-full p-3 border border-slate-250 rounded-b-xl rounded-t-none text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none leading-relaxed border-t-0"
                />
              </div>

              {/* Attachments attachment area */}
              <div className="space-y-2">
                <div 
                  onClick={() => {
                    const sampleFiles = [
                      { name: 'Ke_hoach_kinh_doanh_Q3.pdf', size: '2.5 MB', type: 'pdf' },
                      { name: 'Bao_cao_marketing_social.xlsx', size: '780 KB', type: 'xlsx' },
                      { name: 'Anh_chup_hoa_don.png', size: '1.2 MB', type: 'png' }
                    ];
                    const selected = sampleFiles[Math.floor(Math.random() * sampleFiles.length)];
                    setNewMail(prev => {
                      if (prev.attachments.some(a => a.name === selected.name)) return prev;
                      return { ...prev, attachments: [...prev.attachments, selected] };
                    });
                    addNotification('Đính kèm', `Đã đính kèm thành công tệp ${selected.name}`);
                  }}
                  className="border-2 border-dashed border-slate-250 rounded-lg p-4 text-center hover:bg-slate-50/50 cursor-pointer transition flex flex-col items-center justify-center gap-1.5 select-none"
                >
                  <Paperclip className="w-5 h-5 text-slate-450" />
                  <span className="text-[10px] font-bold text-blue-650">Nhấn để đính kèm tệp mẫu</span>
                  <span className="text-[9px] text-slate-400">Kéo thả tài liệu Word, Excel, PDF tối đa 25MB</span>
                </div>

                {newMail.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1.5">
                    {newMail.attachments.map((file, idx) => (
                      <span 
                        key={idx} 
                        className="bg-slate-100 border border-slate-250 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1.5"
                      >
                        <Paperclip className="w-3 h-3 text-slate-500" />
                        {file.name} ({file.size})
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewMail(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== idx) }));
                          }}
                          className="p-0.5 hover:bg-slate-200 rounded-full cursor-pointer text-red-500 border-0 bg-transparent"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Compose Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex justify-end gap-2 shrink-0">
              <button 
                onClick={() => setShowComposeModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 bg-white text-xs font-bold rounded-lg hover:bg-slate-100 cursor-pointer border-0"
              >
                Hủy nháp
              </button>
              <button 
                onClick={handleSendMail}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg cursor-pointer border-0 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi Thư</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── OAuth Simulated Popup ── */}
      {showOauthPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="bg-white w-full max-w-sm rounded-lg shadow-xl border border-slate-300 overflow-hidden flex flex-col font-sans text-xs">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs">
                  {accountType === 'google' ? 'Đăng nhập bằng Google' : 'Microsoft Account'}
                </span>
              </div>
              <button onClick={() => setShowOauthPopup(false)} className="p-1 hover:bg-slate-200 rounded-full border-0 bg-transparent cursor-pointer">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center mx-auto border border-primary-100 font-serif font-black text-lg">
                  V
                </div>
                <h3 className="text-xs font-extrabold text-slate-905">Cấp quyền cho ứng dụng VComm ERP</h3>
                <p className="text-[10px] text-slate-450 leading-relaxed font-medium">
                  Ứng dụng VComm Cloud ERP muốn truy cập tài khoản email cá nhân của bạn trên {accountType === 'google' ? 'Google Workspace' : 'Microsoft 365'} để đọc, gửi và sắp xếp hộp thư.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-650 space-y-2 leading-relaxed text-[9.5px] font-medium">
                <p>• Đọc thư điện tử cá nhân và tệp đính kèm.</p>
                <p>• Gửi thư điện tử thay mặt bạn dưới đuôi tên miền công ty.</p>
                <p>• Đồng bộ hóa nhãn/thư mục và quản lý thư.</p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button 
                onClick={() => setShowOauthPopup(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 bg-white text-xs font-bold rounded-lg hover:bg-slate-100 cursor-pointer border-0"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleConfirmOauth}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg cursor-pointer border-0 flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Chấp nhận cấp quyền
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
