import React, { useState, useEffect, useRef } from 'react';
import { 
  Boxes, 
  Search, 
  Filter, 
  Plus, 
  QrCode, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Printer, 
  Calendar, 
  ArrowRightLeft, 
  Wrench, 
  TrendingDown, 
  FileSpreadsheet, 
  Building2, 
  User, 
  DollarSign, 
  Trash2, 
  Clock, 
  Eye, 
  X, 
  Check, 
  Scan,
  ShieldCheck,
  Smartphone,
  Laptop,
  Layers,
  ChevronRight,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ClipboardCheck,
  History,
  Phone,
  ArrowDownToLine,
  ExternalLink,
  Key,
  Mail,
  Globe,
  Code2,
  Copy,
  Lock
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { safeLocalStorage } from '../lib/storage';
import { Html5Qrcode } from 'html5-qrcode';
import { hrmEmployeeService, HrmEmployee } from '../services/hrmEmployeeService';

export type AssetClassification = 'TANGIBLE' | 'INTANGIBLE';

export type AssetCategory = 
  // Tài sản Hữu hình
  | 'POS_TERMINAL' 
  | 'LABEL_PRINTER' 
  | 'BARCODE_PDA' 
  | 'IT_EQUIPMENT' 
  | 'OFFICE_FURNITURE' 
  | 'WAREHOUSE_TOOL'
  // Tài sản Vô hình (Bản quyền, Phần mềm, Email...)
  | 'OS_LICENSE'      // Bản quyền Hệ điều hành (Windows 11 Pro, Windows Server CAL...)
  | 'SOFTWARE_SAAS'   // Phần mềm bản quyền & Thuê bao SaaS (M365, Adobe CC, Figma, ERP Core...)
  | 'EMAIL_DOMAIN'    // Email công vụ & Tên miền (Google Workspace, Exchange, Domain .vn, SSL...)
  | 'IP_TRADEMARK';   // Nhãn hiệu & Sở hữu trí tuệ, Bản quyền số

export interface EnterpriseAsset {
  id: string;
  assetCode: string;
  name: string;
  assetType: AssetClassification; // TANGIBLE (Hữu hình) | INTANGIBLE (Vô hình)
  category: AssetCategory;
  serialNumber: string; // Serial thiết bị hoặc License / Registration ID
  originalPrice: number;
  purchaseDate: string;
  depreciationMonths: number; // Thông tư 45/2013/TT-BTC
  usedMonths: number;
  currentLocation: string; // Vị trí kho/chi nhánh hoặc Môi trường Cloud / Máy chủ
  assignedTo?: string;
  assignedToEmployeeId?: string;
  assignedDepartment?: string;
  status: 'IN_USE' | 'IN_STOCK' | 'MAINTENANCE' | 'LIQUIDATED';
  lastAuditedDate?: string;
  notes?: string;

  // Thuộc tính chuyên biệt cho Tài Sản Vô Hình (Software / License / Email / Domain)
  licenseType?: 'SUBSCRIPTION' | 'PERPETUAL' | 'OEM' | 'VOLUME_LICENSE';
  licenseKey?: string; // Mã kích hoạt / Product Key
  expiryDate?: string; // Ngày hết hạn bản quyền / Ngày gia hạn thuê bao
  seatsCount?: number; // Số lượng người dùng / Seats được cấp phép
  assignedEmail?: string; // Tài khoản email công vụ được gán
  vendorOrProvider?: string; // Nhà phát hành: Microsoft, Google, Adobe, JetBrains, VNNIC...
  contractNumber?: string; // Số hợp đồng mua bản quyền
}

export interface HandoverDocument {
  id: string;
  docNumber: string;
  type: 'HANDOVER' | 'RETURN';
  date: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  serialNumber: string;
  originalPrice: number;
  employeeId: string;
  employeeName: string;
  employeeDepartment: string;
  employeePosition: string;
  employeePhone?: string;
  location: string;
  condition: string;
  accessories: string;
  reason?: string;
  delivererName: string;
  delivererPosition: string;
  status: 'CONFIRMED';
}

export interface AuditBatchItem {
  assetId: string;
  assetCode: string;
  assetName: string;
  category: string;
  bookQty: number;
  actualQty: number;
  condition: 'GOOD' | 'NEEDS_REPAIR' | 'DAMAGED' | 'MISSING';
  scannedAt?: string;
  notes?: string;
}

export interface AuditBatch {
  id: string;
  batchCode: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  leadAuditorId: string;
  leadAuditorName: string;
  leadAuditorTitle: string;
  members: string[];
  status: 'IN_PROGRESS' | 'COMPLETED';
  totalAssets: number;
  scannedCount: number;
  discrepancyCount: number;
  notes?: string;
  items: AuditBatchItem[];
}

export interface MaintenanceTicket {
  id: string;
  ticketCode: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  serialNumber: string;
  reporterEmployeeId: string;
  reporterName: string;
  reporterDepartment: string;
  reportedDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  issueDescription: string;
  repairUnit: 'INTERNAL_IT' | 'EXTERNAL_VENDOR';
  vendorName?: string;
  estimatedCost: number;
  actualCost?: number;
  status: 'PENDING' | 'IN_REPAIR' | 'COMPLETED' | 'CANCELLED';
  expectedCompletionDate: string;
  completedDate?: string;
  repairNotes?: string;
}

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string; type: AssetClassification }> = {
  // Tài sản Hữu hình
  POS_TERMINAL: { label: 'Máy POS Bán Lẻ', icon: Smartphone, color: 'text-blue-600 bg-blue-50 border-blue-200', type: 'TANGIBLE' },
  LABEL_PRINTER: { label: 'Máy In Tem / Bill', icon: Printer, color: 'text-amber-600 bg-amber-50 border-amber-200', type: 'TANGIBLE' },
  BARCODE_PDA: { label: 'Máy Kiểm Kho PDA', icon: Scan, color: 'text-purple-600 bg-purple-50 border-purple-200', type: 'TANGIBLE' },
  IT_EQUIPMENT: { label: 'Laptop & PC Kỹ Thuật', icon: Laptop, color: 'text-indigo-600 bg-indigo-50 border-indigo-200', type: 'TANGIBLE' },
  WAREHOUSE_TOOL: { label: 'Thiết Bị Kho & Xe Nâng', icon: Boxes, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', type: 'TANGIBLE' },
  OFFICE_FURNITURE: { label: 'Công Cụ Dụng Cụ Khác', icon: Layers, color: 'text-slate-600 bg-slate-50 border-slate-200', type: 'TANGIBLE' },
  
  // Tài sản Vô hình (Bản quyền, Phần mềm, Email...)
  OS_LICENSE: { label: 'Bản Quyền Windows / HĐH', icon: Key, color: 'text-sky-600 bg-sky-50 border-sky-200', type: 'INTANGIBLE' },
  SOFTWARE_SAAS: { label: 'Phần Mềm & SaaS Bản Quyền', icon: Code2, color: 'text-violet-600 bg-violet-50 border-violet-200', type: 'INTANGIBLE' },
  EMAIL_DOMAIN: { label: 'Email Công Vụ & Tên Miền', icon: Mail, color: 'text-rose-600 bg-rose-50 border-rose-200', type: 'INTANGIBLE' },
  IP_TRADEMARK: { label: 'Nhãn Hiệu & Sở Hữu Trí Tuệ', icon: ShieldCheck, color: 'text-teal-600 bg-teal-50 border-teal-200', type: 'INTANGIBLE' }
};

const INITIAL_ASSETS: EnterpriseAsset[] = [
  // --- TÀI SẢN HỮU HÌNH ---
  {
    id: 'ASSET-001',
    assetCode: 'TS-POS-001',
    name: 'Máy POS Cảm ứng Sunmi D2s Plus (iPOS)',
    assetType: 'TANGIBLE',
    category: 'POS_TERMINAL',
    serialNumber: 'SN-SUNMI-988123',
    originalPrice: 12500000,
    purchaseDate: '2025-06-15',
    depreciationMonths: 36,
    usedMonths: 15,
    currentLocation: 'VComm Retail - Chi nhánh Q1, TP.HCM',
    assignedTo: 'Nguyễn Văn An',
    assignedToEmployeeId: 'EMP-001',
    assignedDepartment: 'Khối Bán Lẻ Store Retail',
    status: 'IN_USE',
    lastAuditedDate: '2026-03-01',
    notes: 'Kèm két tiền thu ngân tự động & đầu đọc thẻ chip'
  },
  {
    id: 'ASSET-002',
    assetCode: 'TS-PRN-001',
    name: 'Máy in vận đơn nhiệt HPRT N41 (Khổ A6/K80)',
    assetType: 'TANGIBLE',
    category: 'LABEL_PRINTER',
    serialNumber: 'SN-HPRT-443210',
    originalPrice: 2800000,
    purchaseDate: '2025-08-10',
    depreciationMonths: 24,
    usedMonths: 13,
    currentLocation: 'Kho tổng VComm FBL - Cầu Giấy, Hà Nội',
    assignedTo: 'Lê Hoàng Minh',
    assignedToEmployeeId: 'EMP-003',
    assignedDepartment: 'Kho Vận Multi-WMS',
    status: 'IN_USE',
    lastAuditedDate: '2026-03-10',
    notes: 'Chuyên in mã vận đơn sàn VComm tốc độ 127mm/s'
  },
  {
    id: 'ASSET-003',
    assetCode: 'TS-PDA-001',
    name: 'Máy quét mã vạch kiểm kho Zebra TC21 Android',
    assetType: 'TANGIBLE',
    category: 'BARCODE_PDA',
    serialNumber: 'SN-ZEBRA-887124',
    originalPrice: 14500000,
    purchaseDate: '2025-01-20',
    depreciationMonths: 36,
    usedMonths: 20,
    currentLocation: 'Kho tổng VComm FBL - Cầu Giấy, Hà Nội',
    assignedTo: 'Phạm Thị Thảo',
    assignedToEmployeeId: 'EMP-004',
    assignedDepartment: 'Kho Vận Multi-WMS',
    status: 'IN_USE',
    lastAuditedDate: '2026-03-12',
    notes: 'Chống sốc tiêu chuẩn quân đội, quét 1D/2D'
  },
  {
    id: 'ASSET-004',
    assetCode: 'TS-IT-001',
    name: 'Laptop Dell Latitude 5440 i7 32GB RAM',
    assetType: 'TANGIBLE',
    category: 'IT_EQUIPMENT',
    serialNumber: 'SN-DELL-552199',
    originalPrice: 28500000,
    purchaseDate: '2025-03-05',
    depreciationMonths: 36,
    usedMonths: 18,
    currentLocation: 'Trụ sở VComm Tầng 12 - Tòa Keangnam',
    assignedTo: 'Hoàng Văn Thắng',
    assignedToEmployeeId: 'EMP-005',
    assignedDepartment: 'Phòng Công Nghệ & ERP Core',
    status: 'IN_USE',
    lastAuditedDate: '2026-02-28',
    notes: 'Cài đặt sẵn VPN nội bộ và chứng thư số'
  },
  {
    id: 'ASSET-005',
    assetCode: 'TS-POS-002',
    name: 'Máy POS cầm tay V2s Plus 4G di động',
    assetType: 'TANGIBLE',
    category: 'POS_TERMINAL',
    serialNumber: 'SN-SUNMI-441209',
    originalPrice: 5800000,
    purchaseDate: '2026-01-10',
    depreciationMonths: 24,
    usedMonths: 2,
    currentLocation: 'Kho tổng VComm FBL',
    assignedTo: undefined,
    assignedDepartment: 'Kho Dự Phòng',
    status: 'IN_STOCK',
    notes: 'Máy mới 100% trong kho, sẵn sàng cấp phát thay thế'
  },
  {
    id: 'ASSET-006',
    assetCode: 'TS-PRN-002',
    name: 'Máy in hóa đơn LAN Bixolon SRP-330II (K80)',
    assetType: 'TANGIBLE',
    category: 'LABEL_PRINTER',
    serialNumber: 'SN-BIXO-119283',
    originalPrice: 3200000,
    purchaseDate: '2024-11-15',
    depreciationMonths: 24,
    usedMonths: 22,
    currentLocation: 'Trung tâm Bảo hành Kỹ thuật',
    assignedTo: 'Đang bảo dưỡng',
    assignedDepartment: 'Phòng Kỹ Thuật',
    status: 'MAINTENANCE',
    notes: 'Báo lỗi kẹt dao cắt giấy tự động và mòn trục lăn'
  },

  // --- TÀI SẢN VÔ HÌNH (BẢN QUYỀN WINDOWS, PHẦN MỀM, EMAIL, DOMAIN) ---
  {
    id: 'ASSET-WIN-001',
    assetCode: 'TS-WIN-001',
    name: 'Bản Quyền Windows 11 Pro 64-bit FPP / OEM Doanh Nghiệp',
    assetType: 'INTANGIBLE',
    category: 'OS_LICENSE',
    serialNumber: 'LIC-WIN11-PRO-88902',
    originalPrice: 4200000,
    purchaseDate: '2025-03-05',
    depreciationMonths: 36,
    usedMonths: 18,
    currentLocation: 'Máy trạm Kỹ thuật Keangnam (Kèm TS-IT-001)',
    assignedTo: 'Hoàng Văn Thắng',
    assignedToEmployeeId: 'EMP-005',
    assignedDepartment: 'Phòng Công Nghệ & ERP Core',
    status: 'IN_USE',
    lastAuditedDate: '2026-03-01',
    notes: 'Giấy phép bản quyền chính hãng Microsoft có chứng nhận COA',
    licenseType: 'PERPETUAL',
    licenseKey: 'VK7JG-NPHTM-C97JM-9MPGT-3V66T',
    expiryDate: '2099-12-31',
    seatsCount: 1,
    assignedEmail: 'thang.hoang@vcomm.vn',
    vendorOrProvider: 'Microsoft Corporation',
    contractNumber: 'HD-MS-2025-03'
  },
  {
    id: 'ASSET-SFT-001',
    assetCode: 'TS-SFT-001',
    name: 'Gói Bản Quyền Microsoft 365 E3 Business Enterprise (100 Seats)',
    assetType: 'INTANGIBLE',
    category: 'SOFTWARE_SAAS',
    serialNumber: 'LIC-M365-E3-100U',
    originalPrice: 96000000,
    purchaseDate: '2026-01-01',
    depreciationMonths: 12,
    usedMonths: 3,
    currentLocation: 'Hạ tầng Cloud Microsoft Azure / M365 Tenant',
    assignedTo: 'Toàn thể Cán bộ Nhân viên',
    assignedDepartment: 'Toàn Tập Đoàn VComm',
    status: 'IN_USE',
    lastAuditedDate: '2026-03-15',
    notes: 'Bao gồm bản quyền bộ Office, OneDrive 1TB, Teams Enterprise và bảo mật Intune',
    licenseType: 'SUBSCRIPTION',
    licenseKey: 'M365-ENT-TENANT-VCOMM-98871',
    expiryDate: '2026-12-31',
    seatsCount: 100,
    assignedEmail: 'admin@vcomm.vn',
    vendorOrProvider: 'Microsoft Vietnam / FPT Cloud',
    contractNumber: 'HD-M365-2026-01'
  },
  {
    id: 'ASSET-SFT-002',
    assetCode: 'TS-SFT-002',
    name: 'Gói Phần Mềm Đồ Họa Adobe Creative Cloud All Apps (5 Seats)',
    assetType: 'INTANGIBLE',
    category: 'SOFTWARE_SAAS',
    serialNumber: 'LIC-ADOBE-CC-5U',
    originalPrice: 48000000,
    purchaseDate: '2025-09-10',
    depreciationMonths: 12,
    usedMonths: 6,
    currentLocation: 'Đám mây Adobe Creative Cloud Team',
    assignedTo: 'Nguyễn Thị Kim Anh',
    assignedToEmployeeId: 'EMP-2061',
    assignedDepartment: 'Phòng Marketing & Thương Hiệu',
    status: 'IN_USE',
    lastAuditedDate: '2026-03-05',
    notes: 'Bản quyền Photoshop, Illustrator, Premiere Pro phục vụ Live Commerce và Thiết kế Banner sàn',
    licenseType: 'SUBSCRIPTION',
    licenseKey: 'ADOBE-VIP-VCOMM-66521-CC',
    expiryDate: '2026-09-10',
    seatsCount: 5,
    assignedEmail: 'anh.nguyen@vcomm.vn',
    vendorOrProvider: 'Adobe Systems Incorporated',
    contractNumber: 'HD-ADOBE-2025-09'
  },
  {
    id: 'ASSET-EML-001',
    assetCode: 'TS-EML-001',
    name: 'Hệ Thống Email Doanh Nghiệp Google Workspace Business Plus (@vcomm.vn)',
    assetType: 'INTANGIBLE',
    category: 'EMAIL_DOMAIN',
    serialNumber: 'LIC-GWS-BP-150ACC',
    originalPrice: 135000000,
    purchaseDate: '2026-01-15',
    depreciationMonths: 12,
    usedMonths: 2,
    currentLocation: 'Google Workspace Cloud Tenant VComm.vn',
    assignedTo: 'Khối Văn Phòng & Vận Hành',
    assignedDepartment: 'Phòng Nhân Sự & IT VComm',
    status: 'IN_USE',
    lastAuditedDate: '2026-03-10',
    notes: '150 Hộp thư công vụ bảo mật chuẩn eDiscovery, Google Vault, chống giả mạo DMARC/DKIM',
    licenseType: 'SUBSCRIPTION',
    licenseKey: 'GWS-DOMAIN-VCOMM-VN-77123',
    expiryDate: '2027-01-15',
    seatsCount: 150,
    assignedEmail: 'it.admin@vcomm.vn',
    vendorOrProvider: 'Google Cloud Platform / CMC Telecom',
    contractNumber: 'HD-GOOGLE-2026-02'
  },
  {
    id: 'ASSET-DOM-001',
    assetCode: 'TS-DOM-001',
    name: 'Tên Miền Quốc Gia Thương Hiệu vcomm.vn & vcomm.com.vn + SSL Wildcard',
    assetType: 'INTANGIBLE',
    category: 'EMAIL_DOMAIN',
    serialNumber: 'DOM-VCOMM-VN-VNNIC',
    originalPrice: 18500000,
    purchaseDate: '2024-06-20',
    depreciationMonths: 60,
    usedMonths: 21,
    currentLocation: 'Trung tâm Internet Việt Nam (VNNIC) & Cloudflare Enterprise',
    assignedTo: 'Ban Công Nghệ VComm',
    assignedDepartment: 'Phòng Công Nghệ & ERP Core',
    status: 'IN_USE',
    lastAuditedDate: '2026-03-01',
    notes: 'Tên miền định danh sàn TMĐT cấp quốc gia, chứng thư bảo mật SSL Wildcard 256-bit',
    licenseType: 'SUBSCRIPTION',
    licenseKey: 'VNNIC-REG-VCOMM-VN-2024',
    expiryDate: '2029-06-20',
    seatsCount: 1,
    assignedEmail: 'domain-admin@vcomm.vn',
    vendorOrProvider: 'VNNIC / Nhà đăng ký Mắt Bão',
    contractNumber: 'HD-DOM-2024-VCOMM'
  },
  {
    id: 'ASSET-IP-001',
    assetCode: 'TS-IP-001',
    name: 'Giấy Chứng Nhận Nhãn Hiệu & Giải Pháp Công Nghệ Sàn TMĐT VComm O2O',
    assetType: 'INTANGIBLE',
    category: 'IP_TRADEMARK',
    serialNumber: 'SHTT-VN-4-2024-00892',
    originalPrice: 65000000,
    purchaseDate: '2024-04-10',
    depreciationMonths: 120,
    usedMonths: 23,
    currentLocation: 'Kho Pháp Chế Doanh Nghiệp & Sổ Tài Sản Vô Hình',
    assignedTo: 'Ban Giám Đốc',
    assignedDepartment: 'Phòng Pháp Chế & Tuân Thủ',
    status: 'IN_USE',
    lastAuditedDate: '2026-03-01',
    notes: 'Được Cục Sở hữu trí tuệ cấp văn bằng bảo hộ độc quyền nhãn hiệu và quy trình công nghệ O2O 10 năm',
    licenseType: 'PERPETUAL',
    licenseKey: 'NOIP-VN-VN4202400892',
    expiryDate: '2034-04-10',
    seatsCount: 1,
    assignedEmail: 'legal@vcomm.vn',
    vendorOrProvider: 'Cục Sở Hữu Trí Tuệ (Bộ KH&CN)',
    contractNumber: 'VB-SHTT-2024-VCOMM'
  }
];

const INITIAL_HANDOVERS: HandoverDocument[] = [
  {
    id: 'DOC-001',
    docNumber: 'BBBG-20250615-01',
    type: 'HANDOVER',
    date: '2025-06-15',
    assetId: 'ASSET-001',
    assetCode: 'TS-POS-001',
    assetName: 'Máy POS Cảm ứng Sunmi D2s Plus (iPOS)',
    serialNumber: 'SN-SUNMI-988123',
    originalPrice: 12500000,
    employeeId: 'EMP-001',
    employeeName: 'Nguyễn Văn An',
    employeeDepartment: 'Khối Bán Lẻ Store Retail',
    employeePosition: 'Thu ngân trưởng',
    employeePhone: '0912.345.678',
    location: 'VComm Retail - Chi nhánh Q1, TP.HCM',
    condition: 'Mới 100%, nguyên hộp, tem niêm phong đầy đủ',
    accessories: 'Két tiền tự động, nguồn Adapter 24V, dây mạng LAN Cat6 3m',
    delivererName: 'Lê Hoàng Minh',
    delivererPosition: 'Trưởng Ban Quản Trị Tài Sản VComm',
    status: 'CONFIRMED'
  },
  {
    id: 'DOC-002',
    docNumber: 'BBBG-20250305-02',
    type: 'HANDOVER',
    date: '2025-03-05',
    assetId: 'ASSET-004',
    assetCode: 'TS-IT-001',
    assetName: 'Laptop Dell Latitude 5440 i7 32GB RAM',
    serialNumber: 'SN-DELL-552199',
    originalPrice: 28500000,
    employeeId: 'EMP-005',
    employeeName: 'Hoàng Văn Thắng',
    employeeDepartment: 'Phòng Công Nghệ & ERP Core',
    employeePosition: 'Kỹ sư Cấp cao ERP',
    employeePhone: '0936.888.999',
    location: 'Trụ sở VComm Tầng 12 - Tòa Keangnam',
    condition: 'Mới 100%, hoạt động ổn định',
    accessories: 'Balo chống sốc Dell, sạc Type-C 65W, chuột không dây Logitech',
    delivererName: 'Lê Hoàng Minh',
    delivererPosition: 'Trưởng Ban Quản Trị Tài Sản VComm',
    status: 'CONFIRMED'
  },
  {
    id: 'DOC-003',
    docNumber: 'BBTH-20260210-01',
    type: 'RETURN',
    date: '2026-02-10',
    assetId: 'ASSET-005',
    assetCode: 'TS-POS-002',
    assetName: 'Máy POS cầm tay V2s Plus 4G di động',
    serialNumber: 'SN-SUNMI-441209',
    originalPrice: 5800000,
    employeeId: 'EMP-002',
    employeeName: 'Trần Thị Mai Lan',
    employeeDepartment: 'Khối Bán Lẻ Store Retail',
    employeePosition: 'Giám sát Cửa hàng',
    employeePhone: '0983.456.789',
    location: 'Kho tổng VComm FBL',
    condition: 'Đã qua sử dụng, máy trầy nhẹ mặt sau, màn hình hiển thị tốt',
    accessories: 'Dock sạc để bàn, cáp sạc Type-C',
    reason: 'Kết thúc chương trình Pop-up Store Tết 2026, thu hồi về kho dự phòng',
    delivererName: 'Lê Hoàng Minh',
    delivererPosition: 'Trưởng Ban Quản Trị Tài Sản VComm',
    status: 'CONFIRMED'
  }
];

const INITIAL_AUDIT_BATCHES: AuditBatch[] = [
  {
    id: 'BATCH-2026-Q1',
    batchCode: 'KK-2026-Q1',
    name: 'Đợt Kiểm Kê Toàn Diện Tài Sản & Thiết Bị Quý 1/2026',
    startDate: '2026-03-01',
    endDate: '2026-03-15',
    location: 'Toàn hệ thống Store Retail & Kho VComm FBL',
    leadAuditorId: 'EMP-003',
    leadAuditorName: 'Lê Hoàng Minh',
    leadAuditorTitle: 'Trưởng Ban Kiểm Kê Tài Sản',
    members: ['Nguyễn Thị Thu (Kế toán TSCĐ)', 'Trần Văn Mạnh (Thủ kho tổng)', 'Phạm Minh Đức (IT Support)'],
    status: 'COMPLETED',
    totalAssets: 6,
    scannedCount: 6,
    discrepancyCount: 0,
    notes: 'Tất cả 6/6 tài sản đều có mặt đầy đủ, tem QR dán đúng quy cách, 1 máy in đang bảo trì có phiếu biên nhận.',
    items: [
      { assetId: 'ASSET-001', assetCode: 'TS-POS-001', assetName: 'Máy POS Cảm ứng Sunmi D2s Plus (iPOS)', category: 'POS_TERMINAL', bookQty: 1, actualQty: 1, condition: 'GOOD', scannedAt: '2026-03-01 10:15', notes: 'Khớp số liệu' },
      { assetId: 'ASSET-002', assetCode: 'TS-PRN-001', assetName: 'Máy in vận đơn nhiệt HPRT N41', category: 'LABEL_PRINTER', bookQty: 1, actualQty: 1, condition: 'GOOD', scannedAt: '2026-03-10 14:20', notes: 'Hoạt động tốt' },
      { assetId: 'ASSET-003', assetCode: 'TS-PDA-001', assetName: 'Máy quét mã vạch kiểm kho Zebra TC21 Android', category: 'BARCODE_PDA', bookQty: 1, actualQty: 1, condition: 'GOOD', scannedAt: '2026-03-12 09:30', notes: 'Khớp 100%' },
      { assetId: 'ASSET-004', assetCode: 'TS-IT-001', assetName: 'Laptop Dell Latitude 5440 i7 32GB RAM', category: 'IT_EQUIPMENT', bookQty: 1, actualQty: 1, condition: 'GOOD', scannedAt: '2026-02-28 16:45', notes: 'Khớp người dùng' },
      { assetId: 'ASSET-005', assetCode: 'TS-POS-002', assetName: 'Máy POS cầm tay V2s Plus 4G di động', category: 'POS_TERMINAL', bookQty: 1, actualQty: 1, condition: 'GOOD', scannedAt: '2026-03-14 11:00', notes: 'Tồn kho nguyên seal' },
      { assetId: 'ASSET-006', assetCode: 'TS-PRN-002', assetName: 'Máy in hóa đơn LAN Bixolon SRP-330II (K80)', category: 'LABEL_PRINTER', bookQty: 1, actualQty: 1, condition: 'NEEDS_REPAIR', scannedAt: '2026-03-15 08:30', notes: 'Đang gửi hãng sửa dao cắt' }
    ]
  },
  {
    id: 'BATCH-2026-STORE-HCM',
    batchCode: 'KK-2026-HCM01',
    name: 'Đợt Kiểm Kê Đột Xuất Cửa Hàng VComm Q1 TP.HCM',
    startDate: '2026-03-18',
    endDate: '2026-03-20',
    location: 'Chi nhánh Retail Quận 1, TP.HCM',
    leadAuditorId: 'EMP-002',
    leadAuditorName: 'Trần Thị Mai Lan',
    leadAuditorTitle: 'Giám Đốc Vận Hành (COO)',
    members: ['Nguyễn Văn An (Cửa hàng trưởng)', 'Vũ Văn Long (Kế toán nội bộ)'],
    status: 'IN_PROGRESS',
    totalAssets: 3,
    scannedCount: 2,
    discrepancyCount: 0,
    notes: 'Đang tiến hành quét QR kiểm kê thiết bị tại quầy thu ngân và kho hàng con.',
    items: [
      { assetId: 'ASSET-001', assetCode: 'TS-POS-001', assetName: 'Máy POS Cảm ứng Sunmi D2s Plus (iPOS)', category: 'POS_TERMINAL', bookQty: 1, actualQty: 1, condition: 'GOOD', scannedAt: '2026-03-18 09:10', notes: 'Đã quét tem QR' },
      { assetId: 'ASSET-005', assetCode: 'TS-POS-002', assetName: 'Máy POS cầm tay V2s Plus 4G di động', category: 'POS_TERMINAL', bookQty: 1, actualQty: 1, condition: 'GOOD', scannedAt: '2026-03-18 09:40', notes: 'Đã quét tem QR' }
    ]
  }
];

const INITIAL_MAINTENANCE_TICKETS: MaintenanceTicket[] = [
  {
    id: 'TICKET-001',
    ticketCode: 'BT-2026-001',
    assetId: 'ASSET-006',
    assetCode: 'TS-PRN-002',
    assetName: 'Máy in hóa đơn LAN Bixolon SRP-330II (K80)',
    serialNumber: 'SN-BIXO-119283',
    reporterEmployeeId: 'EMP-001',
    reporterName: 'Nguyễn Văn An',
    reporterDepartment: 'Khối Bán Lẻ Store Retail',
    reportedDate: '2026-03-10',
    priority: 'HIGH',
    issueDescription: 'Kẹt dao cắt giấy tự động, trục cao su kéo giấy bị mòn sau 22 tháng sử dụng liên tục.',
    repairUnit: 'EXTERNAL_VENDOR',
    vendorName: 'Trung Tâm Dịch Vụ Bixolon Việt Nam',
    estimatedCost: 650000,
    status: 'IN_REPAIR',
    expectedCompletionDate: '2026-03-22',
    repairNotes: 'Đã gửi trung tâm bảo hành hãng, đang chờ thay thế linh kiện dao cắt và cụm đầu in nhiệt.'
  },
  {
    id: 'TICKET-002',
    ticketCode: 'BT-2026-002',
    assetId: 'ASSET-003',
    assetCode: 'TS-PDA-001',
    assetName: 'Máy quét mã vạch kiểm kho Zebra TC21 Android',
    serialNumber: 'SN-ZEBRA-887124',
    reporterEmployeeId: 'EMP-004',
    reporterName: 'Phạm Thị Thảo',
    reporterDepartment: 'Kho Vận Multi-WMS',
    reportedDate: '2026-03-16',
    priority: 'MEDIUM',
    issueDescription: 'Phím bấm quét Trigger sườn máy phản hồi chậm, pin sạc chập chờn.',
    repairUnit: 'INTERNAL_IT',
    vendorName: 'Bộ Phận Kỹ Thuật IT VComm',
    estimatedCost: 150000,
    status: 'PENDING',
    expectedCompletionDate: '2026-03-25',
    repairNotes: 'Chờ duyệt dự toán thay thế chốt trigger và làm sạch cổng sạc Type-C.'
  },
  {
    id: 'TICKET-003',
    ticketCode: 'BT-2026-003',
    assetId: 'ASSET-004',
    assetCode: 'TS-IT-001',
    assetName: 'Laptop Dell Latitude 5440 i7 32GB RAM',
    serialNumber: 'SN-DELL-552199',
    reporterEmployeeId: 'EMP-005',
    reporterName: 'Hoàng Văn Thắng',
    reporterDepartment: 'Phòng Công Nghệ & ERP Core',
    reportedDate: '2026-01-20',
    priority: 'MEDIUM',
    issueDescription: 'Quạt tản nhiệt kêu to, tra keo tản nhiệt định kỳ bảo dưỡng 1 năm.',
    repairUnit: 'INTERNAL_IT',
    vendorName: 'Bộ Phận Kỹ Thuật IT VComm',
    estimatedCost: 120000,
    actualCost: 120000,
    status: 'COMPLETED',
    expectedCompletionDate: '2026-01-22',
    completedDate: '2026-01-22',
    repairNotes: 'Đã vệ sinh quạt tản nhiệt, thay keo tản nhiệt gốm cao cấp, máy chạy mát 42 độ C, bàn giao lại kỹ sư sử dụng.'
  }
];

export function AssetManagement() {
  const [assets, setAssets] = useState<EnterpriseAsset[]>(() => {
    const cached = safeLocalStorage.getItem('vcomm_enterprise_assets');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { console.error(e); }
    }
    return INITIAL_ASSETS;
  });

  const [handovers, setHandovers] = useState<HandoverDocument[]>(() => {
    const cached = safeLocalStorage.getItem('vcomm_asset_handovers');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { console.error(e); }
    }
    return INITIAL_HANDOVERS;
  });

  const [auditBatches, setAuditBatches] = useState<AuditBatch[]>(() => {
    const cached = safeLocalStorage.getItem('vcomm_asset_audit_batches');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { console.error(e); }
    }
    return INITIAL_AUDIT_BATCHES;
  });

  const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceTicket[]>(() => {
    const cached = safeLocalStorage.getItem('vcomm_asset_maintenance_tickets');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { console.error(e); }
    }
    return INITIAL_MAINTENANCE_TICKETS;
  });

  // HRM Employees
  const [employees, setEmployees] = useState<HrmEmployee[]>([]);
  useEffect(() => {
    try {
      const list = typeof hrmEmployeeService.getAllEmployees === 'function'
        ? hrmEmployeeService.getAllEmployees()
        : typeof hrmEmployeeService.getHrmEmployeeList === 'function'
        ? hrmEmployeeService.getHrmEmployeeList()
        : [];
      setEmployees(list || []);
    } catch (e) {
      console.warn('Lỗi nạp danh sách nhân viên trong AssetManagement:', e);
      setEmployees([]);
    }
  }, []);

  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'allocation' | 'maintenance' | 'depreciation' | 'audit'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  
  const [selectedAssetType, setSelectedAssetType] = useState<'ALL' | 'TANGIBLE' | 'INTANGIBLE'>('ALL');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Modals
  const [selectedAssetForModal, setSelectedAssetForModal] = useState<EnterpriseAsset | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isNewAssetModalOpen, setIsNewAssetModalOpen] = useState(false);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

  // Print Preview Modals
  const [selectedHandoverDocForPrint, setSelectedHandoverDocForPrint] = useState<HandoverDocument | null>(null);
  const [selectedAuditBatchForPrint, setSelectedAuditBatchForPrint] = useState<AuditBatch | null>(null);
  
  // Camera Scanner state
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanSuccessAsset, setScanSuccessAsset] = useState<EnterpriseAsset | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Form states for new asset
  const [newAssetData, setNewAssetData] = useState<Partial<EnterpriseAsset>>({
    assetType: 'TANGIBLE',
    category: 'POS_TERMINAL',
    status: 'IN_STOCK',
    depreciationMonths: 36,
    purchaseDate: new Date().toISOString().split('T')[0],
    currentLocation: 'Kho tổng VComm FBL',
    licenseType: 'SUBSCRIPTION',
    seatsCount: 1
  });

  // Form states for Allocation (Cấp phát)
  const [allocationFormData, setAllocationFormData] = useState({
    employeeId: '',
    location: '',
    condition: 'Mới 100%, nguyên tem niêm phong, hoạt động tốt',
    accessories: 'Cáp sạc, nguồn Adapter, sách hướng dẫn, phụ kiện tiêu chuẩn',
    notes: ''
  });

  // Form states for Return (Thu hồi)
  const [returnFormData, setReturnFormData] = useState({
    reason: 'Chuyển công tác / Thay thế trang thiết bị mới',
    condition: 'Đã qua sử dụng, hoạt động bình thường, không trầy xước nặng',
    accessories: 'Đầy đủ cáp nguồn và phụ kiện ban đầu',
    location: 'Kho tổng VComm FBL'
  });

  // Form states for Maintenance (Báo hỏng)
  const [maintenanceFormData, setMaintenanceFormData] = useState({
    assetId: '',
    reporterEmployeeId: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    issueDescription: '',
    repairUnit: 'INTERNAL_IT' as 'INTERNAL_IT' | 'EXTERNAL_VENDOR',
    vendorName: 'Tổ Kỹ Thuật Nội Bộ VComm',
    estimatedCost: 200000,
    expectedCompletionDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  });

  // Save to storage
  useEffect(() => {
    safeLocalStorage.setItem('vcomm_enterprise_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    safeLocalStorage.setItem('vcomm_asset_handovers', JSON.stringify(handovers));
  }, [handovers]);

  useEffect(() => {
    safeLocalStorage.setItem('vcomm_asset_audit_batches', JSON.stringify(auditBatches));
  }, [auditBatches]);

  useEffect(() => {
    safeLocalStorage.setItem('vcomm_asset_maintenance_tickets', JSON.stringify(maintenanceTickets));
  }, [maintenanceTickets]);

  // Clean up camera scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  // Filtered assets
  const filteredAssets = assets.filter(a => {
    const assetClassification = a.assetType || (CATEGORY_MAP[a.category]?.type || 'TANGIBLE');
    const matchType = selectedAssetType === 'ALL' || assetClassification === selectedAssetType;
    const matchCategory = selectedCategory === 'ALL' || a.category === selectedCategory;
    const matchStatus = selectedStatus === 'ALL' || a.status === selectedStatus;
    const matchSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.assetCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.licenseKey && a.licenseKey.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.assignedEmail && a.assignedEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.vendorOrProvider && a.vendorOrProvider.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.assignedTo && a.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSearch && matchCategory && matchStatus && matchType;
  });

  // Financial & Classification Stats
  const tangibleAssets = assets.filter(a => (a.assetType || CATEGORY_MAP[a.category]?.type || 'TANGIBLE') === 'TANGIBLE');
  const intangibleAssets = assets.filter(a => (a.assetType || CATEGORY_MAP[a.category]?.type) === 'INTANGIBLE');

  const tangibleCost = tangibleAssets.reduce((sum, a) => sum + a.originalPrice, 0);
  const intangibleCost = intangibleAssets.reduce((sum, a) => sum + a.originalPrice, 0);

  const totalCost = assets.reduce((sum, a) => sum + a.originalPrice, 0);
  const totalDepreciated = assets.reduce((sum, a) => {
    const monthlyRate = a.originalPrice / Math.max(a.depreciationMonths, 1);
    return sum + (monthlyRate * Math.min(a.usedMonths, a.depreciationMonths));
  }, 0);
  const totalResidualValue = totalCost - totalDepreciated;

  const inUseCount = assets.filter(a => a.status === 'IN_USE').length;
  const inStockCount = assets.filter(a => a.status === 'IN_STOCK').length;
  const maintenanceCount = assets.filter(a => a.status === 'MAINTENANCE').length;
  const totalMaintenanceCost = maintenanceTickets.reduce((sum, t) => sum + (t.actualCost || t.estimatedCost), 0);

  // Expiring licenses / SaaS in 2026 (under 270 days)
  const expiringLicenses = intangibleAssets.filter(a => {
    if (!a.expiryDate) return false;
    const exp = new Date(a.expiryDate).getTime();
    const now = new Date('2026-03-18').getTime();
    const days = (exp - now) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 270;
  });

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  // Toggle Camera Scanner
  const startCameraScanner = async () => {
    setIsScannerActive(true);
    setScanResult(null);
    setScanSuccessAsset(null);

    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode('qr-reader-container');
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            console.log('Scanned QR:', decodedText);
            setScanResult(decodedText);
            const found = assets.find(a => a.assetCode.toUpperCase() === decodedText.trim().toUpperCase() || 
              decodedText.includes(a.assetCode));
            if (found) {
              setScanSuccessAsset(found);
              setAssets(prev => prev.map(item => item.id === found.id ? {
                ...item,
                lastAuditedDate: new Date().toISOString().split('T')[0]
              } : item));
            }
            html5QrCode.stop().then(() => {
              setIsScannerActive(false);
            }).catch(console.error);
          },
          (errorMessage) => {}
        );
      } catch (err) {
        console.error('Failed to start camera:', err);
        alert('Không thể mở camera. Vui lòng cấp quyền truy cập camera trên trình duyệt hoặc sử dụng thiết bị có camera.');
        setIsScannerActive(false);
      }
    }, 200);
  };

  const stopCameraScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.error(e);
      }
    }
    setIsScannerActive(false);
  };

  // Add Asset Handlers
  const handleCreateAsset = () => {
    if (!newAssetData.name || !newAssetData.originalPrice) {
      alert('Vui lòng nhập tên tài sản và nguyên giá.');
      return;
    }
    const assetType = newAssetData.assetType || (CATEGORY_MAP[newAssetData.category || 'POS_TERMINAL']?.type || 'TANGIBLE');
    const prefix = assetType === 'INTANGIBLE' ? 'SFT' : (newAssetData.category?.substring(0, 3) || 'POS');
    const code = `TS-${prefix}-${String(assets.length + 1).padStart(3, '0')}`;
    const newAsset: EnterpriseAsset = {
      id: `ASSET-${Date.now()}`,
      assetCode: code,
      name: newAssetData.name,
      assetType: assetType,
      category: newAssetData.category as any || (assetType === 'INTANGIBLE' ? 'SOFTWARE_SAAS' : 'POS_TERMINAL'),
      serialNumber: newAssetData.serialNumber || (assetType === 'INTANGIBLE' ? `LIC-${Date.now().toString().slice(-6)}` : `SN-${Date.now().toString().slice(-6)}`),
      originalPrice: Number(newAssetData.originalPrice),
      purchaseDate: newAssetData.purchaseDate || new Date().toISOString().split('T')[0],
      depreciationMonths: Number(newAssetData.depreciationMonths) || (assetType === 'INTANGIBLE' ? 12 : 36),
      usedMonths: 0,
      currentLocation: newAssetData.currentLocation || (assetType === 'INTANGIBLE' ? 'VComm Cloud & Tenant' : 'Kho tổng VComm FBL'),
      status: newAssetData.status as any || 'IN_STOCK',
      notes: newAssetData.notes || '',
      licenseType: newAssetData.licenseType || (assetType === 'INTANGIBLE' ? 'SUBSCRIPTION' : undefined),
      licenseKey: newAssetData.licenseKey,
      expiryDate: newAssetData.expiryDate,
      seatsCount: newAssetData.seatsCount ? Number(newAssetData.seatsCount) : undefined,
      assignedEmail: newAssetData.assignedEmail,
      vendorOrProvider: newAssetData.vendorOrProvider,
      contractNumber: newAssetData.contractNumber
    };
    setAssets([newAsset, ...assets]);
    setIsNewAssetModalOpen(false);
    setNewAssetData({
      assetType: 'TANGIBLE',
      category: 'POS_TERMINAL',
      status: 'IN_STOCK',
      depreciationMonths: 36,
      purchaseDate: new Date().toISOString().split('T')[0],
      currentLocation: 'Kho tổng VComm FBL',
      licenseType: 'SUBSCRIPTION',
      seatsCount: 1
    });
  };

  // OPEN ALLOCATION MODAL FOR AN ASSET
  const openAllocationModal = (asset: EnterpriseAsset) => {
    setSelectedAssetForModal(asset);
    setAllocationFormData({
      employeeId: employees[0]?.id || 'EMP-001',
      location: asset.currentLocation || 'VComm Retail - Chi nhánh Q1',
      condition: 'Mới 100%, tem niêm phong đầy đủ, hoạt động tốt',
      accessories: 'Cáp nguồn sạc, Adapter tiêu chuẩn, túi chống sốc',
      notes: ''
    });
    setIsAllocationModalOpen(true);
  };

  // SUBMIT ALLOCATION (CẤP PHÁT CHO NGƯỜI DÙNG TỪ HRM)
  const handleAllocationSubmit = () => {
    if (!selectedAssetForModal) return;
    const selectedEmp = employees.find(e => e.id === allocationFormData.employeeId) || employees[0];
    if (!selectedEmp) {
      alert('Vui lòng chọn nhân viên tiếp nhận từ danh sách HRM.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const docNum = `BBBG-${today.replace(/-/g, '')}-${String(handovers.length + 1).padStart(2, '0')}`;

    const newDoc: HandoverDocument = {
      id: `DOC-${Date.now()}`,
      docNumber: docNum,
      type: 'HANDOVER',
      date: today,
      assetId: selectedAssetForModal.id,
      assetCode: selectedAssetForModal.assetCode,
      assetName: selectedAssetForModal.name,
      serialNumber: selectedAssetForModal.serialNumber,
      originalPrice: selectedAssetForModal.originalPrice,
      employeeId: selectedEmp.id,
      employeeName: selectedEmp.name,
      employeeDepartment: selectedEmp.department,
      employeePosition: selectedEmp.title || selectedEmp.position,
      employeePhone: selectedEmp.phone,
      location: allocationFormData.location,
      condition: allocationFormData.condition,
      accessories: allocationFormData.accessories,
      delivererName: 'Lê Hoàng Minh',
      delivererPosition: 'Trưởng Ban Quản Trị Tài Sản VComm',
      status: 'CONFIRMED'
    };

    // Update asset
    setAssets(prev => prev.map(a => a.id === selectedAssetForModal.id ? {
      ...a,
      assignedTo: selectedEmp.name,
      assignedToEmployeeId: selectedEmp.id,
      assignedDepartment: selectedEmp.department,
      currentLocation: allocationFormData.location,
      status: 'IN_USE'
    } : a));

    // Add handover doc
    setHandovers([newDoc, ...handovers]);
    setIsAllocationModalOpen(false);

    // Auto open print preview for user convenience
    setSelectedHandoverDocForPrint(newDoc);
  };

  // OPEN RETURN MODAL (THU HỒI TÀI SẢN)
  const openReturnModal = (asset: EnterpriseAsset) => {
    setSelectedAssetForModal(asset);
    setReturnFormData({
      reason: 'Chuyển đổi vị trí công tác / Hoàn thành dự án',
      condition: 'Đã qua sử dụng, hoạt động tốt, không nứt vỡ',
      accessories: 'Đầy đủ phụ kiện tiêu chuẩn lúc bàn giao',
      location: 'Kho tổng VComm FBL'
    });
    setIsReturnModalOpen(true);
  };

  // SUBMIT RETURN (THU HỒI TÀI SẢN & TỰ ĐỘNG SINH BIÊN BẢN THU HỒI)
  const handleReturnSubmit = () => {
    if (!selectedAssetForModal) return;
    const today = new Date().toISOString().split('T')[0];
    const docNum = `BBTH-${today.replace(/-/g, '')}-${String(handovers.length + 1).padStart(2, '0')}`;

    const empName = selectedAssetForModal.assignedTo || 'Nhân sự VComm';
    const matchedEmp = employees.find(e => e.id === selectedAssetForModal.assignedToEmployeeId || e.name === empName);

    const returnDoc: HandoverDocument = {
      id: `DOC-${Date.now()}`,
      docNumber: docNum,
      type: 'RETURN',
      date: today,
      assetId: selectedAssetForModal.id,
      assetCode: selectedAssetForModal.assetCode,
      assetName: selectedAssetForModal.name,
      serialNumber: selectedAssetForModal.serialNumber,
      originalPrice: selectedAssetForModal.originalPrice,
      employeeId: matchedEmp?.id || 'EMP-UNKNOWN',
      employeeName: empName,
      employeeDepartment: selectedAssetForModal.assignedDepartment || 'Khối Vận Hành',
      employeePosition: matchedEmp?.title || 'Cán bộ nhân viên',
      employeePhone: matchedEmp?.phone,
      location: returnFormData.location,
      condition: returnFormData.condition,
      accessories: returnFormData.accessories,
      reason: returnFormData.reason,
      delivererName: 'Lê Hoàng Minh',
      delivererPosition: 'Trưởng Ban Quản Trị Tài Sản VComm',
      status: 'CONFIRMED'
    };

    // Update asset to IN_STOCK
    setAssets(prev => prev.map(a => a.id === selectedAssetForModal.id ? {
      ...a,
      assignedTo: undefined,
      assignedToEmployeeId: undefined,
      assignedDepartment: undefined,
      currentLocation: returnFormData.location,
      status: 'IN_STOCK'
    } : a));

    // Save return doc
    setHandovers([returnDoc, ...handovers]);
    setIsReturnModalOpen(false);

    // Auto open print preview for user convenience
    setSelectedHandoverDocForPrint(returnDoc);
  };

  // OPEN MAINTENANCE MODAL (BÁO HỎNG & BẢO TRÌ)
  const openMaintenanceModal = (asset?: EnterpriseAsset) => {
    const targetAsset = asset || assets[0];
    setSelectedAssetForModal(targetAsset);
    setMaintenanceFormData({
      assetId: targetAsset.id,
      reporterEmployeeId: employees[0]?.id || 'EMP-001',
      priority: 'MEDIUM',
      issueDescription: '',
      repairUnit: 'INTERNAL_IT',
      vendorName: 'Tổ Kỹ Thuật Nội Bộ VComm',
      estimatedCost: 300000,
      expectedCompletionDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
    });
    setIsMaintenanceModalOpen(true);
  };

  // SUBMIT MAINTENANCE TICKET
  const handleMaintenanceSubmit = () => {
    const targetAsset = assets.find(a => a.id === maintenanceFormData.assetId);
    if (!targetAsset) return;

    if (!maintenanceFormData.issueDescription) {
      alert('Vui lòng mô tả tình trạng hư hỏng / sự cố thiết bị.');
      return;
    }

    const reporter = employees.find(e => e.id === maintenanceFormData.reporterEmployeeId) || employees[0];
    const ticketCode = `BT-2026-${String(maintenanceTickets.length + 1).padStart(3, '0')}`;

    const newTicket: MaintenanceTicket = {
      id: `TICKET-${Date.now()}`,
      ticketCode: ticketCode,
      assetId: targetAsset.id,
      assetCode: targetAsset.assetCode,
      assetName: targetAsset.name,
      serialNumber: targetAsset.serialNumber,
      reporterEmployeeId: reporter.id,
      reporterName: reporter.name,
      reporterDepartment: reporter.department,
      reportedDate: new Date().toISOString().split('T')[0],
      priority: maintenanceFormData.priority,
      issueDescription: maintenanceFormData.issueDescription,
      repairUnit: maintenanceFormData.repairUnit,
      vendorName: maintenanceFormData.repairUnit === 'INTERNAL_IT' ? 'Tổ Kỹ Thuật Nội Bộ VComm' : maintenanceFormData.vendorName,
      estimatedCost: Number(maintenanceFormData.estimatedCost) || 0,
      status: 'PENDING',
      expectedCompletionDate: maintenanceFormData.expectedCompletionDate,
      repairNotes: 'Chờ duyệt dự toán và phân công kỹ sư bảo trì.'
    };

    // Update asset status to MAINTENANCE
    setAssets(prev => prev.map(a => a.id === targetAsset.id ? {
      ...a,
      status: 'MAINTENANCE'
    } : a));

    setMaintenanceTickets([newTicket, ...maintenanceTickets]);
    setIsMaintenanceModalOpen(false);
    setActiveTab('maintenance');
  };

  // COMPLETE MAINTENANCE (NGHIỆM THU ĐƯA VỀ SỬ DỤNG)
  const handleCompleteMaintenance = (ticket: MaintenanceTicket) => {
    const today = new Date().toISOString().split('T')[0];
    const actualCost = ticket.estimatedCost;

    setMaintenanceTickets(prev => prev.map(t => t.id === ticket.id ? {
      ...t,
      status: 'COMPLETED',
      completedDate: today,
      actualCost: actualCost,
      repairNotes: `Nghiệm thu đạt chuẩn vận hành ngày ${today}. Đã test hoạt động tốt 100%.`
    } : t));

    // Restore asset status
    setAssets(prev => prev.map(a => a.id === ticket.assetId ? {
      ...a,
      status: a.assignedTo ? 'IN_USE' : 'IN_STOCK'
    } : a));

    alert(`Đã nghiệm thu phiếu ${ticket.ticketCode}. Thiết bị ${ticket.assetCode} đã sẵn sàng vận hành!`);
  };

  // SYNC DEPRECIATION TO FINANCE
  const handleSyncToFinance = () => {
    const tangibleDep = tangibleAssets.reduce((sum, a) => {
      const monthlyRate = a.originalPrice / Math.max(a.depreciationMonths, 1);
      return sum + (monthlyRate * Math.min(a.usedMonths, a.depreciationMonths));
    }, 0);
    const intangibleDep = intangibleAssets.reduce((sum, a) => {
      const monthlyRate = a.originalPrice / Math.max(a.depreciationMonths, 1);
      return sum + (monthlyRate * Math.min(a.usedMonths, a.depreciationMonths));
    }, 0);

    alert('ĐÃ KẾT CHUYỂN BÚT TOÁN KHẤU HAO THÁNG 03/2026 SANG KẾ TOÁN (FINANCE) CHUẨN TT 200!\n\n' +
      '1. TÀI SẢN HỮU HÌNH (THIẾT BỊ, CCDC KHO & STORE RETAIL):\n' +
      '   - Nợ TK 641/642 (Chi phí bộ phận sử dụng): ' + formatCurrency(tangibleDep) + '\n' +
      '   - Có TK 2141 (Hao mòn TSCĐ hữu hình): ' + formatCurrency(tangibleDep) + '\n\n' +
      '2. TÀI SẢN VÔ HÌNH (BẢN QUYỀN WINDOWS, PHẦN MỀM SAAS, EMAIL, DOMAIN):\n' +
      '   - Nợ TK 642 (Chi phí bản quyền công nghệ & vận hành hệ thống): ' + formatCurrency(intangibleDep) + '\n' +
      '   - Có TK 2143 (Hao mòn TSCĐ vô hình & bản quyền): ' + formatCurrency(intangibleDep) + '\n\n' +
      '==> TỔNG CỘNG TRÍCH KHẤU HAO/PHÂN BỔ THÁNG: ' + formatCurrency(totalDepreciated) + '\n' +
      'Bút toán đã được đồng bộ tự động vào Sổ Cái & Sổ Nhật Ký Chung (Finance.tsx).');
  };

  return (
    <div className="space-y-6 pb-20 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-md shadow-emerald-500/20">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Quản Trị Toàn Diện Tài Sản & Thiết Bị O2O
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                  Chuẩn TT 45/2013 & TT 200 Kế Toán
                </span>
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Cấp phát HRM nhân viên • Tự động in biên bản bàn giao/thu hồi A4 • Bảo trì sửa chữa • Kiểm kê theo đợt • Đồng bộ Sổ Cái Kế toán.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => openMaintenanceModal()}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Wrench className="w-4 h-4" />
            Báo Hỏng / Bảo Trì
          </button>
          <button
            onClick={startCameraScanner}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Camera className="w-4 h-4" />
            Quét QR Kiểm Kê
          </button>
          <button
            onClick={() => setIsNewAssetModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Khai Báo Tài Sản Mới
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl px-2 shadow-sm overflow-x-auto">
        {[
          { id: 'overview', label: 'Bảng Điều Khiển KPI', icon: Boxes },
          { id: 'assets', label: 'Sổ Tài Sản & Thiết Bị', icon: Layers },
          { id: 'allocation', label: 'Cấp Phát & Bàn Giao (HRM)', icon: ArrowRightLeft },
          { id: 'maintenance', label: 'Bảo Trì & Sửa Chữa', icon: Wrench, badge: maintenanceCount > 0 ? maintenanceCount : undefined },
          { id: 'depreciation', label: 'Khấu Hao Sổ Kế Toán (Finance)', icon: TrendingDown },
          { id: 'audit', label: 'Đợt Kiểm Kê & In Biên Bản', icon: ClipboardCheck }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap relative",
                isActive 
                  ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-emerald-600" : "text-slate-400")} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW KPI */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Nguyên Giá Mua</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalCost)}</div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Boxes className="w-3.5 h-3.5 text-emerald-500" />
                Tổng cộng {assets.length} tài sản & bản quyền số
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hao Mòn Lũy Kế</span>
              <div className="text-2xl font-black text-rose-600 mt-1">-{formatCurrency(totalDepreciated)}</div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                TK 2141 (Hữu hình) & TK 2143 (Vô hình)
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Giá Trị Sổ Sách Còn Lại</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(totalResidualValue)}</div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                Giá trị tài sản ròng thực tế
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trạng Thái Vận Hành</span>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {inUseCount} Đang dùng
                </span>
                <span className="px-2 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {inStockCount} Sẵn trong kho
                </span>
                <span className="px-2 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  {maintenanceCount} Bảo trì
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Đạt 100% tỷ lệ sẵn sàng phục vụ kinh doanh</p>
            </div>
          </div>

          {/* DUAL CLASSIFICATION HIGHLIGHT CARDS: HỮU HÌNH VS VÔ HÌNH */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tangible Card */}
            <div className="bg-gradient-to-br from-white to-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                    <Laptop className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      Tài Sản Hữu Hình (Tangible Assets)
                    </span>
                    <h4 className="text-lg font-black text-slate-900 mt-1">Phần Cứng, Thiết Bị & CCDC Kho</h4>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedAssetType('TANGIBLE'); setActiveTab('assets'); }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors flex items-center gap-1"
                >
                  Lọc xem ({tangibleAssets.length})
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200/80">
                <div>
                  <span className="text-[11px] text-slate-500">Số lượng thiết bị</span>
                  <div className="text-base font-black text-slate-900">{tangibleAssets.length} thiết bị</div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500">Tổng nguyên giá</span>
                  <div className="text-base font-black text-blue-600">{formatCurrency(tangibleCost)}</div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500">Chuẩn kế toán</span>
                  <div className="text-xs font-bold text-slate-700">TK 2141 (24-60 tháng)</div>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Gồm máy POS Sunmi, máy in tem HPRT, máy quét Zebra, Laptop Dell, xe nâng Toyota, bàn ghế kho.
              </p>
            </div>

            {/* Intangible Card */}
            <div className="bg-gradient-to-br from-white to-purple-50/40 p-5 rounded-2xl border border-purple-200 shadow-sm relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-200">
                    <Key className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                      Tài Sản Vô Hình (Intangible / Digital Assets)
                    </span>
                    <h4 className="text-lg font-black text-slate-900 mt-1">Bản Quyền Windows, SaaS & Email</h4>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedAssetType('INTANGIBLE'); setActiveTab('assets'); }}
                  className="text-xs font-bold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-200 transition-colors flex items-center gap-1"
                >
                  Lọc xem ({intangibleAssets.length})
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-purple-200/60">
                <div>
                  <span className="text-[11px] text-slate-500">Số gói bản quyền</span>
                  <div className="text-base font-black text-slate-900">{intangibleAssets.length} bản quyền</div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500">Tổng giá trị bản quyền</span>
                  <div className="text-base font-black text-purple-600">{formatCurrency(intangibleCost)}</div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500">Chuẩn kế toán</span>
                  <div className="text-xs font-bold text-slate-700">TK 2143 (12-120 tháng)</div>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Gồm Windows 11 Pro OEM, Microsoft 365 E3 (100 seats), Adobe CC (5 seats), Email Google Workspace, Domain vcomm.vn, Nhãn hiệu SHTT.
              </p>
            </div>
          </div>

          {/* LICENSE EXPIRY ALERTS */}
          {expiringLicenses.length > 0 && (
            <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-amber-900 text-sm flex items-center gap-2">
                  Cảnh Báo Gia Hạn Bản Quyền Phần Mềm & Dịch Vụ Số Năm 2026 ({expiringLicenses.length} mục sắp đến hạn)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {expiringLicenses.map(lic => (
                    <div key={lic.id} className="p-2.5 bg-white rounded-xl border border-amber-200/80 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{lic.name}</div>
                        <div className="text-slate-500 font-mono text-[11px]">Key: {lic.licenseKey || lic.serialNumber}</div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-amber-100 text-amber-800">
                          Hạn: {lic.expiryDate}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-0.5">{lic.seatsCount ? `${lic.seatsCount} Seats/User` : 'Doanh nghiệp'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Categories Overview Grid */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900 mb-3 flex items-center justify-between">
                <span>Phân Bổ Tài Sản Hữu Hình (Phần Cứng & Trang Thiết Bị Kho / Store)</span>
                <span className="text-xs font-bold text-slate-400 uppercase">Khấu hao TK 2141</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(CATEGORY_MAP).filter(([_, cat]) => cat.type === 'TANGIBLE').map(([key, cat]) => {
                  const count = assets.filter(a => a.category === key).length;
                  const value = assets.filter(a => a.category === key).reduce((s, a) => s + a.originalPrice, 0);
                  const Icon = cat.icon;
                  return (
                    <div key={key} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/80 transition-all flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg border", cat.color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-800">{cat.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{count} thiết bị • {formatCurrency(value)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-base font-black text-slate-900 mb-3 flex items-center justify-between">
                <span>Phân Bổ Tài Sản Vô Hình (Bản Quyền Hệ Điều Hành, Phần Mềm SaaS, Email & SHTT)</span>
                <span className="text-xs font-bold text-slate-400 uppercase">Khấu hao TK 2143</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(CATEGORY_MAP).filter(([_, cat]) => cat.type === 'INTANGIBLE').map(([key, cat]) => {
                  const count = assets.filter(a => a.category === key).length;
                  const value = assets.filter(a => a.category === key).reduce((s, a) => s + a.originalPrice, 0);
                  const Icon = cat.icon;
                  return (
                    <div key={key} className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/40 hover:bg-purple-100/50 transition-all flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg border", cat.color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-800">{cat.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{count} bản quyền • {formatCurrency(value)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ASSET REGISTER */}
      {(activeTab === 'assets' || activeTab === 'overview') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Quick Segmented Toggle: All vs Tangible vs Intangible */}
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl text-xs font-bold">
              <button
                onClick={() => setSelectedAssetType('ALL')}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
                  selectedAssetType === 'ALL'
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Boxes className="w-3.5 h-3.5" />
                Tất Cả Tài Sản ({assets.length})
              </button>
              <button
                onClick={() => setSelectedAssetType('TANGIBLE')}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
                  selectedAssetType === 'TANGIBLE'
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-blue-700"
                )}
              >
                <Laptop className="w-3.5 h-3.5" />
                🏢 Tài Sản Hữu Hình ({tangibleAssets.length})
              </button>
              <button
                onClick={() => setSelectedAssetType('INTANGIBLE')}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
                  selectedAssetType === 'INTANGIBLE'
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-purple-700"
                )}
              >
                <Key className="w-3.5 h-3.5" />
                ☁️ Tài Sản Vô Hình & Bản Quyền ({intangibleAssets.length})
              </button>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              {selectedAssetType === 'TANGIBLE' && 'Đang hiển thị nhóm CCDC, máy POS, Laptop, xe nâng và thiết bị vật lý'}
              {selectedAssetType === 'INTANGIBLE' && 'Đang hiển thị bản quyền Windows, phần mềm SaaS, email công vụ & tên miền'}
              {selectedAssetType === 'ALL' && 'Đang hiển thị toàn bộ tài sản hữu hình và vô hình của doanh nghiệp'}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo mã TS, tên phần mềm/thiết bị, License Key, Email, nhân viên..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none"
              >
                <option value="ALL">Tất cả danh mục</option>
                <optgroup label="--- TÀI SẢN HỮU HÌNH (THIẾT BỊ) ---">
                  {Object.entries(CATEGORY_MAP).filter(([_, cat]) => cat.type === 'TANGIBLE').map(([key, cat]) => (
                    <option key={key} value={key}>{cat.label}</option>
                  ))}
                </optgroup>
                <optgroup label="--- TÀI SẢN VÔ HÌNH (BẢN QUYỀN & SỐ) ---">
                  {Object.entries(CATEGORY_MAP).filter(([_, cat]) => cat.type === 'INTANGIBLE').map(([key, cat]) => (
                    <option key={key} value={key}>{cat.label}</option>
                  ))}
                </optgroup>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="IN_USE">Đang sử dụng / Đã kích hoạt</option>
                <option value="IN_STOCK">Trong kho / Chưa gán</option>
                <option value="MAINTENANCE">Đang bảo dưỡng</option>
              </select>
            </div>

            <div className="text-xs font-bold text-slate-500">
              Hiển thị {filteredAssets.length} / {assets.length} tài sản
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4">Phân Loại & Mã TS</th>
                  <th className="py-3.5 px-4">Tên Tài Sản / Bản Quyền</th>
                  <th className="py-3.5 px-4">Nhóm & License</th>
                  <th className="py-3.5 px-4">Nguyên Giá</th>
                  <th className="py-3.5 px-4">Khấu Hao</th>
                  <th className="py-3.5 px-4">Môi Trường / Cán Bộ Sử Dụng</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAssets.map(asset => {
                  const isIntangible = (asset.assetType || CATEGORY_MAP[asset.category]?.type) === 'INTANGIBLE';
                  const cat = CATEGORY_MAP[asset.category] || (isIntangible ? CATEGORY_MAP.SOFTWARE_SAAS : CATEGORY_MAP.POS_TERMINAL);
                  const Icon = cat.icon;
                  const monthlyDep = asset.originalPrice / Math.max(asset.depreciationMonths, 1);
                  const accumulated = monthlyDep * Math.min(asset.usedMonths, asset.depreciationMonths);
                  const residual = asset.originalPrice - accumulated;

                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide w-fit",
                            isIntangible 
                              ? "bg-purple-100 text-purple-700 border border-purple-200" 
                              : "bg-blue-100 text-blue-700 border border-blue-200"
                          )}>
                            {isIntangible ? <Key className="w-2.5 h-2.5" /> : <Laptop className="w-2.5 h-2.5" />}
                            {isIntangible ? 'VÔ HÌNH' : 'HỮU HÌNH'}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-800">
                            {asset.assetCode}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2 rounded-lg border shrink-0 mt-0.5", cat.color)}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 leading-snug">
                              {asset.name}
                            </div>
                            {isIntangible ? (
                              <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                                {asset.licenseKey && (
                                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 flex items-center gap-1 border border-slate-200">
                                    <Key className="w-3 h-3 text-purple-600" />
                                    {asset.licenseKey.length > 18 ? `${asset.licenseKey.slice(0, 10)}...${asset.licenseKey.slice(-4)}` : asset.licenseKey}
                                    <button
                                      onClick={() => handleCopyKey(asset.licenseKey!, asset.id)}
                                      title="Copy License Key"
                                      className="text-slate-400 hover:text-purple-700 ml-0.5"
                                    >
                                      {copiedKeyId === asset.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                  </span>
                                )}
                                {asset.seatsCount && (
                                  <span className="font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded text-[10px]">
                                    {asset.seatsCount} Seats / User
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400 font-mono mt-0.5">Serial: {asset.serialNumber}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-xs font-semibold text-slate-700 block">{cat.label}</span>
                        {isIntangible ? (
                          <div className="mt-1">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {asset.licenseType === 'PERPETUAL' ? 'Vĩnh viễn (Perpetual)' : 'Thuê bao (SaaS)'}
                            </span>
                            {asset.expiryDate && (
                              <div className="text-[10px] text-slate-500 mt-0.5">Hạn: {asset.expiryDate}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">Thiết bị phần cứng CCDC</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{formatCurrency(asset.originalPrice)}</div>
                        <div className="text-xs text-slate-400">Mua: {asset.purchaseDate}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs text-slate-800 font-medium">Còn lại: <span className="font-bold text-emerald-600">{formatCurrency(residual)}</span></div>
                        <div className="text-[11px] text-slate-400">Đã dùng: {asset.usedMonths}/{asset.depreciationMonths} tháng</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          TK {isIntangible ? '2143' : '2141'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          {isIntangible ? <Globe className="w-3.5 h-3.5 text-purple-500" /> : <Building2 className="w-3.5 h-3.5 text-slate-400" />}
                          <span className="truncate max-w-[180px]">{asset.currentLocation}</span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{asset.assignedTo || 'Chưa bàn giao'}</span>
                        </div>
                        {asset.assignedEmail && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{asset.assignedEmail}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {asset.status === 'IN_USE' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {isIntangible ? 'Đang kích hoạt' : 'Đang vận hành'}
                          </span>
                        )}
                        {asset.status === 'IN_STOCK' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {isIntangible ? 'Chưa gán User' : 'Trong kho'}
                          </span>
                        )}
                        {asset.status === 'MAINTENANCE' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {isIntangible ? 'Đang gia hạn' : 'Bảo trì'}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {asset.status === 'IN_STOCK' ? (
                            <button
                              onClick={() => openAllocationModal(asset)}
                              title={isIntangible ? "Cấp phát bản quyền / tài khoản cho nhân sự" : "Cấp phát cho nhân viên (HRM)"}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1"
                            >
                              <User className="w-3.5 h-3.5" />
                              {isIntangible ? 'Cấp User' : 'Cấp Phát'}
                            </button>
                          ) : asset.status === 'IN_USE' ? (
                            <button
                              onClick={() => openReturnModal(asset)}
                              title={isIntangible ? "Thu hồi tài khoản / bản quyền" : "Thu hồi tài sản về kho"}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1"
                            >
                              <ArrowDownToLine className="w-3.5 h-3.5" />
                              Thu Hồi
                            </button>
                          ) : null}

                          {!isIntangible && (
                            <button
                              onClick={() => openMaintenanceModal(asset)}
                              title="Báo hỏng / Gửi bảo dưỡng thiết bị"
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              <Wrench className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedAssetForModal(asset);
                              setIsQrModalOpen(true);
                            }}
                            title={isIntangible ? "In tem mã QR chứng chỉ bản quyền" : "In tem mã QR tài sản"}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <QrCode className="w-4 h-4" />
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
      )}

      {/* TAB 3: ALLOCATION & HANDOVER (CẤP PHÁT & BÀN GIAO HRM) */}
      {activeTab === 'allocation' && (
        <div className="space-y-6">
          {/* Action Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                Cấp Phát Thiết Bị Nhân Viên (HRM) & Biên Bản Bàn Giao / Thu Hồi
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tự động kết nối hồ sơ Cán bộ Nhân viên từ HRM, sinh và in Biên bản bàn giao/thu hồi chuẩn khổ A4 có đầy đủ chữ ký 2 bên.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const stockAsset = assets.find(a => a.status === 'IN_STOCK') || assets[0];
                  openAllocationModal(stockAsset);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Lập Phiếu Cấp Phát Thiết Bị
              </button>
            </div>
          </div>

          {/* Active Allocations Grid */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>Tài Sản Đang Được Cấp Phát Cho Nhân Sự ({assets.filter(a => a.assignedTo).length})</span>
              <span className="text-xs font-normal text-slate-500">Dữ liệu định danh từ HRM</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.filter(a => a.assignedTo).map(asset => {
                const emp = employees.find(e => e.id === asset.assignedToEmployeeId || e.name === asset.assignedTo);
                const relatedDoc = handovers.find(h => h.assetId === asset.id && h.type === 'HANDOVER');

                return (
                  <div key={asset.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold">
                          {asset.assetCode}
                        </span>
                        <h5 className="font-bold text-slate-900 text-sm mt-1">{asset.name}</h5>
                        <p className="text-xs text-slate-400 font-mono">SN: {asset.serialNumber}</p>
                      </div>
                      <span className="text-xs font-bold text-slate-700">{formatCurrency(asset.originalPrice)}</span>
                    </div>

                    {/* Employee Profile Card */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-3">
                      {emp?.avatar ? (
                        <img src={emp.avatar} alt={emp.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                          {asset.assignedTo?.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate flex items-center gap-1.5">
                          {asset.assignedTo}
                          <span className="text-[10px] text-slate-400 font-normal">({emp?.id || 'EMP'})</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{emp?.title || asset.assignedDepartment}</div>
                        <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" />
                          {asset.currentLocation}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      {relatedDoc ? (
                        <button
                          onClick={() => setSelectedHandoverDocForPrint(relatedDoc)}
                          className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Xem/In BBBG
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Chưa lưu văn bản</span>
                      )}

                      <button
                        onClick={() => openReturnModal(asset)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 transition-colors"
                      >
                        Thu Hồi Về Kho
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Handover & Return Documents Ledger */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>Sổ Lưu Trữ Biên Bản Bàn Giao & Thu Hồi Tài Sản ({handovers.length})</span>
              <span className="text-xs font-normal text-slate-500">Mẫu in văn bản chuẩn A4</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs font-bold text-slate-400 uppercase border-b border-slate-200">
                    <th className="py-3 px-3">Số Văn Bản</th>
                    <th className="py-3 px-3">Loại Biên Bản</th>
                    <th className="py-3 px-3">Ngày Lập</th>
                    <th className="py-3 px-3">Thiết Bị / CCDC</th>
                    <th className="py-3 px-3">Cán Bộ Tiếp Nhận / Bàn Giao</th>
                    <th className="py-3 px-3">Tình Trạng Thiết Bị</th>
                    <th className="py-3 px-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {handovers.map(doc => (
                    <tr key={doc.id} className="hover:bg-slate-50 font-medium">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{doc.docNumber}</td>
                      <td className="py-3 px-3">
                        {doc.type === 'HANDOVER' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Bàn Giao Cấp Phát
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Thu Hồi Nhập Kho
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-500">{doc.date}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800">{doc.assetName}</div>
                        <div className="text-xs text-slate-400 font-mono">{doc.assetCode} • SN: {doc.serialNumber}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          {doc.employeeName}
                          <span className="text-[10px] text-slate-400 font-normal">({doc.employeeId})</span>
                        </div>
                        <div className="text-xs text-slate-400">{doc.employeeDepartment}</div>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-600 max-w-xs truncate">{doc.condition}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedHandoverDocForPrint(doc)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1.5 ml-auto"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          In Bản In A4
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

      {/* TAB 4: MAINTENANCE & REPAIRS (BẢO TRÌ & SỬA CHỮA) */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          {/* Header & KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Chi Phí Sửa Chữa</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalMaintenanceCost)}</div>
              <p className="text-xs text-slate-500 mt-1">Lũy kế các đợt thay thế linh kiện</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thiết Bị Đang Sửa Chữa</span>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {maintenanceTickets.filter(t => t.status === 'IN_REPAIR').length} thiết bị
              </div>
              <p className="text-xs text-slate-500 mt-1">Đang gửi trung tâm bảo hành/hãng</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phiếu Chờ Duyệt Dự Toán</span>
              <div className="text-2xl font-black text-blue-600 mt-1">
                {maintenanceTickets.filter(t => t.status === 'PENDING').length} phiếu
              </div>
              <p className="text-xs text-slate-500 mt-1">Chờ Trưởng Ban Quản Trị phê duyệt</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tỷ Lệ Uptime Sẵn Sàng</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">99.2%</div>
              <p className="text-xs text-slate-500 mt-1">SLA thiết bị vận hành liên tục O2O</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-500" />
                Sổ Theo Dõi Bảo Trì & Sửa Chữa Thiết Bị
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tiếp nhận sự cố hỏng hóc từ cửa hàng/kho, quản lý dự toán chi phí, phân công IT nội bộ hoặc hãng bảo hành và nghiệm thu hoàn thành.
              </p>
            </div>
            <button
              onClick={() => openMaintenanceModal()}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Tạo Phiếu Báo Hỏng / Sửa Chữa
            </button>
          </div>

          {/* Tickets Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3.5 px-4">Mã Phiếu</th>
                    <th className="py-3.5 px-4">Thiết Bị Hỏng</th>
                    <th className="py-3.5 px-4">Người Báo Hỏng (HRM)</th>
                    <th className="py-3.5 px-4">Mô Tả Lỗi & Sự Cố</th>
                    <th className="py-3.5 px-4">Đơn Vị Xử Lý</th>
                    <th className="py-3.5 px-4">Dự Toán Chi Phí</th>
                    <th className="py-3.5 px-4">Trạng Thái</th>
                    <th className="py-3.5 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {maintenanceTickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-slate-50 font-medium">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{ticket.ticketCode}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{ticket.assetName}</div>
                        <div className="text-xs text-slate-400 font-mono">{ticket.assetCode} • SN: {ticket.serialNumber}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{ticket.reporterName}</div>
                        <div className="text-xs text-slate-400">{ticket.reporterDepartment}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Ngày báo: {ticket.reportedDate}</div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-xs text-slate-700 line-clamp-2">{ticket.issueDescription}</p>
                        {ticket.priority === 'HIGH' || ticket.priority === 'URGENT' ? (
                          <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                            Ưu tiên: {ticket.priority}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-bold text-slate-800">{ticket.vendorName}</div>
                        <div className="text-[11px] text-slate-400">Hạn xong: {ticket.expectedCompletionDate}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-bold text-slate-900">
                          {formatCurrency(ticket.actualCost || ticket.estimatedCost)}
                        </div>
                        {ticket.actualCost ? (
                          <div className="text-[10px] text-emerald-600 font-bold">Thực tế nghiệm thu</div>
                        ) : (
                          <div className="text-[10px] text-slate-400">Dự toán</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {ticket.status === 'PENDING' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Chờ duyệt
                          </span>
                        )}
                        {ticket.status === 'IN_REPAIR' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                            Đang sửa chữa
                          </span>
                        )}
                        {ticket.status === 'COMPLETED' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Đã nghiệm thu
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {ticket.status === 'PENDING' ? (
                          <button
                            onClick={() => {
                              setMaintenanceTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: 'IN_REPAIR' } : t));
                              alert(`Đã phê duyệt dự toán phiếu ${ticket.ticketCode}, chuyển sang trạng thái Đang Sửa Chữa.`);
                            }}
                            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs border border-indigo-200"
                          >
                            Duyệt Sửa
                          </button>
                        ) : ticket.status === 'IN_REPAIR' ? (
                          <button
                            onClick={() => handleCompleteMaintenance(ticket)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm"
                          >
                            Nghiệm Thu
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Hoàn tất</span>
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


      {/* CAMERA SCANNER OVERLAY MODAL */}
      {isScannerActive && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-center relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={stopCameraScanner}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center gap-2 text-indigo-600 font-bold">
              <Camera className="w-5 h-5 animate-pulse" />
              <span>Camera Quét QR Kiểm Kê Trực Tiếp</span>
            </div>
            <p className="text-xs text-slate-500">
              Hướng camera vào tem mã QR dán trên thiết bị (POS, máy in, PDA). Hệ thống sẽ tự động nhận diện và cập nhật biên bản kiểm kê.
            </p>

            {/* Video preview container */}
            <div className="overflow-hidden rounded-2xl border-2 border-indigo-500 bg-black min-h-[260px] relative flex items-center justify-center">
              <div id="qr-reader-container" className="w-full h-full" />
            </div>

            <button
              onClick={stopCameraScanner}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors"
            >
              Hủy Quét & Đóng Camera
            </button>
          </div>
        </div>
      )}

      {/* SCAN RESULT SUCCESS TOAST / POPUP */}
      {scanSuccessAsset && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white p-5 rounded-2xl shadow-2xl border border-emerald-500/30 max-w-sm animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-500 text-white rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-black text-sm text-emerald-400">Kiểm Kê Thành Công!</h4>
              <p className="text-xs font-bold text-white mt-1">{scanSuccessAsset.name}</p>
              <p className="text-[11px] text-slate-300 mt-0.5">Mã: {scanSuccessAsset.assetCode} • Serial: {scanSuccessAsset.serialNumber}</p>
              <p className="text-[11px] text-emerald-300 mt-1">Đã cập nhật tình trạng kiểm kê thực tế ngày hôm nay.</p>
            </div>
            <button onClick={() => setScanSuccessAsset(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* QR CODE LABEL PRINT MODAL */}
      {isQrModalOpen && selectedAssetForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-center relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-900">Tem Nhãn Mã QR Tài Sản</h3>
            <p className="text-xs text-slate-500">Mã chuẩn QR dùng dán trực tiếp lên thân máy POS, máy in, thiết bị kho</p>

            {/* Printable Label Box */}
            <div className="border-2 border-dashed border-slate-300 p-4 rounded-2xl bg-slate-50 flex flex-col items-center space-y-3">
              <div className="text-[11px] font-black uppercase text-emerald-700 tracking-wider">
                VCOMM ASSET MANAGEMENT
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(selectedAssetForModal.assetCode)}`}
                  alt="Asset QR Code"
                  className="w-36 h-36 object-contain"
                />
              </div>
              <div>
                <div className="font-mono text-base font-black text-slate-900">{selectedAssetForModal.assetCode}</div>
                <div className="text-xs font-bold text-slate-700">{selectedAssetForModal.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">SN: {selectedAssetForModal.serialNumber}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                In Tem Nhãn (K80 / Decal)
              </button>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CẤP PHÁT CHO NGƯỜI DÙNG TỪ HRM (ALLOCATION MODAL) */}
      {isAllocationModalOpen && selectedAssetForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsAllocationModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {(() => {
              const isIntangible = (selectedAssetForModal.assetType || CATEGORY_MAP[selectedAssetForModal.category]?.type) === 'INTANGIBLE';
              return (
                <>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    {isIntangible ? <Key className="w-5 h-5 text-purple-600" /> : <User className="w-5 h-5 text-emerald-600" />}
                    {isIntangible ? 'Cấp Phát Bản Quyền & Tài Khoản Số (HRM)' : 'Cấp Phát Thiết Bị Cho Cán Bộ Nhân Viên (HRM)'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isIntangible 
                      ? <>Gán quyền sử dụng gói bản quyền / phần mềm <strong>{selectedAssetForModal.name}</strong> ({selectedAssetForModal.assetCode}) cho nhân viên.</>
                      : <>Cấp phát thiết bị <strong>{selectedAssetForModal.name}</strong> ({selectedAssetForModal.assetCode}) cho nhân viên chính thức từ HRM.</>}
                  </p>

                  <div className="space-y-3.5">
                    {/* Select Employee */}
                    <div>
                      <label className="text-xs font-bold text-slate-700">Chọn Cán Bộ Nhân Viên Tiếp Nhận (Dữ liệu từ HRM)</label>
                      <select
                        value={allocationFormData.employeeId}
                        onChange={e => setAllocationFormData({ ...allocationFormData, employeeId: e.target.value })}
                        className="w-full mt-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.id}) • {emp.department} - {emp.title || emp.position}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Selected employee preview card */}
                    {(() => {
                      const emp = employees.find(e => e.id === allocationFormData.employeeId) || employees[0];
                      if (!emp) return null;
                      return (
                        <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center gap-3">
                          {emp.avatar ? (
                            <img src={emp.avatar} alt={emp.name} className="w-10 h-10 rounded-full object-cover border border-emerald-300" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center text-xs">
                              {emp.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 text-xs">
                            <div className="font-bold text-slate-900">{emp.name} <span className="font-mono text-emerald-700">({emp.id})</span></div>
                            <div className="text-slate-600">{emp.title || emp.position} • {emp.department}</div>
                            <div className="text-slate-500 text-[11px] mt-0.5">SĐT: {emp.phone || 'Chưa cập nhật'} • Email: {emp.email}</div>
                          </div>
                        </div>
                      );
                    })()}

                    <div>
                      <label className="text-xs font-bold text-slate-700">
                        {isIntangible ? 'Môi Trường / Máy Tính Kích Hoạt Quyền Sử Dụng' : 'Địa Điểm Bàn Giao & Đặt Thiết Bị'}
                      </label>
                      <input
                        type="text"
                        value={allocationFormData.location}
                        onChange={e => setAllocationFormData({ ...allocationFormData, location: e.target.value })}
                        placeholder={isIntangible ? "Đám mây Tenant VComm / Laptop nhân sự" : "VComm Retail - Chi nhánh Q1, TP.HCM"}
                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700">
                        {isIntangible ? 'Trạng Thái Kích Hoạt & Cấp License Key' : 'Tình Trạng Thiết Bị Lúc Giao'}
                      </label>
                      <input
                        type="text"
                        value={allocationFormData.condition}
                        onChange={e => setAllocationFormData({ ...allocationFormData, condition: e.target.value })}
                        placeholder={isIntangible ? "Đã gán tài khoản công vụ, cấp mã bản quyền chính hãng" : "Mới 100%, nguyên tem niêm phong..."}
                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700">
                        {isIntangible ? 'Thông Tin Tài Khoản / License Key Kèm Theo' : 'Linh Kiện & Phụ Kiện Kèm Theo'}
                      </label>
                      <input
                        type="text"
                        value={allocationFormData.accessories}
                        onChange={e => setAllocationFormData({ ...allocationFormData, accessories: e.target.value })}
                        placeholder={isIntangible ? "License Key, hướng dẫn đăng nhập SSO, email xác thực" : "Cáp nguồn sạc, Adapter tiêu chuẩn, túi chống sốc"}
                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
                      />
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={handleAllocationSubmit}
                        className={cn(
                          "flex-1 py-2.5 text-white font-bold text-sm rounded-xl shadow-sm transition-all",
                          isIntangible ? "bg-purple-600 hover:bg-purple-700" : "bg-emerald-600 hover:bg-emerald-700"
                        )}
                      >
                        {isIntangible ? 'Xác Nhận Cấp Bản Quyền & Tạo Biên Bản A4' : 'Xác Nhận Cấp Phát & Tạo Biên Bản A4'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAllocationModalOpen(false)}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL 2: THU HỒI TÀI SẢN (RETURN MODAL) */}
      {isReturnModalOpen && selectedAssetForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsReturnModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5 text-rose-600" />
              Lập Phiếu Thu Hồi Thiết Bị Về Kho
            </h3>
            <p className="text-xs text-slate-500">
              Thu hồi thiết bị <strong>{selectedAssetForModal.name}</strong> ({selectedAssetForModal.assetCode}) từ nhân sự <strong>{selectedAssetForModal.assignedTo}</strong>.
            </p>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700">Lý Do Thu Hồi Thiết Bị</label>
                <input
                  type="text"
                  value={returnFormData.reason}
                  onChange={e => setReturnFormData({ ...returnFormData, reason: e.target.value })}
                  placeholder="Chuyển công tác / Kết thúc đợt sử dụng..."
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Tình Trạng Thực Tế Khi Thu Hồi</label>
                <input
                  type="text"
                  value={returnFormData.condition}
                  onChange={e => setReturnFormData({ ...returnFormData, condition: e.target.value })}
                  placeholder="Hoạt động tốt, máy trầy nhẹ..."
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Linh Kiện Thu Hồi Đầy Đủ</label>
                <input
                  type="text"
                  value={returnFormData.accessories}
                  onChange={e => setReturnFormData({ ...returnFormData, accessories: e.target.value })}
                  placeholder="Đầy đủ sạc, cáp nguồn..."
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Kho / Vị Trí Tiếp Nhận</label>
                <input
                  type="text"
                  value={returnFormData.location}
                  onChange={e => setReturnFormData({ ...returnFormData, location: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleReturnSubmit}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all"
                >
                  Xác Nhận Thu Hồi & In Biên Bản A4
                </button>
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: BÁO HỎNG & BẢO TRÌ (MAINTENANCE MODAL) */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsMaintenanceModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-500" />
              Lập Phiếu Báo Hỏng & Yêu Cầu Sửa Chữa
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700">Chọn Thiết Bị Báo Hỏng</label>
                <select
                  value={maintenanceFormData.assetId}
                  onChange={e => setMaintenanceFormData({ ...maintenanceFormData, assetId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
                >
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.assetCode}) • {a.currentLocation}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Người Báo Hỏng (Cán bộ nhân viên HRM)</label>
                <select
                  value={maintenanceFormData.reporterEmployeeId}
                  onChange={e => setMaintenanceFormData({ ...maintenanceFormData, reporterEmployeeId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.id}) • {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Mô Tả Triệu Chứng & Hư Hỏng</label>
                <textarea
                  rows={2}
                  value={maintenanceFormData.issueDescription}
                  onChange={e => setMaintenanceFormData({ ...maintenanceFormData, issueDescription: e.target.value })}
                  placeholder="Ví dụ: Kẹt giấy in, chập chờn nguồn, máy quét rơi nứt mặt kính..."
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Mức Độ Ưu Tiên</label>
                  <select
                    value={maintenanceFormData.priority}
                    onChange={e => setMaintenanceFormData({ ...maintenanceFormData, priority: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
                  >
                    <option value="LOW">Thấp</option>
                    <option value="MEDIUM">Bình thường</option>
                    <option value="HIGH">Cao</option>
                    <option value="URGENT">Khẩn cấp (P1)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Đơn Vị Xử Lý Sửa Chữa</label>
                  <select
                    value={maintenanceFormData.repairUnit}
                    onChange={e => setMaintenanceFormData({ ...maintenanceFormData, repairUnit: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
                  >
                    <option value="INTERNAL_IT">Tổ Kỹ Thuật Nội Bộ VComm</option>
                    <option value="EXTERNAL_VENDOR">Trung Tâm Bảo Hành Chính Hãng</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Dự Toán Chi Phí (VNĐ)</label>
                  <input
                    type="number"
                    value={maintenanceFormData.estimatedCost}
                    onChange={e => setMaintenanceFormData({ ...maintenanceFormData, estimatedCost: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Ngày Dự Kiến Hoàn Thành</label>
                  <input
                    type="date"
                    value={maintenanceFormData.expectedCompletionDate}
                    onChange={e => setMaintenanceFormData({ ...maintenanceFormData, expectedCompletionDate: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleMaintenanceSubmit}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl shadow-sm transition-all"
                >
                  Lưu Phiếu & Chuyển Trạng Thái Bảo Trì
                </button>
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: IN BIÊN BẢN BÀN GIAO / THU HỒI CHUẨN A4 */}
      {selectedHandoverDocForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 relative my-8 text-slate-800">
            <button
              onClick={() => setSelectedHandoverDocForPrint(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {(() => {
              const matchedAsset = assets.find(a => a.id === selectedHandoverDocForPrint.assetId);
              const isIntangible = (matchedAsset?.assetType || (matchedAsset ? CATEGORY_MAP[matchedAsset.category]?.type : undefined)) === 'INTANGIBLE';

              return (
                <div className="space-y-6 font-serif">
                  {/* Header */}
                  <div className="text-center space-y-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-700">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                    <div className="text-xs font-bold underline underline-offset-4 text-slate-700">Độc lập - Tự do - Hạnh phúc</div>
                    <div className="pt-4 text-xs font-bold text-slate-500 uppercase tracking-wider">CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐIỆN TỬ VCOMM</div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight pt-2 font-sans uppercase">
                      {selectedHandoverDocForPrint.type === 'HANDOVER' 
                        ? (isIntangible ? 'BIÊN BẢN BÀN GIAO QUYỀN SỬ DỤNG PHẦN MỀM & TÀI KHOẢN SỐ' : 'BIÊN BẢN BÀN GIAO TRANG THIẾT BỊ & CÔNG CỤ DỤNG CỤ')
                        : (isIntangible ? 'BIÊN BẢN THU HỒI TÀI KHOẢN SỐ & BẢN QUYỀN PHẦN MỀM' : 'BIÊN BẢN THU HỒI TÀI SẢN & THIẾT BỊ VẬN HÀNH')}
                    </h2>
                    <div className="text-xs text-slate-500 italic font-sans">
                      Số: <span className="font-mono font-bold text-slate-800">{selectedHandoverDocForPrint.docNumber}</span> • Ngày lập: {selectedHandoverDocForPrint.date}
                    </div>
                  </div>

                  {/* Legal Basis */}
                  <div className="text-xs text-slate-600 italic leading-relaxed">
                    - Căn cứ Quy chế Quản lý & Sử dụng Tài sản, Bản quyền Công nghệ ban hành theo Quyết định số 18/QĐ-VCOMM;<br />
                    - Căn cứ nhu cầu công tác và nhiệm vụ chuyên môn của Cán bộ Nhân viên.
                  </div>

                  {/* Parties */}
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="font-bold text-slate-900 uppercase">I. BÊN GIAO (Đại diện Ban Quản Trị Tài Sản VComm):</div>
                      <div className="grid grid-cols-2 gap-2 text-slate-700">
                        <div>• Họ và tên: <strong>{selectedHandoverDocForPrint.delivererName}</strong></div>
                        <div>• Chức danh: <strong>{selectedHandoverDocForPrint.delivererPosition}</strong></div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="font-bold text-slate-900 uppercase">II. BÊN TIẾP NHẬN (Cán bộ Nhân viên sử dụng):</div>
                      <div className="grid grid-cols-2 gap-2 text-slate-700">
                        <div>• Họ và tên: <strong>{selectedHandoverDocForPrint.employeeName}</strong></div>
                        <div>• Mã nhân viên: <strong>{selectedHandoverDocForPrint.employeeId}</strong></div>
                        <div>• Chức vụ: <strong>{selectedHandoverDocForPrint.employeePosition}</strong></div>
                        <div>• Phòng ban: <strong>{selectedHandoverDocForPrint.employeeDepartment}</strong></div>
                        <div>• SĐT liên hệ: <strong>{selectedHandoverDocForPrint.employeePhone || '090X.XXX.XXX'}</strong></div>
                        <div>• {isIntangible ? 'Môi trường kích hoạt' : 'Vị trí bàn giao'}: <strong>{selectedHandoverDocForPrint.location}</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Asset Details Table */}
                  <div className="space-y-2">
                    <div className="font-bold text-xs uppercase text-slate-900">
                      {isIntangible ? 'III. THÔNG TIN BẢN QUYỀN / TÀI KHOẢN BÀN GIAO:' : 'III. THÔNG TIN CHI TIẾT THIẾT BỊ BÀN GIAO:'}
                    </div>
                    <table className="w-full text-left text-xs border border-slate-300">
                      <thead className="bg-slate-100 font-bold border-b border-slate-300">
                        <tr>
                          <th className="p-2 border-r border-slate-300">STT</th>
                          <th className="p-2 border-r border-slate-300">{isIntangible ? 'Tên Phần Mềm / Bản Quyền' : 'Tên Tài Sản / Thiết Bị'}</th>
                          <th className="p-2 border-r border-slate-300">Mã Định Danh</th>
                          <th className="p-2 border-r border-slate-300">{isIntangible ? 'Mã License / Serial' : 'Serial Number'}</th>
                          <th className="p-2 border-r border-slate-300">Nguyên Giá</th>
                          <th className="p-2">{isIntangible ? 'Quyền Hạn / Trạng Thái' : 'Tình Trạng'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-2 border-r border-slate-300 text-center font-bold">01</td>
                          <td className="p-2 border-r border-slate-300 font-bold">{selectedHandoverDocForPrint.assetName}</td>
                          <td className="p-2 border-r border-slate-300 font-mono font-bold">{selectedHandoverDocForPrint.assetCode}</td>
                          <td className="p-2 border-r border-slate-300 font-mono">
                            {matchedAsset?.licenseKey || selectedHandoverDocForPrint.serialNumber}
                          </td>
                          <td className="p-2 border-r border-slate-300 font-bold text-slate-900">{formatCurrency(selectedHandoverDocForPrint.originalPrice)}</td>
                          <td className="p-2 text-slate-700">{selectedHandoverDocForPrint.condition}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Accessories & Terms */}
                  <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                    <div>• <strong>{isIntangible ? 'Tài liệu & Thông tin bàn giao kèm theo:' : 'Phụ kiện kèm theo:'}</strong> {selectedHandoverDocForPrint.accessories}</div>
                    {selectedHandoverDocForPrint.reason && (
                      <div>• <strong>Lý do:</strong> {selectedHandoverDocForPrint.reason}</div>
                    )}
                    <div>• <strong>Cam kết trách nhiệm:</strong> {isIntangible 
                      ? 'Bên nhận cam kết bảo mật tuyệt đối tài khoản công vụ, License Key, không tự ý chuyển nhượng, chia sẻ cho bên thứ ba, chấp hành nghiêm túc quy định bảo vệ bí mật dữ liệu và an toàn an ninh mạng của Công ty.' 
                      : 'Bên nhận có trách nhiệm bảo quản tài sản được cấp phát, sử dụng đúng mục đích công việc của Công ty, không tự ý tháo lắp, cho mượn hoặc chuyển giao cho người khác khi chưa có phê duyệt bằng văn bản.'}
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-2 pt-6 text-center text-xs">
                    <div className="space-y-14">
                      <div>
                        <div className="font-bold uppercase text-slate-900">ĐẠI DIỆN BÊN GIAO</div>
                        <div className="text-[11px] text-slate-500 italic">(Ký, ghi rõ họ tên)</div>
                      </div>
                      <div className="font-bold text-slate-900">{selectedHandoverDocForPrint.delivererName}</div>
                    </div>

                    <div className="space-y-14">
                      <div>
                        <div className="font-bold uppercase text-slate-900">CÁN BỘ TIẾP NHẬN</div>
                        <div className="text-[11px] text-slate-500 italic">(Ký, ghi rõ họ tên)</div>
                      </div>
                      <div className="font-bold text-slate-900">{selectedHandoverDocForPrint.employeeName}</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Print Action Buttons */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex gap-2 justify-end print:hidden">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                In Biên Bản Khổ A4
              </button>
              <button
                onClick={() => setSelectedHandoverDocForPrint(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: IN BIÊN BẢN KIỂM KÊ A4 (MẪU SỐ 05-TSCĐ) */}
      {selectedAuditBatchForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-8 shadow-2xl border border-slate-200 relative my-8 text-slate-800">
            <button
              onClick={() => setSelectedAuditBatchForPrint(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* A4 Audit Document Content */}
            <div className="space-y-6 font-serif">
              {/* Header */}
              <div className="flex justify-between items-start text-xs border-b border-slate-200 pb-4">
                <div>
                  <div className="font-bold uppercase text-slate-900">CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐIỆN TỬ VCOMM</div>
                  <div className="text-slate-500">Phòng Kế Toán Tài Chính & Ban Quản Trị Tài Sản</div>
                  <div className="text-slate-500">Địa chỉ: Tòa Keangnam Landmark 72, Cầu Giấy, Hà Nội</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">Mẫu số 05 - TSCĐ</div>
                  <div className="text-slate-500 text-[11px] italic">(Ban hành theo Thông tư số 200/2014/TT-BTC</div>
                  <div className="text-slate-500 text-[11px] italic">ngày 22/12/2014 của Bộ Tài chính)</div>
                </div>
              </div>

              <div className="text-center space-y-1">
                <h2 className="text-lg font-black text-slate-900 tracking-tight font-sans uppercase">
                  BIÊN BẢN KIỂM KÊ TÀI SẢN CỐ ĐỊNH & CÔNG CỤ DỤNG CỤ
                </h2>
                <div className="text-xs text-slate-600 italic">
                  Thời điểm kiểm kê: 00 giờ ngày {selectedAuditBatchForPrint.endDate} • Mã đợt: <span className="font-mono font-bold text-slate-800">{selectedAuditBatchForPrint.batchCode}</span>
                </div>
                <div className="text-xs text-slate-600 italic">
                  Địa điểm kiểm kê: <strong>{selectedAuditBatchForPrint.location}</strong>
                </div>
              </div>

              {/* Committee Members */}
              <div className="text-xs space-y-1 leading-relaxed">
                <div>Ban kiểm kê gồm có:</div>
                <div className="grid grid-cols-2 gap-2 pl-3">
                  <div>1. Ông/Bà: <strong>{selectedAuditBatchForPrint.leadAuditorName}</strong> - Chức vụ: {selectedAuditBatchForPrint.leadAuditorTitle} (Trưởng ban)</div>
                  <div>2. Ông/Bà: <strong>Nguyễn Thị Thu</strong> - Chức vụ: Kế toán TSCĐ (Thành viên)</div>
                  <div>3. Ông/Bà: <strong>Trần Văn Mạnh</strong> - Chức vụ: Thủ kho & Điều phối (Thành viên)</div>
                  <div>4. Ông/Bà: <strong>Phạm Minh Đức</strong> - Chức vụ: Kỹ sư CNTT Vận Hành (Thành viên)</div>
                </div>
              </div>

              {/* Audit Comparison Table */}
              <div className="space-y-2">
                <div className="font-bold text-xs uppercase text-slate-900">KẾT QUẢ KIỂM KÊ TÀI SẢN CHI TIẾT:</div>
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 font-bold border-b border-slate-300 text-center">
                    <tr>
                      <th rowSpan={2} className="p-2 border-r border-slate-300">STT</th>
                      <th rowSpan={2} className="p-2 border-r border-slate-300">Mã TS</th>
                      <th rowSpan={2} className="p-2 border-r border-slate-300">Tên Tài Sản Cố Định / CCDC</th>
                      <th colSpan={2} className="p-2 border-r border-slate-300 border-b">Theo Sổ Kế Toán</th>
                      <th colSpan={2} className="p-2 border-r border-slate-300 border-b">Kiểm Kê Thực Tế</th>
                      <th colSpan={2} className="p-2 border-b">Chênh Lệch</th>
                    </tr>
                    <tr>
                      <th className="p-1 border-r border-slate-300">SL</th>
                      <th className="p-1 border-r border-slate-300">Nguyên Giá</th>
                      <th className="p-1 border-r border-slate-300">SL</th>
                      <th className="p-1 border-r border-slate-300">Tình Trạng</th>
                      <th className="p-1 border-r border-slate-300">Thừa</th>
                      <th className="p-1">Thiếu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {selectedAuditBatchForPrint.items.map((item, idx) => {
                      const asset = assets.find(a => a.id === item.assetId);
                      return (
                        <tr key={idx}>
                          <td className="p-2 border-r border-slate-300 text-center">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-300 font-mono font-bold">{item.assetCode}</td>
                          <td className="p-2 border-r border-slate-300 font-bold">{item.assetName}</td>
                          <td className="p-2 border-r border-slate-300 text-center">{item.bookQty}</td>
                          <td className="p-2 border-r border-slate-300 text-right">{formatCurrency(asset?.originalPrice || 0)}</td>
                          <td className="p-2 border-r border-slate-300 text-center font-bold text-emerald-700">{item.actualQty}</td>
                          <td className="p-2 border-r border-slate-300 text-slate-700">
                            {item.condition === 'GOOD' ? 'Tốt 100%' : 'Cần sửa chữa'}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center">-</td>
                          <td className="p-2 text-center">-</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Conclusion */}
              <div className="space-y-1.5 text-xs text-slate-700 leading-relaxed border-t border-slate-200 pt-3">
                <div>• <strong>Đánh giá kết luận của Ban kiểm kê:</strong> Toàn bộ {selectedAuditBatchForPrint.totalAssets} tài sản đều được đối chiếu khớp số lượng với Sổ TSCĐ Kế toán, không có hiện tượng mất mát, thất thoát. Tem mã QR quản lý được dán đúng quy định.</div>
                <div>• <strong>Kiến nghị xử lý:</strong> Đề nghị phòng Kỹ thuật khẩn trương hoàn thành sửa chữa thiết bị theo đúng tiến độ để đưa về dự phòng.</div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 pt-8 text-center text-xs">
                <div className="space-y-14">
                  <div>
                    <div className="font-bold uppercase text-slate-900">TRƯỞNG BAN KIỂM KÊ</div>
                    <div className="text-[11px] text-slate-500 italic">(Ký, họ tên)</div>
                  </div>
                  <div className="font-bold text-slate-900">{selectedAuditBatchForPrint.leadAuditorName}</div>
                </div>

                <div className="space-y-14">
                  <div>
                    <div className="font-bold uppercase text-slate-900">KẾ TOÁN TRƯỞNG</div>
                    <div className="text-[11px] text-slate-500 italic">(Ký, họ tên)</div>
                  </div>
                  <div className="font-bold text-slate-900">Nguyễn Thị Thu</div>
                </div>

                <div className="space-y-14">
                  <div>
                    <div className="font-bold uppercase text-slate-900">GIÁM ĐỐC DOANH NGHIỆP</div>
                    <div className="text-[11px] text-slate-500 italic">(Ký, đóng dấu)</div>
                  </div>
                  <div className="font-bold text-slate-900">Nguyễn Văn An</div>
                </div>
              </div>
            </div>

            {/* Print Buttons */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex gap-2 justify-end print:hidden">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                In Biên Bản Khổ A4 (Mẫu 05-TSCĐ)
              </button>
              <button
                onClick={() => setSelectedAuditBatchForPrint(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW ASSET MODAL */}
      {isNewAssetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200 my-8">
            <button
              onClick={() => setIsNewAssetModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                Khai Báo Tài Sản Mới
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Đăng ký tài sản hữu hình (thiết bị) hoặc tài sản vô hình (bản quyền Windows, phần mềm SaaS, email, tên miền).
              </p>
            </div>

            {/* Classification Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setNewAssetData({
                  ...newAssetData,
                  assetType: 'TANGIBLE',
                  category: 'POS_TERMINAL',
                  depreciationMonths: 36,
                  currentLocation: 'Kho tổng VComm FBL'
                })}
                className={cn(
                  "py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                  newAssetData.assetType === 'TANGIBLE'
                    ? "bg-white text-blue-700 shadow-sm border border-blue-100"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Laptop className="w-4 h-4 text-blue-600" />
                Tài Sản Hữu Hình (Thiết Bị)
              </button>
              <button
                type="button"
                onClick={() => setNewAssetData({
                  ...newAssetData,
                  assetType: 'INTANGIBLE',
                  category: 'SOFTWARE_SAAS',
                  depreciationMonths: 12,
                  currentLocation: 'VComm Cloud & Tenant',
                  licenseType: 'SUBSCRIPTION',
                  seatsCount: 1
                })}
                className={cn(
                  "py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                  newAssetData.assetType === 'INTANGIBLE'
                    ? "bg-white text-purple-700 shadow-sm border border-purple-100"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Key className="w-4 h-4 text-purple-600" />
                Tài Sản Vô Hình (Bản Quyền/Số)
              </button>
            </div>

            <div className="space-y-3 pt-1">
              {/* Asset Name */}
              <div>
                <label className="text-xs font-bold text-slate-700">
                  {newAssetData.assetType === 'INTANGIBLE' ? 'Tên Bản Quyền / Phần Mềm / Dịch Vụ Số' : 'Tên Trang Thiết Bị / CCDC'}
                </label>
                <input
                  type="text"
                  placeholder={newAssetData.assetType === 'INTANGIBLE' ? 'Ví dụ: Microsoft 365 E3 (100 Seats) hoặc Bản Quyền Windows 11 Pro' : 'Ví dụ: Máy in nhiệt K80 Xprinter XP-Q200'}
                  value={newAssetData.name || ''}
                  onChange={e => setNewAssetData({ ...newAssetData, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Category & Identifier/License Key */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">
                    {newAssetData.assetType === 'INTANGIBLE' ? 'Nhóm Tài Sản Số' : 'Nhóm Trang Thiết Bị'}
                  </label>
                  <select
                    value={newAssetData.category}
                    onChange={e => setNewAssetData({ ...newAssetData, category: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
                  >
                    {Object.entries(CATEGORY_MAP)
                      .filter(([_, cat]) => cat.type === (newAssetData.assetType || 'TANGIBLE'))
                      .map(([key, cat]) => (
                        <option key={key} value={key}>{cat.label}</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">
                    {newAssetData.assetType === 'INTANGIBLE' ? 'License Key / Mã Bản Quyền' : 'Serial Number'}
                  </label>
                  <input
                    type="text"
                    placeholder={newAssetData.assetType === 'INTANGIBLE' ? 'M365-ENT-TENANT-XXXX' : 'SN-XXXX-123'}
                    value={newAssetData.assetType === 'INTANGIBLE' ? (newAssetData.licenseKey || '') : (newAssetData.serialNumber || '')}
                    onChange={e => {
                      if (newAssetData.assetType === 'INTANGIBLE') {
                        setNewAssetData({ ...newAssetData, licenseKey: e.target.value, serialNumber: e.target.value });
                      } else {
                        setNewAssetData({ ...newAssetData, serialNumber: e.target.value });
                      }
                    }}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Intangible Specific Fields */}
              {newAssetData.assetType === 'INTANGIBLE' && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700">Loại Bản Quyền</label>
                      <select
                        value={newAssetData.licenseType || 'SUBSCRIPTION'}
                        onChange={e => setNewAssetData({ ...newAssetData, licenseType: e.target.value as any })}
                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                      >
                        <option value="SUBSCRIPTION">Thuê bao (SaaS định kỳ)</option>
                        <option value="PERPETUAL">Vĩnh viễn (Perpetual)</option>
                        <option value="OPEN_SOURCE">Mã nguồn mở / Tự do</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700">Ngày Hết Hạn / Tái Tục</label>
                      <input
                        type="date"
                        value={newAssetData.expiryDate || ''}
                        onChange={e => setNewAssetData({ ...newAssetData, expiryDate: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700">Số Seats / User Cấp Phép</label>
                      <input
                        type="number"
                        placeholder="1"
                        value={newAssetData.seatsCount || ''}
                        onChange={e => setNewAssetData({ ...newAssetData, seatsCount: Number(e.target.value) })}
                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700">Email Quản Trị / Email Gán</label>
                      <input
                        type="email"
                        placeholder="admin@vcomm.vn"
                        value={newAssetData.assignedEmail || ''}
                        onChange={e => setNewAssetData({ ...newAssetData, assignedEmail: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700">Nhà Cung Cấp / Đối Tác</label>
                      <input
                        type="text"
                        placeholder="Microsoft / FPT Cloud, Google..."
                        value={newAssetData.vendorOrProvider || ''}
                        onChange={e => setNewAssetData({ ...newAssetData, vendorOrProvider: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Price & Depreciation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">
                    {newAssetData.assetType === 'INTANGIBLE' ? 'Nguyên Giá Mua Bản Quyền (VNĐ)' : 'Nguyên Giá Thiết Bị (VNĐ)'}
                  </label>
                  <input
                    type="number"
                    placeholder="12000000"
                    value={newAssetData.originalPrice || ''}
                    onChange={e => setNewAssetData({ ...newAssetData, originalPrice: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">
                    {newAssetData.assetType === 'INTANGIBLE' ? 'Chu Kỳ Phân Bổ TK 2143 (Tháng)' : 'Khấu Hao TT45 TK 2141 (Tháng)'}
                  </label>
                  <input
                    type="number"
                    value={newAssetData.depreciationMonths}
                    onChange={e => setNewAssetData({ ...newAssetData, depreciationMonths: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
                  />
                </div>
              </div>

              {/* Location or Cloud Platform */}
              <div>
                <label className="text-xs font-bold text-slate-700">
                  {newAssetData.assetType === 'INTANGIBLE' ? 'Môi Trường Đám Mây / Tenant Vận Hành' : 'Vị Trí Lưu Kho / Lắp Đặt'}
                </label>
                <input
                  type="text"
                  value={newAssetData.currentLocation || ''}
                  onChange={e => setNewAssetData({ ...newAssetData, currentLocation: e.target.value })}
                  placeholder={newAssetData.assetType === 'INTANGIBLE' ? 'Google Workspace Cloud Tenant / Azure Active Directory' : 'Kho tổng VComm FBL'}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700">Ghi Chú Kỹ Thuật / Số Hợp Đồng</label>
                <input
                  type="text"
                  value={newAssetData.notes || ''}
                  onChange={e => setNewAssetData({ ...newAssetData, notes: e.target.value })}
                  placeholder="Hợp đồng số HD-2026-..., phạm vi áp dụng cho toàn công ty..."
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateAsset}
                  className={cn(
                    "flex-1 py-2.5 text-white font-bold text-sm rounded-xl shadow-sm transition-colors",
                    newAssetData.assetType === 'INTANGIBLE'
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  )}
                >
                  {newAssetData.assetType === 'INTANGIBLE' ? 'Lưu Bản Quyền & Cấp Mã TS Vô Hình' : 'Lưu & Cấp Mã Định Danh Barcode/QR'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewAssetModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
