-- PELADEIROS PRO - V6 GESTOR COMPLETO
-- Estoque + melhorias de presença/sorteio
-- Execute no Supabase SQL Editor depois das migrations anteriores.

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Geral',
  unit TEXT NOT NULL DEFAULT 'un',
  quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
  minimum_quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  supplier TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_group ON inventory_items(group_id);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('entrada','saida','ajuste')),
  quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  reason TEXT NOT NULL DEFAULT 'Outro',
  reference TEXT,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON inventory_movements(item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_group ON inventory_movements(group_id, created_at DESC);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso grupo estoque" ON inventory_items;
CREATE POLICY "Acesso grupo estoque" ON inventory_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso grupo movimentacoes estoque" ON inventory_movements;
CREATE POLICY "Acesso grupo movimentacoes estoque" ON inventory_movements FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE matches ADD COLUMN IF NOT EXISTS invite_token TEXT;
ALTER TABLE match_presence ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_invite_token
  ON matches(invite_token) WHERE invite_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_match_presence_match_status
  ON match_presence(match_id, status);

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE inventory_items, inventory_movements;
EXCEPTION WHEN others THEN NULL;
END $$;
