-- Migration: Estatísticas por jogador por sessão
-- Rodar no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS match_player_stats (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id   UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id  UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  group_id   UUID NOT NULL REFERENCES groups(id)  ON DELETE CASCADE,
  team       TEXT,                          -- 'home' | 'away' | 'waiting'
  goals      INTEGER NOT NULL DEFAULT 0,
  assists    INTEGER NOT NULL DEFAULT 0,
  tackles    INTEGER NOT NULL DEFAULT 0,
  saves      INTEGER NOT NULL DEFAULT 0,
  rating     NUMERIC(3,1),                  -- nota 1.0 – 10.0
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

ALTER TABLE match_player_stats ENABLE ROW LEVEL SECURITY;

-- Membros do grupo podem ler e inserir
CREATE POLICY "match_player_stats_all" ON match_player_stats
  FOR ALL USING (true) WITH CHECK (true);
