-- INCOME SNAPSHOTS (history log every time user saves income)
CREATE TABLE public.income_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_type TEXT,
  ctc NUMERIC DEFAULT 0,
  in_hand NUMERIC DEFAULT 0,
  note TEXT,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.income_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own snapshots all" ON public.income_snapshots
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
