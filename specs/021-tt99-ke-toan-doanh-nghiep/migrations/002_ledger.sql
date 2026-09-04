-- =============================================================================
-- SPEC 021 — TT99/2025/TT-BTC
-- 002_ledger.sql — KỲ KẾ TOÁN · CHỨNG TỪ · BÚT TOÁN KÉP · LƯU VẾT (Điều 12, 13, 28)
-- =============================================================================
-- Điều 12 — Sổ kế toán: TT99 đưa ra 42 mẫu sổ tham khảo tại Phụ lục III (giảm
--   từ 45 mẫu của TT200). Doanh nghiệp được tự thiết kế sổ phù hợp đặc điểm hoạt
--   động → ở đây KHÔNG tạo 42 bảng sổ. Tạo 2 bảng nguồn (chứng từ + bút toán)
--   và sinh mọi loại sổ bằng truy vấn (Nhật ký chung, Sổ cái TK, Sổ chi tiết,
--   Sổ quỹ tiền mặt, Sổ tiền gửi ngân hàng, Bảng kê mua/bán...).
-- Điều 13 — Mở sổ / ghi sổ / khóa sổ: kỳ kế toán có trạng thái; khóa sổ là bất
--   biến (Điều 13 + Luật Kế toán 2015 Điều 27).
-- Điều 28 — Phần mềm kế toán (từ 01/01/2026):
--   1. Lưu vết thay đổi theo thời gian  → acc_audit_log + chuỗi băm
--   2. Ngăn chặn xoá/sửa trái phép      → trigger chặn UPDATE/DELETE chứng từ đã ghi sổ
--   3. Xuất dữ liệu kịp thời cho thuế   → acc_export_for_tax_authority()
--   4. Tích hợp HĐĐT / CKS / ngân hàng  → source_type + source_id
--
-- Luật Kế toán 2015 Điều 27 — Không tẩy xoá. Sửa sai bằng 3 cách:
--   ghi cải chính (sai chưa ảnh hưởng sổ cái) · ghi số âm · ghi điều chỉnh.
--   → Ở đây mọi sửa sai tạo chứng từ MỚI với reversal_of trỏ về chứng từ gốc.
--
-- Chạy SAU: 001_coa.sql
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. acc_periods — Kỳ kế toán (Điều 13)
-- -----------------------------------------------------------------------------
-- period_no: NULL = kỳ năm; 1..12 = tháng; 21..24 = quý 1..4.
-- status:
--   open   — đang ghi nhận
--   locked — khoá tạm (vẫn mở được lại bởi người có quyền)
--   closed — ĐÃ KHOÁ SỔ: bất biến. Không ghi thêm, không sửa, không mở lại.
CREATE TABLE IF NOT EXISTS public.acc_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',

  period_year INTEGER NOT NULL CHECK (period_year BETWEEN 2000 AND 2100),
  period_no INTEGER CHECK (period_no IS NULL OR period_no IN
    (1,2,3,4,5,6,7,8,9,10,11,12,21,22,23,24)),

  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','locked','closed')),

  -- Khóa sổ — bất biến sau khi đặt
  closed_at TIMESTAMPTZ,
  closed_by TEXT,
  -- Hàm băm của toàn bộ dữ liệu kỳ tại thời điểm khóa — phát hiện sửa sau khóa
  closing_hash TEXT,
  closing_note TEXT,

  -- Điều 28(3): xuất dữ liệu kịp thời cho cơ quan thuế
  exported_at TIMESTAMPTZ,
  exported_by TEXT,
  export_format TEXT CHECK (export_format IN ('json','xml','csv','xlsx')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT acc_periods_unique UNIQUE (tenant_id, period_year, period_no),
  CONSTRAINT acc_periods_date_order CHECK (end_date >= start_date)
);

