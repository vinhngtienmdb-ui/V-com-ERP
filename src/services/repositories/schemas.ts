import { z } from 'zod';

/**
 * Schema "biên giới" cho dữ liệu Firestore — đảm bảo client nhận đúng kiểu
 * trước khi vào React state, đồng bộ với firestore.rules (validate ở server).
 */

const Timestamp = z.union([z.string(), z.date(), z.any()]); // Firestore Timestamp đa hình

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(200),
  sku: z.string().optional(),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative().optional(),
  category: z.string().optional(),
  status: z.enum(['in_stock', 'low_stock', 'out_of_stock', 'pending_approval', 'hidden']).optional(),
  image: z.string().optional(),
  sellerName: z.string().optional(),
  brand: z.string().optional(),
  costPrice: z.number().nonnegative().optional(),
  hiddenCosts: z.number().nonnegative().optional(),
  margin: z.number().optional(),
  profit: z.number().optional(),
  updatedAt: Timestamp.optional(),
});

export const OrderItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
});

export const OrderStatus = z.enum([
  'pending', 'processing', 'shipped', 'delivered',
  'completed', 'cancelled', 'returning', 'returned',
]);

export const PaymentMethod = z.enum([
  'cash', 'qr', 'pos', 'loyalty', 'loyalty_full',
  'cod', 'bank_transfer', 'e_wallet', 'virtual_account', 'promo_qr',
]);

export const OrderSchema = z.object({
  id: z.string(),
  customerName: z.string(),
  customerId: z.string().optional(),
  staffId: z.string().optional(),
  date: z.string().optional(),
  total: z.number().nonnegative(),
  status: OrderStatus,
  items: z.array(OrderItemSchema).min(1).max(200),
  paymentMethod: PaymentMethod.optional(),
  source: z.string().optional(),
  storeId: z.string().optional(),
  createdAt: Timestamp.optional(),
  updatedAt: Timestamp.optional(),
});

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(9).max(15),
  totalSpent: z.number().optional(),
  orderCount: z.number().int().optional(),
  lastOrderDate: z.string().optional(),
  status: z.enum(['active', 'inactive', 'locked']).optional(),
  channels: z.array(z.enum(['zalo', 'facebook', 'web', 'hotline'])).optional(),
  rfmScore: z.object({
    recency: z.number(),
    frequency: z.number(),
    monetary: z.number(),
  }).optional(),
  tier: z.string().optional(),
  points: z.number().optional(),
  aiInsight: z.string().optional(),
  walletBalance: z.number().optional(),
});

export const InventoryMovementType = z.enum([
  'stock_in',       // Nhập kho (mua/sản xuất)
  'stock_out',      // Xuất kho (bán/giao đơn)
  'transfer',       // Chuyển kho giữa stores
  'adjustment',     // Hiệu chỉnh (kiểm kê, hao hụt)
  'return',         // Nhận lại từ khách
]);

export const InventoryMovementSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string().optional(),
  storeId: z.string().optional(),
  type: InventoryMovementType,
  quantity: z.number().int(), // dương = vào kho, âm = ra kho
  costPriceAtMove: z.number().nonnegative().optional(),
  reason: z.string().optional(),
  refOrderId: z.string().optional(),
  refTransferId: z.string().optional(),
  staffId: z.string(),
  createdAt: Timestamp.optional(),
});

// ── Seller (nhà bán hàng) ──────────────────────────────────────────────────
export const SellerEntityType = z.enum(['individual', 'household', 'company']);
export const SellerStatus = z.enum([
  'pending_docs',         // Mới đăng ký, chưa upload đủ tài liệu
  'pending_verification', // Đã upload, chờ KYC team duyệt
  'verified',             // KYC pass, chưa active sản phẩm
  'active',               // Đang kinh doanh
  'suspended',            // Tạm ngưng (vi phạm chính sách)
  'rejected',             // KYC fail
  'closed',               // Đóng shop tự nguyện
]);

