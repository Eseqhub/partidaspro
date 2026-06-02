-- Função do atleta (jogador / técnico / técnico-jogador) + vínculo do clube visitante no desafio

alter table players       add column if not exists role text default 'jogador';
alter table join_requests add column if not exists role text default 'jogador';

-- Desafio: liga a partida ao clube do time visitante (quando aceita vira clube de verdade)
alter table matches add column if not exists away_group_id uuid references groups(id) on delete set null;
