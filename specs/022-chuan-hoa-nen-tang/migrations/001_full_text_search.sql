-- ============================================================================
--  001_full_text_search.sql — GĐ 4.2: Tìm kiếm toàn văn tiếng Việt
-- ============================================================================
--  Lỗ hổng hạ tầng (spec 022): VComm không có full-text search.
--    · `ILIKE '%áo thun%'`  → KHÔNG khớp "ao thun" / "ÁO THUN" (không bỏ dấu)
--    · KHÔNG có index        → seq scan toàn bảng, chậm dần theo số lượng SKU
--    · Khách hàng / Sản phẩm đang search thủ công bằng `.or(ilike...)` (Customers.tsx)
--
--  Giải pháp: Postgres FTS + extension `unaccent` + cột `search_vector`
--  (tsvector, GENERATED STORED) + GIN index + hàm RPC truy vấn an toàn.
--
--  🔴 BẢO MẬT: `to_tsquery` KHÔNG THỂ THAM SỐ HOÁ — chuỗi truyền vào là CÚ PHÁP.
--     Mọi token bắt buộc phải đi qua `src/services/searchQuery.ts` (escape + bọc nháy)
--     trước khi gọi RPC. Hàm `vcomm_to_tsquery_safe` là lớp chắn thứ 2: nếu cú pháp
--     vẫn lỗi thì trả về tsquery rỗng thay vì ném 500.
--
--  ⚠️ GHI CHÚ TRIỂN KHAI:
--    · `ALTER TABLE ... ADD COLUMN ... GENERATED ALWAYS AS ... STORED` sẽ REWRITE
--      toàn bộ bảng và giữ lock ACCESS EXCLUSIVE → chạy ở GIỜ THẤP ĐIỂM.
--    · `unaccent()` gốc là STABLE (không dùng được trong cột GENERATED) → cần wrapper
--      `vcomm_unaccent()` đánh dấu IMMUTABLE (cách làm chuẩn của Postgres wiki; từ điển
--      bỏ dấu là bất biến trên thực tế).
--    · Dictionary 'simple' (không stemmer) vì tiếng Việt chưa có stemmer chuẩn trong
--      Postgres. Nếu sau này cài được text search config 'vietnamese' thì đổi
--      `searchQuery.ts` + hàm RPC đồng loạt (một chỗ).
--
--  Áp dụng: Supabase SQL Editor hoặc `supabase db push`.
--  Rollback: xem cuối file.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extension
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Wrapper IMMUTABLE quanh unaccent() — bắt buộc để dùng trong cột GENERATED.
CREATE OR REPLACE FUNCTION public.vcomm_unaccent(p_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE PARALLEL SAFE STRICT
AS $$
  SELECT unaccent('public.unaccent', p_text);
$$;

COMMENT ON FUNCTION public.vcomm_unaccent(text) IS
  'GĐ 4.2: wrapper IMMUTABLE của unaccent() để dùng được trong cột GENERATED tsvector.';

-- ---------------------------------------------------------------------------
-- 1. Lớp chắn cú pháp: to_tsquery an toàn (không bao giờ ném lỗi ra client)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vcomm_to_tsquery_safe(p_query text)
RETURNS tsquery
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- p_query ĐÃ được escape sẵn ở client (searchQuery.ts). Lớp này chỉ là phương án cuối.
  RETURN to_tsquery('simple', public.vcomm_unaccent(p_query));
EXCEPTION WHEN OTHERS THEN
  -- Cú pháp sai (không mong đợi) → tìm kiếm trả về rỗng thay vì HTTP 500.
  RETURN ''::tsquery;
END;
$$;

COMMENT ON FUNCTION public.vcomm_to_tsquery_safe(text) IS
  'GĐ 4.2: to_tsquery có bẫy lỗi. Trả về tsquery rỗng thay vì ném exception.';

-- ---------------------------------------------------------------------------
-- 2. SẢN PHẨM — cột search_vector
--    Trọng số: A = tên/SKU/barcode (khớp chính xác nhất) · B = thương hiệu/danh mục
--              · C = mô tả (dài, nhiễu)
-- ---------------------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', public.vcomm_unaccent(coalesce(name,        ''))), 'A') ||
    setweight(to_tsvector('simple', public.vcomm_unaccent(coalesce(sku,         ''))), 'A') ||
    setweight(to_tsvector('simple', public.vcomm_unaccent(coalesce(barcode,     ''))), 'A') ||
    setweight(to_tsvector('simple', public.vcomm_unaccent(coalesce(brand,       ''))), 'B') ||
    setweight(to_tsvector('simple', public.vcomm_unaccent(coalesce(category,    ''))), 'B') ||
    setweight(to_tsvector('simple', public.vcomm_unaccent(coalesce(description, ''))), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_products_search_vector
  ON public.products USING GIN (search_vector);

-- ---------------------------------------------------------------------------
-- 3. KHÁCH HÀNG — cột search_vector
--    Thay cho `.or('name.ilike.%q%,phone.ilike.%q%,email.ilike.%q%')` trong Customers.tsx
--    (3 cột quét tuần tự, không bỏ dấu, không index).
--    Lưu ý: phone/email giữ nguyên ký tự đặc biệt trong 'simple' dictionary → tìm
--    được cả "0912..." và "khuyen.mai@...".
-- ---------------------------------------------------------------------------
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', public.vcomm_unaccent(coalesce(name,    ''))), 'A') ||
    setweight(to_tsvector('simple', public.vcomm_unaccent(coalesce(phone,   ''))), 'A') ||
    setweight(to_tsvector('simple', public.vcomm_unaccent(coalesce(email,   ''))), 'B') ||
    setweight(to_tsvector('simple', public.vcomm_unaccent(coalesce(address, ''))), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_customers_search_vector
  ON public.customers USING GIN (search_vector);

-- ---------------------------------------------------------------------------
-- 4. RPC tìm kiếm (multi-tenant + xếp hạng theo độ khớp)
--    `ts_rank_cd` (cover density) ưu tiên tài liệu ngắn khớp nhiều từ hơn.
--
--    Trả về `rank` để UI sắp xếp và `total_count` để PHÂN TRANG (dùng window
--    `count(*) OVER()` — tính trên toàn bộ tập khớp TRƯỚC khi áp LIMIT/OFFSET,
--    nên UI không phải gọi thêm 1 query count). Client JOIN lấy đủ cột theo id
--    để không phải đổi hàm mỗi lần thêm cột mới.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vcomm_search_products(
  p_query  text,
  p_tenant text DEFAULT 'tenant-vcomm-prod-01',
  p_limit  int  DEFAULT 50,
  p_offset int  DEFAULT 0
)
RETURNS TABLE (id uuid, rank real, total_count bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT ranked.id, ranked.rank, ranked.total_count
  FROM (
    SELECT p.id,
           ts_rank_cd(p.search_vector, s.q)::real AS rank,
           count(*) OVER()                        AS total_count
    FROM public.products p,
         LATERAL (SELECT public.vcomm_to_tsquery_safe(p_query) AS q) s
    WHERE p.tenant_id = p_tenant
      AND s.q <> ''::tsquery          -- query rỗng → không quét (tránh full scan)
      AND p.search_vector @@ s.q
    ORDER BY rank DESC, p.name ASC
    LIMIT p_limit OFFSET p_offset
  ) ranked;
$$;

CREATE OR REPLACE FUNCTION public.vcomm_search_customers(
  p_query  text,
  p_tenant text DEFAULT 'tenant-vcomm-prod-01',
  p_limit  int  DEFAULT 50,
  p_offset int  DEFAULT 0
)
RETURNS TABLE (id uuid, rank real, total_count bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT ranked.id, ranked.rank, ranked.total_count
  FROM (
    SELECT c.id,
           ts_rank_cd(c.search_vector, s.q)::real AS rank,
           count(*) OVER()                        AS total_count
    FROM public.customers c,
         LATERAL (SELECT public.vcomm_to_tsquery_safe(p_query) AS q) s
    WHERE c.tenant_id = p_tenant
      AND s.q <> ''::tsquery
      AND c.search_vector @@ s.q
    ORDER BY rank DESC, c.name ASC
    LIMIT p_limit OFFSET p_offset
  ) ranked;
$$;

COMMENT ON FUNCTION public.vcomm_search_products(text, text, int, int) IS
  'GĐ 4.2: FTS sản phẩm. p_query PHẢI là chuỗi tsquery đã escape (searchQuery.ts). Trả (id, rank, total_count).';
COMMENT ON FUNCTION public.vcomm_search_customers(text, text, int, int) IS
  'GĐ 4.2: FTS khách hàng. p_query PHẢI là chuỗi tsquery đã escape (searchQuery.ts). Trả (id, rank, total_count).';

-- ---------------------------------------------------------------------------
-- 5. Phân quyền
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.vcomm_search_products(text, text, int, int)  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vcomm_search_customers(text, text, int, int) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vcomm_unaccent(text)                         TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vcomm_to_tsquery_safe(text)                  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6. Kiểm tra sau khi chạy (chạy tay để xác nhận)
-- ---------------------------------------------------------------------------
-- SELECT public.vcomm_unaccent('Áo thun Nam');                  -- => 'Ao thun Nam'
-- SELECT public.vcomm_to_tsquery_safe($$'áo' & 'thun'$$);       -- => 'ao' & 'thun'
-- SELECT * FROM public.vcomm_search_products($$'áo' & 'thun'$$);   -- có kết quả
-- SELECT * FROM public.vcomm_search_products($$'ao'  & 'thun'$$);  -- CÙNG kết quả (bỏ dấu)
-- SELECT * FROM public.vcomm_search_products($$'a'$$);             -- rỗng: 1 ký tự vẫn chạy nhưng nhiễu
-- EXPLAIN ANALYZE SELECT * FROM public.vcomm_search_products($$'ao'$$);  -- phải dùng idx_products_search_vector

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- DROP FUNCTION IF EXISTS public.vcomm_search_customers(text, text, int, int);
-- DROP FUNCTION IF EXISTS public.vcomm_search_products(text, text, int, int);
-- DROP FUNCTION IF EXISTS public.vcomm_to_tsquery_safe(text);
-- DROP INDEX  IF EXISTS public.idx_customers_search_vector;
-- DROP INDEX  IF EXISTS public.idx_products_search_vector;
-- ALTER TABLE public.customers DROP COLUMN IF EXISTS search_vector;
-- ALTER TABLE public.products  DROP COLUMN IF EXISTS search_vector;
-- DROP FUNCTION IF EXISTS public.vcomm_unaccent(text);
-- -- (giữ lại extension unaccent, vô hại và có thể dùng bởi module khác)
