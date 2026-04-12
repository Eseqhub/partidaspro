-- Peladeiros Pro - Schema Update V1
-- Adição de campos para o Modo Partida Real-time

ALTER TABLE matches 
ADD COLUMN timer_seconds INTEGER DEFAULT 0,
ADD COLUMN timer_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN is_timer_running BOOLEAN DEFAULT FALSE;
