-- =============================================================================
-- SPEC 017 — TRỤ CỘT 1 (phần DROPSHIP): Dropship
-- =============================================================================
-- QUYẾT ĐỊNH: Affiliate và Dropship là HAI MÔ HÌNH KHÁC NHAU, không gộp.
--
--   Affiliate (đã có, 1 component):
--     - Người GIỚI THIỆU (KOL / publisher / agent) chia sẻ link.
--     - Không sở hữu hàng, không đặt giá, không chạm kho, không chạm giao hàng.
--     - Thu nhập = HOA HỒNG (commission) tính trên đơn VComm tự chốt.
--     - Dữ liệu lõi: click, đơn được gán, % hoa hồng.
--
--   Dropship (spec này):
--     - Người BÁN: tự niêm yết và bán hàng trên KÊNH CỦA HỌ
--       (Shopee / Lazada / TikTok Shop / website riêng).
--     - Tự quyết định GIÁ BÁN, ăn CHÊNH LỆCH (margin).
--     - VComm giữ kho, lấy hàng, đóng gói, GIAO HÀNG và thu hộ COD.
--     - Dữ liệu lõi: listing trên kênh ngoài, đồng bộ tồn kho, đơn đẩy về
--       VComm để fulfill, sổ margin phải trả đối tác.
--
--   => Hệ quả: không dùng chung bảng với Affiliate. Dropship cần vòng đời
--      fulfill (giữ kho → lấy hàng → giao → đối soát) mà Affiliate không có.
--
-- Bốn bảng:
--   1. dropship_partners      — đối tác bán hàng (người bán dropship)
--   2. dropship_listings      — sản phẩm VComm được niêm yết trên kênh của họ
--   3. dropship_orders        — đơn từ kênh ngoài đẩy về VComm để fulfill
--   4. dropship_margin_ledger — sổ chênh lệch phải trả đối tác
--
-- LƯU Ý PHÂN QUYỀN: đối tác dropship là PARTNER TRONG CÙNG TENANT của VComm,
-- KHÔNG phải tenant riêng. (Tenant riêng là câu chuyện của iPOS SaaS — spec 018.)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. dropship_partners — Đối tác bán hàng
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dropship_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',

  code TEXT NOT NULL,
  name TEXT NOT NULL,
  shop_name TEXT,

  -- Kênh bán: shopee / lazada / tiktok / tiki / sendo / website / other
  channels JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Pháp lý & liên hệ
  tax_code TEXT,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,

  -- Định danh thật (NĐ 52/85) — đối tác nhận tiền phải được KYC
  vneid_verified BOOLEAN NOT NULL DEFAULT FALSE,
  vneid_linked_at TIMESTAMPTZ,

  -- Cơ chế ăn chia: tỉ lệ margin đối tác được hưởng trên chênh lệch gộp.
  -- margin_split = 0.8 nghĩa là đối tác ăn 80% chênh lệch, VComm giữ 20%.
  margin_split NUMERIC(5,4) NOT NULL DEFAULT 0.8000
    CHECK (margin_split >= 0 AND margin_split <= 1),

  -- Thông tin thanh toán margin
  bank_name TEXT,
  bank_account TEXT,
  bank_account_name TEXT,

  -- Hạn mức công nợ COD đang giữ (VComm thu hộ nhưng chưa trả đối tác)
  outstanding_cod NUMERIC(15,2) NOT NULL DEFAULT 0,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','active','suspended','blacklisted')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT ds_partner_code_unique UNIQUE (tenant_id, code),
  CONSTRAINT ds_partner_split_sane CHECK (margin_split >= 0 AND margin_split <= 1)
);
ALTER TABLE public.dropship_partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ds_partner_isolation ON public.dropship_partners;
CREATE POLICY ds_partner_isolation ON public.dropship_partners
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_ds_partner_status ON public.dropship_partners(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_ds_partner_code   ON public.dropship_partners(tenant_id, code);

-- -----------------------------------------------------------------------------
-- 2. dropship_listings — Sản phẩm VComm niêm yết trên kênh của đối tác
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dropship_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  partner_id UUID NOT NULL REFERENCES public.dropship_partners(id) ON DELETE CASCADE,

  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,

  -- Mã SKU phía kênh ngoài (Shopee/Lazada/...) — dùng để khớp đơn đẩy về
  external_sku TEXT,
  channel TEXT NOT NULL DEFAULT 'other'
    CHECK (channel IN ('shopee','lazada','tiktok','tiki','sendo','website','other')),
  external_url TEXT,

  -- Giá: đối tác tự quyết định giá bán, nhưng không được dưới GIÁ SÀN.
  -- Giá sàn bảo vệ thương hiệu, tránh đối tác phá giá thị trường.
  base_cost NUMERIC(15,2) NOT NULL DEFAULT 0,          -- giá VComm xuất cho đối tác
  listed_price NUMERIC(15,2) NOT NULL DEFAULT 0,       -- giá đối tác niêm yết
  min_selling_price NUMERIC(15,2) NOT NULL DEFAULT 0,  -- giá sàn do VComm ấn định
  shipping_fee NUMERIC(15,2) NOT NULL DEFAULT 0,       -- phí ship đối tác thu của khách

  -- Đồng bộ tồn kho sang kênh ngoài (chống oversell)
  stock_synced NUMERIC(15,2) NOT NULL DEFAULT 0,
  synced_at TIMESTAMPTZ,

  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','paused','delisted')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT ds_listing_price_positive CHECK (base_cost >= 0 AND listed_price >= 0),
  CONSTRAINT ds_listing_stock_nonneg   CHECK (stock_synced >= 0),

  -- Một sản phẩm chỉ được niêm yết 1 lần trên 1 kênh của 1 đối tác
  CONSTRAINT ds_listing_unique UNIQUE (tenant_id, partner_id, product_id, channel)
);
ALTER TABLE public.dropship_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ds_listing_isolation ON public.dropship_listings;
CREATE POLICY ds_listing_isolation ON public.dropship_listings
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_ds_listing_partner ON public.dropship_listings(tenant_id, partner_id, status);
CREATE INDEX IF NOT EXISTS idx_ds_listing_product ON public.dropship_listings(tenant_id, product_id);
CREATE INDEX IF NOT EXISTS idx_ds_listing_sku     ON public.dropship_listings(tenant_id, channel, external_sku);

