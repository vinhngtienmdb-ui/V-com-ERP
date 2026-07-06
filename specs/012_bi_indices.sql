-- SQL Migration for Phase 6: E-Commerce & BI Database Optimizations

-- Create settlements relational table if not exists
CREATE TABLE IF NOT EXISTS public.settlements (
  id text PRIMARY KEY,
  tenant_id text NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  seller_id text,
  seller_name text,
  period_start timestamp with time zone,
  period_end timestamp with time zone,
  total_sales numeric(15,2) DEFAULT 0.00,
  commission_fee numeric(15,2) DEFAULT 0.00,
  shipping_fee numeric(15,2) DEFAULT 0.00,
  net_payout numeric(15,2) DEFAULT 0.00,
  status text DEFAULT 'pending',
  paid_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for settlements
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all actions for authenticated users on settlements" ON public.settlements
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create withdrawals document table if not exists
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id text PRIMARY KEY,
  tenant_id text,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for withdrawals
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all actions for authenticated users on withdrawals" ON public.withdrawals
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_tenant_status ON public.orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_settlement ON public.orders(settlement_status, seller_id);

-- Indexes for products
CREATE INDEX IF NOT EXISTS idx_products_tenant_status ON public.products(tenant_id, approval_status);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);

-- Indexes for settlements
CREATE INDEX IF NOT EXISTS idx_settlements_tenant_status ON public.settlements(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_settlements_seller ON public.settlements(seller_id);

-- Indexes for withdrawals
CREATE INDEX IF NOT EXISTS idx_withdrawals_tenant ON public.withdrawals(tenant_id);

-- Indexes for partner_ledgers
CREATE INDEX IF NOT EXISTS idx_partner_ledgers_partner ON public.partner_ledgers(partner_id);

-- Indexes for loyalty_points_ledger
CREATE INDEX IF NOT EXISTS idx_loyalty_points_customer ON public.loyalty_points_ledger(customer_id);

-- Indexes for support_tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer ON public.support_tickets(customer_id);
