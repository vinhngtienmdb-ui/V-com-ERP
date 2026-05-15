import { makeRepository } from './base';
import {
  ProductSchema, OrderSchema, CustomerSchema, InventoryMovementSchema,
  SellerSchema, WalletSchema, WalletTxSchema,
  TransactionSchema, InvoiceSchema, SellerTaxReportSchema,
  CampaignSchema, AffiliateSchema, PayoutSchema,
  EmployeeSchema, AttendanceSchema, PayrollSchema, KPISchema,
  LoyaltyProgramSchema, PointTransactionSchema,
  ChatThreadSchema, ChatMessageSchema,
  ContractSchema, DocumentSchema, SignatureCertSchema,
  SupplierSchema, PurchaseOrderSchema,
  RequestSchema, WorkflowTaskSchema, LiveSessionSchema, SocialPostSchema,
  type ProductInput, type OrderInput, type CustomerInput, type InventoryMovementInput,
  type SellerInput, type WalletInput, type WalletTxInput,
  type TransactionInput, type InvoiceInput, type SellerTaxReportInput,
  type CampaignInput, type AffiliateInput, type PayoutInput,
  type EmployeeInput, type AttendanceInput, type PayrollInput, type KPIInput,
  type LoyaltyProgramInput, type PointTransactionInput,
  type ChatThreadInput, type ChatMessageInput,
  type ContractInput, type DocumentInput, type SignatureCertInput,
  type SupplierInput, type PurchaseOrderInput,
  type RequestInput, type WorkflowTaskInput, type LiveSessionInput, type SocialPostInput,
} from './schemas';

export const productsRepo = makeRepository<ProductInput>({
  collectionName: 'products',
  schema: ProductSchema,
});

export const ordersRepo = makeRepository<OrderInput>({
  collectionName: 'orders',
  schema: OrderSchema,
});

export const customersRepo = makeRepository<CustomerInput>({
  collectionName: 'customers',
  schema: CustomerSchema,
});

export const inventoryRepo = makeRepository<InventoryMovementInput>({
  collectionName: 'inventory_movements',
  schema: InventoryMovementSchema,
});

export const sellersRepo = makeRepository<SellerInput>({
  collectionName: 'sellers',
  schema: SellerSchema,
});

export const walletsRepo = makeRepository<WalletInput>({
  collectionName: 'wallets',
  schema: WalletSchema,
});

export const walletTxRepo = makeRepository<WalletTxInput>({
  collectionName: 'wallet_transactions',
  schema: WalletTxSchema,
});

export const transactionsRepo = makeRepository<TransactionInput>({
  collectionName: 'transactions',
  schema: TransactionSchema,
});

export const invoicesRepo = makeRepository<InvoiceInput>({
  collectionName: 'invoices',
  schema: InvoiceSchema,
});

export const sellerTaxReportsRepo = makeRepository<SellerTaxReportInput>({
  collectionName: 'seller_tax_reports',
  schema: SellerTaxReportSchema,
});

export const campaignsRepo = makeRepository<CampaignInput>({
  collectionName: 'campaigns',
  schema: CampaignSchema,
});

export const affiliatesRepo = makeRepository<AffiliateInput>({
  collectionName: 'affiliates',
  schema: AffiliateSchema,
});

export const payoutsRepo = makeRepository<PayoutInput>({
  collectionName: 'payouts',
  schema: PayoutSchema,
});

export const employeesRepo = makeRepository<EmployeeInput>({
  collectionName: 'employees',
  schema: EmployeeSchema,
});

export const attendanceRepo = makeRepository<AttendanceInput>({
  collectionName: 'attendance',
  schema: AttendanceSchema,
});

export const payrollRepo = makeRepository<PayrollInput>({
  collectionName: 'payroll',
  schema: PayrollSchema,
});

export const kpiRepo = makeRepository<KPIInput>({
  collectionName: 'kpi',
  schema: KPISchema,
});

export const loyaltyProgramsRepo = makeRepository<LoyaltyProgramInput>({
  collectionName: 'loyalty_programs',
  schema: LoyaltyProgramSchema,
});

export const pointTransactionsRepo = makeRepository<PointTransactionInput>({
  collectionName: 'point_transactions',
  schema: PointTransactionSchema,
});

export const chatThreadsRepo = makeRepository<ChatThreadInput>({
  collectionName: 'chat_threads',
  schema: ChatThreadSchema,
});

export const chatMessagesRepo = makeRepository<ChatMessageInput>({
  collectionName: 'chat_messages',
  schema: ChatMessageSchema,
});

export const contractsRepo = makeRepository<ContractInput>({
  collectionName: 'contracts',
  schema: ContractSchema,
});

export const documentsRepo = makeRepository<DocumentInput>({
  collectionName: 'documents',
  schema: DocumentSchema,
});

export const signatureCertsRepo = makeRepository<SignatureCertInput>({
  collectionName: 'signature_certs',
  schema: SignatureCertSchema,
});

export const suppliersRepo = makeRepository<SupplierInput>({
  collectionName: 'suppliers',
  schema: SupplierSchema,
});

export const purchaseOrdersRepo = makeRepository<PurchaseOrderInput>({
  collectionName: 'purchase_orders',
  schema: PurchaseOrderSchema,
});

export const requestsRepo = makeRepository<RequestInput>({
  collectionName: 'requests',
  schema: RequestSchema,
});

export const workflowTasksRepo = makeRepository<WorkflowTaskInput>({
  collectionName: 'workflow_tasks',
  schema: WorkflowTaskSchema,
});

export const liveSessionsRepo = makeRepository<LiveSessionInput>({
  collectionName: 'live_sessions',
  schema: LiveSessionSchema,
});

export const socialPostsRepo = makeRepository<SocialPostInput>({
  collectionName: 'social_posts',
  schema: SocialPostSchema,
});

export * from './schemas';
export * from './orders';
export * from './inventory';
export * from './sellers';
export * from './invoices';
export * from './rma';
