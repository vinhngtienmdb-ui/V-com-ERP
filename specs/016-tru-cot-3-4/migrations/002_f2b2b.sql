-- =============================================================================
-- SPEC 016 — TRỤ CỘT 4: F2B2B (Farm / Factory → Business → Business)
-- =============================================================================
-- Mô hình:
--   Nguồn hàng (farm/nhà máy) ──gom đơn──> Phiên gom ──> Đặt sản xuất ──> Giao B2B
--
-- Ba bảng:
--   1. f2b2b_sources           — nguồn hàng: nông trại / nhà máy
--   2. f2b2b_pool_orders       — phiên gom đơn (pool)
--   3. f2b2b_pool_participants — các bên B2B tham gia gom
--
-- Khác Mua chung (Trụ cột 3) ở điểm cốt lõi:
--   - Mua chung  : nhiều người mua CÙNG một SKU có sẵn, chốt khi đạt min
--   - F2B2B      : nhiều doanh nghiệp gom đủ sản lượng để ĐẶT SẢN XUẤT/
--                  thu mua trực tiếp từ nguồn, có vòng đời sản xuất & giao hàng
--   => Hai mô hình KHÔNG gộp chung bảng.
--
-- Chạy SAU: 001_group_buy_sessions.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. f2b2b_sources — Nguồn hàng
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.f2b2b_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',

  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'farm'
    CHECK (type IN ('farm','factory','cooperative')),

  -- Pháp lý & liên hệ
  tax_code TEXT,
  contact_name TEXT,
  phone TEXT,
  email TEXT,

  -- Địa lý (để sau này nâng cấp PostGIS theo Đề án F.4)
  province_code TEXT,
  province_name TEXT,
  address TEXT,

  -- Năng lực
  capacity_per_cycle NUMERIC(15,2) NOT NULL DEFAULT 0,
  capacity_unit TEXT NOT NULL DEFAULT 'kg',
  lead_time_days INTEGER NOT NULL DEFAULT 7 CHECK (lead_time_days >= 0),

  -- Chứng nhận: VietGAP / GlobalGAP / HACCP / ISO / Organic ...
  certifications JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Đánh giá nguồn (0-5), cập nhật sau mỗi phiên hoàn tất
  rating NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_completed_pools INTEGER NOT NULL DEFAULT 0,

  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending','active','suspended','blacklisted')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_f2b_sources_tenant ON public.f2b2b_sources (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_f2b_sources_type   ON public.f2b2b_sources (tenant_id, type, status);
CREATE INDEX IF NOT EXISTS idx_f2b_sources_prov   ON public.f2b2b_sources (province_code);

ALTER TABLE public.f2b2b_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS f2b_sources_isolation ON public.f2b2b_sources;
CREATE POLICY f2b_sources_isolation ON public.f2b2b_sources
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

