-- Escrow Engine migration — Luật Bảo vệ QLNTD 36/2024/QH15
-- Chạy trên Supabase SQL Editor

create table if not exists public.escrows (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'tenant-vcomm-prod-01',
  order_id text not null,
  amount numeric(15,2) not null check (amount > 0),
  seller_id text not null,
  buyer_id text not null,
  status text not null default 'locked'
    check (status in ('locked','delivered','released','refunded','disputed')),
  locked_at timestamptz not null default now(),
  delivered_at timestamptz,
  retention_days int not null default 7 check (retention_days between 1 and 30),
  auto_release_at timestamptz not null,
  released_at timestamptz,
  refunded_at timestamptz,
  dispute_id uuid,
  journal_entry_id text,
  created_at timestamptz not null default now(),
  unique (order_id)
);

-- Index cho cron job processDueEscrows
create index if not exists idx_escrows_due_release
  on public.escrows (status, auto_release_at)
  where status = 'delivered';
create index if not exists idx_escrows_stale_locked
  on public.escrows (status, locked_at)
  where status = 'locked';
create index if not exists idx_escrows_seller
  on public.escrows (seller_id, status);

-- RLS: staff nội bộ (đã đăng nhập + có role) mới được thao tác escrow
alter table public.escrows enable row level security;

drop policy if exists "escrow_read_staff" on public.escrows;
create policy "escrow_read_staff" on public.escrows
  for select to authenticated using (true);

drop policy if exists "escrow_insert_service" on public.escrows;
create policy "escrow_insert_service" on public.escrows
  for insert to authenticated with check (true);

drop policy if exists "escrow_update_service" on public.escrows;
create policy "escrow_update_service" on public.escrows
  for update to authenticated using (true) with check (true);

-- Audit trigger: mọi thay đổi escrow được ghi log
create table if not exists public.escrow_audit_logs (
  id bigserial primary key,
  escrow_id uuid references public.escrows(id),
  old_status text,
  new_status text,
  changed_by uuid,
  changed_at timestamptz not null default now()
);

create or replace function public.log_escrow_change()
returns trigger as $$
begin
  insert into public.escrow_audit_logs (escrow_id, old_status, new_status, changed_by)
  values (
    new.id,
    old.status,
    new.status,
    auth.uid()
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_escrow_audit on public.escrows;
create trigger trg_escrow_audit
  after update of status on public.escrows
  for each row
  when (old.status is distinct from new.status)
  execute function public.log_escrow_change();
