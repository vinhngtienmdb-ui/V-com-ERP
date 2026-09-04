-- =============================================================================
-- SPEC 021 — TT99/2025/TT-BTC
-- 001_coa.sql — HỆ THỐNG TÀI KHOẢN + NGOẠI TỆ + TỶ GIÁ
-- =============================================================================
-- Điều 11 TT99: CHỈ tài khoản cấp 1 là bắt buộc (71 TK, Phần A Phụ lục II).
--   Doanh nghiệp được tự chủ hoàn toàn cấp 2 / cấp 3 — sửa đổi tên, số hiệu,
--   kết cấu, nội dung phản ánh — KHÔNG cần xin phép Bộ Tài chính, nhưng phải:
--     (a) phân loại đúng bản chất nghiệp vụ
--     (b) không trùng lặp đối tượng
--     (c) không ảnh hưởng chỉ tiêu trên BCTC
--     (d) được quy định trong Quy chế hạch toán kế toán (Điều 9(2), 12(2), 18(1))
--   → Cột is_system_regulated + regulation_ref để chứng minh (d) khi thanh tra.
--
-- Điều 4-6 TT99: đơn vị tiền tệ kế toán là VND; tỷ giá hối đoái.
--
-- Chạy SAU: specs/012-vn-legal-compliance/migrations/005_relational_modules.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Hàm tiện ích dùng chung cho toàn bộ spec 021
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.acc_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 1. acc_accounts — Hệ thống tài khoản kế toán
-- -----------------------------------------------------------------------------
-- Quyết định thiết kế (nguyên tắc N1): hệ tài khoản là DỮ LIỆU, không phải code.
-- Seed 71 TK cấp 1 từ Phụ lục II TT99; doanh nghiệp mở thêm cấp 2/3 tại runtime.
CREATE TABLE IF NOT EXISTS public.acc_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',

  code TEXT NOT NULL,                       -- '111', '511', '3331', '1541'...
  name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 3),
  parent_code TEXT,                         -- NULL đối với tài khoản cấp 1

  -- Phân loại theo Phần A Phụ lục II TT99
  account_type TEXT NOT NULL CHECK (account_type IN (
    'asset',            -- Tài sản                       (111 → 244)
    'liability',        -- Nợ phải trả                   (331 → 357)
    'equity',           -- Vốn chủ sở hữu                (411 → 421)
    'revenue',          -- Doanh thu                     (511, 515, 521)
    'expense',          -- Chi phí sản xuất kinh doanh   (621 → 642)
    'other_income',     -- Thu nhập khác                 (711)
    'other_expense',    -- Chi phí khác                  (811, 821)
    'determine_result'  -- Xác định kết quả kinh doanh   (911)
  )),

  -- Bên dư chủ yếu. Dùng để tính số dư cuối kỳ đúng dấu và cảnh báo dư bất thường.
  balance_side TEXT NOT NULL CHECK (balance_side IN ('debit', 'credit')),

  -- is_system = TRUE  → 71 TK cấp 1 do TT99 ban hành. KHÔNG ĐƯỢC XOÁ (trigger).
  -- is_system = FALSE → TK chi tiết do doanh nghiệp tự mở theo Điều 11.
  is_system BOOLEAN NOT NULL DEFAULT FALSE,

  -- Điều 11(2)/(d): TK tự mở phải được quy định trong Quy chế hạch toán kế toán.
  -- Ứng dụng bắt buộc nhập regulation_ref khi is_system = FALSE.
  regulation_ref TEXT,

  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Tài khoản có theo dõi chi tiết theo đối tượng (khách hàng / nhà cung cấp /
  -- nhân viên) không — quyết định có bắt buộc partner_id trên bút toán hay không.
  track_partner BOOLEAN NOT NULL DEFAULT FALSE,
  -- Tài khoản có theo dõi chi tiết theo đơn vị trực thuộc (Điều 7).
  track_unit BOOLEAN NOT NULL DEFAULT FALSE,
  -- Tài khoản công nợ nội bộ (136 / 336) — dùng để tự động nhận diện giao dịch
  -- nội bộ cần loại bỏ khi hợp nhất (Điều 7).
  is_intercompany BOOLEAN NOT NULL DEFAULT FALSE,

  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT acc_accounts_unique_code UNIQUE (tenant_id, code),
  -- Tài khoản cấp 2/3 bắt buộc có cha; tài khoản cấp 1 không được có cha.
  CONSTRAINT acc_accounts_parent_rule CHECK (
    (level = 1 AND parent_code IS NULL) OR
    (level > 1 AND parent_code IS NOT NULL AND parent_code <> code)
  )
);

