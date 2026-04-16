-- ============================================================
-- Migration V5: Challenge Mode (Modo Desafio)
-- Data: 2026-04-15
-- Adiciona suporte a partidas do tipo "Desafio vs Outro Time"
-- com link de convite único e fluxo sem sorteio.
-- ============================================================

-- Novos campos na tabela matches
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS match_type TEXT DEFAULT 'rachao',
  ADD COLUMN IF NOT EXISTS challenge_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS challenge_status TEXT DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS away_group_name TEXT,
  ADD COLUMN IF NOT EXISTS sport_type TEXT DEFAULT 'Society',
  ADD COLUMN IF NOT EXISTS game_mode TEXT DEFAULT 'Rachão',
  ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 14,
  ADD COLUMN IF NOT EXISTS max_goalkeepers INTEGER DEFAULT 2;

-- Índice para busca rápida por token (URL do desafio)
CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_challenge_token
  ON public.matches(challenge_token)
  WHERE challenge_token IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN matches.match_type IS 'rachao = pelada interna com sorteio | desafio = vs outro time com link convite';
COMMENT ON COLUMN matches.challenge_token IS 'Token único UUID para o link de convite do desafio';
COMMENT ON COLUMN matches.challenge_status IS 'pendente | aceito | recusado';
COMMENT ON COLUMN matches.away_group_name IS 'Nome do time adversário (preenchido pelo time que aceita o desafio)';
