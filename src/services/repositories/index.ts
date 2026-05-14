import { makeRepository } from './base';
import {
  ProductSchema, OrderSchema, CustomerSchema, InventoryMovementSchema,
  SellerSchema, WalletSchema, WalletTxSchema,
  TransactionSchema, InvoiceSchema, SellerTaxReportSchema,
  CampaignSchema, AffiliateSchema, PayoutSchema,
  type ProductInput, type OrderInput, type CustomerInput, type InventoryMovementInput,
  type SellerInput, type WalletInput, type WalletTxInput,
  type TransactionInput, type InvoiceInput, type SellerTaxReportInput,
  type CampaignInput, type AffiliateInput, type PayoutInput,
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

export * from './schemas';
export * from './orders';
export * from './inventory';
export * from './sellers';
export * from './invoices';