export const KycDocSchema = z.object({
  type: z.enum(['cccd_front', 'cccd_back', 'passport', 'gpkd', 'mst', 'bank_proof', 'other']),
  url: z.string().url(),
  uploadedAt: Timestamp.optional(),
  verifiedAt: Timestamp.optional(),
  verifiedBy: z.string().optional(),
});

export const SellerSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(200),
  entityType: SellerEntityType,
  status: SellerStatus,
  ownerName: z.string().min(2),
  ownerEmail: z.string().email().optional().or(z.literal('')),
  ownerPhone: z.string().min(9).max(15),
  taxCode: z.string().optional(),          // MST cá nhân/hộ KD/DN
  identityCard: z.string().optional(),     // CCCD 12 số (cá nhân)
  businessLicense: z.string().optional(),  // GPKD số (hộ KD/DN)
  address: z.string().optional(),
  representative: z.string().optional(),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  commissionRate: z.number().min(0).max(1).optional(), // 0.0-1.0 (5% = 0.05)
  joinedAt: Timestamp.optional(),
  verifiedAt: Timestamp.optional(),
  suspendedAt: Timestamp.optional(),
  suspendedReason: z.string().optional(),
  kycDocs: z.array(KycDocSchema).optional(),
  // KPI snapshots (denormalized — update từ Cloud Function khi đơn complete)
  totalProducts: z.number().int().optional(),
  totalGmv: z.number().nonnegative().optional(),
  rating: z.number().min(0).max(5).optional(),
});

// ── Wallet (số dư seller / khách) ──────────────────────────────────────────
export const WalletOwnerType = z.enum(['seller', 'customer', 'staff', 'system']);

export const WalletSchema = z.object({
  id: z.string(), // format: "{ownerType}_{ownerId}"
  ownerType: WalletOwnerType,
  ownerId: z.string(),
  balance: z.number(),               // Có thể âm (công nợ)
  pendingBalance: z.number().optional(), // Số dư đang chờ release (escrow)
  currency: z.string().default('VND'),
  updatedAt: Timestamp.optional(),
});

// ── Wallet transaction (sổ phụ, append-only) ───────────────────────────────
export const WalletTxType = z.enum([
  'topup',          // Nạp tiền
  'withdraw',       // Rút tiền (chờ duyệt)
  'order_credit',   // Sàn ghi nhận thanh toán đơn vào ví seller (sau settlement)
  'order_debit',    // Sàn trừ tiền seller (chargeback, hoàn tiền khách)
  'commission',     // Sàn trừ hoa hồng
  'transfer',       // Giữa các ví
  'adjustment',     // Hiệu chỉnh thủ công (cần lý do)
]);

export const WalletTxSchema = z.object({
  id: z.string(),
  walletId: z.string(),
  type: WalletTxType,
  amount: z.number(),     // dương = vào ví, âm = ra ví
  refOrderId: z.string().optional(),
  refSettlementId: z.string().optional(),
  description: z.string(),
  staffId: z.string(),
  createdAt: Timestamp.optional(),
});

// ── Transaction (sổ cái tài chính, append-only) ────────────────────────────
export const TransactionType = z.enum([
  'income',         // Thu (doanh thu, lãi, khác)
  'expense',        // Chi (chi phí vận hành)
  'commission',     // Hoa hồng sàn thu
  'shipping_cost',  // Phí ship trả carrier
  'refund',         // Hoàn tiền khách
  'payout',         // Trả tiền seller (settlement T+N)
  'tax',            // Thuế nộp ngân sách (VAT, TNCN)
  'adjustment',     // Bút toán đảo
]);

export const TransactionSchema = z.object({
  id: z.string(),
  description: z.string().min(1).max(500),
  amount: z.number(),               // dương = thu, âm = chi
  type: TransactionType,
  category: z.string().optional(),
  orderId: z.string().optional(),
  sellerId: z.string().optional(),
  walletId: z.string().optional(),
  staffId: z.string(),
  storeId: z.string().optional(),
  // Bút toán đảo (nếu transaction này đảo 1 transaction trước đó)
  reverseOf: z.string().optional(),
  createdAt: Timestamp.optional(),
});

