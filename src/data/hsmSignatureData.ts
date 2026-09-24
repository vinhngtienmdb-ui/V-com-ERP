// Data structures and mock data for Corporate Cloud HSM and Personal Certificates

export interface CompanyHSMProfile {
  provider: 'Viettel-CA' | 'VNPT-CA' | 'VComm-eSign' | 'FPT-CA' | 'Bkav-eSign';
  hsmType: 'Cloud HSM' | 'Appliance HSM (Dedicated)';
  companyName: string;
  taxCode: string;
  serialNumber: string;
  subjectDN: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  fipsStandard: string; // e.g. 'FIPS 140-2 Level 3'
  status: 'connected' | 'disconnected' | 'warning' | 'expired';
  slotId: string;
  tokenLabel: string;
  remainingSignatures: number;
  totalSignaturesQuota: number;
  tpsSpeed: number; // Transactions Per Second
  serverEndpoint: string;
  autoSignRules: {
    invoices: boolean; // Auto-sign E-Invoices on delivery
    warehouseReceipts: boolean; // Auto-sign internal stock transfer notes
    taxDeclarations: boolean; // Auto-sign monthly tax reports
    reconciliations: boolean; // Auto-sign 3PL COD reconciliation notes
  };
}

export interface PersonalCertificate {
  id: string;
  staffCode: string;
  fullName: string;
  email: string;
  department: string;
  title: string;
  role: string;
  serialNumber: string;
  certType: 'executive' | 'accounting_warehouse' | 'staff_internal';
  algorithm: 'RSA 2048-bit' | 'ECC P-256' | 'SmartCA Cloud';
  status: 'active' | 'suspended' | 'revoked' | 'expired';
  signingLimitVND: number; // 0 = unlimited, otherwise max amount allowed to sign
  issuedDate: string;
  expiryDate: string;
  pinCodeMasked: string; // e.g. '••••••'
  signatureAppearance?: {
    type: 'drawn' | 'uploaded' | 'stamp';
    previewUrl: string;
    hasStamp: boolean;
  };
  revocationReason?: string;
}

export interface SigningDocument {
  id: string;
  docCode: string;
  title: string;
  docType: 'contract' | 'request' | 'invoice' | 'warehouse' | 'decision';
  requestedBy: string;
  department: string;
  createdDate: string;
  amount?: number;
  status: 'pending' | 'signed' | 'rejected';
  signatureTypeNeeded: 'company_hsm' | 'personal_cert' | 'both';
  signedBy?: {
    name: string;
    certSerial: string;
    signedAt: string;
    method: string;
    hashSHA256: string;
  };
  fileSize: string;
  totalPages: number;
}

export interface SigningAuthorityRule {
  roleName: string;
  department: string;
  documentTypes: string[];
  maxLimitVND: number; // 0 = Không giới hạn
  requiredSignType: 'Ký nháy' | 'Ký số Cá nhân' | 'Ký số HSM Doanh nghiệp';
  description: string;
}

export interface HSMAuditLog {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  certSerial: string;
  targetDocCode: string;
  algorithm: string;
  hashSHA256: string;
  ipAddress: string;
  status: 'success' | 'failed' | 'warning';
}

// Initial Company HSM Profile
export const INITIAL_COMPANY_HSM: CompanyHSMProfile = {
  provider: 'Viettel-CA',
  hsmType: 'Cloud HSM',
  companyName: 'CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐIỆN TỬ VCOMM',
  taxCode: '0318914439',
  serialNumber: '54:02:4B:9A:88:12:F3:01:C9:82',
  subjectDN: 'CN=CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐIỆN TỬ VCOMM, O=VCOMM CORP, L=Quận 1, ST=TP. Hồ Chí Minh, C=VN',
  issuer: 'Viettel-CA Cloud HSM Root Authority (Bộ TT&TT cấp phép)',
  validFrom: '15/08/2023',
  validTo: '15/08/2026',
  daysRemaining: 698,
  fipsStandard: 'FIPS 140-2 Level 3 / eIDAS Compliant',
  status: 'connected',
  slotId: 'SLOT-VCOMM-PROD-01',
  tokenLabel: 'VCOMM_CORPORATE_KEY',
  remainingSignatures: 14250,
  totalSignaturesQuota: 20000,
  tpsSpeed: 120,
  serverEndpoint: 'hsm-cluster.viettel-ca.vn:8443/vcomm-core',
  autoSignRules: {
    invoices: true,
    warehouseReceipts: true,
    taxDeclarations: false,
    reconciliations: true
  }
};

