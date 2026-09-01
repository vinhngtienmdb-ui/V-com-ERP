-- 006: Bổ sung cột còn thiếu cho orders/products để khớp dbService adapter
-- (schema cache lỗi: Could not find column 'carrier'/'barcode')

-- orders: cột mà app ghi khi ship/cập nhật
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS carrier TEXT,
  ADD COLUMN IF NOT EXISTS tracking TEXT,
  ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS einvoice_status TEXT,
  ADD COLUMN IF NOT EXISTS einvoice_xml TEXT,
  ADD COLUMN IF NOT EXISTS einvoice_lookup_code TEXT,
  ADD COLUMN IF NOT EXISTS einvoice_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS customer_address TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- products: cột mà PIM ghi
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS barcode TEXT,
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hidden_costs NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seller_name TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS specification TEXT,
  ADD COLUMN IF NOT EXISTS supplier_id TEXT,
  ADD COLUMN IF NOT EXISTS image_urls JSONB,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- customers: cột CRM app ghi
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'Bronze',
  ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promo_balance NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_spent NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS order_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_order_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- warehouse_stock: cột WMS app ghi
ALTER TABLE public.warehouse_stock
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS reserved NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Index tìm kiếm
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON public.orders (seller_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers (email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers (phone);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products (barcode);
CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products (seller_id);
