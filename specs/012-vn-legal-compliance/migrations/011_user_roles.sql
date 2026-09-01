-- 011: user_roles (AuthContext đọc làm nguồn sự thật) + RBAC chuẩn

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  user_id UUID NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'staff'
    CHECK (role IN ('customer','staff','admin','super_admin','store_manager','seller')),
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles (user_id);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_roles_read ON public.user_roles;
CREATE POLICY user_roles_read ON public.user_roles
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS user_roles_write ON public.user_roles;
CREATE POLICY user_roles_write ON public.user_roles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Gán super_admin cho admin thật (uid từ signUp 2026-08-31)
INSERT INTO public.user_roles (tenant_id, user_id, role, permissions)
VALUES ('tenant-vcomm-prod-01', '10712eb4-9a2d-4636-b265-ffdcc4616d65', 'super_admin',
        '{"all": true}'::jsonb)
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin', updated_at = now();

NOTIFY pgrst, 'reload schema';
