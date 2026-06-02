-- Solicitações de entrada no grupo (aprovação pelo admin/organizador)

create table if not exists join_requests (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references groups(id) on delete cascade,
  name text not null,
  full_name text,
  nationality text,
  birth_date date,
  preferred_foot text,
  positions jsonb default '[]'::jsonb,
  height numeric,
  weight numeric,
  photo_url text,
  status text not null default 'pendente', -- 'pendente' | 'aprovado' | 'recusado'
  created_at timestamptz default now()
);

create index if not exists idx_join_requests_group on join_requests(group_id, status);

alter table join_requests enable row level security;

drop policy if exists "Acesso público solicitações" on join_requests;
create policy "Acesso público solicitações" on join_requests
  for all using (true) with check (true);

-- Realtime (ignora se já estiver na publicação)
do $$ begin
  alter publication supabase_realtime add table join_requests;
exception when others then null;
end $$;
