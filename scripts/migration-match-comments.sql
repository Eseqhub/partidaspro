-- Comentários ao vivo da partida (chat da súmula)

create table if not exists match_comments (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references matches(id) on delete cascade,
  author_name text not null default 'Torcedor',
  message text not null,
  created_at timestamptz default now()
);

alter table match_comments enable row level security;

drop policy if exists "Acesso público comentários" on match_comments;
create policy "Acesso público comentários" on match_comments
  for all using (true) with check (true);

-- Realtime (ignora se já estiver na publicação)
do $$ begin
  alter publication supabase_realtime add table match_comments;
exception when others then null;
end $$;
