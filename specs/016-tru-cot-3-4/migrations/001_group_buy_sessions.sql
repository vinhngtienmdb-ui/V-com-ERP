-- =============================================================================
-- SPEC 016 — TRỤ CỘT 3: MUA CHUNG (GROUP BUY)
-- =============================================================================
-- Mục đích:
--   1. CHUẨN HOÁ tên cột của group_buy_sessions (sửa mismatch DDL <-> dbService)
--   2. Bổ sung các cột còn thiếu cho vòng đời phiên mua chung
--   3. Tạo bảng group_buy_participants (người tham gia) — phần thực sự còn thiếu
--
-- Chạy SAU: specs/012-vn-legal-compliance/migrations/005_relational_modules.sql
--
-- LÝ DO SỬA: 005 tạo cột min_participants / current_participants / expires_at,
-- nhưng dbService.ts map sang min_qty / current_qty / end_time (không tồn tại).
-- Fallback snake_case của mapJsFieldToDbColumn() biến min_qty -> min_qty,
-- khiến INSERT lỗi hoặc mất dữ liệu một cách âm thầm.
-- canonical = tên trong 005 (thứ đang tồn tại thật trong Postgres).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. touch_updated_at() — helper dùng chung, tạo TRƯỚC khi gắn trigger
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 1. Chuẩn hoá group_buy_sessions
-- -----------------------------------------------------------------------------
ALTER TABLE public.group_buy_sessions
  ADD COLUMN IF NOT EXISTS product_id TEXT,
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leader_id TEXT,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS supplier_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_reason TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- Đồng bộ dữ liệu cũ nếu có cột tối thiểu/current dạng _qty (phòng trường hợp
-- migration được chạy trên DB tạo từ một nhánh schema khác)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='group_buy_sessions' AND column_name='min_qty'
  ) THEN
    EXECUTE 'UPDATE public.group_buy_sessions
             SET min_participants = COALESCE(min_qty, min_participants)
             WHERE min_qty IS NOT NULL';
    EXECUTE 'ALTER TABLE public.group_buy_sessions DROP COLUMN min_qty';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='group_buy_sessions' AND column_name='current_qty'
  ) THEN
    EXECUTE 'UPDATE public.group_buy_sessions
             SET current_participants = COALESCE(current_qty, current_participants)
             WHERE current_qty IS NOT NULL';
    EXECUTE 'ALTER TABLE public.group_buy_sessions DROP COLUMN current_qty';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='group_buy_sessions' AND column_name='end_time'
  ) THEN
    EXECUTE 'UPDATE public.group_buy_sessions
             SET expires_at = COALESCE(end_time, expires_at)
             WHERE end_time IS NOT NULL';
    EXECUTE 'ALTER TABLE public.group_buy_sessions DROP COLUMN end_time';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='group_buy_sessions' AND column_name='price_per_unit'
  ) THEN
    EXECUTE 'UPDATE public.group_buy_sessions
             SET unit_price = COALESCE(price_per_unit, unit_price)
             WHERE price_per_unit IS NOT NULL';
  END IF;
END $$;

-- Nới CHECK status: giữ nguyên 6 trạng thái của 005, thêm 'expired'
ALTER TABLE public.group_buy_sessions DROP CONSTRAINT IF EXISTS group_buy_sessions_status_check;
ALTER TABLE public.group_buy_sessions
  ADD CONSTRAINT group_buy_sessions_status_check
  CHECK (status IN (
    'group_open','group_reached_minimum','group_locked',
    'supplier_confirmed','completed','cancelled','expired'
  ));

-- Bảo vệ bất biến: số lượng không âm, tối thiểu >= 2
ALTER TABLE public.group_buy_sessions DROP CONSTRAINT IF EXISTS gbs_qty_nonneg;
ALTER TABLE public.group_buy_sessions
  ADD CONSTRAINT gbs_qty_nonneg
  CHECK (current_participants >= 0 AND min_participants >= 2);

