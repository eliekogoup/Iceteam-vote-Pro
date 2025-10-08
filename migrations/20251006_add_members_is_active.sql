-- Migration: add is_active to members (emergency fix kept for history)
-- Created to mirror the quick fix that was applied in the DB
-- Date: 2025-10-06

BEGIN;

ALTER TABLE IF EXISTS public.members
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

UPDATE public.members
  SET is_active = true
  WHERE is_active IS NULL;

COMMENT ON COLUMN public.members.is_active IS 'Indique si le membre est actif (peut voter)';

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'members';

COMMIT;
