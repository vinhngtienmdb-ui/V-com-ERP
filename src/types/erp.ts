export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'pending_approval';
  image: string;
  sellerName: string;
  brand: string;
  costPrice: number; // Giá vốn
  hiddenCosts: number; // Chi phí ẩn (shipping, packing, etc)
  margin: number; // Biên lợi nhuận
  profit: number; // Lợi nhuận thực tế
}

export interface SellerMetric {
  id: string;
  name: string;
  totalProducts: number;
  rating: number;
  gmv: number;
  status: 'active' | 'suspended' | 'warning' | 'pending';
  taxCode: string;
  identityCard: string;
  commissionRate: number;
  joinDate: string;
  onboardingStep: 'documents' | 'verification' | 'completed';
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
  status: 'active' | 'inactive';
  channels: ('zalo' | 'facebook' | 'web' | 'hotline')[];
  rfmScore?: { recency: number; frequency: number; monetary: number };
  activities?: CustomerActivity[];
  tier?: string;
  points?: number;
  aiInsight?: string;
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
  customerName: string;
  date: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returning';
  items: OrderItem[];
  paymentMethod: 'cod' | 'bank_transfer' | 'e_wallet';
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
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
  period: string;
  totalSales: number;
  commissionFee: number;
  shippingFee: number;
  netPayout: number;
  status: 'pending' | 'completed' | 'failed';
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
  releaseStatus: 'locked' | 'released' | 'refunded';
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
  type: 'image_moderation' | 'content_fix' | 'fraud_alert' | 'dynamic_pricing';
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
