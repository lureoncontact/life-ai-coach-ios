-- Tabla para sesiones de meditación (Salud Mental)
CREATE TABLE public.meditation_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  focus_room_id UUID NOT NULL REFERENCES public.focus_rooms(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.meditation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meditation sessions"
  ON public.meditation_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meditation sessions"
  ON public.meditation_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meditation sessions"
  ON public.meditation_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meditation sessions"
  ON public.meditation_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Tabla para registro de ahorros (Finanzas)
CREATE TABLE public.savings_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  focus_room_id UUID NOT NULL REFERENCES public.focus_rooms(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.savings_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own savings records"
  ON public.savings_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own savings records"
  ON public.savings_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings records"
  ON public.savings_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings records"
  ON public.savings_records FOR DELETE
  USING (auth.uid() = user_id);

-- Tabla para registro de ejercicios (Salud y Fitness)
CREATE TABLE public.workout_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  focus_room_id UUID NOT NULL REFERENCES public.focus_rooms(id) ON DELETE CASCADE,
  exercise_type TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  calories INTEGER,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout logs"
  ON public.workout_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout logs"
  ON public.workout_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout logs"
  ON public.workout_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout logs"
  ON public.workout_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Tabla para progreso de habilidades (Carrera Profesional)
CREATE TABLE public.skill_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  focus_room_id UUID NOT NULL REFERENCES public.focus_rooms(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  hours_invested DECIMAL(5, 1) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.skill_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own skill progress"
  ON public.skill_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skill progress"
  ON public.skill_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skill progress"
  ON public.skill_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own skill progress"
  ON public.skill_progress FOR DELETE
  USING (auth.uid() = user_id);

-- Tabla para registro de interacciones (Relaciones)
CREATE TABLE public.relationship_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  focus_room_id UUID NOT NULL REFERENCES public.focus_rooms(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  interaction_type TEXT NOT NULL,
  quality_rating INTEGER NOT NULL DEFAULT 5,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.relationship_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own relationship logs"
  ON public.relationship_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own relationship logs"
  ON public.relationship_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own relationship logs"
  ON public.relationship_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own relationship logs"
  ON public.relationship_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Tabla para libros leídos (Desarrollo Personal)
CREATE TABLE public.books_read (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  focus_room_id UUID NOT NULL REFERENCES public.focus_rooms(id) ON DELETE CASCADE,
  book_title TEXT NOT NULL,
  author TEXT,
  pages_read INTEGER NOT NULL DEFAULT 0,
  total_pages INTEGER,
  status TEXT NOT NULL DEFAULT 'reading',
  rating INTEGER,
  notes TEXT,
  completed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.books_read ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own books"
  ON public.books_read FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own books"
  ON public.books_read FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own books"
  ON public.books_read FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own books"
  ON public.books_read FOR DELETE
  USING (auth.uid() = user_id);

-- Triggers para actualizar updated_at
CREATE TRIGGER update_skill_progress_updated_at
  BEFORE UPDATE ON public.skill_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_books_read_updated_at
  BEFORE UPDATE ON public.books_read
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();