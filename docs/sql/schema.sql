-- Peladeiros Pro - Database Schema (Multi-tenant)
-- Agente de Arquitetura: Configuração de Tabelas e RLS

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- GRUPOS (TENANTS)
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  is_paid_model BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- JOGADORES (PLAYERS)
CREATE TYPE player_position AS ENUM ('Goleiro', 'Zagueiro', 'Meio', 'Ataque');

CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  photo_url TEXT,
  rating NUMERIC(3,2) DEFAULT 3.00, -- 1.00 a 5.00
  position player_position NOT NULL DEFAULT 'Meio',
  status TEXT DEFAULT 'Ativo', -- 'Ativo', 'Inativo'
  is_mensalista BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTIDAS (MATCHES)
CREATE TYPE match_status AS ENUM ('Agendada', 'Em curso', 'Finalizada');

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  status match_status DEFAULT 'Agendada',
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  match_fee DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EVENTOS DA PARTIDA (EVENTS)
CREATE TYPE event_type AS ENUM ('Gol', 'Assistência', 'Cartão Amarelo', 'Cartão Vermelho', 'Falta');

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  type event_type NOT NULL,
  minute INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FINANÇAS (FINANCES)
CREATE TYPE transaction_type AS ENUM ('Receita', 'Despesa');
CREATE TYPE transaction_status AS ENUM ('Pago', 'Pendente');

CREATE TABLE finances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL, -- Opcional para mensalidades
  type transaction_type NOT NULL,
  category TEXT NOT NULL, -- 'Mensalidade', 'Aluguel', 'Extra'
  amount DECIMAL(10,2) NOT NULL,
  status transaction_status DEFAULT 'Pendente',
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ROW LEVEL SECURITY (RLS) - MULTI-TENANCY

-- Habilitar RLS em todas as tabelas
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: GRUPOS
CREATE POLICY "Donos podem ver seus grupos" ON groups
  FOR ALL USING (auth.uid() = owner_id);

-- POLÍTICAS: JOGADORES (Filtrado por group_id)
CREATE POLICY "Jogadores por grupo" ON players
  FOR ALL USING (
    group_id IN (SELECT id FROM groups WHERE owner_id = auth.uid())
  );

-- POLÍTICAS: PARTIDAS
CREATE POLICY "Partidas por grupo" ON matches
  FOR ALL USING (
    group_id IN (SELECT id FROM groups WHERE owner_id = auth.uid())
  );

-- POLÍTICAS: EVENTOS
CREATE POLICY "Eventos por grupo" ON events
  FOR ALL USING (
    match_id IN (SELECT id FROM matches WHERE group_id IN (SELECT id FROM groups WHERE owner_id = auth.uid()))
  );

-- POLÍTICAS: FINANÇAS
CREATE POLICY "Finanças por grupo" ON finances
  FOR ALL USING (
    group_id IN (SELECT id FROM groups WHERE owner_id = auth.uid())
  );

-- 4. REAL-TIME
-- Habilitar Realtime para o placar das partidas
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
