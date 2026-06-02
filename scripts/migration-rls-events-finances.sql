-- Fix: adiciona policies RLS faltantes para events e finances
-- O full_schema_pro.sql habilitou RLS nestas tabelas mas não criou as policies,
-- resultando em bloqueio total de INSERT/SELECT/UPDATE/DELETE.

-- ── EVENTS ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Acesso público eventos" ON events;
DROP POLICY IF EXISTS "Eventos por grupo" ON events;
DROP POLICY IF EXISTS "Dono acessa eventos" ON events;

CREATE POLICY "Acesso público eventos" ON events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── FINANCES ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Acesso público finanças" ON finances;
DROP POLICY IF EXISTS "Finanças por grupo" ON finances;
DROP POLICY IF EXISTS "Dono acessa finanças" ON finances;

CREATE POLICY "Acesso público finanças" ON finances
  FOR ALL
  USING (true)
  WITH CHECK (true);
