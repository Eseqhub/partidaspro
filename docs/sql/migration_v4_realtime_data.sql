-- Migration V4: Realtime Data Sync
-- Garante que o placar e cronômetro existam e que as tabelas estejam na publicação realtime

ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS home_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS away_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS timer_seconds INTEGER DEFAULT 0;

-- Certificar que as tabelas estão na publicação para o Supabase Realtime
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE matches, events;
  END IF;
EXCEPTION WHEN others THEN
  -- Ignorar se já estiverem ou se a publicação não existir (o Supabase cria por padrão)
  NULL;
END $$;
