export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'pending_approval' | 'hidden' | 'draft' | 'published' | 'rejected' | 'archived';
  image: string;
  image_urls?: string | string[]; // Gallery (PIM product_details contract)
  sellerName: string;
  sellerId?: string; // FK sellers — dùng cho KYC gate publish (NĐ 52/2013)
  brand: string;
  costPrice: number; // Giá vốn
  hiddenCosts: number; // Chi phí ẩn (shipping, packing, etc)
  margin: number; // Biên lợi nhuận
  profit: number; // Lợi nhuận thực tế
  misaSynced?: boolean;
  misaSyncedAt?: string;
  misaSyncError?: string;
  similarity?: number; // Điểm tương đồng cho AI Vector Search
  description?: string;
  weight?: string;
  dimensions?: string;
  images?: string[];
  videoUrl?: string;
  specs?: { key: string; value: string }[];
}


export interface SellerMetric {
 id: string;
 name: string;
 email?: string;
 phone?: string;
 totalProducts: number;
 rating: number;
 gmv: number;
 walletBalance?: number;
 status: 'active' | 'suspended' | 'warning' | 'pending';
 taxCode: string;
 /** Phương pháp tính thuế của Seller (TT 91/2026 Điều 9.1.h) — 'declaration' kê khai / 'presumptive' khoán. Bắt buộc trước khi VComm ủy nhiệm phát hành HĐ thay. */
 taxMethod?: 'declaration' | 'presumptive';
 identityCard: string;
 address?: string;
 representative?: string;
 commissionRate: number;
 joinDate: string;
 onboardingStep: 'documents' | 'verification' | 'completed';
 businessLicenseUrl?: string;
 idCardFrontUrl?: string;
 idCardBackUrl?: string;
}

export interface CustomerActivity {
 id: string;
 type: 'purchase' | 'consultation' | 'rma' | 'other';
 title: string;
 description: string;
 date: string;
 status?: string;
 details?: string;
}

export interface Customer {
 id: string;
 name: string;
 email: string;
 phone: string;
 totalSpent: number;
 orderCount: number;
 lastOrderDate: string;
 status: 'active' | 'inactive' | 'locked';
 channels: ('zalo' | 'facebook' | 'web' | 'hotline')[];
 rfmScore?: { recency: number; frequency: number; monetary: number };
 activities?: CustomerActivity[];
 tier?: string;
 points?: number;
 aiInsight?: string;
 referrerName?: string;
 walletBalance?: number;
 downlineCount?: number;
 misaSynced?: boolean;
 misaSyncedAt?: string;
 misaSyncError?: string;
 promoBalance?: number;
}

export interface ShippingInfo {
 carrier: 'GHTK' | 'GHN' | 'ViettelPost' | 'NinjaVan';
 trackingCode: string;
 cost: number;
 estimatedDelivery: string;
 shippingLogs: { date: string; status: string; location: string }[];
}

export interface DashboardStats {
 gmv: number;
 traffic: number;
 totalOrders: number;
 activeSellers: number;
 averageOrderValue: number;
 revenueHistory: { month: string; amount: number }[];
 categoryDistribution: { name: string; value: number }[];
}

export interface Order {
  id: string;
  tenantId?: string;
  customerId?: string;
  customerName: string;
  date: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returning';
  items: OrderItem[];
  paymentMethod: 'cod' | 'bank_transfer' | 'e_wallet';
  
  // Multi-Seller OMS fields
  sellerId?: string;
  parentOrderId?: string;
  commissionFee?: number;
  settlementStatus?: 'pending' | 'settled';
  settlementId?: string;
  paymentStatus?: 'unpaid' | 'paid' | 'refunded';
}

export interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  sellerId?: string;
}

// --- MARKETING & AFFILIATE ---
export interface Campaign {
 id: string;
 name: string;
 type: 'flash_sale' | 'voucher' | 'group_buy' | 'landing_page';
 status: 'active' | 'upcoming' | 'expired';
 budget: number;
 spent: number;
 gmvGenerated: number;
 roi: number;
 startDate: string;
 endDate: string;
}

export interface Affiliate {
 id: string;
 name: string;
 type: 'kol' | 'publisher' | 'agent';
 commissionEarned: number;
 ordersCount: number;
 clickThroughRate: number;
 status: 'active' | 'pending';
 platforms?: ('tiktok' | 'youtube' | 'facebook' | 'instagram')[];
 followers?: number;
 bookingPrice?: number;
 phone?: string;
 categoryTags?: string[];
 vneidVerified?: boolean;   // Xác thực VNeID (NĐ 52/85) — Affiliate phải định danh thật
 vneidLinkedAt?: string;
}

// --- SCM & PURCHASING ---
export interface PurchaseRequest {
 id: string;
 itemName: string;
 quantity: number;
 estimatedCost: number;
 department: string;
 status: 'pending' | 'approved' | 'rejected' | 'ordered' | 'rfq_sent';
 supplierScore?: number;
}

export interface B2BInventoryItem {
 id: string;
 name: string;
 sku: string;
 currentStock: number;
 safetyStock: number;
 unit: string;
 location: string;
 reorderPoint: number;
}

// --- FINANCE & ACCOUNTING (Circular 99/2025/TT-BTC) ---
export interface FinanceTransaction {
 id: string;
 description: string;
 amount: number;
 type: 'income' | 'expense';
 category: string;
 date: string;
 dateStr?: string;
 createdAt?: any;
 createdBy?: string;
 debitAccount?: string;
 creditAccount?: string;
 accountingObjectCode?: string;
 taxRate?: number;
 vatAmount?: number;
 orderId?: string;
 referenceNumber?: string;
 bankAccount?: string;
 misaSynced?: boolean;
 misaVoucherId?: string;
 misaSyncError?: string;
 misaSyncedAt?: string;
 tenantId?: string;
}

export interface AccountEntry {
 id: string;
 accountCode: string; // e.g., 111, 112, 131...
 accountName: string;
 debit: number;
 credit: number;
 date: string;
 description: string;
}

export interface JournalEntry {
 id: string;
 date: string;
 voucherNumber: string;
 description: string;
 entries: AccountEntry[];
}