// Initial Personal Certificates within VComm
export const INITIAL_PERSONAL_CERTS: PersonalCertificate[] = [
  {
    id: 'CERT-001',
    staffCode: 'EMP-0001',
    fullName: 'Nguyễn Tiến Vĩnh',
    email: 'vinh.nguyen@vcomm.vn',
    department: 'Ban Giám Đốc',
    title: 'Tổng Giám đốc / Đại diện Pháp luật',
    role: 'Người đại diện pháp nhân',
    serialNumber: '7A:31:09:FE:44:88:91:AA',
    certType: 'executive',
    algorithm: 'SmartCA Cloud',
    status: 'active',
    signingLimitVND: 0, // Không giới hạn
    issuedDate: '15/08/2023',
    expiryDate: '15/08/2026',
    pinCodeMasked: '••••••',
    signatureAppearance: {
      type: 'stamp',
      previewUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200',
      hasStamp: true
    }
  },
  {
    id: 'CERT-002',
    staffCode: 'EMP-0002',
    fullName: 'Trần Thị Mai',
    email: 'mai.tran@vcomm.vn',
    department: 'Tài chính - Kế toán',
    title: 'Kế toán trưởng (TT99)',
    role: 'Kế toán trưởng',
    serialNumber: '8B:42:11:CD:55:99:02:BB',
    certType: 'accounting_warehouse',
    algorithm: 'RSA 2048-bit',
    status: 'active',
    signingLimitVND: 500000000, // 500 triệu
    issuedDate: '01/01/2024',
    expiryDate: '01/01/2027',
    pinCodeMasked: '••••••',
    signatureAppearance: {
      type: 'drawn',
      previewUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200',
      hasStamp: true
    }
  },
  {
    id: 'CERT-003',
    staffCode: 'EMP-0003',
    fullName: 'Lê Thu Quỳnh',
    email: 'quynh.lt@vcomm.vn',
    department: 'Quản trị Nhân sự',
    title: 'Trưởng phòng Nhân sự HRM',
    role: 'Ký Hợp đồng lao động',
    serialNumber: '9C:53:22:DE:66:00:13:CC',
    certType: 'executive',
    algorithm: 'RSA 2048-bit',
    status: 'active',
    signingLimitVND: 100000000, // 100 triệu
    issuedDate: '15/03/2024',
    expiryDate: '15/03/2027',
    pinCodeMasked: '••••••',
    signatureAppearance: {
      type: 'uploaded',
      previewUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200',
      hasStamp: false
    }
  },
  {
    id: 'CERT-004',
    staffCode: 'EMP-0004',
    fullName: 'Phạm Minh Hoàng',
    email: 'hoang.pm@vcomm.vn',
    department: 'Vận hành Sàn & Kho FBL',
    title: 'Quản lý Kho Tổng Tân Bình',
    role: 'Ký phiếu nhập/xuất kho',
    serialNumber: '1D:64:33:EF:77:11:24:DD',
    certType: 'accounting_warehouse',
    algorithm: 'ECC P-256',
    status: 'active',
    signingLimitVND: 50000000, // 50 triệu
    issuedDate: '10/06/2024',
    expiryDate: '10/06/2027',
    pinCodeMasked: '••••••'
  },
  {
    id: 'CERT-005',
    staffCode: 'EMP-0005',
    fullName: 'Nguyễn Thị Kim Anh',
    email: 'anh.ntk@vcomm.vn',
    department: 'Chăm sóc Khách hàng',
    title: 'Trưởng nhóm CSKH & Đối soát',
    role: 'Ký duyệt hoàn tiền V-Xu',
    serialNumber: '2E:75:44:FA:88:22:35:EE',
    certType: 'staff_internal',
    algorithm: 'RSA 2048-bit',
    status: 'suspended',
    signingLimitVND: 20000000, // 20 triệu
    issuedDate: '01/08/2024',
    expiryDate: '01/08/2025',
    pinCodeMasked: '••••••',
    revocationReason: 'Đang nghỉ thai sản 6 tháng - Tạm khóa phòng ngừa rủi ro'
  }
];

