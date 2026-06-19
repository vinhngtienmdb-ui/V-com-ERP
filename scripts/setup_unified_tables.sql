-- =============================================================================
-- SQL DDL: BẢNG PHỤ CHO CÁC PHÂN HỆ IPOS VÀ ECOMMERCE DÙNG CHUNG SUPABASE
-- =============================================================================

-- 1. Tạo bảng ipos_staff (Nhân viên POS)
CREATE TABLE IF NOT EXISTS public.ipos_staff (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.ipos_staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ipos_staff_isolation ON public.ipos_staff;
CREATE POLICY ipos_staff_isolation ON public.ipos_staff
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- 2. Tạo bảng pos_products (Sản phẩm đặc thù tại quầy POS)
CREATE TABLE IF NOT EXISTS public.pos_products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.pos_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pos_products_isolation ON public.pos_products;
CREATE POLICY pos_products_isolation ON public.pos_products
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- 3. Tạo bảng shifts (Ca làm việc & chốt két)
CREATE TABLE IF NOT EXISTS public.shifts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shifts_isolation ON public.shifts;
CREATE POLICY shifts_isolation ON public.shifts
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- 4. Tạo bảng user_bank_accounts (Tài khoản ngân hàng của khách hàng)
CREATE TABLE IF NOT EXISTS public.user_bank_accounts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.user_bank_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_bank_accounts_isolation ON public.user_bank_accounts;
CREATE POLICY user_bank_accounts_isolation ON public.user_bank_accounts
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- 5. Tạo bảng user_addresses (Sổ địa chỉ của khách hàng eCommerce)
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_addresses_isolation ON public.user_addresses;
CREATE POLICY user_addresses_isolation ON public.user_addresses
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- 6. Tạo bảng usernames (Quản lý độc nhất tên đăng nhập)
CREATE TABLE IF NOT EXISTS public.usernames (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.usernames ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS usernames_isolation ON public.usernames;
CREATE POLICY usernames_isolation ON public.usernames
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');
