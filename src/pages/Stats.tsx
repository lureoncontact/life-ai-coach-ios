import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Trophy, Target, TrendingUp, Calendar, Flame } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Stats {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  totalFocusRooms: number;
  completionRate: number;
  dailyGoals: number;
  completedDailyGoals: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  level: number;
}

interface GoalsByCategory {
  category: string;
  count: number;
}

interface WeeklyProgress {
  day: string;
  completed: number;
}

const Stats = () => {
  const [stats, setStats] = useState<Stats>({
    totalGoals: 0,
    completedGoals: 0,
    activeGoals: 0,
    totalFocusRooms: 0,
    completionRate: 0,
    dailyGoals: 0,
    completedDailyGoals: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalPoints: 0,
    level: 1,
  });
  const [goalsByCategory, setGoalsByCategory] = useState<GoalsByCategory[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Load user stats (gamification)
      const { data: userStats } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // Load focus rooms with categories
      const { data: roomsData, error: roomsError } = await supabase
        .from("focus_rooms")
        .select("id, area_category")
        .eq("user_id", user.id);

      if (roomsError) throw roomsError;

      // Load goals stats
      const { data: goalsData, error: goalsError } = await supabase
        .from("goals")
        .select("is_completed, is_daily, focus_room_id, completed_at")
        .eq("user_id", user.id);

      if (goalsError) throw goalsError;

      const totalGoals = goalsData?.length || 0;
      const completedGoals = goalsData?.filter((g) => g.is_completed).length || 0;
      const activeGoals = totalGoals - completedGoals;
      const dailyGoals = goalsData?.filter((g) => g.is_daily).length || 0;
      const completedDailyGoals = goalsData?.filter((g) => g.is_daily && g.is_completed).length || 0;
      const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

      // Calculate goals by category
      const categoryCount: Record<string, number> = {};
      goalsData?.forEach((goal) => {
        const room = roomsData?.find((r) => r.id === goal.focus_room_id);
        if (room) {
          categoryCount[room.area_category] = (categoryCount[room.area_category] || 0) + 1;
        }
      });

      const categoryData = Object.entries(categoryCount).map(([category, count]) => ({
        category: category === "health" ? "Salud" :
                 category === "career" ? "Carrera" :
                 category === "relationships" ? "Relaciones" :
                 category === "finance" ? "Finanzas" :
                 category === "personal" ? "Personal" :
                 category === "mental" ? "Mental" : category,
        count,
      }));

      setGoalsByCategory(categoryData);

      // Calculate weekly progress (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date;
      });

      const weeklyData = last7Days.map((date) => {
        const dayName = date.toLocaleDateString("es", { weekday: "short" });
        const completed = goalsData?.filter((goal) => {
          if (!goal.completed_at) return false;
          const completedDate = new Date(goal.completed_at);
          return completedDate.toDateString() === date.toDateString();
        }).length || 0;

        return {
          day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          completed,
        };
      });

      setWeeklyProgress(weeklyData);

      setStats({
        totalGoals,
        completedGoals,
        activeGoals,
        totalFocusRooms: roomsData?.length || 0,
        completionRate,
        dailyGoals,
        completedDailyGoals,
        currentStreak: userStats?.current_streak || 0,
        longestStreak: userStats?.longest_streak || 0,
        totalPoints: userStats?.total_points || 0,
        level: userStats?.level || 1,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Cargando estadísticas...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Estadísticas</h1>
            <p className="text-xs text-muted-foreground">Tu progreso en Nudge</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="animate-nudge-slide-up">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Metas
                </CardTitle>
                <Target className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalGoals}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.activeGoals} activas
              </p>
            </CardContent>
          </Card>

          <Card className="animate-nudge-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completadas
                </CardTitle>
                <Trophy className="w-4 h-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{stats.completedGoals}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.completionRate}% de tasa
              </p>
            </CardContent>
          </Card>

          <Card className="animate-nudge-slide-up" style={{ animationDelay: "0.2s" }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Racha Actual
                </CardTitle>
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">{stats.currentStreak}</div>
              <p className="text-xs text-muted-foreground mt-1">
                días consecutivos
              </p>
            </CardContent>
          </Card>

          <Card className="animate-nudge-slide-up" style={{ animationDelay: "0.3s" }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Focus Rooms
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalFocusRooms}</div>
              <p className="text-xs text-muted-foreground mt-1">
                áreas de enfoque
              </p>
            </CardContent>
          </Card>

          <Card className="animate-nudge-slide-up" style={{ animationDelay: "0.4s" }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Nivel
                </CardTitle>
                <Trophy className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.level}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalPoints} pts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Weekly Progress Chart */}
          <Card className="animate-nudge-slide-up">
            <CardHeader>
              <CardTitle>Progreso Semanal</CardTitle>
              <CardDescription>
                Metas completadas en los últimos 7 días
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyProgress}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Goals by Category Chart */}
          <Card className="animate-nudge-slide-up">
            <CardHeader>
              <CardTitle>Metas por Categoría</CardTitle>
              <CardDescription>
                Distribución de tus metas por área
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={goalsByCategory}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {goalsByCategory.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={[
                          'hsl(var(--primary))',
                          'hsl(var(--success))',
                          'hsl(var(--accent))',
                          'hsl(var(--warning))',
                          'hsl(var(--secondary))',
                          'hsl(var(--destructive))'
                        ][index % 6]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Completion Rate Card */}
        <Card className="animate-nudge-slide-up">
          <CardHeader>
            <CardTitle>Tasa de Completado General</CardTitle>
            <CardDescription>
              Porcentaje de metas completadas del total
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progreso</span>
                <span className="text-sm font-bold text-primary">{stats.completionRate}%</span>
              </div>
              <Progress value={stats.completionRate} className="h-3" />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-success">{stats.completedGoals}</div>
                <div className="text-xs text-muted-foreground">Completadas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{stats.activeGoals}</div>
                <div className="text-xs text-muted-foreground">En Progreso</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-500">{stats.longestStreak}</div>
                <div className="text-xs text-muted-foreground">Mejor Racha</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Motivational Message */}
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 animate-nudge-slide-up">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-3">🚀</div>
            <h3 className="text-xl font-bold mb-2">
              {stats.completionRate >= 80
                ? "¡Excelente trabajo!"
                : stats.completionRate >= 50
                ? "¡Vas por buen camino!"
                : "¡Sigue adelante!"}
            </h3>
            <p className="text-muted-foreground">
              {stats.completionRate >= 80
                ? "Estás alcanzando tus metas consistentemente. ¡Increíble progreso!"
                : stats.completionRate >= 50
                ? "Has completado más de la mitad de tus metas. ¡Continúa así!"
                : "Cada pequeño paso cuenta. ¡No te rindas!"}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Stats;
