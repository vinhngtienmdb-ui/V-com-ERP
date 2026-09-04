-- =============================================================================
-- 004 — CACHE TẬP TRUNG (GĐ 2.3, spec 022)
-- =============================================================================
-- VẤN ĐỀ CẦN GIẢI QUYẾT
-- -----------------------------------------------------------------------------
-- `src/services/taxService.ts` đang giữ biến module-level:
--     let rulesCache: { rules: TaxRateRule[]; loadedAt: number } | null = null;
--
-- Ba hệ quả sai khi chạy >1 instance (2 pod, 2 tab render SSR, 1 server + 1 worker):
--   1. Mỗi instance có bản sao riêng, tự hết hạn vào thời điểm khác nhau → CÙNG
--      MỘT ĐƠN HÀNG có thể bị tính 2 mức thuế khác nhau tùy vào instance nào xử lý.
--   2. `clearTaxRulesCache()` chỉ xóa biến của instance đang chạy. Admin sửa
--      `tax_rate_rules` → các instance khác vẫn bán theo thuế suất CŨ tối đa 5 phút.
--      Với thuế suất, 5 phút sai = xuất sai hóa đơn = lỗi pháp lý, không phải lỗi hiển thị.
--   3. Không có cách nào invalidate từ bên ngoài (job, admin panel instance khác).
--
-- CÁCH GIẢI QUYẾT
-- -----------------------------------------------------------------------------
-- Cache 2 tầng trong `src/lib/distributedCache.ts`:
--   L1 — MemoryCache in-process: phục vụ hit trong cùng instance, KHÔNG query DB.
--   L2 — Bảng `cache_entries` dưới đây: nguồn chân lý DÙNG CHUNG cho mọi instance.
--
-- ⚠️ NÓI THẬT VỀ LỢI ÍCH: với dữ liệu RẺ như `tax_rate_rules` (1 query nhỏ), L2
--    không nhanh hơn là bao — chi phí vẫn là 1 round-trip DB. Giá trị THẬT của L2
--    nằm ở hai chỗ: (a) mọi instance nhìn cùng một giá trị với cùng một thời điểm
--    hết hạn; (b) invalidate được TỪ XA (xóa 1 dòng → mọi instance mất cache).
--    Đừng dùng L2 để "tăng tốc" — hãy dùng để "đồng nhất".
--
-- THIẾT KẾ
-- -----------------------------------------------------------------------------
-- · `SECURITY INVOKER` (KHÔNG dùng DEFINER) để RLS vẫn áp dụng — nhất quán với
--   migration 002 (outbox) và 003 (feature flags).
-- · Khóa cache có prefix theo tenant (`t:<tenant>:<key>`) để một tenant không
--   đọc nhầm cache của tenant khác. Hàm tự thêm prefix, caller không cần nhớ.
-- · Hết hạn được xử lý CẢ khi đọc (trả NULL + xóa) lẫn khi chạy `vcomm_cache_prune()`.
-- · MỌI hàm đều fail-soft ở tầng TS; ở đây trả NULL/0 thay vì ném, để cache hỏng
--   không được phép làm sập nghiệp vụ.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.cache_entries (
  key         TEXT PRIMARY KEY,
  value       JSONB       NOT NULL,
  tenant_id   TEXT        NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prune định kỳ quét theo expires_at.
CREATE INDEX IF NOT EXISTS idx_cache_expires ON public.cache_entries (expires_at);
-- Invalidate theo prefix (ví dụ mọi key bắt đầu bằng `tax_rules:`).
CREATE INDEX IF NOT EXISTS idx_cache_prefix ON public.cache_entries (tenant_id, key text_pattern_ops);

ALTER TABLE public.cache_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cache_entries_tenant ON public.cache_entries;
CREATE POLICY cache_entries_tenant ON public.cache_entries
  FOR ALL USING (
    tenant_id = COALESCE(auth.jwt() ->> 'tenant_id', 'tenant-vcomm-prod-01')
    OR tenant_id = 'tenant-vcomm-prod-01'
  );

-- -----------------------------------------------------------------------------
-- vcomm_cache_get — đọc 1 key. Trả NULL nếu không có hoặc đã hết hạn (và xóa).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vcomm_cache_get(
  p_key       TEXT,
  p_tenant_id TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_tenant TEXT := COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id', 'tenant-vcomm-prod-01');
  v_full   TEXT := 't:' || v_tenant || ':' || p_key;
  v_value  JSONB;
BEGIN
  SELECT value INTO v_value
  FROM public.cache_entries
  WHERE key = v_full AND expires_at > now();

  IF v_value IS NULL THEN
    -- Dọn luôn bản ghi hết hạn để bảng không phình (đọc miss cũng có ích).
    DELETE FROM public.cache_entries WHERE key = v_full AND expires_at <= now();
    RETURN NULL;
  END IF;

  RETURN v_value;
END;
$$;

-- -----------------------------------------------------------------------------
-- vcomm_cache_set — ghi/đè 1 key với TTL (giây).
--   p_ttl_seconds <= 0 → KHÔNG ghi (coi như vô hiệu), trả false.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vcomm_cache_set(
  p_key         TEXT,
  p_value       JSONB,
  p_ttl_seconds INT   DEFAULT 300,
  p_tenant_id   TEXT  DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_tenant TEXT := COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id', 'tenant-vcomm-prod-01');
BEGIN
  IF p_ttl_seconds IS NULL OR p_ttl_seconds <= 0 THEN
    RETURN false;
  END IF;

  INSERT INTO public.cache_entries (key, value, tenant_id, expires_at, updated_at)
  VALUES (
    't:' || v_tenant || ':' || p_key,
    p_value,
    v_tenant,
    now() + (p_ttl_seconds || ' seconds')::interval,
    now()
  )
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        expires_at = EXCLUDED.expires_at,
        updated_at = now();

  RETURN true;
END;
$$;

-- -----------------------------------------------------------------------------
-- vcomm_cache_del — invalidate 1 key (có hiệu lực trên MỌI instance).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vcomm_cache_del(
  p_key       TEXT,
  p_tenant_id TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_tenant TEXT := COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id', 'tenant-vcomm-prod-01');
  v_count  INT;
BEGIN
  DELETE FROM public.cache_entries
  WHERE key = 't:' || v_tenant || ':' || p_key;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

-- -----------------------------------------------------------------------------
-- vcomm_cache_del_prefix — invalidate hàng loạt theo prefix.
--   Dùng khi sửa một nhóm dữ liệu (vd mọi key `tax_rules:*`).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vcomm_cache_del_prefix(
  p_prefix    TEXT,
  p_tenant_id TEXT DEFAULT NULL
) RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_tenant TEXT := COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id', 'tenant-vcomm-prod-01');
  v_count  INT;
BEGIN
  DELETE FROM public.cache_entries
  WHERE key LIKE 't:' || v_tenant || ':' || p_prefix || '%';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- -----------------------------------------------------------------------------
-- vcomm_cache_prune — dọn bản ghi hết hạn. Gọi định kỳ (cron/job).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vcomm_cache_prune(
  p_limit INT DEFAULT 10000
) RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  -- Giới hạn số dòng xóa mỗi lần để không khóa bảng lâu trên bảng lớn.
  DELETE FROM public.cache_entries
  WHERE key IN (
    SELECT key FROM public.cache_entries
    WHERE expires_at <= now()
    ORDER BY expires_at
    LIMIT GREATEST(p_limit, 1)
  );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- -----------------------------------------------------------------------------
-- vcomm_cache_stats — quan sát tình trạng cache (đưa vào /metrics).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vcomm_cache_stats()
RETURNS TABLE (total BIGINT, live BIGINT, expired BIGINT)
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public
AS $$
  SELECT
    count(*)                                  AS total,
    count(*) FILTER (WHERE expires_at > now()) AS live,
    count(*) FILTER (WHERE expires_at <= now()) AS expired
  FROM public.cache_entries;
$$;

-- -----------------------------------------------------------------------------
-- Realtime: kênh invalidate TỨC THÌ
-- -----------------------------------------------------------------------------
-- LÝ DO CẦN: `vcomm_cache_del` xóa được dòng ở L2 (dùng chung mọi instance),
-- nhưng KHÔNG chạm được L1 (bộ nhớ) của các instance khác — chúng vẫn phục vụ
-- dữ liệu cũ cho đến khi L1 tự hết hạn (mặc định 30s). Với dữ liệu như thuế
-- suất, 30 giây sai là không chấp nhận được.
--
-- Cách giải: phát sự kiện Realtime khi dòng bị xóa/đổi → mọi instance xóa L1
-- ngay. TTL ngắn của L1 chỉ còn là LƯỚI AN TOÀN khi Realtime mất kết nối.
--
-- ⚠️ Nếu publication `supabase_realtime` chưa tồn tại (project tự host, bản
-- Supabase cũ) → DO block bên dưới chỉ cảnh báo, KHÔNG làm migration thất bại.
-- Khi đó hệ thống vẫn chạy, nhưng invalidate chậm tối đa = TTL của L1.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'cache_entries'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.cache_entries;
      RAISE NOTICE 'cache_entries: đã thêm vào publication supabase_realtime';
    END IF;
  ELSE
    RAISE WARNING 'cache_entries: KHÔNG tìm thấy publication supabase_realtime — invalidate sẽ chậm theo TTL L1. Kiểm tra lại cấu hình Realtime.';
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- Quyền
-- -----------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cache_entries TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vcomm_cache_get(TEXT, TEXT)          TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.vcomm_cache_set(TEXT, JSONB, INT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vcomm_cache_del(TEXT, TEXT)          TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vcomm_cache_del_prefix(TEXT, TEXT)   TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vcomm_cache_prune(INT)               TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vcomm_cache_stats()                  TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- =============================================================================
-- KIỂM TRA SAU KHI CHẠY (chạy tay, từng câu một)
-- =============================================================================
-- SELECT public.vcomm_cache_set('tax_rules:all', '[{"vat_rate":0.08}]'::jsonb, 300);
-- SELECT public.vcomm_cache_get('tax_rules:all');            -- trả JSON
-- SELECT public.vcomm_cache_get('chua-co');                  -- trả NULL
-- SELECT public.vcomm_cache_set('tax_rules:hang-hoa', '[]'::jsonb, 300);
-- SELECT public.vcomm_cache_del_prefix('tax_rules:');        -- trả 2
-- SELECT public.vcomm_cache_del('tax_rules:all');            -- trả false (đã xóa)
-- SELECT * FROM public.vcomm_cache_stats();
--
-- Kiểm tra hết hạn (TTL 1 giây):
-- SELECT public.vcomm_cache_set('tmp', '{"a":1}'::jsonb, 1);
-- SELECT pg_sleep(1.5);
-- SELECT public.vcomm_cache_get('tmp');                      -- phải NULL
-- SELECT count(*) FROM public.cache_entries WHERE key LIKE '%:tmp';  -- phải 0
--
-- =============================================================================
-- ROLLBACK (chỉ chạy khi cần gỡ hoàn toàn)
-- =============================================================================
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.vcomm_cache_stats();
-- DROP FUNCTION IF EXISTS public.vcomm_cache_prune(INT);
-- DROP FUNCTION IF EXISTS public.vcomm_cache_del_prefix(TEXT, TEXT);
-- DROP FUNCTION IF EXISTS public.vcomm_cache_del(TEXT, TEXT);
-- DROP FUNCTION IF EXISTS public.vcomm_cache_set(TEXT, JSONB, INT, TEXT);
-- DROP FUNCTION IF EXISTS public.vcomm_cache_get(TEXT, TEXT);
-- DROP TABLE IF EXISTS public.cache_entries;
-- NOTIFY pgrst, 'reload schema';
-- COMMIT;
