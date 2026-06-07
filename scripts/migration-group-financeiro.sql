-- Migration: campos financeiros no grupo
-- Rodar no Supabase SQL Editor

ALTER TABLE groups ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC(10,2);
ALTER TABLE groups ADD COLUMN IF NOT EXISTS pix_key     TEXT;
