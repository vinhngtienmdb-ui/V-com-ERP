-- Script to upgrade 'orders' table for Multi-Seller Order Splitting

ALTER TABLE public.orders 
    ADD COLUMN IF NOT EXISTS seller_id TEXT,
    ADD COLUMN IF NOT EXISTS parent_order_id TEXT,
    ADD COLUMN IF NOT EXISTS commission_fee NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS settlement_status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid',
    ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod';

-- Add indexes to improve querying performance for Order Splitting
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_parent_order_id ON public.orders(parent_order_id);
