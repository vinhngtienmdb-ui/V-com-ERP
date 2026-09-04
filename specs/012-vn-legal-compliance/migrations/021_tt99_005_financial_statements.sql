-- =============================================================================
-- SPEC 021 — TT99/2025/TT-BTC
-- 005_financial_statements.sql — BÁO CÁO TÀI CHÍNH (Điều 14-27)
-- =============================================================================
-- Điều 14-27 TT99 — những điểm bắt buộc:
--
--   ⚠️ ĐỔI TÊN BẮT BUỘC:
--      "Bảng cân đối kế toán"  →  "BÁO CÁO TÌNH HÌNH TÀI CHÍNH"   (Mẫu B01-DN)
--
--   • BCTC NĂM là bắt buộc. BCTC GIỮA NIÊN ĐỘ KHÔNG bắt buộc.
--   • Doanh nghiệp chỉ được THÊM chỉ tiêu, KHÔNG được sửa hoặc xoá chỉ tiêu
--     do TT99 ban hành.          → cột is_custom trên fs_report_lines.
--   • KHÔNG được đánh lại số thứ tự "Mã số" của các chỉ tiêu ban hành.
--                                → cột line_code; trigger chặn đổi mã TT99.
--   • Mã số TT99 không đổi so với TT200 → dữ liệu lịch sử vẫn so sánh được.
--
-- Bốn mẫu:
--   B01-DN  Báo cáo tình hình tài chính
--   B02-DN  Báo cáo kết quả hoạt động kinh doanh
--   B03-DN  Báo cáo lưu chuyển tiền tệ
--   B09-DN  Thuyết minh báo cáo tài chính
--
-- Chạy SAU: 003_consolidation.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. fs_reports — Phiên bản báo cáo tài chính
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fs_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',

  report_code TEXT NOT NULL CHECK (report_code IN ('B01-DN','B02-DN','B03-DN','B09-DN')),
  period_id UUID NOT NULL REFERENCES public.acc_periods(id),

  -- 'company'      : BCTC riêng của pháp nhân
  -- 'consolidated' : BCTC hợp nhất (Điều 7 — đã loại bỏ giao dịch nội bộ)
  scope TEXT NOT NULL DEFAULT 'company' CHECK (scope IN ('company','consolidated')),

  -- Điều 14-27: BCTC năm bắt buộc; giữa niên độ không bắt buộc nhưng vẫn được lập
  report_type TEXT NOT NULL DEFAULT 'annual' CHECK (report_type IN ('annual','interim')),

  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','submitted')),

  -- Số lần lập lại trong cùng kỳ (bản sửa đổi sau khi đã nộp)
  revision_no INTEGER NOT NULL DEFAULT 1,

  prepared_by TEXT,
  prepared_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,

  -- Điều 28: checksum của toàn bộ số liệu báo cáo, phát hiện sửa sau duyệt
  content_hash TEXT,

  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT fs_reports_unique UNIQUE (tenant_id, period_id, report_code, scope, revision_no)
);

ALTER TABLE public.fs_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fs_reports_isolation ON public.fs_reports;
CREATE POLICY fs_reports_isolation ON public.fs_reports
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_fs_reports_period ON public.fs_reports(tenant_id, period_id);
CREATE INDEX IF NOT EXISTS idx_fs_reports_code   ON public.fs_reports(tenant_id, report_code);
CREATE INDEX IF NOT EXISTS idx_fs_reports_status ON public.fs_reports(tenant_id, status);

DROP TRIGGER IF EXISTS trg_fs_reports_touch ON public.fs_reports;
CREATE TRIGGER trg_fs_reports_touch
  BEFORE UPDATE ON public.fs_reports
  FOR EACH ROW EXECUTE FUNCTION public.acc_touch_updated_at();

