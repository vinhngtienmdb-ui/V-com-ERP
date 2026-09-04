-- ============================================================================
--  002_outbox_domain_events.sql — GĐ 2.1: Outbox pattern (hàng đợi sự kiện)
-- ============================================================================
--  Lỗ hổng kiến trúc (spec 022 GĐ2.1): các nghiệp vụ GỌI CHÉO TRỰC TIẾP nhau.
--  Đặc biệt 5 chỗ gọi kế toán ngay trong luồng UI:
--      Orders.tsx:1263            postOrderJournalEntries
--      Settlement.tsx:107,135,351 postWithdrawalJournalEntries
--      VCommSupermarket.tsx:269   postOrderJournalEntries
--  Hậu quả:
--    · Ghi sổ lỗi (sai Nợ/Có, khóa sổ, mất mạng) → **kẹt luôn** hoàn tất đơn
--      / duyệt chi, dù nghiệp vụ chính đã xong. Kế toán là việc PHỤ, không được
--      quyền chặn việc CHÍNH.
--    · Không có retry: lỗi nhất thời (mạng, timeout) = mất bút toán vĩnh viễn.
--    · Không có audit: không biết sự kiện nào đã xử lý, sự kiện nào đang kẹt.
--
--  Giải pháp — OUTBOX:
--    Nghiệp vụ chỉ INSERT 1 dòng vào `domain_events` (rẻ, gần như không thể
--    lỗi). Worker chạy nền lấy việc, xử lý, đánh dấu xong/thất bại + retry
--    theo luỹ thừa. Nghiệp vụ chính KHÔNG BAO GIỜ bị kẹt bởi việc phụ.
--
--  ⭐ CÁC QUYẾT ĐỊNH KỸ THUẬT (đều là chỗ hay làm sai):
--
--  1. **`id` là TEXT, không phải UUID** — để có thể đặt ID XÁC ĐỊNH (idempotency
--     miễn phí theo quy ước VComm: đặt id cố định → gọi lặp không sinh bản ghi
--     thứ hai). Các bảng khác dùng UUID nhưng ở đây cần chủ động đặt id.
--
--  2. **Claim bằng `FOR UPDATE SKIP LOCKED`** — thay vì SELECT rồi UPDATE. Đây
--     là cách DUY NHẤT an toàn khi chạy NHIỀU INSTANCE: hai worker cùng poll sẽ
--     không bao giờ lấy trùng 1 sự kiện (SKIP LOCKED bỏ qua dòng đang bị khoá).
--     SELECT-then-UPDATE sẽ sinh race condition: cả 2 worker cùng xử lý 1 sự kiện
--     → ghi sổ 2 lần → **SAI SỔ CÁI**.
--
--  3. **Idempotency bằng `dedupe_key`** + UNIQUE INDEX RIÊNG PHẦN
--     (`WHERE dedupe_key IS NOT NULL`): cùng 1 đơn hoàn thành 2 lần (double-click,
--     webhook gửi lặp) chỉ sinh 1 sự kiện. Phải là index RIÊNG PHẦN, nếu không
--     nhiều dòng `dedupe_key = NULL` sẽ ĐỤC LỖ NHAU (NULL không so sánh được bằng
--     `=`, nhưng UNIQUE thường lại coi nhiều NULL là hợp lệ → không phải lỗi; tuy
--     nhiên index riêng phần vừa đúng ý vừa nhỏ hơn).
--
--  4. **Hàm publish chạy `SECURITY INVOKER` (mặc định)** — RLS vẫn áp dụng.
--     Cố tình KHÔNG dùng SECURITY DEFINER: nếu dùng, bất kỳ ai có anon key đều
--     có thể claim/ghi sự kiện của mọi tenant.
--
--  🔴 HẠN CHẾ CẦN BIẾT (đọc trước khi vận hành):
--    Vì SECURITY INVOKER + RLS theo `auth.jwt() ->> 'tenant_id'`, worker chạy bằng
--    **ANON KEY** chỉ nhìn thấy tenant mặc định `tenant-vcomm-prod-01`.
--    Muốn worker xử lý ĐA TENANT thật sự, server phải chạy bằng
--    **SERVICE_ROLE_KEY** (bypass RLS) — đặt biến môi trường
--    `SUPABASE_SERVICE_ROLE_KEY`. Xem `src/services/domainEventService.ts`.
--
--  Áp dụng: Supabase SQL Editor hoặc `supabase db push`.
--  Rollback: xem cuối file.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Bảng hàng đợi
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.domain_events (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id       TEXT        NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  event_type      TEXT        NOT NULL,
  aggregate_type  TEXT        NOT NULL DEFAULT 'generic',
  aggregate_id    TEXT        NOT NULL DEFAULT '',
  -- Khoá chống trùng. NULL = cho phép trùng (mỗi lần là 1 sự kiện).
  dedupe_key      TEXT,
  payload         JSONB       NOT NULL DEFAULT '{}'::jsonb,

  -- pending | processing | done | failed (sẽ thử lại) | dead (hết lượt, chờ người)
  status          TEXT        NOT NULL DEFAULT 'pending',
  attempts        INT         NOT NULL DEFAULT 0,
  max_attempts    INT         NOT NULL DEFAULT 5,

  -- Chỉ được claim khi available_at <= now() → dùng cho backoff luỹ thừa.
  available_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at       TIMESTAMPTZ,
  locked_by       TEXT,
  last_error      TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at    TIMESTAMPTZ,

  CONSTRAINT domain_events_status_chk
    CHECK (status IN ('pending', 'processing', 'done', 'failed', 'dead')),
  CONSTRAINT domain_events_attempts_chk
    CHECK (attempts >= 0 AND max_attempts >= 1)
);

