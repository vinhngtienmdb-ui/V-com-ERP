-- =============================================================================
-- SPEC 020 — TUÂN THỦ TT88/2021/TT-BTC: 7 SỔ KẾ TOÁN HỘ KINH DOANH
-- =============================================================================
-- Căn cứ pháp lý (đã đối chiếu văn bản gốc, không dùng tài liệu thứ cấp):
--
--   TT88/2021/TT-BTC Điều 5 khoản 4 — danh mục sổ kế toán gồm 7 sổ, ký hiệu
--   S1-HKD → S7-HKD. KHÔNG có danh mục "4 sổ" như spec 015 từng ghi (đã sửa).
--   Phân biệt nghĩa vụ: Điều 2(1) — bắt buộc với hộ/cá nhân kinh doanh nộp thuế
--   theo PHƯƠNG PHÁP KÊ KHAI; Điều 2(2) — khoán chỉ được khuyến khích.
--   Điều 5(4) cuối: nhiều địa điểm kinh doanh → phải mở sổ theo dõi riêng từng
--   địa điểm. Vì vậy mọi bảng sổ đều có cột `location_code`.
--
--   TT40/2021/TT-BTC Điều 10 — tỷ lệ thuế trên doanh thu (GTGT + TNCN):
--     distribution (Phân phối, cung cấp hàng hóa)        : 1,0% + 0,5% = 1,5%
--     service      (Dịch vụ, xây dựng không bao thầu NVL): 5,0% + 2,0% = 7,0%
--     manufacturing(Sản xuất, vận tải, DV gắn hàng hóa)  : 3,0% + 1,5% = 4,5%
--     other        (Hoạt động kinh doanh khác)           : 2,0% + 1,0% = 3,0%
--   → Khoảng 1,5%–4,5% mà Đề án nhắc tới tương ứng đúng 2 nhóm đầu/cuối của
--     thương mại hàng hóa, nên bảng trên bao trọn cả vùng Đề án quan tâm.
--
-- NGUYÊN TẮC THIẾT KẾ:
--   - KHÔNG lưu số dư tồn (S2/S6/S7) vào cột. Số dư được tính LŨY KẾ từ các
--     dòng nhập/xuất theo thứ tự (entry_date, id) để tránh lệch sổ khi sửa
--     chứng từ. Sửa sổ theo Luật Kế toán Điều 27 (ghi cải chính / số âm /
--     điều chỉnh) — không xoá dòng đã ghi.
--   - Mỗi bảng sổ có (tenant_id, seller_id, period_year, location_code) để
--     khoá sổ độc lập theo từng hộ KD + năm + địa điểm.
--   - Mọi sổ liên kết ngược về nguồn (source_type/source_id) để đối soát.
--
-- Chạy SAU: 005_relational_modules.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. hkd_book_periods — Đăng ký mở sổ / khoá sổ (Điều 24–26 Luật Kế toán)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hkd_book_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  seller_id TEXT NOT NULL DEFAULT '',
  -- Địa điểm kinh doanh (Điều 5(4): nhiều địa điểm → mở sổ riêng từng nơi)
  location_code TEXT NOT NULL DEFAULT '',

  book_code TEXT NOT NULL
    CHECK (book_code IN ('S1-HKD','S2-HKD','S3-HKD','S4-HKD','S5-HKD','S6-HKD','S7-HKD')),
  period_year INTEGER NOT NULL,

  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  -- Số dư đầu kỳ chuyển sang (chỉ dùng cho sổ có số dư: S2/S6/S7)
  opening_balance NUMERIC(18,2) NOT NULL DEFAULT 0,

  opened_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  closed_at TIMESTAMPTZ,
  closed_by TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT hkd_period_unique UNIQUE
    (tenant_id, seller_id, location_code, book_code, period_year)
);
ALTER TABLE public.hkd_book_periods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hkd_period_isolation ON public.hkd_book_periods;
CREATE POLICY hkd_period_isolation ON public.hkd_book_periods
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_hkd_period_book
  ON public.hkd_book_periods(tenant_id, seller_id, period_year, book_code);

