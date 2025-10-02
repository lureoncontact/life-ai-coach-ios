import { supabase } from "@/integrations/supabase/client";
import { notifyLevelUp, notifyAchievementUnlocked, notifyStreakMilestone } from "./notifications";

const POINTS_PER_GOAL = 10;
const POINTS_PER_DAILY_GOAL = 15;
const POINTS_PER_FOCUS_ROOM = 20;
const POINTS_PER_CHAT_SESSION = 5;

export const calculateLevel = (totalPoints: number): number => {
  return Math.floor(Math.sqrt(totalPoints / 100)) + 1;
};

export const getPointsForNextLevel = (currentLevel: number): number => {
  return (currentLevel * currentLevel) * 100;
};

export const awardPoints = async (
  userId: string,
  points: number,
  reason: string
): Promise<void> => {
  const { data: stats } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!stats) {
    // Create initial stats
    await supabase.from("user_stats").insert({
      user_id: userId,
      total_points: points,
      level: calculateLevel(points),
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: new Date().toISOString().split('T')[0],
    });
  } else {
    const newTotal = stats.total_points + points;
    const newLevel = calculateLevel(newTotal);
    const oldLevel = stats.level;
    const today = new Date().toISOString().split('T')[0];
    
    let newStreak = stats.current_streak;
    let newLongestStreak = stats.longest_streak;
    
    // Update streak if activity is consecutive
    if (stats.last_activity_date) {
      const lastDate = new Date(stats.last_activity_date);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        newStreak += 1;
        newLongestStreak = Math.max(newLongestStreak, newStreak);
        
        // Notify on streak milestones
        if (newStreak % 7 === 0) {
          notifyStreakMilestone(newStreak);
        }
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    }

    await supabase
      .from("user_stats")
      .update({
        total_points: newTotal,
        level: newLevel,
        current_streak: newStreak,
        longest_streak: newLongestStreak,
        last_activity_date: today,
      })
      .eq("user_id", userId);

    // Notify if level up
    if (newLevel > oldLevel) {
      notifyLevelUp(newLevel);
    }
  }

  console.log(`Awarded ${points} points for ${reason}`);
};

export const checkAndUnlockAchievements = async (userId: string): Promise<any[]> => {
  // Get user stats
  const { data: stats } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!stats) return [];

  // Get user's completed goals count
  const { count: goalsCompleted } = await supabase
    .from("goals")
    .select("*", { count: 'exact', head: true })
    .eq("user_id", userId)
    .eq("is_completed", true);

  // Get user's focus rooms count
  const { count: focusRooms } = await supabase
    .from("focus_rooms")
    .select("*", { count: 'exact', head: true })
    .eq("user_id", userId);

  // Get unique chat sessions (simplified - counting distinct dates)
  const { data: chatDates } = await supabase
    .from("chat_messages")
    .select("created_at")
    .eq("user_id", userId)
    .eq("role", "user");

  const uniqueDates = new Set(
    chatDates?.map(msg => new Date(msg.created_at).toISOString().split('T')[0])
  );
  const chatSessions = uniqueDates.size;

  // Get all achievements
  const { data: allAchievements } = await supabase
    .from("achievements")
    .select("*");

  // Get user's unlocked achievements
  const { data: unlockedAchievements } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  const unlockedIds = new Set(unlockedAchievements?.map(ua => ua.achievement_id) || []);

  const newlyUnlocked: any[] = [];

  // Check each achievement
  for (const achievement of allAchievements || []) {
    if (unlockedIds.has(achievement.id)) continue;

    let shouldUnlock = false;

    switch (achievement.requirement_type) {
      case 'goals_completed':
        shouldUnlock = (goalsCompleted || 0) >= achievement.requirement_value;
        break;
      case 'streak':
        shouldUnlock = stats.current_streak >= achievement.requirement_value;
        break;
      case 'focus_rooms':
        shouldUnlock = (focusRooms || 0) >= achievement.requirement_value;
        break;
      case 'chat_sessions':
        shouldUnlock = chatSessions >= achievement.requirement_value;
        break;
      case 'level':
        shouldUnlock = stats.level >= achievement.requirement_value;
        break;
    }

    if (shouldUnlock) {
      await supabase.from("user_achievements").insert({
        user_id: userId,
        achievement_id: achievement.id,
      });

      // Award points for achievement
      await awardPoints(userId, achievement.points_reward, `Logro: ${achievement.name}`);

      // Notify achievement unlocked
      notifyAchievementUnlocked(achievement.name);

      newlyUnlocked.push(achievement);
    }
  }

  return newlyUnlocked;
};

export const onGoalCompleted = async (userId: string, isDaily: boolean) => {
  const points = isDaily ? POINTS_PER_DAILY_GOAL : POINTS_PER_GOAL;
  await awardPoints(userId, points, isDaily ? "Meta diaria completada" : "Meta completada");
  const newAchievements = await checkAndUnlockAchievements(userId);
  return newAchievements;
};

export const onFocusRoomCreated = async (userId: string) => {
  await awardPoints(userId, POINTS_PER_FOCUS_ROOM, "Focus Room creado");
  const newAchievements = await checkAndUnlockAchievements(userId);
  return newAchievements;
};

export const onChatSession = async (userId: string) => {
  await awardPoints(userId, POINTS_PER_CHAT_SESSION, "Sesión de chat");
  const newAchievements = await checkAndUnlockAchievements(userId);
  return newAchievements;
};
