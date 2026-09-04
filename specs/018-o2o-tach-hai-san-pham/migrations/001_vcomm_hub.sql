-- =============================================================================
-- SPEC 018 (Phần A) — VCOMM HUB: trạm giao hàng / shop offline do VComm tự vận hành
-- =============================================================================
-- Theo quyết định 6 (specs/015 mục 9.3): O2O được TÁCH thành hai sản phẩm.
--
--   Phần A — VComm Hub  : trạm do VComm TỰ VẬN HÀNH, dùng phần mềm VComm HUB,
--                         CÙNG TENANT với VComm  → XÂY TRONG REPO NÀY (file này)
--
--   Phần B — iPOS       : shop offline của ĐỐI TÁC, sản phẩm RIÊNG BIỆT, mô hình
--                         SAAS ĐA TENANT, đầy đủ chức năng POS
--                         → KHÔNG xây ở đây. Cần spec multi-tenancy (spec 019)
--                           trước khi viết bất kỳ dòng code nào.
--
-- Hai bảng:
--   1. vcomm_hubs     — danh mục trạm (standard / freeze / locker)
--   2. hub_shipments  — kiện hàng gửi về trạm, vòng đời nhận hàng
--
-- Vòng đời kiện:
--   in_transit ──(đến trạm)──> arrived ──(sẵn sàng)──> ready
--                                                         │
--                        ┌────────────────────────────────┴──────────┐
--                   (quét QR, ≤72h)                              (quá 72h)
--                        │                                           │
--                   picked_up                                     expired
--                        │                                           │
--                   (đối soát)                                    returned
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. vcomm_hubs — Danh mục trạm do VComm vận hành
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vcomm_hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',

  code TEXT NOT NULL,
  name TEXT NOT NULL,

  -- Ba loại trạm theo Đề án E.2
  --   standard: trạm tiêu chuẩn, có nhân viên trực
  --   freeze  : trạm đông lạnh cho hàng tươi sống / đông lạnh
  --   locker  : tủ khóa 24-7, tự phục vụ, không cần nhân viên
  type TEXT NOT NULL DEFAULT 'standard'
    CHECK (type IN ('standard','freeze','locker')),

  province_code TEXT,
  province_name TEXT,
  address TEXT,
  -- Toạ độ — để sau này nâng cấp PostGIS theo Đề án F.4 (đã ghi nhận là nợ Năm 2)
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),

  -- Sức chứa và tải hiện tại. Định tuyến sẽ ẨN trạm có current_load >= capacity
  capacity INTEGER NOT NULL DEFAULT 100,
  current_load INTEGER NOT NULL DEFAULT 0,

  -- Trực ngoài giờ / 24-7
  open_24_7 BOOLEAN NOT NULL DEFAULT FALSE,
  operating_hours TEXT,

  manager_name TEXT,
  phone TEXT,

  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','full','maintenance','inactive')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT hub_code_unique UNIQUE (tenant_id, code),
  CONSTRAINT hub_load_sane CHECK (current_load >= 0 AND capacity > 0)
);
ALTER TABLE public.vcomm_hubs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hub_isolation ON public.vcomm_hubs;
CREATE POLICY hub_isolation ON public.vcomm_hubs
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_hub_status   ON public.vcomm_hubs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_hub_province ON public.vcomm_hubs(tenant_id, province_code, status);

