ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS nome text,
ADD COLUMN IF NOT EXISTS idade integer,
ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

ALTER TABLE public.praises
ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_team_members_is_demo ON public.team_members(is_demo);
CREATE INDEX IF NOT EXISTS idx_praises_is_demo ON public.praises(is_demo);