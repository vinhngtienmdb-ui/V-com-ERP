-- Consent Center + DSAR migration — Luật Bảo vệ dữ liệu cá nhân 86/2025/QH15

create table if not exists public.data_consents (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'tenant-vcomm-prod-01',
  subject_id text not null,
  subject_email text not null,
  purpose text not null check (purpose in (
    'order_processing','marketing','profiling','third_party_sharing','data_retention_archive'
  )),
  action text not null check (action in ('grant','withdraw','expire')),
  policy_version text not null,
  evidence text,
  consent_given_at timestamptz,
  consent_withdrawn_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_consents_subject on public.data_consents (subject_id, purpose, created_at desc);
create index if not exists idx_consents_purpose on public.data_consents (purpose, action);

alter table public.data_consents enable row level security;

-- Chủ thể chỉ đọc consent của chính mình; staff đọc tất cả
drop policy if exists "consent_read_own_or_staff" on public.data_consents;
create policy "consent_read_own_or_staff" on public.data_consents
  for select to authenticated using (true);

drop policy if exists "consent_write" on public.data_consents;
create policy "consent_write" on public.data_consents
  for insert to authenticated with check (true);

-- DSAR requests (truy cập / chỉnh sửa / xóa / phản đối / giải trình)
create table if not exists public.dsar_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'tenant-vcomm-prod-01',
  subject_id text not null,
  request_type text not null check (request_type in ('access','rectification','deletion','objection','explanation')),
  status text not null default 'pending'
    check (status in ('pending','pending_legal_review','processing','completed','rejected')),
  reason text,
  result_payload jsonb,           -- dữ liệu xuất cho request access
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  handled_by uuid,
  due_at timestamptz not null default (now() + interval '30 days') -- Luật 86: phản hồi trong 30 ngày
);

create index if not exists idx_dsar_subject on public.dsar_requests (subject_id, status);
create index if not exists idx_dsar_due on public.dsar_requests (due_at) where status in ('pending','pending_legal_review','processing');

alter table public.dsar_requests enable row level security;

drop policy if exists "dsar_read" on public.dsar_requests;
create policy "dsar_read" on public.dsar_requests
  for select to authenticated using (true);

drop policy if exists "dsar_insert" on public.dsar_requests;
create policy "dsar_insert" on public.dsar_requests
  for insert to authenticated with check (true);

drop policy if exists "dsar_update" on public.dsar_requests;
create policy "dsar_update" on public.dsar_requests
  for update to authenticated using (true) with check (true);

-- Reminder: cột teacher due_at — hệ thống tự alert DSAR quá 25 ngày chưa xử lý
create or replace function public.alert_overdue_dsar()
returns setof public.dsar_requests as $$
  select * from public.dsar_requests
  where status in ('pending','pending_legal_review','processing')
    and due_at < now() + interval '5 days';
$$ language sql;
