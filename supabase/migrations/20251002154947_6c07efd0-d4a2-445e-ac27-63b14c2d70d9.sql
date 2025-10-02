-- Add column to track if user has received all habits completion bonus today
ALTER TABLE user_stats 
ADD COLUMN IF NOT EXISTS last_all_habits_bonus_date DATE;

-- Add comment to document the purpose
COMMENT ON COLUMN user_stats.last_all_habits_bonus_date IS 'Tracks the last date when user received bonus points for completing all daily habits';