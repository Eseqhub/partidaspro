-- Peladeiros Pro - Database Schema V2 (Refined for Dashboard & Stats)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- GRUPOS (TENANTS)
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  is_paid_model BOOLEAN DEFAULT FALSE,
  invite_password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- JOGADORES (PLAYERS)
DO $$ BEGIN
    CREATE TYPE player_position_v2 AS ENUM ('G', 'LE', 'ZG', 'LD', 'SA', 'MO', 'MD', 'VOL', 'CA', 'PD', 'PE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  photo_url TEXT,
  rating NUMERIC(3,1) DEFAULT 3.0,
  positions player_position_v2[] DEFAULT '{MO}',
  status TEXT DEFAULT 'Ativo',
  is_mensalista BOOLEAN DEFAULT FALSE,
  full_name TEXT,
  nationality TEXT,
  birth_date DATE,
  preferred_foot TEXT,
  height NUMERIC(3,2),
  weight NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTIDAS (MATCHES)
DO $$ BEGIN
    CREATE TYPE match_status_v2 AS ENUM ('Agendada', 'Em curso', 'Pausada', 'Finalizada');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  location TEXT,
  status match_status_v2 DEFAULT 'Agendada',
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  home_team_name TEXT DEFAULT 'Time 1',
  away_team_name TEXT DEFAULT 'Time 2',
  winner_team TEXT, -- 'home', 'away', 'draw'
  timer_seconds INTEGER DEFAULT 0,
  match_fee DECIMAL(10,2) DEFAULT 0.00,
  duration_minutes INTEGER DEFAULT 10,
  stoppage_minutes INTEGER DEFAULT 0,
  goal_limit INTEGER DEFAULT 0,
  pix_key TEXT,
  home_color TEXT DEFAULT 'Branco',
  away_color TEXT DEFAULT 'Preto',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EVENTOS (EVENTS)
DO $$ BEGIN
    CREATE TYPE event_type_v2 AS ENUM ('Gol', 'Assistência', 'Cartão Amarelo', 'Cartão Vermelho', 'Entrada', 'Saída');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  type event_type_v2 NOT NULL,
  team TEXT NOT NULL, -- 'home' ou 'away'
  minute INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LISTA DE PRESENÇA
CREATE TABLE IF NOT EXISTS match_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team TEXT, -- 'home' ou 'away' (definido no sorteio/durante o jogo)
  arrival_order SERIAL,
  status TEXT DEFAULT 'Confirmado',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

-- FINANÇAS (FINANCES)
DO $$ BEGIN
    CREATE TYPE transaction_type_v1 AS ENUM ('Receita', 'Despesa');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status_v1 AS ENUM ('Pago', 'Pendente');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS finances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  type transaction_type_v1 NOT NULL,
  category TEXT NOT NULL, -- 'Mensalidade', 'Aluguel', 'Extra', 'Ajuda de custo'
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status transaction_status_v1 DEFAULT 'Pendente',
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS
CREATE POLICY "Dono acessa tudo" ON groups FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Dono acessa jogadores" ON players FOR ALL USING (group_id IN (SELECT id FROM groups WHERE owner_id = auth.uid()));
CREATE POLICY "Dono acessa partidas" ON matches FOR ALL USING (group_id IN (SELECT id FROM groups WHERE owner_id = auth.uid()));
CREATE POLICY "Dono acessa eventos" ON events FOR ALL USING (match_id IN (SELECT id FROM matches WHERE group_id IN (SELECT id FROM groups WHERE owner_id = auth.uid())));
CREATE POLICY "Dono acessa presença" ON match_presence FOR ALL USING (match_id IN (SELECT id FROM matches WHERE group_id IN (SELECT id FROM groups WHERE owner_id = auth.uid())));
CREATE POLICY "Dono acessa finanças" ON finances FOR ALL USING (group_id IN (SELECT id FROM groups WHERE owner_id = auth.uid()));

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE matches, events, match_presence, finances;
