-- =============================================================================
-- SPEC 021 — TT99/2025/TT-BTC
-- 003_consolidation.sql — ĐƠN VỊ TRỰC THUỘC + LOẠI BỎ GIAO DỊCH NỘI BỘ (Điều 7)
-- =============================================================================
-- Điều 7 TT99:
--   Đơn vị kế toán có đơn vị trực thuộc thì BÁO CÁO của đơn vị trực thuộc phải
--   được hợp nhất vào BCTC của đơn vị cấp trên. Khi hợp nhất phải LOẠI BỎ TOÀN
--   BỘ giao dịch nội bộ (doanh thu/chi phí nội bộ, công nợ nội bộ, lãi chưa
--   thực hiện trong tài sản).
--
--   ⚠️ TT99 KHÔNG CÒN khái niệm "Báo cáo tài chính tổng hợp" của TT200.
--
-- Ba loại giao dịch nội bộ phải loại bỏ:
--   1. revenue_expense    — doanh thu/chi phí nội bộ (511/632/641/642 ↔ 154/155)
--   2. receivable_payable — công nợ nội bộ (136 ↔ 336)
--   3. unrealized_profit  — lãi chưa thực hiện trong hàng tồn kho / TSCĐ nội bộ
--
-- Chạy SAU: 002_ledger.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. acc_units — Cây đơn vị trực thuộc
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.acc_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',

  code TEXT NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.acc_units(id),

  unit_type TEXT NOT NULL DEFAULT 'branch' CHECK (unit_type IN (
    'head_office',  -- Trụ sở chính
    'branch',       -- Chi nhánh
    'factory',      -- Nhà máy (phục vụ F2B2B — Trụ cột 4)
    'shop',         -- Shop offline
    'hub',          -- VComm Hub (Trụ cột 6 — O2O)
    'warehouse'     -- Kho
  )),

  -- Điều 7: phương pháp hợp nhất
  consolidation_method TEXT NOT NULL DEFAULT 'full' CHECK (consolidation_method IN ('full','none')),
  -- 'none' = đơn vị hạch toán độc lập, KHÔNG hợp nhất (ví dụ: pháp nhân riêng)

  -- Đúng MỘT đơn vị là trụ sở chính trong mỗi tenant (partial unique index bên dưới)
  is_head_office BOOLEAN NOT NULL DEFAULT FALSE,

  -- Thông tin pháp lý & vận hành
  address TEXT,
  tax_code TEXT,
  manager_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  opened_at DATE NOT NULL DEFAULT CURRENT_DATE,
  closed_at DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT acc_units_unique_code UNIQUE (tenant_id, code),
  CONSTRAINT acc_units_no_self_parent CHECK (parent_id IS NULL OR parent_id <> id),
  CONSTRAINT acc_units_head_office_no_parent CHECK (is_head_office = FALSE OR parent_id IS NULL),
  CONSTRAINT acc_units_close_after_open CHECK (closed_at IS NULL OR closed_at >= opened_at)
);

ALTER TABLE public.acc_units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acc_units_isolation ON public.acc_units;
CREATE POLICY acc_units_isolation ON public.acc_units
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- Đúng một trụ sở chính mỗi tenant (Điều 7)
CREATE UNIQUE INDEX IF NOT EXISTS uq_acc_units_head_office
  ON public.acc_units(tenant_id) WHERE is_head_office;

