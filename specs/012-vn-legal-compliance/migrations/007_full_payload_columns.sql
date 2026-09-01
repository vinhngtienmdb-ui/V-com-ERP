-- 007: Đầy đủ cột toRelationalPayload ghi (vét toàn bộ dbService.ts)

-- orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS routed_warehouse TEXT,
  ADD COLUMN IF NOT EXISTS channel TEXT,
  ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ;

-- products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS stock NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS margin NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profit NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weight TEXT,
  ADD COLUMN IF NOT EXISTS dimensions TEXT,
  ADD COLUMN IF NOT EXISTS images JSONB,
  ADD COLUMN IF NOT EXISTS specs JSONB;

-- warehouse_stock
ALTER TABLE public.warehouse_stock
  ADD COLUMN IF NOT EXISTS warehouse_id TEXT,
  ADD COLUMN IF NOT EXISTS allocated NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_processing NUMERIC(15,2) DEFAULT 0;

-- sellers: warehouse_id đã có tên store_id — chỉ thêm thiếu
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='sellers' AND column_name='warehouse_id') THEN
    ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS warehouse_id TEXT;
  END IF;
END $$;

-- payments: cột còn lại của payload
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ;

-- Refresh stats để PostgREST cập nhật schema cache nhanh
NOTIFY pgrst, 'reload schema';
