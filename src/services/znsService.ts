export interface ZnsTemplate {
  id: string;
  name: string;
  code: string;
  description: string;
  contentTemplate: string;
  isActive: boolean;
}

export interface ZnsLog {
  id: string;
  recipientPhone: string;
  customerName: string;
  templateCode: string;
  templateName: string;
  content: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  statusLabel: string;
  sentAt: string;
  orderId?: string;
  ticketId?: string;
  errorMessage?: string;
}

export const DEFAULT_TEMPLATES: ZnsTemplate[] = [
  {
    id: 'ZNS-001',
    name: 'Xác nhận Đơn hàng',
    code: 'ZNS_ORDER_CONFIRMED',
    description: 'Tự động gửi khi đơn hàng được xác nhận thành công.',
    contentTemplate: 'Kính gửi [Tên_Khách_Hàng], đơn hàng [Mã_Đơn_Hàng] trị giá [Tổng_Tiền] đã được xác nhận thành công. Trạng thái hiện tại: [Trạng_Thái]. Cảm ơn quý khách đã mua sắm tại VComm!',
    isActive: true
  },
  {
    id: 'ZNS-002',
    name: 'Cập nhật Trạng thái Giao hàng',
    code: 'ZNS_ORDER_SHIPPED',
    description: 'Tự động gửi khi đơn hàng được chuyển cho đơn vị vận chuyển.',
    contentTemplate: 'Kính gửi [Tên_Khách_Hàng], đơn hàng [Mã_Đơn_Hàng] đã được bàn giao cho đối tác vận chuyển [Đơn_Vị_Vận_Chuyển]. Mã vận đơn của quý khách là [Mã_Vận_Đơn]. Quý khách vui lòng chú ý điện thoại để nhận hàng.',
    isActive: true
  },
  {
    id: 'ZNS-003',
    name: 'Xác nhận Hoàn tất Giao hàng',
    code: 'ZNS_ORDER_DELIVERED',
    description: 'Tự động gửi khi đơn hàng đã được giao thành công cho khách hàng.',
    contentTemplate: 'Kính gửi [Tên_Khách_Hàng], đơn hàng [Mã_Đơn_Hàng] đã được giao thành công. Mong rằng quý khách hài lòng với sản phẩm. Vui lòng liên hệ với bộ phận CSKH nếu cần thêm hỗ trợ!',
    isActive: true
  },
  {
    id: 'ZNS-004',
    name: 'Cập nhật Phản hồi Phiếu CSKH',
    code: 'ZNS_TICKET_REPLIED',
    description: 'Tự động gửi khi nhân viên CSKH trả lời phiếu hỗ trợ của khách hàng.',
    contentTemplate: 'Chào [Tên_Khách_Hàng], yêu cầu hỗ trợ [Mã_Phiếu] về vấn đề "[Tiêu_Đề]" đã có phản hồi mới từ bộ phận CSKH: "[Nội_Dung_Phản_Hồi]". Nhấn vào đây để xem chi tiết.',
    isActive: true
  },
  {
    id: 'ZNS-005',
    name: 'Xác nhận Đóng Phiếu CSKH',
    code: 'ZNS_TICKET_CLOSED',
    description: 'Tự động gửi khi phiếu hỗ trợ của khách hàng được đóng.',
    contentTemplate: 'Kính gửi [Tên_Khách_Hàng], phiếu hỗ trợ [Mã_Phiếu] đã được xử lý hoàn tất và đóng lại. Xin chân thành cảm ơn ý kiến đóng góp của quý khách giúp chúng tôi nâng cao chất lượng dịch vụ!',
    isActive: true
  }
];

const STORAGE_KEYS = {
  LOGS: 'vcomm_zns_logs',
  TEMPLATES: 'vcomm_zns_templates',
  CONFIG: 'vcomm_zns_config'
};

export interface ZnsConfig {
  oaId: string;
  appId: string;
  accessToken: string;
  autoRefresh: boolean;
  isActive: boolean;
}

export const getZnsConfig = (): ZnsConfig => {
  const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // Use default fallback
    }
  }
  return {
    oaId: '2938475928374928',
    appId: '142345234523',
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.zns_simulated_token_2026',
    autoRefresh: true,
    isActive: true
  };
};

export const saveZnsConfig = (config: ZnsConfig): void => {
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  window.dispatchEvent(new Event('zns-config-updated'));
};

