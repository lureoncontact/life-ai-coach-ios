import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserStats {
  total_points: number;
  level: number;
  current_streak: number;
  longest_streak: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points_reward: number;
  requirement_type: string;
  requirement_value: number;
}

interface UserAchievement extends Achievement {
  unlocked_at: string;
}

export const useGamification = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGamificationData();
  }, []);

  const loadGamificationData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user stats
      const { data: statsData } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (statsData) {
        setStats(statsData);
      } else {
        // Initialize stats if they don't exist
        const { data: newStats } = await supabase
          .from("user_stats")
          .insert({
            user_id: user.id,
            total_points: 0,
            level: 1,
            current_streak: 0,
            longest_streak: 0,
          })
          .select()
          .single();

        if (newStats) {
          setStats(newStats);
        }
      }

      // Load user achievements
      const { data: userAchievementsData } = await supabase
        .from("user_achievements")
        .select(`
          achievement_id,
          unlocked_at,
          achievements (*)
        `)
        .eq("user_id", user.id);

      if (userAchievementsData) {
        const achievementsList = userAchievementsData.map((ua: any) => ({
          ...ua.achievements,
          unlocked_at: ua.unlocked_at,
        }));
        setAchievements(achievementsList);
      }
    } catch (error) {
      console.error("Error loading gamification data:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = () => {
    loadGamificationData();
  };

  return {
    stats,
    achievements,
    loading,
    refreshStats,
  };
};