ALTER TABLE public.acc_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acc_accounts_isolation ON public.acc_accounts;
CREATE POLICY acc_accounts_isolation ON public.acc_accounts
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_acc_accounts_parent  ON public.acc_accounts(tenant_id, parent_code);
CREATE INDEX IF NOT EXISTS idx_acc_accounts_type    ON public.acc_accounts(tenant_id, account_type);
CREATE INDEX IF NOT EXISTS idx_acc_accounts_active  ON public.acc_accounts(tenant_id, is_active);

DROP TRIGGER IF EXISTS trg_acc_accounts_touch ON public.acc_accounts;
CREATE TRIGGER trg_acc_accounts_touch
  BEFORE UPDATE ON public.acc_accounts
  FOR EACH ROW EXECUTE FUNCTION public.acc_touch_updated_at();

-- Chặn XOÁ 71 tài khoản cấp 1 do TT99 ban hành (Điều 11 — bắt buộc áp dụng).
CREATE OR REPLACE FUNCTION public.acc_prevent_system_account_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_system THEN
    RAISE EXCEPTION
      'TT99_DIEU_11: Không được xoá tài khoản cấp 1 % (%) do TT99/2025/TT-BTC ban hành',
      OLD.code, OLD.name;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_acc_accounts_no_delete ON public.acc_accounts;
CREATE TRIGGER trg_acc_accounts_no_delete
  BEFORE DELETE ON public.acc_accounts
  FOR EACH ROW EXECUTE FUNCTION public.acc_prevent_system_account_delete();

-- Chặn khoá (is_active = FALSE) tài khoản cấp 1 — TT99 không cho phép "bỏ" TK bắt buộc.
CREATE OR REPLACE FUNCTION public.acc_prevent_system_account_deactivate()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_system AND NEW.is_active = FALSE AND OLD.is_active = TRUE THEN
    RAISE EXCEPTION
      'TT99_DIEU_11: Không được khoá tài khoản cấp 1 % (%) do TT99/2025/TT-BTC ban hành',
      OLD.code, OLD.name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_acc_accounts_no_deactivate ON public.acc_accounts;
CREATE TRIGGER trg_acc_accounts_no_deactivate
  BEFORE UPDATE ON public.acc_accounts
  FOR EACH ROW EXECUTE FUNCTION public.acc_prevent_system_account_deactivate();

-- =============================================================================
-- 2. SEED 71 TÀI KHOẢN CẤP 1 — Phần A Phụ lục II TT99/2025/TT-BTC
-- =============================================================================
-- Cột: code, name, account_type, balance_side, track_partner, track_unit,
--      is_intercompany, note
--
-- balance_side quy ước:
--   Tài sản, Chi phí, Chi phí khác, Xác định KQKD  → 'debit'
--   Nợ phải trả, Vốn CSH, Doanh thu, Thu nhập khác → 'credit'
-- =============================================================================
INSERT INTO public.acc_accounts
  (tenant_id, code, name, level, parent_code, account_type, balance_side,
   is_system, is_active, track_partner, track_unit, is_intercompany, note)
