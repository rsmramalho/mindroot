-- 004_backfill_ritual_recurrence.sql
-- Sets recurrence='daily' on all existing ritual items that don't have recurrence set.
-- Safe to re-run: only updates items where recurrence IS NULL.
--
-- COMO APLICAR:
-- 1. Abrir Supabase Dashboard → SQL Editor
-- 2. Colar e rodar este SQL

UPDATE public.items
SET recurrence = 'daily', updated_at = now()
WHERE type = 'ritual'
  AND recurrence IS NULL;