-- -----------------------------------------------------------------------------
-- 1. hkd_s1_revenue — Mẫu S1-HKD: Sổ chi tiết doanh thu bán hàng hóa, dịch vụ
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hkd_s1_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  seller_id TEXT NOT NULL DEFAULT '',
  location_code TEXT NOT NULL DEFAULT '',
  period_year INTEGER NOT NULL,

  entry_date DATE NOT NULL,          -- Ngày tháng ghi sổ
  voucher_no TEXT NOT NULL,          -- Số chứng từ
  voucher_date DATE NOT NULL,        -- Ngày chứng từ
  description TEXT NOT NULL,         -- Diễn giải

  revenue_amount NUMERIC(18,2) NOT NULL DEFAULT 0,   -- Doanh thu
  deduction_amount NUMERIC(18,2) NOT NULL DEFAULT 0, -- Các khoản giảm trừ
  -- Doanh thu tính thuế = revenue_amount - deduction_amount (đảm bảo bằng trigger)
  taxable_revenue NUMERIC(18,2) NOT NULL DEFAULT 0,

  -- Ngành nghề để áp tỷ lệ thuế TT40/2021
  sector_code TEXT NOT NULL DEFAULT 'distribution'
    CHECK (sector_code IN ('distribution','service','manufacturing','other')),

  note TEXT,
  source_type TEXT,   -- 'order' | 'service' | 'manual' | 'adjustment'
  source_id TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.hkd_s1_revenue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hkd_s1_isolation ON public.hkd_s1_revenue;
CREATE POLICY hkd_s1_isolation ON public.hkd_s1_revenue
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_hkd_s1_scope
  ON public.hkd_s1_revenue(tenant_id, seller_id, period_year, entry_date);
-- Chống hạch toán trùng 1 đơn hàng 2 lần
CREATE UNIQUE INDEX IF NOT EXISTS idx_hkd_s1_dedupe
  ON public.hkd_s1_revenue(tenant_id, seller_id, source_type, source_id)
  WHERE source_type = 'order';

CREATE OR REPLACE FUNCTION public.hkd_s1_sync_taxable() RETURNS TRIGGER AS $$
BEGIN
  NEW.taxable_revenue := NEW.revenue_amount - NEW.deduction_amount;
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hkd_s1_touch ON public.hkd_s1_revenue;
CREATE TRIGGER hkd_s1_touch BEFORE INSERT OR UPDATE ON public.hkd_s1_revenue
  FOR EACH ROW EXECUTE FUNCTION public.hkd_s1_sync_taxable();

-- -----------------------------------------------------------------------------
-- 2. hkd_s2_goods — Mẫu S2-HKD: Sổ chi tiết vật liệu, dụng cụ, sản phẩm, hàng hóa
--    Số dư tồn (SL + thành tiền) TÍNH LŨY KẾ, không lưu cột.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hkd_s2_goods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  seller_id TEXT NOT NULL DEFAULT '',
  location_code TEXT NOT NULL DEFAULT '',
  period_year INTEGER NOT NULL,

  entry_date DATE NOT NULL,
  voucher_no TEXT NOT NULL,
  voucher_date DATE NOT NULL,
  description TEXT NOT NULL,

  product_id TEXT,
  unit TEXT NOT NULL DEFAULT '',
  unit_price NUMERIC(18,2) NOT NULL DEFAULT 0,

  import_qty NUMERIC(18,3) NOT NULL DEFAULT 0,   -- Nhập: số lượng
  import_amount NUMERIC(18,2) NOT NULL DEFAULT 0, -- Nhập: thành tiền
  export_qty NUMERIC(18,3) NOT NULL DEFAULT 0,   -- Xuất: số lượng
  export_amount NUMERIC(18,2) NOT NULL DEFAULT 0, -- Xuất: thành tiền

  note TEXT,
  source_type TEXT,   -- 'purchase' | 'sale' | 'stock_voucher' | 'manual' | 'adjustment'
  source_id TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.hkd_s2_goods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hkd_s2_isolation ON public.hkd_s2_goods;