// ── Invoice (hóa đơn điện tử theo TT 78/2021, NĐ 123/2020) ─────────────────
export const InvoiceStatus = z.enum([
  'draft',          // Nháp, chưa phát hành
  'issued',         // Đã phát hành, có mã CQT
  'sent',           // Đã gửi khách
  'cancelled',      // Hủy (chỉ trước khi gửi CQT)
  'replaced',       // Đã thay thế bằng HĐ điều chỉnh
]);

export const InvoiceLineItemSchema = z.object({
  productCode: z.string().optional(),
  description: z.string(),
  unit: z.string().default('cái'),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  vatRate: z.number().min(0).max(1).default(0.1), // 10% VAT mặc định
  amount: z.number(),       // quantity * unitPrice (chưa VAT)
  vatAmount: z.number(),    // amount * vatRate
});

export const InvoiceSchema = z.object({
  id: z.string(),
  // Mã CQT cấp sau khi phát hành (NULL nếu draft)
  taxAuthorityCode: z.string().optional(),
  invoiceNumber: z.string(),       // Số hóa đơn (sequential)
  templateNumber: z.string().default('1/001'),
  serialNumber: z.string(),        // VD: K23TVC (K=ký hiệu, 23=năm, T=loại, V=mặt hàng VC=tên DN)
  // Bên bán
  sellerTaxCode: z.string(),
  sellerName: z.string(),
  sellerAddress: z.string(),
  // Bên mua
  buyerTaxCode: z.string().optional(),
  buyerName: z.string(),
  buyerAddress: z.string().optional(),
  buyerEmail: z.string().email().optional().or(z.literal('')),
  // Nội dung
  items: z.array(InvoiceLineItemSchema).min(1),
  subtotal: z.number().nonnegative(),       // Tổng tiền chưa VAT
  vatTotal: z.number().nonnegative(),       // Tổng VAT
  total: z.number().nonnegative(),          // Tổng phải trả
  paymentMethod: z.string().optional(),
  status: InvoiceStatus,
  issuedAt: Timestamp.optional(),
  cancelledAt: Timestamp.optional(),
  cancelReason: z.string().optional(),
  // Link tới order gốc
  orderId: z.string().optional(),
  sellerId: z.string().optional(),
  // Chữ ký số / signature info
  signatureProvider: z.string().optional(), // 'VNPT-CA' | 'Viettel-CA' | 'FPT-CA'
  signatureValue: z.string().optional(),
  signedAt: Timestamp.optional(),
});

// ── Seller Tax Report (NĐ 117/2025) ─────────────────────────────────────────
// Mỗi seller, mỗi tháng → 1 báo cáo doanh thu để khai thuế.
export const SellerTaxReportSchema = z.object({
  id: z.string(),                  // format: "{sellerId}_{YYYY-MM}"
  sellerId: z.string(),
  sellerTaxCode: z.string(),
  sellerName: z.string(),
  period: z.string(),              // 'YYYY-MM'
  // Doanh thu trong kỳ
  totalGmv: z.number().nonnegative(),
  totalOrders: z.number().int().nonnegative(),
  totalReturns: z.number().nonnegative(),
  netRevenue: z.number().nonnegative(),
  // Thuế ước tính (cá nhân kinh doanh: 1.5%/doanh thu; HKD: tùy)
  estimatedTaxAmount: z.number().nonnegative(),
  // Trạng thái nộp
  submittedToTaxAuthority: z.boolean().default(false),
  submittedAt: Timestamp.optional(),
  generatedAt: Timestamp.optional(),
});

// ── Campaign (Marketing/FlashSale/Voucher/Ads) ─────────────────────────────
export const CampaignType = z.enum([
  'flash_sale',     // Flash sale theo khung giờ
  'voucher',        // Mã giảm giá
  'group_buy',      // Mua chung
  'landing_page',   // Trang đích marketing
  'ad_facebook',    // Quảng cáo FB
  'ad_google',      // Google Ads
  'ad_tiktok',      // TikTok Ads
]);

