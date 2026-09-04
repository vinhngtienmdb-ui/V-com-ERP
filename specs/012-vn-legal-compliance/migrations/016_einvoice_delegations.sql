-- 016: Bảng ủy nhiệm phát hành HĐĐT (TT 91/2026 Điều 9) — S3
-- VComm được Seller ủy nhiệm phát hành HĐĐT thay Seller.
-- Hai nghĩa vụ của NỀN TẢNG (không đùn cho Seller):
--   9.1.đ — thông báo ủy nhiệm trên giao diện gian hàng (notice_published_at)
--   9.3.c — thông báo CQT kèm danh sách theo Mẫu 01/ĐKTĐ-HĐĐT (cqt_notified_at/ref)

create table if not exists public.einvoice_delegations (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'tenant-vcomm-prod-01',
  seller_id text not null,

  status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended', 'revoked')),
  delegated_from date not null,
  delegated_to date,

  -- Bên ủy nhiệm (Seller) — lưu để in lên HĐ và thông báo
  delegator_name text not null,
  delegator_tax_code text not null,

  auth_doc_ref text,                     -- HĐ/VB ủy nhiệm (bắt buộc lưu)

  -- Hình thức hóa đơn khi ủy nhiệm — TT 91 Điều 9.1.h
  invoice_form text not null default '7' check (invoice_form in ('1', '2', '7')),
  invoice_symbol text not null,          -- '7K26XYY' | '1K26TYY' | '2K26TYY'
  template_code text,

  provider_key text not null default 'einvoice',

  -- TT 91 Điều 9.1.đ — thông báo trên gian hàng/nền tảng (trước khi khách đặt hàng)
  notice_published_at timestamptz,
  notice_url text,

  -- TT 91 Điều 9.3.c — thông báo CQT kèm danh sách (Mẫu 01/ĐKTĐ-HĐĐT)
  cqt_notified_at timestamptz,
  cqt_notice_ref text,

  legal_basis text not null default 'TT 91/2026/TT-BTC Điều 9',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_deleg_active
  on public.einvoice_delegations (seller_id, status)
  where status = 'active';

comment on table public.einvoice_delegations is
  'TT 91/2026 Điều 9: VComm ủy nhiệm phát hành HĐĐT thay Seller. Chữ "active" + notice_published_at là điều kiện phát hành (Điều 9.1.đ).';
