-- =============================================================================
-- SPEC 019 — TRỤ CỘT 7: V-XU (Điểm thưởng xuyên suốt hệ sinh thái)
-- =============================================================================
-- Căn cứ Đề án E.5 + F.5. Trụ cột 7 — "xuyên suốt toàn hệ sinh thái".
--
-- KHÁC hệ loyalty điểm hiện có (spec 010 / loyalty_points_ledger):
--   - Loyalty hiện có: điểm đơn giản, 1 dòng = 1 thay đổi số dư (single entry)
--   - V-Xu           : SỔ CÁI KẾ TOÁN KÉP (double-entry) — mỗi giao dịch có
--                      vế NỢ (debit) và vế CÓ (credit) cân bằng, đối chiếu
--                      được với sổ kế toán tài chính. Đây là yêu cầu Đề án F.5.
--
-- Hạng & điều kiện & hoàn tiền (Đề án E.5):
--   Đồng       : mặc định                      — hoàn 1,0%
--   Bạc        : > 2 triệu chi tiêu (5 đơn)     — hoàn 2,0%
--   Vàng       : > 8 triệu chi tiêu (20 đơn)     — hoàn 3,5%
--   Kim Cương  : > 20 triệu chi tiêu (50 đơn)    — hoàn 5,0%
--
-- Ba bảng:
--   1. vxu_accounts        — ví V-Xu mỗi khách hàng (số dư = tổng credit − debit)
--   2. vxu_ledger          — sổ cái kế toán kép: mỗi bút toán 2 vế debit/credit
--   3. vxu_redemptions     — phiếu ưu đãi đã đổi (ma trận phiếu theo hạng)
--
-- Chạy SAU: 005_relational_modules.sql (giữ loyalty_points_ledger nguyên vẹn)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. vxu_accounts — Ví V-Xu của khách hàng
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vxu_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  customer_id TEXT NOT NULL,

  -- Số dư V-Xu hiện có = tổng credit − tổng debit của các bút toán 'posted'
  balance NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  -- Tổng V-Xu đã tích luỹ từ trước tới nay (không trừ khi tiêu) — để tính hạng
  lifetime_earned NUMERIC(15,2) NOT NULL DEFAULT 0,
  -- Tổng chi tiêu lũy kế dùng để xét hạng (VND)
  lifetime_spend_vnd NUMERIC(15,2) NOT NULL DEFAULT 0,
  -- Số đơn hoàn tất lũy kế — điều kiện thứ hai để thăng hạng
  lifetime_orders INTEGER NOT NULL DEFAULT 0,

  tier TEXT NOT NULL DEFAULT 'dong'
    CHECK (tier IN ('dong','bac','vang','kim_cuong')),
  tier_changed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT vxu_account_unique UNIQUE (tenant_id, customer_id)
);
ALTER TABLE public.vxu_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vxu_acct_isolation ON public.vxu_accounts;
CREATE POLICY vxu_acct_isolation ON public.vxu_accounts
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_vxu_acct_customer ON public.vxu_accounts(tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_vxu_acct_tier     ON public.vxu_accounts(tenant_id, tier);

-- -----------------------------------------------------------------------------
-- 2. vxu_ledger — SỔ CÁI KẾ TOÁN KÉP (double-entry)
-- -----------------------------------------------------------------------------
-- Mỗi giao dịch V-Xu ghi 2 dòng: một vế NỢ (debit), một vế CÓ (credit),
-- debit_amount luôn bằng credit_amount trong cùng transaction_id.
--
-- Quy ước hướng vế (đối với ví V-Xu của khách):
--   earn    : debit  = nguồn phát hành (vxu_issuer)   | credit = ví khách
--   spend   : debit  = ví khách                       | credit = doanh thu VComm
--   refund  : debit  = doanh thu VComm                | credit = ví khách
--   expire  : debit  = ví khách                       | credit = vxu_expired
--   adjust  : tuỳ ghi chú
CREATE TABLE IF NOT EXISTS public.vxu_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',

  -- Mã giao dịch: các dòng cùng transaction_id thuộc một bút toán kép
  transaction_id TEXT NOT NULL,

  -- Hướng vế
  side TEXT NOT NULL CHECK (side IN ('debit','credit')),

  -- Tài khoản tham gia vế này:
  --   vxu_customer:<customer_id> — ví V-Xu khách hàng
  --   vxu_issuer                — nguồn phát hành V-Xu (VComm)
  --   vxu_revenue               — doanh thu VComm (khi khách tiêu V-Xu)
  --   vxu_expired               — điểm hết hạn
  account TEXT NOT NULL,
  counter_account TEXT NOT NULL,

  customer_id TEXT,          -- có khi account là ví khách
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),

  -- earn | spend | refund | expire | adjust
  type TEXT NOT NULL CHECK (type IN ('earn','spend','refund','expire','adjust')),

  -- Tham chiếu đến đối tượng gốc: đơn hàng, phiên mua chung, hub shipment...
  reference_type TEXT,
  reference_id TEXT,
  note TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT vxu_ledger_amount_positive CHECK (amount > 0)
);
ALTER TABLE public.vxu_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vxu_ledger_isolation ON public.vxu_ledger;
CREATE POLICY vxu_ledger_isolation ON public.vxu_ledger
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_vxu_ledger_txn     ON public.vxu_ledger(tenant_id, transaction_id);
CREATE INDEX IF NOT EXISTS idx_vxu_ledger_acct   ON public.vxu_ledger(tenant_id, account, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vxu_ledger_cust   ON public.vxu_ledger(tenant_id, customer_id, created_at DESC);

-- Kiểm tra cân bằng: mỗi transaction_id phải có debit = credit
CREATE OR REPLACE VIEW public.vxu_ledger_balance_check
WITH (security_invoker = true) AS
SELECT
  transaction_id,
  tenant_id,
  type,
  SUM(CASE WHEN side = 'debit'  THEN amount ELSE 0 END) AS total_debit,
  SUM(CASE WHEN side = 'credit' THEN amount ELSE 0 END) AS total_credit,
  (SUM(CASE WHEN side = 'debit' THEN amount ELSE 0 END)
   - SUM(CASE WHEN side = 'credit' THEN amount ELSE 0 END)) AS unbalanced
FROM public.vxu_ledger
GROUP BY transaction_id, tenant_id, type;

-- -----------------------------------------------------------------------------
-- 3. vxu_redemptions — Phiếu ưu đãi đổi bằng V-Xu (ma trận theo hạng)
-- -----------------------------------------------------------------------------
-- Ma trận phiếu ưu đãi (Đề án E.5): mỗi hạng mở khoá một tập phiếu.
-- Ví dụ: phiếu "giảm 50k" chỉ hiện với Bạc trở lên.
CREATE TABLE IF NOT EXISTS public.vxu_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
  customer_id TEXT NOT NULL,

  -- Mã phiếu ưu đãi (voucher code) sau khi đổi
  voucher_code TEXT NOT NULL,
  -- Mã mẫu phiếu trong ma trận
  template_code TEXT NOT NULL,

  -- Giá V-Xu đã tiêu để đổi
  vxu_cost NUMERIC(15,2) NOT NULL CHECK (vxu_cost > 0),
  -- Giá trị phiếu (VND)
  voucher_value_vnd NUMERIC(15,2) NOT NULL CHECK (voucher_value_vnd > 0),

  -- Hạng tối thiểu để mở khoá mẫu phiếu này
  required_tier TEXT NOT NULL DEFAULT 'dong'
    CHECK (required_tier IN ('dong','bac','vang','kim_cuong')),

  -- Mức chi tiêu tối thiểu của đơn để dùng phiếu
  min_spend_vnd NUMERIC(15,2) NOT NULL DEFAULT 0,

  status TEXT NOT NULL DEFAULT 'issued'
    CHECK (status IN ('issued','used','expired','void')),

  transaction_id TEXT,          -- bút toán spend tương ứng trong vxu_ledger
  order_id TEXT,                -- đơn đã dùng phiếu
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.vxu_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vxu_red_isolation ON public.vxu_redemptions;
CREATE POLICY vxu_red_isolation ON public.vxu_redemptions
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE INDEX IF NOT EXISTS idx_vxu_red_customer ON public.vxu_redemptions(tenant_id, customer_id, status);
CREATE INDEX IF NOT EXISTS idx_vxu_red_voucher  ON public.vxu_redemptions(tenant_id, voucher_code);
CREATE INDEX IF NOT EXISTS idx_vxu_red_status   ON public.vxu_redemptions(tenant_id, status, expires_at);

-- -----------------------------------------------------------------------------
-- 4. Trigger updated_at cho vxu_accounts
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vxu_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vxu_acct_touch ON public.vxu_accounts;
CREATE TRIGGER trg_vxu_acct_touch BEFORE UPDATE ON public.vxu_accounts
  FOR EACH ROW EXECUTE FUNCTION public.vxu_touch_updated_at();

-- -----------------------------------------------------------------------------
-- 5. Backfill: tạo ví V-Xu cho khách hàng đã có điểm loyalty
--    1 điểm loyalty cũ = 1 V-Xu. Chạy idempotent.
-- -----------------------------------------------------------------------------
INSERT INTO public.vxu_accounts (tenant_id, customer_id, balance, lifetime_earned)
SELECT
  'tenant-vcomm-prod-01',
  c.id,
  COALESCE(c.points, 0)::numeric,
  COALESCE(c.points, 0)::numeric
FROM public.customers c
WHERE c.tenant_id = 'tenant-vcomm-prod-01'
  AND COALESCE(c.points, 0) > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.vxu_accounts a
    WHERE a.tenant_id = 'tenant-vcomm-prod-01' AND a.customer_id = c.id
  );