export const getZnsTemplates = (): ZnsTemplate[] => {
  const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // Use default
    }
  }
  return DEFAULT_TEMPLATES;
};

export const saveZnsTemplates = (templates: ZnsTemplate[]): void => {
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  window.dispatchEvent(new Event('zns-templates-updated'));
};

export const getZnsLogs = (): ZnsLog[] => {
  const data = localStorage.getItem(STORAGE_KEYS.LOGS);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // Use default
    }
  }
  
  // Provide realistic initial history log
  const initialLogs: ZnsLog[] = [
    {
      id: 'ZNS-LOG-991',
      recipientPhone: '0987654321',
      customerName: 'Nguyễn Văn A',
      templateCode: 'ZNS_ORDER_CONFIRMED',
      templateName: 'Xác nhận Đơn hàng',
      content: 'Kính gửi Nguyễn Văn A, đơn hàng ORD-2024-001 trị giá 2,500,000 ₫ đã được xác nhận thành công. Trạng thái hiện tại: Đã hoàn tất. Cảm ơn quý khách đã mua sắm tại VComm!',
      status: 'read',
      statusLabel: 'Đã xem',
      sentAt: '02/06/2026 09:12',
      orderId: 'ORD-2024-001'
    },
    {
      id: 'ZNS-LOG-992',
      recipientPhone: '0912345678',
      customerName: 'Trần Thị B',
      templateCode: 'ZNS_ORDER_CONFIRMED',
      templateName: 'Xác nhận Đơn hàng',
      content: 'Kính gửi Trần Thị B, đơn hàng ORD-2024-002 trị giá 1,200,000 ₫ đã được xác nhận thành công. Trạng thái hiện tại: Đang đóng gói. Cảm ơn quý khách đã mua sắm tại VComm!',
      status: 'delivered',
      statusLabel: 'Đã nhận',
      sentAt: '02/06/2026 10:20',
      orderId: 'ORD-2024-002'
    }
  ];
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(initialLogs));
  return initialLogs;
};

export const sendZnsNotification = (
  recipientPhone: string,
  templateCode: string,
  variables: Record<string, string>,
  meta: { orderId?: string; ticketId?: string; customerName: string }
): ZnsLog => {
  const config = getZnsConfig();
  const templates = getZnsTemplates();
  const targetTemplate = templates.find(t => t.code === templateCode);
  
  let content = targetTemplate 
    ? targetTemplate.contentTemplate 
    : 'Thông báo tự động Zalo ZNS từ VComm';
    
  // Replace variables in brackets [Variable]
  Object.entries(variables).forEach(([key, val]) => {
    content = content.replace(new RegExp(`\\[${key}\\]`, 'g'), val);
  });
  
  // Format phone to standardized look
  let formattedPhone = recipientPhone.replace(/\s+/g, '');
  if (!formattedPhone) {
    formattedPhone = '09' + Math.floor(10000000 + Math.random() * 90000000); // Random visual phone
  }

  // Determine realistic random statuses
  const statuses: ZnsLog['status'][] = ['sent', 'delivered', 'read'];
  const finalStatus = config.isActive ? statuses[Math.floor(Math.random() * statuses.length)] : 'failed';
  const statusLabels: Record<ZnsLog['status'], string> = {
    sent: 'Đã chuyển tiếp',
    delivered: 'Đã nhận',
    read: 'Đã xem',
    failed: 'Gửi lỗi'
  };

  const newLog: ZnsLog = {
    id: `ZNS-LOG-${Math.floor(100000 + Math.random() * 900000)}`,
    recipientPhone: formattedPhone,
    customerName: meta.customerName,
    templateCode,
    templateName: targetTemplate ? targetTemplate.name : 'Unknown Template',
    content,
    status: finalStatus,
    statusLabel: statusLabels[finalStatus],
    sentAt: new Date().toLocaleString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    orderId: meta.orderId,
    ticketId: meta.ticketId,
    errorMessage: config.isActive ? undefined : 'Zalo OA integration is inactive. Please turn on in settings.'
  };

  // Add to existing logs
  const logs = getZnsLogs();
  const updatedLogs = [newLog, ...logs];
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updatedLogs));
  
  // Custom event trigger
  window.dispatchEvent(new CustomEvent('zns-log-added', { detail: newLog }));
  
  return newLog;
};

export const clearZnsLogs = (): void => {
  localStorage.removeItem(STORAGE_KEYS.LOGS);
  window.dispatchEvent(new Event('zns-log-updated'));
};