CREATE INDEX IF NOT EXISTS idx_acc_units_parent ON public.acc_units(tenant_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_acc_units_type   ON public.acc_units(tenant_id, unit_type);
CREATE INDEX IF NOT EXISTS idx_acc_units_active ON public.acc_units(tenant_id, is_active);

DROP TRIGGER IF EXISTS trg_acc_units_touch ON public.acc_units;
CREATE TRIGGER trg_acc_units_touch
  BEFORE UPDATE ON public.acc_units
  FOR EACH ROW EXECUTE FUNCTION public.acc_touch_updated_at();

-- Chặn tham chiếu vòng (A là cha của B, B là cha của A)
CREATE OR REPLACE FUNCTION public.acc_units_no_cycle()
RETURNS TRIGGER AS $$
DECLARE v_depth INTEGER := 0; v_cur UUID := NEW.parent_id;
BEGIN
  WHILE v_cur IS NOT NULL AND v_depth < 32 LOOP
    IF v_cur = NEW.id THEN
      RAISE EXCEPTION 'ACC_UNITS_CYCLE: Không được tạo vòng lặp trong cây đơn vị trực thuộc';
    END IF;
    SELECT parent_id INTO v_cur FROM public.acc_units WHERE id = v_cur;
    v_depth := v_depth + 1;
  END LOOP;
  IF v_depth >= 32 THEN
    RAISE EXCEPTION 'ACC_UNITS_CYCLE: Cây đơn vị trực thuộc sâu quá 32 mức — kiểm tra lại dữ liệu';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_acc_units_no_cycle ON public.acc_units;
CREATE TRIGGER trg_acc_units_no_cycle
  BEFORE INSERT OR UPDATE ON public.acc_units
  FOR EACH ROW EXECUTE FUNCTION public.acc_units_no_cycle();

-- Seed: trụ sở chính mặc định cho tenant sản xuất
INSERT INTO public.acc_units (tenant_id, code, name, unit_type, is_head_office, consolidation_method, address)
VALUES ('tenant-vcomm-prod-01','HO','Trụ sở chính — VComm','head_office',TRUE,'full',
        'TP. Hồ Chí Minh')
ON CONFLICT (tenant_id, code) DO NOTHING;

-- FK: acc_vouchers.unit_id → acc_units
ALTER TABLE public.acc_vouchers
  DROP CONSTRAINT IF EXISTS acc_vouchers_unit_fk;
ALTER TABLE public.acc_vouchers
  ADD CONSTRAINT acc_vouchers_unit_fk
  FOREIGN KEY (unit_id) REFERENCES public.acc_units(id);

-- FK: acc_voucher_lines.unit_id / counterparty_unit_id → acc_units
ALTER TABLE public.acc_voucher_lines
  DROP CONSTRAINT IF EXISTS acc_vl_unit_fk;
ALTER TABLE public.acc_voucher_lines
  ADD CONSTRAINT acc_vl_unit_fk
  FOREIGN KEY (unit_id) REFERENCES public.acc_units(id);

ALTER TABLE public.acc_voucher_lines
  DROP CONSTRAINT IF EXISTS acc_vl_counterparty_unit_fk;
ALTER TABLE public.acc_voucher_lines
  ADD CONSTRAINT acc_vl_counterparty_unit_fk
  FOREIGN KEY (counterparty_unit_id) REFERENCES public.acc_units(id);

-- -----------------------------------------------------------------------------
-- 2. acc_internal_txn — Giao dịch nội bộ chờ loại bỏ (Điều 7)
-- -----------------------------------------------------------------------------
-- Tự động sinh khi một bút toán có is_internal = TRUE và counterparty_unit_id
-- khác unit_id. Nguyên tắc N6: gắn cờ NGAY KHI GHI, không gắn hồi tố.
CREATE TABLE IF NOT EXISTS public.acc_internal_txn (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',

  voucher_id UUID NOT NULL REFERENCES public.acc_vouchers(id) ON DELETE CASCADE,
  line_id UUID NOT NULL REFERENCES public.acc_voucher_lines(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.acc_periods(id),

  from_unit_id UUID NOT NULL REFERENCES public.acc_units(id),
  to_unit_id   UUID NOT NULL REFERENCES public.acc_units(id),
  account_code TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL,

  txn_type TEXT NOT NULL DEFAULT 'receivable_payable' CHECK (txn_type IN (
    'revenue_expense','receivable_payable','unrealized_profit'
  )),

  -- unmatched  : mới phát hiện, chưa ghép cặp với bên kia
  -- matched    : đã ghép đủ 2 bên (đối ứng khớp)
  -- eliminated : đã có bút toán loại bỏ khi hợp nhất
  status TEXT NOT NULL DEFAULT 'unmatched' CHECK (status IN ('unmatched','matched','eliminated')),

  matched_txn_id UUID REFERENCES public.acc_internal_txn(id),
  matched_at TIMESTAMPTZ,
  elimination_id UUID,

  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT acc_internal_txn_distinct_units CHECK (from_unit_id <> to_unit_id)
);

ALTER TABLE public.acc_internal_txn ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acc_internal_txn_isolation ON public.acc_internal_txn;
CREATE POLICY acc_internal_txn_isolation ON public.acc_internal_txn
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_acc_itxn_status ON public.acc_internal_txn(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_acc_itxn_period ON public.acc_internal_txn(tenant_id, period_id);
CREATE INDEX IF NOT EXISTS idx_acc_itxn_pair   ON public.acc_internal_txn(tenant_id, from_unit_id, to_unit_id);
CREATE INDEX IF NOT EXISTS idx_acc_itxn_voucher ON public.acc_internal_txn(voucher_id);

DROP TRIGGER IF EXISTS trg_acc_itxn_touch ON public.acc_internal_txn;
CREATE TRIGGER trg_acc_itxn_touch
  BEFORE UPDATE ON public.acc_internal_txn
  FOR EACH ROW EXECUTE FUNCTION public.acc_touch_updated_at();

-- Tự sinh giao dịch nội bộ + tự ghép cặp với bên đối ứng.
CREATE OR REPLACE FUNCTION public.acc_internal_txn_autolink()
RETURNS TRIGGER AS $$
DECLARE
  v_period UUID;
  v_amount NUMERIC(18,2);
  v_counter UUID;
  v_new_id UUID;
BEGIN
  -- Chỉ xử lý bút toán nội bộ có đủ 2 đơn vị
  IF NEW.is_internal = FALSE OR NEW.unit_id IS NULL OR NEW.counterparty_unit_id IS NULL
     OR NEW.unit_id = NEW.counterparty_unit_id THEN
    RETURN NEW;
  END IF;

  SELECT period_id INTO v_period FROM public.acc_vouchers WHERE id = NEW.voucher_id;
  v_amount := GREATEST(NEW.debit, NEW.credit);

  INSERT INTO public.acc_internal_txn
    (tenant_id, voucher_id, line_id, period_id, from_unit_id, to_unit_id,
     account_code, amount, txn_type)
  VALUES
    (NEW.tenant_id, NEW.voucher_id, NEW.id, v_period,
     NEW.unit_id, NEW.counterparty_unit_id, NEW.account_code, v_amount,
     CASE
       WHEN NEW.account_code LIKE '136%' OR NEW.account_code LIKE '336%'
         THEN 'receivable_payable'
       WHEN NEW.account_code LIKE '5%' OR NEW.account_code LIKE '6%'
         THEN 'revenue_expense'
       ELSE 'unrealized_profit'
     END)
  RETURNING id INTO v_new_id;

  -- Ghép cặp với giao dịch ngược chiều cùng số tiền, chưa ghép
  SELECT t.id INTO v_counter
    FROM public.acc_internal_txn t
   WHERE t.tenant_id = NEW.tenant_id
     AND t.id <> v_new_id
     AND t.status = 'unmatched'
     AND t.from_unit_id = NEW.counterparty_unit_id
     AND t.to_unit_id   = NEW.unit_id
     AND t.amount       = v_amount
   ORDER BY t.created_at
   LIMIT 1;

  IF v_counter IS NOT NULL THEN
    UPDATE public.acc_internal_txn
       SET status = 'matched', matched_txn_id = v_counter, matched_at = timezone('utc'::text, now())
     WHERE id = v_new_id;
    UPDATE public.acc_internal_txn
       SET status = 'matched', matched_txn_id = v_new_id, matched_at = timezone('utc'::text, now())
     WHERE id = v_counter;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_acc_vl_internal_autolink ON public.acc_voucher_lines;
CREATE TRIGGER trg_acc_vl_internal_autolink
  AFTER INSERT ON public.acc_voucher_lines
  FOR EACH ROW EXECUTE FUNCTION public.acc_internal_txn_autolink();

-- -----------------------------------------------------------------------------
-- 3. acc_eliminations — Bút toán loại bỏ khi hợp nhất (Điều 7)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.acc_eliminations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',

  elimination_no TEXT NOT NULL,
  period_id UUID NOT NULL REFERENCES public.acc_periods(id),
  elimination_date DATE NOT NULL,

  elimination_type TEXT NOT NULL CHECK (elimination_type IN (
    'revenue_expense',      -- Loại bỏ doanh thu/chi phí nội bộ
    'receivable_payable',   -- Loại bỏ công nợ nội bộ (136 ↔ 336)
    'unrealized_profit',    -- Loại bỏ lãi chưa thực hiện trong hàng tồn kho
    'investment_equity'     -- Loại bỏ giá trị góp vốn vào đơn vị trực thuộc
  )),

  description TEXT NOT NULL,
  total_amount NUMERIC(18,2) NOT NULL DEFAULT 0,

  -- Chứng từ kế toán sinh ra để ghi các bút toán loại bỏ (có thể NULL nếu chỉ
  -- lưu ngoài sổ để lập BCTC hợp nhất mà không ghi sổ chính thức)
  voucher_id UUID REFERENCES public.acc_vouchers(id),

  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','posted')),

  created_by TEXT,
  posted_by TEXT,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT acc_elim_unique_no UNIQUE (tenant_id, period_id, elimination_no)
);

ALTER TABLE public.acc_eliminations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acc_eliminations_isolation ON public.acc_eliminations;
CREATE POLICY acc_eliminations_isolation ON public.acc_eliminations
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_acc_elim_period ON public.acc_eliminations(tenant_id, period_id);
CREATE INDEX IF NOT EXISTS idx_acc_elim_type   ON public.acc_eliminations(tenant_id, elimination_type);

DROP TRIGGER IF EXISTS trg_acc_elim_touch ON public.acc_eliminations;
CREATE TRIGGER trg_acc_elim_touch
  BEFORE UPDATE ON public.acc_eliminations
  FOR EACH ROW EXECUTE FUNCTION public.acc_touch_updated_at();

CREATE TABLE IF NOT EXISTS public.acc_elimination_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  elimination_id UUID NOT NULL REFERENCES public.acc_eliminations(id) ON DELETE CASCADE,
  line_no INTEGER NOT NULL CHECK (line_no > 0),

  account_code TEXT NOT NULL,
  description TEXT,
  debit NUMERIC(18,2) NOT NULL DEFAULT 0,
  credit NUMERIC(18,2) NOT NULL DEFAULT 0,

  unit_id UUID REFERENCES public.acc_units(id),
  internal_txn_id UUID REFERENCES public.acc_internal_txn(id),

  CONSTRAINT acc_elim_lines_unique UNIQUE (elimination_id, line_no),
  CONSTRAINT acc_elim_line_one_side CHECK (
    (debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0)
  )
);

ALTER TABLE public.acc_elimination_lines
  DROP CONSTRAINT IF EXISTS acc_elim_lines_account_fk;
ALTER TABLE public.acc_elimination_lines
  ADD CONSTRAINT acc_elim_lines_account_fk
  FOREIGN KEY (tenant_id, account_code)
  REFERENCES public.acc_accounts(tenant_id, code) ON UPDATE CASCADE;

ALTER TABLE public.acc_elimination_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acc_elimination_lines_isolation ON public.acc_elimination_lines;
CREATE POLICY acc_elimination_lines_isolation ON public.acc_elimination_lines
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_acc_elim_lines ON public.acc_elimination_lines(elimination_id);

-- Khi bút toán loại bỏ được ghi, đánh dấu các giao dịch nội bộ liên quan.
CREATE OR REPLACE FUNCTION public.acc_elim_mark_internal_txn()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'posted' AND OLD.status <> 'posted' THEN
    UPDATE public.acc_internal_txn
       SET status = 'eliminated',
           elimination_id = NEW.id,
           updated_at = timezone('utc'::text, now())
     WHERE tenant_id = NEW.tenant_id
       AND period_id = NEW.period_id
       AND status IN ('unmatched','matched')
       AND id IN (
         SELECT internal_txn_id FROM public.acc_elimination_lines
          WHERE elimination_id = NEW.id AND internal_txn_id IS NOT NULL);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_acc_elim_mark_txn ON public.acc_eliminations;
CREATE TRIGGER trg_acc_elim_mark_txn
  AFTER UPDATE ON public.acc_eliminations
  FOR EACH ROW EXECUTE FUNCTION public.acc_elim_mark_internal_txn();

-- -----------------------------------------------------------------------------
-- 4. VIEW hợp nhất (Điều 7)
-- -----------------------------------------------------------------------------
-- Số cái HỢP NHẤT = tổng các đơn vị − bút toán loại bỏ.
DROP VIEW IF EXISTS public.v_acc_consolidated_ledger;
CREATE VIEW public.v_acc_consolidated_ledger AS
WITH posted AS (
  SELECT l.tenant_id, v.period_id, l.account_code,
         SUM(l.debit) AS debit, SUM(l.credit) AS credit
    FROM public.acc_voucher_lines l
    JOIN public.acc_vouchers v ON v.id = l.voucher_id
   WHERE v.status = 'posted'
   GROUP BY l.tenant_id, v.period_id, l.account_code
),
elim AS (
  SELECT e.tenant_id, e.period_id, el.account_code,
         SUM(el.debit) AS debit, SUM(el.credit) AS credit
    FROM public.acc_eliminations e
    JOIN public.acc_elimination_lines el ON el.elimination_id = e.id
   WHERE e.status = 'posted'
   GROUP BY e.tenant_id, e.period_id, el.account_code
)
SELECT COALESCE(p.tenant_id, e.tenant_id) AS tenant_id,
       COALESCE(p.period_id, e.period_id) AS period_id,
       COALESCE(p.account_code, e.account_code) AS account_code,
       COALESCE(p.debit,0)  - COALESCE(e.debit,0)  AS consolidated_debit,
       COALESCE(p.credit,0) - COALESCE(e.credit,0) AS consolidated_credit,
       (COALESCE(p.debit,0) - COALESCE(e.debit,0))
         - (COALESCE(p.credit,0) - COALESCE(e.credit,0)) AS consolidated_balance
  FROM posted p
  FULL OUTER JOIN elim e
    ON p.tenant_id = e.tenant_id AND p.period_id = e.period_id
   AND p.account_code = e.account_code;

-- Cảnh báo: giao dịch nội bộ chưa được loại bỏ trước khi chốt BCTC hợp nhất.
DROP VIEW IF EXISTS public.v_acc_pending_internal_txn;
CREATE VIEW public.v_acc_pending_internal_txn AS
SELECT t.tenant_id, t.period_id, p.period_year, p.period_no,
       t.id, t.voucher_id, t.from_unit_id, fu.name AS from_unit_name,
       t.to_unit_id, tu.name AS to_unit_name,
       t.account_code, t.amount, t.txn_type, t.status,
       v.voucher_no, v.voucher_date
  FROM public.acc_internal_txn t
  LEFT JOIN public.acc_periods p ON p.id = t.period_id
  LEFT JOIN public.acc_units fu ON fu.id = t.from_unit_id
  LEFT JOIN public.acc_units tu ON tu.id = t.to_unit_id
  LEFT JOIN public.acc_vouchers v ON v.id = t.voucher_id
 WHERE t.status <> 'eliminated'
 ORDER BY t.created_at DESC;

-- =============================================================================
-- KẾT THÚC 003_consolidation.sql
-- =============================================================================
