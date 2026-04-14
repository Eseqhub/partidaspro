-- Migration V4: Sync & Config PRO
-- Adiciona suporte a recorrência e garante campos técnicos dos atletas

ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS recurrence_day TEXT DEFAULT 'Segunda-feira',
ADD COLUMN IF NOT EXISTS rules_text TEXT,
ADD COLUMN IF NOT EXISTS sport_type_default TEXT DEFAULT 'Society';

ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS preferred_foot TEXT DEFAULT 'R',
ADD COLUMN IF NOT EXISTS height NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS weight NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS is_mensalista BOOLEAN DEFAULT FALSE;

ALTER TABLE public.match_presence
ADD COLUMN IF NOT EXISTS team TEXT; -- 'home', 'away' ou 'waiting'

-- Comentários para documentação
COMMENT ON COLUMN groups.recurrence_day IS 'Dia da semana em que a pelada ocorre';
COMMENT ON COLUMN players.preferred_foot IS 'Pé preferencial: R (Destro), L (Canhoto), Ambidestro';
