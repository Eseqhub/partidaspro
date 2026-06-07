-- Migration: auto_approve_members em groups
-- Controla se novos membros entram automaticamente ou precisam de aprovação
-- Rodar no Supabase SQL Editor

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS auto_approve_members boolean DEFAULT false;