// Initial Signing Documents
export const INITIAL_SIGNING_DOCUMENTS: SigningDocument[] = [
  {
    id: 'DOC-001',
    docCode: 'HDLD-2026-0042',
    title: 'Hợp đồng lao động xác định thời hạn 2 năm - Trần Minh Đức',
    docType: 'contract',
    requestedBy: 'Lê Thu Quỳnh (HR)',
    department: 'Quản trị Nhân sự',
    createdDate: '17/09/2026',
    status: 'pending',
    signatureTypeNeeded: 'both',
    fileSize: '1.4 MB',
    totalPages: 5
  },
  {
    id: 'DOC-002',
    docCode: 'DNTC-2026-0118',
    title: 'Đề nghị thanh toán chi phí Hosting Cloud & AI Server tháng 09',
    docType: 'request',
    requestedBy: 'Phạm Thị D (IT)',
    department: 'Công nghệ Thông tin',
    createdDate: '16/09/2026',
    amount: 145000000,
    status: 'pending',
    signatureTypeNeeded: 'personal_cert',
    fileSize: '850 KB',
    totalPages: 3
  },
  {
    id: 'DOC-003',
    docCode: 'PXK-2026-9812',
    title: 'Phiếu xuất kho kiêm vận chuyển nội bộ 50 máy in đơn A6 sang Chi nhánh HN',
    docType: 'warehouse',
    requestedBy: 'Phạm Minh Hoàng (Kho)',
    department: 'Kho vận & Vận hành',
    createdDate: '16/09/2026',
    amount: 85000000,
    status: 'signed',
    signatureTypeNeeded: 'company_hsm',
    signedBy: {
      name: 'Viettel Cloud HSM (CÔNG TY CP TMĐT VCOMM)',
      certSerial: '54:02:4B:9A:88:12:F3:01:C9:82',
      signedAt: '16/09/2026 14:32:10',
      method: 'Auto Cloud HSM Sign',
      hashSHA256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    },
    fileSize: '620 KB',
    totalPages: 2
  },
  {
    id: 'DOC-004',
    docCode: 'HDMB-2026-0039',
    title: 'Hợp đồng hợp tác nhà bán hàng B2B - Công ty TNHH Thời Trang EcoVibe',
    docType: 'contract',
    requestedBy: 'Nguyễn Văn A (Kinh doanh)',
    department: 'Kinh doanh & Bán lẻ',
    createdDate: '15/09/2026',
    amount: 680000000,
    status: 'signed',
    signatureTypeNeeded: 'both',
    signedBy: {
      name: 'Nguyễn Tiến Vĩnh (Tổng Giám đốc)',
      certSerial: '7A:31:09:FE:44:88:91:AA',
      signedAt: '15/09/2026 16:15:42',
      method: 'SmartCA Remote Signing',
      hashSHA256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
    },
    fileSize: '3.2 MB',
    totalPages: 12
  }
];

