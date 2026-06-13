-- =============================================================================
-- SQL DDL: THIẾT KẾ CƠ SỞ DỮ LIỆU CHỮ KÝ SỐ MẬT MÃ HỌC (DIGITAL SIGNATURES)
-- =============================================================================

-- 1. Bảng user_keypairs (Lưu trữ khóa công khai và thông tin chứng thư số nội bộ)
CREATE TABLE IF NOT EXISTS public.user_keypairs (
  user_id TEXT PRIMARY KEY,                  -- ID người dùng hoặc Email
  tenant_id TEXT NOT NULL,                   -- Phân vùng doanh nghiệp
  public_key TEXT NOT NULL,                  -- Khóa công khai PEM RSA
  cert_subject TEXT NOT NULL,                -- Thông tin người sở hữu chứng thư
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Bảng document_signatures (Lưu trữ các chữ ký số đã thực hiện đối với tài liệu)
CREATE TABLE IF NOT EXISTS public.document_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,                   -- Phân vùng doanh nghiệp
  document_id TEXT NOT NULL,                 -- Mã tài liệu (Ví dụ: 'REQ-AUTO-123', 'HDLD-001')
  document_type TEXT NOT NULL,               -- Loại tài liệu ('request', 'contract', 'document')
  signer_email TEXT NOT NULL,                -- Email người thực hiện ký số
  signer_name TEXT NOT NULL,                 -- Tên hiển thị người ký
  signature_hash TEXT NOT NULL,              -- Băm chữ ký số (Được mã hóa bằng Private Key)
  document_hash TEXT NOT NULL,               -- Băm SHA-256 nội dung gốc của tài liệu tại thời điểm ký
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tạo chỉ mục tìm kiếm
CREATE INDEX IF NOT EXISTS document_signatures_doc_idx ON public.document_signatures(document_id);
CREATE INDEX IF NOT EXISTS document_signatures_tenant_idx ON public.document_signatures(tenant_id);

-- =============================================================================
-- THIẾT LẬP ROW LEVEL SECURITY (RLS) - BẢO MẬT ĐA DOANH NGHIỆP
-- =============================================================================

ALTER TABLE public.user_keypairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;

-- 1. Chính sách bảo mật cho user_keypairs
DROP POLICY IF EXISTS user_keypairs_isolation ON public.user_keypairs;
CREATE POLICY user_keypairs_isolation ON public.user_keypairs
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- 2. Chính sách bảo mật cho document_signatures
DROP POLICY IF EXISTS document_signatures_isolation ON public.document_signatures;
CREATE POLICY document_signatures_isolation ON public.document_signatures
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');
