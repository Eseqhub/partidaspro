-- Telefone e email no card do atleta e na solicitação de entrada

alter table players       add column if not exists phone text;
alter table players       add column if not exists email text;
alter table join_requests add column if not exists phone text;
alter table join_requests add column if not exists email text;
