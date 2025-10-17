import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Circle, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { onAllHabitsCompleted } from "@/utils/gamification";

interface Habit {
  id: string;
  title: string;
  streak: number;
  completed_today: boolean;
}

interface HabitsTrackerProps {
  onStatsUpdate?: () => void;
}

const HabitsTracker = ({ onStatsUpdate }: HabitsTrackerProps) => {
  const { t } = useTranslation();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setHabits(data || []);
    } catch (error: any) {
      console.error('Error loading habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleHabit = async (habitId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;

      const newCompletedStatus = !habit.completed_today;
      const newStreak = newCompletedStatus ? habit.streak + 1 : Math.max(0, habit.streak - 1);

      const { error } = await supabase
        .from("habits")
        .update({
          completed_today: newCompletedStatus,
          streak: newStreak,
          last_completed_at: newCompletedStatus ? new Date().toISOString() : null,
        })
        .eq("id", habitId);

      if (error) throw error;

      const updatedHabits = habits.map((h) =>
        h.id === habitId
          ? { ...h, completed_today: newCompletedStatus, streak: newStreak }
          : h
      );

      setHabits(updatedHabits);

      // Check if all habits are completed
      const allCompleted = updatedHabits.every(h => h.completed_today);
      
      if (newCompletedStatus) {
        if (allCompleted) {
          // Award points for completing all habits (only once per day)
          const achievements = await onAllHabitsCompleted(user.id);
          
          // Only show success message if points were actually awarded
          if (achievements !== null) {
            toast({
              title: t('habits.allCompleted'),
              description: t('habits.allCompletedDescription'),
            });
            onStatsUpdate?.();
          }
        } else {
          toast({
            title: t('habits.habitCompleted'),
            description: t('habits.streakDays', { count: newStreak, plural: newStreak !== 1 ? 's' : '' }),
          });
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (habits.length === 0) {
    return (
      <Card className="hover-lift animate-fade-in">
        <CardHeader>
          <CardTitle className="text-lg">{t('habits.title')}</CardTitle>
          <CardDescription>
            {t('habits.noHabits')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full btn-interactive hover:scale-105" onClick={() => {}}>
            {t('habits.addHabit')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const completedToday = habits.filter((h) => h.completed_today).length;
  const progress = (completedToday / habits.length) * 100;

  return (
    <Card className="hover-lift animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          {t('habits.title')}
          <span className="text-sm font-normal text-muted-foreground">
            {completedToday}/{habits.length}
          </span>
        </CardTitle>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-2">
        {habits.map((habit, index) => (
          <div
            key={habit.id}
            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-all cursor-pointer hover-lift stagger-item btn-interactive"
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => toggleHabit(habit.id)}
          >
            <div className="flex items-center gap-3">
              {habit.completed_today ? (
                <CheckCircle2 className="w-5 h-5 text-success animate-scale-in" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground transition-transform hover:scale-110" />
              )}
              <span className={habit.completed_today ? "line-through text-muted-foreground" : ""}>
                {habit.title}
              </span>
            </div>
            {habit.streak > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <Flame className="w-4 h-4 text-orange-500 animate-bounce-subtle" />
                <span className="font-semibold">{habit.streak}</span>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default HabitsTracker;