export const CampaignStatus = z.enum(['draft', 'upcoming', 'active', 'paused', 'expired', 'cancelled']);

export const CampaignSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(200),
  type: CampaignType,
  status: CampaignStatus,
  budget: z.number().nonnegative().optional(),
  spent: z.number().nonnegative().optional(),
  gmvGenerated: z.number().nonnegative().optional(),
  roi: z.number().optional(),
  startDate: z.string(),
  endDate: z.string(),
  ownerId: z.string().optional(),       // staff phụ trách
  sellerId: z.string().optional(),      // nếu campaign của 1 seller
  storeId: z.string().optional(),
  // Cấu hình giảm giá
  discountType: z.enum(['percent', 'fixed', 'free_shipping']).optional(),
  discountValue: z.number().nonnegative().optional(),
  minOrderValue: z.number().nonnegative().optional(),
  maxDiscount: z.number().nonnegative().optional(),
  usageLimit: z.number().int().nonnegative().optional(),
  usageCount: z.number().int().nonnegative().optional(),
  productIds: z.array(z.string()).optional(), // áp dụng cho sản phẩm cụ thể
  categories: z.array(z.string()).optional(),
  createdAt: Timestamp.optional(),
  updatedAt: Timestamp.optional(),
});

// ── Affiliate (KOL/KOC/Publisher) ───────────────────────────────────────────
export const AffiliateType = z.enum(['kol', 'koc', 'publisher', 'agent']);
export const AffiliateStatus = z.enum(['pending', 'active', 'suspended', 'closed']);

export const AffiliateSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(200),
  type: AffiliateType,
  status: AffiliateStatus,
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  socialUrl: z.string().url().optional().or(z.literal('')),
  follower: z.number().int().nonnegative().optional(),
  niche: z.string().optional(),   // beauty/fashion/tech/...
  // Cấu hình hoa hồng
  commissionRate: z.number().min(0).max(1),   // default rate cho mọi đơn
  tierCommissions: z.array(z.object({
    minOrders: z.number().int(),
    rate: z.number().min(0).max(1),
  })).optional(),
  // KPI
  commissionEarned: z.number().nonnegative().optional(),
  ordersCount: z.number().int().nonnegative().optional(),
  clickThroughRate: z.number().optional(),
  // Mã giới thiệu unique
  refCode: z.string(),
  joinedAt: Timestamp.optional(),
});

// ── Payout (seller rút tiền từ wallet) ─────────────────────────────────────
export const PayoutStatus = z.enum([
  'pending',        // Mới yêu cầu
  'approved',       // Đã duyệt, chờ chuyển
  'processing',     // Đang chuyển khoản
  'completed',      // Đã chuyển xong
  'rejected',       // Từ chối
  'failed',         // Chuyển thất bại
]);

export const PayoutSchema = z.object({
  id: z.string(),
  sellerId: z.string(),
  walletId: z.string(),
  amount: z.number().positive(),
  bankName: z.string(),
  bankAccount: z.string(),
  bankAccountName: z.string(),
  status: PayoutStatus,
  requestedBy: z.string(),  // uid nhân viên/seller request
  approvedBy: z.string().optional(),
  approvedAt: Timestamp.optional(),
  processedBy: z.string().optional(),
  processedAt: Timestamp.optional(),
  completedAt: Timestamp.optional(),
  rejectedReason: z.string().optional(),
  bankReference: z.string().optional(),  // mã giao dịch ngân hàng
  fee: z.number().nonnegative().optional(),
  netAmount: z.number().nonnegative().optional(),
  createdAt: Timestamp.optional(),
});

// ── Procurement — Supplier ─────────────────────────────────────────────────
export const SupplierSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(200),
  taxCode: z.string().optional(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  paymentTerm: z.number().int().nonnegative().optional(), // N ngày sau giao
  rating: z.number().min(0).max(5).optional(),
  status: z.enum(['active', 'inactive', 'blacklisted']),
  totalOrders: z.number().int().nonnegative().optional(),
  totalSpent: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  createdAt: Timestamp.optional(),
});

