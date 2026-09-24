import React, { useState, useMemo } from 'react';
import { 
  Headphones, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Filter, 
  Search, 
  Plus, 
  Server, 
  ShieldCheck, 
  Laptop, 
  Wifi, 
  Key, 
  FileText, 
  BookOpen, 
  Sparkles, 
  ArrowUpRight, 
  MessageSquare, 
  User, 
  Tag, 
  Calendar, 
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Activity,
  AlertTriangle,
  Send,
  HelpCircle,
  HardDrive,
  Globe,
  Lock,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { HrmStaffOrRequestPickerModal } from './common/HrmStaffOrRequestPickerModal';
import { hrmEmployeeService, HrmEmployee, HrmPersonalRequest } from '../services/hrmEmployeeService';

export interface ITTicket {
  id: string;
  title: string;
  category: 'hardware' | 'software' | 'network' | 'account' | 'security';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  status: 'new' | 'assigned' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  requesterName: string;
  requesterEmail: string;
  requesterDepartment: string;
  assignedTo: string;
  createdAt: string;
  slaDeadline: string;
  isBreached: boolean;
  description: string;
  resolution?: string;
  resolvedAt?: string;
}

export interface ITAsset {
  id: string;
  name: string;
  type: 'server' | 'domain' | 'ssl' | 'license' | 'workstation';
  identifier: string;
  assignedTo?: string;
  status: 'active' | 'warning' | 'expired';
  expireDate: string;
  notes: string;
}

export interface ITKnowledgeArticle {
  id: string;
  title: string;
  category: string;
  views: number;
  readTime: string;
  author: string;
  summary: string;
  steps: string[];
}

const MOCK_TICKETS: ITTicket[] = [
  {
    id: 'IT-2026-001',
    title: 'Sập kết nối Gateway POS Chi nhánh Cầu Giấy',
    category: 'network',
    priority: 'P1',
    status: 'in_progress',
    requesterName: 'Trần Văn Mạnh',
    requesterEmail: 'manhtv@vcomm.vn',
    requesterDepartment: 'Vận hành Siêu thị',
    assignedTo: 'Nguyễn IT Lead',
    createdAt: '2026-09-18 07:30',
    slaDeadline: '2026-09-18 09:30',
    isBreached: false,
    description: 'Tất cả 5 máy POS tại quầy thu ngân không gửi được tín hiệu thanh toán VietQR và quẹt thẻ.',
  },
  {
    id: 'IT-2026-002',
    title: 'Yêu cầu cấp tài khoản Google Workspace & VPN cho nhân viên mới',
    category: 'account',
    priority: 'P3',
    status: 'new',
    requesterName: 'Nguyễn Thị Hồng (HR)',
    requesterEmail: 'hongnt@vcomm.vn',
    requesterDepartment: 'Nhân sự',
    assignedTo: 'Chưa phân công',
    createdAt: '2026-09-18 08:00',
    slaDeadline: '2026-09-19 08:00',
    isBreached: false,
    description: 'Cấp email @vcomm.vn và phân quyền truy cập kho tài liệu Google Drive Marketing cho 3 bạn thực tập sinh.',
  },
  {
    id: 'IT-2026-003',
    title: 'Máy in vận đơn nhiệt A6 tại Kho Hà Nội bị kẹt giấy và lệch mã vạch',
    category: 'hardware',
    priority: 'P2',
    status: 'assigned',
    requesterName: 'Lê Văn Tùng',
    requesterEmail: 'tunglv@vcomm.vn',
    requesterDepartment: 'Kho Vận FBL',
    assignedTo: 'Đỗ Kỹ Thuật Viên',
    createdAt: '2026-09-18 06:15',
    slaDeadline: '2026-09-18 10:15',
    isBreached: false,
    description: 'Máy in Xprinter XP-420B in tem GHN bị nhòe mã Code128, bưu tá không quét được.',
  },
  {
    id: 'IT-2026-004',
    title: 'Cảnh báo chứng chỉ SSL domain tracuu.vcomm.vn sắp hết hạn trong 7 ngày',
    category: 'security',
    priority: 'P2',
    status: 'in_progress',
    requesterName: 'Hệ thống Monitor',
    requesterEmail: 'bot@vcomm.vn',
    requesterDepartment: 'DevOps & Hạ tầng',
    assignedTo: 'Nguyễn IT Lead',
    createdAt: '2026-09-17 14:00',
    slaDeadline: '2026-09-18 14:00',
    isBreached: false,
    description: 'Cần gia hạn Let\'s Encrypt Wildcard SSL hoặc thay bằng Sectigo EV SSL.',
  },
  {
    id: 'IT-2026-005',
    title: 'Cài đặt chữ ký số Token USB Viettel-CA cho Kế toán kho',
    category: 'software',
    priority: 'P4',
    status: 'resolved',
    requesterName: 'Phạm Thu Trang',
    requesterEmail: 'trangpt@vcomm.vn',
    requesterDepartment: 'Kế toán',
    assignedTo: 'Đỗ Kỹ Thuật Viên',
    createdAt: '2026-09-16 10:00',
    slaDeadline: '2026-09-17 10:00',
    isBreached: false,
    description: 'Cài đặt driver USB PKI token và test ký số hóa đơn điện tử meInvoice.',
    resolution: 'Đã cài plugin ký số vCommSigner và ký thử thành công 1 hóa đơn mẫu.',
    resolvedAt: '2026-09-16 14:30'
  }
];

const MOCK_IT_ASSETS: ITAsset[] = [
  { id: 'ASSET-IT-01', name: 'Cloud Server Core Backend', type: 'server', identifier: '103.145.63.120 (48 vCPU, 128GB RAM)', status: 'active', expireDate: '2027-08-30', notes: 'Máy chủ chạy NestJS Microservices' },
  { id: 'ASSET-IT-02', name: 'Domain vcomm.vn & Subdomains', type: 'domain', identifier: 'vcomm.vn (VNNIC - Mắt Bão)', status: 'active', expireDate: '2028-12-31', notes: 'Tên miền thương hiệu chính' },
  { id: 'ASSET-IT-03', name: 'SSL Certificate Wildcard *.vcomm.vn', type: 'ssl', identifier: 'DigiCert Wildcard SSL', status: 'warning', expireDate: '2026-09-25', notes: 'Còn 7 ngày cần Renew' },
  { id: 'ASSET-IT-04', name: 'Gói Google Workspace Enterprise (200 seats)', type: 'license', identifier: 'Google Cloud Billing ID #44910', status: 'active', expireDate: '2027-01-15', notes: 'Mail, Meet, Drive nội bộ' },
  { id: 'ASSET-IT-05', name: 'Bản quyền Knox Manage MDM (Samsung)', type: 'license', identifier: 'Knox-License-Tier-A-500-Devices', status: 'active', expireDate: '2027-05-20', notes: 'Quản lý khóa trả góp điện thoại' },
];

const MOCK_ARTICLES: ITKnowledgeArticle[] = [
  {
    id: 'KB-001',
    title: 'Hướng dẫn cài đặt máy in tem vận đơn A6 (XP-420B) trên Windows',
    category: 'Phần cứng & Thiết bị',
    views: 342,
    readTime: '3 phút',
    author: 'Đỗ Kỹ Thuật Viên',
    summary: 'Cách cài đặt driver Seagull, thiết lập khổ giấy 100x150mm và chỉnh độ đậm nét khi in nhiệt.',
    steps: [
      'Tải driver Seagull Scientific phiên bản mới nhất từ portal IT.',
      'Cắm cáp USB và bật nguồn máy in.',
      'Mở Printing Preferences ➔ Page Setup ➔ Chọn User Defined 100mm x 150mm.',
      'Vào Graphics ➔ Dithering chọn None để mã vạch sắc nét không bị nhòe.'
    ]
  },
  {
    id: 'KB-002',
    title: 'Cách kết nối mạng VPN nội bộ làm việc từ xa (WireGuard / OpenVPN)',
    category: 'Mạng & Truy cập',
    views: 520,
    readTime: '5 phút',
    author: 'Nguyễn IT Lead',
    summary: 'Từng bước cài đặt client WireGuard, nhập file cấu hình .conf để truy cập hệ thống ERP và Git nội bộ an toàn.',
    steps: [
      'Cài đặt ứng dụng WireGuard Client cho máy tính.',
      'Nhận file config .conf cá nhân từ email của bộ phận IT.',
      'Mở WireGuard, chọn "Add Tunnel" và import file config.',
      'Bấm Activate. Kiểm tra truy cập http://192.168.1.100 hoặc dashboard ERP.'
    ]
  },
  {
    id: 'KB-003',
    title: 'Quy trình xử lý khi nghi ngờ bị lừa đảo qua email (Phishing) hoặc rò rỉ mật khẩu',
    category: 'An toàn thông tin',
    views: 615,
    readTime: '4 phút',
    author: 'Phòng Bảo Mật & IT',
    summary: 'Biện pháp khẩn cấp: Đổi mật khẩu ngay lập tức, bật xác thực 2 bước 2FA và báo cáo ticket P1.',
    steps: [
      'Không nhấn vào bất kỳ liên kết lạ hoặc nhập mã OTP vào website lạ.',
      'Đổi mật khẩu tài khoản Google Workspace ngay lập tức.',
      'Mở app IT Helpdesk, tạo Ticket khẩn cấp mức P1 kèm ảnh chụp email nghi vấn.',
      'Bộ phận IT Security sẽ cô lập phiên đăng nhập và thu hồi token truy cập trong 5 phút.'
    ]
  }
];

export function ITHelpdesk() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'tickets' | 'sla' | 'assets' | 'kb'>('tickets');
  const [tickets, setTickets] = useState<ITTicket[]>(MOCK_TICKETS);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ITTicket | null>(null);

  // Form State (Strictly Locked Requester Fields from HRM)
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<ITTicket['category']>('hardware');
  const [formPriority, setFormPriority] = useState<ITTicket['priority']>('P3');
  const [formRequester, setFormRequester] = useState('Nguyễn Thị Kim Anh');
  const [formRequesterCode, setFormRequesterCode] = useState('EMP-2061');
  const [formRequesterEmail, setFormRequesterEmail] = useState('anh.ntk@vcomm.vn');
  const [formDepartment, setFormDepartment] = useState('Chăm sóc Khách hàng');
  const [formDesc, setFormDesc] = useState('');

  // HRM Picker Modal State
  const [showHrmPicker, setShowHrmPicker] = useState(false);
  const [pickerDefaultTab, setPickerDefaultTab] = useState<'cbnv' | 'hrm_request'>('cbnv');
  const [hrmSourceLabel, setHrmSourceLabel] = useState<string | null>(
    'Đã trích xuất từ Hồ sơ CBNV: EMP-2061 - Nguyễn Thị Kim Anh'
  );

  const handleSelectHrmStaff = (emp: HrmEmployee, source: 'cbnv' | 'current_user', originalReq?: HrmPersonalRequest) => {
    setFormRequester(emp.name);
    setFormRequesterCode(emp.id);
    setFormRequesterEmail(emp.email);
    setFormDepartment(emp.department);

    if (originalReq) {
      setHrmSourceLabel(`Trích xuất từ Đơn yêu cầu ${originalReq.id}: ${originalReq.title}`);
      if (!formTitle || formTitle === '') setFormTitle(originalReq.title);
      if (!formDesc || formDesc === '') setFormDesc(originalReq.description);
      if (originalReq.priority) setFormPriority(originalReq.priority);
      if (originalReq.category === 'it_support' || originalReq.category === 'equipment') {
        setFormCategory('hardware');
      }
    } else if (source === 'current_user') {
      setHrmSourceLabel(`Thông tin CBNV của bạn (${emp.id} - ${emp.name})`);
    } else {
      setHrmSourceLabel(`Hồ sơ Cán bộ Nhân viên chính thức (${emp.id} - ${emp.name})`);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length;
    const p1Count = tickets.filter(t => t.priority === 'P1' && t.status !== 'resolved').length;
    const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    const slaRate = total > 0 ? ((total - tickets.filter(t => t.isBreached).length) / total) * 100 : 100;
    return { total, open, p1Count, resolved, slaRate };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchSearch = !searchQuery || 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.requesterName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchPriority && matchCategory && matchSearch;
    });
  }, [tickets, statusFilter, priorityFilter, categoryFilter, searchQuery]);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formRequester) {
      alert('Vui lòng điền tiêu đề sự cố và tên người yêu cầu');
      return;
    }

    // SLA Deadline logic
    const hoursToAdd = formPriority === 'P1' ? 2 : formPriority === 'P2' ? 4 : formPriority === 'P3' ? 24 : 48;
    const deadline = new Date(Date.now() + hoursToAdd * 3600000).toISOString().replace('T', ' ').substring(0, 16);

    const newTicket: ITTicket = {
      id: `IT-2026-${String(tickets.length + 1).padStart(3, '0')}`,
      title: formTitle,
      category: formCategory,
      priority: formPriority,
      status: 'new',
      requesterName: formRequester,
      requesterEmail: `${formRequester.toLowerCase().replace(/\s+/g, '')}@vcomm.vn`,
      requesterDepartment: formDepartment,
      assignedTo: 'Đang điều phối IT',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      slaDeadline: deadline,
      isBreached: false,
      description: formDesc || 'Không có mô tả chi tiết.',
    };

    setTickets([newTicket, ...tickets]);
    setShowNewModal(false);
    // Reset
    setFormTitle('');
    setFormRequester('');
    setFormDesc('');
  };

  const handleUpdateStatus = (ticketId: string, nextStatus: ITTicket['status']) => {
    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      return {
        ...t,
        status: nextStatus,
        resolvedAt: (nextStatus === 'resolved' || nextStatus === 'closed') ? new Date().toISOString().replace('T', ' ').substring(0, 16) : t.resolvedAt
      };
    }));
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, status: nextStatus } : null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                IT Service Desk & Hạ Tầng Kỹ Thuật
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-50 text-sky-700 border border-sky-200">
                Chuẩn ITIL & SLA 99.8%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tiếp nhận hỗ trợ kỹ thuật, giám sát cam kết SLA, cấp phát tài nguyên số và cẩm nang xử lý sự cố.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Gửi Yêu Cầu Hỗ Trợ IT</span>
          </button>
        </div>
      </div>

      {/* Top Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng Ticket</span>
          <div className="text-2xl font-black text-slate-900 mt-2">{metrics.total}</div>
          <span className="text-[10px] text-slate-500 mt-1">Toàn công ty</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Đang Xử Lý</span>
            <Clock className="w-4 h-4 text-amber-600 animate-spin" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">{metrics.open}</div>
          <span className="text-[10px] text-amber-600 font-medium mt-1">Cần phản hồi</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Sự Cố Khẩn (P1)</span>
            <AlertCircle className="w-4 h-4 text-rose-600 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">{metrics.p1Count}</div>
          <span className="text-[10px] text-rose-600 font-bold mt-1">Ảnh hưởng toàn sàn</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Đã Giải Quyết</span>
          <div className="text-2xl font-black text-emerald-700 mt-2">{metrics.resolved}</div>
          <span className="text-[10px] text-emerald-600 font-medium mt-1">Hoàn tất thành công</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Đạt Cam Kết SLA</span>
          <div className="text-2xl font-black text-indigo-700 mt-2">{metrics.slaRate.toFixed(1)}%</div>
          <span className="text-[10px] text-indigo-600 font-bold mt-1">Mục tiêu: {'>'}99.0%</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'tickets', label: `Hàng Đợi Yêu Cầu (${metrics.open})`, icon: Headphones },
          { id: 'sla', label: 'Báo Cáo SLA & MTTR', icon: Activity },
          { id: 'assets', label: `Hạ Tầng & Bản Quyền Số (${MOCK_IT_ASSETS.length})`, icon: Server },
          { id: 'kb', label: `Cẩm Nang Xử Lý Sự Cố (KB)`, icon: BookOpen },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap",
                isActive 
                  ? "bg-slate-900 text-white shadow-2xs" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: TICKETS QUEUE */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Mã sự cố, tiêu đề, người yêu cầu..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 w-64"
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="new">Mới gửi</option>
                <option value="assigned">Đã phân công</option>
                <option value="in_progress">Đang xử lý</option>
                <option value="waiting_user">Chờ người dùng</option>
                <option value="resolved">Đã giải quyết</option>
              </select>

              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
              >
                <option value="all">Tất cả mức ưu tiên</option>
                <option value="P1">P1 - Khẩn cấp</option>
                <option value="P2">P2 - Cao</option>
                <option value="P3">P3 - Trung bình</option>
                <option value="P4">P4 - Thấp</option>
              </select>

              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
              >
                <option value="all">Tất cả phân loại</option>
                <option value="hardware">Phần cứng (Máy in, POS, PC)</option>
                <option value="software">Phần mềm & ERP</option>
                <option value="network">Mạng LAN, Wifi, VPN</option>
                <option value="account">Tài khoản & Phân quyền</option>
                <option value="security">An toàn thông tin & SSL</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-bold">
              Hiển thị {filteredTickets.length} / {tickets.length} ticket
            </div>
          </div>

          {/* Tickets Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Mã & Mức độ</th>
                    <th className="py-3 px-4">Tiêu đề sự cố</th>
                    <th className="py-3 px-4">Phân loại</th>
                    <th className="py-3 px-4">Người yêu cầu</th>
                    <th className="py-3 px-4">Phụ trách</th>
                    <th className="py-3 px-4">Hạn chót SLA</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTickets.map(t => {
                    const priorityStyles = {
                      P1: 'bg-rose-100 text-rose-700 border-rose-300',
                      P2: 'bg-orange-100 text-orange-700 border-orange-300',
                      P3: 'bg-blue-100 text-blue-700 border-blue-300',
                      P4: 'bg-slate-100 text-slate-700 border-slate-300',
                    };

                    const statusBadge = {
                      new: 'bg-blue-50 text-blue-700 border-blue-200',
                      assigned: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                      in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
                      waiting_user: 'bg-purple-50 text-purple-700 border-purple-200',
                      resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      closed: 'bg-slate-100 text-slate-700 border-slate-200',
                    };

                    return (
                      <tr 
                        key={t.id} 
                        onClick={() => setSelectedTicket(t)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-black border", priorityStyles[t.priority])}>
                              {t.priority}
                            </span>
                            <span className="font-bold text-slate-900">{t.id}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-xs line-clamp-1 max-w-sm">{t.title}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{t.createdAt}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[11px] font-semibold text-slate-700 capitalize bg-slate-100 px-2 py-0.5 rounded">
                            {t.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">{t.requesterName}</div>
                          <div className="text-[10px] text-slate-500">{t.requesterDepartment}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-slate-700 font-medium">{t.assignedTo}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <div className={cn("text-xs font-bold", t.isBreached ? "text-rose-600" : "text-slate-700")}>
                            {t.slaDeadline}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black border", statusBadge[t.status])}>
                            {t.status.toUpperCase().replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {t.status !== 'resolved' && (
                              <button
                                onClick={() => handleUpdateStatus(t.id, 'resolved')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-all"
                              >
                                Giải quyết
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedTicket(t)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold transition-all"
                            >
                              Chi tiết
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SLA & PERFORMANCE */}
      {activeTab === 'sla' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" />
                Thời Gian Giải Quyết Trung Bình (MTTR)
              </h3>
              <div className="text-3xl font-black text-sky-600">1 giờ 24 phút</div>
              <p className="text-xs text-slate-500">Giảm 18% so với quý trước nhờ tự động hóa cấp tài khoản và quy chuẩn lỗi thiết bị kho.</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Tỷ Lệ Xử Lý Ngay Lần Đầu (FCR)
              </h3>
              <div className="text-3xl font-black text-emerald-600">82.4%</div>
              <p className="text-xs text-slate-500">82.4% các yêu cầu về phần mềm và mật khẩu được giải quyết dứt điểm ngay trong phiên hỗ trợ đầu tiên.</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Chỉ Số Hài Lòng CSAT Nội Bộ
              </h3>
              <div className="text-3xl font-black text-amber-600">4.85 / 5.0 ⭐</div>
              <p className="text-xs text-slate-500">Khảo sát tự động gửi qua ZNS/Email sau khi Ticket được chuyển sang trạng thái Resolved.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">Bảng Ma Trận Phục Vụ SLA (Service Level Agreement)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3">Mức độ ưu tiên</th>
                    <th className="p-3">Định nghĩa ảnh hưởng</th>
                    <th className="p-3">Thời gian phản hồi đầu tiên</th>
                    <th className="p-3">Thời gian giải quyết tối đa</th>
                    <th className="p-3">Quy trình leo thang (Escalation)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-bold text-rose-600">P1 - Khẩn cấp</td>
                    <td className="p-3">Toàn bộ sàn/siêu thị ngừng hoạt động, sự cố bảo mật nghiêm trọng</td>
                    <td className="p-3 font-semibold">15 phút</td>
                    <td className="p-3 font-bold text-rose-600">2 giờ</td>
                    <td className="p-3">Báo trực tiếp CTO & Ban Giám Đốc</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-orange-600">P2 - Cao</td>
                    <td className="p-3">Một kho hoặc một bộ phận không xuất được hàng, máy in lỗi</td>
                    <td className="p-3 font-semibold">30 phút</td>
                    <td className="p-3 font-bold text-orange-600">4 giờ</td>
                    <td className="p-3">Báo IT Lead & Trưởng kho vận</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-blue-600">P3 - Trung bình</td>
                    <td className="p-3">Cấp tài khoản mới, lỗi phần mềm cá nhân không ảnh hưởng đơn</td>
                    <td className="p-3 font-semibold">2 giờ</td>
                    <td className="p-3 font-semibold">24 giờ</td>
                    <td className="p-3">Kỹ thuật viên IT tiếp nhận và xử lý</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-600">P4 - Thấp</td>
                    <td className="p-3">Đề xuất cải tiến tính năng, câu hỏi tư vấn kỹ thuật</td>
                    <td className="p-3 font-semibold">4 giờ</td>
                    <td className="p-3 font-semibold">48 giờ</td>
                    <td className="p-3">Xử lý theo hàng đợi thường</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ASSETS & LICENSES */}
      {activeTab === 'assets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">Danh Mục Hạ Tầng & Bản Quyền Số IT</h3>
            <span className="text-xs text-slate-500 font-semibold">Liên thông với App Quản Lý Tài Sản (/assets)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_IT_ASSETS.map(a => (
              <div key={a.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                      {a.type}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold border",
                      a.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      a.status === 'warning' ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-rose-50 text-rose-700 border-rose-200"
                    )}>
                      {a.status === 'active' ? 'Đang hoạt động' : a.status === 'warning' ? 'Sắp hết hạn' : 'Hết hạn'}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{a.name}</h4>
                  <p className="font-mono text-xs text-sky-700 mt-1">{a.identifier}</p>
                  <p className="text-xs text-slate-500 mt-2">{a.notes}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Hạn gia hạn:</span>
                  <span className="font-mono font-bold text-slate-700">{a.expireDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: KNOWLEDGE BASE */}
      {activeTab === 'kb' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {MOCK_ARTICLES.map(art => (
              <div key={art.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-black text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                      {art.category}
                    </span>
                    <span className="text-slate-400">{art.views} lượt xem • {art.readTime}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 leading-snug">{art.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{art.summary}</p>

                  <div className="pt-3 space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Các bước chính:</span>
                    {art.steps.map((st, i) => (
                      <div key={i} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                        <span className="font-black text-sky-600">{i + 1}.</span>
                        <span>{st}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-400 flex items-center justify-between">
                  <span>Tác giả: <strong className="text-slate-700">{art.author}</strong></span>
                  <button className="text-sky-600 font-bold hover:underline flex items-center gap-1">
                    Chi tiết <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL TẠO TICKET MỚI */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Gửi Yêu Cầu Hỗ Trợ IT</h3>
                  <p className="text-[10px] text-slate-500">Bộ phận IT sẽ tiếp nhận và xử lý theo cam kết SLA</p>
                </div>
              </div>
              <button onClick={() => setShowNewModal(false)} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500">✕</button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-5 space-y-4">
              {/* HRM Staff / Request Selector Header */}
              <div className="p-3 bg-gradient-to-r from-sky-50 via-slate-50 to-indigo-50 border border-sky-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sky-900 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    <span>Nguồn người yêu cầu (Bắt buộc từ HRM)</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Khóa nhập tay
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPickerDefaultTab('cbnv');
                      setShowHrmPicker(true);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold shadow-2xs transition-all cursor-pointer text-[11px]"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Chọn từ Danh sách CBNV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPickerDefaultTab('hrm_request');
                      setShowHrmPicker(true);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold transition-all cursor-pointer text-[11px]"
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-600" />
                    <span>Trích xuất từ Đơn IT HRM</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const current = hrmEmployeeService.getCurrentLoggedInStaff();
                      handleSelectHrmStaff(current, 'current_user');
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold transition-all cursor-pointer text-[11px]"
                  >
                    <span>Tôi là người yêu cầu</span>
                  </button>
                </div>

                {hrmSourceLabel && (
                  <div className="p-1.5 bg-white rounded-lg border border-sky-100 text-[10px] text-sky-900 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{hrmSourceLabel}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề sự cố / Yêu cầu *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Máy in kho Hà Nội không in được tem vận đơn"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phân loại sự cố</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="hardware">Phần cứng (PC, Máy in, POS)</option>
                    <option value="software">Phần mềm (ERP, Kế toán, Office)</option>
                    <option value="network">Mạng LAN, Wifi, VPN</option>
                    <option value="account">Tài khoản & Phân quyền</option>
                    <option value="security">An toàn thông tin & Bảo mật</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mức độ ưu tiên</label>
                  <select
                    value={formPriority}
                    onChange={e => setFormPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="P1">P1 - Khẩn cấp (SLA 2h)</option>
                    <option value="P2">P2 - Cao (SLA 4h)</option>
                    <option value="P3">P3 - Trung bình (SLA 24h)</option>
                    <option value="P4">P4 - Thấp (SLA 48h)</option>
                  </select>
                </div>
              </div>

              {/* Locked Requester Details */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Người yêu cầu</span>
                    <span className="text-[10px] text-slate-400 font-normal flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5 text-slate-400" /> Khóa
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    readOnly
                    title="Thông tin lấy từ HRM, không được phép tự nhập tay"
                    value={formRequester}
                    className="w-full px-3 py-2 text-xs bg-slate-100 text-slate-800 font-bold border border-slate-300 rounded-lg cursor-not-allowed select-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Email công vụ</span>
                    <span className="text-[10px] text-slate-400 font-normal flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5 text-slate-400" /> Khóa
                    </span>
                  </label>
                  <input
                    type="email"
                    readOnly
                    title="Thông tin lấy từ HRM, không được phép tự nhập tay"
                    value={formRequesterEmail}
                    className="w-full px-3 py-2 text-xs bg-slate-100 text-slate-800 font-medium border border-slate-300 rounded-lg cursor-not-allowed select-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Phòng ban</span>
                    <span className="text-[10px] text-slate-400 font-normal flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5 text-slate-400" /> Khóa
                    </span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    title="Thông tin lấy từ HRM, không được phép tự nhập tay"
                    value={formDepartment}
                    className="w-full px-3 py-2 text-xs bg-slate-100 text-slate-800 font-medium border border-slate-300 rounded-lg cursor-not-allowed select-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả chi tiết lỗi & Dấu hiệu nhận biết</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả chi tiết mã lỗi hoặc chụp ảnh màn hình đính kèm..."
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  Gửi Yêu Cầu IT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT TICKET */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-black bg-sky-100 text-sky-800">
                  {selectedTicket.id}
                </span>
                <span className="text-xs font-bold text-slate-500">Mức: {selectedTicket.priority}</span>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500">✕</button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <h3 className="text-base font-black text-slate-900">{selectedTicket.title}</h3>
              
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">Người yêu cầu:</span>
                  <span className="font-bold text-slate-800">{selectedTicket.requesterName} ({selectedTicket.requesterDepartment})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">IT phụ trách:</span>
                  <span className="font-bold text-slate-800">{selectedTicket.assignedTo}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Thời gian gửi:</span>
                  <span className="font-mono text-slate-700">{selectedTicket.createdAt}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Hạn SLA:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedTicket.slaDeadline}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Mô tả sự cố:</span>
                <p className="p-3 bg-slate-50 rounded-lg text-slate-800 leading-relaxed border border-slate-100">
                  {selectedTicket.description}
                </p>
              </div>

              {selectedTicket.resolution && (
                <div>
                  <span className="font-bold text-emerald-700 block mb-1">Kết quả giải quyết:</span>
                  <p className="p-3 bg-emerald-50 text-emerald-900 rounded-lg leading-relaxed border border-emerald-100">
                    {selectedTicket.resolution} (Lúc: {selectedTicket.resolvedAt})
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Cập nhật trạng thái:</span>
                  <select
                    value={selectedTicket.status}
                    onChange={e => handleUpdateStatus(selectedTicket.id, e.target.value as any)}
                    className="bg-slate-100 border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                  >
                    <option value="new">Mới</option>
                    <option value="assigned">Đã gán</option>
                    <option value="in_progress">Đang xử lý</option>
                    <option value="waiting_user">Chờ người dùng</option>
                    <option value="resolved">Đã giải quyết</option>
                    <option value="closed">Đóng ticket</option>
                  </select>
                </div>

                <button
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HRM STAFF / REQUEST PICKER MODAL */}
      <HrmStaffOrRequestPickerModal
        isOpen={showHrmPicker}
        onClose={() => setShowHrmPicker(false)}
        onSelectEmployee={handleSelectHrmStaff}
        filterRequestCategory="it_support"
        title="Trích Xuất Người Yêu Cầu Hỗ Trợ IT Từ HRM"
        defaultTab={pickerDefaultTab}
      />
    </div>
  );
}
