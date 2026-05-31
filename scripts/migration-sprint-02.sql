-- ============================================================
-- PARTIDAS PRO — Migration Sprint 02
-- Adiciona challenge_token em matches e corrige enum Society 6x6
-- Execute no Supabase Dashboard > SQL Editor
-- Estratégia: APPEND-ONLY
-- ============================================================

-- 1. Adiciona colunas para o Modo Desafio em matches
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS match_type          TEXT DEFAULT 'rachao',
  ADD COLUMN IF NOT EXISTS challenge_token     TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS challenge_status    TEXT DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS away_group_name     TEXT;

-- 2. Garante índice no token para consultas rápidas
CREATE INDEX IF NOT EXISTS matches_challenge_token_idx ON matches(challenge_token);

-- 3. Colunas adicionais no match_configs (caso não existam)
ALTER TABLE match_configs
  ADD COLUMN IF NOT EXISTS local            TEXT,
  ADD COLUMN IF NOT EXISTS duracao_minutos  SMALLINT;

-- 4. Campos adicionais do grupo para o Dashboard
ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS founded_year    SMALLINT,
  ADD COLUMN IF NOT EXISTS description     TEXT,
  ADD COLUMN IF NOT EXISTS rules_text      TEXT;

-- 5. Verificação rápida
SELECT column_name FROM information_schema.columns
  WHERE table_name = 'matches'
  AND column_name IN ('challenge_token','match_type','challenge_status','away_group_name');
