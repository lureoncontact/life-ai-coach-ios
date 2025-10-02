import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Plus, Settings, BarChart3, Trophy } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";
import GamificationBadge from "@/components/GamificationBadge";
import AchievementsModal from "@/components/AchievementsModal";
import CreateFocusRoomModal from "@/components/CreateFocusRoomModal";

interface Profile {
  full_name: string;
}

interface FocusRoom {
  id: string;
  name: string;
  area_category: string;
  description: string | null;
}

interface Goal {
  id: string;
  title: string;
  is_completed: boolean;
  is_daily: boolean;
}

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [focusRooms, setFocusRooms] = useState<FocusRoom[]>([]);
  const [todaysGoals, setTodaysGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { stats, achievements, refreshStats } = useGamification();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      // Load focus rooms
      const { data: roomsData } = await supabase
        .from("focus_rooms")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      setFocusRooms(roomsData || []);

      // Load today's goals
      const { data: goalsData } = await supabase
        .from("goals")
        .select("id, title, is_completed, is_daily")
        .eq("user_id", user.id)
        .eq("is_daily", true)
        .order("created_at", { ascending: true });

      setTodaysGoals(goalsData || []);
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getAreaIcon = (category: string) => {
    const icons: Record<string, string> = {
      health: "💪",
      career: "💼",
      relationships: "❤️",
      finance: "💰",
      personal: "🌱",
      mental: "🧠",
    };
    return icons[category] || "🎯";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-xl">🎯</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Nudge</h1>
              <p className="text-xs text-muted-foreground">
                Hola, {profile?.full_name || "Usuario"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {stats && (
              <Button variant="ghost" size="icon" onClick={() => setShowAchievements(true)}>
                <Trophy className="w-5 h-5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => navigate("/stats")}>
              <BarChart3 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Gamification Badge */}
        {stats && (
          <div className="animate-nudge-slide-up">
            <GamificationBadge
              totalPoints={stats.total_points}
              level={stats.level}
              currentStreak={stats.current_streak}
            />
          </div>
        )}

        {/* Main Chat Button */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 animate-nudge-slide-up">
          <CardContent className="p-6">
            <Button
              size="lg"
              className="w-full h-20 text-lg"
              onClick={() => navigate("/chat")}
            >
              <MessageCircle className="w-6 h-6 mr-2" />
              Hablar con Nudge
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-3">
              Tu coach personal está listo para ayudarte
            </p>
          </CardContent>
        </Card>

        {/* Today's Goals */}
        {todaysGoals.length > 0 && (
          <div className="space-y-4 animate-nudge-slide-up">
            <h2 className="text-2xl font-bold">Metas de Hoy</h2>
            <div className="grid gap-3">
              {todaysGoals.map((goal) => (
                <Card key={goal.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <span className={goal.is_completed ? "line-through text-muted-foreground" : ""}>
                      {goal.title}
                    </span>
                    <Button
                      size="sm"
                      variant={goal.is_completed ? "secondary" : "default"}
                    >
                      {goal.is_completed ? "✓" : "Marcar"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Focus Rooms */}
        <div className="space-y-4 animate-nudge-slide-up">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Focus Rooms</h2>
            <Button size="sm" variant="outline" onClick={() => setShowCreateRoom(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Sala
            </Button>
          </div>
          
          {focusRooms.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  No tienes Focus Rooms aún
                </p>
                <Button onClick={() => navigate("/onboarding")}>
                  Crear tu primera sala
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {focusRooms.map((room) => (
                <Card
                  key={room.id}
                  className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
                  onClick={() => navigate(`/focus-room/${room.id}`)}
                >
                  <CardHeader>
                    <div className="text-4xl mb-2">
                      {getAreaIcon(room.area_category)}
                    </div>
                    <CardTitle className="text-lg">{room.name}</CardTitle>
                    {room.description && (
                      <CardDescription className="text-sm">
                        {room.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Achievements Modal */}
      <AchievementsModal
        open={showAchievements}
        onOpenChange={setShowAchievements}
        userAchievements={achievements}
      />

      {/* Create Focus Room Modal */}
      <CreateFocusRoomModal
        open={showCreateRoom}
        onOpenChange={setShowCreateRoom}
        onRoomCreated={() => {
          loadDashboardData();
          refreshStats();
        }}
      />
    </div>
  );
};

export default Dashboard;
