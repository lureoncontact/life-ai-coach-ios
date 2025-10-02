-- Fix search_path for create_default_habits function
DROP TRIGGER IF EXISTS create_user_default_habits ON public.profiles;
DROP FUNCTION IF EXISTS public.create_default_habits() CASCADE;

CREATE OR REPLACE FUNCTION public.create_default_habits()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.habits (user_id, title, description) VALUES
    (NEW.id, 'Ejercicio matutino', '15-30 minutos de actividad física'),
    (NEW.id, 'Meditación', '10 minutos de mindfulness'),
    (NEW.id, 'Lectura', 'Leer 20 páginas de un libro'),
    (NEW.id, 'Hidratación', 'Beber 8 vasos de agua');
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER create_user_default_habits
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_habits();