ALTER TABLE public.acc_periods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acc_periods_isolation ON public.acc_periods;
CREATE POLICY acc_periods_isolation ON public.acc_periods
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_acc_periods_status ON public.acc_periods(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_acc_periods_year   ON public.acc_periods(tenant_id, period_year);
-- UNIQUE thông thường coi NULL là khác nhau → kỳ NĂM (period_no IS NULL) cần
-- chỉ mục riêng, nếu không sẽ tạo được nhiều kỳ năm trùng nhau.
CREATE UNIQUE INDEX IF NOT EXISTS uq_acc_periods_year
  ON public.acc_periods(tenant_id, period_year) WHERE period_no IS NULL;

DROP TRIGGER IF EXISTS trg_acc_periods_touch ON public.acc_periods;
CREATE TRIGGER trg_acc_periods_touch
  BEFORE UPDATE ON public.acc_periods
  FOR EACH ROW EXECUTE FUNCTION public.acc_touch_updated_at();

-- Kỳ đã khoá sổ là BẤT BIẾN: không đổi ngày, không đổi trạng thái, không mở lại.
CREATE OR REPLACE FUNCTION public.acc_periods_freeze_closed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'closed' THEN
    IF NEW.status <> 'closed' THEN
      RAISE EXCEPTION
        'TT99_DIEU_13: Kỳ %/% đã khoá sổ — không được mở lại', OLD.period_year, COALESCE(OLD.period_no::TEXT, 'năm');
    END IF;
    IF NEW.start_date <> OLD.start_date OR NEW.end_date <> OLD.end_date THEN
      RAISE EXCEPTION 'TT99_DIEU_13: Kỳ đã khoá sổ — không được đổi ngày';
    END IF;
    IF NEW.closing_hash IS NULL OR NEW.closing_hash <> OLD.closing_hash THEN
      RAISE EXCEPTION 'TT99_DIEU_13: Không được thay đổi hàm băm khoá sổ — dấu hiệu can thiệp';
    END IF;
  END IF;

  -- Đóng kỳ: tự sinh hàm băm từ dữ liệu hiện tại
  IF NEW.status = 'closed' AND OLD.status <> 'closed' THEN
    NEW.closed_at := timezone('utc'::text, now());
    NEW.closing_hash := encode(digest(
      OLD.tenant_id || '|' ||
      OLD.period_year::TEXT || '|' ||
      COALESCE(OLD.period_no::TEXT, 'Y') || '|' ||
      timezone('utc'::text, now())::TEXT, 'sha256'), 'hex');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_acc_periods_freeze ON public.acc_periods;
CREATE TRIGGER trg_acc_periods_freeze
  BEFORE UPDATE ON public.acc_periods
  FOR EACH ROW EXECUTE FUNCTION public.acc_periods_freeze_closed();

-- -----------------------------------------------------------------------------
-- 2. acc_vouchers — Chứng từ kế toán (Điều 12)
-- -----------------------------------------------------------------------------
-- status:
--   draft    — đang soạn, được sửa/xoá tự do
--   posted   — ĐÃ GHI SỔ: bất biến. Mọi sửa sai → chứng từ mới (reversal_of)
--   reversed — đã bị đảo bởi một chứng từ khác (đặt bởi trigger), vẫn giữ nguyên
--              dữ liệu gốc — không xoá, theo Luật KT Điều 27.
CREATE TABLE IF NOT EXISTS public.acc_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',

  voucher_no TEXT NOT NULL,                -- Số chứng từ, duy nhất theo kỳ + loại
  voucher_type TEXT NOT NULL CHECK (voucher_type IN (
    'PNK','PXK','PT','PC','BN','BC','GHI','KT','PKT'
    -- Phiếu nhập kho · Phiếu xuất kho · Phiếu thu · Phiếu chi ·
    -- Báo Nợ · Báo Có · Ghi nhận · Kết chuyển · Phân bổ/Khác
  )),
  voucher_date DATE NOT NULL,              -- Ngày chứng từ
  post_date DATE NOT NULL,                 -- Ngày ghi sổ (có thể khác ngày chứng từ)

  period_id UUID NOT NULL REFERENCES public.acc_periods(id),
  unit_id UUID,                            -- FK sang acc_units (003_consolidation)

  currency_code TEXT NOT NULL DEFAULT 'VND',
  fx_rate NUMERIC(18,6) NOT NULL DEFAULT 1 CHECK (fx_rate > 0),

  description TEXT NOT NULL,
  attachments JSONB,                       -- [{name, url, sha256}] hóa đơn, hợp đồng

  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','posted','reversed')),
  reversal_of UUID REFERENCES public.acc_vouchers(id),  -- Điều 27: ghi số âm / điều chỉnh
  reversal_reason TEXT,

  -- Điều 28(4): truy vết nguồn gốc từ HĐĐT / ngân hàng / đơn hàng
  source_type TEXT,                        -- 'order' | 'einvoice' | 'bank' | 'manual' | 'payroll' | ...
  source_id TEXT,

  created_by TEXT,
  posted_by TEXT,
  posted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT acc_vouchers_no_unique UNIQUE (tenant_id, period_id, voucher_type, voucher_no),
  -- FK tổ hợp: acc_currencies chỉ unique theo (tenant_id, code).
  CONSTRAINT acc_vouchers_currency_fk
    FOREIGN KEY (tenant_id, currency_code)
    REFERENCES public.acc_currencies(tenant_id, code) ON UPDATE CASCADE
);