-- -----------------------------------------------------------------------------
-- 2. fs_report_lines — Chỉ tiêu báo cáo tài chính
-- -----------------------------------------------------------------------------
-- line_code = "Mã số" theo mẫu TT99 ban hành (VD: '100', '110', 'V.01').
-- Điều 14-27: KHÔNG được đánh lại số thứ tự mã số → trigger chặn đổi mã TT99.
-- is_custom = TRUE : chỉ tiêu do doanh nghiệp TỰ THÊM (được phép).
--                    Mã do DN tự đặt không được trùng mã TT99 → trigger kiểm tra.
CREATE TABLE IF NOT EXISTS public.fs_report_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  report_id UUID NOT NULL REFERENCES public.fs_reports(id) ON DELETE CASCADE,

  line_code TEXT NOT NULL,                 -- Mã số: '100','110','111','V.01'...
  line_name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,

  -- Cấp thụt lề để in đúng mẫu (I, II, III / 1, 2, 3)
  indent_level INTEGER NOT NULL DEFAULT 0 CHECK (indent_level BETWEEN 0 AND 5),
  is_bold BOOLEAN NOT NULL DEFAULT FALSE,
  is_section BOOLEAN NOT NULL DEFAULT FALSE,  -- dòng tiêu đề phần (không có số)
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,

  -- Số liệu: kỳ này & kỳ trước (TT99 yêu cầu trình bày cả hai cột)
  current_amount NUMERIC(18,2),
  prior_amount NUMERIC(18,2),

  -- Công thức tự tính: 'SUM(110,120,130)' hoặc 'ACC(111,112)'
  formula TEXT,

  -- Loại dữ liệu để kiểm tra chéo: 'asset','liability','equity','revenue','expense'
  data_type TEXT,

  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT fs_lines_unique UNIQUE (report_id, line_code)
);

ALTER TABLE public.fs_report_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fs_report_lines_isolation ON public.fs_report_lines;
CREATE POLICY fs_report_lines_isolation ON public.fs_report_lines
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_fs_lines_report ON public.fs_report_lines(report_id);
CREATE INDEX IF NOT EXISTS idx_fs_lines_order  ON public.fs_report_lines(report_id, display_order);

-- Điều 14-27: không được đổi mã số của chỉ tiêu TT99; chỉ tiêu tự thêm không
-- được trùng mã TT99. Danh sách mã TT99 lưu ở bảng fs_template_lines bên dưới.
CREATE OR REPLACE FUNCTION public.fs_lines_protect_code()
RETURNS TRIGGER AS $$
DECLARE v_exists BOOLEAN;
BEGIN
  IF NEW.is_custom = FALSE THEN
    IF TG_OP = 'UPDATE' THEN
      IF NEW.line_code <> OLD.line_code THEN
        RAISE EXCEPTION
          'TT99_DIEU_14_27: Không được đánh lại "Mã số" % của chỉ tiêu TT99', OLD.line_code;
      END IF;
      IF NEW.line_name <> OLD.line_name THEN
        RAISE EXCEPTION
          'TT99_DIEU_14_27: Không được sửa tên chỉ tiêu "%" do TT99 ban hành. Doanh nghiệp chỉ được THÊM chỉ tiêu mới.', OLD.line_name;
      END IF;
    END IF;
  ELSE
    -- Chỉ tiêu tự thêm: mã không được trùng mã chuẩn TT99
    SELECT EXISTS(
      SELECT 1 FROM public.fs_template_lines t
       WHERE t.report_code = (SELECT report_code FROM public.fs_reports WHERE id = NEW.report_id)
         AND t.line_code = NEW.line_code
    ) INTO v_exists;
    IF v_exists THEN
      RAISE EXCEPTION
        'TT99_DIEU_14_27: Mã số % đã thuộc chỉ tiêu TT99 — chỉ tiêu tự thêm phải dùng mã khác',
        NEW.line_code;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 3. fs_template_lines — Mẫu chỉ tiêu chuẩn TT99 (không RLS, dùng chung)
