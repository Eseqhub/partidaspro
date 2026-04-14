-- ==========================================
-- PELADEIROS PRO - FULL DATABASE SCHEMA (MASTER)
-- Data: 2026-04-12
-- Este script cria toda a estrutura do zero.
-- ==========================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TIPOS CUSTOMIZADOS (ENUMS)
DO $$ BEGIN
    CREATE TYPE player_position_v2 AS ENUM ('G', 'LE', 'ZG', 'LD', 'SA', 'MO', 'MD', 'VOL', 'CA', 'PD', 'PE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE match_status_v2 AS ENUM ('Agendada', 'Em curso', 'Pausada', 'Finalizada');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE event_type_v2 AS ENUM ('Gol', 'Assistência', 'Cartão Amarelo', 'Cartão Vermelho', 'Entrada', 'Saída');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type_v1 AS ENUM ('Receita', 'Despesa');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status_v1 AS ENUM ('Pago', 'Pendente');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. TABELAS

-- GRUPOS (TENANTS)
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE, -- URL amigável (ex: tapa-de-qualidade)
  logo_url TEXT, -- Escudo do time
  owner_id UUID REFERENCES auth.users(id),
  is_paid_model BOOLEAN DEFAULT FALSE,
  invite_password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexar o slug para buscas rápidas nas URLs
CREATE INDEX IF NOT EXISTS idx_groups_slug ON groups(slug);

-- JOGADORES (PLAYERS)
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  full_name TEXT,
  nationality TEXT DEFAULT 'Brasil',
  birth_date DATE,
  preferred_foot TEXT,
  height NUMERIC(3,2),
  weight NUMERIC(5,2),
  photo_url TEXT,
  rating NUMERIC(3,1) DEFAULT 3.0,
  positions player_position_v2[] DEFAULT '{MO}',
  status TEXT DEFAULT 'Ativo',
  is_mensalista BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTIDAS (MATCHES)
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
  winner_team TEXT,
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
  team TEXT, -- 'home' ou 'away'
  arrival_order SERIAL,
  status TEXT DEFAULT 'Confirmado',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

-- FINANÇAS (FINANCES)
CREATE TABLE IF NOT EXISTS finances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  type transaction_type_v1 NOT NULL,
  category TEXT NOT NULL, 
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status transaction_status_v1 DEFAULT 'Pendente',
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. SEGURANÇA (RLS)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS (Simplificadas para o MVP)
DROP POLICY IF EXISTS "Dono acessa tudo" ON groups;
CREATE POLICY "Dono acessa tudo" ON groups FOR ALL USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Acesso público jogadores" ON players;
CREATE POLICY "Acesso público jogadores" ON players FOR ALL USING (true); -- Permitir cadastro público

DROP POLICY IF EXISTS "Acesso público partidas" ON matches;
CREATE POLICY "Acesso público partidas" ON matches FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso público presença" ON match_presence;
CREATE POLICY "Acesso público presença" ON match_presence FOR ALL USING (true);

-- 5. STORAGE (FOTOS & LOGOS)
-- Bucket para fotos dos jogadores
INSERT INTO storage.buckets (id, name, public) 
VALUES ('player-photos', 'player-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket para escudos dos clubes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('club-logos', 'club-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage
DROP POLICY IF EXISTS "Fotos são públicas" ON storage.objects;
CREATE POLICY "Fotos são públicas" ON storage.objects FOR SELECT USING (bucket_id IN ('player-photos', 'club-logos'));

DROP POLICY IF EXISTS "Qualquer um pode upar fotos" ON storage.objects;
CREATE POLICY "Qualquer um pode upar fotos" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('player-photos', 'club-logos'));

-- 6. REALTIME (Seguro: Só adiciona se não existir)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE matches, events, match_presence, finances;
EXCEPTION WHEN others THEN
  -- Se já existir ou der erro, apenas ignora e segue em frente
  null;
END $$;
