-- Fix 404 no cadastro público: visitantes não logados precisam LER o grupo
-- (nome, slug, logo, regras) para a página /[slug]/join e /[slug]/register.
-- A policy antiga só permitia o dono ler (auth.uid() = owner_id), então
-- usuário anônimo recebia null e caía no /404.
--
-- Adiciona leitura pública (SELECT). Escrita continua restrita ao dono.

drop policy if exists "Leitura pública grupos" on groups;
create policy "Leitura pública grupos" on groups
  for select using (true);
