-- ============================================================================
--  003_feature_flags.sql — GĐ 3.2: Feature flag theo tenant
-- ============================================================================
--  Lỗ hổng (spec 022 GĐ3.2): mọi tính năng đang được bật/tắt bằng **SỬA CODE**.
--  Điển hình `TT99_BRIDGE_ENABLED` (trong `src/services/accountingService.ts`)
--  là một hằng số: muốn bật cho 1 tenant thì phải deploy lại toàn bộ app, và
--  KHÔNG THỂ bật thử cho một nhóm nhỏ rồi tắt ngay khi có sự cố.
--
--  Hậu quả thực tế: các tính năng phụ thuộc CHỨNG TỪ PHÁP LÝ (hóa đơn điện tử,
--  khấu trừ thuế sàn NĐ 252/2026) không thể bật từng phần — trong khi đây đúng
--  là nhóm cần rollout thận trọng nhất.
--
--  Giải pháp: bảng `feature_flags` theo tenant + RPC đánh giá có:
--    · **allow_list / deny_list** — bật riêng cho 1 tenant/user để thử nghiệm
--    · **rollout_percent**   — bật dần theo % (canary)
--    · **chia bucket XÁC ĐỊNH** theo md5(flag:subject) → cùng 1 user luôn nhận
--      CÙNG một quyết định, không bị chập chờn giữa các lần tải trang.
--
--  ⭐ GỘP VỚI CƠ CHẾ ĐÃ CÓ — ĐỪNG TẠO HAI HỆ THỐNG FLAG SONG SONG.
--    `src/config/featureFlags.ts` (đã nối vào `accountingService`) xử lý flag
--    bằng ENV + override + mặc định, nhưng muốn đổi phải deploy.
--    Bảng này là lớp **ĐÈ LÊN**: đổi không cần deploy, theo từng tenant.
--    Phân công:
--      DB có hàng  → DB quyết định (bật / tắt)
--      DB không có → NULL → `src/config/featureFlags.ts` quyết định
--      Cả hai không biết → TẮT (fail-closed)
--    Vì vậy RPC trả **boolean CÓ THỂ NULL** (3 trạng thái), KHÔNG trả false cho
--    flag chưa khai báo: nếu trả false, chỉ cần chạy migration này là mọi flag
--    chưa seed sẽ bị TẮT SẠCH — đúng là thảm họa rollout.
--
--  Áp dụng: Supabase SQL Editor hoặc `supabase db push`.
--  Rollback: xem cuối file.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Bảng
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        TEXT        NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  flag_key         TEXT        NOT NULL,

  enabled          BOOLEAN     NOT NULL DEFAULT false,
  /** 0–100. Chỉ có ý nghĩa khi `enabled = true`. 100 = bật cho tất cả. */
  rollout_percent  INT         NOT NULL DEFAULT 100,

  /** Bật CỨNG cho các subject này, bất kể rollout_percent. */
  allow_list       TEXT[]      NOT NULL DEFAULT '{}',
  /** TẮT CỨNG cho các subject này — deny LUÔN THẮNG allow. */
  deny_list        TEXT[]      NOT NULL DEFAULT '{}',

  description      TEXT,
  updated_by       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT feature_flags_unique   UNIQUE (tenant_id, flag_key),
  CONSTRAINT feature_flags_rollout_chk CHECK (rollout_percent BETWEEN 0 AND 100)
);

COMMENT ON TABLE public.feature_flags IS
  'GĐ 3.2: bật/tắt tính năng theo tenant, có canary (%) và danh sách ngoại lệ.';

CREATE INDEX IF NOT EXISTS idx_feature_flags_tenant
  ON public.feature_flags (tenant_id, flag_key);

-- ---------------------------------------------------------------------------
-- 2. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feature_flags_tenant_isolation ON public.feature_flags;
CREATE POLICY feature_flags_tenant_isolation ON public.feature_flags
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01'
  );