-- -----------------------------------------------------------------------------
-- Đây là bản gốc do TT99 ban hành. Ứng dụng copy sang fs_report_lines mỗi khi
-- lập BCTC mới. Doanh nghiệp không được sửa bảng này.
CREATE TABLE IF NOT EXISTS public.fs_template_lines (
  id SERIAL PRIMARY KEY,
  report_code TEXT NOT NULL CHECK (report_code IN ('B01-DN','B02-DN','B03-DN','B09-DN')),
  line_code TEXT NOT NULL,
  line_name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  indent_level INTEGER NOT NULL DEFAULT 0,
  is_bold BOOLEAN NOT NULL DEFAULT FALSE,
  is_section BOOLEAN NOT NULL DEFAULT FALSE,
  formula TEXT,
  data_type TEXT,
  CONSTRAINT fs_template_unique UNIQUE (report_code, line_code)
);

-- =============================================================================
-- MẪU B01-DN — BÁO CÁO TÌNH HÌNH TÀI CHÍNH
-- (tên cũ: Bảng cân đối kế toán)
-- =============================================================================
INSERT INTO public.fs_template_lines
  (report_code, line_code, line_name, display_order, indent_level, is_bold, is_section, formula, data_type)
VALUES
('B01-DN','100','A. TÀI SẢN NGẮN HẠN',10,0,TRUE,TRUE,'SUM(110,120,130,140,150)','asset'),
('B01-DN','110','I. Tiền và các khoản tương đương tiền',20,1,TRUE,FALSE,'SUM(111,112)','asset'),
('B01-DN','111','1. Tiền',30,2,FALSE,FALSE,'ACC(111,112,113)','asset'),
('B01-DN','112','2. Các khoản tương đương tiền',40,2,FALSE,FALSE,'ACC(1281)','asset'),
('B01-DN','120','II. Đầu tư tài chính ngắn hạn',50,1,TRUE,FALSE,'SUM(121,122,123)','asset'),
('B01-DN','121','1. Chứng khoán kinh doanh',60,2,FALSE,FALSE,'ACC(121)','asset'),
('B01-DN','122','2. Dự phòng giảm giá chứng khoán kinh doanh',70,2,FALSE,FALSE,'ACC(-2291)','asset'),
('B01-DN','123','3. Đầu tư nắm giữ đến ngày đáo hạn',80,2,FALSE,FALSE,'ACC(128)','asset'),
('B01-DN','130','III. Các khoản phải thu ngắn hạn',90,1,TRUE,FALSE,'SUM(131,132,133,134,135,136,137,139)','asset'),
('B01-DN','131','1. Phải thu ngắn hạn của khách hàng',100,2,FALSE,FALSE,'ACC(131)','asset'),
('B01-DN','132','2. Trả trước cho người bán ngắn hạn',110,2,FALSE,FALSE,'ACC(331)','asset'),
('B01-DN','133','3. Phải thu nội bộ ngắn hạn',120,2,FALSE,FALSE,'ACC(136)','asset'),
('B01-DN','134','4. Phải thu theo tiến độ kế hoạch hợp đồng xây dựng',130,2,FALSE,FALSE,NULL,'asset'),
('B01-DN','135','5. Phải thu về cho vay ngắn hạn',140,2,FALSE,FALSE,'ACC(1283)','asset'),
('B01-DN','136','6. Phải thu ngắn hạn khác',150,2,FALSE,FALSE,'ACC(138,141,244)','asset'),
('B01-DN','137','7. Dự phòng phải thu ngắn hạn khó đòi',160,2,FALSE,FALSE,'ACC(-2293)','asset'),
('B01-DN','139','8. Tài sản thiếu chờ xử lý',170,2,FALSE,FALSE,'ACC(1381)','asset'),
('B01-DN','140','IV. Hàng tồn kho',180,1,TRUE,FALSE,'SUM(141,149)','asset'),
('B01-DN','141','1. Hàng tồn kho',190,2,FALSE,FALSE,'ACC(151,152,153,154,155,156,157,158)','asset'),
('B01-DN','149','2. Dự phòng giảm giá hàng tồn kho',200,2,FALSE,FALSE,'ACC(-2294)','asset'),
('B01-DN','150','V. Tài sản ngắn hạn khác',210,1,TRUE,FALSE,'SUM(151,152,153,154)','asset'),
('B01-DN','151','1. Chi phí trả trước ngắn hạn',220,2,FALSE,FALSE,'ACC(242)','asset'),
('B01-DN','152','2. Thuế GTGT được khấu trừ',230,2,FALSE,FALSE,'ACC(133)','asset'),
('B01-DN','153','3. Thuế và các khoản khác phải thu Nhà nước',240,2,FALSE,FALSE,'ACC(333)','asset'),
('B01-DN','154','4. Tài sản ngắn hạn khác',250,2,FALSE,FALSE,'ACC(171)','asset'),
('B01-DN','200','B. TÀI SẢN DÀI HẠN',260,0,TRUE,TRUE,'SUM(210,220,230,240,250,260)','asset'),
('B01-DN','210','I. Các khoản phải thu dài hạn',270,1,TRUE,FALSE,'ACC(136,138,244)','asset'),
('B01-DN','220','II. Tài sản cố định',280,1,TRUE,FALSE,'SUM(221,222,223,224,225,226,227)','asset'),
('B01-DN','221','1. TSCĐ hữu hình',290,2,FALSE,FALSE,'ACC(211)','asset'),
('B01-DN','224','4. TSCĐ thuê tài chính',300,2,FALSE,FALSE,'ACC(212)','asset'),
('B01-DN','225','5. TSCĐ vô hình',310,2,FALSE,FALSE,'ACC(213)','asset'),
('B01-DN','227','7. Hao mòn TSCĐ lũy kế',320,2,FALSE,FALSE,'ACC(-214)','asset'),
('B01-DN','230','III. Tài sản sinh học',330,1,TRUE,FALSE,'ACC(215)','asset'),
('B01-DN','240','IV. Bất động sản đầu tư',340,1,TRUE,FALSE,'ACC(217)','asset'),
('B01-DN','250','V. Đầu tư tài chính dài hạn',350,1,TRUE,FALSE,'ACC(221,222,228)','asset'),
('B01-DN','260','VI. Tài sản dài hạn khác',360,1,TRUE,FALSE,'ACC(241,242,243,244)','asset'),
('B01-DN','270','TỔNG CỘNG TÀI SẢN',370,0,TRUE,TRUE,'SUM(100,200)','asset'),
('B01-DN','300','C. NỢ PHẢI TRẢ',380,0,TRUE,TRUE,'SUM(310,330)','liability'),
('B01-DN','310','I. Nợ ngắn hạn',390,1,TRUE,FALSE,'ACC(331,332,333,334,335,336,337,338,341,343,344,352,353,356,357)','liability'),
('B01-DN','330','II. Nợ dài hạn',400,1,TRUE,FALSE,'ACC(341,343,344,347,352,353,356)','liability'),
('B01-DN','400','D. VỐN CHỦ SỞ HỮU',410,0,TRUE,TRUE,'SUM(410,430)','equity'),
('B01-DN','410','I. Vốn chủ sở hữu',420,1,TRUE,FALSE,'ACC(411,412,413,414,418,419,421)','equity'),
('B01-DN','430','II. Nguồn kinh phí và quỹ khác',430,1,TRUE,FALSE,NULL,'equity'),
('B01-DN','440','TỔNG CỘNG NGUỒN VỐN',440,0,TRUE,TRUE,'SUM(300,400)','equity')
ON CONFLICT (report_code, line_code) DO NOTHING;

