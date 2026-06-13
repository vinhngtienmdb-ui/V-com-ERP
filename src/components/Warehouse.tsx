import { DraggableGrid } from './ui/DraggableGrid';
import { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  Settings,
  BarChart2,
  FileSignature,
  GitBranch,
  ArrowLeft,
  Search,
  Filter,
  Warehouse,
  Package,
  FileInput,
  FileOutput,
  ClipboardList,
  Phone,
  Mail,
  Percent,
  Globe,
  Plus,
  MoreVertical,
  Receipt,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  DollarSign,
  Truck,
  MapPin,
  Navigation,
  ListTodo,
  Clock,
  Sparkles,
  Zap,
  TrendingUp,
  LayoutGrid,
  Timer,
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { db, collection, onSnapshot, query, where, getDocs, range, orderBy } from '../lib/firebase';
import { useStore } from '../context/StoreContext';

const WAREHOUSE_MODULE_GROUPS = [
  {
    title: 'Nhập/xuất kho',
    items: [
      {
        id: 'wh_in_out',
        label: 'Phiếu kho',
        desc: 'Nhập kho, xuất kho, điều chuyển.',
        icon: FileInput,
        color: 'blue',
      },
      {
        id: 'wh_transfer_history',
        label: 'Lịch sử Luân chuyển',
        desc: 'Theo dõi toàn bộ quá trình di chuyển SKU giữa các kho chi nhánh.',
        icon: Clock,
        color: 'purple',
      },
      {
        id: 'wh_req_purchase',
        label: 'Phiếu đề xuất mua hàng',
        desc: 'Đề xuất hàng thiếu.',
        icon: GitBranch,
        color: 'indigo',
      },
      {
        id: 'wh_inventory',
        label: 'Kiểm kê kho',
        desc: 'Thực hiện kiểm kê định kỳ.',
        icon: ClipboardList,
        color: 'emerald',
      },
    ],
  },
  {
    title: 'Vận hành & Tối ưu AI',
    items: [
      {
        id: 'wh_ff_orders',
        label: 'Quản lý vận chuyển',
        desc: 'Theo dõi đơn hàng đang giao.',
        icon: ListTodo,
        color: 'indigo',
      },
      {
        id: 'wh_ff_predict',
        label: 'Dự báo nhu cầu AI',
        desc: 'Dự báo hàng tồn cần nhập.',
        icon: Sparkles,
        color: 'purple',
      },
      {
        id: 'wh_ff_heatmap',
        label: 'Bản đồ nhiệt kho',
        desc: 'Tối ưu hóa vị trí lưu kho.',
        icon: Zap,
        color: 'orange',
      },
      {
        id: 'wh_ff_tracking',
        label: 'Theo dõi lộ trình',
        desc: 'Real-time tracking vận chuyển.',
        icon: Navigation,
        color: 'blue',
      },
    ],
  },
  {
    title: 'Báo cáo',
    items: [
      {
        id: 'wh_stock',
        label: 'Tồn kho',
        desc: 'Danh sách tồn kho hiện tại.',
        icon: Package,
        color: 'orange',
      },
      {
        id: 'wh_in_out_report',
        label: 'Báo cáo nhập xuất tồn',
        desc: 'Thống kê luân chuyển.',
        icon: BarChart2,
        color: 'purple',
      },
    ],
  },
  {
    title: 'Thiết lập và danh mục',
    items: [
      {
        id: 'wh_cat',
        label: 'Danh mục hàng hóa',
        desc: 'Phân loại hàng hóa.',
        icon: FileSignature,
        color: 'rose',
      },
      {
        id: 'wh_items',
        label: 'Danh sách hàng hóa',
        desc: 'Quản lý mã hàng, SKU.',
        icon: Package,
        color: 'fuchsia',
      },
      {
        id: 'wh_list',
        label: 'Danh sách kho',
        desc: 'Quản lý các vị trí kho.',
        icon: Warehouse,
        color: 'blue',
      },
      {
        id: 'wh_partners',
        label: 'Danh sách đối tác',
        desc: 'Đối tác kho vận.',
        icon: Users,
        color: 'slate',
      },
      {
        id: 'wh_settings',
        label: 'Thiết lập kho',
        desc: 'Config quy tắc kho.',
        icon: Settings,
        color: 'slate',
      },
    ],
  },
];

const LOGISTICS_PARTNERS = [
  {
    id: 'LP001',
    name: 'Giao Hàng Nhanh (GHN)',
    contact: '1900 636683',
    email: 'cskh@ghn.vn',
    policy: 'Chiết khấu 10% cho đơn trên 100tr/tháng',
    status: 'Active',
    website: 'ghn.vn',
    coverage: 'Toàn quốc',
  },
  {
    id: 'LP002',
    name: 'Viettel Post',
    contact: '1900 8095',
    email: 'support@viettelpost.com.vn',
    policy: 'Đồng giá 22k nội tỉnh',
    status: 'Active',
    website: 'viettelpost.com.vn',
    coverage: 'Toàn quốc',
  },
  {
    id: 'LP003',
    name: 'Ninja Van',
    contact: '1900 888685',
    email: 'support_vn@ninjavan.co',
    policy: 'Giảm 15% cho shop mới',
    status: 'Maintenance',
    website: 'ninjavan.co',
    coverage: 'Toàn quốc',
  },
];

const LOGISTICS_FEES: Record<string, any[]> = {
  // ... existing fees
};

const MOCK_SKUS = [
  {
    id: 'SKU-881',
    name: 'Cà phê hạt Robusta Thượng Hạng',
    category: 'Cà phê',
    currentStock: 450,
    unit: 'KG',
  },
  {
    id: 'SKU-882',
    name: 'Sữa Đặc Ngôi Sao Phương Nam 1.2kg',
    category: 'Sữa đặc',
    currentStock: 120,
    unit: 'Hộp',
  },
  {
    id: 'SKU-883',
    name: 'Trà ô long túi lọc Cozy',
    category: 'Trà',
    currentStock: 310,
    unit: 'Hộp',
  },
  {
    id: 'SKU-884',
    name: 'Đường cát trắng Biên Hòa Co-op',
    category: 'Phụ liệu',
    currentStock: 800,
    unit: 'KG',
  },
  {
    id: 'SKU-885',
    name: 'Syrup Đào Teisseire Pháp 700ml',
    category: 'Siro',
    currentStock: 45,
    unit: 'Chai',
  },
];

const MOCK_BRANCHES = [
  { id: 'WH-CENTRAL', name: 'Kho Tổng miền Nam (Q12)' },
  { id: 'WH-DIST3', name: 'Kho Chi nhánh Quận 3 (Võ Văn Tần)' },
  { id: 'WH-DIST1', name: 'Kho Chi nhánh Quận 1 (Lê Lợi)' },
  { id: 'WH-DIST5', name: 'Kho Chi nhánh Quận 5 (Nguyễn Trãi)' },
  { id: 'WH-BINHTHANH', name: 'Kho Bình Thạnh (Lê Quang Định)' },
];

const MOCK_TRANSFER_LOGS = [
  {
    id: 'TRF-9021',
    skuId: 'SKU-881',
    quantity: 150,
    unit: 'KG',
    fromBranch: 'WH-CENTRAL',
    toBranch: 'WH-DIST3',
    status: 'completed',
    date: '02/06/2026 10:15',
    shipper: 'GHN - Nguyễn Văn Tài',
    driverPhone: '0909.123.456',
    notes: 'Bổ sung tồn phục vụ dịp khai trương chi nhánh mới Quận 3',
    stages: [
      {
        name: 'Khởi tạo yêu cầu',
        time: '02/06/2026 08:00',
        done: true,
        desc: 'Duyệt tự động theo đề xuất AI',
      },
      {
        name: 'Đã xuất kho gửi',
        time: '02/06/2026 09:12',
        done: true,
        desc: 'Xuất kho từ Kho Tổng (Q12)',
      },
      {
        name: 'Đang vận chuyển',
        time: '02/06/2026 09:45',
        done: true,
        desc: 'Shipper GHN đã nhận bàn giao',
      },
      {
        name: 'Đã nhập kho nhận',
        time: '02/06/2026 10:15',
        done: true,
        desc: 'Thủ kho Q3 đối soát thành công 150 KG nguyên vẹn',
      },
    ],
  },
  {
    id: 'TRF-9022',
    skuId: 'SKU-881',
    quantity: 100,
    unit: 'KG',
    fromBranch: 'WH-CENTRAL',
    toBranch: 'WH-DIST1',
    status: 'shipping',
    date: '02/06/2026 14:30',
    shipper: 'Viettel Post - Trần Minh Trọng',
    driverPhone: '0918.456.789',
    notes: 'Điều chuyển khẩn cấp đáp ứng nhu cầu tăng cao giờ cao điểm',
    stages: [
      {
        name: 'Khởi tạo yêu cầu',
        time: '02/06/2026 13:00',
        done: true,
        desc: 'Tạo bởi quản trị viên chi nhánh',
      },
      { name: 'Đã xuất kho gửi', time: '02/06/2026 14:00', done: true, desc: 'Từ Kho Tổng' },
      {
        name: 'Đang vận chuyển',
        time: '02/06/2026 14:30',
        done: true,
        desc: 'Viettel Post Hub Q12 dán tem niêm phong',
      },
      {
        name: 'Đã nhập kho nhận',
        time: 'Dự kiến: 16:30 02/06',
        done: false,
        desc: 'Đang di chuyển qua vòng xoay Dân Chủ',
      },
    ],
  },
  {
    id: 'TRF-9023',
    skuId: 'SKU-881',
    quantity: 50,
    unit: 'KG',
    fromBranch: 'WH-DIST3',
    toBranch: 'WH-DIST5',
    status: 'completed',
    date: '01/06/2026 16:45',
    shipper: 'Vận chuyển nội bộ - Lê Hoàng Anh',
    driverPhone: '0945.789.012',
    notes: 'Cân đối tồn dư từ Q3 hỗ trợ Q5 thiếu hụt nhẹ',
    stages: [
      {
        name: 'Khởi tạo yêu cầu',
        time: '01/06/2026 15:30',
        done: true,
        desc: 'Thủ kho Q3 yêu cầu',
      },
      { name: 'Đã xuất kho gửi', time: '01/06/2026 16:00', done: true, desc: 'Kho Võ Văn Tần' },
      {
        name: 'Đang vận chuyển',
        time: '01/06/2026 16:20',
        done: true,
        desc: 'Giao trực tiếp bằng xe chuyển hàng nội bộ',
      },
      {
        name: 'Đã nhập kho nhận',
        time: '01/06/2026 16:45',
        done: true,
        desc: 'Nhập thành công 50 KG nguyên vẹn',
      },
    ],
  },
  {
    id: 'TRF-9024',
    skuId: 'SKU-882',
    quantity: 60,
    unit: 'Hộp',
    fromBranch: 'WH-CENTRAL',
    toBranch: 'WH-BINHTHANH',
    status: 'completed',
    date: '31/05/2026 09:30',
    shipper: 'GHN - Nguyễn Văn Tài',
    driverPhone: '0909.123.456',
    notes: 'Sữa đặc phục vụ kho Bình Thạnh',
    stages: [
      {
        name: 'Khởi tạo yêu cầu',
        time: '31/05/2026 07:30',
        done: true,
        desc: 'Hệ thống tự động đề xuất',
      },
      { name: 'Đã xuất kho gửi', time: '31/05/2026 08:15', done: true, desc: 'Thủ kho xả tồn' },
      {
        name: 'Đang vận chuyển',
        time: '31/05/2026 08:50',
        done: true,
        desc: 'Kênh luân chuyển vận nội tỉnh',
      },
      { name: 'Đã nhập kho nhận', time: '31/05/2026 09:30', done: true, desc: 'Hoàn thành nhập' },
    ],
  },
  {
    id: 'TRF-9025',
    skuId: 'SKU-882',
    quantity: 40,
    unit: 'Hộp',
    fromBranch: 'WH-CENTRAL',
    toBranch: 'WH-DIST1',
    status: 'draft',
    date: '02/06/2026 15:45',
    shipper: 'Chờ điều phối',
    driverPhone: '',
    notes: 'Kế hoạch bổ sung tồn dự phòng kho Quận 1',
    stages: [
      {
        name: 'Khởi tạo yêu cầu',
        time: '02/06/2026 15:45',
        done: true,
        desc: 'Khởi tạo bởi chi nhánh Quận 1',
      },
      { name: 'Đã xuất kho gửi', time: 'Chờ duyệt', done: false, desc: 'Chưa bốc dỡ' },
      { name: 'Đang vận chuyển', time: 'Chờ chuyển', done: false, desc: 'Chưa đóng gói' },
      { name: 'Đã nhập kho nhận', time: 'Chờ nhận', done: false, desc: 'Dự kiến sáu giờ' },
    ],
  },
  {
    id: 'TRF-9026',
    skuId: 'SKU-883',
    quantity: 120,
    unit: 'Hộp',
    fromBranch: 'WH-CENTRAL',
    toBranch: 'WH-DIST5',
    status: 'completed',
    date: '30/05/2026 11:20',
    shipper: 'Ninja Van - Lê Anh Quân',
    driverPhone: '0977.111.222',
    notes: 'Luân chuyển trà Cozy sang Q5',
    stages: [
      { name: 'Khởi tạo', time: '30/05/2026 09:00', done: true, desc: 'Theo kế hoạch định kỳ' },
      {
        name: 'Đã xuất kho',
        time: '30/05/2026 10:00',
        done: true,
        desc: 'Đã đóng bao bì niêm phong',
      },
      {
        name: 'Đang di chuyển',
        time: '30/05/2026 10:45',
        done: true,
        desc: 'Shipper đang trên đường giao',
      },
      {
        name: 'Đã nhận bàn giao',
        time: '30/05/2026 11:20',
        done: true,
        desc: 'Thành công đối soát',
      },
    ],
  },
];

const MOCK_SHIPMENTS = [
  {
    id: 'SHIP-001',
    orderId: 'ORD-5521',
    partner: 'GHN',
    status: 'In Transit',
    driver: 'Nguyễn Văn Nam',
    eta: '15:30 Today',
  },
  {
    id: 'SHIP-002',
    orderId: 'ORD-5525',
    partner: 'Viettel Post',
    status: 'Delivered',
    driver: 'Trần Văn Tú',
    eta: 'Success',
  },
  {
    id: 'SHIP-003',
    orderId: 'ORD-5528',
    partner: 'Ninja Van',
    status: 'Chờ xử lý',
    driver: 'Chưa điều phối',
    eta: 'Ngày mai',
  },
];

function getColorClasses(color: string) {
  switch (color) {
    case 'blue':
      return 'bg-slate-100 text-orange-700';
    case 'orange':
      return 'bg-orange-50 text-orange-600';
    case 'indigo':
      return 'bg-primary-50 text-primary-600';
    case 'purple':
      return 'bg-purple-50 text-purple-600';
    case 'emerald':
      return 'bg-emerald-50 text-emerald-600';
    case 'fuchsia':
      return 'bg-fuchsia-50 text-fuchsia-600';
    case 'rose':
      return 'bg-rose-50 text-rose-600';
    case 'slate':
    default:
      return 'bg-slate-50 text-slate-700';
  }
}

export function WarehouseModule() {
  const { activeStore } = useStore();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedPartnerForFees, setSelectedPartnerForFees] = useState<string | null>(null);
  const [transferLogs, setTransferLogs] = useState<any[]>(MOCK_TRANSFER_LOGS);
  const [selectedSkuFilter, setSelectedSkuFilter] = useState<string>('Tất cả');
  const [selectedFromFilter, setSelectedFromFilter] = useState<string>('Tất cả');
  const [selectedToFilter, setSelectedToFilter] = useState<string>('Tất cả');
  const [skuStatusFilter, setSkuStatusFilter] = useState<string>('Tất cả');
  const [skuSearchQuery, setSkuSearchQuery] = useState<string>('');
  const [selectedLogDetail, setSelectedLogDetail] = useState<any | null>(MOCK_TRANSFER_LOGS[0]);
  const [showCreateTransferModal, setShowCreateTransferModal] = useState<boolean>(false);
  const [newTransfer, setNewTransfer] = useState({
    skuId: 'SKU-881',
    quantity: 50,
    fromBranch: 'WH-CENTRAL',
    toBranch: 'WH-DIST3',
    shipper: 'GHN - Nguyễn Văn Tài',
    notes: '',
  });
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Advanced Warehouse Heatmap States
  const [selectedZone, setSelectedZone] = useState<string>('A');
  const [heatmapMetric, setHeatmapMetric] = useState<'utilization' | 'pick_freq' | 'expiry'>(
    'utilization'
  );
  const [shelfSearchQuery, setShelfSearchQuery] = useState<string>('');
  const [selectedShelf, setSelectedShelf] = useState<any | null>(null);
  const [isOptimizingLayout, setIsOptimizingLayout] = useState<boolean>(false);
  const [optimizationSuccess, setOptimizationSuccess] = useState<boolean>(false);
  const [showPrintLabelSuccess, setShowPrintLabelSuccess] = useState<boolean>(false);
  const [relocateForm, setRelocateForm] = useState<{
    skuId: string;
    qty: number;
    targetShelfId: string;
  }>({
    skuId: '',
    qty: 0,
    targetShelfId: '',
  });
  const [relocateSuccess, setRelocateSuccess] = useState<string>('');

  const [shelves, setShelves] = useState<any[]>([
    {
      id: 'A-R1-L1',
      zone: 'A',
      rack: 'Kệ 01',
      level: 'Tầng 1',
      occupancy: 45,
      pickFreq: 'Medium',
      sensorTemp: 24,
      sensorHumid: 55,
      items: [
        {
          skuId: 'SKU-881',
          name: 'Cà phê hạt Robusta Thượng Hạng',
          qty: 225,
          maxQty: 500,
          expiryDays: 120,
        },
      ],
    },
    {
      id: 'A-R1-L2',
      zone: 'A',
      rack: 'Kệ 01',
      level: 'Tầng 2',
      occupancy: 85,
      pickFreq: 'High',
      sensorTemp: 23,
      sensorHumid: 54,
      items: [
        {
          skuId: 'SKU-881',
          name: 'Cà phê hạt Robusta Thượng Hạng',
          qty: 255,
          maxQty: 300,
          expiryDays: 95,
        },
      ],
    },
    {
      id: 'A-R1-L3',
      zone: 'A',
      rack: 'Kệ 01',
      level: 'Tầng 3',
      occupancy: 20,
      pickFreq: 'Low',
      sensorTemp: 24,
      sensorHumid: 56,
      items: [
        {
          skuId: 'SKU-883',
          name: 'Trà ô long túi lọc Cozy',
          qty: 60,
          maxQty: 300,
          expiryDays: 240,
        },
      ],
    },
    {
      id: 'A-R1-L4',
      zone: 'A',
      rack: 'Kệ 01',
      level: 'Tầng 4',
      occupancy: 95,
      pickFreq: 'Critical',
      sensorTemp: 25,
      sensorHumid: 57,
      items: [
        {
          skuId: 'SKU-884',
          name: 'Đường cát trắng Biên Hòa Co-op',
          qty: 760,
          maxQty: 800,
          expiryDays: 360,
        },
      ],
    },

    {
      id: 'A-R2-L1',
      zone: 'A',
      rack: 'Kệ 02',
      level: 'Tầng 1',
      occupancy: 15,
      pickFreq: 'Low',
      sensorTemp: 24,
      sensorHumid: 55,
      items: [
        {
          skuId: 'SKU-885',
          name: 'Syrup Đào Teisseire Pháp 700ml',
          qty: 15,
          maxQty: 100,
          expiryDays: 180,
        },
      ],
    },
    {
      id: 'A-R2-L2',
      zone: 'A',
      rack: 'Kệ 02',
      level: 'Tầng 2',
      occupancy: 50,
      pickFreq: 'Medium',
      sensorTemp: 24,
      sensorHumid: 55,
      items: [
        {
          skuId: 'SKU-882',
          name: 'Sữa Đặc Ngôi Sao Phương Nam 1.2kg',
          qty: 60,
          maxQty: 120,
          expiryDays: 45,
        },
      ],
    },
    {
      id: 'A-R2-L3',
      zone: 'A',
      rack: 'Kệ 02',
      level: 'Tầng 3',
      occupancy: 70,
      pickFreq: 'High',
      sensorTemp: 23,
      sensorHumid: 53,
      items: [
        {
          skuId: 'SKU-882',
          name: 'Sữa Đặc Ngôi Sao Phương Nam 1.2kg',
          qty: 60,
          maxQty: 120,
          expiryDays: 45,
        },
        {
          skuId: 'SKU-885',
          name: 'Syrup Đào Teisseire Pháp 700ml',
          qty: 30,
          maxQty: 80,
          expiryDays: 120,
        },
      ],
    },
    {
      id: 'A-R2-L4',
      zone: 'A',
      rack: 'Kệ 02',
      level: 'Tầng 4',
      occupancy: 0,
      pickFreq: 'None',
      sensorTemp: 25,
      sensorHumid: 56,
      items: [],
    },

    {
      id: 'A-R3-L1',
      zone: 'A',
      rack: 'Kệ 03',
      level: 'Tầng 1',
      occupancy: 40,
      pickFreq: 'Low',
      sensorTemp: 22,
      sensorHumid: 50,
      items: [
        {
          skuId: 'SKU-883',
          name: 'Trà ô long túi lọc Cozy',
          qty: 100,
          maxQty: 250,
          expiryDays: 150,
        },
      ],
    },
    {
      id: 'A-R3-L2',
      zone: 'A',
      rack: 'Kệ 03',
      level: 'Tầng 2',
      occupancy: 92,
      pickFreq: 'Critical',
      sensorTemp: 22,
      sensorHumid: 51,
      items: [
        {
          skuId: 'SKU-883',
          name: 'Trà ô long túi lọc Cozy',
          qty: 150,
          maxQty: 250,
          expiryDays: 12,
        },
        {
          skuId: 'SKU-881',
          name: 'Cà phê hạt Robusta Thượng Hạng',
          qty: 50,
          maxQty: 100,
          expiryDays: 80,
        },
      ],
    },
    {
      id: 'A-R3-L3',
      zone: 'A',
      rack: 'Kệ 03',
      level: 'Tầng 3',
      occupancy: 60,
      pickFreq: 'Medium',
      sensorTemp: 23,
      sensorHumid: 52,
      items: [
        {
          skuId: 'SKU-884',
          name: 'Đường cát trắng Biên Hòa Co-op',
          qty: 60,
          maxQty: 100,
          expiryDays: 300,
        },
      ],
    },
    {
      id: 'A-R3-L4',
      zone: 'A',
      rack: 'Kệ 03',
      level: 'Tầng 4',
      occupancy: 10,
      pickFreq: 'Low',
      sensorTemp: 24,
      sensorHumid: 55,
      items: [
        {
          skuId: 'SKU-885',
          name: 'Syrup Đào Teisseire Pháp 700ml',
          qty: 10,
          maxQty: 100,
          expiryDays: 400,
        },
      ],
    },

    {
      id: 'A-R4-L1',
      zone: 'A',
      rack: 'Kệ 04',
      level: 'Tầng 1',
      occupancy: 60,
      pickFreq: 'Medium',
      sensorTemp: 24,
      sensorHumid: 55,
      items: [
        {
          skuId: 'SKU-881',
          name: 'Cà phê hạt Robusta Thượng Hạng',
          qty: 120,
          maxQty: 200,
          expiryDays: 110,
        },
      ],
    },
    {
      id: 'A-R4-L2',
      zone: 'A',
      rack: 'Kệ 04',
      level: 'Tầng 2',
      occupancy: 78,
      pickFreq: 'High',
      sensorTemp: 23,
      sensorHumid: 54,
      items: [
        {
          skuId: 'SKU-881',
          name: 'Cà phê hạt Robusta Thượng Hạng',
          qty: 156,
          maxQty: 200,
          expiryDays: 15,
        },
      ],
    },
    {
      id: 'A-R4-L3',
      zone: 'A',
      rack: 'Kệ 04',
      level: 'Tầng 3',
      occupancy: 35,
      pickFreq: 'Low',
      sensorTemp: 24,
      sensorHumid: 56,
      items: [
        {
          skuId: 'SKU-883',
          name: 'Trà ô long túi lọc Cozy',
          qty: 105,
          maxQty: 300,
          expiryDays: 200,
        },
      ],
    },
    {
      id: 'A-R4-L4',
      zone: 'A',
      rack: 'Kệ 04',
      level: 'Tầng 4',
      occupancy: 5,
      pickFreq: 'Low',
      sensorTemp: 25,
      sensorHumid: 57,
      items: [
        {
          skuId: 'SKU-884',
          name: 'Đường cát trắng Biên Hòa Co-op',
          qty: 40,
          maxQty: 800,
          expiryDays: 360,
        },
      ],
    },

    {
      id: 'B-R1-L1',
      zone: 'B',
      rack: 'Kệ 01',
      level: 'Tầng 1',
      occupancy: 90,
      pickFreq: 'Critical',
      sensorTemp: 25,
      sensorHumid: 58,
      items: [
        {
          skuId: 'SKU-884',
          name: 'Đường cát trắng Biên Hòa Co-op',
          qty: 720,
          maxQty: 800,
          expiryDays: 30,
        },
      ],
    },
    {
      id: 'B-R1-L2',
      zone: 'B',
      rack: 'Kệ 01',
      level: 'Tầng 2',
      occupancy: 40,
      pickFreq: 'Medium',
      sensorTemp: 24,
      sensorHumid: 57,
      items: [
        {
          skuId: 'SKU-881',
          name: 'Cà phê hạt Robusta Thượng Hạng',
          qty: 120,
          maxQty: 300,
          expiryDays: 90,
        },
      ],
    },
    {
      id: 'B-R1-L3',
      zone: 'B',
      rack: 'Kệ 01',
      level: 'Tầng 3',
      occupancy: 15,
      pickFreq: 'Low',
      sensorTemp: 24,
      sensorHumid: 56,
      items: [
        {
          skuId: 'SKU-885',
          name: 'Syrup Đào Teisseire Pháp 700ml',
          qty: 15,
          maxQty: 100,
          expiryDays: 120,
        },
      ],
    },
    {
      id: 'B-R1-L4',
      zone: 'B',
      rack: 'Kệ 01',
      level: 'Tầng 4',
      occupancy: 0,
      pickFreq: 'None',
      sensorTemp: 25,
      sensorHumid: 59,
      items: [],
    },

    {
      id: 'B-R2-L1',
      zone: 'B',
      rack: 'Kệ 02',
      level: 'Tầng 1',
      occupancy: 70,
      pickFreq: 'High',
      sensorTemp: 24,
      sensorHumid: 56,
      items: [
        {
          skuId: 'SKU-882',
          name: 'Sữa Đặc Ngôi Sao Phương Nam 1.2kg',
          qty: 84,
          maxQty: 120,
          expiryDays: 180,
        },
      ],
    },
    {
      id: 'B-R2-L2',
      zone: 'B',
      rack: 'Kệ 02',
      level: 'Tầng 2',
      occupancy: 60,
      pickFreq: 'Medium',
      sensorTemp: 23,
      sensorHumid: 55,
      items: [
        {
          skuId: 'SKU-882',
          name: 'Sữa Đặc Ngôi Sao Phương Nam 1.2kg',
          qty: 72,
          maxQty: 120,
          expiryDays: 200,
        },
      ],
    },
    {
      id: 'B-R2-L3',
      zone: 'B',
      rack: 'Kệ 02',
      level: 'Tầng 3',
      occupancy: 50,
      pickFreq: 'High',
      sensorTemp: 24,
      sensorHumid: 57,
      items: [
        {
          skuId: 'SKU-883',
          name: 'Trà ô long túi lọc Cozy',
          qty: 150,
          maxQty: 300,
          expiryDays: 60,
        },
      ],
    },
    {
      id: 'B-R2-L4',
      zone: 'B',
      rack: 'Kệ 02',
      level: 'Tầng 4',
      occupancy: 30,
      pickFreq: 'Low',
      sensorTemp: 25,
      sensorHumid: 58,
      items: [
        { skuId: 'SKU-883', name: 'Trà ô long túi lọc Cozy', qty: 90, maxQty: 300, expiryDays: 15 },
      ],
    },

    {
      id: 'C-R1-L1',
      zone: 'C',
      rack: 'Kệ 01',
      level: 'Tầng 1',
      occupancy: 85,
      pickFreq: 'High',
      sensorTemp: 20,
      sensorHumid: 48,
      items: [
        {
          skuId: 'SKU-881',
          name: 'Cà phê hạt Robusta Thượng Hạng',
          qty: 255,
          maxQty: 300,
          expiryDays: 150,
        },
      ],
    },
    {
      id: 'C-R1-L2',
      zone: 'C',
      rack: 'Kệ 01',
      level: 'Tầng 2',
      occupancy: 10,
      pickFreq: 'Low',
      sensorTemp: 21,
      sensorHumid: 49,
      items: [
        {
          skuId: 'SKU-885',
          name: 'Syrup Đào Teisseire Pháp 700ml',
          qty: 10,
          maxQty: 100,
          expiryDays: 300,
        },
      ],
    },
    {
      id: 'C-R1-L3',
      zone: 'C',
      rack: 'Kệ 01',
      level: 'Tầng 3',
      occupancy: 45,
      pickFreq: 'Medium',
      sensorTemp: 22,
      sensorHumid: 50,
      items: [
        {
          skuId: 'SKU-882',
          name: 'Sữa Đặc Ngôi Sao Phương Nam 1.2kg',
          qty: 54,
          maxQty: 120,
          expiryDays: 25,
        },
      ],
    },
    {
      id: 'C-R1-L4',
      zone: 'C',
      rack: 'Kệ 01',
      level: 'Tầng 4',
      occupancy: 95,
      pickFreq: 'Critical',
      sensorTemp: 22,
      sensorHumid: 50,
      items: [
        {
          skuId: 'SKU-884',
          name: 'Đường cát trắng Biên Hòa Co-op',
          qty: 760,
          maxQty: 800,
          expiryDays: 45,
        },
      ],
    },
  ]);

  const handleRelocate = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedShelf ||
      !relocateForm.skuId ||
      relocateForm.qty <= 0 ||
      !relocateForm.targetShelfId
    )
      return;

    const sourceShelf = shelves.find(s => s.id === selectedShelf.id);
    const targetShelf = shelves.find(s => s.id === relocateForm.targetShelfId);

    if (!sourceShelf || !targetShelf) return;

    const sourceItem = sourceShelf.items.find((i: any) => i.skuId === relocateForm.skuId);
    if (!sourceItem || sourceItem.qty < relocateForm.qty) {
      alert('Không đủ số lượng trong ô gốc!');
      return;
    }

    // Update shelves array
    const updatedShelves = shelves.map(shelf => {
      if (shelf.id === sourceShelf.id) {
        const remainingItems = shelf.items
          .map((i: any) => {
            if (i.skuId === relocateForm.skuId) {
              return { ...i, qty: i.qty - relocateForm.qty };
            }
            return i;
          })
          .filter((i: any) => i.qty > 0);

        const currentSum = remainingItems.reduce((acc: number, curr: any) => acc + curr.qty, 0);
        const maxLimit = remainingItems.length > 0 ? remainingItems[0].maxQty || 500 : 500;
        const newOccupancy = Math.min(100, Math.round((currentSum / maxLimit) * 100));

        return {
          ...shelf,
          items: remainingItems,
          occupancy: newOccupancy,
        };
      }

      if (shelf.id === targetShelf.id) {
        const existingItem = shelf.items.find((i: any) => i.skuId === relocateForm.skuId);
        let newItems = [];
        if (existingItem) {
          newItems = shelf.items.map((i: any) => {
            if (i.skuId === relocateForm.skuId) {
              return { ...i, qty: i.qty + relocateForm.qty };
            }
            return i;
          });
        } else {
          newItems = [...shelf.items, { ...sourceItem, qty: relocateForm.qty }];
        }

        const currentSum = newItems.reduce((acc: number, curr: any) => acc + curr.qty, 0);
        const maxLimit = newItems[0]?.maxQty || 500;
        const newOccupancy = Math.min(100, Math.round((currentSum / maxLimit) * 100));

        return {
          ...shelf,
          items: newItems,
          occupancy: newOccupancy,
        };
      }

      return shelf;
    });

    setShelves(updatedShelves);
    const updatedSelectedShelf = updatedShelves.find(s => s.id === selectedShelf.id);
    setSelectedShelf(updatedSelectedShelf || null);

    setRelocateSuccess(
      `Đã di dời ${relocateForm.qty} đơn vị của mã ${relocateForm.skuId} sang kệ ${relocateForm.targetShelfId} thành công!`
    );
    setRelocateForm({ skuId: '', qty: 0, targetShelfId: '' });

    setTimeout(() => {
      setRelocateSuccess('');
    }, 4000);
  };

  const handleAIOptimize = () => {
    setIsOptimizingLayout(true);
    setOptimizationSuccess(false);
    setTimeout(() => {
      setIsOptimizingLayout(false);
      setOptimizationSuccess(true);
      const optimizedShelves = shelves.map(s => {
        if (s.id === 'A-R1-L3') {
          return { ...s, occupancy: 12, pickFreq: 'Low' };
        }
        if (s.id === 'A-R1-L1') {
          return { ...s, occupancy: 53, pickFreq: 'High' };
        }
        return s;
      });
      setShelves(optimizedShelves);
      if (selectedShelf) {
        const updatedSelected = optimizedShelves.find(sh => sh.id === selectedShelf.id);
        setSelectedShelf(updatedSelected || null);
      }
      setTimeout(() => {
        setOptimizationSuccess(false);
      }, 5000);
    }, 1500);
  };

  useEffect(() => {
    if (!activeStore) return;
    let active = true;
    setLoading(true);
    
    const load = async () => {
      try {
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;
        
        const q = query(
          collection(db, 'warehouse_stock'),
          where('storeId', '==', activeStore.id),
          orderBy('id', 'asc'),
          range(from, to)
        );
        
        const snap = await getDocs(q);
        if (active) {
          const data = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
          setStockItems(data);
          setTotalCount(snap.count || 0);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading warehouse stock:', err);
        if (active) setLoading(false);
      }
    };
    
    load();
    return () => { active = false; };
  }, [activeStore, currentPage]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <div className="flex items-center gap-2 mb-1">
            {activeTab !== 'overview' && (
              <button
                onClick={() => setActiveTab('overview')}
                className="p-1 hover:bg-slate-100 rounded-md transition-colors mr-1"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
              </button>
            )}
            <h1 className="font-serif tracking-tight text-2xl font-bold text-[#111827]">
              Quản trị Kho vận
            </h1>
          </div>
          <p className="text-sm text-[#6B7280]">
            Quản lý nhập xuất kho, kiểm kê và vận hành Fulfillment.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
            <Filter className="w-4 h-4" /> Bản đồ kho
          </button>
          <button className="bg-[#2563EB] text-[#FAF9F5] px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tạo phiếu kho
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-6" columns={4} gap={24}>
            <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">
                  Giá trị tồn kho
                </span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-black text-[#111827]">
                  {formatCurrency(4850000000)}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                  +5.2%
                </span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">
                  Đơn Fulfillment
                </span>
                <Truck className="w-4 h-4 text-orange-700" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-black text-[#111827]">1,248</span>
                <span className="text-[10px] text-orange-700 font-bold bg-slate-100 px-2 py-0.5 rounded">
                  85 Đang giao
                </span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">
                  Hàng sắp hết (Alt)
                </span>
                <AlertCircle className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-black text-[#111827]">42 SKUs</span>
                <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded">
                  Cần nhập
                </span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">
                  Uptime Kho vận
                </span>
                <Clock className="w-4 h-4 text-primary-600" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-black text-[#111827]">99.8%</span>
                <span className="text-[10px] text-primary-600 font-bold bg-primary-50 px-2 py-0.5 rounded">
                  Realtime
                </span>
              </div>
            </div>
          </DraggableGrid>

          {/* Matrix Grid Layout */}
          <div className="space-y-6">
            {WAREHOUSE_MODULE_GROUPS.map((group, gIdx) => (
              <div key={gIdx} className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 px-1">
                  <span className="w-1 h-4 bg-[#2563EB] rounded-full inline-block" />
                  {group.title}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {group.items.map(mod => (
                    <div
                      key={mod.id}
                      onClick={() => setActiveTab(mod.id as any)}
                      className="group bg-white p-5 rounded-lg border border-slate-300 shadow-sm hover:shadow-sm hover:border-[#2563EB]/50 transition-all cursor-pointer flex flex-col gap-4 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <mod.icon className="w-24 h-24 transform -rotate-12 translate-x-4 -translate-y-4" />
                      </div>
                      <div
                        className={cn(
                          'w-12 h-12 rounded relative z-10 flex items-center justify-center  group-hover:bg-[#2563EB] group-hover:text-[#FAF9F5] transition-all shadow-sm',
                          getColorClasses(mod.color)
                        )}
                      >
                        <mod.icon className="w-6 h-6" />
                      </div>
                      <div className="relative z-10">
                        <h3 className="font-bold text-[#111827] text-sm mb-1.5 group-hover:text-[#2563EB] transition-colors">
                          {mod.label}
                        </h3>
                        <p className="text-[11px] text-[#6B7280] leading-relaxed line-clamp-2">
                          {mod.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'wh_partners' && (
        <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4">
          <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50 flex justify-between items-center">
            <button
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-700 transition-colors bg-white border border-slate-300 px-4 py-2 rounded-lg w-fit shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại Giao diện chung
            </button>
            <button className="bg-slate-900 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm shadow-slate-900/5">
              <Plus className="w-4 h-4" /> Thêm đơn vị vận chuyển
            </button>
          </div>

          {!selectedPartnerForFees && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <div className="relative w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm đơn vị vận chuyển..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-slate-900"
                  />
                </div>
                <button className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-300 px-4 py-2 rounded-lg">
                  <Filter className="w-4 h-4" /> Lọc
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {LOGISTICS_PARTNERS.map(partner => (
                  <div
                    key={partner.id}
                    className="bg-white border border-slate-300 rounded-lg p-6 hover:shadow-sm transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-slate-100 text-orange-700 rounded-lg flex items-center justify-center">
                        <Warehouse className="w-6 h-6" />
                      </div>
                      <button className="text-slate-500 hover:text-slate-700">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{partner.name}</h3>
                    <p className="text-xs text-slate-600 mb-4">
                      {partner.id} • {partner.coverage}
                    </p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-xs text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-500" /> {partner.contact}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-700">
                        <Mail className="w-3.5 h-3.5 text-slate-500" /> {partner.email}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-700">
                        <Globe className="w-3.5 h-3.5 text-slate-500" /> {partner.website}
                      </div>
                    </div>

                    <div className="bg-slate-100 border border-slate-300 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Percent className="w-3.5 h-3.5 text-orange-700" />
                        <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">
                          Chính sách chiết khấu
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed font-medium">
                        {partner.policy}
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200">
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider',
                          partner.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-orange-50 text-orange-600'
                        )}
                      >
                        {partner.status}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedPartnerForFees(partner.id)}
                          className="text-xs font-bold text-orange-700 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Receipt className="w-3.5 h-3.5" /> Biểu phí
                        </button>
                        <button className="text-xs font-bold text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors">
                          API
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedPartnerForFees && (
            <div className="p-6 animate-in fade-in slide-in- duration-300">
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => setSelectedPartnerForFees(null)}
                  className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Danh sách đối tác
                </button>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-slate-900">
                    Biểu phí dịch vụ:{' '}
                    {LOGISTICS_PARTNERS.find(p => p.id === selectedPartnerForFees)?.name}
                  </h3>
                  <span className="text-[10px] bg-[#EAE7DF] text-orange-800 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    {selectedPartnerForFees}
                  </span>
                </div>
                <button className="bg-slate-900 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm shadow-slate-900/5">
                  <Plus className="w-4 h-4" /> Thêm khoản phí mới
                </button>
              </div>

              <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto min-w-0">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-300">
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Tên khoản phí
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Loại phí
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Giá trị
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {LOGISTICS_FEES[selectedPartnerForFees]?.map(fee => (
                        <tr key={fee.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center group-hover:bg-slate-100 group-hover:text-orange-700 transition-colors">
                                <DollarSign className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-bold text-slate-900">{fee.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-medium text-slate-600">{fee.type}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-black text-orange-700">{fee.value}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {fee.status === 'Active' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-500" />
                              )}
                              <span
                                className={cn(
                                  'text-[10px] font-bold uppercase tracking-wider',
                                  fee.status === 'Active' ? 'text-emerald-600' : 'text-rose-600'
                                )}
                              >
                                {fee.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-slate-500 hover:text-orange-700 transition-colors">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(!LOGISTICS_FEES[selectedPartnerForFees] ||
                  LOGISTICS_FEES[selectedPartnerForFees].length === 0) && (
                  <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
                    <Receipt className="w-12 h-12 mb-4 text-slate-500" />
                    <p className="text-sm font-medium text-slate-600">
                      Chưa có dữ liệu biểu phí cho đối tác này
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'wh_ff_orders' && (
        <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4">
          <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50 flex justify-between items-center">
            <button
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-700 transition-colors bg-white border border-slate-300 px-4 py-2 rounded-lg w-fit shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại Giao diện chung
            </button>
            <div className="flex gap-3">
              <button className="bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold border border-slate-300">
                Xuất báo cáo
              </button>
              <button className="bg-slate-900 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm shadow-slate-900/5">
                <Plus className="w-4 h-4" /> Tạo đơn vận mới
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="flex gap-4 mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Mã vận đơn, mã đơn hàng, shipper..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-slate-900"
                />
              </div>
              <select className="bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-sm font-medium outline-none">
                <option>Tất cả trạng thái</option>
                <option>Đang giao</option>
                <option>Đã giao</option>
                <option>Chờ lấy hàng</option>
              </select>
            </div>

            <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto min-w-0">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-300 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Vận đơn</th>
                      <th className="px-6 py-4">Đối tác</th>
                      <th className="px-6 py-4">Tài xế/Shipper</th>
                      <th className="px-6 py-4">Dự kiến</th>
                      <th className="px-6 py-4 text-center">Trạng thái</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {MOCK_SHIPMENTS.map(ship => (
                      <tr key={ship.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">{ship.id}</span>
                            <span className="text-[10px] text-slate-600 font-medium">
                              {ship.orderId}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-sm text-slate-800">
                          {ship.partner}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-[#EAE7DF] rounded-full flex items-center justify-center text-[10px] font-bold text-orange-700">
                              {ship.driver.charAt(0)}
                            </div>
                            <span className="text-sm text-slate-700 font-medium">
                              {ship.driver}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">{ship.eta}</td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={cn(
                              'px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight',
                              ship.status === 'In Transit'
                                ? 'bg-slate-100 text-orange-700'
                                : ship.status === 'Delivered'
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-slate-100 text-slate-600'
                            )}
                          >
                            {ship.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 text-slate-500 hover:text-orange-700 transition-colors">
                            <Navigation className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-slate-500 hover:text-slate-700 transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'wh_ff_predict' && (
        <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4">
          <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50 flex justify-between items-center">
            <button
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-700 transition-colors bg-white border border-slate-300 px-4 py-2 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </button>
            <div className="flex items-center gap-2 text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full border border-primary-100 animate-pulse">
              <Sparkles className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                AI Demand Forecasting Live
              </span>
            </div>
          </div>

          <div className="p-6 space-y-8">
            <DraggableGrid className="grid grid-cols-1 lg:grid-cols-3 gap-6" columns={3} gap={24}>
              <div className="lg:col-span-2 bg-slate-900 rounded-xl p-6 text-[#FAF9F5] relative overflow-hidden h-[400px]">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-2">Dự báo Nhu cầu SKUs (Tháng 5/2026)</h3>
                  <p className="text-slate-500 text-sm mb-8">
                    Dựa trên dữ liệu lịch sử bán hàng và biến động thị trường.
                  </p>

                  <div className="flex items-end gap-3 h-48">
                    {[45, 65, 35, 85, 55, 95, 75, 45, 65, 80, 70, 90].map((val, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full bg-primary-500/30 border-t-2 border-primary-400 rounded-t-sm transition-all hover:bg-primary-400"
                          style={{ height: `${val}%` }}
                        />
                        <span className="text-[8px] text-slate-600 font-bold">W{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full -mr-32 -mt-32" />
              </div>

              <div className="space-y-6">
                <div className="bg-white border-2 border-primary-100 rounded-xl p-6 shadow-sm shadow-indigo-100/20">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
                    AI Recommendation
                  </h4>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-lg h-fit">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Nhập hàng gấp: SKU-552</p>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Dự kiến hết kho trong 3 ngày tới do chiến dịch Flash Sale 5/5.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg h-fit">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Giảm nhập: SKU-991</p>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Tốc độ tiêu thụ giảm 25% trong 2 tuần qua. Tránh tồn đọng vốn.
                        </p>
                      </div>
                    </div>
                  </div>
                  <button className="w-full mt-6 py-3 bg-primary-600 text-[#FAF9F5] rounded-xl text-xs font-black uppercase tracking-widest shadow-sm shadow-indigo-200">
                    Tạo đề xuất mua hàng tự động
                  </button>
                </div>

                <div className="bg-slate-50 border border-slate-300 rounded-xl p-6">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
                    Độ chính xác mô hình
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin flex items-center justify-center">
                      <span className="text-xs font-black text-slate-900 animate-none">94.2%</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Mô hình LSTM v4.2</p>
                      <p className="text-[10px] text-slate-600 font-medium">
                        Cập nhật: 04:52 AM Hôm nay
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </DraggableGrid>
          </div>
        </div>
      )}

      {activeTab === 'wh_ff_heatmap' && (
        <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4">
          {/* Header controls */}
          <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between md:items-center">
            <div className="flex items-center gap-4 text-left">
              <button
                onClick={() => {
                  setActiveTab('overview');
                  setSelectedShelf(null);
                }}
                className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-700 transition-colors bg-white border border-slate-300 px-4 py-2 rounded-lg shadow-sm font-sans"
              >
                <ArrowLeft className="w-4 h-4" /> Quay lại Giao diện chung
              </button>
              <div className="hidden sm:flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 text-[11px] font-bold font-sans">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                <span>AI Mapping Live</span>
              </div>
            </div>

            {/* Zone Selector */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {['A', 'B', 'C'].map((zoneId) => (
                <button
                  key={zoneId}
                  onClick={() => {
                    setSelectedZone(zoneId);
                    setSelectedShelf(null);
                  }}
                  className={cn(
                    'px-4 py-1.5 rounded-md text-xs font-bold transition-all font-sans',
                    selectedZone === zoneId
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  Khu {zoneId}{' '}
                  {zoneId === 'A'
                    ? '(Hàng khô)'
                    : zoneId === 'B'
                      ? '(Bao bì)'
                      : '(Đóng chai)'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Grid visualization */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 border border-slate-300 rounded-xl">
                {/* Metric Switcher */}
                <div className="space-y-1.5 text-left font-sans">
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest block">
                    Loại bản đồ nhiệt
                  </span>
                  <div className="flex gap-1.5 bg-white border border-slate-300 p-1 rounded-lg w-fit shadow-xs">
                    <button
                      onClick={() => setHeatmapMetric('utilization')}
                      className={cn(
                        'px-3 py-1.5 rounded text-xs font-semibold transition-all',
                        heatmapMetric === 'utilization'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      Mật độ chứa (%)
                    </button>
                    <button
                      onClick={() => setHeatmapMetric('pick_freq')}
                      className={cn(
                        'px-3 py-1.5 rounded text-xs font-semibold transition-all',
                        heatmapMetric === 'pick_freq'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      Tần suất Pick (Hot)
                    </button>
                    <button
                      onClick={() => setHeatmapMetric('expiry')}
                      className={cn(
                        'px-3 py-1.5 rounded text-xs font-semibold transition-all',
                        heatmapMetric === 'expiry'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      Cảnh báo Hạn
                    </button>
                  </div>
                </div>

                {/* Locator Search */}
                <div className="space-y-1.5 flex-1 max-w-sm text-left font-sans">
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest block">
                    Định vị SKU trên sơ đồ
                  </span>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={shelfSearchQuery}
                      onChange={(e) => setShelfSearchQuery(e.target.value)}
                      placeholder="Nhập tên SKU (VD: Cà phê, Sữa, Trà...)"
                      className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-slate-800 shadow-xs"
                    />
                    {shelfSearchQuery && (
                      <button
                        onClick={() => setShelfSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold font-sans"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick SKU Filters */}
              <div className="flex gap-2 items-center flex-wrap">
                <span className="text-[10px] font-bold text-[#6B7280] font-sans">
                  Khuyên dùng:
                </span>
                {['Robusta', 'Sữa Đặc', 'Trà ô long', 'Syrup', 'Đường'].map(
                  term => (
                    <button
                      key={term}
                      onClick={() => setShelfSearchQuery(term)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[10px] border transition-all animate-in fade-in duration-200 font-sans',
                        shelfSearchQuery.toLowerCase() === term.toLowerCase()
                          ? 'bg-amber-100 text-amber-800 border-amber-300 shadow-xs scale-105 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      {term}
                    </button>
                  )
                )}
              </div>

              {/* Sơ đồ kệ thực tế */}
              <div className="border border-slate-300 rounded-xl p-6 bg-slate-50/50 space-y-8">
                <div className="flex justify-between items-center text-xs text-[#6B7280] font-bold border-b pb-3 font-sans">
                  <span className="flex items-center gap-1.5">
                    <Warehouse className="w-4 h-4 text-slate-500" />
                    LƯỚI VỊ TRÍ ĐỊNH VỊ THỰC TẾ (PHÂN KHU {selectedZone})
                  </span>
                  <span>Lối đi vận chuyển hàng hóa</span>
                </div>

                {/* Renders each Rack Group */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                  {(() => {
                    const zoneShelves = shelves.filter(
                      s => s.zone === selectedZone
                    );
                    const rackNames = Array.from(
                      new Set(zoneShelves.map(s => s.rack))
                    ).sort();

                    if (rackNames.length === 0) {
                      return (
                        <div className="col-span-2 py-10 flex flex-col items-center justify-center opacity-55 text-center font-sans">
                          <AlertCircle className="w-10 h-10 mb-2 text-slate-400" />
                          <p className="text-xs font-semibold">
                            Chưa thiết lập sơ đồ kệ hàng cho Khu vực này.
                          </p>
                        </div>
                      );
                    }

                    return rackNames.map(rack => {
                      const rackShelves = zoneShelves.filter(
                        s => s.rack === rack
                      );
                      // Sort levels in descending order: level 4 down to level 1 for display
                      const levels = [...rackShelves].sort((a, b) =>
                        b.level.localeCompare(a.level)
                      );

                      return (
                        <div
                          key={rack}
                          className="bg-white p-4 border border-slate-300 rounded-xl shadow-sm space-y-3"
                        >
                          <div className="flex justify-between items-center border-b pb-2 font-sans">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <LayoutGrid className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
                              Dãy {rack} (Shelving Unit)
                            </span>
                            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              Khung cột chịu lực
                            </span>
                          </div>

                          <div className="flex flex-col gap-2">
                            {levels.map(shelf => {
                              const hasSearchedSku = shelfSearchQuery
                                ? shelf.items.some(
                                    (it: any) =>
                                      it.skuId
                                        .toLowerCase()
                                        .includes(
                                          shelfSearchQuery.toLowerCase()
                                        ) ||
                                      it.name
                                        .toLowerCase()
                                        .includes(
                                          shelfSearchQuery.toLowerCase()
                                        )
                                  )
                                : false;

                              const isSelected = selectedShelf?.id === shelf.id;

                              // Color classes based on metric
                              let cellColorClass =
                                'bg-white border-slate-300 text-slate-700';
                              let metricDisplay = '';

                              if (heatmapMetric === 'utilization') {
                                const occ = shelf.occupancy;
                                metricDisplay = `${occ}%`;
                                if (occ === 0) {
                                  cellColorClass =
                                    'bg-slate-50/50 border-dashed border-slate-200 text-slate-400';
                                } else if (occ < 30) {
                                  cellColorClass =
                                    'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200';
                                } else if (occ < 75) {
                                  cellColorClass =
                                    'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200';
                                } else if (occ < 90) {
                                  cellColorClass =
                                    'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200';
                                } else {
                                  cellColorClass =
                                    'bg-red-50 hover:bg-red-100 text-red-600 border-red-200 font-bold';
                                }
                              } else if (heatmapMetric === 'pick_freq') {
                                const freq = shelf.pickFreq;
                                metricDisplay = freq;
                                if (freq === 'None') {
                                  cellColorClass =
                                    'bg-slate-50 border-slate-200 text-slate-400';
                                } else if (freq === 'Low') {
                                  cellColorClass =
                                    'bg-blue-50 text-blue-800 border-blue-200';
                                } else if (freq === 'Medium') {
                                  cellColorClass =
                                    'bg-amber-50/60 text-amber-800 border-amber-200';
                                } else if (freq === 'High') {
                                  cellColorClass =
                                    'bg-orange-50 text-orange-800 border-orange-200';
                                } else {
                                  cellColorClass =
                                    'bg-rose-50 text-rose-800 border-rose-300 font-black';
                                }
                              } else if (heatmapMetric === 'expiry') {
                                const minExpiry =
                                  shelf.items.length > 0
                                    ? Math.min(
                                        ...shelf.items.map(
                                          (i: any) => i.expiryDays
                                        )
                                      )
                                    : 999;
                                metricDisplay =
                                  shelf.items.length > 0
                                    ? `${minExpiry} ngày`
                                    : 'Trống';
                                if (shelf.items.length === 0) {
                                  cellColorClass =
                                    'bg-slate-50 border-slate-200 text-slate-400';
                                } else if (minExpiry < 30) {
                                  cellColorClass =
                                    'bg-rose-50 text-rose-700 border-rose-300 font-bold';
                                } else if (minExpiry < 90) {
                                  cellColorClass =
                                    'bg-amber-50 text-amber-500 border-amber-200';
                                } else {
                                  cellColorClass =
                                    'bg-emerald-50 text-emerald-700 border-emerald-200';
                                }
                              }

                              return (
                                <div
                                  key={shelf.id}
                                  onClick={() => setSelectedShelf(shelf)}
                                  className={cn(
                                    'flex items-center justify-between p-3 rounded-lg border cursor-pointer select-none transition-all',
                                    cellColorClass,
                                    isSelected
                                      ? 'ring-2 ring-slate-950 ring-offset-1 border-transparent font-bold font-sans'
                                      : '',
                                    shelfSearchQuery && hasSearchedSku
                                      ? 'ring-2 ring-amber-400 scale-[1.01] shadow-md bg-amber-50/90 border-amber-400 font-bold text-amber-950 scale-102 transition'
                                      : '',
                                    shelfSearchQuery && !hasSearchedSku
                                      ? 'opacity-30 blur-[0.4px]'
                                      : ''
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <span
                                      className={cn(
                                        'font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs border text-slate-800 bg-white/90',
                                        shelfSearchQuery && hasSearchedSku
                                          ? 'bg-amber-100 text-amber-900'
                                          : ''
                                      )}
                                    >
                                      {shelf.id}
                                    </span>
                                    <div className="text-left">
                                      <p className="text-[9px] uppercase font-bold text-slate-500 tracking-tight leading-none mb-1 font-sans">
                                        {shelf.level}
                                      </p>
                                      <p className="text-xs truncate max-w-[130px] font-medium text-slate-800 font-sans">
                                        {shelf.items.length > 0
                                          ? shelf.items
                                              .map((i: any) => i.skuId)
                                              .join(', ')
                                          : 'Trống'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-white/80 border shadow-2xs font-mono">
                                      {metricDisplay}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Heatmap Legends */}
                <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-slate-200 text-xs text-left font-sans">
                  <div className="flex items-center gap-6 flex-wrap">
                    <span className="font-bold text-slate-500">
                      Ý nghĩa chỉ số:
                    </span>

                    {heatmapMetric === 'utilization' && (
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-slate-100 border border-slate-300 inline-block" />{' '}
                          Trống
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-blue-50 border border-blue-200 inline-block" />{' '}
                          &lt;30% (Thấp)
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-300 inline-block" />{' '}
                          30-75% (Tối ưu)
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-orange-100 border border-orange-300 inline-block" />{' '}
                          75-90% (Cao)
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-rose-200 border border-rose-300 inline-block animate-pulse" />{' '}
                          &gt;90% (Quá tải)
                        </span>
                      </div>
                    )}

                    {heatmapMetric === 'pick_freq' && (
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-blue-50 border border-blue-200 inline-block" />{' '}
                          Thấp (Cold)
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-amber-50 border border-amber-300 inline-block" />{' '}
                          Trung bình
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-orange-50 border border-orange-300 inline-block" />{' '}
                          Cao (Warm)
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-rose-200 border border-rose-300 inline-block animate-pulse" />{' '}
                          Khẩn cấp (Hot)
                        </span>
                      </div>
                    )}

                    {heatmapMetric === 'expiry' && (
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-rose-200 border border-rose-300 inline-block animate-pulse" />{' '}
                          &lt;30 Ngày (Nguy cơ)
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-300 inline-block" />{' '}
                          30-90 Ngày
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-300 inline-block" />{' '}
                          &gt;90 Ngày (An toàn)
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-[#6B7280]">
                    Cảm biến cảm nhiệt:{' '}
                    <span className="text-emerald-600 font-bold">
                      ● Active/Live
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Interaction Sidebar */}
            <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-xs flex flex-col justify-between min-h-[500px]">
              {selectedShelf ? (
                <div className="space-y-6 animate-in fade-in duration-300 text-left">
                  {/* Header Details */}
                  <div className="flex items-start justify-between border-b pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 font-sans">
                        <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                          Ô KỆ {selectedShelf.rack}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />{' '}
                          Cảm biến live
                        </span>
                      </div>
                      <h3 className="text-xl font-bold font-serif text-slate-900 flex items-center gap-2">
                        Vị trí: {selectedShelf.id}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedShelf(null)}
                      className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Sensor Telemetry widgets */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-left font-sans">
                      <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wide block">
                        Nhiệt độ cảm biến
                      </span>
                      <p className="text-lg font-black text-slate-800 mt-1 flex items-center gap-1.5">
                        <Timer
                          className="w-4 h-4 text-orange-600 animate-spin"
                          style={{ animationDuration: '8s' }}
                        />
                        {selectedShelf.sensorTemp}°C
                      </p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-left font-sans">
                      <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wide block">
                        Độ ẩm tương đối
                      </span>
                      <p className="text-lg font-black text-slate-800 mt-1 flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-blue-500" />
                        {selectedShelf.sensorHumid}% rH
                      </p>
                    </div>
                  </div>

                  {/* Occupancy Indicator in detail */}
                  <div className="space-y-2 font-sans">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#6B7280]">
                        Độ lấp đầy ô kệ (Capacity):
                      </span>
                      <span
                        className={cn(
                          'font-bold',
                          selectedShelf.occupancy > 90
                            ? 'text-rose-600 animate-pulse'
                            : selectedShelf.occupancy > 75
                              ? 'text-orange-600'
                              : 'text-emerald-600'
                        )}
                      >
                        {selectedShelf.occupancy}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          selectedShelf.occupancy > 90
                            ? 'bg-rose-500'
                            : selectedShelf.occupancy > 75
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                        )}
                        style={{ width: `${selectedShelf.occupancy}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 text-right leading-none">
                      Ước tính tải trọng còn trống:{' '}
                      {Math.max(0, 100 - selectedShelf.occupancy)}%
                    </p>
                  </div>

                  {/* Items in this shelf list */}
                  <div className="space-y-3 font-sans">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                      <Package className="w-4 h-4 text-orange-600" />
                      Hàng hóa thực tế ({selectedShelf.items.length})
                    </h4>

                    {selectedShelf.items.length === 0 ? (
                      <div className="py-8 bg-slate-50 border border-dashed rounded-lg flex flex-col items-center justify-center text-slate-400">
                        <Package className="w-8 h-8 mb-1 opacity-55 text-slate-300" />
                        <p className="text-xs">Ô kệ trống chưa sắp SKU</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        {selectedShelf.items.map((item: any) => (
                          <div
                            key={item.skuId}
                            className="p-3 bg-slate-50 border rounded-lg text-xs space-y-1 hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-extrabold text-slate-900 truncate">
                                {item.name}
                              </span>
                              <span className="font-mono text-[9px] bg-slate-200 text-slate-700 px-1 py-0.5 rounded-sm shrink-0">
                                {item.skuId}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[#6B7280]">
                              <span>
                                Số lượng lưu:{' '}
                                <strong className="text-orange-700 font-extrabold">
                                  {item.qty || item.currentStock}
                                </strong>
                              </span>
                              <span
                                className={cn(
                                  'px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase',
                                  item.expiryDays < 30
                                    ? 'bg-rose-100 text-rose-700 font-extrabold animate-pulse'
                                    : item.expiryDays < 90
                                      ? 'bg-amber-100 text-[#D97706]'
                                      : 'bg-emerald-100 text-emerald-800'
                                )}
                              >
                                HSD: {item.expiryDays} ngày
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Button: Barcode labels printing */}
                  <div className="pt-2 font-sans">
                    <button
                      onClick={() => {
                        setShowPrintLabelSuccess(true);
                        setTimeout(() => setShowPrintLabelSuccess(false), 3000);
                      }}
                      className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 hover:text-slate-900 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition animate-in zoom-in-95 duration-200"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                      In QR Code định vị lô kệ {selectedShelf.id}
                    </button>
                    {showPrintLabelSuccess && (
                      <div className="mt-2 text-center text-[11px] text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-in slide-in-from-bottom-2 duration-200">
                        ✓ Đã tạo mã vạch vị trí {selectedShelf.id} và in thành công!
                      </div>
                    )}
                  </div>

                  {/* Action: Sắp xếp / di chuyển vị trí thủ công */}
                  {selectedShelf.items.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 space-y-3 font-sans">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1">
                        <ListTodo className="w-3.5 h-3.5 text-blue-600" />
                        Điều chuyển vị trí (Relocate)
                      </h4>
                      <form
                        onSubmit={handleRelocate}
                        className="space-y-3 bg-[#FCFBF8] p-3 border rounded-xl"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1 text-left">
                            <label className="text-[9px] font-semibold text-[#6B7280] uppercase tracking-wide block">
                              Hàng dời
                            </label>
                            <select
                              value={relocateForm.skuId}
                              onChange={e =>
                                setRelocateForm({
                                  ...relocateForm,
                                  skuId: e.target.value,
                                })
                              }
                              className="w-full text-xs p-1.5 bg-white border rounded outline-none focus:border-slate-800"
                              required
                            >
                              <option value="">-- Chọn SKU --</option>
                              {selectedShelf.items.map((it: any) => (
                                <option key={it.skuId} value={it.skuId}>
                                  {it.name} ({it.qty})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1 text-left">
                            <label className="text-[9px] font-semibold text-[#6B7280] uppercase tracking-wide block">
                              Số lượng
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={
                                selectedShelf.items.find(
                                  (i: any) => i.skuId === relocateForm.skuId
                                )?.qty || 500
                              }
                              value={relocateForm.qty || ''}
                              onChange={e =>
                                setRelocateForm({
                                  ...relocateForm,
                                  qty: parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-full text-xs p-1.5 bg-white border rounded outline-none focus:border-slate-800"
                              placeholder="SL..."
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-[9px] font-semibold text-[#6B7280] uppercase tracking-wide block">
                            Kệ nhận đích
                          </label>
                          <select
                            value={relocateForm.targetShelfId}
                            onChange={e =>
                              setRelocateForm({
                                ...relocateForm,
                                targetShelfId: e.target.value,
                              })
                            }
                            className="w-full text-xs p-1.5 bg-white border rounded outline-none focus:border-slate-800"
                            required
                          >
                            <option value="">-- Chọn vị trí rỗng --</option>
                            {shelves
                              .filter(
                                s => s.id !== selectedShelf.id && s.occupancy < 95
                              )
                              .map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.id} - Phân khu {s.zone} (Lấp đầy:{' '}
                                  {s.occupancy}%)
                                </option>
                              ))}
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-slate-900 text-white font-bold py-2 rounded-lg text-xs hover:bg-slate-800 transition"
                        >
                          Bàn giao điều phối vị trí
                        </button>
                      </form>
                      {relocateSuccess && (
                        <div className="text-[10px] text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 leading-relaxed font-semibold">
                          {relocateSuccess}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                // Sidebar welcome & overview details
                <div className="space-y-6 text-center py-6 animate-in fade-in duration-300">
                  <div className="w-16 h-16 bg-orange-50 border border-orange-100 rounded-full flex items-center justify-center mx-auto text-orange-600 mb-2">
                    <Warehouse className="w-8 h-8" />
                  </div>
                  <div className="space-y-2 text-center font-sans">
                    <h3 className="text-base font-bold text-slate-900">
                      Chi tiết Phân khu kệ hàng
                    </h3>
                    <p className="text-xs text-[#6B7280] leading-relaxed max-w-sm mx-auto">
                      Khảo sát sơ đồ lưới để tối ưu. Hãy chọn bất kỳ ô kệ hàng
                      cụ thể nào để theo dõi chi tiết nhiệt độ, độ ẩm vật lý
                      cảm biến dòng hạt, in dán barcode định hóa lô hoặc di dời
                      vị trị SKU.
                    </p>
                  </div>

                  {/* Mini statistic items */}
                  <div className="bg-slate-50 border rounded-xl p-4 text-left divide-y divide-slate-200 shadow-2xs font-sans">
                    <div className="py-2.5 flex justify-between items-center text-xs">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />{' '}
                        Ô quá tải cần hạ tải (&gt;90%):
                      </span>
                      <span className="font-mono text-xs font-black text-rose-600">
                        {shelves.filter(s => s.occupancy >= 90).length} ô kệ
                      </span>
                    </div>
                    <div className="py-2.5 flex justify-between items-center text-xs">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />{' '}
                        Ô sắp hết hàng cần refill (&lt;15%):
                      </span>
                      <span className="font-mono text-xs font-black text-amber-600">
                        {
                          shelves.filter(
                            s => s.occupancy > 0 && s.occupancy <= 15
                          ).length
                        }{' '}
                        ô kệ
                      </span>
                    </div>
                    <div className="py-2.5 flex justify-between items-center text-xs">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />{' '}
                        Ô trống rỗng khả dụng:
                      </span>
                      <span className="font-mono text-xs font-black text-emerald-600">
                        {shelves.filter(s => s.occupancy === 0).length} ô trống
                      </span>
                    </div>
                  </div>

                  {/* Quick AI Space optimizer banner */}
                  <div className="bg-gradient-to-br from-[#EEF2FF] to-indigo-100/50 border border-indigo-200 rounded-xl p-4 text-left space-y-3 shadow-xs">
                    <div className="flex items-center gap-2 font-sans">
                      <div className="p-1.5 bg-indigo-100 rounded text-indigo-700 h-fit">
                        <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-950">
                          Tính toán Bố cục AI đề xuất
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          Tối ưu hóa không gian rảnh
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed font-semibold font-sans">
                      Thuật toán đề xuất dời các sản phẩm có tốc độ xoay vòng cao
                      (VD: <strong>Cà phê Robusta</strong>) xuống Tầng 2-3 và xếp
                      các sản phẩm ít luân chuyển hơn (
                      <strong>Syrup Đào Pháp</strong>) lên Tầng cao nhất để giảm
                      18% thời gian chất dỡ cho người nhặt hàng.
                    </p>
                    <button
                      onClick={handleAIOptimize}
                      disabled={isOptimizingLayout}
                      className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-indigo-300 text-[#FAF9F5] font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs transition font-sans"
                    >
                      {isOptimizingLayout ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                          AI sắp xếp lại các dãy kệ...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Áp dụng sơ đồ tối ưu hóa AI
                        </>
                      )}
                    </button>
                    {optimizationSuccess && (
                      <div className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md p-2 font-bold animate-fade-in text-center leading-relaxed font-sans">
                        ✓ Hoàn tất! Hệ thống đã tự động di dời 3 vị trí quá tải giúp
                        hiệu suất xếp hàng thêm 15%.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick instructions in card bottom */}
              <div className="text-[10px] text-slate-400 border-t pt-3 flex items-center gap-1 text-center justify-center font-sans font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block animate-pulse" />
                Vận hành liên tục cùng hệ thống tự động hóa QuickPrint.
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'wh_ff_tracking' && (
        <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4">
          <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50">
            <button
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-700"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </button>
          </div>
          <div className="flex-1 flex">
            <div className="w-80 border-r border-slate-200 p-6 space-y-4 overflow-y-auto">
              <h3 className="font-bold text-slate-900 border-b pb-4 mb-4">Đơn đang giao (2)</h3>
              {MOCK_SHIPMENTS.filter(s => s.status === 'In Transit').map(s => (
                <div
                  key={s.id}
                  className="p-4 bg-slate-50 rounded-lg border border-orange-200 cursor-pointer hover:bg-white transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-orange-700">{s.id}</span>
                    <span className="text-[10px] font-bold text-slate-500">Đang chạy</span>
                  </div>
                  <p className="text-xs text-slate-700 mb-2">{s.driver}</p>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
                    <Clock className="w-3 h-3" /> Cập nhật: 2 phút trước
                  </div>
                </div>
              ))}
            </div>
            <div className="flex-1 bg-slate-100 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center opacity-40">
                  <Navigation className="w-16 h-16 mx-auto mb-4" />
                  <p className="font-bold">BẢN ĐỒ LỘ TRÌNH REAL-TIME</p>
                  <p className="text-xs">Đang tải dữ liệu vệ tinh GPS...</p>
                </div>
              </div>
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-4 rounded-lg shadow-sm space-y-3 w-48">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b pb-2">
                  <span>Tổng số xe</span>
                  <span className="text-orange-700">12</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                  <span>Đang giao hàng</span>
                  <span className="text-emerald-500">8</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                  <span>Dừng nghỉ</span>
                  <span className="text-orange-500">4</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'wh_ff_optimize' && (
        <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4 p-6 items-center justify-center text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-lg flex items-center justify-center mb-6 animate-bounce">
            <MapPin className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Tối ưu Tuyến đường Giao hàng</h2>
          <p className="text-slate-600 max-w-lg mx-auto leading-relaxed mb-8">
            Sử dụng thuật toán AI để sắp xếp thứ tự các điểm giao hàng, giảm 20% quãng đường di
            chuyển và tối ưu hóa thời gian nhận hàng của khách hàng.
          </p>
          <div className="flex gap-4">
            <button className="bg-emerald-600 text-[#FAF9F5] px-6 py-3 rounded-lg font-bold shadow-sm shadow-emerald-600/20">
              Chạy Optimization ngay
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className="bg-slate-100 text-slate-700 px-6 py-3 rounded-lg font-bold"
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      )}

      {activeTab === 'wh_stock' && (
        <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4">
          <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('overview')}
                className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-300 transition-all shadow-sm group"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:text-orange-700" />
              </button>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-none mb-1">
                  Tồn kho nguyên vật liệu
                </h3>
                <p className="text-[10px] text-slate-600 font-medium">
                  Kho: <span className="text-orange-700 uppercase">{activeStore?.name}</span>
                </p>
              </div>
            </div>
            <button className="bg-slate-900 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm shadow-slate-900/5">
              <Plus className="w-4 h-4" /> Nhập tồn đầu kỳ
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {stockItems.slice(0, 3).map(item => (
                <div
                  key={item.id}
                  className="bg-slate-50 border border-slate-300 p-4 rounded-xl flex items-center gap-4"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Package
                      className={cn(
                        'w-5 h-5',
                        item.quantity < 20 ? 'text-rose-500' : 'text-orange-600'
                      )}
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                      {item.materialId}
                    </p>
                    <p className="text-lg font-black text-slate-900">{item.quantity.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto min-w-0">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-300">
                    <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <th className="px-6 py-4">Mã Nguyên liệu</th>
                      <th className="px-6 py-4 text-center">Tồn kho thực tế</th>
                      <th className="px-6 py-4 text-center">Đơn vị</th>
                      <th className="px-6 py-4">Cập nhật lần cuối</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stockItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-slate-900">
                              {item.materialId}
                            </span>
                            {item.quantity < 20 && (
                              <span className="text-[8px] bg-rose-50 text-rose-600 font-black px-1.5 py-0.5 rounded uppercase">
                                Sắp hết
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={cn(
                              'text-sm font-black',
                              item.quantity < 20 ? 'text-rose-600' : 'text-slate-900 text-lg'
                            )}
                          >
                            {item.quantity.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-xs font-bold text-slate-600">
                          {item.materialId.includes('MAT-001')
                            ? 'KG'
                            : item.materialId.includes('MAT-004')
                              ? 'BOX'
                              : 'LIT'}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-600">
                          {item.updatedAt?.toDate().toLocaleString('vi-VN') || 'Vừa cập nhật'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-orange-700 text-xs font-bold hover:underline">
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Phân trang Server-side */}
              <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans shrink-0">
                <div className="text-xs text-slate-500 font-bold uppercase">
                  Hiển thị {totalCount ? ((currentPage - 1) * pageSize) + 1 : 0} - {Math.min(currentPage * pageSize, totalCount)} trong số {totalCount} mặt hàng
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1 || loading}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="px-4 py-2 border border-slate-300 bg-white rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Trang trước
                  </button>
                  <span className="px-4 py-2 text-xs font-bold text-slate-900 self-center">
                    Trang {currentPage} / {Math.ceil(totalCount / pageSize) || 1}
                  </span>
                  <button
                    disabled={currentPage >= Math.ceil(totalCount / pageSize) || loading}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="px-4 py-2 border border-slate-300 bg-white rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Trang sau
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab !== 'overview' &&
        activeTab !== 'wh_partners' &&
        !activeTab.startsWith('wh_ff_') &&
        activeTab !== 'wh_stock' && (
          <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4">
            <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50">
              <button
                onClick={() => setActiveTab('overview')}
                className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-700 transition-colors bg-white border border-slate-300 px-4 py-2 rounded-lg w-fit shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Quay lại Giao diện chung
              </button>
            </div>

            <div className="p-6 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <Warehouse className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Phân hệ: {activeTab}</h3>
              <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
                Tính năng này đang trong quá trình phát triển chi tiết cho phân hệ Kho vận.
              </p>
            </div>
          </div>
        )}
    </div>
  );
}
