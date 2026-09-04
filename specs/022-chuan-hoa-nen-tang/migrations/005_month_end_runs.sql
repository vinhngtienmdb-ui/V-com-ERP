-- =============================================================================
-- 005 — DẤU VẾT CHẠY CUỐI THÁNG (month_end_runs)
-- =============================================================================
-- VẤN ĐỀ
-- -----------------------------------------------------------------------------
-- `src/services/monthEndScheduler.ts` chạy trích khấu hao TSCĐ cuối tháng.
-- Scheduler chạy ở TRÌNH DUYỆT (xem lý do ở đầu file TS: `server.ts` được bundle
-- sang CJS nên `import.meta.env` = undefined → DEMO_MODE = true, mọi cron trên
-- server sẽ âm thầm chạy ở chế độ demo).
--
-- Hệ quả của việc chạy ở browser: không có cron đáng tin cậy — scheduler chỉ chạy
-- khi có người mở app. Nếu mỗi lần mở app đều tính lại và ghi lại, thì:
--   · tốn N lần đọc + ghi mỗi ngày;
--   · mất dấu vết "kỳ này đã chạy lúc nào, ai chạy, kết quả ra sao".
-- Bảng này là nơi lưu dấu vết đó.
--
-- ⚠️ NÓI THẬT VỀ MỨC ĐỘ CẦN THIẾT: bảng này KHÔNG phải lớp bảo vệ chống ghi
--    trùng. Việc chống trùng nằm ở ID chứng từ CỐ ĐỊNH (`KH-TONG-<period>`), và
--    `SupabaseAdapter.saveJournalEntry()` làm upsert + DELETE/INSERT items → gọi
--    lặp THAY THẾ chứng từ cũ, không sinh bút toán thứ hai. Vì vậy nếu bảng này
--    chưa được tạo, scheduler VẪN CHẠY đúng (chỉ cảnh báo). Đừng hiểu nhầm thành
--    "chưa chạy migration 005 thì khấu hao bị khoá".
--
-- THIẾT KẾ
-- -----------------------------------------------------------------------------
-- · PK là `id` dạng `<tenant_id>-<period>` → idempotent, `setDoc` gọi lặp an toàn.
-- · `SECURITY INVOKER` (không dùng DEFINER) như migration 002/003/004 để RLS
--   vẫn áp dụng.
-- · Lưu cả `warnings` (JSONB) để truy vết những tài sản bị bỏ qua — TT99 Điều 28
--   đòi hỏi lưu vết không thể tắt, và "vì sao tháng này không trích được" là thứ
--   bị hỏi đầu tiên khi quyết toán thuế.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.month_end_runs (
  id            TEXT PRIMARY KEY,              -- '<tenant_id>-<yyyy-mm>'
  period        TEXT        NOT NULL,          -- 'yyyy-mm'
  tenant_id     TEXT        NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  ran_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  entry_count   INT         NOT NULL DEFAULT 0,
  total_amount  NUMERIC(18, 2) NOT NULL DEFAULT 0,
  skipped_count INT         NOT NULL DEFAULT 0,
  warnings      JSONB       NOT NULL DEFAULT '[]'::jsonb
);

-- Tra nhanh theo tenant + kỳ (màn hình "Lịch sử chạy cuối tháng").
CREATE INDEX IF NOT EXISTS idx_month_end_runs_tenant_period
  ON public.month_end_runs (tenant_id, period DESC);

ALTER TABLE public.month_end_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS month_end_runs_tenant ON public.month_end_runs;
CREATE POLICY month_end_runs_tenant ON public.month_end_runs
  FOR ALL USING (
    tenant_id = COALESCE(auth.jwt() ->> 'tenant_id', 'tenant-vcomm-prod-01')
    OR tenant_id = 'tenant-vcomm-prod-01'
  );

-- -----------------------------------------------------------------------------
-- vcomm_month_end_runs — lịch sử chạy cuối tháng (phục vụ màn hình kiểm soát).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vcomm_month_end_runs(
  p_tenant_id TEXT DEFAULT NULL,
  p_limit     INT  DEFAULT 24
) RETURNS TABLE (
  period        TEXT,
  ran_at        TIMESTAMPTZ,
  entry_count   INT,
  total_amount  NUMERIC(18, 2),
  skipped_count INT,
  warnings      JSONB
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT r.period, r.ran_at, r.entry_count, r.total_amount, r.skipped_count, r.warnings
  FROM public.month_end_runs r
  WHERE r.tenant_id = COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id', 'tenant-vcomm-prod-01')
  ORDER BY r.period DESC
  LIMIT p_limit;
$$;

-- -----------------------------------------------------------------------------
-- vcomm_month_end_reset — XOÁ dấu vết một kỳ để admin chạy lại.
--
-- ⚠️ Chỉ xoá DẤU VẾT, KHÔNG đụng vào chứng từ kế toán. Chứng từ cũ vẫn nằm trong
--    `journal_entries`; lần chạy tiếp theo sẽ ghi ĐÈ lên cùng ID. Nếu kỳ đã khoá
--    sổ, `saveJournalEntry` sẽ từ chối (chặn ở tầng adapter qua
--    `tenant_settings.closingLockDate`) — đúng theo TT99 Điều 13.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vcomm_month_end_reset(
  p_period    TEXT,
  p_tenant_id TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_tenant TEXT := COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id', 'tenant-vcomm-prod-01');
  v_id     TEXT := v_tenant || '-' || p_period;
BEGIN
  DELETE FROM public.month_end_runs WHERE id = v_id;
  RETURN true;
END;
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.month_end_runs TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vcomm_month_end_runs(TEXT, INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vcomm_month_end_reset(TEXT, TEXT) TO authenticated, service_role;

COMMIT;

-- =============================================================================
-- KIỂM TRA SAU KHI CHẠY
-- =============================================================================
-- SELECT * FROM public.vcomm_month_end_runs();
-- SELECT public.vcomm_month_end_reset('2026-09');   -- để chạy lại kỳ 09/2026

-- =============================================================================
-- ROLLBACK (chạy tay nếu cần)
-- =============================================================================
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.vcomm_month_end_reset(TEXT, TEXT);
-- DROP FUNCTION IF EXISTS public.vcomm_month_end_runs(TEXT, INT);
-- DROP TABLE IF EXISTS public.month_end_runs;
-- COMMIT;