// ── Procurement — Purchase order ───────────────────────────────────────────
export const PurchaseOrderStatus = z.enum([
  'draft',          // Nháp
  'pending_approval', // Chờ duyệt
  'approved',       // Đã duyệt
  'sent',           // Đã gửi NCC
  'partial_received', // Nhận một phần
  'received',       // Nhận đủ
  'cancelled',
]);

export const PurchaseOrderSchema = z.object({
  id: z.string(),
  poNumber: z.string(),
  supplierId: z.string(),
  supplierName: z.string(),
  status: PurchaseOrderStatus,
  items: z.array(z.object({
    productId: z.string().optional(),
    description: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().nonnegative(),
    receivedQuantity: z.number().int().nonnegative().default(0),
  })).min(1),
  subtotal: z.number().nonnegative(),
  vatTotal: z.number().nonnegative().optional(),
  total: z.number().nonnegative(),
  orderDate: z.string(),
  expectedDate: z.string().optional(),
  receivedDate: z.string().optional(),
  approvedBy: z.string().optional(),
  approvedAt: Timestamp.optional(),
  storeId: z.string().optional(),
  notes: z.string().optional(),
  createdAt: Timestamp.optional(),
});

// ── Contract (Hợp đồng) ────────────────────────────────────────────────────
export const ContractStatus = z.enum([
  'draft',          // Nháp
  'pending_review', // Chờ pháp chế review
  'pending_sign',   // Chờ ký
  'signed',         // Đã ký
  'active',         // Đang hiệu lực
  'expired',        // Hết hạn
  'terminated',     // Chấm dứt sớm
]);
export const ContractType = z.enum([
  'seller',         // HĐ với seller
  'employment',     // HĐ lao động
  'partnership',    // HĐ hợp tác
  'service',        // HĐ dịch vụ
  'nda',            // Bảo mật
  'other',
]);
export const ContractSchema = z.object({
  id: z.string(),
  contractNumber: z.string(),
  title: z.string().min(2).max(300),
  type: ContractType,
  status: ContractStatus,
  partyAName: z.string(),
  partyATaxCode: z.string().optional(),
  partyBName: z.string(),
  partyBTaxCode: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  signedAt: Timestamp.optional(),
  amount: z.number().nonnegative().optional(),
  documentUrl: z.string().url().optional().or(z.literal('')),
  signatureUrls: z.array(z.string().url()).optional(),
  ownerStaffId: z.string().optional(),
  signedBy: z.array(z.string()).optional(),
  createdAt: Timestamp.optional(),
});

// ── Document (Công văn / file lưu trữ) ─────────────────────────────────────
export const DocumentDirection = z.enum(['incoming', 'outgoing', 'internal']);
export const DocumentStatus = z.enum(['draft', 'pending', 'processed', 'archived']);
export const DocumentSchema = z.object({
  id: z.string(),
  documentNumber: z.string(),   // Số văn bản
  title: z.string().min(2).max(500),
  direction: DocumentDirection,
  fromOrg: z.string().optional(),
  toOrg: z.string().optional(),
  status: DocumentStatus,
  category: z.string().optional(),
  fileUrls: z.array(z.string().url()).optional(),
  receivedAt: Timestamp.optional(),
  processedBy: z.string().optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  createdAt: Timestamp.optional(),
});

// ── Digital signature (CA cert) ────────────────────────────────────────────
export const SignatureCertSchema = z.object({
  id: z.string(),
  ownerName: z.string(),
  ownerTaxCode: z.string(),
  provider: z.enum(['VNPT-CA', 'Viettel-CA', 'FPT-CA', 'BKAV-CA', 'Other']),
  serialNumber: z.string(),
  issuedAt: Timestamp.optional(),
  expiresAt: Timestamp.optional(),
  status: z.enum(['active', 'expired', 'revoked']),
  publicKeyFingerprint: z.string().optional(),
  notes: z.string().optional(),
  createdAt: Timestamp.optional(),
});

// ── OmniChat — Chat thread + message ───────────────────────────────────────
export const ChatChannel = z.enum(['zalo', 'facebook', 'instagram', 'tiktok', 'webchat', 'hotline', 'email']);
export const ChatThreadStatus = z.enum(['open', 'pending', 'resolved', 'spam']);