-- =============================================================================
-- MẪU B02-DN — BÁO CÁO KẾT QUẢ HOẠT ĐỘNG KINH DOANH
-- =============================================================================
INSERT INTO public.fs_template_lines
  (report_code, line_code, line_name, display_order, indent_level, is_bold, is_section, formula, data_type)
VALUES
('B02-DN','01','1. Doanh thu bán hàng và cung cấp dịch vụ',10,0,FALSE,FALSE,'ACC(511)','revenue'),
('B02-DN','02','2. Các khoản giảm trừ doanh thu',20,0,FALSE,FALSE,'ACC(521)','revenue'),
('B02-DN','10','3. Doanh thu thuần về bán hàng và CCDV',30,0,TRUE,FALSE,'LINE(01)-LINE(02)','revenue'),
('B02-DN','11','4. Giá vốn hàng bán',40,0,FALSE,FALSE,'ACC(632)','expense'),
('B02-DN','20','5. Lợi nhuận gộp về bán hàng và CCDV',50,0,TRUE,FALSE,'LINE(10)-LINE(11)','revenue'),
('B02-DN','21','6. Doanh thu hoạt động tài chính',60,0,FALSE,FALSE,'ACC(515)','revenue'),
('B02-DN','22','7. Chi phí tài chính',70,0,FALSE,FALSE,'ACC(635)','expense'),
('B02-DN','25','9. Chi phí bán hàng',80,0,FALSE,FALSE,'ACC(641)','expense'),
('B02-DN','26','10. Chi phí quản lý doanh nghiệp',90,0,FALSE,FALSE,'ACC(642)','expense'),
('B02-DN','30','11. Lợi nhuận thuần từ hoạt động kinh doanh',100,0,TRUE,FALSE,'LINE(20)+LINE(21)-LINE(22)-LINE(25)-LINE(26)','revenue'),
('B02-DN','31','12. Thu nhập khác',110,0,FALSE,FALSE,'ACC(711)','revenue'),
('B02-DN','32','13. Chi phí khác',120,0,FALSE,FALSE,'ACC(811)','expense'),
('B02-DN','40','14. Lợi nhuận khác',130,0,FALSE,FALSE,'LINE(31)-LINE(32)','revenue'),
('B02-DN','50','15. Tổng lợi nhuận kế toán trước thuế',140,0,TRUE,FALSE,'LINE(30)+LINE(40)','revenue'),
('B02-DN','51','16. Chi phí thuế TNDN hiện hành',150,0,FALSE,FALSE,'ACC(8211)','expense'),
('B02-DN','52','17. Chi phí thuế TNDN hoãn lại',160,0,FALSE,FALSE,'ACC(8212)','expense'),
('B02-DN','60','18. Lợi nhuận sau thuế thu nhập doanh nghiệp',170,0,TRUE,FALSE,'LINE(50)-LINE(51)-LINE(52)','revenue')
ON CONFLICT (report_code, line_code) DO NOTHING;