CREATE INDEX IF NOT EXISTS idx_gbs_tenant_status ON public.group_buy_sessions (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_gbs_expires ON public.group_buy_sessions (expires_at) WHERE status = 'group_open';
CREATE INDEX IF NOT EXISTS idx_gbs_combo ON public.group_buy_sessions (combo_id);

DROP TRIGGER IF EXISTS trg_gbs_touch ON public.group_buy_sessions;
CREATE TRIGGER trg_gbs_touch BEFORE UPDATE ON public.group_buy_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RLS (idempotent)
ALTER TABLE public.group_buy_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS gbs_isolation ON public.group_buy_sessions;
CREATE POLICY gbs_isolation ON public.group_buy_sessions
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- -----------------------------------------------------------------------------
-- 2. group_buy_participants — NGƯỜI THAM GIA (phần còn thiếu)
-- -----------------------------------------------------------------------------
-- Một phiên mua chung chỉ có ý nghĩa khi biết ai tham gia, tham gia bao nhiêu,
-- và có thể thoái lui (refund) khi phiên không đạt tối thiểu.
CREATE TABLE IF NOT EXISTS public.group_buy_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  session_id TEXT NOT NULL REFERENCES public.group_buy_sessions(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL,
  customer_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'joined'
    CHECK (status IN ('joined','confirmed','refunded','cancelled')),
  payment_ref TEXT,          -- mã giao dịch escrow / ví, để hoàn tiền khi huỷ
  order_id TEXT,             -- đơn được sinh khi phiên thành công
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  cancelled_at TIMESTAMPTZ
);

-- Một khách chỉ có một dòng đang hoạt động trong một phiên.
-- Dùng partial unique index thay vì UNIQUE NULLS NOT DISTINCT (chỉ có ở PG15+).
CREATE UNIQUE INDEX IF NOT EXISTS uq_gbp_active
  ON public.group_buy_participants (tenant_id, session_id, customer_id)
  WHERE status IN ('joined','confirmed');

CREATE INDEX IF NOT EXISTS idx_gbp_session ON public.group_buy_participants (session_id, status);
CREATE INDEX IF NOT EXISTS idx_gbp_customer ON public.group_buy_participants (tenant_id, customer_id, joined_at DESC);

ALTER TABLE public.group_buy_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS gbp_isolation ON public.group_buy_participants;
CREATE POLICY gbp_isolation ON public.group_buy_participants
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- -----------------------------------------------------------------------------
-- 3. Trigger: tự động cập nhật current_participants khi có người tham gia / rời
-- -----------------------------------------------------------------------------
-- Tránh đếm sai do race condition khi nhiều người tham gia cùng lúc.
CREATE OR REPLACE FUNCTION public.gb_sync_participant_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session TEXT;
  v_active INTEGER;
BEGIN
  v_session := COALESCE(NEW.session_id, OLD.session_id);

  SELECT COALESCE(SUM(quantity), 0) INTO v_active
  FROM public.group_buy_participants
  WHERE session_id = v_session
    AND status IN ('joined','confirmed');

  UPDATE public.group_buy_sessions
  SET current_participants = v_active,
      status = CASE
        WHEN status IN ('group_open','group_reached_minimum') THEN
          CASE WHEN v_active >= min_participants THEN 'group_reached_minimum' ELSE 'group_open' END
        ELSE status
      END,
      updated_at = timezone('utc'::text, now())
  WHERE id = v_session;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_gbp_sync ON public.group_buy_participants;
CREATE TRIGGER trg_gbp_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.group_buy_participants
  FOR EACH ROW EXECUTE FUNCTION public.gb_sync_participant_count();

-- -----------------------------------------------------------------------------
-- 4. Helper: tự động đóng các phiên hết hạn chưa đạt tối thiểu
-- -----------------------------------------------------------------------------
-- Gọi định kỳ (cron / edge function). Tách ra để có thể test độc lập.
CREATE OR REPLACE FUNCTION public.gb_expire_stale_sessions()
RETURNS TABLE (session_id TEXT, refunded_participants INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_count INTEGER;
BEGIN
  FOR r IN
    SELECT id FROM public.group_buy_sessions
    WHERE status IN ('group_open')
      AND expires_at IS NOT NULL
      AND expires_at < timezone('utc'::text, now())
  LOOP
    UPDATE public.group_buy_participants
    SET status = 'refunded', cancelled_at = timezone('utc'::text, now())
    WHERE session_id = r.id AND status IN ('joined','confirmed');

    GET DIAGNOSTICS v_count = ROW_COUNT;

    UPDATE public.group_buy_sessions
    SET status = 'expired', cancelled_at = timezone('utc'::text, now()),
        cancelled_reason = 'Hết hạn chưa đạt số lượng tối thiểu',
        updated_at = timezone('utc'::text, now())
    WHERE id = r.id;

    session_id := r.id;
    refunded_participants := v_count;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. Hoàn tất
-- -----------------------------------------------------------------------------
-- Định kỳ gọi SELECT * FROM public.gb_expire_stale_sessions();
-- (qua pg_cron hoặc Edge Function) để đóng các phiên hết hạn và hoàn tiền.