export const ChatThreadSchema = z.object({
  id: z.string(),
  channel: ChatChannel,
  externalId: z.string().optional(),    // ID phía Zalo/FB (để dedupe inbound)
  customerName: z.string(),
  customerId: z.string().optional(),
  customerAvatar: z.string().optional(),
  lastMessage: z.string().optional(),
  lastMessageAt: Timestamp.optional(),
  unreadCount: z.number().int().nonnegative().default(0),
  assignedTo: z.string().optional(),    // staff uid
  status: ChatThreadStatus,
  tags: z.array(z.string()).optional(),
  createdAt: Timestamp.optional(),
});

export const ChatMessageDirection = z.enum(['inbound', 'outbound']);
export const ChatMessageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  direction: ChatMessageDirection,
  content: z.string(),
  contentType: z.enum(['text', 'image', 'video', 'file', 'template']).default('text'),
  mediaUrl: z.string().url().optional().or(z.literal('')),
  senderId: z.string(),                 // staff uid hoặc customer external id
  senderName: z.string().optional(),
  // Trạng thái gửi outbound (chỉ áp dụng outbound)
  deliveryStatus: z.enum(['queued', 'sent', 'delivered', 'read', 'failed']).optional(),
  errorMessage: z.string().optional(),
  createdAt: Timestamp.optional(),
});

// ── Loyalty — Program config ───────────────────────────────────────────────
export const LoyaltyProgramSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  // Quy đổi: 1 điểm = N VND chi tiêu
  vndPerPoint: z.number().positive().default(1000),
  // Khi đổi điểm: 1 điểm = M VND giá trị giảm
  pointValueVnd: z.number().positive().default(100),
  // Tiers theo total spent
  tiers: z.array(z.object({
    name: z.string(),       // Bronze/Silver/Gold/Platinum
    minTotalSpent: z.number().nonnegative(),
    multiplier: z.number().positive().default(1), // điểm x multiplier theo tier
    perks: z.array(z.string()).optional(),
  })).optional(),
  updatedAt: Timestamp.optional(),
});

// ── Loyalty — Point transaction (append-only) ──────────────────────────────
export const PointTxType = z.enum([
  'earn_order',     // Tích từ đơn hàng
  'earn_bonus',     // Bonus đặc biệt
  'redeem',         // Đổi điểm thành discount
  'expire',         // Hết hạn (cron quét hàng tháng)
  'adjustment',     // Hiệu chỉnh thủ công
]);

export const PointTransactionSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  type: PointTxType,
  points: z.number(),                  // dương = cộng, âm = trừ
  refOrderId: z.string().optional(),
  description: z.string(),
  balanceAfter: z.number().int().optional(),
  staffId: z.string(),
  createdAt: Timestamp.optional(),
  expiresAt: Timestamp.optional(),     // điểm có thể hết hạn 12 tháng
});

// ── HR — Employee ───────────────────────────────────────────────────────────
export const EmploymentStatus = z.enum(['probation', 'active', 'leave', 'terminated', 'retired']);
export const EmployeeSchema = z.object({
  id: z.string(),
  uid: z.string().optional(),         // link Firebase Auth user (nếu employee có login)
  fullName: z.string().min(2).max(200),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(9).max(15).optional(),
  identityCard: z.string().optional(),
  dob: z.string().optional(),         // YYYY-MM-DD
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  managerId: z.string().optional(),
  storeId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  baseSalary: z.number().nonnegative().optional(),
  employmentStatus: EmploymentStatus,
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  taxCode: z.string().optional(),
  socialInsurance: z.string().optional(),
  updatedAt: Timestamp.optional(),
});

// ── HR — Attendance ─────────────────────────────────────────────────────────
export const AttendanceType = z.enum(['check_in', 'check_out', 'leave', 'absent', 'overtime']);
export const AttendanceSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  storeId: z.string().optional(),
  date: z.string(),                  // YYYY-MM-DD
  type: AttendanceType,
  timestamp: Timestamp.optional(),
  hours: z.number().nonnegative().optional(),
  note: z.string().optional(),
  approvedBy: z.string().optional(),
  createdAt: Timestamp.optional(),
});

