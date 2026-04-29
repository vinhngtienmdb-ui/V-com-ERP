import React, { useState } from 'react';
import { 
 ShieldCheck, 
 Settings, 
 Users, 
 Lock, 
 Webhook, 
 Globe, 
 Database, 
 Key, 
 AppWindow, 
 CreditCard,
 Building2,
 Trash2,
 CheckCircle2,
 Plus,
 Sparkles,
 Zap,
 ArrowRight,
 ChevronLeft,
 Target,
 MapPin,
 Search,
 Edit2,
 Store,
 MessageSquare,
 AlertCircle,
 Image,
 Bell,
 Send,
 BadgeDollarSign,
 RefreshCw,
 Package,
 X,
 Check
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { PermissionRole, WebhookConfig, AiFeeSuggestion } from '../types/erp';
import { useNotifications } from '../context/NotificationContext';

interface Department { id: string; name: string; manager: string; staffCount: number; parentId?: string; }
interface JobTitle { id: string; name: string; department: string; description?: string; rank?: string; }
interface JobRank { id: string; name: string; level: number; }
interface CategoryFee { 
 id: string; 
 name: string; 
 sellerFee: number; 
 mallFee: number; 
 aiSuggestedSellerFee?: number; 
 aiSuggestedMallFee?: number; 
 aiReasoning?: string;
}

interface SystemFee {
 id: string;
 name: string;
 type: 'percentage' | 'fixed';
 value: number;
 description: string;
 isActive: boolean;
 applyTo: {
 sellerTypes: ('mall' | 'normal')[];
 categories: string[]; // ['1', '2'] or ['all']
 };
}

const MOCK_SYSTEM_FEES: SystemFee[] = [
 { 
 id: 'f1', 
 name: 'Phí cố định theo đơn (Fixed Fee)', 
 type: 'fixed', 
 value: 5000, 
 description: 'Phí xử lý đơn hàng cố định mỗi giao dịch thành công.', 
 isActive: true, 
 applyTo: { sellerTypes: ['mall', 'normal'], categories: ['all'] } 
 },
 { 
 id: 'f2', 
 name: 'Phí Marketing & Quảng cáo', 
 type: 'percentage', 
 value: 2, 
 description: 'Phí hỗ trợ các chương trình truyền thông chung trên Sàn.', 
 isActive: false, 
 applyTo: { sellerTypes: ['mall'], categories: ['1', '4'] } 
 },
 { 
 id: 'f3', 
 name: 'Phí đóng gói hỗ trợ (Fulfill)', 
 type: 'fixed', 
 value: 12000, 
 description: 'Áp dụng cho các ngành hàng cồng kềnh cần đóng gói đặc biệt.', 
 isActive: true, 
 applyTo: { sellerTypes: ['normal'], categories: ['3'] } 
 },
];

const MOCK_DEPARTMENTS: Department[] = [
 { id: 'D-001', name: 'Vận hành Sàn', manager: 'Lê Hoàng Minh', staffCount: 45 },
 { id: 'D-003', name: 'Kho vận nhánh HN', manager: 'Trần Văn B', staffCount: 10, parentId: 'D-001' },
 { id: 'D-002', name: 'Marketing', manager: 'Nguyễn Diệu Nhi', staffCount: 22 },
];
const MOCK_JOB_TITLES: JobTitle[] = [
 { id: 'T-001', name: 'Quản lý kho', department: 'D-001', description: 'Quản lý vận hành kho bãi, nhân sự kho.', rank: 'R-003' },
 { id: 'T-002', name: 'KOL Specialist', department: 'D-002', description: 'Tìm kiếm, làm việc và đàm phán với KOL/Influencer trên MXH.', rank: 'R-001' },
];
const MOCK_JOB_RANKS: JobRank[] = [
 { id: 'R-001', name: 'Nhân viên', level: 1 },
 { id: 'R-002', name: 'Trưởng nhóm', level: 2 },
 { id: 'R-003', name: 'Quản lý', level: 3 },
];

const MOCK_AI_FEE_SUGGESTIONS: AiFeeSuggestion[] = [
 { category: 'Điện tử & Công nghệ', currentFee: 3, suggestedFee: 3.5, reasoning: 'Nhu cầu cao, biên lợi nhuận seller ổn định ở mức 18%.', competitorAvg: 4, impactOnGmv: '+2.1% Revenue' },
 { category: 'Thời trang & Phụ kiện', currentFee: 8, suggestedFee: 7.2, reasoning: 'Cạnh tranh gắt gao, giảm phí để hút Seller chất lượng cao.', competitorAvg: 6.5, impactOnGmv: '+15% Seller Growth' },
];

const MOCK_ROLES: PermissionRole[] = [
 { id: '1', name: 'Siêu quản trị (Super Admin)', permissions: ['all'] },
 { id: '2', name: 'Quản lý (Manager)', permissions: ['dashboard.view', 'pim.view', 'pim.edit', 'orders.view', 'orders.edit', 'orders.approve', 'finance.view', 'hr.view', 'hr.edit'] },
 { id: '3', name: 'Nhân viên bán hàng (Sales)', permissions: ['dashboard.view', 'orders.view', 'orders.create', 'pim.view', 'customers.view'] },
 { id: '4', name: 'Kế toán (Accountant)', permissions: ['finance.view', 'finance.create', 'finance.edit', 'finance.approve', 'settlement.view', 'settlement.approve'] },
 { id: '5', name: 'Chăm sóc Khách hàng', permissions: ['customers.view', 'customers.edit', 'wallet.view', 'wallet.edit', 'loyalty.view'] },
];

const MODULE_PERMISSIONS = [
 { 
 id: 'core', 
 label: 'Hệ thống cốt lõi', 
 modules: [
 { id: 'dashboard', label: 'Dashboard & Báo cáo', actions: ['view'] },
 { id: 'bi', label: 'Phân tích dữ liệu (BI)', actions: ['view'] },
 { id: 'settings', label: 'Cấu hình hệ thống', actions: ['view', 'edit'] },
 ]
 },
 {
 id: 'commerce',
 label: 'Thưong mại & Bán hàng',
 modules: [
 { id: 'pim', label: 'Sản phẩm (PIM)', actions: ['view', 'create', 'edit', 'delete'] },
 { id: 'orders', label: 'Quản lý Đơn hàng', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
 { id: 'flash_sale', label: 'Flash Sale & Voucher', actions: ['view', 'create', 'edit', 'delete'] },
 { id: 'ipos', label: 'Phần mềm iPOS', actions: ['view', 'create', 'edit', 'delete'] },
 ]
 },
 {
 id: 'finance',
 label: 'Tài chính & Thanh toán',
 modules: [
 { id: 'finance', label: 'Kế toán tổng hợp', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
 { id: 'settlement', label: 'Đối soát & Công nợ', actions: ['view', 'edit', 'approve'] },
 { id: 'wallet', label: 'Ví & Thanh toán', actions: ['view', 'edit'] },
 ]
 },
 {
 id: 'hr',
 label: 'Nhân sự & Tổ chức',
 modules: [
 { id: 'hr', label: 'Quản trị nhân sự (HR)', actions: ['view', 'create', 'edit', 'delete'] },
 { id: 'org', label: 'Sơ đồ tổ chức', actions: ['view', 'edit'] },
 { id: 'payroll', label: 'Quản lý lương', actions: ['view', 'edit', 'approve'] },
 ]
 }
];

const MOCK_WEBHOOKS: WebhookConfig[] = [
 { id: '1', name: 'ERP Brand Samsung Integration', url: 'https://api.samsung.com/webhook', events: ['order.created', 'order.cancelled'], status: 'active' },
 { id: '2', name: 'GHTK Logistis Status', url: 'https://webhook.ghtk.vn/callback', events: ['delivery.status'], status: 'active' },
];

const SETTINGS_MODULE_GROUPS = [
 {
 title: 'Vận hành & Kinh doanh',
 items: [
 { id: 'general', label: 'Cấu hình chung', icon: Settings, desc: 'Cài đặt cơ bản hệ thống, Payout tự động', color: 'blue' },
 { id: 'fees', label: 'Phí sàn & Ngành hàng', icon: BadgeDollarSign, desc: 'Setup tỷ lệ hoa hồng theo từng ngành', color: 'emerald' },
 { id: 'website', label: 'Website & Menu', icon: Globe, desc: 'Quản lý biểu mẫu, tên miền và menu', color: 'indigo' },
 { id: 'inventory', label: 'Hàng hóa & Kho', icon: Package, desc: 'Phân loại mặt hàng và lưu kho', color: 'orange' },
 ]
 },
 {
 title: 'Hệ thống & Bảo mật',
 items: [
 { id: 'rbac', label: 'Phân quyền (Roles)', icon: Lock, desc: 'Điều hướng truy cập và quản lý Matrix Roles', color: 'purple' },
 { id: 'api', label: 'OpenAPI & Webhooks', icon: Webhook, desc: 'Cấp API token và bắn sự kiện Server', color: 'rose' },
 { id: 'popup', label: 'Popup & Thông báo', icon: Bell, desc: 'Thiết lập Push notification trung tâm', color: 'blue' },
 { id: 'comms', label: 'Tích hợp Kênh', icon: MessageSquare, desc: 'Cấu hình API gửi tin nhắn Zalo/SMS', color: 'cyan' },
 ]
 },
 {
 title: 'Cấu trúc & Hạ tầng',
 items: [
 { id: 'org', label: 'Cơ cấu Tổ chức', icon: Building2, desc: 'Cây phòng ban và chức danh nhân sự', color: 'emerald' },
 { id: 'stores', label: 'Chuỗi cửa hàng', icon: Store, desc: 'Cấu hình chi nhánh và subdomain', color: 'indigo' },
 { id: 'address', label: 'Địa chỉ Hành chính', icon: MapPin, desc: 'Danh mục Tỉnh/Thành/Phường/Xã', color: 'slate' },
 ]
 }
];

function getColorClasses(color: string) {
 switch (color) {
 case 'blue': return 'bg-[#F2F0E9] text-orange-700';
 case 'orange': return 'bg-orange-50 text-orange-600';
 case 'indigo': return 'bg-indigo-50 text-indigo-600';
 case 'purple': return 'bg-purple-50 text-purple-600';
 case 'emerald': return 'bg-emerald-50 text-emerald-600';
 case 'fuchsia': return 'bg-fuchsia-50 text-fuchsia-600';
 case 'rose': return 'bg-rose-50 text-rose-600';
 case 'cyan': return 'bg-cyan-50 text-cyan-600';
 case 'slate':
 default: return 'bg-stone-50 text-stone-600';
 }
}

const MOCK_PROVINCES = [
 { id: '1', name: 'Hà Nội', code: 'HN', wards: 579, status: 'active' },
 { id: '2', name: 'Hồ Chí Minh', code: 'HCM', wards: 312, status: 'active' },
 { id: '3', name: 'Đà Nẵng', code: 'DN', wards: 56, status: 'active' },
 { id: '4', name: 'Hải Phòng', code: 'HP', wards: 217, status: 'active' },
 { id: '5', name: 'Cần Thơ', code: 'CT', wards: 83, status: 'active' },
];

export function SettingsPage() {
 const [activeTab, setActiveTab] = useState<'overview' | 'general' | 'rbac' | 'api' | 'address' | 'org' | 'comms' | 'website' | 'stores' | 'fees' | 'popup' | 'inventory'>('overview');
 const [roles, setRoles] = useState<PermissionRole[]>(MOCK_ROLES);
 const [editingRole, setEditingRole] = useState<PermissionRole | null>(null);
 const [notiTitle, setNotiTitle] = useState('');
 const [notiMessage, setNotiMessage] = useState('');
 const [notiStatus, setNotiStatus] = useState('');
 const { addNotification } = useNotifications();
 const [categoryFees, setCategoryFees] = useState<CategoryFee[]>([
 { id: '1', name: 'Điện tử & Công nghệ', sellerFee: 3, mallFee: 5, aiSuggestedSellerFee: 3.5, aiSuggestedMallFee: 5.5, aiReasoning: 'Nhu cầu cao, biên lợi nhuận seller ổn định ở mức 18%.' },
 { id: '2', name: 'Thời trang & Phụ kiện', sellerFee: 8, mallFee: 12, aiSuggestedSellerFee: 7.2, aiSuggestedMallFee: 10.5, aiReasoning: 'Cạnh tranh gắt gao, giảm phí để hút Seller chất lượng cao.' },
 { id: '3', name: 'Gia dụng & Đời sống', sellerFee: 5, mallFee: 8 },
 { id: '4', name: 'Sức khỏe & Sắc đẹp', sellerFee: 10, mallFee: 15 },
 ]);
 const [systemFees, setSystemFees] = useState<SystemFee[]>(MOCK_SYSTEM_FEES);
 const [showFeeModal, setShowFeeModal] = useState(false);
 const [editingFee, setEditingFee] = useState<SystemFee | null>(null);
 const [newFee, setNewFee] = useState<Partial<SystemFee>>({
 type: 'percentage',
 value: 0,
 isActive: true,
 applyTo: { sellerTypes: ['normal'], categories: ['all'] }
 });
 const [isSaving, setIsSaving] = useState(false);
 const [customDomains, setCustomDomains] = useState<string[]>(['erp.vcom.vn']);
 const [showAddCategory, setShowAddCategory] = useState(false);
 const [newCategoryName, setNewCategoryName] = useState('');
 const [isScanningAI, setIsScanningAI] = useState(false);
 const [activeModuleTab, setActiveModuleTab] = useState(MODULE_PERMISSIONS[0].id);

 // Popup States
 const [isPopupActive, setIsPopupActive] = useState(false);
 const [popupTitle, setPopupTitle] = useState('Khuyến Mãi Hè 2024');
 const [popupDesc, setPopupDesc] = useState('Săn deal chớp nhoáng với rổ hàng giảm giá 50% cùng nhiều voucher độc quyền.');
 const [popupImage, setPopupImage] = useState('');
 const [popupCtaText, setPopupCtaText] = useState('Xem ngay');
 const [popupCtaLink, setPopupCtaLink] = useState('');

 // Job Title State
 const [jobTitles, setJobTitles] = useState<JobTitle[]>(MOCK_JOB_TITLES);
 const [showAddJobTitleModal, setShowAddJobTitleModal] = useState(false);
 const [editingJobTitle, setEditingJobTitle] = useState<JobTitle | null>(null);
 const [newJobTitle, setNewJobTitle] = useState<Partial<JobTitle>>({});

 const handleSaveJobTitle = () => {
 if (!newJobTitle.name || !newJobTitle.department) return;
 
 if (editingJobTitle) {
 setJobTitles(prev => prev.map(t => t.id === editingJobTitle.id ? { ...t, ...newJobTitle } as JobTitle : t));
 } else {
 setJobTitles([...jobTitles, { ...newJobTitle, id: `T-${Date.now()}` } as JobTitle]);
 }
 setShowAddJobTitleModal(false);
 setEditingJobTitle(null);
 setNewJobTitle({});
 };

 const addDomain = () => setCustomDomains([...customDomains, '']);
 const updateDomain = (index: number, value: string) => {
 const newDomains = [...customDomains];
 newDomains[index] = value;
 setCustomDomains(newDomains);
 };
 const removeDomain = (index: number) => {
 setCustomDomains(customDomains.filter((_, i) => i !== index));
 };

 const handleSave = () => {
 setIsSaving(true);
 setTimeout(() => {
 setIsSaving(false);
 alert('Đã lưu các thay đổi cấu hình thành công!');
 }, 1000);
 };

 const handleApplyAiSuggestion = (id: string) => {
 setCategoryFees(prev => prev.map(cf => {
 if (cf.id === id && cf.aiSuggestedSellerFee && cf.aiSuggestedMallFee) {
 return {
 ...cf,
 sellerFee: cf.aiSuggestedSellerFee,
 mallFee: cf.aiSuggestedMallFee
 };
 }
 return cf;
 }));
 const category = categoryFees.find(c => c.id === id);
 alert(`Đã áp dụng đề xuất tối ưu AI cho ngành hàng ${category?.name}`);
 };

 const handleAddCategory = () => {
 if (!newCategoryName.trim()) return;
 const newId = (categoryFees.length + 1).toString();
 setCategoryFees([...categoryFees, {
 id: newId,
 name: newCategoryName,
 sellerFee: 5,
 mallFee: 7
 }]);
 setNewCategoryName('');
 setShowAddCategory(false);
 };

 const handleAIScanCategories = () => {
 setIsScanningAI(true);
 setTimeout(() => {
 const newItems = [
 {
 id: (categoryFees.length + 1).toString(),
 name: 'Mẹ & Bé',
 sellerFee: 4,
 mallFee: 6,
 aiReasoning: 'Phân tích từ AI: Số lượng tìm kiếm "Bỉm sữa" tăng mạnh. Biên lợi nhuận mảng này khá ổn định.'
 },
 {
 id: (categoryFees.length + 2).toString(),
 name: 'Thể thao & Dã ngoại',
 sellerFee: 6,
 mallFee: 9,
 aiReasoning: 'Phân tích từ AI: Nhu cầu du lịch và thể thao tăng cao mùa thu/đông. Dữ liệu cross-platform (social & sàn TMĐT) cho thấy tiềm năng.'
 }
 ];
 setCategoryFees(prev => [...prev, ...newItems]);
 setIsScanningAI(false);
 alert('AI đã phân tích dữ liệu thị trường và tự động đề xuất thêm 2 ngành hàng tiềm năng!');
 }, 2000);
 };

 return (
 <>
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-serif tracking-tight text-2xl font-semibold text-[#111827]">Cấu hình & Tích hợp Hệ thống</h1>
 <p className="text-sm text-[#6B7280] mt-1">Phân quyền Ma trận roles, cấu hình Phí sàn và quản lý OpenAPI/Webhook.</p>
 </div>
 <div className="flex gap-3 items-center">
 <button className="bg-white border border-[#E5E7EB] px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-50 transition-all flex items-center gap-2">
 <RefreshCw className="w-4 h-4 text-emerald-600" />
 Lịch sử cấu hình
 </button>
 <button className="bg-white border border-[#E5E7EB] px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-50 transition-all flex items-center gap-2">
 <Sparkles className="w-4 h-4 text-purple-600" />
 AI Config Audit
 </button>
 <button 
 onClick={handleSave}
 disabled={isSaving}
 className="bg-[#2563EB] text-[#FAF9F5] px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-stone-800 transition-all shadow-sm disabled:opacity-50"
 >
 {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
 </button>
 </div>
 </div>

 <div className="flex flex-col gap-6">
 {/* Main Grid or Content Area */}
 {activeTab !== 'overview' && (
 <div className="flex items-center gap-4 mb-4">
 <button 
 onClick={() => setActiveTab('overview')} 
 className="flex items-center gap-2 text-sm font-bold text-stone-500 hover:text-[#2563EB] bg-white px-4 py-2 rounded-lg shadow-sm border border-stone-200 transition-colors"
 >
 <ChevronLeft className="w-4 h-4" /> Tổng quan Cấu hình
 </button>
 <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
 {[
 { id: 'general', label: 'Cấu hình chung', icon: Settings },
 { id: 'fees', label: 'Cấu hình Phí sàn', icon: BadgeDollarSign },
 { id: 'website', label: 'Cấu hình Website', icon: Globe },
 { id: 'popup', label: 'Cấu hình Popup & Thông báo', icon: Bell },
 { id: 'comms', label: 'Tích hợp Kênh', icon: MessageSquare },
 { id: 'rbac', label: 'Phân quyền & Roles', icon: Lock },
 { id: 'api', label: 'OpenAPI & Webhooks', icon: Webhook },
 { id: 'address', label: 'Cấu hình Tỉnh/Thành', icon: MapPin },
 { id: 'org', label: 'Cơ cấu Tổ chức', icon: Building2 },
 { id: 'stores', label: 'Quản lý Chuỗi cửa hàng', icon: Store },
 { id: 'inventory', label: 'Hàng hóa & Kho', icon: Package },
 ].filter(t => t.id === activeTab).map(t => (
 <React.Fragment key={t.id}>
 <t.icon className="w-5 h-5 text-[#2563EB]" /> {t.label}
 </React.Fragment>
 ))}
 </h2>
 </div>
 )}

 {/* Content Area */}
 <div className="flex-1 space-y-6">
 {activeTab === 'overview' && (
 <div className="animate-in fade-in slide-in- duration-500 space-y-8">
 {/* Dashboard Cards similar to HRM */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Vai trò hệ thống</span>
 <Lock className="w-4 h-4 text-purple-600" />
 </div>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-bold text-[#111827]">{roles.length} Roles</span>
 <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Bảo mật cao</span>
 </div>
 </div>
 <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Tên miền trỏ về</span>
 <Globe className="w-4 h-4 text-orange-700" />
 </div>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-bold text-[#111827]">{customDomains.length} Domains</span>
 <span className="text-[10px] text-orange-700 font-bold bg-[#F2F0E9] px-2 py-0.5 rounded">Đã xác thực</span>
 </div>
 </div>
 <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Điểm Webhook</span>
 <Webhook className="w-4 h-4 text-orange-600" />
 </div>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-bold text-[#111827]">{MOCK_WEBHOOKS.length} Endpoints</span>
 <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded">100% Uptime</span>
 </div>
 </div>
 <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Ngành hàng</span>
 <BadgeDollarSign className="w-4 h-4 text-emerald-600" />
 </div>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-bold text-[#111827]">{categoryFees.length} Nhóm</span>
 <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">Tối ưu AI</span>
 </div>
 </div>
 </div>

 {/* Grouped Modules grid like HRM */}
 <div className="space-y-6">
 {SETTINGS_MODULE_GROUPS.map((group, gIdx) => (
 <div key={gIdx} className="space-y-4">
 <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2 px-1">
 <div className="w-1 h-4 bg-[#2563EB] rounded-full" />
 {group.title}
 </h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
 {group.items.map((mod) => (
 <div 
 key={mod.id}
 onClick={() => setActiveTab(mod.id as any)}
 className="group bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-sm hover:shadow-sm hover:border-[#2563EB]/50 transition-all cursor-pointer flex flex-col gap-4 relative overflow-hidden"
 >
 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
 <mod.icon className="w-24 h-24 transform -rotate-12 translate-x-4 -translate-y-4" />
 </div>
 <div className={cn("w-12 h-12 rounded relative z-10 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#2563EB] group-hover:text-[#FAF9F5] transition-all shadow-sm", getColorClasses(mod.color))}>
 <mod.icon className="w-6 h-6" />
 </div>
 <div className="relative z-10">
 <h3 className="font-bold text-[#111827] text-sm mb-1.5 group-hover:text-[#2563EB] transition-colors">{mod.label}</h3>
 <p className="text-[11px] text-[#6B7280] leading-relaxed line-clamp-2">{mod.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 {activeTab === 'general' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm space-y-4">
 <h3 className="font-bold text-[#111827]">Cấu hình ví & Payout</h3>
 <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg border border-stone-100">
 <div className="space-y-1">
 <p className="text-sm font-bold text-stone-900">Tính năng Duyệt Payout tự động</p>
 <p className="text-[10px] text-stone-500 italic text-pretty max-w-md">Nếu được bật, hệ thống sẽ tự động giải ngân cho Seller khi đơn hàng chuyển sang trạng thái "Thành công" và qua thời gian khiếu nại (7 ngày).</p>
 </div>
 <div className="w-12 h-6 bg-[#2563EB] rounded-full relative cursor-pointer">
 <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
 </div>
 </div>
 </div>

 <div className="flex justify-end gap-3 pt-4">
 <button className="px-6 py-2.5 rounded-lg text-sm font-bold text-[#6B7280] hover:bg-stone-100 transition-all border border-transparent">
 Hủy bỏ
 </button>
 <button className="px-6 py-2.5 bg-[#2563EB] text-[#FAF9F5] rounded-lg text-sm font-bold hover:bg-stone-800 transition-all shadow-sm shadow-stone-900/5 active:scale-95">
 Lưu cấu hình
 </button>
 </div>
 </div>
 )}

 {activeTab === 'fees' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 {/* Section 1: Dynamic System Fees */}
 <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm space-y-4">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="font-bold text-[#111827] flex items-center gap-2">
 <AlertCircle className="w-4 h-4 text-orange-500" /> Quản lý các loại Chi phí Hệ thống hỗ trợ
 </h3>
 <p className="text-xs text-stone-500 mt-1">Cấu hình linh hoạt các loại phí phát sinh ngoài phí hoa hồng (Fixed hoặc %).</p>
 </div>
 <button 
 onClick={() => { setEditingFee(null); setNewFee({ type: 'percentage', value: 0, isActive: true, applyTo: { sellerTypes: ['normal'], categories: ['all'] } }); setShowFeeModal(true); }}
 className="flex items-center gap-2 bg-[#111827] text-[#FAF9F5] px-4 py-2 rounded-lg text-xs font-bold hover:bg-stone-800 transition-all shadow-sm"
 >
 <Plus className="w-4 h-4" /> Thêm loại phí mới
 </button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
 {systemFees.map((fee) => (
 <div key={fee.id} className={cn("p-4 rounded-xl border transition-all relative overflow-hidden group", fee.isActive ? "bg-white border-stone-200" : "bg-stone-50 border-stone-100 opacity-60")}>
 <div className="flex justify-between items-start mb-3 relative z-10">
 <div className="flex items-center gap-2">
 <div className={cn("p-2 rounded-lg", fee.type === 'fixed' ? "bg-[#F2F0E9] text-orange-700" : "bg-purple-50 text-purple-600")}>
 {fee.type === 'fixed' ? <BadgeDollarSign className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
 </div>
 <div>
 <h4 className="font-bold text-sm text-stone-900 line-clamp-1">{fee.name}</h4>
 <p className="text-[10px] text-stone-500">{fee.type === 'fixed' ? 'Số tiền cố định' : 'Tỷ lệ % doanh thu'}</p>
 </div>
 </div>
 <div 
 onClick={() => setSystemFees(systemFees.map(f => f.id === fee.id ? { ...f, isActive: !f.isActive } : f))}
 className={cn("w-10 h-5 rounded-full relative cursor-pointer transition-colors shrink-0", fee.isActive ? "bg-emerald-500" : "bg-stone-300")}
 >
 <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", fee.isActive ? "right-1" : "left-1")} />
 </div>
 </div>

 <div className="mb-4 relative z-10">
 <span className={cn("text-2xl font-black", fee.type === 'fixed' ? "text-orange-700" : "text-purple-600")}>
 {fee.type === 'fixed' ? formatCurrency(fee.value) : `${fee.value}%`}
 </span>
 <div className="mt-2 space-y-1.5">
 <div className="flex items-center gap-1.5 text-[10px] text-stone-600">
 <Users className="w-3 h-3" />
 {fee.applyTo.sellerTypes.map(st => st === 'mall' ? 'Shop Mall' : 'Seller thường').join(', ')}
 </div>
 <div className="flex items-center gap-1.5 text-[10px] text-stone-600">
 <Package className="w-3 h-3" />
 {fee.applyTo.categories.includes('all') ? 'Tất cả ngành hàng' : `Áp dụng ${fee.applyTo.categories.length} nhóm`}
 </div>
 </div>
 </div>

 <div className="flex justify-end gap-2 relative z-10 opacity-0 group-hover:opacity-100 transition-opacity">
 <button 
 onClick={() => { setEditingFee(fee); setNewFee(fee); setShowFeeModal(true); }}
 className="p-1.5 text-orange-700 hover:bg-[#F2F0E9] rounded"
 >
 <Edit2 className="w-3.5 h-3.5" />
 </button>
 <button 
 onClick={() => setSystemFees(systemFees.filter(f => f.id !== fee.id))}
 className="p-1.5 text-red-500 hover:bg-red-50 rounded"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 
 <div className="absolute -bottom-4 -right-4 opacity-[0.03] rotate-12 group-hover:scale-110 transition-transform">
 {fee.type === 'fixed' ? <BadgeDollarSign className="w-24 h-24" /> : <Zap className="w-24 h-24" />}
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Section 2: Platform Commission (Existing) */}
 <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm space-y-4">
 <div className="flex items-center justify-between mb-4">
 <div>
 <h3 className="font-bold text-[#111827] flex items-center gap-2 text-sm">
 <BadgeDollarSign className="w-4 h-4 text-[#2563EB]" /> Phí hoa hồng theo Ngành hàng & Loại Nhà Bán
 </h3>
 <p className="text-xs text-stone-500 mt-1">Cấu hình linh hoạt mức phí Sàn thu từ Seller thường và Shop Mall (đối tác chính hãng).</p>
 </div>
 <div className="flex gap-2">
 <button 
 onClick={handleAIScanCategories}
 disabled={isScanningAI}
 className="flex items-center gap-1.5 text-xs bg-emerald-600 text-[#FAF9F5] px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
 >
 <RefreshCw className={cn("w-4 h-4", isScanningAI ? "animate-spin" : "")} /> 
 {isScanningAI ? 'AI đang phân tích...' : 'AI đề xuất ngành hàng'}
 </button>
 <button 
 onClick={() => setShowAddCategory(true)}
 className="flex items-center gap-1.5 text-xs bg-indigo-600 text-[#FAF9F5] px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm"
 >
 <Plus className="w-4 h-4" /> Thêm ngành hàng
 </button>
 </div>
 </div>

 {showAddCategory && (
 <div className="mb-4 p-4 bg-stone-50 border border-stone-200 rounded-xl flex items-center gap-3 animate-in slide-in- duration-200">
 <label className="text-sm font-bold text-stone-700 whitespace-nowrap">Tên ngành hàng:</label>
 <input 
 type="text" 
 placeholder="VD: Mẹ & Bé, Đồ gia dụng..." 
 className="flex-1 p-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
 value={newCategoryName}
 onChange={(e) => setNewCategoryName(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
 />
 <button onClick={handleAddCategory} className="px-5 py-2 bg-indigo-600 text-[#FAF9F5] rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700">Lưu</button>
 <button onClick={() => setShowAddCategory(false)} className="px-5 py-2 bg-stone-200 text-stone-700 rounded-lg text-sm font-bold shadow-sm hover:bg-stone-300">Hủy</button>
 </div>
 )}

 <div className="border border-[#E5E7EB] rounded-lg overflow-hidden shadow-sm">
 <table className="w-full text-sm">
 <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
 <tr>
 <th className="px-5 py-4 text-left font-bold text-[#6B7280] text-xs uppercase tracking-wider w-[30%]">Ngành hàng</th>
 <th className="px-5 py-4 text-center border-l border-stone-200 bg-[#F2F0E9]/50 w-[25%]">
 <div className="flex flex-col items-center gap-1">
 <span className="font-bold text-blue-800 text-[11px] uppercase tracking-wider">Seller Thường</span>
 <span className="text-[9px] font-medium text-orange-700">Nhà bán cá nhân/nhỏ lẻ</span>
 </div>
 </th>
 <th className="px-5 py-4 text-center border-l border-stone-200 bg-amber-50/50 w-[25%]">
 <div className="flex flex-col items-center gap-1">
 <span className="font-bold text-amber-800 text-[11px] uppercase tracking-wider">Shop Mall</span>
 <span className="text-[9px] font-medium text-amber-600">Đối tác chính hãng</span>
 </div>
 </th>
 <th className="px-5 py-4 text-right font-bold text-[#6B7280] text-[10px] uppercase tracking-wider w-[20%]">Tối ưu AI</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#E5E7EB] bg-white">
 {categoryFees.map((cf) => (
 <tr key={cf.id} className="hover:bg-stone-50/50 transition-colors group">
 <td className="px-5 py-4 text-sm font-bold text-stone-800">{cf.name}</td>
 <td className="px-5 py-4 border-l border-stone-100 bg-[#F2F0E9]/10">
 <div className="flex justify-center flex-col items-center gap-1.5">
 <div className="flex items-center gap-2">
 <input 
 type="number"
 value={cf.sellerFee}
 onChange={(e) => setCategoryFees(prev => prev.map(p => p.id === cf.id ? { ...p, sellerFee: parseFloat(e.target.value) } : p))}
 className="w-16 p-1.5 text-sm border-2 border-[#EAE7DF] rounded-lg text-center focus:outline-none focus:border-stone-900 font-bold text-blue-900 bg-white"
 />
 <span className="text-xs font-bold text-orange-500">%</span>
 </div>
 {cf.aiSuggestedSellerFee && cf.aiSuggestedSellerFee !== cf.sellerFee && (
 <span className="text-[10px] text-orange-700 font-bold bg-[#EAE7DF] px-2 py-0.5 rounded-full">AI khuyên dùng: {cf.aiSuggestedSellerFee}%</span>
 )}
 </div>
 </td>
 <td className="px-5 py-4 border-l border-stone-100 bg-amber-50/10">
 <div className="flex justify-center flex-col items-center gap-1.5">
 <div className="flex items-center gap-2">
 <input 
 type="number"
 value={cf.mallFee}
 onChange={(e) => setCategoryFees(prev => prev.map(p => p.id === cf.id ? { ...p, mallFee: parseFloat(e.target.value) } : p))}
 className="w-16 p-1.5 text-sm border-2 border-amber-100 rounded-lg text-center focus:outline-none focus:border-amber-500 font-bold text-amber-900 bg-white"
 />
 <span className="text-xs font-bold text-amber-400">%</span>
 </div>
 {cf.aiSuggestedMallFee && cf.aiSuggestedMallFee !== cf.mallFee && (
 <span className="text-[10px] text-amber-600 font-bold bg-amber-100 px-2 py-0.5 rounded-full">AI khuyên dùng: {cf.aiSuggestedMallFee}%</span>
 )}
 </div>
 </td>
 <td className="px-5 py-4 text-right">
 {cf.aiSuggestedSellerFee && (
 <button 
 onClick={() => handleApplyAiSuggestion(cf.id)}
 className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100 hover:bg-indigo-600 hover:text-[#FAF9F5] transition-all shadow-sm opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100"
 title={`Gợi ý: ${cf.aiReasoning}`}
 >
 <Sparkles className="w-4 h-4" /> Áp dụng
 </button>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'website' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm space-y-6">
 <h3 className="font-bold text-[#111827] flex items-center gap-2 text-sm border-b border-[#F3F4F6] pb-3">
 <Globe className="w-4 h-4 text-[#2563EB]" /> Cấu hình Website Tổng (Hệ thống ERP & Storefront)
 </h3>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-[#6B7280] mb-1 uppercase tracking-wider">Danh sách tên miền</label>
 <div className="space-y-2">
 {customDomains.map((domain, index) => (
 <div key={index} className="flex gap-2">
 <input 
 type="text" 
 value={domain} 
 onChange={(e) => updateDomain(index, e.target.value)}
 placeholder="ví dụ: store.domain.com" 
 className="flex-1 p-3 rounded-lg border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-stone-900 transition-all" 
 />
 <button onClick={() => removeDomain(index)} className="p-3 text-red-500 hover:bg-red-50 rounded-lg">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 ))}
 <button onClick={addDomain} className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1 mt-2">
 <Plus className="w-3 h-3" /> Thêm tên miền mới
 </button>
 </div>
 <p className="text-[10px] text-[#9CA3AF] mt-1.5 leading-relaxed">Tên miền trỏ về hệ thống VComm ERP.</p>
 </div>
 </div>

 <div className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-[#6B7280] mb-1 uppercase tracking-wider">Logo Toàn Hệ Thống</label>
 <div className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-6 text-center hover:bg-stone-50 transition-colors">
 <input type="file" id="logo-upload" className="hidden" accept="image/*" />
 <label htmlFor="logo-upload" className="cursor-pointer text-xs font-bold text-[#2563EB]">
 Nhấn để tải lên hoặc kéo thả Logo
 </label>
 <p className="text-[10px] text-[#9CA3AF] mt-1">PNG, JPG tối đa 5MB</p>
 </div>
 </div>
 </div>
 <div className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-[#6B7280] mb-1 uppercase tracking-wider">Favicon Hệ Thống</label>
 <div className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-6 text-center hover:bg-stone-50 transition-colors">
 <input type="file" id="favicon-upload" className="hidden" accept="image/x-icon,image/png" />
 <label htmlFor="favicon-upload" className="cursor-pointer text-xs font-bold text-[#2563EB]">
 Nhấn để tải lên hoặc kéo thả Favicon
 </label>
 <p className="text-[10px] text-[#9CA3AF] mt-1">ICO, PNG (32x32px)</p>
 </div>
 </div>
 </div>
 </div>

 <div className="flex justify-end gap-3 pt-4 border-t border-[#F3F4F6] mt-6">
 <button className="px-6 py-2.5 bg-[#2563EB] text-[#FAF9F5] rounded-lg text-sm font-bold hover:bg-stone-800 transition-all shadow-sm active:scale-95">
 Lưu cấu hình website
 </button>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'rbac' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 {!editingRole ? (
 <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden">
 <div className="p-4 bg-[#F9FAFB] border-b border-[#F3F4F6] flex justify-between items-center">
 <h3 className="font-bold text-[#111827] flex items-center gap-2 text-sm">
 <Lock className="w-4 h-4 text-orange-700" /> Quản lý Vai trò & Phân quyền
 </h3>
 <button 
 onClick={() => {
 const newId = (roles.length + 1).toString();
 const newRole: PermissionRole = { id: newId, name: 'Vai trò mới', permissions: [] };
 setRoles([...roles, newRole]);
 setEditingRole(newRole);
 }}
 className="flex items-center gap-2 text-xs font-bold text-[#2563EB] hover:underline"
 >
 <Plus className="w-3.5 h-3.5" /> Tạo Vai trò mới
 </button>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
 <th className="px-6 py-3 text-[10px] font-bold text-[#6B7280] uppercase">Tên Vai trò</th>
 <th className="px-6 py-3 text-[10px] font-bold text-[#6B7280] uppercase">Số quyền hạn</th>
 <th className="px-6 py-3 text-[10px] font-bold text-[#6B7280] uppercase text-right">Thao tác</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#F3F4F6]">
 {roles.map(role => (
 <tr key={role.id} className="hover:bg-stone-50 transition-colors group">
 <td className="px-6 py-4">
 <div className="flex flex-col">
 <span className="text-sm font-bold text-[#111827]">{role.name}</span>
 <span className="text-[10px] text-stone-400 font-mono">ID: {role.id}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <span className="px-2 py-0.5 bg-[#F2F0E9] text-[#2563EB] text-[10px] font-bold rounded-full border border-[#EAE7DF]">
 {role.permissions.includes('all') ? 'Toàn quyền' : `${role.permissions.length} quyền chi tiết`}
 </span>
 </td>
 <td className="px-6 py-4 text-right">
 <button 
 onClick={() => setEditingRole(role)}
 className="text-xs font-bold text-[#2563EB] hover:bg-[#F2F0E9] px-3 py-1.5 rounded-lg transition-all"
 >
 Thiết lập chi tiết
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 ) : (
 <div className="space-y-6 animate-in slide-in- duration-300">
 <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-[#E5E7EB] shadow-sm">
 <div className="flex items-center gap-4">
 <button 
 onClick={() => setEditingRole(null)}
 className="p-2 hover:bg-stone-100 rounded-lg transition-all"
 >
 <ArrowRight className="w-5 h-5 rotate-180 text-stone-400" />
 </button>
 <div>
 <div className="flex items-center gap-2">
 <input 
 type="text" 
 value={editingRole.name}
 onChange={(e) => setEditingRole({...editingRole, name: e.target.value})}
 className="text-lg font-bold text-stone-900 border-b border-transparent hover:border-stone-300 focus:border-stone-900 focus:outline-none bg-transparent"
 />
 <Edit2 className="w-4 h-4 text-stone-300" />
 </div>
 <p className="text-xs text-stone-500">Thiết lập ma trận quyền cho {editingRole.name}</p>
 </div>
 </div>
 <div className="flex gap-2">
 <button 
 onClick={() => setEditingRole(null)}
 className="px-4 py-2 text-sm font-bold text-stone-600 hover:bg-stone-100 rounded-lg transition-all"
 >
 Hủy bỏ
 </button>
 <button 
 onClick={() => {
 setRoles(roles.map(r => r.id === editingRole.id ? editingRole : r));
 setEditingRole(null);
 addNotification({
 title: 'Đã cập nhật phân quyền',
 message: `Vai trò ${editingRole.name} đã được lưu thành công.`,
 type: 'success',
 duration: 3000
 });
 }}
 className="px-6 py-2 bg-[#2563EB] text-[#FAF9F5] text-sm font-bold rounded-lg hover:bg-stone-800 transition-all shadow-sm shadow-stone-900/5"
 >
 Lưu thay đổi
 </button>
 </div>
 </div>

 <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden">
 <div className="p-4 bg-stone-50 border-b border-stone-200 flex justify-between items-center">
 <h4 className="font-bold text-stone-800 text-sm">Ma trận Quyền hạn chi tiết</h4>
 <label className="flex items-center gap-2 cursor-pointer">
 <input 
 type="checkbox" 
 checked={editingRole.permissions.includes('all')}
 onChange={(e) => {
 if (e.target.checked) {
 setEditingRole({...editingRole, permissions: ['all']});
 } else {
 setEditingRole({...editingRole, permissions: []});
 }
 }}
 className="w-4 h-4 text-orange-700 rounded border-stone-300 focus:ring-orange-600"
 />
 <span className="text-xs font-bold text-stone-700">Gán Toàn quyền (Super Admin)</span>
 </label>
 </div>
 
 <div className="bg-white border-b border-stone-200">
 <div className="flex px-4 gap-6">
 {MODULE_PERMISSIONS.map(group => (
 <button
 key={group.id}
 onClick={() => setActiveModuleTab(group.id)}
 className={cn(
 "py-4 text-sm font-bold transition-all border-b-2",
 activeModuleTab === group.id
 ? "border-stone-900 text-orange-700"
 : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
 )}
 >
 {group.label}
 </button>
 ))}
 </div>
 </div>
 
 <div className="p-6">
 {MODULE_PERMISSIONS.filter(group => group.id === activeModuleTab).map(group => (
 <div key={group.id} className="space-y-4 animate-in fade-in slide-in- duration-300">
 <div className="grid grid-cols-1 gap-3">
 {group.modules.map(module => (
 <div key={module.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-100 hover:bg-white hover:shadow-sm transition-all group">
 <div className="space-y-1">
 <p className="text-sm font-bold text-stone-800">{module.label}</p>
 <p className="text-[10px] text-stone-400 font-mono uppercase">Module: {module.id}</p>
 </div>
 <div className="flex gap-4 flex-wrap justify-end">
 {module.actions.map(action => {
 const permissionKey = `${module.id}.${action}`;
 const isChecked = editingRole.permissions.includes('all') || editingRole.permissions.includes(permissionKey);
 const isDisabled = editingRole.permissions.includes('all');
 
 return (
 <label key={action} className={cn(
 "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer select-none",
 isChecked ? "bg-[#F2F0E9] border-orange-200 text-orange-800" : "bg-white border-stone-200 text-stone-500 hover:border-stone-300",
 isDisabled && "opacity-50 cursor-not-allowed"
 )}>
 <input 
 type="checkbox"
 checked={isChecked}
 disabled={isDisabled}
 onChange={(e) => {
 const newPermissions = e.target.checked 
 ? [...editingRole.permissions, permissionKey]
 : editingRole.permissions.filter(p => p !== permissionKey);
 setEditingRole({...editingRole, permissions: newPermissions});
 }}
 className="w-3.5 h-3.5 text-orange-700 rounded border-stone-300 focus:ring-orange-600"
 />
 <span className="text-[10px] font-bold uppercase tracking-tight">
 {action === 'view' ? 'Xem' : 
 action === 'create' ? 'Tạo' : 
 action === 'edit' ? 'Sửa' : 
 action === 'delete' ? 'Xóa' : 
 action === 'approve' ? 'Duyệt' : action}
 </span>
 </label>
 );
 })}
 </div>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}
 </div>
 )}

 {activeTab === 'api' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm space-y-4">
 <h3 className="font-bold text-[#111827] flex items-center gap-2">
 <Key className="w-4 h-4 text-orange-500" /> API Keys & Access Tokens
 </h3>
 <p className="text-xs text-[#6B7280]">Cấp quyền cho bên thứ 3 (Brand, Logistics) truy cập trực tiếp vào API sàn.</p>
 <div className="p-3 bg-stone-50 rounded-lg font-mono text-[10px] text-stone-500 flex justify-between items-center">
 <span>sk_live_vcomm_*********************</span>
 <button className="text-[#2563EB] font-bold">Copy</button>
 </div>
 <button className="w-full py-2 border border-[#E5E7EB] rounded-lg text-xs font-bold hover:bg-stone-50">Tạo mới Secret Key</button>
 </div>
 <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm space-y-4">
 <h3 className="font-bold text-[#111827] flex items-center gap-2">
 <AppWindow className="w-4 h-4 text-[#2563EB]" /> Webhook Settings
 </h3>
 <p className="text-xs text-[#6B7280]">Tự động đẩy thông báo sự kiện (Đơn hàng, Đối soát) về Server đối tác.</p>
 <div className="space-y-3">
 {MOCK_WEBHOOKS.map(wb => (
 <div key={wb.id} className="p-3 bg-stone-50 rounded-lg border border-stone-100 flex items-center justify-between">
 <div className="space-y-1">
 <p className="text-[10px] font-bold text-stone-900">{wb.name}</p>
 <p className="text-[9px] text-stone-400 font-mono truncate max-w-[150px]">{wb.url}</p>
 </div>
 <button className="p-1.5 hover:bg-red-50 text-red-500 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
 </div>
 ))}
 </div>
 <button className="w-full py-2 bg-[#111827] text-[#FAF9F5] rounded-lg text-xs font-bold hover:bg-stone-800">Cấu hình Webhook mới</button>
 </div>
 </div>

 <div className="bg-blue-900 text-[#FAF9F5] p-6 rounded-lg flex items-center gap-6">
 <div className="p-4 bg-white/10 rounded-lg border border-white/20">
 <Globe className="w-8 h-8 text-blue-300" />
 </div>
 <div>
 <h4 className="font-bold text-lg mb-1">OpenAPI Public Documentation</h4>
 <p className="text-stone-400 text-xs">Cung cấp tài liệu tích hợp (Swagger/Postman) cho cộng đồng phát triển và đối tác chiến lược để kết nối trực tiếp kho hàng Brand với vận hành sàn.</p>
 <div className="flex gap-4 mt-3">
 <button className="text-xs font-bold text-blue-300 hover:underline">Download API Spec</button>
 <button className="text-xs font-bold text-blue-300 hover:underline">Xem Sandbox logs</button>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'address' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm space-y-6">
 <div className="flex justify-between items-center">
 <h3 className="font-bold text-[#111827] flex items-center gap-2">
 <MapPin className="w-5 h-5 text-orange-700" /> Cấu hình Địa chỉ Hành chính (2 cấp)
 </h3>
 <button className="flex items-center gap-2 bg-[#2563EB] text-[#FAF9F5] px-4 py-2 rounded-lg text-xs font-bold hover:bg-stone-800 transition-all shadow-sm">
 <Plus className="w-4 h-4" /> Thêm Tỉnh/Thành
 </button>
 </div>

 <div className="flex gap-4 mb-4">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
 <input type="text" placeholder="Tìm kiếm tỉnh/thành phố..." className="w-full bg-stone-50 border border-[#E5E7EB] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-stone-900 transition-all" />
 </div>
 </div>

 <div className="bg-stone-50 border border-stone-200 rounded-lg overflow-hidden">
 <table className="w-full text-left text-sm">
 <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280]">
 <tr>
 <th className="px-6 py-4 font-medium">Tên Tỉnh/Thành</th>
 <th className="px-6 py-4 font-medium">Mã code</th>
 <th className="px-6 py-4 font-medium">Số lượng Phường/Xã (Cấp 2)</th>
 <th className="px-6 py-4 font-medium text-center">Trạng thái</th>
 <th className="px-6 py-4 font-medium text-right">Thao tác</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#E5E7EB] bg-white">
 {MOCK_PROVINCES.map((prov) => (
 <tr key={prov.id} className="hover:bg-stone-50 transition-colors group">
 <td className="px-6 py-4 font-medium text-stone-900">{prov.name}</td>
 <td className="px-6 py-4">
 <span className="font-mono text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-md border border-stone-200">{prov.code}</span>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-3 text-stone-600">
 <div>
 <span className="text-sm font-bold text-orange-700">{prov.wards}</span> đơn vị
 </div>
 <button className="text-[10px] text-orange-600 border border-[#EAE7DF] bg-[#F2F0E9] px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase tracking-wider hover:bg-[#EAE7DF]">Quản lý cấp 2</button>
 </div>
 </td>
 <td className="px-6 py-4 text-center">
 <span className={cn(
 "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
 prov.status === 'active' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-stone-100 text-stone-500 border border-stone-200"
 )}>
 {prov.status === 'active' ? 'Hoạt động' : 'Tạm ngưng'}
 </span>
 </td>
 <td className="px-6 py-4 text-right">
 <button className="p-1.5 text-stone-400 hover:text-orange-700 hover:bg-[#F2F0E9] rounded-lg transition-colors">
 <Edit2 className="w-4 h-4" />
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'org' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm space-y-6">
 <div className="flex justify-between items-center">
 <h3 className="font-bold text-[#111827] flex items-center gap-2">
 <Building2 className="w-5 h-5 text-orange-700" /> Quản lý Cơ cấu Tổ chức
 </h3>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 md:col-span-1">
 <h4 className="font-bold text-stone-800 mb-4">Phòng ban</h4>
 {MOCK_DEPARTMENTS.map((dept) => (
 <div key={dept.id} className={cn("bg-white p-3 rounded-lg border border-stone-100 mb-2 flex justify-between items-center", dept.parentId ? "ml-6 border-l-4 border-l-blue-400" : "")}>
 <span className="text-sm font-medium">{dept.name}</span>
 <button className="text-[10px] bg-stone-100 px-2 py-1 rounded">Sửa</button>
 </div>
 ))}
 </div>
 <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 md:col-span-1">
 <div className="flex justify-between items-center mb-4">
 <h4 className="font-bold text-stone-800">Chức danh</h4>
 <button 
 onClick={() => { setNewJobTitle({}); setEditingJobTitle(null); setShowAddJobTitleModal(true); }}
 className="text-xs bg-stone-900 text-[#FAF9F5] px-2 py-1 rounded hover:bg-stone-800 transition"
 >
 <Plus className="w-3 h-3 inline" /> Thêm
 </button>
 </div>
 <div className="space-y-2 h-[400px] overflow-y-auto pr-1">
 {jobTitles.map((title) => (
 <div key={title.id} className="bg-white p-3 rounded-lg border border-stone-100 shadow-sm">
 <div className="flex justify-between items-start mb-1">
 <div className="font-bold text-sm text-stone-900">{title.name}</div>
 <button 
 onClick={() => { setEditingJobTitle(title); setNewJobTitle(title); setShowAddJobTitleModal(true); }}
 className="text-[10px] text-orange-700 hover:bg-[#F2F0E9] px-2 py-1 rounded"
 >Sửa</button>
 </div>
 <div className="text-xs text-stone-500 mb-1 line-clamp-2" title={title.description}>{title.description || 'Chưa có mô tả'}</div>
 <div className="flex gap-2 text-[10px]">
 <span className="bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
 Phòng: {MOCK_DEPARTMENTS.find(d => d.id === title.department)?.name || title.department}
 </span>
 {title.rank && (
 <span className="bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">
 Cấp bậc: {MOCK_JOB_RANKS.find(r => r.id === title.rank)?.name || title.rank}
 </span>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 md:col-span-1">
 <div className="flex justify-between items-center mb-4">
 <h4 className="font-bold text-stone-800">Cấp bậc</h4>
 <button className="text-xs bg-stone-200 text-stone-700 px-2 py-1 rounded hover:bg-stone-300 transition">
 <Plus className="w-3 h-3 inline" /> Thêm
 </button>
 </div>
 <div className="space-y-2">
 {MOCK_JOB_RANKS.map((item) => (
 <div key={item.id} className="bg-white p-3 rounded-lg border border-stone-100 flex justify-between items-center shadow-sm">
 <div>
 <div className="text-sm font-medium">{item.name}</div>
 <div className="text-[10px] text-stone-400">Level: {item.level}</div>
 </div>
 <button className="text-[10px] bg-stone-100 px-2 py-1 rounded">Sửa</button>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'stores' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm space-y-6">
 <div className="flex justify-between items-center">
 <h3 className="font-bold text-stone-900 flex items-center gap-2">
 <Building2 className="w-5 h-5 text-orange-700" /> Quản lý Chuỗi cửa hàng / Chi nhánh
 </h3>
 <button className="bg-[#F2F0E9] text-orange-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#EAE7DF] flex items-center gap-2">
 <Plus className="w-4 h-4" /> Thêm Cửa hàng
 </button>
 </div>

 <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-5 mb-6">
 <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2"><Globe className="w-4 h-4" /> Cấu hình Tên miền (Domain)</h4>
 <p className="text-sm text-indigo-700 mb-4">Các chi nhánh có thể chạy trên subdomain riêng biệt, cung cấp cho nhân viên thu ngân đường dẫn đăng nhập trực tiếp mà không cần vào trang chủ ERP.</p>
 <div className="grid grid-cols-2 gap-4">
 <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-50 flex justify-between items-center">
 <div className="space-y-1">
 <span className="text-[10px] uppercase font-bold text-stone-400">Chi nhánh Quận 1</span>
 <p className="font-mono text-sm text-stone-900">sg1.v-erp.com</p>
 </div>
 <span className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-bold">ACTIVE</span>
 </div>
 <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-50 flex justify-between items-center">
 <div className="space-y-1">
 <span className="text-[10px] uppercase font-bold text-stone-400">Chi nhánh Cầu Giấy</span>
 <p className="font-mono text-sm text-stone-900">hn1.v-erp.com</p>
 </div>
 <span className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-bold">ACTIVE</span>
 </div>
 </div>
 </div>

 <h4 className="font-bold text-stone-800 border-b border-stone-100 pb-2">Danh sách Cửa hàng & Nhân sự</h4>
 
 <div className="space-y-4">
 {[
 { id: 'STORE_001', name: 'Chi nhánh Quận 1 - Sài Gòn', address: '123 Lê Lợi, Q.1, TP.HCM', staff: 5, manager: 'Nguyễn Văn A' },
 { id: 'STORE_002', name: 'Chi nhánh Cầu Giấy - Hà Nội', address: '45 Xuân Thủy, Cầu Giấy, HN', staff: 8, manager: 'Trần Thị B' },
 ].map(store => (
 <div key={store.id} className="border border-stone-200 rounded-lg p-4 flex items-center justify-between hover:border-blue-400 transition-colors bg-stone-50">
 <div>
 <h5 className="font-bold text-stone-900 text-lg flex items-center gap-2">{store.name}</h5>
 <p className="text-sm text-stone-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {store.address}</p>
 <div className="flex gap-4 mt-3">
 <span className="text-xs bg-stone-200/50 text-stone-600 px-2 py-1 rounded-md font-medium">Quản lý: <span className="font-bold">{store.manager}</span></span>
 <span className="text-xs bg-[#F2F0E9] text-orange-700 px-2 py-1 rounded-md font-medium">{store.staff} nhân viên</span>
 </div>
 </div>
 <div className="flex gap-2">
 <button className="p-2 bg-white border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-100"><Edit2 className="w-4 h-4" /></button>
 <button className="p-2 bg-white border border-stone-200 text-stone-600 rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"><Trash2 className="w-4 h-4" /></button>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}
 {activeTab === 'comms' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm space-y-6">
 <div className="flex justify-between items-center">
 <h3 className="font-bold text-stone-900 flex items-center gap-2">
 <MessageSquare className="w-5 h-5 text-orange-700" /> Tích hợp SMS OTP & Zalo ZNS
 </h3>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Zalo ZNS Config */}
 <div className="border border-stone-200 rounded-lg p-5 hover:border-blue-400 transition-colors">
 <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-stone-800 flex items-center justify-center text-[#FAF9F5]"><MessageSquare className="w-5 h-5" /></div>
 <div>
 <h4 className="font-bold text-stone-900">Zalo ZNS (Zalo Notification Service)</h4>
 <p className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold uppercase w-fit mt-1 border border-emerald-100">Đang hoạt động</p>
 </div>
 </div>
 <div className="h-8 w-14 bg-[#EAE7DF] rounded-full p-1 cursor-pointer">
 <div className="w-6 h-6 bg-stone-900 rounded-full translate-x-6"></div>
 </div>
 </div>
 <div className="space-y-4">
 <div>
 <label className="text-xs font-bold text-stone-600 block mb-1">Official Account ID (OA ID)</label>
 <input type="text" defaultValue="2938475928374928" className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 font-mono" />
 </div>
 <div>
 <label className="text-xs font-bold text-stone-600 block mb-1">Zalo App ID</label>
 <input type="text" defaultValue="142345234523" className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 font-mono" />
 </div>
 <div>
 <label className="text-xs font-bold text-stone-600 block mb-1">Access Token</label>
 <div className="flex gap-2">
 <input type="password" defaultValue="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 font-mono" />
 <button className="px-3 bg-stone-100 border border-stone-200 rounded-lg hover:bg-stone-200 text-sm font-bold text-stone-600">Đồng bộ</button>
 </div>
 <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Token sẽ hết hạn vào 20:00 25/04/2026. Bật auto-refresh để tự làm mới.</p>
 </div>
 </div>
 <button className="w-full mt-6 py-2.5 bg-stone-900 text-[#FAF9F5] rounded-lg text-sm font-bold hover:bg-stone-800 transition-colors shadow-sm">
 Kiểm tra kết nối ZNS
 </button>
 </div>

 {/* SMS OTP Config */}
 <div className="border border-stone-200 rounded-lg p-5 hover:border-emerald-400 transition-colors">
 <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-[#FAF9F5]"><MessageSquare className="w-5 h-5" /></div>
 <div>
 <h4 className="font-bold text-stone-900">SMS OTP & Brandname</h4>
 <p className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded font-bold uppercase w-fit mt-1">Chưa thiết lập</p>
 </div>
 </div>
 <div className="h-8 w-14 bg-stone-200 rounded-full p-1 cursor-pointer">
 <div className="w-6 h-6 bg-white rounded-full shadow-sm"></div>
 </div>
 </div>
 <div className="space-y-4 opacity-70">
 <div>
 <label className="text-xs font-bold text-stone-600 block mb-1">Nhà cung cấp (SMS Vendor)</label>
 <select className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
 <option>eSMS.vn</option>
 <option>VietGuys</option>
 <option>FPT SMS</option>
 <option>Viettel MKT</option>
 </select>
 </div>
 <div>
 <label className="text-xs font-bold text-stone-600 block mb-1">Brandname đăng ký</label>
 <input type="text" placeholder="Ví dụ: V-ECOM" className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-xs font-bold text-stone-600 block mb-1">API Key</label>
 <input type="password" placeholder="Nhập API Key..." className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono" />
 </div>
 <div>
 <label className="text-xs font-bold text-stone-600 block mb-1">Secret Key</label>
 <input type="password" placeholder="Nhập Secret..." className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono" />
 </div>
 </div>
 </div>
 <button className="w-full mt-6 py-2.5 bg-stone-100 text-stone-600 rounded-lg text-sm font-bold hover:bg-stone-200 transition-colors">
 Lưu thiết lập SMS
 </button>
 </div>
 </div>
 
 <div className="bg-[#F2F0E9] border border-[#EAE7DF] rounded-lg p-5 mt-6">
 <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><Zap className="w-4 h-4" /> Kịch bản Gửi tin (Triggers)</h4>
 <p className="text-sm text-orange-800 mb-4">Cấu hình các sự kiện hệ thống tự động gọi API ZNS/SMS để thông báo chăm sóc khách hàng.</p>
 <div className="space-y-3">
 <label className="flex items-center gap-3 p-3 bg-white border border-[#EAE7DF] rounded-lg cursor-pointer">
 <input type="checkbox" defaultChecked className="w-4 h-4 text-orange-700 rounded border-stone-300 focus:ring-orange-600" />
 <span className="text-sm font-medium text-stone-700 flex-1">Nhắn mã OTP xác thực khi đăng nhập/đổi mật khẩu</span>
 <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded">Ưu tiên: SMS OTP</span>
 </label>
 <label className="flex items-center gap-3 p-3 bg-white border border-[#EAE7DF] rounded-lg cursor-pointer">
 <input type="checkbox" defaultChecked className="w-4 h-4 text-orange-700 rounded border-stone-300 focus:ring-orange-600" />
 <span className="text-sm font-medium text-stone-700 flex-1">Gửi Zalo ZNS xác nhận Đặt hàng thành công</span>
 <span className="text-[10px] font-bold text-orange-700 bg-[#EAE7DF] px-2 py-1 rounded">Template: ZNS_ORDER_01</span>
 </label>
 <label className="flex items-center gap-3 p-3 bg-white border border-[#EAE7DF] rounded-lg cursor-pointer">
 <input type="checkbox" className="w-4 h-4 text-orange-700 rounded border-stone-300 focus:ring-orange-600" />
 <span className="text-sm font-medium text-stone-700 flex-1">Gửi Zalo ZNS chúc mừng Sinh nhật Khách hàng (Loyalty)</span>
 <button className="text-[10px] font-bold text-orange-600 hover:text-orange-800 underline">Cấu hình Mẫu tin</button>
 </label>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'popup' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm space-y-6">
 <h3 className="font-bold text-[#111827] flex items-center gap-2 text-sm border-b border-[#F3F4F6] pb-3">
 <Send className="w-4 h-4 text-[#2563EB]" /> Trung tâm Gửi thông báo (Push Notification)
 </h3>

 <div className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-[#6B7280] mb-1.5 uppercase tracking-wider">Tiêu đề thông báo</label>
 <input 
 type="text" 
 placeholder="VD: Thông báo bảo trì hệ thống" 
 value={notiTitle}
 onChange={(e) => setNotiTitle(e.target.value)}
 className="w-full p-2.5 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" 
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-[#6B7280] mb-1.5 uppercase tracking-wider">Nội dung thông báo (hỗ trợ văn bản)</label>
 <textarea 
 rows={4} 
 placeholder="Chi tiết thông báo..." 
 value={notiMessage}
 onChange={(e) => setNotiMessage(e.target.value)}
 className="w-full p-2.5 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-y"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-[#6B7280] mb-1.5 uppercase tracking-wider">Đối tượng nhận thông báo</label>
 <select className="w-full p-2.5 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white cursor-pointer mb-2">
 <option value="all">Tất cả nhân viên (Hệ thống ERP)</option>
 <option value="seller">Tất cả Nhà bán hàng (Seller Center)</option>
 <option value="customer">Tất cả Khách hàng (Storefront App)</option>
 <option value="dept_operations">Phòng Vận hành</option>
 <option value="dept_cskh">Phòng Chăm sóc Khách hàng</option>
 </select>
 </div>

 <div className="flex justify-end gap-3 pt-4 border-t border-[#F3F4F6] mt-6 items-center">
 {notiStatus && (
 <span className="text-emerald-600 font-bold text-sm flex items-center gap-1 mr-4">
 <CheckCircle2 className="w-4 h-4" /> {notiStatus}
 </span>
 )}
 <button 
 onClick={() => {
 if (!notiTitle.trim() || !notiMessage.trim()) return;
 addNotification(notiTitle, notiMessage);
 setNotiStatus('Đã gửi thông báo thành công!');
 setNotiTitle('');
 setNotiMessage('');
 setTimeout(() => setNotiStatus(''), 3000);
 }}
 className="px-6 py-2.5 bg-[#2563EB] text-[#FAF9F5] rounded-lg text-sm font-bold hover:bg-stone-800 transition-all shadow-sm flex items-center gap-2"
 >
 <Send className="w-4 h-4" /> Bắn thông báo ngay
 </button>
 </div>
 </div>
 </div>

 <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm space-y-6">
 <h3 className="font-bold text-[#111827] flex items-center gap-2 text-sm border-b border-[#F3F4F6] pb-3">
 <AppWindow className="w-4 h-4 text-[#2563EB]" /> Quản lý Popup Website
 </h3>
 
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider">Trạng thái Popup hiện vật / Quảng cáo</label>
 <div className="flex items-center gap-2">
 <span className={cn("text-[10px] font-bold px-2 py-1 rounded", isPopupActive ? "text-emerald-700 bg-emerald-100" : "text-stone-400 bg-stone-100")}>{isPopupActive ? 'Đang mở (Banner tự chèn)' : 'Không tự động hiển thị'}</span>
 <div 
 onClick={() => setIsPopupActive(!isPopupActive)}
 className={cn("w-10 h-5 rounded-full relative cursor-pointer transition-colors", isPopupActive ? "bg-emerald-500" : "bg-stone-200")}
 >
 <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300", isPopupActive ? "left-[22px]" : "left-1")} />
 </div>
 </div>
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
 <div className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-[#6B7280] mb-1.5">Tiêu đề Popup</label>
 <input 
 type="text" 
 placeholder="VD: Khuyến Mãi Hè 2024" 
 value={popupTitle}
 onChange={(e) => setPopupTitle(e.target.value)}
 className="w-full p-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" 
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-[#6B7280] mb-1.5">Nội dung / Mô tả</label>
 <textarea 
 placeholder="Nhập nội dung hiển thị trong popup..." 
 value={popupDesc}
 rows={2}
 onChange={(e) => setPopupDesc(e.target.value)}
 className="w-full p-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-y" 
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-[#6B7280] mb-1.5">Hình ảnh (URL hoặc upload)</label>
 <input 
 type="text" 
 placeholder="https://example.com/banner.jpg" 
 value={popupImage}
 onChange={(e) => setPopupImage(e.target.value)}
 className="w-full p-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" 
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-[#6B7280] mb-1.5">Nút Call-To-Action (Nút điều hướng)</label>
 <div className="flex gap-2">
 <input 
 type="text" 
 placeholder="Tên nút (VD: Xem ngay)" 
 value={popupCtaText}
 onChange={(e) => setPopupCtaText(e.target.value)}
 className="w-1/3 p-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" 
 />
 <input 
 type="text" 
 placeholder="Link (URL)" 
 value={popupCtaLink}
 onChange={(e) => setPopupCtaLink(e.target.value)}
 className="flex-1 p-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" 
 />
 </div>
 </div>
 </div>
 
 <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col items-center justify-center min-h-[200px] relative">
 <div className="text-[10px] text-stone-400 font-bold uppercase tracking-widest absolute top-2 right-2">Preview</div>
 <div className="w-full max-w-[240px] bg-white rounded-lg shadow-sm border border-stone-100 overflow-hidden mt-4">
 {popupImage ? (
 <div className="h-24 overflow-hidden relative">
 <img src={popupImage} alt="Popup Banner Preview" className="w-full h-full object-cover" />
 </div>
 ) : (
 <div className="h-24 bg-indigo-100 flex items-center justify-center">
 <Image className="w-8 h-8 text-indigo-300" />
 </div>
 )}
 <div className="p-3 text-center space-y-2">
 <h4 className="font-bold text-sm text-stone-800 break-words">{popupTitle || '...'}</h4>
 <p className="text-[10px] text-stone-500 line-clamp-3 break-words">{popupDesc || '...'}</p>
 {(popupCtaText || popupCtaLink) && (
 <button className="w-full py-1.5 bg-indigo-600 text-[#FAF9F5] text-[10px] font-bold rounded-md hover:bg-indigo-700 mt-2 truncate px-2">
 {popupCtaText || 'Click here'}
 </button>
 )}
 </div>
 </div>
 </div>
 </div>
 
 <div className="flex justify-end gap-3 pt-4 border-t border-[#F3F4F6] mt-6">
 <button 
 onClick={() => alert('Đã lưu cấu hình Popup!')}
 className="px-6 py-2.5 bg-[#2563EB] text-[#FAF9F5] rounded-lg text-sm font-bold hover:bg-stone-800 transition-all shadow-sm active:scale-95"
 >
 Lưu thiết lập Popup
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'inventory' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm space-y-4">
 <h3 className="font-bold text-[#111827] flex items-center gap-2">
 <Package className="w-5 h-5 text-orange-700" /> Phân loại & Cấu hình Hàng hóa
 </h3>
 <p className="text-sm text-stone-500 mb-4">Quản lý các loại mặt hàng, định mức dự trữ, đơn vị tính, và các thuộc tính lưu kho (SKU/Barcode).</p>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="bg-stone-50 border border-stone-200 rounded-lg p-5">
 <div className="flex justify-between items-center mb-4">
 <h4 className="font-bold text-stone-800">Danh mục Nhóm Hàng hóa</h4>
 <button className="text-xs text-orange-700 font-bold hover:underline">+ Thêm nhóm</button>
 </div>
 <div className="space-y-2">
 {['Nguyên vật liệu (Raw Materials)', 'Thành phẩm (Finished Goods)', 'Bán thành phẩm (WIP)', 'Hàng hóa thương mại (Trading Goods)'].map((type, i) => (
 <div key={i} className="flex justify-between items-center bg-white p-3 border border-stone-100 rounded-lg">
 <span className="text-sm font-medium">{type}</span>
 <button className="text-stone-400 hover:text-stone-600"><Edit2 className="w-4 h-4" /></button>
 </div>
 ))}
 </div>
 </div>

 <div className="bg-stone-50 border border-stone-200 rounded-lg p-5">
 <h4 className="font-bold text-stone-800 mb-4">Phương pháp Quản lý Kho</h4>
 <div className="space-y-3">
 <label className="flex items-center gap-3 p-3 bg-white border border-stone-100 rounded-lg cursor-pointer hover:bg-[#F2F0E9]/50">
 <input type="radio" name="inventory_method" className="w-4 h-4 text-orange-700" defaultChecked />
 <span className="text-sm font-medium">Bình quân gia quyền (Weighted Average)</span>
 </label>
 <label className="flex items-center gap-3 p-3 bg-white border border-stone-100 rounded-lg cursor-pointer hover:bg-[#F2F0E9]/50">
 <input type="radio" name="inventory_method" className="w-4 h-4 text-orange-700" />
 <span className="text-sm font-medium">Nhập trước xuất trước (FIFO)</span>
 </label>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>

 {showAddJobTitleModal && (
 <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
 <div className="bg-white rounded-xl shadow-sm w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
 <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
 <h3 className="font-bold text-stone-800">{editingJobTitle ? 'Chỉnh sửa Chức danh' : 'Thêm Chức danh mới'}</h3>
 <button 
 onClick={() => { setShowAddJobTitleModal(false); setEditingJobTitle(null); }}
 className="text-stone-400 hover:text-stone-600 font-bold text-lg leading-none"
 >
 &times;
 </button>
 </div>
 <div className="p-4 overflow-y-auto flex-1 space-y-4">
 <div>
 <label className="block text-sm font-bold text-stone-700 mb-1">Tên chức danh <span className="text-red-500">*</span></label>
 <input 
 type="text" 
 value={newJobTitle.name || ''} 
 onChange={e => setNewJobTitle({...newJobTitle, name: e.target.value})}
 className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600/20 text-sm"
 placeholder="VD: Trưởng phòng Marketing"
 />
 </div>
 <div>
 <label className="block text-sm font-bold text-stone-700 mb-1">Phòng ban <span className="text-red-500">*</span></label>
 <select 
 value={newJobTitle.department || ''} 
 onChange={e => setNewJobTitle({...newJobTitle, department: e.target.value})}
 className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600/20 text-sm"
 >
 <option value="">Chọn phòng ban</option>
 {MOCK_DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
 </select>
 </div>
 <div>
 <label className="block text-sm font-bold text-stone-700 mb-1">Cấp bậc</label>
 <select 
 value={newJobTitle.rank || ''} 
 onChange={e => setNewJobTitle({...newJobTitle, rank: e.target.value})}
 className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600/20 text-sm"
 >
 <option value="">Chọn cấp bậc</option>
 {MOCK_JOB_RANKS.map(r => <option key={r.id} value={r.id}>{r.name} (Level {r.level})</option>)}
 </select>
 </div>
 <div>
 <label className="block text-sm font-bold text-stone-700 mb-1">Mô tả công việc</label>
 <textarea 
 value={newJobTitle.description || ''} 
 onChange={e => setNewJobTitle({...newJobTitle, description: e.target.value})}
 className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600/20 text-sm min-h-[100px]"
 placeholder="Mô tả ngắn gọn chức năng, nhiệm vụ..."
 />
 </div>
 </div>
 <div className="p-4 border-t border-stone-100 flex justify-end gap-2 bg-stone-50">
 <button 
 onClick={() => { setShowAddJobTitleModal(false); setEditingJobTitle(null); }}
 className="px-4 py-2 border border-stone-200 bg-white text-stone-600 rounded-lg text-sm font-bold hover:bg-stone-100"
 >
 Hủy
 </button>
 <button 
 onClick={handleSaveJobTitle}
 disabled={!newJobTitle.name || !newJobTitle.department}
 className="px-4 py-2 bg-stone-900 text-[#FAF9F5] rounded-lg text-sm font-bold hover:bg-stone-800 disabled:opacity-50"
 >
 Lưu Chức danh
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Fee Management Modal */}
 {showFeeModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
 <div className="bg-white w-full max-w-lg rounded-lg shadow-sm border border-stone-200 overflow-hidden animate-in zoom-in-95 slide-in- duration-300">
 <div className="flex items-center justify-between p-6 border-b border-stone-100 bg-stone-50/50">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-[#F2F0E9] text-orange-700 rounded-xl flex items-center justify-center">
 <BadgeDollarSign className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-lg font-bold text-stone-900">{editingFee ? 'Chỉnh sửa loại phí' : 'Thêm loại phí mới'}</h3>
 <p className="text-xs text-stone-500">Thiết lập tham số và phạm vi áp dụng phí</p>
 </div>
 </div>
 <button onClick={() => setShowFeeModal(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
 <X className="w-5 h-5 text-stone-400" />
 </button>
 </div>

 <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
 {/* Fee Name */}
 <div className="space-y-2">
 <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">Tên loại phí</label>
 <input 
 type="text" 
 value={newFee.name || ''}
 onChange={(e) => setNewFee({ ...newFee, name: e.target.value })}
 placeholder="VD: Phí vận hành kho, Phí thanh toán..."
 className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:border-stone-900 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">Loại phí</label>
 <div className="flex bg-stone-100 p-1 rounded-xl">
 <button 
 onClick={() => setNewFee({ ...newFee, type: 'percentage' })}
 className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", newFee.type === 'percentage' ? "bg-white text-orange-700 shadow-sm" : "text-stone-500 hover:text-stone-700")}
 >
 Phần trăm (%)
 </button>
 <button 
 onClick={() => setNewFee({ ...newFee, type: 'fixed' })}
 className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", newFee.type === 'fixed' ? "bg-white text-orange-700 shadow-sm" : "text-stone-500 hover:text-stone-700")}
 >
 Cố định (đ)
 </button>
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">Giá trị</label>
 <div className="relative">
 <input 
 type="number" 
 value={newFee.value || ''}
 onChange={(e) => setNewFee({ ...newFee, value: parseFloat(e.target.value) })}
 className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold focus:border-stone-900 outline-none"
 />
 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">
 {newFee.type === 'percentage' ? '%' : 'đ'}
 </span>
 </div>
 </div>
 </div>

 {/* Targeting: Seller Type */}
 <div className="space-y-3">
 <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">Áp dụng cho Loại Nhà Bán</label>
 <div className="flex gap-4">
 {['mall', 'normal'].map((type) => {
 const isSelected = newFee.applyTo?.sellerTypes.includes(type as any);
 return (
 <div 
 key={type}
 onClick={() => {
 const current = newFee.applyTo?.sellerTypes || [];
 const next = isSelected ? current.filter(t => t !== type) : [...current, type as any];
 setNewFee({ ...newFee, applyTo: { ...newFee.applyTo!, sellerTypes: next } });
 }}
 className={cn(
 "flex-1 p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3",
 isSelected ? "border-stone-900 bg-[#F2F0E9]/50" : "border-stone-200 bg-white hover:border-stone-300"
 )}
 >
 <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", isSelected ? "border-stone-900 bg-stone-900" : "border-stone-300")}>
 {isSelected && <Check className="w-3 h-3 text-[#FAF9F5]" />}
 </div>
 <span className={cn("text-xs font-bold", isSelected ? "text-orange-800" : "text-stone-600")}>
 {type === 'mall' ? 'Shop Mall' : 'Seller thường'}
 </span>
 </div>
 );
 })}
 </div>
 </div>

 {/* Targeting: Categories */}
 <div className="space-y-3">
 <div className="flex justify-between items-center">
 <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">Ngành hàng áp dụng</label>
 <button 
 onClick={() => setNewFee({ ...newFee, applyTo: { ...newFee.applyTo!, categories: ['all'] } })}
 className="text-[10px] font-bold text-orange-700 hover:underline"
 >
 Tất cả ngành
 </button>
 </div>
 <div className="flex flex-wrap gap-2">
 {categoryFees.map(cat => {
 const isAll = newFee.applyTo?.categories.includes('all');
 const isSelected = isAll || newFee.applyTo?.categories.includes(cat.id);
 return (
 <button
 key={cat.id}
 disabled={isAll && newFee.applyTo?.categories.length === 1}
 onClick={() => {
 let next: string[];
 if (isAll) {
 next = [cat.id];
 } else {
 const current = newFee.applyTo?.categories || [];
 next = isSelected ? current.filter(id => id !== cat.id) : [...current, cat.id];
 if (next.length === 0) next = ['all'];
 }
 setNewFee({ ...newFee, applyTo: { ...newFee.applyTo!, categories: next } });
 }}
 className={cn(
 "px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all",
 isSelected ? "bg-indigo-600 border-indigo-600 text-[#FAF9F5] shadow-sm" : "bg-white border-stone-200 text-stone-500 hover:border-stone-300"
 )}
 >
 {cat.name}
 </button>
 );
 })}
 </div>
 </div>

 {/* Description */}
 <div className="space-y-2">
 <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">Mô tả (Ghi chú)</label>
 <textarea 
 rows={2}
 value={newFee.description || ''}
 onChange={(e) => setNewFee({ ...newFee, description: e.target.value })}
 placeholder="Ghi chú về ý nghĩa loại phí này..."
 className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:border-stone-900 outline-none resize-none"
 />
 </div>
 </div>

 <div className="p-6 bg-stone-50 border-t border-stone-100 flex gap-3">
 <button 
 onClick={() => setShowFeeModal(false)}
 className="flex-1 py-3 bg-white border border-stone-200 text-stone-600 rounded-xl text-sm font-bold hover:bg-stone-50 transition-all"
 >
 Hủy bỏ
 </button>
 <button 
 onClick={() => {
 if (editingFee) {
 setSystemFees(systemFees.map(f => f.id === editingFee.id ? { ...newFee as SystemFee, id: f.id } : f));
 } else {
 setSystemFees([...systemFees, { ...newFee as SystemFee, id: `sys-${Date.now()}`, isActive: true }]);
 }
 setShowFeeModal(false);
 addNotification({
 title: 'Đã cập nhật cấu hình',
 message: `Loại phí ${newFee.name} đã được lưu thành công.`,
 type: 'success',
 duration: 3000
 });
 }}
 className="flex-1 py-3 bg-[#2563EB] text-[#FAF9F5] rounded-xl text-sm font-bold hover:bg-stone-800 transition-all shadow-sm shadow-stone-900/5"
 >
 {editingFee ? 'Cập nhật' : 'Xác nhận Thêm'}
 </button>
 </div>
 </div>
 </div>
 )}
 </>
 );
}
