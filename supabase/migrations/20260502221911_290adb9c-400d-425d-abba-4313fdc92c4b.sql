
ALTER TYPE checklist_period ADD VALUE IF NOT EXISTS 'visita_supervisor';
ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;
