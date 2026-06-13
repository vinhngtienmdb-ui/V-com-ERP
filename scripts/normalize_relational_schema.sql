-- =============================================================================
-- SQL DDL: BẢN DI TRÚ CHUẨN HÓA CƠ SỞ DỮ LIỆU QUAN HỆ (RELATIONAL SCHEMA MIGRATION)
-- =============================================================================

-- Kích hoạt extension pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. DROP các bảng cũ (kiểu JSONB) để cấu trúc lại
DROP TABLE IF EXISTS public.warehouse_stock CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;

-- 2. TẠO BẢNG SẢN PHẨM (products)
CREATE TABLE public.products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(15, 2) DEFAULT 0.00,
  sku TEXT,
  category TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  description_embedding vector(768)
);

-- Kích hoạt RLS cho products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS products_isolation ON public.products;
CREATE POLICY products_isolation ON public.products
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- 3. TẠO BẢNG KHÁCH HÀNG (customers)
CREATE TABLE public.customers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Kích hoạt RLS cho customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS customers_isolation ON public.customers;
CREATE POLICY customers_isolation ON public.customers
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- 4. TẠO BẢNG ĐƠN HÀNG (orders)
CREATE TABLE public.orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT,
  customer_name TEXT,
  total NUMERIC(15, 2) DEFAULT 0.00,
  status TEXT DEFAULT 'pending',
  items JSONB, -- Vẫn giữ items dạng JSONB để tương thích tốt với Frontend mà không cần tạo bảng order_items cồng kềnh
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Kích hoạt RLS cho orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS orders_isolation ON public.orders;
CREATE POLICY orders_isolation ON public.orders
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- 5. TẠO BẢNG TỒN KHO WAREHOUSE (warehouse_stock)
CREATE TABLE public.warehouse_stock (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  store_id TEXT,
  product_id TEXT,
  product_name TEXT,
  quantity NUMERIC(15, 2) DEFAULT 0.00,
  safety_stock NUMERIC(15, 2) DEFAULT 0.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Kích hoạt RLS cho warehouse_stock
ALTER TABLE public.warehouse_stock ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS warehouse_stock_isolation ON public.warehouse_stock;
CREATE POLICY warehouse_stock_isolation ON public.warehouse_stock
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

-- Seed dữ liệu mẫu cho warehouse_stock tương thích ngược với UI materialId
INSERT INTO public.warehouse_stock (id, tenant_id, store_id, product_id, product_name, quantity, safety_stock, updated_at)
VALUES 
  ('ws-001', 'tenant-vcomm-prod-01', 'STORE_001', 'MAT-001', 'Cà phê hạt Robusta', 150.00, 20.00, now()),
  ('ws-002', 'tenant-vcomm-prod-01', 'STORE_001', 'MAT-002', 'Sữa tươi tiệt trùng', 180.00, 30.00, now()),
  ('ws-003', 'tenant-vcomm-prod-01', 'STORE_001', 'MAT-003', 'Trà đen Phúc Long', 90.00, 15.00, now()),
  ('ws-004', 'tenant-vcomm-prod-01', 'STORE_001', 'MAT-004', 'Ly giấy VComm 350ml', 12.00, 50.00, now()),
  ('ws-005', 'tenant-vcomm-prod-01', 'STORE_001', 'MAT-005', 'Đường cát trắng Biên Hòa', 250.00, 10.00, now())
ON CONFLICT (id) DO UPDATE 
SET store_id = EXCLUDED.store_id,
    product_id = EXCLUDED.product_id,
    product_name = EXCLUDED.product_name,
    quantity = EXCLUDED.quantity, 
    safety_stock = EXCLUDED.safety_stock,
    updated_at = now();


-- 6. HÀM RPC TÌM KIẾM TƯƠNG ĐỒNG NGỮ NGHĨA (match_products) trên relational cột chuẩn
CREATE OR REPLACE FUNCTION match_products (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_tenant_id text
)
RETURNS TABLE (
  id text,
  name text,
  description text,
  price numeric,
  similarity float
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.description,
    p.price,
    1 - (p.description_embedding <=> query_embedding) AS similarity
  FROM public.products p
  WHERE p.tenant_id = p_tenant_id 
    AND p.description_embedding IS NOT NULL
    AND 1 - (p.description_embedding <=> query_embedding) > match_threshold
  ORDER BY p.description_embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