-- Gắn trigger bảo vệ mã số SAU KHI fs_template_lines đã tồn tại
DROP TRIGGER IF EXISTS trg_fs_lines_protect ON public.fs_report_lines;
CREATE TRIGGER trg_fs_lines_protect
  BEFORE INSERT OR UPDATE ON public.fs_report_lines
  FOR EACH ROW EXECUTE FUNCTION public.fs_lines_protect_code();

-- -----------------------------------------------------------------------------
-- 4. fs_account_mappings — Map tài khoản → chỉ tiêu BCTC
-- -----------------------------------------------------------------------------
-- Cho phép doanh nghiệp tự cấu hình (nhưng KHÔNG được làm sai lệch chỉ tiêu
-- TT99). Dấu '-' cho các tài khoản điều chỉnh (214, 229, 521).
CREATE TABLE IF NOT EXISTS public.fs_account_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',

  report_code TEXT NOT NULL CHECK (report_code IN ('B01-DN','B02-DN','B03-DN','B09-DN')),
  line_code TEXT NOT NULL,
  account_code TEXT NOT NULL,
  sign TEXT NOT NULL DEFAULT '+' CHECK (sign IN ('+','-')),
  note TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT fs_mapping_unique UNIQUE (tenant_id, report_code, line_code, account_code)
);

ALTER TABLE public.fs_account_mappings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fs_account_mappings_isolation ON public.fs_account_mappings;
CREATE POLICY fs_account_mappings_isolation ON public.fs_account_mappings
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_fs_mapping_account ON public.fs_account_mappings(tenant_id, account_code);

