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
