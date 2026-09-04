-- 010: Integration Config Layer — 3 nhà cung cấp add-key-sau
--   einvoice   : TT 91/2026/TT-BTC (MISA / VNPT / FPT eInvoice)
--   databank   : TT 13/2023/TT-BCT (databank BCT + truy xuất nguồn gốc)
--   cq_reporting: NĐ 52/85 báo cáo CQT + HSM chữ ký số

CREATE TABLE IF NOT EXISTS public.integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  provider_key TEXT NOT NULL,  -- 'einvoice' | 'databank' | 'cq_reporting'
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}'::jsonb, -- endpoint, api_key, secret, account... (server-side use)
  last_tested_at TIMESTAMPTZ,
  last_test_status TEXT CHECK (last_test_status IN ('ok','error','untested')),
  last_test_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider_key)
);

ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;

-- Chỉ admin đọc/ghi (RLS: staff đã đăng nhập; production nên siết role admin)
DROP POLICY IF EXISTS integration_configs_read ON public.integration_configs;
CREATE POLICY integration_configs_read ON public.integration_configs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS integration_configs_write ON public.integration_configs;
CREATE POLICY integration_configs_write ON public.integration_configs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.touch_integration_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_integration_touch ON public.integration_configs;
CREATE TRIGGER trg_integration_touch
  BEFORE UPDATE ON public.integration_configs
  FOR EACH ROW EXECUTE FUNCTION public.touch_integration_updated_at();

-- public.users: bảng map AuthContext dùng khi login (select * from users where id = uid)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  email TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff','admin','super_admin','store_manager','seller')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_read ON public.users;
CREATE POLICY users_read ON public.users
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS users_write ON public.users;
CREATE POLICY users_write ON public.users
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_users_touch ON public.users;
CREATE TRIGGER trg_users_touch
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.touch_integration_updated_at();

-- Audit cấu hình: mọi thay đổi config ghi log (biết ai đổi key khi nào)
CREATE TABLE IF NOT EXISTS public.integration_config_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  provider_key TEXT NOT NULL,
  action TEXT NOT NULL, -- 'save' | 'test' | 'enable' | 'disable'
  changed_by UUID,
  summary JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ica_provider ON public.integration_config_audit (provider_key, created_at DESC);
ALTER TABLE public.integration_config_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ica_read ON public.integration_config_audit;
CREATE POLICY ica_read ON public.integration_config_audit
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS ica_write ON public.integration_config_audit;
CREATE POLICY ica_write ON public.integration_config_audit
  FOR INSERT TO authenticated WITH CHECK (true);

-- Seed 3 provider mặc định trạng thái not-configured
INSERT INTO public.integration_configs (tenant_id, provider_key, is_enabled, config, last_test_status)
VALUES
  ('tenant-vcomm-prod-01', 'einvoice', false, '{}'::jsonb, 'untested'),
  ('tenant-vcomm-prod-01', 'databank', false, '{}'::jsonb, 'untested'),
  ('tenant-vcomm-prod-01', 'cq_reporting', false, '{}'::jsonb, 'untested')
ON CONFLICT (tenant_id, provider_key) DO NOTHING;

NOTIFY pgrst, 'reload schema';
