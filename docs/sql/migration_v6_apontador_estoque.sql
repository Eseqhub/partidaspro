-- ============================================================
-- PELADEIROS PRO - MIGRAÇÃO V6 + APONTADOR/AO VIVO
-- Execute este arquivo inteiro no Supabase > SQL Editor > Run
-- ============================================================

-- 1) ESTOQUE
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
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

CREATE INDEX IF NOT EXISTS idx_inventory_items_group
  ON public.inventory_items(group_id);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('entrada','saida','ajuste')),
  quantity NUMERIC(12,2) NOT NULL,
  reason TEXT,
  reference TEXT,
  player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_item
  ON public.inventory_movements(item_id);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_group
  ON public.inventory_movements(group_id);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_items_test_all" ON public.inventory_items;
CREATE POLICY "inventory_items_test_all"
  ON public.inventory_items FOR ALL
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "inventory_movements_test_all" ON public.inventory_movements;
CREATE POLICY "inventory_movements_test_all"
  ON public.inventory_movements FOR ALL
  USING (true) WITH CHECK (true);


-- 2) IDENTIFICADOR PÚBLICO DA PARTIDA
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS invite_token TEXT;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_invite_token
  ON public.matches(invite_token)
  WHERE invite_token IS NOT NULL;


-- 3) TOKEN DE APONTADOR
-- O token identifica uma sessão de apontamento de UMA partida.
CREATE TABLE IF NOT EXISTS public.match_scorer_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL DEFAULT 'Apontador',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_match_scorer_tokens_match
  ON public.match_scorer_tokens(match_id);

ALTER TABLE public.match_scorer_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "match_scorer_tokens_test_all"
  ON public.match_scorer_tokens;

CREATE POLICY "match_scorer_tokens_test_all"
  ON public.match_scorer_tokens FOR ALL
  USING (true) WITH CHECK (true);


-- 4) AUDITORIA DOS EVENTOS REGISTRADOS
CREATE TABLE IF NOT EXISTS public.match_event_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  event_id UUID,
  scorer_token_id UUID REFERENCES public.match_scorer_tokens(id) ON DELETE SET NULL,
  action TEXT NOT NULL DEFAULT 'created'
    CHECK (action IN ('created','corrected','deleted')),
  event_type TEXT,
  player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_event_audit_match
  ON public.match_event_audit(match_id);

ALTER TABLE public.match_event_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "match_event_audit_test_all"
  ON public.match_event_audit;

CREATE POLICY "match_event_audit_test_all"
  ON public.match_event_audit FOR ALL
  USING (true) WITH CHECK (true);


-- 5) PRESENÇA: campos úteis para confirmação
ALTER TABLE public.match_presence
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_match_presence_match_status
  ON public.match_presence(match_id, status);


-- 6) REALTIME
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_items;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_movements;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.match_scorer_tokens;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.match_event_audit;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;


-- 7) ATUALIZAÇÃO AUTOMÁTICA DO updated_at DO ESTOQUE
CREATE OR REPLACE FUNCTION public.set_inventory_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inventory_items_updated_at
  ON public.inventory_items;

CREATE TRIGGER trg_inventory_items_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.set_inventory_updated_at();


-- 8) TESTE DE INTEGRIDADE
SELECT
  'inventory_items' AS tabela,
  COUNT(*) AS registros
FROM public.inventory_items
UNION ALL
SELECT
  'inventory_movements',
  COUNT(*)
FROM public.inventory_movements
UNION ALL
SELECT
  'match_scorer_tokens',
  COUNT(*)
FROM public.match_scorer_tokens
UNION ALL
SELECT
  'match_event_audit',
  COUNT(*)
FROM public.match_event_audit;

-- ============================================================
-- IMPORTANTE:
-- As policies acima são deliberadamente abertas para TESTE.
-- Antes de colocar o sistema em produção, vamos restringi-las
-- por grupo/usuário e validar o token do apontador por RPC.
-- ============================================================