-- -----------------------------------------------------------------------------
-- -----------------------------------------------------------------------------
-- 5. Số dư tài khoản trong kỳ — nền tảng cho mọi chỉ tiêu
-- -----------------------------------------------------------------------------
-- Dùng LIKE 'code%' để CỘNG GỒN các tài khoản con (hệ thống tài khoản là CÂY).
--   Số dư 112 = số dư 112 + 1121 + 1122 …
--   Đây KHÔNG phải trùng lặp: 1121 là tài khoản con, số dư của nó nằm trong 112.
--
-- p_scope = 'consolidated' → đọc view đã trừ bút toán loại bỏ (Điều 7).
CREATE OR REPLACE FUNCTION public.fs_compute_account_balance(
  p_tenant_id TEXT,
  p_account_code TEXT,
  p_period_id UUID,
  p_scope TEXT DEFAULT 'company'
) RETURNS NUMERIC(18,2) AS $$
DECLARE v_result NUMERIC(18,2);
BEGIN
  IF p_scope = 'consolidated' THEN
    SELECT COALESCE(SUM(c.consolidated_balance), 0) INTO v_result
      FROM public.v_acc_consolidated_ledger c
     WHERE c.tenant_id = p_tenant_id
       AND c.period_id = p_period_id
       AND c.account_code LIKE p_account_code || '%';
  ELSE
    SELECT COALESCE(SUM(l.debit) - SUM(l.credit), 0) INTO v_result
      FROM public.acc_voucher_lines l
      JOIN public.acc_vouchers v ON v.id = l.voucher_id
     WHERE l.tenant_id = p_tenant_id
       AND v.period_id = p_period_id
       AND v.status = 'posted'
       AND l.account_code LIKE p_account_code || '%';
  END IF;
  RETURN ROUND(COALESCE(v_result,0), 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- -----------------------------------------------------------------------------
-- 6. Tính số liệu MỘT chỉ tiêu từ sổ cái
-- -----------------------------------------------------------------------------
-- p_lookup_report_id — báo cáo dùng để lấy số liệu của SUM(...) / LINE(...):
--   • Tính cột "kỳ này"    → chính báo cáo hiện tại
--   • Tính cột "kỳ trước"  → báo cáo của kỳ trước (một fs_reports RIÊNG)
--
--   ⚠️ Nếu đọc prior_amount ngay trên chính báo cáo hiện tại thì SUM()/LINE()
--      sẽ tham chiếu đến số chưa tính → vòng lặp. Vì vậy fs_generate_report()
--      tạo báo cáo kỳ trước thành một bản ghi fs_reports độc lập.
--
-- Ba dạng công thức được hỗ trợ:
--   ACC(111,112,-214)   — tổng số dư tài khoản; tiền tố '-' = lấy số âm
--                         (cho tài khoản điều chỉnh: 214 hao mòn, 229 dự phòng,
--                          521 giảm trừ doanh thu)
--   SUM(110,120,130)    — tổng các chỉ tiêu khác trong cùng báo cáo
--   LINE(20)-LINE(22)   — biểu thức giữa các chỉ tiêu
CREATE OR REPLACE FUNCTION public.fs_compute_line(
  p_tenant_id TEXT,
  p_lookup_report_id UUID,
  p_report_code TEXT,
  p_line_code TEXT,
  p_period_id UUID,
  p_scope TEXT DEFAULT 'company'
) RETURNS NUMERIC(18,2) AS $$
DECLARE
  v_formula  TEXT;
  v_result   NUMERIC(18,2);
  v_accounts TEXT;
  v_sql      TEXT;
BEGIN
  SELECT formula INTO v_formula
    FROM public.fs_template_lines
   WHERE report_code = p_report_code AND line_code = p_line_code;

  -- Chỉ tiêu do doanh nghiệp TỰ THÊM (không có trong mẫu TT99) → đọc mapping
  IF v_formula IS NULL THEN
    SELECT COALESCE(SUM(
             CASE WHEN m.sign = '-' THEN -1 ELSE 1 END *
             public.fs_compute_account_balance(p_tenant_id, m.account_code,
                                               p_period_id, p_scope)), 0)
      INTO v_result
      FROM public.fs_account_mappings m
     WHERE m.tenant_id = p_tenant_id
       AND m.report_code = p_report_code
       AND m.line_code = p_line_code;
    RETURN ROUND(COALESCE(v_result,0), 2);
  END IF;

  -- ACC(...)
  IF v_formula LIKE 'ACC(%' THEN
    v_accounts := substring(v_formula from 'ACC\(([^)]*)\)');
    SELECT COALESCE(SUM(
             CASE WHEN a.acc LIKE '-%' THEN -1 ELSE 1 END *
             public.fs_compute_account_balance(
               p_tenant_id,
               CASE WHEN a.acc LIKE '-%' THEN substring(a.acc from 2) ELSE a.acc END,
               p_period_id, p_scope)), 0)
      INTO v_result
      FROM regexp_split_to_table(v_accounts, ',') AS a(acc);
    RETURN ROUND(COALESCE(v_result,0), 2);
  END IF;

  -- SUM(...)
  IF v_formula LIKE 'SUM(%' THEN
    SELECT COALESCE(SUM(COALESCE(fl.current_amount,0)), 0) INTO v_result
      FROM public.fs_report_lines fl
     WHERE fl.report_id = p_lookup_report_id
       AND fl.line_code = ANY(
             string_to_array(substring(v_formula from 'SUM\(([^)]*)\)'), ','));
    RETURN ROUND(COALESCE(v_result,0), 2);
  END IF;

  -- LINE(...) — biểu thức tuỳ ý giữa các chỉ tiêu
  IF v_formula LIKE '%LINE(%' THEN
    v_sql := regexp_replace(
      v_formula,
      'LINE\(([^)]*)\)',
      '(SELECT COALESCE(fl_sub.current_amount,0) FROM public.fs_report_lines fl_sub ' ||
      'WHERE fl_sub.report_id = $1 AND fl_sub.line_code = ''\1'')',
      'g');
    v_sql := 'SELECT ' || replace(v_sql, '$1', quote_literal(p_lookup_report_id));
    EXECUTE v_sql INTO v_result;
    RETURN ROUND(COALESCE(v_result,0), 2);
  END IF;

  RETURN 0;
END;
$$ LANGUAGE plpgsql STABLE;

-- -----------------------------------------------------------------------------
-- 7. Tính lại toàn bộ số liệu của một báo cáo (chỉ cột "kỳ này")
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fs_recalculate_report(p_report_id UUID)
RETURNS VOID AS $$
DECLARE
  r RECORD;
  v_period UUID;
  v_scope  TEXT;
  v_code   TEXT;
  v_tenant TEXT;
  v_cur    NUMERIC(18,2);
BEGIN
  SELECT period_id, scope, report_code, tenant_id
    INTO v_period, v_scope, v_code, v_tenant
    FROM public.fs_reports WHERE id = p_report_id;

  IF v_period IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy báo cáo tài chính %', p_report_id;
  END IF;

  -- Tính theo display_order để SUM()/LINE() đọc được các dòng đã tính trước đó
  FOR r IN
    SELECT id, line_code, is_section
      FROM public.fs_report_lines
     WHERE report_id = p_report_id
     ORDER BY display_order
  LOOP
    IF r.is_section THEN
      UPDATE public.fs_report_lines SET current_amount = NULL WHERE id = r.id;
      CONTINUE;
    END IF;

    v_cur := public.fs_compute_line(v_tenant, p_report_id, v_code, r.line_code,
                                    v_period, v_scope);
    UPDATE public.fs_report_lines SET current_amount = v_cur WHERE id = r.id;
  END LOOP;

  -- Điều 28: checksum số liệu — phát hiện sửa sau khi đã duyệt
  UPDATE public.fs_reports
     SET content_hash = encode(digest((
           SELECT COALESCE(string_agg(line_code || ':' ||
                    COALESCE(current_amount::TEXT,'-'), '|' ORDER BY display_order), '')
             FROM public.fs_report_lines WHERE report_id = p_report_id),
           'sha256'), 'hex')
   WHERE id = p_report_id;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 8. Sinh BCTC từ mẫu TT99
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fs_generate_report(
  p_tenant_id       TEXT DEFAULT 'tenant-vcomm-prod-01',
  p_report_code     TEXT DEFAULT 'B01-DN',
  p_period_id       UUID DEFAULT NULL,
  p_prior_period_id UUID DEFAULT NULL,
  p_scope           TEXT DEFAULT 'company',
  p_report_type     TEXT DEFAULT 'annual',
  p_prepared_by     TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_report_id       UUID;
  v_prior_report_id UUID;
  v_revision        INTEGER;
BEGIN
  -- (1) Kỳ trước được sinh thành MỘT BÁO CÁO RIÊNG (đệ quy 1 mức).
  --     Cột "kỳ trước" của báo cáo hiện tại sẽ copy current_amount của báo cáo này.
  IF p_prior_period_id IS NOT NULL THEN
    v_prior_report_id := public.fs_generate_report(
      p_tenant_id, p_report_code, p_prior_period_id, NULL,
      p_scope, p_report_type, p_prepared_by);
  END IF;

  SELECT COALESCE(MAX(revision_no),0) + 1 INTO v_revision
    FROM public.fs_reports
   WHERE tenant_id = p_tenant_id AND period_id = p_period_id
     AND report_code = p_report_code AND scope = p_scope;

  INSERT INTO public.fs_reports
    (tenant_id, report_code, period_id, scope, report_type, revision_no, prepared_by, status)
  VALUES
    (p_tenant_id, p_report_code, p_period_id, p_scope, p_report_type,
     v_revision, p_prepared_by, 'draft')
  RETURNING id INTO v_report_id;

  -- (2) Copy toàn bộ chỉ tiêu chuẩn TT99 (is_custom = FALSE)
  INSERT INTO public.fs_report_lines
    (tenant_id, report_id, line_code, line_name, display_order,
     indent_level, is_bold, is_section, is_custom, formula, data_type)
  SELECT p_tenant_id, v_report_id, t.line_code, t.line_name, t.display_order,
         t.indent_level, t.is_bold, t.is_section, FALSE, t.formula, t.data_type
    FROM public.fs_template_lines t
   WHERE t.report_code = p_report_code
   ORDER BY t.display_order;

  -- (3) Copy cột "kỳ trước" từ báo cáo kỳ trước
  IF v_prior_report_id IS NOT NULL THEN
    UPDATE public.fs_report_lines cur
       SET prior_amount = pri.current_amount
      FROM public.fs_report_lines pri
     WHERE cur.report_id = v_report_id
       AND pri.report_id = v_prior_report_id
       AND pri.line_code = cur.line_code;
  END IF;

  -- (4) Tính cột "kỳ này"
  PERFORM public.fs_recalculate_report(v_report_id);

  RETURN v_report_id;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 9. Kiểm tra cân bằng B01-DN (Điều 14-27)
-- -----------------------------------------------------------------------------
-- Tổng tài sản = Tổng nguồn vốn. Trả về TRUE nếu cân.
CREATE OR REPLACE FUNCTION public.fs_check_balance_sheet(p_report_id UUID)
RETURNS TABLE (
  is_balanced BOOLEAN,
  total_assets NUMERIC(18,2),
  total_resources NUMERIC(18,2),
  difference NUMERIC(18,2)
) AS $$
DECLARE
  v_a NUMERIC(18,2);
  v_b NUMERIC(18,2);
BEGIN
  SELECT current_amount INTO v_a FROM public.fs_report_lines
   WHERE report_id = p_report_id AND line_code = '270';
  SELECT current_amount INTO v_b FROM public.fs_report_lines
   WHERE report_id = p_report_id AND line_code = '440';

  RETURN QUERY SELECT
    (COALESCE(v_a,0) = COALESCE(v_b,0)),
    COALESCE(v_a,0), COALESCE(v_b,0),
    COALESCE(v_a,0) - COALESCE(v_b,0);
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- KẾT THÚC 005_financial_statements.sql
-- =============================================================================
