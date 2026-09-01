-- 008: admin_audit_logs + tenants (trigger cross_module_audit ghi vào)

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  email TEXT,
  user_id TEXT,
  action TEXT, -- nullable: cross-module trigger chỉ ghi vào data JSONB
  status TEXT,
  details JSONB,
  data JSONB DEFAULT '{}'::jsonb, -- adapter non-relational ghi payload đây
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_aal_tenant_time ON public.admin_audit_logs (tenant_id, created_at DESC);
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS aal_isolation ON public.admin_audit_logs;
CREATE POLICY aal_isolation ON public.admin_audit_logs
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- tenants (logAdminAudit ghi subcollection tenants/{id}/audit_logs)
CREATE TABLE IF NOT EXISTS public.tenants (
  id TEXT PRIMARY KEY DEFAULT 'tenant-vcomm-prod-01',
  name TEXT,
  plan TEXT DEFAULT 'enterprise',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.tenants (id, name) VALUES ('tenant-vcomm-prod-01', 'VComm Production')
ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenants_read ON public.tenants;
CREATE POLICY tenants_read ON public.tenants
  FOR SELECT TO authenticated USING (true);

-- audit_logs tenant con (bảng ghi từ tenants/{id}/audit_logs subcollection)
CREATE TABLE IF NOT EXISTS public.tenant_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  email TEXT,
  user_id TEXT,
  action TEXT, -- nullable cho JSONB-pattern writes
  status TEXT,
  details JSONB,
  data JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tal_tenant_time ON public.tenant_audit_logs (tenant_id, created_at DESC);
ALTER TABLE public.tenant_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tal_isolation ON public.tenant_audit_logs;
CREATE POLICY tal_isolation ON public.tenant_audit_logs
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- Firestore-compat: nhân viên
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  name TEXT,
  username TEXT UNIQUE,
  role TEXT DEFAULT 'staff' CHECK (role IN ('staff','admin','super_admin','store_manager','seller')),
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS staff_isolation ON public.staff;
CREATE POLICY staff_isolation ON public.staff
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

NOTIFY pgrst, 'reload schema';