// --- SETTLEMENT & WITHDRAWAL ---
export interface SettlementRow {
  id: string;
  sellerId: string;
  sellerName: string;
  periodStart: string;
  periodEnd: string;
  totalSales: number;
  commissionFee: number;
  shippingFee: number;
  netPayout: number;
  status: 'pending' | 'completed' | 'failed';
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WithdrawalRequest {
 id: string;
 userId: string;
 userName: string;
 userType: 'seller' | 'buyer';
 amount: number;
 bankAccount: { bankName: string; accountNo: string; accountName: string };
 status: 'pending' | 'approved' | 'rejected' | 'processed';
 requestDate: string;
}

export interface EInvoice {
 id: string;
 invoiceNumber: string;
 orderId: string;
 buyerName: string;
 taxCode?: string;
 totalAmount: number;
 vatAmount: number;
 status: 'issued' | 'cancelled' | 'pending';
 type: 'sale' | 'commission';
}

// --- HUMAN RESOURCES (HR) ---
// --- HUMAN RESOURCES (HR) & ADMIN ---
export interface Suggestion {
 id: string;
 category: 'welfare' | 'facility' | 'process' | 'other';
 content: string;
 timestamp: string;
 status: 'received' | 'reviewing' | 'resolved';
}

export interface PointTransaction {
 id: string;
 type: 'plus' | 'minus';
 amount: number;
 reason: string;
 date: string;
 from?: string;
}

export interface Employee {
 id: string;
 fullName: string;
 email: string;
 phone: string;
 department: string;
 position: string;
 joinDate: string;
 employeeType: 'full_time' | 'part_time' | 'contract';
 status: 'active' | 'on_leave' | 'resigned' | 'on_boarding';
 contracts: { type: string; signDate: string; expiryDate: string }[];
 skills?: { name: string; level: number }[];
 leaveBalance?: { total: number; used: number; pending: number };
 recentSentiment?: 'positive' | 'neutral' | 'negative' | 'critical';
 role?: 'Admin' | 'Quản lý' | 'Nhân viên';
 permissions?: Record<string, { read: boolean; create: boolean; update: boolean; delete: boolean }>;
 teamId?: string;
 // Personal details
 gender?: 'Nam' | 'Nữ' | 'Khác';
 dateOfBirth?: string;
 identityCard?: string;
 identityCardDate?: string;
 identityCardPlace?: string;
 permanentAddress?: string;
 currentAddress?: string;
 personalEmail?: string;
 personalPhone?: string;
 bankAccountNo?: string;
 bankName?: string;
 bankAccountName?: string;
 taxCode?: string;
 socialInsuranceNo?: string;
 emergencyName?: string;
 emergencyPhone?: string;
 emergencyRelation?: string;
 faceVerified?: boolean;
 unitCode?: string;
 workEmail?: string;
 timeAttendanceCode?: string;
 workplace?: string;
 salaryHistory?: Array<any>;
 familyMembers?: Array<any>;
 documents?: Array<any>;
 equipmentList?: Array<any>;
 workHistory?: Array<any>;
 rewardsHistory?: Array<any>;
 personalHistory?: Array<any>;
 editRequests?: Array<any>;
 insuranceHistory?: Array<any>;
}

export interface Team {
 id: string;
 name: string;
 type: 'CustomerService' | 'Sales' | 'HR' | 'Other';
 managerId: string;
 memberIds: string[];
}

export interface AttendanceRecord {
 id: string;
 employeeId: string;
 date: string;
 checkIn: string;
 checkOut: string;
 status: 'on_time' | 'late' | 'absent' | 'off';
 overtimeHours: number;
 location?: string; // GPS app integration
 method?: 'gps' | 'wifi' | 'face' | 'qr' | 'device';
 deviceInfo?: string;
}

export interface Payroll {
 id: string;
 employeeId: string;
 employeeName: string;
 month: string;
 baseSalary: number;
 allowance: number;
 bonus: number;
 deduction: number;
 pitAmount: number; // Thuế TNCN
 insuranceAmount: number; // BHXH
 netSalary: number;
 status: 'pending' | 'paid';
}

// --- PERFORMANCE & TRAINING ---
export interface KPI {
 id: string;
 employeeId: string;
 title: string;
 target: number;
 current: number;
 unit: string;
 period: string;
}

export interface TrainingCourse {
 id: string;
 title: string;
 category: string;
 enrolledCount: number;
 progress: number;
}

// --- ADMIN & WORKSPACE ---
export interface WorkspaceBooking {
 id: string;
 type: 'meeting_room' | 'car' | 'laptop';
 resourceName: string;
 requesterName: string;
 startTime: string;
 endTime: string;
 status: 'pending' | 'approved' | 'rejected' | 'completed';
}

export interface OfficeAsset {
 id: string;
 name: string;
 type: 'hardware' | 'furniture' | 'vehicle' | 'license';
 purchaseDate: string;
 assignedTo?: string;
 status: 'active' | 'maintenance' | 'retired';
 value: number;
}

export interface InternalMessage {
 id: string;
 senderId: string;
 receiverId: string;
 content: string;
 timestamp: string;
 isRead: boolean;
}

// --- BI & ANALYTICS ---
export interface BIMetric {
 rfmScore: { customerId: string; recency: number; frequency: number; monetary: number };
 retentionRate: number;
 cac: number; // Cost Per Acquisition
 clv: number; // Customer Lifetime Value
 fraudAlerts: { id: string; type: 'buffing' | 'voucher_spam'; severity: 'high' | 'medium'; date: string }[];
}

// --- SALES MANAGEMENT ---
export interface SalesRep {
 id: string;
 name: string;
 tier: 'junior' | 'senior' | 'lead';
 target: number;
 achieved: number;
 commissionRate: number;
 salesCount: number;
}

// --- LOYALTY ---
export interface LoyaltyProgram {
 id: string;
 tier: 'bronze' | 'silver' | 'gold' | 'diamond';
 points: number;
 privileges: string[];
}

// --- SETTINGS & INTEGRATIONS ---
export interface PermissionRole {
 id: string;
 name: string;
 permissions: string[]; // e.g., ['order.view', 'finance.approve']
}

export interface WebhookConfig {
 id: string;
 name: string;
 url: string;
 events: string[];
 status: 'active' | 'inactive';
}

// --- IPOS SPECIFIC PERMISSIONS ---
export interface IPosStaff {
 id: string;
 fullName: string;
 email: string;
 phone: string;
 role: 'admin' | 'manager' | 'employee';
 assignedStoreId: string;
 status: 'active' | 'inactive';
 lastActive?: string;
}

export interface IPosStore {
 id: string;
 name: string;
 address: string;
 managerId: string;
 status: 'active' | 'inactive';
 industry?: string;
 subIndustry?: string;
 config?: {
 printReceiptAutomatically: boolean;
 allowReturns: boolean;
 requireShiftOpening: boolean;
 };
}

// --- WALLET & ESCROW ---
export interface WalletTransaction {
 id: string;
 userId: string;
 type: 'deposit' | 'withdraw' | 'payment' | 'refund' | 'payout';
 amount: number;
 gateway: 'napas' | 'momo' | 'zalopay' | 'internal';
 status: 'pending' | 'success' | 'failed';
 timestamp: string;
}

export interface EscrowAccount {
  orderId: string;
  amount: number;
  sellerId: string;
  buyerId: string;
  releaseStatus: 'locked' | 'released' | 'refunded' | 'disputed';
  autoReleaseAt: string;
}

export interface PaymentGateway {
 id: string;
 name: string;
 provider: 'vnpay' | 'momo' | 'zalopay' | 'napas' | 'credit_card';
 status: 'active' | 'inactive' | 'maintenance';
 transactionFee: number;
 isPreferred: boolean;
 webhookUrl?: string;
}

export interface BankAccount {
 id: string;
 bankName: string;
 accountNumber: string;
 accountName: string;
 type: 'checking' | 'savings' | 'credit';
 balance: number;
 isDefault: boolean;
}

export interface PaymentLink {
 id: string;
 amount: number;
 description: string;
 url: string;
 qrCode: string;
 status: 'active' | 'expired' | 'completed';
 createdAt: string;
}

// --- LIVE-COMMERCE ---
export interface LiveSession {
 id: string;
 sellerId: string;
 sellerName: string;
 title: string;
 startTime: string;
 viewerCount: number;
 pinnedProducts: string[];
 revenue: number;
 status: 'upcoming' | 'live' | 'ended';
}

// --- ADVERTISING MANAGER ---
export interface AdBid {
 id: string;
 sellerId: string;
 type: 'keyword' | 'banner' | 'top_search';
 target: string; // e.g., keyword or position name
 bidAmount: number; // Price per click/impression
 budget: number;
 spent: number;
 clicks: number;
 impressions: number;
 status: 'active' | 'paused' | 'exhausted';
}

// --- LEGAL & COMPLIANCE ---
export interface BrandProtection {
 id: string;
 brandName: string;
 ownerId: string;
 registrationDate: string;
 status: 'verified' | 'pending' | 'rejected';
 documents: string[];
}

export interface DisputeRequest {
 id: string;
 orderId: string;
 type: 'counterfeit' | 'ip_infringement' | 'bad_quality';
 reporterId: string;
 evidence: string[];
 status: 'open' | 'investigating' | 'resolved' | 'closed';
 resolution?: string;
}

// --- SELLER FINANCE ---
export interface SellerCreditScore {
 sellerId: string;
 score: number; // 0-1000
 tier: 'AAA' | 'AA' | 'A' | 'B' | 'C';
 maxCreditLimit: number;
 availableCredit: number;
}

export interface EarlyPayoutRequest {
 id: string;
 sellerId: string;
 amount: number;
 discountFee: number;
 requestDate: string;
 status: 'pending' | 'approved' | 'disbursed';
}

// --- SOCIAL COMMERCE ---
export interface SocialPost {
 id: string;
 authorId: string;
 authorName: string;
 content: string;
 media: string[];
 likes: number;
 comments: number;
 tags: string[];
 timestamp: string;
}

// --- WORKFLOW COORDINATION ---
export interface WorkflowTask {
 id: string;
 module: string;
 title: string;
 priority: 'critical' | 'high' | 'medium' | 'low';
 status: 'pending' | 'in_progress' | 'completed';
 assignedTo?: string;
 deadline: string;
 link: string;
}

// --- AI OPERATIONS & QUALITY ---
export interface AiTaskResult {
 id: string;
 type: 'image_moderation' | 'content_fix' | 'fraud_alert' | 'dynamic_pricing' | 'recommendation' | 'chatbot';
 targetId: string;
 confidence: number;
 result: any;
 status: 'flagged' | 'passed' | 'fixed';
 timestamp: string;
}

export interface AiFeeSuggestion {
 category: string;
 currentFee: number;
 suggestedFee: number;
 reasoning: string;
 competitorAvg: number;
 impactOnGmv: string;
}

// --- CALENDAR & MEETINGS ---
export interface MeetingEvent {
 id: string;
 title: string;
 roomName: string;
 startTime: string;
 endTime: string;
 attendees: string[];
 description?: string;
 syncStatus: {
 calendar: boolean;
 email: boolean;
 room: boolean;
 };
}

// --- OMNICHANNEL CHAT ---
export type ChatChannel = 'zalo' | 'facebook' | 'web' | 'hotline';

export interface ChatMessage {
 id: string;
 channel: ChatChannel;
 senderId: string;
 senderName: string;
 text: string;
 isAi: boolean;
 timestamp: string;
}

export interface ChatThread {
 id: string;
 channel: ChatChannel;
 userName: string;
 userAvatar?: string;
 lastMessage: string;
 unreadCount: number;
 updatedAt: string;
}

export interface Combo {
  id: string;
  tenantId?: string;
  name: string;
  description?: string;
  price: number;
  costPrice: number;
  status: 'active' | 'inactive';
  createdAt?: string;
}

export interface ComboItem {
  id: string;
  tenantId?: string;
  comboId: string;
  productId: string;
  quantity: number;
}

// ============================================================================
// TRỤ CỘT 3 — MUA CHUNG (GROUP BUY) — spec 016
// ============================================================================
// Trạng thái đồng bộ với CHECK constraint trong
// specs/016-tru-cot-3-4/migrations/001_group_buy_sessions.sql
export type GroupBuyStatus =
  | 'group_open'            // đang nhận người tham gia
  | 'group_reached_minimum' // đã đạt số lượng tối thiểu
  | 'group_locked'          // chốt sổ, chờ nguồn xác nhận
  | 'supplier_confirmed'    // nguồn đã xác nhận
  | 'completed'             // hoàn tất, đã sinh đơn
  | 'cancelled'             // huỷ thủ công
  | 'expired';              // hết hạn chưa đạt tối thiểu

export interface GroupBuySession {
  id: string;
  tenantId?: string;
  comboId?: string;
  productId?: string;
  status: GroupBuyStatus;
  minParticipants: number;
  currentParticipants: number;
  unitPrice: number;
  expiresAt?: string | null;
  leaderId?: string | null;
  lockedAt?: string | null;
  supplierConfirmedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancelledReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type GroupBuyParticipantStatus = 'joined' | 'confirmed' | 'refunded' | 'cancelled';

export interface GroupBuyParticipant {
  id: string;
  tenantId?: string;
  sessionId: string;
  customerId: string;
  customerName?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  status: GroupBuyParticipantStatus;
  paymentRef?: string | null;
  orderId?: string | null;
  joinedAt?: string;
  cancelledAt?: string | null;
}

// ============================================================================
// TRỤ CỘT 4 — F2B2B (Farm / Factory → Business → Business) — spec 016
// ============================================================================
// KHÁC Mua chung: gom đủ sản lượng để ĐẶT SẢN XUẤT/thu mua trực tiếp từ nguồn,
// có vòng đời sản xuất & giao hàng. Không gộp chung bảng với Mua chung.
export type F2B2BSourceType = 'farm' | 'factory' | 'cooperative';
export type F2B2BSourceStatus = 'pending' | 'active' | 'suspended' | 'blacklisted';

export interface F2B2BSource {
  id: string;
  tenantId?: string;
  code: string;
  name: string;
  type: F2B2BSourceType;
  taxCode?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  provinceCode?: string;
  provinceName?: string;
  address?: string;
  capacityPerCycle: number;
  capacityUnit: string;
  leadTimeDays: number;
  /** Mảng tên chứng nhận: ['VietGAP', 'HACCP'] */
  certifications: string[];
  rating: number;
  totalCompletedPools: number;
  status: F2B2BSourceStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type F2B2BPoolStatus =
  | 'draft'      // đang soạn
  | 'open'       // đang nhận đăng ký gom
  | 'closed'     // chốt sổ, đã đạt target
  | 'confirmed'  // nguồn xác nhận cung ứng
  | 'producing'  // đang sản xuất / thu hoạch
  | 'shipping'   // đang giao
  | 'completed'  // hoàn tất
  | 'cancelled'; // huỷ

/** Bậc giá theo sản lượng: chạm càng cao, đơn giá càng tốt */
export interface F2B2BPriceTier {
  minQty: number;
  unitPrice: number;
}

export interface F2B2BPoolOrder {
  id: string;
  tenantId?: string;
  code: string;
  sourceId: string;
  productId?: string;
  productName: string;
  unit: string;
  targetQty: number;
  minQty: number;
  pooledQty: number;
  priceTiers: F2B2BPriceTier[];
  baseUnitPrice: number;
  finalUnitPrice?: number | null;
  status: F2B2BPoolStatus;
  openAt?: string | null;
  closeAt?: string | null;
  expectedDeliveryAt?: string | null;
  confirmedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancelledReason?: string | null;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type F2B2BParticipantStatus = 'committed' | 'cancelled' | 'delivered';

export interface F2B2BPoolParticipant {
  id: string;
  tenantId?: string;
  poolId: string;
  buyerId: string;
  buyerName?: string;
  committedQty: number;
  unitPrice: number;
  amount: number;
  deliveryAddress?: string;
  deliveryProvinceCode?: string;
  status: F2B2BParticipantStatus;
  paymentRef?: string | null;
  joinedAt?: string;
  cancelledAt?: string | null;
}

// ============================================================================
// TRỤ CỘT 1 (phần DROPSHIP) — DROPSHIP — spec 017
// ============================================================================
// KHÁC AFFILIATE — đây là hai mô hình, KHÔNG gộp:
//   - Affiliate: NGƯỜI GIỚI THIỆU. Không bán, không đặt giá, không chạm kho,
//     không chạm giao hàng. Thu nhập = HOA HỒNG trên đơn VComm tự chốt.
//   - Dropship : NGƯỜI BÁN. Tự niêm yết và bán trên kênh của họ, tự đặt giá,
//     ăn CHÊNH LỆCH (margin). VComm giữ kho + lấy hàng + giao + thu hộ COD.
//   => Dropship có vòng đời fulfill (giữ kho → lấy hàng → giao → đối soát)
//      mà Affiliate không có. Giữ hai bộ bảng riêng.
export type DropshipChannel =
  | 'shopee' | 'lazada' | 'tiktok' | 'tiki' | 'sendo' | 'website' | 'other';

export type DropshipPartnerStatus = 'pending' | 'active' | 'suspended' | 'blacklisted';

export interface DropshipPartner {
  id: string;
  tenantId?: string;
  code: string;
  name: string;
  shopName?: string;
  channels: DropshipChannel[];
  taxCode?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  /** Định danh thật (NĐ 52/85) — đối tác nhận tiền bắt buộc phải KYC */
  vneidVerified?: boolean;
  vneidLinkedAt?: string | null;
  /** Tỉ lệ chênh lệch đối tác được hưởng: 0.8 = đối tác 80%, VComm 20% */
  marginSplit: number;
  bankName?: string;
  bankAccount?: string;
  bankAccountName?: string;
  /** COD VComm đang thu hộ nhưng chưa trả đối tác */
  outstandingCod?: number;
  status: DropshipPartnerStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type DropshipListingStatus = 'draft' | 'active' | 'paused' | 'delisted';

/** Một sản phẩm VComm được đối tác niêm yết trên kênh ngoài */
export interface DropshipListing {
  id: string;
  tenantId?: string;
  partnerId: string;
  productId: string;
  productName: string;
  /** Mã SKU phía kênh ngoài — dùng để khớp đơn đẩy về */
  externalSku?: string | null;
  channel: DropshipChannel;
  externalUrl?: string | null;
  /** Giá VComm xuất cho đối tác */
  baseCost: number;
  /** Giá đối tác niêm yết (tự quyết định, nhưng không dưới minSellingPrice) */
  listedPrice: number;
  /** Giá sàn do VComm ấn định — chống đối tác phá giá thương hiệu */
  minSellingPrice: number;
  shippingFee: number;
  /** Tồn kho đã đẩy sang kênh ngoài — chống oversell */
  stockSynced: number;
  syncedAt?: string | null;
  status: DropshipListingStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type DropshipOrderStatus =
  | 'pending'         // vừa nhận từ kênh, chưa kiểm tồn
  | 'stock_reserved'  // đã giữ kho
  | 'picking'         // đang lấy hàng
  | 'shipping'        // đang giao
  | 'delivered'       // đã giao
  | 'settled'         // đã đối soát margin
  | 'cancelled'       // huỷ (hết kho / khách huỷ)
  | 'returned';       // hoàn hàng

export interface DropshipOrderItem {
  productId: string;
  productName: string;
  externalSku?: string | null;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  lineMargin?: number;
}

export interface DropshipOrder {
  id: string;
  tenantId?: string;
  partnerId: string;
  /** Mã đơn nội bộ VComm */
  code: string;
  /** Mã đơn trên kênh của đối tác */
  externalOrderCode: string;
  channel: DropshipChannel;
  items: DropshipOrderItem[];
  itemCount: number;
  quantity: number;
  buyerName?: string;
  buyerPhone?: string;
  shippingAddress?: string;
  shippingProvinceCode?: string;
  /** VComm thu hộ */
  codAmount: number;
  /** Vốn hàng VComm xuất */
  totalCost: number;
  shippingFee: number;
  /** Chênh lệch gộp = tiền thu − vốn − ship */
  grossMargin: number;
  /** Phần đối tác được hưởng */
  partnerMargin: number;
  /** Phần VComm giữ */
  vcommMargin: number;
  carrier?: string;
  trackingCode?: string;
  status: DropshipOrderStatus;
  reservedAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  settledAt?: string | null;
  cancelledAt?: string | null;
  cancelledReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** accrual: ghi nhận margin khi đơn delivered · payout: đã trả · adjustment: điều chỉnh */
export type DropshipLedgerType = 'accrual' | 'payout' | 'adjustment';
export type DropshipLedgerStatus = 'pending' | 'paid' | 'void';

export interface DropshipMarginEntry {
  id: string;
  tenantId?: string;
  partnerId: string;
  orderId?: string | null;
  type: DropshipLedgerType;
  /** Số dương = tăng nghĩa vụ của VComm với đối tác */
  amount: number;
  note?: string;
  status: DropshipLedgerStatus;
  /** Kỳ đối soát, ví dụ '2026-09' */
  period?: string;
  paidAt?: string | null;
  payoutRef?: string | null;
  createdAt?: string;
}

// ============================================================================
// O2O (Phần A) — VCOMM HUB — spec 018
// ============================================================================
// Trạm giao hàng / shop offline do VComm TỰ VẬN HÀNH, dùng phần mềm VComm HUB,
// CÙNG TENANT với VComm → nằm trong repo này.
//
// Shop Offline ĐỐI TÁC (phần mềm iPOS) là sản phẩm SaaS ĐA TENANT RIÊNG BIỆT,
// KHÔNG nằm ở đây. Điểm giao nhau duy nhất là API xác thực QR nhận hàng
// (/api/o2o/verify-pickup) — cả VComm HUB và iPOS đều gọi chung một API.
export type VCommHubType =
  | 'standard'  // trạm tiêu chuẩn, có nhân viên trực
  | 'freeze'    // trạm đông lạnh, hàng tươi sống / đông lạnh
  | 'locker';   // tủ khóa 24-7, tự phục vụ

export type VCommHubStatus = 'active' | 'full' | 'maintenance' | 'inactive';

export interface VCommHub {
  id: string;
  tenantId?: string;
  code: string;
  name: string;
  type: VCommHubType;
  provinceCode?: string;
  provinceName?: string;
  address?: string;
  /** Toạ độ — chờ nâng cấp PostGIS theo Đề án F.4 (đã ghi nhận nợ Năm 2) */
  latitude?: number | null;
  longitude?: number | null;
  capacity: number;
  currentLoad: number;
  open247?: boolean;
  operatingHours?: string;
  managerName?: string;
  phone?: string;
  status: VCommHubStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type HubShipmentStatus =
  | 'in_transit'  // đang vận chuyển đến trạm
  | 'arrived'     // đã đến trạm, chờ sắp xếp
  | 'ready'       // sẵn sàng nhận, bắt đầu tính 72h
  | 'picked_up'   // khách đã nhận (quét QR)
  | 'expired'     // quá 72h chưa nhận
  | 'returned';   // đã hoàn về kho

export interface HubShipment {
  id: string;
  tenantId?: string;
  hubId: string;
  orderId?: string | null;
  trackingCode: string;
  /** Mã QR động xoay vòng theo thời gian (TOTP) */
  pickupCode?: string | null;
  qrSecret?: string | null;
  qrIssuedAt?: string | null;
  recipientName?: string;
  recipientPhone?: string;
  codAmount: number;
  /** Quỹ bảo hiểm O2O 100–200đ/đơn */
  insuranceFee: number;
  /** Phạt 15% khi không nhận trong 72h */
  penaltyAmount: number;
  /** Đồng kiểm tại quầy */
  inspectionOk?: boolean | null;
  refundedAmount: number;
  status: HubShipmentStatus;
  arrivedAt?: string | null;
  readyAt?: string | null;
  reminder48hAt?: string | null;
  reminder72hAt?: string | null;
  pickedUpAt?: string | null;
  expiredAt?: string | null;
  returnedAt?: string | null;
  cancelledReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Kết quả quét QR nhận hàng — trả về cho cả VComm HUB và iPOS.
 *
 * Dùng interface với field optional thay vì discriminated union theo `ok: true/false`
 * vì project đang TẮT `strictNullChecks` — TS không narrow được union khi
 * discriminant là boolean literal trong cấu hình đó.
 */
export interface PickupVerificationResult {
  ok: boolean;
  /** Có khi ok = true */
  shipment?: HubShipment;
  /** Có khi ok = false */
  reason?: 'NOT_FOUND' | 'EXPIRED' | 'INVALID_CODE' | 'NOT_READY';
}

// ============================================================================
// TRỤ CỘT 7 — V-XU (điểm thưởng xuyên suốt hệ sinh thái) — spec 019
// ============================================================================
// KHÁC loyalty điểm hiện có (spec 010): V-Xu dùng SỔ CÁI KẾ TOÁN KÉP
// (double-entry) — mỗi giao dịch 2 vế debit/credit cân bằng (Đề án F.5).
//
// Hạng theo CHI TIÊU lũy kế + số đơn (Đề án E.5):
//   Đồng: mặc định · Bạc: >2tr (5 đơn) · Vàng: >8tr (20 đơn) · KC: >20tr (50 đơn)
// Hoàn tiền theo hạng: 1% · 2% · 3,5% · 5%
export type VxuTier = 'dong' | 'bac' | 'vang' | 'kim_cuong';

export const VXU_TIERS: Array<{
  tier: VxuTier;
  label: string;
  /** Ngưỡng chi tiêu lũy kế (VND) để đạt hạng — dấu ">" */
  minSpendVnd: number;
  /** Số đơn hoàn tất tối thiểu */
  minOrders: number;
  /** Tỉ lệ hoàn tiền trên giá trị đơn */
  cashbackRate: number;
}> = [
  { tier: 'dong', label: 'Đồng', minSpendVnd: 0, minOrders: 0, cashbackRate: 0.01 },
  { tier: 'bac', label: 'Bạc', minSpendVnd: 2_000_000, minOrders: 5, cashbackRate: 0.02 },
  { tier: 'vang', label: 'Vàng', minSpendVnd: 8_000_000, minOrders: 20, cashbackRate: 0.035 },
  { tier: 'kim_cuong', label: 'Kim Cương', minSpendVnd: 20_000_000, minOrders: 50, cashbackRate: 0.05 },
];

export interface VxuAccount {
  id: string;
  tenantId?: string;
  customerId: string;
  /** Số dư V-Xu hiện có = tổng credit − tổng debit của các bút toán đã ghi */
  balance: number;
  /** Tổng V-Xu tích luỹ từ trước tới nay (không trừ khi tiêu) — để tính hạng */
  lifetimeEarned: number;
  /** Tổng chi tiêu lũy kế (VND) — điều kiện thăng hạng */
  lifetimeSpendVnd: number;
  /** Số đơn hoàn tất lũy kế — điều kiện thăng hạng thứ hai */
  lifetimeOrders: number;
  tier: VxuTier;
  tierChangedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type VxuEntrySide = 'debit' | 'credit';
export type VxuEntryType = 'earn' | 'spend' | 'refund' | 'expire' | 'adjust';

/** Một vế trong bút toán kép. Mỗi giao dịch luôn có đúng 2 vế cân bằng. */
export interface VxuLedgerEntry {
  id: string;
  tenantId?: string;
  /** Các dòng cùng transactionId thuộc một bút toán kép */
  transactionId: string;
  side: VxuEntrySide;
  /**
   * Tài khoản của vế này:
   *   vxu_customer:<id> — ví khách · vxu_issuer — nguồn phát hành
   *   vxu_revenue — doanh thu VComm · vxu_expired — điểm hết hạn
   */
  account: string;
  counterAccount: string;
  customerId?: string | null;
  amount: number;
  type: VxuEntryType;
  referenceType?: string | null;
  referenceId?: string | null;
  note?: string | null;
  createdAt?: string;
}

/** Phiếu ưu đãi đổi bằng V-Xu — ma trận mở khoá theo hạng */
export interface VxuRedemption {
  id: string;
  tenantId?: string;
  customerId: string;
  voucherCode: string;
  templateCode: string;
  vxuCost: number;
  voucherValueVnd: number;
  requiredTier: VxuTier;
  minSpendVnd: number;
  status: 'issued' | 'used' | 'expired' | 'void';
  transactionId?: string | null;
  orderId?: string | null;
  usedAt?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
}

export interface StockVoucher {