ALTER TABLE public.acc_vouchers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acc_vouchers_isolation ON public.acc_vouchers;
CREATE POLICY acc_vouchers_isolation ON public.acc_vouchers
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_acc_vouchers_period ON public.acc_vouchers(tenant_id, period_id);
CREATE INDEX IF NOT EXISTS idx_acc_vouchers_date   ON public.acc_vouchers(tenant_id, voucher_date);
CREATE INDEX IF NOT EXISTS idx_acc_vouchers_status ON public.acc_vouchers(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_acc_vouchers_source ON public.acc_vouchers(tenant_id, source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_acc_vouchers_rev    ON public.acc_vouchers(reversal_of) WHERE reversal_of IS NOT NULL;

DROP TRIGGER IF EXISTS trg_acc_vouchers_touch ON public.acc_vouchers;
CREATE TRIGGER trg_acc_vouchers_touch
  BEFORE UPDATE ON public.acc_vouchers
  FOR EACH ROW EXECUTE FUNCTION public.acc_touch_updated_at();

-- Điều 28(2) + Luật KT Điều 27: chứng từ đã ghi sổ không sửa, không xoá.
-- Chỉ cho phép chuyển trạng thái posted → reversed (do trigger đảo thực hiện).
CREATE OR REPLACE FUNCTION public.acc_vouchers_immutable_posted()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status <> 'draft' THEN
      RAISE EXCEPTION
        'TT99_DIEU_28 / LUAT_KT_DIEU_27: Không được xoá chứng từ % đã ghi sổ. Sửa sai bằng cách tạo chứng từ điều chỉnh (reversal_of).', OLD.voucher_no;
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.status = 'draft' THEN
    RETURN NEW;   -- draft được sửa tự do
  END IF;

  -- posted/reversed: chỉ cho phép đổi status sang 'reversed'
  IF NEW.status = 'reversed' AND OLD.status = 'posted' THEN
    IF NEW.reversal_of IS NULL THEN
      RAISE EXCEPTION 'Chứng từ bị đảo phải trỏ reversal_of về chứng từ đảo';
    END IF;
    -- Mọi cột khác giữ nguyên
    IF NEW.voucher_no <> OLD.voucher_no OR NEW.voucher_date <> OLD.voucher_date
       OR NEW.post_date <> OLD.post_date OR NEW.description <> OLD.description THEN
      RAISE EXCEPTION 'Không được sửa nội dung chứng từ đã ghi sổ';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION
    'TT99_DIEU_28 / LUAT_KT_DIEU_27: Không được sửa chứng từ % đã ghi sổ. Sửa sai bằng cách tạo chứng từ điều chỉnh (reversal_of).', OLD.voucher_no;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_acc_vouchers_immutable ON public.acc_vouchers;
CREATE TRIGGER trg_acc_vouchers_immutable
  BEFORE UPDATE OR DELETE ON public.acc_vouchers
  FOR EACH ROW EXECUTE FUNCTION public.acc_vouchers_immutable_posted();

-- Chặn ghi sổ vào kỳ đã khoá/đóng (Điều 13).
CREATE OR REPLACE FUNCTION public.acc_vouchers_check_period_open()
RETURNS TRIGGER AS $$
DECLARE v_status TEXT;
BEGIN
  SELECT status INTO v_status FROM public.acc_periods WHERE id = NEW.period_id;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Kỳ kế toán không tồn tại';
  END IF;
  IF v_status <> 'open' THEN
    RAISE EXCEPTION
      'TT99_DIEU_13: Không thể ghi chứng từ % vào kỳ kế toán đang "%s"', NEW.voucher_no, v_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_acc_vouchers_period_open ON public.acc_vouchers;
CREATE TRIGGER trg_acc_vouchers_period_open
  BEFORE INSERT OR UPDATE ON public.acc_vouchers
  FOR EACH ROW
  WHEN (NEW.status <> 'draft')
  EXECUTE FUNCTION public.acc_vouchers_check_period_open();

-- -----------------------------------------------------------------------------
-- 3. acc_voucher_lines — Bút toán kép (Điều 12)
-- -----------------------------------------------------------------------------
-- Mỗi dòng là MỘT vế: hoặc Nợ hoặc Có (không cho cả hai cùng lúc).
-- Cân bằng Nợ/Có được kiểm tra ở mức chứng từ bằng constraint trigger (nguyên tắc N2).
--
-- ⚠️ THỨ TỰ BẮT BUỘC KHI TẠO CHỨNG TỪ (do trigger trg_acc_vl_immutable_posted):
--   1. INSERT acc_vouchers với status = 'draft'
--   2. INSERT các acc_voucher_lines
--   3. UPDATE acc_vouchers SET status = 'posted'
--   Chứng từ đã posted KHÔNG thể thêm/sửa/xoá dòng nữa.
--   Constraint cân bằng Nợ/Có được hoãn đến cuối giao dịch (DEFERRABLE INITIALLY
--   DEFERRED) nên có thể insert từng dòng một.
CREATE TABLE IF NOT EXISTS public.acc_voucher_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  voucher_id UUID NOT NULL REFERENCES public.acc_vouchers(id) ON DELETE CASCADE,
  line_no INTEGER NOT NULL CHECK (line_no > 0),

  account_code TEXT NOT NULL,
  description TEXT,

  -- Số tiền theo VND (đơn vị tiền tệ kế toán — Điều 4)
  debit NUMERIC(18,2) NOT NULL DEFAULT 0,
  credit NUMERIC(18,2) NOT NULL DEFAULT 0,

  -- Nguyên tệ (khi chứng từ có currency_code <> 'VND')
  debit_orig NUMERIC(18,4) NOT NULL DEFAULT 0,
  credit_orig NUMERIC(18,4) NOT NULL DEFAULT 0,

  -- Đối tượng theo dõi chi tiết (bắt buộc khi tài khoản có track_partner)
  partner_id TEXT,
  partner_type TEXT CHECK (partner_type IN ('customer','seller','supplier','employee','other')),

  -- Điều 7: mọi bút toán phải xác định đơn vị trực thuộc để hợp nhất
  unit_id UUID,
  cost_center TEXT,

  -- Giao dịch nội bộ — sẽ bị loại bỏ khi hợp nhất (Điều 7). Trigger tự gán
  -- khi tài khoản có is_intercompany = TRUE, hoặc ứng dụng gán thủ công.
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  -- Đơn vị đối ứng của giao dịch nội bộ
  counterparty_unit_id UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT acc_vl_unique_line UNIQUE (voucher_id, line_no),
  -- Điều 27 / chuẩn kép: một vế không thể vừa Nợ vừa Có; và phải khác 0
  CONSTRAINT acc_vl_one_side CHECK (
    (debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0)
  ),
  CONSTRAINT acc_vl_orig_one_side CHECK (
    (debit_orig >= 0 AND credit_orig >= 0) AND (debit_orig = 0 OR credit_orig = 0)
  )
);

-- FK theo (tenant_id, code) — tham chiếu composite sang acc_accounts
ALTER TABLE public.acc_voucher_lines
  DROP CONSTRAINT IF EXISTS acc_vl_account_fk;
ALTER TABLE public.acc_voucher_lines
  ADD CONSTRAINT acc_vl_account_fk
  FOREIGN KEY (tenant_id, account_code)
  REFERENCES public.acc_accounts(tenant_id, code)
  ON UPDATE CASCADE;

ALTER TABLE public.acc_voucher_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acc_voucher_lines_isolation ON public.acc_voucher_lines;
CREATE POLICY acc_voucher_lines_isolation ON public.acc_voucher_lines
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_acc_vl_voucher  ON public.acc_voucher_lines(voucher_id);
CREATE INDEX IF NOT EXISTS idx_acc_vl_account  ON public.acc_voucher_lines(tenant_id, account_code);
CREATE INDEX IF NOT EXISTS idx_acc_vl_partner  ON public.acc_voucher_lines(tenant_id, partner_id) WHERE partner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_acc_vl_unit     ON public.acc_voucher_lines(tenant_id, unit_id) WHERE unit_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_acc_vl_internal ON public.acc_voucher_lines(tenant_id, is_internal) WHERE is_internal;

-- Chặn sửa/xoá dòng của chứng từ đã ghi sổ (Điều 28(2)).
CREATE OR REPLACE FUNCTION public.acc_vl_immutable_posted()
RETURNS TRIGGER AS $$
DECLARE v_status TEXT;
BEGIN
  SELECT status INTO v_status
    FROM public.acc_vouchers
   WHERE id = COALESCE(NEW.voucher_id, OLD.voucher_id);

  IF v_status <> 'draft' THEN
    RAISE EXCEPTION
      'TT99_DIEU_28: Không được sửa/xoá bút toán của chứng từ đã ghi sổ (status=%). Sửa sai bằng chứng từ điều chỉnh.', v_status;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_acc_vl_immutable ON public.acc_voucher_lines;
CREATE TRIGGER trg_acc_vl_immutable
  BEFORE INSERT OR UPDATE OR DELETE ON public.acc_voucher_lines
  FOR EACH ROW EXECUTE FUNCTION public.acc_vl_immutable_posted();

-- Tự động gán is_internal khi tài khoản là công nợ nội bộ (136 / 336) — nguyên tắc N6.
CREATE OR REPLACE FUNCTION public.acc_vl_flag_internal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_internal = FALSE THEN
    SELECT a.is_intercompany INTO NEW.is_internal
      FROM public.acc_accounts a
     WHERE a.tenant_id = NEW.tenant_id AND a.code = NEW.account_code;
    NEW.is_internal := COALESCE(NEW.is_internal, FALSE);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_acc_vl_flag_internal ON public.acc_voucher_lines;
CREATE TRIGGER trg_acc_vl_flag_internal
  BEFORE INSERT ON public.acc_voucher_lines
  FOR EACH ROW EXECUTE FUNCTION public.acc_vl_flag_internal();

-- CÂN BẰNG NỢ/CÓ Ở MỨC CHỨNG TỪ (nguyên tắc N2).
-- Dùng CONSTRAINT TRIGGER DEFERRABLE để kiểm tra SAU KHI đã insert đủ các dòng
-- của một chứng từ (row trigger không kiểm tra được tổng).
CREATE OR REPLACE FUNCTION public.acc_vl_assert_balanced()
RETURNS TRIGGER AS $$
DECLARE
  v_voucher UUID;
  v_debit   NUMERIC(18,2);
  v_credit  NUMERIC(18,2);
  v_count   INTEGER;
  v_no      TEXT;
  v_status  TEXT;
BEGIN
  -- Khi DELETE, NEW là NULL → lấy voucher_id từ OLD.
  v_voucher := COALESCE(NEW.voucher_id, OLD.voucher_id);
  IF v_voucher IS NULL THEN RETURN NULL; END IF;

  -- Chứng từ đang 'draft' được phép chưa cân bằng (đang soạn dở dang).
  -- Chỉ bắt buộc cân bằng khi chứng từ đã rời khỏi trạng thái draft.
  SELECT status, voucher_no INTO v_status, v_no
    FROM public.acc_vouchers WHERE id = v_voucher;
  IF v_status IS NULL OR v_status = 'draft' THEN RETURN NULL; END IF;

  SELECT COALESCE(SUM(debit),0), COALESCE(SUM(credit),0), COUNT(*)
    INTO v_debit, v_credit, v_count
    FROM public.acc_voucher_lines
   WHERE voucher_id = v_voucher;

  IF v_debit <> v_credit THEN
    RAISE EXCEPTION
      'KE_TOAN_KEP: Chứng từ % chưa cân bằng — Nợ % / Có % (lệch %)',
      v_no, v_debit, v_credit, (v_debit - v_credit);
  END IF;

  IF v_count < 2 THEN
    RAISE EXCEPTION 'KE_TOAN_KEP: Chứng từ % phải có ít nhất 2 bút toán (Nợ và Có)', v_no;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_acc_vl_balanced ON public.acc_voucher_lines;
CREATE CONSTRAINT TRIGGER trg_acc_vl_balanced
  AFTER INSERT OR UPDATE OR DELETE ON public.acc_voucher_lines
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.acc_vl_assert_balanced();

-- -----------------------------------------------------------------------------
-- 4. acc_audit_log — LƯU VẾT THAY ĐỔI (Điều 28(1)) + chuỗi băm chống can thiệp
-- -----------------------------------------------------------------------------
-- APPEND-ONLY: không UPDATE, không DELETE (trigger chặn).
-- Chuỗi băm: mỗi bản ghi chứa prev_hash = hash của bản ghi ngay trước nó.
--   Sửa/xoá một bản ghi cũ → chuỗi gãy → acc_verify_audit_chain() phát hiện.
--
-- LƯU Ý TRUNG THỰC: cơ chế này ngăn can thiệp QUA ỨNG DỤNG. Người có quyền
--   superuser trên Postgres vẫn có thể sửa trực tiếp. Chống can thiệp thực sự cần
--   append-only storage bên ngoài DB — ghi nhận là nợ kỹ thuật (spec phần 9).
CREATE TABLE IF NOT EXISTS public.acc_audit_log (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',

  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE','POST','CLOSE','EXPORT')),

  before_data JSONB,
  after_data JSONB,
  changed_fields TEXT[],

  actor TEXT,                     -- user id / email
  actor_ip INET,
  reason TEXT,                    -- lý do sửa (bắt buộc với UPDATE theo Điều 28)

  occurred_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  seq BIGSERIAL NOT NULL UNIQUE,  -- thứ tự toàn cục, phục vụ duyệt chuỗi

  prev_hash TEXT,
  hash TEXT
);

ALTER TABLE public.acc_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acc_audit_log_isolation ON public.acc_audit_log;
CREATE POLICY acc_audit_log_isolation ON public.acc_audit_log
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_acc_audit_record ON public.acc_audit_log(tenant_id, table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_acc_audit_time   ON public.acc_audit_log(tenant_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_acc_audit_actor  ON public.acc_audit_log(tenant_id, actor) WHERE actor IS NOT NULL;

-- Append-only: cấm UPDATE / DELETE.
CREATE OR REPLACE FUNCTION public.acc_audit_log_append_only()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION
    'TT99_DIEU_28: Lưu vết thay đổi là append-only — không được sửa/xoá bản ghi lưu vết';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_acc_audit_log_no_modify ON public.acc_audit_log;
CREATE TRIGGER trg_acc_audit_log_no_modify
  BEFORE UPDATE OR DELETE ON public.acc_audit_log
  FOR EACH ROW EXECUTE FUNCTION public.acc_audit_log_append_only();

-- Tự động nối chuỗi băm khi ghi lưu vết.
CREATE OR REPLACE FUNCTION public.acc_audit_log_chain()
RETURNS TRIGGER AS $$
DECLARE v_prev TEXT;
BEGIN
  SELECT hash INTO v_prev
    FROM public.acc_audit_log
   WHERE tenant_id = NEW.tenant_id
   ORDER BY seq DESC
   LIMIT 1;

  NEW.prev_hash := COALESCE(v_prev, 'GENESIS');
  NEW.hash := encode(digest(
    NEW.prev_hash || '|' ||
    NEW.tenant_id || '|' ||
    NEW.table_name || '|' ||
    NEW.record_id || '|' ||
    NEW.action || '|' ||
    COALESCE(NEW.before_data::TEXT, '') || '|' ||
    COALESCE(NEW.after_data::TEXT, '') || '|' ||
    COALESCE(NEW.actor, '') || '|' ||
    NEW.occurred_at::TEXT, 'sha256'), 'hex');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_acc_audit_log_chain ON public.acc_audit_log;
CREATE TRIGGER trg_acc_audit_log_chain
  BEFORE INSERT ON public.acc_audit_log
  FOR EACH ROW EXECUTE FUNCTION public.acc_audit_log_chain();

-- Hàm ghi lưu vết — dùng chung cho mọi trigger nghiệp vụ.
CREATE OR REPLACE FUNCTION public.acc_write_audit(
  p_tenant_id TEXT,
  p_table_name TEXT,
  p_record_id TEXT,
  p_action TEXT,
  p_before JSONB,
  p_after JSONB,
  p_actor TEXT,
  p_reason TEXT DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE v_id BIGINT;
BEGIN
  INSERT INTO public.acc_audit_log
    (tenant_id, table_name, record_id, action, before_data, after_data, actor, reason)
  VALUES
    (p_tenant_id, p_table_name, p_record_id, p_action, p_before, p_after, p_actor, p_reason)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Tự động lưu vết mọi thay đổi trên chứng từ & bút toán (Điều 28(1)).
CREATE OR REPLACE FUNCTION public.acc_vouchers_audit()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.acc_write_audit(NEW.tenant_id,'acc_vouchers',NEW.id::TEXT,'INSERT',
      NULL, to_jsonb(NEW), NEW.created_by);
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.acc_write_audit(NEW.tenant_id,'acc_vouchers',NEW.id::TEXT,'UPDATE',
      to_jsonb(OLD), to_jsonb(NEW), NEW.posted_by, NEW.reversal_reason);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.acc_write_audit(OLD.tenant_id,'acc_vouchers',OLD.id::TEXT,'DELETE',
      to_jsonb(OLD), NULL, OLD.posted_by, OLD.reversal_reason);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_acc_vouchers_audit ON public.acc_vouchers;
CREATE TRIGGER trg_acc_vouchers_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.acc_vouchers
  FOR EACH ROW EXECUTE FUNCTION public.acc_vouchers_audit();

-- Lưu vết việc khoá sổ + xuất dữ liệu cho cơ quan thuế (Điều 13, 28(3)).
CREATE OR REPLACE FUNCTION public.acc_periods_audit()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'closed' AND OLD.status <> 'closed' THEN
    PERFORM public.acc_write_audit(NEW.tenant_id,'acc_periods',NEW.id::TEXT,'CLOSE',
      to_jsonb(OLD), to_jsonb(NEW), NEW.closed_by, NEW.closing_note);
  ELSIF TG_OP = 'UPDATE' AND NEW.exported_at IS NOT NULL
        AND (OLD.exported_at IS NULL OR OLD.exported_at <> NEW.exported_at) THEN
    PERFORM public.acc_write_audit(NEW.tenant_id,'acc_periods',NEW.id::TEXT,'EXPORT',
      to_jsonb(OLD), to_jsonb(NEW), NEW.exported_by,
      'Xuất dữ liệu cho cơ quan thuế định dạng ' || COALESCE(NEW.export_format,'-'));
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_acc_periods_audit ON public.acc_periods;
CREATE TRIGGER trg_acc_periods_audit
  AFTER UPDATE ON public.acc_periods
  FOR EACH ROW EXECUTE FUNCTION public.acc_periods_audit();

-- -----------------------------------------------------------------------------
-- 5. TRIGGER ĐÁNH DẤU CHỨNG TỪ BỊ ĐẢO (Luật KT Điều 27 — ghi số âm)
-- -----------------------------------------------------------------------------
-- Khi một chứng từ mới có reversal_of <> NULL được ghi sổ, chứng từ gốc chuyển
-- sang 'reversed'. Chứng từ gốc KHÔNG bị xoá, không bị sửa.
CREATE OR REPLACE FUNCTION public.acc_vouchers_mark_reversed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reversal_of IS NOT NULL AND NEW.status = 'posted' THEN
    UPDATE public.acc_vouchers
       SET status = 'reversed',
           reversal_of = NEW.id,
           posted_by = COALESCE(posted_by, NEW.posted_by)
     WHERE id = NEW.reversal_of AND status = 'posted';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_acc_vouchers_mark_reversed ON public.acc_vouchers;
CREATE TRIGGER trg_acc_vouchers_mark_reversed
  AFTER INSERT OR UPDATE ON public.acc_vouchers
  FOR EACH ROW EXECUTE FUNCTION public.acc_vouchers_mark_reversed();

-- -----------------------------------------------------------------------------
-- 6. Kiểm tra tính toàn vẹn chuỗi lưu vết (Điều 28(1))
-- -----------------------------------------------------------------------------
-- Trả về các bản ghi bị gãy chuỗi. Rỗng = toàn vẹn.
CREATE OR REPLACE FUNCTION public.acc_verify_audit_chain(
  p_tenant_id TEXT DEFAULT 'tenant-vcomm-prod-01',
  p_from TIMESTAMPTZ DEFAULT NULL,
  p_to   TIMESTAMPTZ DEFAULT NULL
) RETURNS TABLE (
  seq BIGINT, table_name TEXT, record_id TEXT, action TEXT,
  occurred_at TIMESTAMPTZ, issue TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH ordered AS (
    SELECT l.seq, l.table_name, l.record_id, l.action, l.occurred_at,
           l.prev_hash, l.hash,
           LAG(l.hash) OVER (ORDER BY l.seq) AS expected_prev_hash,
           encode(digest(
             l.prev_hash || '|' || l.tenant_id || '|' || l.table_name || '|' ||
             l.record_id || '|' || l.action || '|' ||
             COALESCE(l.before_data::TEXT,'') || '|' ||
             COALESCE(l.after_data::TEXT,'') || '|' ||
             COALESCE(l.actor,'') || '|' || l.occurred_at::TEXT, 'sha256'),'hex') AS recomputed
      FROM public.acc_audit_log l
     WHERE l.tenant_id = p_tenant_id
       AND (p_from IS NULL OR l.occurred_at >= p_from)
       AND (p_to   IS NULL OR l.occurred_at <= p_to)
  )
  SELECT o.seq, o.table_name, o.record_id, o.action, o.occurred_at,
         CASE
           WHEN o.prev_hash <> COALESCE(o.expected_prev_hash,'GENESIS')
             THEN 'Gãy liên kết chuỗi (bản ghi trước bị xoá hoặc sửa)'
           WHEN o.hash <> o.recomputed
             THEN 'Nội dung bản ghi bị thay đổi sau khi ghi'
         END AS issue
    FROM ordered o
   WHERE o.prev_hash <> COALESCE(o.expected_prev_hash,'GENESIS')
      OR o.hash <> o.recomputed
   ORDER BY o.seq;
END;
$$ LANGUAGE plpgsql STABLE;

-- -----------------------------------------------------------------------------
-- 7. Xuất dữ liệu kịp thời cho cơ quan thuế (Điều 28(3))
-- -----------------------------------------------------------------------------
-- Trả về JSON gồm đầy đủ chứng từ trong kỳ + số cái + checksum.
-- Ứng dụng tự chuyển sang định dạng cơ quan thuế yêu cầu (XML/CSV/Excel).
CREATE OR REPLACE FUNCTION public.acc_export_for_tax_authority(p_period_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_period RECORD;
  v_vouchers JSONB;
  v_ledger   JSONB;
  v_checksum TEXT;
BEGIN
  SELECT * INTO v_period FROM public.acc_periods WHERE id = p_period_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy kỳ kế toán %', p_period_id;
  END IF;

  SELECT COALESCE(jsonb_agg(x ORDER BY x->>'voucher_date'), '[]'::jsonb) INTO v_vouchers
  FROM (
    SELECT jsonb_build_object(
      'id', v.id,
      'voucher_no', v.voucher_no,
      'voucher_type', v.voucher_type,
      'voucher_date', v.voucher_date,
      'post_date', v.post_date,
      'description', v.description,
      'currency', v.currency_code,
      'fx_rate', v.fx_rate,
      'status', v.status,
      'source_type', v.source_type,
      'source_id', v.source_id,
      'lines', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
                 'line_no', l.line_no,
                 'account', l.account_code,
                 'debit', l.debit,
                 'credit', l.credit,
                 'description', l.description,
                 'partner_id', l.partner_id,
                 'is_internal', l.is_internal
               ) ORDER BY l.line_no)
          FROM public.acc_voucher_lines l WHERE l.voucher_id = v.id), '[]'::jsonb)
    ) AS x
    FROM public.acc_vouchers v
    WHERE v.period_id = p_period_id
  ) s;

  -- Sổ cái tổng hợp theo tài khoản
  SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_ledger
  FROM (
    SELECT jsonb_build_object(
      'account', l.account_code,
      'account_name', a.name,
      'total_debit',  SUM(l.debit),
      'total_credit', SUM(l.credit),
      'balance', SUM(l.debit) - SUM(l.credit)
    ) AS t
    FROM public.acc_voucher_lines l
    JOIN public.acc_vouchers v ON v.id = l.voucher_id
    LEFT JOIN public.acc_accounts a ON a.tenant_id = l.tenant_id AND a.code = l.account_code
    WHERE v.period_id = p_period_id AND v.status <> 'reversed'
    GROUP BY l.account_code, a.name
    ORDER BY l.account_code
  ) g;

  v_checksum := encode(digest(v_vouchers::TEXT || v_ledger::TEXT, 'sha256'), 'hex');

  RETURN jsonb_build_object(
    'circular', 'TT99/2025/TT-BTC',
    'tenant_id', v_period.tenant_id,
    'period', jsonb_build_object(
      'year', v_period.period_year,
      'no', v_period.period_no,
      'start_date', v_period.start_date,
      'end_date', v_period.end_date,
      'status', v_period.status
    ),
    'vouchers', v_vouchers,
    'general_ledger', v_ledger,
    'checksum_sha256', v_checksum,
    'generated_at', timezone('utc'::text, now())
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- -----------------------------------------------------------------------------
-- 8. VIEW tiện dụng — Sổ Nhật ký chung & Sổ cái (Điều 12, Phụ lục III)
-- -----------------------------------------------------------------------------
-- Đây là cách TT99 cho phép: doanh nghiệp tự thiết kế sổ thay vì dùng 42 mẫu cứng.
DROP VIEW IF EXISTS public.v_acc_general_journal;
CREATE VIEW public.v_acc_general_journal AS
SELECT v.tenant_id, v.id AS voucher_id, v.voucher_no, v.voucher_type,
       v.voucher_date, v.post_date, v.status, v.period_id, v.unit_id,
       l.line_no, l.account_code, a.name AS account_name, a.account_type,
       l.debit, l.credit, l.partner_id, l.is_internal, l.description AS line_desc,
       v.description AS voucher_desc, v.source_type, v.source_id
  FROM public.acc_vouchers v
  JOIN public.acc_voucher_lines l ON l.voucher_id = v.id
  LEFT JOIN public.acc_accounts a ON a.tenant_id = l.tenant_id AND a.code = l.account_code;

-- Số dư tài khoản — LUÔN TÍNH, KHÔNG LƯU (nguyên tắc N4)
DROP VIEW IF EXISTS public.v_acc_account_balances;
CREATE VIEW public.v_acc_account_balances AS
SELECT l.tenant_id, l.account_code, v.period_id,
       SUM(l.debit)  AS total_debit,
       SUM(l.credit) AS total_credit,
       SUM(l.debit) - SUM(l.credit) AS net_balance
  FROM public.acc_voucher_lines l
  JOIN public.acc_vouchers v ON v.id = l.voucher_id
 WHERE v.status = 'posted'
 GROUP BY l.tenant_id, l.account_code, v.period_id;

-- =============================================================================
-- KẾT THÚC 002_ledger.sql
-- =============================================================================