VALUES
-- ----- LOẠI TÀI SẢN (33 TK) ---------------------------------------------------
('tenant-vcomm-prod-01','111','Tiền mặt',1,NULL,'asset','debit',TRUE,TRUE,TRUE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','112','Tiền gửi không kỳ hạn',1,NULL,'asset','debit',TRUE,TRUE,FALSE,TRUE,FALSE,'TT200 gọi là "Tiền gửi ngân hàng" — TT99 đổi tên'),
('tenant-vcomm-prod-01','113','Tiền đang chuyển',1,NULL,'asset','debit',TRUE,TRUE,FALSE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','121','Chứng khoán kinh doanh',1,NULL,'asset','debit',TRUE,TRUE,FALSE,FALSE,FALSE,NULL),
('tenant-vcomm-prod-01','128','Đầu tư nắm giữ đến ngày đáo hạn',1,NULL,'asset','debit',TRUE,TRUE,FALSE,FALSE,FALSE,NULL),
('tenant-vcomm-prod-01','131','Phải thu của khách hàng',1,NULL,'asset','debit',TRUE,TRUE,TRUE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','133','Thuế GTGT được khấu trừ',1,NULL,'asset','debit',TRUE,TRUE,FALSE,FALSE,FALSE,NULL),
('tenant-vcomm-prod-01','136','Phải thu nội bộ',1,NULL,'asset','debit',TRUE,TRUE,FALSE,TRUE,TRUE,'Điều 7 — loại bỏ khi hợp nhất'),
('tenant-vcomm-prod-01','138','Phải thu khác',1,NULL,'asset','debit',TRUE,TRUE,TRUE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','141','Tạm ứng',1,NULL,'asset','debit',TRUE,TRUE,TRUE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','151','Hàng mua đang đi đường',1,NULL,'asset','debit',TRUE,TRUE,FALSE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','152','Nguyên liệu, vật liệu',1,NULL,'asset','debit',TRUE,TRUE,FALSE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','153','Công cụ, dụng cụ',1,NULL,'asset','debit',TRUE,TRUE,FALSE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','154','Chi phí sản xuất, kinh doanh dở dang',1,NULL,'asset','debit',TRUE,TRUE,FALSE,TRUE,FALSE,'Gộp TK 631 bị bãi bỏ ở TT99'),
('tenant-vcomm-prod-01','155','Sản phẩm',1,NULL,'asset','debit',TRUE,TRUE,FALSE,TRUE,FALSE,'TT200 gọi là "Thành phẩm" — TT99 đổi tên'),
('tenant-vcomm-prod-01','156','Hàng hóa',1,NULL,'asset','debit',TRUE,TRUE,FALSE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','157','Hàng gửi đi bán',1,NULL,'asset','debit',TRUE,TRUE,FALSE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','158','Nguyên liệu, vật tư tại kho bảo thuế',1,NULL,'asset','debit',TRUE,TRUE,FALSE,TRUE,FALSE,'TT99 đổi tên'),
('tenant-vcomm-prod-01','171','Giao dịch mua, bán lại trái phiếu chính phủ',1,NULL,'asset','debit',TRUE,TRUE,FALSE,FALSE,FALSE,NULL),
('tenant-vcomm-prod-01','211','Tài sản cố định hữu hình',1,NULL,'asset','debit',TRUE,TRUE,FALSE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','212','Tài sản cố định thuê tài chính',1,NULL,'asset','debit',TRUE,TRUE,FALSE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','213','Tài sản cố định vô hình',1,NULL,'asset','debit',TRUE,TRUE,FALSE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','214','Hao mòn tài sản cố định',1,NULL,'asset','credit',TRUE,TRUE,FALSE,TRUE,FALSE,'Tài khoản điều chỉnh — số dư bên Có'),
('tenant-vcomm-prod-01','215','Tài sản sinh học',1,NULL,'asset','debit',TRUE,TRUE,FALSE,TRUE,FALSE,'MỚI trong TT99 (theo IAS 41)'),
('tenant-vcomm-prod-01','217','Bất động sản đầu tư',1,NULL,'asset','debit',TRUE,TRUE,FALSE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','221','Đầu tư vào công ty con',1,NULL,'asset','debit',TRUE,TRUE,FALSE,FALSE,FALSE,NULL),
('tenant-vcomm-prod-01','222','Đầu tư vào công ty liên doanh, liên kết',1,NULL,'asset','debit',TRUE,TRUE,FALSE,FALSE,FALSE,NULL),
('tenant-vcomm-prod-01','228','Đầu tư khác',1,NULL,'asset','debit',TRUE,TRUE,TRUE,FALSE,FALSE,NULL),
('tenant-vcomm-prod-01','229','Dự phòng tổn thất tài sản',1,NULL,'asset','credit',TRUE,TRUE,FALSE,FALSE,FALSE,'Tài khoản điều chỉnh — số dư bên Có'),
('tenant-vcomm-prod-01','241','Xây dựng cơ bản dở dang',1,NULL,'asset','debit',TRUE,TRUE,FALSE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','242','Chi phí chờ phân bổ',1,NULL,'asset','debit',TRUE,TRUE,FALSE,TRUE,FALSE,'TT200 gọi là "Chi phí trả trước" — TT99 đổi tên'),
('tenant-vcomm-prod-01','243','Tài sản thuế thu nhập hoãn lại',1,NULL,'asset','debit',TRUE,TRUE,FALSE,FALSE,FALSE,NULL),
('tenant-vcomm-prod-01','244','Ký quỹ, ký cược',1,NULL,'asset','debit',TRUE,TRUE,TRUE,TRUE,FALSE,'TT99 đổi tên'),

-- ----- LOẠI NỢ PHẢI TRẢ (16 TK) ----------------------------------------------
('tenant-vcomm-prod-01','331','Phải trả cho người bán',1,NULL,'liability','credit',TRUE,TRUE,TRUE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','332','Phải trả cổ tức, lợi nhuận',1,NULL,'liability','credit',TRUE,TRUE,TRUE,FALSE,FALSE,'MỚI trong TT99 — tách khỏi 3388'),
('tenant-vcomm-prod-01','333','Thuế và các khoản phải nộp Nhà nước',1,NULL,'liability','credit',TRUE,TRUE,FALSE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','334','Phải trả người lao động',1,NULL,'liability','credit',TRUE,TRUE,TRUE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','335','Chi phí phải trả',1,NULL,'liability','credit',TRUE,TRUE,FALSE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','336','Phải trả nội bộ',1,NULL,'liability','credit',TRUE,TRUE,FALSE,TRUE,TRUE,'Điều 7 — loại bỏ khi hợp nhất'),
('tenant-vcomm-prod-01','337','Thanh toán theo tiến độ hợp đồng xây dựng',1,NULL,'liability','credit',TRUE,TRUE,TRUE,FALSE,FALSE,'TT99 đổi tên'),
('tenant-vcomm-prod-01','338','Phải trả, phải nộp khác',1,NULL,'liability','credit',TRUE,TRUE,TRUE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','341','Vay và nợ thuê tài chính',1,NULL,'liability','credit',TRUE,TRUE,TRUE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','343','Trái phiếu phát hành',1,NULL,'liability','credit',TRUE,TRUE,FALSE,FALSE,FALSE,NULL),
('tenant-vcomm-prod-01','344','Nhận ký quỹ, ký cược',1,NULL,'liability','credit',TRUE,TRUE,TRUE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','347','Thuế thu nhập hoãn lại phải trả',1,NULL,'liability','credit',TRUE,TRUE,FALSE,FALSE,FALSE,NULL),
('tenant-vcomm-prod-01','352','Dự phòng phải trả',1,NULL,'liability','credit',TRUE,TRUE,FALSE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','353','Quỹ khen thưởng, phúc lợi',1,NULL,'liability','credit',TRUE,TRUE,FALSE,FALSE,FALSE,NULL),
('tenant-vcomm-prod-01','356','Quỹ phát triển khoa học và công nghệ',1,NULL,'liability','credit',TRUE,TRUE,FALSE,FALSE,FALSE,NULL),
('tenant-vcomm-prod-01','357','Quỹ bình ổn giá',1,NULL,'liability','credit',TRUE,TRUE,FALSE,FALSE,FALSE,NULL),

-- ----- LOẠI VỐN CHỦ SỞ HỮU (7 TK) ---------------------------------------------
('tenant-vcomm-prod-01','411','Vốn đầu tư của chủ sở hữu',1,NULL,'equity','credit',TRUE,TRUE,TRUE,FALSE,FALSE,'Nhận chức năng TK 461 bị bãi bỏ'),
('tenant-vcomm-prod-01','412','Chênh lệch đánh giá lại tài sản',1,NULL,'equity','credit',TRUE,TRUE,FALSE,FALSE,FALSE,NULL),
('tenant-vcomm-prod-01','413','Chênh lệch tỷ giá hối đoái',1,NULL,'equity','credit',TRUE,TRUE,FALSE,FALSE,FALSE,NULL),
('tenant-vcomm-prod-01','414','Quỹ đầu tư phát triển',1,NULL,'equity','credit',TRUE,TRUE,FALSE,FALSE,FALSE,NULL),
('tenant-vcomm-prod-01','418','Các quỹ khác thuộc vốn chủ sở hữu',1,NULL,'equity','credit',TRUE,TRUE,FALSE,FALSE,FALSE,NULL),
('tenant-vcomm-prod-01','419','Cổ phiếu mua lại của chính mình',1,NULL,'equity','debit',TRUE,TRUE,FALSE,FALSE,FALSE,'TT200 gọi là "Cổ phiếu quỹ" — TT99 đổi tên. Số dư bên Nợ'),
('tenant-vcomm-prod-01','421','Lợi nhuận sau thuế chưa phân phối',1,NULL,'equity','credit',TRUE,TRUE,FALSE,FALSE,FALSE,NULL),

-- ----- LOẠI DOANH THU (3 TK) --------------------------------------------------
('tenant-vcomm-prod-01','511','Doanh thu bán hàng và cung cấp dịch vụ',1,NULL,'revenue','credit',TRUE,TRUE,FALSE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','515','Doanh thu hoạt động tài chính',1,NULL,'revenue','credit',TRUE,TRUE,FALSE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','521','Các khoản giảm trừ doanh thu',1,NULL,'revenue','debit',TRUE,TRUE,FALSE,TRUE,FALSE,'Tài khoản điều chỉnh doanh thu — số dư bên Nợ'),

-- ----- LOẠI CHI PHÍ SẢN XUẤT KINH DOANH (8 TK) --------------------------------
('tenant-vcomm-prod-01','621','Chi phí nguyên liệu, vật liệu trực tiếp',1,NULL,'expense','debit',TRUE,TRUE,FALSE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','622','Chi phí nhân công trực tiếp',1,NULL,'expense','debit',TRUE,TRUE,FALSE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','623','Chi phí sử dụng máy thi công',1,NULL,'expense','debit',TRUE,TRUE,FALSE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','627','Chi phí sản xuất chung',1,NULL,'expense','debit',TRUE,TRUE,FALSE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','632','Giá vốn hàng bán',1,NULL,'expense','debit',TRUE,TRUE,FALSE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','635','Chi phí tài chính',1,NULL,'expense','debit',TRUE,TRUE,FALSE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','641','Chi phí bán hàng',1,NULL,'expense','debit',TRUE,TRUE,FALSE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','642','Chi phí quản lý doanh nghiệp',1,NULL,'expense','debit',TRUE,TRUE,FALSE,TRUE,FALSE,NULL),

-- ----- LOẠI KHÁC (4 TK) -------------------------------------------------------
('tenant-vcomm-prod-01','711','Thu nhập khác',1,NULL,'other_income','credit',TRUE,TRUE,FALSE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','811','Chi phí khác',1,NULL,'other_expense','debit',TRUE,TRUE,FALSE,TRUE,FALSE,NULL),
('tenant-vcomm-prod-01','821','Chi phí thuế thu nhập doanh nghiệp',1,NULL,'other_expense','debit',TRUE,TRUE,FALSE,FALSE,FALSE,'TT99 tách 82111/82112 (thuế tối thiểu toàn cầu)'),
('tenant-vcomm-prod-01','911','Xác định kết quả kinh doanh',1,NULL,'determine_result','debit',TRUE,TRUE,FALSE,FALSE,FALSE,NULL)
ON CONFLICT (tenant_id, code) DO UPDATE SET
  name             = EXCLUDED.name,
  account_type     = EXCLUDED.account_type,
  balance_side     = EXCLUDED.balance_side,
  is_system        = EXCLUDED.is_system,
  track_partner    = EXCLUDED.track_partner,
  track_unit       = EXCLUDED.track_unit,
  is_intercompany  = EXCLUDED.is_intercompany,
  note             = EXCLUDED.note,
  updated_at       = timezone('utc'::text, now());

-- Bất biến: sau khi seed, đúng 71 tài khoản cấp 1 cho tenant mặc định.
DO $$
DECLARE n INTEGER;
BEGIN
  SELECT COUNT(*) INTO n FROM public.acc_accounts
   WHERE tenant_id = 'tenant-vcomm-prod-01' AND level = 1;
  IF n <> 71 THEN
    RAISE WARNING 'SPEC021: kỳ vọng 71 tài khoản cấp 1, thực tế %', n;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Tài khoản cấp 2 thiết yếu cho VComm (mở theo Điều 11 — được tự chủ cấp 2/3)
-- -----------------------------------------------------------------------------
-- Đây là các TK bắt buộc để dữ liệu cũ (đang dùng 5111 / 33311 / 1121 theo TT200)
-- tiếp tục hạch toán được dưới hệ TT99.
INSERT INTO public.acc_accounts
  (tenant_id, code, name, level, parent_code, account_type, balance_side,
   is_system, is_active, track_partner, track_unit, is_intercompany, regulation_ref, note)
VALUES
('tenant-vcomm-prod-01','1121','Tiền gửi không kỳ hạn — VND',2,'112','asset','debit',FALSE,TRUE,FALSE,TRUE,FALSE,'QC-TT99-001','Kế thừa 1121 của TT200 để không gãy dữ liệu lịch sử'),
('tenant-vcomm-prod-01','1311','Phải thu của khách hàng — sàn TMĐT',2,'131','asset','debit',FALSE,TRUE,TRUE,TRUE,FALSE,'QC-TT99-001',NULL),
('tenant-vcomm-prod-01','33311','Thuế GTGT đầu ra',2,'333','liability','credit',FALSE,TRUE,FALSE,FALSE,FALSE,'QC-TT99-001',NULL),
('tenant-vcomm-prod-01','33312','Thuế GTGT hàng nhập khẩu',2,'333','liability','credit',FALSE,TRUE,FALSE,FALSE,FALSE,'QC-TT99-001',NULL),
('tenant-vcomm-prod-01','3334','Thuế thu nhập doanh nghiệp',2,'333','liability','credit',FALSE,TRUE,FALSE,FALSE,FALSE,'QC-TT99-001',NULL),
('tenant-vcomm-prod-01','3335','Thuế thu nhập cá nhân',2,'333','liability','credit',FALSE,TRUE,TRUE,FALSE,FALSE,'QC-TT99-001',NULL),
('tenant-vcomm-prod-01','3387','Doanh thu chờ phân bổ',2,'338','liability','credit',FALSE,TRUE,FALSE,FALSE,FALSE,'QC-TT99-001','TT200 gọi là "Doanh thu chưa thực hiện" — TT99 đổi tên'),
('tenant-vcomm-prod-01','3388','Phải trả, phải nộp khác',2,'338','liability','credit',FALSE,TRUE,TRUE,TRUE,FALSE,'QC-TT99-001',NULL),
('tenant-vcomm-prod-01','33881','Phải trả người bán trên sàn',2,'338','liability','credit',FALSE,TRUE,TRUE,TRUE,FALSE,'QC-TT99-001','Công nợ VComm phải trả seller'),
('tenant-vcomm-prod-01','5111','Doanh thu bán hàng hóa',2,'511','revenue','credit',FALSE,TRUE,FALSE,TRUE,FALSE,'QC-TT99-001',NULL),
('tenant-vcomm-prod-01','5112','Doanh thu cung cấp dịch vụ',2,'511','revenue','credit',FALSE,TRUE,FALSE,TRUE,FALSE,'QC-TT99-001','Phí sàn, phí giao dịch, phí VComm Hub'),
('tenant-vcomm-prod-01','5118','Doanh thu V-Xu tiêu hao',2,'511','revenue','credit',FALSE,TRUE,FALSE,TRUE,FALSE,'QC-TT99-002','IFRS 15 bước 5 — ghi nhận khi khách đổi V-Xu hoặc điểm hết hạn'),
('tenant-vcomm-prod-01','6415','Thuế, phí, lệ phí',2,'641','expense','debit',FALSE,TRUE,FALSE,TRUE,FALSE,'QC-TT99-001','TT99 đổi tên'),
('tenant-vcomm-prod-01','8211','Chi phí thuế TNDN hiện hành',2,'821','other_expense','debit',FALSE,TRUE,FALSE,FALSE,FALSE,'QC-TT99-001',NULL),
('tenant-vcomm-prod-01','8212','Chi phí thuế TNDN hoãn lại',2,'821','other_expense','debit',FALSE,TRUE,FALSE,FALSE,FALSE,'QC-TT99-001',NULL)
ON CONFLICT (tenant_id, code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. acc_currencies — Danh mục ngoại tệ (Điều 4-6)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.acc_currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  code TEXT NOT NULL,                       -- ISO 4217: 'VND','USD','EUR'
  name TEXT NOT NULL,
  symbol TEXT,
  is_base BOOLEAN NOT NULL DEFAULT FALSE,   -- VND = đơn vị tiền tệ kế toán
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT acc_currencies_unique UNIQUE (tenant_id, code)
);

ALTER TABLE public.acc_currencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acc_currencies_isolation ON public.acc_currencies;
CREATE POLICY acc_currencies_isolation ON public.acc_currencies
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

INSERT INTO public.acc_currencies (tenant_id, code, name, symbol, is_base)
VALUES
  ('tenant-vcomm-prod-01','VND','Đồng Việt Nam','₫',TRUE),
  ('tenant-vcomm-prod-01','USD','Đô la Mỹ','$',FALSE),
  ('tenant-vcomm-prod-01','EUR','Euro','€',FALSE),
  ('tenant-vcomm-prod-01','CNY','Nhân dân tệ','¥',FALSE),
  ('tenant-vcomm-prod-01','SGD','Đô la Singapore','S$',FALSE)
ON CONFLICT (tenant_id, code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5. acc_fx_rates — Tỷ giá hối đoái (Điều 4-6)
-- -----------------------------------------------------------------------------
-- tolerance_pct: ngưỡng chênh lệch cho phép giữa tỷ giá ghi nhận và tỷ giá thực tế.
-- Mặc định 1.0. Khi |thực tế − ghi nhận| / ghi nhận > tolerance_pct, ứng dụng
-- bắt buộc dùng tỷ giá thực tế và ghi cảnh báo vào note.
--
-- LƯU Ý TRUNG THỰC: con số 1% là thông lệ kế toán VN được nhiều tài liệu nhắc tới
-- khi tóm tắt Điều 4-6. Cần đối chiếu nguyên văn TT99 trước khi dùng để quyết toán.
-- Cột tolerance_pct để có thể điều chỉnh mà không đổi schema.
CREATE TABLE IF NOT EXISTS public.acc_fx_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  currency_code TEXT NOT NULL,
  rate_date DATE NOT NULL,

  -- Tỷ giá ghi nhận áp dụng trong kỳ do doanh nghiệp xác định
  booked_rate NUMERIC(18,6) NOT NULL CHECK (booked_rate > 0),
  -- Tỷ giá thực tế tại ngày phát sinh nghiệp vụ
  actual_rate NUMERIC(18,6) CHECK (actual_rate IS NULL OR actual_rate > 0),

  -- Chênh lệch % giữa thực tế và ghi nhận — tính bằng trigger
  deviation_pct NUMERIC(8,4),
  -- TRUE khi |deviation_pct| > tolerance_pct → bắt buộc dùng actual_rate
  exceeds_tolerance BOOLEAN NOT NULL DEFAULT FALSE,
  tolerance_pct NUMERIC(6,3) NOT NULL DEFAULT 1.000,

  note TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT acc_fx_rates_unique UNIQUE (tenant_id, currency_code, rate_date),
  -- FK tổ hợp: acc_currencies không có UNIQUE(code) đơn lẻ (mỗi tenant tự có
  -- danh mục), nên tham chiếu theo (tenant_id, code).
  CONSTRAINT acc_fx_rates_currency_fk
    FOREIGN KEY (tenant_id, currency_code)
    REFERENCES public.acc_currencies(tenant_id, code) ON UPDATE CASCADE
);

ALTER TABLE public.acc_fx_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acc_fx_rates_isolation ON public.acc_fx_rates;
CREATE POLICY acc_fx_rates_isolation ON public.acc_fx_rates
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_acc_fx_rates_date ON public.acc_fx_rates(tenant_id, currency_code, rate_date DESC);

-- Tự động tính chênh lệch % và cờ vượt ngưỡng trước khi ghi.
CREATE OR REPLACE FUNCTION public.acc_fx_rates_compute_deviation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual_rate IS NOT NULL AND NEW.booked_rate > 0 THEN
    NEW.deviation_pct := ROUND(
      ((NEW.actual_rate - NEW.booked_rate) / NEW.booked_rate) * 100, 4);
    NEW.exceeds_tolerance := ABS(NEW.deviation_pct) > NEW.tolerance_pct;
  ELSE
    NEW.deviation_pct := NULL;
    NEW.exceeds_tolerance := FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_acc_fx_rates_deviation ON public.acc_fx_rates;
CREATE TRIGGER trg_acc_fx_rates_deviation
  BEFORE INSERT OR UPDATE ON public.acc_fx_rates
  FOR EACH ROW EXECUTE FUNCTION public.acc_fx_rates_compute_deviation();

DROP TRIGGER IF EXISTS trg_acc_fx_rates_touch ON public.acc_fx_rates;
CREATE TRIGGER trg_acc_fx_rates_touch
  BEFORE UPDATE ON public.acc_fx_rates
  FOR EACH ROW EXECUTE FUNCTION public.acc_touch_updated_at();

-- =============================================================================
-- KẾT THÚC 001_coa.sql
-- =============================================================================