CREATE POLICY hkd_s2_isolation ON public.hkd_s2_goods
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_hkd_s2_scope
  ON public.hkd_s2_goods(tenant_id, seller_id, period_year, entry_date);
CREATE INDEX IF NOT EXISTS idx_hkd_s2_product
  ON public.hkd_s2_goods(tenant_id, seller_id, product_id);

CREATE OR REPLACE FUNCTION public.hkd_touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hkd_s2_touch ON public.hkd_s2_goods;
CREATE TRIGGER hkd_s2_touch BEFORE UPDATE ON public.hkd_s2_goods
  FOR EACH ROW EXECUTE FUNCTION public.hkd_touch_updated_at();

-- -----------------------------------------------------------------------------
-- 3. hkd_s3_expense — Mẫu S3-HKD: Sổ chi phí sản xuất, kinh doanh
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hkd_s3_expense (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  seller_id TEXT NOT NULL DEFAULT '',
  location_code TEXT NOT NULL DEFAULT '',
  period_year INTEGER NOT NULL,

  entry_date DATE NOT NULL,
  voucher_no TEXT NOT NULL,
  voucher_date DATE NOT NULL,
  description TEXT NOT NULL,

  -- Nhóm chi phí để tổng hợp cuối kỳ
  expense_category TEXT NOT NULL DEFAULT 'other'
    CHECK (expense_category IN
      ('goods_cost','labour','depreciation','service_fee','utility',
       'logistics','marketing','tax_fee','other')),
  amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),

  note TEXT,
  source_type TEXT,
  source_id TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.hkd_s3_expense ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hkd_s3_isolation ON public.hkd_s3_expense;
CREATE POLICY hkd_s3_isolation ON public.hkd_s3_expense
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_hkd_s3_scope
  ON public.hkd_s3_expense(tenant_id, seller_id, period_year, entry_date);

DROP TRIGGER IF EXISTS hkd_s3_touch ON public.hkd_s3_expense;
CREATE TRIGGER hkd_s3_touch BEFORE UPDATE ON public.hkd_s3_expense
  FOR EACH ROW EXECUTE FUNCTION public.hkd_touch_updated_at();

