-- =============================================================================
-- SPEC 021 — TT99/2025/TT-BTC
-- 004_ifrs15.sql — GHI NHẬN DOANH THU THEO MÔ HÌNH 5 BƯỚC (IFRS 15)
-- =============================================================================
-- TT99 chuyển tiêu thức ghi nhận doanh thu sang mô hình gần IFRS 15, THAY THẾ
-- tiêu thức cũ "chuyển giao phần lớn rủi ro và lợi ích gắn liền với quyền sở
-- hữu" của TT200.
--
-- NĂM BƯỚC IFRS 15 và bảng tương ứng:
--
--   Bước 1  Xác định hợp đồng với khách hàng      → rev_contracts
--   Bước 2  Xác định nghĩa vụ thực hiện (NVTV)    → rev_performance_obligations
--   Bước 3  Xác định giá giao dịch               → rev_contracts (fixed/variable)
--   Bước 4  Phân bổ giá giao dịch cho các NVTV    → rev_price_allocations
--   Bước 5  Ghi nhận doanh thu khi thỏa mãn NVTV  → rev_recognition
--
-- TẠI SAO ĐÂY LÀ THAY ĐỔI LỚN NHẤT VỚI VCOMM:
--   Đơn hàng trên sàn thường có NHIỀU nghĩa vụ thực hiện:
--     (a) giao hàng hoá          → ghi nhận tại thời điểm giao (point in time)
--     (b) điểm V-Xu (material right — quyền lựa chọn có giá trị đối với khách)
--                                → ghi nhận khi khách đổi điểm hoặc khi hết hạn
--     (c) bảo hành / quyền đổi trả
--                                → doanh thu bị "ràng buộc" (constraint) phần
--                                  ước tính sẽ bị trả lại
--   → Giá giao dịch phải PHÂN BỔ cho 3 nghĩa vụ theo tỷ lệ giá bán độc lập.
--     Không được ghi nhận toàn bộ vào 5111 ngay khi giao hàng.
--
-- Chạy SAU: 002_ledger.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. rev_contracts — HỢP ĐỒNG VỚI KHÁCH HÀNG (Bước 1 + Bước 3)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rev_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',

  contract_no TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  -- Liên kết ngược về nghiệp vụ nguồn (đơn hàng sàn / hợp đồng B2B)
  order_id TEXT,
  f2b2b_source_id TEXT,

  -- Bước 1: điều kiện tồn tại hợp đồng
  signed_date DATE NOT NULL,
  effective_date DATE,
  end_date DATE,
  -- IFRS 15: hợp đồng chỉ được ghi nhận khi có khả năng thu hồi được tiền
  collectability TEXT NOT NULL DEFAULT 'probable' CHECK (collectability IN ('probable','doubtful')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft','active','suspended','completed','cancelled','terminated'
  )),

  currency_code TEXT NOT NULL DEFAULT 'VND',
  fx_rate NUMERIC(18,6) NOT NULL DEFAULT 1,

  -- Bước 3: giá giao dịch
  fixed_amount NUMERIC(18,2) NOT NULL DEFAULT 0,      -- phần cố định
  variable_amount NUMERIC(18,2) NOT NULL DEFAULT 0,   -- phần biến động (CK, hoàn tiền, thưởng)
  -- Ràng buộc đối với phần biến động (constraint): chỉ ghi nhận phần "không có
  -- khả năng bị hoàn trả đáng kể". Lưu tỷ lệ % được phép ghi nhận.
  variable_constraint_pct NUMERIC(5,2) NOT NULL DEFAULT 100.00
    CHECK (variable_constraint_pct BETWEEN 0 AND 100),
  -- Giá giao dịch cuối cùng = fixed + variable × constraint_pct/100 (trigger tính)
  transaction_price NUMERIC(18,2) NOT NULL DEFAULT 0,

  -- Tổng đã phân bổ cho các nghĩa vụ thực hiện — phải khớp transaction_price
  allocated_total NUMERIC(18,2) NOT NULL DEFAULT 0,
  -- Tổng đã ghi nhận doanh thu
  recognized_total NUMERIC(18,2) NOT NULL DEFAULT 0,
  -- Doanh thu chưa thực hiện → theo dõi trên TK 3387 "Doanh thu chờ phân bổ"
  deferred_total NUMERIC(18,2) NOT NULL DEFAULT 0,

  cancellation_date DATE,
  note TEXT,

  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT rev_contracts_unique_no UNIQUE (tenant_id, contract_no),
  CONSTRAINT rev_contracts_amounts CHECK (
    fixed_amount >= 0 AND variable_amount >= 0 AND transaction_price >= 0
  ),
  CONSTRAINT rev_contracts_alloc_check CHECK (allocated_total <= transaction_price + 0.01),
  CONSTRAINT rev_contracts_currency_fk
    FOREIGN KEY (tenant_id, currency_code)
    REFERENCES public.acc_currencies(tenant_id, code) ON UPDATE CASCADE
);