COMMENT ON TABLE public.domain_events IS
  'GĐ 2.1 Outbox: hàng đợi sự kiện nghiệp vụ. Ghi cùng nghiệp vụ, worker xử lý nền.';

-- ⭐ Idempotency: 1 (tenant, dedupe_key) chỉ tồn tại 1 dòng.
CREATE UNIQUE INDEX IF NOT EXISTS uq_domain_events_dedupe
  ON public.domain_events (tenant_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

-- Index phục vụ poll: chỉ quét các dòng ĐANG CHỜ (bảng sẽ rất nhiều dòng 'done').
CREATE INDEX IF NOT EXISTS idx_domain_events_queue
  ON public.domain_events (status, available_at)
  WHERE status IN ('pending', 'failed');

-- Truy vết theo đối tượng: "sự kiện của đơn ORD-123" / "của lệnh chi W-9".
CREATE INDEX IF NOT EXISTS idx_domain_events_aggregate
  ON public.domain_events (tenant_id, aggregate_type, aggregate_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 2. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.domain_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS domain_events_tenant_isolation ON public.domain_events;
CREATE POLICY domain_events_tenant_isolation ON public.domain_events
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01'
  );

-- ---------------------------------------------------------------------------
-- 3. RPC: PUBLISH (idempotent, có delay)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vcomm_publish_domain_event(
  p_tenant_id      text,
  p_event_type     text,
  p_aggregate_type text DEFAULT 'generic',
  p_aggregate_id   text DEFAULT '',
  p_dedupe_key     text DEFAULT NULL,
  p_payload        jsonb DEFAULT '{}'::jsonb,
  p_max_attempts   int  DEFAULT 5,
  p_delay_seconds  int  DEFAULT 0,
  p_id             text DEFAULT NULL
)
RETURNS TABLE (event_id text, inserted boolean)
LANGUAGE plpgsql
-- SECURITY INVOKER (mặc định): RLS vẫn chặn sai tenant.
AS $$
DECLARE
  v_id       text;
  v_tenant   text;
  v_inserted boolean;
BEGIN
  v_tenant := COALESCE(NULLIF(p_tenant_id, ''), 'tenant-vcomm-prod-01');
  v_id      := COALESCE(p_id, gen_random_uuid()::text);

  INSERT INTO public.domain_events
    (id, tenant_id, event_type, aggregate_type, aggregate_id, dedupe_key,
     payload, status, max_attempts, available_at)
  VALUES
    (v_id, v_tenant, p_event_type, COALESCE(p_aggregate_type, 'generic'),
     COALESCE(p_aggregate_id, ''), p_dedupe_key, COALESCE(p_payload, '{}'::jsonb),
     'pending', GREATEST(1, COALESCE(p_max_attempts, 5)),
     now() + (GREATEST(0, COALESCE(p_delay_seconds, 0)) || ' seconds')::interval)
  -- Dựa vào UNIQUE INDEX RIÊNG PHẦN → phải lặp lại đúng vị từ `WHERE`.
  ON CONFLICT (tenant_id, dedupe_key) WHERE dedupe_key IS NOT NULL
  DO NOTHING
  RETURNING id INTO v_id;

  v_inserted := FOUND;

  IF NOT v_inserted AND p_dedupe_key IS NOT NULL THEN
    -- Đã có từ trước (double-click / webhook gửi lặp) → trả ID THẬT của dòng cũ
    -- để caller biết đường mà trace, KHÔNG ghi đè (ghi đè sẽ hồi sinh sự kiện
    -- đã xong → chạy lại handler → ghi sổ 2 lần).
    SELECT e.id INTO v_id
      FROM public.domain_events e
     WHERE e.tenant_id = v_tenant AND e.dedupe_key = p_dedupe_key;
  END IF;

  RETURN QUERY SELECT v_id, v_inserted;
END;
$$;

COMMENT ON FUNCTION public.vcomm_publish_domain_event(text, text, text, text, text, jsonb, int, int, text) IS
  'GĐ 2.1: ghi sự kiện vào outbox. Có dedupe_key → chỉ ghi 1 lần (trả inserted=false nếu đã tồn tại).';

-- ---------------------------------------------------------------------------
-- 4. RPC: CLAIM (nguyên tử, an toàn đa instance)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vcomm_claim_domain_events(
  p_worker text,
  p_limit  int DEFAULT 20
)
RETURNS SETOF public.domain_events
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH claimed AS (
    SELECT e.id
      FROM public.domain_events e
     WHERE e.status IN ('pending', 'failed')
       AND e.available_at <= now()
       AND e.attempts < e.max_attempts
     ORDER BY e.available_at, e.created_at
     LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 20), 200))
     FOR UPDATE SKIP LOCKED      -- ⭐ chìa khoá: 2 worker không bao giờ lấy trùng
  )
  UPDATE public.domain_events e
     SET status     = 'processing',
         locked_at  = now(),
         locked_by  = p_worker,
         updated_at = now()
    FROM claimed c
   WHERE e.id = c.id
  RETURNING e.*;
