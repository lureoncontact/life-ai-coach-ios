import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Trophy, TrendingUp, Calendar, Flame, Sparkles } from "lucide-react";
import nudgeIcon from "@/assets/nudge_icon.png";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import LoadingSpinner from "@/components/LoadingSpinner";

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
  const { t } = useTranslation();
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
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [analyzingHabits, setAnalyzingHabits] = useState(false);
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
        category: t(`stats.category${category.charAt(0).toUpperCase()}${category.slice(1)}`),
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

  const analyzeHabits = async () => {
    setAnalyzingHabits(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get habits
      const { data: habits } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id);

      // Get user stats
      const { data: userStats } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user.id)
        .single();

      const { data: analysisData, error } = await supabase.functions.invoke('habits-analysis', {
        body: { habits, stats: userStats || stats }
      });

      if (error) throw error;

      setAiAnalysis(analysisData.analysis);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setAnalyzingHabits(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <LoadingSpinner size="lg" text={t('stats.loading')} />
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
            <h1 className="text-lg font-bold">{t('stats.title')}</h1>
            <p className="text-xs text-muted-foreground">{t('stats.subtitle')}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          <Card className="hover-lift stagger-item">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('stats.totalGoals')}
                </CardTitle>
                <img src={nudgeIcon} alt="Nudge" className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold">{stats.totalGoals}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.activeGoals} {t('stats.active')}
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift stagger-item" style={{ animationDelay: "0.05s" }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('stats.completed')}
                </CardTitle>
                <Trophy className="w-4 h-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-success">{stats.completedGoals}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.completionRate}% {t('stats.completionRate')}
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift stagger-item" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('stats.currentStreak')}
                </CardTitle>
                <Flame className="w-4 h-4 text-orange-500 animate-bounce-subtle" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-orange-500">{stats.currentStreak}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('stats.consecutiveDays')}
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift stagger-item" style={{ animationDelay: "0.15s" }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('stats.focusRooms')}
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold">{stats.totalFocusRooms}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('stats.focusAreas')}
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift stagger-item" style={{ animationDelay: "0.2s" }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('stats.level')}
                </CardTitle>
                <Trophy className="w-4 h-4 text-primary animate-pulse" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-primary">{stats.level}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalPoints} {t('stats.points')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {/* Weekly Progress Chart */}
          <Card className="hover-glow stagger-item" style={{ animationDelay: "0.25s" }}>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">{t('stats.weeklyProgress')}</CardTitle>
              <CardDescription>
                {t('stats.weeklyProgressDescription')}
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
          <Card className="hover-glow stagger-item" style={{ animationDelay: "0.3s" }}>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">{t('stats.goalsByCategory')}</CardTitle>
              <CardDescription>
                {t('stats.goalsByCategoryDescription')}
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
                    label={(entry) => entry.category}
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
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Completion Rate Card */}
        <Card className="hover-lift stagger-item" style={{ animationDelay: "0.35s" }}>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">{t('stats.overallCompletionRate')}</CardTitle>
            <CardDescription>
              {t('stats.overallCompletionRateDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{t('stats.progress')}</span>
                <span className="text-sm font-bold text-primary">{stats.completionRate}%</span>
              </div>
              <Progress value={stats.completionRate} className="h-3 transition-all duration-500" />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="hover-lift">
                <div className="text-xl md:text-2xl font-bold text-success">{stats.completedGoals}</div>
                <div className="text-xs text-muted-foreground">{t('stats.completedGoals')}</div>
              </div>
              <div className="hover-lift">
                <div className="text-xl md:text-2xl font-bold text-primary">{stats.activeGoals}</div>
                <div className="text-xs text-muted-foreground">{t('stats.inProgress')}</div>
              </div>
              <div className="hover-lift">
                <div className="text-xl md:text-2xl font-bold text-orange-500">{stats.longestStreak}</div>
                <div className="text-xs text-muted-foreground">{t('stats.bestStreak')}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Analysis of Habits */}
        <Card className="hover-lift stagger-item" style={{ animationDelay: "0.4s" }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {t('stats.habitsAnalysisAI')}
              </CardTitle>
              <Button
                size="sm"
                onClick={analyzeHabits}
                disabled={analyzingHabits}
                className="btn-interactive"
              >
                {analyzingHabits ? t('stats.analyzing') : t('stats.analyze')}
              </Button>
            </div>
            <CardDescription>
              {t('stats.habitsAnalysisDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {aiAnalysis ? (
              <Textarea
                value={aiAnalysis}
                readOnly
                className="min-h-[150px] bg-muted/50"
              />
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t('stats.analyzePrompt')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Stats;
