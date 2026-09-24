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

export interface X509CertificateDetails {
  subjectCN: string;
  subjectOrg: string;
  subjectTaxCode?: string;
  subjectEmail?: string;
  subjectCountry: string;
  issuerCN: string;
  issuerOrg: string;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  status: 'valid' | 'warning' | 'expired' | 'revoked';
  serialNumber: string;
  publicKeyAlgorithm: string;
  keySize: string;
  signatureAlgorithm: string;
  sha1Fingerprint: string;
  sha256Fingerprint: string;
  keyUsage: string[];
  ocspStatus: string;
  crlDistributionPoint: string;
  trustChain: {
    level: number;
    name: string;
    type: 'root_ca' | 'intermediate_ca' | 'leaf';
    issuer: string;
    validTo: string;
    status: 'valid' | 'expired';
  }[];
}

export interface SigningDocument {
  id: string;
  docCode: string;
  title: string;
  docType: 'contract' | 'request' | 'invoice' | 'warehouse' | 'decision';
  category: 'contract' | 'e_invoice' | 'warehouse_slip' | 'request' | 'tax_report' | 'internal_decision';
  requestedBy: string;
  department: string;
  createdDate: string;
  amount?: number;
  priority?: 'urgent' | 'high' | 'normal';
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
  pagesContent?: {
    pageNumber: number;
    title: string;
    paragraphs: string[];
  }[];
  stampPosition?: {
    page: number;
    x: number;
    y: number;
    stampType: 'company_stamp' | 'personal_signature' | 'badge_eidas';
  };
  isBatchEligible?: boolean;
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

// Pure synchronous SHA-256 implementation (Zero dependencies, works in Node, Vitest and Browser)
export function sha256Sync(input: string): string {
  const utf8: number[] = [];
  for (let i = 0; i < input.length; i++) {
    let charcode = input.charCodeAt(i);
    if (charcode < 0x80) utf8.push(charcode);
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      i++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (input.charCodeAt(i) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }

  const bitLength = utf8.length * 8;
  utf8.push(0x80);
  while (utf8.length % 64 !== 56) {
    utf8.push(0);
  }
  for (let i = 7; i >= 0; i--) {
    utf8.push(Math.floor(bitLength / Math.pow(256, i)) & 0xff);
  }

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let H0 = 0x6a09e667;
  let H1 = 0xbb67ae85;
  let H2 = 0x3c6ef372;
  let H3 = 0xa54ff53a;
  let H4 = 0x510e527f;
  let H5 = 0x9b05688c;
  let H6 = 0x1f83d9ab;
  let H7 = 0x5be0cd19;

  const rightRotate = (v: number, n: number) => (v >>> n) | (v << (32 - n));

  for (let chunk = 0; chunk < utf8.length; chunk += 64) {
    const W: number[] = new Array(64);
    for (let t = 0; t < 16; t++) {
      const idx = chunk + t * 4;
      W[t] = ((utf8[idx] << 24) | (utf8[idx + 1] << 16) | (utf8[idx + 2] << 8) | utf8[idx + 3]) >>> 0;
    }
    for (let t = 16; t < 64; t++) {
      const s0 = rightRotate(W[t - 15], 7) ^ rightRotate(W[t - 15], 18) ^ (W[t - 15] >>> 3);
      const s1 = rightRotate(W[t - 2], 17) ^ rightRotate(W[t - 2], 19) ^ (W[t - 2] >>> 10);
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
    }

    let a = H0;
    let b = H1;
    let c = H2;
    let d = H3;
    let e = H4;
    let f = H5;
    let g = H6;
    let h = H7;

    for (let t = 0; t < 64; t++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[t] + W[t]) >>> 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    H0 = (H0 + a) >>> 0;
    H1 = (H1 + b) >>> 0;
    H2 = (H2 + c) >>> 0;
    H3 = (H3 + d) >>> 0;
    H4 = (H4 + e) >>> 0;
    H5 = (H5 + f) >>> 0;
    H6 = (H6 + g) >>> 0;
    H7 = (H7 + h) >>> 0;
  }

  const toHex = (n: number) => ('00000000' + n.toString(16)).slice(-8);
  return (toHex(H0) + toHex(H1) + toHex(H2) + toHex(H3) + toHex(H4) + toHex(H5) + toHex(H6) + toHex(H7)).toLowerCase();
}

/**
 * Calculates deterministic cryptographic SHA-256 hash for document content and integrity checking
 */
export function calculateDocumentHashSHA256(doc: SigningDocument, pinOrSecret?: string): string {
  const payload = JSON.stringify({
    id: doc.id,
    docCode: doc.docCode,
    title: doc.title,
    category: doc.category,
    department: doc.department,
    createdDate: doc.createdDate,
    amount: doc.amount,
    fileSize: doc.fileSize,
    totalPages: doc.totalPages,
    pagesContent: doc.pagesContent,
    salt: pinOrSecret || ''
  });
  return sha256Sync(payload);
}

/**
 * Generates X.509 v3 certificate structure, trust chain hierarchy, and cryptographic fingerprints
 */
export function generateX509Details(certOrHsm: CompanyHSMProfile | PersonalCertificate): X509CertificateDetails {
  const isHsm = 'provider' in certOrHsm;

  if (isHsm) {
    const hsm = certOrHsm as CompanyHSMProfile;
    const seed = hsm.serialNumber + ':' + hsm.companyName;
    const sha256Raw = sha256Sync('sha256:' + seed);
    const sha1Raw = sha256Sync('sha1:' + seed).slice(0, 40);

    const sha256Fingerprint = sha256Raw.toUpperCase().match(/.{1,2}/g)?.join(':') || '';
    const sha1Fingerprint = sha1Raw.toUpperCase().match(/.{1,2}/g)?.join(':') || '';

    const statusMap: Record<string, 'valid' | 'warning' | 'expired' | 'revoked'> = {
      connected: 'valid',
      warning: 'warning',
      disconnected: 'warning',
      expired: 'expired'
    };
    const status = statusMap[hsm.status] || 'valid';

    return {
      subjectCN: hsm.companyName,
      subjectOrg: 'CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐIỆN TỬ VCOMM',
      subjectTaxCode: hsm.taxCode,
      subjectCountry: 'VN',
      issuerCN: `${hsm.provider} Cloud HSM Root Authority Tier-1`,
      issuerOrg: hsm.issuer,
      validFrom: hsm.validFrom,
      validTo: hsm.validTo,
      daysRemaining: hsm.daysRemaining,
      status,
      serialNumber: hsm.serialNumber,
      publicKeyAlgorithm: 'RSA (Rivest-Shamir-Adleman)',
      keySize: '2048-bit (FIPS 140-2 Level 3 Hardware Guard)',
      signatureAlgorithm: 'SHA256withRSA (1.2.840.113549.1.1.11)',
      sha1Fingerprint,
      sha256Fingerprint,
      keyUsage: [
        'Digital Signature',
        'Non-Repudiation',
        'Certificate Signing',
        'CRL Signing',
        'Key Encipherment'
      ],
      ocspStatus: 'Good / Validated (RFC 6960 OCSP Stapling Online)',
      crlDistributionPoint: `http://crl.${hsm.provider.toLowerCase().replace(/[^a-z]/g, '')}.vn/vcomm-corporate-hsm.crl`,
      trustChain: [
        {
          level: 1,
          name: 'Bộ Thông tin & Truyền thông - National Root CA',
          type: 'root_ca',
          issuer: 'Trung tâm Chứng thực Điện tử Quốc gia (NEAC)',
          validTo: '31/12/2035',
          status: 'valid'
        },
        {
          level: 2,
          name: `${hsm.provider} Operational CA Sub-CA 02`,
          type: 'intermediate_ca',
          issuer: 'Bộ Thông tin & Truyền thông - National Root CA',
          validTo: '30/06/2030',
          status: 'valid'
        },
        {
          level: 3,
          name: hsm.companyName,
          type: 'leaf',
          issuer: `${hsm.provider} Operational CA Sub-CA 02`,
          validTo: hsm.validTo,
          status: hsm.status === 'expired' ? 'expired' : 'valid'
        }
      ]
    };
  }

  // Personal Certificate
  const cert = certOrHsm as PersonalCertificate;
  const seed = cert.serialNumber + ':' + cert.fullName;
  const sha256Raw = sha256Sync('sha256:' + seed);
  const sha1Raw = sha256Sync('sha1:' + seed).slice(0, 40);

  const sha256Fingerprint = sha256Raw.toUpperCase().match(/.{1,2}/g)?.join(':') || '';
  const sha1Fingerprint = sha1Raw.toUpperCase().match(/.{1,2}/g)?.join(':') || '';

  let certStatus: 'valid' | 'warning' | 'expired' | 'revoked' = 'valid';
  if (cert.status === 'suspended' || cert.status === 'revoked') {
    certStatus = 'revoked';
  } else if (cert.status === 'expired') {
    certStatus = 'expired';
  }

  const isEcc = cert.algorithm.includes('ECC');

  return {
    subjectCN: cert.fullName,
    subjectOrg: 'CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐIỆN TỬ VCOMM',
    subjectEmail: cert.email,
    subjectCountry: 'VN',
    issuerCN: 'Viettel-CA SmartCA Cloud Sub-CA',
    issuerOrg: 'Viettel-CA Cloud HSM Root Authority',
    validFrom: cert.issuedDate,
    validTo: cert.expiryDate,
    daysRemaining: 480,
    status: certStatus,
    serialNumber: cert.serialNumber,
    publicKeyAlgorithm: isEcc ? 'ECC (Elliptic Curve Cryptography)' : 'RSA (Rivest-Shamir-Adleman)',
    keySize: isEcc ? '256-bit (NIST P-256 Curve)' : '2048-bit (Standard Enterprise)',
    signatureAlgorithm: isEcc ? 'SHA256withECDSA' : 'SHA256withRSA',
    sha1Fingerprint,
    sha256Fingerprint,
    keyUsage: [
      'Digital Signature',
      'Non-Repudiation',
      'Client Authentication',
      'Email Protection (S/MIME)'
    ],
    ocspStatus: cert.status === 'active' ? 'Good / Active (RFC 6960)' : 'Revoked / Suspended by Corporate Admin',
    crlDistributionPoint: 'http://crl.viettel-ca.vn/smartca-personal.crl',
    trustChain: [
      {
        level: 1,
        name: 'Bộ Thông tin & Truyền thông - National Root CA',
        type: 'root_ca',
        issuer: 'Trung tâm Chứng thực Điện tử Quốc gia (NEAC)',
        validTo: '31/12/2035',
        status: 'valid'
      },
      {
        level: 2,
        name: 'Viettel-CA SmartCA Cloud Sub-CA',
        type: 'intermediate_ca',
        issuer: 'Bộ Thông tin & Truyền thông - National Root CA',
        validTo: '15/08/2030',
        status: 'valid'
      },
      {
        level: 3,
        name: cert.fullName,
        type: 'leaf',
        issuer: 'Viettel-CA SmartCA Cloud Sub-CA',
        validTo: cert.expiryDate,
        status: cert.status === 'expired' ? 'expired' : 'valid'
      }
    ]
  };
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
    signingLimitVND: 50000000, // 500 triệu
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

// Initial Signing Documents with Rich Multi-Page Content for Document Studio
export const INITIAL_SIGNING_DOCUMENTS: SigningDocument[] = [
  {
    id: 'DOC-001',
    docCode: 'HDLD-2026-0042',
    title: 'Hợp đồng lao động xác định thời hạn 2 năm - Trần Minh Đức',
    docType: 'contract',
    category: 'contract',
    requestedBy: 'Lê Thu Quỳnh (HR)',
    department: 'Quản trị Nhân sự',
    createdDate: '17/09/2026',
    priority: 'high',
    status: 'pending',
    signatureTypeNeeded: 'both',
    fileSize: '1.4 MB',
    totalPages: 2,
    isBatchEligible: false,
    stampPosition: {
      page: 2,
      x: 380,
      y: 720,
      stampType: 'personal_signature'
    },
    pagesContent: [
      {
        pageNumber: 1,
        title: 'Trang 1: Thông tin giao kết & Chức danh chuyên môn',
        paragraphs: [
          'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM — Độc lập - Tự do - Hạnh phúc',
          'HỢP ĐỒNG LAO ĐỘNG (Số: HDLD-2026-0042)',
          'Hôm nay, ngày 17 tháng 09 năm 2026, tại Trụ sở Công ty Cổ phần Thương mại Điện tử VComm. Chúng tôi gồm:',
          'Người sử dụng lao động: CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐIỆN TỬ VCOMM. Đại diện: Bà Lê Thu Quỳnh - Chức vụ: Trưởng phòng Nhân sự HRM.',
          'Người lao động: Ông Trần Minh Đức - Sinh năm 1995 - CCCD: 079095012345 cấp tại Cục CS QLHC về TTXH.',
          'Điều 1: Thời hạn và công việc hợp đồng. Loại hợp đồng: Xác định thời hạn 24 tháng (từ 01/10/2026 đến 30/09/2028). Địa điểm làm việc: Tầng 12, Tòa nhà VComm Innovation, TP. Hồ Chí Minh.',
          'Chức danh chuyên môn: Kỹ sư Giải pháp AI & Dữ liệu lớn (Senior AI Platform Engineer). Trách nhiệm: Phát triển kiến trúc tìm kiếm Vector Search và hệ thống bảo mật chữ ký số HSM.'
        ]
      },
      {
        pageNumber: 2,
        title: 'Trang 2: Chế độ đãi ngộ, Bảo mật & Chữ ký số các bên',
        paragraphs: [
          'Điều 2: Chế độ làm việc, tiền lương và phụ cấp.',
          '- Mức lương chính: 45.000.000 VNĐ / tháng (Bằng chữ: Bốn mươi lăm triệu đồng chẵn).',
          '- Chế độ thưởng: Thưởng KPI quý, thưởng tháng lương thứ 13 và cổ phần ESOP theo quy chế công ty.',
          '- Bảo hiểm: Đóng BHXH, BHYT, BHTN theo mức quy định nhà nước và gói Bảo hiểm Chăm sóc Sức khỏe Quốc tế PVI Care VIP.',
          'Điều 3: Nghĩa vụ bảo mật thông tin (NDA) và Quyền sở hữu trí tuệ.',
          'Người lao động cam kết tuân thủ tuyệt đối quy định an toàn bảo mật mật mã học, mã nguồn thuật toán, không sao chép khóa định danh Cloud HSM nội bộ của VComm.',
          'Hợp đồng được lập thành 02 bản điện tử có giá trị pháp lý tương đương theo Luật Giao dịch Điện tử số 20/2023/QH15.'
        ]
      }
    ]
  },
  {
    id: 'DOC-002',
    docCode: 'DNTC-2026-0118',
    title: 'Đề nghị thanh toán chi phí Hosting Cloud & AI Server tháng 09',
    docType: 'request',
    category: 'request',
    requestedBy: 'Phạm Thị D (IT)',
    department: 'Công nghệ Thông tin',
    createdDate: '16/09/2026',
    amount: 145000000,
    priority: 'urgent',
    status: 'pending',
    signatureTypeNeeded: 'personal_cert',
    fileSize: '850 KB',
    totalPages: 2,
    isBatchEligible: true,
    stampPosition: {
      page: 2,
      x: 420,
      y: 680,
      stampType: 'personal_signature'
    },
    pagesContent: [
      {
        pageNumber: 1,
        title: 'Trang 1: Tờ trình đề nghị thanh toán hạ tầng máy chủ',
        paragraphs: [
          'TỜ TRÌNH DUYỆT CHI NGÂN SÁCH CÔNG NGHỆ THÔNG TIN',
          'Kính gửi: Tổng Giám đốc & Kế toán trưởng Công ty Cổ phần Thương mại Điện tử VComm.',
          'Người đề xuất: Phạm Thị D — Bộ phận Hạ tầng Mạng & Điện toán Đám mây (IT DevOps).',
          'Nội dung đề xuất: Thanh toán chi phí hạ tầng máy chủ GPU Cluster và Cloud HSM Cluster tháng 09/2026.',
          'Tổng số tiền đề nghị: 145.000.000 VNĐ (Bằng chữ: Một trăm bốn mươi lăm triệu đồng chẵn).',
          'Căn cứ hợp đồng cung ứng dịch vụ số HD-GCP-2026-09 ký với đối tác phân phối hạ tầng đám mây Google Cloud Platform & Viettel IDC.'
        ]
      },
      {
        pageNumber: 2,
        title: 'Trang 2: Bảng phân bổ chi phí chi tiết & Phê duyệt',
        paragraphs: [
          'BẢNG CHI TIẾT TÀI NGUYÊN TIÊU THỤ:',
          '1. Cụm máy chủ GPU NVIDIA A100 (4 nodes, 320GB VRAM phục vụ RAG Gemini AI): 92.000.000 VNĐ.',
          '2. Băng thông mạng CDN & Cloud Load Balancer cho sàn TMĐT VComm: 28.000.000 VNĐ.',
          '3. Hạn ngạch dịch vụ Ký số đám mây Dedicated Cloud HSM Viettel (20.000 lượt ký/tháng): 25.000.000 VNĐ.',
          'Ý kiến Kế toán trưởng: Đã kiểm tra đối chiếu hóa đơn hợp lệ, số dư tài khoản ngân sách IT đủ điều kiện thanh toán.',
          'Ý kiến phê duyệt của Tổng Giám đốc: Đồng ý chi trả qua kênh Chuyển khoản VietQR Doanh nghiệp.'
        ]
      }
    ]
  },
  {
    id: 'DOC-003',
    docCode: 'PXK-2026-9812',
    title: 'Phiếu xuất kho kiêm vận chuyển nội bộ 50 máy in đơn A6 sang Chi nhánh HN',
    docType: 'warehouse',
    category: 'warehouse_slip',
    requestedBy: 'Phạm Minh Hoàng (Kho)',
    department: 'Kho vận & Vận hành',
    createdDate: '16/09/2026',
    amount: 85000000,
    priority: 'normal',
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
    totalPages: 2,
    isBatchEligible: true,
    stampPosition: {
      page: 2,
      x: 350,
      y: 650,
      stampType: 'company_stamp'
    },
    pagesContent: [
      {
        pageNumber: 1,
        title: 'Trang 1: Lệnh điều chuyển thiết bị kho vận O2O',
        paragraphs: [
          'PHIẾU XUẤT KHO KIÊM VẬN CHUYỂN NỘI BỘ (Mẫu số: 03XKNB-TT78)',
          'Ngày lập: 16/09/2026 — Số phiếu: PXK-2026-9812.',
          'Căn cứ Lệnh điều động số 281/LD-VCOMM ngày 15/09/2026 của Giám đốc Vận hành.',
          'Đơn vị xuất: Kho Tổng Tân Bình — Địa chỉ: Lô B4, KCN Tân Bình, P. Tây Thạnh, Q. Tân Phú, TP.HCM.',
          'Đơn vị nhận: Trung tâm Phân phối VComm Hà Nội — Địa chỉ: KCN Đài Tư, Long Biên, Hà Nội.',
          'Đơn vị vận chuyển: VComm Logistics Express O2O — Biển kiểm soát xe: 29C-882.14.'
        ]
      },
      {
        pageNumber: 2,
        title: 'Trang 2: Danh mục hàng hóa & Dấu số Cloud HSM',
        paragraphs: [
          'DANH MỤC THIẾT BỊ XUẤT ĐIỀU CHUYỂN:',
          '- Mã SP: PRN-A6-BT — Tên SP: Máy in vận đơn nhiệt A6 kết nối Bluetooth/Wifi — SL: 50 chiếc — Đơn giá: 1.700.000 VNĐ — Thành tiền: 85.000.000 VNĐ.',
          'Tình trạng hàng hóa: Nguyên seal nhà sản xuất, đã kiểm tra kết nối với hệ thống OMS VComm.',
          'Xác nhận của Thủ kho xuất: Đã xuất đủ số lượng và niêm phong thùng hàng.',
          'Chứng thực số: Ký số tự động bởi Hệ thống Corporate Cloud HSM Viettel-CA lúc 14:32:10 ngày 16/09/2026.'
        ]
      }
    ]
  },
  {
    id: 'DOC-004',
    docCode: 'HDMB-2026-0039',
    title: 'Hợp đồng hợp tác nhà bán hàng B2B - Công ty TNHH Thời Trang EcoVibe',
    docType: 'contract',
    category: 'contract',
    requestedBy: 'Nguyễn Văn A (Kinh doanh)',
    department: 'Kinh doanh & Bán lẻ',
    createdDate: '15/09/2026',
    amount: 680000000,
    priority: 'urgent',
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
    totalPages: 3,
    isBatchEligible: false,
    stampPosition: {
      page: 3,
      x: 320,
      y: 700,
      stampType: 'badge_eidas'
    },
    pagesContent: [
      {
        pageNumber: 1,
        title: 'Trang 1: Hợp đồng hợp tác đối tác chiến lược B2B',
        paragraphs: [
          'HỢP ĐỒNG HỢP TÁC KINH DOANH THƯƠNG MẠI ĐIỆN TỬ B2B',
          'Số: HDMB-2026-0039 — Lập tại TP. Hồ Chí Minh ngày 15 tháng 09 năm 2026.',
          'BÊN A: CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐIỆN TỬ VCOMM. Đại diện: Ông Nguyễn Tiến Vĩnh - Tổng Giám đốc.',
          'BÊN B: CÔNG TY TNHH THỜI TRANG ECOVIBE VIỆT NAM. Đại diện: Bà Hoàng Thu Trang - Giám đốc Điều hành.',
          'Hai bên thống nhất ký kết thỏa thuận phân phối độc quyền dòng sản phẩm dệt may bền vững trên Sàn TMĐT VComm.'
        ]
      },
      {
        pageNumber: 2,
        title: 'Trang 2: Chính sách Fulfillment, Phí dịch vụ & Đối soát',
        paragraphs: [
          'Điều 2: Điều kiện vận hành kho bãi FBV (Fulfilled by VComm):',
          '- Bên B lưu kho tối thiểu 10.000 SKU tại Kho Tổng Tân Bình.',
          '- Tỷ lệ giao hàng thành công cam kết: 98.5% trong vòng 24 giờ tại nội thành Hà Nội & TP.HCM.',
          '- Mức phí hoa hồng dịch vụ sàn: 4.5% trên giá trị đơn hàng thực thu.',
          '- Chu kỳ đối soát doanh thu COD: Thứ 3 và Thứ 6 hàng tuần qua tài khoản chuyên chi tự động Sepay.'
        ]
      },
      {
        pageNumber: 3,
        title: 'Trang 3: Cam kết pháp lý, eIDAS & Chữ ký số cấp cao',
        paragraphs: [
          'Điều 3: Cam kết sở hữu trí tuệ và bảo đảm tính nguyên vẹn giao dịch.',
          'Bên B cam kết toàn bộ hàng hóa có đầy đủ hóa đơn chứng từ VAT và nguồn gốc xuất xứ CO/CQ.',
          'Hợp đồng được ký kết điện tử với mã băm toàn vẹn SHA-256 bảo vệ chống giả mạo theo tiêu chuẩn eIDAS/Nghị định 130/2018/NĐ-CP.',
          'Đại diện Bên A: Nguyễn Tiến Vĩnh (Tổng Giám đốc) — Đã ký số bảo mật SmartCA.',
          'Đại diện Bên B: Hoàng Thu Trang (Giám đốc Điều hành) — Đã ký số VNPT-CA.'
        ]
      }
    ]
  },
  {
    id: 'DOC-005',
    docCode: 'INV-2026-4921',
    title: 'Hóa đơn giá trị gia tăng điện tử (TT78) - Đơn hàng B2B #ORD-88192',
    docType: 'invoice',
    category: 'e_invoice',
    requestedBy: 'Trần Thị Mai (Kế toán)',
    department: 'Tài chính - Kế toán',
    createdDate: '17/09/2026',
    amount: 342500000,
    priority: 'high',
    status: 'pending',
    signatureTypeNeeded: 'company_hsm',
    fileSize: '420 KB',
    totalPages: 2,
    isBatchEligible: true,
    stampPosition: {
      page: 2,
      x: 390,
      y: 710,
      stampType: 'company_stamp'
    },
    pagesContent: [
      {
        pageNumber: 1,
        title: 'Trang 1: Hóa đơn GTGT chuẩn Thông tư 78/2021/TT-BTC',
        paragraphs: [
          'HÓA ĐƠN GIÁ TRỊ GIA TĂNG (Mẫu số: 1/001 - Ký hiệu: 1C26TBB - Số: 0004921)',
          'Đơn vị bán hàng: CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐIỆN TỬ VCOMM',
          'Mã số thuế: 0318914439 — Địa chỉ: Tầng 12, Tòa nhà VComm Innovation, Q.1, TP.HCM.',
          'Đơn vị mua hàng: CÔNG TY CỔ PHẦN CÔNG NGHỆ BÁN LẺ THÔNG MINH VIỆT',
          'Mã số thuế: 0108923145 — Địa chỉ: Số 88 Phố Huế, P. Hàng Bài, Q. Hoàn Kiếm, Hà Nội.',
          'Hình thức thanh toán: Chuyển khoản ngân hàng (VietinBank - TK: 118002931441).'
        ]
      },
      {
        pageNumber: 2,
        title: 'Trang 2: Chi tiết dòng hàng, Thuế suất 8% & Vị trí đóng mộc HSM',
        paragraphs: [
          'BẢNG KÊ CHI TIẾT HÀNG HÓA DỊCH VỤ:',
          '1. Hệ thống POS Cầm tay Quản lý Bán lẻ đa kênh VComm Touch Pro: 30 bộ x 9.500.000 = 285.000.000 VNĐ.',
          '2. Phí dịch vụ tích hợp cổng thanh toán tự động Sepay API (Gói 12 tháng): 31.944.444 VNĐ.',
          'Cộng tiền hàng: 316.944.444 VNĐ. Thuế suất GTGT: 8% (25.355.556 VNĐ).',
          'Tổng cộng tiền thanh toán: 342.500.000 VNĐ (Ba trăm bốn mươi hai triệu năm trăm nghìn đồng chẵn).',
          'Chữ ký số người bán: Đang chờ ký số tự động thông qua Corporate Cloud HSM Viettel.'
        ]
      }
    ]
  },
  {
    id: 'DOC-006',
    docCode: 'TAX-2026-Q3',
    title: 'Tờ khai thuế GTGT tháng 08/2026 theo mẫu 01/GTGT gửi Cục Thuế TP.HCM',
    docType: 'decision',
    category: 'tax_report',
    requestedBy: 'Trần Thị Mai (Kế toán)',
    department: 'Tài chính - Kế toán',
    createdDate: '17/09/2026',
    amount: 1285000000,
    priority: 'high',
    status: 'pending',
    signatureTypeNeeded: 'company_hsm',
    fileSize: '1.1 MB',
    totalPages: 3,
    isBatchEligible: true,
    stampPosition: {
      page: 3,
      x: 410,
      y: 730,
      stampType: 'company_stamp'
    },
    pagesContent: [
      {
        pageNumber: 1,
        title: 'Trang 1: Tờ khai thuế GTGT khấu trừ - Kỳ tính thuế tháng 08/2026',
        paragraphs: [
          'TỜ KHAI THUẾ GIÁ TRỊ GIA TĂNG (Mẫu số 01/GTGT ban hành kèm Thông tư 80/2021/TT-BTC)',
          'Kỳ tính thuế: Tháng 08 năm 2026. Lần đầu: [X] — Bổ sung: [ ]',
          'Người nộp thuế: CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐIỆN TỬ VCOMM — MST: 0318914439.',
          'Cơ quan thuế quản lý trực tiếp: Cục Thuế Thành phố Hồ Chí Minh.',
          'Ngành nghề kinh doanh chính: Hoạt động trung gian thương mại điện tử và dịch vụ logistics O2O.'
        ]
      },
      {
        pageNumber: 2,
        title: 'Trang 2: Tổng hợp thuế GTGT đầu vào & Doanh số chịu thuế đầu ra',
        paragraphs: [
          'BẢNG CHỈ TIÊU KÊ KHAI NGHĨA VỤ THUẾ:',
          '- [21] Thuế GTGT chưa khấu trừ hết kỳ trước chuyển sang: 142.500.000 VNĐ.',
          '- [23] Giá trị hàng hóa, dịch vụ mua vào: 12.450.000.000 VNĐ.',
          '- [25] Tổng số thuế GTGT đầu vào được khấu trừ kỳ này: 1.120.000.000 VNĐ.',
          '- [34] Tổng doanh thu hàng hóa, dịch vụ bán ra chịu thuế: 28.650.000.000 VNĐ.',
          '- [40] Thuế GTGT còn phải nộp trong kỳ: 1.285.000.000 VNĐ.'
        ]
      },
      {
        pageNumber: 3,
        title: 'Trang 3: Cam kết trung thực & Xác nhận ký số HSM của Người đại diện',
        paragraphs: [
          'Tôi cam đoan số liệu khai trên là hoàn toàn chính xác và chịu trách nhiệm trước pháp luật về số liệu đã kê khai.',
          'Ngày lập tờ khai: 17 tháng 09 năm 2026.',
          'Người nộp thuế hoặc Người đại diện hợp pháp theo pháp luật của công ty:',
          'VCOMM CORP — Xác nhận ký số bằng Cloud HSM tích hợp cổng Thuế điện tử eTax (Tổng cục Thuế).'
        ]
      }
    ]
  },
  {
    id: 'DOC-007',
    docCode: 'QD-2026-088',
    title: 'Quyết định ban hành Quy chế sử dụng Chữ ký số & An toàn Mật mã năm 2026',
    docType: 'decision',
    category: 'internal_decision',
    requestedBy: 'Nguyễn Tiến Vĩnh (CEO)',
    department: 'Ban Giám Đốc',
    createdDate: '14/09/2026',
    priority: 'normal',
    status: 'signed',
    signatureTypeNeeded: 'both',
    signedBy: {
      name: 'Nguyễn Tiến Vĩnh (Tổng Giám đốc)',
      certSerial: '7A:31:09:FE:44:88:91:AA',
      signedAt: '14/09/2026 09:30:15',
      method: 'SmartCA HSM Approved',
      hashSHA256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0'
    },
    fileSize: '980 KB',
    totalPages: 2,
    isBatchEligible: false,
    stampPosition: {
      page: 2,
      x: 360,
      y: 690,
      stampType: 'company_stamp'
    },
    pagesContent: [
      {
        pageNumber: 1,
        title: 'Trang 1: Quyết định ban hành quy chế an toàn mật mã & chữ ký số',
        paragraphs: [
          'QUYẾT ĐỊNH CỦA HỘI ĐỒNG QUẢN TRỊ & TỔNG GIÁM ĐỐC',
          'Số: 88/QD-VCOMM-2026 — V/v Ban hành Quy chế Quản lý & Ứng dụng Chữ ký số trong toàn hệ thống.',
          'Căn cứ Điều lệ tổ chức và hoạt động của Công ty Cổ phần Thương mại Điện tử VComm.',
          'Căn cứ Luật Giao dịch Điện tử số 20/2023/QH15 và Nghị định 130/2018/NĐ-CP của Chính phủ.',
          'Điều 1: Ban hành kèm theo Quyết định này "Quy chế Quản lý Khóa mật mã HSM, Chứng thư số Cá nhân CBNV và Quy trình Phê duyệt Trực tuyến trên VComm ERP".'
        ]
      },
      {
        pageNumber: 2,
        title: 'Trang 2: Phân công trách nhiệm thi hành & Ký số ban hành',
        paragraphs: [
          'Điều 2: Toàn bộ cán bộ nhân viên có thẩm quyền ký kết tài liệu phải kích hoạt xác thực hai yếu tố (2FA/OTP) và bảo mật mã PIN ký số.',
          'Điều 3: Khóa riêng (Private Key) của Doanh nghiệp được lưu trữ bất biến trong thiết bị bảo mật chuyên dụng Cloud HSM đạt chuẩn FIPS 140-2 Level 3.',
          'Điều 4: Quyết định có hiệu lực kể từ ngày ký. Ban Giám đốc, Kế toán trưởng, Giám đốc Kho vận và Trưởng các bộ phận liên quan chịu trách nhiệm thi hành.',
          'TỔNG GIÁM ĐỐC: Nguyễn Tiến Vĩnh — Đã ký số và đóng mộc điện tử.'
        ]
      }
    ]
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
