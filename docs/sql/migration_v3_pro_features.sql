-- Migration V3: PRO Features
-- Adiciona suporte a estatuto, limites de jogadores e modalidades inteligentes

ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS rules_text TEXT,
ADD COLUMN IF NOT EXISTS sport_type_default TEXT DEFAULT 'Society';

ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS game_mode TEXT DEFAULT 'Dois ou Dez',
ADD COLUMN IF NOT EXISTS sport_type TEXT DEFAULT 'Society',
ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 14,
ADD COLUMN IF NOT EXISTS max_goalkeepers INTEGER DEFAULT 2;

-- Comentários para documentação no banco
COMMENT ON COLUMN groups.rules_text IS 'Texto do estatuto/regras do grupo';
COMMENT ON COLUMN matches.game_mode IS 'Modo de jogo: Rachão, Revezamento, Dois ou Dez, Vira-Acaba';
COMMENT ON COLUMN matches.sport_type IS 'Tipo de esporte/campo: Futsal, Society, Campo';
