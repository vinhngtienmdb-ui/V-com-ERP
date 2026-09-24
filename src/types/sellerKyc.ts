export type LegalBusinessType = 'INDIVIDUAL' | 'HOUSEHOLD' | 'ENTERPRISE';

export type KycStatus = 'UNVERIFIED' | 'PENDING_KYC' | 'VERIFIED_VNEID' | 'REJECTED';

export type ApprovalStatus = 'pending' | 'active' | 'suspended' | 'rejected';

export interface VNeIdData {
  citizenId: string; // 12-digit CCCD/VNeID
  fullName: string;
  dob: string;
  gender: 'Nam' | 'Nữ';
  permanentAddress: string;
  level: 1 | 2; // Priority: Level 2
  verifiedAt: string;
  qrVerified: boolean;
  matchRate: number; // e.g. 100%
}

export interface TaxInfo {
  taxCode: string;
  registeredName: string;
  taxStatus: 'ACTIVE' | 'PENDING' | 'LOCKED';
  vatRate: number; // e.g. 1.0% or 8-10%
  pitRate: number; // e.g. 0.5% or 0% for company
  invoiceType: 'PLATFORM_WITHHOLDING' | 'SELLER_ISSUES_INVOICE';
  taxOffice: string;
}

export interface BankAccountInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isMatchedWithName: boolean;
}

export interface KycDocument {
  id: string;
  type: 'VNEID_CARD_FRONT' | 'VNEID_CARD_BACK' | 'BUSINESS_LICENSE' | 'FOOD_SAFETY_CERT' | 'AUTHORIZATION_LETTER' | 'BANK_STATEMENT';
  title: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  status: 'VERIFIED' | 'PENDING' | 'REJECTED';
  ocrData?: Record<string, string>;
}

export interface ComprehensiveSeller {
  id: string; // e.g. 'SEL-001'
  shopName: string;
  legalType: LegalBusinessType;
  representativeName: string;
  phone: string;
  email: string;
  logoUrl?: string;
  businessAddress: string;
  warehouseAddress: string;
  
  // VNeID Verification
  vneid: VNeIdData;
  
  // Tax & Legal
  tax: TaxInfo;
  
  // Bank Account
  bank: BankAccountInfo;
  
  // Documents
  documents: KycDocument[];
  
  // Operational Metrics
  status: ApprovalStatus;
  totalProducts: number;
  rating: number;
  gmv: number;
  walletBalance: number;
  commissionRate: number; // e.g. 5%
  joinDate: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  
  // Ecosystem access
  partnerCategory: 'seller' | 'dealer' | 'factory';
  activeModules: string[];
}
