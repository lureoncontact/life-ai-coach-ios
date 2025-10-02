import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Circle, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Habit {
  id: string;
  title: string;
  streak: number;
  completed_today: boolean;
}

const HabitsTracker = () => {
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

      setHabits(habits.map((h) =>
        h.id === habitId
          ? { ...h, completed_today: newCompletedStatus, streak: newStreak }
          : h
      ));

      if (newCompletedStatus) {
        toast({
          title: "¡Hábito completado!",
          description: `Racha de ${newStreak} día${newStreak !== 1 ? 's' : ''}`,
        });
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
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (habits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hábitos Diarios</CardTitle>
          <CardDescription>
            No tienes hábitos configurados aún
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={() => {}}>
            Agregar Hábito
          </Button>
        </CardContent>
      </Card>
    );
  }

  const completedToday = habits.filter((h) => h.completed_today).length;
  const progress = (completedToday / habits.length) * 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          Hábitos Diarios
          <span className="text-sm font-normal text-muted-foreground">
            {completedToday}/{habits.length}
          </span>
        </CardTitle>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-2">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => toggleHabit(habit.id)}
          >
            <div className="flex items-center gap-3">
              {habit.completed_today ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground" />
              )}
              <span className={habit.completed_today ? "line-through text-muted-foreground" : ""}>
                {habit.title}
              </span>
            </div>
            {habit.streak > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <Flame className="w-4 h-4 text-orange-500" />
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