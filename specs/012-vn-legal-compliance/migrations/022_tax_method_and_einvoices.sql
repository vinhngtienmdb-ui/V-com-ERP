-- =============================================================================
-- 022_tax_method_and_einvoices.sql — #21: phương pháp tính thuế ủy nhiệm (TT 91 Điều 9.1.h)
--   + bảng hóa đơn riêng (snapshot bất biến + hàng đợi offline ND 254 Điều 14)
-- =============================================================================
-- Mục tiêu: HĐ ủy nhiệm là HĐ CỦA SELLER → thuế phải tính theo phương pháp của
-- Seller (kê khai/khoán), KHÔNG dùng biểu thuế của VComm. Cần:
--   (1) bảng lịch sử seller_tax_methods (1 Seller chỉ 1 bản ghi "đang hiệu lực")
--   (2) cột tiện lợi tax_method trên sellers + seller_kyc (mirror)
--   (3) bảng einvoices riêng với snapshot bất biến + trường offline queue
-- Chạy SAU: 016_einvoice_delegations.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Lịch sử phương pháp tính thuế của Seller
-- -----------------------------------------------------------------------------
create table if not exists public.seller_tax_methods (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'tenant-vcomm-prod-01',
  seller_id text not null,

  method text not null check (method in ('declaration', 'presumptive')),

  -- Chỉ dùng khi method='presumptive': tỷ lệ % trên doanh thu
  presumptive_vat_ratio numeric(5, 4),   -- VD 0.0100 (bán lẻ GTGT)
  presumptive_pit_ratio numeric(5, 4),   -- VD 0.0050 (bán lẻ TNCN)
  business_sector text,                  -- ngành nghề để suy ra tỷ lệ

  effective_from date not null,
  effective_to date,                     -- null = đang hiệu lực

  source text not null default 'seller_declared'
    check (source in ('seller_declared', 'kyc_verified', 'cqt_notice', 'imported')),
  verified_at timestamptz,
  verified_by uuid,
  note text,

  legal_basis text not null default 'TT 91/2026/TT-BTC Điều 9.1.h',
  created_at timestamptz not null default now()
);

create index if not exists idx_seller_tax_method_live
  on public.seller_tax_methods (seller_id, effective_from desc)
  where effective_to is null;

-- Chặn hai bản ghi "đang hiệu lực" cùng lúc cho một Seller
create unique index if not exists uq_seller_tax_method_open
  on public.seller_tax_methods (seller_id)
  where effective_to is null;

-- -----------------------------------------------------------------------------
-- 2. Cột tiện lợi trên sellers + seller_kyc (mirror từ lịch sử)
-- -----------------------------------------------------------------------------
alter table public.sellers
  add column if not exists tax_method text
  check (tax_method in ('declaration', 'presumptive'));

alter table public.seller_kyc
  add column if not exists tax_method text
  check (tax_method in ('declaration', 'presumptive'));

-- -----------------------------------------------------------------------------
-- 3. Bảng hóa đơn riêng (tách khỏi orders) — snapshot bất biến + offline queue
-- -----------------------------------------------------------------------------
create table if not exists public.einvoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'tenant-vcomm-prod-01',

  order_id text,                          -- null cho đơn bán tại quầy (hub_pos_orders)
  pos_order_id uuid,
  hub_id text,

  channel text not null default 'platform'
    check (channel in ('platform', 'hub_pos')),

  -- Người bán và người lập — tách biệt (ủy nhiệm)
  seller_id text,                         -- null = VComm bán
  issued_by text not null default 'vcomm'
    check (issued_by in ('vcomm', 'delegated')),

  delegation_id uuid references public.einvoice_delegations(id),

  -- Hình thức
  form_no text not null check (form_no in ('1', '2', '6', '7')),
  symbol text not null,                   -- '7K26XYY' | '1K26TYY' | '2K26TYY'
  invoice_no text not null,
  issue_date date not null,

  -- Snapshot bất biến (phục vụ giải trình sau này)
  seller_snapshot jsonb not null,         -- tên, MST, địa chỉ NGƯỜI BÁN
  buyer_snapshot jsonb not null,          -- tên, MST... hoặc "Bán cho người tiêu dùng"
  tax_method_snapshot text not null
    check (tax_method_snapshot in ('declaration', 'presumptive', 'not_applicable')),
  vat_rate_snapshot numeric(5, 4),
  presumptive_vat_ratio_snapshot numeric(5, 4),
  presumptive_pit_ratio_snapshot numeric(5, 4),

  -- Tiền
  subtotal numeric(18, 2) not null,
  vat_amount numeric(18, 2) not null default 0,
  total numeric(18, 2) not null,

  -- Trạng thái — KHÔNG có 'cancelled' (TT 91 Điều 10 không định nghĩa "hủy")
  status text not null default 'draft'
    check (status in ('draft', 'queued', 'issued', 'adjusted', 'replaced')),

  -- ND 254 Điều 14.4 / 14.5 — offline
  offline_queued_at timestamptz,
  offline_reason text check (offline_reason in ('system_incident', 'force_majeure')),
  transmit_due_at timestamptz,            -- +02 (sự cố) hoặc +03 (bất khả kháng) ngày làm việc
  transmitted_at timestamptz,
  books_kept boolean,                     -- Điều 14.5: phải lưu sổ + chứng cứ

  -- Kết quả provider
  lookup_code text,
  signed_at timestamptz,
  xml_blob text,
  provider_key text,
  provider_message text,

  -- Xử lý sai sót (TT 91 Điều 10 — 4 luồng, thay thế/điều chỉnh)
  replaces_id uuid references public.einvoices(id),
  adjustment_kind text check (adjustment_kind in ('replace', 'adjust')),
  reason text,

  legal_basis text not null default 'TT 91/2026/TT-BTC',
  created_at timestamptz not null default now(),

  unique (symbol, invoice_no)
);

create index if not exists idx_einv_queue
  on public.einvoices (transmit_due_at)
  where status = 'queued';

-- FK tùy chọn: orders (nếu bảng orders có cột id)
alter table public.einvoices
  add constraint fk_einvoices_order
  foreign key (order_id) references public.orders(id)
  on delete set null
  not valid;  -- not valid: không lock table lớn khi add