// Initial Signing Authority Matrix Rules
export const INITIAL_AUTHORITY_RULES: SigningAuthorityRule[] = [
  {
    roleName: 'Tổng Giám đốc (CEO)',
    department: 'Ban Giám Đốc',
    documentTypes: ['Hợp đồng kinh tế lớn', 'Quyết định bổ nhiệm', 'Báo cáo tài chính năm'],
    maxLimitVND: 0,
    requiredSignType: 'Ký số HSM Doanh nghiệp',
    description: 'Toàn quyền ký pháp nhân thay mặt công ty không giới hạn số tiền'
  },
  {
    roleName: 'Kế toán trưởng',
    department: 'Tài chính - Kế toán',
    documentTypes: ['Hóa đơn điện tử', 'Lệnh chi ngân hàng VietQR', 'Đối soát công nợ', 'Báo cáo thuế'],
    maxLimitVND: 500000000,
    requiredSignType: 'Ký số Cá nhân',
    description: 'Ký duyệt chứng từ kế toán, ngân sách đến 500 triệu đồng'
  },
  {
    roleName: 'Trưởng phòng Nhân sự',
    department: 'Quản trị Nhân sự',
    documentTypes: ['Hợp đồng lao động', 'Quyết định tăng lương', 'Khen thưởng / Kỷ luật'],
    maxLimitVND: 100000000,
    requiredSignType: 'Ký số Cá nhân',
    description: 'Ký duyệt hồ sơ nhân sự và ngân sách đào tạo phúc lợi đến 100 triệu'
  },
  {
    roleName: 'Quản lý Kho Tổng',
    department: 'Kho vận & Vận hành',
    documentTypes: ['Phiếu nhập kho PO', 'Phiếu xuất kho điều chuyển', 'Biên bản kiểm kê'],
    maxLimitVND: 50000000,
    requiredSignType: 'Ký số Cá nhân',
    description: 'Ký xác nhận xuất nhập hàng hóa và điều chuyển kho nội bộ đến 50 triệu'
  }
];

// Initial HSM Audit Trail Logs
export const INITIAL_HSM_LOGS: HSMAuditLog[] = [
  {
    id: 'LOG-001',
    timestamp: '17/09/2026 16:45:12',
    action: 'Ký số HSM thành công Hóa đơn điện tử #1C26TBB-0004921',
    performedBy: 'Hệ thống Ký tự động (Auto-sign HSM)',
    certSerial: '54:02:4B:9A:88:12:F3:01:C9:82',
    targetDocCode: 'INV-2026-4921',
    algorithm: 'RSA-SHA256',
    hashSHA256: 'c7be8a96e625514f76269229f635ff5e0466eef4c99551a37c9597b83f3e2b10',
    ipAddress: '10.0.0.12 (Internal Microservice Cluster)',
    status: 'success'
  },
  {
    id: 'LOG-002',
    timestamp: '17/09/2026 15:20:05',
    action: 'Cấp phát Chứng thư số cá nhân mới cho nhân sự EMP-0006',
    performedBy: 'Nguyễn Tiến Vĩnh (Super Admin)',
    certSerial: '3F:86:55:0B:99:33:46:FF',
    targetDocCode: 'STAFF-CERT-0006',
    algorithm: 'RSA 2048-bit',
    hashSHA256: '389b3f07a4a821e25e9e03d4ccbe0c58e5792946c59239857dd8d0cc497475f8',
    ipAddress: '118.69.182.10 (Office SG)',
    status: 'success'
  },
  {
    id: 'LOG-003',
    timestamp: '16/09/2026 14:32:10',
    action: 'Ký số Phiếu xuất kho #PXK-2026-9812 thành công',
    performedBy: 'Viettel Cloud HSM (Phạm Minh Hoàng)',
    certSerial: '54:02:4B:9A:88:12:F3:01:C9:82',
    targetDocCode: 'PXK-2026-9812',
    algorithm: 'RSA-SHA256',
    hashSHA256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    ipAddress: '14.161.22.8 (Warehouse HCM)',
    status: 'success'
  },
  {
    id: 'LOG-004',
    timestamp: '15/09/2026 16:15:42',
    action: 'Ký số từ xa SmartCA Hợp đồng B2B #HDMB-2026-0039',
    performedBy: 'Nguyễn Tiến Vĩnh (Tổng Giám đốc)',
    certSerial: '7A:31:09:FE:44:88:91:AA',
    targetDocCode: 'HDMB-2026-0039',
    algorithm: 'RSA-SHA256',
    hashSHA256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    ipAddress: '118.69.182.10 (iOS SmartCA App)',
    status: 'success'
  }
];
