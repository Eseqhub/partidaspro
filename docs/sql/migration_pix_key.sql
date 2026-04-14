-- ==========================================
-- MIGRATION: ADICIONAR CHAVE PIX AO GRUPO
-- ==========================================

ALTER TABLE groups ADD COLUMN IF NOT EXISTS pix_key TEXT;

COMMENT ON COLUMN groups.pix_key IS 'Chave Pix oficial do clube para automação de recebimentos.';
