-- =============================================================================
-- SQL DDL: BẢNG CẤU HÌNH DOANH NGHIỆP & NGÀY KHÓA SỔ (TENANT SETTINGS & LOCK DATE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS tenant_settings (
  id TEXT PRIMARY KEY,                       -- ID cấu hình (Ví dụ: 'config')
  tenant_id TEXT NOT NULL,                   -- tenant_id (Phân vùng doanh nghiệp)
  data JSONB NOT NULL,                       -- Chứa { closingLockDate: 'YYYY-MM-DD' }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Kích hoạt RLS
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

-- Thiết lập chính sách bảo mật đa doanh nghiệp
DROP POLICY IF EXISTS tenant_settings_isolation ON tenant_settings;
CREATE POLICY tenant_settings_isolation ON tenant_settings
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- Seed dữ liệu cấu hình ban đầu cho tenant mặc định
INSERT INTO tenant_settings (id, tenant_id, data)
VALUES ('config', 'tenant-vcomm-prod-01', '{"closingLockDate": null}'::jsonb)
ON CONFLICT (id) DO NOTHING;
