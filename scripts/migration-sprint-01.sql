-- ============================================================
-- PARTIDAS PRO — Migration Script COMPLETO (Sprint 01 + 02)
-- Execute no Supabase Dashboard > SQL Editor
-- Estratégia: APPEND-ONLY — sem remoções, sem renomeações.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. TABELA: groups
-- ────────────────────────────────────────────────────────────
ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS logo_url              TEXT,
  ADD COLUMN IF NOT EXISTS estatuto_regras       TEXT,          -- Estatuto/regras do grupo (texto longo)
  ADD COLUMN IF NOT EXISTS recruitment_link_hash TEXT UNIQUE;   -- Hash único para link de recrutamento

-- ────────────────────────────────────────────────────────────
-- 2. TABELA: players
-- ────────────────────────────────────────────────────────────
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS skill_level      SMALLINT
    DEFAULT 5 CHECK (skill_level BETWEEN 1 AND 10),  -- Habilidade 1–10 (sorteio inteligente)
  ADD COLUMN IF NOT EXISTS altura           DECIMAL(4,2),    -- Altura em metros (ex: 1.75)
  ADD COLUMN IF NOT EXISTS peso             DECIMAL(5,2),    -- Peso em kg (ex: 75.5)
  ADD COLUMN IF NOT EXISTS data_nascimento  DATE,            -- Para cálculo de idade
  ADD COLUMN IF NOT EXISTS posicao_principal TEXT;            -- Posição preferida (G, ZAG, VOL, etc.)

-- ────────────────────────────────────────────────────────────
-- 3. TABELA NOVA: match_configs
--    Vinculada à tabela matches (1:1 ou 1:N)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS match_configs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id         UUID REFERENCES matches(id) ON DELETE CASCADE,
  group_id         UUID REFERENCES groups(id)  ON DELETE CASCADE,

  -- Tipo de campo como enum seguro
  tipo_campo       TEXT NOT NULL DEFAULT 'Futsal 5x5'
                   CHECK (tipo_campo IN ('Futsal 5x5','Society 6x6','Society 7x7','Campo 11x11')),

  -- Modalidade de jogo
  modalidade       TEXT NOT NULL DEFAULT 'Rachão'
                   CHECK (modalidade IN ('Rachão','Bolão','Revezamento','Dez_ou_2_gols')),

  local            TEXT,            -- Nome do local / quadra
  hora_inicio      TIME,            -- Ex: 08:00
  hora_fim         TIME,            -- Ex: 10:00
  duracao_minutos  SMALLINT,        -- Duração de cada jogo em minutos

  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS match_configs_match_id_idx  ON match_configs(match_id);
CREATE INDEX IF NOT EXISTS match_configs_group_id_idx  ON match_configs(group_id);

-- RLS: habilitar Row Level Security
ALTER TABLE match_configs ENABLE ROW LEVEL SECURITY;

-- Política: apenas membros do grupo podem ler
-- (DROP antes de CREATE é a forma idempotente correta no PostgreSQL)
DROP POLICY IF EXISTS "match_configs_select" ON match_configs;
CREATE POLICY "match_configs_select"
  ON match_configs FOR SELECT
  USING (
    group_id IN (
      SELECT id FROM groups WHERE owner_id = auth.uid()
      UNION
      SELECT group_id FROM group_roles WHERE user_email = auth.email()
    )
  );

-- Política: apenas owner/editor podem inserir e editar
DROP POLICY IF EXISTS "match_configs_write" ON match_configs;
CREATE POLICY "match_configs_write"
  ON match_configs FOR ALL
  USING (
    group_id IN (
      SELECT id FROM groups WHERE owner_id = auth.uid()
      UNION
      SELECT group_id FROM group_roles WHERE user_email = auth.email()
    )
  );

-- ────────────────────────────────────────────────────────────
-- 4. TABELA: match_presence — adições de coluna
-- ────────────────────────────────────────────────────────────
-- Adiciona hash de convite para o Magic Link de presença (se não existir)
ALTER TABLE match_presence
  ADD COLUMN IF NOT EXISTS invite_token TEXT UNIQUE,    -- Token para Magic Link
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;   -- Quando confirmou presença

-- ────────────────────────────────────────────────────────────
-- VERIFICAÇÃO (descomente para rodar)
-- ────────────────────────────────────────────────────────────
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'groups'
--   AND column_name IN ('logo_url','estatuto_regras','recruitment_link_hash');

-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'players'
--   AND column_name IN ('skill_level','altura','peso','data_nascimento','posicao_principal');

-- SELECT table_name FROM information_schema.tables
--   WHERE table_name = 'match_configs';