-- -----------------------------------------------------------------------------
-- 4. hkd_s4_tax — Mẫu S4-HKD: Sổ theo dõi thực hiện nghĩa vụ thuế với NSNN
--    Số thuế còn phải nộp = tax_payable - tax_paid (LUÔN tính, không lưu).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hkd_s4_tax (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  seller_id TEXT NOT NULL DEFAULT '',
  location_code TEXT NOT NULL DEFAULT '',
  period_year INTEGER NOT NULL,
  period_month TEXT,   -- 'yyyy-MM' — kỳ tính thuế (tháng/quý), NULL nếu cả năm

  tax_type TEXT NOT NULL DEFAULT 'GTGT'
    CHECK (tax_type IN ('GTGT','TNCN','MON_BAI','KHAC')),
  -- Tỷ lệ % áp dụng (lưu lại để đối chiếu khi biểu thuế đổi)
  tax_rate NUMERIC(6,4) NOT NULL DEFAULT 0,
  -- Doanh thu/ căn cứ tính thuế
  taxable_base NUMERIC(18,2) NOT NULL DEFAULT 0,

  tax_payable NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (tax_payable >= 0),
  tax_paid NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (tax_paid >= 0),

  due_date DATE,
  paid_date DATE,
  declaration_no TEXT,  -- Số tờ khai đã nộp
  note TEXT,
  source_type TEXT,
  source_id TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Không cho nộp vượt quá số phải nộp
  CONSTRAINT hkd_s4_paid_not_exceed CHECK (tax_paid <= tax_payable)
);
ALTER TABLE public.hkd_s4_tax ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hkd_s4_isolation ON public.hkd_s4_tax;
CREATE POLICY hkd_s4_isolation ON public.hkd_s4_tax
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_hkd_s4_scope
  ON public.hkd_s4_tax(tenant_id, seller_id, period_year, tax_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_hkd_s4_dedupe
  ON public.hkd_s4_tax(tenant_id, seller_id, location_code, tax_type, period_month)
  WHERE source_type = 'auto';

DROP TRIGGER IF EXISTS hkd_s4_touch ON public.hkd_s4_tax;
CREATE TRIGGER hkd_s4_touch BEFORE UPDATE ON public.hkd_s4_tax
  FOR EACH ROW EXECUTE FUNCTION public.hkd_touch_updated_at();

-- -----------------------------------------------------------------------------
-- 5. hkd_s5_payroll — Mẫu S5-HKD: Sổ theo dõi thanh toán tiền lương và các
--    khoản nộp theo lương. Lương thực nhận TÍNH, không lưu cột.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hkd_s5_payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  seller_id TEXT NOT NULL DEFAULT '',
  location_code TEXT NOT NULL DEFAULT '',
  period_year INTEGER NOT NULL,
  period_month TEXT NOT NULL,   -- 'yyyy-MM'

  employee_id TEXT NOT NULL DEFAULT '',
  employee_name TEXT NOT NULL,

  gross_salary NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (gross_salary >= 0),
  social_insurance NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (social_insurance >= 0), -- BHXH
  health_insurance NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (health_insurance >= 0), -- BHYT
  unemployment_insurance NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (unemployment_insurance >= 0), -- BHTN
  personal_income_tax NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (personal_income_tax >= 0),

  paid_date DATE,
  note TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.hkd_s5_payroll ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hkd_s5_isolation ON public.hkd_s5_payroll;
CREATE POLICY hkd_s5_isolation ON public.hkd_s5_payroll
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_hkd_s5_scope
  ON public.hkd_s5_payroll(tenant_id, seller_id, period_month);

DROP TRIGGER IF EXISTS hkd_s5_touch ON public.hkd_s5_payroll;
CREATE TRIGGER hkd_s5_touch BEFORE UPDATE ON public.hkd_s5_payroll
  FOR EACH ROW EXECUTE FUNCTION public.hkd_touch_updated_at();

-- -----------------------------------------------------------------------------
-- 6. hkd_s6_cash — Mẫu S6-HKD: Sổ quỹ tiền mặt
--    Tồn quỹ TÍNH LŨY KẾ (thu - chi) theo (entry_date, id).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hkd_s6_cash (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  seller_id TEXT NOT NULL DEFAULT '',
  location_code TEXT NOT NULL DEFAULT '',
  period_year INTEGER NOT NULL,

  entry_date DATE NOT NULL,
  voucher_no TEXT NOT NULL,
  voucher_date DATE NOT NULL,
  description TEXT NOT NULL,

  receipt_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (receipt_amount >= 0), -- Thu
  payment_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (payment_amount >= 0), -- Chi

  note TEXT,
  source_type TEXT,   -- 'order' | 'payment' | 'manual' | 'adjustment'
  source_id TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.hkd_s6_cash ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hkd_s6_isolation ON public.hkd_s6_cash;
CREATE POLICY hkd_s6_isolation ON public.hkd_s6_cash
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_hkd_s6_scope
  ON public.hkd_s6_cash(tenant_id, seller_id, period_year, entry_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_hkd_s6_dedupe
  ON public.hkd_s6_cash(tenant_id, seller_id, source_type, source_id)
  WHERE source_type = 'order';

DROP TRIGGER IF EXISTS hkd_s6_touch ON public.hkd_s6_cash;
CREATE TRIGGER hkd_s6_touch BEFORE UPDATE ON public.hkd_s6_cash
  FOR EACH ROW EXECUTE FUNCTION public.hkd_touch_updated_at();

-- -----------------------------------------------------------------------------
-- 7. hkd_s7_bank — Mẫu S7-HKD: Sổ tiền gửi ngân hàng
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hkd_s7_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  seller_id TEXT NOT NULL DEFAULT '',
  location_code TEXT NOT NULL DEFAULT '',
  period_year INTEGER NOT NULL,

  entry_date DATE NOT NULL,
  voucher_no TEXT NOT NULL,
  voucher_date DATE NOT NULL,
  description TEXT NOT NULL,

  bank_account TEXT NOT NULL DEFAULT '',  -- Số tài khoản tiền gửi
  deposit_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),     -- Thu
  withdrawal_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (withdrawal_amount >= 0), -- Chi

  note TEXT,
  source_type TEXT,
  source_id TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.hkd_s7_bank ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hkd_s7_isolation ON public.hkd_s7_bank;
CREATE POLICY hkd_s7_isolation ON public.hkd_s7_bank
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_hkd_s7_scope
  ON public.hkd_s7_bank(tenant_id, seller_id, period_year, entry_date);

DROP TRIGGER IF EXISTS hkd_s7_touch ON public.hkd_s7_bank;
CREATE TRIGGER hkd_s7_touch BEFORE UPDATE ON public.hkd_s7_bank
  FOR EACH ROW EXECUTE FUNCTION public.hkd_touch_updated_at();

-- -----------------------------------------------------------------------------
-- 8. hkd_tax_filings — Tờ khai đã tạo / đã nộp (xuất XML nộp thuedientu.gdt.gov.vn)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hkd_tax_filings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  seller_id TEXT NOT NULL DEFAULT '',
  location_code TEXT NOT NULL DEFAULT '',

  -- Mẫu tờ khai theo TT40/2021: 01/CNKD (GTGT + TNCN cho hộ/cá nhân KD)
  form_code TEXT NOT NULL DEFAULT '01/CNKD',
  period_month TEXT NOT NULL,   -- 'yyyy-MM'
  period_year INTEGER NOT NULL,

  revenue_total NUMERIC(18,2) NOT NULL DEFAULT 0,
  vat_amount NUMERIC(18,2) NOT NULL DEFAULT 0,      -- Thuế GTGT
  pit_amount NUMERIC(18,2) NOT NULL DEFAULT 0,      -- Thuế TNCN
  tax_total NUMERIC(18,2) NOT NULL DEFAULT 0,

  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','exported','submitted')),
  xml_content TEXT,
  exported_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  note TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT hkd_filing_unique UNIQUE
    (tenant_id, seller_id, location_code, form_code, period_month)
);
ALTER TABLE public.hkd_tax_filings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hkd_filing_isolation ON public.hkd_tax_filings;
CREATE POLICY hkd_filing_isolation ON public.hkd_tax_filings
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

DROP TRIGGER IF EXISTS hkd_filing_touch ON public.hkd_tax_filings;
CREATE TRIGGER hkd_filing_touch BEFORE UPDATE ON public.hkd_tax_filings
  FOR EACH ROW EXECUTE FUNCTION public.hkd_touch_updated_at();

-- -----------------------------------------------------------------------------
-- 9. View kiểm tra: các kỳ đã ghi sổ nhưng chưa mở sổ (thiếu sót thủ tục)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.hkd_missing_periods AS
SELECT tenant_id, seller_id, location_code, period_year, book_code
FROM (
  SELECT DISTINCT tenant_id, seller_id, location_code, period_year, 'S1-HKD'::text AS book_code FROM public.hkd_s1_revenue
  UNION SELECT DISTINCT tenant_id, seller_id, location_code, period_year, 'S2-HKD' FROM public.hkd_s2_goods
  UNION SELECT DISTINCT tenant_id, seller_id, location_code, period_year, 'S3-HKD' FROM public.hkd_s3_expense
  UNION SELECT DISTINCT tenant_id, seller_id, location_code, period_year, 'S4-HKD' FROM public.hkd_s4_tax
  UNION SELECT DISTINCT tenant_id, seller_id, location_code, period_year, 'S6-HKD' FROM public.hkd_s6_cash
  UNION SELECT DISTINCT tenant_id, seller_id, location_code, period_year, 'S7-HKD' FROM public.hkd_s7_bank
) recorded
WHERE NOT EXISTS (
  SELECT 1 FROM public.hkd_book_periods p
  WHERE p.tenant_id = recorded.tenant_id
    AND p.seller_id = recorded.seller_id
    AND p.location_code = recorded.location_code
    AND p.book_code = recorded.book_code
    AND p.period_year = recorded.period_year
);
