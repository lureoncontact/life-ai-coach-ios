-- Create user_stats table for tracking points and level
CREATE TABLE public.user_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  points_reward INTEGER NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements table (many-to-many)
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_stats
CREATE POLICY "Users can view own stats" 
ON public.user_stats 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats" 
ON public.user_stats 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats" 
ON public.user_stats 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for achievements (everyone can read)
CREATE POLICY "Achievements are viewable by everyone" 
ON public.achievements 
FOR SELECT 
USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements" 
ON public.user_achievements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" 
ON public.user_achievements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_stats_updated_at
BEFORE UPDATE ON public.user_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial achievements
INSERT INTO public.achievements (name, description, icon, points_reward, requirement_type, requirement_value) VALUES
('Primer Paso', 'Completa tu primera meta', '🎯', 10, 'goals_completed', 1),
('Imparable', 'Completa 5 metas', '🔥', 50, 'goals_completed', 5),
('Maestro', 'Completa 25 metas', '👑', 250, 'goals_completed', 25),
('Racha de 3', 'Mantén una racha de 3 días', '⚡', 30, 'streak', 3),
('Racha de 7', 'Mantén una racha de 7 días', '💪', 70, 'streak', 7),
('Racha de 30', 'Mantén una racha de 30 días', '🏆', 300, 'streak', 30),
('Explorador', 'Crea 3 Focus Rooms', '🗺️', 50, 'focus_rooms', 3),
('Conversador', 'Ten 10 conversaciones con los bots', '💬', 100, 'chat_sessions', 10),
('Nivel 5', 'Alcanza el nivel 5', '⭐', 100, 'level', 5),
('Nivel 10', 'Alcanza el nivel 10', '🌟', 250, 'level', 10);