END;
$$;

COMMENT ON FUNCTION public.vcomm_claim_domain_events(text, int) IS
  'GĐ 2.1: worker lấy lô sự kiện. FOR UPDATE SKIP LOCKED → an toàn khi nhiều instance. SECURITY INVOKER nên chỉ thấy tenant của caller (worker cần service_role key để đa tenant).';

-- ---------------------------------------------------------------------------
-- 5. RPC: ACK / FAIL / REQUEUE / STATS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vcomm_ack_domain_event(p_id text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.domain_events
     SET status       = 'done',
         processed_at = now(),
         locked_at    = NULL,
         locked_by    = NULL,
         last_error   = NULL,
         updated_at   = now()
   WHERE id = p_id AND status = 'processing';
END;
$$;

CREATE OR REPLACE FUNCTION public.vcomm_fail_domain_event(
  p_id           text,
  p_last_error   text        DEFAULT NULL,
  p_retry_at     timestamptz DEFAULT NULL,
  p_is_dead      boolean     DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.domain_events
     SET status     = CASE WHEN p_is_dead THEN 'dead' ELSE 'failed' END,
         attempts   = attempts + 1,
         last_error = left(COALESCE(p_last_error, ''), 2000),  -- tránh phình bảng do stack trace
         available_at = COALESCE(p_retry_at, now()),
         locked_at  = NULL,
         locked_by  = NULL,
         updated_at = now()
   WHERE id = p_id AND status = 'processing';
END;
$$;

COMMENT ON FUNCTION public.vcomm_fail_domain_event(text, text, timestamptz, boolean) IS
  'GĐ 2.1: đánh dấu thất bại. p_is_dead=true khi đã hết lượt thử (chuyển sang dead chờ người xử lý).';

-- Worker process chết đột ngột (deploy, OOM, mất điện) giữa chừng → các dòng
-- kẹt ở 'processing' mãi mãi. Hàm này thu hồi chúng về hàng đợi.
CREATE OR REPLACE FUNCTION public.vcomm_requeue_stuck_domain_events(
  p_stuck_minutes int DEFAULT 15
)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  v_count int;
BEGIN
  WITH stuck AS (
    SELECT e.id, e.attempts, e.max_attempts
      FROM public.domain_events e
     WHERE e.status = 'processing'
       AND e.locked_at IS NOT NULL
       AND e.locked_at < now() - (GREATEST(1, COALESCE(p_stuck_minutes, 15)) || ' minutes')::interval
     ORDER BY e.locked_at
     FOR UPDATE SKIP LOCKED
  )
  UPDATE public.domain_events e
     SET status     = CASE WHEN s.attempts + 1 >= s.max_attempts THEN 'dead' ELSE 'failed' END,
         attempts   = s.attempts + 1,
         last_error = left(
           COALESCE(e.last_error, '') || ' [worker kẹt — thu hồi ' || to_char(now(), 'YYYY-MM-DD HH24:MI') || ']',
           2000),
         locked_at  = NULL,
         locked_by  = NULL,
         available_at = now(),
         updated_at = now()
    FROM stuck s
   WHERE e.id = s.id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Dọn dẹp: giữ lại lịch sử vừa đủ để điều tra, tránh bảng phình vô hạn.
CREATE OR REPLACE FUNCTION public.vcomm_purge_domain_events(
  p_older_than_days int DEFAULT 30
)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  v_count int;
BEGIN
  DELETE FROM public.domain_events
   WHERE status IN ('done', 'dead')
     AND COALESCE(processed_at, updated_at)
         < now() - (GREATEST(1, COALESCE(p_older_than_days, 30)) || ' days')::interval;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Phục vụ /metrics + trang health của outbox (GĐ 3.4).
CREATE OR REPLACE FUNCTION public.vcomm_outbox_stats()
RETURNS TABLE (
  status           text,
  cnt              bigint,
  oldest_age_min   numeric
)
LANGUAGE sql
STABLE
AS $$
  SELECT e.status,
         count(*)                                                        AS cnt,
         round(
           COALESCE(max(EXTRACT(EPOCH FROM (now() - e.created_at))), 0) / 60.0,
           1
         )                                                               AS oldest_age_min
    FROM public.domain_events e
   GROUP BY e.status;
$$;

-- ---------------------------------------------------------------------------
-- 6. Phân quyền
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.domain_events TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.vcomm_publish_domain_event(text, text, text, text, text, jsonb, int, int, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vcomm_claim_domain_events(text, int)                                          TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vcomm_ack_domain_event(text)                                                   TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vcomm_fail_domain_event(text, text, timestamptz, boolean)                     TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vcomm_requeue_stuck_domain_events(int)                                        TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vcomm_purge_domain_events(int)                                                TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vcomm_outbox_stats()                                                          TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 7. Kiểm tra sau khi chạy (chạy tay để xác nhận)
-- ---------------------------------------------------------------------------
-- -- Publish lần 1: inserted = true
-- SELECT * FROM public.vcomm_publish_domain_event(
--   'tenant-vcomm-prod-01', 'order.completed', 'order', 'ORD-123',
--   'order.completed:ORD-123', '{"id":"ORD-123"}'::jsonb);
--
-- -- Publish LẶP LẠI y hệt: inserted = false, event_id KHÔNG ĐỔI ⭐
-- SELECT * FROM public.vcomm_publish_domain_event(
--   'tenant-vcomm-prod-01', 'order.completed', 'order', 'ORD-123',
--   'order.completed:ORD-123', '{"id":"ORD-123"}'::jsonb);
--
-- -- Worker claim (2 terminal cùng chạy → KHÔNG bao giờ trùng dòng)
-- SELECT id, event_type, status, locked_by FROM public.vcomm_claim_domain_events('worker-a', 10);
--
-- SELECT * FROM public.vcomm_ack_domain_event('<id>');
-- SELECT * FROM public.vcomm_fail_domain_event('<id>', 'Supabase timeout', now() + interval '30 seconds');
-- SELECT public.vcomm_requeue_stuck_domain_events(15);
-- SELECT * FROM public.vcomm_outbox_stats();
--
-- -- Verify index được dùng (phải thấy idx_domain_events_queue, không phải Seq Scan)
-- EXPLAIN ANALYZE SELECT id FROM public.domain_events
--  WHERE status IN ('pending','failed') AND available_at <= now()
--  ORDER BY available_at, created_at LIMIT 20;

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- DROP FUNCTION IF EXISTS public.vcomm_outbox_stats();
-- DROP FUNCTION IF EXISTS public.vcomm_purge_domain_events(int);
-- DROP FUNCTION IF EXISTS public.vcomm_requeue_stuck_domain_events(int);
-- DROP FUNCTION IF EXISTS public.vcomm_fail_domain_event(text, text, timestamptz, boolean);
-- DROP FUNCTION IF EXISTS public.vcomm_ack_domain_event(text);
-- DROP FUNCTION IF EXISTS public.vcomm_claim_domain_events(text, int);
-- DROP FUNCTION IF EXISTS public.vcomm_publish_domain_event(text, text, text, text, text, jsonb, int, int, text);
-- DROP INDEX IF EXISTS public.idx_domain_events_aggregate;
-- DROP INDEX IF EXISTS public.idx_domain_events_queue;
-- DROP INDEX IF EXISTS public.uq_domain_events_dedupe;
-- DROP TABLE   IF EXISTS public.domain_events;
