-- Seller KYC migration — NĐ 52/2013 + 85/2021/NĐ-CP (xác minh sàn TMĐT)

create table if not exists public.seller_kyc (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'tenant-vcomm-prod-01',
  seller_id text not null unique references public.sellers(id) on delete cascade,
  status text not null default 'unverified'
    check (status in ('unverified','documents_submitted','under_review','approved','rejected')),
  tax_code varchar(20),
  business_license_url text,
  identity_card varchar(20),
  contract_signed_at timestamptz,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_seller_kyc_status on public.seller_kyc (status);

-- Tự tạo hồ sơ KYC "unverified" khi seller mới đăng ký
insert into public.seller_kyc (seller_id)
select s.id from public.sellers s
where not exists (select 1 from public.seller_kyc k where k.seller_id = s.id)
on conflict do nothing;

-- RLS
alter table public.seller_kyc enable row level security;

drop policy if exists "kyc_read_authenticated" on public.seller_kyc;
create policy "kyc_read_authenticated" on public.seller_kyc
  for select to authenticated using (true);

drop policy if exists "kyc_insert_authenticated" on public.seller_kyc;
create policy "kyc_insert_authenticated" on public.seller_kyc
  for insert to authenticated with check (true);

drop policy if exists "kyc_update_authenticated" on public.seller_kyc;
create policy "kyc_update_authenticated" on public.seller_kyc
  for update to authenticated using (true) with check (true);

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_seller_kyc_touch on public.seller_kyc;
create trigger trg_seller_kyc_touch
  before update on public.seller_kyc
  for each row execute function public.touch_updated_at();

-- GATE (NĐ 52/85): sản phẩm chỉ publish khi seller KYC approved + đã ký hợp đồng
-- products.status phải thuộc ('draft','rejected','pending_review') nếu seller chưa approved
-- (bổ sung cột status/seller_id nếu schema gốc normalize_relational_schema chưa có)
do $$
begin
  if not exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'status') then
    alter table public.products add column status text not null default 'draft'
      check (status in ('draft','pending_review','published','rejected','archived'));
  end if;
  if not exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'seller_id') then
    alter table public.products add column seller_id text;
  end if;
end $$;

create or replace function public.enforce_seller_kyc_gate()
returns trigger as $$
declare
  seller_status text;
  contract_at timestamptz;
begin
  if new.status = 'published' then
    select k.status, k.contract_signed_at into seller_status, contract_at
    from public.seller_kyc k where k.seller_id = new.seller_id;

    if seller_status is distinct from 'approved' or contract_at is null then
      raise exception 'Seller % chưa hoàn tất KYC (status=%) hoặc chưa ký hợp đồng khung — không thể publish sản phẩm (NĐ 52/2013).',
        new.seller_id, coalesce(seller_status, 'no_kyc');
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_product_kyc_gate on public.products;
create trigger trg_product_kyc_gate
  before insert or update of status on public.products
  for each row execute function public.enforce_seller_kyc_gate();