// ── HR — Payroll (bảng lương theo kỳ) ───────────────────────────────────────
export const PayrollStatus = z.enum(['draft', 'pending_approval', 'approved', 'paid', 'cancelled']);
export const PayrollSchema = z.object({
  id: z.string(),                    // format: {employeeId}_{YYYY-MM}
  employeeId: z.string(),
  employeeName: z.string(),
  period: z.string(),                // YYYY-MM
  baseSalary: z.number().nonnegative(),
  workDays: z.number().nonnegative().optional(),
  overtimeHours: z.number().nonnegative().optional(),
  overtimePay: z.number().nonnegative().optional(),
  bonus: z.number().nonnegative().optional(),
  allowance: z.number().nonnegative().optional(),
  deductions: z.number().nonnegative().optional(),
  insurance: z.number().nonnegative().optional(),
  personalIncomeTax: z.number().nonnegative().optional(),
  netPay: z.number().nonnegative(),
  status: PayrollStatus,
  approvedBy: z.string().optional(),
  approvedAt: Timestamp.optional(),
  paidAt: Timestamp.optional(),
  createdAt: Timestamp.optional(),
});

// ── HR — KPI ────────────────────────────────────────────────────────────────
export const KPIStatus = z.enum(['draft', 'in_progress', 'completed', 'evaluated']);
export const KPISchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  period: z.string(),                // YYYY-Qn hoặc YYYY-MM
  metrics: z.array(z.object({
    name: z.string(),
    target: z.number(),
    actual: z.number(),
    weight: z.number().min(0).max(1),
    unit: z.string().optional(),
  })),
  score: z.number().min(0).max(100).optional(),
  status: KPIStatus,
  evaluatedBy: z.string().optional(),
  evaluatedAt: Timestamp.optional(),
  feedback: z.string().optional(),
  createdAt: Timestamp.optional(),
});

export type ProductInput = z.infer<typeof ProductSchema>;
export type OrderInput = z.infer<typeof OrderSchema>;
export type CustomerInput = z.infer<typeof CustomerSchema>;
export type InventoryMovementInput = z.infer<typeof InventoryMovementSchema>;
export type SellerInput = z.infer<typeof SellerSchema>;
export type KycDoc = z.infer<typeof KycDocSchema>;
export type WalletInput = z.infer<typeof WalletSchema>;
export type WalletTxInput = z.infer<typeof WalletTxSchema>;
export type TransactionInput = z.infer<typeof TransactionSchema>;
export type InvoiceInput = z.infer<typeof InvoiceSchema>;
export type InvoiceLineItem = z.infer<typeof InvoiceLineItemSchema>;
export type SellerTaxReportInput = z.infer<typeof SellerTaxReportSchema>;
export type CampaignInput = z.infer<typeof CampaignSchema>;
export type AffiliateInput = z.infer<typeof AffiliateSchema>;
export type PayoutInput = z.infer<typeof PayoutSchema>;
export type EmployeeInput = z.infer<typeof EmployeeSchema>;
export type AttendanceInput = z.infer<typeof AttendanceSchema>;
export type PayrollInput = z.infer<typeof PayrollSchema>;
export type KPIInput = z.infer<typeof KPISchema>;
export type LoyaltyProgramInput = z.infer<typeof LoyaltyProgramSchema>;
export type PointTransactionInput = z.infer<typeof PointTransactionSchema>;
export type ChatThreadInput = z.infer<typeof ChatThreadSchema>;
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;
export type ContractInput = z.infer<typeof ContractSchema>;
export type DocumentInput = z.infer<typeof DocumentSchema>;
export type SignatureCertInput = z.infer<typeof SignatureCertSchema>;
export type SupplierInput = z.infer<typeof SupplierSchema>;
export type PurchaseOrderInput = z.infer<typeof PurchaseOrderSchema>;
