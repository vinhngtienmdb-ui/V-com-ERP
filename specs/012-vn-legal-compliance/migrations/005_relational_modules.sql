-- =============================================================================
-- MIGRATION TỔNG HỢP: BẢNG BỔ SUNG cho các module RELATIONAL_TABLES
-- Bổ sung cho normalize_relational_schema.sql — chạy SAU schema gốc
-- =============================================================================

-- 1. payments — OMS Payment Ledger (spec 004)
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  order_id TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  transaction_id TEXT,
  payment_gateway TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','success','failed','refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments (order_id, status);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payments_isolation ON public.payments;
CREATE POLICY payments_isolation ON public.payments
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- 2. product_price_history — PIM audit giá (spec 006)
CREATE TABLE IF NOT EXISTS public.product_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  product_id TEXT NOT NULL,
  old_price NUMERIC(15,2),
  new_price NUMERIC(15,2) NOT NULL,
  old_cost_price NUMERIC(15,2),
  new_cost_price NUMERIC(15,2),
  changed_by TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_pph_product ON public.product_price_history (product_id, changed_at DESC);
ALTER TABLE public.product_price_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pph_isolation ON public.product_price_history;
CREATE POLICY pph_isolation ON public.product_price_history
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- 3. partner_ledgers — công nợ đối tác (spec 008)
CREATE TABLE IF NOT EXISTS public.partner_ledgers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  partner_id TEXT NOT NULL,
  partner_type TEXT NOT NULL CHECK (partner_type IN ('seller','supplier','agent')),
  ref_type TEXT NOT NULL CHECK (ref_type IN ('settlement','order','withdrawal','purchase')),
  ref_id TEXT NOT NULL,
  debit NUMERIC(15,2) NOT NULL DEFAULT 0,
  credit NUMERIC(15,2) NOT NULL DEFAULT 0,
  balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_pl_partner ON public.partner_ledgers (partner_id, created_at DESC);
ALTER TABLE public.partner_ledgers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pl_isolation ON public.partner_ledgers;
CREATE POLICY pl_isolation ON public.partner_ledgers
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- 4. loyalty_points_ledger — CRM loyalty (spec 010)
CREATE TABLE IF NOT EXISTS public.loyalty_points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  customer_id TEXT NOT NULL,
  points_change INTEGER NOT NULL,
  balance_after INTEGER NOT NULL DEFAULT 0,
  transaction_type TEXT NOT NULL
    CHECK (transaction_type IN ('earn','redeem','adjust','expire','refund')),
  reference_type TEXT,
  reference_id TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_lpl_customer ON public.loyalty_points_ledger (customer_id, created_at DESC);
ALTER TABLE public.loyalty_points_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lpl_isolation ON public.loyalty_points_ledger;
CREATE POLICY lpl_isolation ON public.loyalty_points_ledger
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- 5. support_tickets — CSKH SLA (spec 010)
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  customer_id TEXT NOT NULL,
  customer_name TEXT,
  subject TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'low' CHECK (priority IN ('urgent','high','medium','low')),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','in_progress','waiting_customer','resolved','closed','escalated')),
  sla_deadline TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  assigned_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_tickets_sla ON public.support_tickets (status, sla_deadline) WHERE status IN ('open','in_progress');
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tickets_isolation ON public.support_tickets;
CREATE POLICY tickets_isolation ON public.support_tickets
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- 6. combos + combo_items
CREATE TABLE IF NOT EXISTS public.combos (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  name TEXT NOT NULL,
  description TEXT,
  combo_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  original_price NUMERIC(15,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','inactive','expired')),
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS combos_isolation ON public.combos;
CREATE POLICY combos_isolation ON public.combos
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE TABLE IF NOT EXISTS public.combo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  combo_id TEXT NOT NULL REFERENCES public.combos(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_combo_items ON public.combo_items (combo_id);
ALTER TABLE public.combo_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS combo_items_isolation ON public.combo_items;
CREATE POLICY combo_items_isolation ON public.combo_items
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- 7. group_buy_sessions
CREATE TABLE IF NOT EXISTS public.group_buy_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  combo_id TEXT,
  product_id TEXT,
  status TEXT NOT NULL DEFAULT 'group_open'
    CHECK (status IN ('group_open','group_reached_minimum','group_locked','supplier_confirmed','completed','cancelled')),
  min_participants INTEGER NOT NULL DEFAULT 2,
  current_participants INTEGER NOT NULL DEFAULT 0,
  price_per_unit NUMERIC(15,2) NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.group_buy_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS gbs_isolation ON public.group_buy_sessions;
CREATE POLICY gbs_isolation ON public.group_buy_sessions
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- 8. stock_vouchers + stock_voucher_items — WMS
CREATE TABLE IF NOT EXISTS public.stock_vouchers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  type TEXT NOT NULL CHECK (type IN ('import','export','transfer','adjust','count')),
  store_id TEXT,
  warehouse_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','confirmed','completed','cancelled')),
  reason TEXT,
  total_value NUMERIC(15,2) DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.stock_vouchers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sv_isolation ON public.stock_vouchers;
CREATE POLICY sv_isolation ON public.stock_vouchers
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE TABLE IF NOT EXISTS public.stock_voucher_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  voucher_id TEXT NOT NULL REFERENCES public.stock_vouchers(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  quantity NUMERIC(15,2) NOT NULL,
  unit_price NUMERIC(15,2),
  note TEXT
);
CREATE INDEX IF NOT EXISTS idx_svi ON public.stock_voucher_items (voucher_id);
ALTER TABLE public.stock_voucher_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS svi_isolation ON public.stock_voucher_items;
CREATE POLICY svi_isolation ON public.stock_voucher_items
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- 9. wallet_transactions (view logic map sang seller_transactions) + seller_transactions
CREATE TABLE IF NOT EXISTS public.seller_transactions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  seller_id TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit','withdraw','payment','refund','payout','commission','adjust')),
  gateway TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),
  balance_after NUMERIC(15,2),
  reference_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_st_seller ON public.seller_transactions (seller_id, created_at DESC);
ALTER TABLE public.seller_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS st_isolation ON public.seller_transactions;
CREATE POLICY st_isolation ON public.seller_transactions
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- wallet_transactions là alias của seller_transactions (dbService getRealTableName)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (LIKE public.seller_transactions INCLUDING ALL);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wt_isolation ON public.wallet_transactions;
CREATE POLICY wt_isolation ON public.wallet_transactions
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');
