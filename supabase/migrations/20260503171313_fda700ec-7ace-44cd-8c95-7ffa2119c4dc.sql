ALTER TABLE public.daily_huddle_reports
  ADD COLUMN IF NOT EXISTS suggested_agenda jsonb,
  ADD COLUMN IF NOT EXISTS final_agenda text,
  ADD COLUMN IF NOT EXISTS agenda_used boolean NOT NULL DEFAULT false;