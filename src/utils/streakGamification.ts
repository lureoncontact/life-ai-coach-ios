import { supabase } from "@/integrations/supabase/client";
import { notifyStreakMilestone } from "./notifications";

export const checkAndUpdateStreak = async (userId: string): Promise<{ currentStreak: number; longestStreak: number }> => {
  const { data: stats } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  const today = new Date().toISOString().split('T')[0];
  
  if (!stats) {
    // Create initial stats with streak
    await supabase.from("user_stats").insert({
      user_id: userId,
      total_points: 0,
      level: 1,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today,
    });
    return { currentStreak: 1, longestStreak: 1 };
  }

  let newStreak = stats.current_streak;
  let newLongestStreak = stats.longest_streak;
  
  // Check if user logged in and completed all habits today
  if (stats.last_activity_date) {
    const lastDate = new Date(stats.last_activity_date);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Check if all habits are completed
      const { data: habits } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", userId);
      
      const allCompleted = habits?.every(h => h.completed_today) ?? false;
      
      if (allCompleted) {
        newStreak += 1;
        newLongestStreak = Math.max(newLongestStreak, newStreak);
        
        // Notify on streak milestones
        if (newStreak % 7 === 0) {
          notifyStreakMilestone(newStreak);
        }
      } else {
        newStreak = 0;
      }
    } else if (diffDays > 1) {
      newStreak = 0;
    }
  }

  await supabase
    .from("user_stats")
    .update({
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      last_activity_date: today,
    })
    .eq("user_id", userId);

  return { currentStreak: newStreak, longestStreak: newLongestStreak };
};

export const onDailyLogin = async (userId: string) => {
  return await checkAndUpdateStreak(userId);
};
