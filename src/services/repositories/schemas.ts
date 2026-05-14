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

export type ProductInput = z.infer<typeof ProductSchema>;
export type OrderInput = z.infer<typeof OrderSchema>;
export type CustomerInput = z.infer<typeof CustomerSchema>;
