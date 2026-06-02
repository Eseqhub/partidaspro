-- Inscrições de Web Push (notificações com o app fechado)

create table if not exists push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists idx_push_subscriptions_group on push_subscriptions(group_id);

alter table push_subscriptions enable row level security;

drop policy if exists "Acesso público push" on push_subscriptions;
create policy "Acesso público push" on push_subscriptions
  for all using (true) with check (true);
