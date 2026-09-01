-- 009: các bảng non-relational dùng pattern (id, tenant_id, data JSONB) của adapter

CREATE TABLE IF NOT EXISTS public.admin_audit_logs_data_compat (LIKE public.admin_audit_logs INCLUDING ALL);
DROP TABLE IF EXISTS public.admin_audit_logs_data_compat;

-- admin_audit_logs cần cột data JSONB (adapter non-relational ghi payload vào data)
ALTER TABLE public.admin_audit_logs
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.tenant_audit_logs
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

-- Danh sách bảng adapter Firestore-compat khác (logAdminAudit ghi tenants/{id}/audit_logs,
-- request_hub, workflow...) — tạo dạng JSONB pattern
CREATE TABLE IF NOT EXISTS public.requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS requests_isolation ON public.requests;
CREATE POLICY requests_isolation ON public.requests
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE TABLE IF NOT EXISTS public.ipos_stores (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ipos_stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ipos_stores_isolation ON public.ipos_stores;
CREATE POLICY ipos_stores_isolation ON public.ipos_stores
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- employees đã có từ setup_cross_module_triggers — kiểm tra có data JSONB chưa
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='employees' AND column_name='id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='employees' AND column_name='data') THEN
    ALTER TABLE public.employees ADD COLUMN data JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
