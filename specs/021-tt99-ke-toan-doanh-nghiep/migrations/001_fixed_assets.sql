-- GĐ 2.1 — Fixed Assets & Depreciation (TT99/2025 + TT45/2013)
-- Chạy trên Supabase SQL Editor SAU KHI migration TT99 bridge (017–021) đã apply.
-- Liên kết: src/services/fixedAssetService.ts (engine thuần, không chạm DB).

-- 1) Danh sách TSCĐ (nguyên giá, thời gian SD, công dụng, tình trạng)
create table if not exists public.fixed_assets (
  id text primary key,                       -- FA-xxxx (không uuid để dễ đọc + idempotent key KH-<id>-<period>)
  tenant_id text not null default 'tenant-vcomm-prod-01',
  name text not null,
  asset_account text not null check (asset_account in ('211','212','213')), -- 211 hữu hình / 212 thuê TC / 213 vô hình
  asset_class text,                          -- mã tra TSCĐ_USEFUL_LIFE_MONTHS (MM.POS, TB.KE, ...)
  put_into_use_date date not null,           -- bắt đầu trích từ tháng kế tiếp
  cost numeric(15,2) not null check (cost > 0),
  residual_value numeric(15,2) not null default 0 check (residual_value >= 0),
  useful_life_months int not null check (useful_life_months > 0),
  method text not null default 'straight_line' check (method in ('straight_line','declining_balance')),
  usage text not null default 'admin' check (usage in ('admin','production','sales')),
  serial_number text,
  location text,                             -- hub_id / kho nếu là thiết bị Hub
  status text not null default 'in_use' check (status in ('in_use','disposed','idle')),
  disposed_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint disposed_after_use check (disposed_date is null or disposed_date >= put_into_use_date)
);

-- 2) Lịch sử trích khấu hao từng kỳ (ghi trực tiếp từ fixedAssetService.generateDepreciationSchedule)
create table if not exists public.fixed_asset_depreciation (
  id text primary key,                       -- KH-<asset_id>-<yyyy-mm> (idempotent)
  tenant_id text not null default 'tenant-vcomm-prod-01',
  asset_id text not null references public.fixed_assets(id),
  period text not null,                      -- yyyy-mm
  amount numeric(15,2) not null,
  accumulated numeric(15,2) not null,
  remaining_book_value numeric(15,2) not null,
  journal_entry_id text,                      -- ref chứng từ (Điều 12 TT99), điền sau khi post
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (asset_id, period)
);

-- 3) Index hỗ trợ cron trích khấu hao cuối tháng
create index if not exists idx_fa_depr_unposted
  on public.fixed_asset_depreciation (asset_id, period)
  where posted_at is null;
create index if not exists idx_fa_active
  on public.fixed_assets (tenant_id, status)
  where status = 'in_use';

-- 4) RLS: chỉ staff nội bộ (đã đăng nhập) thao tác
alter table public.fixed_assets enable row level security;
alter table public.fixed_asset_depreciation enable row level security;

drop policy if exists "fa_read_staff" on public.fixed_assets;
create policy "fa_read_staff" on public.fixed_assets for select to authenticated using (true);
drop policy if exists "fa_write_service" on public.fixed_assets;
create policy "fa_write_service" on public.fixed_assets for all to authenticated using (true) with check (true);

drop policy if exists "fad_read_staff" on public.fixed_asset_depreciation;
create policy "fad_read_staff" on public.fixed_asset_depreciation for select to authenticated using (true);
drop policy if exists "fad_write_service" on public.fixed_asset_depreciation;
create policy "fad_write_service" on public.fixed_asset_depreciation for all to authenticated using (true) with check (true);

-- 5) Hàm tiện ích: tính số khấu hao kỳ hiện tại của 1 tài sản (dùng trong SQL/cron).
--    Logic tính bằng TS nằm ở fixedAssetService.ts; đây chỉ là view tổng hợp lũy kế.
create or replace view public.fixed_asset_summary as
select
  fa.tenant_id,
  fa.id as asset_id,
  fa.name,
  fa.asset_account,
  fa.cost,
  fa.residual_value,
  coalesce(sum(fad.amount), 0) as total_depreciated,
  (fa.cost - coalesce(sum(fad.amount), 0)) as net_book_value
from public.fixed_assets fa
left join public.fixed_asset_depreciation fad on fad.asset_id = fa.id
group by fa.tenant_id, fa.id, fa.name, fa.asset_account, fa.cost, fa.residual_value;
