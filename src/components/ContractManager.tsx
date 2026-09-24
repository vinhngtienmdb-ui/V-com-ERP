import React, { useState, useEffect } from 'react';
import { 
 MessageSquare, Send, File, Download, Reply,
  CornerDownRight, XCircle,
 FileText, 
 Briefcase, 
 ShoppingCart, 
 FileSignature, 
 Search, 
 Plus,
 RefreshCw,
 Clock,
 CheckCircle2,
 AlertCircle,
 X,
 AlertTriangle,
 ShieldCheck,
 Check,
 PenTool,
 Key,
 Settings,
 Users,
 Trash2,
 Edit2,
 ChevronDown,
 ChevronUp,
 Copy,
 Sliders,
 Lock,
  Eye,
  Info,
  FileSpreadsheet,
  Printer,
  Calculator,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Building2
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { useNavigate, useSearchParams } from 'react-router-dom';

export interface SalesQuote {
  id: string; // BG-2026-001
  dealId?: string;
  client: string;
  contactName: string;
  phone: string;
  pd: string;
  items: { name: string; qty: number; unitPrice: number; total: number }[];
  subtotal: number;
  discount: number;
  vatRate: number; // 8% or 10%
  vatAmount: number;
  grandTotal: number;
  status: 'draft' | 'sent' | 'approved' | 'converted';
  createdAt: string;
  expiryDate: string;
  contractId?: string;
}

const INITIAL_QUOTES: SalesQuote[] = [
  {
    id: 'BG-2026-001',
    dealId: 'd1',
    client: 'Tập đoàn TH True Milk',
    contactName: 'Nguyễn Anh Tuấn',
    phone: '0912345678',
    pd: 'Hệ thống chuỗi 50 máy POS thanh toán O2O',
    items: [
      { name: 'Máy POS cảm ứng VComm SmartTouch Pro', qty: 50, unitPrice: 2500000, total: 125000000 },
      { name: 'Gói phần mềm thanh toán Napas 247 & E-Menu (12 tháng)', qty: 1, unitPrice: 25000000, total: 25000000 }
    ],
    subtotal: 150000000,
    discount: 5000000,
    vatRate: 8,
    vatAmount: 11600000,
    grandTotal: 156600000,
    status: 'approved',
    createdAt: '16/09/2026',
    expiryDate: '16/10/2026'
  },
  {
    id: 'BG-2026-002',
    dealId: 'd2',
    client: 'Vinpearl Nha Trang Resort',
    contactName: 'Phạm Thu Hương',
    phone: '0987654321',
    pd: 'Đồng phục nhân viên & vật tư khách sạn',
    items: [
      { name: 'Đồng phục lễ tân & buồng phòng cao cấp (Set 200 bộ)', qty: 200, unitPrice: 1100000, total: 220000000 },
      { name: 'Thẻ khóa từ NFC thông minh VComm IoT', qty: 1000, unitPrice: 60000, total: 60000000 }
    ],
    subtotal: 280000000,
    discount: 10000000,
    vatRate: 8,
    vatAmount: 21600000,
    grandTotal: 291600000,
    status: 'sent',
    createdAt: '17/09/2026',
    expiryDate: '17/10/2026'
  },
  {
    id: 'BG-2026-003',
    dealId: 'd3',
    client: 'Tập đoàn Kangaroo Việt Nam',
    contactName: 'Đỗ Hải Đăng',
    phone: '0933445566',
    pd: 'Quà tặng đại lý tri ân cuối năm',
    items: [
      { name: 'Bộ quà tặng gốm sứ cao cấp in logo đại lý', qty: 300, unitPrice: 400000, total: 120000000 }
    ],
    subtotal: 120000000,
    discount: 0,
    vatRate: 8,
    vatAmount: 9600000,
    grandTotal: 129600000,
    status: 'converted',
    contractId: 'HDMB-001',
    createdAt: '15/09/2026',
    expiryDate: '15/10/2026'
  }
];

const CRM_DEALS_MOCK = [
  { id: 'd1', client: 'Tập đoàn TH True Milk', contact: 'Nguyễn Anh Tuấn', phone: '0912345678', val: 150000000, pd: 'Hệ thống chuỗi 50 máy POS thanh toán O2O' },
  { id: 'd2', client: 'Vinpearl Nha Trang Resort', contact: 'Phạm Thu Hương', phone: '0987654321', val: 280000000, pd: 'Đồng phục nhân viên & vật tư khách sạn' },
  { id: 'd3', client: 'Tập đoàn Kangaroo Việt Nam', contact: 'Đỗ Hải Đăng', phone: '0933445566', val: 120000000, pd: 'Quà tặng đại lý tri ân cuối năm' },
  { id: 'd4', client: 'Chuỗi Bán Lẻ Con Cưng', contact: 'Vũ Thị Minh', phone: '0944556677', val: 450000000, pd: 'Kệ trưng bày thông minh & máy quét mã vạch' },
  { id: 'd8', client: 'Chuỗi Cà phê Highlands', contact: 'Trần Văn Long', phone: '0903112233', val: 95000000, pd: 'Phần mềm E-Menu QR Code' }
];

const MOCK_CONTRACTS = [
  { id: 'HDLD-001', title: 'Hợp đồng lao động - Nguyễn Văn A', type: 'labor', subtype: 'Chính thức', status: 'active', party: 'Nguyễn Văn A', expiry: '01/01/2025', value: '-', signatureStatus: 'signed', signers: [{role: 'Người sử dụng lao động', name: 'Giám đốc', status: 'signed'}, {role: 'Người lao động', name: 'Nguyễn Văn A', status: 'signed'}], file: { name: 'HDLD_NguyenVanA.docx', type: 'docx' }, comments: [ { id: 1, author: 'Nhân sự', time: '10:00 01/02', content: 'Đã cập nhật phụ lục đính kèm.' } ] },
  { id: 'HDTV-002', title: 'Hợp đồng thử việc - Trần Thái B', type: 'labor', subtype: 'Thử việc', status: 'expiring_soon', signatureStatus: 'signed', party: 'Trần Thái B', expiry: '10/05/2024', value: '-', signers: [{role: 'Người sử dụng ND', name: 'Giám đốc', status: 'signed'}, {role: 'Người lao động', name: 'Trần Thái B', status: 'signed'}], file: { name: 'HDTV_TranThaiB_v2.pdf', type: 'pdf' }, comments: [] },
  { id: 'HDMB-001', title: 'Hợp đồng mua bán thiết bị VP', type: 'sales', subtype: 'Mua bán', status: 'pending', signatureStatus: 'pending', party: 'Tập đoàn Kangaroo Việt Nam', expiry: '31/12/2026', value: '129,600,000 ₫', signers: [{role: 'Bên mua', name: 'Đỗ Hải Đăng', status: 'pending'}, {role: 'Bên bán (VComm)', name: 'Tổng Giám Đốc', status: 'pending'}], file: { name: 'HDMB_Kangaroo_2026.pdf', type: 'pdf' }, comments: [ { id: 2, author: 'Kế toán', time: '09:15 17/09', content: 'Đã đối soát điều khoản thanh toán theo Báo giá BG-2026-003.' } ] },
  { id: 'HDDV-001', title: 'Hợp đồng tư vấn AI & Chuyển đổi số', type: 'service', subtype: 'Dịch vụ', status: 'active', signatureStatus: 'signed', party: 'AI Partner LLC', expiry: '01/02/2027', value: '120,000,000 ₫', signers: [{role: 'Bên thuê', name: 'Giám đốc', status: 'signed'}, {role: 'Bên tư vấn', name: 'AI Partner LLC', status: 'signed'}], file: { name: 'HDDV_AI_Partner.pdf', type: 'pdf' }, comments: [] }
];

export function ContractManager({ defaultTab }: { defaultTab?: string }) {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || (searchParams.get('dealId') ? 'quotes' : (defaultTab || 'quotes'));
  const [activeTab, setActiveTab] = useState(initialTab);
  const [contracts, setContracts] = useState(MOCK_CONTRACTS);
  const [quotes, setQuotes] = useState<SalesQuote[]>(INITIAL_QUOTES);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [selectedQuote, setSelectedQuote] = useState<SalesQuote | null>(null);
  const [showQuotePreviewModal, setShowQuotePreviewModal] = useState(false);
  const [showCreateQuoteModal, setShowCreateQuoteModal] = useState(false);
  const [signingModalOpen, setSigningModalOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const navigate = useNavigate();

  // New Quote Form State
  const [quoteForm, setQuoteForm] = useState({
    selectedDealId: searchParams.get('dealId') || '',
    client: searchParams.get('client') || 'Tập đoàn TH True Milk',
    contactName: 'Nguyễn Anh Tuấn',
    phone: '0912345678',
    pd: searchParams.get('pd') || 'Gói giải pháp phần mềm & phần cứng',
    vatRate: 8,
    discount: 0,
    items: [
      { name: searchParams.get('pd') || 'Thiết bị & Bản quyền giải pháp VComm', qty: 1, unitPrice: Number(searchParams.get('val')) || 50000000, total: Number(searchParams.get('val')) || 50000000 }
    ]
  });

  useEffect(() => {
    const dealId = searchParams.get('dealId');
    if (dealId) {
      setActiveTab('quotes');
      setShowCreateQuoteModal(true);
      const matchedDeal = CRM_DEALS_MOCK.find(d => d.id === dealId);
      const client = searchParams.get('client') || matchedDeal?.client || 'Khách hàng CRM';
      const val = Number(searchParams.get('val')) || matchedDeal?.val || 50000000;
      const pd = searchParams.get('pd') || matchedDeal?.pd || 'Gói giải pháp công nghệ VComm';
      const contact = matchedDeal?.contact || 'Người liên hệ đại diện';
      const phone = matchedDeal?.phone || '0912345678';
      setQuoteForm({
        selectedDealId: dealId,
        client,
        contactName: contact,
        phone,
        pd,
        vatRate: 8,
        discount: 0,
        items: [{ name: pd, qty: 1, unitPrice: val, total: val }]
      });
    }
  }, [searchParams]);

  const handleSelectDealForQuote = (dealId: string) => {
    const deal = CRM_DEALS_MOCK.find(d => d.id === dealId);
    if (!deal) return;
    setQuoteForm({
      selectedDealId: deal.id,
      client: deal.client,
      contactName: deal.contact,
      phone: deal.phone,
      pd: deal.pd,
      vatRate: 8,
      discount: 0,
      items: [{ name: deal.pd, qty: 1, unitPrice: deal.val, total: deal.val }]
    });
  };

  const handleAddItemToQuote = () => {
    setQuoteForm(prev => ({
      ...prev,
      items: [...prev.items, { name: 'Dịch vụ / Thiết bị bổ sung', qty: 1, unitPrice: 5000000, total: 5000000 }]
    }));
  };

  const handleRemoveItemFromQuote = (index: number) => {
    setQuoteForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateItemInQuote = (index: number, field: string, value: any) => {
    setQuoteForm(prev => {
      const nextItems = [...prev.items];
      const item = { ...nextItems[index], [field]: value };
      if (field === 'qty' || field === 'unitPrice') {
        item.total = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0);
      }
      nextItems[index] = item;
      return { ...prev, items: nextItems };
    });
  };

  const quoteSubtotal = quoteForm.items.reduce((sum, it) => sum + (it.total || 0), 0);
  const quoteAfterDiscount = Math.max(0, quoteSubtotal - (Number(quoteForm.discount) || 0));
  const quoteVatAmount = Math.round(quoteAfterDiscount * ((Number(quoteForm.vatRate) || 0) / 100));
  const quoteGrandTotal = quoteAfterDiscount + quoteVatAmount;

  const handleSaveQuote = (andConvert = false) => {
    if (!quoteForm.client.trim()) {
      alert('Vui lòng nhập tên khách hàng đối tác!');
      return;
    }
    const newQuoteId = `BG-2026-${String(quotes.length + 1).padStart(3, '0')}`;
    const newQuote: SalesQuote = {
      id: newQuoteId,
      dealId: quoteForm.selectedDealId || undefined,
      client: quoteForm.client,
      contactName: quoteForm.contactName,
      phone: quoteForm.phone,
      pd: quoteForm.pd,
      items: quoteForm.items,
      subtotal: quoteSubtotal,
      discount: Number(quoteForm.discount) || 0,
      vatRate: Number(quoteForm.vatRate) || 8,
      vatAmount: quoteVatAmount,
      grandTotal: quoteGrandTotal,
      status: andConvert ? 'converted' : 'sent',
      createdAt: new Date().toLocaleDateString('vi-VN'),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN')
    };

    setQuotes([newQuote, ...quotes]);
    setShowCreateQuoteModal(false);

    if (andConvert) {
      handleConvertQuoteToContract(newQuote);
    } else {
      alert(`✅ Đã lập và phát hành Báo giá ${newQuoteId} cho "${newQuote.client}" thành công!`);
    }
  };

  const handleConvertQuoteToContract = (quote: SalesQuote) => {
    const contractId = `HDMB-${new Date().getFullYear()}-${String(contracts.length + 1).padStart(3, '0')}`;
    const newContract = {
      id: contractId,
      title: `Hợp đồng Mua bán - ${quote.client}`,
      type: 'sales',
      subtype: 'Hợp đồng mua bán',
      status: 'pending',
      signatureStatus: 'pending',
      party: quote.client,
      expiry: quote.expiryDate || '31/12/2026',
      value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(quote.grandTotal),
      signers: [
        { role: 'Bên Bán (VComm Corporation)', name: 'Tổng Giám Đốc', status: 'pending' },
        { role: 'Bên Mua (Khách hàng)', name: quote.contactName || quote.client, status: 'pending' }
      ],
      file: { name: `HopDong_${contractId}.pdf`, size: '280 KB', type: 'pdf' },
      comments: [
        {
          id: Date.now(),
          author: 'Hệ thống CRM & Báo giá',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          content: `Tự động tạo hợp đồng từ Báo giá ${quote.id} (Deal CRM #${quote.dealId || 'N/A'}). Sẵn sàng ký số qua Cloud HSM hoặc SmartCA.`
        }
      ]
    };

    setContracts([newContract, ...contracts]);
    setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, status: 'converted', contractId } : q));
    setSelectedContract(newContract);
    setShowQuotePreviewModal(false);
    setActiveTab('sales');
    setSigningModalOpen(true);
  };

 // Workflow structures for: labor, sales, service
 const [workflows, setWorkflows] = useState<any[]>([
   {
     contractType: 'labor',
     contractTypeName: 'Hợp đồng Lao động',
     steps: [
       { id: 'step-1', name: 'Nhân sự chuẩn bị và ban hành hồ sơ dự thảo', role: 'Nhân viên Hành chính Nhân sự', actionType: 'create', order: 1 },
       { id: 'step-2', name: 'Cố vấn Pháp chế kiểm tra độ chuẩn mực pháp lý', role: 'Ban Pháp Chế', actionType: 'review', order: 2 },
       { id: 'step-3', name: 'Trưởng phòng Nhân sự duyệt chuyển tiếp', role: 'Trưởng phòng HR', actionType: 'approve', order: 3 },
       { id: 'step-4', name: 'Đại diện Ban Giám Đốc đóng dấu & ký số', role: 'Tổng Giám Đốc (CEO)', actionType: 'sign', order: 4 },
       { id: 'step-5', name: 'Ứng viên nhận thư mời & ký số từ xa', role: 'Người lao động', actionType: 'sign', order: 5 }
     ],
     templates: [
       { id: 'temp-lab-01', name: 'Mẫu hợp đồng lao động không xác định thời hạn 2026', fileSize: '185 KB', version: 'v2.4', lastUpdated: '12/03/2026', requiredFields: ['{HO_TEN}', '{SO_CCCD}', '{NGAY_SINH}', '{LUONG_CO_BAN}', '{PHU_CAP}', '{VI_TRI_CONG_VIEC}', '{NGAY_BAT_DAU}'] },
       { id: 'temp-lab-02', name: 'Thỏa thuận bảo mật thông tin & sở hữu trí tuệ (NDA)', fileSize: '124 KB', version: 'v3.2', lastUpdated: '28/05/2026', requiredFields: ['{HO_TEN}', '{CONG_TY_A}', '{CS_PHAT_CO_PHAN}', '{NGAY_KY}'] },
       { id: 'temp-lab-03', name: 'Mẫu quyết định tuyển dụng và thử việc tiêu chuẩn', fileSize: '98 KB', version: 'v1.5', lastUpdated: '15/01/2026', requiredFields: ['{HO_TEN}', '{THOI_GIAN_THU_VIEC}', '{LUONG_THU_VIEC}', '{NGAY_AP_DUNG}'] }
     ],
     permissions: [
       { role: 'Ban Giám Đốc', view: true, edit: true, approve: true, sign: true },
       { role: 'Trưởng phòng HR', view: true, edit: true, approve: true, sign: false },
       { role: 'Ban Pháp Chế', view: true, edit: true, approve: true, sign: false },
       { role: 'Nhân viên HR', view: true, edit: true, approve: false, sign: false },
       { role: 'Người lao động', view: true, edit: false, approve: false, sign: true }
     ],
     securityLevel: 'high',
     allowUSB: false,
     allowSmartCA: true,
     allowSMS: true
   },
   {
     contractType: 'sales',
     contractTypeName: 'Hợp đồng Mua bán',
     steps: [
       { id: 'step-1', name: 'Nhân viên sale lên đơn hàng và biểu giá', role: 'Nhân viên Kinh doanh', actionType: 'create', order: 1 },
       { id: 'step-2', name: 'Kế toán đối soát hạn mức công nợ', role: 'Kế toán trưởng', actionType: 'approve', order: 2 },
       { id: 'step-3', name: 'Phó giám đốc duyệt chiết khấu đặc biệt', role: 'Phó Giám Đốc Kinh Doanh', actionType: 'approve', order: 3 },
       { id: 'step-4', name: 'Giám đốc ký chứng thư số USB Token đại diện', role: 'Ban Giám Đốc', actionType: 'sign', order: 4 },
       { id: 'step-5', name: 'Khách hàng đối tác ký xác nhận hóa đơn', role: 'Đại diện bên mua', actionType: 'sign', order: 5 }
     ],
     templates: [
       { id: 'temp-sl-01', name: 'Mẫu hợp đồng mua bán thiết bị văn phòng VN', fileSize: '210 KB', version: 'v3.0', lastUpdated: '20/01/2026', requiredFields: ['{TEN_BEN_MAN}', '{TEN_BEN_BAN}', '{DANH_SACH_THIET_BI}', '{GIA_TRI_HOP_DONG}', '{NGAY_BAT_DAU_TRA_GOP}'] },
       { id: 'temp-sl-02', name: 'Mẫu hợp đồng đại lý và phân phối linh kiện', fileSize: '345 KB', version: 'v1.0', lastUpdated: '02/02/2026', requiredFields: ['{TEN_DAI_LY}', '{CHIET_KHAU_TI_LE}', '{VI_TRI_KHO_BAI}'] }
     ],
     permissions: [
       { role: 'Ban Giám Đốc', view: true, edit: true, approve: true, sign: true },
       { role: 'Kế toán trưởng', view: true, edit: true, approve: true, sign: true },
       { role: 'Phó Giám Đốc Kinh Doanh', view: true, edit: true, approve: true, sign: false },
       { role: 'Nhân viên Kinh doanh', view: true, edit: true, approve: false, sign: false },
       { role: 'Đại diện bên mua', view: true, edit: false, approve: false, sign: true }
     ],
     securityLevel: 'medium',
     allowUSB: true,
     allowSmartCA: true,
     allowSMS: true
   },
   {
     contractType: 'service',
     contractTypeName: 'Hợp đồng Dịch vụ',
     steps: [
       { id: 'step-1', name: 'Quản lý dự án soạn thảo điều khoản công việc', role: 'Quản lý Dự án (PM)', actionType: 'create', order: 1 },
       { id: 'step-2', name: 'Bộ phận pháp chế thẩm định ràng buộc SLAs', role: 'BP Pháp Chế', actionType: 'review', order: 2 },
       { id: 'step-3', name: 'Đối tác ký duyệt đồng ý các điều khoản', role: 'Khách hàng/Đối tác', actionType: 'sign', order: 3 },
       { id: 'step-4', name: 'Giám đốc VComm ký số đóng dấu xác nhận', role: 'Tổng Giám Đốc (CEO)', actionType: 'sign', order: 4 }
     ],
     templates: [
       { id: 'temp-srv-01', name: 'Mẫu hợp đồng dịch vụ thuê máy Knox Cloud v4', fileSize: '320 KB', version: 'v4.1', lastUpdated: '15/02/2026', requiredFields: ['{TEN_CONG_TY_KNOX}', '{SO_LUONG_MAY}', '{SLA_HO_TRO_PHANTRAM}', '{PHI_THEO_THANG}'] }
     ],
     permissions: [
       { role: 'Tổng Giám Đốc (CEO)', view: true, edit: true, approve: true, sign: true },
       { role: 'BP Pháp Chế', view: true, edit: true, approve: true, sign: false },
       { role: 'Quản lý Dự án (PM)', view: true, edit: true, approve: false, sign: false },
       { role: 'Khách hàng/Đối tác', view: true, edit: false, approve: false, sign: true }
     ],
     securityLevel: 'high',
     allowUSB: true,
     allowSmartCA: true,
     allowSMS: false
   }
 ]);

 const [selectedWorkflowType, setSelectedWorkflowType] = useState<string>('labor');

 // Modal triggers inside configuration
 const [isAddingStepModal, setIsAddingStepModal] = useState(false);
 const [isAddingTemplateModal, setIsAddingTemplateModal] = useState(false);

 // Form states
 const [newStepName, setNewStepName] = useState('');
 const [newStepRole, setNewStepRole] = useState('Trưởng phòng HR');
 const [newStepAction, setNewStepAction] = useState<'create' | 'approve' | 'sign' | 'review'>('approve');

 const [newTempName, setNewTempName] = useState('');
 const [newTempFields, setNewTempFields] = useState('');
 const [newTempVersion, setNewTempVersion] = useState('v1.0');

 // Operational handlers
 const handleAddWorkflowStep = () => {
   if (!newStepName.trim()) return;
   
   setWorkflows(prev => prev.map(wf => {
     if (wf.contractType === selectedWorkflowType) {
       const nextOrder = wf.steps.length + 1;
       const newStepObj = {
         id: `step-${Date.now()}`,
         name: newStepName.trim(),
         role: newStepRole,
         actionType: newStepAction,
         order: nextOrder
       };
       return {
         ...wf,
         steps: [...wf.steps, newStepObj]
       };
     }
     return wf;
   }));

   setNewStepName('');
   setIsAddingStepModal(false);
 };

 const handleRemoveWorkflowStep = (stepId: string) => {
   setWorkflows(prev => prev.map(wf => {
     if (wf.contractType === selectedWorkflowType) {
       const filtered = wf.steps.filter((s: any) => s.id !== stepId);
       const reordered = filtered.map((s: any, idx: number) => ({ ...s, order: idx + 1 }));
       return {
         ...wf,
         steps: reordered
       };
     }
     return wf;
   }));
 };

 const handleMoveStep = (stepId: string, direction: 'up' | 'down') => {
   setWorkflows(prev => prev.map(wf => {
     if (wf.contractType === selectedWorkflowType) {
       const stepsCopy = [...wf.steps];
       const index = stepsCopy.findIndex((s: any) => s.id === stepId);
       if (index === -1) return wf;

       if (direction === 'up' && index > 0) {
         const temp = stepsCopy[index];
         stepsCopy[index] = stepsCopy[index - 1];
         stepsCopy[index - 1] = temp;
       } else if (direction === 'down' && index < stepsCopy.length - 1) {
         const temp = stepsCopy[index];
         stepsCopy[index] = stepsCopy[index + 1];
         stepsCopy[index + 1] = temp;
       }

       const reordered = stepsCopy.map((s: any, idx: number) => ({ ...s, order: idx + 1 }));
       return { ...wf, steps: reordered };
     }
     return wf;
   }));
 };

 const handleUpdateSecuritySettings = (field: 'securityLevel' | 'allowUSB' | 'allowSmartCA' | 'allowSMS', value: any) => {
   setWorkflows(prev => prev.map(wf => {
     if (wf.contractType === selectedWorkflowType) {
       return {
         ...wf,
         [field]: value
       };
     }
     return wf;
   }));
 };

 const handleTogglePermission = (roleName: string, permissionField: 'view' | 'edit' | 'approve' | 'sign') => {
   setWorkflows(prev => prev.map(wf => {
     if (wf.contractType === selectedWorkflowType) {
       const updatedPermissions = wf.permissions.map((p: any) => {
         if (p.role === roleName) {
           return {
             ...p,
             [permissionField]: !p[permissionField]
           };
         }
         return p;
       });
       return {
         ...wf,
         permissions: updatedPermissions
       };
     }
     return wf;
   }));
 };

 const handleAddTemplate = () => {
   if (!newTempName.trim()) return;

   const fieldsArray = newTempFields
     .split(',')
     .map(f => f.trim().toUpperCase())
     .filter(f => f.length > 0)
     .map(f => f.startsWith('{') && f.endsWith('}') ? f : `{${f}}`);

   setWorkflows(prev => prev.map(wf => {
     if (wf.contractType === selectedWorkflowType) {
       return {
         ...wf,
         templates: [
           ...wf.templates,
           {
             id: `temp-${Date.now()}`,
             name: newTempName.trim(),
             fileSize: '150 KB',
             version: newTempVersion || 'v1.0',
             lastUpdated: new Date().toLocaleDateString('vi-VN'),
             requiredFields: fieldsArray.length > 0 ? fieldsArray : ['{HO_TEN}', '{SO_CCCD}']
           }
         ]
       };
     }
     return wf;
   }));

   setNewTempName('');
   setNewTempFields('');
   setNewTempVersion('v1.0');
   setIsAddingTemplateModal(false);
 };

 const handleRemoveTemplate = (tempId: string) => {
   setWorkflows(prev => prev.map(wf => {
     if (wf.contractType === selectedWorkflowType) {
       return {
         ...wf,
         templates: wf.templates.filter((t: any) => t.id !== tempId)
       };
     }
     return wf;
   }));
 };

 const handleStatusChange = (id: string, newStatus: string) => {
   if (window.confirm('Bạn có chắc chắn muốn thực hiện hành động này?')) {
     setContracts(contracts.map(c => c.id === id ? { ...c, status: newStatus } : c));
     if (selectedContract?.id === id) {
       setSelectedContract({ ...selectedContract, status: newStatus });
     }
   }
 };

 const handleAddComment = () => {
   if (!newComment.trim() || !selectedContract) return;
   const commentObj = {
     id: Date.now(),
     author: 'Tôi (Đang đăng nhập)',
     time: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit' }),
     content: newComment.trim()
   };
   
   const updatedContracts = contracts.map(c => 
     c.id === selectedContract.id 
       ? { ...c, comments: [...(c.comments || []), commentObj] } 
       : c
   );
   
   setContracts(updatedContracts);
   setSelectedContract({ ...selectedContract, comments: [...(selectedContract.comments || []), commentObj] });
   setNewComment('');
 };

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
  {selectedContract && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in p-4" onClick={() => setSelectedContract(null)}>
 <div className="bg-white rounded-xl shadow-sm w-full max-w-[95vw] h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col" onClick={(e) => e.stopPropagation()}>
 <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
 <div>
 <h3 className="text-lg font-bold text-slate-900">{selectedContract.title}</h3>
 <p className="text-xs font-mono text-slate-500 mt-0.5"><span className="uppercase font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{selectedContract.subtype || selectedContract.type}</span> • {selectedContract.id}</p>
 </div>
 <div className="flex items-center gap-2">
 {selectedContract.file && (
   <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 shadow-sm">
     <Download className="w-4 h-4" /> Tải tệp ({selectedContract.file.type})
   </button>
 )}
 <button 
 onClick={() => setSelectedContract(null)}
 className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors ml-2"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 </div>
 
 <div className="flex flex-1 overflow-hidden">
  {/* Left Panel: Document Viewer */}
  <div className="flex-1 bg-slate-100/50 border-r border-slate-200 flex flex-col relative">
    {selectedContract.file ? (
      <div className="flex-1 overflow-auto bg-[#e5e7eb] p-6 flex justify-center">
        {/* Mock Document Render */}
        <div className="bg-white w-[210mm] min-h-[297mm] shadow-sm p-[20mm]  mx-auto relative origin-top max-w-full">
           <div className="absolute top-4 right-4 bg-slate-100 text-slate-500 px-2 py-1 text-[9px] font-bold rounded uppercase">
              Preview: {selectedContract.file.name}
           </div>
           
           <div className="space-y-6 text-xs text-slate-800 leading-relaxed mt-12 font-serif">
             <h1 className="text-2xl font-bold text-center mb-8 uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br/><span className="text-lg">Độc lập - Tự do - Hạnh phúc</span></h1>
             <h2 className="text-xl font-bold text-center mt-12 mb-8">{selectedContract.title.split('-')[0].toUpperCase()}</h2>
             <p className="text-right italic">Hà Nội, ngày ... tháng ... năm ...</p>
             <p>Căn cứ các văn bản pháp luật hiện hành và sự thỏa thuận của hai bên.</p>
             <p>Hôm nay, chúng tôi gồm có:</p>
             <div className="pl-4 border-l-2 border-slate-300 space-y-2">
                 <p><strong>Bên A:</strong> {selectedContract.signers?.[0]?.name || 'CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐIỆN TỬ VCOMM'}</p>
                <p><strong>Bên B:</strong> {selectedContract.party}</p>
             </div>
             <p>Nội dung chi tiết hợp đồng được đính kèm ở các điều khoản tiếp theo...</p>
             
             {/* Mock text repeats */}
             <div className="opacity-50 space-y-4">
                <p>Điều 1: Nội dung công việc và thời gian thực hiện. Hai bên thống nhất thực hiện theo phụ lục đính kèm, đảm bảo các tiêu chí chất lượng, kỹ thuật và tiến độ.</p>
                <p>Điều 2: Giá trị và phương thức thanh toán. Áp dụng thanh toán chuyển khoản, thời hạn không quá 5 ngày làm việc kể từ khi nhận đủ hồ sơ hợp lệ.</p>
             </div>

              {/* Digital Signature & Stamp Box */}
              <div className="pt-8 border-t-2 border-slate-200 grid grid-cols-2 gap-8 text-center mt-12 not-italic font-sans">
                {/* Party A Signature Block */}
                <div className="flex flex-col items-center justify-between p-3 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 min-h-[160px]">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-800 tracking-wider">ĐẠI DIỆN BÊN A</p>
                    <p className="text-[10px] text-slate-500">(Ký số, đóng dấu mộc điện tử)</p>
                  </div>
                  
                  {selectedContract.signatureStatus === 'signed' ? (
                    <div className="my-2 p-2.5 border-2 border-red-600 rounded-lg bg-red-50/80 text-red-600 shadow-sm animate-in zoom-in-95 text-left max-w-[200px]">
                      <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-tight text-red-700 border-b border-red-400 pb-1 mb-1">
                        <span>🛡️ ĐÃ KÝ ĐIỆN TỬ</span>
                      </div>
                      <p className="text-[9px] font-bold uppercase leading-tight">CÔNG TY CP TMĐT VCOMM</p>
                      <p className="text-[8px] font-mono mt-0.5">MST: 0318914439</p>
                      <p className="text-[8px] text-slate-700 mt-0.5">Thời gian: {selectedContract.signedAt || '17/09/2026 09:30:15'}</p>
                      <p className="text-[7px] text-emerald-700 font-bold mt-0.5">TSA Verified • SHA-256 Valid</p>
                    </div>
                  ) : (
                    <div className="my-3 text-slate-400 text-xs italic flex flex-col items-center gap-1">
                      <PenTool className="w-5 h-5 text-slate-300" />
                      <span>Chờ ký số đại diện</span>
                    </div>
                  )}

                  <p className="text-xs font-bold text-slate-700 uppercase">TỔNG GIÁM ĐỐC</p>
                </div>

                {/* Party B Signature Block */}
                <div className="flex flex-col items-center justify-between p-3 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 min-h-[160px]">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-800 tracking-wider">ĐẠI DIỆN BÊN B</p>
                    <p className="text-[10px] text-slate-500">(Ký số hoặc xác thực SmartCA)</p>
                  </div>

                  {selectedContract.signatureStatus === 'signed' ? (
                    <div className="my-2 p-2.5 border border-blue-600 rounded-lg bg-blue-50/80 text-blue-800 shadow-sm text-left max-w-[200px]">
                      <div className="flex items-center gap-1 text-[9px] font-bold text-blue-700 border-b border-blue-300 pb-1 mb-1">
                        <span>✍️ ĐÃ XÁC THỰC SMARTCA</span>
                      </div>
                      <p className="text-[10px] font-bold">{selectedContract.party}</p>
                      <p className="text-[8px] text-slate-600 mt-0.5">Xác thực OTP SmartCA</p>
                      <p className="text-[8px] text-slate-600">{selectedContract.signedAt || '17/09/2026 09:30:15'}</p>
                    </div>
                  ) : (
                    <div className="my-3 text-slate-400 text-xs italic flex flex-col items-center gap-1">
                      <Clock className="w-5 h-5 text-slate-300" />
                      <span>Đang chờ Bên B xác nhận</span>
                    </div>
                  )}

                  <p className="text-xs font-bold text-slate-700 uppercase">{selectedContract.party}</p>
                </div>
              </div>
           </div>

        </div>
      </div>
    ) : (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
        <File className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-xs font-medium">Không có tệp đính kèm nào được tìm thấy</p>
      </div>
    )}
    
    {/* Comments Overlay Toggle */}
    
  </div>

  {/* Right Panel: Details & Comments & Actions */}
  <div className="w-[400px] shrink-0 bg-white flex flex-col">
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 space-y-6">
        
        {/* Status Box */}
        <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl">
          <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">Tình trạng hồ sơ</h4>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className={cn(
              "px-3 py-1.5 text-[9px] font-bold rounded uppercase tracking-tight inline-flex items-center gap-1.5",
              selectedContract.status === 'active' ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : 
              selectedContract.status === 'pending' ? "bg-amber-50 text-amber-600 border border-amber-200" : 
              selectedContract.status === "expiring_soon" ? "bg-orange-50 text-blue-600 border border-blue-200" :
              selectedContract.status === "returned" ? "bg-slate-100 text-slate-700 border border-slate-300" : "bg-red-50 text-red-600 border border-red-200"
              )}>
              {selectedContract.status === 'active' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {selectedContract.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
              {selectedContract.status === 'expiring_soon' && <AlertTriangle className="w-3.5 h-3.5" />}
              {selectedContract.status === "expired" || selectedContract.status === "rejected" ? <AlertCircle className="w-3.5 h-3.5" /> : null}
              {selectedContract.status === "returned" && <CornerDownRight className="w-3.5 h-3.5" />}
              {selectedContract.status === 'active' ? 'Đang có hiệu lực' : 
              selectedContract.status === 'pending' ? 'Chờ duyệt' : 
              selectedContract.status === "expiring_soon" ? "Sắp hết hạn" : selectedContract.status === "returned" ? "Bị trả lại" : selectedContract.status === "rejected" ? "Từ chối duyệt" : "Đã hết hạn"}
              </span>
            </div>

            <div className="border-t border-slate-200 pt-3">
               <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Thời hạn</p>
               <p className={cn(
                  "text-xs font-bold",
                  selectedContract.status === 'expired' ? "text-red-600" :
                  selectedContract.status === 'expiring_soon' ? "text-blue-600" : "text-slate-900"
               )}>{selectedContract.expiry}</p>
            </div>
            
            <div className="border-t border-slate-200 pt-3">
               <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Giá trị</p>
               <p className="text-[13px] font-bold text-slate-900">{selectedContract.value}</p>
            </div>
          </div>
        </div>

        {/* Action Panel for Pending */}
        {selectedContract.status === 'pending' && (
          <div className="bg-blue-50/50 p-4 border border-blue-100 rounded-xl space-y-3">
             <h4 className="text-xs font-bold uppercase text-blue-800 tracking-wider mb-2">Thao tác phê duyệt</h4>
             <button onClick={() => handleStatusChange(selectedContract.id, "active")} className="w-full px-4 py-2 bg-emerald-600 text-white rounded font-bold text-xs hover:bg-emerald-700 shadow-sm flex items-center justify-center gap-2">
               <CheckCircle2 className="w-4 h-4" /> Phê duyệt hồ sơ
             </button>
             <button onClick={() => handleStatusChange(selectedContract.id, "returned")} className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded font-bold text-xs hover:bg-slate-50 shadow-sm flex items-center justify-center gap-2">
               <CornerDownRight className="w-4 h-4" /> Trả lại / Yêu cầu sửa
             </button>
             <button onClick={() => handleStatusChange(selectedContract.id, "rejected")} className="w-full px-4 py-2 border border-red-200 text-red-600 bg-red-50 rounded font-bold text-xs hover:bg-red-100 shadow-sm flex items-center justify-center gap-2">
               <XCircle className="w-4 h-4" /> Từ chối ký
             </button>
          </div>
        )}

        {/* Progress */}
        {selectedContract.signers && (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> 
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Tiến trình chữ ký số</h4>
          </div>
          <div className="p-3 space-y-3">
          {selectedContract.signers.map((signer: any, idx: number) => (
            <div key={idx} className="flex gap-3">
              <div className="w-[20px] flex flex-col items-center">
                 <div className={cn("w-2.5 h-2.5 rounded-full mt-1 shrink-0", signer.status === 'signed' ? "bg-emerald-500" : "bg-slate-300")} />
                 {idx < selectedContract.signers.length - 1 && <div className="w-[2px] h-full bg-slate-200 my-1" />}
              </div>
              <div className="pb-1">
                 <p className="text-[13px] font-bold text-slate-900">{signer.name}</p>
                 <p className="text-[9px] text-slate-500">{signer.role}</p>
                 {signer.status === 'signed' ? (
                   <span className="inline-block mt-1 text-[9px] uppercase font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Đã ký</span>
                 ) : (
                   <span className="inline-block mt-1 text-[9px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Đang chờ</span>
                 )}
              </div>
            </div>
          ))}
          </div>
          
          {selectedContract.signatureStatus === 'pending' && (
             <div className="p-3 border-t border-slate-200 bg-slate-50">
               <button 
                onClick={() => setSigningModalOpen(true)}
                className="w-full py-2 bg-primary-600 text-white rounded text-xs font-bold hover:bg-primary-700 flex items-center justify-center gap-2"
               >
                 <Key className="w-3.5 h-3.5" /> Ký số ngay
               </button>
             </div>
          )}
        </div>
        )}

      </div>
      
      {/* Comments Area */}
      <div className="border-t border-slate-200">
        <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-200">
          <h4 className="text-xs font-bold uppercase text-slate-600 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Bình luận & Góp ý ({selectedContract.comments?.length || 0})
          </h4>
        </div>
        <div className="p-4 space-y-4">
          {(selectedContract.comments || []).map((cmt: any) => (
             <div key={cmt.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100 relative group">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-slate-900">{cmt.author}</span>
                  <span className="text-[9px] text-slate-400">{cmt.time}</span>
                </div>
                <p className="text-xs text-slate-700">{cmt.content}</p>
                
                <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-opacity">
                  <Reply className="w-3 h-3" />
                </button>
             </div>
          ))}
          {(!selectedContract.comments || selectedContract.comments.length === 0) && (
            <p className="text-center justify-center py-6 text-xs text-slate-400 italic">Chưa có bình luận nào.</p>
          )}
        </div>
      </div>
      
    </div>

    {/* Comment Input */}
    <div className="p-4 border-t border-slate-200 bg-white shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
       <div className="relative">
         <textarea 
           rows={2}
           value={newComment}
           onChange={(e) => setNewComment(e.target.value)}
           placeholder="Nhập góp ý, ghi chú để yêu cầu sửa đổi..."
           className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none pr-12 bg-slate-50 focus:bg-white"
         />
         <button onClick={handleAddComment} className="absolute bottom-2 right-2 p-1.5 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors">
           <Send className="w-3.5 h-3.5" />
         </button>
       </div>
    </div>
  </div>
 </div>
 </div>
 </div>
 )}


  {/* Remote Signing & Signature Placement Modal */}
  {signingModalOpen && (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600/30 border border-primary-400/40 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-primary-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Ký Số Điện Tử Từ Xa (Remote Signing)
              </h3>
              <p className="text-[11px] text-slate-300">Chuẩn eIDAS & Luật Giao Dịch Điện Tử 2023</p>
            </div>
          </div>
          <button 
            onClick={() => setSigningModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Document Summary Banner */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tài liệu ký kết</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedContract?.title}</p>
                <p className="text-xs text-slate-600 font-mono mt-0.5">Mã HĐ: {selectedContract?.id} • Giá trị: {selectedContract?.value || 'N/A'}</p>
              </div>
              <span className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-blue-50 text-blue-700 border border-blue-200">
                {selectedContract?.subtype || selectedContract?.type}
              </span>
            </div>
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-2">
              1. Chọn Nhà Cung Cấp Chữ Ký Số (CA Provider)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { id: 'smartca', name: 'VNPT SmartCA', desc: 'Xác thực OTP qua App SmartCA', badge: 'Phổ biến', icon: '📱' },
                { id: 'viettelca', name: 'Viettel CA Cloud', desc: 'Chứng thư số Cloud HSM', badge: 'Tốc độ cao', icon: '⚡' },
                { id: 'fpt', name: 'FPT eSign', desc: 'Ký số cá nhân & doanh nghiệp', badge: 'Chuẩn TT 78', icon: '🏛️' },
                { id: 'cloud_hsm', name: 'Cloud HSM VComm', desc: 'Dấu mộc điện tử MST 0318914439', badge: 'Tự động', icon: '🏢' },
              ].map(provider => (
                <div 
                  key={provider.id}
                  onClick={() => setSelectedWorkflowType(provider.id)}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between",
                    selectedWorkflowType === provider.id
                      ? "border-primary-600 bg-primary-50/40 shadow-sm ring-2 ring-primary-500/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{provider.icon}</span>
                    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", selectedWorkflowType === provider.id ? "bg-primary-100 text-primary-800" : "bg-slate-100 text-slate-600")}>
                      {provider.badge}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-bold text-slate-900">{provider.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{provider.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signer Selection & Position */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-2">
              2. Chủ thể thực hiện & Vị trí đóng mộc
            </label>
            <div className="space-y-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">Bên A: CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐIỆN TỬ VCOMM</p>
                  <p className="text-[11px] text-slate-500">MST: 0318914439 • Người đại diện: Tổng Giám Đốc</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">Sẵn sàng ký</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">Bên B: {selectedContract?.party}</p>
                  <p className="text-[11px] text-slate-500">Đối tác / Người lao động nhận thông báo ký qua Email & SMS</p>
                </div>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">Đồng ký kết</span>
              </div>
            </div>
          </div>

          {/* Security & TSA Verification Stamp */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Chứng thực thời gian chuẩn TSA (Time Stamping Authority)</span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              Văn bản sẽ được băm mã hóa SHA-256 và gắn tem thời gian bảo mật RFC 3161. Mọi can thiệp chỉnh sửa sau khi ký sẽ làm vô hiệu hóa giá trị pháp lý.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button 
            onClick={() => {
              setSigningModalOpen(false);
              navigate('/signature');
            }}
            className="text-xs font-semibold text-primary-700 hover:text-primary-800 flex items-center gap-1.5"
          >
            <Key className="w-3.5 h-3.5" /> Mở Trung tâm Ký số ({contracts.filter(c => c.signatureStatus === 'pending').length})
          </button>
          <div className="flex gap-2">
            <button 
              onClick={() => setSigningModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button 
              className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2"
              onClick={() => {
                const now = new Date().toLocaleString('vi-VN');
                // Update contract status
                setContracts(prev => prev.map(c => c.id === selectedContract?.id ? {
                  ...c,
                  status: 'active',
                  signatureStatus: 'signed',
                  signers: c.signers?.map((s: any) => ({ ...s, status: 'signed' })) || [],
                  signedAt: now,
                  tsaHash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}...SHA256`
                } : c));
                if (selectedContract) {
                  setSelectedContract({
                    ...selectedContract,
                    status: 'active',
                    signatureStatus: 'signed',
                    signers: selectedContract.signers?.map((s: any) => ({ ...s, status: 'signed' })) || [],
                    signedAt: now,
                    tsaHash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}...SHA256`
                  });
                }
                setSigningModalOpen(false);
                alert(`✅ Ký số thành công qua ${selectedWorkflowType.toUpperCase()}!\nHợp đồng ${selectedContract?.id} đã được đóng dấu mộc điện tử & kích hoạt hiệu lực pháp lý.`);
              }}
            >
              <Key className="w-4 h-4" /> Ký Số & Đóng Dấu Ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

  <div className="flex items-center justify-between">
  <div className="header-title">
  <h1 className="font-sans tracking-tight text-xl font-bold text-slate-900 flex items-center gap-2">
    {activeTab === 'quotes' ? (
      <>
        <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
        Báo Giá Bán Hàng (Quotes Studio)
      </>
    ) : (
      'Quản trị Hợp đồng'
    )}
  </h1>
  <p className="text-xs text-slate-500 mt-1">
    {activeTab === 'quotes' 
      ? 'Kết nối liền mạch Deal CRM sang Báo giá và 1-click chuyển đổi thành Hợp đồng ký số Cloud HSM.' 
      : 'Hợp đồng lao động, dịch vụ, mua bán và theo dõi thời hạn hợp đồng.'}
  </p>
  </div>
  <div className="flex gap-3">
  {activeTab === 'quotes' ? (
    <>
      <button 
        onClick={() => {
          if (CRM_DEALS_MOCK.length > 0) {
            handleSelectDealForQuote(CRM_DEALS_MOCK[0].id);
          }
          setShowCreateQuoteModal(true);
        }} 
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2"
      >
        <Sparkles className="w-4 h-4 text-amber-300" />
        Lập Báo Giá từ Deal CRM
      </button>
      <button 
        onClick={() => {
          setQuoteForm({
            selectedDealId: '',
            client: '',
            contactName: '',
            phone: '',
            pd: '',
            vatRate: 8,
            discount: 0,
            items: [{ name: '', qty: 1, unitPrice: 0, total: 0 }]
          });
          setShowCreateQuoteModal(true);
        }} 
        className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Tạo Báo Giá Mới
      </button>
    </>
  ) : (
    <button onClick={() => setShowCreateModal(true)} className="bg-[#111827] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
      <Plus className="w-4 h-4" />
      Tạo hợp đồng mới
    </button>
  )}
  </div>
  </div>

  <div className="flex gap-6">
  {/* Sidebar */}
  <div className="w-[240px] shrink-0 space-y-1">
  {[
  { id: 'quotes', label: 'Báo giá (Quotes Studio)', icon: FileSpreadsheet, badge: quotes.length },
  { id: 'labor', label: 'Hợp đồng LĐ, Thử việc', icon: Briefcase },
  { id: 'sales', label: 'Hợp đồng Mua bán', icon: ShoppingCart },
  { id: 'service', label: 'Hợp đồng Dịch vụ', icon: FileText },
  { id: 'signature', label: 'Trình ký (e-Sign)', icon: FileSignature },
  ].map(tab => (
  <button
  key={tab.id}
  onClick={() => setActiveTab(tab.id)}
  className={cn(
  "w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs transition-all text-left",
  activeTab === tab.id 
  ? "bg-primary-50 text-primary-700 font-bold" 
  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium"
  )}
  >
  <span className="flex items-center gap-3">
    <tab.icon className="w-4 h-4" />
    {tab.label}
  </span>
  {tab.badge !== undefined && (
    <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-indigo-100 text-indigo-700 font-bold">
      {tab.badge}
    </span>
  )}
  </button>
  ))}
  </div>

  {/* Content Area */}
  <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
  {activeTab === 'quotes' ? (
    <div className="p-6 space-y-6">
      {/* Quotes Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng Báo Giá</p>
          <p className="text-xl font-black text-slate-900 mt-1">{quotes.length}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Tất cả kỳ chào thầu</p>
        </div>
        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40">
          <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Tổng Giá Trị Chào Giá</p>
          <p className="text-xl font-black text-indigo-900 mt-1">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(quotes.reduce((s, q) => s + q.grandTotal, 0))}
          </p>
          <p className="text-[10px] text-indigo-600 mt-0.5">Bao gồm thuế & chiết khấu</p>
        </div>
        <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40">
          <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Đã Chuyển HĐ Ký Số</p>
          <p className="text-xl font-black text-purple-900 mt-1">
            {quotes.filter(q => q.status === 'converted').length}
          </p>
          <p className="text-[10px] text-purple-600 mt-0.5">Sẵn sàng Cloud HSM ký số</p>
        </div>
        <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Khách Duyệt / Đang Gửi</p>
          <p className="text-xl font-black text-emerald-900 mt-1">
            {quotes.filter(q => q.status === 'sent' || q.status === 'approved').length}
          </p>
          <p className="text-[10px] text-emerald-600 mt-0.5">Tỷ lệ chốt khả thi cao</p>
        </div>
      </div>

      {/* Quotes Search Bar */}
      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm mã BG, đối tác, dự án..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Dữ liệu liên thông thời gian thực với <span className="font-bold text-slate-700">CRM Deal Pipeline</span>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="overflow-x-auto min-w-0 border border-slate-200 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Mã BG / Ngày Lập</th>
              <th className="px-4 py-3">Khách Hàng / Deal CRM</th>
              <th className="px-4 py-3">Gói Chào Giá / Hạng Mục</th>
              <th className="px-4 py-3 text-right">Tổng Thanh Toán</th>
              <th className="px-4 py-3 text-center">Trạng Thái</th>
              <th className="px-4 py-3 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {quotes.map(q => (
              <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-bold text-slate-900">{q.id}</p>
                  <p className="text-[10px] text-slate-500">Lập: {q.createdAt}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-bold text-slate-900">{q.client}</p>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    {q.contactName} ({q.phone})
                  </p>
                  {q.dealId && (
                    <span className="inline-block mt-1 text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded border border-indigo-200">
                      CRM Deal #{q.dealId}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 max-w-[240px]">
                  <p className="font-medium text-slate-800 truncate">{q.pd}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{q.items.length} hạng mục chi tiết</p>
                </td>
                <td className="px-4 py-3 text-right">
                  <p className="font-black text-slate-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(q.grandTotal)}
                  </p>
                  <p className="text-[9px] text-slate-400">VAT {q.vatRate}%</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn(
                    "px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase inline-flex items-center gap-1",
                    q.status === 'converted' ? "bg-purple-100 text-purple-700 border border-purple-200" :
                    q.status === 'approved' ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                    q.status === 'sent' ? "bg-blue-100 text-blue-700 border border-blue-200" :
                    "bg-slate-100 text-slate-700 border border-slate-200"
                  )}>
                    {q.status === 'converted' && <CheckCircle2 className="w-3 h-3" />}
                    {q.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                    {q.status === 'sent' && <Send className="w-3 h-3" />}
                    {q.status === 'converted' ? 'Đã Thành HĐ Ký Số' :
                     q.status === 'approved' ? 'Khách Đã Duyệt' :
                     q.status === 'sent' ? 'Đã Gửi Khách' : 'Bản Nháp'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setSelectedQuote(q);
                        setShowQuotePreviewModal(true);
                      }}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Xem & In
                    </button>

                    {q.status === 'converted' ? (
                      <button
                        onClick={() => {
                          setActiveTab('sales');
                          const c = contracts.find(ct => ct.party === q.client || ct.id === q.contractId);
                          if (c) setSelectedContract(c);
                        }}
                        className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                      >
                        <FileSignature className="w-3.5 h-3.5" />
                        Xem HĐ Ký
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConvertQuoteToContract(q)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-all"
                      >
                        <Key className="w-3.5 h-3.5" />
                        Chuyển HĐ Ký Số
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ) : (
    <>
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
      <div className="relative w-64">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <input 
      type="text" 
      placeholder="Tìm kiếm hợp đồng..."
      className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
      />
      </div>
      <button className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-2xl shadow-sm">
      <RefreshCw className="w-4 h-4" />
      </button>
      </div>

      <div className="overflow-x-auto min-w-0 custom-scrollbar-x">
      <table className="min-w-[680px] w-full text-left border-collapse">
      <thead className="bg-slate-50 border-b border-slate-100">
      <tr>
      <th className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Mã HĐ / Tiêu đề</th>
      <th className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest w-40">Đối tác / Nhân sự</th>
      <th className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest w-32 whitespace-nowrap">Giá trị</th>
      <th className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest w-40 whitespace-nowrap text-center">Trạng thái</th>
      <th className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest w-36 whitespace-nowrap text-right">Ngày hết hạn</th>
      </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
      {contracts.filter(doc => activeTab === 'signature' ? true : doc.type === activeTab).map(doc => (
      <tr key={doc.id} onClick={() => setSelectedContract(doc)} className="hover:bg-slate-50 transition-colors cursor-pointer">
      <td className="px-4 py-3">
      <p className="text-[13px] font-bold text-slate-900">{doc.title}</p>
      <p className="text-[9px] text-slate-600 font-bold uppercase">{doc.id}</p>
      </td>
      <td className="px-4 py-3">
      <p className="text-[13px] font-medium text-slate-900">{doc.party}</p>
      </td>
      <td className="px-4 py-3">
      <p className="text-[13px] font-bold text-slate-800">{doc.value}</p>
      </td>
      <td className="px-4 py-3 text-center">
      <span className={cn(
      "px-2.5 py-1 text-[9px] font-bold rounded-lg uppercase tracking-tight inline-flex items-center gap-1",
      doc.status === 'active' ? "bg-emerald-50 text-emerald-600" : 
      doc.status === 'pending' ? "bg-amber-50 text-amber-600" :
      doc.status === "expiring_soon" ? "bg-orange-50 text-blue-600" : doc.status === "returned" ? "bg-slate-100 text-slate-700" : "bg-red-50 text-red-600"
      )}>
      {doc.status === 'active' && <CheckCircle2 className="w-3 h-3" />}
      {doc.status === 'pending' && <Clock className="w-3 h-3" />}
      {doc.status === 'expiring_soon' && <AlertTriangle className="w-3 h-3" />}
      {doc.status === "expired" || doc.status === "rejected" ? <AlertCircle className="w-3 h-3" /> : null}
      {doc.status === "returned" && <CornerDownRight className="w-3 h-3" />}
      {doc.status === 'active' ? 'Hiệu lực' : 
      doc.status === 'pending' ? 'Chờ duyệt' : 
      doc.status === "expiring_soon" ? "Sắp hết hạn" : doc.status === "returned" ? "Trả lại" : doc.status === "rejected" ? "Từ chối" : "Hết hạn"}
      </span>
      {doc.signatureStatus && (
      <div className="mt-1.5">
      <span className={cn(
      "px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-tight inline-flex items-center gap-1",
      doc.signatureStatus === 'signed' ? "bg-slate-100 text-blue-600" : "bg-slate-100 text-slate-700"
      )}>
      <PenTool className="w-3 h-3" />
      {doc.signatureStatus === 'signed' ? 'Đã ký số' : 'Chưa ký'}
      </span>
      </div>
      )}
      </td>
      <td className="px-4 py-3 text-right">
      <p className={cn(
      "text-xs font-mono font-medium",
      doc.status === 'expired' ? "text-red-500" :
      doc.status === 'expiring_soon' ? "text-blue-600 font-bold" : "text-slate-700"
      )}>{doc.expiry}</p>
      </td>
      </tr>
      ))}
      </tbody>
      </table>
      </div>
    </>
  )}
  </div>

  {/* Modal Lập Báo Giá Mới / Kết Nối Deal CRM */}
  {showCreateQuoteModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCreateQuoteModal(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/40 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Lập Báo Giá Bán Hàng (Quote Studio)</h3>
              <p className="text-[11px] text-indigo-200">Liên thông trực tiếp Deal từ CRM sang Báo Giá & Ký Số</p>
            </div>
          </div>
          <button onClick={() => setShowCreateQuoteModal(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {/* Pick CRM Deal */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
            <label className="block font-bold text-indigo-900 text-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Chọn Deal Tiềm Năng Từ Phân Hệ CRM:
            </label>
            <select
              value={quoteForm.selectedDealId}
              onChange={e => handleSelectDealForQuote(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Nhập thông tin thủ công (không liên kết Deal) --</option>
              {CRM_DEALS_MOCK.map(d => (
                <option key={d.id} value={d.id}>
                  Deal #{d.id}: {d.client} — {d.pd} ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(d.val)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tên khách hàng / Công ty</label>
              <input
                type="text"
                value={quoteForm.client}
                onChange={e => setQuoteForm({ ...quoteForm, client: e.target.value })}
                placeholder="VD: Tập đoàn TH True Milk..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Người liên hệ & SĐT</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={quoteForm.contactName}
                  onChange={e => setQuoteForm({ ...quoteForm, contactName: e.target.value })}
                  placeholder="Họ tên"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  value={quoteForm.phone}
                  onChange={e => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                  placeholder="SĐT"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">Danh mục sản phẩm & dịch vụ chào thầu</label>
              <button
                type="button"
                onClick={handleAddItemToQuote}
                className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-bold text-[11px] flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Thêm dòng
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">Hạng mục / Thiết bị</th>
                    <th className="px-2 py-2 w-16 text-center">SL</th>
                    <th className="px-3 py-2 w-32 text-right">Đơn giá (₫)</th>
                    <th className="px-3 py-2 w-32 text-right">Thành tiền (₫)</th>
                    <th className="px-2 py-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quoteForm.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={e => handleUpdateItemInQuote(idx, 'name', e.target.value)}
                          placeholder="Tên sản phẩm..."
                          className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={e => handleUpdateItemInQuote(idx, 'qty', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-center"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={e => handleUpdateItemInQuote(idx, 'unitPrice', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-right font-mono"
                        />
                      </td>
                      <td className="p-2 text-right font-bold text-slate-800 font-mono">
                        {new Intl.NumberFormat('vi-VN').format(item.total || 0)} ₫
                      </td>
                      <td className="p-2 text-center">
                        {quoteForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromQuote(idx)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals & VAT */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Tạm tính (Subtotal):</span>
              <span className="font-mono font-bold">{new Intl.NumberFormat('vi-VN').format(quoteSubtotal)} ₫</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Chiết khấu (VND):</span>
              <input
                type="number"
                value={quoteForm.discount}
                onChange={e => setQuoteForm({ ...quoteForm, discount: Number(e.target.value) || 0 })}
                className="w-32 px-2 py-1 border border-slate-300 rounded text-right font-mono text-xs bg-white"
              />
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Thuế suất VAT:</span>
              <select
                value={quoteForm.vatRate}
                onChange={e => setQuoteForm({ ...quoteForm, vatRate: Number(e.target.value) })}
                className="w-24 px-2 py-1 border border-slate-300 rounded text-xs bg-white"
              >
                <option value={0}>0%</option>
                <option value={8}>8%</option>
                <option value={10}>10%</option>
              </select>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-base font-black text-indigo-950">
              <span>Tổng cộng thanh toán (VAT):</span>
              <span className="text-indigo-600 font-mono">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(quoteGrandTotal)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button onClick={() => setShowCreateQuoteModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900">
            Đóng
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSaveQuote(false)}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-bold transition-all"
            >
              Lưu & Phát Hành Báo Giá
            </button>
            <button
              onClick={() => handleSaveQuote(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Key className="w-3.5 h-3.5" />
              Lưu & Tạo HĐ Ký Số Ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* Modal Xem & In Báo Giá (Quote Preview Modal) */}
  {showQuotePreviewModal && selectedQuote && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowQuotePreviewModal(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 max-h-[92vh]" onClick={e => e.stopPropagation()}>
        {/* Header Preview Bar */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex justify-between items-center bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-sm">Bản Xem Trước & In Báo Giá: {selectedQuote.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5" />
              In Báo Giá
            </button>
            <button
              onClick={() => setShowQuotePreviewModal(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Preview Area */}
        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-white text-slate-800 text-xs">
          {/* Company letterhead */}
          <div className="flex justify-between items-start border-b border-slate-300 pb-5">
            <div>
              <h2 className="text-base font-black uppercase text-indigo-900 tracking-wide">CÔNG TY CỔ PHẦN CÔNG NGHỆ VCOMM</h2>
              <p className="text-[11px] text-slate-600 mt-1">Trụ sở: Tòa nhà VComm Tower, Số 88 Phố Vọng, Đống Đa, Hà Nội</p>
              <p className="text-[11px] text-slate-600">Hotline: 1900 6868 • Email: sales@vcomm.vn • MST: 0109887766</p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold text-xs">
                {selectedQuote.id}
              </span>
              <p className="text-[10px] text-slate-500 mt-1.5">Ngày lập: {selectedQuote.createdAt}</p>
              <p className="text-[10px] text-slate-500">Hiệu lực đến: {selectedQuote.expiryDate}</p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center py-2">
            <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">BẢNG BÁO GIÁ DỰ ÁN</h1>
            <p className="text-xs text-slate-500 mt-1">Kính gửi Quý Khách hàng: <span className="font-bold text-slate-800">{selectedQuote.client}</span></p>
          </div>

          {/* Client box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] text-slate-500 font-bold uppercase">Bên Mua (Khách hàng):</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedQuote.client}</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Người đại diện: {selectedQuote.contactName}</p>
              <p className="text-[11px] text-slate-600">Điện thoại liên hệ: {selectedQuote.phone}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-bold uppercase">Bên Bán (VComm):</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">VComm Technology & Solutions JSC</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Đại diện kinh doanh: Hoàng Thanh Mai</p>
              <p className="text-[11px] text-slate-600">Chức vụ: Giám đốc Khách hàng Doanh nghiệp</p>
            </div>
          </div>

          {/* Table items */}
          <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 w-10 text-center">STT</th>
                <th className="px-3 py-2.5">Hạng Mục Thiết Bị / Bản Quyền Giải Pháp</th>
                <th className="px-3 py-2.5 w-16 text-center">SL</th>
                <th className="px-3 py-2.5 w-32 text-right">Đơn Giá</th>
                <th className="px-3 py-2.5 w-32 text-right">Thành Tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {selectedQuote.items.map((it, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2 text-center text-slate-500 font-mono">{idx + 1}</td>
                  <td className="px-3 py-2 font-semibold text-slate-900">{it.name}</td>
                  <td className="px-3 py-2 text-center font-mono">{it.qty}</td>
                  <td className="px-3 py-2 text-right font-mono">{new Intl.NumberFormat('vi-VN').format(it.unitPrice)} ₫</td>
                  <td className="px-3 py-2 text-right font-bold text-slate-900 font-mono">{new Intl.NumberFormat('vi-VN').format(it.total)} ₫</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-medium text-slate-700 border-t border-slate-200">
              <tr>
                <td colSpan={4} className="px-3 py-2 text-right">Cộng tiền hàng (Subtotal):</td>
                <td className="px-3 py-2 text-right font-bold font-mono">{new Intl.NumberFormat('vi-VN').format(selectedQuote.subtotal)} ₫</td>
              </tr>
              {selectedQuote.discount > 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-1.5 text-right text-emerald-600">Chiết khấu thương mại:</td>
                  <td className="px-3 py-1.5 text-right font-bold text-emerald-600 font-mono">-{new Intl.NumberFormat('vi-VN').format(selectedQuote.discount)} ₫</td>
                </tr>
              )}
              <tr>
                <td colSpan={4} className="px-3 py-1.5 text-right">Thuế GTGT ({selectedQuote.vatRate}%):</td>
                <td className="px-3 py-1.5 text-right font-bold font-mono">{new Intl.NumberFormat('vi-VN').format(selectedQuote.vatAmount)} ₫</td>
              </tr>
              <tr className="text-sm font-black text-indigo-950 bg-indigo-50/50">
                <td colSpan={4} className="px-3 py-2.5 text-right uppercase">Tổng thanh toán đã gồm VAT:</td>
                <td className="px-3 py-2.5 text-right text-indigo-600 font-mono">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedQuote.grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Terms */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-600">
            <p className="font-bold text-slate-800 uppercase text-[10px]">Điều khoản thương mại & bảo hành:</p>
            <p>1. Thời gian bảo hành: 12 tháng chính hãng đổi mới 1-1 trong 30 ngày đầu tiên.</p>
            <p>2. Tiến độ giao hàng: Trong vòng 05 - 07 ngày làm việc kể từ ngày hợp đồng điện tử có hiệu lực.</p>
            <p>3. Phương thức thanh toán: Chuyển khoản ngân hàng trực tiếp vào tài khoản VComm Corp.</p>
          </div>

          {/* Signatures block */}
          <div className="grid grid-cols-2 pt-6 text-center">
            <div>
              <p className="font-bold text-slate-900 uppercase">ĐẠI DIỆN KHÁCH HÀNG</p>
              <p className="text-[10px] text-slate-400 mt-1">(Ký, đóng dấu hoặc ký số SmartCA)</p>
              <div className="h-16 flex items-center justify-center text-slate-300 italic text-[11px]">
                {selectedQuote.status === 'converted' ? 'Đã duyệt chuyển sang Hợp Đồng' : 'Chờ xác nhận'}
              </div>
              <p className="font-bold text-slate-800">{selectedQuote.contactName}</p>
            </div>
            <div>
              <p className="font-bold text-slate-900 uppercase">ĐẠI DIỆN VCOMM CORPORATION</p>
              <p className="text-[10px] text-slate-400 mt-1">(Ký số HSM & Đóng dấu điện tử)</p>
              <div className="h-16 flex items-center justify-center">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold border border-emerald-300 rounded text-[10px]">
                  ✓ Verified by VComm Cloud HSM
                </span>
              </div>
              <p className="font-bold text-slate-800">TỔNG GIÁM ĐỐC</p>
            </div>
          </div>
        </div>

        {/* Action Bottom Bar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          <button onClick={() => setShowQuotePreviewModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900">
            Đóng
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleConvertQuoteToContract(selectedQuote)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/20 flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              Chuyển Thành Hợp Đồng Ký Số Cloud HSM
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

  {showCreateModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
  <div className="bg-white rounded-xl shadow-sm w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
  <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
  <h3 className="text-lg font-bold text-slate-900">Tạo hợp đồng mới</h3>
  <button onClick={() => setShowCreateModal(false)} className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors">
  <X className="w-5 h-5" />
  </button>
  </div>
  <div className="p-6 space-y-4">
  <div>
  <label className="block text-[13px] font-bold text-slate-800 mb-2">Tiêu đề hợp đồng</label>
  <input type="text" placeholder="Nhập tiêu đề..." className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" />
  </div>
  <div className="grid grid-cols-2 gap-4">
    <div>
    <label className="block text-[13px] font-bold text-slate-800 mb-2">Đối tác / Nhân sự</label>
    <input type="text" placeholder="Tên bên B..." className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" />
    </div>
    <div>
    <label className="block text-[13px] font-bold text-slate-800 mb-2">Giá trị dự kiến</label>
    <input type="text" placeholder="VD: 50,000,000 ₫" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" />
    </div>
  </div>
  <div>
   <label className="block text-[13px] font-bold text-slate-800 mb-2">Đính kèm dự thảo (docx, xlsx, pdf...)</label>
   <div className="border-2 border-dashed border-slate-300 p-6 rounded-xl flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
     <div className="bg-white p-3 rounded-full shadow-sm border border-slate-200  transition-transform mb-3">
       <File className="w-6 h-6 text-primary-600" />
     </div>
     <p className="text-xs font-bold text-slate-700">Kéo thả hoặc bấm để chọn tệp</p>
     <p className="text-xs text-slate-500 mt-1">Hỗ trợ PDF, DOCX, XLSX, PPTX (Tối đa 20MB)</p>
   </div>
  </div>
  </div>
  <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
  <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors">Hủy</button>
  <button onClick={() => { alert('Tạo hợp đồng thành công!'); setShowCreateModal(false); }} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700 transition-colors">Tạo & Trình duyệt</button>
  </div>
  </div>
  </div>
  )}
  </div>
  </div>
  );
}