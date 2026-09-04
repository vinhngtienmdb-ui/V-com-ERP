-- =============================================================================
-- 023_hub_retail.sql — #19: Hub "bán hàng" = CẢ HAI (bán tại trạm + nhận đơn hộ)
--   + chứng từ mẫu số 6 (PXK nội bộ / gửi bán đại lý — ND 254 / TT 91 Phụ lục I)
--   + POS tại trạm + hàng đợi HĐĐT offline (ND 254 Điều 14)
-- =============================================================================
-- Quyết định #19 (spec 030): Hub vừa bán hàng có sẵn tại trạm (cần kho + POS),
-- vừa nhận đơn hộ gửi về kho. Thiết kế offline-first: mọi luồng có thể offline
-- BẮT BUỘC dùng HĐ KHÔNG MÃ (ký tự đầu 'K') — ND 254 Điều 14.1/14.4/14.5.
-- Chạy SAU: 022_tax_method_and_einvoices.sql
-- =============================================================================

-- 1) Tồn kho tại trạm — phân biệt hàng VComm và hàng ký gửi
create table if not exists public.hub_inventory (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'tenant-vcomm-prod-01',
  hub_id text not null,
  product_id text not null,
  variant_id text,
  ownership text not null check (ownership in ('vcomm', 'consignment')),
  seller_id text,                        -- bắt buộc khi ownership='consignment'
  qty_on_hand integer not null default 0,
  qty_reserved integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint consignment_needs_seller
    check (ownership <> 'consignment' or seller_id is not null),
  unique (hub_id, product_id, variant_id, ownership, seller_id)
);

-- 2) Biến động tồn kho tại trạm
create table if not exists public.hub_stock_moves (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'tenant-vcomm-prod-01',
  hub_id text not null,
  product_id text not null,
  variant_id text,
  kind text not null check (kind in
    ('receive', 'sale', 'transfer_in', 'transfer_out', 'adjust', 'return')),
  qty_delta integer not null,
  ref_pos_order_id uuid,
  ref_edoc_id uuid,                      -- trỏ sang chứng từ mẫu 6 (N/B)
  created_by uuid,
  created_at timestamptz not null default now()
);

-- 3) Chứng từ điện tử mẫu số 6 (ND 254 / TT 91 Phụ lục I)
create table if not exists public.hub_transfer_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'tenant-vcomm-prod-01',
  edoc_form text not null check (edoc_form in ('6N', '6B')),  -- 6N=nội bộ, 6B=đại lý
  symbol text not null,                  -- '6K26NAB' | '6K26BAB'
  doc_no text not null,
  from_location text not null,
  to_hub_id text not null,
  seller_id text,                        -- null khi 6N (hàng VComm)
  issued_at timestamptz not null default now(),
  status text not null default 'draft'
    check (status in ('draft', 'queued', 'issued', 'adjusted', 'replaced')),
  offline_queued_at timestamptz,
  transmit_due_at timestamptz,           -- ND 254 Điều 14.4 (+02) / 14.5 (+03) ngày làm việc
  transmitted_at timestamptz,
  legal_basis text not null default 'TT 91/2026/TT-BTC Phụ lục I',
  unique (symbol, doc_no)
);

-- 4) Ca làm việc / thu ngân
create table if not exists public.hub_shifts (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'tenant-vcomm-prod-01',
  hub_id text not null,
  opened_by uuid not null,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  opening_cash numeric(18, 2) not null default 0,
  closing_cash numeric(18, 2),
  expected_cash numeric(18, 2),
  diff numeric(18, 2),
  note text
);

-- 5) Đơn bán tại quầy
create table if not exists public.hub_pos_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'tenant-vcomm-prod-01',
  hub_id text not null,
  shift_id uuid references public.hub_shifts(id),
  ownership text not null check (ownership in ('vcomm', 'consignment')),
  seller_id text,                        -- null khi bán hàng VComm
  subtotal numeric(18, 2) not null,
  vat_amount numeric(18, 2) not null default 0,
  total numeric(18, 2) not null,
  payment_method text not null default 'cash'
    check (payment_method in ('cash', 'qr_dynamic', 'card', 'wallet')),
  einvoice_id uuid,                      -- trỏ sang public.einvoices (022)
  offline boolean not null default false,
  client_txn_id text not null,           -- idempotency key do POS sinh khi offline
  created_at timestamptz not null default now(),
  unique (hub_id, client_txn_id)
);

create table if not exists public.hub_pos_order_items (
  id uuid primary key default gen_random_uuid(),
  pos_order_id uuid not null references public.hub_pos_orders(id) on delete cascade,
  product_id text not null,
  variant_id text,
  name text not null,
  qty integer not null check (qty > 0),
  unit_price numeric(18, 2) not null,
  vat_rate numeric(5, 4),
  vat_amount numeric(18, 2) not null default 0,
  line_total numeric(18, 2) not null
);

-- Index hỗ trợ truy vấn hàng đợi offline / tồn kho
create index if not exists idx_hub_transfer_notes_queue
  on public.hub_transfer_notes (transmit_due_at) where status = 'queued';
create index if not exists idx_hub_inv_hub
  on public.hub_inventory (hub_id, product_id);
create index if not exists idx_hub_pos_orders_hub
  on public.hub_pos_orders (hub_id, client_txn_id);
