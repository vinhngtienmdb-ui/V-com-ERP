import { makeRepository } from './base';
import {
  ProductSchema, OrderSchema, CustomerSchema, InventoryMovementSchema,
  type ProductInput, type OrderInput, type CustomerInput, type InventoryMovementInput,
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

export * from './schemas';
export * from './orders';
export * from './inventory';