ALTER TABLE public.rev_contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rev_contracts_isolation ON public.rev_contracts;
CREATE POLICY rev_contracts_isolation ON public.rev_contracts
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_rev_contracts_cust    ON public.rev_contracts(tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_rev_contracts_order   ON public.rev_contracts(tenant_id, order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rev_contracts_status  ON public.rev_contracts(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_rev_contracts_date    ON public.rev_contracts(tenant_id, signed_date DESC);

DROP TRIGGER IF EXISTS trg_rev_contracts_touch ON public.rev_contracts;
CREATE TRIGGER trg_rev_contracts_touch
  BEFORE UPDATE ON public.rev_contracts
  FOR EACH ROW EXECUTE FUNCTION public.acc_touch_updated_at();

-- Tự tính giá giao dịch (Bước 3) khi thêm/sửa hợp đồng.
CREATE OR REPLACE FUNCTION public.rev_contracts_compute_price()
RETURNS TRIGGER AS $$
BEGIN
  NEW.transaction_price := ROUND(
    NEW.fixed_amount + (NEW.variable_amount * NEW.variable_constraint_pct / 100.0), 2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rev_contracts_price ON public.rev_contracts;
CREATE TRIGGER trg_rev_contracts_price
  BEFORE INSERT OR UPDATE ON public.rev_contracts
  FOR EACH ROW EXECUTE FUNCTION public.rev_contracts_compute_price();

-- -----------------------------------------------------------------------------
-- 2. rev_performance_obligations — NGHĨA VỤ THỰC HIỆN (Bước 2)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rev_performance_obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  contract_id UUID NOT NULL REFERENCES public.rev_contracts(id) ON DELETE CASCADE,

  code TEXT NOT NULL,
  name TEXT NOT NULL,

  -- IFRS 35.x: NVTV thỏa mãn TẠI MỘT THỜI ĐIỂM hay TRONG MỘT KHOẢNG THỜI GIAN
  obligation_type TEXT NOT NULL CHECK (obligation_type IN ('point_in_time','over_time')),

  -- Phương pháp đo tiến độ đối với over_time
  progress_method TEXT CHECK (progress_method IN (
    'poc_input',    -- theo chi phí phát sinh / tổng chi phí dự toán
    'poc_output',   -- theo kết quả đầu ra (đơn vị hoàn thành, milestone)
    'straight_line' -- theo thời gian (ví dụ: gói bảo hành 12 tháng)
  )),

  -- Giá bán độc lập ước tính (standalone selling price) — cơ sở phân bổ Bước 4
  standalone_selling_price NUMERIC(18,2) NOT NULL DEFAULT 0,
  -- Tỷ lệ phân bổ = SSP của NVTV / tổng SSP của hợp đồng (trigger tính)
  allocation_pct NUMERIC(8,5) NOT NULL DEFAULT 0,
  -- Giá giao dịch được phân bổ (Bước 4) — trigger tính từ allocation_pct
  allocated_amount NUMERIC(18,2) NOT NULL DEFAULT 0,

  -- Tài khoản doanh thu để sinh bút toán (mặc định 5111 / 5112 / 5118)
  revenue_account_code TEXT NOT NULL DEFAULT '5111',
  -- Tài khoản doanh thu chờ phân bổ (TT99: 3387)
  deferred_account_code TEXT NOT NULL DEFAULT '3387',

  -- Mốc thỏa mãn nghĩa vụ
  satisfied_at TIMESTAMPTZ,
  -- Tiến độ hoàn thành 0–100 (chỉ dùng với over_time)
  progress_pct NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),

  -- Đã ghi nhận lũy kế
  recognized_amount NUMERIC(18,2) NOT NULL DEFAULT 0,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','satisfied','cancelled')),

  display_order INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT rev_po_unique UNIQUE (contract_id, code),
  CONSTRAINT rev_po_over_time_method CHECK (
    obligation_type = 'point_in_time' OR progress_method IS NOT NULL
  ),
  CONSTRAINT rev_po_recognized_limit CHECK (recognized_amount <= allocated_amount + 0.01)
);

ALTER TABLE public.rev_performance_obligations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rev_po_isolation ON public.rev_performance_obligations;
CREATE POLICY rev_po_isolation ON public.rev_performance_obligations
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_rev_po_contract ON public.rev_performance_obligations(contract_id);
CREATE INDEX IF NOT EXISTS idx_rev_po_status   ON public.rev_performance_obligations(tenant_id, status);

DROP TRIGGER IF EXISTS trg_rev_po_touch ON public.rev_performance_obligations;
CREATE TRIGGER trg_rev_po_touch
  BEFORE UPDATE ON public.rev_performance_obligations
  FOR EACH ROW EXECUTE FUNCTION public.acc_touch_updated_at();

-- -----------------------------------------------------------------------------
-- 3. rev_price_allocations — PHÂN BỔ GIÁ GIAO DỊCH (Bước 4)
-- -----------------------------------------------------------------------------
-- Phân bổ theo tỷ lệ giá bán độc lập (relative standalone selling price).
-- Mỗi lần phân bổ lưu lại LÝ DO và CĂN CỨ để phục vụ giải trình khi kiểm toán.
CREATE TABLE IF NOT EXISTS public.rev_price_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  contract_id UUID NOT NULL REFERENCES public.rev_contracts(id) ON DELETE CASCADE,
  obligation_id UUID NOT NULL REFERENCES public.rev_performance_obligations(id) ON DELETE CASCADE,

  standalone_selling_price NUMERIC(18,2) NOT NULL DEFAULT 0,
  allocation_pct NUMERIC(8,5) NOT NULL DEFAULT 0,

  allocated_fixed NUMERIC(18,2) NOT NULL DEFAULT 0,
  allocated_variable NUMERIC(18,2) NOT NULL DEFAULT 0,
  allocated_discount NUMERIC(18,2) NOT NULL DEFAULT 0,
  allocated_total NUMERIC(18,2) NOT NULL DEFAULT 0,

  -- Căn cứ phân bổ — bắt buộc để giải trình (Điều 11(2)(d) TT99)
  basis TEXT NOT NULL DEFAULT 'relative_ssp'
    CHECK (basis IN ('relative_ssp','residual','direct','manual')),
  justification TEXT,

  allocated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  allocated_by TEXT,
  is_superseded BOOLEAN NOT NULL DEFAULT FALSE,   -- TRUE khi có phân bổ lại sau đó

  CONSTRAINT rev_alloc_total_check CHECK (allocated_total >= 0)
);

ALTER TABLE public.rev_price_allocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rev_allocations_isolation ON public.rev_price_allocations;
CREATE POLICY rev_allocations_isolation ON public.rev_price_allocations
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_rev_alloc_contract ON public.rev_price_allocations(contract_id);
CREATE INDEX IF NOT EXISTS idx_rev_alloc_oblig    ON public.rev_price_allocations(obligation_id);

-- -----------------------------------------------------------------------------
-- 4. rev_recognition — GHI NHẬN DOANH THU (Bước 5)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rev_recognition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  obligation_id UUID NOT NULL REFERENCES public.rev_performance_obligations(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES public.rev_contracts(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.acc_periods(id),

  recognition_date DATE NOT NULL,

  -- point_in_time : ghi nhận 100% tại ngày thỏa mãn
  -- over_time     : ghi nhận theo progress_pct
  method TEXT NOT NULL CHECK (method IN ('point_in_time','over_time','breakage','expiry')),

  progress_pct NUMERIC(5,2) NOT NULL CHECK (progress_pct BETWEEN 0 AND 100),
  recognized_amount NUMERIC(18,2) NOT NULL CHECK (recognized_amount >= 0),
  cumulative_recognized NUMERIC(18,2) NOT NULL,
  remaining_amount NUMERIC(18,2) NOT NULL,

  -- 'breakage'  : ghi nhận doanh thu từ V-Xu khách KHÔNG đổi (hết hạn)
  -- 'expiry'    : ghi nhận khi nghĩa vụ hết hạn
  -- Hai method này chỉ hợp lệ với NVTV loại "quyền lựa chọn có giá trị".
  breakage_pct NUMERIC(5,2) CHECK (breakage_pct IS NULL OR breakage_pct BETWEEN 0 AND 100),

  -- Chứng từ kế toán sinh ra (Nợ 3387 / Có 511x)
  voucher_id UUID REFERENCES public.acc_vouchers(id),

  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','posted')),
  reason TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Mỗi nghĩa vụ chỉ ghi nhận 1 lần trong mỗi kỳ (ghi nhận lại = tạo bản ghi mới
  -- ở kỳ sau, không sửa bản ghi cũ — nhất quán nguyên tắc N3)
  CONSTRAINT rev_recog_unique UNIQUE (obligation_id, period_id)
);

ALTER TABLE public.rev_recognition ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rev_recognition_isolation ON public.rev_recognition;
CREATE POLICY rev_recognition_isolation ON public.rev_recognition
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_rev_recog_contract ON public.rev_recognition(contract_id);
CREATE INDEX IF NOT EXISTS idx_rev_recog_period   ON public.rev_recognition(tenant_id, period_id);
CREATE INDEX IF NOT EXISTS idx_rev_recog_status   ON public.rev_recognition(tenant_id, status);

DROP TRIGGER IF EXISTS trg_rev_recog_touch ON public.rev_recognition;
CREATE TRIGGER trg_rev_recog_touch
  BEFORE UPDATE ON public.rev_recognition
  FOR EACH ROW EXECUTE FUNCTION public.acc_touch_updated_at();

-- Khi ghi nhận chuyển sang 'posted': cộng dồn vào nghĩa vụ & hợp đồng,
-- và chặn ghi nhận vượt quá giá đã phân bổ.
CREATE OR REPLACE FUNCTION public.rev_recognition_post()
RETURNS TRIGGER AS $$
DECLARE
  v_alloc    NUMERIC(18,2);
  v_prev_cum NUMERIC(18,2);
  v_obl_type TEXT;
BEGIN
  IF NEW.status <> 'posted' THEN RETURN NEW; END IF;
  -- Đã ghi nhận rồi thì không cộng dồn lần hai
  IF TG_OP = 'UPDATE' AND OLD.status = 'posted' THEN RETURN NEW; END IF;

  SELECT allocated_amount, recognized_amount, obligation_type
    INTO v_alloc, v_prev_cum, v_obl_type
    FROM public.rev_performance_obligations WHERE id = NEW.obligation_id;

  NEW.cumulative_recognized := v_prev_cum + NEW.recognized_amount;
  NEW.remaining_amount := v_alloc - NEW.cumulative_recognized;

  IF NEW.remaining_amount < -0.01 THEN
    RAISE EXCEPTION
      'IFRS15_BUOC_5: Ghi nhận vượt quá giá đã phân bổ — phân bổ %, đã ghi nhận %, đang ghi nhận thêm %', v_alloc, v_prev_cum, NEW.recognized_amount;
  END IF;

  -- Cập nhật lũy kế vào nghĩa vụ thực hiện
  UPDATE public.rev_performance_obligations
     SET recognized_amount = NEW.cumulative_recognized,
         progress_pct = CASE
           WHEN v_obl_type = 'over_time' THEN NEW.progress_pct
           ELSE progress_pct
         END,
         status = CASE
           WHEN NEW.remaining_amount <= 0.01 THEN 'satisfied'
           WHEN v_obl_type = 'over_time' AND NEW.progress_pct > 0 THEN 'in_progress'
           ELSE status
         END,
         satisfied_at = CASE
           WHEN NEW.remaining_amount <= 0.01
             THEN COALESCE(satisfied_at, timezone('utc'::text, now()))
           ELSE satisfied_at
         END
   WHERE id = NEW.obligation_id;

  -- Cập nhật lũy kế vào hợp đồng: doanh thu chờ phân bổ = giá giao dịch − đã ghi nhận
  UPDATE public.rev_contracts c
     SET recognized_total = s.sum_rec,
         deferred_total   = c.transaction_price - s.sum_rec
    FROM (
      SELECT contract_id, COALESCE(SUM(recognized_amount),0) AS sum_rec
        FROM public.rev_performance_obligations
       WHERE contract_id = NEW.contract_id
       GROUP BY contract_id
    ) s
   WHERE c.id = s.contract_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rev_recognition_post ON public.rev_recognition;
CREATE TRIGGER trg_rev_recognition_post
  BEFORE INSERT OR UPDATE ON public.rev_recognition
  FOR EACH ROW EXECUTE FUNCTION public.rev_recognition_post();

-- -----------------------------------------------------------------------------
-- 5. Hàm phân bổ giá giao dịch (Bước 4) — phân bổ lại mỗi khi SSP thay đổi
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rev_allocate_transaction_price(
  p_contract_id UUID,
  p_actor TEXT DEFAULT NULL,
  p_justification TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_total_ssp NUMERIC(18,2);
  v_price NUMERIC(18,2);
  v_fixed NUMERIC(18,2);
  v_variable NUMERIC(18,2);
  v_allocated NUMERIC(18,2) := 0;
  v_count INTEGER := 0;
  r RECORD;
BEGIN
  SELECT transaction_price, fixed_amount, variable_amount
    INTO v_price, v_fixed, v_variable
    FROM public.rev_contracts WHERE id = p_contract_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy hợp đồng %', p_contract_id;
  END IF;

  SELECT COALESCE(SUM(standalone_selling_price),0) INTO v_total_ssp
    FROM public.rev_performance_obligations
   WHERE contract_id = p_contract_id AND status <> 'cancelled';

  IF v_total_ssp <= 0 THEN
    RAISE EXCEPTION
      'IFRS15_BUOC_4: Tổng giá bán độc lập bằng 0 — không thể phân bổ theo tỷ lệ';
  END IF;

  -- Vô hiệu các phân bổ cũ
  UPDATE public.rev_price_allocations
     SET is_superseded = TRUE
   WHERE contract_id = p_contract_id AND is_superseded = FALSE;

  FOR r IN
    SELECT id, standalone_selling_price
      FROM public.rev_performance_obligations
     WHERE contract_id = p_contract_id AND status <> 'cancelled'
     ORDER BY display_order, code
  LOOP
    DECLARE v_pct NUMERIC(8,5);
            v_amt NUMERIC(18,2);
            v_f NUMERIC(18,2);
            v_v NUMERIC(18,2);
    BEGIN
      v_pct := ROUND(r.standalone_selling_price / v_total_ssp, 5);
      v_amt := ROUND(v_price * v_pct, 2);
      v_f   := ROUND(v_fixed * v_pct, 2);
      v_v   := ROUND(v_variable * v_pct, 2);

      INSERT INTO public.rev_price_allocations
        (tenant_id, contract_id, obligation_id, standalone_selling_price,
         allocation_pct, allocated_fixed, allocated_variable, allocated_discount,
         allocated_total, basis, justification, allocated_by)
      VALUES
        ((SELECT tenant_id FROM public.rev_contracts WHERE id = p_contract_id),
         p_contract_id, r.id, r.standalone_selling_price,
         v_pct, v_f, v_v, 0, v_amt, 'relative_ssp', p_justification, p_actor);

      UPDATE public.rev_performance_obligations
         SET allocation_pct = v_pct, allocated_amount = v_amt
       WHERE id = r.id;

      v_allocated := v_allocated + v_amt;
      v_count := v_count + 1;
    END;
  END LOOP;

  UPDATE public.rev_contracts SET allocated_total = v_allocated WHERE id = p_contract_id;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 6. VIEW theo dõi doanh thu chưa thực hiện (TK 3387)
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.v_rev_deferred_revenue;
CREATE VIEW public.v_rev_deferred_revenue AS
SELECT c.tenant_id, c.id AS contract_id, c.contract_no, c.customer_id,
       c.transaction_price, c.allocated_total, c.recognized_total, c.deferred_total,
       COUNT(o.id) AS obligation_count,
       SUM(CASE WHEN o.status = 'satisfied' THEN 1 ELSE 0 END) AS satisfied_count
  FROM public.rev_contracts c
  LEFT JOIN public.rev_performance_obligations o ON o.contract_id = c.id
 WHERE c.deferred_total > 0.01
 GROUP BY c.tenant_id, c.id, c.contract_no, c.customer_id,
          c.transaction_price, c.allocated_total, c.recognized_total, c.deferred_total
 ORDER BY c.deferred_total DESC;

-- =============================================================================
-- KẾT THÚC 004_ifrs15.sql
-- =============================================================================