-- ---------------------------------------------------------------------------
-- 3. RPC: đánh giá 1 flag
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vcomm_feature_flag(
  p_flag_key  text,
  p_tenant_id text DEFAULT 'tenant-vcomm-prod-01',
  p_subject   text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_row     public.feature_flags;
  v_tenant  text;
  v_subject text;
  v_digest  bytea;
  v_bucket  int;
BEGIN
  v_tenant := COALESCE(NULLIF(p_tenant_id, ''), 'tenant-vcomm-prod-01');

  SELECT * INTO v_row
    FROM public.feature_flags
   WHERE tenant_id = v_tenant AND flag_key = p_flag_key;

  -- ⭐ Chưa khai báo → NULL (= "tôi không biết"), để lớp config phía trên quyết.
  --   KHÔNG trả false: false ở đây nghĩa là "cố tình tắt", sẽ ghi đè mặc định.
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Không truyền subject thì dùng chính tenant làm subject (flag cấp tenant).
  v_subject := COALESCE(NULLIF(p_subject, ''), v_tenant);

  -- deny LUÔN THẮNG: phải xét TRƯỚC allow, nếu không sẽ có subject nằm ở cả
  -- hai danh sách và kết quả phụ thuộc vào thứ tự viết code.
  IF v_row.deny_list  @> ARRAY[v_subject] THEN RETURN false; END IF;
  IF v_row.allow_list @> ARRAY[v_subject] THEN RETURN true;  END IF;

  IF NOT v_row.enabled THEN RETURN false; END IF;
  IF v_row.rollout_percent >= 100 THEN RETURN true;  END IF;
  IF v_row.rollout_percent <= 0   THEN RETURN false; END IF;

  -- ⭐ Chia bucket XÁC ĐỊNH: md5(flag:subject) → cùng subject luôn cùng bucket.
  --   Dùng 3 byte đầu (0..16.777.215) → phân bố đều trên 100.
  --   Không dùng random(): random sẽ khiến mỗi lần tải trang ra một kết quả
  --   khác → UI "chập chờn", không debug được.
  v_digest := decode(md5(p_flag_key || ':' || v_subject), 'hex');
  v_bucket := ((get_byte(v_digest, 0) * 256 + get_byte(v_digest, 1)) * 256
                + get_byte(v_digest, 2)) % 100;

  RETURN v_bucket < v_row.rollout_percent;
END;
$$;

COMMENT ON FUNCTION public.vcomm_feature_flag(text, text, text) IS
  'GĐ 3.2: flag có bật cho (tenant, subject) này không? Trả NULL nếu flag CHƯA KHAI BÁO (để lớp config quyết định). deny thắng allow.';

-- Liệt kê để trang quản trị hiển thị / debug ("sao flag này không bật?").
CREATE OR REPLACE FUNCTION public.vcomm_list_feature_flags(p_tenant_id text DEFAULT 'tenant-vcomm-prod-01')
RETURNS TABLE (
  flag_key        text,
  enabled         boolean,
  rollout_percent int,
  description     text,
  updated_at      timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT f.flag_key, f.enabled, f.rollout_percent, f.description, f.updated_at
    FROM public.feature_flags f
   WHERE f.tenant_id = COALESCE(NULLIF(p_tenant_id, ''), 'tenant-vcomm-prod-01')
   ORDER BY f.flag_key;
$$;

-- ---------------------------------------------------------------------------
-- 4. Seed
-- ---------------------------------------------------------------------------
-- ⚠️ CHỈ seed những flag cần KHÓA CỨNG bằng DB. Flag KHÔNG có hàng ở đây sẽ
--    rơi về `src/config/featureFlags.ts` — tức là giữ nguyên hành vi hiện tại.
--    Đừng seed bừa: mỗi hàng thêm vào là một chỗ có thể tắt nhầm tính năng.
--
--    `tt99_bridge`: KHÔNG seed. Đang chạy mặc định `true` ở config; muốn tắt
--    từng tenant thì mới thêm hàng `enabled = false`.
INSERT INTO public.feature_flags (tenant_id, flag_key, enabled, rollout_percent, description)
VALUES
  ('tenant-vcomm-prod-01', 'einvoice', false, 100,
   'Phát hành hóa đơn điện tử thật. CẦN: hợp đồng MISA/VNPT + đăng ký mẫu BC22 với CQT.'),
  ('tenant-vcomm-prod-01', 'platform_tax_withholding', false, 100,
   'Khấu trừ TNCN hộ người bán theo NĐ 252/2026 Điều 43.1 + 44. CẦN: KYC seller_tax_methods.partner_type (cá nhân/tổ chức) để chọn đúng tỷ lệ.')
ON CONFLICT (tenant_id, flag_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Phân quyền
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feature_flags          TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vcomm_feature_flag(text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vcomm_list_feature_flags(text)       TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6. Kiểm tra sau khi chạy (chạy tay để xác nhận)
-- ---------------------------------------------------------------------------
-- SELECT public.vcomm_feature_flag('einvoice');                                  -- false (seed = tắt)
-- SELECT public.vcomm_feature_flag('tt99_bridge');                                -- NULL ⭐ chưa seed → lớp config quyết
-- SELECT public.vcomm_feature_flag('flag_chua_khai_bao');                         -- NULL ⭐ (KHÔNG phải false!)
--
-- -- Thử nghiệm có chủ đích: bật 20% rồi kiểm tra tính ỔN ĐỊNH của bucket
-- INSERT INTO public.feature_flags (flag_key, enabled, rollout_percent)
--   VALUES ('canary_test', true, 20) ON CONFLICT DO NOTHING;
-- SELECT public.vcomm_feature_flag('canary_test', 'tenant-vcomm-prod-01', 'user-a'); -- kết quả X
-- SELECT public.vcomm_feature_flag('canary_test', 'tenant-vcomm-prod-01', 'user-a'); -- PHẢI LÀ X (không đổi)
--
-- -- deny thắng allow
-- UPDATE public.feature_flags SET allow_list = '{user-vip}', deny_list = '{user-vip}'
--  WHERE flag_key = 'canary_test';
-- SELECT public.vcomm_feature_flag('canary_test', 'tenant-vcomm-prod-01', 'user-vip'); -- false
--
-- SELECT * FROM public.vcomm_list_feature_flags();

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- DROP FUNCTION IF EXISTS public.vcomm_list_feature_flags(text);
-- DROP FUNCTION IF EXISTS public.vcomm_feature_flag(text, text, text);
-- DROP INDEX  IF EXISTS public.idx_feature_flags_tenant;
-- DROP TABLE  IF EXISTS public.feature_flags;
