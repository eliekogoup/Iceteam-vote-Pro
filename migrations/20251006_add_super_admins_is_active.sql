-- Migration: add is_active to super_admins
-- Created by automated fix to resolve RLS error referencing is_active
-- Date: 2025-10-06

BEGIN;

ALTER TABLE IF EXISTS public.super_admins
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

UPDATE public.super_admins
  SET is_active = true
  WHERE is_active IS NULL;

COMMENT ON COLUMN public.super_admins.is_active IS 'Indique si le super-admin est actif (peut agir)';

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'super_admins';

COMMIT;