  id: string;
  tenantId?: string;
  code: string;
  type: 'in' | 'out' | 'transfer' | 'inventory' | 'adjust' | 'damage' | 'return';
  status: 'draft' | 'pending_approval' | 'approved' | 'cancelled';
  sourceWarehouseId?: string;
  targetWarehouseId?: string;
  createdBy?: string;
  createdAt?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface StockVoucherItem {
  id: string;
  tenantId?: string;
  voucherId: string;
  productId: string;
  quantity: number;
}

// =============================================================================
// SPEC 021 — TT99/2025/TT-BTC: Chế độ kế toán DOANH NGHIỆP
// =============================================================================
// Có hiệu lực 01/01/2026, thay thế TT200/2014/TT-BTC (Điều 31).
// Áp dụng cho MỌI chủ thể trong VComm ERP — kể cả hộ kinh doanh — theo quyết
// định của chủ dự án ngày 01/09/2026 ("Chỉ TT99, gỡ TT88").
//
// Điều 11 : chỉ 71 tài khoản cấp 1 là bắt buộc; tự chủ hoàn toàn cấp 2/3
//           (nhưng phải quy định trong Quy chế hạch toán kế toán).
// Điều 12 : sổ kế toán — 42 mẫu tham khảo ở Phụ lục III, được tự thiết kế.
// Điều 13 : mở sổ / ghi sổ / khóa sổ — khóa sổ là bất biến.
// Điều 7  : hợp nhất đơn vị trực thuộc, loại bỏ toàn bộ giao dịch nội bộ.
// Điều 28 : phần mềm kế toán — lưu vết, chống xoá/sửa, xuất dữ liệu cho thuế.
// Điều 14-27: BCTC — "Bảng cân đối kế toán" đổi tên thành
//             "Báo cáo tình hình tài chính" (B01-DN).
// =============================================================================

/** Phân loại tài khoản theo Phần A Phụ lục II TT99 */
export type AccAccountType =
  | 'asset'            // Tài sản                      111 → 244
  | 'liability'        // Nợ phải trả                  331 → 357
  | 'equity'           // Vốn chủ sở hữu               411 → 421
  | 'revenue'          // Doanh thu                    511, 515, 521
  | 'expense'          // Chi phí sản xuất kinh doanh  621 → 642
  | 'other_income'     // Thu nhập khác                711
  | 'other_expense'    // Chi phí khác                 811, 821
  | 'determine_result';// Xác định kết quả kinh doanh  911

/** Bên dư chủ yếu của tài khoản */
export type AccBalanceSide = 'debit' | 'credit';

export interface AccAccount {
  id: string;
  tenantId?: string;
  code: string;
  name: string;
  level: 1 | 2 | 3;
  parentCode?: string | null;
  accountType: AccAccountType;
  balanceSide: AccBalanceSide;
  /** TRUE = 71 TK cấp 1 do TT99 ban hành — không được xoá/khoá (Điều 11) */
  isSystem: boolean;
  /** Điều 11(2)(d): TK tự mở phải dẫn chiếu Quy chế hạch toán kế toán */
  regulationRef?: string | null;
  isActive: boolean;
  trackPartner: boolean;
  trackUnit: boolean;
  /** Công nợ nội bộ (136/336) — tự động gắn cờ giao dịch nội bộ (Điều 7) */
  isIntercompany: boolean;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const ACC_ACCOUNT_TYPE_LABEL: Record<AccAccountType, string> = {
  asset: 'Tài sản',
  liability: 'Nợ phải trả',
  equity: 'Vốn chủ sở hữu',
  revenue: 'Doanh thu',
  expense: 'Chi phí sản xuất kinh doanh',
  other_income: 'Thu nhập khác',
  other_expense: 'Chi phí khác',
  determine_result: 'Xác định kết quả kinh doanh'
};

export const ACC_BALANCE_SIDE_LABEL: Record<AccBalanceSide, string> = {
  debit: 'Bên Nợ',
  credit: 'Bên Có'
};

// --- Ngoại tệ & tỷ giá (Điều 4-6) -------------------------------------------
export interface AccCurrency {
  id: string;
  tenantId?: string;
  code: string;
  name: string;
  symbol?: string | null;
  isBase: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AccFxRate {
  id: string;
  tenantId?: string;
  currencyCode: string;
  rateDate: string;
  bookedRate: number;
  actualRate?: number | null;
  deviationPct?: number | null;
  exceedsTolerance: boolean;
  tolerancePct: number;
  note?: string | null;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// --- Kỳ kế toán (Điều 13) ----------------------------------------------------
export type AccPeriodStatus = 'open' | 'locked' | 'closed';

export interface AccPeriod {
  id: string;
  tenantId?: string;
  periodYear: number;
  /** NULL = kỳ năm; 1..12 = tháng; 21..24 = quý 1..4 */
  periodNo?: number | null;
  startDate: string;
  endDate: string;
  status: AccPeriodStatus;
  closedAt?: string | null;
  closedBy?: string | null;
  closingHash?: string | null;
  closingNote?: string | null;
  /** Điều 28(3): xuất dữ liệu kịp thời cho cơ quan thuế */
  exportedAt?: string | null;
  exportedBy?: string | null;
  exportFormat?: 'json' | 'xml' | 'csv' | 'xlsx' | null;
  createdAt?: string;
  updatedAt?: string;
}

export const ACC_PERIOD_STATUS_LABEL: Record<AccPeriodStatus, string> = {
  open: 'Đang mở',
  locked: 'Khoá tạm',
  closed: 'Đã khoá sổ'
};

// --- Chứng từ & bút toán kép (Điều 12) ---------------------------------------
/**
 * Loại chứng từ.
 * PNK phiếu nhập kho · PXK phiếu xuất kho · PT phiếu thu · PC phiếu chi ·
 * BN báo Nợ · BC báo Có · GHI ghi nhận · KT kết chuyển · PKT phân bổ/khác
 */
export type AccVoucherType = 'PNK' | 'PXK' | 'PT' | 'PC' | 'BN' | 'BC' | 'GHI' | 'KT' | 'PKT';

export const ACC_VOUCHER_TYPES: { code: AccVoucherType; label: string }[] = [
  { code: 'PNK', label: 'Phiếu nhập kho' },
  { code: 'PXK', label: 'Phiếu xuất kho' },
  { code: 'PT', label: 'Phiếu thu' },
  { code: 'PC', label: 'Phiếu chi' },
  { code: 'BN', label: 'Báo Nợ' },
  { code: 'BC', label: 'Báo Có' },
  { code: 'GHI', label: 'Chứng từ ghi nhận' },
  { code: 'KT', label: 'Chứng từ kết chuyển' },
  { code: 'PKT', label: 'Chứng từ phân bổ / khác' }
];

export type AccVoucherStatus = 'draft' | 'posted' | 'reversed';

export const ACC_VOUCHER_STATUS_LABEL: Record<AccVoucherStatus, string> = {
  draft: 'Nháp',
  posted: 'Đã ghi sổ',
  reversed: 'Đã điều chỉnh'
};

export interface AccVoucher {
  id: string;
  tenantId?: string;
  voucherNo: string;
  voucherType: AccVoucherType;
  voucherDate: string;
  postDate: string;
  periodId: string;
  unitId?: string | null;
  currencyCode: string;
  fxRate: number;
  description: string;
  attachments?: { name: string; url: string; sha256?: string }[] | null;
  status: AccVoucherStatus;
  /** Luật Kế toán Điều 27: sửa sai bằng chứng từ MỚI trỏ về chứng từ gốc */
  reversalOf?: string | null;
  reversalReason?: string | null;
  sourceType?: 'order' | 'einvoice' | 'bank' | 'manual' | 'payroll' | 'vxu' | string | null;
  sourceId?: string | null;
  createdBy?: string | null;
  postedBy?: string | null;
  postedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  /** Dùng khi đọc chi tiết — không phải cột DB */
  lines?: AccVoucherLine[];
}

export interface AccVoucherLine {
  id: string;
  tenantId?: string;
  voucherId: string;
  lineNo: number;
  accountCode: string;
  description?: string | null;
  /** VND — đơn vị tiền tệ kế toán (Điều 4) */
  debit: number;
  credit: number;
  /** Nguyên tệ khi currencyCode <> 'VND' */
  debitOrig: number;
  creditOrig: number;
  partnerId?: string | null;
  partnerType?: 'customer' | 'seller' | 'supplier' | 'employee' | 'other' | null;
  unitId?: string | null;
  costCenter?: string | null;
  /** Điều 7: giao dịch nội bộ — sẽ bị loại bỏ khi hợp nhất */
  isInternal: boolean;
  counterpartyUnitId?: string | null;
  createdAt?: string;
}

/** Nhật ký chung (view v_acc_general_journal) */
export interface AccJournalRow extends AccVoucherLine {
  voucherNo: string;
  voucherType: AccVoucherType;
  voucherDate: string;
  postDate: string;
  voucherStatus: AccVoucherStatus;
  periodId: string;
  accountName?: string | null;
  accountType?: AccAccountType | null;
  /** Diễn giải của chứng từ (cột `voucher_desc` trong view) */
  voucherDesc?: string | null;
  /** Diễn giải riêng của từng bút toán (cột `line_desc` trong view) */
  lineDesc?: string | null;
}

// --- Lưu vết thay đổi (Điều 28) ----------------------------------------------
export type AccAuditAction = 'INSERT' | 'UPDATE' | 'DELETE' | 'POST' | 'CLOSE' | 'EXPORT';

export const ACC_AUDIT_ACTION_LABEL: Record<AccAuditAction, string> = {
  INSERT: 'Tạo mới',
  UPDATE: 'Cập nhật',
  DELETE: 'Xoá',
  POST: 'Ghi sổ',
  CLOSE: 'Khoá sổ',
  EXPORT: 'Xuất dữ liệu'
};

export interface AccAuditLogEntry {
  id: number;
  tenantId?: string;
  tableName: string;
  recordId: string;
  action: AccAuditAction;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
  changedFields?: string[] | null;
  actor?: string | null;
  actorIp?: string | null;
  reason?: string | null;
  occurredAt: string;
  seq: number;
  prevHash?: string | null;
  hash?: string | null;
}

/** Kết quả kiểm tra tính toàn vẹn chuỗi lưu vết */
export interface AccChainBreak {
  seq: number;
  tableName: string;
  recordId: string;
  action: AccAuditAction;
  occurredAt: string;
  issue: string;
}

// --- Đơn vị trực thuộc & hợp nhất (Điều 7) -----------------------------------
export type AccUnitType =
  | 'head_office' | 'branch' | 'factory' | 'shop' | 'hub' | 'warehouse';

export const ACC_UNIT_TYPE_LABEL: Record<AccUnitType, string> = {
  head_office: 'Trụ sở chính',
  branch: 'Chi nhánh',
  factory: 'Nhà máy',
  shop: 'Shop offline',
  hub: 'VComm Hub',
  warehouse: 'Kho'
};

export interface AccUnit {
  id: string;
  tenantId?: string;
  code: string;
  name: string;
  parentId?: string | null;
  unitType: AccUnitType;
  /** 'none' = hạch toán độc lập, không hợp nhất */
  consolidationMethod: 'full' | 'none';
  isHeadOffice: boolean;
  address?: string | null;
  taxCode?: string | null;
  managerName?: string | null;
  isActive: boolean;
  openedAt: string;
  closedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type AccInternalTxnType =
  | 'revenue_expense' | 'receivable_payable' | 'unrealized_profit';

export const ACC_INTERNAL_TXN_LABEL: Record<AccInternalTxnType, string> = {
  revenue_expense: 'Doanh thu / chi phí nội bộ',
  receivable_payable: 'Công nợ nội bộ',
  unrealized_profit: 'Lãi chưa thực hiện'
};

export type AccInternalTxnStatus = 'unmatched' | 'matched' | 'eliminated';

export const ACC_INTERNAL_STATUS_LABEL: Record<AccInternalTxnStatus, string> = {
  unmatched: 'Chưa ghép cặp',
  matched: 'Đã ghép cặp',
  eliminated: 'Đã loại bỏ'
};

export interface AccInternalTxn {
  id: string;
  tenantId?: string;
  voucherId: string;
  lineId: string;
  periodId: string;
  fromUnitId: string;
  toUnitId: string;
  accountCode: string;
  amount: number;
  txnType: AccInternalTxnType;
  status: AccInternalTxnStatus;
  matchedTxnId?: string | null;
  matchedAt?: string | null;
  eliminationId?: string | null;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type AccEliminationType =
  | 'revenue_expense' | 'receivable_payable' | 'unrealized_profit' | 'investment_equity';

export const ACC_ELIMINATION_LABEL: Record<AccEliminationType, string> = {
  revenue_expense: 'Loại bỏ doanh thu / chi phí nội bộ',
  receivable_payable: 'Loại bỏ công nợ nội bộ (136 ↔ 336)',
  unrealized_profit: 'Loại bỏ lãi chưa thực hiện',
  investment_equity: 'Loại bỏ giá trị góp vốn vào đơn vị trực thuộc'
};

export interface AccElimination {
  id: string;
  tenantId?: string;
  eliminationNo: string;
  periodId: string;
  eliminationDate: string;
  eliminationType: AccEliminationType;
  description: string;
  totalAmount: number;
  voucherId?: string | null;
  status: 'draft' | 'posted';
  createdBy?: string | null;
  postedBy?: string | null;
  postedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  lines?: AccEliminationLine[];
}

export interface AccEliminationLine {
  id: string;
  tenantId?: string;
  eliminationId: string;
  lineNo: number;
  accountCode: string;
  description?: string | null;
  debit: number;
  credit: number;
  unitId?: string | null;
  internalTxnId?: string | null;
}

// --- Doanh thu IFRS 15 — 5 bước ----------------------------------------------
export type RevContractStatus =
  | 'draft' | 'active' | 'suspended' | 'completed' | 'cancelled' | 'terminated';

export const REV_CONTRACT_STATUS_LABEL: Record<RevContractStatus, string> = {
  draft: 'Nháp',
  active: 'Đang hiệu lực',
  suspended: 'Tạm ngưng',
  completed: 'Hoàn thành',
  cancelled: 'Huỷ',
  terminated: 'Chấm dứt'
};

/** Bước 1 + 3: hợp đồng với khách hàng & giá giao dịch */
export interface RevContract {
  id: string;
  tenantId?: string;
  contractNo: string;
  customerId: string;
  orderId?: string | null;
  f2b2bSourceId?: string | null;
  signedDate: string;
  effectiveDate?: string | null;
  endDate?: string | null;
  /** IFRS 15: hợp đồng chỉ được ghi nhận khi có khả năng thu hồi tiền */
  collectability: 'probable' | 'doubtful';
  status: RevContractStatus;
  currencyCode: string;
  fxRate: number;
  fixedAmount: number;
  variableAmount: number;
  /** Ràng buộc với phần biến động — % được phép ghi nhận */
  variableConstraintPct: number;
  transactionPrice: number;
  allocatedTotal: number;
  recognizedTotal: number;
  /** Doanh thu chờ phân bổ — theo dõi trên TK 3387 */
  deferredTotal: number;
  cancellationDate?: string | null;
  note?: string | null;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Bước 2: nghĩa vụ thực hiện */
export interface RevPerformanceObligation {
  id: string;
  tenantId?: string;
  contractId: string;
  code: string;
  name: string;
  obligationType: 'point_in_time' | 'over_time';
  progressMethod?: 'poc_input' | 'poc_output' | 'straight_line' | null;
  standaloneSellingPrice: number;
  allocationPct: number;
  allocatedAmount: number;
  revenueAccountCode: string;
  deferredAccountCode: string;
  satisfiedAt?: string | null;
  progressPct: number;
  recognizedAmount: number;
  status: 'pending' | 'in_progress' | 'satisfied' | 'cancelled';
  displayOrder: number;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const REV_OBLIGATION_TYPE_LABEL: Record<'point_in_time' | 'over_time', string> = {
  point_in_time: 'Tại một thời điểm',
  over_time: 'Trong một khoảng thời gian'
};

export const REV_PROGRESS_METHOD_LABEL: Record<'poc_input' | 'poc_output' | 'straight_line', string> = {
  poc_input: 'Theo chi phí phát sinh',
  poc_output: 'Theo kết quả đầu ra',
  straight_line: 'Theo thời gian'
};

/** Bước 4: phân bổ giá giao dịch */
export interface RevPriceAllocation {
  id: string;
  tenantId?: string;
  contractId: string;
  obligationId: string;
  standaloneSellingPrice: number;
  allocationPct: number;
  allocatedFixed: number;
  allocatedVariable: number;
  allocatedDiscount: number;
  allocatedTotal: number;
  basis: 'relative_ssp' | 'residual' | 'direct' | 'manual';
  justification?: string | null;
  allocatedAt: string;
  allocatedBy?: string | null;
  isSuperseded: boolean;
}

/** Bước 5: ghi nhận doanh thu */
export interface RevRecognition {
  id: string;
  tenantId?: string;
  obligationId: string;
  contractId: string;
  periodId: string;
  recognitionDate: string;
  method: 'point_in_time' | 'over_time' | 'breakage' | 'expiry';
  progressPct: number;
  recognizedAmount: number;
  cumulativeRecognized: number;
  remainingAmount: number;
  breakagePct?: number | null;
  voucherId?: string | null;
  status: 'draft' | 'posted';
  reason?: string | null;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// --- Báo cáo tài chính (Điều 14-27) ------------------------------------------
/**
 * ⚠️ TT99 ĐỔI TÊN: "Bảng cân đối kế toán" → "Báo cáo tình hình tài chính".
 * Hậu tố -HKD (hộ kinh doanh) KHÔNG tồn tại trong TT99 — Finance.tsx cũ đang
 * dùng sai B01-HKD / B02-HKD và cần sửa thành B01-DN / B02-DN.
 */
export type FsReportCode = 'B01-DN' | 'B02-DN' | 'B03-DN' | 'B09-DN';

export const FS_REPORT_LABEL: Record<FsReportCode, string> = {
  'B01-DN': 'Báo cáo tình hình tài chính',
  'B02-DN': 'Báo cáo kết quả hoạt động kinh doanh',
  'B03-DN': 'Báo cáo lưu chuyển tiền tệ',
  'B09-DN': 'Thuyết minh báo cáo tài chính'
};

export interface FsReport {
  id: string;
  tenantId?: string;
  reportCode: FsReportCode;
  periodId: string;
  /** 'consolidated' = đã loại bỏ giao dịch nội bộ (Điều 7) */
  scope: 'company' | 'consolidated';
  /** Điều 14-27: BCTC năm bắt buộc; giữa niên độ không bắt buộc */
  reportType: 'annual' | 'interim';
  status: 'draft' | 'approved' | 'submitted';
  revisionNo: number;
  preparedBy?: string | null;
  preparedAt?: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  submittedAt?: string | null;
  contentHash?: string | null;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface FsReportLine {
  id: string;
  tenantId?: string;
  reportId: string;
  /** "Mã số" theo mẫu TT99 — Điều 14-27 cấm đánh lại số thứ tự */
  lineCode: string;
  lineName: string;
  displayOrder: number;
  indentLevel: number;
  isBold: boolean;
  isSection: boolean;
  /** TRUE = chỉ tiêu do doanh nghiệp TỰ THÊM (được phép) */
  isCustom: boolean;
  currentAmount?: number | null;
  priorAmount?: number | null;
  formula?: string | null;
  dataType?: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | null;
  note?: string | null;
  createdAt?: string;
}

export interface FsAccountMapping {
  id: string;
  tenantId?: string;
  reportCode: FsReportCode;
  lineCode: string;
  accountCode: string;
  sign: '+' | '-';
  note?: string | null;
  createdAt?: string;
}
