-- Create daily_check_ins table
CREATE TABLE IF NOT EXISTS public.daily_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  check_in_date DATE NOT NULL,
  mood TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, check_in_date)
);

-- Enable RLS
ALTER TABLE public.daily_check_ins ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own check-ins"
  ON public.daily_check_ins
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check-ins"
  ON public.daily_check_ins
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own check-ins"
  ON public.daily_check_ins
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable realtime for goals table
ALTER TABLE public.goals REPLICA IDENTITY FULL;