DROP TRIGGER IF EXISTS trg_f2b_sources_touch ON public.f2b2b_sources;
CREATE TRIGGER trg_f2b_sources_touch BEFORE UPDATE ON public.f2b2b_sources
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- 2. f2b2b_pool_orders — Phiên gom đơn
-- -----------------------------------------------------------------------------
-- Vòng đời:
--   draft     → đang soạn
--   open      → đang nhận đăng ký gom
--   closed    → chốt sổ, đã đạt target (hoặc hết hạn đạt min)
--   confirmed → nguồn xác nhận nhận sản xuất / cung ứng
--   producing → đang sản xuất / thu hoạch
--   shipping  → đang giao
--   completed → hoàn tất, có thể đánh giá nguồn
--   cancelled → huỷ (không đạt min / lỗi nguồn) → hoàn tiền người gom
CREATE TABLE IF NOT EXISTS public.f2b2b_pool_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',

  code TEXT NOT NULL,
  source_id UUID NOT NULL REFERENCES public.f2b2b_sources(id) ON DELETE RESTRICT,

  product_id TEXT,
  product_name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',

  -- Sản lượng
  target_qty NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (target_qty >= 0),
  min_qty NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (min_qty >= 0),
  pooled_qty NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (pooled_qty >= 0),

  -- Giá theo bậc (tiered pricing): [{ "minQty": 100, "unitPrice": 25000 }, ...]
  -- Giá thực tế của mỗi bên tham gia = bậc cao nhất mà tổng sản lượng chạm tới
  price_tiers JSONB NOT NULL DEFAULT '[]'::jsonb,
  base_unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  final_unit_price NUMERIC(15,2),   -- chốt khi phiên đóng

  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','open','closed','confirmed','producing','shipping','completed','cancelled')),

  -- Mốc thời gian
  open_at TIMESTAMPTZ,
  close_at TIMESTAMPTZ,
  expected_delivery_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,

  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_f2b_pool_tenant   ON public.f2b2b_pool_orders (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_f2b_pool_source   ON public.f2b2b_pool_orders (source_id, status);
CREATE INDEX IF NOT EXISTS idx_f2b_pool_close    ON public.f2b2b_pool_orders (close_at) WHERE status = 'open';

ALTER TABLE public.f2b2b_pool_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS f2b_pool_isolation ON public.f2b2b_pool_orders;
CREATE POLICY f2b_pool_isolation ON public.f2b2b_pool_orders
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

DROP TRIGGER IF EXISTS trg_f2b_pool_touch ON public.f2b2b_pool_orders;
CREATE TRIGGER trg_f2b_pool_touch BEFORE UPDATE ON public.f2b2b_pool_orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- 3. f2b2b_pool_participants — Các bên B2B tham gia gom
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.f2b2b_pool_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',

  pool_id UUID NOT NULL REFERENCES public.f2b2b_pool_orders(id) ON DELETE CASCADE,

  -- Bên tham gia: doanh nghiệp mua (có thể là seller nội bộ hoặc khách B2B)
  buyer_id TEXT NOT NULL,
  buyer_name TEXT,

  committed_qty NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (committed_qty > 0),
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,   -- giá tại thời điểm tham gia
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,       -- committed_qty * unit_price

  -- Điểm giao hàng riêng của từng bên (gom xong chia lô)
  delivery_address TEXT,
  delivery_province_code TEXT,

  status TEXT NOT NULL DEFAULT 'committed'
    CHECK (status IN ('committed','cancelled','delivered')),

  payment_ref TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  cancelled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_f2b_pp_pool    ON public.f2b2b_pool_participants (pool_id, status);
CREATE INDEX IF NOT EXISTS idx_f2b_pp_buyer   ON public.f2b2b_pool_participants (tenant_id, buyer_id, joined_at DESC);

-- Một bên chỉ có một dòng đang hoạt động trong một phiên gom
CREATE UNIQUE INDEX IF NOT EXISTS uq_f2b_pp_active
  ON public.f2b2b_pool_participants (tenant_id, pool_id, buyer_id)
  WHERE status IN ('committed','delivered');

ALTER TABLE public.f2b2b_pool_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS f2b_pp_isolation ON public.f2b2b_pool_participants;
CREATE POLICY f2b_pp_isolation ON public.f2b2b_pool_participants
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- -----------------------------------------------------------------------------
-- 4. Trigger: tự động cộng pooled_qty khi có bên tham gia / rời
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.f2b_sync_pooled_qty()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pool UUID;
  v_total NUMERIC(15,2);
BEGIN
  v_pool := COALESCE(NEW.pool_id, OLD.pool_id);

  SELECT COALESCE(SUM(committed_qty), 0) INTO v_total
  FROM public.f2b2b_pool_participants
  WHERE pool_id = v_pool AND status IN ('committed','delivered');

  UPDATE public.f2b2b_pool_orders
  SET pooled_qty = v_total,
      updated_at = timezone('utc'::text, now())
  WHERE id = v_pool;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_f2b_pp_sync ON public.f2b2b_pool_participants;
CREATE TRIGGER trg_f2b_pp_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.f2b2b_pool_participants
  FOR EACH ROW EXECUTE FUNCTION public.f2b_sync_pooled_qty();

-- -----------------------------------------------------------------------------
-- 5. Helper: đóng phiên đã hết hạn
--    Đạt min qty → closed (chờ nguồn xác nhận). Không đạt → cancelled.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.f2b_close_stale_pools()
RETURNS TABLE (pool_id UUID, outcome TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_outcome TEXT;
BEGIN
  FOR r IN
    SELECT id, pooled_qty, min_qty FROM public.f2b2b_pool_orders
    WHERE status = 'open'
      AND close_at IS NOT NULL
      AND close_at < timezone('utc'::text, now())
  LOOP
    IF r.pooled_qty >= r.min_qty AND r.min_qty > 0 THEN
      v_outcome := 'closed';
      UPDATE public.f2b2b_pool_orders
      SET status = 'closed', updated_at = timezone('utc'::text, now())
      WHERE id = r.id;
    ELSE
      v_outcome := 'cancelled';
      UPDATE public.f2b2b_pool_participants
      SET status = 'cancelled', cancelled_at = timezone('utc'::text, now())
      WHERE pool_id = r.id AND status = 'committed';

      UPDATE public.f2b2b_pool_orders
      SET status = 'cancelled',
          cancelled_at = timezone('utc'::text, now()),
          cancelled_reason = 'Hết hạn gom nhưng không đạt sản lượng tối thiểu',
          updated_at = timezone('utc'::text, now())
      WHERE id = r.id;
    END IF;

    pool_id := r.id;
    outcome := v_outcome;
    RETURN NEXT;
  END LOOP;
END;
$$;
