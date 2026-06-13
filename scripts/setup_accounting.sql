-- =============================================================================
-- SQL DDL: THIẾT KẾ CƠ SỞ DỮ LIỆU KẾ TOÁN SỔ KÉP NỘI BỘ (DOUBLE-ENTRY LEDGER)
-- =============================================================================

-- 1. Bảng accounts (Hệ thống tài khoản kế toán - Chart of Accounts)
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,                       -- Số hiệu tài khoản (Ví dụ: '1111', '1121', '131')
  name TEXT NOT NULL,                        -- Tên tài khoản (Ví dụ: 'Tiền mặt VND')
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_id TEXT REFERENCES accounts(id) ON DELETE SET NULL, -- Liên kết tài khoản mẹ
  tenant_id TEXT NOT NULL,                   -- Phân vùng doanh nghiệp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Bảng journal_entries (Chứng từ ghi sổ kế toán)
CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,                       -- Số chứng từ (Ví dụ: 'PC001', 'VC-1002')
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()), -- Ngày hạch toán
  ref TEXT,                                  -- Chứng từ gốc tham chiếu (Hóa đơn, UNC...)
  description TEXT,                          -- Diễn giải chung
  tenant_id TEXT NOT NULL,                   -- Phân vùng doanh nghiệp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Bảng journal_items (Định khoản chi tiết Nợ/Có)
CREATE TABLE IF NOT EXISTS journal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  debit NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (debit >= 0),
  credit NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (credit >= 0),
  partner_id TEXT,                           -- Chi tiết đối tượng (khách hàng, NCC, nhân viên)
  tenant_id TEXT NOT NULL,                   -- Phân vùng doanh nghiệp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tạo chỉ mục để tối ưu hóa truy vấn sổ cái và báo cáo
CREATE INDEX IF NOT EXISTS journal_items_account_idx ON journal_items(account_id);
CREATE INDEX IF NOT EXISTS journal_items_entry_idx ON journal_items(entry_id);
CREATE INDEX IF NOT EXISTS journal_items_tenant_idx ON journal_items(tenant_id);

-- =============================================================================
-- THIẾT LẬP ROW LEVEL SECURITY (RLS) - PHÂN QUYỀN ĐA DOANH NGHIỆP
-- =============================================================================

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_items ENABLE ROW LEVEL SECURITY;

-- 1. Chính sách cho bảng accounts
CREATE POLICY accounts_tenant_isolation ON accounts
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- 2. Chính sách cho bảng journal_entries
CREATE POLICY journal_entries_tenant_isolation ON journal_entries
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- 3. Chính sách cho bảng journal_items
CREATE POLICY journal_items_tenant_isolation ON journal_items
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- =============================================================================
-- SEED DATA: DANH MỤC TÀI KHOẢN KẾ TOÁN MẪU (VAS STANDARD)
-- =============================================================================

INSERT INTO accounts (id, name, type, tenant_id) VALUES
  ('1111', 'Tiền mặt tại quỹ VND', 'asset', 'tenant-vcomm-prod-01'),
  ('1121', 'Tiền gửi Ngân hàng VND', 'asset', 'tenant-vcomm-prod-01'),
  ('131', 'Phải thu của khách hàng', 'asset', 'tenant-vcomm-prod-01'),
  ('156', 'Hàng hóa', 'asset', 'tenant-vcomm-prod-01'),
  ('331', 'Phải trả cho người bán', 'liability', 'tenant-vcomm-prod-01'),
  ('33311', 'Thuế GTGT đầu ra được khấu trừ', 'liability', 'tenant-vcomm-prod-01'),
  ('3388', 'Phải trả, phải nộp khác', 'liability', 'tenant-vcomm-prod-01'),
  ('4111', 'Vốn góp của chủ sở hữu', 'equity', 'tenant-vcomm-prod-01'),
  ('5111', 'Doanh thu bán hàng hóa', 'revenue', 'tenant-vcomm-prod-01'),
  ('632', 'Giá vốn hàng bán', 'expense', 'tenant-vcomm-prod-01'),
  ('642', 'Chi phí quản lý doanh nghiệp', 'expense', 'tenant-vcomm-prod-01')
ON CONFLICT (id) DO NOTHING;
