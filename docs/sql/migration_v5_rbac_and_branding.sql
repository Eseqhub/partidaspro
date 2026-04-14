-- Migration V5: RBAC & Branding
-- Adiciona suporte a descrição, ano de fundação e sistema de editores

ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS founded_year INTEGER;

-- Tabela de Funções/Cargos no Grupo
CREATE TABLE IF NOT EXISTS public.group_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL, -- Usaremos e-mail para convite fácil
  role TEXT NOT NULL DEFAULT 'editor', -- 'admin', 'editor', 'viewer'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_email)
);

-- Ativar RLS na nova tabela
ALTER TABLE public.group_roles ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para group_roles
DROP POLICY IF EXISTS "Dono do grupo gerencia roles" ON public.group_roles;
CREATE POLICY "Dono do grupo gerencia roles" ON public.group_roles 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM groups WHERE groups.id = group_id AND groups.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuário vê suas próprias roles" ON public.group_roles;
CREATE POLICY "Usuário vê suas próprias roles" ON public.group_roles 
  FOR SELECT USING (user_email = auth.jwt()->>'email');

-- Comentários
COMMENT ON COLUMN groups.description IS 'Descrição ou Biografia do Clube';
COMMENT ON COLUMN groups.founded_year IS 'Ano de fundação do clube';
COMMENT ON TABLE group_roles IS 'Armazena permissões de editores e administradores auxiliares';
