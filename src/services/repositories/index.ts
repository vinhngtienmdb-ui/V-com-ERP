import { makeRepository } from './base';
import {
  ProductSchema, OrderSchema, CustomerSchema, InventoryMovementSchema,
  SellerSchema, WalletSchema, WalletTxSchema,
  type ProductInput, type OrderInput, type CustomerInput, type InventoryMovementInput,
  type SellerInput, type WalletInput, type WalletTxInput,
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

export * from './schemas';
export * from './orders';
export * from './inventory';
export * from './sellers';
