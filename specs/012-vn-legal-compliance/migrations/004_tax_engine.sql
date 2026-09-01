-- Tax Engine migration — TT 78/2021/TT-BTC + NĐ 72/2025 (giảm thuế GTGT) + NĐ 117/2025 (seller tax)

create table if not exists public.tax_rate_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'tenant-vcomm-prod-01',
  category_path text not null default '*' check (category_path = '*'),
  vat_rate numeric(5,4),  -- NULL = không chịu thuế
  effective_from date not null,
  effective_to date,
  legal_basis text not null,
  note text,
  created_at timestamptz not null default now(),
  constraint vat_rate_valid check (vat_rate is null or (vat_rate >= 0 and vat_rate <= 0.15))
);

-- Seed quy định hiện hành: 8% đến 31/12/2026 (NĐ 72/2025), quay lại 10% từ 2027
insert into public.tax_rate_rules (category_path, vat_rate, effective_from, effective_to, legal_basis, note)
values
  ('*', 0.08, '2025-07-01', '2026-12-31', 'NĐ 72/2025/NĐ-CP', 'Giảm 2% thuế GTGT cho hầu hết hàng hóa'),
  ('*', 0.10, '2027-01-01', null, 'Luật Thuế GTGT', 'Hết thời gian giảm thuế theo NĐ 72/2025')
on conflict do nothing;

alter table public.tax_rate_rules enable row level security;

drop policy if exists "tax_rules_read" on public.tax_rate_rules;
create policy "tax_rules_read" on public.tax_rate_rules
  for select to authenticated using (true);

drop policy if exists "tax_rules_admin_write" on public.tax_rate_rules;
create policy "tax_rules_admin_write" on public.tax_rate_rules
  for all to authenticated using (true) with check (true);

-- Thêm cột vat vào orders nếu chưa có (lưu thuế suất từng đơn tại thời điểm phát sinh)
do $$
begin
  if not exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'vat_rate') then
    alter table public.orders add column vat_rate numeric(5,4);
  end if;
  if not exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'vat_amount') then
    alter table public.orders add column vat_amount numeric(15,2) default 0;
  end if;
end $$;
