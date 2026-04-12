-- Peladeiros Pro - Migration to Version Pro (Adding Registration & Match Config)

-- 1. Upgrade Groups Table
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS invite_password TEXT;

-- 2. Upgrade Players Table (Athlete Card)
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS preferred_foot TEXT,
ADD COLUMN IF NOT EXISTS height NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS weight NUMERIC(5,2);

-- 3. Upgrade Matches Table (Timer & Vest Colors)
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS stoppage_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS goal_limit INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pix_key TEXT,
ADD COLUMN IF NOT EXISTS home_color TEXT DEFAULT 'Branco',
ADD COLUMN IF NOT EXISTS away_color TEXT DEFAULT 'Preto';