-- -----------------------------------------------------------------------------
-- 2. hub_shipments — Kiện hàng gửi về trạm
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hub_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  hub_id UUID NOT NULL REFERENCES public.vcomm_hubs(id) ON DELETE RESTRICT,

  order_id TEXT,
  tracking_code TEXT NOT NULL,

  -- QR động: mã xoay vòng theo thời gian (TOTP), chủ trạm quét để xác thực.
  -- Một API xác thực duy nhất phục vụ cả VComm HUB lẫn iPOS (spec 018 mục 5.3).
  pickup_code TEXT,
  qr_secret TEXT,
  qr_issued_at TIMESTAMPTZ,

  recipient_name TEXT,
  recipient_phone TEXT,

  cod_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  -- Quỹ bảo hiểm O2O: 100–200đ/đơn (Đề án E.3)
  insurance_fee NUMERIC(15,2) NOT NULL DEFAULT 0,
  -- Phạt 15% khi khách không đến nhận trong 72h
  penalty_amount NUMERIC(15,2) NOT NULL DEFAULT 0,

  -- Đồng kiểm tại quầy & hoàn tiền tức thì
  inspection_ok BOOLEAN,
  refunded_amount NUMERIC(15,2) NOT NULL DEFAULT 0,

  status TEXT NOT NULL DEFAULT 'in_transit'
    CHECK (status IN ('in_transit','arrived','ready','picked_up','expired','returned')),

  -- Các mốc thời gian
  arrived_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  reminder_48h_at TIMESTAMPTZ,
  reminder_72h_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  returned_at TIMESTAMPTZ,

  cancelled_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT hub_shipment_money_nonneg CHECK (
    cod_amount >= 0 AND insurance_fee >= 0 AND penalty_amount >= 0 AND refunded_amount >= 0
  ),
  CONSTRAINT hub_shipment_tracking_unique UNIQUE (tenant_id, tracking_code)
);
ALTER TABLE public.hub_shipments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hub_shipment_isolation ON public.hub_shipments;
CREATE POLICY hub_shipment_isolation ON public.hub_shipments
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_hub_ship_hub     ON public.hub_shipments(tenant_id, hub_id, status);
CREATE INDEX IF NOT EXISTS idx_hub_ship_status  ON public.hub_shipments(tenant_id, status, ready_at);
CREATE INDEX IF NOT EXISTS idx_hub_ship_track   ON public.hub_shipments(tenant_id, tracking_code);
CREATE INDEX IF NOT EXISTS idx_hub_ship_pending ON public.hub_shipments(tenant_id, status)
  WHERE status IN ('arrived','ready');

-- -----------------------------------------------------------------------------
-- 3. Tự động nhắc 48h / 72h và tự huỷ sau 72h (Đề án E.3)
-- -----------------------------------------------------------------------------
-- Trả về danh sách kiện cần nhắc hoặc cần huỷ. Không tự gửi thông báo trong
-- migration — phần gửi ZNS/Zalo do tầng service đảm nhiệm (đã có znsService).
CREATE OR REPLACE FUNCTION public.hub_packages_due(p_tenant_id TEXT DEFAULT 'tenant-vcomm-prod-01')
RETURNS TABLE (
  shipment_id UUID,
  tracking_code TEXT,
  hub_id UUID,
  recipient_name TEXT,
  recipient_phone TEXT,
  ready_at TIMESTAMPTZ,
  hours_waiting NUMERIC,
  due_kind TEXT   -- 'remind_48h' | 'remind_72h' | 'expire'
)
LANGUAGE sql
STABLE
AS $$
  WITH waiting AS (
    SELECT
      s.id, s.tracking_code, s.hub_id, s.recipient_name, s.recipient_phone,
      s.ready_at, s.reminder_48h_at, s.reminder_72h_at,
      EXTRACT(EPOCH FROM (timezone('utc'::text, now()) - s.ready_at)) / 3600.0 AS hrs
    FROM public.hub_shipments s
    WHERE s.tenant_id = p_tenant_id
      AND s.status = 'ready'
      AND s.ready_at IS NOT NULL
  )
  SELECT id, tracking_code, hub_id, recipient_name, recipient_phone, ready_at, hrs,
         CASE
           WHEN hrs >= 72 THEN 'expire'
           WHEN hrs >= 48 AND reminder_72h_at IS NULL THEN 'remind_72h'
           WHEN hrs >= 24 AND reminder_48h_at IS NULL THEN 'remind_48h'
         END AS due_kind
  FROM waiting
  WHERE
    (hrs >= 72)
    OR (hrs >= 48 AND reminder_72h_at IS NULL)
    OR (hrs >= 24 AND reminder_48h_at IS NULL)
  ORDER BY ready_at ASC;
$$;

-- -----------------------------------------------------------------------------
-- 4. Trigger updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.hub_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hub_touch ON public.vcomm_hubs;
CREATE TRIGGER trg_hub_touch BEFORE UPDATE ON public.vcomm_hubs
  FOR EACH ROW EXECUTE FUNCTION public.hub_touch_updated_at();

DROP TRIGGER IF EXISTS trg_hub_ship_touch ON public.hub_shipments;
CREATE TRIGGER trg_hub_ship_touch BEFORE UPDATE ON public.hub_shipments
  FOR EACH ROW EXECUTE FUNCTION public.hub_touch_updated_at();
