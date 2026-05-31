-- =====================================================================
-- Super Admins — delegação de acesso ao painel /admin
-- Rode no Supabase: SQL Editor → New query → cole tudo → Run
-- =====================================================================

create table if not exists public.super_admins (
  email      text primary key,
  added_by   text,
  created_at timestamptz not null default now()
);

-- RLS: permite que usuários autenticados leiam/gravem (o app já gateia por e-mail).
alter table public.super_admins enable row level security;

drop policy if exists "super_admins_select" on public.super_admins;
create policy "super_admins_select" on public.super_admins
  for select using (auth.role() = 'authenticated');

drop policy if exists "super_admins_all" on public.super_admins;
create policy "super_admins_all" on public.super_admins
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- =====================================================================
-- (Opcional) Recorrência de partidas — para sessões recorrentes persistirem
-- =====================================================================
alter table public.matches add column if not exists recorrencia text;
alter table public.matches add column if not exists recorrencia_dia text;