-- -----------------------------------------------------------------------------
-- 3. dropship_orders — Đơn từ kênh ngoài đẩy về VComm để fulfill
-- -----------------------------------------------------------------------------
-- Vòng đời:
--   pending ──(giữ được kho)──> stock_reserved ──> picking ──> shipping
--                                                                │
--                                            ┌───────────────────┴─────────┐
--                                         delivered                     returned
--                                            │                              │
--                                         settled                      cancelled
--   pending / stock_reserved / picking ──(hết kho, khách huỷ)──> cancelled
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.dropship_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  partner_id UUID NOT NULL REFERENCES public.dropship_partners(id) ON DELETE RESTRICT,

  code TEXT NOT NULL,                 -- mã đơn nội bộ VComm
  external_order_code TEXT NOT NULL,  -- mã đơn trên kênh của đối tác
  channel TEXT NOT NULL DEFAULT 'other',

  -- items JSONB: [{ productId, productName, externalSku, quantity,
  --                 unitCost, unitPrice, lineMargin }]
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  item_count INTEGER NOT NULL DEFAULT 0,
  quantity NUMERIC(15,2) NOT NULL DEFAULT 0,

  -- Người nhận cuối (khách của đối tác)
  buyer_name TEXT,
  buyer_phone TEXT,
  shipping_address TEXT,
  shipping_province_code TEXT,

  -- Tiền
  cod_amount NUMERIC(15,2) NOT NULL DEFAULT 0,  -- VComm thu hộ
  total_cost NUMERIC(15,2) NOT NULL DEFAULT 0,  -- vốn hàng VComm xuất
  shipping_fee NUMERIC(15,2) NOT NULL DEFAULT 0,
  gross_margin NUMERIC(15,2) NOT NULL DEFAULT 0, -- chênh lệch gộp = tiền thu − vốn − ship
  partner_margin NUMERIC(15,2) NOT NULL DEFAULT 0, -- phần đối tác được hưởng
  vcomm_margin NUMERIC(15,2) NOT NULL DEFAULT 0,   -- phần VComm giữ

  -- Giao hàng
  carrier TEXT,
  tracking_code TEXT,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','stock_reserved','picking','shipping',
                      'delivered','settled','cancelled','returned')),

  -- Mốc trạng thái
  reserved_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT ds_order_ext_unique UNIQUE (tenant_id, channel, external_order_code),
  CONSTRAINT ds_order_money_nonneg CHECK (
    cod_amount >= 0 AND total_cost >= 0 AND shipping_fee >= 0
  )
);
ALTER TABLE public.dropship_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ds_order_isolation ON public.dropship_orders;
CREATE POLICY ds_order_isolation ON public.dropship_orders
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_ds_order_partner ON public.dropship_orders(tenant_id, partner_id, status);
CREATE INDEX IF NOT EXISTS idx_ds_order_status   ON public.dropship_orders(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ds_order_ext      ON public.dropship_orders(tenant_id, channel, external_order_code);

-- -----------------------------------------------------------------------------
-- 4. dropship_margin_ledger — Sổ chênh lệch phải trả đối tác
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dropship_margin_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  partner_id UUID NOT NULL REFERENCES public.dropship_partners(id) ON DELETE CASCADE,

  order_id UUID REFERENCES public.dropship_orders(id) ON DELETE SET NULL,

  -- accrual: ghi nhậnmargin khi đơn delivered
  -- payout  : VComm đã trả đối tác
  -- adjustment: điều chỉnh (phạt, bù giá, hoàn hàng)
  type TEXT NOT NULL CHECK (type IN ('accrual','payout','adjustment')),

  amount NUMERIC(15,2) NOT NULL,   -- accrual/adjustment: số dương = tăng nợ VComm với đối tác
  note TEXT,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','void')),

  -- Kỳ đối soát, ví dụ '2026-09'
  period TEXT,

  paid_at TIMESTAMPTZ,
  payout_ref TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.dropship_margin_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ds_ledger_isolation ON public.dropship_margin_ledger;
CREATE POLICY ds_ledger_isolation ON public.dropship_margin_ledger
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_ds_ledger_partner ON public.dropship_margin_ledger(tenant_id, partner_id, status);
CREATE INDEX IF NOT EXISTS idx_ds_ledger_period  ON public.dropship_margin_ledger(tenant_id, period, partner_id);

-- -----------------------------------------------------------------------------
-- 5. Trigger updated_at cho ba bảng có trạng thái
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ds_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ds_partner_touch ON public.dropship_partners;
CREATE TRIGGER trg_ds_partner_touch BEFORE UPDATE ON public.dropship_partners
  FOR EACH ROW EXECUTE FUNCTION public.ds_touch_updated_at();

DROP TRIGGER IF EXISTS trg_ds_listing_touch ON public.dropship_listings;
CREATE TRIGGER trg_ds_listing_touch BEFORE UPDATE ON public.dropship_listings
  FOR EACH ROW EXECUTE FUNCTION public.ds_touch_updated_at();

DROP TRIGGER IF EXISTS trg_ds_order_touch ON public.dropship_orders;
CREATE TRIGGER trg_ds_order_touch BEFORE UPDATE ON public.dropship_orders
  FOR EACH ROW EXECUTE FUNCTION public.ds_touch_updated_at();
